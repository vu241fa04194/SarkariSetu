import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure secure private upload directory exists
export const UPLOAD_DIR = path.resolve(__dirname, '../uploads/documents');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Strict whitelist of allowed extensions and MIME types
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
]);

// Explicit blacklist of dangerous and executable extensions
const EXECUTABLE_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.php', '.phtml',
  '.js', '.mjs', '.ts', '.html', '.htm', '.xhtml', '.svg',
  '.vbs', '.py', '.rb', '.pl', '.jar', '.dll', '.so',
]);

// Multer Disk Storage with safe UUID filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

// File filter verifying extension and MIME type
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // 1. Check for executable or dangerous extension
  if (EXECUTABLE_EXTENSIONS.has(ext)) {
    const err = new Error('Executable and script file uploads are strictly prohibited for security.');
    err.code = 'INVALID_FILE_TYPE';
    return cb(err, false);
  }

  // 2. Check extension whitelist
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error('Only PDF, JPG, JPEG, and PNG files are accepted.');
    err.code = 'INVALID_FILE_TYPE';
    return cb(err, false);
  }

  // 3. Check MIME type whitelist
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const err = new Error('Invalid file MIME type. Only PDF and JPEG/PNG images are allowed.');
    err.code = 'INVALID_FILE_TYPE';
    return cb(err, false);
  }

  cb(null, true);
};

// 5MB maximum file size
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1, // 1 file per request
  },
});

/**
 * Express Middleware: Handles Multer file upload with custom error mapping
 */
export const handleDocumentUpload = (fieldName = 'file') => {
  const uploadFields = upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'document', maxCount: 1 },
  ]);

  return (req, res, next) => {
    uploadFields(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'File size exceeds maximum allowed limit of 5MB.',
            });
          }
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`,
          });
        }

        if (err.code === 'INVALID_FILE_TYPE' || err.message) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        return next(err);
      }

      if (req.files) {
        req.file = req.files['file']?.[0] || req.files['document']?.[0] || null;
      }

      next();
    });
  };
};

export default handleDocumentUpload;
