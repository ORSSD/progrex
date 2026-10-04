import Link from 'next/link';
import { redirect } from 'next/navigation';
const sections=['work','capabilities','labs','studio','contact'];
export function generateStaticParams(){return sections.map(section=>({section}))}
export default async function Section({params}:{params:Promise<{section:string}>}){const{section}=await params;if(!sections.includes(section))return <main className="redirect-page"><h1>Nothing here.</h1><Link href="/">Return to Progrex</Link></main>;redirect(`/#${section}`)}
