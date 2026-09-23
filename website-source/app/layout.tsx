import type { Metadata } from 'next';
import './globals.css';
import './minimal.css';
const title = 'He “Albert” Zhang | Human-Centered AI & HCI';
const description =
  'He Albert Zhang is a Ph.D. candidate at Penn State studying human-centered AI, qualitative research, trust, accessibility, and multimodal systems. Explore his research, publications, and academic background.';
export const metadata: Metadata = {
  metadataBase: new URL('https://he-zhang.com'),
  title,
  description,
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.svg' },
  openGraph: { title, description, url: '/', type: 'website', locale: 'en_US' },
  twitter: { card: 'summary', title, description },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
