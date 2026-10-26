export type SeoInput={title:string;id:string;description:string;articleBody?:string;imageAlt?:string;image?:string;seoTitle?:string;seoDescription?:string;focusKeyword?:string;sourceUrl?:string};
export function analyzeSeo(e:SeoInput){
 const body=e.articleBody||'';const title=e.seoTitle||e.title;const description=e.seoDescription||e.description;
 const norm=(s:string)=>s.replace(/[\u064B-\u065F\u0670]/g,'').replace(/[أإآ]/g,'ا').toLowerCase();
 const keyword=norm(e.focusKeyword?.trim()||'');const words=body.trim().split(/\s+/).filter(Boolean);const paragraphs=body.split(/\n\s*\n/).filter(p=>p.trim()&&!p.startsWith('#'));const headings=body.split('\n').filter(l=>/^#{2,3}\s/.test(l));
 const checks=[
  {label:'عنوان SEO واضح بطول إرشادي 30–65 حرفًا',ok:title.length>=30&&title.length<=65,group:'seo'},
  {label:'وصف بحث بطول إرشادي 120–160 حرفًا',ok:description.length>=120&&description.length<=160,group:'seo'},
  {label:'تحديد عبارة مفتاحية للمحتوى',ok:!!keyword,group:'seo'},
  {label:'العبارة المفتاحية في عنوان البحث',ok:!!keyword&&norm(title).includes(keyword),group:'seo'},
  {label:'العبارة المفتاحية في وصف البحث',ok:!!keyword&&norm(description).includes(keyword),group:'seo'},
  {label:'العبارة المفتاحية في المقدمة',ok:!!keyword&&norm(paragraphs[0]||'').includes(keyword),group:'seo'},
  {label:'العبارة المفتاحية في أحد العناوين',ok:!!keyword&&headings.some(h=>norm(h).includes(keyword)),group:'seo'},
  {label:'صورة مصغرة ونص بديل وصفي',ok:!!e.image&&!!e.imageAlt?.trim(),group:'seo'},
  {label:'رابط حلقة قصير وواضح (حتى 80 حرفًا)',ok:e.id.length>0&&e.id.length<=80,group:'seo'},
  {label:'مقال لا يقل عن 300 كلمة عند ملاءمة الموضوع',ok:words.length>=300,group:'readability'},
  {label:'عنوانان رئيسيان على الأقل لتقسيم المقال',ok:headings.filter(h=>/^##\s/.test(h)).length>=2,group:'readability'},
  {label:'وجود عنوان فرعي داخل المقال',ok:headings.some(h=>/^###\s/.test(h)),group:'readability'},
  {label:'فقرات قصيرة: لا تتجاوز 120 كلمة للفقرة',ok:paragraphs.length>0&&paragraphs.every(p=>p.split(/\s+/).length<=120),group:'readability'},
 ];
 return {checks,words:words.length,score:Math.round(checks.filter(c=>c.ok).length/checks.length*100)};
}
