import Document from '../models/Document.js';
import Product from '../models/Product.js';
import cloudinary from '../config/cloudinary.js';
import env from '../config/env.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';
import { fileToDocFields } from '../middleware/upload.js';

// POST /api/documents  (multipart: file + optional product, title, type)
export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const { product, title, type } = req.body;

  if (product) {
    const owns = await Product.exists({ _id: product, owner: req.user._id });
    if (!owns) throw new ApiError(404, 'Product not found');
  }

  const fileFields = await fileToDocFields(req.file);
  const doc = await Document.create({
    owner: req.user._id,
    product: product || undefined,
    title: title || req.file.originalname,
    type: type || 'other',
    ...fileFields,
  });

  res.status(201).json({ document: doc });
});

// GET /api/documents?product=:id
export const listDocuments = asyncHandler(async (req, res) => {
  const filter = { owner: req.user._id };
  if (req.query.product) filter.product = req.query.product;
  if (req.query.type) filter.type = req.query.type;
  const documents = await Document.find(filter).sort('-createdAt');
  res.json({ documents });
});

// DELETE /api/documents/:id
export const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, owner: req.user._id });
  if (!doc) throw new ApiError(404, 'Document not found');

  if (doc.storage === 'cloudinary' && doc.publicId && env.cloudinary.enabled) {
    try {
      await cloudinary.uploader.destroy(doc.publicId, { resource_type: 'auto' });
    } catch (err) {
      console.warn('Cloudinary delete failed:', err.message);
    }
  }
  await doc.deleteOne();
  res.json({ message: 'Document deleted' });
});
