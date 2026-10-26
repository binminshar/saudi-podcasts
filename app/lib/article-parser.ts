import type {EpisodeArticle} from '../articles';
export function parseArticle(body:string):EpisodeArticle|null{
 if(!body.trim())return null;const result:EpisodeArticle={status:'reviewed',introduction:'',sections:[]};let current:EpisodeArticle['sections'][number]|undefined;let sub:{title:string;paragraphs:string[]}|undefined;let paragraph:string[]=[];
 const flush=()=>{if(!paragraph.length)return;const value=paragraph.join(' ').trim();if(sub)sub.paragraphs.push(value);else if(current)current.paragraphs.push(value);else result.introduction+=(result.introduction?'\n\n':'')+value;paragraph=[];};
 for(const line of body.split('\n')){const heading=line.match(/^(#{2,3})\s+(.+)$/);if(heading){flush();if(heading[1]==='##'||!current){current={id:'section-'+(result.sections.length+1),title:heading[2],paragraphs:[]};result.sections.push(current);sub=undefined;}else{sub={title:heading[2],paragraphs:[]};(current.subsections||=[]).push(sub);}}else if(!line.trim())flush();else paragraph.push(line);}flush();return result;
}
