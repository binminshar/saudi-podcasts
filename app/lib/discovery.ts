function rank(id:string){let hash=2166136261;for(const c of 'saudi-discovery-v1:'+id){hash=Math.imul(hash^c.charCodeAt(0),16777619);}hash^=hash>>>16;hash=Math.imul(hash,0x85ebca6b);hash^=hash>>>13;hash=Math.imul(hash,0xc2b2ae35);return (hash^(hash>>>16))>>>0;}
// Stable across server rendering, filtering and reloads; dates remain untouched.
export function discoveryOrder<T extends {id:string}>(episodes:T[]):T[]{return [...episodes].sort((a,b)=>rank(a.id)-rank(b.id)||a.id.localeCompare(b.id));}
