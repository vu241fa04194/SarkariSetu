import mongoose from 'mongoose';

/**
 * Document Schema - Represents an authenticated citizen's uploaded eligibility/proof documents.
 */
const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    scheme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scheme',
      default: null,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    fileSize: {
      type: Number,
      required: true,
      max: [5 * 1024 * 1024, 'Document size cannot exceed 5MB'],
    },
    documentType: {
      type: String,
      default: 'General Document',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ user: 1, createdAt: -1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;
