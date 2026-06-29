from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from models import db
import logging
import traceback

logger = logging.getLogger(__name__)

# ── Blueprints ──────────────────────────────────────────────────────────────
from routes.auth_routes         import auth_bp
from routes.product_routes      import product_bp
from routes.category_routes     import category_bp
from routes.order_routes        import order_bp
from routes.inventory_routes    import inventory_bp
from routes.subscription_routes import subscription_bp
from routes.ticket_routes       import ticket_bp
from routes.cart_routes         import cart_bp
from routes.wishlist_routes     import wishlist_bp
from routes.coupon_routes       import coupon_bp
from routes.newsletter_routes   import newsletter_bp
from routes.contact_routes      import contact_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS(app, resources={r'/api/*': {
        'origins': '*',
        'methods':       ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        'allow_headers': ['Content-Type', 'Authorization'],
        'supports_credentials': False,
    }})

    db.init_app(app)

    # ── Register blueprints ──────────────────────────────────────────────────
    app.register_blueprint(auth_bp,          url_prefix='/api/auth')
    app.register_blueprint(product_bp,       url_prefix='/api/products')
    app.register_blueprint(category_bp,      url_prefix='/api/categories')
    app.register_blueprint(order_bp,         url_prefix='/api/orders')
    app.register_blueprint(inventory_bp,     url_prefix='/api/inventory')
    app.register_blueprint(subscription_bp,  url_prefix='/api/subscriptions')
    app.register_blueprint(ticket_bp,        url_prefix='/api/tickets')
    app.register_blueprint(cart_bp,          url_prefix='/api/cart')
    app.register_blueprint(wishlist_bp,      url_prefix='/api/wishlist')
    app.register_blueprint(coupon_bp,        url_prefix='/api/coupons')
    app.register_blueprint(newsletter_bp,    url_prefix='/api/newsletter')
    app.register_blueprint(contact_bp,       url_prefix='/api/contact')

    # ── Root routes ──────────────────────────────────────────────────────────
    @app.route('/')
    def index():
        return jsonify({'message': 'Sharadha Stores API is running (MySQL)...'})

    @app.route('/api/health')
    def health():
        """Health-check — used by frontend to detect backend status."""
        db_status = 'unknown'
        try:
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
            db_status = 'connected'
        except Exception as e:
            db_status = f'error: {e}'

        return jsonify({
            'status':   'ok',
            'message':  'Sharadha Stores API is running',
            'version':  '2.0.0',
            'database': db_status,
        })

    # ── Email utilities ───────────────────────────────────────────────────────
    @app.route('/api/email/status', methods=['GET'])
    def email_status():
        """Return SMTP configuration status (no passwords exposed)."""
        from email_service import _get_smtp_config, _smtp_configured
        import os
        cfg = _get_smtp_config()
        return jsonify({
            'configured': _smtp_configured(),
            'smtp_host':  cfg['host'] or '(not set)',
            'smtp_port':  cfg['port'],
            'smtp_user':  cfg['user'] or '(not set)',
            'use_tls':    cfg['use_tls'],
            'use_ssl':    cfg['use_ssl'],
            'from_name':  cfg['from_name'],
        })

    @app.route('/api/email/test', methods=['POST'])
    def email_test():
        """Send a test email to verify SMTP credentials.
        Body: { "to": "recipient@example.com" }
        """
        from email_service import send_test_email
        body = request.get_json(silent=True) or {}
        to   = (body.get('to') or '').strip()
        if not to:
            return jsonify({'success': False, 'error': 'Provide { "to": "email@example.com" }'}), 400
        result = send_test_email(to)
        status = 200 if result['success'] else 502
        return jsonify(result), status

    # ── Error handlers ────────────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'message': 'Not Found'}), 404

    @app.errorhandler(Exception)
    def handle_exception(e):
        logger.error('[App] Unhandled exception: %s\n%s', e, traceback.format_exc())
        return jsonify({'message': str(e)}), 500

    # ── Auto-create tables (MySQL only — no SQLite fallback) ────────────────
    with app.app_context():
        try:
            # Verify we are connected to MySQL (SELECT VERSION() only works on MySQL)
            from sqlalchemy import text
            result = db.session.execute(text("SELECT VERSION()")).fetchone()
            mysql_version = result[0] if result else 'unknown'
            logger.info('[DB] ✓ Connected to MySQL %s', mysql_version)

            db.create_all()
            logger.info('[DB] All tables verified/created in MySQL.')
            _seed_default_coupons(app)
        except Exception as exc:
            logger.critical('[DB] ✗ MySQL connection FAILED: %s', exc)
            logger.critical('[DB] Fix DATABASE_URL in flask-backend/.env and restart.')
            logger.critical('[DB] Run: python full_mysql_setup.py  for automated setup.')
            raise  # Re-raise: Flask startup fails loudly — no silent degradation


    return app


def _seed_default_coupons(app):
    """Insert default coupon codes if the coupons table is empty."""
    with app.app_context():
        from models import Coupon
        try:
            if Coupon.query.count() == 0:
                defaults = [
                    Coupon(code='WELCOME10',     discount_type='percentage', discount_value=10,  min_order_amount=100,  max_uses=500),
                    Coupon(code='FESTIVAL15',    discount_type='percentage', discount_value=15,  min_order_amount=200,  max_uses=300),
                    Coupon(code='TRADITIONAL20', discount_type='percentage', discount_value=20,  min_order_amount=500,  max_uses=100),
                    Coupon(code='FLAT50',        discount_type='fixed',      discount_value=50,  min_order_amount=300,  max_uses=200),
                    Coupon(code='NEWUSER25',     discount_type='percentage', discount_value=25,  min_order_amount=150,  max_uses=1000),
                ]
                db.session.add_all(defaults)
                db.session.commit()
                logger.info('[DB] Seeded %d default coupon codes.', len(defaults))
        except Exception as exc:
            logger.warning('[DB] Coupon seed skipped: %s', exc)


app = create_app()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    app.run(
        host='0.0.0.0',
        port=Config.PORT,
        debug=Config.DEBUG,
        use_reloader=False,   # Disabled: reloader spawns a child process that can crash
    )
