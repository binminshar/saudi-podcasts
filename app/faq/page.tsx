import type {Metadata} from 'next';
import SitePage from '../site-page';
export const dynamic='force-dynamic';
const description='إجابات عن الأسئلة الشائعة حول بودكاست السعودية: كيفية الاستماع، المفضلة والملاحظات، مصادر الحلقات، والتواصل مع المنصة.';
export const metadata:Metadata={title:'الأسئلة الشائعة',description,alternates:{canonical:'/faq'},openGraph:{title:'الأسئلة الشائعة',description,url:'/faq'}};
export default function Page(){return <SitePage view="faq"/>;}
