import Subscription from '../models/Subscription.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

const EDITABLE = ['name', 'category', 'amount', 'currency', 'billingCycle', 'nextRenewal', 'isActive', 'notes'];

function pickFields(body) {
  const out = {};
  for (const k of EDITABLE) {
    if (body[k] === undefined) continue;
    if (k === 'nextRenewal' && body[k] === '') {
      out[k] = null;
      continue;
    }
    if (k === 'amount') {
      out[k] = Number(body[k]) || 0;
      continue;
    }
    out[k] = body[k];
  }
  return out;
}

// GET /api/subscriptions
export const listSubscriptions = asyncHandler(async (req, res) => {
  const items = await Subscription.find({ owner: req.user._id }).sort('nextRenewal');
  res.json({ items });
});

// POST /api/subscriptions
export const createSubscription = asyncHandler(async (req, res) => {
  const data = pickFields(req.body);
  if (!data.name) throw new ApiError(400, 'Name is required');
  const item = await Subscription.create({ owner: req.user._id, ...data });
  res.status(201).json({ item });
});

// PUT /api/subscriptions/:id
export const updateSubscription = asyncHandler(async (req, res) => {
  const item = await Subscription.findOne({ _id: req.params.id, owner: req.user._id });
  if (!item) throw new ApiError(404, 'Subscription not found');
  Object.assign(item, pickFields(req.body));
  await item.save();
  res.json({ item });
});

// DELETE /api/subscriptions/:id
export const deleteSubscription = asyncHandler(async (req, res) => {
  const item = await Subscription.findOne({ _id: req.params.id, owner: req.user._id });
  if (!item) throw new ApiError(404, 'Subscription not found');
  await item.deleteOne();
  res.json({ message: 'Subscription deleted' });
});
