export type Lang = 'en' | 'ar';

export const DISCIPLINES = ['build', 'intelligence', 'secure'] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const STATUSES = [
  'concept',
  'in-development',
  'prototype',
  'pre-production',
  'live',
  'completed',
] as const;
export type Status = (typeof STATUSES)[number];

/** Built-in artwork styles. `system` is generated from the project's own data. */
export const VISUALS = ['system', 'image', 'agri', 'legal', 'blue'] as const;
export type Visual = (typeof VISUALS)[number];

export const TYPES = ['work', 'lab'] as const;
export type ProjectType = (typeof TYPES)[number];

export type Metric = { value: string; label: string };

/** Everything a visitor reads, stored once per language. */
export type ProjectContent = {
  title: string;
  summary: string;
  intro: string;
  question: string;
  facts: string[];
  flow: string[];
  metrics: Metric[];
  note: string;
};

export type Project = {
  id: number;
  slug: string;
  type: ProjectType;
  status: Status;
  disciplines: Discipline[];
  year: string;
  client: string;
  visual: Visual;
  coverKey: string | null;
  stack: string[];
  liveUrl: string;
  repoUrl: string;
  featured: boolean;
  published: boolean;
  sort: number;
  en: ProjectContent;
  ar: ProjectContent;
  createdAt: string;
  updatedAt: string;
};

export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

export type Message = {
  id: number;
  name: string;
  contact: string;
  company: string;
  service: string;
  idea: string;
  read: boolean;
  createdAt: string;
};

export const emptyContent = (): ProjectContent => ({
  title: '',
  summary: '',
  intro: '',
  question: '',
  facts: [],
  flow: [],
  metrics: [],
  note: '',
});

/** Arabic falls back to English field by field, so a half-translated project still reads well. */
export function localize(p: Project, lang: Lang): ProjectContent {
  if (lang === 'en') return p.en;
  const ar = p.ar;
  const en = p.en;
  return {
    title: ar.title || en.title,
    summary: ar.summary || en.summary,
    intro: ar.intro || en.intro,
    question: ar.question || en.question,
    facts: ar.facts.length ? ar.facts : en.facts,
    flow: ar.flow.length ? ar.flow : en.flow,
    metrics: ar.metrics.length ? ar.metrics : en.metrics,
    note: ar.note || en.note,
  };
}
