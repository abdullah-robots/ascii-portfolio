# Deploy to Cloudflare Pages

This is a static React + Vite site. No Worker, database, API keys or backend are required. The Sites hosting manifest is only used by the current private preview; Cloudflare Pages does not need it.

## GitHub-connected deployment

In Cloudflare, choose **Workers & Pages → Create application → Pages → Import an existing Git repository**. Select **abdullah-ukaea/ascii-portfolio**.

Use these settings:

| Setting | Value |
| --- | --- |
| Framework preset | None (custom build command below) |
| Root directory | Leave empty — the repository root |
| Production branch for this iteration | `feature/portfolio-pages` |
| Build command | `pnpm install --frozen-lockfile && pnpm run build` |
| Build output directory | `dist` |
| Environment variable | `PNPM_VERSION=11.25.0` |
| Environment variable | `SKIP_DEPENDENCY_INSTALL=1` |

The tracked `.node-version` selects Node.js 22. Set these environment variables for both production and preview builds. Skipping the automatic install lets the explicit frozen-lockfile install above control dependency resolution.

GitHub `main` still holds the original version. Selecting `feature/portfolio-pages` as the Cloudflare production branch deploys this iteration without merging or changing `main`. If you later choose to release from `main`, merge deliberately and then change the production branch in Cloudflare.

Cloudflare assigns the actual `*.pages.dev` address after project creation; no Cloudflare project has been created by this task. Keep MineBrief as a separate Pages project.

## Direct upload alternative

Build locally with the same command above. Create a **Pages Direct Upload** project and upload the **contents of `dist/`**, including its root `index.html`, assets folder, favicon and `_headers`. A prebuilt ZIP of those contents is included with this handoff as `portfolio-cloudflare.zip`.

Git integration is the recommended choice for ongoing iteration; choose it when creating the project if you want automatic builds from GitHub.

## Routing and assets

- Home: `/#/`
- About: `/#/about`
- Projects: `/#/projects`

Hash routes survive refresh and direct links without `_redirects` or server rewrite rules. Vite emits fingerprinted assets into `dist/assets/`. The supplied `_headers` gives those files immutable caching; page HTML uses Cloudflare's normal caching behavior. No origin or domain is hard-coded into navigation, so the site works on your Pages subdomain or a custom domain.

## Verify after publishing

Open all three page links, refresh About and Projects, try browser Back, and check a narrow mobile layout. Check GitHub/LinkedIn links, palette cycling and pause/resume. Reduced-motion preferences should start the scene still.

## Official references

- [React on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/)
- [Build image and version overrides](https://developers.cloudflare.com/pages/configuration/build-image/)
- [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
