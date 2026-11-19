import type { TextPage } from './match';
export async function extractDocument(file:File,onProgress:(s:string)=>void):Promise<TextPage[]>{
 let worker:Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>>|undefined;
 async function scan(image:HTMLCanvasElement|File){
  if(!worker){const {createWorker}=await import('tesseract.js');worker=await createWorker('eng',1,{workerPath:'/ocr/worker.min.js',corePath:'/ocr/core',langPath:'/ocr/lang',logger:m=>{if(m.status==='recognizing text')onProgress(`Reading scanned text ${Math.round(m.progress*100)}%`);}});}
  return (await worker.recognize(image)).data.text;
 }
 let task:ReturnType<typeof import('pdfjs-dist')['getDocument']>|undefined;
 let pdf:Awaited<ReturnType<typeof import('pdfjs-dist')['getDocument']>['promise']>|undefined;
 try{
  if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){
   const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc='/ocr/pdf.worker.min.mjs';
   task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),cMapUrl:'/ocr/cmaps/',cMapPacked:true,standardFontDataUrl:'/ocr/standard_fonts/',wasmUrl:'/ocr/wasm/'});pdf=await task.promise;
   if(pdf.numPages>20)throw new Error('Please split this document into PDFs of 20 pages or fewer.');
   const pages:TextPage[]=[];
   for(let i=1;i<=pdf.numPages;i++){
    onProgress(`Reading page ${i} of ${pdf.numPages}`);
    const p=await pdf.getPage(i);const content=await p.getTextContent();let text='',lastY:number|undefined;
    for(const item of content.items){if(!('str'in item))continue;const y=item.transform[5];if(lastY!==undefined&&Math.abs(y-lastY)>3)text+='\n';text+=item.str+' ';if(item.hasEOL)text+='\n';lastY=y;}
    let method:'text'|'ocr'='text';
    // Image-only pages require OCR. Text PDFs preserve their native text.
    if(text.replace(/\s/g,'').length<30){
     const v=p.getViewport({scale:1});const scale=Math.min(2.5,2400/Math.max(v.width,v.height));const viewport=p.getViewport({scale});
     const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
     await p.render({canvas,canvasContext:canvas.getContext('2d')!,viewport}).promise;
     text=await scan(canvas);method='ocr';canvas.width=0;canvas.height=0;
    }
    pages.push({page:i,text,method});p.cleanup();
   }
   return pages;
  }
  const bitmap=await createImageBitmap(file);const scale=Math.min(1,2400/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.ceil(bitmap.width*scale);canvas.height=Math.ceil(bitmap.height*scale);canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  onProgress('Reading scanned image');return [{page:1,text:await scan(canvas),method:'ocr'}];
 }finally{await worker?.terminate();await task?.destroy();}
}
