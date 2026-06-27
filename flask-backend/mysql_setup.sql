-- ============================================================
--  Sharadha Stores — MySQL Database Schema
--  Run this script once against your MySQL server:
--    mysql -u root -p < mysql_setup.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS sharadha_stores
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sharadha_stores;

-- ─────────────────────────────────────────────
--  USERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    name             VARCHAR(200)  NOT NULL,
    email            VARCHAR(200)  NOT NULL UNIQUE,
    phone            VARCHAR(20)   DEFAULT NULL,
    password_hash    VARCHAR(300)  NOT NULL,
    role             VARCHAR(50)   NOT NULL DEFAULT 'customer',
    is_online        TINYINT(1)    NOT NULL DEFAULT 0,
    last_seen        DATETIME      DEFAULT NULL,
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role  (role)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  ADDRESSES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NOT NULL,
    street      VARCHAR(300) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    state       VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20)  NOT NULL,
    country     VARCHAR(100) NOT NULL DEFAULT 'India',
    is_default  TINYINT(1)   DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_addresses_user (user_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  PASSWORD RESET OTPs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    otp_hash   VARCHAR(300) NOT NULL,
    expires_at DATETIME     NOT NULL,
    attempts   INT          DEFAULT 0,
    is_used    TINYINT(1)   DEFAULT 0,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_otp_user (user_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  LOGIN OTPs (phone-based)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_otps (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    phone      VARCHAR(20)  NOT NULL,
    otp_hash   VARCHAR(300) NOT NULL,
    expires_at DATETIME     NOT NULL,
    attempts   INT          DEFAULT 0,
    is_used    TINYINT(1)   DEFAULT 0,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    meta       TEXT         DEFAULT '{}',
    INDEX idx_login_otp_phone (phone)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL UNIQUE,
    description TEXT         NOT NULL,
    image       VARCHAR(500) NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  PRODUCTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT          NOT NULL,
    title           VARCHAR(300) NOT NULL,
    description     TEXT         NOT NULL,
    shelf_life      VARCHAR(100) NOT NULL DEFAULT '30 Days',
    weight          VARCHAR(50)  DEFAULT NULL,
    category        VARCHAR(200) NOT NULL,
    price           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_price  DECIMAL(10,2) DEFAULT 0.00,
    stock           INT          NOT NULL DEFAULT 0,
    rating          DECIMAL(3,2) DEFAULT 0.00,
    num_reviews     INT          DEFAULT 0,
    is_featured     TINYINT(1)   DEFAULT 0,
    is_best_seller  TINYINT(1)   DEFAULT 0,
    is_trending     TINYINT(1)   DEFAULT 0,
    is_combo        TINYINT(1)   DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_products_category    (category),
    INDEX idx_products_is_featured (is_featured),
    INDEX idx_products_price       (price),
    FULLTEXT INDEX idx_products_search (title, description, category)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  PRODUCT IMAGES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT          NOT NULL,
    url        VARCHAR(500) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_images_product (product_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  PRODUCT INGREDIENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_ingredients (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT          NOT NULL,
    ingredient VARCHAR(300) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_ingredients_product (product_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  REVIEWS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT         NOT NULL,
    user_id    INT         NOT NULL,
    name       VARCHAR(200) NOT NULL,
    rating     DECIMAL(2,1) NOT NULL,
    comment    TEXT         NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id),
    UNIQUE KEY  uq_review_user_product (user_id, product_id),
    INDEX idx_reviews_product (product_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  ORDERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id                        INT AUTO_INCREMENT PRIMARY KEY,
    user_id                   INT           NOT NULL,
    payment_method            VARCHAR(100)  NOT NULL,
    payment_result_id         VARCHAR(300)  DEFAULT NULL,
    payment_result_status     VARCHAR(100)  DEFAULT NULL,
    payment_result_update_time VARCHAR(100) DEFAULT NULL,
    payment_result_email      VARCHAR(200)  DEFAULT NULL,
    items_price               DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_price                 DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping_price            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price               DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_paid                   TINYINT(1)    DEFAULT 0,
    paid_at                   DATETIME      DEFAULT NULL,
    order_status              VARCHAR(50)   DEFAULT 'Pending',
    tracking_number           VARCHAR(200)  DEFAULT NULL,
    carrier                   VARCHAR(200)  DEFAULT 'Sharadha Delivery Service',
    cancellation_reason       VARCHAR(300)  DEFAULT NULL,
    cancelled_at              DATETIME      DEFAULT NULL,
    created_at                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_orders_user   (user_id),
    INDEX idx_orders_status (order_status),
    INDEX idx_orders_created(created_at)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  ORDER SHIPPING ADDRESS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_shipping_address (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    order_id    INT          NOT NULL,
    street      VARCHAR(300) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    state       VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20)  NOT NULL,
    country     VARCHAR(100) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_osa_order (order_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  ORDER ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    order_id   INT           NOT NULL,
    product_id INT           DEFAULT NULL,
    title      VARCHAR(300)  NOT NULL,
    quantity   INT           NOT NULL,
    price      DECIMAL(10,2) NOT NULL,
    images     TEXT          DEFAULT '[]',
    FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_order_items_order   (order_id),
    INDEX idx_order_items_product (product_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  ORDER STATUS TIMELINE
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_status_timeline (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    order_id    INT          NOT NULL,
    status      VARCHAR(100) NOT NULL,
    timestamp   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT         DEFAULT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_ost_order (order_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  PAYMENTS  (NEW)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    order_id       INT           NOT NULL,
    user_id        INT           NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    currency       VARCHAR(10)   NOT NULL DEFAULT 'INR',
    method         VARCHAR(100)  NOT NULL,
    status         VARCHAR(50)   NOT NULL DEFAULT 'Pending',
    transaction_id VARCHAR(300)  DEFAULT NULL,
    gateway        VARCHAR(100)  DEFAULT NULL,
    gateway_response TEXT        DEFAULT NULL,
    paid_at        DATETIME      DEFAULT NULL,
    created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id)  REFERENCES users(id),
    INDEX idx_payments_order (order_id),
    INDEX idx_payments_user  (user_id),
    INDEX idx_payments_status(status)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  CART  (NEW)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT      NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_cart_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cart_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    cart_id    INT           NOT NULL,
    product_id INT           NOT NULL,
    quantity   INT           NOT NULL DEFAULT 1,
    added_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id)    REFERENCES cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY  uq_cart_product (cart_id, product_id),
    INDEX idx_cart_items_cart (cart_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  WISHLIST  (NEW)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT      NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_wishlist_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wishlist_items (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    wishlist_id INT     NOT NULL,
    product_id  INT     NOT NULL,
    added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wishlist_id) REFERENCES wishlist(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id)  REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY  uq_wishlist_product (wishlist_id, product_id),
    INDEX idx_wishlist_items_wishlist (wishlist_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  COUPONS  (NEW)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    code             VARCHAR(50)   NOT NULL UNIQUE,
    discount_type    VARCHAR(20)   NOT NULL DEFAULT 'percentage', -- percentage | fixed
    discount_value   DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0.00,
    max_uses         INT           DEFAULT NULL,
    current_uses     INT           DEFAULT 0,
    is_active        TINYINT(1)    DEFAULT 1,
    expires_at       DATETIME      DEFAULT NULL,
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_coupons_code   (code),
    INDEX idx_coupons_active (is_active)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  INVENTORY
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    product_id           INT NOT NULL UNIQUE,
    title                VARCHAR(300) NOT NULL,
    stock_count          INT NOT NULL DEFAULT 0,
    shelf_life_alert_days INT DEFAULT 15,
    low_stock_threshold  INT DEFAULT 10,
    created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_inventory_product (product_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  INVENTORY BATCHES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_batches (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    inventory_id     INT     NOT NULL,
    batch_number     VARCHAR(200) NOT NULL,
    manufacture_date DATE    NOT NULL,
    expiry_date      DATE    NOT NULL,
    quantity         INT     NOT NULL,
    is_expired       TINYINT(1) DEFAULT 0,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
    INDEX idx_inv_batches_inventory (inventory_id),
    INDEX idx_inv_batches_expiry    (expiry_date)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  SUBSCRIPTIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    user_id             INT          NOT NULL,
    plan_type           VARCHAR(50)  NOT NULL,
    price               DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status              VARCHAR(50)  NOT NULL DEFAULT 'Active',
    delivery_day        VARCHAR(100) NOT NULL,
    start_date          DATETIME     DEFAULT CURRENT_TIMESTAMP,
    next_delivery_date  DATETIME     NOT NULL,
    payment_method      VARCHAR(100) NOT NULL,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_subscriptions_user   (user_id),
    INDEX idx_subscriptions_status (status)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  SUBSCRIPTION ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT           NOT NULL,
    product_id      INT           DEFAULT NULL,
    title           VARCHAR(300)  NOT NULL,
    quantity        INT           NOT NULL DEFAULT 1,
    price           DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id)      REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_sub_items_sub (subscription_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  SUPPORT TICKETS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          DEFAULT NULL,
    name       VARCHAR(200) NOT NULL,
    email      VARCHAR(200) NOT NULL,
    subject    VARCHAR(300) NOT NULL,
    message    TEXT         NOT NULL,
    status     VARCHAR(50)  NOT NULL DEFAULT 'Open',
    priority   VARCHAR(50)  NOT NULL DEFAULT 'Medium',
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_tickets_status (status),
    INDEX idx_tickets_user   (user_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  TICKET RESPONSES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_responses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id   INT          NOT NULL,
    sender      VARCHAR(50)  NOT NULL,
    sender_name VARCHAR(200) NOT NULL,
    message     TEXT         NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    INDEX idx_ticket_responses_ticket (ticket_id)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  CONTACT MESSAGES  (NEW)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(200) NOT NULL,
    email      VARCHAR(200) NOT NULL,
    phone      VARCHAR(20)  DEFAULT NULL,
    subject    VARCHAR(300) NOT NULL,
    message    TEXT         NOT NULL,
    is_read    TINYINT(1)   DEFAULT 0,
    replied_at DATETIME     DEFAULT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contact_is_read (is_read),
    INDEX idx_contact_email   (email)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  NEWSLETTER SUBSCRIBERS  (NEW)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    email        VARCHAR(200) NOT NULL UNIQUE,
    name         VARCHAR(200) DEFAULT NULL,
    is_active    TINYINT(1)   DEFAULT 1,
    subscribed_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at DATETIME  DEFAULT NULL,
    INDEX idx_newsletter_email  (email),
    INDEX idx_newsletter_active (is_active)
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────
--  SEED DEFAULT COUPONS
-- ─────────────────────────────────────────────
INSERT IGNORE INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, is_active)
VALUES
  ('WELCOME10',     'percentage', 10.00, 100.00, 500,  1),
  ('FESTIVAL15',    'percentage', 15.00, 200.00, 300,  1),
  ('TRADITIONAL20', 'percentage', 20.00, 500.00, 100,  1),
  ('FLAT50',        'fixed',      50.00, 300.00, 200,  1),
  ('NEWUSER25',     'percentage', 25.00, 150.00, 1000, 1);

-- Done!
SELECT 'Sharadha Stores MySQL schema created successfully!' AS status;
