import mongoose from 'mongoose';

// A recurring subscription — Netflix, Spotify, gym, insurance, etc.
const subscriptionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Streaming', 'Music', 'Software', 'Gaming', 'Gym', 'Insurance', 'Utility', 'News', 'Other'],
      default: 'Other',
    },
    amount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    billingCycle: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'], default: 'monthly' },
    nextRenewal: { type: Date },
    isActive: { type: Boolean, default: true },
    notes: { type: String, default: '' },
    reminderSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Changing the renewal date allows a fresh reminder for the new cycle.
subscriptionSchema.pre('save', function resetReminder(next) {
  if (this.isModified('nextRenewal')) this.reminderSentAt = null;
  next();
});

export default mongoose.model('Subscription', subscriptionSchema);
