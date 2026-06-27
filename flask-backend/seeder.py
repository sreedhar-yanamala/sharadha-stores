"""
seeder.py  —  Seeds the SQLite database with initial data for Sharadha Stores.
Run once:  python seeder.py
"""

import json
import bcrypt
from datetime import datetime, timedelta, date
from app import create_app
from models import (
    db, User, Address, Category,
    Product, ProductImage, ProductIngredient, Review,
    Order, OrderItem, OrderShippingAddress, OrderStatusTimeline,
    Inventory, InventoryBatch,
    Subscription, SubscriptionItem,
    SupportTicket, PasswordResetOTP,
)


def seed():
    app = create_app()
    with app.app_context():

        # ── Clear all tables ──────────────────────────────────────────────
        db.drop_all()
        db.create_all()
        print("Tables cleared and recreated.")

        # ── 1. Users ──────────────────────────────────────────────────────
        def hash_pw(pw):
            return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

        admin = User(
            name='Sharadha Admin',
            email='admin@sharadhastores.com',
            password_hash=hash_pw('admin123'),
            role='admin',
            phone='9876543210',   # For OTP-based password reset testing
        )
        customer = User(
            name='Ramesh Kumar',
            email='ramesh@gmail.com',
            password_hash=hash_pw('password123'),
            role='customer',
            phone='9876543211',   # For OTP-based password reset testing
        )
        customer2 = User(
            name='Meena Kumar',
            email='meena@gmail.com',
            password_hash=hash_pw('password123'),
            role='customer',
            phone='9876543212',
        )
        db.session.add_all([admin, customer, customer2])
        db.session.flush()

        db.session.add(Address(
            user_id=admin.id, street='12 Main Kitchen Lane',
            city='Mylapore', state='Tamil Nadu',
            postal_code='600004', country='India', is_default=True,
        ))
        db.session.add(Address(
            user_id=customer.id, street='45, Gandhi Nagar Road',
            city='Adyar', state='Tamil Nadu',
            postal_code='600020', country='India', is_default=True,
        ))
        db.session.add(Address(
            user_id=customer2.id, street='78, T-Nagar Avenue',
            city='Chennai', state='Tamil Nadu',
            postal_code='600017', country='India', is_default=True,
        ))
        db.session.flush()
        print("Users seeded.")

        # ── 2. Categories ─────────────────────────────────────────────────
        categories_data = [
            {
                'name': 'Sweets',
                'description': 'Authentic traditional sweets made with pure cow ghee and natural sweetening.',
                'image': 'https://images.unsplash.com/photo-1574085733277-851d9d856a3a?q=90&w=800&auto=format&fit=crop',
            },
            {
                'name': 'Snacks',
                'description': 'Crispy and savory snacks hand-pressed and fried in high-quality cold-pressed oils.',
                'image': 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=90&w=800&auto=format&fit=crop',
            },
            {
                'name': 'Pickles',
                'description': 'Sun-dried vegetables cured with spices and cold-pressed sesame oil. Preservative-free.',
                'image': 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=90&w=800&auto=format&fit=crop',
            },
            {
                'name': 'Spice Powders',
                'description': 'Freshly roasted spices ground in small batches to lock in natural aromas.',
                'image': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=90&w=800&auto=format&fit=crop',
            },
        ]
        for c in categories_data:
            db.session.add(Category(**c))
        db.session.flush()
        print("Categories seeded.")

        # ── 3. Products ───────────────────────────────────────────────────
        try:
            with open('products_list.json', 'r', encoding='utf-8') as f:
                products_raw = json.load(f)
        except Exception as e:
            print(f"Error loading products_list.json: {e}")
            raise

        seeded_products = []
        for pd in products_raw:
            p = Product(
                id=int(pd['_id']),
                user_id=admin.id,
                title=pd['title'],
                description=pd['description'],
                shelf_life=pd.get('shelfLife', '30 Days'),
                weight=pd.get('weight', ''),
                category=pd['category'],
                price=float(pd['price']),
                discount_price=float(pd.get('discountPrice', 0)),
                stock=int(pd['stock']),
                is_featured=bool(pd.get('isFeatured', False)),
                is_best_seller=bool(pd.get('isBestSeller', False)),
                is_trending=bool(pd.get('isTrending', False)),
                is_combo=bool(pd.get('isCombo', False)),
                rating=float(pd.get('rating', 0.0)),
                num_reviews=int(pd.get('numReviews', 0)),
            )
            db.session.add(p)
            db.session.flush()

            for url in pd['images']:
                db.session.add(ProductImage(product_id=p.id, url=url))
            for ing in pd.get('ingredients', []):
                db.session.add(ProductIngredient(product_id=p.id, ingredient=ing))
            customers = [customer, customer2]
            for idx, rev in enumerate(pd.get('reviews', [])):
                reviewer = customers[idx % len(customers)]
                db.session.add(Review(
                    product_id=p.id,
                    user_id=reviewer.id,
                    name=rev['name'],
                    rating=rev['rating'],
                    comment=rev['comment'],
                ))
            seeded_products.append(p)

        db.session.flush()
        print("Products seeded.")

        # ── 4. Inventory batches ──────────────────────────────────────────
        today = date.today()
        for prod in seeded_products:
            sl = prod.shelf_life
            if 'Days' in sl:
                days = int(''.join(filter(str.isdigit, sl)))
                expiry = today + timedelta(days=days)
            elif 'Months' in sl:
                months = int(''.join(filter(str.isdigit, sl)))
                expiry = today + timedelta(days=months * 30)
            else:
                expiry = today + timedelta(days=30)

            alert_days = 5 if ('Days' in sl and int(''.join(filter(str.isdigit, sl))) <= 15) else 15

            inv = Inventory(
                product_id=prod.id,
                title=prod.title,
                stock_count=prod.stock,
                low_stock_threshold=10,
                shelf_life_alert_days=alert_days,
            )
            db.session.add(inv)
            db.session.flush()

            db.session.add(InventoryBatch(
                inventory_id=inv.id,
                batch_number=f'B-{prod.title[:3].upper()}-{today.year}',
                manufacture_date=today,
                expiry_date=expiry,
                quantity=prod.stock,
                is_expired=False,
            ))

        db.session.flush()
        print("Inventory seeded.")

        # ── 5. Sample Orders ──────────────────────────────────────────────
        p0 = seeded_products[0]
        p4 = seeded_products[4]
        p2 = seeded_products[2]

        order1 = Order(
            user_id=customer.id,
            payment_method='UPI',
            items_price=600, tax_price=30, shipping_price=50, total_price=680,
            is_paid=True,
            paid_at=datetime.utcnow() - timedelta(days=2),
            order_status='Shipped',
            tracking_number='SH10294857IN',
        )
        db.session.add(order1)
        db.session.flush()

        db.session.add(OrderShippingAddress(
            order_id=order1.id, street='45, Gandhi Nagar Road',
            city='Adyar', state='Tamil Nadu', postal_code='600020', country='India',
        ))
        db.session.add(OrderItem(
            order_id=order1.id, product_id=p0.id, title=p0.title,
            quantity=2, price=p0.discount_price or p0.price,
            images=json.dumps([img.url for img in p0.images]),
        ))
        db.session.add(OrderItem(
            order_id=order1.id, product_id=p4.id, title=p4.title,
            quantity=1, price=p4.discount_price or p4.price,
            images=json.dumps([img.url for img in p4.images]),
        ))
        db.session.add(OrderStatusTimeline(
            order_id=order1.id, status='Pending',
            description='Order placed and waiting for processing.',
        ))
        db.session.add(OrderStatusTimeline(
            order_id=order1.id, status='Shipped',
            description='Dispatched via delivery agent.',
        ))

        order2 = Order(
            user_id=customer.id,
            payment_method='COD',
            items_price=110, tax_price=5, shipping_price=50, total_price=165,
            is_paid=False, order_status='Pending',
        )
        db.session.add(order2)
        db.session.flush()

        db.session.add(OrderShippingAddress(
            order_id=order2.id, street='45, Gandhi Nagar Road',
            city='Adyar', state='Tamil Nadu', postal_code='600020', country='India',
        ))
        db.session.add(OrderItem(
            order_id=order2.id, product_id=p2.id, title=p2.title,
            quantity=1, price=p2.discount_price or p2.price,
            images=json.dumps([img.url for img in p2.images]),
        ))
        db.session.add(OrderStatusTimeline(
            order_id=order2.id, status='Pending',
            description='Order placed and waiting for processing.',
        ))

        db.session.flush()
        print("Orders seeded.")

        # ── 6. Support Ticket ─────────────────────────────────────────────
        db.session.add(SupportTicket(
            user_id=customer.id,
            name=customer.name,
            email=customer.email,
            subject='Delay in delivery for order #1',
            message='Hello, my order SH10294857IN has been in Shipped status for 2 days. Can you tell me when it will arrive?',
            status='Open',
            priority='High',
        ))
        db.session.flush()
        print("Support ticket seeded.")

        # ── 7. Subscription ───────────────────────────────────────────────
        sub = Subscription(
            user_id=customer.id,
            plan_type='Weekly',
            price=220,
            status='Active',
            delivery_day='Tuesday',
            start_date=datetime.utcnow(),
            next_delivery_date=datetime.utcnow() + timedelta(days=4),
            payment_method='UPI',
        )
        db.session.add(sub)
        db.session.flush()

        db.session.add(SubscriptionItem(
            subscription_id=sub.id,
            product_id=p2.id,
            title=p2.title,
            quantity=2,
            price=p2.discount_price if p2.discount_price > 0 else p2.price,
        ))

        db.session.commit()
        print("Subscriptions seeded.")
        print("\n[SUCCESS] Database seeding completed successfully!")
        print("\nLogin credentials:")
        print("   Admin    -> admin@sharadhastores.com  / admin123   / phone: 9876543210")
        print("   Customer -> ramesh@gmail.com          / password123 / phone: 9876543211")


if __name__ == '__main__':
    seed()
