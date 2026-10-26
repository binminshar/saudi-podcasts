'use client';
import {useState} from 'react';
import {Play,Clapperboard} from 'lucide-react';
import {youtubeEmbed} from './lib/video';
export default function EpisodeVideo({url,title,openInitially=false}:{url?:string;title:string;openInitially?:boolean}){const [open,setOpen]=useState(openInitially);const src=youtubeEmbed(url);if(!src)return null;return <section className="episode-video"><div><Clapperboard size={21}/><h2>مشاهدة الحلقة</h2></div>{open?<iframe src={src} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen loading="lazy"/>:<button className="pill" onClick={()=>setOpen(true)}><Play size={17}/> عرض الفيديو</button>}</section>;}
