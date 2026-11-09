'use client';

import { useActionState } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { submitContact, type ContactState } from '@/app/actions/contact';
import { dict } from '@/lib/i18n';
import type { Lang } from '@/lib/types';

const SERVICE_KEYS = ['unsure', 'build', 'intelligence', 'secure'];

export function ContactForm({ lang }: { lang: Lang }) {
  const f = dict[lang].form;
  const [state, action, pending] = useActionState<ContactState, FormData>(submitContact, { status: 'idle' });

  if (state.status === 'sent') {
    return (
      <output className="form-sent">
        <Check />
        <span>{f.sent}</span>
      </output>
    );
  }

  return (
    <form action={action} className="contact-form">
      <div className="form-row">
        <label>
          {f.name}
          <input name="name" placeholder={f.namePh} required autoComplete="name" />
        </label>
        <label>
          {f.contact}
          <input name="contact" placeholder={f.contactPh} required autoComplete="email" />
        </label>
      </div>
      <label>
        {f.company}
        <input name="company" placeholder={f.companyPh} autoComplete="organization" />
      </label>
      <fieldset className="service-pick">
        <legend>{f.service}</legend>
        {f.services.map((s, i) => (
          <label key={SERVICE_KEYS[i]}>
            <input type="radio" name="service" value={SERVICE_KEYS[i]} defaultChecked={i === 0} />
            <span>{s}</span>
          </label>
        ))}
      </fieldset>
      <label>
        {f.idea}
        <textarea name="idea" placeholder={f.ideaPh} rows={4} required />
      </label>
      <label className="hp" aria-hidden>
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      {state.status === 'error' && (
        <p className="form-error" role="alert">
          {f.error}
        </p>
      )}
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? f.sending : f.send}
          <ArrowUpRight />
        </button>
        <a className="btn" href="mailto:hello@progrex.team">
          {f.email}
        </a>
      </div>
    </form>
  );
}
