/**
 * Escapes special regular expression characters in a string to prevent
 * ReDoS (Regular Expression Denial of Service) and regex injection.
 *
 * @param {string} string - Raw user input string
 * @returns {string} - Escaped string safe for new RegExp()
 */
export const escapeRegex = (string) => {
  if (typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export default escapeRegex;
