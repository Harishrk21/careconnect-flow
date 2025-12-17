// User Roles
export type UserRole = 'admin' | 'agent' | 'client' | 'hospital' | 'finance';

// User Interface
export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  passwordChanged: boolean;
  createdBy: string;
  createdAt: string;
  lastLogin: string;
  avatar?: string;
  hospitalId?: string; // For hospital users
}

// Case Status Types
export type CaseStatus =
  | 'new'
  | 'case_agent_review'
  | 'admin_review'
  | 'assigned_to_hospital'
  | 'hospital_review'
  | 'case_accepted'
  | 'case_rejected'
  | 'treatment_plan_uploaded'
  | 'pass_travel_documentation'
  | 'visa_processing_documents'
  | 'visa_processing_payments'
  | 'visa_approved'
  | 'visa_rejected'
  | 'visa_reapply'
  | 'visa_terminate'
  | 'visa_copy_uploaded'
  | 'credit_payment_upload'
  | 'invoice_uploaded'
  | 'ticket_booking'
  | 'patient_manifest'
  | 'admit_format_uploaded'
  | 'frro_registration'
  | 'treatment_in_progress'
  | 'final_report_medicine'
  | 'discharge_process'
  | 'case_closed';

export const STATUS_LABELS: Record<CaseStatus, string> = {
  new: 'New',
  case_agent_review: 'Agent Review',
  admin_review: 'Admin Review',
  assigned_to_hospital: 'Assigned to Hospital',
  hospital_review: 'Hospital Review',
  case_accepted: 'Case Accepted',
  case_rejected: 'Case Rejected',
  treatment_plan_uploaded: 'Treatment Plan Uploaded',
  pass_travel_documentation: 'Travel Documentation',
  visa_processing_documents: 'Visa Documents',
  visa_processing_payments: 'Visa Payments',
  visa_approved: 'Visa Approved',
  visa_rejected: 'Visa Rejected',
  visa_reapply: 'Visa Reapply',
  visa_terminate: 'Case Terminated',
  visa_copy_uploaded: 'Visa Copy Uploaded',
  credit_payment_upload: 'Credit Payment',
  invoice_uploaded: 'Invoice Uploaded',
  ticket_booking: 'Ticket Booking',
  patient_manifest: 'Patient Manifest',
  admit_format_uploaded: 'Admit Format Uploaded',
  frro_registration: 'FRRO Registration',
  treatment_in_progress: 'Treatment in Progress',
  final_report_medicine: 'Final Report & Medicine',
  discharge_process: 'Discharge Process',
  case_closed: 'Case Closed',
};

export const STATUS_FLOW: CaseStatus[] = [
  'new',
  'case_agent_review',
  'admin_review',
  'assigned_to_hospital',
  'hospital_review',
  'case_accepted',
  'treatment_plan_uploaded',
  'pass_travel_documentation',
  'visa_processing_documents',
  'visa_processing_payments',
  'visa_approved',
  'visa_copy_uploaded',
  'credit_payment_upload',
  'invoice_uploaded',
  'ticket_booking',
  'patient_manifest',
  'admit_format_uploaded',
  'frro_registration',
  'treatment_in_progress',
  'final_report_medicine',
  'discharge_process',
  'case_closed',
];

export const STATUS_COLORS: Record<CaseStatus, string> = {
  new: 'status-new',
  case_agent_review: 'status-progress',
  admin_review: 'status-pending',
  assigned_to_hospital: 'status-progress',
  hospital_review: 'status-pending',
  case_accepted: 'status-success',
  case_rejected: 'status-error',
  treatment_plan_uploaded: 'status-success',
  pass_travel_documentation: 'status-progress',
  visa_processing_documents: 'status-pending',
  visa_processing_payments: 'status-pending',
  visa_approved: 'status-success',
  visa_rejected: 'status-error',
  visa_reapply: 'status-pending',
  visa_terminate: 'status-error',
  visa_copy_uploaded: 'status-success',
  credit_payment_upload: 'status-pending',
  invoice_uploaded: 'status-success',
  ticket_booking: 'status-progress',
  patient_manifest: 'status-progress',
  admit_format_uploaded: 'status-success',
  frro_registration: 'status-pending',
  treatment_in_progress: 'status-progress',
  final_report_medicine: 'status-success',
  discharge_process: 'status-progress',
  case_closed: 'status-success',
};

// Document Types
export type DocumentType =
  | 'passport_front'
  | 'passport_back'
  | 'medical_reports'
  | 'treatment_records'
  | 'attender_passport'
  | 'attender_id'
  | 'patient_photo'
  | 'medical_prescription'
  | 'lab_blood'
  | 'lab_urine'
  | 'lab_xray'
  | 'radiology_ct'
  | 'radiology_mri'
  | 'radiology_ultrasound'
  | 'doctor_referral'
  | 'insurance_docs'
  | 'previous_discharge'
  | 'vaccination_records'
  | 'allergy_info'
  | 'medication_list'
  | 'other_medical'
  | 'visa_application'
  | 'visa_copy'
  | 'flight_tickets'
  | 'travel_insurance'
  | 'hotel_booking'
  | 'payment_receipt'
  | 'hospital_invoice'
  | 'credit_payment_proof'
  | 'bank_transfer';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  passport_front: 'Passport Copy (Front)',
  passport_back: 'Passport Copy (Back)',
  medical_reports: 'Recent Medical Reports',
  treatment_records: 'Previous Treatment Records',
  attender_passport: 'Attender/Guardian Passport',
  attender_id: 'Attender/Guardian ID Proof',
  patient_photo: 'Patient Photo',
  medical_prescription: 'Medical Prescription',
  lab_blood: 'Lab Reports - Blood Test',
  lab_urine: 'Lab Reports - Urine Test',
  lab_xray: 'Lab Reports - X-Ray',
  radiology_ct: 'Radiology - CT Scan',
  radiology_mri: 'Radiology - MRI',
  radiology_ultrasound: 'Radiology - Ultrasound',
  doctor_referral: 'Doctor Referral Letter',
  insurance_docs: 'Insurance Documents',
  previous_discharge: 'Previous Hospital Discharge Summary',
  vaccination_records: 'Vaccination Records',
  allergy_info: 'Allergy Information',
  medication_list: 'Current Medication List',
  other_medical: 'Other Medical Documents',
  visa_application: 'Visa Application Form',
  visa_copy: 'Visa Copy',
  flight_tickets: 'Flight Tickets',
  travel_insurance: 'Travel Insurance',
  hotel_booking: 'Hotel Booking Confirmation',
  payment_receipt: 'Payment Receipts',
  hospital_invoice: 'Invoice from Hospital',
  credit_payment_proof: 'Credit Payment Proof',
  bank_transfer: 'Bank Transfer Documents',
};

export const REQUIRED_DOCUMENTS: DocumentType[] = [
  'passport_front',
  'passport_back',
  'medical_reports',
  'treatment_records',
  'attender_passport',
  'attender_id',
  'patient_photo',
];

export interface Document {
  id: string;
  type: DocumentType;
  name: string;
  uploadedBy: string;
  uploadedAt: string;
  extractedText?: string;
  size: number;
  mimeType: string;
}

// Status History Entry
export interface StatusHistoryEntry {
  status: CaseStatus;
  timestamp: string;
  by: string;
  byName: string;
  note?: string;
}

// Client Information
export interface ClientInfo {
  name: string;
  dob: string;
  passport: string;
  nationality: string;
  condition: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
}

// Attender Information
export interface AttenderInfo {
  name: string;
  relationship: string;
  passport: string;
  phone: string;
  email: string;
}

// Treatment Plan
export interface TreatmentPlan {
  id: string;
  diagnosis: string;
  proposedTreatment: string;
  estimatedDuration: string;
  estimatedCost: number;
  currency: string;
  doctorName: string;
  department: string;
  notes: string;
  createdAt: string;
  createdBy: string;
}

// Payment Record
export interface PaymentRecord {
  id: string;
  type: 'visa' | 'treatment' | 'travel' | 'other';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  method: string;
  reference: string;
  date: string;
  processedBy?: string;
  notes?: string;
}

// Visa Information
export interface VisaInfo {
  applicationDate?: string;
  status: 'not_started' | 'processing' | 'approved' | 'rejected' | 'reapply';
  visaNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
}

// Comment/Message
export interface Comment {
  id: string;
  caseId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  message: string;
  timestamp: string;
  isPreset?: boolean;
}

// Activity Log Entry
export interface ActivityLog {
  id: string;
  caseId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
}

// Case Interface
export interface Case {
  id: string;
  clientId: string;
  agentId: string;
  status: CaseStatus;
  statusHistory: StatusHistoryEntry[];
  documents: Document[];
  clientInfo: ClientInfo;
  attenderInfo?: AttenderInfo;
  assignedHospital?: string;
  treatmentPlan?: TreatmentPlan;
  payments: PaymentRecord[];
  visa: VisaInfo;
  comments: Comment[];
  activityLog: ActivityLog[];
  createdAt: string;
  updatedAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

// Hospital Interface
export interface Hospital {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  specialties: string[];
  bedCapacity: number;
  availableBeds: number;
  accreditation: string[];
  contactPerson: string;
}

// Notification Interface
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
  link?: string;
  caseId?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  pendingReview: number;
  completedCases: number;
  urgentCases: number;
}

// Preset Client Messages
export const CLIENT_PRESET_MESSAGES = [
  "Request update on my case",
  "I have a question about treatment",
  "When is my appointment?",
  "I need to upload additional documents",
  "Thank you for the update",
  "What are the next steps?",
  "I need help with visa process",
  "When should I travel?",
];
