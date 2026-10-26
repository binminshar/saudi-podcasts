import type {MetadataRoute} from 'next';
import {publicCatalog} from './lib/catalog-store';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const c=await publicCatalog();const base=c.settings.siteUrl.replace(/\/$/,'');if(!base)return [];return [...['','/episodes','/categories','/about','/who-we-are','/privacy','/faq'].map(path=>({url:base+path})),...c.episodes.filter(e=>!e.noIndex).map(e=>({url:base+'/episode/'+encodeURIComponent(e.id),lastModified:e.updatedAt}))];}
