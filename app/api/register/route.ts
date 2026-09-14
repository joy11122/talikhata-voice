import {NextResponse} from 'next/server';
import {registerUser} from '@/app/actions/register';
export async function POST(req:Request){return NextResponse.json(await registerUser(await req.json()));}
