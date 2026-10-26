import {NextRequest,NextResponse} from 'next/server';
import {randomUUID} from 'node:crypto';
import {authorized,sameOrigin} from '../../../lib/admin-auth';
import {writeBlob} from '../../../lib/storage';
export const runtime='nodejs';
const types:Record<string,string>={png:'image/png',jpg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
export async function POST(req:NextRequest){if(!await authorized(req)||!sameOrigin(req))return NextResponse.json({error:'طلب غير مصرح'},{status:403});try{const form=await req.formData();const file=form.get('file');if(!(file instanceof File)||!file.size||file.size>5*1024*1024)return NextResponse.json({error:'اختر صورة بحجم لا يتجاوز 5 ميجابايت'},{status:400});const b=Buffer.from(await file.arrayBuffer());const ext=b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':b[0]===255&&b[1]===216&&b[2]===255?'jpg':b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'?'webp':/^GIF8[79]a$/.test(b.toString('ascii',0,6))?'gif':null;if(!ext)return NextResponse.json({error:'الصور المسموحة PNG أو JPG أو WebP أو GIF'},{status:400});const name=randomUUID()+'.'+ext;await writeBlob(name,b,types[ext]);return NextResponse.json({url:'/uploads/'+name});}catch{return NextResponse.json({error:'تعذر رفع الصورة'},{status:400});}}
