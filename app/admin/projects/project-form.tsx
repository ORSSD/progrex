'use client';

import Link from 'next/link';
import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import { ProjectVisual } from '@/components/site/project-visual';
import { disciplineLabel, statusLabel } from '@/lib/i18n';
import { DISCIPLINES, STATUSES, emptyContent, type Project, type ProjectContent, type Visual } from '@/lib/types';
import { saveProject, type SaveState } from '../actions';

const VISUAL_OPTIONS: { value: Visual; label: string; hint: string }[] = [
  { value: 'system', label: 'Generated', hint: 'Built from the title, flow steps and stack.' },
  { value: 'image', label: 'Cover image', hint: 'Upload a screenshot or photo.' },
  { value: 'agri', label: 'Agri device', hint: 'Original artwork' },
  { value: 'legal', label: 'Legal sources', hint: 'Original artwork' },
  { value: 'blue', label: 'Incident timeline', hint: 'Original artwork' },
];

const blankProject = (): Project => ({
  id: 0,
  slug: '',
  type: 'work',
  status: 'in-development',
  disciplines: [],
  year: String(new Date().getFullYear()),
  client: '',
  visual: 'system',
  coverKey: null,
  stack: [],
  liveUrl: '',
  repoUrl: '',
  featured: false,
  published: false,
  sort: 0,
  en: emptyContent(),
  ar: emptyContent(),
  createdAt: '',
  updatedAt: '',
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .slice(0, 80);

function ContentFields({ lang, c }: { lang: 'en' | 'ar'; c: ProjectContent }) {
  const rtl = lang === 'ar';
  const dir = rtl ? 'rtl' : 'ltr';
  const n = (k: string) => `${lang}.${k}`;
  return (
    <div className={`a-lang a-lang-${lang}`}>
      <h3>{rtl ? 'Arabic · العربية' : 'English'}</h3>
      {rtl && <p className="a-hint">Optional. Any empty field falls back to English.</p>}
      <label>
        Title {!rtl && <b className="req">required</b>}
        <input name={n('title')} defaultValue={c.title} dir={dir} required={!rtl} />
      </label>
      <label>
        One-line summary <span>shown on cards</span>
        <input name={n('summary')} defaultValue={c.summary} dir={dir} />
      </label>
      <label>
        Intro <span>first paragraph of the case study</span>
        <textarea name={n('intro')} defaultValue={c.intro} dir={dir} rows={3} />
      </label>
      <label>
        The question <span>the problem, phrased as a question</span>
        <textarea name={n('question')} defaultValue={c.question} dir={dir} rows={2} />
      </label>
      <label>
        What we built <span>one item per line</span>
        <textarea name={n('facts')} defaultValue={c.facts.join('\n')} dir={dir} rows={5} />
      </label>
      <label>
        System flow <span>one step per line, up to 8</span>
        <textarea name={n('flow')} defaultValue={c.flow.join('\n')} dir={dir} rows={5} />
      </label>
      <label>
        Outcomes <span>one per line: value | label — e.g. “16/16 | acceptance checks”</span>
        <textarea
          name={n('metrics')}
          defaultValue={c.metrics.map((m) => `${m.value} | ${m.label}`).join('\n')}
          dir={dir}
          rows={3}
        />
      </label>
      <label>
        Closing note
        <textarea name={n('note')} defaultValue={c.note} dir={dir} rows={2} />
      </label>
    </div>
  );
}

export function ProjectForm({ project, base }: { project?: Project; base: string }) {
  const p = project ?? blankProject();
  const isNew = !project;
  const [state, action, pending] = useActionState<SaveState, FormData>(saveProject, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<Project>(p);
  const [coverUrl, setCoverUrl] = useState<string | null>(p.coverKey ? `/media/${p.coverKey}` : null);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const slugRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (coverUrl?.startsWith('blob:')) URL.revokeObjectURL(coverUrl);
  }, [coverUrl]);

  // Keep the live preview in sync with the form as the user types.
  const sync = () => {
    const f = new FormData(formRef.current!);
    const g = (k: string) => { const v = f.get(k); return typeof v === 'string' ? v : ''; };
    const lines = (k: string) =>
      g(k)
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean);
    if (!slugTouched && slugRef.current) slugRef.current.value = slugify(g('en.title'));
    setPreview({
      ...p,
      slug: slugRef.current?.value || 'new-project',
      visual: (g('visual') as Visual) || 'system',
      disciplines: f.getAll('disciplines') as Project['disciplines'],
      stack: g('stack')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      en: { ...p.en, title: g('en.title') || 'Untitled project', summary: g('en.summary'), flow: lines('en.flow') },
    });
  };

  const onCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUrl(URL.createObjectURL(file));
    const radio = formRef.current?.querySelector<HTMLInputElement>('input[name="visual"][value="image"]');
    if (radio) radio.checked = true;
    sync();
  };

  return (
    <form
      ref={formRef}
      // Submit manually so React does not reset the form: a failed save must keep what was typed.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      onInput={sync}
      className="a-form"
    >
      <input type="hidden" name="id" value={p.id || ''} />

      <div className="a-head sticky">
        <div>
          <Link href={base} className="a-back">
            ← Projects
          </Link>
          <h1>{isNew ? 'New project' : p.en.title}</h1>
        </div>
        <div className="a-head-actions">
          {!isNew && p.published && (
            <Link href={`/work/${p.slug}`} target="_blank" className="a-btn">
              View live ↗
            </Link>
          )}
          <button className="a-btn a-btn-primary" disabled={pending}>
            {pending ? 'Saving…' : isNew ? 'Create project' : 'Save changes'}
          </button>
        </div>
      </div>

      {state.error && <p className="a-error">{state.error}</p>}

      <div className="a-grid">
        <div className="a-col">
          <fieldset className="a-card">
            <legend>Basics</legend>
            <div className="a-row">
              <label>
                URL slug <span>/work/…</span>
                <input
                  ref={slugRef}
                  name="slug"
                  defaultValue={p.slug}
                  placeholder="auto from title"
                  onChange={() => setSlugTouched(true)}
                  pattern="[a-z0-9-]*"
                />
              </label>
              <label>
                Year
                <input name="year" defaultValue={p.year} inputMode="numeric" maxLength={10} />
              </label>
            </div>
            <div className="a-row">
              <label>
                Kind
                <select name="type" defaultValue={p.type}>
                  <option value="work">Work — client or studio project</option>
                  <option value="lab">Lab — internal product / experiment</option>
                </select>
              </label>
              <label>
                Status
                <select name="status" defaultValue={p.status}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s][0]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="a-checks">
              <span>Disciplines</span>
              {DISCIPLINES.map((d) => (
                <label key={d} className="a-check">
                  <input type="checkbox" name="disciplines" value={d} defaultChecked={p.disciplines.includes(d)} />
                  {disciplineLabel[d][0]}
                </label>
              ))}
            </div>
            <label>
              Context / client <span>e.g. “Legal sector” — shown on the case study</span>
              <input name="client" defaultValue={p.client} />
            </label>
            <label>
              Stack <span>comma separated</span>
              <input name="stack" defaultValue={p.stack.join(', ')} placeholder="Next.js, Python, OpenSearch" />
            </label>
            <div className="a-row">
              <label>
                Live URL
                <input name="liveUrl" defaultValue={p.liveUrl} type="url" placeholder="https://" />
              </label>
              <label>
                Source / repo URL
                <input name="repoUrl" defaultValue={p.repoUrl} type="url" placeholder="https://" />
              </label>
            </div>
          </fieldset>

          <fieldset className="a-card">
            <legend>Content</legend>
            <div className="a-langs">
              <ContentFields lang="en" c={p.en} />
              <ContentFields lang="ar" c={p.ar} />
            </div>
          </fieldset>
        </div>

        <aside className="a-col a-side">
          <fieldset className="a-card">
            <legend>Visibility</legend>
            <label className="a-switch">
              <input type="checkbox" name="published" defaultChecked={p.published} />
              <span>
                <b>Published</b> Visible on the public site
              </span>
            </label>
            <label className="a-switch">
              <input type="checkbox" name="featured" defaultChecked={p.featured} />
              <span>
                <b>Featured</b> Large card on the home page (work only)
              </span>
            </label>
          </fieldset>

          <fieldset className="a-card">
            <legend>Artwork</legend>
            <div className="a-preview">
              <ProjectVisual
                project={{ ...preview, visual: preview.visual === 'image' && !coverUrl ? 'system' : preview.visual, coverKey: null }}
                content={preview.en}
                index={1}
                compact
              />
              {preview.visual === 'image' && coverUrl && <img src={coverUrl} alt="" className="a-cover" />}
            </div>
            <div className="a-visuals">
              {VISUAL_OPTIONS.map((v) => (
                <label key={v.value}>
                  <input type="radio" name="visual" value={v.value} defaultChecked={p.visual === v.value} />
                  <span>
                    <b>{v.label}</b>
                    {v.hint}
                  </span>
                </label>
              ))}
            </div>
            <label>
              Cover image <span>JPG, PNG, WebP, GIF or AVIF, up to 5 MB</span>
              <input type="file" name="cover" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={onCover} />
            </label>
            {p.coverKey && (
              <label className="a-check">
                <input type="checkbox" name="removeCover" /> Remove current cover image
              </label>
            )}
          </fieldset>
        </aside>
      </div>
    </form>
  );
}
