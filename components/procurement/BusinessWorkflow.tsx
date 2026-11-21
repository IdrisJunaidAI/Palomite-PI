'use client';
import {Button} from '@/components/ui/button';
import styles from '../layout/DocumentImport.module.css';

type Submission = {id:string; type:string; status:string; vendor:string; reference:string; total:number; currency:string};
type Props<T extends Submission> = {
  documents:T[];
  onOpen:(tab:string)=>void;
  onApprove:(doc:T)=>void;
  busy:boolean;
  error:string;
};

export default function BusinessWorkflow<T extends Submission>({documents,onOpen,onApprove,busy,error}:Props<T>) {
  const pending=documents.filter(d=>(d.type==='quotation'&&d.status==='Recorded')||(d.type==='order'&&d.status==='Draft'));
  return <section className={styles.container}>
    <div className={styles.intro}><div><h2>Vendor workflow</h2><p>Review the vendor’s scope, approve a commitment, then authorize each installment and track collection.</p></div></div>
    <div className={styles.actions}>
      <Button onClick={()=>onOpen('Documents')}>Upload or review documents</Button>
      <Button variant="outline" onClick={()=>onOpen('Materials')}>Compare materials</Button>
      <Button variant="outline" onClick={()=>onOpen('Labor')}>Compare workmanship</Button>
      <Button onClick={()=>onOpen('Payment schedule')}>Vendor payments</Button>
    </div>
    <section className={styles.review}><h3>Awaiting commitment approval ({pending.length})</h3>
      <p>Choose the agreed version for each scope. Resolve unclear quantities or terms with the vendor before approval. Keep subsequent invoices linked to the same commitment.</p>
      {error&&<p role="alert">{error}</p>}
      {pending.map(doc=><article className={styles.row} key={doc.id}><h3>{doc.vendor} · {doc.reference}</h3>
        <p>{doc.type} · {new Intl.NumberFormat('en',{style:'currency',currency:doc.currency}).format(doc.total)}</p>
        <div className={styles.actions}><a href={`/api/procurement?id=${doc.id}`} download>Review original document</a>
        <Button disabled={busy} onClick={()=>onApprove(doc)}>Approve {doc.type}</Button></div>
      </article>)}
      {!pending.length&&<p>No quotations or draft orders await approval.</p>}
    </section>
  </section>
}
