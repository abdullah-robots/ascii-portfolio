import { useEffect, useRef, useState, type RefObject } from 'react';
import { storedTheme, storeTheme, THEMES, type Theme } from './themes';
import { Universe } from './universe';

type Origin = { x: number; y: number };

export function useUniverse(
  canvas: RefObject<HTMLCanvasElement | null>,
  showTitle: boolean,
) {
  const [paused, setPaused] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [theme, setTheme] = useState<Theme>(storedTheme);
  const [canvasAvailable, setCanvasAvailable] = useState(true);
  const scene = useRef<Universe | null>(null);
  const themeOrigin = useRef<Origin | undefined>(undefined);
  const initialOptions = useRef({ paused, theme, showTitle });

  useEffect(() => {
    if (!canvas.current) return;
    const universe = Universe.create(canvas.current, initialOptions.current);
    scene.current = universe;
    setCanvasAvailable(universe !== null);
    return () => {
      universe?.destroy();
      scene.current = null;
    };
  }, [canvas]);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setPaused(preference.matches);
    preference.addEventListener('change', change);
    return () => preference.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    scene.current?.setPaused(paused);
  }, [paused]);
  useEffect(() => {
    scene.current?.setTheme(theme, themeOrigin.current);
    storeTheme(theme);
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEMES[theme].background);
  }, [theme]);
  useEffect(() => {
    scene.current?.setShowTitle(showTitle);
  }, [showTitle]);

  return {
    paused,
    theme,
    canvasAvailable,
    togglePaused: () => setPaused((value) => !value),
    toggleTheme: (origin?: Origin) => {
      themeOrigin.current = origin;
      // Let the page's colours ease over while the canvas wipe plays.
      const root = document.documentElement;
      root.classList.add('theme-shifting');
      setTimeout(() => root.classList.remove('theme-shifting'), 1200);
      setTheme((value) => (value === 'void' ? 'starlight' : 'void'));
    },
  };
}
