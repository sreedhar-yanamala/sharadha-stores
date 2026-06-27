import jwt
import random
import logging
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify, current_app
import bcrypt
from models import db, User, Address, LoginOTP, PasswordResetOTP
from middleware.auth import protect, admin_required
from sms_service import send_otp_sms

# Optional email sending — delegates to the shared email_service module
def _try_send_email(to_addr, subject, html_body):
    """Best-effort password-reset email send via the shared email_service module.
    Returns True if sent, False if not configured or failed."""
    try:
        from email_service import _send_via_smtp, _smtp_configured
        if not _smtp_configured():
            logger.warning('[Email] SMTP not configured — reset link NOT sent by email.')
            return False

        plain_body = (
            "Reset Your Sharadha Stores Password\n\n"
            "You requested a password reset. Copy the link below into your browser:\n\n"
            "If you didn't request this, you can safely ignore this email.\n\n"
            "— Sharadha Stores Team"
        )
        result = _send_via_smtp(to_addr, subject, html_body, plain_body)
        if result['success']:
            logger.info('[Email] Reset link sent to %s', to_addr)
            return True
        else:
            logger.error('[Email] Failed to send reset email to %s: %s', to_addr, result.get('error'))
            return False
    except Exception as exc:
        logger.error('[Email] Failed to send email to %s: %s', to_addr, exc)
        return False

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__)


def generate_token(user_id, purpose='auth', expires_hours=None, expires_minutes=None):
    """Create a JWT signed with JWT_SECRET.
    purpose='auth'           → 30-day session token
    purpose='password_reset' → 15-minute reset token
    """
    if expires_minutes is not None:
        expiry = timedelta(minutes=expires_minutes)
    elif expires_hours is not None:
        expiry = timedelta(hours=expires_hours)
    elif purpose == 'password_reset':
        expiry = timedelta(minutes=15)
    else:
        expiry = timedelta(days=30)

    payload = {
        'id':      user_id,
        'purpose': purpose,
        'exp':     datetime.now(timezone.utc) + expiry,
        'iat':     datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET'], algorithm='HS256')


def _normalize_phone(phone):
    """Strip everything except digits, remove leading 91 (India) prefix."""
    digits = ''.join(filter(str.isdigit, phone or ''))
    if digits.startswith('91') and len(digits) == 12:
        digits = digits[2:]
    return digits


# ─────────────────────────────────────────────────────────────────
#  POST /api/auth/login
# ─────────────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data:
        logger.info('[Auth] Login attempt with no JSON body')
        return jsonify({'message': 'Request body must be JSON'}), 400

    email    = data.get('email', '').lower().strip()
    password = data.get('password', '')

    logger.info('[Auth] Login attempt for email: %r', email)

    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        logger.info('[Auth] Login FAILED: no user found with email %r', email)
        return jsonify({'message': 'Invalid email or password'}), 401

    try:
        password_ok = bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8'))
    except Exception as e:
        logger.error('[Auth] bcrypt.checkpw raised an exception for %r: %s', email, e)
        return jsonify({'message': 'Authentication error. Please try again.'}), 500

    if not password_ok:
        logger.info('[Auth] Login FAILED: wrong password for %r', email)
        return jsonify({'message': 'Invalid email or password'}), 401

    token = generate_token(user.id)
    # ── Mark user as online ──
    user.is_online = True
    user.last_seen  = datetime.utcnow()
    db.session.commit()
    logger.info('[Auth] Login SUCCESS for %r (id=%s, role=%s)', email, user.id, user.role)
    return jsonify({**user.to_dict(), 'token': token})


# ─────────────────────────────────────────────────────────────────
#  POST /api/auth/register
# ─────────────────────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'message': 'Request body must be JSON'}), 400

    name     = data.get('name', '').strip()
    email    = data.get('email', '').lower().strip()
    password = data.get('password', '')
    phone    = data.get('phone', '').strip()

    if not name or not email or not password:
        return jsonify({'message': 'Name, email, and password are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'User already exists'}), 409

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = User(name=name, email=email, password_hash=hashed, role='customer',
                phone=_normalize_phone(phone) if phone else None)
    db.session.add(user)
    db.session.commit()
    return jsonify({**user.to_dict(), 'token': generate_token(user.id)}), 201


# ─────────────────────────────────────────────────────────────────
#  GET /api/auth/profile
# ─────────────────────────────────────────────────────────────────
@auth_bp.route('/profile', methods=['GET'])
@protect
def get_profile(current_user):
    return jsonify(current_user.to_dict())


# ─────────────────────────────────────────────────────────────────
#  POST /api/auth/logout
# ─────────────────────────────────────────────────────────────────
@auth_bp.route('/logout', methods=['POST'])
@protect
def logout(current_user):
    """Mark the user as offline in the database."""
    current_user.is_online = False
    current_user.last_seen  = datetime.utcnow()
    db.session.commit()
    logger.info('[Auth] Logout for %r (id=%s)', current_user.email, current_user.id)
    return jsonify({'message': 'Logged out successfully.'}), 200


# ─────────────────────────────────────────────────────────────────
#  POST /api/auth/heartbeat
#  Called every 60 s by the frontend while the user is logged in.
#  Updates last_seen and keeps is_online = True.
# ─────────────────────────────────────────────────────────────────
@auth_bp.route('/heartbeat', methods=['POST'])
@protect
def heartbeat(current_user):
    """Keep-alive ping: refresh last_seen and ensure is_online is True."""
    current_user.is_online = True
    current_user.last_seen  = datetime.utcnow()
    db.session.commit()
    return jsonify({
        'isOnline': True,
        'lastSeen': current_user.last_seen.isoformat(),
    }), 200


# ─────────────────────────────────────────────────────────────────
#  PUT /api/auth/profile
# ─────────────────────────────────────────────────────────────────
@auth_bp.route('/profile', methods=['PUT'])
@protect
def update_profile(current_user):
    data = request.get_json(silent=True) or {}

    if data.get('name'):
        current_user.name = data['name']
    if data.get('email'):
        current_user.email = data['email'].lower().strip()
    if data.get('phone') is not None:
        current_user.phone = _normalize_phone(data['phone'])

    # ── Password change with current-password verification ──────────────
    if data.get('password'):
        new_password     = data['password']
        current_password = data.get('currentPassword', '')

        # If currentPassword is supplied, verify it before allowing the change
        if current_password:
            try:
                pwd_ok = bcrypt.checkpw(
                    current_password.encode('utf-8'),
                    current_user.password_hash.encode('utf-8')
                )
            except Exception:
                pwd_ok = False

            if not pwd_ok:
                return jsonify({'message': 'Current password is incorrect.'}), 401

        if len(new_password) < 6:
            return jsonify({'message': 'New password must be at least 6 characters.'}), 400

        current_user.password_hash = bcrypt.hashpw(
            new_password.encode('utf-8'), bcrypt.gensalt()
        ).decode('utf-8')
        logger.info('[Auth] Password changed via profile update for user id=%s', current_user.id)

    # ── Sync addresses if provided ──────────────────────────────────────
    if 'addresses' in data and isinstance(data['addresses'], list):
        incoming = data['addresses']

        # Collect IDs of incoming addresses that already exist in DB (numeric id)
        incoming_ids = set()
        for addr in incoming:
            raw_id = addr.get('_id')
            if raw_id is not None:
                try:
                    incoming_ids.add(int(raw_id))
                except (ValueError, TypeError):
                    pass  # local_ prefixed IDs — will be created as new

        # Delete addresses that are no longer in the list
        for existing in list(current_user.addresses):
            if existing.id not in incoming_ids:
                db.session.delete(existing)

        # Create or update addresses
        for addr in incoming:
            raw_id = addr.get('_id')
            is_local_id = True
            db_id = None
            if raw_id is not None:
                try:
                    db_id = int(raw_id)
                    is_local_id = False
                except (ValueError, TypeError):
                    is_local_id = True  # e.g. 'local_addr_1234567'

            if not is_local_id and db_id:
                # Update existing
                existing_addr = db.session.get(Address, db_id)
                if existing_addr and existing_addr.user_id == current_user.id:
                    existing_addr.street      = addr.get('street', existing_addr.street)
                    existing_addr.city        = addr.get('city', existing_addr.city)
                    existing_addr.state       = addr.get('state', existing_addr.state)
                    existing_addr.postal_code = addr.get('postalCode', existing_addr.postal_code)
                    existing_addr.country     = addr.get('country', existing_addr.country)
                    existing_addr.is_default  = bool(addr.get('isDefault', False))
            else:
                # Create new
                new_addr = Address(
                    user_id    = current_user.id,
                    street     = addr.get('street', ''),
                    city       = addr.get('city', ''),
                    state      = addr.get('state', ''),
                    postal_code= addr.get('postalCode', ''),
                    country    = addr.get('country', 'India'),
                    is_default = bool(addr.get('isDefault', False)),
                )
                db.session.add(new_addr)

    db.session.commit()
    return jsonify(current_user.to_dict())

# ─────────────────────────────────────────────────────────────────
#  POST /api/auth/direct-reset-password
#  Accepts: { email, password }
#
#  Security:
#   - None. This is a prototype endpoint that bypasses verification.
# ─────────────────────────────────────────────────────────────────
@auth_bp.route('/direct-reset-password', methods=['POST'])
def direct_reset_password():
    data  = request.get_json(silent=True) or {}
    email = data.get('email', '').strip().lower()
    new_password = data.get('password', '')

    if not email or not new_password:
        return jsonify({'message': 'Email and new password are required.'}), 400

    user = User.query.filter_by(email=email).first()

    # ── Password complexity requirements ─────────────────────────────
    if len(new_password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters.'}), 400

    hashed_password = bcrypt.hashpw(
        new_password.encode('utf-8'), bcrypt.gensalt()
    ).decode('utf-8')

    if not user:
        # Auto-create the user for testing convenience
        user = User(name="Test User", email=email, password_hash=hashed_password, role='customer')
        db.session.add(user)
        logger.info('[Auth] User auto-created during direct password reset: %r', email)
        msg = 'Your account has been created and password set successfully.'
    else:
        user.password_hash = hashed_password
        logger.info('[Auth] Password reset successfully via direct bypass for user %r (id=%s)', user.email, user.id)
        msg = 'Your password has been reset successfully.'

    db.session.commit()
    return jsonify({'message': msg}), 200




# ─────────────────────────────────────────────────────────────────
#  GET /api/auth/users  (admin only)
# ─────────────────────────────────────────────────────────────────
@auth_bp.route('/users', methods=['GET'])
@admin_required
def get_users(current_user):
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])


# ─────────────────────────────────────────────────────────────────
#  POST /api/auth/send-otp       ← primary alias
#  POST /api/auth/send-login-otp ← legacy alias (kept for compat)
#  Accepts:  { phone }   — 10-digit Indian mobile
#  Returns:  success message  (OTP is delivered via SMS only)
#  Rate-limit: max 3 OTP requests per phone per 10 minutes
# ─────────────────────────────────────────────────────────────────
@auth_bp.route('/send-otp', methods=['POST'])
@auth_bp.route('/send-login-otp', methods=['POST'])
def send_login_otp():
    data  = request.get_json(silent=True) or {}
    phone = data.get('phone', '').strip()

    if not phone:
        return jsonify({'message': 'Phone number is required.'}), 400

    phone_norm = _normalize_phone(phone)
    if not phone_norm or len(phone_norm) != 10:
        return jsonify({'message': 'Please enter a valid 10-digit Indian mobile number.'}), 400

    # ── Rate-limit: max 3 requests per phone per 10 minutes ──
    ten_min_ago = datetime.utcnow() - timedelta(minutes=10)
    recent_count = (
        LoginOTP.query
        .filter(
            LoginOTP.phone == phone_norm,
            LoginOTP.created_at >= ten_min_ago,
        )
        .count()
    )
    if recent_count >= 3:
        logger.warning('[LoginOTP] Rate limit hit for phone=%s', phone_norm[-4:].rjust(10, '*'))
        return jsonify({
            'message': 'Too many OTP requests. Please wait a few minutes before trying again.',
        }), 429

    # ── Invalidate any existing unused OTPs for this phone ──
    LoginOTP.query.filter_by(phone=phone_norm, is_used=False).update({'is_used': True})
    db.session.flush()

    # ── Generate secure 6-digit OTP ──
    otp      = str(random.randint(100000, 999999))
    otp_hash = bcrypt.hashpw(otp.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    otp_record = LoginOTP(
        phone=phone_norm,
        otp_hash=otp_hash,
        expires_at=expires_at,
    )
    db.session.add(otp_record)
    db.session.commit()

    logger.info('[LoginOTP] OTP generated for phone=%s (record id=%s)', phone_norm[-4:].rjust(10, '*'), otp_record.id)

    # ── Send OTP via configured SMS provider ──
    sms_result = send_otp_sms(phone=phone_norm, otp=otp)

    if not sms_result['success']:
        otp_record.is_used = True
        db.session.commit()
        logger.error('[LoginOTP] SMS FAILED for phone=%s: %s', phone_norm[-4:].rjust(10, '*'), sms_result.get('error'))
        return jsonify({'message': 'Unable to send OTP. Please try again later.'}), 502

    logger.info('[LoginOTP] SMS sent via %s for phone=%s', sms_result.get('provider'), phone_norm[-4:].rjust(10, '*'))

    masked = '•' * (len(phone_norm) - 4) + phone_norm[-4:]
    return jsonify({
        'message':     'OTP sent successfully to your phone number.',
        'maskedPhone': masked,
    }), 200


# ─────────────────────────────────────────────────────────────────
#  POST /api/auth/resend-otp  (login OTP resend — wraps send_login_otp)
# ─────────────────────────────────────────────────────────────────
@auth_bp.route('/resend-login-otp', methods=['POST'])
def resend_login_otp():
    """Resend login OTP — reuses the send_login_otp logic."""
    return send_login_otp()


# ─────────────────────────────────────────────────────────────────
#  POST /api/auth/verify-login-otp
#  Accepts:  { phone, otp, name? }  — name only for new registrations
#  Returns:  { token, user, isNewUser }
# ─────────────────────────────────────────────────────────────────
@auth_bp.route('/verify-login-otp', methods=['POST'])
def verify_login_otp():
    data      = request.get_json(silent=True) or {}
    phone     = data.get('phone', '').strip()
    otp_input = data.get('otp', '').strip()
    name      = data.get('name', '').strip()   # optional — for new user registration

    if not phone or not otp_input:
        return jsonify({'message': 'Phone number and OTP are required.'}), 400

    phone_norm = _normalize_phone(phone)
    if not phone_norm or len(phone_norm) != 10:
        return jsonify({'message': 'Invalid phone number.'}), 400

    # ── Get the latest active OTP for this phone ──
    otp_record = (
        LoginOTP.query
        .filter_by(phone=phone_norm, is_used=False)
        .order_by(LoginOTP.created_at.desc())
        .first()
    )

    if not otp_record:
        return jsonify({'message': 'No active OTP found. Please request a new one.'}), 401

    # ── Check expiry ──
    if datetime.utcnow() > otp_record.expires_at:
        otp_record.is_used = True
        db.session.commit()
        logger.info('[LoginOTP] OTP expired for phone=%s', phone_norm[-4:].rjust(10, '*'))
        return jsonify({'message': 'OTP has expired. Please request a new OTP.'}), 401

    # ── Check attempt limit (max 5) ──
    if otp_record.attempts >= 5:
        otp_record.is_used = True
        db.session.commit()
        logger.warning('[LoginOTP] Max attempts exceeded for phone=%s', phone_norm[-4:].rjust(10, '*'))
        return jsonify({'message': 'Too many incorrect attempts. Please request a new OTP.'}), 429

    # ── Verify OTP hash ──
    try:
        is_valid = bcrypt.checkpw(otp_input.encode('utf-8'), otp_record.otp_hash.encode('utf-8'))
    except Exception as e:
        logger.exception('[LoginOTP] bcrypt error: %s', e)
        return jsonify({'message': 'OTP verification failed. Please try again.'}), 500

    if not is_valid:
        otp_record.attempts += 1
        db.session.commit()
        remaining = 5 - otp_record.attempts
        logger.info('[LoginOTP] Wrong OTP for phone=%s. Attempts left: %d', phone_norm[-4:].rjust(10, '*'), remaining)
        return jsonify({
            'message': f'Invalid OTP. Please try again.'
        }), 401

    # ── OTP is valid — mark used ──
    otp_record.is_used = True
    db.session.commit()

    # ── Find or create user by phone ──
    user = User.query.filter_by(phone=phone_norm).first()
    is_new_user = False

    if not user:
        # Auto-register: use provided name or derive from phone
        user_name = name if name else f'User {phone_norm[-4:]}'
        dummy_password = bcrypt.hashpw(
            (phone_norm + str(random.randint(10**9, 10**10))).encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')
        placeholder_email = f'phone_{phone_norm}@sharadha.local'

        user = User(
            name=user_name,
            email=placeholder_email,
            password_hash=dummy_password,
            phone=phone_norm,
            role='customer',
        )
        db.session.add(user)
        db.session.commit()
        is_new_user = True
        logger.info('[LoginOTP] New user auto-registered via OTP. phone=%s id=%s', phone_norm[-4:].rjust(10, '*'), user.id)
    else:
        logger.info('[LoginOTP] Existing user OTP login. phone=%s id=%s', phone_norm[-4:].rjust(10, '*'), user.id)

    token = generate_token(user.id)
    return jsonify({
        **user.to_dict(),
        'token':     token,
        'isNewUser': is_new_user,
    }), 200

