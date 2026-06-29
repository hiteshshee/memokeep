import Product from '../models/Product.js';
import env from '../config/env.js';
import { sendWarrantyReminderEmail } from '../config/mailer.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

const DAY = 24 * 60 * 60 * 1000;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const daysLeft = (d) => Math.ceil((new Date(d).getTime() - Date.now()) / DAY);

// GET /api/cron/warranty-reminders
// Triggered daily by Vercel Cron. Emails each owner a digest of products whose
// warranty expires within REMINDER_DAYS, then marks them so we don't repeat.
export const warrantyReminders = asyncHandler(async (req, res) => {
  // When CRON_SECRET is configured, require it (Vercel Cron sends it as a Bearer
  // token). Without it set (e.g. local dev) the endpoint is open for testing.
  if (env.cron.secret) {
    if ((req.headers.authorization || '') !== `Bearer ${env.cron.secret}`) {
      throw new ApiError(401, 'Unauthorized');
    }
  }

  const now = new Date();
  const until = new Date(now.getTime() + env.cron.reminderDays * DAY);

  const products = await Product.find({
    warrantyExpiry: { $gte: now, $lte: until },
    reminderSentAt: null,
  })
    .select('name brand category warrantyExpiry owner')
    .populate('owner', 'name email isVerified reminderOptOut');

  // Group by verified owner who hasn't opted out of reminders.
  const byUser = new Map();
  for (const p of products) {
    if (!p.owner || !p.owner.isVerified || !p.owner.email || p.owner.reminderOptOut) continue;
    const key = p.owner._id.toString();
    if (!byUser.has(key)) byUser.set(key, { user: p.owner, items: [], ids: [] });
    const bucket = byUser.get(key);
    bucket.items.push({
      name: p.name,
      brand: p.brand,
      category: p.category,
      daysLeft: daysLeft(p.warrantyExpiry),
      expiryStr: fmtDate(p.warrantyExpiry),
    });
    bucket.ids.push(p._id);
  }

  let usersNotified = 0;
  let productsReminded = 0;
  for (const { user, items, ids } of byUser.values()) {
    items.sort((a, b) => a.daysLeft - b.daysLeft);
    try {
      // eslint-disable-next-line no-await-in-loop
      await sendWarrantyReminderEmail(user.email, user.name, items, env.appUrl);
      // eslint-disable-next-line no-await-in-loop
      await Product.updateMany({ _id: { $in: ids } }, { $set: { reminderSentAt: new Date() } });
      usersNotified += 1;
      productsReminded += items.length;
    } catch (err) {
      console.error(`Reminder email failed for ${user.email}:`, err.message);
    }
  }

  res.json({ ok: true, scanned: products.length, usersNotified, productsReminded });
});
