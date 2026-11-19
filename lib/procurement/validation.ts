import {z} from 'zod';
import source from '../source-data.json';
const money=z.number().finite().min(0).max(1e9);
export const procurementPayload=z.object({
 entity:z.enum(['dental','welby','layout']),type:z.enum(['quotation','order','invoice','payment']),
 vendor:z.string().trim().min(2).max(160),email:z.union([z.string().email().max(200),z.literal('')]),phone:z.string().max(80),
 reference:z.string().trim().min(1).max(120),relatedReference:z.string().trim().max(120),
 date:z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v),z.literal('')]),
 currency:z.enum(['USD','NGN','GBP','EUR','CAD']),total:money,text:z.string().max(200000),
 items:z.array(z.object({description:z.string().trim().min(2).max(500),category:z.enum(['material','labor','other']),quantity:money.nullable(),unit:z.string().max(40),unitPrice:money.nullable(),amount:money.nullable(),room:z.string().max(30),page:z.number().int().min(1).max(20)})).max(100),
}).superRefine((d,c)=>{d.items.forEach((i,n)=>{if(i.room&&(d.entity!=='layout'||!source.layout.some(r=>r.id===i.room)))c.addIssue({code:'custom',message:'Invalid room for this project',path:['items',n,'room']});});});
