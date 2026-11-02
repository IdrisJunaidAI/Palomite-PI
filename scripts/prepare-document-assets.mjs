import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {mkdir,copyFile,cp,readdir} from 'node:fs/promises';
const require=createRequire(import.meta.url);const out='public/ocr';await mkdir(out,{recursive:true});
const pdf=dirname(require.resolve('pdfjs-dist/package.json'));await copyFile(join(pdf,'build/pdf.worker.min.mjs'),join(out,'pdf.worker.min.mjs'));
for(const folder of ['cmaps','standard_fonts','wasm'])await cp(join(pdf,folder),join(out,folder),{recursive:true});
const tess=dirname(require.resolve('tesseract.js/package.json'));await copyFile(join(tess,'dist/worker.min.js'),join(out,'worker.min.js'));
const core=dirname(createRequire(join(tess,'package.json')).resolve('tesseract.js-core/package.json'));await mkdir(join(out,'core'),{recursive:true});
for(const name of await readdir(core))if(name.endsWith('lstm.wasm.js'))await copyFile(join(core,name),join(out,'core',name));
await mkdir(join(out,'lang'),{recursive:true});await copyFile(join(require('@tesseract.js-data/eng').langPath,'eng.traineddata.gz'),join(out,'lang/eng.traineddata.gz'));
for(const [name,root] of [['pdfjs',pdf],['tesseract',tess],['tesseract-core',core]]){try{await copyFile(join(root,'LICENSE'),join(out,`${name}-LICENSE`));}catch{}}
console.log('Document processing assets prepared');
