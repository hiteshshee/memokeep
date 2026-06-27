import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['invoice', 'warranty', 'manual', 'receipt', 'image', 'other'],
      default: 'other',
    },
    url: { type: String, required: true },
    publicId: { type: String, default: '' }, // Cloudinary public id (for deletion)
    fileName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    storage: { type: String, enum: ['cloudinary', 'local'], default: 'local' },
  },
  { timestamps: true }
);

export default mongoose.model('Document', documentSchema);
