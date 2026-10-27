export const PAGES = [
  { id: 'home', label: 'Home', href: '#/' },
  { id: 'about', label: 'About', href: '#/about' },
  { id: 'projects', label: 'Projects', href: '#/projects' },
] as const;

export type Page = (typeof PAGES)[number]['id'];

export function parsePage(hash: string): Page {
  const path = hash.replace(/^#\/?/, '');
  return path === 'about' || path === 'projects' ? path : 'home';
}

export function pageTitle(page: Page): string {
  const titles = {
    home: 'Abdullah',
    about: 'About — Abdullah',
    projects: 'Projects — Abdullah',
  };
  return `${titles[page]} | Robotics & software`;
}
