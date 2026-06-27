import Product from '../models/Product.js';
import Document from '../models/Document.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/dashboard  -> summary stats for the logged-in user
export const getDashboard = asyncHandler(async (req, res) => {
  const owner = req.user._id;
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(now.getDate() + 30);

  const [
    productCount,
    documentCount,
    expiringWarranties,
    valueAgg,
    byCategory,
    recentProducts,
  ] = await Promise.all([
    Product.countDocuments({ owner }),
    Document.countDocuments({ owner }),
    Product.find({
      owner,
      warrantyExpiry: { $gte: now, $lte: in30Days },
    })
      .select('name warrantyExpiry brand category')
      .sort('warrantyExpiry')
      .limit(10),
    Product.aggregate([
      { $match: { owner } },
      { $group: { _id: null, total: { $sum: '$purchasePrice' } } },
    ]),
    Product.aggregate([
      { $match: { owner } },
      { $group: { _id: '$category', count: { $sum: 1 }, value: { $sum: '$purchasePrice' } } },
      { $sort: { count: -1 } },
    ]),
    Product.find({ owner }).sort('-createdAt').limit(5).select('name category coverImage createdAt'),
  ]);

  res.json({
    stats: {
      productCount,
      documentCount,
      expiringCount: expiringWarranties.length,
      totalValue: valueAgg[0]?.total || 0,
    },
    expiringWarranties,
    byCategory,
    recentProducts,
  });
});
