import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
const sans=Geist({variable:'--font-sans',subsets:['latin']});const mono=Geist_Mono({variable:'--font-mono',subsets:['latin']});
export const metadata:Metadata={title:'Progrex — Technology Studio',description:'We build what does not come with a template. Intelligent, secure digital products engineered around complex problems.',openGraph:{title:'Progrex — Technology Studio',description:'We build what does not come with a template.',type:'website'},twitter:{card:'summary_large_image',title:'Progrex — Technology Studio',description:'We build what does not come with a template.'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>}
