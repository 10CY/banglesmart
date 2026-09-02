-- BanglesMart ecommerce upgrade migration
-- Run once against the existing banglesmart database.

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS name varchar(255) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS status varchar(50) NOT NULL DEFAULT 'active';

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  email varchar(255) NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'subscribed',
  source varchar(50) DEFAULT 'website',
  subscribed_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY newsletter_subscribers_email_unique (email),
  KEY newsletter_subscribers_status_index (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS return_requests (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  order_id bigint unsigned NOT NULL,
  user_id bigint unsigned NOT NULL,
  reason varchar(255) NOT NULL,
  notes text DEFAULT NULL,
  status varchar(40) NOT NULL DEFAULT 'requested',
  refund_status varchar(40) NOT NULL DEFAULT 'not_requested',
  refund_amount decimal(12,2) NOT NULL DEFAULT 0.00,
  admin_note text DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  approved_at timestamp NULL DEFAULT NULL,
  completed_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY return_requests_order_index (order_id),
  KEY return_requests_user_index (user_id),
  KEY return_requests_status_index (status),
  CONSTRAINT return_requests_order_fk FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT return_requests_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS return_items (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  return_request_id bigint unsigned NOT NULL,
  order_item_id bigint unsigned NOT NULL,
  quantity int unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY return_items_request_item_unique (return_request_id, order_item_id),
  CONSTRAINT return_items_request_fk FOREIGN KEY (return_request_id) REFERENCES return_requests(id) ON DELETE CASCADE,
  CONSTRAINT return_items_order_item_fk FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  user_id bigint unsigned NOT NULL,
  type varchar(50) NOT NULL,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  data longtext DEFAULT NULL,
  read_at timestamp NULL DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  updated_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY notifications_user_read_index (user_id, read_at),
  CONSTRAINT notifications_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_status_history (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  order_id bigint unsigned NOT NULL,
  status varchar(50) NOT NULL,
  note varchar(500) DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY order_status_history_order_index (order_id, created_at),
  CONSTRAINT order_status_history_order_fk FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id bigint unsigned NOT NULL AUTO_INCREMENT,
  admin_user_id bigint unsigned NOT NULL,
  action varchar(100) NOT NULL,
  entity_type varchar(100) NOT NULL,
  entity_id bigint unsigned DEFAULT NULL,
  details longtext DEFAULT NULL,
  ip_address varchar(45) DEFAULT NULL,
  created_at timestamp NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY admin_audit_logs_admin_index (admin_user_id),
  KEY admin_audit_logs_entity_index (entity_type, entity_id),
  CONSTRAINT admin_audit_logs_admin_fk FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
