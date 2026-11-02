/**
 * Helper generators for Phase 7: Document Requirements & Application Guidance
 */

export const generateDocumentRequirements = (scheme) => {
  const docs = [];
  const cat = (scheme.category || '').toLowerCase();
  const name = (scheme.schemeName || '').toLowerCase();

  // 1. Mandatory Core Identity & DBT
  docs.push({
    documentName: 'Aadhaar Card',
    documentType: 'required',
    conditionType: 'all',
    conditionDescription: '',
    description: 'Mandatory proof of citizen identity and Aadhaar-based OTP verification.',
    issuingAuthority: 'Unique Identification Authority of India (UIDAI)',
  });

  docs.push({
    documentName: 'Bank Account Passbook / Statement',
    documentType: 'required',
    conditionType: 'all',
    conditionDescription: '',
    description: 'Active savings bank account details with IFSC code for Direct Benefit Transfer (DBT).',
    issuingAuthority: 'Scheduled Commercial Bank / Post Office',
  });

  docs.push({
    documentName: 'Mobile Number linked to Aadhaar',
    documentType: 'required',
    conditionType: 'all',
    conditionDescription: '',
    description: 'Required to receive e-KYC One Time Password (OTP) during portal registration.',
    issuingAuthority: 'Authorized Telecom Provider',
  });

  // 2. Farmer / Agriculture specific
  if (
    cat.includes('farmer') ||
    cat.includes('agriculture') ||
    cat.includes('irrigation') ||
    scheme.farmerRequired ||
    name.includes('kisan') ||
    name.includes('krishi') ||
    name.includes('fasal')
  ) {
    docs.push({
      documentName: 'Landholding Records (RoR / Khatauni / Jamabandi)',
      documentType: 'conditional',
      conditionType: 'farmer',
      conditionDescription: 'Mandatory for all agricultural landowners and farmers.',
      description: 'Proof of cultivable agricultural land ownership registered in state land revenue records.',
      issuingAuthority: 'State Revenue Department / Tehsildar',
    });

    docs.push({
      documentName: 'Kisan Credit Card (KCC) / Soil Health Card',
      documentType: 'optional',
      conditionType: 'farmer',
      conditionDescription: 'Optional supplementary documentation for subsidized farm credit.',
      description: 'Supports accelerated processing of crop insurance and credit disbursements.',
      issuingAuthority: 'Lead Bank / Agriculture Department',
    });
  }

  // 3. Student / Education specific
  if (
    cat.includes('student') ||
    cat.includes('education') ||
    scheme.studentRequired ||
    name.includes('scholarship') ||
    name.includes('vidya') ||
    name.includes('fellowship')
  ) {
    docs.push({
      documentName: 'Student Bonafide / Enrolment Certificate',
      documentType: 'conditional',
      conditionType: 'student',
      conditionDescription: 'Required for all student scholarship applicants.',
      description: 'Proof of active admission and regular enrolment in a recognized school, college, or university.',
      issuingAuthority: 'Head of Educational Institution',
    });

    docs.push({
      documentName: 'Previous Academic Year Marksheet',
      documentType: 'conditional',
      conditionType: 'student',
      conditionDescription: 'Required to verify academic merit criteria.',
      description: 'Official score card verifying percentage/grade requirements of the scholarship.',
      issuingAuthority: 'Recognized State / Central Education Board / University',
    });

    docs.push({
      documentName: 'Institute Fee Receipt',
      documentType: 'optional',
      conditionType: 'student',
      conditionDescription: 'Optional proof of fee payment for tuition fee reimbursement.',
      description: 'Verification of academic fee schedule.',
      issuingAuthority: 'Educational Institution Accounts Section',
    });
  }

  // 4. Disability Welfare specific
  if (
    cat.includes('disability') ||
    scheme.disabilityRequired ||
    name.includes('divyang') ||
    name.includes('disability') ||
    name.includes('swavlamban')
  ) {
    docs.push({
      documentName: 'Unique Disability ID (UDID) Card / Medical Certificate',
      documentType: 'conditional',
      conditionType: 'disability',
      conditionDescription: 'Mandatory for Divyangjan applicants seeking disability quota benefits.',
      description: 'Certified benchmark disability certificate with at least 40% permanent impairment.',
      issuingAuthority: 'District Medical Board / Ministry of Social Justice',
    });
  }

  // 5. Senior Citizen specific
  if (cat.includes('senior') || (scheme.minimumAge && scheme.minimumAge >= 60) || name.includes('old age') || name.includes('vayo')) {
    docs.push({
      documentName: 'Proof of Age (Birth Certificate / Voter ID / Pension Card)',
      documentType: 'conditional',
      conditionType: 'senior_citizen',
      conditionDescription: 'Required to verify attainment of age 60 years or above.',
      description: 'Government-issued age verification verifying senior citizen eligibility.',
      issuingAuthority: 'UIDAI / Election Commission / Municipal Authority',
    });
  }

  // 6. Women & Child specific
  if (cat.includes('women') || scheme.applicableGender === 'Female' || name.includes('matru') || name.includes('mahila') || name.includes('sukanya') || name.includes('beti')) {
    docs.push({
      documentName: 'Mother-Child Protection (MCP) Card / Delivery Certificate',
      documentType: 'conditional',
      conditionType: 'women',
      conditionDescription: 'Required for pregnant women and lactating mothers under maternal health schemes.',
      description: 'Records of antenatal check-ups and institutional delivery status.',
      issuingAuthority: 'Primary Health Centre (PHC) / Anganwadi Centre',
    });
  }

  // 7. Income-tested schemes
  if (scheme.maximumIncome != null && scheme.maximumIncome <= 800000) {
    docs.push({
      documentName: 'Income Certificate / BPL Ration Card',
      documentType: 'conditional',
      conditionType: 'income_dependent',
      conditionDescription: `Required to prove annual family income is below ₹${scheme.maximumIncome.toLocaleString('en-IN')}.`,
      description: 'Official revenue document certifying gross household income.',
      issuingAuthority: 'Revenue Tehsildar / Sub-Divisional Magistrate',
    });
  }

  // 8. Reserved category support
  if (scheme.applicableCategories && scheme.applicableCategories.length > 0 && !scheme.applicableCategories.includes('All')) {
    docs.push({
      documentName: 'Caste / Community Certificate (SC / ST / OBC)',
      documentType: 'conditional',
      conditionType: 'reserved_category',
      conditionDescription: 'Required for candidates claiming benefits under affirmative action quota.',
      description: 'Proof of social category recognized under Central / State reservation list.',
      issuingAuthority: 'District Magistrate / Sub-Divisional Officer',
    });
  }

  // 9. Standard Optional documentation
  docs.push({
    documentName: 'Recent Passport-Size Photographs',
    documentType: 'optional',
    conditionType: 'all',
    conditionDescription: '',
    description: 'Required for physical application forms and beneficiary identity card creation.',
    issuingAuthority: 'Applicant',
  });

  return docs;
};

export const generateApplicationGuidance = (scheme) => {
  const cat = (scheme.category || '').toLowerCase();
  const name = (scheme.schemeName || '').toLowerCase();

  // Submission method
  let submissionMethod = 'Online';
  if (cat.includes('farmer') || cat.includes('irrigation') || cat.includes('housing')) {
    submissionMethod = 'Online & Offline';
  } else if (cat.includes('senior') || cat.includes('disability')) {
    submissionMethod = 'CSC / Seva Kendra';
  }

  // Step-by-step
  let stepByStepInstructions = [];
  if (scheme.applicationProcess && scheme.applicationProcess.length > 0) {
    stepByStepInstructions = scheme.applicationProcess;
  } else {
    stepByStepInstructions = [
      `Step 1: Access the official portal (${scheme.officialWebsite || 'https://www.india.gov.in'}).`,
      'Step 2: Complete citizen registration using Aadhaar number and OTP authentication.',
      'Step 3: Fill out the application form with demographic, income, and bank account details.',
      'Step 4: Upload soft copies of required documents in PDF/JPEG format.',
      'Step 5: Review all entered information, submit the application, and save the generated Application Reference Number.',
    ];
  }

  // Deadlines
  let deadlines = 'Rolling / Open throughout the year';
  if (cat.includes('student') || cat.includes('education')) {
    deadlines = 'Academic Session Application Window (typically open July to December annually)';
  } else if (name.includes('fasal') || name.includes('insurance')) {
    deadlines = 'Seasonal Crop Notification Deadlines (Kharif: 31st July / Rabi: 31st December)';
  }

  // Helpline
  const helpline = {
    phone: '1800-11-0001 / 14447 (National Citizen Helpdesk)',
    email: 'helpdesk@sarkarisetu.gov.in',
    hours: 'Monday to Saturday, 9:00 AM – 6:00 PM IST',
  };

  if (name.includes('kisan')) {
    helpline.phone = '155261 / 011-24300606 (PM-KISAN Helpdesk)';
    helpline.email = 'pmkisan-ict@gov.in';
  } else if (name.includes('ayushman') || name.includes('pmjay')) {
    helpline.phone = '14555 (Toll-Free National Health Authority)';
    helpline.email = 'pmjay@nha.gov.in';
  } else if (name.includes('mudra')) {
    helpline.phone = '1800-180-1111 (National MUDRA Toll-Free)';
    helpline.email = 'help@mudra.org.in';
  }

  // Warnings
  const warnings = [
    'Official government portals never charge registration fees beyond designated CSC processing fees. Beware of fake clone domains that do not end in .gov.in or .nic.in.',
    'Always verify that your bank account is active, seeded with Aadhaar, and enabled for Direct Benefit Transfer (DBT) to prevent payment rejection.',
    'Do not share OTPs, net-banking passwords, or UPI PINs with any third-party agent or unauthorized telecaller claiming to process government schemes.',
  ];

  return {
    submissionMethod,
    stepByStepInstructions,
    deadlines,
    helpline,
    warnings,
    sourceUrl: scheme.officialWebsite || scheme.sourceURL || 'https://www.india.gov.in',
    officialPortalURL: scheme.officialWebsite || scheme.sourceURL || 'https://www.india.gov.in',
    lastVerifiedDate: new Date(),
  };
};
