import { DocumentType, CaseStatus, UserRole } from '@/types';

/**
 * Document permissions based on role and case status
 * Defines which document types each role can upload at different stages
 */

// Document categories for better organization
export const DOCUMENT_CATEGORIES = {
  INITIAL: [
    'passport_front',
    'passport_back',
    'medical_reports',
    'treatment_records',
    'attender_passport',
    'attender_id',
    'patient_photo',
    'medical_prescription',
    'lab_blood',
    'lab_urine',
    'lab_xray',
    'radiology_ct',
    'radiology_mri',
    'radiology_ultrasound',
    'doctor_referral',
    'insurance_docs',
    'previous_discharge',
    'vaccination_records',
    'allergy_info',
    'medication_list',
    'other_medical',
  ] as DocumentType[],
  TRAVEL: [
    'visa_application',
    'visa_copy',
    'flight_tickets',
    'travel_insurance',
    'hotel_booking',
  ] as DocumentType[],
  FINANCIAL: [
    'payment_receipt',
    'hospital_invoice',
    'credit_payment_proof',
    'bank_transfer',
  ] as DocumentType[],
  TREATMENT: [
    'medical_reports',
    'treatment_records',
    'lab_blood',
    'lab_urine',
    'lab_xray',
    'radiology_ct',
    'radiology_mri',
    'radiology_ultrasound',
    'medical_prescription',
    'other_medical',
  ] as DocumentType[],
  DISCHARGE: [
    'previous_discharge',
    'medical_reports',
    'medical_prescription',
  ] as DocumentType[],
};

/**
 * Get available document types for a role at a specific case status
 */
export const getAvailableDocumentTypes = (
  role: UserRole,
  caseStatus: CaseStatus,
  alreadyUploaded: DocumentType[]
): DocumentType[] => {
  const allTypes: DocumentType[] = Object.keys(DOCUMENT_CATEGORIES).flatMap(
    cat => DOCUMENT_CATEGORIES[cat as keyof typeof DOCUMENT_CATEGORIES]
  );

  // Filter out already uploaded documents
  const available = allTypes.filter(type => !alreadyUploaded.includes(type));

  // Role and status-based filtering
  switch (role) {
    case 'agent':
      // Agents can upload initial documents in early stages
      if (caseStatus === 'new' || caseStatus === 'case_agent_review') {
        return available.filter(type => DOCUMENT_CATEGORIES.INITIAL.includes(type));
      }
      // Agents can upload visa copy after visa approval
      if (caseStatus === 'visa_approved' || caseStatus === 'visa_copy_uploaded') {
        return available.filter(type => type === 'visa_copy');
      }
      // Agents can upload travel documents during travel documentation stage
      if (caseStatus === 'pass_travel_documentation') {
        return available.filter(type => DOCUMENT_CATEGORIES.TRAVEL.includes(type));
      }
      // Agents can upload credit payment proof
      if (caseStatus === 'credit_payment_upload') {
        return available.filter(type => type === 'credit_payment_proof');
      }
      return [];

    case 'hospital':
      // Hospital agents can upload treatment-related documents
      if (
        caseStatus === 'case_accepted' ||
        caseStatus === 'treatment_plan_uploaded' ||
        caseStatus === 'treatment_in_progress'
      ) {
        return available.filter(type => DOCUMENT_CATEGORIES.TREATMENT.includes(type));
      }
      // Hospital can upload discharge-related documents
      if (
        caseStatus === 'final_report_medicine' ||
        caseStatus === 'discharge_process'
      ) {
        return available.filter(type => DOCUMENT_CATEGORIES.DISCHARGE.includes(type));
      }
      return [];

    case 'admin':
      // Admin can upload any document at any stage
      return available;

    case 'finance':
      // Finance can upload financial documents
      if (
        caseStatus === 'visa_processing_payments' ||
        caseStatus === 'credit_payment_upload' ||
        caseStatus === 'invoice_uploaded'
      ) {
        return available.filter(type => DOCUMENT_CATEGORIES.FINANCIAL.includes(type));
      }
      return [];

    case 'client':
      // Clients cannot upload documents (view-only)
      return [];

    default:
      return [];
  }
};

/**
 * Get required documents for a role at a specific case status
 */
export const getRequiredDocuments = (
  role: UserRole,
  caseStatus: CaseStatus
): DocumentType[] => {
  switch (role) {
    case 'agent':
      // Initial required documents for agents
      if (caseStatus === 'new' || caseStatus === 'case_agent_review') {
        return [
          'passport_front',
          'passport_back',
          'medical_reports',
          'treatment_records',
          'attender_passport',
          'attender_id',
          'patient_photo',
        ];
      }
      // Visa copy is required after visa approval
      if (caseStatus === 'visa_approved') {
        return ['visa_copy'];
      }
      return [];

    case 'hospital':
      // No specific required documents for hospital (optional treatment docs)
      return [];

    case 'admin':
      // Admin doesn't have required documents (can upload anything)
      return [];

    case 'finance':
      // No required documents for finance
      return [];

    default:
      return [];
  }
};

/**
 * Check if a document type is allowed for a role at a specific status
 */
export const isDocumentTypeAllowed = (
  documentType: DocumentType,
  role: UserRole,
  caseStatus: CaseStatus
): boolean => {
  const available = getAvailableDocumentTypes(role, caseStatus, []);
  return available.includes(documentType);
};

