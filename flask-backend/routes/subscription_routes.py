import logging
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from models import db, Subscription, SubscriptionItem, Product
from middleware.auth import protect, admin_required

logger = logging.getLogger(__name__)
subscription_bp = Blueprint('subscriptions', __name__)


# ─────────────────────────────────────────────────────────────────
# Helper: calculate next delivery date
# ─────────────────────────────────────────────────────────────────
def calculate_next_delivery(delivery_day, plan_type):
    now = datetime.utcnow()
    if plan_type == 'Weekly':
        days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        if delivery_day in days:
            if delivery_day == 'Sunday':
                diff = (6 - now.weekday() + 1) % 7 or 7
            else:
                target = days.index(delivery_day)
                diff = (target - 1 - now.weekday()) % 7 or 7
            return now + timedelta(days=diff)
        return now + timedelta(weeks=1)
    elif plan_type in ('Monthly', 'Festival_Combo'):
        return now + timedelta(days=30)
    return now + timedelta(weeks=1)


# ─────────────────────────────────────────────────────────────────
# POST /api/subscriptions   — create a new subscription
# strict_slashes=False: accepts both /api/subscriptions and
#   /api/subscriptions/ so fetch() never hits a 308 redirect
# ─────────────────────────────────────────────────────────────────
@subscription_bp.route('/', methods=['POST'], strict_slashes=False)
@protect
def create_subscription(current_user):
    logger.info('[Subscription] POST create — user_id=%s', current_user.id)

    data = request.get_json(silent=True)
    if not data:
        logger.error('[Subscription] No JSON body received')
        return jsonify({'message': 'Request body must be JSON'}), 400

    items        = data.get('items', [])
    plan_type    = data.get('planType', 'Weekly')
    delivery_day = (data.get('deliveryDay') or '').strip()
    payment_method = data.get('paymentMethod', 'UPI')

    logger.info('[Subscription] planType=%s  deliveryDay=%r  items=%d  payment=%s',
                plan_type, delivery_day, len(items), payment_method)

    if not items:
        return jsonify({'message': 'Please add at least one item to your subscription.'}), 400

    # Validate planType
    valid_plan_types = ('Weekly', 'Monthly', 'Festival_Combo')
    if plan_type not in valid_plan_types:
        return jsonify({'message': f'Invalid plan type. Choose from: {", ".join(valid_plan_types)}'}), 400

    # For non-weekly plans a delivery day is not required
    if plan_type != 'Weekly' or not delivery_day:
        delivery_day = delivery_day or 'Monthly'

    # ── Build item list ──────────────────────────────────────────
    total_price = 0.0
    sub_items   = []
    for idx, item in enumerate(items):
        raw_id  = item.get('product')
        product = None
        try:
            product = db.session.get(Product, int(raw_id))
        except (TypeError, ValueError):
            pass  # non-integer ID — use fallback

        if product:
            item_price = (float(product.discount_price)
                          if product.discount_price and product.discount_price > 0
                          else float(product.price))
            item_title = product.title
        else:
            # Fallback: use client-supplied price (already discounted)
            raw_price = item.get('price', 0)
            try:
                item_price = float(raw_price)
            except (TypeError, ValueError):
                item_price = 0.0
            item_title = item.get('title', f'Item {idx + 1}')

        try:
            qty = max(1, int(item.get('quantity', 1)))
        except (TypeError, ValueError):
            qty = 1

        if item_price <= 0:
            logger.warning('[Subscription] Item "%s" has price=%.2f — skipping', item_title, item_price)
            continue

        total_price += item_price * qty
        sub_items.append({
            'product_id': product.id if product else None,
            'title':      item_title,
            'quantity':   qty,
            'price':      item_price,
        })
        logger.info('[Subscription]   item[%d]: "%s" x%d @ %.2f', idx, item_title, qty, item_price)

    if not sub_items:
        return jsonify({'message': 'None of the selected items had a valid price. Please refresh and try again.'}), 400

    # ── Prevent duplicate active subscriptions ───────────────────
    existing = Subscription.query.filter_by(
        user_id=current_user.id,
        plan_type=plan_type,
        status='Active',
    ).first()
    if existing:
        return jsonify({
            'message': f'You already have an active {plan_type} subscription. '
                       'Please pause or cancel it before creating a new one.'
        }), 409

    next_delivery = calculate_next_delivery(delivery_day, plan_type)
    logger.info('[Subscription] nextDelivery=%s  total=%.2f', next_delivery.date(), total_price)

    try:
        subscription = Subscription(
            user_id=current_user.id,
            plan_type=plan_type,
            price=round(total_price, 2),
            delivery_day=delivery_day,
            next_delivery_date=next_delivery,
            payment_method=payment_method,
        )
        db.session.add(subscription)
        db.session.flush()  # get subscription.id

        for si in sub_items:
            db.session.add(SubscriptionItem(
                subscription_id=subscription.id,
                product_id=si['product_id'],
                title=si['title'],
                quantity=si['quantity'],
                price=si['price'],
            ))

        db.session.commit()
        logger.info('[Subscription] Created subscription id=%s for user_id=%s', subscription.id, current_user.id)
        return jsonify(subscription.to_dict()), 201

    except Exception as exc:
        db.session.rollback()
        logger.exception('[Subscription] DB error during create: %s', exc)
        return jsonify({'message': f'Database error: {str(exc)}'}), 500


# ─────────────────────────────────────────────────────────────────
# GET /api/subscriptions/mysubscriptions  — user's own subscriptions
# ─────────────────────────────────────────────────────────────────
@subscription_bp.route('/mysubscriptions', methods=['GET'], strict_slashes=False)
@protect
def my_subscriptions(current_user):
    subs = (Subscription.query
            .filter_by(user_id=current_user.id)
            .order_by(Subscription.created_at.desc())
            .all())
    logger.info('[Subscription] GET mysubscriptions — user_id=%s  count=%d', current_user.id, len(subs))
    return jsonify([s.to_dict() for s in subs])


# ─────────────────────────────────────────────────────────────────
# GET /api/subscriptions  — admin: all subscriptions
# ─────────────────────────────────────────────────────────────────
@subscription_bp.route('/', methods=['GET'], strict_slashes=False)
@admin_required
def get_subscriptions(current_user):
    subs = Subscription.query.order_by(Subscription.created_at.desc()).all()
    result = []
    for s in subs:
        sd = s.to_dict()
        sd['user'] = (
            {'_id': s.user.id, 'name': s.user.name, 'email': s.user.email}
            if s.user else None
        )
        result.append(sd)
    return jsonify(result)


# ─────────────────────────────────────────────────────────────────
# PUT /api/subscriptions/<id>/status  — pause / resume / cancel
# ─────────────────────────────────────────────────────────────────
@subscription_bp.route('/<int:sub_id>/status', methods=['PUT'], strict_slashes=False)
@protect
def update_status(sub_id, current_user):
    subscription = db.session.get(Subscription, sub_id)
    if not subscription:
        return jsonify({'message': 'Subscription not found'}), 404
    if subscription.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'message': 'Not authorized to modify this subscription'}), 403

    data       = request.get_json(silent=True) or {}
    new_status = data.get('status', subscription.status)

    valid_statuses = ('Active', 'Paused', 'Cancelled')
    if new_status not in valid_statuses:
        return jsonify({'message': f'Invalid status. Choose from: {", ".join(valid_statuses)}'}), 400

    subscription.status = new_status

    if new_status == 'Active':
        subscription.next_delivery_date = calculate_next_delivery(
            subscription.delivery_day, subscription.plan_type
        )

    db.session.commit()
    logger.info('[Subscription] id=%s status → %s by user_id=%s', sub_id, new_status, current_user.id)
    return jsonify(subscription.to_dict())
