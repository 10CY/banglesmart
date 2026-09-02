# BanglesMart – Final Node/Next.js Setup

This package is a Next.js storefront/admin panel with a Node.js + Express API. It is **not a Laravel application**.

## 1. Backend

```bash
cd backend-node
npm install
npm run migrate
npm run dev
```

The migration is:

`backend-node/migrations/20260902_ecommerce_upgrade.sql`

It adds:
- material name/status fields
- newsletter subscribers
- customer return requests/items
- customer notifications
- order status history table
- admin audit log table

## 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Set the frontend API environment variables from `.env.example` if your backend is not running on the default local URLs.

## 3. Password reset email

Password reset is implemented. For actual email delivery, configure:

```env
RESEND_API_KEY=...
MAIL_FROM="BanglesMart <your-verified-sender@example.com>"
```

Without a Resend key the backend logs a development reset URL instead of sending mail.

## 4. Online payments

Cash on Delivery remains fully supported. A live payment gateway is intentionally not hard-coded because it requires the merchant's Razorpay/Stripe account credentials, webhook secret, and business/payment configuration. Do not use a fake payment implementation in production.

## 5. Important security note

Do not commit `.env`. The supplied `.env` file was removed from this final package. Rotate any credentials if the original ZIP was shared outside the trusted development environment.
