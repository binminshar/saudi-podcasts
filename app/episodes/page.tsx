import type {Metadata} from 'next';
import SitePage from '../site-page';
export const dynamic='force-dynamic';
const description='تصفح جميع حلقات البودكاست العربي على بودكاست السعودية: لقاءات، وثائقيات، قصص، أعمال، تعليم، صحة وأكثر، مع البحث والتصفية بالتصنيف والناشر.';
export const metadata:Metadata={title:'جميع الحلقات',description,alternates:{canonical:'/episodes'},openGraph:{title:'جميع الحلقات',description,url:'/episodes'}};
export default function Page(){return <SitePage view="episodes"/>;}
