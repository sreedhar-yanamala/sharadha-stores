import nodemailer from 'nodemailer';

// ─────────────────────────────────────────────────────────────────────────────
// Transporter – Gmail SMTP
// To switch providers, change host/port/auth values below.
// e.g. Outlook: host: 'smtp.office365.com', port: 587
//      SendGrid: host: 'smtp.sendgrid.net', port: 587
// ─────────────────────────────────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',          // Change to 'hotmail', 'yahoo', etc. or use host/port below
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,             // true for port 465, false for 587 (STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// sendEmail – core helper
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {string} to       – Recipient email address
 * @param {string} subject  – Email subject line
 * @param {string} html     – HTML body content
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export const sendEmail = async (to, subject, html) => {
  try {
    // Validate that env vars are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER or EMAIL_PASS is not set in environment variables');
    }
    if (!process.env.EMAIL_USER.includes('@') || process.env.EMAIL_USER === 'your_gmail@gmail.com') {
      console.warn('[EmailService] ⚠️  EMAIL_USER is not configured. Email not sent.');
      return { success: false, error: 'Email credentials not configured' };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || `Sharadha Stores <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    console.log(`[EmailService] 📧 Sending email to: ${to} | Subject: "${subject}"`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] ✅ Email sent successfully | MessageId: ${info.messageId}`);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] ❌ Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// verifyTransporter – useful for health-check / startup verification
// ─────────────────────────────────────────────────────────────────────────────
export const verifyTransporter = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('[EmailService] ✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.warn('[EmailService] ⚠️  SMTP connection failed:', error.message);
    return false;
  }
};
