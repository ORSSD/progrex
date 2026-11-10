'use server';

import { createMessage, rateBlockedFor, rateRecord } from '@/lib/db';
import { clientIp, securityLog } from '@/lib/request';

export type ContactState = { status: 'idle' | 'sent' | 'error' | 'limited' };

// At most 5 briefs per IP per hour keeps bots from flooding the inbox.
const CONTACT_MAX = 5;
const CONTACT_WINDOW = 60 * 60;

const clean = (v: FormDataEntryValue | null, max: number) => (typeof v === 'string' ? v : '').trim().slice(0, max);

export async function submitContact(_prev: ContactState, form: FormData): Promise<ContactState> {
  // Honeypot: real people never see or fill this field.
  if (clean(form.get('website'), 200)) return { status: 'sent' };

  const name = clean(form.get('name'), 120);
  const contact = clean(form.get('contact'), 200);
  const idea = clean(form.get('idea'), 4000);
  if (!name || !contact || !idea) return { status: 'error' };

  const ip = await clientIp();
  if (await rateBlockedFor('contact', ip, CONTACT_MAX, CONTACT_WINDOW)) {
    securityLog('contact.limited', { ip });
    return { status: 'limited' };
  }
  await rateRecord('contact', ip);

  await createMessage({
    name,
    contact,
    idea,
    company: clean(form.get('company'), 160),
    service: clean(form.get('service'), 40),
  });
  return { status: 'sent' };
}
