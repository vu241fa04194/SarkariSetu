import mongoose from 'mongoose';

/**
 * Application Model - Personal Citizen Application & Interest Tracking
 * NOTE: This records the citizen's own tracking status for external applications
 * and does NOT submit forms directly to government portals.
 */
const applicationSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: [
        'Interested',
        'Preparing Documents',
        'Ready to Apply',
        'Application Submitted',
        'Under Review',
        'Approved',
        'Rejected',
        'Saved',
        'Applied',
        'Completed',
      ],
      default: 'Interested',
      index: true,
    },
    applicationDate: {
      type: Date,
      default: null,
    },
    submissionDate: {
      type: Date,
      default: null,
    },
    statusUpdateDate: {
      type: Date,
      default: Date.now,
    },
    referenceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index so a user tracks each scheme once
applicationSchema.index({ user: 1, scheme: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

export default Application;
