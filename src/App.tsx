import { useRef } from 'react';
import { PAGES } from './navigation';
import { AboutPage, HomePage, ProjectsPage } from './pages';
import { PALETTES } from './palettes';
import { usePage } from './usePage';
import { useUniverse } from './useUniverse';

const PAGE_COMPONENTS = { home: HomePage, about: AboutPage, projects: ProjectsPage };
const SOCIAL_LINKS = [
  { label: 'GitHub', href: 'https://github.com/abdullah-ukaea' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/abdullah-saleem-147044239/' },
];

export function App() {
  const { page, heading } = usePage();
  const canvas = useRef<HTMLCanvasElement>(null);
  const { paused, palette, canvasAvailable, togglePaused, cyclePalette } = useUniverse(
    canvas,
    page === 'home',
  );
  const PageContent = PAGE_COMPONENTS[page];

  return (
    <div
      className={
        'shell ' +
        (page === 'home' ? 'landing' : 'inner-page') +
        (canvasAvailable ? '' : 'canvas-unavailable')
      }
    >
      <a
        className="skip-link"
        href="#content"
        onClick={(event) => {
          event.preventDefault();
          heading.current?.focus();
        }}
      >
        Skip to content
      </a>
      <canvas ref={canvas} aria-hidden="true" />
      <header className="site-header">
        <nav aria-label="Main navigation">
          {PAGES.map(({ id, label, href }) => (
            <a key={id} href={href} aria-current={page === id ? 'page' : undefined}>
              {label}
              <span className="nav-dot" />
            </a>
          ))}
        </nav>
      </header>
      <PageContent heading={heading} />
      <footer className="site-footer">
        <nav className="social-links" aria-label="Social links">
          {SOCIAL_LINKS.map(({ label, href }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer">
              {label} ↗
            </a>
          ))}
        </nav>
        <div className="controls">
          <button onClick={cyclePalette} aria-label="Change universe palette">
            ◉ {PALETTES[palette].label}
          </button>
          <button
            aria-pressed={paused}
            onClick={togglePaused}
            aria-label={paused ? 'Resume animation' : 'Pause animation'}
          >
            {paused ? '▶ RESUME' : 'Ⅱ PAUSE'}
          </button>
        </div>
      </footer>
    </div>
  );
}
