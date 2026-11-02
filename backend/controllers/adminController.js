import mongoose from 'mongoose';
import User from '../models/User.js';
import Scheme from '../models/Scheme.js';
import Application from '../models/Application.js';
import AuditLog from '../models/AuditLog.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { logAdminActivity } from '../utils/auditLogger.js';

/**
 * @desc    Get Admin Dashboard Key Statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin Only)
 */
export const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalCitizens,
      totalAdmins,
      totalSchemes,
      activeSchemes,
      underReviewSchemes,
      inactiveSchemes,
      verifiedSchemes,
      totalApplications,
      totalViewsAgg,
      totalSavedAgg,
    ] = await Promise.all([
      User.countDocuments({ role: 'citizen' }),
      User.countDocuments({ role: 'admin' }),
      Scheme.countDocuments({}),
      Scheme.countDocuments({ status: 'Active' }),
      Scheme.countDocuments({ status: 'Under Review' }),
      Scheme.countDocuments({ status: 'Inactive' }),
      Scheme.countDocuments({ verificationStatus: 'Verified' }),
      Application.countDocuments({}),
      Scheme.aggregate([{ $group: { _id: null, totalViews: { $sum: '$viewsCount' } } }]),
      User.aggregate([
        { $project: { count: { $size: { $ifNull: ['$savedSchemes', []] } } } },
        { $group: { _id: null, totalSaved: { $sum: '$count' } } },
      ]),
    ]);

    const totalViews = totalViewsAgg[0]?.totalViews || 0;
    const totalSaved = totalSavedAgg[0]?.totalSaved || 0;

    res.status(200).json({
      success: true,
      data: {
        totalCitizens,
        totalAdmins,
        totalUsers: totalCitizens + totalAdmins,
        totalSchemes,
        activeSchemes,
        underReviewSchemes,
        inactiveSchemes,
        verifiedSchemes,
        totalApplications,
        totalViews,
        totalSaved,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed Admin Analytics data (real MongoDB aggregations)
 * @route   GET /api/admin/analytics
 * @access  Private (Admin Only)
 */
export const getAdminAnalytics = async (req, res, next) => {
  try {
    const [
      schemesByCategory,
      schemesByState,
      mostViewedSchemes,
      mostSavedSchemesAgg,
      applicationStatusDistribution,
      userRegistrationsByDate,
      verificationStatusCounts,
    ] = await Promise.all([
      // 1. Schemes by category
      Scheme.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // 2. Schemes by state
      Scheme.aggregate([
        { $group: { _id: '$state', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // 3. Most viewed schemes
      Scheme.find({})
        .sort({ viewsCount: -1 })
        .limit(10)
        .select('schemeName category department viewsCount status verificationStatus'),

      // 4. Most saved schemes
      User.aggregate([
        { $unwind: '$savedSchemes' },
        { $group: { _id: '$savedSchemes', savedCount: { $sum: 1 } } },
        { $sort: { savedCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'schemes',
            localField: '_id',
            foreignField: '_id',
            as: 'schemeDetails',
          },
        },
        { $unwind: '$schemeDetails' },
        {
          $project: {
            _id: 1,
            savedCount: 1,
            schemeName: '$schemeDetails.schemeName',
            category: '$schemeDetails.category',
            state: '$schemeDetails.state',
          },
        },
      ]),

      // 5. Application status distribution
      Application.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // 6. User registrations over time
      User.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),

      // 7. Verification status counts
      Scheme.aggregate([
        { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        schemesByCategory: schemesByCategory.map((item) => ({
          name: item._id,
          count: item.count,
        })),
        schemesByState: schemesByState.map((item) => ({
          name: item._id,
          count: item.count,
        })),
        mostViewedSchemes,
        mostSavedSchemes: mostSavedSchemesAgg,
        applicationStatusDistribution: applicationStatusDistribution.map((item) => ({
          status: item._id,
          count: item.count,
        })),
        userRegistrationsByDate: userRegistrationsByDate.map((item) => ({
          date: item._id,
          count: item.count,
        })),
        verificationStatusCounts: verificationStatusCounts.map((item) => ({
          status: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registered users for administration
 * @route   GET /api/admin/users
 * @access  Private (Admin Only)
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const filter = {};

    if (role && role !== 'All') {
      filter.role = role;
    }

    if (search && search.trim() !== '') {
      const safeSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(safeSearch, 'i');
      filter.$or = [{ name: searchRegex }, { email: searchRegex }, { state: searchRegex }];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update scheme verification status
 * @route   PUT /api/admin/schemes/:id/verification
 * @access  Private (Admin Only)
 */
export const updateSchemeVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verificationStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID' });
    }

    const updates = {
      verificationStatus,
      lastVerifiedAt: new Date(),
    };

    if (verificationStatus === 'Verified') {
      updates.verifiedAt = new Date();
      updates.verifiedBy = req.user._id;
    }

    const scheme = await Scheme.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('verifiedBy', 'name email');

    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }

    await logAdminActivity(req, 'VERIFY_SCHEME', 'Scheme', id, {
      verificationStatus,
      schemeName: scheme.schemeName,
    });

    res.status(200).json({
      success: true,
      message: `Scheme verification status updated to ${verificationStatus}`,
      data: scheme,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update scheme status (Active, Inactive, Under Review)
 * @route   PUT /api/admin/schemes/:id/status
 * @access  Private (Admin Only)
 */
export const updateSchemeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID' });
    }

    const scheme = await Scheme.findByIdAndUpdate(
      id,
      { status, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );

    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }

    await logAdminActivity(req, 'UPDATE_SCHEME_STATUS', 'Scheme', id, {
      status,
      schemeName: scheme.schemeName,
    });

    res.status(200).json({
      success: true,
      message: `Scheme status updated to ${status}`,
      data: scheme,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregate citizen application tracking activity
 * @route   GET /api/admin/applications
 * @access  Private (Admin Only)
 */
export const getAdminApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({})
      .populate('user', 'name email state occupation')
      .populate('scheme', 'schemeName category department')
      .sort({ updatedAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get administrative activity audit trail
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin Only)
 */
export const getAdminAuditLogs = async (req, res, next) => {
  try {
    const { action, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (action && action !== 'All') {
      filter.action = action;
    }

    const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const pageNum = Math.max(Number(page) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('admin', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};
