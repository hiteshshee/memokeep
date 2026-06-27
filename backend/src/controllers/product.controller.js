import Product from '../models/Product.js';
import Document from '../models/Document.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

// GET /api/products  (with search, filter, sort, pagination)
export const listProducts = asyncHandler(async (req, res) => {
  const { q, category, sort = '-createdAt', page = 1, limit = 20 } = req.query;
  const filter = { owner: req.user._id };

  if (category) filter.category = category;
  if (q) filter.$text = { $search: q };

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, pages: Math.ceil(total / limitNum) });
});

// GET /api/products/:id  (with its documents)
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });
  if (!product) throw new ApiError(404, 'Product not found');

  const documents = await Document.find({ product: product._id, owner: req.user._id }).sort(
    '-createdAt'
  );
  res.json({ product, documents });
});

// POST /api/products
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ product });
});

// PUT /api/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, owner: req.user._id });
  if (!product) throw new ApiError(404, 'Product not found');

  const allowed = [
    'name', 'category', 'brand', 'model', 'serialNumber', 'purchaseDate',
    'purchasePrice', 'purchasedFrom', 'warrantyMonths', 'notes', 'coverImage',
    'images', 'tags',
  ];
  for (const key of allowed) {
    if (key in req.body) product[key] = req.body[key];
  }
  await product.save();
  res.json({ product });
});

// DELETE /api/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!product) throw new ApiError(404, 'Product not found');

  // Clean up associated document records (files cleaned separately).
  await Document.deleteMany({ product: product._id, owner: req.user._id });
  res.json({ message: 'Product deleted' });
});
