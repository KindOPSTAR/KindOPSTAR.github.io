import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'He “Albert” Zhang | Human-Centered AI & HCI',description:'He Albert Zhang is a Ph.D. candidate at Penn State studying human-centered AI, qualitative research, trust, accessibility, and multimodal systems.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
