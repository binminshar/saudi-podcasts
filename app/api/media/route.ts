import {NextRequest,NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const HOSTS:Record<string,{referer?:string}>={
 'api.hosting.thmanyah.com':{referer:'https://thmanyah.com/'},
 'files.hosting.thmanyah.com':{referer:'https://thmanyah.com/'},
 'media.podeo.co':{},
};
const PASS=['content-type','content-length','content-range','accept-ranges','etag','last-modified'];
export async function GET(req:NextRequest){
 const src=req.nextUrl.searchParams.get('src');
 if(!src)return NextResponse.json({error:'missing src'},{status:400});
 let url:URL;
 try{url=new URL(src);}catch{return NextResponse.json({error:'bad url'},{status:400});}
 const rule=HOSTS[url.host];
 if(url.protocol!=='https:'||!rule)return NextResponse.json({error:'host not allowed'},{status:403});
 const headers:Record<string,string>={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36','Accept':'*/*'};
 if(rule.referer)headers['Referer']=rule.referer;
 const range=req.headers.get('range');
 if(range)headers['Range']=range;
 const upstream=await fetch(url,{headers,redirect:'follow'}).catch(()=>null);
 if(!upstream)return NextResponse.json({error:'upstream error'},{status:502});
 const out=new Headers();
 for(const h of PASS){const v=upstream.headers.get(h);if(v)out.set(h,v);}
 out.set('Cache-Control','public, max-age=3600');
 return new NextResponse(upstream.body,{status:upstream.status,headers:out});
}
