import 'server-only';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';

export const dataDirectory=resolve(process.env.CATALOG_DATA_DIR||'.data');
const supabaseUrl=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const supabaseKey=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
export const remote=!!(supabaseUrl&&supabaseKey);
export const storageBackend=remote?'supabase':'filesystem';
const documentsBucket=process.env.SUPABASE_DOCUMENTS_BUCKET||'documents';
const uploadsBucket=process.env.SUPABASE_UPLOADS_BUCKET||'uploads';
const documentName=/^[a-z0-9-]+\.json$/;
const blobName=/^[a-f0-9-]+\.(png|jpg|webp|gif)$/;

export class ExistsError extends Error{}

function headers(extra:Record<string,string>={}){return {apikey:supabaseKey,Authorization:'Bearer '+supabaseKey,...extra};}
async function failure(action:string,name:string,r:Response){return Error(`Supabase ${action} failed for ${name} (${r.status}): ${(await r.text()).slice(0,300)}`);}
function objectUrl(bucket:string,name:string){return `${supabaseUrl}/storage/v1/object/${bucket}/${name}`;}

async function download(bucket:string,name:string):Promise<Response|null>{
 const r=await fetch(objectUrl(bucket,name),{headers:headers(),cache:'no-store'});
 if(r.status===400||r.status===404)return null;
 if(!r.ok)throw await failure('download',name,r);
 return r;
}

async function upload(bucket:string,name:string,body:BodyInit,contentType:string,{exclusive=false,cache='no-cache'}={}):Promise<void>{
 const r=await fetch(objectUrl(bucket,name),{method:'POST',headers:headers({'Content-Type':contentType,'x-upsert':exclusive?'false':'true','Cache-Control':cache}),body});
 if(exclusive&&r.status===409)throw new ExistsError(name);
 if(!r.ok)throw await failure('upload',name,r);
}

export async function readDocument(name:string):Promise<string|null>{
 if(!documentName.test(name))throw Error('اسم مستند غير صالح');
 if(!remote){try{return await readFile(join(dataDirectory,name),'utf8');}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}}
 const r=await download(documentsBucket,name);
 return r?await r.text():null;
}

export async function writeDocument(name:string,value:string,{exclusive=false}={}):Promise<void>{
 if(!documentName.test(name))throw Error('اسم مستند غير صالح');
 if(!remote){
  await mkdir(dataDirectory,{recursive:true});
  if(exclusive){await writeFile(join(dataDirectory,name),value,{flag:'wx',mode:0o600});return;}
  const temp=join(dataDirectory,`${name}-${randomUUID()}.tmp`);await writeFile(temp,value,'utf8');await rename(temp,join(dataDirectory,name));return;
 }
 await upload(documentsBucket,name,new TextEncoder().encode(value),'application/json',{exclusive});
}

export async function readBlob(name:string):Promise<Buffer|null>{
 if(!blobName.test(name))return null;
 if(!remote){try{return await readFile(join(dataDirectory,'uploads',name));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}}
 const r=await download(uploadsBucket,name);
 return r?Buffer.from(await r.arrayBuffer()):null;
}

export async function writeBlob(name:string,content:Buffer,contentType:string):Promise<void>{
 if(!blobName.test(name))throw Error('اسم ملف غير صالح');
 if(!remote){await mkdir(join(dataDirectory,'uploads'),{recursive:true});await writeFile(join(dataDirectory,'uploads',name),content,{flag:'wx'});return;}
 await upload(uploadsBucket,name,new Uint8Array(content),contentType,{exclusive:true,cache:'31536000'});
}
