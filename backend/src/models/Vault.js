import mongoose from 'mongoose';

// A standalone "important document" not tied to a product — passport, license,
// insurance, vehicle papers, etc. Optionally has an expiry date (→ reminders)
// and an attached file (stored on Cloudinary).
const vaultSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['Passport', 'License', 'Insurance', 'Vehicle', 'ID Card', 'Certificate', 'Property', 'Other'],
      default: 'Other',
    },
    title: { type: String, required: true, trim: true },
    holder: { type: String, trim: true, default: '' }, // name of the person on the document
    identifier: { type: String, trim: true, default: '' }, // document/policy number
    issuedDate: { type: Date },
    expiryDate: { type: Date },
    notes: { type: String, default: '' },

    // Attached file (Cloudinary), optional.
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
    fileName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    storage: { type: String, default: '' },

    reminderSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Changing the expiry date allows a fresh reminder for the new window.
vaultSchema.pre('save', function resetReminder(next) {
  if (this.isModified('expiryDate')) this.reminderSentAt = null;
  next();
});

export default mongoose.model('Vault', vaultSchema);
