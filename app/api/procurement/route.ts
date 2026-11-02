import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';
import {procurementPayload} from '@/lib/procurement/validation';
async function actor(){return (await headers()).get('oai-authenticated-user-id')}
const hash=async(s:ArrayBuffer|string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',typeof s==='string'?new TextEncoder().encode(s):s)),v=>v.toString(16).padStart(2,'0')).join('');
export async function GET(request:Request){
 const user=await actor();if(!user)return Response.json({error:'Sign in required'},{status:401});
 try{if(!env.DB||!env.BUCKET)throw Error();const u=new URL(request.url),id=u.searchParams.get('id');
 if(id){const d=await env.DB.prepare('SELECT filename,mime FROM procurement_documents WHERE id=? AND actor=?').bind(id,user).first<{filename:string;mime:string}>();if(!d)return new Response('Not found',{status:404});const f=await env.BUCKET.get(`procurement/${id}`);if(!f)return new Response('Not found',{status:404});return new Response(f.body,{headers:{'Content-Type':d.mime,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(d.filename)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
 const entity=u.searchParams.get('entity');if(!['dental','welby','layout'].includes(entity||''))return Response.json({error:'Choose a project'},{status:400});
 const docs=await env.DB.prepare('SELECT id,entity,type,status,vendor,email,phone,reference,related_reference,date,currency,total,items,filename,created_at,approved_at FROM procurement_documents WHERE actor=? AND entity=? ORDER BY created_at DESC').bind(user,entity).all();return Response.json({documents:docs.results.map(d=>({...d,items:JSON.parse(String(d.items))}))},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return Response.json({error:'Could not load procurement records'},{status:503});}
}
export async function POST(request:Request){
 const user=await actor();if(!user)return Response.json({error:'Sign in required'},{status:401});
 if(Number(request.headers.get('content-length')||0)>22*1024*1024)return Response.json({error:'File exceeds 20 MB'},{status:413});
 try{const form=await request.formData(),file=form.get('file');if(!(file instanceof File)||!file.size||file.size>20*1024*1024)return Response.json({error:'Choose a file up to 20 MB'},{status:400});
 let input;try{input=JSON.parse(String(form.get('payload')))}catch{return Response.json({error:'Invalid document data'},{status:400})}
 const parsed=procurementPayload.safeParse(input);if(!parsed.success)return Response.json({error:parsed.error.issues[0]?.message||'Check required fields'},{status:400});const d=parsed.data;
 const bytes=await file.arrayBuffer(),b=new Uint8Array(bytes);const mime=new TextDecoder().decode(b.slice(0,5))==='%PDF-'?'application/pdf':b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71?'image/png':b[0]===255&&b[1]===216&&b[2]===255?'image/jpeg':null;if(!mime)return Response.json({error:'Choose a PDF, PNG or JPEG'},{status:400});
 if(!env.DB||!env.BUCKET)throw Error();
 const digest=await hash(bytes);const businessKey=await hash(JSON.stringify([user,d.entity,d.type,d.vendor.toLowerCase().replace(/\s+/g,' '),d.reference.toLowerCase()]));const id=await hash(JSON.stringify([user,d.entity,digest]));
 if(await env.DB.prepare('SELECT id FROM procurement_documents WHERE id=? OR business_key=?').bind(id,businessKey).first())return Response.json({error:'This file or vendor document reference already exists in this project. Use a distinct revision reference for a revised document.'},{status:409});
 const filename=file.name.replace(/[\r\n\u0000]/g,'').slice(0,200)||'Document';await env.BUCKET.put(`procurement/${id}`,bytes,{httpMetadata:{contentType:mime}});
 try{await env.DB.prepare('INSERT INTO procurement_documents (id,actor,entity,hash,business_key,filename,mime,type,status,vendor,email,phone,reference,related_reference,date,currency,total,extracted_text,items,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,user,d.entity,digest,businessKey,filename,mime,d.type,d.type==='order'?'Draft':'Recorded',d.vendor,d.email,d.phone,d.reference,d.relatedReference,d.date,d.currency,d.total,d.text,JSON.stringify(d.items),new Date().toISOString()).run();}catch(e){if(await env.DB.prepare('SELECT id FROM procurement_documents WHERE id=? OR business_key=?').bind(id,businessKey).first())return Response.json({error:'Document already saved; no duplicate was created.'},{status:409});throw e;}
 return Response.json({id},{status:201});
 }catch{return Response.json({error:'Document could not be saved. Please retry.'},{status:503});}
}
export async function PATCH(request:Request){
 const user=await actor();if(!user)return Response.json({error:'Sign in required'},{status:401});
 const data=await request.json().catch(()=>null) as {id?:string;action?:string}|null;if(!data?.id||data.action!=='approve')return Response.json({error:'Invalid approval request'},{status:400});
 try{if(!env.DB)throw Error();const result=await env.DB.prepare("UPDATE procurement_documents SET status='Approved',approved_at=? WHERE id=? AND actor=? AND type='order' AND status='Draft'").bind(new Date().toISOString(),data.id,user).run();if(!result.meta.changes)return Response.json({error:'Draft order not found'},{status:409});return Response.json({ok:true});}catch{return Response.json({error:'Could not approve order'},{status:503});}
}
