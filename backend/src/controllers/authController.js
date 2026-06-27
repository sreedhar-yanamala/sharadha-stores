import crypto from 'crypto';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/emailService.js';
import {
  welcomeEmailTemplate,
  passwordResetOTPTemplate,
} from '../utils/emailTemplates.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

/** Generate a cryptographically random 6-digit OTP */
const generateOTP = () =>
  String(Math.floor(100000 + crypto.randomInt(900000))).padStart(6, '0');

/** Hash OTP with SHA-256 before storing (so raw OTP is never in DB) */
const hashOTP = (otp) =>
  crypto.createHash('sha256').update(otp).digest('hex');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      // Mark online
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save({ validateBeforeSave: false });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register a new user + send welcome email
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password });

    if (user) {
      // ── Send welcome email (non-blocking – won't fail registration) ──────
      sendEmail(email, '🎉 Welcome to Sharadha Stores!', welcomeEmailTemplate(name))
        .then((result) => {
          if (result.success) {
            console.log(`[Auth] ✅ Welcome email sent to ${email}`);
          } else {
            console.warn(`[Auth] ⚠️  Welcome email failed for ${email}: ${result.error}`);
          }
        })
        .catch((err) => console.error('[Auth] Welcome email error:', err.message));

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses,
        token: generateToken(user._id),
        emailSent: true,
        message: 'Registration successful! A welcome email has been sent to your inbox.',
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.password) user.password = req.body.password;
      if (req.body.addresses) user.addresses = req.body.addresses;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        addresses: updatedUser.addresses,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Forgot Password – generate OTP & send via email
// @route   POST /api/auth/forgot-password
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account registered with this email address' });
    }

    // ── 60-second resend cooldown check ─────────────────────────────────────
    if (user.otpExpiry && user.otpExpiry > new Date()) {
      const remaining = Math.ceil((user.otpExpiry - new Date() - 4 * 60 * 1000) / 1000);
      if (remaining > 0) {
        return res.status(429).json({
          message: `Please wait ${remaining} seconds before requesting a new OTP.`,
          cooldown: remaining,
        });
      }
    }

    // ── Generate & store hashed OTP ──────────────────────────────────────────
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.otp = hashOTP(otp);
    user.otpExpiry = otpExpiry;
    await user.save({ validateBeforeSave: false });

    // ── Send OTP email ───────────────────────────────────────────────────────
    const emailResult = await sendEmail(
      email,
      '🔐 Your Sharadha Stores Password Reset OTP',
      passwordResetOTPTemplate(user.name, otp)
    );

    if (!emailResult.success) {
      console.error(`[Auth] OTP email failed for ${email}:`, emailResult.error);
      return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
    }

    console.log(`[Auth] ✅ OTP sent to ${email} | Expires: ${otpExpiry}`);
    res.json({
      message: 'OTP sent successfully to your email address.',
      emailSent: true,
      expiresIn: 300, // seconds
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // ── Check expiry ─────────────────────────────────────────────────────────
    if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // ── Verify hash match ────────────────────────────────────────────────────
    const hashedInput = hashOTP(String(otp).trim());
    if (hashedInput !== user.otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }

    // ── OTP valid – issue a short-lived reset token ───────────────────────────
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    // Clear OTP from DB after successful verification
    user.otp = null;
    user.otpExpiry = null;
    await user.save({ validateBeforeSave: false });

    console.log(`[Auth] ✅ OTP verified for ${email}`);
    res.json({
      message: 'OTP verified successfully.',
      resetToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Resend OTP (with 60-second cooldown)
// @route   POST /api/auth/resend-otp
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // ── 60-second cooldown: OTP created less than 60s ago? ─────────────────
    if (user.otpExpiry) {
      const createdAt = new Date(user.otpExpiry.getTime() - 5 * 60 * 1000);
      const elapsed = (Date.now() - createdAt.getTime()) / 1000;
      if (elapsed < 60) {
        const wait = Math.ceil(60 - elapsed);
        return res.status(429).json({
          message: `Please wait ${wait} seconds before resending OTP.`,
          cooldown: wait,
        });
      }
    }

    // ── Generate new OTP ─────────────────────────────────────────────────────
    const otp = generateOTP();
    user.otp = hashOTP(otp);
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const emailResult = await sendEmail(
      email,
      '🔐 Your New Sharadha Stores OTP',
      passwordResetOTPTemplate(user.name, otp)
    );

    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to resend OTP. Please try again.' });
    }

    console.log(`[Auth] ✅ OTP resent to ${email}`);
    res.json({ message: 'New OTP sent to your email.', emailSent: true, expiresIn: 300 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Reset Password using reset token (issued after OTP verify)
// @route   POST /api/auth/reset-password
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;
  try {
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // ── Verify the reset token ──────────────────────────────────────────────
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: 'Reset token is invalid or has expired' });
    }

    if (decoded.purpose !== 'password-reset') {
      return res.status(401).json({ message: 'Invalid reset token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    console.log(`[Auth] ✅ Password reset successfully for ${user.email}`);
    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password -otp -otpExpiry');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// @desc    Mark user offline on explicit logout
// @route   POST /api/auth/logout
// @access  Private
// ───────────────────────────────────────────────────────────────────────────────
export const logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.isOnline = false;
      user.lastSeen = new Date();
      await user.save({ validateBeforeSave: false });
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// @desc    Heartbeat — keep session alive, refresh last_seen
// @route   POST /api/auth/heartbeat
// @access  Private
// ───────────────────────────────────────────────────────────────────────────────
export const heartbeatUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });
    res.json({ isOnline: true, lastSeen: user.lastSeen });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

