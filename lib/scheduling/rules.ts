export const zones=['America/Chicago','America/New_York','Africa/Lagos','UTC'];
export const transitions:Record<string,string[]>={Scheduled:['Scheduled','Ready','Cancelled'],Ready:['Ready','Scheduled','Collected','Cancelled'],Collected:[],Cancelled:[]};
export function utcFromLocal(date:string,time:string,zone:string):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time)||!zones.includes(zone))throw Error('Choose a valid date, time and time zone.');
 const base=Date.parse(`${date}T${time}:00Z`);if(!Number.isFinite(base))throw Error('Invalid date.');
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const matches:number[]=[];
 for(let offset=-14*60;offset<=14*60;offset+=15){const v=base+offset*60000;const p=Object.fromEntries(formatter.formatToParts(v).map(x=>[x.type,x.value]));if(`${p.year}-${p.month}-${p.day}`===date&&`${p.hour}:${p.minute}`===time)matches.push(v);}
 if(matches.length!==1)throw Error('This time is invalid or ambiguous during a daylight saving change. Choose a different time.');
 return new Date(matches[0]).toISOString();
}
