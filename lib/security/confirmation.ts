import {createHmac,timingSafeEqual} from 'crypto';
import {VoiceIntent} from '@/lib/validations/voice';
const b64=(s:string)=>Buffer.from(s).toString('base64url');
const unb64=(s:string)=>Buffer.from(s,'base64url').toString('utf8');
const secret=()=>process.env.AUTH_SECRET||'';
function signature(payload:string){return createHmac('sha256',secret()).update(payload).digest('base64url');}
export function createConfirmationToken(userId:string,intent:VoiceIntent,ttlMs=120_000){
  const payload=b64(JSON.stringify({u:userId,e:Date.now()+ttlMs,h:b64(JSON.stringify(intent))}));
  return `${payload}.${signature(payload)}`;
}
export function verifyConfirmationToken(token:string,userId:string,intent:VoiceIntent){
  if(!secret()||!token)return false;
  const [payload,sig]=token.split('.'); if(!payload||!sig)return false;
  const expected=signature(payload);
  try{if(!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return false;}catch{return false;}
  try{const p=JSON.parse(unb64(payload)); if(p.u!==userId||p.e<Date.now())return false; const embedded=JSON.parse(unb64(p.h)); return JSON.stringify(embedded)===JSON.stringify(intent);}catch{return false;}
}
