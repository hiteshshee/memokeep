import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import User from '../models/User.js';
import env from '../config/env.js';
import { sendOtpEmail } from '../config/mailer.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} from '../utils/token.js';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;

// Generate a fresh 6-digit OTP, store its hash + expiry on the user, return the
// plain code (to be emailed). Does NOT save — caller persists.
async function assignOtp(user) {
  const otp = String(crypto.randomInt(100000, 1000000)); // 6 digits
  user.otpHash = await bcrypt.hash(otp, 10);
  user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  return otp;
}

// In dev without email configured, return the OTP in the response so the flow
// is testable. Never leaked once real email credentials are set, or in prod.
const devOtpField = (otp) =>
  env.nodeEnv !== 'production' && !env.email.enabled ? { devOtp: otp } : {};

// Issue a fresh access+refresh pair and persist a hashed refresh token.
async function issueTokens(user, res) {
  const payload = { sub: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const hashed = await bcrypt.hash(refreshToken, 10);
  user.refreshTokens.push(hashed);
  // Keep at most 5 active sessions.
  if (user.refreshTokens.length > 5) user.refreshTokens.shift();
  await user.save();

  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  return accessToken;
}

// Step 1 of signup: create (or refresh) an UNVERIFIED account and email an OTP.
// No tokens are issued until the OTP is verified.
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required');
  }
  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

  const normalized = email.toLowerCase().trim();
  let user = await User.findOne({ email: normalized }).select('+password +otpHash +otpExpires +otpAttempts');

  if (user && user.isVerified) throw new ApiError(409, 'Email already in use');

  if (!user) {
    user = new User({ name, email: normalized, password });
  } else {
    // Re-registering an unverified email — refresh their details + send a new code.
    user.name = name;
    user.password = password; // re-hashed by the model's pre-save hook
  }

  const otp = await assignOtp(user);
  await user.save();
  await sendOtpEmail(normalized, name, otp);

  res.status(200).json({
    requiresVerification: true,
    email: normalized,
    message: 'We sent a 6-digit code to your email.',
    ...devOtpField(otp),
  });
});

// Step 2 of signup: check the OTP, mark verified, and log the user in.
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, 'Email and code are required');
  const normalized = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalized }).select(
    '+otpHash +otpExpires +otpAttempts +refreshTokens'
  );
  if (!user) throw new ApiError(404, 'Account not found');
  if (user.isVerified) throw new ApiError(400, 'Email already verified — please log in');
  if (!user.otpHash || !user.otpExpires) throw new ApiError(400, 'No code pending — request a new one');
  if (user.otpExpires.getTime() < Date.now()) throw new ApiError(400, 'Code expired — request a new one');
  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) throw new ApiError(429, 'Too many attempts — request a new code');

  const ok = await bcrypt.compare(String(otp).trim(), user.otpHash);
  if (!ok) {
    user.otpAttempts += 1;
    await user.save();
    throw new ApiError(400, 'Incorrect code');
  }

  user.isVerified = true;
  user.otpHash = null;
  user.otpExpires = null;
  user.otpAttempts = 0;
  const accessToken = await issueTokens(user, res); // persists the changes
  res.status(201).json({ user, accessToken });
});

// Resend a fresh OTP to an unverified account.
export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, 'Email is required');
  const normalized = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalized }).select('+otpHash +otpExpires +otpAttempts');
  if (!user) throw new ApiError(404, 'Account not found');
  if (user.isVerified) throw new ApiError(400, 'Email already verified — please log in');

  const otp = await assignOtp(user);
  await user.save();
  await sendOtpEmail(normalized, user.name, otp);
  res.json({ message: 'A new code has been sent.', ...devOtpField(otp) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+password +refreshTokens +otpHash +otpExpires +otpAttempts'
  );
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid credentials');

  // Unverified accounts can't log in — issue a fresh OTP and send them to verify.
  if (!user.isVerified) {
    const otp = await assignOtp(user);
    await user.save();
    await sendOtpEmail(user.email, user.name, otp);
    return res.status(403).json({
      requiresVerification: true,
      email: user.email,
      message: 'Please verify your email — we sent you a new code.',
      ...devOtpField(otp),
    });
  }

  const accessToken = await issueTokens(user, res);
  return res.json({ user, accessToken });
});

// Rotate refresh token: validate the cookie, drop the old one, issue a new pair.
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await User.findById(decoded.sub).select('+refreshTokens');
  if (!user) throw new ApiError(401, 'User not found');

  // Find which stored hash matches this token.
  let matchedIndex = -1;
  for (let i = 0; i < user.refreshTokens.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    if (await bcrypt.compare(token, user.refreshTokens[i])) {
      matchedIndex = i;
      break;
    }
  }
  if (matchedIndex === -1) throw new ApiError(401, 'Refresh token revoked');

  user.refreshTokens.splice(matchedIndex, 1); // rotate out the used token
  const accessToken = await issueTokens(user, res);
  res.json({ user, accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await User.findById(decoded.sub).select('+refreshTokens');
      if (user) {
        const kept = [];
        for (const hash of user.refreshTokens) {
          // eslint-disable-next-line no-await-in-loop
          if (!(await bcrypt.compare(token, hash))) kept.push(hash);
        }
        user.refreshTokens = kept;
        await user.save();
      }
    } catch {
      /* ignore invalid token on logout */
    }
  }
  res.clearCookie('refreshToken', { ...refreshCookieOptions, maxAge: undefined });
  res.json({ message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
