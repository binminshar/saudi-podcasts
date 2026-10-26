import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import SitePage from '../../site-page';
import {publicEpisode,readCatalog} from '../../lib/catalog-store';
import {photo} from '../../data';
import {episodeSchema} from '../../lib/episode-schema';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const {id}=await params;const episode=await publicEpisode(id);if(!episode)return {title:'الحلقة غير موجودة',robots:{index:false,follow:false}};const c=await readCatalog();const canonical=episode.canonicalUrl||(c.settings.siteUrl?c.settings.siteUrl.replace(/\/$/,'')+'/episode/'+encodeURIComponent(id):undefined);const rawImage=photo(episode.image);const image=rawImage.startsWith('http')?rawImage:c.settings.siteUrl?new URL(rawImage,c.settings.siteUrl).href:'';return {title:{absolute:episode.seoTitle||episode.title+' | بودكاست السعودية'},description:episode.seoDescription||episode.description,alternates:canonical?{canonical}:undefined,robots:{index:!episode.noIndex,follow:true},openGraph:{title:episode.seoTitle||episode.title,description:episode.seoDescription||episode.description,type:'article',...(canonical?{url:canonical}:{}),...(episode.publishedAt?{publishedTime:episode.publishedAt}:{}),modifiedTime:episode.updatedAt,...(image.startsWith('http')?{images:[{url:image,alt:episode.imageAlt||episode.title}]}:{})},twitter:{card:'summary_large_image',title:episode.seoTitle||episode.title,description:episode.seoDescription||episode.description}};}
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const episode=await publicEpisode(id);
 if(!episode)notFound();
 const catalog=await readCatalog();
 const json=JSON.stringify(episodeSchema(episode,catalog)).replace(/</g,'\\u003c');
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:json}}/><SitePage view="detail" episodeId={id}/></>;
}
