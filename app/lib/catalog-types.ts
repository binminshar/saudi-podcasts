import type {Episode} from '../data';
export type Author={id:string;name:string;bio:string;image:string};
export type Source={id:string;name:string;url:string;description:string};
export type ManagedEpisode=Episode & {
 status:'draft'|'published'|'archived'; authorId:string; sourceId:string;
 articleBody:string; imageAlt:string; audioUrl:string;
 seoTitle:string; seoDescription:string; focusKeyword:string; canonicalUrl:string; noIndex:boolean;
 pinned:boolean; featuredRank:number; popularPinned:boolean; popularRank:number; trendingPinned:boolean; trendingRank:number;
 views:number; updatedAt:string;
 sourcePublishedAt?:string;sourceImage?:string;sourceExcerpt?:string;sourceArticleUrl?:string;sourceCheckedAt?:string;sourceMetadataStatus?:'verified'|'partial';contentType?:'summary'|'full'|'article';
};
export type Catalog={revision:number;episodes:ManagedEpisode[];authors:Author[];sources:Source[];settings:{siteUrl:string};updatedAt:string;importedBatches?:string[]};
export type PublicEpisode=ManagedEpisode & {author?:Author};
