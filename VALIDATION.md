# BanglesMart Validation Report

Validation performed on the packaged source tree on 2026-09-16.

## Passed source checks

- Backend JavaScript: all source/script `.js` files pass `node --check` syntax parsing.
- Frontend TypeScript/TSX: all `.ts` and `.tsx` source files pass TypeScript syntax parsing.
- Frontend source imports: local relative imports and `@/` alias imports resolve to source targets.
- Admin navigation: every centralized admin sidebar/topbar navigation target has a matching Next.js page route.
- Confirmation UX: no native `window.confirm()` or `window.alert()` calls remain in the packaged frontend; reusable modal/toast feedback is used instead.
- Fresh database schema: all declared foreign-key source/target columns and referenced tables resolve.
- Backend SQL/schema consistency: parsed INSERT/UPDATE column references checked against the fresh schema produced no mismatches.
- Database source copies: `database/banglesmart_full_database.sql`, `database/schema.sql`, and `backend/database/schema.sql` describe the same fresh schema.
- Packaging hygiene: real `.env` files, `.git`, `.next`, `node_modules`, TypeScript build caches, logs, and private keys are excluded.

## Dependency/build limitation

A full `npm ci` / Next.js production build could not be completed inside the packaging runtime because npm dependency installation timed out/faulted in this environment. The package therefore does **not** claim a completed runtime integration test or a guaranteed bug-free production build.

After extracting the ZIP on your development machine, run the commands in `SETUP.md`, then:

```bash
cd frontend
npm install
npm run lint
npm run build
```

and start the backend against a MySQL database to perform the final environment-specific integration check.
