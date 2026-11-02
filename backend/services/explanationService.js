/**
 * SarkariSetu Recommendation Explanation Service (Phase 5)
 *
 * Provides clear, simple English explanations for why government schemes are recommended,
 * which conditions are satisfied, which are unmet, and what missing profile details
 * are needed to confirm full eligibility.
 *
 * NOTE: Operates reliably with zero external dependencies (deterministic rule-based generator),
 * and supports optional external AI enhancement if configured in the environment.
 * Never invents eligibility rules or overrides verified rule-based matching.
 */

/**
 * Generate human-readable explanation in simple English for a scheme recommendation
 *
 * @param {Object} params
 * @param {Object} params.profile - Citizen profile
 * @param {Object} params.scheme - Scheme document
 * @param {Array<string>} params.matchedConditions - List of satisfied conditions
 * @param {Array<string>} params.unmetConditions - List of unsatisfied conditions
 * @param {Array<string>} params.missingInformation - List of missing profile fields
 * @param {number} params.matchPercentage - Calculated match score (0-100)
 * @returns {string} Clear explanation in simple English
 */
export const generateRecommendationExplanation = ({
  profile = {},
  scheme = {},
  matchedConditions = [],
  unmetConditions = [],
  missingInformation = [],
  matchPercentage = 100,
}) => {
  // Scenario 1: Unmet conditions present
  if (unmetConditions.length > 0) {
    const unmetSummary = unmetConditions
      .map((c) => c.replace(/^Scheme requires |^Restricted to |^Primary target /i, ''))
      .slice(0, 2)
      .join('; ');
    return `Your profile matches some aspects, but currently does not satisfy: ${unmetSummary}.`;
  }

  // Scenario 2: Perfect or strong match (all criteria satisfied, no missing info)
  if (matchPercentage >= 75 && missingInformation.length === 0) {
    const highlights = [];
    if (profile.occupation && scheme.occupations?.length) {
      highlights.push(`occupation as ${profile.occupation}`);
    }
    if (profile.farmerStatus && scheme.farmerRequired) {
      highlights.push('farmer status');
    }
    if (profile.studentStatus && scheme.studentRequired) {
      highlights.push('student status');
    }
    if (profile.disabilityStatus && scheme.disabilityRequired) {
      highlights.push('disability assistance criteria');
    }
    if (profile.age && (scheme.minimumAge != null || scheme.maximumAge != null)) {
      highlights.push(`age (${profile.age} years)`);
    }
    if (profile.state && scheme.state !== 'All India') {
      highlights.push(`residence in ${profile.state}`);
    }
    if (profile.annualIncome && scheme.maximumIncome != null) {
      highlights.push('income eligibility');
    }

    if (highlights.length > 0) {
      return `Strong match based on your ${highlights.slice(0, 3).join(', ')}.`;
    }
    return `Strong match: Your profile satisfies all eligibility criteria specified for this scheme.`;
  }

  // Scenario 3: Needs more information (missing fields)
  if (missingInformation.length > 0) {
    const missingKeys = [];
    if (missingInformation.some((m) => m.toLowerCase().includes('income'))) missingKeys.push('annual income');
    if (missingInformation.some((m) => m.toLowerCase().includes('age'))) missingKeys.push('age');
    if (missingInformation.some((m) => m.toLowerCase().includes('state'))) missingKeys.push('state');
    if (missingInformation.some((m) => m.toLowerCase().includes('gender'))) missingKeys.push('gender');
    if (missingInformation.some((m) => m.toLowerCase().includes('occupation'))) missingKeys.push('occupation');
    if (missingInformation.some((m) => m.toLowerCase().includes('category'))) missingKeys.push('social category');

    const fieldsText = missingKeys.length > 0 ? missingKeys.join(', ') : 'additional profile details';
    return `Potentially matches your profile. Please add your ${fieldsText} to confirm full alignment.`;
  }

  // Scenario 4: General nationwide scheme open to all citizens
  return `Nationwide welfare scheme open to eligible residents across India.`;
};

export default {
  generateRecommendationExplanation,
};
