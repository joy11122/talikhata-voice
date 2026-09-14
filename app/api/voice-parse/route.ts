import {NextResponse} from 'next/server';
import OpenAI from 'openai';
import {auth} from '@/auth';
import {VoiceIntentSchema,VoiceParseRequest} from '@/lib/validations/voice';
import {normalizeVoiceTranscript} from '@/lib/voice/normalize';

const schema={type:'object',additionalProperties:false,properties:{
 intent:{type:'string',enum:['CREATE_TRANSACTION','READ_BALANCE','UPDATE_STOCK','DELETE_ENTRY','LIST_ITEMS','CREATE_PRODUCT','CREATE_PARTY']},
 entity_type:{type:['string','null'],enum:['CUSTOMER','SUPPLIER','INVENTORY',null]},entity_name:{type:['string','null']},amount:{type:['number','null']},quantity:{type:['number','null']},unit:{type:['string','null']},
 transaction_type:{type:['string','null'],enum:['DUE_GIVEN','DUE_RECEIVED','STOCK_IN','STOCK_OUT','EXPENSE','SALE','PURCHASE','PAYMENT_TO_SUPPLIER',null]},notes:{type:['string','null']},phone:{type:['string','null']},buy_price:{type:['number','null']},sell_price:{type:['number','null']},low_stock_threshold:{type:['number','null']},party_type:{type:['string','null'],enum:['CUSTOMER','SUPPLIER',null]},
 items:{type:'array',items:{type:'object',additionalProperties:false,properties:{product_name:{type:'string'},quantity:{type:'number'},unit:{type:['string','null']},unit_price:{type:['number','null']}},required:['product_name','quantity','unit','unit_price']}},
 confidence:{type:'number'},normalized_transcript:{type:['string','null']}
},required:['intent','entity_type','entity_name','amount','quantity','unit','transaction_type','notes','phone','buy_price','sell_price','low_stock_threshold','party_type','items','confidence','normalized_transcript']} as const;

export async function POST(req:Request){
 const session=await auth();if(!session?.user?.id)return NextResponse.json({error:'Unauthorized'},{status:401});
 const body=VoiceParseRequest.safeParse(await req.json());if(!body.success)return NextResponse.json({error:'Invalid transcript',issues:body.error.issues},{status:400});
 if(!process.env.OPENAI_API_KEY)return NextResponse.json({error:'OPENAI_API_KEY is not configured'},{status:503});
 try{
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
  const completion=await client.chat.completions.create({model:process.env.OPENAI_VOICE_MODEL||'gpt-4.1-mini',temperature:0,response_format:{type:'json_schema',json_schema:{name:'talikhata_voice_intent_v2',strict:true,schema:schema as any}},messages:[
   {role:'system',content:`You are a safety-critical Bengali/Banglish/English shop accounting command parser for Bangladesh. Never invent facts. Understand Bengali and Banglish phonetics. Normalize common Banglish internally (baki, joma, becha, kinlam, khoroch, taka) but preserve entity names as spoken.
Rules: DUE_GIVEN means customer receives goods/money on credit (customer owes shop); DUE_RECEIVED means customer pays the shop. STOCK_IN adds inventory, STOCK_OUT removes inventory. SALE is a customer sale and may contain multiple items. PURCHASE is buying inventory, may contain multiple items and optionally a supplier entity. PAYMENT_TO_SUPPLIER is money paid to a supplier. EXPENSE is shop expense. CREATE_PRODUCT/CREATE_PARTY only when explicitly requested. READ_BALANCE asks party balance. LIST_ITEMS lists products. DELETE_ENTRY targets the latest matching entry.
For multi-item commands, put every product in items with quantity and unit_price if spoken; entity_name may be the customer/supplier when identifiable, otherwise null. For a single SALE/PURCHASE also use items. amount is total when explicitly spoken; otherwise null for SALE/PURCHASE because the server calculates it. quantity can mirror the first item quantity. confidence must reflect linguistic certainty, never fabricate certainty.`},
   {role:'user',content:normalizeVoiceTranscript(body.data.transcript)}
  ]});
  const raw=completion.choices[0]?.message?.content||'{}';const parsed=VoiceIntentSchema.safeParse(JSON.parse(raw));
  if(!parsed.success)return NextResponse.json({error:'Invalid parser output',issues:parsed.error.issues},{status:422});
  if((parsed.data.confidence??1)<0.55)return NextResponse.json({error:'Voice command is ambiguous; please rephrase.',code:'LOW_CONFIDENCE',intent:parsed.data},{status:422});
  return NextResponse.json(parsed.data);
 }catch(e:any){return NextResponse.json({error:e.message||'Voice parsing failed'},{status:502});}
}
