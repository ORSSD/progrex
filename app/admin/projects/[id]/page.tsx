import { notFound } from 'next/navigation';
import { adminHref } from '@/lib/admin-path';
import { requireAdmin } from '@/lib/auth';
import { getProjectById } from '@/lib/db';
import { ProjectForm } from '../project-form';

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const project = await getProjectById(Number(id));
  if (!project) notFound();
  return <ProjectForm project={project} base={adminHref()} />;
}
