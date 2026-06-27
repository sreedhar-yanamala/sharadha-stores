import logging
from flask import Blueprint, request, jsonify
from models import db, ContactMessage
from middleware.auth import admin_required

logger = logging.getLogger(__name__)
contact_bp = Blueprint('contact', __name__)


# ─────────────────────────────────────────────────────────────────
# POST /api/contact  — submit a contact form message (public)
# Body: { name, email, phone?, subject, message }
# ─────────────────────────────────────────────────────────────────
@contact_bp.route('/', methods=['POST'], strict_slashes=False)
def submit_contact():
    data    = request.get_json(silent=True) or {}
    name    = (data.get('name') or '').strip()
    email   = (data.get('email') or '').strip()
    phone   = (data.get('phone') or '').strip() or None
    subject = (data.get('subject') or '').strip()
    message = (data.get('message') or '').strip()

    # Validation
    errors = []
    if not name:    errors.append('name is required')
    if not email or '@' not in email:
                    errors.append('a valid email is required')
    if not subject: errors.append('subject is required')
    if not message: errors.append('message is required')
    if len(message) < 10:
                    errors.append('message must be at least 10 characters')

    if errors:
        return jsonify({'message': '; '.join(errors)}), 400

    msg = ContactMessage(
        name    = name,
        email   = email,
        phone   = phone,
        subject = subject,
        message = message,
    )
    db.session.add(msg)
    db.session.commit()

    logger.info('[Contact] New message from %s <%s> — "%s"', name, email, subject)

    # Best-effort notification email to admin (non-blocking)
    try:
        from email_service import _smtp_configured, _send_via_smtp
        import os
        admin_email = os.getenv('SMTP_USER', '')
        if _smtp_configured() and admin_email:
            html = f"""
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> {name} &lt;{email}&gt;</p>
            {"<p><strong>Phone:</strong> " + phone + "</p>" if phone else ""}
            <p><strong>Subject:</strong> {subject}</p>
            <hr/>
            <p>{message.replace(chr(10), '<br>')}</p>
            """
            _send_via_smtp(admin_email, f'[Contact] {subject}', html, message)
    except Exception as exc:
        logger.warning('[Contact] Admin notification failed: %s', exc)

    return jsonify({
        'message': 'Thank you for contacting us! We will get back to you within 24 hours.',
        '_id': msg.id,
    }), 201


# ─────────────────────────────────────────────────────────────────
# GET /api/contact  — list contact messages (admin)
# ─────────────────────────────────────────────────────────────────
@contact_bp.route('/', methods=['GET'], strict_slashes=False)
@admin_required
def get_messages(current_user):
    unread_only = request.args.get('unread', 'false').lower() == 'true'
    query       = ContactMessage.query
    if unread_only:
        query = query.filter_by(is_read=False)
    messages = query.order_by(ContactMessage.created_at.desc()).all()
    return jsonify({
        'total':    len(messages),
        'messages': [m.to_dict() for m in messages],
    })


# ─────────────────────────────────────────────────────────────────
# PATCH /api/contact/:id/read  — mark message as read (admin)
# ─────────────────────────────────────────────────────────────────
@contact_bp.route('/<int:msg_id>/read', methods=['PATCH'], strict_slashes=False)
@admin_required
def mark_read(msg_id, current_user):
    msg = db.session.get(ContactMessage, msg_id)
    if not msg:
        return jsonify({'message': 'Message not found'}), 404

    msg.is_read = True
    db.session.commit()
    return jsonify(msg.to_dict())


# ─────────────────────────────────────────────────────────────────
# DELETE /api/contact/:id  — delete contact message (admin)
# ─────────────────────────────────────────────────────────────────
@contact_bp.route('/<int:msg_id>', methods=['DELETE'], strict_slashes=False)
@admin_required
def delete_message(msg_id, current_user):
    msg = db.session.get(ContactMessage, msg_id)
    if not msg:
        return jsonify({'message': 'Message not found'}), 404

    db.session.delete(msg)
    db.session.commit()
    return jsonify({'message': 'Message deleted'})
