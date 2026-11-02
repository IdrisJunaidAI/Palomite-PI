import {env} from 'cloudflare:workers';
import {headers} from 'next/headers';
import {z} from 'zod';
import source from '@/lib/source-data.json';
const row=z.object({ref:z.string().refine(v=>source.layout.some(r=>r.id===v)),title:z.string().trim().min(2).max(240),kind:z.enum(['expense','issue','progress']),amount:z.number().finite().min(0).max(1e9),status:z.enum(['Pending','Approved','Committed','Paid','Under Review','Open','In Progress','Resolved','Rejected']),notes:z.string().max(3000),page:z.number().int().min(1).max(20)});
const payload=z.object({rows:z.array(row).min(1).max(100),text:z.string().max(200000)});
async function actor(){return (await headers()).get('oai-authenticated-user-id')}
export async function GET(request:Request){
 if(!await actor())return Response.json({error:'Sign in required'},{status:401});
 const id=new URL(request.url).searchParams.get('id');
 try{
  if(!env.DB||!env.BUCKET)throw new Error('Storage unavailable');
  if(id){
   if(!/^[a-f0-9]{64}$/.test(id))return new Response('Invalid document',{status:400});
   const doc=await env.DB.prepare('SELECT filename,mime FROM layout_documents WHERE id=?').bind(id).first<{filename:string;mime:string}>();if(!doc)return new Response('Not found',{status:404});
   const object=await env.BUCKET.get(`layout/${id}`);if(!object)return new Response('Not found',{status:404});
   return new Response(object.body,{headers:{'Content-Type':doc.mime,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(doc.filename)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }
  const docs=await env.DB.prepare('SELECT id,filename,created_at,record_count FROM layout_documents ORDER BY created_at DESC LIMIT 100').all();return Response.json({documents:docs.results});
 }catch{return Response.json({error:'Documents are temporarily unavailable'},{status:503});}
}
export async function POST(request:Request){
 const user=await actor();if(!user)return Response.json({error:'Sign in required'},{status:401});
 if(Number(request.headers.get('content-length')||0)>22*1024*1024)return Response.json({error:'File exceeds 20 MB'},{status:413});
 try{
  const form=await request.formData();const file=form.get('file');
  if(!(file instanceof File)||!file.size||file.size>20*1024*1024)return Response.json({error:'Choose a PDF, PNG or JPEG up to 20 MB'},{status:400});
  const parsed=payload.safeParse(JSON.parse(String(form.get('payload')||'null')));if(!parsed.success)return Response.json({error:'Check the selected rooms, descriptions and amounts'},{status:400});
  const bytes=await file.arrayBuffer();const b=new Uint8Array(bytes);const sig=new TextDecoder().decode(b.slice(0,5));
  const mime=sig==='%PDF-'?'application/pdf':b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71?'image/png':b[0]===255&&b[1]===216&&b[2]===255?'image/jpeg':null;
  if(!mime)return Response.json({error:'This file is not a supported PDF, PNG or JPEG'},{status:400});
  if(!env.DB||!env.BUCKET)throw new Error('Storage unavailable');
  const id=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
  if(await env.DB.prepare('SELECT id FROM layout_documents WHERE id=?').bind(id).first())return Response.json({error:'This document has already been synced. Its records have not been duplicated.'},{status:409});
  const filename=file.name.replace(/[\r\n\u0000]/g,'').slice(0,200)||'Document';const now=new Date().toISOString();
  await env.BUCKET.put(`layout/${id}`,bytes,{httpMetadata:{contentType:mime}});
  const statements=[env.DB.prepare('INSERT INTO layout_documents (id,filename,mime,extracted_text,record_count,actor,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,filename,mime,parsed.data.text,parsed.data.rows.length,user,now),...parsed.data.rows.map(r=>env.DB!.prepare('INSERT INTO records (entity,kind,ref,title,amount,status,vendor,due_date,notes,actor,created_at,document_id,source_page) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind('layout',r.kind,r.ref,r.title,r.kind==='expense'?r.amount:0,r.status,'','',r.notes,user,now,id,r.page))];
  // D1 batch is transactional. A duplicate hash cannot create duplicate records.
  try{await env.DB.batch(statements);}catch(e){if(await env.DB.prepare('SELECT id FROM layout_documents WHERE id=?').bind(id).first())return Response.json({error:'This document has already been synced.'},{status:409});throw e;}
  return Response.json({id,count:parsed.data.rows.length},{status:201});
 }catch{return Response.json({error:'Could not sync this document. No records were partially imported. Please try again.'},{status:503});}
}
