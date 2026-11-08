import { useEffect, type RefObject } from 'react';

export type StudyPoint = { x: number; y: number };
const CHARACTERS = '.:+*x';
const SVG_NS = 'http://www.w3.org/2000/svg';

/** React owns the drawing; this effect only animates its grain while someone interacts. */
export function usePointInteraction(
  svg: RefObject<SVGSVGElement | null>,
  grain: RefObject<SVGPathElement | null>,
  glyphs: RefObject<SVGGElement | null>,
  points: readonly StudyPoint[],
  restingPath: string,
  paused: boolean,
) {
  useEffect(() => {
    const root = svg.current;
    const path = grain.current;
    const group = glyphs.current;
    if (!root || !path || !group || paused) return;
    const activePath = path;
    const offsets = points.map(() => ({ x: 0, y: 0 }));
    const labels = Array.from({ length: 32 }, () => {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('visibility', 'hidden');
      group.append(text);
      return text;
    });
    let pointer: StudyPoint | null = null;
    let pulse: (StudyPoint & { start: number }) | null = null;
    let frame = 0;
    let last = 0;
    let disposed = false;
    const wake = () => {
      if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const clear = () => {
      pointer = null;
      wake();
    };
    const position = (event: PointerEvent): StudyPoint | null => {
      const bounds = root.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return null;
      const x = ((event.clientX - bounds.left) / bounds.width) * 400;
      const y = ((event.clientY - bounds.top) / bounds.height) * 400;
      return x > -30 && x < 430 && y > -30 && y < 430 ? { x, y } : null;
    };
    const move = (event: PointerEvent) => {
      const next = position(event);
      if (!next && !pointer) return;
      pointer = next;
      wake();
    };
    const press = (event: PointerEvent) => {
      const point = position(event);
      if (point) {
        pulse = { ...point, start: performance.now() };
        wake();
      }
    };
    const release = (event: PointerEvent) => {
      if (event.pointerType === 'touch') clear();
    };
    const exit = (event: PointerEvent) => {
      if (!event.relatedTarget) clear();
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (document.hidden) pointer = null;
      else wake();
    };
    function draw(now: number) {
      frame = 0;
      if (disposed || document.hidden) return;
      if (last && now - last < 32) {
        wake();
        return;
      }
      const ease = 1 - Math.exp(-Math.min(last ? now - last : 32, 80) / 95);
      last = now;
      const age = pulse ? (now - pulse.start) / 1000 : 2;
      if (age > 1.2) pulse = null;
      let settling = false;
      let labelIndex = 0;
      const segments: string[] = [];
      points.forEach((point, index) => {
        let tx = 0;
        let ty = 0;
        let influence = 0;
        if (pointer) {
          const dx = point.x - pointer.x;
          const dy = point.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          influence = Math.exp((-distance * distance) / 700);
          tx = (dx / (distance + 1)) * influence * 12;
          ty = (dy / (distance + 1)) * influence * 12;
        }
        if (pulse) {
          const dx = point.x - pulse.x;
          const dy = point.y - pulse.y;
          const distance = Math.hypot(dx, dy);
          const ring = distance - age * 160;
          const force = Math.exp((-ring * ring) / 180) * (1 - age / 1.2) * 5;
          tx += (dx / (distance + 1)) * force;
          ty += (dy / (distance + 1)) * force;
        }
        const offset = offsets[index]!;
        offset.x += (tx - offset.x) * ease;
        offset.y += (ty - offset.y) * ease;
        if (Math.abs(offset.x) + Math.abs(offset.y) > 0.025) settling = true;
        const x = point.x + offset.x;
        const y = point.y + offset.y;
        const label = labels[labelIndex];
        if (influence > 0.15 && index % 11 === 0 && label) {
          label.setAttribute('x', x.toFixed(2));
          label.setAttribute('y', y.toFixed(2));
          label.setAttribute('visibility', 'visible');
          label.textContent =
            CHARACTERS[(index + Math.floor(now / 220)) % CHARACTERS.length]!;
          labelIndex++;
        } else segments.push(`M${x.toFixed(2)} ${y.toFixed(2)}h.01`);
      });
      for (let index = labelIndex; index < labels.length; index++)
        labels[index]!.setAttribute('visibility', 'hidden');
      activePath.setAttribute('d', segments.join(''));
      if (pointer || pulse || settling) wake();
      else {
        activePath.setAttribute('d', restingPath);
        last = 0;
      }
    }
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', press, { passive: true });
    window.addEventListener('pointerout', exit);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', clear);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', press);
      window.removeEventListener('pointerout', exit);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', clear);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', visibility);
      activePath.setAttribute('d', restingPath);
      group.replaceChildren();
    };
  }, [svg, grain, glyphs, points, restingPath, paused]);
}
