import logging
from flask import Blueprint, request, jsonify
from models import db, Wishlist, WishlistItem, Product
from middleware.auth import protect

logger = logging.getLogger(__name__)
wishlist_bp = Blueprint('wishlist', __name__)


def _get_or_create_wishlist(user_id):
    wl = Wishlist.query.filter_by(user_id=user_id).first()
    if not wl:
        wl = Wishlist(user_id=user_id)
        db.session.add(wl)
        db.session.flush()
    return wl


# ─────────────────────────────────────────────────────────────────
# GET /api/wishlist
# ─────────────────────────────────────────────────────────────────
@wishlist_bp.route('/', methods=['GET'], strict_slashes=False)
@protect
def get_wishlist(current_user):
    wl = Wishlist.query.filter_by(user_id=current_user.id).first()
    if not wl:
        return jsonify({'_id': None, 'user': current_user.id, 'items': []})
    return jsonify(wl.to_dict())


# ─────────────────────────────────────────────────────────────────
# POST /api/wishlist  — add product to wishlist
# Body: { productId }
# ─────────────────────────────────────────────────────────────────
@wishlist_bp.route('/', methods=['POST'], strict_slashes=False)
@protect
def add_to_wishlist(current_user):
    data       = request.get_json(silent=True) or {}
    product_id = data.get('productId')

    if not product_id:
        return jsonify({'message': 'productId is required'}), 400

    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404

    wl = _get_or_create_wishlist(current_user.id)

    existing = WishlistItem.query.filter_by(wishlist_id=wl.id, product_id=product_id).first()
    if existing:
        return jsonify({'message': 'Product already in wishlist'}), 409

    db.session.add(WishlistItem(wishlist_id=wl.id, product_id=product_id))
    db.session.commit()
    db.session.refresh(wl)
    logger.info('[Wishlist] User %s added product %s', current_user.id, product_id)
    return jsonify(wl.to_dict()), 201


# ─────────────────────────────────────────────────────────────────
# DELETE /api/wishlist/:productId  — remove from wishlist
# ─────────────────────────────────────────────────────────────────
@wishlist_bp.route('/<int:product_id>', methods=['DELETE'], strict_slashes=False)
@protect
def remove_from_wishlist(product_id, current_user):
    wl = Wishlist.query.filter_by(user_id=current_user.id).first()
    if not wl:
        return jsonify({'message': 'Wishlist not found'}), 404

    item = WishlistItem.query.filter_by(wishlist_id=wl.id, product_id=product_id).first()
    if not item:
        return jsonify({'message': 'Product not in wishlist'}), 404

    db.session.delete(item)
    db.session.commit()
    db.session.refresh(wl)
    return jsonify(wl.to_dict())


# ─────────────────────────────────────────────────────────────────
# POST /api/wishlist/merge  — merge guest wishlist on login
# Body: { productIds: [id1, id2, ...] }
# ─────────────────────────────────────────────────────────────────
@wishlist_bp.route('/merge', methods=['POST'], strict_slashes=False)
@protect
def merge_wishlist(current_user):
    data        = request.get_json(silent=True) or {}
    product_ids = data.get('productIds', [])

    if not product_ids:
        return jsonify({'message': 'No products to merge'})

    wl = _get_or_create_wishlist(current_user.id)

    for pid in product_ids:
        product  = db.session.get(Product, pid)
        if not product:
            continue
        existing = WishlistItem.query.filter_by(wishlist_id=wl.id, product_id=pid).first()
        if not existing:
            db.session.add(WishlistItem(wishlist_id=wl.id, product_id=pid))

    db.session.commit()
    db.session.refresh(wl)
    logger.info('[Wishlist] Merged %d products for user %s', len(product_ids), current_user.id)
    return jsonify(wl.to_dict())
