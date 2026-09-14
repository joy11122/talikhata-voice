type Entry={count:number;reset:number};
const store=new Map<string,Entry>();
const WINDOW=60_000;
export function rateLimit(key:string,limit:number){
  const now=Date.now();
  const current=store.get(key);
  if(!current||current.reset<=now){store.set(key,{count:1,reset:now+WINDOW});return {ok:true,remaining:limit-1,reset:now+WINDOW};}
  current.count+=1;
  return {ok:current.count<=limit,remaining:Math.max(0,limit-current.count),reset:current.reset};
}
export function getClientKey(req:Request){return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||req.headers.get('x-real-ip')||'unknown';}
