'use client';
import {useState} from 'react';
import {Play,Clapperboard,ExternalLink} from 'lucide-react';
import {youtubeEmbed,youtubeWatch} from './lib/video';
export default function EpisodeVideo({url,title,openInitially=false}:{url?:string;title:string;openInitially?:boolean}){const [open,setOpen]=useState(openInitially);const src=youtubeEmbed(url);const watch=youtubeWatch(url);if(!src)return null;return <section className="episode-video"><div><Clapperboard size={21}/><h2>مشاهدة الحلقة</h2>{watch&&<a className="video-source-link" href={watch} target="_blank" rel="noopener noreferrer"><ExternalLink size={13}/> المصدر الأصلي</a>}</div>{open?<iframe src={src} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen loading="lazy"/>:<button className="pill" onClick={()=>setOpen(true)}><Play size={17}/> عرض الفيديو</button>}</section>;}
