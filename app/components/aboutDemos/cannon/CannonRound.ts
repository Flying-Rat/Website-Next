import {
  type CannonPalette,
  drawBarrel,
  drawCarriage,
  drawRat,
  GROUND,
  MUZZLE,
} from './cannonArtwork';

type Point = { x: number; y: number };
type Body = Point & { vx: number; vy: number };
type Target = Point & {
  halfWidth: number;
  halfHeight: number;
  floor: number;
  element: HTMLElement;
};
type Knocked = Body & { age: number; angle: number; spin: number; target: Target };
type Note = Point & { text: string; ink: string; age: number };

const IDLE_FRAME_MS = 1000 / 30;
const SWAY = 0.27;
const CHARGE_MS = 1100;
const KNOCK_GRAVITY = 900;
const KNOCK_FADE_AT = 1.42;
const KNOCK_ENDS_AT = 1.65;
const NOTE_SECONDS = 1.2;
/** How far ahead of its centre the rat's nose is, in the cannon's units. */
const NOSE = 16;

export class CannonRound {
  private frame = 0;
  private clearField = true;
  private recoil = 0;
  private active = false;
  private lastFrame = 0;
  private time = 0;
  private held: number | null = null;
  private shot: Body | null = null;
  private knocked: Knocked | null = null;
  private note: Note | null = null;
  private targets: Target[] = [];
  private origin = { x: 0, y: 0 };
  private ground = { left: 0, right: 0, y: 0 };
  private scale = 1;
  private angle = 0;
  private aim = 0;
  private speed = 0;
  private gravity = 0;
  private readonly fieldWidth: number;
  private readonly fieldHeight: number;
  private palette!: CannonPalette;
  private hitInk = '';
  private missInk = '';
  private noteFont = '';

  constructor(
    private ctx: CanvasRenderingContext2D,
    private stage: HTMLElement,
    private copy: HTMLElement,
    private animate: boolean,
    private missLabel: string,
    private result: (points: number) => void,
  ) {
    this.readTokens();
    const { width, height } = ctx.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio, 2);
    ctx.canvas.width = Math.round(width * ratio);
    ctx.canvas.height = Math.round(height * ratio);
    ctx.setTransform(ctx.canvas.width / width, 0, 0, ctx.canvas.height / height, 0, 0);
    this.fieldWidth = width;
    this.fieldHeight = height;
  }

  private readTokens() {
    const css = getComputedStyle(document.documentElement);
    const token = (name: string) => css.getPropertyValue(name).trim();
    this.palette = {
      ink: token('--color-text'),
      paper: token('--color-bg'),
      accent: token('--color-accent'),
    };
    this.hitInk = token('--color-accent-text');
    this.missInk = token('--color-text-muted');
    this.noteFont = `600 13px ${token('--font-mono') || 'monospace'}`;
  }

  /** Picks up the theme's colours again; call it once the theme has changed. */
  restyle() {
    this.readTokens();
    this.clearField = true;
    if (this.active) {
      this.draw();
    }
  }

  get busy() {
    return Boolean(this.shot) || Boolean(this.knocked);
  }

  setActive(active: boolean) {
    cancelAnimationFrame(this.frame);
    this.active = active;
    this.held = null;
    this.shot = null;
    this.note = null;
    this.restoreTarget();
    this.ctx.clearRect(0, 0, this.fieldWidth, this.fieldHeight);
    if (active) {
      this.measure();
      this.angle = this.aim;
      this.lastFrame = performance.now();
      this.draw();
      if (this.animate) {
        this.frame = requestAnimationFrame(this.tick);
      }
    }
  }

  private measure() {
    this.clearField = true;
    const field = this.ctx.canvas.getBoundingClientRect();
    const stage = this.stage.getBoundingClientRect();
    this.scale = Math.min(stage.width / 215, stage.height / 110);
    this.ground = {
      left: stage.left - field.left,
      right: stage.right - field.left,
      y: stage.bottom - field.top,
    };
    this.origin = {
      x: this.ground.right - 56 * this.scale,
      y: this.ground.y - GROUND * this.scale,
    };

    // A knocked piece lands on the first rule below it, or on the end of the copy.
    const floors = [
      ...Array.from(
        this.copy.querySelectorAll('[data-rule]'),
        (shelf) => shelf.getBoundingClientRect().top,
      ),
      this.copy.getBoundingClientRect().bottom,
    ].map((y) => y - field.top);
    let left = Infinity,
      right = -Infinity,
      top = Infinity,
      bottom = -Infinity;
    this.targets = Array.from(
      this.copy.querySelectorAll<HTMLElement>('[data-target]'),
      (element) => {
        const rect = element.getBoundingClientRect();
        left = Math.min(left, rect.left);
        right = Math.max(right, rect.right);
        top = Math.min(top, rect.top);
        bottom = Math.max(bottom, rect.bottom);
        const base = rect.bottom - field.top;
        return {
          element,
          x: rect.left - field.left + rect.width / 2,
          y: rect.top - field.top + rect.height * 0.52,
          halfWidth: rect.width / 2,
          // The line box is taller than the glyphs, and the gaps between lines
          // are what let a shot drop through to the copy underneath.
          halfHeight: rect.height * 0.38,
          floor: Math.min(...floors.filter((y) => y >= base - 2), this.fieldHeight),
        };
      },
    );
    if (!this.targets.length) {
      return;
    }
    // A half charge at the resting angle lands a little left of the copy's centre.
    const dx = Math.max(25, this.origin.x - (left + 0.4 * (right - left) - field.left));
    const dy = (top + bottom) / 2 - field.top - this.origin.y;
    const rise = Math.max(55, dx * 0.45, 65 - dy);
    this.aim = Math.atan2(rise, dx);
    this.speed = Math.max(40, Math.hypot(dx, rise) - MUZZLE * this.scale);
    this.gravity = 2 * (dy + rise);
  }

  press() {
    if (!this.active || this.busy || this.held !== null) {
      return;
    }
    // Font swaps and the section entrance can move the targets after mount.
    this.measure();
    if (!this.animate) {
      this.angle = this.aim;
    }
    this.held = performance.now();
  }

  cancel() {
    this.held = null;
  }

  release(charge = this.charge()) {
    if (!this.active || this.held === null || this.busy) {
      return;
    }
    this.held = null;
    this.recoil = this.animate ? 1 : 0;
    const speed = this.speed * (0.55 + 0.9 * charge);
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    this.shot = {
      x: this.origin.x - MUZZLE * this.scale * cos,
      y: this.origin.y - MUZZLE * this.scale * sin,
      vx: -speed * cos,
      vy: -speed * sin,
    };
    if (!this.animate) {
      // Resolve the same trajectory without displaying motion.
      while (this.shot) {
        this.advance(1 / 120);
      }
      this.draw();
    }
  }

  private charge() {
    return this.held === null ? 0 : Math.min(1, (performance.now() - this.held) / CHARGE_MS);
  }

  private tick = (now: number) => {
    if (!this.active) {
      return;
    }
    const elapsed = now - this.lastFrame;
    const playing = this.held !== null || this.busy || this.recoil > 0 || Boolean(this.note);
    if (playing || elapsed >= IDLE_FRAME_MS - 1) {
      const dt = Math.min(0.05, elapsed / 1000);
      this.lastFrame = now;
      this.time += dt;
      this.recoil = Math.max(0, this.recoil - dt * 5);
      if (this.held === null && !this.shot) {
        this.angle = this.aim + SWAY * Math.sin(this.time * 1.65);
      }
      if (this.shot) {
        for (let i = 0; i < 4 && this.shot; i++) {
          this.advance(dt / 4);
        }
      }
      if (this.knocked) {
        this.stepKnocked(dt);
      }
      if (this.note && (this.note.age += dt) >= NOTE_SECONDS) {
        this.note = null;
      }
      this.draw();
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private advance(dt: number) {
    const shot = this.shot;
    if (!shot) {
      return;
    }
    shot.x += shot.vx * dt;
    shot.y += (shot.vy + this.gravity * dt * 0.5) * dt;
    shot.vy += this.gravity * dt;
    // The rat is long enough that it has to connect nose first.
    const reach = (NOSE * this.scale) / Math.hypot(shot.vx, shot.vy);
    const x = shot.x + shot.vx * reach;
    const y = shot.y + shot.vy * reach;
    const hit = this.targets.find(
      (t) => Math.abs(x - t.x) <= t.halfWidth + 2 && Math.abs(y - t.y) <= t.halfHeight + 2,
    );
    if (hit) {
      const offset = Math.max(-1, Math.min(1, (y - hit.y) / hit.halfHeight));
      const points = 25 + 5 * Math.round(15 * (1 - Math.abs(offset)));
      if (this.animate) {
        // A transform does nothing on an inline box, and the copy's words are inline.
        if (getComputedStyle(hit.element).display === 'inline') {
          hit.element.style.display = 'inline-block';
        }
        this.note = {
          text: `+${points}`,
          ink: this.hitInk,
          age: 0,
          x: hit.x,
          y: hit.y - hit.halfHeight - 6,
        };
        this.knocked = {
          target: hit,
          age: 0,
          x: hit.x,
          y: hit.y,
          angle: 0,
          vx: Math.max(-155, shot.vx * 0.26),
          vy: Math.max(-150, Math.min(65, shot.vy * 0.2)) - 65,
          spin: offset * 6,
        };
      }
      this.shot = null;
      this.result(points);
    } else if (x < 0 || y > this.fieldHeight) {
      if (this.animate) {
        this.note = {
          text: this.missLabel.toUpperCase(),
          ink: this.missInk,
          age: 0,
          x: Math.max(32, x),
          y: Math.min(this.fieldHeight - 16, y),
        };
      }
      this.shot = null;
      this.result(0);
    }
  }

  private restoreTarget() {
    if (!this.knocked) {
      return;
    }
    const style = this.knocked.target.element.style;
    style.removeProperty('transform');
    style.removeProperty('opacity');
    style.removeProperty('display');
    this.knocked = null;
  }

  private stepKnocked(dt: number) {
    const k = this.knocked;
    if (!k) {
      return;
    }
    const t = k.target;
    const style = t.element.style;
    k.age += dt;
    if (k.age >= KNOCK_ENDS_AT) {
      this.restoreTarget();
      return;
    }
    if (k.age >= KNOCK_FADE_AT) {
      style.removeProperty('transform');
      style.opacity = String((k.age - KNOCK_FADE_AT) / (KNOCK_ENDS_AT - KNOCK_FADE_AT));
      return;
    }
    for (let i = 0; i < 3; i++) {
      const h = dt / 3;
      k.vy += KNOCK_GRAVITY * h;
      k.x += k.vx * h;
      k.y += k.vy * h;
      k.angle += k.spin * h;
      const extent =
        Math.abs(Math.cos(k.angle)) * t.halfHeight + Math.abs(Math.sin(k.angle)) * t.halfWidth;
      if (k.y + extent >= t.floor && k.vy > 0) {
        k.y = t.floor - extent;
        k.vy = k.vy > 38 ? -k.vy * 0.32 : 0;
        k.vx *= 0.78;
        k.spin *= 0.74;
      }
    }
    style.transform = `translate(${k.x - t.x}px,${k.y - t.y}px) rotate(${k.angle}rad)`;
    style.opacity = String(Math.min(1, (KNOCK_FADE_AT - k.age) / 0.22));
  }

  private draw() {
    const c = this.ctx;
    const p = this.palette;
    if (this.clearField || this.shot || this.knocked || this.note) {
      c.clearRect(0, 0, this.fieldWidth, this.fieldHeight);
    } else {
      const r = 125 * this.scale + 8;
      c.clearRect(this.origin.x - r, this.origin.y - r, 2 * r, 2 * r);
    }
    this.clearField = Boolean(this.shot || this.knocked || this.note || this.held !== null);

    c.save();
    c.translate(this.origin.x, this.origin.y);
    c.scale(this.scale, this.scale);
    c.save();
    c.rotate(this.angle);
    c.translate(6 * this.recoil + 4 * this.charge(), 0);
    if (!this.shot) {
      c.save();
      c.translate(-MUZZLE - 3, 0);
      drawRat(c, p, false);
      c.restore();
    }
    drawBarrel(c, p);
    c.restore();
    drawCarriage(c, p);
    c.restore();

    if (this.held !== null) {
      const power = this.charge();
      const speed = this.speed * (0.55 + 0.9 * power);
      c.fillStyle = p.ink;
      for (let i = 1; i <= 5; i++) {
        const t = 0.03 + i * 0.045;
        const distance = MUZZLE * this.scale + t * speed;
        c.globalAlpha = 1 - i * 0.15;
        c.beginPath();
        c.arc(
          this.origin.x - distance * Math.cos(this.angle),
          this.origin.y - distance * Math.sin(this.angle) + 0.5 * this.gravity * t * t,
          1.75,
          0,
          Math.PI * 2,
        );
        c.fill();
      }
      c.globalAlpha = 1;
      // The ground rule doubles as the charge meter, filling away from the cannon.
      const length = (this.ground.right - this.ground.left) * power;
      c.fillStyle = p.accent;
      c.fillRect(this.ground.right - length, this.ground.y - 1, length, 2);
    }
    if (this.shot) {
      c.save();
      c.translate(this.shot.x, this.shot.y);
      c.rotate(Math.atan2(-this.shot.vy, -this.shot.vx));
      c.scale(this.scale, this.scale);
      drawRat(c, p, true);
      c.restore();
    }
    if (this.note) {
      const n = this.note;
      c.globalAlpha = Math.min(1, (NOTE_SECONDS - n.age) * 3);
      c.font = this.noteFont;
      c.textAlign = 'center';
      // A halo in the page colour keeps the note legible where it crosses the copy.
      c.lineJoin = 'round';
      c.lineWidth = 5;
      c.strokeStyle = p.paper;
      c.strokeText(n.text, n.x, n.y - 30 * n.age);
      c.fillStyle = n.ink;
      c.fillText(n.text, n.x, n.y - 30 * n.age);
      c.globalAlpha = 1;
    }
  }
}
