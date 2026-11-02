import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide a valid email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Do not return password by default in queries
    },

    // Security: Password Reset & Brute-Force Lockout
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },

    // Phase 3: Role-Based Access Control
    role: {
      type: String,
      enum: ['citizen', 'admin'],
      default: 'citizen',
      index: true,
    },

    // Citizen Eligibility Profile Fields (Phase 2 preserved)
    age: {
      type: Number,
      default: null,
      min: [0, 'Age cannot be negative'],
      max: [120, 'Age cannot exceed 120'],
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say', 'All', ''],
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    district: {
      type: String,
      trim: true,
      default: '',
    },
    occupation: {
      type: String,
      trim: true,
      default: '',
    },
    annualIncome: {
      type: Number,
      default: null,
      min: [0, 'Annual income cannot be negative'],
    },
    ruralOrUrban: {
      type: String,
      enum: ['Rural', 'Urban', 'Both', ''],
      default: '',
    },
    studentStatus: {
      type: Boolean,
      default: false,
    },
    farmerStatus: {
      type: Boolean,
      default: false,
    },
    disabilityStatus: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      enum: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minorities', 'All', ''],
      default: '',
    },

    // Bookmarked / Saved Schemes
    savedSchemes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scheme',
      },
    ],

    // Phase 3: Track recently viewed schemes in database
    recentlyViewedSchemes: [
      {
        scheme: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Scheme',
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if user account is temporarily locked
userSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts & apply lock if limit exceeded
userSchema.methods.incLoginAttempts = async function () {
  // If lock expired, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = null;
    return await this.save();
  }

  const updates = { $inc: { loginAttempts: 1 } };
  // If reached 5 attempts, lock for 15 minutes
  if ((this.loginAttempts || 0) + 1 >= 5) {
    updates.$set = { lockUntil: new Date(Date.now() + 15 * 60 * 1000) };
  }

  return await this.model('User').updateOne({ _id: this._id }, updates);
};

// Reset login attempts on successful authentication
userSchema.methods.resetLoginAttempts = async function () {
  return await this.model('User').updateOne(
    { _id: this._id },
    { $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } }
  );
};

// Generate and hash password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token using sha256 and set to field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token expires in 15 minutes
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

  return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
