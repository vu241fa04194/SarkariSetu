/**
 * 404 Route Not Found Middleware
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Resource or route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Error Handler Middleware
 * Intercepts errors and produces safe, standardized JSON responses without leaking internal server secrets.
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'An internal server error occurred';

  // Handle JSON Parser SyntaxError (e.g. malformed body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload in request body';
  }

  // Handle CORS Rejection Error
  if (err.message && err.message.includes('CORS access denied')) {
    statusCode = 403;
    message = 'Access forbidden: Request origin not permitted by CORS policy';
    if (req.headers && req.headers.origin) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid resource identifier format';
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Handle Mongoose Duplicate Key Error (409 Conflict)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'record';
    message = `A ${field} with this value already exists in the system`;
  }

  // Handle JWT Verification Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token signature';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired, please sign in again';
  }

  // Handle Multer File Size & Upload Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'Uploaded file exceeds the maximum allowed limit of 5MB';
  } else if (err.code === 'INVALID_FILE_TYPE') {
    statusCode = 400;
  }

  // In production, mask internal 500 error details to prevent information disclosure
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An unexpected internal server error occurred. Please try again later.';
  }

  const response = {
    success: false,
    message,
  };

  // Only expose stack traces in explicit non-production/development environments
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
