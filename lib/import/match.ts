export type Room = {id:string;name:string};
export type Draft = {ref:string;title:string;kind:'progress'|'issue'|'expense';amount:number;status:string;notes:string;page:number;selected:boolean};
export type TextPage = {page:number;text:string;method:'text'|'ocr'};
const normalize=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function matchRooms(text:string, rooms:Room[]):string[]{
 const n=normalize(text);
 // A bare number could be an amount or measurement. Require a room label.
 const explicit=[...text.matchAll(/\b(?:room|rm|area)\s*#?\s*:?\s*(\d{3})\b/gi)].map(m=>m[1]).filter(id=>rooms.some(r=>r.id===id));
 if(explicit.length)return [...new Set(explicit)];
 return rooms.filter(r=>r.name.length>4&&(` ${n} `).includes(` ${normalize(r.name)} `)).map(r=>r.id);
}
export function proposeRecords(pages:TextPage[],rooms:Room[]):Draft[]{
 const result:Draft[]=[];
 for(const page of pages){
  for(const raw of page.text.split(/\n+/)){
   const line=raw.trim();if(line.length<3)continue;
   const matches=matchRooms(line,rooms);
   if(!matches.length)continue;
   const prices=[...line.matchAll(/(?:\$|USD\s*)(\d+(?:,\d{3})*(?:\.\d{2})?)(?![\d.])/gi)];
   const suggestedAmount=prices.length===1?Number(prices[0][1].replaceAll(',','')):0;
   result.push({ref:matches.length===1?matches[0]:'',title:line.slice(0,240),kind:prices.length===1?'expense':'progress',amount:suggestedAmount,status:'Pending',notes:line.slice(0,3000),page:page.page,selected:matches.length===1});
   if(result.length>=100)return result;
  }
 }
 return result;
}
