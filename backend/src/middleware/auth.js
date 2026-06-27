import { verifyAccessToken } from '../utils/token.js';
import { ApiError } from '../utils/asyncHandler.js';
import User from '../models/User.js';

// Requires a valid access token in the Authorization header.
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Not authenticated');

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub);
    if (!user) throw new ApiError(401, 'User no longer exists');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Access token expired'));
    }
    next(new ApiError(401, 'Not authenticated'));
  }
}

// Restricts a route to specific roles, e.g. requireRole('admin').
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden: insufficient permissions'));
  }
  next();
};
