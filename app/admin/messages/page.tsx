import { requireAdmin } from '@/lib/auth';
import { listMessages } from '@/lib/db';
import { ConfirmButton } from '../confirm-button';
import { markMessage, removeMessage } from '../actions';

const SERVICE: Record<string, string> = {
  unsure: 'Not sure yet',
  build: 'Build',
  intelligence: 'Intelligence',
  secure: 'Secure',
};

const fmt = (iso: string) =>
  new Date(iso.replace(' ', 'T') + 'Z').toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

const replyHref = (contact: string) =>
  /\S+@\S+\.\S+/.test(contact) ? `mailto:${contact}?subject=${encodeURIComponent('Your brief to Progrex')}` : null;

export default async function Inbox() {
  await requireAdmin();
  const messages = await listMessages();
  return (
    <>
      <div className="a-head">
        <div>
          <h1>Inbox</h1>
          <p>Briefs sent through the contact form on the site.</p>
        </div>
      </div>
      {messages.length === 0 ? (
        <div className="a-empty">
          <p>No messages yet. When someone sends a brief, it lands here.</p>
        </div>
      ) : (
        <ul className="a-messages">
          {messages.map((m) => {
            const reply = replyHref(m.contact);
            return (
              <li key={m.id} className={m.read ? '' : 'unread'}>
                <div className="m-head">
                  <div>
                    <b>{m.name}</b>
                    {m.company && <span> · {m.company}</span>}
                    <div className="a-sub">
                      {m.contact} · {SERVICE[m.service] ?? 'Not sure yet'}
                    </div>
                  </div>
                  <time>{fmt(m.createdAt)}</time>
                </div>
                <p>{m.idea}</p>
                <div className="m-actions">
                  {reply && (
                    <a className="a-btn a-btn-primary" href={reply}>
                      Reply by email
                    </a>
                  )}
                  <form action={markMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="read" value={m.read ? '0' : '1'} />
                    <button className="a-btn">{m.read ? 'Mark unread' : 'Mark read'}</button>
                  </form>
                  <form action={removeMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <ConfirmButton message="Delete this message? This cannot be undone." className="a-btn danger">
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
