import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { ProjectVisual } from '@/components/site/project-visual';
import { listProjects } from '@/lib/db';
import { disciplineLabel, statusLabel, t } from '@/lib/i18n';
import { getDict } from '@/lib/lang';
import { localize } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await getDict();
  const p = (await listProjects()).find((x) => x.slug === slug);
  if (!p) return { title: 'Not found' };
  const c = localize(p, lang);
  return {
    title: c.title,
    description: c.summary,
    openGraph: { title: c.title, description: c.summary, images: p.coverKey ? [`/media/${p.coverKey}`] : undefined },
  };
}

export default async function CaseStudy({ params }: Props) {
  const { slug } = await params;
  const { lang, d } = await getDict();
  const all = await listProjects();
  const i = all.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = all[i];
  const c = localize(p, lang);
  const next = all.length > 1 ? all[(i + 1) % all.length] : null;
  const nextC = next ? localize(next, lang) : null;
  const n = String(i + 1).padStart(2, '0');

  return (
    <article className="case">
      <section className="case-hero">
        <Link href="/work" className="back-link">
          <ArrowLeft className="flip-rtl" /> {d.allWork}
        </Link>
        <div className="case-kicker">
          <span>
            {d.caseStudy} / {n}
          </span>
          <span className={`status status-${p.status}`}>{t(statusLabel, p.status, lang)}</span>
        </div>
        <h1 data-reveal>{c.title}</h1>
        <p className="case-intro" data-reveal>
          {c.intro || c.summary}
        </p>
        <dl className="case-facts-row">
          {p.client && (
            <div>
              <dt>{d.client}</dt>
              <dd>{p.client}</dd>
            </div>
          )}
          {p.year && (
            <div>
              <dt>{d.year}</dt>
              <dd>{p.year}</dd>
            </div>
          )}
          {p.disciplines.length > 0 && (
            <div>
              <dt>{d.disciplinesLabel}</dt>
              <dd>{p.disciplines.map((x) => t(disciplineLabel, x, lang)).join(' · ')}</dd>
            </div>
          )}
          {(p.liveUrl || p.repoUrl) && (
            <div className="case-links">
              {p.liveUrl && (
                <a href={p.liveUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                  {d.visitLive} <ArrowUpRight />
                </a>
              )}
              {p.repoUrl && (
                <a href={p.repoUrl} target="_blank" rel="noreferrer" className="btn">
                  {d.viewRepo} <ArrowUpRight />
                </a>
              )}
            </div>
          )}
        </dl>
      </section>

      <div className="case-visual" data-reveal>
        <ProjectVisual project={p} content={c} index={i + 1} />
      </div>

      {c.question && (
        <section className="case-question">
          <span className="kicker">{d.theQuestion}</span>
          <h2 data-reveal>{c.question}</h2>
        </section>
      )}

      {c.facts.length > 0 && (
        <section className="case-built">
          <span className="kicker">{d.whatWeBuilt}</span>
          <div>
            {c.facts.map((x, k) => (
              <p key={k} data-reveal>
                <b>{String(k + 1).padStart(2, '0')}</b>
                {x}
              </p>
            ))}
          </div>
        </section>
      )}

      {c.flow.length > 0 && (
        <section className="case-flow">
          <span className="kicker">{d.systemFlow}</span>
          <ol style={{ '--steps': c.flow.length } as React.CSSProperties}>
            {c.flow.map((x, k) => (
              <li key={k} data-reveal style={{ '--d': k } as React.CSSProperties}>
                <b>{String(k + 1).padStart(2, '0')}</b>
                <strong>{x}</strong>
              </li>
            ))}
          </ol>
        </section>
      )}

      {(c.metrics.length > 0 || p.stack.length > 0) && (
        <section className="case-outcomes">
          {c.metrics.length > 0 && (
            <div>
              <span className="kicker">{d.outcomes}</span>
              <dl className="metrics">
                {c.metrics.map((m, k) => (
                  <div key={k} data-reveal>
                    <dd>{m.value}</dd>
                    <dt>{m.label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {p.stack.length > 0 && (
            <div>
              <span className="kicker">{d.stack}</span>
              <ul className="stack">
                {p.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="case-note">
        {c.note && <p data-reveal>{c.note}</p>}
        {next && nextC && (
          <Link href={`/work/${next.slug}`} className="next-project">
            <span className="kicker">{d.next}</span>
            <strong>{nextC.title}</strong>
            <ArrowUpRight />
          </Link>
        )}
      </section>

      <section className="case-cta">
        <h2 data-reveal>
          {d.caseCta[0]}
          <br />
          <em>{d.caseCta[1]}</em>
        </h2>
        <Link href="/#contact" className="btn btn-primary">
          {d.start} <ArrowUpRight />
        </Link>
      </section>
    </article>
  );
}
