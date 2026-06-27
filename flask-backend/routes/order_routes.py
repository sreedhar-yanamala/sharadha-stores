import json
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify
from models import (
    db, Order, OrderItem, OrderShippingAddress, OrderStatusTimeline,
    Product, User, Subscription, SupportTicket
)
from middleware.auth import protect, admin_required
from email_service import send_order_confirmation_email

logger = logging.getLogger(__name__)

order_bp = Blueprint('orders', __name__)


STATUS_MAP = {
    'Confirmed':   'Order confirmed and awaiting processing.',
    'Processing':  'Order is being prepared.',
    'Packed':      'Traditional foods packed fresh from kitchen.',
    'Shipped':     'Dispatched via delivery agent.',
    'Delivered':   'Order delivered to your doorstep.',
    'Cancelled':   'Order cancelled by customer.',
}


# POST /api/orders/
@order_bp.route('/', methods=['POST'], strict_slashes=False)
@protect
def add_order(current_user):
    try:
        data = request.get_json(silent=True) or {}
        order_items = data.get('orderItems', [])
        shipping = data.get('shippingAddress', {})
        payment_method = data.get('paymentMethod', 'COD')

        if not order_items:
            return jsonify({'message': 'No order items provided'}), 400

        def safe_float(val, default=0.0):
            try: return float(val)
            except (TypeError, ValueError): return default

        def safe_int(val, default=1):
            try: return max(1, int(val))
            except (TypeError, ValueError): return default

        order = Order(
            user_id=current_user.id,
            payment_method=payment_method,
            items_price=safe_float(data.get('itemsPrice')),
            tax_price=safe_float(data.get('taxPrice')),
            shipping_price=safe_float(data.get('shippingPrice')),
            total_price=safe_float(data.get('totalPrice')),
            is_paid=payment_method not in ('COD', 'cod'),
            paid_at=datetime.utcnow() if payment_method not in ('COD', 'cod') else None,
            order_status='Confirmed',
        )
        db.session.add(order)
        db.session.flush()  # get order.id

        # Shipping address
        db.session.add(OrderShippingAddress(
            order_id=order.id,
            street=str(shipping.get('street', '')),
            city=str(shipping.get('city', '')),
            state=str(shipping.get('state', '')),
            postal_code=str(shipping.get('postalCode', '')),
            country=str(shipping.get('country', 'India')),
        ))

        # Status timeline — initial entry
        db.session.add(OrderStatusTimeline(
            order_id=order.id,
            status='Confirmed',
            description=STATUS_MAP['Confirmed'],
        ))

        # Order items + deduct stock
        for item in order_items:
            images_val = item.get('images', [])
            images_json = json.dumps(images_val if isinstance(images_val, list) else [])
            product_id = item.get('product')  # may be None for local-only products
            qty = safe_int(item.get('quantity', 1))

            db.session.add(OrderItem(
                order_id=order.id,
                product_id=product_id if product_id else None,
                title=str(item.get('title', 'Unknown Item')),
                quantity=qty,
                price=safe_float(item.get('price')),
                images=images_json,
            ))

            # Deduct stock only if product exists in DB
            if product_id:
                product = db.session.get(Product, product_id)
                if product:
                    product.stock = max(0, product.stock - qty)

        db.session.commit()

        # ── Send order confirmation email (async — does not block response) ──
        try:
            # Rebuild items list for email
            email_items = [
                {
                    'title':    str(item.get('title', 'Unknown Item')),
                    'quantity': int(item.get('quantity', 1)),
                    'price':    float(item.get('price', 0)),
                }
                for item in order_items
            ]
            email_shipping = {
                'street':     shipping.get('street', ''),
                'city':       shipping.get('city', ''),
                'state':      shipping.get('state', ''),
                'postalCode': shipping.get('postalCode', ''),
                'country':    shipping.get('country', 'India'),
            }
            order_date_str = order.created_at.strftime('%d %B %Y, %I:%M %p UTC') \
                             if order.created_at else None

            send_order_confirmation_email(
                order_id       = order.id,
                customer_name  = current_user.name,
                customer_email = current_user.email,
                items          = email_items,
                shipping_addr  = email_shipping,
                payment_method = payment_method,
                items_price    = order.items_price,
                tax_price      = order.tax_price,
                shipping_price = order.shipping_price,
                total_price    = order.total_price,
                order_date     = order_date_str,
                order_status   = order.order_status,
            )
        except Exception as email_exc:
            # Email failure must never block the order success response
            logger.error('[Order] Email dispatch error for order %s: %s',
                         order.id, email_exc)

        return jsonify(order.to_dict()), 201

    except Exception as exc:
        db.session.rollback()
        import traceback
        traceback.print_exc()   # prints to Flask console for debugging
        return jsonify({'message': f'Order creation failed: {str(exc)}'}), 500


# GET /api/orders/myorders
@order_bp.route('/myorders', methods=['GET'])
@protect
def my_orders(current_user):
    orders = Order.query.filter_by(user_id=current_user.id).order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])


# GET /api/orders/stats/summary  (admin)
@order_bp.route('/stats/summary', methods=['GET'])
@admin_required
def dashboard_summary(current_user):
    total_products = Product.query.count()
    total_orders = Order.query.count()
    total_customers = User.query.filter_by(role='customer').count()
    total_subscriptions = Subscription.query.count()
    total_tickets = SupportTicket.query.count()

    paid_orders = Order.query.filter_by(is_paid=True).all()
    revenue = sum(o.total_price for o in paid_orders)

    recent_orders = (
        Order.query
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )
    recent = []
    for o in recent_orders:
        od = o.to_dict()
        od['user'] = {'_id': o.user.id, 'name': o.user.name} if o.user else None
        recent.append(od)

    return jsonify({
        'totalProducts': total_products,
        'totalOrders': total_orders,
        'revenue': round(revenue, 2),
        'totalCustomers': total_customers,
        'totalSubscriptions': total_subscriptions,
        'totalTickets': total_tickets,
        'recentOrders': recent,
    })


# GET /api/orders  (admin)
@order_bp.route('/', methods=['GET'], strict_slashes=False)
@admin_required
def get_all_orders(current_user):
    orders = Order.query.order_by(Order.created_at.desc()).all()
    result = []
    for o in orders:
        od = o.to_dict()
        od['user'] = {'_id': o.user.id, 'name': o.user.name} if o.user else None
        result.append(od)
    return jsonify(result)


# GET /api/orders/:id
@order_bp.route('/<int:order_id>', methods=['GET'])
@protect
def get_order(order_id, current_user):
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({'message': 'Order not found'}), 404
    if order.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'message': 'Not authorized to view this order'}), 403
    od = order.to_dict()
    od['user'] = {'_id': order.user.id, 'name': order.user.name, 'email': order.user.email} if order.user else None
    return jsonify(od)


# PUT /api/orders/:id/status  (admin)
@order_bp.route('/<int:order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(order_id, current_user):
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({'message': 'Order not found'}), 404

    data = request.get_json()
    new_status = data.get('orderStatus', order.order_status)

    if new_status != order.order_status:
        order.order_status = new_status
        db.session.add(OrderStatusTimeline(
            order_id=order.id,
            status=new_status,
            description=STATUS_MAP.get(new_status, 'Status updated.'),
        ))

    if data.get('trackingNumber'):
        order.tracking_number = data['trackingNumber']
    if data.get('carrier'):
        order.carrier = data['carrier']
    if new_status == 'Delivered':
        order.is_paid = True
        if not order.paid_at:
            order.paid_at = datetime.utcnow()

    db.session.commit()
    return jsonify(order.to_dict())


# PUT /api/orders/:id/cancel  (customer)
@order_bp.route('/<int:order_id>/cancel', methods=['PUT'])
@protect
def cancel_order(order_id, current_user):
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({'message': 'Order not found'}), 404

    # Only the owner (or admin) can cancel
    if order.user_id != current_user.id and current_user.role != 'admin':
        return jsonify({'message': 'Not authorised to cancel this order'}), 403

    # Can only cancel if not yet shipped
    NON_CANCELLABLE = {'Shipped', 'Delivered', 'Cancelled'}
    if order.order_status in NON_CANCELLABLE:
        return jsonify({
            'message': f'Order cannot be cancelled — it is already "{order.order_status}". '
                       f'Please contact support if you need further help.'
        }), 400

    data = request.get_json(silent=True) or {}
    reason = data.get('reason', 'No reason provided')

    # Update status + record cancellation metadata
    order.order_status = 'Cancelled'
    order.cancellation_reason = reason
    order.cancelled_at = datetime.utcnow()

    db.session.add(OrderStatusTimeline(
        order_id=order.id,
        status='Cancelled',
        description=f'Order cancelled by customer. Reason: {reason}',
    ))

    # Restore stock for each item
    for item in order.order_items:
        if item.product_id:
            product = db.session.get(Product, item.product_id)
            if product:
                product.stock += item.quantity

    db.session.commit()
    return jsonify(order.to_dict())

