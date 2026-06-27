import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} from '../utils/token.js';

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

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required');
  }
  if (password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'Email already in use');

  const user = await User.findById(
    (await User.create({ name, email, password }))._id
  ).select('+refreshTokens');

  const accessToken = await issueTokens(user, res);
  res.status(201).json({ user, accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password +refreshTokens'
  );
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid credentials');

  const accessToken = await issueTokens(user, res);
  res.json({ user, accessToken });
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
