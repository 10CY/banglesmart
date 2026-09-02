# BanglesMart — Next.js + Node.js complete migration

This package contains the existing Next.js frontend and a structured Node.js/Express backend replacing the Laravel API while preserving the `/api/admin`, `/api/customer`, and `/api/store` route families.

## Local backend
1. Import `backend-node/banglesmart.sql` into MySQL database `banglesmart` (or use your existing database).
2. `cd backend-node`
3. copy `.env.example` to `.env` and set DB credentials.
4. `npm install`
5. `npm run dev`
6. Test `http://127.0.0.1:8000/api/test`.

## Local frontend
Set `frontend/.env.local` to:
`NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api`
`NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000`
Then `cd frontend && npm install && npm run dev`.

## Authentication
Customer and admin authentication use separate JWTs and role checks. Customer token key remains `customer_token`; admin token key remains `admin_token`.

## Images
Uploads are stored under `storage/categories` and `storage/products`, and served through `/storage/...`.

## Note
The API surface is complete for the routes present in the supplied Laravel `routes/api.php`. Complex Laravel-only side effects such as email/queue integrations are intentionally isolated rather than silently emulated. Test checkout/order workflows against your production rules before switching production traffic.
