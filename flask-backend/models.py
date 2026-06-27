from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Index
from datetime import datetime

db = SQLAlchemy()


# ─────────────────────────────────────────────
#  USER & ADDRESS
# ─────────────────────────────────────────────

class User(db.Model):
    __tablename__ = 'users'
    __table_args__ = (
        db.Index('idx_users_email', 'email'),
        db.Index('idx_users_role',  'role'),
    )

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False, unique=True)
    phone = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(300), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='customer')  # customer | admin
    # ── Session tracking ───────────────────────────────────────────────────
    is_online = db.Column(db.Boolean, default=False, nullable=False)
    last_seen = db.Column(db.DateTime, nullable=True)
    # ─────────────────────────────────────────────────────────────────────
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    addresses = db.relationship('Address', backref='user', lazy=True, cascade='all, delete-orphan')
    orders = db.relationship('Order', backref='user', lazy=True)
    subscriptions = db.relationship('Subscription', backref='user', lazy=True)
    reviews = db.relationship('Review', backref='user', lazy=True)
    password_reset_otps = db.relationship('PasswordResetOTP', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_addresses=True):
        data = {
            '_id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone or '',
            'role': self.role,
            'isOnline': self.is_online,
            'lastSeen': self.last_seen.isoformat() if self.last_seen else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_addresses:
            data['addresses'] = [a.to_dict() for a in self.addresses]
        return data


class Address(db.Model):
    __tablename__ = 'addresses'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    street = db.Column(db.String(300), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    country = db.Column(db.String(100), nullable=False, default='India')
    is_default = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            '_id': self.id,
            'street': self.street,
            'city': self.city,
            'state': self.state,
            'postalCode': self.postal_code,
            'country': self.country,
            'isDefault': self.is_default,
        }


# ─────────────────────────────────────────────
#  PASSWORD RESET OTP
# ─────────────────────────────────────────────

class PasswordResetOTP(db.Model):
    __tablename__ = 'password_reset_otps'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    otp_hash = db.Column(db.String(300), nullable=False)   # bcrypt hash of 6-digit OTP
    expires_at = db.Column(db.DateTime, nullable=False)    # 5 minutes from creation
    attempts = db.Column(db.Integer, default=0)            # max 5 attempts
    is_used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────
#  LOGIN / REGISTER OTP  (phone-based auth)
# ─────────────────────────────────────────────

class LoginOTP(db.Model):
    """Stores OTPs used for phone-number-based login and registration."""
    __tablename__ = 'login_otps'

    id         = db.Column(db.Integer, primary_key=True)
    phone      = db.Column(db.String(20), nullable=False, index=True)  # normalised 10-digit
    otp_hash   = db.Column(db.String(300), nullable=False)             # bcrypt hash
    expires_at = db.Column(db.DateTime, nullable=False)                # 5 min window
    attempts   = db.Column(db.Integer, default=0)                      # max 5
    is_used    = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Rate-limit tracking: ip + phone, stored as JSON meta (optional)
    meta       = db.Column(db.Text, default='{}')


# ─────────────────────────────────────────────
#  CATEGORY
# ─────────────────────────────────────────────

class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=False)
    image = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            '_id': self.id,
            'name': self.name,
            'description': self.description,
            'image': self.image,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }


# ─────────────────────────────────────────────
#  PRODUCT
# ─────────────────────────────────────────────

class ProductImage(db.Model):
    __tablename__ = 'product_images'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)


class ProductIngredient(db.Model):
    __tablename__ = 'product_ingredients'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    ingredient = db.Column(db.String(300), nullable=False)


class Review(db.Model):
    __tablename__ = 'reviews'
    __table_args__ = (
        db.UniqueConstraint('user_id', 'product_id', name='uq_review_user_product'),
        db.Index('idx_reviews_product', 'product_id'),
    )

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    rating = db.Column(db.Float, nullable=False)
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            '_id': self.id,
            'user': self.user_id,
            'name': self.name,
            'rating': self.rating,
            'comment': self.comment,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class Product(db.Model):
    __tablename__ = 'products'
    __table_args__ = (
        db.Index('idx_products_category',    'category'),
        db.Index('idx_products_is_featured', 'is_featured'),
        db.Index('idx_products_price',       'price'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=False)
    shelf_life = db.Column(db.String(100), nullable=False, default='30 Days')
    weight = db.Column(db.String(50), nullable=True)  # e.g. '100g', '250g'
    category = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, nullable=False, default=0.0)
    discount_price = db.Column(db.Float, default=0.0)
    stock = db.Column(db.Integer, nullable=False, default=0)
    rating = db.Column(db.Float, default=0.0)
    num_reviews = db.Column(db.Integer, default=0)
    is_featured = db.Column(db.Boolean, default=False)
    is_best_seller = db.Column(db.Boolean, default=False)
    is_trending = db.Column(db.Boolean, default=False)
    is_combo = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    images = db.relationship('ProductImage', backref='product', lazy=True, cascade='all, delete-orphan')
    ingredients = db.relationship('ProductIngredient', backref='product', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='product', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            '_id': self.id,
            'user': self.user_id,
            'title': self.title,
            'description': self.description,
            'shelfLife': self.shelf_life,
            'weight': self.weight or '',
            'category': self.category,
            'price': self.price,
            'discountPrice': self.discount_price,
            'stock': self.stock,
            'rating': self.rating,
            'numReviews': self.num_reviews,
            'isFeatured': self.is_featured,
            'isBestSeller': self.is_best_seller,
            'isTrending': self.is_trending,
            'isCombo': self.is_combo,
            'images': [img.url for img in self.images],
            'ingredients': [ing.ingredient for ing in self.ingredients],
            'reviews': [r.to_dict() for r in self.reviews],
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }


# ─────────────────────────────────────────────
#  ORDER
# ─────────────────────────────────────────────

class OrderShippingAddress(db.Model):
    __tablename__ = 'order_shipping_address'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    street = db.Column(db.String(300), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    country = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {
            'street': self.street,
            'city': self.city,
            'state': self.state,
            'postalCode': self.postal_code,
            'country': self.country,
        }


class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    title = db.Column(db.String(300), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    images = db.Column(db.Text, default='[]')  # JSON string of image urls

    def to_dict(self):
        import json
        try:
            imgs = json.loads(self.images) if self.images else []
        except Exception:
            imgs = []
        return {
            '_id': self.id,
            'product': self.product_id,
            'title': self.title,
            'quantity': self.quantity,
            'price': self.price,
            'images': imgs,
        }


class OrderStatusTimeline(db.Model):
    __tablename__ = 'order_status_timeline'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    status = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    description = db.Column(db.Text)

    def to_dict(self):
        return {
            'status': self.status,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'description': self.description,
        }


class Order(db.Model):
    __tablename__ = 'orders'
    __table_args__ = (
        db.Index('idx_orders_user',    'user_id'),
        db.Index('idx_orders_status',  'order_status'),
        db.Index('idx_orders_created', 'created_at'),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    payment_method = db.Column(db.String(100), nullable=False)
    payment_result_id = db.Column(db.String(300))
    payment_result_status = db.Column(db.String(100))
    payment_result_update_time = db.Column(db.String(100))
    payment_result_email = db.Column(db.String(200))
    items_price = db.Column(db.Float, nullable=False, default=0.0)
    tax_price = db.Column(db.Float, nullable=False, default=0.0)
    shipping_price = db.Column(db.Float, nullable=False, default=0.0)
    total_price = db.Column(db.Float, nullable=False, default=0.0)
    is_paid = db.Column(db.Boolean, default=False)
    paid_at = db.Column(db.DateTime)
    order_status = db.Column(db.String(50), default='Pending')  # Pending | Packed | Shipped | Delivered | Cancelled
    tracking_number = db.Column(db.String(200))
    carrier = db.Column(db.String(200), default='Sharadha Delivery Service')
    cancellation_reason = db.Column(db.String(300))   # filled on cancel
    cancelled_at = db.Column(db.DateTime)              # timestamp of cancellation
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    order_items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    shipping_address = db.relationship('OrderShippingAddress', backref='order', lazy=True, cascade='all, delete-orphan', uselist=False)
    status_timeline = db.relationship('OrderStatusTimeline', backref='order', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_user=False):
        data = {
            '_id': self.id,
            'user': self.user_id,
            'orderItems': [item.to_dict() for item in self.order_items],
            'shippingAddress': self.shipping_address.to_dict() if self.shipping_address else {},
            'paymentMethod': self.payment_method,
            'paymentResult': {
                'id': self.payment_result_id,
                'status': self.payment_result_status,
                'update_time': self.payment_result_update_time,
                'email_address': self.payment_result_email,
            },
            'itemsPrice': self.items_price,
            'taxPrice': self.tax_price,
            'shippingPrice': self.shipping_price,
            'totalPrice': self.total_price,
            'isPaid': self.is_paid,
            'paidAt': self.paid_at.isoformat() if self.paid_at else None,
            'orderStatus': self.order_status,
            'statusTimeline': [t.to_dict() for t in self.status_timeline],
            'trackingNumber': self.tracking_number,
            'carrier': self.carrier,
            'cancellationReason': self.cancellation_reason,
            'cancelledAt': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_user and self.user:
            data['user'] = {'_id': self.user.id, 'name': self.user.name, 'email': self.user.email}
        return data


# ─────────────────────────────────────────────
#  INVENTORY
# ─────────────────────────────────────────────

class InventoryBatch(db.Model):
    __tablename__ = 'inventory_batches'

    id = db.Column(db.Integer, primary_key=True)
    inventory_id = db.Column(db.Integer, db.ForeignKey('inventory.id'), nullable=False)
    batch_number = db.Column(db.String(200), nullable=False)
    manufacture_date = db.Column(db.Date, nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    is_expired = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            '_id': self.id,
            'batchNumber': self.batch_number,
            'manufactureDate': self.manufacture_date.isoformat() if self.manufacture_date else None,
            'expiryDate': self.expiry_date.isoformat() if self.expiry_date else None,
            'quantity': self.quantity,
            'isExpired': self.is_expired,
        }


class Inventory(db.Model):
    __tablename__ = 'inventory'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, unique=True)
    title = db.Column(db.String(300), nullable=False)
    stock_count = db.Column(db.Integer, nullable=False, default=0)
    shelf_life_alert_days = db.Column(db.Integer, default=15)
    low_stock_threshold = db.Column(db.Integer, default=10)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    batches = db.relationship('InventoryBatch', backref='inventory', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            '_id': self.id,
            'product': self.product_id,
            'title': self.title,
            'stockCount': self.stock_count,
            'shelfLifeAlertDays': self.shelf_life_alert_days,
            'lowStockThreshold': self.low_stock_threshold,
            'batches': [b.to_dict() for b in self.batches],
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }


# ─────────────────────────────────────────────
#  SUBSCRIPTION
# ─────────────────────────────────────────────

class SubscriptionItem(db.Model):
    __tablename__ = 'subscription_items'

    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    title = db.Column(db.String(300), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    price = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            '_id': self.id,
            'product': self.product_id,
            'title': self.title,
            'quantity': self.quantity,
            'price': self.price,
        }


class Subscription(db.Model):
    __tablename__ = 'subscriptions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    plan_type = db.Column(db.String(50), nullable=False)  # Weekly | Monthly | Festival_Combo
    price = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(50), nullable=False, default='Active')  # Active | Paused | Cancelled
    delivery_day = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    next_delivery_date = db.Column(db.DateTime, nullable=False)
    payment_method = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = db.relationship('SubscriptionItem', backref='subscription', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            '_id': self.id,
            'user': self.user_id,
            'planType': self.plan_type,
            'price': self.price,
            'status': self.status,
            'deliveryDay': self.delivery_day,
            'startDate': self.start_date.isoformat() if self.start_date else None,
            'nextDeliveryDate': self.next_delivery_date.isoformat() if self.next_delivery_date else None,
            'paymentMethod': self.payment_method,
            'items': [i.to_dict() for i in self.items],
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }


# ─────────────────────────────────────────────
#  SUPPORT TICKET
# ─────────────────────────────────────────────

class TicketResponse(db.Model):
    __tablename__ = 'ticket_responses'

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('support_tickets.id'), nullable=False)
    sender = db.Column(db.String(50), nullable=False)  # 'User' or 'Admin'
    sender_name = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            '_id': self.id,
            'sender': self.sender,
            'senderName': self.sender_name,
            'message': self.message,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


class SupportTicket(db.Model):
    __tablename__ = 'support_tickets'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    subject = db.Column(db.String(300), nullable=False)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), nullable=False, default='Open')  # Open | In_Progress | Closed
    priority = db.Column(db.String(50), nullable=False, default='Medium')  # Low | Medium | High
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    responses = db.relationship('TicketResponse', backref='ticket', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            '_id': self.id,
            'user': self.user_id,
            'name': self.name,
            'email': self.email,
            'subject': self.subject,
            'message': self.message,
            'status': self.status,
            'priority': self.priority,
            'responses': [r.to_dict() for r in self.responses],
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }


# ─────────────────────────────────────────────
#  CART  (server-side, per logged-in user)
# ─────────────────────────────────────────────

class Cart(db.Model):
    __tablename__ = 'cart'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = db.relationship('CartItem', backref='cart', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            '_id':      self.id,
            'user':     self.user_id,
            'items':    [i.to_dict() for i in self.items],
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
        }


class CartItem(db.Model):
    __tablename__ = 'cart_items'
    __table_args__ = (
        db.UniqueConstraint('cart_id', 'product_id', name='uq_cart_product'),
        db.Index('idx_cart_items_cart', 'cart_id'),
    )

    id         = db.Column(db.Integer, primary_key=True)
    cart_id    = db.Column(db.Integer, db.ForeignKey('cart.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    quantity   = db.Column(db.Integer, nullable=False, default=1)
    added_at   = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship('Product', lazy=True)

    def to_dict(self):
        p = self.product
        if p:
            item_price = p.discount_price if p.discount_price and p.discount_price > 0 else p.price
            return {
                '_id':      self.id,
                'product':  p.id,
                'title':    p.title,
                'price':    item_price,
                'images':   [img.url for img in p.images],
                'stock':    p.stock,
                'category': p.category,
                'shelfLife': p.shelf_life,
                'quantity': self.quantity,
                'addedAt':  self.added_at.isoformat() if self.added_at else None,
            }
        return {
            '_id':      self.id,
            'product':  self.product_id,
            'quantity': self.quantity,
        }


# ─────────────────────────────────────────────
#  WISHLIST  (server-side, per logged-in user)
# ─────────────────────────────────────────────

class Wishlist(db.Model):
    __tablename__ = 'wishlist'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship('WishlistItem', backref='wishlist', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            '_id':   self.id,
            'user':  self.user_id,
            'items': [i.to_dict() for i in self.items],
        }


class WishlistItem(db.Model):
    __tablename__ = 'wishlist_items'
    __table_args__ = (
        db.UniqueConstraint('wishlist_id', 'product_id', name='uq_wishlist_product'),
        db.Index('idx_wishlist_items_wishlist', 'wishlist_id'),
    )

    id          = db.Column(db.Integer, primary_key=True)
    wishlist_id = db.Column(db.Integer, db.ForeignKey('wishlist.id'), nullable=False)
    product_id  = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    added_at    = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship('Product', lazy=True)

    def to_dict(self):
        p = self.product
        if p:
            return p.to_dict()
        return {'_id': self.product_id}


# ─────────────────────────────────────────────
#  PAYMENT
# ─────────────────────────────────────────────

class Payment(db.Model):
    __tablename__ = 'payments'
    __table_args__ = (
        db.Index('idx_payments_order',  'order_id'),
        db.Index('idx_payments_user',   'user_id'),
        db.Index('idx_payments_status', 'status'),
    )

    id               = db.Column(db.Integer, primary_key=True)
    order_id         = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    user_id          = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount           = db.Column(db.Float, nullable=False)
    currency         = db.Column(db.String(10), nullable=False, default='INR')
    method           = db.Column(db.String(100), nullable=False)
    status           = db.Column(db.String(50), nullable=False, default='Pending')  # Pending | Completed | Failed | Refunded
    transaction_id   = db.Column(db.String(300), default=None)
    gateway          = db.Column(db.String(100), default=None)  # razorpay | payu | stripe | cod
    gateway_response = db.Column(db.Text, default=None)  # raw JSON from payment gateway
    paid_at          = db.Column(db.DateTime, default=None)
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            '_id':           self.id,
            'order':         self.order_id,
            'user':          self.user_id,
            'amount':        self.amount,
            'currency':      self.currency,
            'method':        self.method,
            'status':        self.status,
            'transactionId': self.transaction_id,
            'gateway':       self.gateway,
            'paidAt':        self.paid_at.isoformat() if self.paid_at else None,
            'createdAt':     self.created_at.isoformat() if self.created_at else None,
        }


# ─────────────────────────────────────────────
#  COUPON
# ─────────────────────────────────────────────

class Coupon(db.Model):
    __tablename__ = 'coupons'
    __table_args__ = (
        db.Index('idx_coupons_code',   'code'),
        db.Index('idx_coupons_active', 'is_active'),
    )

    id               = db.Column(db.Integer, primary_key=True)
    code             = db.Column(db.String(50), nullable=False, unique=True)
    discount_type    = db.Column(db.String(20), nullable=False, default='percentage')  # percentage | fixed
    discount_value   = db.Column(db.Float, nullable=False)
    min_order_amount = db.Column(db.Float, default=0.0)
    max_uses         = db.Column(db.Integer, default=None)   # None = unlimited
    current_uses     = db.Column(db.Integer, default=0)
    is_active        = db.Column(db.Boolean, default=True)
    expires_at       = db.Column(db.DateTime, default=None)  # None = no expiry
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            '_id':            self.id,
            'code':           self.code,
            'discountType':   self.discount_type,
            'discountValue':  self.discount_value,
            'minOrderAmount': self.min_order_amount,
            'maxUses':        self.max_uses,
            'currentUses':    self.current_uses,
            'isActive':       self.is_active,
            'expiresAt':      self.expires_at.isoformat() if self.expires_at else None,
            'createdAt':      self.created_at.isoformat() if self.created_at else None,
        }


# ─────────────────────────────────────────────
#  CONTACT MESSAGE
# ─────────────────────────────────────────────

class ContactMessage(db.Model):
    __tablename__ = 'contact_messages'
    __table_args__ = (
        db.Index('idx_contact_is_read', 'is_read'),
        db.Index('idx_contact_email',   'email'),
    )

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(200), nullable=False)
    email      = db.Column(db.String(200), nullable=False)
    phone      = db.Column(db.String(20), default=None)
    subject    = db.Column(db.String(300), nullable=False)
    message    = db.Column(db.Text, nullable=False)
    is_read    = db.Column(db.Boolean, default=False)
    replied_at = db.Column(db.DateTime, default=None)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            '_id':       self.id,
            'name':      self.name,
            'email':     self.email,
            'phone':     self.phone or '',
            'subject':   self.subject,
            'message':   self.message,
            'isRead':    self.is_read,
            'repliedAt': self.replied_at.isoformat() if self.replied_at else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
        }


# ─────────────────────────────────────────────
#  NEWSLETTER SUBSCRIBER
# ─────────────────────────────────────────────

class NewsletterSubscriber(db.Model):
    __tablename__ = 'newsletter_subscribers'
    __table_args__ = (
        db.Index('idx_newsletter_email',  'email'),
        db.Index('idx_newsletter_active', 'is_active'),
    )

    id               = db.Column(db.Integer, primary_key=True)
    email            = db.Column(db.String(200), nullable=False, unique=True)
    name             = db.Column(db.String(200), default=None)
    is_active        = db.Column(db.Boolean, default=True)
    subscribed_at    = db.Column(db.DateTime, default=datetime.utcnow)
    unsubscribed_at  = db.Column(db.DateTime, default=None)

    def to_dict(self):
        return {
            '_id':             self.id,
            'email':           self.email,
            'name':            self.name or '',
            'isActive':        self.is_active,
            'subscribedAt':    self.subscribed_at.isoformat() if self.subscribed_at else None,
            'unsubscribedAt':  self.unsubscribed_at.isoformat() if self.unsubscribed_at else None,
        }

