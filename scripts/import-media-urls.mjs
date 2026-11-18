// Extract playable media URLs for episodes that only have a publisher
// sourceUrl (مايكس / ثمانية / others) and fill audioUrl / videoUrl so they
// can be played inside the site instead of opening the source page.
//
//   node scripts/import-media-urls.mjs                  -> scrape + update .data/catalog.json
//   node scripts/import-media-urls.mjs --scrape-only    -> scrape into tmp/media-urls.json
//   node scripts/import-media-urls.mjs --apply-only     -> apply tmp/media-urls.json locally
//   node scripts/import-media-urls.mjs --remote URL     -> scrape + update live catalog (admin creds envs)
//
// Remote mode needs ADMIN_USERNAME / ADMIN_PASSWORD.
// THMANYAH_CHROME overrides the browser path used for thmanyah pages.

import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';

const args=process.argv.slice(2);
const remoteIndex=args.indexOf('--remote');
const remote=remoteIndex>=0?args[remoteIndex+1]:null;
const scrapeOnly=args.includes('--scrape-only');
const applyOnly=args.includes('--apply-only');
const resultsFile=resolve('tmp/media-urls.json');
const catalogFile=resolve('.data/catalog.json');

const UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36','Accept-Language':'ar,en;q=0.9'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const MEDIA_EXT=/\.(mp3|m4a|aac|ogg|opus|wav)(\?|#|$)/i;
const MEDIA_HINT=/(audio|media|stream|episode|podcast|\.mp3|\.m4a)/i;
const YT_RE=/(?:youtube(?:-nocookie)?\.com\/(?:embed|shorts)\/|youtube\.com\/watch\?[^"'<>\s]*v=|youtu\.be\/)([\w-]{6,})/g;

const ytIds=text=>{
 const ids=[];
 for(const m of text.matchAll(YT_RE))if(!ids.includes(m[1]))ids.push(m[1]);
 return ids;
};

const directMedia=text=>{
 const found=[];
 for(const m of text.matchAll(/https?:\/\/[^"'<>\s)]+?\.(mp3|m4a|aac|ogg|opus|wav)(?:\?[^"'<>\s)]*)?/gi))
  if(!found.includes(m[0]))found.push(m[0]);
 return found;
};

// ── micspod.com: plain fetch, page embeds podeo mp3 + youtube ──
async function scrapeMicspod(url){
 try{
  const html=await(await fetch(url,{headers:UA,redirect:'follow',signal:AbortSignal.timeout(20000)})).text();
  const media=directMedia(html).filter(u=>/podeo|media|cdn|audio|mp3|m4a/i.test(u));
  const yt=ytIds(html);
  return{audioUrl:media[0]||'',videoUrl:yt.length?`https://www.youtube.com/embed/${yt[0]}`:''};
 }catch(e){return{error:String(e)};}
}

// ── thmanyah.com: Vercel-checkpoint protected, needs a real browser ──
async function scrapeThmanyah(urls){
 let puppeteer;
 try{puppeteer=(await import('puppeteer-core')).default;}
 catch{console.log('puppeteer-core not installed — skipping thmanyah scrape');return{};}
 const exe=process.env.THMANYAH_CHROME||['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
 const browser=await puppeteer.launch({executablePath:exe,headless:'shell',args:['--no-sandbox','--disable-blink-features=AutomationControlled']});
 const out={};
 for(const url of urls){
  const page=await browser.newPage();
  const hits=[];
  page.on('request',r=>{const u=r.url();if(MEDIA_EXT.test(u)||/m4a|audio\./i.test(u))hits.push(u);});
  try{
   await page.setUserAgent(UA['User-Agent']);
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
   await sleep(9000);
   const dom=await page.evaluate(()=>({
    audios:[...document.querySelectorAll('audio, audio source, [data-audio], [data-src]')].map(e=>e.currentSrc||e.src||e.getAttribute('data-src')||'').filter(Boolean),
    iframes:[...document.querySelectorAll('iframe')].map(i=>i.src).filter(Boolean),
    html:document.documentElement.innerHTML,
   }));
   const clean=dom.html.replace(/\\u0026/g,'&').replace(/\\u003d/g,'=').replace(/\\\//g,'/');
   const audioMatch=clean.match(/https:\/\/api\.hosting\.thmanyah\.com\/episodeAudioFile\/\d+\/file\.mp3\?[\w=&%.\-]*/);
   const all=[...hits,...dom.audios,...dom.iframes,...directMedia(clean)];
   const yt=ytIds(dom.html);
   // thmanyah audio needs Referer: thmanyah.com — route it through our /api/media proxy
   const audio=audioMatch?`/api/media?src=${encodeURIComponent(audioMatch[0])}`
    :(all.find(u=>MEDIA_EXT.test(u)&&/thmanyah/.test(u))?'/api/media?src='+encodeURIComponent(all.find(u=>MEDIA_EXT.test(u)&&/thmanyah/.test(u)))
    :(all.find(u=>MEDIA_EXT.test(u))||''));
   out[url]={audioUrl:audio,videoUrl:yt.length?`https://www.youtube.com/embed/${yt[0]}`:'',candidates:all.slice(0,6)};
   console.log(`  thmanyah ${url} -> ${audio?'AUDIO '+audio.slice(0,90):yt.length?'YOUTUBE '+yt[0]:'none'}`);
  }catch(e){out[url]={error:String(e)};console.log(`  thmanyah ${url} -> ERR ${e.message.slice(0,60)}`);}
  await page.close();
 }
 await browser.close();
 return out;
}

async function scrape(episodes){
 const targets=episodes.filter(e=>e.sourceUrl&&!e.audioUrl&&!e.videoUrl);
 const mics=targets.filter(e=>e.sourceUrl.includes('micspod.com'));
 const thmanyah=targets.filter(e=>e.sourceUrl.includes('thmanyah.com'));
 const other=targets.filter(e=>!/micspod\.com|thmanyah\.com/.test(e.sourceUrl));
 console.log(`media-less episodes: ${targets.length} (mics ${mics.length}, thmanyah ${thmanyah.length}, other ${other.length})`);
 const results={};
 for(const e of mics){
  results[e.id]=await scrapeMicspod(e.sourceUrl);
  console.log(`  mics ${e.sourceUrl} -> ${results[e.id].audioUrl?'MP3':'—'} ${results[e.id].videoUrl?'YT':'—'}`);
  await sleep(150);
 }
 const thmanyahMap=await scrapeThmanyah(thmanyah.map(e=>e.sourceUrl));
 for(const e of thmanyah)results[e.id]=thmanyahMap[e.sourceUrl]||{};
 for(const e of other)results[e.id]={};
 return results;
}

function applyResults(catalog,results){
 let touched=0,audio=0,video=0,none=0;
 for(const e of catalog.episodes||[]){
  const r=results[e.id];if(!r)continue;
  const a=!e.audioUrl&&r.audioUrl?r.audioUrl:'';
  const v=!e.videoUrl&&r.videoUrl?r.videoUrl:'';
  if(a||v){if(a){e.audioUrl=a;audio++;}if(v){e.videoUrl=v;video++;}touched++;}
  else if(!r.error)none++;
 }
 console.log(`applied: ${touched} episode(s) — audio +${audio}, video +${video}, still source-only ${none}`);
 return touched;
}

async function getRemoteCatalog(){
 const base=remote.replace(/\/+$/,'');
 const username=process.env.ADMIN_USERNAME||'admin';
 const password=process.env.ADMIN_PASSWORD;
 if(!password){console.error('Set ADMIN_PASSWORD (and ADMIN_USERNAME) for remote mode.');process.exit(1);}
 const login=await fetch(`${base}/api/admin/session`,{method:'POST',headers:{'Content-Type':'application/json','Origin':base},body:JSON.stringify({username,password,action:'login'})});
 if(!login.ok){console.error(`remote login failed: ${login.status}`);process.exit(1);}
 const cookie=(login.headers.get('set-cookie')||'').split(';')[0];
 const res=await fetch(`${base}/api/admin/catalog`,{headers:{Cookie:cookie}});
 if(!res.ok)throw Error(`catalog fetch failed: ${res.status}`);
 const catalog=await res.json();
 await writeFile(resolve(`.data/remote-catalog-backup-media-${Date.now()}.json`),JSON.stringify(catalog));
 return{catalog,cookie,base};
}

if(applyOnly){
 const catalog=JSON.parse(await readFile(catalogFile,'utf8'));
 const results=JSON.parse(await readFile(resultsFile,'utf8'));
 const touched=applyResults(catalog,results);
 if(touched)await writeFile(catalogFile,JSON.stringify(catalog));
 console.log('catalog.json updated from',resultsFile);
}else{
 let catalog,cookie,base;
 if(remote){({catalog,cookie,base}=await getRemoteCatalog());}
 else catalog=JSON.parse(await readFile(catalogFile,'utf8'));
 const results=await scrape(catalog.episodes||[]);
 await mkdir('tmp',{recursive:true});
 await writeFile(resultsFile,JSON.stringify(results,null,1));
 const touched=applyResults(catalog,results);
 if(touched&&!scrapeOnly){
  if(remote){
   const put=await fetch(`${base}/api/admin/catalog`,{method:'PUT',headers:{'Content-Type':'application/json','Origin':base,'Cookie':cookie},body:JSON.stringify(catalog)});
   if(!put.ok)throw Error(`remote update failed: ${put.status}`);
   console.log(`remote catalog updated (${touched} episodes touched).`);
  }else{
   await writeFile(catalogFile+'.media.bak',JSON.stringify(JSON.parse(await readFile(catalogFile,'utf8'))));
   await writeFile(catalogFile,JSON.stringify(catalog));
   console.log(`catalog.json updated (${touched} touched). backup: catalog.json.media.bak`);
  }
 }
}
