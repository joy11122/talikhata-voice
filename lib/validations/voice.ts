import { z } from 'zod';

export const VoiceLineSchema = z.object({
  product_name: z.string().trim().max(200),
  quantity: z.number().finite().positive(),
  unit: z.string().trim().max(30).nullable().optional(),
  unit_price: z.number().finite().nonnegative().nullable().optional(),
}).strict();

export const VoiceIntentSchema = z.object({
  intent: z.enum(['CREATE_TRANSACTION','READ_BALANCE','UPDATE_STOCK','DELETE_ENTRY','LIST_ITEMS','CREATE_PRODUCT','CREATE_PARTY']),
  entity_type: z.enum(['CUSTOMER','SUPPLIER','INVENTORY']).nullable(),
  entity_name: z.string().trim().max(200).nullable(),
  amount: z.number().finite().nonnegative().nullable(),
  quantity: z.number().finite().nonnegative().nullable(),
  unit: z.string().trim().max(30).nullable(),
  transaction_type: z.enum(['DUE_GIVEN','DUE_RECEIVED','STOCK_IN','STOCK_OUT','EXPENSE','SALE','PURCHASE','PAYMENT_TO_SUPPLIER']).nullable(),
  notes: z.string().trim().max(500).nullable(),
  phone: z.string().trim().max(30).nullable().optional(),
  buy_price: z.number().finite().nonnegative().nullable().optional(),
  sell_price: z.number().finite().nonnegative().nullable().optional(),
  low_stock_threshold: z.number().finite().nonnegative().nullable().optional(),
  party_type: z.enum(['CUSTOMER','SUPPLIER']).nullable().optional(),
  items: z.array(VoiceLineSchema).max(100).optional(),
  confidence: z.number().min(0).max(1).optional(),
  normalized_transcript: z.string().max(4000).nullable().optional(),
}).strict().superRefine((v,ctx)=>{
  if(v.intent==='CREATE_TRANSACTION'){
    if(!v.transaction_type)ctx.addIssue({code:'custom',path:['transaction_type'],message:'transaction_type is required'});
    if(!['EXPENSE','SALE','PURCHASE','PAYMENT_TO_SUPPLIER'].includes(v.transaction_type||'')&&!v.entity_name)ctx.addIssue({code:'custom',path:['entity_name'],message:'Entity is required'});
    if(['DUE_GIVEN','DUE_RECEIVED','EXPENSE','PAYMENT_TO_SUPPLIER'].includes(v.transaction_type||'')&&(!v.amount||v.amount<=0))ctx.addIssue({code:'custom',path:['amount'],message:'Amount must be positive'});
    if(['SALE','PURCHASE'].includes(v.transaction_type||'') && !(v.items?.length || (v.entity_name && v.quantity && v.amount)))ctx.addIssue({code:'custom',path:['items'],message:'At least one sale/purchase item is required'});
  }
  if(v.intent==='UPDATE_STOCK'&&(!v.entity_name||!v.quantity||v.quantity<=0))ctx.addIssue({code:'custom',path:['quantity'],message:'Product and positive quantity are required'});
  if(v.intent==='CREATE_PRODUCT'&&(!v.entity_name||!v.unit))ctx.addIssue({code:'custom',path:['entity_name'],message:'Product name and unit are required'});
  if(v.intent==='CREATE_PARTY'&&!v.entity_name)ctx.addIssue({code:'custom',path:['entity_name'],message:'Party name is required'});
});
export type VoiceIntent=z.infer<typeof VoiceIntentSchema>;
export const VoiceParseRequest=z.object({transcript:z.string().trim().min(1).max(4000)});
