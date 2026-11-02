import { generateRecommendationExplanation } from '../services/explanationService.js';

/**
 * SarkariSetu Smart Eligibility Engine (Phase 2 & Phase 5)
 *
 * Compares a citizen profile with structured scheme rules.
 * Generates matched conditions, unmet conditions, missing information,
 * and a calculated match percentage.
 *
 * NOTE: The engine calculates potential alignment and explicitly advises
 * users to verify against official guidelines.
 */

export const evaluateSchemeEligibility = (profile = {}, scheme = {}) => {
  const matchedConditions = [];
  const unmetConditions = [];
  const missingInformation = [];

  let criteriaCount = 0;
  let score = 0;

  // 1. Age Rule
  if (scheme.minimumAge != null || scheme.maximumAge != null) {
    criteriaCount++;
    if (profile.age == null || profile.age === '') {
      missingInformation.push(
        `Age not specified in profile (Scheme expects ${
          scheme.minimumAge != null ? `min ${scheme.minimumAge}` : ''
        } ${scheme.maximumAge != null ? `max ${scheme.maximumAge}` : ''} years)`
      );
    } else {
      const userAge = Number(profile.age);
      const minOk = scheme.minimumAge == null || userAge >= scheme.minimumAge;
      const maxOk = scheme.maximumAge == null || userAge <= scheme.maximumAge;

      if (minOk && maxOk) {
        score++;
        matchedConditions.push(
          `Age (${userAge} yrs) satisfies age requirements${
            scheme.minimumAge != null || scheme.maximumAge != null
              ? ` (${[
                  scheme.minimumAge != null ? `min: ${scheme.minimumAge}` : '',
                  scheme.maximumAge != null ? `max: ${scheme.maximumAge}` : '',
                ]
                  .filter(Boolean)
                  .join(', ')})`
              : ''
          }`
        );
      } else {
        unmetConditions.push(
          `Age (${userAge} yrs) falls outside eligibility window (${[
            scheme.minimumAge != null ? `minimum: ${scheme.minimumAge}` : '',
            scheme.maximumAge != null ? `maximum: ${scheme.maximumAge}` : '',
          ]
            .filter(Boolean)
            .join(', ')})`
        );
      }
    }
  }

  // 2. Gender Rule
  if (scheme.applicableGender && scheme.applicableGender !== 'All') {
    criteriaCount++;
    if (!profile.gender) {
      missingInformation.push(`Gender not specified (Scheme applies to: ${scheme.applicableGender})`);
    } else if (profile.gender.toLowerCase() === scheme.applicableGender.toLowerCase()) {
      score++;
      matchedConditions.push(`Gender criteria met (${scheme.applicableGender})`);
    } else {
      unmetConditions.push(
        `Scheme is designated specifically for ${scheme.applicableGender} applicants`
      );
    }
  }

  // 3. State / Regional Rule
  const isNationalScheme =
    scheme.state === 'All India' ||
    (scheme.eligibleStates && scheme.eligibleStates.includes('All India'));

  if (!isNationalScheme) {
    criteriaCount++;
    const targetStates = scheme.eligibleStates?.length ? scheme.eligibleStates : [scheme.state];
    if (!profile.state) {
      missingInformation.push(
        `State not provided in profile (Scheme is applicable to: ${targetStates.join(', ')})`
      );
    } else {
      const isStateEligible = targetStates.some(
        (st) => st.toLowerCase() === profile.state.trim().toLowerCase()
      );
      if (isStateEligible) {
        score++;
        matchedConditions.push(`State of residence (${profile.state}) matches scheme coverage`);
      } else {
        unmetConditions.push(
          `Restricted to residents of ${targetStates.join(', ')} (Profile state: ${profile.state})`
        );
      }
    }
  } else {
    matchedConditions.push('Nationwide scheme: Open to eligible residents of all Indian States and UTs');
  }

  // 4. Maximum Income Rule
  if (scheme.maximumIncome != null) {
    criteriaCount++;
    if (profile.annualIncome == null || profile.annualIncome === '') {
      missingInformation.push(
        `Annual income not specified (Scheme ceiling is ₹${scheme.maximumIncome.toLocaleString(
          'en-IN'
        )})`
      );
    } else {
      const userIncome = Number(profile.annualIncome);
      if (userIncome <= scheme.maximumIncome) {
        score++;
        matchedConditions.push(
          `Annual income (₹${userIncome.toLocaleString(
            'en-IN'
          )}) is within ceiling limit of ₹${scheme.maximumIncome.toLocaleString('en-IN')}`
        );
      } else {
        unmetConditions.push(
          `Annual income (₹${userIncome.toLocaleString(
            'en-IN'
          )}) exceeds ceiling threshold of ₹${scheme.maximumIncome.toLocaleString('en-IN')}`
        );
      }
    }
  }

  // 5. Occupation Rule
  if (scheme.occupations && scheme.occupations.length > 0) {
    criteriaCount++;
    if (!profile.occupation) {
      missingInformation.push(
        `Occupation not specified (Targeted for: ${scheme.occupations.join(', ')})`
      );
    } else {
      const profileOcc = profile.occupation.toLowerCase();
      const occMatch = scheme.occupations.some(
        (occ) =>
          occ.toLowerCase() === profileOcc ||
          profileOcc.includes(occ.toLowerCase()) ||
          occ.toLowerCase().includes(profileOcc)
      );

      if (occMatch) {
        score++;
        matchedConditions.push(`Occupation (${profile.occupation}) aligns with target sector`);
      } else {
        unmetConditions.push(
          `Primary target occupations are: ${scheme.occupations.join(', ')} (Profile: ${
            profile.occupation
          })`
        );
      }
    }
  }

  // 6. Rural / Urban Demographics Rule
  if (scheme.ruralUrban && scheme.ruralUrban !== 'Both' && scheme.ruralUrban !== 'All') {
    criteriaCount++;
    if (!profile.ruralOrUrban) {
      missingInformation.push(
        `Residential area (Rural/Urban) not specified (Scheme is for: ${scheme.ruralUrban})`
      );
    } else if (
      profile.ruralOrUrban.toLowerCase() === scheme.ruralUrban.toLowerCase() ||
      profile.ruralOrUrban === 'Both'
    ) {
      score++;
      matchedConditions.push(`Residence area (${profile.ruralOrUrban}) matches scheme scope`);
    } else {
      unmetConditions.push(`Scheme applies specifically to ${scheme.ruralUrban} areas`);
    }
  }

  // 7. Student Status Rule
  if (scheme.studentRequired === true) {
    criteriaCount++;
    if (
      profile.studentStatus === true ||
      (profile.occupation && profile.occupation.toLowerCase().includes('student'))
    ) {
      score++;
      matchedConditions.push('Active student status matches scheme prerequisites');
    } else {
      unmetConditions.push('Scheme requires active enrollment as a student');
    }
  }

  // 8. Farmer Status Rule
  if (scheme.farmerRequired === true) {
    criteriaCount++;
    if (
      profile.farmerStatus === true ||
      (profile.occupation && profile.occupation.toLowerCase().includes('farmer'))
    ) {
      score++;
      matchedConditions.push('Farmer / agricultural landholder status confirmed');
    } else {
      unmetConditions.push('Scheme requires agricultural farmer or landholder status');
    }
  }

  // 9. Disability Status Rule
  if (scheme.disabilityRequired === true) {
    criteriaCount++;
    if (profile.disabilityStatus === true) {
      score++;
      matchedConditions.push('Certified disability (Divyangjan) eligibility criteria satisfied');
    } else {
      unmetConditions.push('Scheme requires certified benchmark disability documentation (UDID)');
    }
  }

  // 10. Social Category Rule
  if (
    scheme.applicableCategories &&
    scheme.applicableCategories.length > 0 &&
    !scheme.applicableCategories.includes('All')
  ) {
    criteriaCount++;
    if (!profile.category) {
      missingInformation.push(
        `Category not specified (Scheme targets: ${scheme.applicableCategories.join(', ')})`
      );
    } else if (
      scheme.applicableCategories.some(
        (cat) => cat.toLowerCase() === profile.category.toLowerCase()
      )
    ) {
      score++;
      matchedConditions.push(`Social category (${profile.category}) matches priority reservation`);
    } else {
      unmetConditions.push(
        `Targeted for categories: ${scheme.applicableCategories.join(', ')} (Profile: ${
          profile.category
        })`
      );
    }
  }

  // Calculate Match Percentage
  let matchPercentage = 100;
  if (criteriaCount > 0) {
    matchPercentage = Math.round((score / criteriaCount) * 100);
  }

  // Status designation (adhering strictly to prompt wording guidelines)
  let status = 'Potentially Eligible';
  if (unmetConditions.length > 0 && matchPercentage < 60) {
    status = 'Criteria Unmet';
  } else if (matchPercentage < 75 || missingInformation.length > 0) {
    status = 'Partially Matched';
  }

  // Phase 5: Recommendation Classification
  let matchType = 'potential';
  if (unmetConditions.length > 0) {
    matchType = 'unmet';
  } else if (matchPercentage >= 75) {
    matchType = 'strong';
  } else if (missingInformation.length > 0) {
    matchType = 'needs_info';
  }

  const matchReason = generateRecommendationExplanation({
    profile,
    scheme,
    matchedConditions,
    unmetConditions,
    missingInformation,
    matchPercentage,
  });

  const disclaimer =
    'These recommendations are informational only. Final eligibility is determined by the relevant government department. Please check the official scheme guidelines before applying.';

  return {
    schemeId: scheme._id,
    schemeName: scheme.schemeName,
    category: scheme.category,
    department: scheme.department,
    state: scheme.state,
    officialWebsite: scheme.officialWebsite,
    benefits: scheme.benefits || [],
    description: scheme.description || '',
    matchPercentage,
    matchType,
    matchReason,
    needsMoreInfo: missingInformation.length > 0,
    hasUnmetConditions: unmetConditions.length > 0,
    status,
    matchedConditions,
    unmetConditions,
    missingInformation,
    disclaimer,
  };
};

/**
 * Evaluates multiple schemes and returns sorted results
 */
export const rankSchemesForProfile = (profile, schemes = []) => {
  const evaluations = schemes.map((scheme) =>
    evaluateSchemeEligibility(profile, scheme)
  );

  // Sort by match percentage descending
  evaluations.sort((a, b) => b.matchPercentage - a.matchPercentage);
  return evaluations;
};

export default evaluateSchemeEligibility;
