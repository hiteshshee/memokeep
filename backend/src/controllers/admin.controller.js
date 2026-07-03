import User from '../models/User.js';
import Product from '../models/Product.js';
import Document from '../models/Document.js';
import Vault from '../models/Vault.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Build an { ownerId: count } map from an aggregation's grouped rows.
const countMap = (rows) =>
  rows.reduce((m, r) => {
    m[String(r._id)] = r.n;
    return m;
  }, {});

const sumValues = (map) => Object.values(map).reduce((a, b) => a + b, 0);

// GET /api/admin/users — every user plus live product/document/vault counts.
// Admin-only (gated by requireRole('admin') on the route).
export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort('-createdAt').lean();

  // One grouped count per collection, then joined onto users in memory —
  // avoids an N+1 count query per user.
  const [products, documents, vault] = await Promise.all([
    Product.aggregate([{ $group: { _id: '$owner', n: { $sum: 1 } } }]),
    Document.aggregate([{ $group: { _id: '$owner', n: { $sum: 1 } } }]),
    Vault.aggregate([{ $group: { _id: '$owner', n: { $sum: 1 } } }]),
  ]);

  const p = countMap(products);
  const d = countMap(documents);
  const v = countMap(vault);

  const rows = users.map((u) => {
    const id = String(u._id);
    return {
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      isVerified: u.isVerified,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt || null,
      products: p[id] || 0,
      documents: d[id] || 0,
      vault: v[id] || 0,
    };
  });

  res.json({
    users: rows,
    totals: {
      users: rows.length,
      products: sumValues(p),
      documents: sumValues(d),
      vault: sumValues(v),
    },
  });
});
