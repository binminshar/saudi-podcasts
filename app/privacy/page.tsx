import type {Metadata} from 'next';
import SitePage from '../site-page';
export const dynamic='force-dynamic';
const description='سياسة الخصوصية في بودكاست السعودية: البيانات التي نجمعها، ملفات الارتباط، التخزين المحلي للمفضلة والملاحظات، والخدمات الخارجية المستخدمة.';
export const metadata:Metadata={title:'سياسة الخصوصية',description,alternates:{canonical:'/privacy'},openGraph:{title:'سياسة الخصوصية',description,url:'/privacy'}};
export default function Page(){return <SitePage view="privacy"/>;}
