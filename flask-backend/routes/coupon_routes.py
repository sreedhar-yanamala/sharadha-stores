import logging
from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Coupon
from middleware.auth import protect, admin_required

logger = logging.getLogger(__name__)
coupon_bp = Blueprint('coupons', __name__)


# ─────────────────────────────────────────────────────────────────
# POST /api/coupons/validate  — validate a coupon code (public)
# Body: { code, orderTotal }
# ─────────────────────────────────────────────────────────────────
@coupon_bp.route('/validate', methods=['POST'], strict_slashes=False)
def validate_coupon():
    data        = request.get_json(silent=True) or {}
    code        = (data.get('code') or '').strip().upper()
    order_total = float(data.get('orderTotal', 0))

    if not code:
        return jsonify({'valid': False, 'message': 'Coupon code is required'}), 400

    coupon = Coupon.query.filter_by(code=code, is_active=True).first()

    if not coupon:
        return jsonify({'valid': False, 'message': 'Invalid or inactive coupon code'}), 404

    # Check expiry
    if coupon.expires_at and coupon.expires_at < datetime.utcnow():
        return jsonify({'valid': False, 'message': 'This coupon has expired'}), 400

    # Check max uses
    if coupon.max_uses is not None and coupon.current_uses >= coupon.max_uses:
        return jsonify({'valid': False, 'message': 'This coupon has reached its usage limit'}), 400

    # Check minimum order amount
    if order_total < coupon.min_order_amount:
        return jsonify({
            'valid': False,
            'message': f'Minimum order of ₹{coupon.min_order_amount:.0f} required for this coupon',
        }), 400

    # Calculate discount
    if coupon.discount_type == 'percentage':
        discount_amount = round(order_total * (coupon.discount_value / 100), 2)
    else:  # fixed
        discount_amount = min(coupon.discount_value, order_total)

    return jsonify({
        'valid':          True,
        'code':           coupon.code,
        'discountType':   coupon.discount_type,
        'discountValue':  coupon.discount_value,
        'discountAmount': discount_amount,
        'message':        f'Coupon applied! You save ₹{discount_amount:.2f}',
    })


# ─────────────────────────────────────────────────────────────────
# GET /api/coupons  — list all coupons (admin)
# ─────────────────────────────────────────────────────────────────
@coupon_bp.route('/', methods=['GET'], strict_slashes=False)
@admin_required
def get_coupons(current_user):
    coupons = Coupon.query.order_by(Coupon.created_at.desc()).all()
    return jsonify([c.to_dict() for c in coupons])


# ─────────────────────────────────────────────────────────────────
# POST /api/coupons  — create a new coupon (admin)
# ─────────────────────────────────────────────────────────────────
@coupon_bp.route('/', methods=['POST'], strict_slashes=False)
@admin_required
def create_coupon(current_user):
    data = request.get_json(silent=True) or {}
    code = (data.get('code') or '').strip().upper()

    if not code:
        return jsonify({'message': 'code is required'}), 400
    if Coupon.query.filter_by(code=code).first():
        return jsonify({'message': f'Coupon code "{code}" already exists'}), 409

    expires_at_raw = data.get('expiresAt')
    expires_at     = None
    if expires_at_raw:
        try:
            expires_at = datetime.fromisoformat(expires_at_raw.replace('Z', '+00:00'))
        except Exception:
            return jsonify({'message': 'Invalid expiresAt format (use ISO 8601)'}), 400

    coupon = Coupon(
        code             = code,
        discount_type    = data.get('discountType', 'percentage'),
        discount_value   = float(data.get('discountValue', 0)),
        min_order_amount = float(data.get('minOrderAmount', 0)),
        max_uses         = data.get('maxUses'),
        is_active        = data.get('isActive', True),
        expires_at       = expires_at,
    )
    db.session.add(coupon)
    db.session.commit()
    logger.info('[Coupon] Created "%s" by admin %s', code, current_user.id)
    return jsonify(coupon.to_dict()), 201


# ─────────────────────────────────────────────────────────────────
# PATCH /api/coupons/:id  — update coupon (admin)
# ─────────────────────────────────────────────────────────────────
@coupon_bp.route('/<int:coupon_id>', methods=['PATCH'], strict_slashes=False)
@admin_required
def update_coupon(coupon_id, current_user):
    coupon = db.session.get(Coupon, coupon_id)
    if not coupon:
        return jsonify({'message': 'Coupon not found'}), 404

    data = request.get_json(silent=True) or {}
    if 'isActive'       in data: coupon.is_active        = bool(data['isActive'])
    if 'discountValue'  in data: coupon.discount_value   = float(data['discountValue'])
    if 'maxUses'        in data: coupon.max_uses         = data['maxUses']
    if 'minOrderAmount' in data: coupon.min_order_amount = float(data['minOrderAmount'])

    db.session.commit()
    return jsonify(coupon.to_dict())


# ─────────────────────────────────────────────────────────────────
# DELETE /api/coupons/:id  — delete coupon (admin)
# ─────────────────────────────────────────────────────────────────
@coupon_bp.route('/<int:coupon_id>', methods=['DELETE'], strict_slashes=False)
@admin_required
def delete_coupon(coupon_id, current_user):
    coupon = db.session.get(Coupon, coupon_id)
    if not coupon:
        return jsonify({'message': 'Coupon not found'}), 404

    db.session.delete(coupon)
    db.session.commit()
    logger.info('[Coupon] Deleted "%s" by admin %s', coupon.code, current_user.id)
    return jsonify({'message': f'Coupon "{coupon.code}" deleted'})
