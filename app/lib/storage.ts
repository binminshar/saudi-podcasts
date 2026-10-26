import 'server-only';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';

export const dataDirectory=resolve(process.env.CATALOG_DATA_DIR||'.data');
const supabaseUrl=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const supabaseKey=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
export const remote=!!(supabaseUrl&&supabaseKey);
export const storageBackend=remote?'supabase':'filesystem';
const table=process.env.SUPABASE_DOCUMENTS_TABLE||'site_documents';
const bucket=process.env.SUPABASE_UPLOADS_BUCKET||'uploads';
const blobName=/^[a-f0-9-]+\.(png|jpg|webp|gif)$/;

export class ExistsError extends Error{}

function headers(extra:Record<string,string>={}){return {apikey:supabaseKey,Authorization:'Bearer '+supabaseKey,...extra};}
async function failure(action:string,name:string,r:Response){return Error(`Supabase ${action} failed for ${name} (${r.status}): ${(await r.text()).slice(0,300)}`);}

export async function readDocument(name:string):Promise<string|null>{
 if(!remote){try{return await readFile(join(dataDirectory,name),'utf8');}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}}
 const r=await fetch(`${supabaseUrl}/rest/v1/${table}?key=eq.${encodeURIComponent(name)}&select=value`,{headers:headers({Accept:'application/json'}),cache:'no-store'});
 if(!r.ok)throw await failure('read',name,r);
 const rows=await r.json() as {value:string}[];
 return rows[0]?.value??null;
}

export async function writeDocument(name:string,value:string,{exclusive=false}={}):Promise<void>{
 if(!remote){
  await mkdir(dataDirectory,{recursive:true});
  if(exclusive){await writeFile(join(dataDirectory,name),value,{flag:'wx',mode:0o600});return;}
  const temp=join(dataDirectory,`${name}-${randomUUID()}.tmp`);await writeFile(temp,value,'utf8');await rename(temp,join(dataDirectory,name));return;
 }
 const r=await fetch(`${supabaseUrl}/rest/v1/${table}${exclusive?'':'?on_conflict=key'}`,{method:'POST',headers:headers({'Content-Type':'application/json',Prefer:exclusive?'return=minimal':'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify({key:name,value,updated_at:new Date().toISOString()})});
 if(exclusive&&r.status===409)throw new ExistsError(name);
 if(!r.ok)throw await failure('write',name,r);
}

export async function readBlob(name:string):Promise<Buffer|null>{
 if(!blobName.test(name))return null;
 if(!remote){try{return await readFile(join(dataDirectory,'uploads',name));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}}
 const r=await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${name}`,{headers:headers(),cache:'no-store'});
 if(r.status===400||r.status===404)return null;
 if(!r.ok)throw await failure('download',name,r);
 return Buffer.from(await r.arrayBuffer());
}

export async function writeBlob(name:string,content:Buffer,contentType:string):Promise<void>{
 if(!blobName.test(name))throw Error('اسم ملف غير صالح');
 if(!remote){await mkdir(join(dataDirectory,'uploads'),{recursive:true});await writeFile(join(dataDirectory,'uploads',name),content,{flag:'wx'});return;}
 const r=await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${name}`,{method:'POST',headers:headers({'Content-Type':contentType,'x-upsert':'false','Cache-Control':'31536000'}),body:new Uint8Array(content)});
 if(r.status===409)throw new ExistsError(name);
 if(!r.ok)throw await failure('upload',name,r);
}
