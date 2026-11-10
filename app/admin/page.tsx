import { adminHref } from '@/lib/admin-path';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { listMessages, listProjects } from '@/lib/db';
import { statusLabel } from '@/lib/i18n';
import { ConfirmButton } from './confirm-button';
import { move, removeProject, toggleFlag } from './actions';

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { saved } = await searchParams;
  const [projects, messages] = await Promise.all([listProjects({ includeDrafts: true }), listMessages()]);
  const live = projects.filter((p) => p.published).length;
  const unread = messages.filter((m) => !m.read).length;

  return (
    <>
      <div className="a-head">
        <div>
          <h1>Projects</h1>
          <p>Everything here appears on the public site the moment it is published. Order here is the order on the site.</p>
        </div>
        <Link href={adminHref('/projects/new')} className="a-btn a-btn-primary">
          + New project
        </Link>
      </div>

      {saved && (
        <p className="a-flash">
          Saved. <Link href={`/work/${saved}`} target="_blank">View /work/{saved} ↗</Link>
        </p>
      )}

      <dl className="a-stats">
        <div>
          <dt>Published</dt>
          <dd>{live}</dd>
        </div>
        <div>
          <dt>Drafts</dt>
          <dd>{projects.length - live}</dd>
        </div>
        <div>
          <dt>Featured on home</dt>
          <dd>{projects.filter((p) => p.featured && p.published).length}</dd>
        </div>
        <div>
          <dt>Unread messages</dt>
          <dd>
            <Link href={adminHref('/messages')}>{unread}</Link>
          </dd>
        </div>
      </dl>

      {projects.length === 0 ? (
        <div className="a-empty">
          <p>No projects yet.</p>
          <Link href={adminHref('/projects/new')} className="a-btn a-btn-primary">
            Add your first project
          </Link>
        </div>
      ) : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Project</th>
                <th>Type</th>
                <th>Status</th>
                <th>Published</th>
                <th>Featured</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr key={p.id} className={p.published ? '' : 'is-draft'}>
                  <td className="order">
                    {(['up', 'down'] as const).map((dir) => (
                      <form action={move} key={dir}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="dir" value={dir} />
                        <button
                          disabled={dir === 'up' ? i === 0 : i === projects.length - 1}
                          aria-label={dir === 'up' ? 'Move up' : 'Move down'}
                        >
                          {dir === 'up' ? '↑' : '↓'}
                        </button>
                      </form>
                    ))}
                  </td>
                  <td>
                    <Link href={adminHref(`/projects/${p.id}`)} className="a-title">
                      {p.en.title}
                    </Link>
                    <span className="a-sub">
                      /work/{p.slug} {!p.ar.title && <em className="a-warn">· no Arabic yet</em>}
                    </span>
                  </td>
                  <td>{p.type === 'lab' ? 'Lab' : 'Work'}</td>
                  <td>{statusLabel[p.status][0]}</td>
                  <td>
                    <form action={toggleFlag}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="flag" value="published" />
                      <input type="hidden" name="value" value={p.published ? '0' : '1'} />
                      <button className={`toggle${p.published ? ' on' : ''}`} aria-label="Toggle published">
                        <span />
                      </button>
                    </form>
                  </td>
                  <td>
                    <form action={toggleFlag}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="flag" value="featured" />
                      <input type="hidden" name="value" value={p.featured ? '0' : '1'} />
                      <button className={`toggle${p.featured ? ' on' : ''}`} aria-label="Toggle featured">
                        <span />
                      </button>
                    </form>
                  </td>
                  <td className="row-actions">
                    <Link href={adminHref(`/projects/${p.id}`)}>Edit</Link>
                    <form action={removeProject}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton message={`Delete “${p.en.title}”? This cannot be undone.`} className="danger">
                        Delete
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
