import { useEffect, useRef, useState, type RefObject } from 'react';
import { nextPalette, type Palette } from './palettes';
import { Universe } from './universe';

export function useUniverse(
  canvas: RefObject<HTMLCanvasElement | null>,
  showTitle: boolean,
) {
  const [paused, setPaused] = useState(
    () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [palette, setPalette] = useState<Palette>('phosphor');
  const [canvasAvailable, setCanvasAvailable] = useState(true);
  const scene = useRef<Universe | null>(null);
  const initialOptions = useRef({ paused, palette, showTitle });

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
    scene.current?.setPalette(palette);
  }, [palette]);
  useEffect(() => {
    scene.current?.setShowTitle(showTitle);
  }, [showTitle]);

  return {
    paused,
    palette,
    canvasAvailable,
    togglePaused: () => setPaused((value) => !value),
    cyclePalette: () => setPalette(nextPalette),
  };
}
