"""
email_service.py — Professional email notification system for Sharadha Stores.

Features:
  - Order confirmation emails with full order details (HTML + plain-text fallback)
  - Async sending via background thread (never blocks the order API response)
  - Duplicate-email prevention using an in-process set
  - Email address validation before sending
  - Structured logging for every attempt and result
  - Test utility (send_test_email) for SMTP verification
  - Reads all credentials from environment variables

Environment variables needed in flask-backend/.env:
  SMTP_HOST      — SMTP server (e.g., smtp.gmail.com)
  SMTP_PORT      — Port number (587 for TLS, 465 for SSL, 25 for plain)
  SMTP_USER      — Sender email address
  SMTP_PASSWORD  — App password / SMTP password
  SMTP_FROM_NAME — Display name  (default: "Sharadha Stores")
  SMTP_USE_TLS   — 'true' to use STARTTLS (default true)
  SMTP_USE_SSL   — 'true' to use SSL/TLS from start (for port 465)
"""
import os
import re
import logging
import threading
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
#  In-process dedup set  (order_id → bool)
#  Prevents double-sending if the route is called twice for the same order.
# ─────────────────────────────────────────────────────────────────────────────
_sent_order_ids: set = set()
_sent_lock = threading.Lock()


# ─────────────────────────────────────────────────────────────────────────────
#  Email address validation
# ─────────────────────────────────────────────────────────────────────────────
_EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')

def _is_valid_email(address: str) -> bool:
    return bool(address and _EMAIL_RE.match(address.strip()))


# ─────────────────────────────────────────────────────────────────────────────
#  SMTP config from env
# ─────────────────────────────────────────────────────────────────────────────
def _get_smtp_config() -> dict:
    return {
        'host':      os.getenv('SMTP_HOST', '').strip(),
        'port':      int(os.getenv('SMTP_PORT', '587')),
        'user':      os.getenv('SMTP_USER', '').strip(),
        'password':  os.getenv('SMTP_PASSWORD', '').strip(),
        'from_name': os.getenv('SMTP_FROM_NAME', 'Sharadha Stores').strip(),
        'use_tls':   os.getenv('SMTP_USE_TLS', 'true').strip().lower() == 'true',
        'use_ssl':   os.getenv('SMTP_USE_SSL', 'false').strip().lower() == 'true',
    }

def _smtp_configured() -> bool:
    cfg = _get_smtp_config()
    return bool(cfg['host'] and cfg['user'] and cfg['password'])


# ─────────────────────────────────────────────────────────────────────────────
#  HTML email template
# ─────────────────────────────────────────────────────────────────────────────
def _build_html(order_id, customer_name, items, shipping_addr,
                payment_method, items_price, tax_price, shipping_price,
                total_price, order_date, order_status):
    """Return a professional HTML email body for an order confirmation."""

    # Build items rows
    items_html = ''
    for item in items:
        items_html += f"""
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e8d9b0;">{item['title']}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e8d9b0;text-align:center;">{item['quantity']}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e8d9b0;text-align:right;">
            ₹{item['price']:.0f}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e8d9b0;text-align:right;font-weight:600;">
            ₹{item['price'] * item['quantity']:.0f}
          </td>
        </tr>"""

    addr_line = ', '.join(filter(None, [
        shipping_addr.get('street', ''),
        shipping_addr.get('city', ''),
        shipping_addr.get('state', ''),
        shipping_addr.get('postalCode', ''),
        shipping_addr.get('country', 'India'),
    ]))

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Order Confirmed — Sharadha Stores</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(0,0,0,0.10);">

        <!-- ── Header ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#0F5132,#1A7A4C);
                     padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#FFF8E7;font-size:28px;letter-spacing:1px;">
              🌿 Sharadha Stores
            </h1>
            <p style="margin:8px 0 0;color:rgba(255,248,231,0.8);font-size:14px;">
              Traditional Handmade Foods from Chennai
            </p>
          </td>
        </tr>

        <!-- ── Confirmation Banner ── -->
        <tr>
          <td style="background:#e8f5e9;padding:24px 40px;text-align:center;
                     border-bottom:3px solid #0F5132;">
            <div style="display:inline-block;background:#0F5132;color:#fff;
                        border-radius:50%;width:52px;height:52px;line-height:52px;
                        font-size:26px;margin-bottom:12px;">✓</div>
            <h2 style="margin:0;color:#0F5132;font-size:22px;font-weight:700;">
              Order Confirmed!
            </h2>
            <p style="margin:8px 0 0;color:#2e7d32;font-size:15px;">
              Thank you, <strong>{customer_name}</strong>!
              Your order has been received and is being prepared.
            </p>
          </td>
        </tr>

        <!-- ── Order Info ── -->
        <tr>
          <td style="padding:28px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#fff8e7;border-radius:8px;border:1px solid #e8d9b0;">
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#5d6b5e;border-bottom:1px solid #e8d9b0;">
                  <strong style="color:#1c2b1e;">Order ID</strong>
                </td>
                <td style="padding:12px 16px;font-size:13px;text-align:right;
                           font-family:monospace;color:#0F5132;font-weight:700;
                           border-bottom:1px solid #e8d9b0;">
                  #{order_id}
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#5d6b5e;border-bottom:1px solid #e8d9b0;">
                  <strong style="color:#1c2b1e;">Order Date</strong>
                </td>
                <td style="padding:12px 16px;font-size:13px;text-align:right;
                           border-bottom:1px solid #e8d9b0;">
                  {order_date}
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#5d6b5e;border-bottom:1px solid #e8d9b0;">
                  <strong style="color:#1c2b1e;">Order Status</strong>
                </td>
                <td style="padding:12px 16px;text-align:right;border-bottom:1px solid #e8d9b0;">
                  <span style="background:#e8f5e9;color:#0F5132;font-weight:700;
                               font-size:12px;padding:3px 10px;border-radius:20px;">
                    {order_status}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#5d6b5e;">
                  <strong style="color:#1c2b1e;">Payment Method</strong>
                </td>
                <td style="padding:12px 16px;font-size:13px;text-align:right;">
                  {payment_method}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Order Items ── -->
        <tr>
          <td style="padding:0 40px 28px;">
            <h3 style="margin:0 0 12px;font-size:16px;color:#0F5132;">🛒 Order Items</h3>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #e8d9b0;border-radius:8px;overflow:hidden;">
              <thead>
                <tr style="background:#0F5132;color:#fff;">
                  <th style="padding:10px 12px;text-align:left;font-size:13px;">Product</th>
                  <th style="padding:10px 12px;text-align:center;font-size:13px;">Qty</th>
                  <th style="padding:10px 12px;text-align:right;font-size:13px;">Price</th>
                  <th style="padding:10px 12px;text-align:right;font-size:13px;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items_html}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- ── Price Summary ── -->
        <tr>
          <td style="padding:0 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#fff8e7;border-radius:8px;border:1px solid #e8d9b0;">
              <tr>
                <td style="padding:10px 16px;font-size:13px;color:#5d6b5e;border-bottom:1px solid #e8d9b0;">
                  Items Total
                </td>
                <td style="padding:10px 16px;text-align:right;border-bottom:1px solid #e8d9b0;">
                  ₹{items_price:.2f}
                </td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:13px;color:#5d6b5e;border-bottom:1px solid #e8d9b0;">
                  GST Tax (5%)
                </td>
                <td style="padding:10px 16px;text-align:right;border-bottom:1px solid #e8d9b0;">
                  ₹{tax_price:.2f}
                </td>
              </tr>
              <tr>
                <td style="padding:10px 16px;font-size:13px;color:#5d6b5e;border-bottom:1px solid #e8d9b0;">
                  Shipping
                </td>
                <td style="padding:10px 16px;text-align:right;border-bottom:1px solid #e8d9b0;">
                  {"FREE" if shipping_price == 0 else f"₹{shipping_price:.2f}"}
                </td>
              </tr>
              <tr>
                <td style="padding:14px 16px;font-size:16px;font-weight:700;color:#0F5132;">
                  Total Payable
                </td>
                <td style="padding:14px 16px;text-align:right;font-size:18px;
                           font-weight:700;color:#0F5132;">
                  ₹{total_price:.2f}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Delivery Address ── -->
        <tr>
          <td style="padding:0 40px 28px;">
            <h3 style="margin:0 0 10px;font-size:16px;color:#0F5132;">📦 Delivery Address</h3>
            <div style="background:#f9f9f9;border:1px solid #e8d9b0;border-radius:8px;
                        padding:14px 16px;font-size:14px;color:#5d6b5e;line-height:1.6;">
              {addr_line or 'Address not available'}
            </div>
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="background:#0F5132;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;color:#fff8e7;font-size:13px;">
              For support, contact us at
              <a href="mailto:support@sharadhastores.com"
                 style="color:#D4AF37;text-decoration:none;">
                support@sharadhastores.com
              </a>
            </p>
            <p style="margin:0;color:rgba(255,248,231,0.6);font-size:12px;">
              © {datetime.utcnow().year} Sharadha Stores. Traditional foods made with love. 🌿
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _build_plain_text(order_id, customer_name, items, shipping_addr,
                      payment_method, items_price, tax_price, shipping_price,
                      total_price, order_date, order_status):
    """Plain-text fallback for email clients that don't render HTML."""
    lines = [
        "=" * 56,
        "  SHARADHA STORES — ORDER CONFIRMED",
        "=" * 56,
        f"Namaste {customer_name}! Your order has been confirmed.",
        "",
        f"Order ID    : #{order_id}",
        f"Date        : {order_date}",
        f"Status      : {order_status}",
        f"Payment     : {payment_method}",
        "",
        "── ORDER ITEMS ─────────────────────────────────────",
    ]
    for item in items:
        lines.append(f"  {item['title']} × {item['quantity']}  —  ₹{item['price'] * item['quantity']:.0f}")
    lines += [
        "",
        "── PRICE SUMMARY ───────────────────────────────────",
        f"  Items Total : ₹{items_price:.2f}",
        f"  GST Tax 5%  : ₹{tax_price:.2f}",
        f"  Shipping    : {'FREE' if shipping_price == 0 else f'₹{shipping_price:.2f}'}",
        f"  TOTAL       : ₹{total_price:.2f}",
        "",
        "── DELIVERY ADDRESS ────────────────────────────────",
        f"  {', '.join(filter(None, [shipping_addr.get('street',''), shipping_addr.get('city',''), shipping_addr.get('state',''), shipping_addr.get('postalCode',''), shipping_addr.get('country','India')]))}",
        "",
        "For support: support@sharadhastores.com",
        "=" * 56,
    ]
    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
#  Core SMTP send (blocking)
# ─────────────────────────────────────────────────────────────────────────────
def _send_via_smtp(to_email: str, subject: str, html_body: str, plain_body: str) -> dict:
    cfg = _get_smtp_config()
    if not _smtp_configured():
        msg = '[Email] SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env'
        logger.warning(msg)
        return {'success': False, 'error': msg}

    from_addr = f"{cfg['from_name']} <{cfg['user']}>"

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = from_addr
    msg['To'] = to_email
    msg['X-Mailer'] = 'Sharadha-Stores/1.0'

    msg.attach(MIMEText(plain_body, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_body,  'html',  'utf-8'))

    try:
        if cfg['use_ssl']:
            server = smtplib.SMTP_SSL(cfg['host'], cfg['port'], timeout=15)
        else:
            server = smtplib.SMTP(cfg['host'], cfg['port'], timeout=15)

        server.ehlo()

        if cfg['use_tls'] and not cfg['use_ssl']:
            server.starttls()
            server.ehlo()

        server.login(cfg['user'], cfg['password'])
        server.sendmail(cfg['user'], [to_email], msg.as_string())
        server.quit()

        logger.info('[Email] ✅ Sent to %s  Subject: %s', to_email, subject)
        return {'success': True, 'to': to_email}

    except smtplib.SMTPAuthenticationError as exc:
        err = f'SMTP authentication failed: {exc}'
        logger.error('[Email] ❌ %s', err)
        return {'success': False, 'error': err}

    except smtplib.SMTPRecipientsRefused as exc:
        err = f'Recipient refused by server: {exc}'
        logger.error('[Email] ❌ %s', err)
        return {'success': False, 'error': err}

    except smtplib.SMTPException as exc:
        err = f'SMTP error: {exc}'
        logger.error('[Email] ❌ %s', err)
        return {'success': False, 'error': err}

    except OSError as exc:
        err = f'Network/connection error: {exc}'
        logger.error('[Email] ❌ %s', err)
        return {'success': False, 'error': err}

    except Exception as exc:
        err = f'Unexpected error sending email: {exc}'
        logger.exception('[Email] ❌ %s', err)
        return {'success': False, 'error': err}


# ─────────────────────────────────────────────────────────────────────────────
#  Public API — send order confirmation (async, non-blocking)
# ─────────────────────────────────────────────────────────────────────────────
def send_order_confirmation_email(order_id, customer_name, customer_email,
                                  items, shipping_addr, payment_method,
                                  items_price, tax_price, shipping_price,
                                  total_price, order_date=None,
                                  order_status='Confirmed'):
    """
    Send a professional order confirmation email asynchronously.

    Returns immediately — email is sent in a background thread.

    Args:
        order_id        : int or str  — DB order ID
        customer_name   : str
        customer_email  : str
        items           : list of dicts with keys: title, quantity, price
        shipping_addr   : dict with keys: street, city, state, postalCode, country
        payment_method  : str
        items_price     : float
        tax_price       : float
        shipping_price  : float
        total_price     : float
        order_date      : str (ISO or formatted) — defaults to now
        order_status    : str — must be 'Confirmed' to trigger send
    """
    # Only send for Confirmed orders
    if order_status != 'Confirmed':
        logger.info('[Email] Skipping email — order %s status is %s (not Confirmed)',
                    order_id, order_status)
        return

    # Validate email address
    if not _is_valid_email(customer_email):
        logger.warning('[Email] Invalid email address for order %s: %r',
                       order_id, customer_email)
        return

    # Duplicate prevention
    key = str(order_id)
    with _sent_lock:
        if key in _sent_order_ids:
            logger.info('[Email] Duplicate suppressed for order %s', order_id)
            return
        _sent_order_ids.add(key)

    # Format date
    if not order_date:
        order_date = datetime.utcnow().strftime('%d %B %Y, %I:%M %p UTC')

    subject = f"✅ Order Confirmed — #{order_id} | Sharadha Stores"

    html_body  = _build_html(order_id, customer_name, items, shipping_addr,
                              payment_method, items_price, tax_price,
                              shipping_price, total_price, order_date, order_status)
    plain_body = _build_plain_text(order_id, customer_name, items, shipping_addr,
                                   payment_method, items_price, tax_price,
                                   shipping_price, total_price, order_date, order_status)

    def _bg():
        result = _send_via_smtp(customer_email, subject, html_body, plain_body)
        if not result['success']:
            logger.error('[Email] Failed for order %s: %s', order_id, result.get('error'))
            # Remove from dedup set so a retry is possible
            with _sent_lock:
                _sent_order_ids.discard(key)

    t = threading.Thread(target=_bg, daemon=True, name=f'email-order-{order_id}')
    t.start()
    logger.info('[Email] 📧 Queued confirmation email for order %s → %s',
                order_id, customer_email)


# ─────────────────────────────────────────────────────────────────────────────
#  Test utility — verify SMTP credentials without placing an order
# ─────────────────────────────────────────────────────────────────────────────
def send_test_email(to_email: str) -> dict:
    """
    Send a simple test email to verify SMTP configuration.
    Returns { success: bool, error?: str }.
    """
    if not _is_valid_email(to_email):
        return {'success': False, 'error': f'Invalid email address: {to_email!r}'}

    cfg = _get_smtp_config()
    if not _smtp_configured():
        return {
            'success': False,
            'error': 'SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in .env',
        }

    now = datetime.utcnow().strftime('%d %B %Y, %I:%M %p UTC')
    subject = '🌿 Sharadha Stores — SMTP Test Email'
    html_body = f"""<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;padding:40px;background:#f5f5f5;">
  <div style="max-width:500px;margin:auto;background:#fff;padding:32px;
               border-radius:12px;border-top:4px solid #0F5132;">
    <h2 style="color:#0F5132;margin-top:0;">✅ SMTP Connection Verified</h2>
    <p>This test email confirms that <strong>Sharadha Stores</strong> email
       service is correctly configured.</p>
    <table style="width:100%;font-size:13px;color:#555;">
      <tr><td style="padding:6px 0;"><strong>Host</strong></td>
          <td>{cfg['host']}:{cfg['port']}</td></tr>
      <tr><td style="padding:6px 0;"><strong>From</strong></td>
          <td>{cfg['user']}</td></tr>
      <tr><td style="padding:6px 0;"><strong>TLS</strong></td>
          <td>{'STARTTLS' if cfg['use_tls'] else ('SSL' if cfg['use_ssl'] else 'None')}</td></tr>
      <tr><td style="padding:6px 0;"><strong>Sent At</strong></td>
          <td>{now}</td></tr>
    </table>
    <p style="margin-top:20px;font-size:12px;color:#999;">
      Order confirmation emails will now be sent automatically for every new
      confirmed order. 🌿
    </p>
  </div>
</body></html>"""

    plain_body = (
        f"SHARADHA STORES — SMTP TEST\n"
        f"SMTP Host    : {cfg['host']}:{cfg['port']}\n"
        f"Sender       : {cfg['user']}\n"
        f"Sent At      : {now}\n\n"
        "SMTP connection verified successfully."
    )

    return _send_via_smtp(to_email, subject, html_body, plain_body)
