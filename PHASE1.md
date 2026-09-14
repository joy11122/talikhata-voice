# TaliKhata Phase 1 — Core Business

Implemented on top of the Capacitor-ready project.

## Modules
- Multi-line POS sales with stock deduction, customer due, partial payment, payment method, cost and estimated gross profit.
- Multi-line supplier purchases with stock addition, supplier payable, partial payment and buy-price update.
- Customer collections and supplier payments.
- Daily closing with opening cash, cash sales, collections, expenses, supplier payments and adjustments.
- Business reports: sales, purchases, COGS, gross/net profit, cash collections, supplier payments, top products and outstanding parties.
- Grouped sale/purchase transactions and atomic reversal for grouped entries.
- Existing CRUD modules remain available.
- Voice schema now understands purchase and supplier-payment transaction types.

## Important accounting convention
Party `currentBalance > 0` means the shop expects to receive money; `currentBalance < 0` means the shop owes money.

## Routes
- `/dashboard/sales`
- `/dashboard/purchases`
- `/dashboard/payments`
- `/dashboard/reports`
- `/dashboard/closing`
- `/api/sales`
- `/api/purchases`
- `/api/payments`
- `/api/reports`
- `/api/closing`

## Production note
MongoDB transactions require Atlas replica-set/sharded deployment. Test financial flows against a staging database before production use.
