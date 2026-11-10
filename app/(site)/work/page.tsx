import type { Metadata } from 'next';
import Link from 'next/link';
import { ProjectCard } from '@/components/site/project-card';
import { listProjects } from '@/lib/db';
import { disciplineLabel, t } from '@/lib/i18n';
import { getDict } from '@/lib/lang';
import { DISCIPLINES, type Discipline } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Work' };

type Filter = 'all' | Discipline | 'lab';

export default async function WorkArchive({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { lang, d } = await getDict();
  const { d: q } = await searchParams;
  const filter: Filter = q === 'lab' || (DISCIPLINES as readonly string[]).includes(q ?? '') ? (q as Filter) : 'all';
  const all = await listProjects();
  const shown = all.filter((p) =>
    filter === 'all' ? true : filter === 'lab' ? p.type === 'lab' : p.disciplines.includes(filter),
  );
  const count = (f: Filter) =>
    f === 'all'
      ? all.length
      : f === 'lab'
        ? all.filter((p) => p.type === 'lab').length
        : all.filter((p) => p.disciplines.includes(f)).length;

  const chips: { key: Filter; label: string }[] = [
    { key: 'all', label: d.archive.all },
    ...DISCIPLINES.map((k) => ({ key: k as Filter, label: t(disciplineLabel, k, lang) })),
    { key: 'lab', label: d.archive.lab },
  ];

  return (
    <section className="archive">
      <div className="archive-head">
        <span className="kicker">{d.archive.count(all.length)}</span>
        <h1>{d.archive.title}</h1>
        <p>{d.archive.body}</p>
      </div>
      <nav className="chips" aria-label="Filter">
        {chips.map((c) => (
          <Link
            key={c.key}
            href={c.key === 'all' ? '/work' : `/work?d=${c.key}`}
            className={filter === c.key ? 'chip is-active' : 'chip'}
            aria-current={filter === c.key ? 'page' : undefined}
            scroll={false}
          >
            {c.label}
            <sup>{count(c.key)}</sup>
          </Link>
        ))}
      </nav>
      {shown.length ? (
        <div className="card-grid">
          {shown.map((p) => (
            <ProjectCard key={p.id} project={p} index={all.indexOf(p) + 1} lang={lang} />
          ))}
        </div>
      ) : (
        <p className="empty">{d.archive.empty}</p>
      )}
    </section>
  );
}
