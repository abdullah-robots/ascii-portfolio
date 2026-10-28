# Abdullah Saleem — A small universe

## Pages

- Home: first-name ASCII hero between two drifting black holes, with minimal page links.
- About: focus areas, current/previous roles and education. This is a personal website.
- Projects: an intentional empty grid, ready for project entries.

Routes use `#/about` and `#/projects`, so direct links and refresh work on a static host without server rewrite rules. Navigation moves focus to the page heading and updates the document title. The animated background stays continuous across page changes and becomes subdued behind content.

### Add a project

Edit `src/projects.ts` and add an entry to `projects`. The real cards automatically replace the empty state. Optional images go in `public/projects/` and use paths such as `/projects/robot.jpg`.

```ts
{
  id: 'project-slug',
  title: 'Project title',
  category: 'Robotics',
  year: '2026',
  description: 'A short explanation of the problem and what you built.',
  tags: ['ROS 2', 'C++'],
  image: '/projects/robot.jpg', // optional
  href: 'https://github.com/your-account/your-project', // optional
}
```

The grid is intentionally empty in the published version; no résumé projects are presented as personal work by default.

A nearly wordless personal portfolio: dynamic ASCII typography, drifting singularities, and particle accretion disks. Independent personal work; no employer affiliation is implied.

## Develop

Use Node.js 22+ and pnpm 11.25.0. Dependencies are pinned by `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
pnpm preview
```

The production output is `dist/`. It can be hosted on any static host. This checkout also contains a Sites static-hosting manifest.

`pnpm test` runs the renderer lifecycle and routing checks. `pnpm format` formats the source, and `pnpm format:check` checks formatting without changing files.

## Interact

- Move the pointer to bend nearby characters and particles.
- Click the canvas to send a ripple through the name.
- Press the sun in the top bar to switch to Starlight: an ivory-and-gold sky of radiant ASCII stars that spreads out from the button. The moon brings back the night. The choice is remembered.
- Pause or resume with the keyboard-accessible control.

## Implementation

React + TypeScript + Vite, with a single Canvas 2D renderer. The name is sampled from an offscreen text mask into a responsive character grid. Inclined spiral particle orbits, a dark occluding core and a sampled photon ring produce the black-hole effect. Distortion is artistic, not a physical simulation.

The renderer limits animation to approximately 30 fps, caps device pixel ratio at 2, uses fewer particles on small screens, and stops drawing when hidden or paused. `prefers-reduced-motion` starts the scene still and responds to system preference changes. A semantic heading and ordinary social links remain available to assistive technology. The UI font has a local monospace fallback.

Adjust `src/universe.ts` for typography, particle density, drift and distortion, and `src/starlight.ts` for the light theme's stars, halos, stardust and gilt lettering. Edit `src/style.css` for the editorial frame. No model, image or video assets are needed.

`src/App.tsx` contains the shared shell and controls, `src/pages.tsx` contains page content, and `src/projects.ts` is the project list. `usePage.ts` handles hash navigation and focus; `useUniverse.ts` connects React to the canvas renderer. Theme colours and the remembered choice live in `src/themes.ts`; light-theme page styles are the `[data-theme='starlight']` overrides at the end of `src/style.css`.

Cloudflare preparation: the frozen pnpm install and production build pass with pnpm 11.25.0. The static output includes `index.html`, fingerprinted assets, favicon and `_headers`; upload the contents of `dist/`. Cloudflare account deployment remains a user step.
