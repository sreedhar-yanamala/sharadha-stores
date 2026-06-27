// ─────────────────────────────────────────────────────────────────────────────
// Sharadha Stores – Professional HTML Email Templates
// Brand colours: Saffron #E8821A | Deep Brown #4A2C0A | Cream #FFF8F0
// ─────────────────────────────────────────────────────────────────────────────

const baseStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; background: #f5f0eb; color: #333; }
    .wrapper { max-width: 620px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 32px rgba(74,44,10,0.12); }
    .header { background: linear-gradient(135deg, #E8821A 0%, #c96a0e 60%, #4A2C0A 100%); padding: 36px 40px; text-align: center; }
    .logo-text { font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: 1px; }
    .logo-sub { font-size: 12px; color: rgba(255,255,255,0.80); letter-spacing: 3px; text-transform: uppercase; margin-top: 4px; }
    .body { padding: 40px; }
    .greeting { font-size: 22px; font-weight: 600; color: #4A2C0A; margin-bottom: 12px; }
    .text { font-size: 15px; line-height: 1.7; color: #555; margin-bottom: 20px; }
    .highlight-box { background: #FFF8F0; border-left: 4px solid #E8821A; border-radius: 8px; padding: 18px 22px; margin: 24px 0; }
    .highlight-box p { font-size: 14px; color: #4A2C0A; line-height: 1.6; }
    .btn { display: inline-block; background: linear-gradient(135deg, #E8821A, #c96a0e); color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 600; font-size: 15px; margin: 8px 0; }
    .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
    .order-table th { background: #FFF8F0; color: #4A2C0A; padding: 10px 14px; text-align: left; font-weight: 600; border-bottom: 2px solid #E8821A; }
    .order-table td { padding: 10px 14px; border-bottom: 1px solid #f0e8df; color: #555; }
    .order-table tr:last-child td { border-bottom: none; }
    .total-row td { font-weight: 700; color: #4A2C0A; font-size: 15px; background: #FFF8F0; }
    .otp-box { text-align: center; margin: 28px 0; }
    .otp-code { display: inline-block; font-size: 40px; font-weight: 700; letter-spacing: 14px; color: #E8821A; background: #FFF8F0; border: 2px dashed #E8821A; border-radius: 12px; padding: 18px 32px; }
    .otp-expiry { font-size: 13px; color: #999; margin-top: 12px; }
    .divider { border: none; border-top: 1px solid #f0e8df; margin: 28px 0; }
    .footer { background: #4A2C0A; padding: 28px 40px; text-align: center; }
    .footer p { font-size: 12px; color: rgba(255,255,255,0.65); line-height: 1.8; }
    .footer a { color: #E8821A; text-decoration: none; }
    .badge { display: inline-block; background: #E8821A; color: #fff; font-size: 12px; font-weight: 600; padding: 3px 12px; border-radius: 50px; margin-left: 8px; vertical-align: middle; }
    @media (max-width: 600px) {
      .wrapper { margin: 0; border-radius: 0; }
      .body { padding: 24px 20px; }
      .header { padding: 28px 20px; }
      .otp-code { font-size: 28px; letter-spacing: 8px; padding: 14px 20px; }
    }
  </style>
`;

const headerHTML = `
  <div class="header">
    <div class="logo-text">🛍️ Sharadha Stores</div>
    <div class="logo-sub">Premium Quality · Authentic Taste</div>
  </div>
`;

const footerHTML = `
  <div class="footer">
    <p>© ${new Date().getFullYear()} Sharadha Stores. All rights reserved.</p>
    <p style="margin-top:6px;">
      <a href="mailto:support@sharadha.com">support@sharadha.com</a> &nbsp;|&nbsp;
      <a href="#">www.sharadha.com</a>
    </p>
    <p style="margin-top:8px; font-size:11px;">
      If you did not create an account with us, you can safely ignore this email.
    </p>
  </div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. Welcome Email – sent on successful registration
// ─────────────────────────────────────────────────────────────────────────────
export const welcomeEmailTemplate = (name) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyle}</head>
<body>
  <div class="wrapper">
    ${headerHTML}
    <div class="body">
      <p class="greeting">Welcome aboard, ${name}! 🎉</p>
      <p class="text">
        We're thrilled to have you as part of the <strong>Sharadha Stores</strong> family.
        Your account has been created successfully and you're ready to explore our wide range
        of authentic South Indian products.
      </p>
      <div class="highlight-box">
        <p>✅ &nbsp;<strong>Account created</strong> with email registered</p>
        <p>🛒 &nbsp;Browse hundreds of authentic products</p>
        <p>🚚 &nbsp;Fast & reliable delivery across India</p>
        <p>🎁 &nbsp;Exclusive member discounts & offers</p>
      </div>
      <p class="text">
        Start exploring our curated collection of spices, pickles, papads, and more —
        crafted with tradition and delivered to your doorstep.
      </p>
      <div style="text-align:center; margin: 28px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="btn">Start Shopping →</a>
      </div>
      <hr class="divider"/>
      <p class="text" style="font-size:13px; color:#999;">
        Need help? Reach us at <a href="mailto:support@sharadha.com" style="color:#E8821A;">support@sharadha.com</a>
      </p>
    </div>
    ${footerHTML}
  </div>
</body>
</html>`;

// ─────────────────────────────────────────────────────────────────────────────
// 2. Order Confirmation Email – sent after successful order placement
// ─────────────────────────────────────────────────────────────────────────────
export const orderConfirmationTemplate = (name, orderId, items, totalPrice, shippingAddress) => {
  const itemRows = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">₹${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const addressStr = shippingAddress
    ? `${shippingAddress.address || ''}, ${shippingAddress.city || ''}, ${shippingAddress.state || ''} – ${shippingAddress.postalCode || ''}`
    : 'Address on file';

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyle}</head>
<body>
  <div class="wrapper">
    ${headerHTML}
    <div class="body">
      <p class="greeting">Order Confirmed! 🎊</p>
      <p class="text">
        Hi <strong>${name}</strong>, thank you for your order!
        We've received it and it's being prepared with care.
      </p>
      <div class="highlight-box">
        <p><strong>Order ID:</strong> &nbsp;#${orderId}</p>
        <p style="margin-top:6px;"><strong>Delivery Address:</strong> &nbsp;${addressStr}</p>
      </div>

      <table class="order-table">
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr class="total-row">
            <td colspan="2"><strong>Total Paid</strong></td>
            <td style="text-align:right"><strong>₹${Number(totalPrice).toFixed(2)}</strong></td>
          </tr>
        </tbody>
      </table>

      <p class="text">
        You'll receive another notification once your order is shipped.
        Track your order anytime from your <strong>My Orders</strong> section.
      </p>
      <div style="text-align:center; margin: 24px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders" class="btn">View My Orders →</a>
      </div>
      <hr class="divider"/>
      <p class="text" style="font-size:13px; color:#999;">
        Questions? Contact us at <a href="mailto:support@sharadha.com" style="color:#E8821A;">support@sharadha.com</a>
      </p>
    </div>
    ${footerHTML}
  </div>
</body>
</html>`;
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Password Reset OTP Email
// ─────────────────────────────────────────────────────────────────────────────
export const passwordResetOTPTemplate = (name, otp) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">${baseStyle}</head>
<body>
  <div class="wrapper">
    ${headerHTML}
    <div class="body">
      <p class="greeting">Password Reset Request 🔐</p>
      <p class="text">
        Hi <strong>${name}</strong>, we received a request to reset your Sharadha Stores password.
        Use the OTP below to proceed. This code is valid for <strong>5 minutes</strong>.
      </p>

      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <p class="otp-expiry">⏳ This OTP expires in 5 minutes</p>
      </div>

      <div class="highlight-box">
        <p>🔒 &nbsp;Never share this OTP with anyone, including Sharadha Stores support.</p>
        <p style="margin-top:6px;">🚫 &nbsp;If you did not request a password reset, ignore this email — your account is safe.</p>
      </div>

      <p class="text">
        Enter this OTP on the password reset page to create your new password.
        For security, the OTP can only be used once.
      </p>
      <hr class="divider"/>
      <p class="text" style="font-size:13px; color:#999;">
        Need help? <a href="mailto:support@sharadha.com" style="color:#E8821A;">Contact Support</a>
      </p>
    </div>
    ${footerHTML}
  </div>
</body>
</html>`;
