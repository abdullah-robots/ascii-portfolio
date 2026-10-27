import { useEffect, useRef, useState } from 'react';
import { pageTitle, parsePage } from './navigation';

export function usePage() {
  const [page, setPage] = useState(() => parsePage(location.hash));
  const heading = useRef<HTMLHeadingElement>(null);
  const previousPage = useRef(page);

  useEffect(() => {
    const navigate = () => setPage(parsePage(location.hash));
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);

  useEffect(() => {
    document.title = pageTitle(page);
    if (previousPage.current !== page) {
      window.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
      previousPage.current = page;
    }
  }, [page]);

  return { page, heading };
}
