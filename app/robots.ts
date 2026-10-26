import type {MetadataRoute} from 'next';
import {readCatalog} from './lib/catalog-store';
export const dynamic='force-dynamic';
export default async function robots():Promise<MetadataRoute.Robots>{const c=await readCatalog();return {rules:[{userAgent:'*',allow:'/',disallow:['/admin','/api/admin']}],...(c.settings.siteUrl?{sitemap:c.settings.siteUrl.replace(/\/$/,'')+'/sitemap.xml'}:{})};}
