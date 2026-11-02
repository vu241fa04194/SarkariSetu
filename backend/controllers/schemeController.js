import mongoose from 'mongoose';
import Scheme from '../models/Scheme.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import {
  generateDocumentRequirements,
  generateApplicationGuidance,
} from '../utils/guidanceGenerator.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { logAdminActivity } from '../utils/auditLogger.js';

/**
 * Standard list of all platform categories to guarantee category page completeness
 */
export const PLATFORM_CATEGORIES = [
  'Health',
  'Education',
  'Employment',
  'Agriculture',
  'Irrigation & Water',
  'Housing',
  'Women & Child Welfare',
  'Senior Citizens',
  'Disability Welfare',
  'Financial Assistance',
  'MSME / Business',
  'Skill Development',
  'Farmers',
  'Students',
];

/**
 * @desc    Get all schemes with search, filtering, and status controls
 * @route   GET /api/schemes
 * @query   search, category, state, department, sort, status, verificationStatus
 * @access  Public
 */
export const getSchemes = async (req, res, next) => {
  try {
    const {
      search,
      category,
      state,
      department,
      sort,
      status,
      verificationStatus,
      allStatus,
    } = req.query;

    const andConditions = [];

    // By default, citizens see Active schemes unless explicitly requested otherwise (e.g., admin panel)
    if (allStatus === 'true') {
      if (status && status !== 'All') {
        andConditions.push({ status });
      }
    } else if (status && status !== 'All') {
      andConditions.push({ status });
    } else {
      andConditions.push({ status: 'Active' });
    }

    if (verificationStatus && verificationStatus !== 'All') {
      andConditions.push({ verificationStatus });
    }

    // Comprehensive search across name, description, department, category, benefits, eligibility, occupations
    if (typeof search === 'string' && search.trim() !== '') {
      const safeSearch = escapeRegex(search.trim());
      const searchRegex = new RegExp(safeSearch, 'i');
      andConditions.push({
        $or: [
          { schemeName: searchRegex },
          { description: searchRegex },
          { department: searchRegex },
          { category: searchRegex },
          { benefits: searchRegex },
          { eligibility: searchRegex },
          { occupations: searchRegex },
        ],
      });
    }

    // Filter by Category
    if (typeof category === 'string' && category.trim() !== '' && category !== 'All') {
      const safeCategory = escapeRegex(category.trim());
      andConditions.push({ category: { $regex: new RegExp(`^${safeCategory}$`, 'i') } });
    }

    // Filter by State
    if (typeof state === 'string' && state.trim() !== '' && state !== 'All') {
      const safeState = escapeRegex(state.trim());
      if (state.trim() === 'All India') {
        andConditions.push({ state: 'All India' });
      } else {
        andConditions.push({
          $or: [
            { state: { $regex: new RegExp(`^${safeState}$`, 'i') } },
            { state: 'All India' },
            { eligibleStates: state.trim() },
            { eligibleStates: 'All India' },
          ],
        });
      }
    }

    // Filter by Department
    if (typeof department === 'string' && department.trim() !== '' && department !== 'All') {
      const safeDept = escapeRegex(department.trim());
      andConditions.push({ department: { $regex: new RegExp(`^${safeDept}$`, 'i') } });
    }

    const finalQuery = andConditions.length > 0 ? { $and: andConditions } : {};

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'name_asc') {
      sortOptions = { schemeName: 1 };
    } else if (sort === 'name_desc') {
      sortOptions = { schemeName: -1 };
    } else if (sort === 'views') {
      sortOptions = { viewsCount: -1 };
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    const schemes = await Scheme.find(finalQuery).sort(sortOptions);

    res.status(200).json({
      success: true,
      count: schemes.length,
      data: schemes,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single scheme by ID
 * @route   GET /api/schemes/:id
 * @access  Public
 */
export const getSchemeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Scheme ID format',
      });
    }

    const scheme = await Scheme.findById(id).populate('verifiedBy', 'name email role');

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: `Scheme not found with id: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: scheme,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Track scheme view count and citizen recently viewed list
 * @route   POST /api/schemes/:id/view
 * @access  Public / Optional Auth
 */
export const trackSchemeView = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID' });
    }

    // Increment scheme views count
    const scheme = await Scheme.findByIdAndUpdate(
      id,
      { $inc: { viewsCount: 1 } },
      { new: true }
    );

    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }

    // If request contains authenticated user (or user ID passed in body/token)
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        // Remove existing entry for this scheme if present
        user.recentlyViewedSchemes = user.recentlyViewedSchemes.filter(
          (item) => item.scheme && item.scheme.toString() !== id
        );
        // Prepend current view (keep max 10)
        user.recentlyViewedSchemes.unshift({ scheme: id, viewedAt: new Date() });
        if (user.recentlyViewedSchemes.length > 10) {
          user.recentlyViewedSchemes = user.recentlyViewedSchemes.slice(0, 10);
        }
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      viewsCount: scheme.viewsCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new scheme (Phase 3 with admin fields)
 * @route   POST /api/schemes
 * @access  Public / Admin
 */
export const createScheme = async (req, res, next) => {
  try {
    const {
      schemeName,
      category,
      department,
      description,
      benefits,
      eligibility,
      requiredDocuments,
      applicationProcess,
      state,
      officialWebsite,
      // Phase 2 structured eligibility
      minimumAge,
      maximumAge,
      eligibleStates,
      occupations,
      maximumIncome,
      applicableGender,
      ruralUrban,
      studentRequired,
      farmerRequired,
      disabilityRequired,
      applicableCategories,
      // Phase 3 fields
      status,
      verificationStatus,
      sourceName,
      sourceURL,
      sourceType,
    } = req.body;

    if (!schemeName || !category || !department || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: schemeName, category, department, description',
      });
    }

    const toArray = (val) => {
      if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
      if (typeof val === 'string') {
        return val
          .split(/\n|,/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return [];
    };

    const scheme = await Scheme.create({
      schemeName,
      category,
      department,
      description,
      benefits: toArray(benefits),
      eligibility: toArray(eligibility),
      requiredDocuments: toArray(requiredDocuments),
      applicationProcess: toArray(applicationProcess),
      state: state || 'All India',
      officialWebsite: officialWebsite || '',
      lastUpdated: new Date(),
      // Structured
      minimumAge: minimumAge != null && minimumAge !== '' ? Number(minimumAge) : null,
      maximumAge: maximumAge != null && maximumAge !== '' ? Number(maximumAge) : null,
      eligibleStates: toArray(eligibleStates).length ? toArray(eligibleStates) : [state || 'All India'],
      occupations: toArray(occupations),
      maximumIncome: maximumIncome != null && maximumIncome !== '' ? Number(maximumIncome) : null,
      applicableGender: applicableGender || 'All',
      ruralUrban: ruralUrban || 'Both',
      studentRequired: studentRequired == null ? null : Boolean(studentRequired),
      farmerRequired: farmerRequired == null ? null : Boolean(farmerRequired),
      disabilityRequired: disabilityRequired == null ? null : Boolean(disabilityRequired),
      applicableCategories: toArray(applicableCategories).length ? toArray(applicableCategories) : ['All'],
      // Phase 3
      status: status || 'Active',
      verificationStatus: verificationStatus || 'Pending Verification',
      verifiedAt: verificationStatus === 'Verified' ? new Date() : null,
      verifiedBy: verificationStatus === 'Verified' && req.user ? req.user._id : null,
      sourceName: sourceName || 'Official Portal',
      sourceURL: sourceURL || officialWebsite || '',
      sourceType: sourceType || 'Official Portal',
      lastVerifiedAt: verificationStatus === 'Verified' ? new Date() : null,
      documentRequirements:
        req.body.documentRequirements && Array.isArray(req.body.documentRequirements) && req.body.documentRequirements.length > 0
          ? req.body.documentRequirements
          : generateDocumentRequirements({ schemeName, category, department, description, maximumIncome, farmerRequired, studentRequired, disabilityRequired, applicableCategories, applicableGender }),
      applicationGuidance:
        req.body.applicationGuidance && typeof req.body.applicationGuidance === 'object'
          ? req.body.applicationGuidance
          : generateApplicationGuidance({ schemeName, category, officialWebsite, sourceURL, applicationProcess: toArray(applicationProcess) }),
    });

    await logAdminActivity(req, 'CREATE_SCHEME', 'Scheme', scheme._id, {
      schemeName: scheme.schemeName,
      category: scheme.category,
    });

    res.status(201).json({
      success: true,
      message: 'Scheme created successfully',
      data: scheme,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a scheme
 * @route   PUT /api/schemes/:id
 * @access  Public / Admin
 */
export const updateScheme = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Scheme ID format',
      });
    }

    const updates = { ...req.body, lastUpdated: new Date() };

    const toArray = (val) => {
      if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
      if (typeof val === 'string') {
        return val
          .split(/\n|,/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return undefined;
    };

    if (updates.benefits !== undefined) updates.benefits = toArray(updates.benefits);
    if (updates.eligibility !== undefined) updates.eligibility = toArray(updates.eligibility);
    if (updates.requiredDocuments !== undefined) updates.requiredDocuments = toArray(updates.requiredDocuments);
    if (updates.applicationProcess !== undefined) updates.applicationProcess = toArray(updates.applicationProcess);
    if (updates.eligibleStates !== undefined) updates.eligibleStates = toArray(updates.eligibleStates);
    if (updates.occupations !== undefined) updates.occupations = toArray(updates.occupations);
    if (updates.applicableCategories !== undefined) updates.applicableCategories = toArray(updates.applicableCategories);

    if (updates.verificationStatus === 'Verified') {
      updates.verifiedAt = new Date();
      updates.lastVerifiedAt = new Date();
      if (req.user) updates.verifiedBy = req.user._id;
    }

    if (updates.applicationGuidance && typeof updates.applicationGuidance === 'object') {
      if (!updates.applicationGuidance.officialPortalURL && updates.applicationGuidance.sourceUrl) {
        updates.applicationGuidance.officialPortalURL = updates.applicationGuidance.sourceUrl;
      }
      if (!updates.applicationGuidance.sourceUrl && updates.applicationGuidance.officialPortalURL) {
        updates.applicationGuidance.sourceUrl = updates.applicationGuidance.officialPortalURL;
      }
    }

    const scheme = await Scheme.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: `Scheme not found with id: ${id}`,
      });
    }

    // Phase 3: Create notifications for citizens who saved this scheme
    try {
      const bookmarkedUsers = await User.find({ savedSchemes: id }).select('_id');
      if (bookmarkedUsers.length > 0) {
        const notifications = bookmarkedUsers.map((u) => ({
          user: u._id,
          title: `Scheme Updated: ${scheme.schemeName}`,
          message: `The guidelines or information for ${scheme.schemeName} have been recently updated by the administration.`,
          type: 'scheme_update',
          link: `/schemes/${scheme._id}`,
        }));
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.warn('Could not dispatch update notifications:', notifErr.message);
    }

    await logAdminActivity(req, 'UPDATE_SCHEME', 'Scheme', scheme._id, {
      schemeName: scheme.schemeName,
      status: scheme.status,
      verificationStatus: scheme.verificationStatus,
    });

    res.status(200).json({
      success: true,
      message: 'Scheme updated successfully',
      data: scheme,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a scheme
 * @route   DELETE /api/schemes/:id
 * @access  Public / Admin
 */
export const deleteScheme = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Scheme ID format',
      });
    }

    const scheme = await Scheme.findByIdAndDelete(id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: `Scheme not found with id: ${id}`,
      });
    }

    await logAdminActivity(req, 'DELETE_SCHEME', 'Scheme', id, {
      schemeName: scheme.schemeName,
      category: scheme.category,
    });

    res.status(200).json({
      success: true,
      message: 'Scheme deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all distinct categories with counts (Phase 3 respects Active status)
 * @route   GET /api/categories
 * @access  Public
 */
export const getCategories = async (req, res, next) => {
  try {
    const counts = await Scheme.aggregate([
      { $match: { status: 'Active' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = {};
    counts.forEach((item) => {
      if (item._id) {
        countMap[item._id] = item.count;
      }
    });

    const allCategoryNames = Array.from(
      new Set([...PLATFORM_CATEGORIES, ...Object.keys(countMap)])
    );

    const categoriesList = allCategoryNames.map((name) => ({
      name,
      count: countMap[name] || 0,
    }));

    res.status(200).json({
      success: true,
      count: categoriesList.length,
      data: categoriesList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get distinct metadata for filter options
 * @route   GET /api/schemes/meta/filters
 * @access  Public
 */
export const getFilterOptions = async (req, res, next) => {
  try {
    const [categories, states, departments] = await Promise.all([
      Scheme.distinct('category', { status: 'Active' }),
      Scheme.distinct('state', { status: 'Active' }),
      Scheme.distinct('department', { status: 'Active' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        categories: categories.sort(),
        states: states.sort(),
        departments: departments.sort(),
      },
    });
  } catch (error) {
    next(error);
  }
};
