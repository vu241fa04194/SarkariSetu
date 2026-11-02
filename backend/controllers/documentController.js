import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import Document from '../models/Document.js';
import { UPLOAD_DIR } from '../middleware/uploadMiddleware.js';

/**
 * @desc    Upload a private citizen proof/eligibility document
 * @route   POST /api/documents/upload
 * @access  Private (Citizen / Admin)
 */
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided for upload',
      });
    }

    const { schemeId, documentType } = req.body;

    let schemeRef = null;
    if (schemeId && mongoose.Types.ObjectId.isValid(schemeId)) {
      schemeRef = schemeId;
    }

    const document = await Document.create({
      user: req.user._id,
      scheme: schemeRef,
      originalName: path.basename(req.file.originalname),
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      documentType: documentType || 'General Document',
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded and securely encrypted on disk',
      data: {
        _id: document._id,
        originalName: document.originalName,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        documentType: document.documentType,
        scheme: document.scheme,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all uploaded documents belonging to current citizen
 * @route   GET /api/documents
 * @access  Private
 */
export const getMyDocuments = async (req, res, next) => {
  try {
    const documents = await Document.find({ user: req.user._id })
      .select('-fileName') // Do not expose disk filename to users
      .populate('scheme', 'schemeName category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Securely download an authorized private document
 * @route   GET /api/documents/:id/download
 * @access  Private (Owner or Admin)
 */
export const downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format',
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Authorization: Only document owner or an administrator can access
    const isOwner = document.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to view or download this document.',
      });
    }

    // Prevent path traversal by strictly anchoring to UPLOAD_DIR
    const safeFilePath = path.resolve(UPLOAD_DIR, path.basename(document.fileName));

    if (!safeFilePath.startsWith(UPLOAD_DIR) || !fs.existsSync(safeFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Document file not found on secure storage',
      });
    }

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalName)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const fileStream = fs.createReadStream(safeFilePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a private document
 * @route   DELETE /api/documents/:id
 * @access  Private (Owner or Admin)
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document ID format',
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Authorization check
    const isOwner = document.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not have permission to delete this document.',
      });
    }

    // Remove from disk
    const safeFilePath = path.resolve(UPLOAD_DIR, path.basename(document.fileName));
    if (safeFilePath.startsWith(UPLOAD_DIR) && fs.existsSync(safeFilePath)) {
      try {
        fs.unlinkSync(safeFilePath);
      } catch (fsErr) {
        console.warn('Could not delete file from disk:', fsErr.message);
      }
    }

    await Document.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
