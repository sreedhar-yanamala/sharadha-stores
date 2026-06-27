import logging
from flask import Blueprint, request, jsonify
from models import db, Cart, CartItem, Product
from middleware.auth import protect

logger = logging.getLogger(__name__)
cart_bp = Blueprint('cart', __name__)


def _get_or_create_cart(user_id):
    """Get existing cart or create a new one for the user."""
    cart = Cart.query.filter_by(user_id=user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.session.add(cart)
        db.session.flush()
    return cart


# ─────────────────────────────────────────────────────────────────
# GET /api/cart  — get logged-in user's cart
# ─────────────────────────────────────────────────────────────────
@cart_bp.route('/', methods=['GET'], strict_slashes=False)
@protect
def get_cart(current_user):
    cart = Cart.query.filter_by(user_id=current_user.id).first()
    if not cart:
        return jsonify({'_id': None, 'user': current_user.id, 'items': []})
    return jsonify(cart.to_dict())


# ─────────────────────────────────────────────────────────────────
# POST /api/cart  — add or update item in cart
# Body: { productId, quantity }
# ─────────────────────────────────────────────────────────────────
@cart_bp.route('/', methods=['POST'], strict_slashes=False)
@protect
def add_to_cart(current_user):
    data = request.get_json(silent=True) or {}
    product_id = data.get('productId')
    quantity   = int(data.get('quantity', 1))

    if not product_id:
        return jsonify({'message': 'productId is required'}), 400
    if quantity < 1:
        return jsonify({'message': 'quantity must be at least 1'}), 400

    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    if product.stock < quantity:
        return jsonify({'message': f'Only {product.stock} items in stock'}), 400

    cart = _get_or_create_cart(current_user.id)

    existing = CartItem.query.filter_by(cart_id=cart.id, product_id=product_id).first()
    if existing:
        new_qty = existing.quantity + quantity
        if new_qty > product.stock:
            return jsonify({'message': f'Only {product.stock} items in stock. Cart already has {existing.quantity}.'}), 400
        existing.quantity = new_qty
    else:
        item = CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity)
        db.session.add(item)

    db.session.commit()
    logger.info('[Cart] User %s added product %s (qty=%s)', current_user.id, product_id, quantity)
    # Refresh cart
    db.session.refresh(cart)
    return jsonify(cart.to_dict()), 201


# ─────────────────────────────────────────────────────────────────
# PUT /api/cart/:itemId  — update quantity of a cart item
# Body: { quantity }
# ─────────────────────────────────────────────────────────────────
@cart_bp.route('/<int:item_id>', methods=['PUT'], strict_slashes=False)
@protect
def update_cart_item(item_id, current_user):
    data     = request.get_json(silent=True) or {}
    quantity = int(data.get('quantity', 1))

    if quantity < 1:
        return jsonify({'message': 'quantity must be at least 1'}), 400

    item = CartItem.query.get_or_404(item_id)
    cart = db.session.get(Cart, item.cart_id)

    if not cart or cart.user_id != current_user.id:
        return jsonify({'message': 'Forbidden'}), 403

    product = db.session.get(Product, item.product_id)
    if product and quantity > product.stock:
        return jsonify({'message': f'Only {product.stock} items in stock'}), 400

    item.quantity = quantity
    db.session.commit()
    db.session.refresh(cart)
    return jsonify(cart.to_dict())


# ─────────────────────────────────────────────────────────────────
# DELETE /api/cart/:itemId  — remove a single item from cart
# ─────────────────────────────────────────────────────────────────
@cart_bp.route('/<int:item_id>', methods=['DELETE'], strict_slashes=False)
@protect
def remove_cart_item(item_id, current_user):
    item = CartItem.query.get_or_404(item_id)
    cart = db.session.get(Cart, item.cart_id)

    if not cart or cart.user_id != current_user.id:
        return jsonify({'message': 'Forbidden'}), 403

    db.session.delete(item)
    db.session.commit()
    db.session.refresh(cart)
    return jsonify(cart.to_dict())


# ─────────────────────────────────────────────────────────────────
# DELETE /api/cart  — clear entire cart
# ─────────────────────────────────────────────────────────────────
@cart_bp.route('/clear', methods=['DELETE'], strict_slashes=False)
@protect
def clear_cart(current_user):
    cart = Cart.query.filter_by(user_id=current_user.id).first()
    if cart:
        CartItem.query.filter_by(cart_id=cart.id).delete()
        db.session.commit()
    return jsonify({'message': 'Cart cleared'})


# ─────────────────────────────────────────────────────────────────
# POST /api/cart/merge  — merge guest cart (localStorage) into server
# Body: { items: [{ productId, quantity }] }
# ─────────────────────────────────────────────────────────────────
@cart_bp.route('/merge', methods=['POST'], strict_slashes=False)
@protect
def merge_cart(current_user):
    data  = request.get_json(silent=True) or {}
    items = data.get('items', [])

    if not items:
        return jsonify({'message': 'No items to merge'})

    cart = _get_or_create_cart(current_user.id)

    for entry in items:
        product_id = entry.get('productId') or entry.get('product')
        quantity   = int(entry.get('quantity', 1))
        if not product_id or quantity < 1:
            continue

        product = db.session.get(Product, product_id)
        if not product:
            continue

        existing = CartItem.query.filter_by(cart_id=cart.id, product_id=product_id).first()
        if existing:
            new_qty = min(existing.quantity + quantity, product.stock)
            existing.quantity = new_qty
        else:
            safe_qty = min(quantity, product.stock)
            if safe_qty > 0:
                db.session.add(CartItem(cart_id=cart.id, product_id=product_id, quantity=safe_qty))

    db.session.commit()
    db.session.refresh(cart)
    logger.info('[Cart] Merged guest cart for user %s — %d items', current_user.id, len(items))
    return jsonify(cart.to_dict())
