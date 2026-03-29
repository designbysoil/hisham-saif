# CLAUDE.md

## What This Is

Portfolio website for Hisham Saif — an infinite draggable stamp grid showcasing media production and IT project management work.

## Tech Stack

- Astro 6.1 (static site generator)
- TypeScript (client-side interactivity)
- marked (Markdown parsing)
- Pure CSS (no framework)
- Deployed on Netlify

## Architecture

Single-page Astro app. Project data lives in `src/content/projects/*.md` with Zod-validated frontmatter. At build time, markdown is parsed and injected into the page as `window.__PROJECTS__`. Three TypeScript modules handle runtime behavior:

- `src/scripts/grid.ts` — infinite repeating 4×2 grid with drag, momentum, keyboard, scroll, and viewport culling
- `src/scripts/sidebar.ts` — slide-in sidebar with project details, stats, role bullets
- `src/scripts/stamps.ts` — card DOM element factory with colors, images, a11y attributes

## Key Commands

```bash
npm run dev       # dev server
npm run build     # production build to /dist
npm run preview   # preview build
```

## Content Model

Each project `.md` has frontmatter: title, shortTitle, category, color (red/blue/yellow/black), org, role, dates, order, description, bullets (3 items), tags, stats ({value, label}), image path, illoSize.

## Design Decisions

- Bauhaus color palette: red, blue, yellow, black on cream (#FAF8F4)
- Typography: Instrument Sans (UI) + Geist Mono (mono)
- Infinite grid wraps using modular arithmetic — no boundaries
- Viewport culling renders only visible + 1 buffer row/col
- Momentum physics on drag release (velocity decay with friction)
- Cards are 290×388px desktop, full-width mobile
- Sidebar slides in from right with cubic-bezier easing

## Conventions

- All styles in `src/styles/global.css` (no CSS modules or scoped styles)
- No external JS libraries — vanilla DOM manipulation
- Content schema defined in `src/content/content.config.ts`
- Static output mode (no SSR)
- Images stored in `public/illustrations/`
