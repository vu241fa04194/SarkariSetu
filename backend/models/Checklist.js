import mongoose from 'mongoose';

/**
 * Checklist Item Schema
 */
const checklistItemSchema = new mongoose.Schema({
  documentName: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true,
  },
  documentType: {
    type: String,
    enum: ['required', 'optional', 'conditional'],
    default: 'required',
  },
  conditionType: {
    type: String,
    enum: [
      'all',
      'farmer',
      'student',
      'reserved_category',
      'disability',
      'income_dependent',
      'women',
      'senior_citizen',
      'residence_dependent',
      'other',
    ],
    default: 'all',
  },
  status: {
    type: String,
    enum: ['pending', 'collected'],
    default: 'pending',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  collectedAt: {
    type: Date,
    default: null,
  },
});

/**
 * Checklist Schema - Associates a Citizen and a Government Scheme
 */
const checklistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    scheme: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scheme',
      required: [true, 'Scheme ID is required'],
      index: true,
    },
    items: {
      type: [checklistItemSchema],
      default: [],
    },
    personalNotes: {
      type: String,
      trim: true,
      default: '',
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring one checklist per (user, scheme)
checklistSchema.index({ user: 1, scheme: 1 }, { unique: true });

// Pre-save hook to calculate completionPercentage
checklistSchema.pre('save', function (next) {
  if (this.items && this.items.length > 0) {
    const collectedCount = this.items.filter((item) => item.status === 'collected').length;
    this.completionPercentage = Math.round((collectedCount / this.items.length) * 100);
  } else {
    this.completionPercentage = 0;
  }
  next();
});

const Checklist = mongoose.model('Checklist', checklistSchema);

export default Checklist;
