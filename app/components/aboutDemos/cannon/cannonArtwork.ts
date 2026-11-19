export type CannonPalette = { ink: string; paper: string; accent: string };

/** Where the wheel meets the ground, in the cannon's own units below its pivot. */
export const GROUND = 31;
/** Distance from the pivot to the mouth of the barrel. */
export const MUZZLE = 71;

const TAU = Math.PI * 2;

function disc(c: CanvasRenderingContext2D, x: number, y: number, radius: number, fill: string) {
  c.beginPath();
  c.arc(x, y, radius, 0, TAU);
  c.fillStyle = fill;
  c.fill();
}

/**
 * The passenger: about 48 units from nose to tail tip, centred on the origin and
 * facing left, so the rotation that raises the barrel also lifts its nose. Its
 * tail and paws only show in flight; in the barrel they would read as a jaw.
 */
export function drawRat(c: CanvasRenderingContext2D, p: CannonPalette, flying: boolean) {
  c.strokeStyle = p.ink;
  if (flying) {
    c.lineCap = 'round';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(11, 2);
    c.bezierCurveTo(19, 9, 23, -6, 29, -1);
    c.stroke();
    c.lineWidth = 2.8;
    c.beginPath();
    c.moveTo(-3, 6);
    c.lineTo(-10, 9.5);
    c.moveTo(10, 5.5);
    c.lineTo(16.5, 8.5);
    c.stroke();
  }
  c.fillStyle = p.ink;
  c.beginPath();
  c.ellipse(3, 1.5, 11, 6.5, 0, 0, TAU);
  c.fill();
  c.beginPath();
  c.moveTo(-5, -8.5);
  c.quadraticCurveTo(-14, -7, -20.5, 0.6);
  c.quadraticCurveTo(-21.2, 3.2, -18.5, 3.6);
  c.quadraticCurveTo(-11, 7.5, -2, 6.5);
  c.closePath();
  c.fill();
  disc(c, -19.8, 1.5, 1.8, p.accent);
  disc(c, -13, -1, 1.4, p.paper);
  c.fillStyle = p.accent;
  c.beginPath();
  c.arc(-5, -3, 8.6, Math.PI * 1.03, TAU);
  c.lineTo(-13.4, -3);
  c.closePath();
  c.fill();
  disc(c, -1.5, -4.5, 4.4, p.accent);
  disc(c, -1.5, -4.5, 3.2, p.ink);
}

/** Drawn around the pivot and pointing left, so a positive rotation raises the mouth. */
export function drawBarrel(c: CanvasRenderingContext2D, p: CannonPalette) {
  c.fillStyle = p.ink;
  c.beginPath();
  c.moveTo(-62, -12.5);
  c.lineTo(4, -17);
  c.arc(4, 0, 17, -Math.PI / 2, Math.PI / 2);
  c.lineTo(-62, 12.5);
  c.closePath();
  c.fill();
  c.beginPath();
  c.roundRect(-MUZZLE, -16.5, 12, 33, 3.5);
  c.fill();
  c.fillStyle = p.paper;
  c.fillRect(-57, -18, 2, 36);
}

export function drawCarriage(c: CanvasRenderingContext2D, p: CannonPalette) {
  c.fillStyle = p.ink;
  c.strokeStyle = p.ink;
  c.lineJoin = 'round';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(2, 6);
  c.lineTo(48, 26.5);
  c.lineTo(48, GROUND - 1.5);
  c.lineTo(36, GROUND - 1.5);
  c.lineTo(0, 20);
  c.closePath();
  c.fill();
  c.stroke();
  // The wheel's outline keeps it apart from the barrel, but must not bite into the ground rule.
  c.save();
  c.beginPath();
  c.rect(-24, -12, 48, GROUND + 11.5);
  c.clip();
  disc(c, 0, 12, 21.5, p.paper);
  c.restore();
  disc(c, 0, 12, 19, p.ink);
  disc(c, 0, 12, 10.5, p.paper);
  disc(c, 0, 12, 4.5, p.ink);
}
