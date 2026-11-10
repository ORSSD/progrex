import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ContactForm } from '@/components/site/contact-form';
import { FeatureCard } from '@/components/site/project-card';
import { listProjects } from '@/lib/db';
import { getDict } from '@/lib/lang';
import { statusLabel, t } from '@/lib/i18n';
import { localize } from '@/lib/types';

export const dynamic = 'force-dynamic';

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

  return (
    <>
      <section className="hero">
        <div className="hero-grid" aria-hidden />
        <img className="hero-x" src="/progrex-mark-mint-trim.png" alt="" aria-hidden />
        <p className="eyebrow">
          <span className="pulse" aria-hidden />
          {d.eyebrow} / {new Date().getFullYear()}
        </p>
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
            <dd>{String(projects.length).padStart(2, '0')}</dd>
          </div>
          <div>
            <dt>{d.stats.disciplines}</dt>
            <dd>03</dd>
          </div>
          <div>
            <dt>{d.stats.languages}</dt>
            <dd>EN / ع</dd>
          </div>
        </dl>
      </section>

      <section className="problem">
        <span className="kicker">01 / {d.approach}</span>
        <h2 data-reveal>{d.problem}</h2>
        <p data-reveal>
          {d.problemBody[0]}
          <br />
          {d.problemBody[1]}
        </p>
        <div className="cross-lines" aria-hidden>
          <i />
          <i />
        </div>
      </section>

      <section id="work" className="work">
        <div className="section-head" data-reveal>
          <span>02</span>
          <h2>{d.selected}</h2>
          <p>{range}</p>
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

      <section id="capabilities" className="capabilities">
        <div className="section-head" data-reveal>
          <span>03</span>
          <h2>{d.capabilities}</h2>
        </div>
        <div className="cap-grid">
          {d.caps.map(([title, body], i) => {
            const key = (['build', 'intelligence', 'secure'] as const)[i];
            const n = projects.filter((p) => p.disciplines.includes(key)).length;
            return (
              <div key={title} data-reveal style={{ '--d': i } as React.CSSProperties}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
                <Link href={`/work?d=${key}`} className="cap-link">
                  {d.archive.count(n)} <ArrowUpRight />
                </Link>
              </div>
            );
          })}
        </div>
        <ol className="process">
          {d.process.map((x, i) => (
            <li key={x} data-reveal style={{ '--d': i } as React.CSSProperties}>
              <b>{String(i + 1).padStart(2, '0')}</b>
              {x}
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
        </div>
        <ContactForm lang={lang} />
      </section>
    </>
  );
}
