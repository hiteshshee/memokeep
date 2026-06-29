import Product from '../models/Product.js';
import Vault from '../models/Vault.js';
import Subscription from '../models/Subscription.js';
import env from '../config/env.js';
import { sendReminderEmail } from '../config/mailer.js';
import { asyncHandler, ApiError } from '../utils/asyncHandler.js';

const DAY = 24 * 60 * 60 * 1000;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const daysLeft = (d) => Math.ceil((new Date(d).getTime() - Date.now()) / DAY);
const eligible = (owner) => owner && owner.isVerified && owner.email && !owner.reminderOptOut;

// Advance a renewal date by one billing cycle.
const CYCLE = {
  weekly: (d) => d.setDate(d.getDate() + 7),
  monthly: (d) => d.setMonth(d.getMonth() + 1),
  quarterly: (d) => d.setMonth(d.getMonth() + 3),
  yearly: (d) => d.setFullYear(d.getFullYear() + 1),
};
function advance(date, cycle) {
  const d = new Date(date);
  (CYCLE[cycle] || CYCLE.monthly)(d);
  return d;
}

// GET /api/cron/warranty-reminders
// Daily (Vercel Cron). Emails each owner ONE digest of everything expiring within
// REMINDER_DAYS — product warranties + important documents — then marks them so
// they don't repeat.
export const warrantyReminders = asyncHandler(async (req, res) => {
  if (env.cron.secret) {
    if ((req.headers.authorization || '') !== `Bearer ${env.cron.secret}`) {
      throw new ApiError(401, 'Unauthorized');
    }
  }

  const now = new Date();
  const until = new Date(now.getTime() + env.cron.reminderDays * DAY);
  const window = { $gte: now, $lte: until };

  // ownerId -> { user, items: [...], marks: { Product: [], Vault: [] } }
  const buckets = new Map();
  const bucketFor = (owner) => {
    const key = owner._id.toString();
    if (!buckets.has(key)) {
      buckets.set(key, { user: owner, items: [], marks: { Product: [], Vault: [], Subscription: [] } });
    }
    return buckets.get(key);
  };

  // 1) Product warranties
  const products = await Product.find({ warrantyExpiry: window, reminderSentAt: null })
    .select('name brand category warrantyExpiry owner')
    .populate('owner', 'name email isVerified reminderOptOut');
  for (const p of products) {
    if (!eligible(p.owner)) continue;
    const b = bucketFor(p.owner);
    b.items.push({
      title: p.name,
      sub: `Warranty · ${p.brand || p.category}`,
      daysLeft: daysLeft(p.warrantyExpiry),
      expiryStr: fmtDate(p.warrantyExpiry),
    });
    b.marks.Product.push(p._id);
  }

  // 2) Important documents (vault)
  const docs = await Vault.find({ expiryDate: window, reminderSentAt: null })
    .select('title type expiryDate owner')
    .populate('owner', 'name email isVerified reminderOptOut');
  for (const d of docs) {
    if (!eligible(d.owner)) continue;
    const b = bucketFor(d.owner);
    b.items.push({
      title: d.title,
      sub: `${d.type} expiring`,
      daysLeft: daysLeft(d.expiryDate),
      expiryStr: fmtDate(d.expiryDate),
    });
    b.marks.Vault.push(d._id);
  }

  // 3) Subscriptions — roll past-due renewals forward by their cycle, then
  //    remind on upcoming renewals.
  const subs = await Subscription.find({ isActive: true, nextRenewal: { $ne: null } })
    .populate('owner', 'name email isVerified reminderOptOut');
  for (const s of subs) {
    if (!s.nextRenewal) continue;
    if (s.nextRenewal.getTime() < now.getTime()) {
      let nr = s.nextRenewal;
      while (nr.getTime() <= now.getTime()) nr = advance(nr, s.billingCycle);
      s.nextRenewal = nr; // pre-save resets reminderSentAt
      // eslint-disable-next-line no-await-in-loop
      await s.save();
    }
    if (!eligible(s.owner) || s.reminderSentAt) continue;
    if (s.nextRenewal.getTime() < now.getTime() || s.nextRenewal.getTime() > until.getTime()) continue;
    const b = bucketFor(s.owner);
    b.items.push({
      title: s.name,
      sub: `Subscription · ${s.currency === 'INR' ? '₹' : ''}${s.amount}/${s.billingCycle}`,
      daysLeft: daysLeft(s.nextRenewal),
      expiryStr: fmtDate(s.nextRenewal),
    });
    b.marks.Subscription.push(s._id);
  }

  let usersNotified = 0;
  let itemsReminded = 0;
  for (const b of buckets.values()) {
    b.items.sort((a, c) => a.daysLeft - c.daysLeft);
    try {
      // eslint-disable-next-line no-await-in-loop
      await sendReminderEmail(b.user.email, b.user.name, b.items, env.appUrl);
      if (b.marks.Product.length) {
        // eslint-disable-next-line no-await-in-loop
        await Product.updateMany({ _id: { $in: b.marks.Product } }, { $set: { reminderSentAt: new Date() } });
      }
      if (b.marks.Vault.length) {
        // eslint-disable-next-line no-await-in-loop
        await Vault.updateMany({ _id: { $in: b.marks.Vault } }, { $set: { reminderSentAt: new Date() } });
      }
      if (b.marks.Subscription.length) {
        // eslint-disable-next-line no-await-in-loop
        await Subscription.updateMany({ _id: { $in: b.marks.Subscription } }, { $set: { reminderSentAt: new Date() } });
      }
      usersNotified += 1;
      itemsReminded += b.items.length;
    } catch (err) {
      console.error(`Reminder email failed for ${b.user.email}:`, err.message);
    }
  }

  res.json({ ok: true, usersNotified, itemsReminded });
});
