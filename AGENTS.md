# Flying Rat Studio website

Marketing site for a Prague game co-development studio: a home page plus `/jobs`, `/press`,
`/games/privacy-policy` and `/credits`, in English and Czech. Every page is prerendered as
static HTML.

Stack: Next.js 16 (App Router, Turbopack), React 19 with the React Compiler, TypeScript,
Tailwind CSS v4, i18next, three.js. The package manager is **bun**.

## Commands

| Command         | Use it for                                                            |
| --------------- | --------------------------------------------------------------------- |
| `bun install`   | Install dependencies. Never `npm install`.                            |
| `bun run dev`   | Dev server.                                                           |
| `bun run check` | Lint, format check and type-check. Must pass before work is done.     |
| `bun run fix`   | Apply lint and format auto-fixes.                                     |
| `bun run build` | Production build. Run after changing routes, metadata, config or CSS. |

There is no test suite. Verify behaviour in a browser (see "Done means").

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Layout

```
app/
  layout.tsx, page.tsx      root layout (fonts, metadata defaults, JSON-LD) and home page
  HomeClient.tsx            the home page's sections, in order
  components/               shared components; components/icons/ holds every icon
  components/aboutDemos/    the About section's swappable demos, one folder each: `island`
                            (three.js, the default) and, picked with `/?demo=<name>`,
                            `cannon`, `cannon3d` and `rockfall`; see "About demos" below
  hooks/                    useInView, useScrollFrame, usePageIdle, useAnimationsEnabled, ...
  i18n/                     i18next setup; import `useTranslation`, `useLanguage` from here
  locales/en.json, cs.json  all user-facing copy
  data/projects.json        the games in "Our Work" (per-language text inside)
  lib/site.ts               site URL, social profiles, contact emails, list of pages
  lib/seo.ts                `pageMetadata()` for page titles, canonicals and social cards
  jobs/, press/, credits/, games/privacy-policy/   one folder per page
  sitemap.ts, robots.ts, llms.txt/route.ts         generated from lib/site.ts and the copy
  globals.css               design tokens, component classes, per-section styles
public/images/              site images (WebP); public/press-kit/ holds press downloads
```

A page is a thin server file that exports `metadata` and renders a `*Client.tsx` component.

## Copy and languages

- Every user-facing string lives in `app/locales/en.json` **and** `cs.json`. Add or change a
  key in both files in the same change; the two files must have identical keys.
- Read copy with `useTranslation()` from `app/i18n`. Do not hard-code text in components,
  including `aria-label`s. Proper nouns (studio and game names) are the only exception.
- Write Czech with ordinary spaces. `utils/czechTypography.ts` ties one-letter words.
- Do not invent facts: client names, numbers, dates and promises come from the owner.

## Styling

- Use Tailwind utilities. Colours come from semantic utilities only: `text-ink`,
  `text-secondary`, `text-muted`, `text-subtle`, `bg-page`, `bg-surface`, `bg-surface-light`,
  `border-line`, `border-line-strong`. Never give a colour as an arbitrary value (square
  brackets) or a hex code in a component.
- Coral is the single accent. `bg-accent` / `text-accent` are for fills and large display
  type; small coral text uses `text-accent-ink`, which stays readable in the light theme.
- Reuse the component classes in `globals.css` before writing new ones: `btn`,
  `btn-primary`, `btn-secondary`, `btn-sm`, `surface-card`, `eyebrow`, `section-title`,
  `section-subtitle`, `section-pad`, `text-link`, `font-display`, `container`.
- Extra type sizes: `text-md` (15px) and `text-meta` (13px). Avoid arbitrary pixel sizes.
- Themes are `html.light` and `html.dark`; tokens are defined once per theme at the top of
  `globals.css`. Check every visual change in both.
- Write `backdrop-filter` unprefixed only; the pipeline adds the prefix.
- Do not add colours, fonts or decorative components. New pages keep the site's style.

## Components and hooks

- Reuse before building: `SiteHeader` (via `Header` / `PageHeader`), `SecondaryPageShell`
  for every page except home, `SectionHeader`, `SplitSection`, `LabelledList`, `FadeInView`,
  `Logo`, and the icons in `components/icons`.
- Do not hand-roll `IntersectionObserver`, `ResizeObserver`, scroll listeners or mount
  timers. Use `useInView`, `useElementSize`, `useScrollFrame` and `usePageIdle`.
- Add `'use client'` only to files that use hooks or event handlers.
- Comments explain constraints the code cannot show (a browser bug, a hydration trap).
  Do not write comments that narrate what the code does.

## About demos

- A demo is a folder in `components/aboutDemos/` whose `index.ts` exports an `AboutDemo`
  (see `types.ts`), plus one line in the registry, `aboutDemos/index.ts`. Removing a demo
  is deleting both, and its `about.demos.<name>` copy.
- `About.tsx` must not name or special-case a demo. What a demo needs from the section it
  declares in its `AboutDemo`: room above the copy, the copy's width, the copy split into
  `data-target` spans, a class on the section.
- Demos do not import from each other. Shared code goes to `hooks/` or `components/`.
- A demo cleans up after itself: listeners, observers, GL contexts and any element it adds
  outside its own markup.

## Motion

- Entrances use `FadeInView` (on scroll) or the `reveal-on-load` class (on first paint).
- Every animation must stop under reduced motion. In CSS, put it inside
  `@media (prefers-reduced-motion: no-preference)` and prefix the selector with
  `html:not(.no-motion)`. In JS, gate it on `useAnimationsEnabled()`.
- Infinite animations start `paused` and run only while on screen (`data-live`, set from
  `useInView`).

## Accessibility

- Interactive elements are `<button>` or `<a>`; icon-only controls need an accessible name.
- Never remove the focus outline. Every control must be reachable and visible by keyboard.
- Text contrast is at least 4.5:1 in both themes; use the `-ink` colour utilities for small
  coloured text. Do not dim readable content below that with `opacity`.
- Collapsed panels that stay in the DOM get `inert`.

## Metadata, SEO and images

- A new page exports `metadata = pageMetadata({ title, description, path })` and is added
  to `SITE_PAGES` in `lib/site.ts`, which feeds the sitemap.
- The site URL, social profiles and contact emails are defined only in `lib/site.ts`.
- Site images are WebP in `public/images/`, rendered with `next/image` and an accurate
  `sizes`. Use `preload` (not the deprecated `priority`) on the largest above-the-fold
  image only. Files under `public/press-kit/` are downloads and keep their formats.
- The three.js chunk must stay off the critical path: it is imported dynamically and only
  after `usePageIdle()`.

## Done means

- `bun run check` exits 0. oxlint fails on warnings; fix the code instead of disabling a
  rule. A suppression needs a `-- reason` on the same line.
- `bun run build` passes when routes, metadata, config or `globals.css` changed.
- UI changes were looked at in both languages, both themes, and at 390px and desktop width.
- Say plainly what was not verified.

## Boundaries

- Do not commit, push or open pull requests unless asked.
- Ask before adding a dependency.
- Do not edit `bun.lock` by hand, `next-env.d.ts`, anything under `.next/`, or the
  Next.js block in this file (`next dev` rewrites it).
- Commit messages follow the history: `type: summary`, lower case, imperative
  (`feat`, `fix`, `refactor`, `chore`).
- Claude Code reads this file only while the repository has no `CLAUDE.md`. If one is
  added, make its first line `@AGENTS.md`.
