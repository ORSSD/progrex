import { notFound, redirect } from 'next/navigation';

/** Pretty URLs like /contact jump to that section of the home page. */
const sections = ['capabilities', 'labs', 'studio', 'contact'];

export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section)) notFound();
  redirect(`/#${section}`);
}
