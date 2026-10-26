import type {Metadata} from 'next';
import SitePage from '../site-page';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'المفضلة',description:'حلقاتك المفضلة المحفوظة في هذا المتصفح.',robots:{index:false,follow:true}};
export default function Page(){return <SitePage view="favorites"/>;}
