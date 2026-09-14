import {NextResponse} from 'next/server';
import {auth} from '@/auth';
import {VoiceIntentSchema} from '@/lib/validations/voice';
import {createConfirmationToken} from '@/lib/security/confirmation';
import {rateLimit,getClientKey} from '@/lib/security/rateLimit';
import {isAllowedOrigin} from '@/lib/security/origin';
export async function POST(req:Request){
  const s=await auth(); if(!s?.user?.id)return NextResponse.json({error:'Unauthorized'},{status:401});
  if(!isAllowedOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
  const rl=rateLimit(`confirm:${s.user.id}:${getClientKey(req)}`,20); if(!rl.ok)return NextResponse.json({error:'Too many requests'},{status:429});
  const body=await req.json().catch(()=>null); const p=VoiceIntentSchema.safeParse(body?.intent);
  if(!p.success)return NextResponse.json({error:'Invalid intent'},{status:422});
  return NextResponse.json({token:createConfirmationToken(s.user.id,p.data)});
}
