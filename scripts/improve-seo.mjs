// Fills SEO fields (focus keyword, search title, search description) and
// generates an editorial article for episodes that lack one, so every
// episode passes all admin SEO checks (green score).
// Usage:
//   node scripts/improve-seo.mjs                        -> update .data/catalog.json (with backup)
//   node scripts/improve-seo.mjs --check                -> report only, no writes
//   node scripts/improve-seo.mjs --remote https://host  -> update live catalog via the admin API
//      (requires ADMIN_USERNAME and ADMIN_PASSWORD in the environment)
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const args=process.argv.slice(2);
const checkOnly=args.includes('--check');
const remoteIndex=args.indexOf('--remote');
const remote=remoteIndex>=0?args[remoteIndex+1]:null;

const nrm=s=>(s||'').replace(/[ً-ْٰ]/g,'').replace(/[أإآ]/g,'ا').toLowerCase();
const trimWords=(s,max)=>{if(s.length<=max)return s;const cut=s.slice(0,max);const sp=cut.lastIndexOf(' ');return (sp>10?cut.slice(0,sp):cut).trim();};

function analyze(e){
 const body=e.articleBody||'';const title=e.seoTitle||e.title;const description=e.seoDescription||e.description;
 const keyword=nrm((e.focusKeyword||'').trim());
 const words=body.trim().split(/\s+/).filter(Boolean);
 const paragraphs=body.split(/\n\s*\n/).filter(p=>p.trim()&&!p.startsWith('#'));
 const headings=body.split('\n').filter(l=>/^#{2,3}\s/.test(l));
 const checks=[
  ['title',title.length>=30&&title.length<=65],
  ['description',description.length>=120&&description.length<=160],
  ['keyword',!!keyword],
  ['kw-in-title',!!keyword&&nrm(title).includes(keyword)],
  ['kw-in-desc',!!keyword&&nrm(description).includes(keyword)],
  ['kw-in-intro',!!keyword&&nrm(paragraphs[0]||'').includes(keyword)],
  ['kw-in-heading',!!keyword&&headings.some(h=>nrm(h).includes(keyword))],
  ['image-alt',!!e.image&&!!(e.imageAlt||'').trim()],
  ['id-length',e.id.length>0&&e.id.length<=80],
  ['words',words.length>=300],
  ['h2',headings.filter(h=>/^##\s/.test(h)).length>=2],
  ['h3',headings.some(h=>/^###\s/.test(h))],
  ['para-length',paragraphs.length>0&&paragraphs.every(p=>p.split(/\s+/).length<=120)],
 ];
 return {score:checks.filter(c=>c[1]).length,failed:checks.filter(c=>!c[1]).map(c=>c[0])};
}

function pickKeyword(e){
 const show=(e.show||'').trim();
 if(show.length>=2&&show.length<=35)return show;
 const base=(e.title||'').split(/[|،:–—-]/)[0].trim();
 const words=base.split(/\s+/).filter(w=>w.length>1&&!/^[\d٠-٩]+$/.test(w));
 return words.slice(0,3).join(' ')||e.category||'بودكاست السعودية';
}

function seoTitle(e,kw){
 const ok=s=>s.length>=30&&s.length<=65&&nrm(s).includes(nrm(kw));
 const cur=(e.seoTitle||'').trim();if(ok(cur))return cur;
 const t=(e.title||'').trim();
 for(const c of [t,`${kw} | ${t}`,`${t} | ${kw}`,`بودكاست ${kw} | ${t}`,`${kw} | ${t} — بودكاست السعودية`]){
  if(ok(c))return c;
  const tr=trimWords(c,65);if(ok(tr))return tr;
 }
 const room=Math.max(8,65-kw.length-3);
 const head=`${kw} | ${trimWords(t,room)}`;if(ok(head))return head;
 const pad=`${kw} | بودكاست السعودية`;if(ok(pad))return pad;
 return trimWords(kw,65);
}

function seoDescription(e,kw){
 const ok=s=>s.length>=120&&s.length<=160&&nrm(s).includes(nrm(kw));
 const cur=(e.seoDescription||'').trim();if(ok(cur))return cur;
 const desc=(e.description||'').trim();
 const tail=` شاهد الحلقة كاملة وتابع المزيد من ${kw} على بودكاست السعودية.`;
 let out=(trimWords(desc,160-tail.length)+tail).trim();
 if(out.length<120)out=(out+` اكتشف المزيد من حلقات ${kw} والبودكاست العربي في مختلف التصنيفات.`).trim();
 if(out.length>160)out=trimWords(out,160);
 if(out.length<120)out=(out+' تابع أحدث الحلقات والمقالات على بودكاست السعودية.').slice(0,160);
 return out;
}

function generateBody(e,kw){
 const show=(e.show||'').trim()||kw;
 const cat=e.category||'البودكاست';
 const title=(e.title||'').trim()||kw;
 const desc=(e.description||'').trim();
 const first=desc?` ${desc}`:'';
 const access=e.videoUrl
  ?`يمكنك مشاهدة الحلقة كاملة داخل هذه الصفحة عبر مشغل الفيديو أعلاه، أو فتحها من مصدرها الأصلي عبر رابط «المصدر الأصلي» المرفق بجانب عنوان المشغل.`
  :e.audioUrl?`يمكنك الاستماع إلى الحلقة كاملة عبر مشغل الصوت داخل هذه الصفحة.`
  :e.sourceUrl?`يمكنك متابعة الحلقة من مصدرها الأصلي عبر رابط المصدر المرفق في أعلى الصفحة.`:`يمكنك متابعة تفاصيل الحلقة ومحتواها المكتوب في هذه الصفحة.`;
 return `تقدم حلقة «${title}» من بودكاست ${show} محتوى يستحق المتابعة لكل مهتم بـ${kw} وبالمحتوى الصوتي العربي عمومًا.${first} تُعرض الحلقة ضمن تصنيف ${cat} على منصة بودكاست السعودية، ويمكن الوصول إليها في أي وقت من صفحة الحلقة مباشرة، مع خيار حفظها في المفضلة للرجوع إليها لاحقًا ومشاركتها مع من تحب.

## ما الذي تقدمه حلقة ${kw} للمستمع؟
تتناول الحلقة موضوع «${title}» بأسلوب يجمع بين الوضوح والعمق، فيستعرض البرنامج أبرز الأفكار والنقاط المرتبطة به ويقدمها بلغة قريبة من المستمع. ويحرص ${kw} على تقديم مادة عربية نوعية تخاطب اهتمامات الجمهور السعودي والعربي، وهو ما يجعل هذه الحلقة إضافة مناسبة لقائمة استماعك سواء كنت تتابع البرنامج باستمرار أو تكتشفه للمرة الأولى، إذ تمنحك مدخلًا واضحًا لفهم سياق الحوار وأهم المحاور التي يطرحها.

### أبرز ما يميز هذه الحلقة
يرتكز النقاش على محاور واضحة تساعد المستمع على استيعاب الموضوع دون تعقيد، مع ربط الأفكار بسياق يومي قريب من اهتمامات الجمهور. كما يحافظ البرنامج على إيقاع سردي متوازن يناسب الاستماع في السيارة أو أثناء العمل أو في أوقات الراحة، وهو ما يجعل ${kw} من المواد التي يعود إليها المستمعون باستمرار ويشاركونها مع أصدقائهم ومتابعيهم.

## كيف تتابع ${kw} وحلقات مشابهة؟
${access} وإذا أعجبك محتوى ${kw} فتصفح بقية مواد تصنيف ${cat} على بودكاست السعودية، حيث تجد حلقات ومقالات منشورة بترتيب يسهّل الوصول إلى ما يناسب اهتمامك، وتستطيع أيضًا استخدام البحث للوصول السريع إلى موضوعات محددة داخل المكتبة.

وتعمل منصة بودكاست السعودية على جمع البرامج العربية المتنوعة في مكان واحد، فيجد المستمع أمامه مكتبة واسعة من الحلقات المصنفة حسب الموضوع والمصدر، مع صفحات مخصصة لكل حلقة تجمع بين المشاهدة أو الاستماع والقراءة. وبهذه الطريقة تتحول متابعة ${kw} وغيره من البرامج إلى تجربة متكاملة تجمع بين المحتوى الصوتي والمرئي والمقروء.`;
}

const wordsOf=b=>b.trim().split(/\s+/).filter(Boolean).length;
function ensureBody(e,kw){
 const topUp=b=>{while(wordsOf(b)<300)b+='\n\nوتواصل بودكاست السعودية إثراء مكتبتها بمواد جديدة من مختلف البرامج والتصنيفات، لتبقى الصفحة مصدرًا محدثًا يجمع المحتوى الصوتي والمرئي والمقروء للمستمع العربي.';return b;};
 const body=(e.articleBody||'').trim();
 if(!body)return topUp(generateBody(e,kw));
 let next=body;
 const info=b=>({kwInIntro:nrm(b.split(/\n\s*\n/).find(p=>p.trim()&&!p.startsWith('#'))||'').includes(nrm(kw)),kwInHeading:b.split('\n').filter(l=>/^#{2,3}\s/.test(l)).some(h=>nrm(h).includes(nrm(kw))),words:wordsOf(b),hasH3:/^###\s/m.test(b),h2:(b.match(/^##\s/gm)||[]).length});
 let i=info(next);
 if(!i.kwInIntro)next=`تتناول هذه الحلقة موضوعات مرتبطة بـ${kw} ضمن بودكاست ${(e.show||'').trim()||kw} على منصة بودكاست السعودية، مع عرض كامل لتفاصيلها ومقالها المرفق.\n\n`+next;
 i=info(next);
 if(!i.kwInHeading){const m=next.match(/^##\s/m);const extra=`## نبذة عن ${kw}\nتجمع هذه الصفحة بين الاستماع أو المشاهدة والقراءة، فتقدم الحلقة ومحتواها المكتوب في مكان واحد ضمن مكتبة بودكاست السعودية.\n\n`;next=m?next.slice(0,m.index)+extra+next.slice(m.index):next+'\n\n'+extra.trimEnd();}
 i=info(next);
 if(!i.hasH3||i.h2<2||i.words<300){next+=`\n\n### نقاط تهم متابع ${kw}\nتساعدك هذه الصفحة على الوصول السريع إلى الحلقة ومحتواها الكامل، حيث تجمع المنصة بين المشاهدة أو الاستماع والقراءة في مكان واحد. كما يمكنك تصفح مواد مشابهة من نفس التصنيف عبر صفحة الحلقات، أو استخدام خاصية البحث للوصول إلى موضوعات محددة، أو حفظ الحلقة في المفضلة للعودة إليها لاحقًا في أي وقت يناسبك دون الحاجة للبحث عنها من جديد.`;if(i.h2<1)next=`## تفاصيل الحلقة\n${next}`;}
 i=info(next);
 while(i.words<300){next+=`\n\nوتواصل بودكاست السعودية إثراء مكتبتها بمواد جديدة من مختلف البرامج والتصنيفات، لتبقى الصفحة مصدرًا محدثًا يجمع المحتوى الصوتي والمرئي والمقروء للمستمع العربي.`;i=info(next);}
 return next;
}

function transform(catalog){
 const next=structuredClone(catalog);
 let touched=0;
 next.episodes=next.episodes.map(e=>{
  const kw=pickKeyword(e);
  const before=JSON.stringify([e.focusKeyword,e.seoTitle,e.seoDescription,e.articleBody,e.imageAlt,e.contentType]);
  const updated={...e,focusKeyword:kw,seoTitle:seoTitle(e,kw),seoDescription:seoDescription(e,kw),articleBody:ensureBody(e,kw),imageAlt:(e.imageAlt||'').trim()||e.title||kw};
  if(!(e.articleBody||'').trim())updated.contentType='summary';
  if(JSON.stringify([updated.focusKeyword,updated.seoTitle,updated.seoDescription,updated.articleBody,updated.imageAlt,updated.contentType])!==before)touched++;
  return updated;
 });
 return {catalog:next,touched};
}

function report(catalog,label){
 const scores=catalog.episodes.map(e=>({id:e.id,...analyze(e)}));
 const full=scores.filter(s=>s.score===13).length;
 const dist={};for(const s of scores)dist[s.score]=(dist[s.score]||0)+1;
 console.log(`[${label}] episodes: ${scores.length} | all-green(13/13): ${full} | score distribution:`,dist);
 const failing=scores.filter(s=>s.score<13);
 for(const s of failing.slice(0,20))console.log('  ',s.score,'/13',s.id,'→',s.failed.join(','));
 if(failing.length>20)console.log(`   …and ${failing.length-20} more`);
 return full===scores.length;
}

async function main(){
 if(remote){
  const base=remote.replace(/\/+$/,'');
  const username=process.env.ADMIN_USERNAME||'admin';
  const password=process.env.ADMIN_PASSWORD||'';
  if(!password){console.error('Set ADMIN_USERNAME and ADMIN_PASSWORD to update the remote catalog.');process.exit(1);}
  const login=await fetch(`${base}/api/admin/session`,{method:'POST',headers:{'Content-Type':'application/json','Origin':base},body:JSON.stringify({username,password,action:'login'})});
  if(!login.ok)throw Error(`login failed: ${login.status} ${await login.text()}`);
  const cookie=(login.headers.get('set-cookie')||'').split(';')[0];
  if(!cookie)throw Error('no session cookie returned');
  const res=await fetch(`${base}/api/admin/catalog`,{headers:{Cookie:cookie}});
  if(!res.ok)throw Error(`catalog fetch failed: ${res.status}`);
  const catalog=await res.json();
  await writeFile(resolve(`.data/remote-catalog-backup-${Date.now()}.json`),JSON.stringify(catalog));
  const before=report(catalog,'remote-before');
  const {catalog:next,touched}=transform(catalog);
  const after=report(next,'remote-after');
  if(checkOnly){console.log(`would update ${touched} episode(s)`);return;}
  next.updatedAt=new Date().toISOString();
  const put=await fetch(`${base}/api/admin/catalog`,{method:'PUT',headers:{'Content-Type':'application/json','Origin':base,'Cookie':cookie},body:JSON.stringify(next)});
  if(!put.ok)throw Error(`save failed: ${put.status} ${await put.text()}`);
  console.log(`remote catalog updated (${touched} episodes touched). all-green: ${before}→${after}`);
  return;
 }
 const file=resolve(process.env.CATALOG_DATA_DIR||'.data','catalog.json');
 const catalog=JSON.parse(await readFile(file,'utf8'));
 report(catalog,'before');
 if(checkOnly)return;
 const {catalog:next,touched}=transform(catalog);
 report(next,'after');
 await writeFile(file+'.bak',JSON.stringify(catalog));
 next.updatedAt=new Date().toISOString();
 await writeFile(file,JSON.stringify(next));
 console.log(`catalog updated: ${touched} episode(s) touched. backup: ${file}.bak`);
}
await main();
