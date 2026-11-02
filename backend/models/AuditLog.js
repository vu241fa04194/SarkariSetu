import mongoose from 'mongoose';

/**
 * AuditLog Schema - Records sensitive administrative operations and security events.
 */
const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin user reference is required'],
      index: true,
    },
    adminEmail: {
      type: String,
      required: true,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE_SCHEME',
        'UPDATE_SCHEME',
        'DELETE_SCHEME',
        'VERIFY_SCHEME',
        'UPDATE_SCHEME_STATUS',
        'UPDATE_USER_ROLE',
        'SECURITY_CONFIG_UPDATE',
        'DOCUMENT_ACCESS',
      ],
      index: true,
    },
    targetModel: {
      type: String,
      required: true,
      trim: true,
    },
    targetId: {
      type: String,
      default: '',
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '',
      trim: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient chronological audit log retrieval
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
