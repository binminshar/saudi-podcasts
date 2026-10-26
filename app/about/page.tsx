import type {Metadata} from 'next';
import SitePage from '../site-page';
export const dynamic='force-dynamic';
const description='تعرّف على منصة بودكاست السعودية: منصة عربية تجمع حلقات البودكاست من مختلف المجالات والناشرين في مكان واحد مع مقالات مكتوبة لكل حلقة.';
export const metadata:Metadata={title:'عن المنصة',description,alternates:{canonical:'/about'},openGraph:{title:'عن المنصة',description,url:'/about'}};
export default function Page(){return <SitePage view="about"/>;}
