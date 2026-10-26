# Abdullah Saleem — A small universe

A nearly wordless personal portfolio: dynamic ASCII typography, drifting singularities, and particle accretion disks. Independent personal work; no employer affiliation is implied.

## Develop

Use Node.js 22+ and npm or pnpm.

```sh
npm install
npm run dev
npm run build
npm run preview
```

The production output is `dist/`. It can be hosted on any static host. This checkout also contains a Sites static-hosting manifest.

## Interact

- Move the pointer to bend nearby characters and particles.
- Click the canvas to send a ripple through the name.
- Cycle Phosphor, Amber and Ice palettes.
- Pause or resume with the keyboard-accessible control.

## Implementation

React + TypeScript + Vite, with a single Canvas 2D renderer. The name is sampled from an offscreen text mask into a responsive character grid. Inclined spiral particle orbits, a dark occluding core and a sampled photon ring produce the black-hole effect. Distortion is artistic, not a physical simulation.

The renderer limits animation to approximately 30 fps, caps device pixel ratio at 2, uses fewer particles on small screens, and stops drawing when hidden or paused. `prefers-reduced-motion` starts the scene still and responds to system preference changes. A semantic heading and ordinary social links remain available to assistive technology. The UI font has a local monospace fallback.

Adjust `src/universe.ts` for typography, particle density, drift, palette and distortion. Edit `src/style.css` for the editorial frame. No model, image or video assets are needed.

## References

Visual direction informed by the supplied screenshots, [Dao Ho](https://www.daoho.dev/), and [Inspora's Shark on vacation](https://www.inspora.design/posts/shark-on-vacation). All scene geometry and rendering code in this project were written for this portfolio.

## Validation

TypeScript check and production build passed. Desktop and 390px mobile layouts were inspected in the browser; mobile had no horizontal overflow. Palette cycling and pause/resume were exercised, and the browser reported no errors or warnings. Reduced-motion and hidden-tab behavior are implemented; no physical mobile device or sustained performance benchmark has been run.
