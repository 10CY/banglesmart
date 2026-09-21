# BanglesMart Setup

## Requirements

- Node.js 20+ (Node 22 is also suitable)
- npm
- MySQL 8+ or a compatible MariaDB release

## 1. Fresh database

Create an empty database named `banglesmart` (or use another name and change `DB_DATABASE`). Import:

```text
database/banglesmart_full_database.sql
```

`database/schema.sql` and `backend/database/schema.sql` are matching copies of the same fresh schema.

This file is the complete current schema for a fresh installation. Do **not** run the historical migrations again on a database created from this fresh schema.

### Existing database

If you already have the original BanglesMart database, back it up first, configure the backend environment, then run:

```bash
cd backend
npm install
npm run migrate
```

The migration runner tracks applied files in `schema_migrations`.

## 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Default API URL:

```text
http://127.0.0.1:8000/api
```

Important environment values to change before production:

- `DB_*`
- `JWT_SECRET`
- `CORS_ORIGINS`
- SMS provider settings for phone OTP
- Cloudinary settings if cloud uploads are used
- mail provider settings if password-reset email is used

If `DB_ENABLE_SSL=true` and `DB_CA_PATH` is not configured, the backend uses `backend/src/ca.pem`.

## 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Default storefront URL:

```text
http://localhost:3000
```

The supplied frontend `.env.example` points to the default local API/backend URLs.

## 4. Admin account

The fresh schema intentionally contains no default production password. After configuring `backend/.env` and installing backend dependencies, create an admin safely with:

```bash
cd backend
npm run create-admin -- --name="BanglesMart Admin" --email="admin@example.com" --password="replace-with-a-strong-password"
```

This stores a bcrypt hash and sets:

```text
role = admin
status = active
```

You can also migrate your existing admin record. Never place a plaintext admin password into SQL committed to source control.

## 5. Phone OTP

Customer login defaults to phone OTP. In development, if no SMS provider is configured, the backend logs the OTP in the terminal. In production, configure your SMS provider through the backend environment.

## 6. Product creation

Before creating products, create at least one active size and one active color in Admin. Product creation requires both and supports multiple selection. The page automatically creates the size × color matrix and saves product + variants + inventory in one operation.

Design options are optional. Initial labels can be added during product creation; design images are managed on the product edit screen.

## 7. Verification commands

After installing dependencies:

```bash
cd frontend
npm run lint
npm run build
```

Backend JavaScript can be started with:

```bash
cd backend
npm start
```

A running MySQL database is required for the backend startup check.
