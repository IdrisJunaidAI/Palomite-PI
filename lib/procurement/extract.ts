export const documentTypes=['quotation','order','invoice','payment','unknown'] as const;
export type DocType=typeof documentTypes[number];
export type Item={description:string;category:'material'|'labor'|'other';quantity:number|null;unit:string;unitPrice:number|null;amount:number|null;room:string;page:number};
export type Extraction={type:DocType;vendor:string;email:string;phone:string;reference:string;relatedReference:string;date:string;currency:string;total:number|null;items:Item[];warnings:string[]};
const num=(v:string)=>Number(v.replace(/,/g,''));
export function extractProcurement(pages:{page:number;text:string}[]):Extraction{
 const text=pages.map(p=>p.text).join('\n');
 const type:DocType=/\b(payment receipt|payment confirmation|paid receipt)\b/i.test(text)?'payment':/\b(purchase order|work order)\b/i.test(text)?'order':/\b(quotation|quote|estimate)\b/i.test(text)?'quotation':/\binvoice\b/i.test(text)?'invoice':'unknown';
 const field=(re:RegExp)=>text.match(re)?.[1]?.trim()||'';
 const currencies=[...new Set((text.match(/\b(?:USD|NGN|GBP|EUR|CAD)\b/g)||[]))];
 const symbol=/₦/.test(text)?'NGN':/£/.test(text)?'GBP':/€/.test(text)?'EUR':'';
 const currency=currencies.length===1?currencies[0]:currencies.length>1?'':symbol;
 const totals=[...text.matchAll(/^\s*(?:grand total|total(?: amount)?|amount paid)\s*[:=]?\s*(?:USD|NGN|GBP|EUR|CAD|[$₦£€])?\s*([\d,]+(?:\.\d{1,2})?)\s*$/gim)].map(m=>num(m[1]));
 const total=totals.length&&totals.every(t=>t===totals[0])?totals[0]:null;
 const items:Item[]=[];
 for(const p of pages){for(const raw of p.text.split('\n')){
  const line=raw.trim();
  if(/^(?:sub\s*total|grand total|total|tax|vat|discount|balance|amount paid|deposit|shipping|delivery|freight)\b/i.test(line))continue;
  // Only accept explicit table rows: description | quantity | unit | unit price | amount,
  // or a whitespace table ending with quantity, optional unit, unit price and amount.
  const m=line.match(/^(.+?)\s*(?:\||\t|\s{2,})\s*(\d+(?:\.\d+)?)\s*(?:\||\t|\s+)\s*([a-zA-Z²³]+)?\s*(?:\||\t|\s)*\s*[$₦£€]?([\d,]+\.\d{2})\s*(?:\||\t|\s+)\s*[$₦£€]?([\d,]+\.\d{2})\s*$/);
  if(!m)continue;
  const description=m[1].trim();
  const category=/\b(labou?r|workmanship|installation|hour|wages)\b/i.test(description+' '+(m[3]||''))?'labor':/\b(material|cement|tile|cable|wire|pipe|paint|steel|sand|brick|timber|door|window|concrete|fixture)\b/i.test(description)?'material':'other';
  items.push({description,category,quantity:num(m[2]),unit:m[3]||'',unitPrice:num(m[4]),amount:num(m[5]),room:description.match(/\b(?:room|rm)\s*#?\s*(\d{3})\b/i)?.[1]||'',page:p.page});
 }}
 const warnings=['Extraction uses printed text recognition and conservative field matching. Review against the original before saving.'];
 if(!currency)warnings.push('Confirm the currency. A dollar sign alone does not identify USD or CAD.');
 if(type==='unknown')warnings.push('Document type needs your selection.');
 if(!items.length)warnings.push('No supported item table was found. Extracted text is available; add or correct line items before saving.');
 if(total===null)warnings.push('A unique labeled document total was not found.');
 if(items.some(i=>Math.abs((i.quantity||0)*(i.unitPrice||0)-(i.amount||0))>0.02))warnings.push('One or more line amounts differ from quantity multiplied by unit price.');
 return {type,vendor:field(/^\s*(?:vendor|supplier|contractor|from|company)\s*:\s*(.+)$/im),email:field(/([\w.+-]+@[\w.-]+\.[a-z]{2,})/i),phone:field(/^\s*(?:phone|tel|telephone)\s*:\s*(.+)$/im),reference:field(/^\s*(?:(?:quotation|quote|estimate|invoice|purchase order|work order|receipt|payment)(?:\s*(?:number|no\.?|#))?|reference|ref\.?)\s*[:#]\s*([\w./-]+)\s*$/im),relatedReference:field(/^\s*(?:related reference|invoice reference|order reference|po reference)\s*:\s*(.+)$/im),date:field(/^\s*(?:date|issue date|invoice date)\s*:\s*(\d{4}-\d{2}-\d{2})\s*$/im),currency,total,items:items.slice(0,100),warnings};
}
