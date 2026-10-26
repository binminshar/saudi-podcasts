import type {Metadata} from 'next';
import SitePage from './site-page';
export const dynamic='force-dynamic';
export const metadata:Metadata={alternates:{canonical:'/'},openGraph:{url:'/'}};
export default function Page(){return <SitePage view="home"/>;}
