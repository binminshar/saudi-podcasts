import {readBlob} from '../../lib/storage';
export const runtime='nodejs';export const dynamic='force-dynamic';
const types:Record<string,string>={png:'image/png',jpg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
export async function GET(_req:Request,{params}:{params:Promise<{file:string}>}){const {file}=await params;if(!/^[a-f0-9-]+\.(png|jpg|webp|gif)$/.test(file))return new Response(null,{status:404});try{const content=await readBlob(file);if(!content)return new Response(null,{status:404});return new Response(new Uint8Array(content),{headers:{'Content-Type':types[file.split('.').pop()!],'X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=31536000, immutable'}});}catch{return new Response(null,{status:404});}}
