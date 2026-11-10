import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ProjectVisual } from './project-visual';
import { dict, disciplineLabel, statusLabel, t } from '@/lib/i18n';
import { localize, type Lang, type Project } from '@/lib/types';

/** Large, full-width card used for featured work on the home page. */
export function FeatureCard({ project, index, lang }: { project: Project; index: number; lang: Lang }) {
  const c = localize(project, lang);
  const metric = c.metrics.at(-1);
  return (
    <article className="feature" data-reveal>
      <div className="feature-meta">
        <span>{String(index).padStart(2, '0')}</span>
        <span className="tags">
          {project.disciplines.map((d) => (
            <span key={d}>{t(disciplineLabel, d, lang)}</span>
          ))}
        </span>
        <span className={`status status-${project.status}`}>{t(statusLabel, project.status, lang)}</span>
      </div>
      <Link href={`/work/${project.slug}`} className="feature-link" data-cursor>
        <div className="feature-visual">
          <ProjectVisual project={project} content={c} index={index} />
          <span className="view-pill" aria-hidden>
            {dict[lang].viewCase}
            <ArrowUpRight />
          </span>
        </div>
        <div className="feature-title">
          <h3>{c.title}</h3>
          <p>{c.summary}</p>
          {metric ? (
            <div className="feature-metric">
              <b>{metric.value}</b>
              <span>{metric.label}</span>
            </div>
          ) : (
            <span />
          )}
          <ArrowUpRight className="arrow" />
        </div>
      </Link>
    </article>
  );
}

/** Compact card used in the archive grid and the labs row. */
export function ProjectCard({ project, index, lang }: { project: Project; index: number; lang: Lang }) {
  const c = localize(project, lang);
  return (
    <article className="card" data-reveal>
      <Link href={`/work/${project.slug}`}>
        <ProjectVisual project={project} content={c} index={index} compact />
        <div className="card-body">
          <div className="card-meta">
            <span className={`status status-${project.status}`}>{t(statusLabel, project.status, lang)}</span>
            <span>{project.year}</span>
          </div>
          <h3>{c.title}</h3>
          <p>{c.summary}</p>
          <ArrowUpRight className="arrow" />
        </div>
      </Link>
    </article>
  );
}
