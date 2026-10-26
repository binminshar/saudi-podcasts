import type {Metadata} from 'next';
import SitePage from '../site-page';
export const dynamic='force-dynamic';
const description='من نحن: فريق بودكاست السعودية ورسالتنا في نشر المحتوى الصوتي العربي، وطريقة اختيار الحلقات ونسب المحتوى إلى ناشريه الأصليين.';
export const metadata:Metadata={title:'من نحن',description,alternates:{canonical:'/who-we-are'},openGraph:{title:'من نحن',description,url:'/who-we-are'}};
export default function Page(){return <SitePage view="who-we-are"/>;}
