from datetime import date, timedelta
from flask import Blueprint, request, jsonify
from models import db, Inventory, InventoryBatch, Product
from middleware.auth import admin_required

inventory_bp = Blueprint('inventory', __name__)


# GET /api/inventory/alerts/warnings  (admin)
@inventory_bp.route('/alerts/warnings', methods=['GET'])
@admin_required
def get_alerts(current_user):
    inventories = Inventory.query.all()
    low_stock_alerts = []
    expiry_alerts = []
    today = date.today()

    for inv in inventories:
        if inv.stock_count <= inv.low_stock_threshold:
            low_stock_alerts.append({
                'productId': inv.product_id,
                'title': inv.title,
                'stockCount': inv.stock_count,
                'threshold': inv.low_stock_threshold,
            })
        for batch in inv.batches:
            if not batch.is_expired:
                days_to_expiry = (batch.expiry_date - today).days
                if days_to_expiry <= inv.shelf_life_alert_days:
                    expiry_alerts.append({
                        'productId': inv.product_id,
                        'title': inv.title,
                        'batchNumber': batch.batch_number,
                        'expiryDate': batch.expiry_date.isoformat(),
                        'daysToExpiry': max(0, days_to_expiry),
                        'isExpired': days_to_expiry <= 0,
                    })

    return jsonify({'lowStockAlerts': low_stock_alerts, 'expiryAlerts': expiry_alerts})


# GET /api/inventory  (admin)
@inventory_bp.route('/', methods=['GET'])
@admin_required
def get_inventory(current_user):
    inventories = Inventory.query.all()
    return jsonify([i.to_dict() for i in inventories])


# GET /api/inventory/:productId  (admin)
@inventory_bp.route('/<int:product_id>', methods=['GET'])
@admin_required
def get_inventory_by_product(product_id, current_user):
    inventory = Inventory.query.filter_by(product_id=product_id).first()
    if not inventory:
        return jsonify({'message': 'Inventory for product not found'}), 404
    return jsonify(inventory.to_dict())


# POST /api/inventory/:productId/batches  (admin)
@inventory_bp.route('/<int:product_id>/batches', methods=['POST'])
@admin_required
def add_batch(product_id, current_user):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404

    data = request.get_json()
    inventory = Inventory.query.filter_by(product_id=product_id).first()

    if not inventory:
        inventory = Inventory(
            product_id=product_id,
            title=product.title,
            stock_count=0,
        )
        db.session.add(inventory)
        db.session.flush()

    batch = InventoryBatch(
        inventory_id=inventory.id,
        batch_number=data.get('batchNumber', ''),
        manufacture_date=data.get('manufactureDate'),
        expiry_date=data.get('expiryDate'),
        quantity=int(data.get('quantity', 0)),
    )
    db.session.add(batch)
    db.session.flush()

    # Recalculate stock from non-expired batches
    inventory.stock_count = sum(
        b.quantity for b in inventory.batches if not b.is_expired
    )

    # Sync product stock
    product.stock = inventory.stock_count

    db.session.commit()
    return jsonify(inventory.to_dict()), 201
