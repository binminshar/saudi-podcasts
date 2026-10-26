import type {Metadata} from 'next';
import Admin from './panel';
import './admin.css';
export const metadata:Metadata={title:{absolute:'لوحة التحكم | بودكاست السعودية'},robots:{index:false,follow:false,noarchive:true}};
export default function Page(){return <Admin/>;}
