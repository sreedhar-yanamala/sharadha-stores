"""
seed_chips.py — Adds Chips products to the existing database.
Run: python seed_chips.py
"""
from app import create_app
from models import db, Product, ProductImage, ProductIngredient, User

CHIPS_PRODUCTS = [
    {
        'title': 'Banana Chips',
        'description': 'Fresh crispy banana chips made from premium bananas. Traditional Kerala-style, fried in pure coconut oil with a light sprinkling of rock salt. 100g pack.',
        'ingredients': ['Raw Green Banana', 'Coconut Oil', 'Rock Salt', 'Turmeric'],
        'shelf_life': '60 Days',
        'weight': '100g',
        'images': ['/images/chips-banana.jpg'],
        'category': 'Chips',
        'price': 90, 'discount_price': 80, 'stock': 150,
        'is_featured': True, 'is_best_seller': True, 'is_trending': True,
        'rating': 4.9, 'num_reviews': 56,
    },
    {
        'title': 'Jack Fruit Chips',
        'description': 'Traditional homemade jackfruit chips. Made from tender raw jackfruit, thinly sliced and fried to golden perfection in fresh coconut oil. A South Indian household staple. 100g pack.',
        'ingredients': ['Raw Jackfruit', 'Coconut Oil', 'Rock Salt', 'Turmeric'],
        'shelf_life': '45 Days',
        'weight': '100g',
        'images': ['/images/chips-jackfruit.jpg'],
        'category': 'Chips',
        'price': 110, 'discount_price': 95, 'stock': 80,
        'is_featured': True, 'is_best_seller': False, 'is_trending': True,
        'rating': 4.7, 'num_reviews': 28,
    },
    {
        'title': 'Potato Chips (Salted)',
        'description': 'Crispy homemade salted potato chips. Light, crispy, and perfectly seasoned with pure rock salt. Fried fresh in cold-pressed sunflower oil for a clean, natural taste. 100g pack.',
        'ingredients': ['Potato', 'Cold-Pressed Sunflower Oil', 'Rock Salt'],
        'shelf_life': '60 Days',
        'weight': '100g',
        'images': ['/images/chips-potato-salted.jpg'],
        'category': 'Chips',
        'price': 70, 'discount_price': 0, 'stock': 120,
        'is_featured': True, 'is_best_seller': True, 'is_trending': False,
        'rating': 4.6, 'num_reviews': 35,
    },
    {
        'title': 'Spicy Potato Chips',
        'description': 'Spicy homemade potato chips with authentic Indian flavors. Hand-sliced and fried in fresh cold-pressed oil with bold masala seasoning — crispy, fiery, and irresistible. 100g pack.',
        'ingredients': ['Potato', 'Cold-Pressed Oil', 'Red Chili Powder', 'Rock Salt', 'Spices'],
        'shelf_life': '60 Days',
        'weight': '100g',
        'images': ['/images/chips-potato-spicy.jpg'],
        'category': 'Chips',
        'price': 80, 'discount_price': 70, 'stock': 100,
        'is_featured': True, 'is_best_seller': True, 'is_trending': True,
        'rating': 4.8, 'num_reviews': 42,
    },
]


def seed_chips():
    app = create_app()
    with app.app_context():
        admin = User.query.filter_by(role='admin').first()
        if not admin:
            print("[ERROR] No admin user found. Run seeder.py first.")
            return

        # Remove existing Chips products first to avoid duplicates
        existing = Product.query.filter_by(category='Chips').all()
        for ep in existing:
            ProductImage.query.filter_by(product_id=ep.id).delete()
            ProductIngredient.query.filter_by(product_id=ep.id).delete()
            db.session.delete(ep)
        db.session.flush()
        print(f"Removed {len(existing)} existing Chips products.")

        for pd in CHIPS_PRODUCTS:
            p = Product(
                user_id=admin.id,
                title=pd['title'],
                description=pd['description'],
                shelf_life=pd['shelf_life'],
                weight=pd.get('weight', ''),
                category=pd['category'],
                price=pd['price'],
                discount_price=pd.get('discount_price', 0),
                stock=pd['stock'],
                is_featured=pd.get('is_featured', False),
                is_best_seller=pd.get('is_best_seller', False),
                is_trending=pd.get('is_trending', False),
                is_combo=False,
                rating=pd.get('rating', 0.0),
                num_reviews=pd.get('num_reviews', 0),
            )
            db.session.add(p)
            db.session.flush()

            for url in pd['images']:
                db.session.add(ProductImage(product_id=p.id, url=url))
            for ing in pd.get('ingredients', []):
                db.session.add(ProductIngredient(product_id=p.id, ingredient=ing))

            print(f"  + Added: {pd['title']}")

        db.session.commit()
        print("\n[SUCCESS] Chips products seeded successfully!")
        print("Image paths used (save your images to frontend/public/images/):")
        for pd in CHIPS_PRODUCTS:
            print(f"  {pd['images'][0]}  ->  {pd['title']}")

if __name__ == '__main__':
    seed_chips()
