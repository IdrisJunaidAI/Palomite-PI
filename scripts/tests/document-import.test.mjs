import {test} from 'node:test';import assert from 'node:assert/strict';import ts from 'typescript';import {readFile} from 'node:fs/promises';
const code=ts.transpileModule(await readFile('lib/import/match.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {matchRooms,proposeRecords}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const rooms=JSON.parse(await readFile('lib/source-data.json','utf8')).layout;
test('explicit room numbers map; money and dimensions do not',()=>{assert.deepEqual(matchRooms('Room 210 painting complete',rooms),['210']);assert.deepEqual(matchRooms('Paid $210.00 for materials',rooms),[]);assert.deepEqual(matchRooms('210 square feet',rooms),[]);});
test('repeated room names require review',()=>{assert.equal(matchRooms('Storage shelves installed',rooms).length,2);const r=proposeRecords([{page:2,text:'Storage shelves installed',method:'ocr'}],rooms)[0];assert.equal(r.ref,'');assert.equal(r.selected,false)});
test('unique names match and imported currency never becomes payment automatically',()=>{const r=proposeRecords([{page:1,text:'Treatment Room 1 painting $500 paid',method:'text'}],rooms)[0];assert.equal(r.ref,'210');assert.equal(r.amount,0);assert.equal(r.status,'Pending');assert.equal(r.kind,'progress');});
test('invalid explicit room numbers do not create rooms',()=>assert.deepEqual(matchRooms('Room 999 work completed',rooms),[]));

test('multiple amounts need manual review instead of guessing a total',()=>{const r=proposeRecords([{page:1,text:'Room 210 subtotal $100 tax $8 total $108',method:'text'}],rooms)[0];assert.equal(r.amount,0);assert.equal(r.kind,'progress');});
