import {test} from 'node:test';import assert from 'node:assert/strict';import ts from 'typescript';import {readFile,writeFile,unlink,readdir} from 'node:fs/promises';import {DatabaseSync} from 'node:sqlite';
const transpile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const rules=transpile(await readFile('lib/scheduling/rules.ts','utf8'));
const {utcFromLocal}=await import('data:text/javascript;base64,'+Buffer.from(rules).toString('base64'));
test('Chicago summer and winter offsets, Lagos offset',()=>{assert.equal(utcFromLocal('2027-01-12','09:00','America/Chicago'),'2027-01-12T15:00:00.000Z');assert.equal(utcFromLocal('2027-07-12','09:00','America/Chicago'),'2027-07-12T14:00:00.000Z');assert.equal(utcFromLocal('2027-07-12','09:00','Africa/Lagos'),'2027-07-12T08:00:00.000Z')});
test('invalid dates and daylight saving ambiguity are rejected',()=>{assert.throws(()=>utcFromLocal('2027-02-30','09:00','UTC'));assert.throws(()=>utcFromLocal('2027-03-14','02:30','America/Chicago'));assert.throws(()=>utcFromLocal('2027-11-07','01:30','America/Chicago'))});
test('API isolates accounts, limits installments, guards collection and preserves history',async()=>{
 const db=new DatabaseSync(':memory:');for(const f of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())db.exec(await readFile('drizzle/'+f,'utf8'));
 const cols=db.prepare('pragma table_info(procurement_documents)').all().map(c=>c.name);const vals=Object.fromEntries(cols.map(c=>[c,'']));Object.assign(vals,{id:'doc',actor:'user1',entity:'dental',type:'quotation',total:100,currency:'USD',vendor:'Test',reference:'Q1',business_key:'unique'});db.prepare(`insert into procurement_documents (${cols.join(',')}) values (${cols.map(()=>'?').join(',')})`).run(...cols.map(c=>vals[c]));
 const adapter={prepare(sql){return {bind(...v){return {
 async first(){return db.prepare(sql).get(...v)||null},
 async all(){return {results:db.prepare(sql).all(...v)}},
 async run(){return {meta:{changes:db.prepare(sql).run(...v).changes}}}
 };}};}};
 globalThis.__scheduleTest={user:'user1',env:{DB:adapter}};
 const filename=new URL('./schedule-api-temporary.mjs',import.meta.url);
 let code=transpile(await readFile('app/api/vendor-schedules/route.ts','utf8')).replace("import { env } from 'cloudflare:workers';","const env=globalThis.__scheduleTest.env;").replace("import { headers } from 'next/headers';","const headers=async()=>({get:()=>globalThis.__scheduleTest.user});").replace("import { utcFromLocal, transitions, zones } from '@/lib/scheduling/rules';",rules.replaceAll('export ',''));
 await writeFile(filename,code);
 try{const api=await import(filename.href);const base={id:crypto.randomUUID(),version:0,entity:'dental',documentId:'doc',amount:60,date:'2030-06-12',startTime:'09:00',endTime:'12:00',timeZone:'America/Chicago',location:'Office',contact:'',checkNumber:'',recipient:'',notes:'',status:'Scheduled'};const post=x=>api.POST(new Request('https://test/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(x)}));
 assert.equal((await post(base)).status,200);assert.equal((await post({...base,id:crypto.randomUUID(),amount:50})).status,409);
 globalThis.__scheduleTest.user='user2';assert.equal((await post({...base,id:crypto.randomUUID()})).status,400);assert.equal((await (await api.GET(new Request('https://test/api?entity=dental'))).json()).schedules.length,0);
 globalThis.__scheduleTest.user='user1';assert.equal((await post({...base,version:1,status:'Collected',recipient:'Person',checkNumber:'C1'})).status,409);assert.equal((await post({...base,version:1,status:'Ready'})).status,400);assert.equal((await post({...base,version:1,status:'Ready',checkNumber:'C1'})).status,200);assert.equal((await post({...base,version:2,status:'Collected',checkNumber:'C1'})).status,400);assert.equal((await post({...base,version:2,status:'Collected',checkNumber:'C1',recipient:'Person'})).status,200);assert.equal((await post({...base,version:3,status:'Scheduled'})).status,409);
 const saved=db.prepare('select * from vendor_schedules').get();assert.equal(JSON.parse(saved.history).length,3);assert.equal(db.prepare('select count(*) as n from records').get().n,0);
 globalThis.__scheduleTest.user=null;assert.equal((await post(base)).status,401);
 }finally{await unlink(filename);db.close();delete globalThis.__scheduleTest;}
});
