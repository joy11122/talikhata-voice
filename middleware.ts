import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {rateLimit,getClientKey} from './lib/security/rateLimit';
export function middleware(req:NextRequest){
  const path=req.nextUrl.pathname;
  if(!path.startsWith('/api/')||path.startsWith('/api/auth/'))return NextResponse.next();
  const limit=path.startsWith('/api/voice-')?30:path==='/api/export'?5:120;
  const rl=rateLimit(`api:${getClientKey(req)}:${path}`,limit);
  const requestId=crypto.randomUUID();
  if(!rl.ok){const r=NextResponse.json({error:'Too many requests',requestId},{status:429});r.headers.set('Retry-After',String(Math.ceil((rl.reset-Date.now())/1000)));return r;}
  const response=NextResponse.next();response.headers.set('x-request-id',requestId);return response;
}
export const config={matcher:['/api/:path*']};
