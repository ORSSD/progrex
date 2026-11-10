import { adminHref } from '@/lib/admin-path';
import { requireAdmin } from '@/lib/auth';
import { ProjectForm } from '../project-form';

export default async function NewProject() {
  await requireAdmin();
  return <ProjectForm base={adminHref()} />;
}
