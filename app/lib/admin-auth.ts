import 'server-only';
import {randomBytes,scryptSync,timingSafeEqual,createHmac} from 'node:crypto';
import type {NextRequest} from 'next/server';
import {readDocument,writeDocument,ExistsError} from './storage';
type Credentials={username?:string;salt:string;hash:string;secret:string};
const document='admin-auth.json';
export const cookieName='podcast_admin';
const usernamePattern=/^[a-zA-Z0-9_.-]{3,40}$/;
async function stored():Promise<Credentials|null>{const raw=await readDocument(document);return raw===null?null:JSON.parse(raw);}
export async function credentials():Promise<Credentials|null>{
 const c=await stored();if(c)return c;
 const username=process.env.ADMIN_USERNAME||'';const password=process.env.ADMIN_PASSWORD||'';
 if(!username||!password)return null;
 try{return await configure(password,username);}catch(e){if(e instanceof ExistsError||(e as NodeJS.ErrnoException).code==='EEXIST')return stored();throw e;}
}
export async function configure(password:string,username:string){if(!usernamePattern.test(username))throw Error('اسم المستخدم بين 3 و40 حرفًا إنجليزيًا أو رقمًا');if(password.length<12||password.length>200)throw Error('اختر كلمة مرور بين 12 و200 حرف');const salt=randomBytes(24).toString('hex');const c={username,salt,hash:scryptSync(password,salt,64).toString('hex'),secret:randomBytes(48).toString('hex')};await writeDocument(document,JSON.stringify(c),{exclusive:true});return c;}
export function verifyPassword(password:string,c:Credentials,username:string){const hash=scryptSync(password,c.salt,64);return timingSafeEqual(hash,Buffer.from(c.hash,'hex'))&&username===(c.username||'admin');}
export function sign(c:Credentials){const payload=`${Date.now()+8*60*60*1000}.${randomBytes(16).toString('hex')}`;return payload+'.'+createHmac('sha256',c.secret).update(payload).digest('hex');}
export async function authorized(request:NextRequest){const c=await credentials();if(!c)return false;const token=request.cookies.get(cookieName)?.value||'';if(!/^\d{13}\.[a-f0-9]{32}\.[a-f0-9]{64}$/.test(token))return false;const [expires,nonce,sig]=token.split('.');if(Number(expires)<Date.now())return false;const expected=createHmac('sha256',c.secret).update(expires+'.'+nonce).digest('hex');return timingSafeEqual(Buffer.from(sig),Buffer.from(expected));}
export function sameOrigin(request:NextRequest){try{const origin=new URL(request.headers.get('origin')||'');return ['http:','https:'].includes(origin.protocol)&&origin.host===request.headers.get('host');}catch{return false;}}
export function secureCookies(request:NextRequest){return request.nextUrl.protocol==='https:'||request.headers.get('x-forwarded-proto')==='https';}
