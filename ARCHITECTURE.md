# BanglesMart Architecture

BanglesMart is split into a Next.js storefront/admin application and an Express/MySQL API. The refactor keeps business rules out of individual pages as much as possible so future changes can be made in one place.

## Main folders

```text
backend/
  src/
    config/                 environment/database configuration
    constants/              shared backend constants/table registry
    controllers/            HTTP request/response layer
    modules/products/       product field definition and normalization
    services/               centralized product, cart, wishlist and OTP logic
    routes/                 admin/customer/store route registration
    utils/                  shared validation/serialization helpers
  migrations/               upgrades for an existing database
  database/schema.sql       complete fresh schema copy
  scripts/migrate.js        migration runner

frontend/
  app/                      Next.js routes
  components/               reusable UI components
  features/auth/            centralized customer authentication calls
  features/cart/            centralized cart API
  features/wishlist/        centralized wishlist API
  features/commerce/        shared cart/wishlist/customer UI state
  lib/                      API configuration, routes and formatting helpers
  types/                    shared ecommerce TypeScript types

database/
  banglesmart_full_database.sql   fresh database for a new installation
  schema.sql                      identical convenient full-schema copy
```

## Product and variant model

Every sellable product requires at least one size and one color. The admin create-product page supports one or many sizes and one or many colors. The frontend generates the size × color matrix and submits the final variant array once.

Each variant owns:

- size
- color
- SKU
- MRP
- selling price
- inventory quantity
- low-stock limit
- status

`backend/src/services/product.service.js` validates the full payload and creates the product, variants, inventory and optional design-option rows inside one database transaction.

## Design options

Design options are optional product-specific visual choices, not global/master variants. A product can have zero or many designs. Each design can have its own image gallery. Storefront selection changes the displayed design gallery while size/color continues to select the purchasable inventory variant.

Admin design management is centralized in:

- `backend/src/controllers/admin/design.controller.js`
- `frontend/components/admin/products/ProductDesignOptions.tsx`

## Cart

Core cart rules are centralized in `backend/src/services/cart.service.js` and `frontend/features/cart/cart.api.ts`.

A cart line is identified by its product variant and optional design option. The same size/color with two different design options therefore remains two separate cart lines. Stock validation is performed on the backend before quantities are accepted.

Admin cart visibility is available at `/admin/carts` and includes customer phone/email, line count, item count and cart value.

## Wishlist

Wishlist persistence and duplicate prevention are centralized in `backend/src/services/wishlist.service.js` and `frontend/features/wishlist/wishlist.api.ts`.

Admin wishlist visibility is available at `/admin/wishlists`.

## Customer authentication

Customers can use either email/password or phone OTP. Phone OTP logic is centralized in `backend/src/services/otp.service.js`. A successfully verified phone number creates a customer account automatically when one does not yet exist.

In development, when no SMS provider is configured, OTP values are logged by the backend. Production requires `SMS_API_URL` (and `SMS_API_KEY` when required by the provider).

## Orders and inventory

Order items store product/variant/design snapshot fields so historic orders remain understandable even after product information changes. Cart-to-order logic carries the selected design option into order items.

Inventory remains variant-based through `inventories` and `inventory_movements`.

## Database source of truth

For a new empty database, use `database/banglesmart_full_database.sql`.

For an existing BanglesMart database, use the ordered SQL files in `backend/migrations/` via `npm run migrate`.

Do not import the fresh schema over a populated production database.

## Admin shell and confirmation UX

Admin navigation is defined once in `frontend/lib/adminNavigation.ts` and rendered by the reusable admin shell. Destructive/status actions use the reusable feedback layer rather than native browser dialogs.

Shared confirmation/toast UI lives in:

- `frontend/components/ui/FeedbackProvider.tsx`
- `frontend/components/admin/ui/AdminFeedbackProvider.tsx` (admin-compatible wrapper)

Storefront routes are wrapped by the same shared feedback provider through `frontend/components/store/StoreChrome.tsx`.

## API configuration and shared HTTP helpers

API origins are defined once in `frontend/lib/apiConfig.ts`. Admin, customer and store API clients consume that configuration. Common JSON-response handling is centralized in `frontend/lib/http.ts`.
