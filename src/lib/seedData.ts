import type { User, Case, Hospital, Notification, CaseStatus } from '@/types';
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
    name: 'Dr. Sarah Ahmed',
    email: 'sarah.ahmed@medcoord.sd',
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
    name: 'Dr. Amir Khan',
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
    name: 'Dr. Priya Patel',
    email: 'priya.patel@medcoord.in',
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
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@medcoord.in',
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
    name: 'Dr. Anita Singh',
    email: 'anita.singh@medcoord.in',
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
    name: 'Dr. Venkat Reddy',
    email: 'venkat.reddy@medcoord.in',
    phone: '+91-9876-543-214',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-09-15',
    lastLogin: '2025-01-10',
  },
  // Hospital Users
  {
    username: 'hospital.apollo',
    password: hashPassword('hospital123'),
    role: 'hospital',
    name: 'Dr. Vikram Mehta',
    email: 'vikram@apollohospitals.com',
    phone: '+91-44-2829-0200',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-07-01',
    lastLogin: '2025-01-15',
    hospitalId: 'hospital_001',
  },
  {
    username: 'hospital.fortis',
    password: hashPassword('hospital123'),
    role: 'hospital',
    name: 'Dr. Neha Gupta',
    email: 'neha@fortishealthcare.com',
    phone: '+91-11-4277-6222',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-07-15',
    lastLogin: '2025-01-14',
    hospitalId: 'hospital_002',
  },
  {
    username: 'hospital.medanta',
    password: hashPassword('hospital123'),
    role: 'hospital',
    name: 'Dr. Sanjay Kumar',
    email: 'sanjay@medanta.org',
    phone: '+91-124-4141-414',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-08-01',
    lastLogin: '2025-01-13',
    hospitalId: 'hospital_003',
  },
  // Finance Users
  {
    username: 'finance.omar',
    password: hashPassword('finance123'),
    role: 'finance',
    name: 'Omar Hassan',
    email: 'omar.hassan@medcoord.sd',
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
    email: 'fatima.abdullah@medcoord.sd',
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
    contactPerson: 'Dr. Vikram Mehta',
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
    contactPerson: 'Dr. Neha Gupta',
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
    contactPerson: 'Dr. Sanjay Kumar',
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
];

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
        doctorName: 'Dr. Specialist',
        department: 'Specialty Department',
        notes: 'Patient requires pre-operative evaluation',
        createdAt: createdDate.toISOString(),
        createdBy: hospitalId,
      } : undefined,
      payments: [],
      visa: {
        status: status === 'visa_approved' ? 'approved' : status.includes('visa') ? 'processing' : 'not_started',
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

// Initialize seed data
export const initializeSeedData = async (): Promise<void> => {
  const initialized = await isDbInitialized();
  if (initialized) {
    console.log('Database already initialized');
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
