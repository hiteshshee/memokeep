import Vault from '../models/Vault.js';
import cloudinary from '../config/cloudinary.js';
import env from '../config/env.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';
import { fileToDocFields } from '../middleware/upload.js';

const EDITABLE = ['type', 'title', 'holder', 'identifier', 'issuedDate', 'expiryDate', 'notes'];

function pickFields(body) {
  const out = {};
  for (const k of EDITABLE) {
    if (body[k] === undefined) continue;
    if ((k === 'issuedDate' || k === 'expiryDate') && body[k] === '') {
      out[k] = null; // allow clearing a date
      continue;
    }
    out[k] = body[k];
  }
  return out;
}

async function destroyFile(item) {
  if (item.storage === 'cloudinary' && item.publicId && env.cloudinary.enabled) {
    try {
      await cloudinary.uploader.destroy(item.publicId, { resource_type: 'auto' });
    } catch (err) {
      console.warn('Cloudinary delete failed:', err.message);
    }
  }
}

// GET /api/vault
export const listVault = asyncHandler(async (req, res) => {
  const items = await Vault.find({ owner: req.user._id }).sort('expiryDate');
  res.json({ items });
});

// GET /api/vault/:id
export const getVaultItem = asyncHandler(async (req, res) => {
  const item = await Vault.findOne({ _id: req.params.id, owner: req.user._id });
  if (!item) throw new ApiError(404, 'Document not found');
  res.json({ item });
});

// POST /api/vault  (multipart: optional file)
export const createVaultItem = asyncHandler(async (req, res) => {
  const data = pickFields(req.body);
  if (!data.title) throw new ApiError(400, 'Title is required');
  if (req.file) Object.assign(data, await fileToDocFields(req.file));
  const item = await Vault.create({ owner: req.user._id, ...data });
  res.status(201).json({ item });
});

// PUT /api/vault/:id  (multipart: optional new file replaces the old)
export const updateVaultItem = asyncHandler(async (req, res) => {
  const item = await Vault.findOne({ _id: req.params.id, owner: req.user._id });
  if (!item) throw new ApiError(404, 'Document not found');

  Object.assign(item, pickFields(req.body));
  if (req.file) {
    await destroyFile(item);
    Object.assign(item, await fileToDocFields(req.file));
  }
  await item.save();
  res.json({ item });
});

// DELETE /api/vault/:id
export const deleteVaultItem = asyncHandler(async (req, res) => {
  const item = await Vault.findOne({ _id: req.params.id, owner: req.user._id });
  if (!item) throw new ApiError(404, 'Document not found');
  await destroyFile(item);
  await item.deleteOne();
  res.json({ message: 'Document deleted' });
});
