import { auth } from '@/auth';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { VoiceIntent } from '@/lib/validations/voice';
import Party from '@/models/Party';
import Product from '@/models/Product';
import Transaction from '@/models/Transaction';
import AuditLog from '@/models/AuditLog';
import { resolveParty, resolveProduct } from './entityResolver';
import {
  createTransaction,
  createSale,
  createPurchase,
  reverseTransaction,
  TransactionServiceError,
} from './transactionService';
import { verifyConfirmationToken } from '@/lib/security/confirmation';

export class VoiceEngineError extends Error {
  code: string;
  details?: unknown;
  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'VoiceEngineError';
    this.code = code;
    this.details = details;
  }
}

const partyDetails = (matches: any[]) => matches.map((x) => ({
  id: String(x._id), name: x.name, phone: x.phone, balance: x.currentBalance,
}));
const productDetails = (matches: any[]) => matches.map((x) => ({
  id: String(x._id), name: x.name, stock: x.stockQuantity, unit: x.unit,
}));

export async function executeVoiceCommand(
  intent: VoiceIntent,
  sessionUserId: string,
  transcript = '',
  confirmationToken: string | null = null,
) {
  const session = await auth();
  if (!session?.user?.id || session.user.id !== sessionUserId) {
    throw new VoiceEngineError('UNAUTHORIZED', 'Unauthorized');
  }
  if (!Types.ObjectId.isValid(sessionUserId)) {
    throw new VoiceEngineError('UNAUTHORIZED', 'Invalid user');
  }

  const highValue = (intent.amount ?? 0) > 10_000 ||
    (intent.intent === 'CREATE_PRODUCT' && (intent.quantity ?? 0) * (intent.buy_price ?? 0) > 10_000);
  if ((highValue || intent.intent === 'DELETE_ENTRY') &&
      !verifyConfirmationToken(confirmationToken ?? '', sessionUserId, intent)) {
    throw new VoiceEngineError(
      'CONFIRMATION_REQUIRED',
      highValue ? 'Transactions above ৳10,000 require confirmation' : 'Deletion requires confirmation',
    );
  }

  await connectDB();
  const dbSession = await Party.startSession();
  const uid = new Types.ObjectId(sessionUserId);

  try {
    let result: unknown;
    await dbSession.withTransaction(async () => {
      if (intent.intent === 'READ_BALANCE') {
        if (!intent.entity_name) throw new VoiceEngineError('MISSING_ENTITY', 'Party name required');
        const matches = await resolveParty(sessionUserId, intent.entity_name, dbSession);
        if (matches.length !== 1) {
          throw new VoiceEngineError(matches.length ? 'AMBIGUOUS_ENTITY' : 'NOT_FOUND',
            matches.length ? 'Multiple matching parties' : 'Party not found', { matches: partyDetails(matches) });
        }
        result = { name: matches[0].name, balance: matches[0].currentBalance };
      } else if (intent.intent === 'LIST_ITEMS') {
        const items = await Product.find({ userId: uid }).sort({ name: 1 }).limit(100).session(dbSession);
        result = { items: items.map((x) => ({ id: String(x._id), name: x.name, stock: x.stockQuantity, unit: x.unit })) };
      } else if (intent.intent === 'CREATE_PARTY') {
        const name = intent.entity_name!;
        const existing = await resolveParty(sessionUserId, name, dbSession);
        if (existing.length) throw new VoiceEngineError('DUPLICATE_ENTITY', 'A similar party already exists', { matches: partyDetails(existing.slice(0, 5)) });
        const [party] = await Party.create([{
          userId: uid,
          name,
          phone: intent.phone || undefined,
          partyType: intent.party_type ?? (intent.entity_type === 'SUPPLIER' ? 'SUPPLIER' : 'CUSTOMER'),
          currentBalance: 0,
        }], { session: dbSession });
        result = { id: String(party._id), name: party.name, partyType: party.partyType };
      } else if (intent.intent === 'CREATE_PRODUCT') {
        const name = intent.entity_name!;
        const existing = await resolveProduct(sessionUserId, name, dbSession);
        if (existing.length) throw new VoiceEngineError('DUPLICATE_ENTITY', 'A similar product already exists', { matches: productDetails(existing.slice(0, 5)) });
        const initial = intent.quantity ?? 0;
        const [product] = await Product.create([{
          userId: uid,
          name,
          unit: intent.unit!,
          stockQuantity: initial,
          buyPrice: intent.buy_price ?? 0,
          sellPrice: intent.sell_price ?? 0,
          lowStockThreshold: intent.low_stock_threshold ?? 5,
        }], { session: dbSession });
        if (initial > 0) {
          await Transaction.create([{
            userId: uid,
            productId: product._id,
            type: 'STOCK_IN',
            quantity: initial,
            amount: (intent.buy_price ?? 0) * initial,
            unitPrice: intent.buy_price ?? undefined,
            notes: 'Initial stock via voice',
          }], { session: dbSession });
        }
        result = { id: String(product._id), name: product.name, stock: product.stockQuantity, unit: product.unit };
      } else if (intent.intent === 'CREATE_TRANSACTION') {
        const type = intent.transaction_type;
        if (!type) throw new VoiceEngineError('INVALID_INTENT', 'Transaction type required');

        if (type === 'PURCHASE') {
          const lines = intent.items?.length ? intent.items : [{
            product_name: intent.entity_name!, quantity: intent.quantity!, unit_price: intent.buy_price ?? null, unit: intent.unit ?? null,
          }];
          const resolved: Array<{ productId: string; quantity: number; unitPrice?: number }> = [];
          for (const line of lines) {
            const matches = await resolveProduct(sessionUserId, line.product_name, dbSession);
            if (matches.length !== 1) throw new VoiceEngineError(matches.length ? 'AMBIGUOUS_ENTITY' : 'NOT_FOUND', 'Product resolution failed', { matches: productDetails(matches) });
            resolved.push({ productId: String(matches[0]._id), quantity: line.quantity, unitPrice: line.unit_price ?? undefined });
          }
          let supplierId: string | undefined;
          if (intent.entity_name && intent.entity_type === 'SUPPLIER') {
            const matches = await resolveParty(sessionUserId, intent.entity_name, dbSession);
            if (matches.length !== 1) throw new VoiceEngineError(matches.length ? 'AMBIGUOUS_ENTITY' : 'NOT_FOUND', 'Supplier resolution failed', { matches: partyDetails(matches) });
            supplierId = String(matches[0]._id);
          }
          result = await createPurchase({
            partyId: supplierId,
            lines: resolved,
            paidAmount: 0,
            paymentMethod: 'CASH',
            notes: intent.notes ?? undefined,
          }, sessionUserId, dbSession);
        } else if (type === 'PAYMENT_TO_SUPPLIER') {
          if (!intent.entity_name || !intent.amount) throw new VoiceEngineError('INVALID_PAYMENT', 'Supplier and amount required');
          const matches = await resolveParty(sessionUserId, intent.entity_name, dbSession);
          if (matches.length !== 1) throw new VoiceEngineError(matches.length ? 'AMBIGUOUS_ENTITY' : 'NOT_FOUND', 'Supplier resolution failed', { matches: partyDetails(matches) });
          result = await createTransaction({ type, partyId: String(matches[0]._id), amount: intent.amount, quantity: 0, notes: intent.notes ?? undefined }, sessionUserId, dbSession);
        } else if (type === 'SALE') {
          const lines = intent.items?.length ? intent.items : [{
            product_name: intent.entity_name!, quantity: intent.quantity!, unit_price: null,
          }];
          const resolved: Array<{ productId: string; quantity: number; unitPrice?: number }> = [];
          for (const line of lines) {
            const matches = await resolveProduct(sessionUserId, line.product_name, dbSession);
            if (matches.length !== 1) throw new VoiceEngineError(matches.length ? 'AMBIGUOUS_ENTITY' : 'NOT_FOUND', 'Product resolution failed', { matches: productDetails(matches) });
            resolved.push({ productId: String(matches[0]._id), quantity: line.quantity, unitPrice: line.unit_price ?? undefined });
          }
          let customerId: string | undefined;
          if (intent.entity_name && intent.entity_type === 'CUSTOMER') {
            const matches = await resolveParty(sessionUserId, intent.entity_name, dbSession);
            if (matches.length !== 1) throw new VoiceEngineError(matches.length ? 'AMBIGUOUS_ENTITY' : 'NOT_FOUND', 'Customer resolution failed', { matches: partyDetails(matches) });
            customerId = String(matches[0]._id);
          }
          // A spoken amount on a sale is treated as the amount paid; omitted amount means full due.
          const paidAmount = intent.amount ?? 0;
          result = await createSale({ partyId: customerId, lines: resolved, paidAmount, paymentMethod: 'CASH', notes: intent.notes ?? undefined }, sessionUserId, dbSession);
        } else {
          let partyId: string | undefined;
          if ((type === 'DUE_GIVEN' || type === 'DUE_RECEIVED') && intent.entity_name) {
            const matches = await resolveParty(sessionUserId, intent.entity_name, dbSession);
            if (matches.length !== 1) throw new VoiceEngineError(matches.length ? 'AMBIGUOUS_ENTITY' : 'NOT_FOUND', 'Party resolution failed', { matches: partyDetails(matches) });
            partyId = String(matches[0]._id);
          }
          result = await createTransaction({
            type: type as 'DUE_GIVEN' | 'DUE_RECEIVED' | 'EXPENSE' | 'STOCK_IN' | 'STOCK_OUT',
            partyId,
            amount: intent.amount ?? 0,
            quantity: intent.quantity ?? 0,
            unitPrice: intent.amount && intent.quantity ? intent.amount / intent.quantity : undefined,
            notes: intent.notes ?? undefined,
          }, sessionUserId, dbSession);
        }
      } else if (intent.intent === 'UPDATE_STOCK') {
        if (!intent.entity_name || !intent.quantity) throw new VoiceEngineError('INVALID_STOCK', 'Product and quantity required');
        const matches = await resolveProduct(sessionUserId, intent.entity_name, dbSession);
        if (matches.length !== 1) throw new VoiceEngineError(matches.length ? 'AMBIGUOUS_ENTITY' : 'NOT_FOUND', 'Product resolution failed', { matches: productDetails(matches) });
        const product = matches[0];
        const type = intent.transaction_type === 'STOCK_OUT' ? 'STOCK_OUT' : 'STOCK_IN';
        const tx = await createTransaction({
          type,
          productId: String(product._id),
          amount: intent.amount ?? 0,
          quantity: intent.quantity,
          unitPrice: intent.amount && intent.quantity ? intent.amount / intent.quantity : undefined,
          notes: intent.notes ?? undefined,
        }, sessionUserId, dbSession);
        result = { ...tx, name: product.name, stock: product.stockQuantity + (type === 'STOCK_IN' ? intent.quantity : -intent.quantity), unit: product.unit };
      } else if (intent.intent === 'DELETE_ENTRY') {
        const q: any = { userId: uid };
        if (intent.amount !== null) q.amount = intent.amount;
        const tx = await Transaction.findOne(q).sort({ timestamp: -1 }).session(dbSession);
        if (!tx) throw new VoiceEngineError('NOT_FOUND', 'Transaction not found');
        result = await reverseTransaction(String(tx._id), sessionUserId, dbSession);
      }

      await AuditLog.create([{
        userId: uid,
        voiceTranscript: transcript,
        parsedIntent: intent,
        status: 'SUCCESS',
      }], { session: dbSession });
    });
    return result;
  } catch (error) {
    try {
      await AuditLog.create([{
        userId: uid,
        voiceTranscript: transcript,
        parsedIntent: intent,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }]);
    } catch { /* audit failure must not mask the original error */ }
    if (error instanceof VoiceEngineError) throw error;
    if (error instanceof TransactionServiceError) throw new VoiceEngineError(error.code, error.message, error.details);
    throw error;
  } finally {
    await dbSession.endSession();
  }
}
