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
        db.session.add_all([admin, customer])
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
        products_raw = [
            {
                'title': 'Fresh Honey Drizzle Waffles',
                'description': 'Deliciously crispy on the outside, fluffy on the inside. Baked fresh to order and served with a generous drizzle of organic raw honey and fresh forest berries.',
                'ingredients': ['Wheat Flour', 'Fresh Berries', 'Organic Honey', 'Butter'],
                'shelf_life': '15 Days',
                'images': ['https://images.unsplash.com/photo-1506084868230-bb9d95c24759?q=90&w=800&auto=format&fit=crop'],
                'category': 'Sweets',
                'price': 250, 'discount_price': 220, 'stock': 50,
                'is_featured': True, 'is_best_seller': True, 'is_trending': False,
                'rating': 4.8, 'num_reviews': 2,
                'reviews': [
                    {'name': 'Suresh Iyer', 'rating': 5.0, 'comment': "Absolutely delicious waffles! So light and fluffy, and the honey is top notch."},
                    {'name': 'Meena K.', 'rating': 4.6, 'comment': 'Very tasty, not overly sweet. The waffle texture is exceptional.'},
                ],
            },
            {
                'title': 'Homemade Glazed Donuts',
                'description': 'Melt-in-the-mouth soft glazed donuts, hand-dipped in premium cane sugar glaze and baked fresh in our home kitchen daily.',
                'ingredients': ['Wheat Flour', 'Yeast', 'Cane Sugar', 'Butter'],
                'shelf_life': '30 Days',
                'images': ['https://images.unsplash.com/photo-1551024601-bec78aea704b?q=90&w=800&auto=format&fit=crop'],
                'category': 'Sweets',
                'price': 200, 'discount_price': 0, 'stock': 40,
                'is_featured': True, 'is_best_seller': False, 'is_trending': True,
                'rating': 4.5, 'num_reviews': 8,
            },
            {
                'title': 'Handmade Crispy Potato Samosas',
                'description': 'Golden, flaky pastry pockets stuffed with a spiced potato and green peas mash, fried to perfection in cold-pressed oil.',
                'ingredients': ['Potato', 'Green Peas', 'Wheat Flour', 'Spices', 'Cold-Pressed Oil'],
                'shelf_life': '45 Days',
                'images': ['https://images.unsplash.com/photo-1626132647523-66f5bf380027?q=90&w=800&auto=format&fit=crop'],
                'category': 'Snacks',
                'price': 120, 'discount_price': 110, 'stock': 80,
                'is_featured': False, 'is_best_seller': True, 'is_trending': True,
                'rating': 4.9, 'num_reviews': 24,
            },
            {
                'title': 'Butter Murukku (Manoharam)',
                'description': 'A lighter, melt-in-the-mouth snack flavored with cumin seeds and a heavy hand of farm-fresh butter. Kids and elderly favorites alike.',
                'ingredients': ['Rice Flour', 'Gram Flour', 'Cumin Seeds', 'Butter', 'Asafoetida', 'Oil', 'Salt'],
                'shelf_life': '45 Days',
                'images': ['https://images.unsplash.com/photo-1541518763669-27fef04b14ea?q=90&w=800&auto=format&fit=crop'],
                'category': 'Snacks',
                'price': 130, 'discount_price': 0, 'stock': 5,  # Low stock — triggers alert
                'is_featured': True, 'is_best_seller': False, 'is_trending': False,
                'rating': 4.7, 'num_reviews': 15,
            },
            {
                'title': 'Spicy Pickled Red Chilies',
                'description': 'Whole red chilies hand-pickled in premium vinegar, mustard seeds, and cold-pressed oil, providing a hot and tangy kick to any meal.',
                'ingredients': ['Red Chilies', 'Mustard Seeds', 'Vinegar', 'Cold-Pressed Oil', 'Salt'],
                'shelf_life': '12 Months',
                'images': ['https://images.unsplash.com/photo-1590779033100-9f60a05a013d?q=90&w=800&auto=format&fit=crop'],
                'category': 'Pickles',
                'price': 180, 'discount_price': 160, 'stock': 60,
                'is_featured': True, 'is_best_seller': True, 'is_trending': False,
                'rating': 5.0, 'num_reviews': 32,
            },
            {
                'title': 'Aged Pickled Mixed Vegetables',
                'description': 'A rustic jar of assorted seasonal vegetables preserved in a brine of local spices, vinegar, and natural sea salt.',
                'ingredients': ['Carrots', 'Cucumber', 'Cauliflower', 'Vinegar', 'Spices', 'Salt'],
                'shelf_life': '12 Months',
                'images': ['https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=90&w=800&auto=format&fit=crop'],
                'category': 'Pickles',
                'price': 150, 'discount_price': 0, 'stock': 35,
                'is_featured': False, 'is_best_seller': False, 'is_trending': True,
                'rating': 4.4, 'num_reviews': 9,
            },
            {
                'title': "Grandma's Sambar Powder",
                'description': 'A secret ancestral recipe. 15 spice ingredients including coriander seeds, red chilies, black pepper, and lentils dry-roasted individually to perfect temperatures and milled together.',
                'ingredients': ['Coriander Seeds', 'Dry Red Chili', 'Bengal Gram', 'Toor Dal', 'Fenugreek', 'Black Pepper', 'Cumin', 'Turmeric'],
                'shelf_life': '6 Months',
                'images': ['https://images.unsplash.com/photo-1532336414038-cf19250c5757?q=90&w=800&auto=format&fit=crop'],
                'category': 'Spice Powders',
                'price': 140, 'discount_price': 125, 'stock': 70,
                'is_featured': True, 'is_best_seller': True, 'is_trending': True,
                'rating': 4.8, 'num_reviews': 18,
            },
            {
                'title': 'Spicy Curry Leaf Gunpowder',
                'description': 'Perfect side kick for hot idli, dosa, or mixed with steamed rice and ghee. Packed with nutrients from fresh local curry leaves, roasted dals, and dry chilies.',
                'ingredients': ['Curry Leaves', 'Urad Dal', 'Chana Dal', 'Sesame Seeds', 'Red Chili', 'Tamarind', 'Asafoetida', 'Salt'],
                'shelf_life': '6 Months',
                'images': ['https://images.unsplash.com/photo-1509358271058-acd22cc93898?q=90&w=800&auto=format&fit=crop'],
                'category': 'Spice Powders',
                'price': 110, 'discount_price': 0, 'stock': 50,
                'is_featured': False, 'is_best_seller': False, 'is_trending': False,
                'rating': 4.6, 'num_reviews': 11,
            },
            {
                'title': 'Family Feast Special Combo Platter',
                'description': "A grand curation of our best home kitchen specialties. Contains fresh honey waffles, glazed donuts, crispy samosas, and dipping sauces. Perfect for family gatherings!",
                'ingredients': ['Waffles', 'Donuts', 'Samosas', 'Dips'],
                'shelf_life': '30 Days',
                'images': ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=90&w=800&auto=format&fit=crop'],
                'category': 'Sweets',
                'price': 650, 'discount_price': 550, 'stock': 25,
                'is_featured': True, 'is_best_seller': True, 'is_trending': True, 'is_combo': True,
                'rating': 4.9, 'num_reviews': 40,
            },
        ]

        seeded_products = []
        for pd in products_raw:
            p = Product(
                user_id=admin.id,
                title=pd['title'],
                description=pd['description'],
                shelf_life=pd['shelf_life'],
                category=pd['category'],
                price=pd['price'],
                discount_price=pd.get('discount_price', 0),
                stock=pd['stock'],
                is_featured=pd.get('is_featured', False),
                is_best_seller=pd.get('is_best_seller', False),
                is_trending=pd.get('is_trending', False),
                is_combo=pd.get('is_combo', False),
                rating=pd.get('rating', 0.0),
                num_reviews=pd.get('num_reviews', 0),
            )
            db.session.add(p)
            db.session.flush()

            for url in pd['images']:
                db.session.add(ProductImage(product_id=p.id, url=url))
            for ing in pd.get('ingredients', []):
                db.session.add(ProductIngredient(product_id=p.id, ingredient=ing))
            for rev in pd.get('reviews', []):
                db.session.add(Review(
                    product_id=p.id,
                    user_id=customer.id,
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
