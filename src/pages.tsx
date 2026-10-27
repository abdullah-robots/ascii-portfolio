import type { Ref } from 'react';
import { projects, type Project } from './projects';

type PageProps = { heading: Ref<HTMLHeadingElement> };

export function HomePage({ heading }: PageProps) {
  return (
    <main id="content" className="home-content">
      <h1 ref={heading} tabIndex={-1} className="sr-only">
        Abdullah
      </h1>
      <div className="home-intro">
        <div className="home-links">
          <a className="primary-link" href="#/about">
            A little about me <span>↗</span>
          </a>
          <a className="text-link" href="#/projects">
            Explore my work <span>→</span>
          </a>
        </div>
      </div>
    </main>
  );
}

export function AboutPage({ heading }: PageProps) {
  return (
    <main id="content" className="page-content">
      <div className="page-topline">
        <span className="eyebrow">01 / ABOUT</span>
        <span className="eyebrow muted">THE PERSON BEHIND THE PIXELS</span>
      </div>
      <h1 ref={heading} tabIndex={-1}>
        Hi, I’m Abdullah<span className="accent">.</span>
      </h1>
      <p className="page-lead">
        I build software that brings
        <br className="desktop-break" /> robots into the real world.
      </p>
      <div className="about-layout">
        <div className="about-story">
          <div className="focus-list" aria-label="Areas of focus">
            <span>Robotics</span>
            <span>Control systems</span>
            <span>Computer vision</span>
            <span>Language-agnostic</span>
          </div>
          <a className="primary-link" href="#/projects">
            Explore my work <span>→</span>
          </a>
        </div>
        <aside className="about-facts">
          <div className="fact">
            <span className="eyebrow">NOW</span>
            <p>Oxford Robotics Institute</p>
            <small>Robotics Software Engineer · 2026–present</small>
          </div>
          <div className="fact">
            <span className="eyebrow">BEFORE</span>
            <p>UK Atomic Energy Authority</p>
            <small>Control Systems Engineer · 2024–2026</small>
          </div>
          <div className="fact">
            <span className="eyebrow">FOUNDATIONS</span>
            <p>Physics → Robotics</p>
            <small>
              BSc Physics · Royal Holloway
              <br />
              MSc Computer Vision, Robotics & ML · Surrey
            </small>
          </div>
        </aside>
      </div>
      <div className="page-closing">
        <p>Always curious about what comes next.</p>
      </div>
    </main>
  );
}

export function ProjectsPage({ heading }: PageProps) {
  return (
    <main id="content" className="page-content projects-content">
      <div className="page-topline">
        <span className="eyebrow">02 / PROJECTS</span>
        <span className="eyebrow muted">
          {String(projects.length).padStart(2, '0')} PUBLISHED
        </span>
      </div>
      <h1 ref={heading} tabIndex={-1}>
        Things I’ve built<span className="accent">.</span>
      </h1>
      <p className="page-lead">
        Robotics, software, and ideas
        <br className="desktop-break" /> worth exploring.
      </p>
      {projects.length ? (
        <div className="project-grid">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      ) : (
        <>
          <div className="empty-intro">
            <span className="status-dot" />
            <p>
              A few projects are finding their way here.
              <br />
              <span className="muted">Check back soon.</span>
            </p>
          </div>
          <div className="empty-grid" aria-hidden="true">
            {['01', '02', '03', '04'].map((n) => (
              <div className="empty-slot" key={n}>
                <span className="slot-number">{n}</span>
                <div className="slot-orbit" />
                <span className="slot-caption">TO BE CONTINUED</span>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <article className="project-card">
      <div className="project-art">
        {project.image ? (
          <img src={project.image} alt="" loading="lazy" />
        ) : (
          <span aria-hidden="true">
            {String(index + 1).padStart(2, '0')} / {project.title.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="project-meta">
        <span className="eyebrow">{project.category}</span>
        <span className="eyebrow">{project.year}</span>
      </div>
      <h2>
        {project.href ? (
          <a href={project.href} target="_blank" rel="noopener noreferrer">
            {project.title} ↗
          </a>
        ) : (
          project.title
        )}
      </h2>
      <p>{project.description}</p>
      <div className="project-tags">
        {project.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
    </article>
  );
}
