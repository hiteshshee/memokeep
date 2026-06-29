import Product from '../models/Product.js';
import Document from '../models/Document.js';
import Vault from '../models/Vault.js';
import Subscription from '../models/Subscription.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const PER_MONTH = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };

// GET /api/dashboard  -> summary stats for the logged-in user
export const getDashboard = asyncHandler(async (req, res) => {
  const owner = req.user._id;
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(now.getDate() + 30);
  const soon = { $gte: now, $lte: in30Days };

  const [
    productCount,
    documentCount,
    vaultCount,
    expiringWarranties,
    valueAgg,
    byCategory,
    recentProducts,
    vaultExpiring,
    subs,
  ] = await Promise.all([
    Product.countDocuments({ owner }),
    Document.countDocuments({ owner }),
    Vault.countDocuments({ owner }),
    Product.find({ owner, warrantyExpiry: soon }).select('name warrantyExpiry brand category').sort('warrantyExpiry').limit(20),
    Product.aggregate([{ $match: { owner } }, { $group: { _id: null, total: { $sum: '$purchasePrice' } } }]),
    Product.aggregate([
      { $match: { owner } },
      { $group: { _id: '$category', count: { $sum: 1 }, value: { $sum: '$purchasePrice' } } },
      { $sort: { count: -1 } },
    ]),
    Product.find({ owner }).sort('-createdAt').limit(5).select('name category coverImage createdAt'),
    Vault.find({ owner, expiryDate: soon }).select('title type expiryDate').sort('expiryDate').limit(20),
    Subscription.find({ owner, isActive: true }).select('name amount billingCycle nextRenewal'),
  ]);

  const monthlySpend = subs.reduce((sum, s) => sum + (s.amount || 0) * (PER_MONTH[s.billingCycle] || 1), 0);

  // One unified "coming up" feed across warranties, documents & subscriptions.
  const comingUp = [];
  expiringWarranties.forEach((p) =>
    comingUp.push({ kind: 'warranty', title: p.name, sub: p.brand || p.category, date: p.warrantyExpiry, link: `/products/${p._id}` }));
  vaultExpiring.forEach((v) =>
    comingUp.push({ kind: 'document', title: v.title, sub: v.type, date: v.expiryDate, link: '/vault' }));
  subs.forEach((s) => {
    if (s.nextRenewal && s.nextRenewal >= now && s.nextRenewal <= in30Days) {
      comingUp.push({ kind: 'subscription', title: s.name, sub: `₹${s.amount}/${s.billingCycle}`, date: s.nextRenewal, link: '/subscriptions' });
    }
  });
  comingUp.sort((a, b) => new Date(a.date) - new Date(b.date));

  res.json({
    stats: {
      productCount,
      documentCount,
      vaultCount,
      subscriptionCount: subs.length,
      monthlySpend,
      expiringCount: comingUp.length,
      totalValue: valueAgg[0]?.total || 0,
    },
    comingUp: comingUp.slice(0, 8),
    expiringWarranties,
    byCategory,
    recentProducts,
  });
});
