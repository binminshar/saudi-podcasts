// Find YouTube versions for episodes that lack videoUrl (audio-only/source-only),
// so they can be watched inside the site via the embedded player.
//
//   node scripts/import-youtube-videos.mjs               -> update .data/catalog.json
//   node scripts/import-youtube-videos.mjs --remote URL  -> update live catalog (ADMIN_USERNAME/ADMIN_PASSWORD)

import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const args=process.argv.slice(2);
const ri=args.indexOf('--remote');
const remote=ri>=0?args[ri+1]:null;
const catalogFile=resolve('.data/catalog.json');
const UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36','Accept-Language':'ar,en;q=0.9'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const norm=s=>(s||'').toLowerCase().replace(/[أإآ]/g,'ا').replace(/[^\p{L}\p{N} ]/gu,' ').replace(/\s+/g,' ').trim();
const sim=(a,b)=>{
 const A=new Set(norm(a).split(' ').filter(w=>w.length>2)),B=new Set(norm(b).split(' ').filter(w=>w.length>2));
 if(!A.size||!B.size)return 0;
 let hit=0;for(const w of A)if(B.has(w))hit++;
 return hit/Math.max(A.size,B.size);
};

async function ytSearch(q){
 try{
  const r=await fetch('https://www.youtube.com/results?search_query='+encodeURIComponent(q)+'&hl=ar&gl=SA',{headers:UA,signal:AbortSignal.timeout(20000)});
  const html=await r.text();
  return[...new Set([...html.matchAll(/"videoId":"([\w-]{11})"/g)].map(m=>m[1]))].slice(0,4);
 }catch{return[];}
}
async function oembed(id){
 try{
  const r=await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,{headers:UA,signal:AbortSignal.timeout(15000)});
  if(!r.ok)return null;
  return r.json();
 }catch{return null;}
}

async function findVideo(e){
 const ids=await ytSearch(`${e.show||''} ${e.title}`.trim());
 let best=null,score=0;
 for(const id of ids){
  const meta=await oembed(id);if(!meta)continue;
  const s=sim(e.title,meta.title)+(meta.author_name&&e.source&&norm(meta.author_name).includes(norm(e.source))?.35:0);
  if(s>score){score=s;best=id;}
  await sleep(120);
 }
 return score>=.45&&best?{id:best,score:score.toFixed(2)}:null;
}

let catalog,cookie,base;
if(remote){
 base=remote.replace(/\/+$/,'');
 const password=process.env.ADMIN_PASSWORD;
 if(!password){console.error('Set ADMIN_PASSWORD');process.exit(1);}
 const login=await fetch(`${base}/api/admin/session`,{method:'POST',headers:{'Content-Type':'application/json','Origin':base},body:JSON.stringify({username:process.env.ADMIN_USERNAME||'admin',password,action:'login'})});
 if(!login.ok){console.error('login failed '+login.status);process.exit(1);}
 cookie=(login.headers.get('set-cookie')||'').split(';')[0];
 const res=await fetch(`${base}/api/admin/catalog`,{headers:{Cookie:cookie}});
 catalog=await res.json();
}else catalog=JSON.parse(await readFile(catalogFile,'utf8'));

const targets=catalog.episodes.filter(e=>!e.videoUrl&&e.status==='published');
console.log(`episodes without videoUrl: ${targets.length}`);
let touched=0,missed=0;
for(const e of targets){
 const hit=await findVideo(e);
 if(hit){e.videoUrl=`https://www.youtube.com/embed/${hit.id}`;touched++;console.log(` + ${e.title.slice(0,45)} -> ${hit.id} (${hit.score})`);}
 else{missed++;console.log(` - ${e.title.slice(0,45)} -> none`);}
 await sleep(400);
}
console.log(`video added: ${touched}, no match: ${missed}`);
if(touched){
 if(remote){
  const put=await fetch(`${base}/api/admin/catalog`,{method:'PUT',headers:{'Content-Type':'application/json','Origin':base,'Cookie':cookie},body:JSON.stringify(catalog)});
  if(!put.ok)throw Error('remote update failed: '+put.status);
  console.log('remote catalog updated.');
 }else{
  await writeFile(catalogFile+'.yt.bak',JSON.stringify(JSON.parse(await readFile(catalogFile,'utf8'))));
  await writeFile(catalogFile,JSON.stringify(catalog));
  console.log('catalog.json updated.');
 }
}
