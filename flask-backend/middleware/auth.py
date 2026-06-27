"""
JWT auth helpers using PyJWT (pure Python — no C compilation needed).
Provides three decorators:
  @protect          — requires a valid token
  @admin_required   — requires valid token + admin role
  @optional_protect — token is optional, current_user may be None
"""

import jwt
from functools import wraps
from datetime import datetime, timezone
from flask import request, jsonify, current_app
from models import db, User


def _decode_token():
    """Extract and decode the Bearer token from Authorization header."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None, 'Not authorized, no token'
    token = auth_header.split(' ')[1]
    try:
        payload = jwt.decode(
            token,
            current_app.config['JWT_SECRET'],
            algorithms=['HS256'],
        )
        return payload.get('id'), None
    except jwt.ExpiredSignatureError:
        return None, 'Not authorized, token expired'
    except jwt.InvalidTokenError:
        return None, 'Not authorized, token failed'


def protect(f):
    """Require a valid JWT. Injects current_user kwarg."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id, err = _decode_token()
        if err and not user_id:
            return jsonify({'message': err}), 401
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'message': 'Not authorized, user not found'}), 401
        kwargs['current_user'] = user
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Require valid JWT + admin role. Injects current_user kwarg."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id, err = _decode_token()
        if err and not user_id:
            return jsonify({'message': err}), 401
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'message': 'Not authorized, user not found'}), 401
        if user.role != 'admin':
            return jsonify({'message': 'Not authorized as an admin'}), 403
        kwargs['current_user'] = user
        return f(*args, **kwargs)
    return decorated


def optional_protect(f):
    """Try to decode JWT; current_user is None if token absent/invalid."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id, _ = _decode_token()
        user = db.session.get(User, user_id) if user_id else None
        kwargs['current_user'] = user
        return f(*args, **kwargs)
    return decorated
