import type { Metadata } from 'next';
import './globals.css';
import { readCatalog } from './lib/catalog-store';
const siteName = 'بودكاست السعودية';
const title = 'بودكاست السعودية | قصص تستحق الاستماع';
const description = 'اكتشف عالمًا من الأفكار والقصص والتجارب. منصتك العربية للاستماع إلى البودكاست في مختلف المجالات.';
export async function generateMetadata(): Promise<Metadata> {
  const base = (await readCatalog()).settings.siteUrl.replace(/\/$/, '');
  return {
    ...(base ? { metadataBase: new URL(base) } : {}),
    title: { default: title, template: `%s | ${siteName}` },
    description,
    applicationName: siteName,
    alternates: { types: { 'application/rss+xml': [{ url: '/feed.xml', title: siteName }] } },
    openGraph: { type: 'website', locale: 'ar_SA', siteName, title, description },
    twitter: { card: 'summary_large_image' },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
  };
}
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ar" dir="rtl" data-theme="light"><body>{children}</body></html>; }
