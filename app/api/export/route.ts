import {NextResponse} from 'next/server';
import {auth} from '@/auth';
import {connectDB} from '@/lib/db';
import Party from '@/models/Party'; import Product from '@/models/Product'; import Transaction from '@/models/Transaction'; import {Types} from 'mongoose';
import {rateLimit,getClientKey} from '@/lib/security/rateLimit'; import {isAllowedOrigin} from '@/lib/security/origin';
export async function GET(req:Request){
 const s=await auth(); if(!s?.user?.id)return NextResponse.json({error:'Unauthorized'},{status:401});
 if(!isAllowedOrigin(req))return NextResponse.json({error:'Invalid origin'},{status:403});
 const rl=rateLimit(`export:${s.user.id}:${getClientKey(req)}`,5);if(!rl.ok)return NextResponse.json({error:'Too many export requests'},{status:429});
 await connectDB(); const uid=new Types.ObjectId(s.user.id);
 const [parties,products,transactions]=await Promise.all([Party.find({userId:uid}).lean(),Product.find({userId:uid}).lean(),Transaction.find({userId:uid}).sort({timestamp:-1}).lean()]);
 return NextResponse.json({exportedAt:new Date().toISOString(),parties,products,transactions});
}
