"""
sms_service.py — Multi-provider SMS abstraction for Sharadha Stores.

Supported providers (set SMS_PROVIDER in .env):
  console   → Print OTP to Flask terminal (development/testing)
  fast2sms  → Fast2SMS OTP route (India, free tier, no DLT needed)
  twilio    → Twilio Programmable SMS (international, production-grade)
  msg91     → MSG91 (India, requires DLT template registration)

Usage:
    from sms_service import send_otp_sms
    result = send_otp_sms(phone='9876543210', otp='123456')
    # result = {'success': True, 'provider': 'fast2sms', 'sid': '...'}
    # result = {'success': False, 'error': 'reason...'}
"""
import os
import json
import logging

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────────────────────────

def _normalize_phone(phone: str) -> str:
    """Return 10-digit Indian mobile number (strip country code)."""
    digits = ''.join(filter(str.isdigit, phone or ''))
    if digits.startswith('91') and len(digits) == 12:
        digits = digits[2:]
    return digits


def _e164(phone: str) -> str:
    """Return E.164 format: +91XXXXXXXXXX"""
    return f'+91{_normalize_phone(phone)}'


# ─────────────────────────────────────────────────────────────────
#  Provider: Console (development fallback)
# ─────────────────────────────────────────────────────────────────

def _send_console(phone: str, otp: str) -> dict:
    """Print OTP to the terminal. Always succeeds."""
    masked = phone[-4:].rjust(len(phone), '*')
    print('\n' + '=' * 55)
    print(f'  [SMS — Dev Console]  Phone: +91 {phone}')
    print(f'  OTP: \033[92m{otp}\033[0m  (valid for 5 minutes)')
    print('=' * 55 + '\n')
    logger.info('[SMS:console] OTP logged for %s', masked)
    return {'success': True, 'provider': 'console', 'sid': 'console-dev'}


# ─────────────────────────────────────────────────────────────────
#  Provider: Fast2SMS
#  Docs: https://docs.fast2sms.com/
#  Free tier: 50 SMS; no DLT needed for OTP route
# ─────────────────────────────────────────────────────────────────

def _send_fast2sms(phone: str, otp: str) -> dict:
    try:
        import requests
    except ImportError:
        return {'success': False, 'error': 'requests library not installed. Run: pip install requests'}

    api_key = os.environ.get('FAST2SMS_API_KEY', '').strip()
    if not api_key:
        logger.error('[SMS:fast2sms] FAST2SMS_API_KEY not set in .env')
        return {'success': False, 'error': 'FAST2SMS_API_KEY is not configured in .env'}

    phone_10 = _normalize_phone(phone)
    url = 'https://www.fast2sms.com/dev/bulkV2'
    payload = {
        'route':            'otp',
        'variables_values': otp,
        'flash':            0,
        'numbers':          phone_10,
    }
    headers = {
        'authorization': api_key,
        'Content-Type':  'application/json',
    }

    logger.info('[SMS:fast2sms] Sending OTP to %s...', phone_10[-4:].rjust(10, '*'))

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        data = resp.json()
        logger.info('[SMS:fast2sms] Response %s: %s', resp.status_code, data)

        if resp.ok and data.get('return') is True:
            return {'success': True, 'provider': 'fast2sms', 'sid': str(data.get('request_id', ''))}
        else:
            err = data.get('message', [resp.text]) 
            err_msg = err[0] if isinstance(err, list) else str(err)
            logger.error('[SMS:fast2sms] Failed: %s', err_msg)
            return {'success': False, 'error': f'Fast2SMS: {err_msg}'}

    except requests.Timeout:
        logger.error('[SMS:fast2sms] Request timed out')
        return {'success': False, 'error': 'Fast2SMS request timed out. Please try again.'}
    except Exception as ex:
        logger.exception('[SMS:fast2sms] Unexpected error')
        return {'success': False, 'error': f'Fast2SMS error: {str(ex)}'}


# ─────────────────────────────────────────────────────────────────
#  Provider: Twilio
#  Docs: https://www.twilio.com/docs/sms/quickstart/python
#  Get credentials: https://console.twilio.com/
# ─────────────────────────────────────────────────────────────────

def _send_twilio(phone: str, otp: str) -> dict:
    try:
        from twilio.rest import Client
        from twilio.base.exceptions import TwilioRestException
    except ImportError:
        return {'success': False, 'error': 'twilio library not installed. Run: pip install twilio'}

    account_sid  = os.environ.get('TWILIO_ACCOUNT_SID', '').strip()
    auth_token   = os.environ.get('TWILIO_AUTH_TOKEN', '').strip()
    from_number  = os.environ.get('TWILIO_PHONE_NUMBER', '').strip()

    missing = [k for k, v in {
        'TWILIO_ACCOUNT_SID':  account_sid,
        'TWILIO_AUTH_TOKEN':   auth_token,
        'TWILIO_PHONE_NUMBER': from_number,
    }.items() if not v]

    if missing:
        logger.error('[SMS:twilio] Missing env vars: %s', missing)
        return {'success': False, 'error': f'Twilio not configured. Missing: {", ".join(missing)}'}

    to_number = _e164(phone)
    body = (
        f'Your Sharadha Stores verification code is: {otp}\n'
        f'This code is valid for 5 minutes. Do not share it with anyone.'
    )

    logger.info('[SMS:twilio] Sending OTP to %s via Twilio...', to_number[-4:].rjust(len(to_number), '*'))

    try:
        client  = Client(account_sid, auth_token)
        message = client.messages.create(body=body, from_=from_number, to=to_number)
        logger.info('[SMS:twilio] Sent. SID=%s status=%s', message.sid, message.status)
        return {'success': True, 'provider': 'twilio', 'sid': message.sid}

    except TwilioRestException as ex:
        logger.error('[SMS:twilio] TwilioRestException: %s', ex)
        return {'success': False, 'error': f'Twilio error {ex.code}: {ex.msg}'}
    except Exception as ex:
        logger.exception('[SMS:twilio] Unexpected error')
        return {'success': False, 'error': f'Twilio error: {str(ex)}'}


# ─────────────────────────────────────────────────────────────────
#  Provider: MSG91
#  Docs: https://docs.msg91.com/reference/send-otp
#  Requires DLT-registered template for India
# ─────────────────────────────────────────────────────────────────

def _send_msg91(phone: str, otp: str) -> dict:
    try:
        import requests
    except ImportError:
        return {'success': False, 'error': 'requests library not installed. Run: pip install requests'}

    auth_key    = os.environ.get('MSG91_AUTH_KEY', '').strip()
    template_id = os.environ.get('MSG91_TEMPLATE_ID', '').strip()

    if not auth_key or not template_id:
        logger.error('[SMS:msg91] MSG91_AUTH_KEY or MSG91_TEMPLATE_ID not set')
        return {'success': False, 'error': 'MSG91 not configured. Set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID in .env'}

    # MSG91 wants country-code prefixed number
    mobile = f'91{_normalize_phone(phone)}'
    url    = 'https://control.msg91.com/api/v5/otp'
    payload = {
        'template_id': template_id,
        'mobile':      mobile,
        'otp':         otp,
    }
    headers = {
        'authkey':      auth_key,
        'Content-Type': 'application/json',
    }

    logger.info('[SMS:msg91] Sending OTP to %s...', mobile[-4:].rjust(len(mobile), '*'))

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        data = resp.json()
        logger.info('[SMS:msg91] Response %s: %s', resp.status_code, data)

        if resp.ok and data.get('type') == 'success':
            return {'success': True, 'provider': 'msg91', 'sid': data.get('request_id', '')}
        else:
            err = data.get('message', resp.text)
            logger.error('[SMS:msg91] Failed: %s', err)
            return {'success': False, 'error': f'MSG91: {err}'}

    except requests.Timeout:
        return {'success': False, 'error': 'MSG91 request timed out. Please try again.'}
    except Exception as ex:
        logger.exception('[SMS:msg91] Unexpected error')
        return {'success': False, 'error': f'MSG91 error: {str(ex)}'}


# ─────────────────────────────────────────────────────────────────
#  Public API
# ─────────────────────────────────────────────────────────────────

_PROVIDERS = {
    'console':  _send_console,
    'fast2sms': _send_fast2sms,
    'twilio':   _send_twilio,
    'msg91':    _send_msg91,
}


def send_otp_sms(phone: str, otp: str) -> dict:
    """
    Send a 6-digit OTP to the given phone number.

    Returns:
        {'success': True,  'provider': 'fast2sms', 'sid': '...'}
        {'success': False, 'error': 'human-readable reason'}
    """
    provider = os.environ.get('SMS_PROVIDER', 'console').strip().lower()

    send_fn = _PROVIDERS.get(provider)
    if send_fn is None:
        logger.warning('[SMS] Unknown SMS_PROVIDER=%r, falling back to console', provider)
        send_fn = _send_console

    phone_10 = _normalize_phone(phone)
    if not phone_10 or len(phone_10) != 10:
        logger.error('[SMS] Invalid phone number: %r → normalized: %r', phone, phone_10)
        return {'success': False, 'error': f'Invalid phone number: {phone}'}

    logger.info('[SMS] Dispatching OTP via provider=%r to %s', provider, phone_10[-4:].rjust(10, '*'))
    return send_fn(phone_10, otp)
