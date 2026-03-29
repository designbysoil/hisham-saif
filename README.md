# hisham-saif

Portfolio website for **Hisham Saif** — a media producer and IT project manager based in Qatar. The site showcases 9 professional projects across media production (Qatar Media Corporation, freelance sound engineering) and technology (IBM-certified PM).

**Live:** Deployed on [Netlify](https://netlify.com)

## Features

- **Infinite draggable grid** — 4×2 tile layout that repeats infinitely in all directions with momentum/inertia physics
- **Interactive sidebar** — click any project card to reveal full details, stats, role descriptions, and illustrations
- **Keyboard & scroll navigation** — arrow keys, mouse wheel, and touch/drag all supported
- **Bauhaus-inspired design** — red, blue, yellow, black cards on cream with Instrument Sans + Geist Mono typography
- **Viewport culling** — only renders visible cards + 1 buffer row/col for performance
- **Responsive** — full-width cards on mobile, slide-in sidebar adapts to viewport

## Tech Stack

- **[Astro](https://astro.build)** — static site generator (zero JS by default)
- **TypeScript** — client-side interactivity (grid physics, sidebar, card rendering)
- **[marked](https://marked.js.org)** — Markdown parsing for project content
- **Pure CSS** — no framework, 568 lines with CSS variables
- **Netlify** — static deployment via `netlify.toml`

## Project Structure

```
src/
├── pages/index.astro           # Single-page app entry
├── layouts/Base.astro          # Root HTML layout
├── content/
│   ├── content.config.ts       # Zod schema for project frontmatter
│   └── projects/*.md           # 9 project markdown files
├── scripts/
│   ├── grid.ts                 # Infinite grid with drag/momentum/culling
│   ├── sidebar.ts              # Sidebar open/close/populate
│   └── stamps.ts               # Card DOM element creation
└── styles/global.css           # All styles (responsive, animations)
public/illustrations/           # Hero PNGs per project
```

## Getting Started

```bash
npm install       # install dependencies
npm run dev       # start dev server with hot reload
npm run build     # build static site to /dist
npm run preview   # preview production build locally
```

Requires [Node.js](https://nodejs.org).

## How It Works

1. **Build time** — Astro loads `.md` files from `src/content/projects/`, validates frontmatter against a Zod schema, parses markdown with `marked`, and injects project data as `window.__PROJECTS__`
2. **Runtime** — `grid.ts` calculates a repeating 4×2 layout, handles pointer/touch/wheel/keyboard events, and applies momentum physics on drag release. `sidebar.ts` populates and animates project details. `stamps.ts` creates card DOM elements with colors, images, and accessibility attributes
3. **Data** — each project `.md` defines title, category, color, org, role, dates, description, bullets, stats, tags, and illustration path in YAML frontmatter

## Deployment

Configured for Netlify. Push to `main` triggers automatic builds.
