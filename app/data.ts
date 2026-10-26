import saudiEpisodes from './saudi-episodes.json';
import micsEpisodes from './mics-episodes.json';
import thmanyahEpisodes from './thmanyah-episodes.json';
export const categories = [
 {name:'لقاءات',icon:'interview',color:'#c19aff',image:'photo-1590602847861-f357a9332bbc',caption:'حوارات تفتح آفاقًا جديدة'},
 {name:'وثائقي',icon:'documentary',color:'#e3ba79',image:'photo-1464822759023-fed622ff2c3b',caption:'اكتشف العالم خلف الحكاية'},
 {name:'قصص',icon:'stories',color:'#f293b4',image:'photo-1455390582262-044cdead277a',caption:'حكايات تبقى في الذاكرة'},
 {name:'اجتماعي',icon:'social',color:'#76d7ca',image:'photo-1529156069898-49953e39b3ac',caption:'قضايا من واقع حياتنا'},
 {name:'صحي',icon:'leaf',color:'#45d594',image:'photo-1506126613408-eca07ce68773',caption:'حياة أفضل لك'},
 {name:'رياضي',icon:'dumbbell',color:'#81adff',image:'photo-1517836357463-d25dfeac3438',caption:'قصص تتخطى الحدود'},
 {name:'تجاري',icon:'chart',color:'#47dca6',image:'photo-1486406146926-c627a92ad1ab',caption:'أفكار تصنع الفرق'},
 {name:'تعليمي',icon:'graduation',color:'#75b5ff',image:'photo-1503676260728-1c00da094a0b',caption:'تعلّم شيئًا جديدًا كل يوم'},
 {name:'علاقات',icon:'heart',color:'#f49db8',image:'photo-1516589178581-6cd7833ae3b2',caption:'نحو علاقات أفضل'},
 {name:'ثقافة وفنون',icon:'palette',color:'#ff9e76',image:'photo-1513364776144-60967b0f800f',caption:'إبداع بلا حدود'},
 {name:'مجتمع',icon:'users',color:'#ebc777',image:'photo-1529156069898-49953e39b3ac',caption:'قصص تشبهنا'},
 {name:'تكنولوجيا',icon:'cpu',color:'#57c9ef',image:'photo-1518770660439-4636190af475',caption:'مستقبل يبدأ الآن'},
 {name:'أخرى',icon:'sparkles',color:'#bc96ff',image:'photo-1464822759023-fed622ff2c3b',caption:'اكتشف المزيد'},
];
export const photo=(id:string,w=800)=>id.startsWith('https://')||id.startsWith('http://')||id.startsWith('/uploads/')||id.startsWith('/thumbnails/')?id:`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;
export type Episode={id:string;title:string;show:string;category:string;minutes:number|null;image:string;accent:string;description:string;listens:number;source?:string;sourceUrl?:string;publishedAt?:string;sourcePublishedAt?:string;sourceImage?:string;sourceExcerpt?:string;sourceArticleUrl?:string;sourceCheckedAt?:string;sourceMetadataStatus?:'verified'|'partial';contentType?:'summary'|'full'|'article';sourceId?:string;publicationOrigin?:'local'|'external';legacyUrl?:string;videoUrl?:string;sourceCategories?:string[];importedAt?:string;imageIsPlaceholder?:boolean;status?:'draft'|'published'|'archived';articleBody?:string;imageAlt?:string;audioUrl?:string;author?:{name:string;bio:string;image:string};pinned?:boolean;featuredRank?:number;popularPinned?:boolean;popularRank?:number;trendingPinned?:boolean;trendingRank?:number;views?:number};
export const episodes:Episode[]=[...micsEpisodes.flatMap((episode,index)=>[episode,thmanyahEpisodes[index]]),...saudiEpisodes] as Episode[];
