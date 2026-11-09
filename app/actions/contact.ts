'use server';

import { createMessage } from '@/lib/db';

export type ContactState = { status: 'idle' | 'sent' | 'error' };

const clean = (v: FormDataEntryValue | null, max: number) => (typeof v === 'string' ? v : '').trim().slice(0, max);

export async function submitContact(_prev: ContactState, form: FormData): Promise<ContactState> {
  // Honeypot: real people never see or fill this field.
  if (clean(form.get('website'), 200)) return { status: 'sent' };

  const name = clean(form.get('name'), 120);
  const contact = clean(form.get('contact'), 200);
  const idea = clean(form.get('idea'), 4000);
  if (!name || !contact || !idea) return { status: 'error' };

  await createMessage({
    name,
    contact,
    idea,
    company: clean(form.get('company'), 160),
    service: clean(form.get('service'), 40),
  });
  return { status: 'sent' };
}
