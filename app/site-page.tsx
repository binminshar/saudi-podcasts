import Podcast from './podcast';
import {publicCatalog} from './lib/catalog-store';
export default async function SitePage({view='home',episodeId}:{view?:string;episodeId?:string}){const c=await publicCatalog();return <Podcast initialView={view} episodeId={episodeId} initialEpisodes={c.episodes}/>;}
