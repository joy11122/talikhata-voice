# Phase 5 — Production Hardening

## Included
- Security headers and `poweredByHeader=false`.
- API and voice rate limiting (per-process baseline; use Redis/Upstash for multi-instance production).
- Same-origin validation with Capacitor origin allowlist.
- Signed, expiring server-side confirmation tokens for high-value and destructive voice actions.
- Health endpoint: `/api/health`.
- Authenticated JSON export endpoint: `/api/export`.
- Sentry client/server instrumentation (optional until DSN configured).
- Security unit tests for confirmation-token tampering and cross-user replay.
- Environment validation extended for production URL/observability.
- Request IDs on API responses from middleware.

## Production requirements
1. Replace in-memory rate limiting with a shared Redis/Upstash limiter when deploying multiple instances.
2. Configure Sentry DSN and alert rules.
3. Use MongoDB Atlas replica set/sharded cluster for transactions.
4. Set `NEXT_PUBLIC_APP_URL` to the exact HTTPS origin.
5. Never expose `MONGODB_URI`, `AUTH_SECRET`, OAuth secrets, or OpenAI keys to `NEXT_PUBLIC_*` variables.
6. Configure Google OAuth redirect URI for the deployed domain.
7. Run `npm run check` in CI and block deployment on failure.
8. Add Playwright/Cypress E2E tests against a disposable test database before public launch.
9. Backups are an infrastructure responsibility: enable Atlas continuous backup/point-in-time recovery.
10. The export endpoint is authenticated and tenant-scoped but should be protected by a dedicated permission/2FA policy for regulated deployments.
