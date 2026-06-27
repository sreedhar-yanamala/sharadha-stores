import logging
from flask import Blueprint, request, jsonify
from models import db, NewsletterSubscriber
from middleware.auth import admin_required

logger = logging.getLogger(__name__)
newsletter_bp = Blueprint('newsletter', __name__)


# ─────────────────────────────────────────────────────────────────
# POST /api/newsletter/subscribe  — subscribe an email (public)
# Body: { email, name? }
# ─────────────────────────────────────────────────────────────────
@newsletter_bp.route('/subscribe', methods=['POST'], strict_slashes=False)
def subscribe():
    data  = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    name  = (data.get('name') or '').strip()

    if not email or '@' not in email:
        return jsonify({'message': 'A valid email address is required'}), 400

    existing = NewsletterSubscriber.query.filter_by(email=email).first()

    if existing:
        if existing.is_active:
            return jsonify({'message': 'This email is already subscribed', 'alreadySubscribed': True}), 200
        else:
            # Re-subscribe
            existing.is_active       = True
            existing.unsubscribed_at = None
            if name:
                existing.name = name
            db.session.commit()
            logger.info('[Newsletter] Re-subscribed: %s', email)
            return jsonify({'message': 'Welcome back! You have been re-subscribed.', 'resubscribed': True})

    subscriber = NewsletterSubscriber(email=email, name=name or None)
    db.session.add(subscriber)
    db.session.commit()
    logger.info('[Newsletter] New subscriber: %s', email)
    return jsonify({'message': 'Thank you for subscribing to Sharadha Stores newsletter!', 'subscribed': True}), 201


# ─────────────────────────────────────────────────────────────────
# POST /api/newsletter/unsubscribe  — unsubscribe (public, via link)
# Body: { email }
# ─────────────────────────────────────────────────────────────────
@newsletter_bp.route('/unsubscribe', methods=['POST'], strict_slashes=False)
def unsubscribe():
    data  = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()

    if not email:
        return jsonify({'message': 'Email is required'}), 400

    from datetime import datetime
    existing = NewsletterSubscriber.query.filter_by(email=email, is_active=True).first()
    if not existing:
        return jsonify({'message': 'Email not found in subscribers list'}), 404

    existing.is_active       = False
    existing.unsubscribed_at = datetime.utcnow()
    db.session.commit()
    logger.info('[Newsletter] Unsubscribed: %s', email)
    return jsonify({'message': 'You have been unsubscribed successfully.'})


# ─────────────────────────────────────────────────────────────────
# GET /api/newsletter  — list all subscribers (admin)
# ─────────────────────────────────────────────────────────────────
@newsletter_bp.route('/', methods=['GET'], strict_slashes=False)
@admin_required
def get_subscribers(current_user):
    active_only = request.args.get('active', 'true').lower() == 'true'
    query = NewsletterSubscriber.query
    if active_only:
        query = query.filter_by(is_active=True)
    subscribers = query.order_by(NewsletterSubscriber.subscribed_at.desc()).all()
    return jsonify({
        'total': len(subscribers),
        'subscribers': [s.to_dict() for s in subscribers],
    })


# ─────────────────────────────────────────────────────────────────
# DELETE /api/newsletter/:id  — remove subscriber (admin)
# ─────────────────────────────────────────────────────────────────
@newsletter_bp.route('/<int:subscriber_id>', methods=['DELETE'], strict_slashes=False)
@admin_required
def delete_subscriber(subscriber_id, current_user):
    subscriber = db.session.get(NewsletterSubscriber, subscriber_id)
    if not subscriber:
        return jsonify({'message': 'Subscriber not found'}), 404

    db.session.delete(subscriber)
    db.session.commit()
    return jsonify({'message': 'Subscriber removed'})
