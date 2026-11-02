import mongoose from 'mongoose';
import Checklist from '../models/Checklist.js';
import Scheme from '../models/Scheme.js';
import User from '../models/User.js';

/**
 * Helper to compute personalization categorization for scheme documents given a user's profile
 */
export const categorizeSchemeDocuments = (scheme, userProfile = null) => {
  const requirements = scheme.documentRequirements || [];

  // If no structured requirements exist, fallback to requiredDocuments string array
  if (requirements.length === 0 && scheme.requiredDocuments && scheme.requiredDocuments.length > 0) {
    return scheme.requiredDocuments.map((docName) => ({
      documentName: docName,
      documentType: 'required',
      conditionType: 'all',
      applicabilityStatus: 'required',
      description: 'Mandatory documentation for scheme registration & KYC verification.',
      conditionDescription: '',
      isApplicable: true,
      missingField: null,
    }));
  }

  return requirements.map((doc) => {
    let applicabilityStatus = doc.documentType; // 'required', 'optional', 'conditional'
    let isApplicable = true;
    let missingField = null;
    let reason = doc.description || '';

    if (doc.documentType === 'conditional') {
      if (!userProfile) {
        // Guest user - marked as conditional pending profile
        applicabilityStatus = 'conditional';
        isApplicable = true;
        reason = doc.conditionDescription || 'Conditional requirement based on applicant demographic category.';
      } else {
        switch (doc.conditionType) {
          case 'farmer':
            if (userProfile.isFarmer === true || userProfile.occupation === 'Farmer') {
              applicabilityStatus = 'conditional';
              isApplicable = true;
              reason = 'Applicable: You are registered as an agricultural farmer.';
            } else if (userProfile.isFarmer === false && userProfile.occupation !== 'Farmer') {
              applicabilityStatus = 'not_applicable';
              isApplicable = false;
              reason = 'Not applicable: Agricultural landholder proof is only required for farmers.';
            } else {
              applicabilityStatus = 'conditional';
              isApplicable = true;
              missingField = 'isFarmer';
              reason = 'Farmer status not specified in your profile.';
            }
            break;

          case 'student':
            if (userProfile.isStudent === true || userProfile.occupation === 'Student') {
              applicabilityStatus = 'conditional';
              isApplicable = true;
              reason = 'Applicable: You are enrolled as a student.';
            } else if (userProfile.isStudent === false && userProfile.occupation !== 'Student') {
              applicabilityStatus = 'not_applicable';
              isApplicable = false;
              reason = 'Not applicable: Academic bonafide records only required for enrolled students.';
            } else {
              applicabilityStatus = 'conditional';
              isApplicable = true;
              missingField = 'isStudent';
              reason = 'Student enrolment status not specified in your profile.';
            }
            break;

          case 'disability':
            if (userProfile.hasDisability === true) {
              applicabilityStatus = 'conditional';
              isApplicable = true;
              reason = 'Applicable: Benchmark disability (Divyangjan) certificate required.';
            } else if (userProfile.hasDisability === false) {
              applicabilityStatus = 'not_applicable';
              isApplicable = false;
              reason = 'Not applicable: UDID certificate only required for Divyangjan quota.';
            } else {
              applicabilityStatus = 'conditional';
              isApplicable = true;
              missingField = 'hasDisability';
              reason = 'Disability status not specified in your profile.';
            }
            break;

          case 'reserved_category':
            if (['SC', 'ST', 'OBC'].includes(userProfile.category)) {
              applicabilityStatus = 'conditional';
              isApplicable = true;
              reason = `Applicable: Caste / community certificate required for ${userProfile.category} category quota.`;
            } else if (userProfile.category === 'General') {
              applicabilityStatus = 'not_applicable';
              isApplicable = false;
              reason = 'Not applicable: Caste certificate not required for General / Unreserved category.';
            } else {
              applicabilityStatus = 'conditional';
              isApplicable = true;
              missingField = 'category';
              reason = 'Social reservation category not specified in your profile.';
            }
            break;

          case 'income_dependent':
            if (scheme.maximumIncome != null) {
              if (userProfile.annualIncome != null) {
                applicabilityStatus = 'conditional';
                isApplicable = true;
                reason = `Income verification certificate required (income ceiling threshold: ₹${scheme.maximumIncome.toLocaleString('en-IN')}).`;
              } else {
                applicabilityStatus = 'conditional';
                isApplicable = true;
                missingField = 'annualIncome';
                reason = 'Annual income not specified in your profile.';
              }
            }
            break;

          case 'women':
            if (userProfile.gender === 'Female') {
              applicabilityStatus = 'conditional';
              isApplicable = true;
              reason = 'Applicable: Women applicant entitlement documents.';
            } else if (userProfile.gender === 'Male') {
              applicabilityStatus = 'not_applicable';
              isApplicable = false;
              reason = 'Not applicable: Specific women welfare benefits.';
            }
            break;

          default:
            applicabilityStatus = 'conditional';
            isApplicable = true;
        }
      }
    }

    return {
      documentName: doc.documentName,
      documentType: doc.documentType,
      conditionType: doc.conditionType,
      applicabilityStatus,
      isApplicable,
      missingField,
      reason,
      description: doc.description || reason,
      conditionDescription: doc.conditionDescription,
      issuingAuthority: doc.issuingAuthority || '',
    };
  });
};

/**
 * @desc    Get user checklist for a scheme (or compute default personalized list)
 * @route   GET /api/checklists/scheme/:schemeId
 * @access  Private (Citizen)
 */
export const getSchemeChecklist = async (req, res, next) => {
  try {
    const { schemeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(schemeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID' });
    }

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }

    // Guest mode: compute default checklist without persisting
    if (!req.user) {
      const guestDocs = categorizeSchemeDocuments(scheme, null);
      const guestItems = guestDocs
        .filter((d) => d.isApplicable)
        .map((d) => ({
          documentName: d.documentName,
          documentType: d.documentType,
          conditionType: d.conditionType,
          status: 'pending',
          isCollected: false,
          notes: '',
        }));

      return res.status(200).json({
        success: true,
        isGuest: true,
        data: {
          checklist: {
            scheme: schemeId,
            items: guestItems,
            personalNotes: '',
            completionPercentage: 0,
          },
          items: guestItems,
          completionPercentage: 0,
          categories: {
            required: guestDocs.filter((d) => d.applicabilityStatus === 'required'),
            optional: guestDocs.filter((d) => d.applicabilityStatus === 'optional'),
            conditional: guestDocs.filter((d) => d.applicabilityStatus === 'conditional'),
            notApplicable: guestDocs.filter((d) => d.applicabilityStatus === 'not_applicable'),
          },
          personalizedDocs: guestDocs,
          schemeName: scheme.schemeName,
          portalUrl: scheme.officialWebsite || scheme.sourceURL,
        },
      });
    }

    const user = await User.findById(req.user._id);

    // Compute personalized docs for this user
    const personalizedDocs = categorizeSchemeDocuments(scheme, user);

    let checklist = await Checklist.findOne({ user: req.user._id, scheme: schemeId });

    if (!checklist) {
      // Build default items from applicable documents
      const defaultItems = personalizedDocs
        .filter((d) => d.isApplicable)
        .map((d) => ({
          documentName: d.documentName,
          documentType: d.documentType,
          conditionType: d.conditionType,
          status: 'pending',
          notes: '',
        }));

      checklist = new Checklist({
        user: req.user._id,
        scheme: schemeId,
        items: defaultItems,
        personalNotes: '',
        completionPercentage: 0,
      });

      await checklist.save();
    }

    const responseChecklist = checklist.toObject();
    responseChecklist.items = responseChecklist.items.map((i) => ({
      ...i,
      isCollected: i.status === 'collected',
    }));

    res.status(200).json({
      success: true,
      data: {
        checklist: responseChecklist,
        items: responseChecklist.items,
        completionPercentage: responseChecklist.completionPercentage,
        categories: {
          required: personalizedDocs.filter((d) => d.applicabilityStatus === 'required'),
          optional: personalizedDocs.filter((d) => d.applicabilityStatus === 'optional'),
          conditional: personalizedDocs.filter((d) => d.applicabilityStatus === 'conditional'),
          notApplicable: personalizedDocs.filter((d) => d.applicabilityStatus === 'not_applicable'),
        },
        personalizedDocs,
        schemeName: scheme.schemeName,
        portalUrl: scheme.officialWebsite || scheme.sourceURL,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save or update complete checklist for a scheme
 * @route   POST /api/checklists/scheme/:schemeId
 * @access  Private (Citizen)
 */
export const saveSchemeChecklist = async (req, res, next) => {
  try {
    const { schemeId } = req.params;
    const { items, personalNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(schemeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID' });
    }

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }

    if (items && !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items must be an array' });
    }

    let checklist = await Checklist.findOne({ user: req.user._id, scheme: schemeId });

    if (!checklist) {
      checklist = new Checklist({
        user: req.user._id,
        scheme: schemeId,
        items: items || [],
        personalNotes: personalNotes || '',
      });
    } else {
      if (items !== undefined) checklist.items = items;
      if (personalNotes !== undefined) checklist.personalNotes = personalNotes;
    }

    await checklist.save();

    res.status(200).json({
      success: true,
      message: 'Checklist saved successfully',
      data: checklist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle single item collected/pending or update document note
 * @route   PATCH /api/checklists/scheme/:schemeId/item
 * @access  Private (Citizen)
 */
export const toggleChecklistItem = async (req, res, next) => {
  try {
    const { schemeId } = req.params;
    const { documentName, status, isCollected, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(schemeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID' });
    }

    if (!documentName || typeof documentName !== 'string') {
      return res.status(400).json({ success: false, message: 'Document name is required' });
    }

    let targetStatus = status;
    if (targetStatus === undefined && isCollected !== undefined) {
      targetStatus = isCollected ? 'collected' : 'pending';
    }

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }

    let checklist = await Checklist.findOne({ user: req.user._id, scheme: schemeId });

    if (!checklist) {
      const user = await User.findById(req.user._id);
      const personalizedDocs = categorizeSchemeDocuments(scheme, user);
      const initialItems = personalizedDocs
        .filter((d) => d.isApplicable)
        .map((d) => ({
          documentName: d.documentName,
          documentType: d.documentType,
          conditionType: d.conditionType,
          status: 'pending',
          notes: '',
        }));

      checklist = new Checklist({
        user: req.user._id,
        scheme: schemeId,
        items: initialItems,
      });
    }

    // Locate the item
    const itemIndex = checklist.items.findIndex((i) => i.documentName.toLowerCase() === documentName.trim().toLowerCase());

    if (itemIndex > -1) {
      if (targetStatus !== undefined) {
        checklist.items[itemIndex].status = targetStatus;
        checklist.items[itemIndex].collectedAt = targetStatus === 'collected' ? new Date() : null;
      }
      if (notes !== undefined) {
        checklist.items[itemIndex].notes = notes;
      }
    } else {
      // Add custom or missing item
      checklist.items.push({
        documentName: documentName.trim(),
        status: targetStatus || 'pending',
        notes: notes || '',
        collectedAt: targetStatus === 'collected' ? new Date() : null,
      });
    }

    await checklist.save();

    const responseChecklist = checklist.toObject();
    responseChecklist.items = responseChecklist.items.map((i) => ({
      ...i,
      isCollected: i.status === 'collected',
    }));

    res.status(200).json({
      success: true,
      message: 'Checklist item updated',
      data: responseChecklist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset checklist progress for a scheme
 * @route   DELETE /api/checklists/scheme/:schemeId
 * @access  Private (Citizen)
 */
export const resetSchemeChecklist = async (req, res, next) => {
  try {
    const { schemeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(schemeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID' });
    }

    const checklist = await Checklist.findOne({ user: req.user._id, scheme: schemeId });
    if (!checklist) {
      return res.status(404).json({ success: false, message: 'Checklist not found' });
    }

    // Reset items to pending and clear collected dates
    checklist.items.forEach((item) => {
      item.status = 'pending';
      item.collectedAt = null;
    });
    checklist.personalNotes = '';
    checklist.completionPercentage = 0;

    await checklist.save();

    res.status(200).json({
      success: true,
      message: 'Checklist progress reset successfully',
      data: checklist,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all checklists for logged-in citizen
 * @route   GET /api/checklists
 * @access  Private (Citizen)
 */
export const getMyChecklists = async (req, res, next) => {
  try {
    const checklists = await Checklist.find({ user: req.user._id })
      .populate('scheme', 'schemeName category department officialWebsite')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: checklists.length,
      data: checklists,
    });
  } catch (error) {
    next(error);
  }
};
