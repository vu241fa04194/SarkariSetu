import mongoose from 'mongoose';
import Scheme from '../models/Scheme.js';
import User from '../models/User.js';
import {
  evaluateSchemeEligibility,
  rankSchemesForProfile,
} from '../utils/eligibilityEngine.js';

/**
 * @desc    Check eligibility against provided profile (custom or guest or auth)
 * @route   POST /api/eligibility/check
 * @access  Public / Optional Auth
 */
export const checkEligibility = async (req, res, next) => {
  try {
    const profile = req.body.profile || req.body;
    const { schemeId } = req.body;

    if (schemeId) {
      if (!mongoose.Types.ObjectId.isValid(schemeId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Scheme ID format',
        });
      }

      // Evaluate specific scheme
      const scheme = await Scheme.findById(schemeId);
      if (!scheme) {
        return res.status(404).json({
          success: false,
          message: 'Scheme not found',
        });
      }

      const result = evaluateSchemeEligibility(profile, scheme);
      return res.status(200).json({
        success: true,
        data: result,
      });
    }

    // Evaluate all active schemes in database
    const schemes = await Scheme.find({ status: 'Active' });
    const results = schemes.map((scheme) => {
      const evaluation = evaluateSchemeEligibility(profile, scheme);
      return {
        ...evaluation,
        scheme,
      };
    });

    results.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get personalized scheme recommendations based on authenticated user's profile
 * @route   GET /api/eligibility/recommendations
 * @access  Private
 */
export const getRecommendations = async (req, res, next) => {
  try {
    const { category, state, sort = 'score_desc', minScore, matchType } = req.query;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Citizen profile from user document
    const profile = {
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
    };

    // Retrieve active schemes
    const schemes = await Scheme.find({ status: 'Active' });

    // Map each scheme to full evaluation
    const evaluated = schemes.map((scheme) => {
      const evaluation = evaluateSchemeEligibility(profile, scheme);
      return {
        ...evaluation,
        scheme, // full scheme document for comprehensive UI display
      };
    });

    // Compute overview statistics before query filters
    const strongMatchesCount = evaluated.filter((r) => r.matchType === 'strong').length;
    const potentialMatchesCount = evaluated.filter((r) => r.matchType === 'potential').length;
    const needsInfoCount = evaluated.filter((r) => r.needsMoreInfo).length;

    // Apply query filters if provided
    let results = evaluated;

    if (category && category.trim() !== '' && category !== 'All') {
      const catRegex = new RegExp(`^${category.trim()}$`, 'i');
      results = results.filter((r) => catRegex.test(r.category));
    }

    if (state && state.trim() !== '' && state !== 'All') {
      const targetState = state.trim().toLowerCase();
      results = results.filter(
        (r) =>
          r.state === 'All India' ||
          (r.state && r.state.toLowerCase() === targetState) ||
          (r.scheme.eligibleStates &&
            r.scheme.eligibleStates.some(
              (st) => st.toLowerCase() === targetState || st === 'All India'
            ))
      );
    }

    if (minScore != null && minScore !== '') {
      const minVal = Number(minScore);
      if (!isNaN(minVal)) {
        results = results.filter((r) => r.matchPercentage >= minVal);
      }
    }

    if (matchType && matchType !== 'All') {
      if (matchType === 'needs_info') {
        results = results.filter((r) => r.needsMoreInfo && !r.hasUnmetConditions);
      } else {
        results = results.filter((r) => r.matchType === matchType);
      }
    }

    // Sorting
    if (sort === 'score_asc') {
      results.sort((a, b) => a.matchPercentage - b.matchPercentage);
    } else if (sort === 'recently_added') {
      results.sort((a, b) => new Date(b.scheme?.createdAt || 0) - new Date(a.scheme?.createdAt || 0));
    } else if (sort === 'name_asc') {
      results.sort((a, b) => (a.schemeName || '').localeCompare(b.schemeName || ''));
    } else {
      // Default: score_desc (highest score first)
      results.sort((a, b) => {
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }
        return new Date(b.scheme?.createdAt || 0) - new Date(a.scheme?.createdAt || 0);
      });
    }

    // Profile completion calculation
    const profileFields = [
      'age',
      'gender',
      'state',
      'district',
      'occupation',
      'annualIncome',
      'ruralOrUrban',
      'category',
    ];
    const filledFields = profileFields.filter(
      (field) => profile[field] !== null && profile[field] !== '' && profile[field] !== undefined
    );
    const missingFields = profileFields.filter(
      (field) => profile[field] === null || profile[field] === '' || profile[field] === undefined
    );
    const profileCompletion = Math.round(
      (filledFields.length / profileFields.length) * 100
    );

    const disclaimer =
      'These recommendations are informational only. Final eligibility is determined by the relevant government department. Please check the official scheme guidelines before applying.';

    res.status(200).json({
      success: true,
      count: results.length,
      totalActiveSchemes: evaluated.length,
      profileCompletion,
      filledFields,
      missingFields,
      strongMatchesCount,
      potentialMatchesCount,
      needsInfoCount,
      disclaimer,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};
