'use client';
import {useEffect,useState} from 'react';
import {Upload,FileText,CheckCircle2,Plus,ArrowLeft} from 'lucide-react';
import {Button} from '@/components/ui/button';
import source from '@/lib/source-data.json';
import {proposeRecords,type Draft,type TextPage} from '@/lib/import/match';
import styles from './DocumentImport.module.css';
type Saved={id:string;filename:string;created_at:string;record_count:number};
export default function DocumentImport({onSynced}:{onSynced:()=>void}){
 const [file,setFile]=useState<File|null>(null),[pages,setPages]=useState<TextPage[]>([]),[rows,setRows]=useState<Draft[]>([]),[busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[error,setError]=useState(''),[success,setSuccess]=useState(''),[documents,setDocuments]=useState<Saved[]>([]);
 async function history(){try{const r=await fetch('/api/layout-documents');const j=await r.json() as {error?:string;documents:Saved[]};if(!r.ok)throw new Error(j.error);setDocuments(j.documents);}catch(e){setError(e instanceof Error?e.message:'Could not load documents');}}
 useEffect(()=>{void history()},[]);
 async function read(f:File){
  if(!/\.(pdf|png|jpe?g)$/i.test(f.name)||f.size>20*1024*1024){setError('Choose a PDF, PNG or JPEG up to 20 MB.');return;}
  setBusy(true);setError('');setSuccess('');setFile(f);setRows([]);setPages([]);setProgress('Opening document');
  try{const {extractDocument}=await import('@/lib/import/extract');const p=await extractDocument(f,setProgress);setPages(p);setRows(proposeRecords(p,source.layout));if(!p.some(x=>x.text.trim()))setError('No readable text was found. Try a clearer scan or enter the details below.');}
  catch(e){setError(e instanceof Error?e.message:'Could not read the document. Try a clearer scan.');setFile(null);}finally{setBusy(false);setProgress('');}
 }
 function update(index:number,patch:Partial<Draft>){setRows(r=>r.map((x,i)=>i===index?{...x,...patch}:x));}
 const selected=rows.filter(r=>r.selected);const valid=selected.length>0&&selected.every(r=>r.ref&&r.title.trim().length>=2&&Number.isFinite(r.amount)&&r.amount>=0);
 async function sync(){
  if(!file||!valid)return;setBusy(true);setError('');setProgress('Saving source document and room records');
  try{const form=new FormData();form.set('file',file);form.set('payload',JSON.stringify({rows:selected.map(({selected,...r})=>r),text:pages.map(p=>`Page ${p.page}\n${p.text}`).join('\n\n').slice(0,200000)}));const response=await fetch('/api/layout-documents',{method:'POST',body:form});const j=await response.json() as {error?:string;count:number};if(!response.ok)throw new Error(j.error);setSuccess(`${j.count} records synced to Palomita Layout. Your room activity and totals are updated.`);setFile(null);setPages([]);setRows([]);onSynced();await history();}
  catch(e){setError(e instanceof Error?e.message:'Could not sync document');}finally{setBusy(false);setProgress('');}
 }
 return <section className={styles.container}>
  <div className={styles.intro}><div><span className={styles.eyebrow}>DOCUMENT SYNC</span><h2>From document to room activity.</h2><p>Upload a PDF or scanned image. Review the extracted information, then sync it to the matching rooms.</p></div><FileText size={32}/></div>
  {error&&<p role="alert" className={styles.error}>{error}</p>}{success&&<p role="status" className={styles.success}><CheckCircle2 size={18}/>{success}</p>}
  {!file&&!busy&&<label className={styles.drop} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)void read(f)}}><Upload size={30}/><strong>Choose a document or drop it here</strong><span>PDF, PNG or JPEG • Up to 20 MB • PDFs up to 20 pages</span><input aria-label="Upload layout document" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={e=>{if(e.target.files?.[0])void read(e.target.files[0]);e.target.value=''}}/><small>Supports English printed text. Blurry scans and handwriting may need manual correction.</small></label>}
  {busy&&<div className={styles.loading} role="status" aria-live="polite"><span className={styles.spinner}/>{progress}<small>Keep this page open while the document is processed.</small></div>}
  {file&&!busy&&<div className={styles.review}>
   <div className={styles.reviewHead}><div><h3>{file.name}</h3><p>{pages.length} pages read • {rows.length} suggested records</p></div><Button variant="outline" onClick={()=>{setFile(null);setRows([]);setPages([]);setError('')}}><ArrowLeft size={16}/>Change file</Button></div>
   <p className={styles.note}>Room numbers and unique room names are matched automatically. Check descriptions and select a room for any uncertain match. Imported room entries start as progress. Use Procurement for vendor quotations, orders, invoices and payments. Every entry starts Pending. Verify the type, amount and status against the source before syncing.</p>
   <details className={styles.text}><summary>View extracted document text</summary>{pages.map(p=><div key={p.page}><strong>Page {p.page} • {p.method==='ocr'?'Scanned text':'PDF text'}</strong><pre>{p.text||'No readable text'}</pre></div>)}</details>
   {!rows.length&&<p className={styles.note}>No registered rooms were confidently identified. Use the extracted text above and add a record with the correct room.</p>}
   {rows.map((r,i)=><article className={styles.row} key={i}>
    <div className={styles.rowHead}><label><input type="checkbox" checked={r.selected} onChange={e=>update(i,{selected:e.target.checked})}/> Include record {i+1}</label><span>Source page {r.page}</span>{!r.ref&&<b>Room needs review</b>}</div>
    <div className={styles.fields}><label>Room<select value={r.ref} onChange={e=>update(i,{ref:e.target.value})}><option value="">Choose a room</option>{source.layout.map(room=><option key={room.id} value={room.id}>{room.id} · {room.name}</option>)}</select></label><label>Record type<select value={r.kind} onChange={e=>update(i,{kind:e.target.value as Draft['kind']})}><option value="progress">Progress</option><option value="issue">Issue</option><option value="expense">Expense</option></select></label><label>Status<select value={r.status} onChange={e=>update(i,{status:e.target.value})}>{['Pending','Approved','Committed','Paid','Under Review','Open','In Progress','Resolved','Rejected'].map(s=><option key={s}>{s}</option>)}</select></label>{r.kind==='expense'&&<label>Amount ($)<input type="number" min="0" max="1000000000" step="0.01" value={r.amount} onChange={e=>update(i,{amount:e.target.value===''?0:Number(e.target.value)})}/></label>}<label className={styles.wide}>Description<input maxLength={240} value={r.title} onChange={e=>update(i,{title:e.target.value})}/></label><label className={styles.wide}>Source details<textarea maxLength={3000} rows={2} value={r.notes} onChange={e=>update(i,{notes:e.target.value})}/></label><label>Source page<select value={r.page} onChange={e=>update(i,{page:Number(e.target.value)})}>{pages.map(p=><option key={p.page}>{p.page}</option>)}</select></label></div>
   </article>)}
   <div className={styles.actions}><Button variant="outline" disabled={rows.length>=100} onClick={()=>setRows(r=>[...r,{ref:'',title:'',kind:'progress',amount:0,status:'Pending',notes:'',page:1,selected:true}])}><Plus size={16}/>Add record</Button><Button disabled={!valid} onClick={()=>void sync()}>Sync {selected.length} selected records</Button></div><small>Sync adds new records and retains the original document. Existing records and source budgets are preserved. The same file cannot be imported twice.</small>
  </div>}
  <div className={styles.history}><h3>Synced documents</h3>{!documents.length?<p>Your synced documents will appear here with their source files.</p>:documents.map(d=><div key={d.id}><FileText size={19}/><a href={`/api/layout-documents?id=${d.id}`} download>{d.filename}</a><span>{d.record_count} records</span><time>{new Date(d.created_at).toLocaleDateString()}</time></div>)}</div>
 </section>
}
