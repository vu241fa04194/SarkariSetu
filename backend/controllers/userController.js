import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';
import Scheme from '../models/Scheme.js';
import generateToken from '../utils/generateToken.js';

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid name, email, and password strings',
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Full name must be at least 2 characters long',
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        state: user.state,
        district: user.district,
        occupation: user.occupation,
        annualIncome: user.annualIncome,
        ruralOrUrban: user.ruralOrUrban,
        studentStatus: user.studentStatus,
        farmerStatus: user.farmerStatus,
        disabilityStatus: user.disabilityStatus,
        category: user.category,
        role: user.role,
        savedSchemes: user.savedSchemes,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/users/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid email and password strings',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+password +lockUntil +loginAttempts'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message:
          'Account is temporarily locked due to multiple failed login attempts. Please try again after 15 minutes or reset your password.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    await user.resetLoginAttempts();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        state: user.state,
        district: user.district,
        occupation: user.occupation,
        annualIncome: user.annualIncome,
        ruralOrUrban: user.ruralOrUrban,
        studentStatus: user.studentStatus,
        farmerStatus: user.farmerStatus,
        disabilityStatus: user.disabilityStatus,
        category: user.category,
        role: user.role,
        savedSchemes: user.savedSchemes,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('savedSchemes')
      .populate('recentlyViewedSchemes.scheme');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile & eligibility parameters
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    const {
      name,
      age,
      gender,
      state,
      district,
      occupation,
      annualIncome,
      ruralOrUrban,
      studentStatus,
      farmerStatus,
      disabilityStatus,
      category,
      password,
    } = req.body;

    if (name) user.name = name.trim();
    if (age !== undefined) user.age = age === '' || age === null ? null : Number(age);
    if (gender !== undefined) user.gender = gender;
    if (state !== undefined) user.state = state;
    if (district !== undefined) user.district = district;
    if (occupation !== undefined) user.occupation = occupation;
    if (annualIncome !== undefined) {
      user.annualIncome =
        annualIncome === '' || annualIncome === null ? null : Number(annualIncome);
    }
    if (ruralOrUrban !== undefined) user.ruralOrUrban = ruralOrUrban;
    if (studentStatus !== undefined) user.studentStatus = Boolean(studentStatus);
    if (farmerStatus !== undefined) user.farmerStatus = Boolean(farmerStatus);
    if (disabilityStatus !== undefined) user.disabilityStatus = Boolean(disabilityStatus);
    if (password) {
      if (password.trim().length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long',
        });
      }
      user.password = password.trim();
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        age: updatedUser.age,
        gender: updatedUser.gender,
        state: updatedUser.state,
        district: updatedUser.district,
        occupation: updatedUser.occupation,
        annualIncome: updatedUser.annualIncome,
        ruralOrUrban: updatedUser.ruralOrUrban,
        studentStatus: updatedUser.studentStatus,
        farmerStatus: updatedUser.farmerStatus,
        disabilityStatus: updatedUser.disabilityStatus,
        category: updatedUser.category,
        role: updatedUser.role,
        savedSchemes: updatedUser.savedSchemes,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save a scheme to user profile
 * @route   POST /api/users/saved-schemes/:schemeId
 * @access  Private
 */
export const saveScheme = async (req, res, next) => {
  try {
    const { schemeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(schemeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scheme ID',
      });
    }

    const schemeExists = await Scheme.findById(schemeId);
    if (!schemeExists) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found',
      });
    }

    const user = await User.findById(req.user._id);

    // Check if already saved
    if (!user.savedSchemes.some((id) => id.toString() === schemeId)) {
      user.savedSchemes.push(schemeId);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Scheme bookmarked successfully',
      data: user.savedSchemes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove a scheme from saved list
 * @route   DELETE /api/users/saved-schemes/:schemeId
 * @access  Private
 */
export const removeSavedScheme = async (req, res, next) => {
  try {
    const { schemeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(schemeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scheme ID format',
      });
    }

    const user = await User.findById(req.user._id);

    user.savedSchemes = user.savedSchemes.filter(
      (id) => id.toString() !== schemeId
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Scheme removed from saved list',
      data: user.savedSchemes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all saved schemes with full scheme details
 * @route   GET /api/users/saved-schemes
 * @access  Private
 */
export const getSavedSchemes = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('savedSchemes');

    res.status(200).json({
      success: true,
      count: user.savedSchemes.length,
      data: user.savedSchemes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recently viewed schemes for citizen
 * @route   GET /api/users/recently-viewed
 * @access  Private
 */
export const getRecentlyViewedSchemes = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('recentlyViewedSchemes.scheme');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const list = (user.recentlyViewedSchemes || [])
      .filter((item) => item.scheme)
      .map((item) => ({
        ...item.scheme.toObject(),
        viewedAt: item.viewedAt,
      }));

    res.status(200).json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request Password Reset Token (Forgot Password)
 * @route   POST /api/users/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Prevent account enumeration by always returning a generic success message
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          'If an account exists with this email address, a password reset token has been generated.',
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message:
        'If an account exists with this email address, a password reset token has been generated.',
      data:
        process.env.NODE_ENV !== 'production'
          ? {
              resetToken,
              expiresIn: '15 minutes',
            }
          : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset Password using token
 * @route   POST /api/users/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is required',
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired',
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    await user.resetLoginAttempts();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You may now sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user & invalidate session
 * @route   POST /api/users/logout
 * @access  Public
 */
export const logoutUser = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};


