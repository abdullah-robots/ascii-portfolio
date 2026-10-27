import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Universe } from './universe';
import { projects } from './projects';
import './style.css';

type Page = 'home' | 'about' | 'projects';
function currentPage(): Page {
  const path = location.hash.replace(/^#\/?/, '');
  return path === 'about' || path === 'projects' ? path : 'home';
}
const social = <><a href="https://github.com/abdullah-ukaea" target="_blank" rel="noopener noreferrer">GitHub ↗</a><a href="https://www.linkedin.com/in/abdullah-saleem-147044239/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></>;

function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const engine = useRef<Universe | null>(null);
  const [page, setPage] = useState<Page>(currentPage);
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
  useEffect(() => {
    const change = () => { setPage(currentPage()); window.scrollTo(0, 0); requestAnimationFrame(() => heading.current?.focus()); };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => { engine.current?.setPaused(paused); }, [paused]);
  useEffect(() => { engine.current?.setMode(mode); }, [mode]);
  useEffect(() => {
    engine.current?.setShowTitle(page === 'home');
    document.title = (page === 'home' ? 'Abdullah' : page === 'about' ? 'About — Abdullah' : 'Projects — Abdullah') + ' | Robotics & software';
  }, [page]);
  return <div className={'shell ' + (page === 'home' ? 'landing' : 'inner-page')}>
    <a className="skip-link" href="#content" onClick={e => { e.preventDefault(); heading.current?.focus(); }}>Skip to content</a>
    <canvas ref={canvas} aria-hidden="true" />
    <header className="site-header">
      <nav aria-label="Main navigation">{(['home','about','projects'] as Page[]).map(p => <a key={p} href={p === 'home' ? '#/' : '#/' + p} aria-current={page === p ? 'page' : undefined}>{p[0].toUpperCase() + p.slice(1)}<span className="nav-dot" /></a>)}</nav>
    </header>
    {page === 'home' ? <main id="content" className="home-content">
      <h1 ref={heading} tabIndex={-1} className="sr-only">Abdullah</h1>
      <div className="home-intro"><div className="home-links"><a className="primary-link" href="#/about">A little about me <span>↗</span></a><a className="text-link" href="#/projects">Explore my work <span>→</span></a></div></div>
    </main> : page === 'about' ? <main id="content" className="page-content">
      <div className="page-topline"><span className="eyebrow">01 / ABOUT</span><span className="eyebrow muted">THE PERSON BEHIND THE PIXELS</span></div>
      <h1 ref={heading} tabIndex={-1}>Hi, I’m Abdullah<span className="accent">.</span></h1>
      <p className="page-lead">I build software that brings<br className="desktop-break"/> robots into the real world.</p>
      <div className="about-layout"><div className="about-story"><div className="focus-list" aria-label="Areas of focus"><span>Robotics</span><span>Control systems</span><span>Computer vision</span><span>Language-agnostic</span></div><a className="primary-link" href="#/projects">Explore my work <span>→</span></a></div><aside className="about-facts"><div className="fact"><span className="eyebrow">NOW</span><p>Oxford Robotics Institute</p><small>Robotics Software Engineer · 2026–present</small></div><div className="fact"><span className="eyebrow">BEFORE</span><p>RACE / UKAEA</p><small>Control Systems Engineer · 2024–2026</small></div><div className="fact"><span className="eyebrow">FOUNDATIONS</span><p>Physics → Robotics</p><small>BSc Physics · Royal Holloway<br/>MSc Computer Vision, Robotics & ML · Surrey</small></div></aside></div>
      <div className="page-closing"><p>Always curious about what comes next.</p></div>
    </main> : <main id="content" className="page-content projects-content">
      <div className="page-topline"><span className="eyebrow">02 / PROJECTS</span><span className="eyebrow muted">{String(projects.length).padStart(2,'0')} PUBLISHED</span></div>
      <h1 ref={heading} tabIndex={-1}>Things I’ve built<span className="accent">.</span></h1>
      <p className="page-lead">Robotics, software, and ideas<br className="desktop-break"/> worth exploring.</p>
      {projects.length ? <div className="project-grid">{projects.map((project,i) => <article className="project-card" key={project.id}><div className="project-art">{project.image ? <img src={project.image} alt="" loading="lazy"/> : <span aria-hidden="true">{String(i+1).padStart(2,'0')} / {project.title.slice(0,1)}</span>}</div><div className="project-meta"><span className="eyebrow">{project.category}</span><span className="eyebrow">{project.year}</span></div><h2>{project.href ? <a href={project.href} target="_blank" rel="noopener noreferrer">{project.title} ↗</a> : project.title}</h2><p>{project.description}</p><div className="project-tags">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div></article>)}</div> : <><div className="empty-intro"><span className="status-dot"/><p>A few projects are finding their way here.<br/><span className="muted">Check back soon.</span></p></div><div className="empty-grid" aria-hidden="true">{['01','02','03','04'].map(n => <div className="empty-slot" key={n}><span className="slot-number">{n}</span><div className="slot-orbit"/><span className="slot-caption">TO BE CONTINUED</span></div>)}</div></>}
    </main>}
    <footer className="site-footer"><nav className="social-links" aria-label="Social links">{social}</nav><div className="controls"><button onClick={() => setMode((mode + 1) % 3)} aria-label="Change universe palette">{['◉ PHOSPHOR', '◉ AMBER', '◉ ICE'][mode]}</button><button aria-pressed={paused} onClick={() => setPaused(!paused)} aria-label={paused ? 'Resume animation' : 'Pause animation'}>{paused ? '▶ RESUME' : 'Ⅱ PAUSE'}</button></div></footer>
  </div>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);

