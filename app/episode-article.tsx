import {BookOpen,Clock,List} from 'lucide-react';
import type {EpisodeArticle as Article} from './articles';

export default function EpisodeArticle({article,title,show,contentType='full'}:{article:Article|null;title:string;show:string;contentType?:'summary'|'full'|'article'}) {
 if (!article) return <section className="episode-article article-pending"><BookOpen size={26}/><h2>الحلقة مكتوبة</h2><p>سيظهر هنا التفريغ المنسق بعد إضافته ومراجعته.</p></section>;
 const words=[article.introduction,...article.sections.flatMap(s=>[s.title,...s.paragraphs,...(s.subsections||[]).flatMap(sub=>[sub.title,...sub.paragraphs])])].join(' ').split(/\s+/).length;
 return <article className="episode-article" aria-labelledby="article-title">
  <header className="article-header"><span className="eyebrow"><BookOpen size={17}/> استمع أو اقرأ</span><h2 id="article-title">{title}: {contentType==='summary'?'ملخص الحلقة':contentType==='article'?'المقال الكامل':'التفريغ الكامل'}</h2><div className="article-meta"><span>بودكاست {show}</span><span><Clock size={14}/> {Math.max(1,Math.ceil(words/180))} دقائق قراءة</span></div>{article.status==='demo'&&<p className="article-notice">نموذج مقال تجريبي لتوضيح تنسيق المحتوى. ليس تفريغًا للتسجيل الصوتي.</p>}</header>
  <div className="article-layout"><nav className="article-toc" aria-label="فهرس المقال"><h3><List size={17}/> محتويات المقال</h3><a href="#article-intro">مقدمة</a>{article.sections.map(section=><div key={section.id}><a href={`#article-${section.id}`}>{section.title}</a>{section.subsections?.map((sub,index)=><a className="toc-subheading" key={index} href={`#article-${section.id}-${index}`}>{sub.title}</a>)}</div>)}</nav>
  <div className="article-body"><section id="article-intro"><h3>مقدمة</h3><p className="article-lead">{article.introduction}</p></section>{article.sections.map(section=><section id={`article-${section.id}`} key={section.id}><h3>{section.title}</h3>{section.paragraphs.map((p,i)=><p key={i}>{p}</p>)}{section.subsections?.map((sub,index)=><section id={`article-${section.id}-${index}`} key={index}><h4>{sub.title}</h4>{sub.paragraphs.map((p,i)=><p key={i}>{p}</p>)}</section>)}</section>)}</div></div>
 </article>;
}
