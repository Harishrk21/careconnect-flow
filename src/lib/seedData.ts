import type { User, Case, Hospital, Notification, CaseStatus, PaymentRecord } from '@/types';
import { 
  addUser, addCase, addHospital, addNotification, 
  isDbInitialized, setDbInitialized, generateId 
} from './storage';

// Hash password (simple encoding for demo - in production use proper hashing)
const hashPassword = (password: string): string => {
  return btoa(password);
};

// Seed Users
const seedUsers: Omit<User, 'id'>[] = [
  // Admin
  {
    username: 'admin',
    password: hashPassword('admin123'),
    role: 'admin',
    name: 'Sarah Ahmed',
    email: 'sarah.ahmed@sudind.sd',
    phone: '+249-912-345-678',
    passwordChanged: true,
    createdBy: 'system',
    createdAt: '2024-06-01',
    lastLogin: '2025-01-15',
    avatar: undefined,
  },
  // Agents
  {
    username: 'agent.khan',
    password: hashPassword('agent123'),
    role: 'agent',
    name: 'Amir Khan',
    email: 'amir.khan@medcoord.in',
    phone: '+91-9876-543-210',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-07-15',
    lastLogin: '2025-01-14',
  },
  {
    username: 'agent.patel',
    password: hashPassword('agent123'),
    role: 'agent',
    name: 'Priya Patel',
    email: 'priya.patel@sudind.in',
    phone: '+91-9876-543-211',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-08-01',
    lastLogin: '2025-01-13',
  },
  {
    username: 'agent.sharma',
    password: hashPassword('agent123'),
    role: 'agent',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@sudind.in',
    phone: '+91-9876-543-212',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-08-15',
    lastLogin: '2025-01-12',
  },
  {
    username: 'agent.singh',
    password: hashPassword('agent123'),
    role: 'agent',
    name: 'Anita Singh',
    email: 'anita.singh@sudind.in',
    phone: '+91-9876-543-213',
    passwordChanged: false,
    createdBy: 'admin_001',
    createdAt: '2024-09-01',
    lastLogin: '',
  },
  {
    username: 'agent.reddy',
    password: hashPassword('agent123'),
    role: 'agent',
    name: 'Venkat Reddy',
    email: 'venkat.reddy@sudind.in',
    phone: '+91-9876-543-214',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-09-15',
    lastLogin: '2025-01-10',
  },
  // Hospital Users (Agents handling hospital-related activities)
  {
    username: 'hospital.apollo',
    password: hashPassword('hospital123'),
    role: 'hospital',
    name: 'Vikram Mehta',
    email: 'vikram@apollohospitals.com',
    phone: '+91-44-2829-0200',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-07-01',
    lastLogin: '2025-01-15',
    hospitalIds: ['hospital_001'],
  },
  {
    username: 'hospital.fortis',
    password: hashPassword('hospital123'),
    role: 'hospital',
    name: 'Neha Gupta',
    email: 'neha@fortishealthcare.com',
    phone: '+91-11-4277-6222',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-07-15',
    lastLogin: '2025-01-14',
    hospitalIds: ['hospital_002'],
  },
  {
    username: 'hospital.medanta',
    password: hashPassword('hospital123'),
    role: 'hospital',
    name: 'Sanjay Kumar',
    email: 'sanjay@medanta.org',
    phone: '+91-124-4141-414',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-08-01',
    lastLogin: '2025-01-13',
    hospitalIds: ['hospital_003'],
  },
  // Finance Users
  {
    username: 'finance.omar',
    password: hashPassword('finance123'),
    role: 'finance',
    name: 'Omar Hassan',
    email: 'omar.hassan@sudind.sd',
    phone: '+249-912-345-679',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-07-01',
    lastLogin: '2025-01-15',
  },
  {
    username: 'finance.fatima',
    password: hashPassword('finance123'),
    role: 'finance',
    name: 'Fatima Abdullah',
    email: 'fatima.abdullah@sudind.sd',
    phone: '+249-912-345-680',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-08-01',
    lastLogin: '2025-01-14',
  },
];

// Seed Hospitals
const seedHospitals: Hospital[] = [
  {
    id: 'hospital_001',
    name: 'Apollo Hospitals',
    city: 'Chennai',
    state: 'Tamil Nadu',
    address: '21 Greams Lane, Off Greams Road, Chennai - 600006',
    phone: '+91-44-2829-0200',
    email: 'info@apollohospitals.com',
    specialties: ['Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 'Transplants'],
    bedCapacity: 500,
    availableBeds: 45,
    accreditation: ['JCI', 'NABH', 'NABL'],
    contactPerson: 'Vikram Mehta',
  },
  {
    id: 'hospital_002',
    name: 'Fortis Memorial Research Institute',
    city: 'Gurgaon',
    state: 'Haryana',
    address: 'Sector 44, Opposite HUDA City Centre, Gurgaon - 122002',
    phone: '+91-11-4277-6222',
    email: 'info@fortishealthcare.com',
    specialties: ['Cardiac Surgery', 'Oncology', 'Neurosurgery', 'Bone Marrow Transplant'],
    bedCapacity: 350,
    availableBeds: 28,
    accreditation: ['JCI', 'NABH'],
    contactPerson: 'Neha Gupta',
  },
  {
    id: 'hospital_003',
    name: 'Medanta - The Medicity',
    city: 'Gurgaon',
    state: 'Haryana',
    address: 'CH Baktawar Singh Road, Sector 38, Gurgaon - 122001',
    phone: '+91-124-4141-414',
    email: 'info@medanta.org',
    specialties: ['Heart Institute', 'Cancer Institute', 'Neurosciences', 'Kidney & Urology'],
    bedCapacity: 1250,
    availableBeds: 120,
    accreditation: ['JCI', 'NABH', 'NABL', 'CAP'],
    contactPerson: 'Sanjay Kumar',
  },
];

// Client Users (created when cases are made)
const seedClients: Omit<User, 'id'>[] = [
  {
    username: 'client.mohammed',
    password: hashPassword('client123'),
    role: 'client',
    name: 'Mohammed Ali Ibrahim',
    email: 'mohammed.ali@email.com',
    phone: '+249-918-123-456',
    passwordChanged: true,
    createdBy: 'agent_001',
    createdAt: '2024-10-15',
    lastLogin: '2025-01-14',
  },
  {
    username: 'client.fatima',
    password: hashPassword('client123'),
    role: 'client',
    name: 'Fatima Hassan Osman',
    email: 'fatima.hassan@email.com',
    phone: '+249-918-123-457',
    passwordChanged: true,
    createdBy: 'agent_001',
    createdAt: '2024-11-01',
    lastLogin: '2025-01-13',
  },
  {
    username: 'client.ahmed',
    password: hashPassword('client123'),
    role: 'client',
    name: 'Ahmed Yousif Mahmoud',
    email: 'ahmed.yousif@email.com',
    phone: '+249-918-123-458',
    passwordChanged: true,
    createdBy: 'agent_002',
    createdAt: '2024-11-15',
    lastLogin: '2025-01-12',
  },
  {
    username: 'client.aisha',
    password: hashPassword('client123'),
    role: 'client',
    name: 'Aisha Khalid Salim',
    email: 'aisha.khalid@email.com',
    phone: '+249-918-123-459',
    passwordChanged: false,
    createdBy: 'agent_002',
    createdAt: '2024-12-01',
    lastLogin: '',
  },
  {
    username: 'client.omar',
    password: hashPassword('client123'),
    role: 'client',
    name: 'Omar Abdelrahman',
    email: 'omar.abdelrahman@email.com',
    phone: '+249-918-123-460',
    passwordChanged: true,
    createdBy: 'agent_003',
    createdAt: '2024-12-15',
    lastLogin: '2025-01-10',
  },
  // Additional clients for Finance Dashboard data
  {
    username: 'client.hassan',
    password: hashPassword('client123'),
    role: 'client',
    name: 'Hassan Mohamed Ali',
    email: 'hassan.mohamed@email.com',
    phone: '+249-918-123-461',
    passwordChanged: true,
    createdBy: 'agent_001',
    createdAt: '2024-12-20',
    lastLogin: '2025-01-09',
  },
  {
    username: 'client.salma',
    password: hashPassword('client123'),
    role: 'client',
    name: 'Salma Ibrahim Hassan',
    email: 'salma.ibrahim@email.com',
    phone: '+249-918-123-462',
    passwordChanged: true,
    createdBy: 'agent_002',
    createdAt: '2024-12-25',
    lastLogin: '2025-01-08',
  },
  {
    username: 'client.khalid',
    password: hashPassword('client123'),
    role: 'client',
    name: 'Khalid Osman Yousif',
    email: 'khalid.osman@email.com',
    phone: '+249-918-123-463',
    passwordChanged: true,
    createdBy: 'agent_003',
    createdAt: '2024-12-30',
    lastLogin: '2025-01-07',
  },
  {
    username: 'client.noor',
    password: hashPassword('client123'),
    role: 'client',
    name: 'Noor Ahmed Salim',
    email: 'noor.ahmed@email.com',
    phone: '+249-918-123-464',
    passwordChanged: true,
    createdBy: 'agent_004',
    createdAt: '2025-01-05',
    lastLogin: '2025-01-06',
  },
];

// Generate payment records for cases based on status
const generatePaymentsForCase = (
  status: CaseStatus,
  index: number,
  createdDate: Date
): PaymentRecord[] => {
  const payments: PaymentRecord[] = [];
  const now = new Date();
  
  // Add payments based on case status
  if (status === 'visa_processing_payments') {
    // Visa processing payment - always add at least one payment
    payments.push({
      id: generateId('payment'),
      type: 'visa',
      amount: 150 + (index * 25), // $150-$300 range
      currency: 'USD',
      status: index % 3 === 0 ? 'pending' : index % 3 === 1 ? 'completed' : 'pending',
      method: 'Bank Transfer',
      reference: `VISA-${Date.now()}-${index}`,
      date: new Date(createdDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      processedBy: index % 3 === 1 ? 'finance_001' : undefined,
      notes: index % 3 === 0 ? 'Awaiting verification' : 'Payment verified and processed',
    });
    
    // Add a second payment for some cases
    if (index % 2 === 0) {
      payments.push({
        id: generateId('payment'),
        type: 'visa',
        amount: 200 + (index * 20),
        currency: 'USD',
        status: 'pending',
        method: 'Credit Card',
        reference: `VISA-2-${Date.now()}-${index}`,
        date: new Date(createdDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Additional visa processing fee',
      });
    }
  }
  
  if (status === 'credit_payment_upload') {
    // Credit payment - always add at least one payment
    payments.push({
      id: generateId('payment'),
      type: 'treatment',
      amount: 5000 + (index * 1000), // $5000-$12000 range
      currency: 'USD',
      status: index % 4 === 0 ? 'pending' : index % 4 === 1 ? 'completed' : index % 4 === 2 ? 'pending' : 'completed',
      method: 'Credit Card',
      reference: `CREDIT-${Date.now()}-${index}`,
      date: new Date(createdDate.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      processedBy: index % 4 === 1 || index % 4 === 3 ? 'finance_001' : undefined,
      notes: index % 4 === 0 ? 'Pending credit verification' : 'Credit payment approved',
    });
    
    // Add a second payment for some cases
    if (index % 3 === 0) {
      payments.push({
        id: generateId('payment'),
        type: 'treatment',
        amount: 3000 + (index * 500),
        currency: 'USD',
        status: 'pending',
        method: 'Wire Transfer',
        reference: `CREDIT-2-${Date.now()}-${index}`,
        date: new Date(createdDate.getTime() + 11 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Partial credit payment',
      });
    }
  }
  
  // Add completed payments for cases in later stages
  if (status === 'invoice_uploaded' || status === 'ticket_booking' || status === 'patient_manifest') {
    // Visa payment (completed)
    payments.push({
      id: generateId('payment'),
      type: 'visa',
      amount: 200 + (index * 30),
      currency: 'USD',
      status: 'completed',
      method: 'Bank Transfer',
      reference: `VISA-COMP-${Date.now()}-${index}`,
      date: new Date(createdDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      processedBy: 'finance_001',
      notes: 'Visa payment processed successfully',
    });
    
    // Treatment payment (completed)
    payments.push({
      id: generateId('payment'),
      type: 'treatment',
      amount: 8000 + (index * 1500),
      currency: 'USD',
      status: 'completed',
      method: 'Wire Transfer',
      reference: `TREAT-${Date.now()}-${index}`,
      date: new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      processedBy: 'finance_001',
      notes: 'Treatment payment received',
    });
  }
  
  // Add INR payments for some cases (mixed currency)
  if (index % 3 === 0 && (status === 'visa_processing_payments' || status === 'credit_payment_upload')) {
    payments.push({
      id: generateId('payment'),
      type: 'other',
      amount: 50000 + (index * 5000), // INR amounts
      currency: 'INR',
      status: index % 2 === 0 ? 'completed' : 'pending',
      method: 'UPI',
      reference: `INR-${Date.now()}-${index}`,
      date: new Date(createdDate.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      processedBy: index % 2 === 0 ? 'finance_002' : undefined,
      notes: index % 2 === 0 ? 'INR payment processed' : 'Awaiting INR payment verification',
    });
  }
  
  // Add travel payments for cases with tickets
  if (status === 'ticket_booking' || status === 'patient_manifest') {
    payments.push({
      id: generateId('payment'),
      type: 'travel',
      amount: 1200 + (index * 200),
      currency: 'USD',
      status: 'completed',
      method: 'Credit Card',
      reference: `TRAVEL-${Date.now()}-${index}`,
      date: new Date(createdDate.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      processedBy: 'finance_001',
      notes: 'Flight ticket payment processed',
    });
  }
  
  // Add failed payment for one case (for testing)
  if (index === 2 && status === 'visa_processing_payments') {
    payments.push({
      id: generateId('payment'),
      type: 'visa',
      amount: 250,
      currency: 'USD',
      status: 'failed',
      method: 'Bank Transfer',
      reference: `FAILED-${Date.now()}-${index}`,
      date: new Date(createdDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Payment failed due to insufficient funds. Retry required.',
    });
  }
  
  return payments;
};

// Generate sample cases
const generateSeedCases = (userIds: { agents: string[]; clients: string[] }): Partial<Case>[] => {
  const statuses: CaseStatus[] = [
    'treatment_in_progress',
    'hospital_review',
    'admin_review',
    'visa_processing_documents',
    'case_accepted',
    'new',
    'case_agent_review',
    'assigned_to_hospital',
    'treatment_plan_uploaded',
    'visa_approved',
    'ticket_booking',
    'discharge_process',
    'case_closed',
    'frro_registration',
    'patient_manifest',
    // Finance-related statuses for Finance Dashboard
    'visa_processing_payments',
    'credit_payment_upload',
    'invoice_uploaded',
    'visa_processing_payments', // Duplicate to ensure more cases
    'credit_payment_upload', // Duplicate to ensure more cases
  ];

  const conditions = [
    'Cardiac Surgery - Coronary Artery Bypass',
    'Kidney Transplant',
    'Spine Surgery - Lumbar Fusion',
    'Oncology - Breast Cancer Treatment',
    'Neurology - Brain Tumor Removal',
    'Orthopedic - Total Hip Replacement',
    'Liver Transplant',
    'Cardiac - Valve Replacement',
  ];

  const priorities: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'urgent'];
  const hospitals = ['hospital_001', 'hospital_002', 'hospital_003'];

  return userIds.clients.map((clientId, index) => {
    const status = statuses[index % statuses.length];
    const agentId = userIds.agents[index % userIds.agents.length];
    const hospitalId = hospitals[index % hospitals.length];
    const now = new Date();
    const createdDate = new Date(now.getTime() - (30 - index * 2) * 24 * 60 * 60 * 1000);
    
    return {
      clientId,
      agentId,
      status,
      statusHistory: [
        {
          status: 'new',
          timestamp: createdDate.toISOString(),
          by: agentId,
          byName: 'Agent',
          note: 'Case created',
        },
      ],
      documents: [
        {
          id: generateId('doc'),
          type: 'passport_front' as const,
          name: 'passport_front.pdf',
          uploadedBy: agentId,
          uploadedAt: createdDate.toISOString(),
          extractedText: 'Passport details extracted...',
          size: 1024000,
          mimeType: 'application/pdf',
        },
        {
          id: generateId('doc'),
          type: 'medical_reports' as const,
          name: 'medical_report.pdf',
          uploadedBy: agentId,
          uploadedAt: createdDate.toISOString(),
          size: 2048000,
          mimeType: 'application/pdf',
        },
      ],
      clientInfo: {
        name: seedClients[index]?.name || 'Patient Name',
        dob: '1985-05-15',
        passport: `SD${1234567 + index}`,
        nationality: 'Sudanese',
        condition: conditions[index % conditions.length],
        phone: seedClients[index]?.phone || '+249-918-123-456',
        email: seedClients[index]?.email || 'patient@email.com',
        address: 'Khartoum, Sudan',
        emergencyContact: 'Family Member',
        emergencyPhone: '+249-918-999-999',
      },
      attenderInfo: {
        name: 'Family Attender',
        relationship: 'Spouse',
        passport: `SD${7654321 + index}`,
        phone: '+249-918-888-888',
        email: 'attender@email.com',
      },
      assignedHospital: status !== 'new' && status !== 'case_agent_review' ? hospitalId : undefined,
      treatmentPlan: status === 'treatment_plan_uploaded' || status === 'treatment_in_progress' ? {
        id: generateId('plan'),
        diagnosis: conditions[index % conditions.length],
        proposedTreatment: 'Comprehensive treatment plan with surgery and post-operative care',
        estimatedDuration: '2-3 weeks',
        estimatedCost: 25000 + index * 5000,
        currency: 'USD',
        doctorName: 'Specialist',
        department: 'Specialty Department',
        notes: 'Patient requires pre-operative evaluation',
        createdAt: createdDate.toISOString(),
        createdBy: hospitalId,
      } : undefined,
      payments: generatePaymentsForCase(status, index, createdDate),
      visa: {
        status: status === 'visa_approved' ? 'approved' : status.includes('visa') ? 'processing' : 'not_started',
        applicationDate: status.includes('visa') ? new Date(createdDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
        visaNumber: status === 'visa_approved' ? `V${1234567 + index}` : undefined,
        issueDate: status === 'visa_approved' ? new Date(createdDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
        expiryDate: status === 'visa_approved' ? new Date(createdDate.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      },
      comments: [],
      activityLog: [
        {
          id: generateId('log'),
          caseId: '',
          userId: agentId,
          userName: 'Agent',
          userRole: 'agent',
          action: 'Case Created',
          details: 'New case created for patient',
          timestamp: createdDate.toISOString(),
        },
      ],
      createdAt: createdDate.toISOString(),
      updatedAt: now.toISOString(),
      priority: priorities[index % priorities.length],
    };
  });
};

// Add finance cases to existing database (for updating existing installations)
export const addFinanceCases = async (): Promise<void> => {
  const { getAllCases, addCase, getAllUsers } = await import('./storage');
  const existingCases = await getAllCases();
  
  // Check if we already have finance cases with payments
  const hasFinanceCases = existingCases.some(c => 
    (c.status === 'visa_processing_payments' || 
     c.status === 'credit_payment_upload' ||
     c.status === 'invoice_uploaded') &&
    c.payments.length > 0
  );
  
  if (hasFinanceCases) {
    console.log('Finance cases with payments already exist');
    return;
  }
  
  console.log('Adding finance cases to existing database...');
  
  // Get existing clients and agents
  const allUsers = await getAllUsers();
  const clients = allUsers.filter(u => u.role === 'client');
  const agents = allUsers.filter(u => u.role === 'agent');
  
  if (clients.length === 0 || agents.length === 0) {
    console.log('No clients or agents found. Cannot create finance cases.');
    return;
  }
  
  // Create finance-specific cases
  const financeStatuses: CaseStatus[] = ['visa_processing_payments', 'credit_payment_upload', 'invoice_uploaded'];
  const conditions = [
    'Cardiac Surgery - Coronary Artery Bypass',
    'Kidney Transplant',
    'Spine Surgery - Lumbar Fusion',
    'Oncology - Breast Cancer Treatment',
    'Neurology - Brain Tumor Removal',
  ];
  
  const now = new Date();
  const agentIds = agents.map(a => a.id);
  
  // Create 5 finance cases with payments
  for (let i = 0; i < Math.min(5, clients.length); i++) {
    const client = clients[i];
    const agentId = agentIds[i % agentIds.length];
    const status = financeStatuses[i % financeStatuses.length];
    const createdDate = new Date(now.getTime() - (10 - i) * 24 * 60 * 60 * 1000);
    
    const caseData: Case = {
      id: `case_finance_${String(i + 1).padStart(3, '0')}`,
      clientId: client.id,
      agentId,
      status,
      statusHistory: [
        {
          status: 'new',
          timestamp: createdDate.toISOString(),
          by: agentId,
          byName: agents.find(a => a.id === agentId)?.name || 'Agent',
          note: 'Case created',
        },
        {
          status,
          timestamp: new Date(createdDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          by: 'admin_001',
          byName: 'Admin',
          note: `Moved to ${status}`,
        },
      ],
      documents: [
        {
          id: generateId('doc'),
          type: 'passport_front',
          name: 'passport_front.pdf',
          uploadedBy: agentId,
          uploadedAt: createdDate.toISOString(),
          extractedText: 'Passport details extracted...',
          size: 1024000,
          mimeType: 'application/pdf',
        },
        {
          id: generateId('doc'),
          type: 'medical_reports',
          name: 'medical_report.pdf',
          uploadedBy: agentId,
          uploadedAt: createdDate.toISOString(),
          size: 2048000,
          mimeType: 'application/pdf',
        },
      ],
      clientInfo: {
        name: client.name,
        dob: '1985-05-15',
        passport: `SD${1234567 + i}`,
        nationality: 'Sudanese',
        condition: conditions[i % conditions.length],
        phone: client.phone,
        email: client.email,
        address: 'Khartoum, Sudan',
        emergencyContact: 'Family Member',
        emergencyPhone: '+249-918-999-999',
      },
      attenderInfo: {
        name: 'Family Attender',
        relationship: 'Spouse',
        passport: `SD${7654321 + i}`,
        phone: '+249-918-888-888',
        email: 'attender@email.com',
      },
      assignedHospital: 'hospital_001',
      treatmentPlan: {
        id: generateId('plan'),
        diagnosis: conditions[i % conditions.length],
        proposedTreatment: 'Comprehensive treatment plan',
        estimatedDuration: '2-3 weeks',
        estimatedCost: 25000 + i * 5000,
        currency: 'USD',
        doctorName: 'Specialist',
        department: 'Specialty Department',
        notes: 'Patient requires treatment',
        createdAt: createdDate.toISOString(),
        createdBy: 'hospital_001',
      },
      payments: generatePaymentsForCase(status, i, createdDate),
      visa: {
        status: status.includes('visa') ? 'processing' : 'not_started',
        applicationDate: status.includes('visa') ? new Date(createdDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      },
      comments: [],
      activityLog: [
        {
          id: generateId('log'),
          caseId: '',
          userId: agentId,
          userName: agents.find(a => a.id === agentId)?.name || 'Agent',
          userRole: 'agent',
          action: 'Case Created',
          details: 'New case created for patient',
          timestamp: createdDate.toISOString(),
        },
      ],
      createdAt: createdDate.toISOString(),
      updatedAt: now.toISOString(),
      priority: i % 2 === 0 ? 'high' : 'medium',
    };
    
    // Add payment activity logs
    if (caseData.payments && caseData.payments.length > 0) {
      const financeUsers = seedUsers.filter(u => u.role === 'finance');
      caseData.payments.forEach((payment) => {
        const financeUser = financeUsers.find(u => 
          payment.processedBy === 'finance_001' ? u.username.includes('finance.omar') :
          payment.processedBy === 'finance_002' ? u.username.includes('finance.fatima') :
          u.username.includes('finance.omar')
        );
        caseData.activityLog.push({
          id: generateId('log'),
          caseId: caseData.id,
          userId: payment.processedBy || 'finance_001',
          userName: financeUser?.name || 'Finance Admin',
          userRole: 'finance',
          action: payment.status === 'completed' ? 'Payment Processed' : payment.status === 'failed' ? 'Payment Failed' : 'Payment Created',
          details: `${payment.type} payment of ${payment.currency} ${payment.amount} - ${payment.status}`,
          timestamp: payment.date + 'T12:00:00.000Z',
        });
      });
    }
    
    // Update activity log case IDs
    caseData.activityLog = caseData.activityLog.map(log => ({
      ...log,
      caseId: caseData.id,
    }));
    
    await addCase(caseData);
  }
  
  console.log('Finance cases added successfully');
};

// Update existing cases with payments if they're in finance statuses
export const updateExistingCasesWithPayments = async (): Promise<void> => {
  const { getAllCases, updateCase } = await import('./storage');
  const existingCases = await getAllCases();
  
  // Find cases in finance statuses without payments
  const casesNeedingPayments = existingCases.filter(c => 
    (c.status === 'visa_processing_payments' || 
     c.status === 'credit_payment_upload' ||
     c.status === 'invoice_uploaded' ||
     c.status === 'ticket_booking' ||
     c.status === 'patient_manifest') &&
    c.payments.length === 0
  );
  
  if (casesNeedingPayments.length === 0) {
    return;
  }
  
  console.log(`Updating ${casesNeedingPayments.length} existing cases with payment data...`);
  
  for (const caseItem of casesNeedingPayments) {
    const createdDate = new Date(caseItem.createdAt);
    const index = parseInt(caseItem.id.replace(/\D/g, '')) || 0;
    const payments = generatePaymentsForCase(caseItem.status, index, createdDate);
    
    if (payments.length > 0) {
      const updatedCase = {
        ...caseItem,
        payments,
      };
      
      // Add payment activity logs
      if (updatedCase.activityLog) {
        const financeUsers = seedUsers.filter(u => u.role === 'finance');
        payments.forEach((payment) => {
          const financeUser = financeUsers.find(u => 
            payment.processedBy === 'finance_001' ? u.username.includes('finance.omar') :
            payment.processedBy === 'finance_002' ? u.username.includes('finance.fatima') :
            u.username.includes('finance.omar')
          );
          updatedCase.activityLog.push({
            id: generateId('log'),
            caseId: updatedCase.id,
            userId: payment.processedBy || 'finance_001',
            userName: financeUser?.name || 'Finance Admin',
            userRole: 'finance',
            action: payment.status === 'completed' ? 'Payment Processed' : payment.status === 'failed' ? 'Payment Failed' : 'Payment Created',
            details: `${payment.type} payment of ${payment.currency} ${payment.amount} - ${payment.status}`,
            timestamp: payment.date + 'T12:00:00.000Z',
          });
        });
      }
      
      await updateCase(updatedCase);
    }
  }
  
  console.log('Existing cases updated with payment data');
};

// Initialize seed data
export const initializeSeedData = async (): Promise<void> => {
  const initialized = await isDbInitialized();
  if (initialized) {
    console.log('Database already initialized');
    // Try to add finance cases if they don't exist
    await addFinanceCases();
    // Update existing cases with payments
    await updateExistingCasesWithPayments();
    return;
  }

  console.log('Initializing seed data...');

  // Create admin first
  const adminId = 'admin_001';
  await addUser({ id: adminId, ...seedUsers[0] });

  // Create agents
  const agentIds: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const agentId = `agent_${String(i).padStart(3, '0')}`;
    agentIds.push(agentId);
    await addUser({ id: agentId, ...seedUsers[i] });
  }

  // Create hospital users
  for (let i = 6; i <= 8; i++) {
    const hospitalUserId = `hospital_user_${String(i - 5).padStart(3, '0')}`;
    await addUser({ id: hospitalUserId, ...seedUsers[i] });
  }

  // Create finance users
  for (let i = 9; i <= 10; i++) {
    const financeId = `finance_${String(i - 8).padStart(3, '0')}`;
    await addUser({ id: financeId, ...seedUsers[i] });
  }

  // Create hospitals
  for (const hospital of seedHospitals) {
    await addHospital(hospital);
  }

  // Create clients and their cases
  const clientIds: string[] = [];
  for (let i = 0; i < seedClients.length; i++) {
    const clientId = `client_${String(i + 1).padStart(3, '0')}`;
    clientIds.push(clientId);
    await addUser({ id: clientId, ...seedClients[i] });
  }

  // Create cases
  const casesData = generateSeedCases({ agents: agentIds, clients: clientIds });
  for (let i = 0; i < casesData.length; i++) {
    const caseId = `case_${String(i + 1).padStart(3, '0')}`;
    const caseData = casesData[i];
    
    // Update activity log with correct case ID
    if (caseData.activityLog) {
      caseData.activityLog = caseData.activityLog.map(log => ({
        ...log,
        caseId,
      }));
      
      // Add payment activity logs
      if (caseData.payments && caseData.payments.length > 0) {
        // Get finance users for activity log
        const financeUsers = seedUsers.filter(u => u.role === 'finance');
        caseData.payments.forEach((payment) => {
          const financeUser = financeUsers.find(u => 
            payment.processedBy === 'finance_001' ? u.username.includes('finance.omar') :
            payment.processedBy === 'finance_002' ? u.username.includes('finance.fatima') :
            u.username.includes('finance.omar')
          );
          caseData.activityLog!.push({
            id: generateId('log'),
            caseId,
            userId: payment.processedBy || 'finance_001',
            userName: financeUser?.name || 'Finance Admin',
            userRole: 'finance',
            action: payment.status === 'completed' ? 'Payment Processed' : payment.status === 'failed' ? 'Payment Failed' : 'Payment Created',
            details: `${payment.type} payment of ${payment.currency} ${payment.amount} - ${payment.status}`,
            timestamp: payment.date + 'T12:00:00.000Z',
          });
        });
      }
    }

    await addCase({
      id: caseId,
      ...caseData,
    } as Case);
  }

  // Create sample notifications
  const notifications: Notification[] = [
    {
      id: 'notif_001',
      userId: adminId,
      title: 'New Case Requires Review',
      message: 'Case #003 has been submitted for admin review',
      type: 'info',
      read: false,
      timestamp: new Date().toISOString(),
      caseId: 'case_003',
    },
    {
      id: 'notif_002',
      userId: adminId,
      title: 'Hospital Accepted Case',
      message: 'Apollo Hospitals has accepted Case #001',
      type: 'success',
      read: false,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      caseId: 'case_001',
    },
    {
      id: 'notif_003',
      userId: 'agent_001',
      title: 'Document Upload Required',
      message: 'Case #006 is missing required documents',
      type: 'warning',
      read: false,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      caseId: 'case_006',
    },
  ];

  for (const notification of notifications) {
    await addNotification(notification);
  }

  await setDbInitialized();
  console.log('Seed data initialized successfully');
};
