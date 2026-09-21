-- Structured ecommerce upgrade: variants-at-create, design options, phone OTP,
-- centralized cart/wishlist support, and admin commerce visibility.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP NULL DEFAULT NULL;

-- Phone-OTP accounts may not have an email/password initially.
ALTER TABLE users
  MODIFY COLUMN email VARCHAR(255) NULL,
  MODIFY COLUMN password VARCHAR(255) NULL;

CREATE TABLE IF NOT EXISTS customer_otps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone VARCHAR(20) NOT NULL,
  purpose VARCHAR(50) NOT NULL DEFAULT 'login',
  otp_hash VARCHAR(128) NOT NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME NOT NULL,
  verified_at DATETIME NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY customer_otps_phone_purpose_index (phone,purpose,created_at),
  KEY customer_otps_expiry_index (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_design_options (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  label VARCHAR(100) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY product_design_options_product_index (product_id,status,sort_order),
  CONSTRAINT product_design_options_product_fk FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_design_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  design_option_id BIGINT UNSIGNED NOT NULL,
  image VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255) NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY product_design_images_option_index (design_option_id,is_primary,sort_order),
  CONSTRAINT product_design_images_option_fk FOREIGN KEY (design_option_id) REFERENCES product_design_options(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE carts
  ADD COLUMN IF NOT EXISTS guest_token VARCHAR(128) NULL AFTER user_id,
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'active' AFTER guest_token;

ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS design_option_id BIGINT UNSIGNED NULL AFTER product_variant_id;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS courier_name VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS shipped_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS delivered_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS cancelled_at DATETIME NULL;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS design_option_id BIGINT UNSIGNED NULL AFTER product_variant_id,
  ADD COLUMN IF NOT EXISTS design_name VARCHAR(100) NULL AFTER color_name;

CREATE TABLE IF NOT EXISTS schema_migrations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  filename VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY schema_migrations_filename_unique (filename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
