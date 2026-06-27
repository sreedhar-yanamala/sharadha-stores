from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from models import db, Product, ProductImage, ProductIngredient, Review, Order
from middleware.auth import protect, admin_required

product_bp = Blueprint('products', __name__)


# GET /api/products
@product_bp.route('/', methods=['GET'])
def get_products():
    page_size = int(request.args.get('pageSize', 8))
    page = int(request.args.get('page', 1))
    keyword = request.args.get('keyword', '')
    category = request.args.get('category', '')
    min_price = request.args.get('minPrice')
    max_price = request.args.get('maxPrice')
    sort = request.args.get('sort', '')
    is_combo = request.args.get('isCombo')
    is_best_seller = request.args.get('isBestSeller')
    is_trending = request.args.get('isTrending')
    is_featured = request.args.get('isFeatured')

    query = Product.query

    if keyword:
        query = query.filter(
            or_(
                Product.title.ilike(f'%{keyword}%'),
                Product.description.ilike(f'%{keyword}%'),
                Product.category.ilike(f'%{keyword}%'),
            )
        )
    if category:
        query = query.filter(Product.category.ilike(category))
    if min_price:
        query = query.filter(Product.price >= float(min_price))
    if max_price:
        query = query.filter(Product.price <= float(max_price))
    if is_combo == 'true':
        query = query.filter(Product.is_combo == True)
    if is_best_seller == 'true':
        query = query.filter(Product.is_best_seller == True)
    if is_trending == 'true':
        query = query.filter(Product.is_trending == True)
    if is_featured == 'true':
        query = query.filter(Product.is_featured == True)

    if sort == 'priceAsc':
        query = query.order_by(Product.price.asc())
    elif sort == 'priceDesc':
        query = query.order_by(Product.price.desc())
    elif sort == 'ratingDesc':
        query = query.order_by(Product.rating.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    total = query.count()
    products = query.offset(page_size * (page - 1)).limit(page_size).all()

    return jsonify({
        'products': [p.to_dict() for p in products],
        'page': page,
        'pages': -(-total // page_size),  # ceiling division
        'total': total,
    })


# GET /api/products/recommendations/personalized
@product_bp.route('/recommendations/personalized', methods=['GET'])
@protect
def get_personalized(current_user):
    user_orders = Order.query.filter_by(user_id=current_user.id).all()
    category_prefs = set()
    for order in user_orders:
        for item in order.order_items:
            if item.product_id:
                p = db.session.get(Product, item.product_id)
                if p:
                    category_prefs.add(p.category)

    recommended = []
    if category_prefs:
        recommended = Product.query.filter(
            Product.category.in_(list(category_prefs)),
            Product.is_featured == True
        ).limit(4).all()

    if len(recommended) < 4:
        extra_ids = [r.id for r in recommended]
        extra = Product.query.filter(~Product.id.in_(extra_ids)).limit(4 - len(recommended)).all()
        recommended = recommended + extra

    return jsonify([p.to_dict() for p in recommended])


# GET /api/products/recommendations/similar/:id
@product_bp.route('/recommendations/similar/<int:product_id>', methods=['GET'])
def get_similar(product_id):
    product = Product.query.get_or_404(product_id)
    similar = Product.query.filter(
        Product.id != product_id,
        Product.category == product.category
    ).limit(4).all()
    return jsonify([p.to_dict() for p in similar])


# GET /api/products/recommendations/frequently-bought-together/:id
@product_bp.route('/recommendations/frequently-bought-together/<int:product_id>', methods=['GET'])
def get_frequently_bought_together(product_id):
    from models import OrderItem
    # Find orders containing this product
    orders_with_product = (
        Order.query
        .join(Order.order_items)
        .filter(OrderItem.product_id == product_id)
        .limit(20)
        .all()
    )

    counts = {}
    for order in orders_with_product:
        for item in order.order_items:
            if item.product_id and item.product_id != product_id:
                counts[item.product_id] = counts.get(item.product_id, 0) + 1

    sorted_ids = sorted(counts, key=lambda x: counts[x], reverse=True)

    recommended = []
    if sorted_ids:
        recommended = Product.query.filter(Product.id.in_(sorted_ids[:3])).all()

    if len(recommended) < 3:
        current = db.session.get(Product, product_id)
        extra_ids = [r.id for r in recommended] + [product_id]
        extra = Product.query.filter(
            ~Product.id.in_(extra_ids),
            Product.category == (current.category if current else 'Sweets')
        ).limit(3 - len(recommended)).all()
        recommended = recommended + extra

    return jsonify([p.to_dict() for p in recommended])


# GET /api/products/:id
@product_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    return jsonify(product.to_dict())


# POST /api/products
@product_bp.route('/', methods=['POST'])
@admin_required
def create_product(current_user):
    data = request.get_json()
    product = Product(
        user_id=current_user.id,
        title=data.get('title'),
        description=data.get('description'),
        shelf_life=data.get('shelfLife', '30 Days'),
        weight=data.get('weight', ''),
        category=data.get('category'),
        price=float(data.get('price', 0)),
        discount_price=float(data.get('discountPrice', 0)),
        stock=int(data.get('stock', 0)),
    )
    db.session.add(product)
    db.session.flush()  # get product.id

    for url in (data.get('images') or ['/images/placeholder.jpg']):
        db.session.add(ProductImage(product_id=product.id, url=url))
    for ing in (data.get('ingredients') or []):
        db.session.add(ProductIngredient(product_id=product.id, ingredient=ing))

    db.session.commit()
    return jsonify(product.to_dict()), 201


# PUT /api/products/:id
@product_bp.route('/<int:product_id>', methods=['PUT'])
@admin_required
def update_product(product_id, current_user):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404

    data = request.get_json()
    product.title = data.get('title', product.title)
    product.price = data['price'] if 'price' in data else product.price
    product.discount_price = data['discountPrice'] if 'discountPrice' in data else product.discount_price
    product.description = data.get('description', product.description)
    product.category = data.get('category', product.category)
    product.weight = data.get('weight', product.weight)
    product.stock = data['stock'] if 'stock' in data else product.stock
    product.shelf_life = data.get('shelfLife', product.shelf_life)
    product.is_featured = data['isFeatured'] if 'isFeatured' in data else product.is_featured
    product.is_best_seller = data['isBestSeller'] if 'isBestSeller' in data else product.is_best_seller
    product.is_trending = data['isTrending'] if 'isTrending' in data else product.is_trending
    product.is_combo = data['isCombo'] if 'isCombo' in data else product.is_combo

    if 'images' in data:
        ProductImage.query.filter_by(product_id=product.id).delete()
        for url in data['images']:
            db.session.add(ProductImage(product_id=product.id, url=url))
    if 'ingredients' in data:
        ProductIngredient.query.filter_by(product_id=product.id).delete()
        for ing in data['ingredients']:
            db.session.add(ProductIngredient(product_id=product.id, ingredient=ing))

    db.session.commit()
    return jsonify(product.to_dict())


# DELETE /api/products/:id
@product_bp.route('/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id, current_user):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product removed'})


# POST /api/products/:id/reviews
@product_bp.route('/<int:product_id>/reviews', methods=['POST'])
@protect
def create_review(product_id, current_user):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404

    already = Review.query.filter_by(product_id=product_id, user_id=current_user.id).first()
    if already:
        return jsonify({'message': 'Product already reviewed'}), 400

    data = request.get_json()
    review = Review(
        product_id=product_id,
        user_id=current_user.id,
        name=current_user.name,
        rating=float(data.get('rating', 0)),
        comment=data.get('comment', ''),
    )
    db.session.add(review)
    db.session.flush()

    # Recalculate aggregate
    all_reviews = Review.query.filter_by(product_id=product_id).all()
    product.num_reviews = len(all_reviews)
    product.rating = sum(r.rating for r in all_reviews) / len(all_reviews)

    db.session.commit()
    return jsonify({'message': 'Review added successfully'}), 201
