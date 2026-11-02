import mongoose from 'mongoose';
import Application from '../models/Application.js';
import Scheme from '../models/Scheme.js';
import Notification from '../models/Notification.js';

/**
 * @desc    Get all application tracking entries for current citizen
 * @route   GET /api/applications
 * @access  Private (Citizen)
 */
export const getMyApplications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };

    if (status && status !== 'All') {
      filter.status = status;
    }

    const applications = await Application.find(filter)
      .populate('scheme')
      .sort({ updatedAt: -1 });

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
 * @desc    Create or update personal scheme tracking entry
 * @route   POST /api/applications
 * @access  Private (Citizen)
 */
export const trackApplication = async (req, res, next) => {
  try {
    const {
      schemeId,
      status,
      applicationDate,
      submissionDate,
      referenceNumber,
      notes,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(schemeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID' });
    }

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }

    const appStatus = status || 'Interested';
    const subDate = submissionDate
      ? new Date(submissionDate)
      : appStatus === 'Application Submitted'
      ? new Date()
      : null;

    // Upsert tracking entry
    const application = await Application.findOneAndUpdate(
      { user: req.user._id, scheme: schemeId },
      {
        status: appStatus,
        applicationDate: applicationDate ? new Date(applicationDate) : null,
        submissionDate: subDate,
        statusUpdateDate: new Date(),
        referenceNumber: referenceNumber || '',
        notes: notes || '',
      },
      { new: true, upsert: true, runValidators: true }
    ).populate('scheme');

    // Create confirmation notification
    try {
      await Notification.create({
        user: req.user._id,
        title: `Tracking: ${scheme.schemeName}`,
        message: `Personal status updated to "${appStatus}". You can update notes and application references anytime.`,
        type: 'application_reminder',
        link: '/applications',
      });
    } catch (notifErr) {
      console.warn('Could not create notification:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Application tracking record updated successfully',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update application entry by ID
 * @route   PUT /api/applications/:id
 * @access  Private (Citizen)
 */
export const updateApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      applicationDate,
      submissionDate,
      referenceNumber,
      notes,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    const application = await Application.findOne({ _id: id, user: req.user._id });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application record not found' });
    }

    const oldStatus = application.status;
    if (status !== undefined) {
      application.status = status;
      application.statusUpdateDate = new Date();
      if (status === 'Application Submitted' && !application.submissionDate) {
        application.submissionDate = new Date();
      }
    }
    if (submissionDate !== undefined) {
      application.submissionDate = submissionDate ? new Date(submissionDate) : null;
    }
    if (applicationDate !== undefined) {
      application.applicationDate = applicationDate ? new Date(applicationDate) : null;
    }
    if (referenceNumber !== undefined) application.referenceNumber = referenceNumber;
    if (notes !== undefined) application.notes = notes;

    await application.save();
    await application.populate('scheme');

    if (status && status !== oldStatus) {
      try {
        await Notification.create({
          user: req.user._id,
          title: `Status Updated: ${application.scheme?.schemeName || 'Application'}`,
          message: `Your tracked application status has been updated to "${status}".`,
          type: 'status_update',
          link: '/applications',
        });
      } catch (notifErr) {
        console.warn('Could not create notification on status update:', notifErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Tracking record updated',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Untrack an application
 * @route   DELETE /api/applications/:id
 * @access  Private (Citizen)
 */
export const deleteApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid application ID' });
    }

    const application = await Application.findOneAndDelete({ _id: id, user: req.user._id });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application record not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Scheme untracked successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
