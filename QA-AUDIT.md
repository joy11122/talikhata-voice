# TaliKhata Voice — QA Audit & Remediation

Audit target: Phase 5 source archive.

## Fixed critical issues

1. **Build-breaking syntax error** in `services/voiceEngine.ts`: rewritten as structured TypeScript with balanced control flow.
2. **Missing `createSale` / `createPurchase` import** in voice engine fixed.
3. **Credentials authentication identity bug**: `authorize()` ultimately returned `userId` rather than the Auth.js-required `id`. `ensureShop()` now returns `id`.
4. **Generic transaction endpoint could accept SALE/PURCHASE/PAYMENT_TO_SUPPLIER** even though that service path does not perform their full accounting side effects. Generic validation now permits only simple ledger/stock/expense operations; dedicated endpoints must be used for compound operations.
5. **Purchase paid amount was discarded**: purchase transaction rows now retain the paid amount on the first line, allowing cash-flow/reversal logic to see it.
6. **Capacitor web directory lacked a fallback HTML entry**: `public/index.html` added for native packaging compatibility.
7. **Duplicate party/product race condition**: compound tenant/name unique indexes added. Application duplicate checks remain for friendly errors.
8. **Invalid transaction date filters** now return HTTP 400 rather than creating invalid date queries.
9. **Transaction reversal errors** now return conflict/not-found status where appropriate.

## QA observations requiring real-environment verification

- Full `npm install` could not complete within the isolated build environment because dependency resolution/network installation timed out. Therefore a final `next build` and TypeScript compile could not be executed here.
- MongoDB Atlas transaction behavior must be tested against the actual Atlas deployment; multi-document transactions require replica-set/sharded support.
- Google OAuth callback URLs must be configured to the actual production domain.
- OpenAI API/voice parsing requires a real API key and should be tested with Bengali, Banglish, English, ambiguous names, malformed commands, and high-value confirmations.
- Capacitor Android/iOS builds require the native toolchains (Android Studio/SDK and Xcode on macOS).

## Remaining recommended production work

- Replace in-memory rate limiting with a shared Redis/Upstash limiter for multi-instance deployment.
- Add Playwright end-to-end tests for signup, login, sale, purchase, payment, closing, voice confirmation, ambiguity, and tenant isolation.
- Add immutable journal/reversal records instead of hard-deleting financial transactions.
- Add idempotency keys for POST mutations to prevent double submissions on mobile/network retries.
- Add explicit shop/business authorization if multi-user-per-shop is introduced later.
- Add MongoDB Atlas backup/PITR verification and restore drills.
- Run dependency audit (`npm audit`) in CI and pin/lock production dependencies.
