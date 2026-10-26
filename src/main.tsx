import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Universe } from './universe';
import './style.css';

function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<Universe | null>(null);
  const [paused, setPaused] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [mode, setMode] = useState(0);
  useEffect(() => {
    if (!canvas.current) return;
    const scene = new Universe(canvas.current); engine.current = scene;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setPaused(preference.matches);
    preference.addEventListener('change', change);
    return () => { preference.removeEventListener('change', change); scene.destroy(); engine.current = null; };
  }, []);
  useEffect(() => { engine.current?.setPaused(paused); }, [paused]);
  useEffect(() => { engine.current?.setMode(mode); }, [mode]);
  return <main>
    <canvas ref={canvas} aria-hidden="true" />
    <h1 className="sr-only">Abdullah Saleem</h1>
    <header><a className="monogram" href="#" aria-label="Abdullah Saleem home">a<span>→</span>s</a><span className="top-caption">A SMALL PERSONAL UNIVERSE</span><span className="edition">VOL. 001 <span className="dot" /></span></header>
    <div className="side-note" aria-hidden="true">FIG. 01 — THINGS FALL INTO PLACE</div>
    <section className="scene-label" aria-label="Interactive ASCII art"><span className="tiny-cross">+</span><span>EST. ON EARTH<br/><span className="muted">CURRENTLY IN ORBIT</span></span></section>
    <div className="scene-number" aria-hidden="true">({String(mode + 1).padStart(2, '0')} / 03)</div>
    <footer>
      <div className="footer-main"><p>Curiosity has a gravitational pull.</p><nav aria-label="Social links"><a href="https://github.com/abdullah-ukaea" target="_blank" rel="noopener noreferrer">GITHUB <span>↗</span></a><a href="https://www.linkedin.com/in/abdullah-saleem-147044239/" target="_blank" rel="noopener noreferrer">LINKEDIN <span>↗</span></a></nav></div>
      <div className="footer-base"><span className="instruction">MOVE TO DISTORT · CLICK THE VOID</span><div className="controls"><button onClick={() => setMode((mode + 1) % 3)} aria-label="Change universe palette">{['◉ PHOSPHOR', '◉ AMBER', '◉ ICE'][mode]}</button><button aria-pressed={paused} onClick={() => setPaused(!paused)} aria-label={paused ? 'Resume animation' : 'Pause animation'}>{paused ? '▶ RESUME' : 'Ⅱ PAUSE'}</button></div><span className="signature">AS / INFINITE PLAY</span></div>
    </footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
