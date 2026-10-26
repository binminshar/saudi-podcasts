import type {Metadata} from 'next';
import SitePage from '../site-page';
export const dynamic='force-dynamic';
const description='استكشف تصنيفات البودكاست على بودكاست السعودية: لقاءات، وثائقي، قصص، اجتماعي، صحي، رياضي، تجاري، تعليمي، ثقافة وفنون، تكنولوجيا والمزيد.';
export const metadata:Metadata={title:'التصنيفات',description,alternates:{canonical:'/categories'},openGraph:{title:'التصنيفات',description,url:'/categories'}};
export default function Page(){return <SitePage view="categories"/>;}
