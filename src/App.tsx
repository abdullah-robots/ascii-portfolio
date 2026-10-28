import { useRef } from 'react';
import { PAGES } from './navigation';
import { AboutPage, HomePage, ProjectsPage } from './pages';
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
  const { paused, theme, canvasAvailable, togglePaused, toggleTheme } = useUniverse(
    canvas,
    page === 'home',
  );
  const starlight = theme === 'starlight';
  const PageContent = PAGE_COMPONENTS[page];

  return (
    <div
      className={
        'shell ' +
        (page === 'home' ? 'landing' : 'inner-page') +
        (canvasAvailable ? '' : ' canvas-unavailable')
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
        <div className="header-bar">
          <nav aria-label="Main navigation">
            {PAGES.map(({ id, label, href }) => (
              <a key={id} href={href} aria-current={page === id ? 'page' : undefined}>
                {label}
                <span className="nav-dot" />
              </a>
            ))}
          </nav>
          <button
            className="theme-toggle"
            aria-pressed={starlight}
            aria-label={starlight ? 'Return to the night sky' : 'Switch to starlight'}
            title={starlight ? 'Night' : 'Starlight'}
            onClick={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              toggleTheme({
                x: bounds.left + bounds.width / 2,
                y: bounds.top + bounds.height / 2,
              });
            }}
          >
            {starlight ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
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

function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="2.9" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="8"
          y1="1.2"
          x2="8"
          y2="3"
          transform={`rotate(${angle} 8 8)`}
        />
      ))}
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M12.8 10.2A5.4 5.4 0 0 1 5.8 3.2a5.4 5.4 0 1 0 7 7Z" />
    </svg>
  );
}
