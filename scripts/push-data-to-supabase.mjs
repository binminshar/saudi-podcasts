// Copies the local .data folder (catalog.json, admin-auth.json, uploads/*) to Supabase.
// Usage: node scripts/push-data-to-supabase.mjs [--force]
//   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY come from the environment or a .env file.
//   --force overwrites an admin account that already exists remotely.
import {readFile,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join,resolve,extname} from 'node:path';

if(existsSync('.env'))for(const line of (await readFile('.env','utf8')).split(/\r?\n/)){const m=line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);if(m&&!(m[1] in process.env))process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'');}
const url=(process.env.SUPABASE_URL||'').replace(/\/$/,'');const key=process.env.SUPABASE_SERVICE_ROLE_KEY||'';
if(!url||!key){console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (environment or .env).');process.exit(1);}
const table=process.env.SUPABASE_DOCUMENTS_TABLE||'site_documents';const bucket=process.env.SUPABASE_UPLOADS_BUCKET||'uploads';
const dataDirectory=resolve(process.env.CATALOG_DATA_DIR||'.data');const force=process.argv.includes('--force');
const headers=extra=>({apikey:key,Authorization:'Bearer '+key,...extra});
const types={'.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};

async function ensureTable(){const r=await fetch(`${url}/rest/v1/${table}?select=key&limit=1`,{headers:headers({Accept:'application/json'})});if(r.ok)return;console.error(`Table "${table}" is missing or unreachable (${r.status}). Run supabase/migrations/0001_site_documents.sql in the Supabase SQL editor first.`);process.exit(1);}
async function ensureBucket(){const r=await fetch(`${url}/storage/v1/bucket/${bucket}`,{headers:headers()});if(r.ok)return;const c=await fetch(`${url}/storage/v1/bucket`,{method:'POST',headers:headers({'Content-Type':'application/json'}),body:JSON.stringify({id:bucket,name:bucket,public:false,file_size_limit:5*1024*1024,allowed_mime_types:Object.values(types)})});if(!c.ok)throw Error('Could not create bucket: '+await c.text());console.log(`Created private bucket "${bucket}"`);}
async function exists(name){const r=await fetch(`${url}/rest/v1/${table}?key=eq.${encodeURIComponent(name)}&select=key`,{headers:headers({Accept:'application/json'})});return r.ok&&(await r.json()).length>0;}
async function pushDocument(name,{overwrite}){const path=join(dataDirectory,name);if(!existsSync(path)){console.log(`skip ${name} (not found locally)`);return;}if(!overwrite&&await exists(name)){console.log(`keep ${name} (already on Supabase; use --force to replace)`);return;}const value=await readFile(path,'utf8');JSON.parse(value);const r=await fetch(`${url}/rest/v1/${table}?on_conflict=key`,{method:'POST',headers:headers({'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify({key:name,value,updated_at:new Date().toISOString()})});if(!r.ok)throw Error(`Failed to push ${name}: ${r.status} ${await r.text()}`);console.log(`pushed ${name} (${(value.length/1024).toFixed(0)} KB)`);}
async function pushUploads(){const folder=join(dataDirectory,'uploads');if(!existsSync(folder))return;let count=0;for(const file of await readdir(folder)){const type=types[extname(file).toLowerCase()];if(!type||!/^[a-f0-9-]+\.(png|jpg|webp|gif)$/.test(file))continue;const body=await readFile(join(folder,file));const r=await fetch(`${url}/storage/v1/object/${bucket}/${file}`,{method:'POST',headers:headers({'Content-Type':type,'x-upsert':'true','Cache-Control':'31536000'}),body:new Uint8Array(body)});if(!r.ok)throw Error(`Failed to upload ${file}: ${r.status} ${await r.text()}`);count++;}console.log(`uploaded ${count} image(s)`);}

await ensureTable();await ensureBucket();
await pushDocument('catalog.json',{overwrite:true});
await pushDocument('admin-auth.json',{overwrite:force});
await pushUploads();
console.log('Done. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server to use this data.');
