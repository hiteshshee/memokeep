import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'Electronics',
        'Appliances',
        'Furniture',
        'Vehicle',
        'Mobile',
        'Computer',
        'Kitchen',
        'Tools',
        'Other',
      ],
      default: 'Other',
    },
    brand: { type: String, trim: true, default: '' },
    model: { type: String, trim: true, default: '' },
    serialNumber: { type: String, trim: true, default: '' },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number, default: 0, min: 0 },
    purchasedFrom: { type: String, trim: true, default: '' },
    warrantyMonths: { type: Number, default: 0, min: 0 },
    warrantyExpiry: { type: Date },
    notes: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    images: { type: [String], default: [] },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Compute warranty expiry from purchase date + warranty months when possible.
productSchema.pre('save', function computeWarranty(next) {
  if (this.purchaseDate && this.warrantyMonths > 0) {
    const expiry = new Date(this.purchaseDate);
    expiry.setMonth(expiry.getMonth() + this.warrantyMonths);
    this.warrantyExpiry = expiry;
  }
  next();
});

productSchema.index({ name: 'text', brand: 'text', model: 'text', notes: 'text' });

export default mongoose.model('Product', productSchema);
