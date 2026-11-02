import AuditLog from '../models/AuditLog.js';

/**
 * Record an administrative activity in the audit trail.
 *
 * @param {object} req - Express request object (contains req.user, ip, headers)
 * @param {string} action - Action enum code
 * @param {string} targetModel - Affected entity name ('Scheme', 'User', etc.)
 * @param {string} targetId - Identifier of target entity
 * @param {object} details - Contextual payload / differences
 */
export const logAdminActivity = async (req, action, targetModel, targetId, details = {}) => {
  try {
    if (!req.user) return null;

    const ipAddress =
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      '';

    const userAgent = req.headers['user-agent'] || '';

    const logEntry = await AuditLog.create({
      admin: req.user._id,
      adminEmail: req.user.email,
      action,
      targetModel,
      targetId: String(targetId || ''),
      details,
      ipAddress: String(ipAddress),
      userAgent: String(userAgent),
    });

    return logEntry;
  } catch (error) {
    // Non-blocking error logging
    console.warn('[AuditLogger] Failed to write audit log:', error.message);
    return null;
  }
};

export default logAdminActivity;
