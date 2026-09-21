# BanglesMart Refactor Changelog

## Ecommerce structure

- Added centralized backend services for product creation, cart, wishlist and phone OTP.
- Added centralized frontend API modules for cart, wishlist and authentication.
- Added shared ecommerce TypeScript types and route constants.
- Added shared commerce provider for customer/cart/wishlist header state.
- Added central backend product field definition and table-name registry.

## Products, sizes and colors

- Product creation now requires at least one active size and one active color.
- Admin can select multiple sizes and multiple colors.
- Size × color combinations are generated automatically on the create-product page.
- Each generated variant has independent SKU, MRP, selling price, quantity and low-stock limit.
- Product + variants + inventories are created in one transaction.
- Existing variant management remains available for later edits.

## Design options

- Added optional `product_design_options` and `product_design_images` support.
- Added admin endpoints and reusable admin components for design options/images.
- Product detail API exposes design options and galleries.
- Product detail storefront can switch gallery images by selected design.
- Cart and orders preserve the selected design option.

## Cart and wishlist

- Centralized cart behavior and stock validation.
- Centralized wishlist behavior and duplicate prevention.
- Added admin customer-cart listing/detail pages.
- Added admin wishlist listing/detail pages.
- Added cart/wishlist metrics to the admin dashboard and navigation.

## Customer accounts

- Added phone OTP request/verification flow.
- Phone-verified customers can be created automatically.
- Kept email/password login for existing accounts.
- Added customer phone visibility in relevant admin customer/cart/wishlist views.

## Database

- Added fresh full schema at `database/banglesmart_full_database.sql`.
- Added matching backend schema copy at `backend/database/schema.sql`.
- Added structured ecommerce migration `backend/migrations/20260916_structured_ecommerce.sql`.
- Added migration tracking through `schema_migrations`.
- Added design-option, OTP and cart/order design columns; the fresh schema includes the supporting indexes and foreign keys.

## Storefront/admin cleanup

- Reused centralized API and formatting helpers across updated ecommerce flows.
- Updated product detail/cart/wishlist flows to use shared modules.
- Updated admin navigation/dashboard for carts and wishlists.
- Added reusable product-variant matrix and design-option components.
- Corrected customer review submission to use the authenticated customer review endpoint.

## Validation performed in this package

- Backend JavaScript source files pass Node syntax parsing (`node --check`).
- Frontend TypeScript/TSX source files pass TypeScript syntax parsing.
- Relative/backend and local frontend alias imports were checked for missing source targets.
- A full Next.js build/lint requires a normal `npm install` in the target environment; dependency installation was not available in the packaging environment.

## Premium admin and shared UI feedback

- Added a premium responsive admin shell with grouped centralized navigation, mobile drawer, topbar search, profile actions, and commerce-focused sections.
- Added the missing admin invoices page with authenticated PDF invoice download.
- Added one reusable feedback provider for confirmation modals and toast notifications across admin and storefront flows.
- Removed native browser confirmation/alert dialogs from packaged frontend flows.
- Added shared authenticated file-download helper and shared API JSON response helper.
- Centralized API host configuration in `frontend/lib/apiConfig.ts`.

## Final packaging cleanup

- Removed temporary/duplicate source files and build caches.
- Added `database/schema.sql` alongside `database/banglesmart_full_database.sql` as a convenient full-schema alias.
- Added `VALIDATION.md` with the exact checks performed and the npm/build environment limitation.
