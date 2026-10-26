import 'server-only';
import {readDocument,writeDocument,remote,dataDirectory} from './storage';
import {episodes as seed,categories} from '../data';
import type {Catalog,ManagedEpisode} from './catalog-types';
import {validPublicationDate} from './dates';
import {youtubeEmbed} from './video';
import {discoveryOrder} from './discovery';
import {adoptOwnedContent,siteDomain} from './owned-content';

export {dataDirectory};
const catalogDocument='catalog.json';
const cacheTtl=remote?Number(process.env.CATALOG_CACHE_SECONDS||30)*1000:0;
let cached:{catalog:Catalog;at:number}|null=null;
let queue:Promise<unknown>=Promise.resolve();
export function initialCatalog():Catalog{return {revision:0,episodes:seed.map(e=>({...e,status:'published' as const,authorId:'',sourceId:e.sourceId||(e.source==='مايكس'?'mics':'thmanyah'),articleBody:e.articleBody||'',imageAlt:e.title,audioUrl:'',seoTitle:'',seoDescription:'',focusKeyword:'',canonicalUrl:'',noIndex:false,pinned:false,featuredRank:0,popularPinned:false,popularRank:0,trendingPinned:false,trendingRank:0,views:0,updatedAt:new Date().toISOString()})).map(adoptOwnedContent),authors:[],sources:[{id:'mics',name:'مايكس',url:'https://micspod.com',description:'شبكة مايكس للبودكاست'},{id:'thmanyah',name:'ثمانية',url:'https://thmanyah.com',description:'إذاعة ثمانية'},{id:'saudi-podcasts',name:'بودكاست السعودية',url:'https://saudi-podcasts.com/',description:'البودكاست السعودي؛ استيراد بإذن المالك'}],importedBatches:['saudi-podcasts-2026-10-19'],settings:{siteUrl:siteDomain},updatedAt:new Date().toISOString()};}
export async function readCatalog():Promise<Catalog>{if(cached&&Date.now()-cached.at<cacheTtl)return structuredClone(cached.catalog);const raw=await readDocument(catalogDocument);const catalog=raw===null?initialCatalog():normalize(JSON.parse(raw));if(cacheTtl)cached={catalog:structuredClone(catalog),at:Date.now()};return catalog;}
function normalize(catalog:Catalog):Catalog{if(!catalog.importedBatches?.includes('saudi-podcasts-2026-10-19')){const fresh=initialCatalog();catalog.episodes.push(...fresh.episodes.filter(e=>e.sourceId==='saudi-podcasts'&&!catalog.episodes.some(existing=>existing.id===e.id||!!existing.sourceUrl&&!!e.sourceUrl&&existing.sourceUrl===e.sourceUrl)));if(!catalog.sources.some(s=>s.id==='saudi-podcasts'))catalog.sources.push(fresh.sources.find(s=>s.id==='saudi-podcasts')!);catalog.importedBatches=[...(catalog.importedBatches||[]),'saudi-podcasts-2026-10-19'];}catalog.sources=catalog.sources.map(s=>s.id==='saudi-podcasts'?{...s,name:'بودكاست السعودية'}:s);if(!catalog.settings.siteUrl)catalog.settings.siteUrl=siteDomain;catalog.episodes=catalog.episodes.map(adoptOwnedContent);return {...catalog,episodes:catalog.episodes.map(e=>{const original=seed.find(s=>s.id===e.id);if(!original?.sourceCheckedAt)return e;const oldSourceImage=!e.sourceCheckedAt&&(e.imageIsPlaceholder||e.image.startsWith('https://media.podeo.co/'));return {...e,sourcePublishedAt:original.sourcePublishedAt,sourceImage:original.sourceImage,sourceExcerpt:e.sourceExcerpt??original.sourceExcerpt,sourceArticleUrl:e.publicationOrigin==='local'?'':original.sourceArticleUrl,sourceCheckedAt:original.sourceCheckedAt,sourceMetadataStatus:original.sourceMetadataStatus as ManagedEpisode['sourceMetadataStatus'],publishedAt:e.publishedAt||original.publishedAt,...(oldSourceImage?{image:original.image,imageIsPlaceholder:false}:{})};})};}
export class ConflictError extends Error{}
export async function updateCatalog(change:(catalog:Catalog)=>Catalog):Promise<Catalog>{const task=queue.then(async()=>{const current=await readCatalog();const next=change(current);next.revision=current.revision+1;next.updatedAt=new Date().toISOString();next.episodes=next.episodes.map(adoptOwnedContent);await writeDocument(catalogDocument,JSON.stringify(next,null,2));cached=cacheTtl?{catalog:structuredClone(next),at:Date.now()}:null;return next;});queue=task.catch(()=>{});return task;}
export function validUrl(value:string,local=false){if(!value)return true;if(local&&/^\/(uploads|thumbnails)\/[a-f0-9-]+\.(png|jpg|webp|gif)$/.test(value))return true;if(local&&/^photo-[a-zA-Z0-9-]+$/.test(value))return true;try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}}
export function validateCatalog(input:unknown):Catalog {
 if(!input||typeof input!=='object')throw Error('بيانات غير صالحة');const c=input as Catalog;
 if(!Number.isInteger(c.revision)||!Array.isArray(c.episodes)||!Array.isArray(c.authors)||!Array.isArray(c.sources)||!c.settings||typeof c.settings.siteUrl!=='string'||!validUrl(c.settings.siteUrl))throw Error('صيغة البيانات غير صالحة');
 if(c.episodes.length>10000||c.authors.length>1000||c.sources.length>1000)throw Error('تجاوز عدد السجلات المسموح');
 const ids=new Set<string>();for(const group of [c.episodes,c.authors,c.sources]){ids.clear();for(const row of group){if(typeof row.id!=='string'||!/^[\p{L}\p{N}_-]{1,180}$/u.test(row.id)||ids.has(row.id))throw Error('الرابط أو المعرف مكرر أو غير صالح');ids.add(row.id);}}
 for(const a of c.authors){if(!a.name?.trim()||typeof a.bio!=='string'||typeof a.image!=='string'||!validUrl(a.image,true))throw Error('بيانات الكاتب غير مكتملة');}
 for(const s of c.sources){if(!s.name?.trim()||!s.url||!validUrl(s.url)||typeof s.description!=='string')throw Error('اسم المصدر ورابطه مطلوبان');}
 for(const e of c.episodes){
  for(const key of ['title','show','category','image','description','authorId','sourceId','articleBody','imageAlt','audioUrl','seoTitle','seoDescription','focusKeyword','canonicalUrl'] as const)if(typeof e[key]!=='string')throw Error('حقل غير صالح: '+key);
  if(!e.title.trim()||!e.show.trim()||!categories.some(c=>c.name===e.category)||!['draft','published','archived'].includes(e.status))throw Error('العنوان والبرنامج والتصنيف والحالة مطلوبة');
  if(e.minutes!==null&&(!Number.isFinite(e.minutes)||e.minutes<0))throw Error('مدة غير صالحة');
  if(!validPublicationDate(e.publishedAt)||!validPublicationDate(e.sourcePublishedAt))throw Error('تاريخ النشر غير صالح');
  if(e.status==='published'&&!e.publishedAt)throw Error('تاريخ النشر مطلوب للحلقة المنشورة');
  if(e.videoUrl&&(!youtubeEmbed(e.videoUrl)||typeof e.videoUrl!=='string'))throw Error('رابط الفيديو يجب أن يكون رابط يوتيوب صالحًا');
  if(e.contentType!==undefined&&!['summary','full','article'].includes(e.contentType))throw Error('نوع المحتوى غير صالح');
  for(const key of ['views','listens','featuredRank','popularRank','trendingRank'] as const)if(!Number.isFinite(e[key])||e[key]<0)throw Error('قيمة رقمية غير صالحة');
  for(const key of ['pinned','popularPinned','trendingPinned','noIndex'] as const)if(typeof e[key]!=='boolean')throw Error('خيار غير صالح');
  if(!validUrl(e.image,true)||!validUrl(e.audioUrl)||!validUrl(e.canonicalUrl)||typeof e.sourceUrl!=='string'||!validUrl(e.sourceUrl))throw Error('روابط الحلقة غير صالحة');
  if(e.authorId&&!c.authors.some(a=>a.id===e.authorId)||e.sourceId&&!c.sources.some(s=>s.id===e.sourceId))throw Error('الكاتب أو المصدر غير موجود');
  if(e.status==='published'&&(!e.image||!e.description.trim()||(!e.sourceUrl&&!e.audioUrl&&!e.videoUrl)))throw Error('للنشر أضف الصورة والوصف ورابط الاستماع أو المصدر');
  if(e.publicationOrigin!==undefined&&!['local','external'].includes(e.publicationOrigin))throw Error('قيمة نشر غير صالحة');const source=c.sources.find(s=>s.id===e.sourceId);e.source=source?.name||'';
  if(e.articleBody.length>500000||e.title.length>250||e.description.length>10000)throw Error('حجم المحتوى أكبر من المسموح');
 }
 return c;
}
export async function publicCatalog(){const c=await readCatalog();return {...c,episodes:discoveryOrder(c.episodes.filter(e=>e.status==='published')).map(e=>({...e,author:c.authors.find(a=>a.id===e.authorId)}))};}
export async function publicEpisode(id:string):Promise<ManagedEpisode|undefined>{return (await readCatalog()).episodes.find(e=>e.id===id&&e.status==='published');}
