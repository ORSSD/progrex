import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ContactForm } from '@/components/site/contact-form';
import { CountUp } from '@/components/site/count-up';
import { FeatureCard } from '@/components/site/project-card';
import { ScrollWords } from '@/components/site/scroll-words';
import { listProjects } from '@/lib/db';
import { getDict } from '@/lib/lang';
import { statusLabel, t } from '@/lib/i18n';
import { DISCIPLINES, localize, type Status } from '@/lib/types';

export const dynamic = 'force-dynamic';

const BUILDING: Status[] = ['in-development', 'prototype', 'pre-production'];

export default async function Home() {
  const { lang, d } = await getDict();
  const projects = await listProjects();
  const work = projects.filter((p) => p.type === 'work');
  const featured = work.filter((p) => p.featured);
  const shown = featured.length ? featured : work.slice(0, 3);
  const labs = projects.filter((p) => p.type === 'lab');
  const years = projects.map((p) => Number(p.year)).filter(Boolean);
  const [lo, hi] = [Math.min(...years), Math.max(...years)];
  const range = !years.length ? '' : lo === hi ? String(lo) : `${lo}—${hi}`;
  const building = projects.filter((p) => BUILDING.includes(p.status)).slice(0, 3);
  // The strongest number from each project: its last listed metric.
  const proof = work
    .flatMap((p) => {
      const c = localize(p, lang);
      const m = c.metrics.at(-1);
      return m ? [{ ...m, title: c.title, slug: p.slug }] : [];
    })
    .slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="hero-grid" aria-hidden />
        <img className="hero-x" src="/progrex-mark-mint-trim.png" alt="" aria-hidden />
        <div className="hero-top">
          <p className="eyebrow">
            <span className="pulse" aria-hidden />
            {d.eyebrow} / {new Date().getFullYear()}
          </p>
          {building.length > 0 && (
            <p className="now-building">
              <span>{d.nowBuilding}</span>
              {building.map((p) => (
                <Link key={p.id} href={`/work/${p.slug}`}>
                  {localize(p, lang).title}
                </Link>
              ))}
            </p>
          )}
        </div>
        <h1 className="hero-title">
          {d.hero.map((line, i) => (
            <span key={i} className="line" style={{ '--i': i } as React.CSSProperties}>
              {line}
              {i === d.hero.length - 1 && (
                <>
                  {' '}
                  <em>{d.heroEm}</em>
                </>
              )}
            </span>
          ))}
        </h1>
        <div className="hero-bottom">
          <p>{d.support}</p>
          <div className="cta-row">
            <a className="btn" href="#work">
              {d.explore}
              <ArrowDownRight />
            </a>
            <a className="btn btn-primary" href="#contact">
              {d.start}
              <ArrowUpRight />
            </a>
          </div>
        </div>
        <dl className="stats">
          <div>
            <dt>{d.stats.projects}</dt>
            <dd>
              <CountUp value={projects.length} />
            </dd>
          </div>
          <div>
            <dt>{d.stats.disciplines}</dt>
            <dd>
              <CountUp value={DISCIPLINES.length} />
            </dd>
          </div>
          <div>
            <dt>{d.stats.languages}</dt>
            <dd>EN / ع</dd>
          </div>
        </dl>
      </section>

      <section className="problem">
        <span className="kicker">01 / {d.approach}</span>
        <div className="problem-body">
          <h2 data-reveal>{d.problem}</h2>
          <ScrollWords text={d.manifesto} className="manifesto" />
          <div className="paths">
            {d.paths.map(([h, b], i) => (
              <div key={h} data-reveal style={{ '--d': i } as React.CSSProperties}>
                <b>{(lang === 'ar' ? ['أ', 'ب'] : ['A', 'B'])[i]}</b>
                <h3>{h}</h3>
                <p>{b}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="cross-lines" aria-hidden>
          <i />
          <i />
        </div>
      </section>

      <section id="work" className="work">
        <div className="section-head" data-reveal>
          <span>02</span>
          <h2>{d.selected}</h2>
          <p>
            {d.selectedBody}
            {range && <span className="range">{range}</span>}
          </p>
        </div>
        {shown.map((p, i) => (
          <FeatureCard key={p.id} project={p} index={i + 1} lang={lang} />
        ))}
        <Link href="/work" className="all-work" data-reveal>
          <span>{d.allWork}</span>
          <span className="count">{d.archive.count(projects.length)}</span>
          <ArrowUpRight />
        </Link>
      </section>

      {proof.length > 0 && (
        <section className="proof" aria-labelledby="proof-title">
          <div className="proof-head" data-reveal>
            <h2 id="proof-title">{d.proofTitle}</h2>
            <p>{d.proofBody}</p>
          </div>
          <dl className="proof-grid">
            {proof.map((m, i) => (
              <div key={m.slug} data-reveal style={{ '--d': i } as React.CSSProperties}>
                <dd>{m.value}</dd>
                <dt>{m.label}</dt>
                <Link href={`/work/${m.slug}`}>
                  {m.title} <ArrowUpRight />
                </Link>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section id="capabilities" className="capabilities">
        <div className="section-head" data-reveal>
          <span>03</span>
          <h2>{d.capabilities}</h2>
          <p>{d.capabilitiesBody}</p>
        </div>
        <div className="cap-list">
          {d.caps.map(([title, lead, services], i) => {
            const key = DISCIPLINES[i];
            const related = projects.filter((p) => p.disciplines.includes(key));
            return (
              <article key={title} className="cap" data-reveal>
                <span className="cap-no">0{i + 1}</span>
                <h3>{title}</h3>
                <div className="cap-body">
                  <p className="cap-lead">{lead}</p>
                  <ul className="cap-services">
                    {services.split(' · ').map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                  {related.length > 0 && (
                    <p className="cap-seen">
                      <span>{d.seenIn}</span>
                      {related.slice(0, 3).map((p) => (
                        <Link key={p.id} href={`/work/${p.slug}`}>
                          {localize(p, lang).title}
                        </Link>
                      ))}
                    </p>
                  )}
                </div>
                <Link href={`/work?d=${key}`} className="cap-link">
                  {d.archive.count(related.length)} <ArrowUpRight />
                </Link>
              </article>
            );
          })}
        </div>
        <h3 className="process-title" data-reveal>
          {d.processTitle}
        </h3>
        <ol className="process">
          {d.process.map(([step, body], i) => (
            <li key={step} data-reveal style={{ '--d': i } as React.CSSProperties}>
              <b>{String(i + 1).padStart(2, '0')}</b>
              <strong>{step}</strong>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {labs.length > 0 && (
        <section id="labs" className="labs">
          <div className="section-head" data-reveal>
            <span>04</span>
            <h2>{d.labs}</h2>
            <p>{d.labsBody}</p>
          </div>
          <div className="lab-row">
            {labs.map((p, i) => {
              const c = localize(p, lang);
              return (
                <Link key={p.id} href={`/work/${p.slug}`} className="lab" data-reveal style={{ '--d': i } as React.CSSProperties}>
                  <span className="lab-status">{t(statusLabel, p.status, lang)}</span>
                  <h3>{c.title}</h3>
                  <p>{c.summary}</p>
                  <ArrowUpRight className="arrow" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section id="studio" className="studio">
        <span className="kicker">05 / {d.nav.studio}</span>
        <h2 data-reveal>{d.studio}</h2>
        <p data-reveal>{d.studioBody}</p>
        <div className="principles">
          {d.principles.map(([h, b], i) => (
            <div key={h} data-reveal style={{ '--d': i } as React.CSSProperties}>
              <b>0{i + 1}</b>
              <h3>{h}</h3>
              <p>{b}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="marquee" aria-hidden>
        <div>
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i}>
              AI <b>×</b> SOFTWARE <b>×</b> SECURITY <b>×</b> ENGINEERING <b>×</b>{' '}
            </span>
          ))}
        </div>
      </div>

      <section id="contact" className="contact">
        <div>
          <span className="kicker">06 / {d.contactKicker}</span>
          <h2 data-reveal>
            {d.contactTitle[0]}
            <br />
            <em>{d.contactTitle[1]}</em>
          </h2>
          <div className="next-steps" data-reveal>
            <span className="kicker">{d.nextTitle}</span>
            <ol>
              {d.nextSteps.map((s, i) => (
                <li key={s}>
                  <b>{String(i + 1).padStart(2, '0')}</b>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <ContactForm lang={lang} />
      </section>
    </>
  );
}
