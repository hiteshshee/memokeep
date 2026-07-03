// One-off utility: promote (or demote) a user's role by email.
//   node scripts/make-admin.mjs user@example.com [admin|user]
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';

const email = process.argv[2]?.toLowerCase().trim();
const role = process.argv[3] || 'admin';

if (!email) {
  console.error('Usage: node scripts/make-admin.mjs <email> [admin|user]');
  process.exit(1);
}

await connectDB();
const user = await User.findOne({ email });
if (!user) {
  console.error(`No user found with email: ${email}`);
  await mongoose.disconnect();
  process.exit(1);
}
user.role = role;
await user.save();
console.log(`✅ ${user.email} is now role: ${user.role}`);
await mongoose.disconnect();
process.exit(0);
