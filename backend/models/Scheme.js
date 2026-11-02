import mongoose from 'mongoose';

/**
 * Scheme Schema definition representing Government Schemes in SarkariSetu.
 * Enhanced in Phase 3 with Admin Management, Verification, Source Tracking,
 * Views Tracking, and Status controls while preserving all Phase 1 & 2 fields.
 */
const schemeSchema = new mongoose.Schema(
  {
    schemeName: {
      type: String,
      required: [true, 'Scheme name is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Government department is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Scheme description is required'],
      trim: true,
    },
    benefits: {
      type: [String],
      default: [],
    },
    // Human-readable eligibility checklist (Phase 1 preserved)
    eligibility: {
      type: [String],
      default: [],
    },
    requiredDocuments: {
      type: [String],
      default: [],
    },
    applicationProcess: {
      type: [String],
      default: [],
    },
    state: {
      type: String,
      required: [true, 'State availability is required'],
      default: 'All India',
      trim: true,
      index: true,
    },
    officialWebsite: {
      type: String,
      default: '',
      trim: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    // ==========================================
    // Phase 2: Structured Eligibility Rules
    // ==========================================
    minimumAge: {
      type: Number,
      default: null,
    },
    maximumAge: {
      type: Number,
      default: null,
    },
    eligibleStates: {
      type: [String],
      default: ['All India'],
    },
    occupations: {
      type: [String],
      default: [],
    },
    maximumIncome: {
      type: Number,
      default: null,
    },
    applicableGender: {
      type: String,
      enum: ['All', 'Male', 'Female', 'Other'],
      default: 'All',
    },
    ruralUrban: {
      type: String,
      enum: ['Both', 'Rural', 'Urban', 'All'],
      default: 'Both',
    },
    studentRequired: {
      type: Boolean,
      default: null,
    },
    farmerRequired: {
      type: Boolean,
      default: null,
    },
    disabilityRequired: {
      type: Boolean,
      default: null,
    },
    applicableCategories: {
      type: [String],
      default: ['All'],
    },

    // ==========================================
    // Phase 3: Status, Verification & Analytics
    // ==========================================
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Under Review'],
      default: 'Active',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['Verified', 'Pending Verification', 'Needs Review'],
      default: 'Pending Verification',
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sourceName: {
      type: String,
      default: 'Official Portal',
      trim: true,
    },
    sourceURL: {
      type: String,
      default: '',
      trim: true,
    },
    sourceType: {
      type: String,
      enum: [
        'Central Government',
        'State Government',
        'Government Department',
        'Official Portal',
        'Other',
      ],
      default: 'Official Portal',
    },
    lastVerifiedAt: {
      type: Date,
      default: null,
    },
    viewsCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    // ==========================================
    // Phase 7: Smart Document Checklist & Guidance
    // ==========================================
    documentRequirements: [
      {
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
        conditionDescription: {
          type: String,
          default: '',
          trim: true,
        },
        description: {
          type: String,
          default: '',
          trim: true,
        },
        issuingAuthority: {
          type: String,
          default: '',
          trim: true,
        },
      },
    ],
    applicationGuidance: {
      submissionMethod: {
        type: String,
        enum: [
          'Online',
          'Offline',
          'Online & Offline',
          'CSC / Seva Kendra',
          'CSC / MeeSeva',
          'Bank Branch',
          'Hybrid',
          'Not Specified',
        ],
        default: 'Online',
      },
      stepByStepInstructions: {
        type: [String],
        default: [],
      },
      deadlines: {
        type: String,
        default: 'Information not available',
        trim: true,
      },
      helpline: {
        phone: { type: String, default: '', trim: true },
        email: { type: String, default: '', trim: true },
        hours: { type: String, default: '', trim: true },
      },
      warnings: {
        type: [String],
        default: [],
      },
      sourceUrl: {
        type: String,
        default: '',
        trim: true,
      },
      officialPortalURL: {
        type: String,
        default: '',
        trim: true,
      },
      lastVerifiedDate: {
        type: Date,
        default: Date.now,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create text index for search support across key fields
schemeSchema.index({
  schemeName: 'text',
  description: 'text',
  department: 'text',
  category: 'text',
});

const Scheme = mongoose.model('Scheme', schemeSchema);

export default Scheme;
