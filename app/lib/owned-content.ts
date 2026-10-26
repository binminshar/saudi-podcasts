import type {ManagedEpisode} from './catalog-types';
export const ownedSourceId='saudi-podcasts';
export const siteDomain='https://saudi-podcasts.com';
export function adoptOwnedContent<T extends ManagedEpisode>(episode:T):T{
 if(episode.sourceId!==ownedSourceId||episode.publicationOrigin==='local')return episode;
 const canonical=episode.canonicalUrl&&episode.canonicalUrl!==episode.sourceUrl?episode.canonicalUrl:'';
 return {...episode,publicationOrigin:'local',legacyUrl:episode.legacyUrl||episode.sourceUrl,source:'بودكاست السعودية',sourceUrl:'',sourceArticleUrl:'',canonicalUrl:canonical,description:episode.description.replace('من موقع البودكاست السعودي.','على بودكاست السعودية.')};
}
