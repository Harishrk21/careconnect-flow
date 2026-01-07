import type { User, Case, Hospital, University, Notification, CaseStatus, PaymentRecord } from '@/types';
import { 
  addUser, addCase, addHospital, addUniversity, addNotification, 
  getAllUsers, getAllUniversities,
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
  // Hospital Agents (agents with agentType: 'hospital')
  {
    username: 'agent.hospital',
    password: hashPassword('agent123'),
    role: 'agent',
    name: 'Amir Khan',
    email: 'amir.khan@medcoord.in',
    phone: '+91-9876-543-210',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-07-15',
    lastLogin: '2025-01-14',
    agentType: 'hospital',
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
    agentType: 'hospital',
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
    agentType: 'hospital',
  },
  // University Agents (agents with agentType: 'university')
  {
    username: 'agent.university',
    password: hashPassword('agent123'),
    role: 'agent',
    name: 'Anita Singh',
    email: 'anita.singh@sudind.in',
    phone: '+91-9876-543-213',
    passwordChanged: false,
    createdBy: 'admin_001',
    createdAt: '2024-09-01',
    lastLogin: '',
    agentType: 'university',
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
    agentType: 'university',
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
  // University Users (Agents handling university-related activities)
  {
    username: 'university.du',
    password: hashPassword('university123'),
    role: 'university',
    name: 'Rajesh Sharma',
    email: 'rajesh@du.ac.in',
    phone: '+91-11-2766-7000',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-07-01',
    lastLogin: '2025-01-15',
    universityIds: ['university_001'],
  },
  {
    username: 'university.jnu',
    password: hashPassword('university123'),
    role: 'university',
    name: 'Priya Singh',
    email: 'priya@jnu.ac.in',
    phone: '+91-11-2670-4000',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-07-15',
    lastLogin: '2025-01-14',
    universityIds: ['university_002'],
  },
  {
    username: 'university.iit',
    password: hashPassword('university123'),
    role: 'university',
    name: 'Amit Patel',
    email: 'amit@iitd.ac.in',
    phone: '+91-11-2659-7135',
    passwordChanged: true,
    createdBy: 'admin_001',
    createdAt: '2024-08-01',
    lastLogin: '2025-01-13',
    universityIds: ['university_003'],
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

// Seed Universities
const seedUniversities: University[] = [
  {
    id: 'university_001',
    name: 'University of Delhi',
    city: 'Delhi',
    state: 'Delhi',
    address: 'University Road, Delhi - 110007',
    phone: '+91-11-2766-7000',
    email: 'info@du.ac.in',
    courses: ['Engineering', 'Medicine', 'Business Administration', 'Computer Science', 'Law', 'Arts', 'Science', 'Commerce'],
    accreditation: ['UGC', 'NAAC', 'NIRF'],
    contactPerson: 'Rajesh Sharma',
  },
  {
    id: 'university_002',
    name: 'Jawaharlal Nehru University',
    city: 'New Delhi',
    state: 'Delhi',
    address: 'New Mehrauli Road, New Delhi - 110067',
    phone: '+91-11-2670-4000',
    email: 'info@jnu.ac.in',
    courses: ['Computer Science', 'Management', 'Arts', 'Science', 'Law', 'Education'],
    accreditation: ['UGC', 'NAAC', 'NIRF'],
    contactPerson: 'Priya Singh',
  },
  {
    id: 'university_003',
    name: 'Indian Institute of Technology Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    address: 'Hauz Khas, New Delhi - 110016',
    phone: '+91-11-2659-7135',
    email: 'info@iitd.ac.in',
    courses: ['Engineering', 'Computer Science', 'Management', 'Architecture', 'Science'],
    accreditation: ['UGC', 'AICTE', 'NIRF'],
    contactPerson: 'Amit Patel',
  },
  {
    id: 'university_004',
    name: 'Jamia Millia Islamia',
    city: 'New Delhi',
    state: 'Delhi',
    address: 'Jamia Nagar, New Delhi - 110025',
    phone: '+91-11-2698-1717',
    email: 'info@jmi.ac.in',
    courses: ['Engineering', 'Medicine', 'Business Administration', 'Law', 'Arts', 'Education'],
    accreditation: ['UGC', 'NAAC', 'NIRF'],
    contactPerson: 'Mohammed Ali',
  },
  {
    id: 'university_005',
    name: 'Banaras Hindu University',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    address: 'BHU Campus, Varanasi - 221005',
    phone: '+91-542-236-8554',
    email: 'info@bhu.ac.in',
    courses: ['Engineering', 'Medicine', 'Arts', 'Science', 'Commerce', 'Law', 'Management'],
    accreditation: ['UGC', 'NAAC', 'NIRF'],
    contactPerson: 'Anjali Verma',
  },
  {
    id: 'university_006',
    name: 'University of Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Vidyanagari, Mumbai - 400098',
    phone: '+91-22-2652-3000',
    email: 'info@mu.ac.in',
    courses: ['Engineering', 'Business Administration', 'Arts', 'Science', 'Commerce', 'Law'],
    accreditation: ['UGC', 'NAAC', 'NIRF'],
    contactPerson: 'Ravi Desai',
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
  // University clients (for education cases)
  {
    username: 'client.yasir',
    password: hashPassword('client123'),
    role: 'client',
    name: 'Yasir Mohammed Hassan',
    email: 'yasir.mohammed@email.com',
    phone: '+249-918-123-465',
    passwordChanged: true,
    createdBy: 'agent_001',
    createdAt: '2024-11-10',
    lastLogin: '2025-01-15',
  },
  {
    username: 'client.layla',
    password: hashPassword('client123'),
    role: 'client',
    name: 'Layla Ahmed Ibrahim',
    email: 'layla.ahmed@email.com',
    phone: '+249-918-123-466',
    passwordChanged: true,
    createdBy: 'agent_002',
    createdAt: '2024-11-20',
    lastLogin: '2025-01-14',
  },
  {
    username: 'client.malik',
    password: hashPassword('client123'),
    role: 'client',
    name: 'Malik Yousif Osman',
    email: 'malik.yousif@email.com',
    phone: '+249-918-123-467',
    passwordChanged: false,
    createdBy: 'agent_003',
    createdAt: '2024-12-05',
    lastLogin: '',
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

// Generate university cases
const generateUniversityCases = (userIds: { agents: string[]; clients: string[] }): Partial<Case>[] => {
  const statuses: CaseStatus[] = [
    'new',
    'case_agent_review',
    'admin_review',
    'assigned_to_hospital', // Using same status flow for university
    'hospital_review',
    'visa_processing_documents',
    'visa_processing_payments', // For finance dashboard
    'credit_payment_upload', // For finance dashboard
    'visa_approved',
    'ticket_booking',
    'case_closed',
  ];

  const courses = [
    'Bachelor of Engineering - Computer Science',
    'Master of Business Administration',
    'Bachelor of Medicine',
    'Master of Science - Data Science',
    'Bachelor of Arts - Economics',
    'Master of Engineering - Mechanical',
    'Bachelor of Commerce',
    'Master of Arts - English Literature',
  ];

  const priorities: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'urgent'];
  const universities = ['university_001', 'university_002', 'university_003'];
  
  // Get university clients (last 3 clients)
  const universityClientIndices = userIds.clients.length - 3;
  const universityClients = userIds.clients.slice(universityClientIndices);

  return universityClients.map((clientId, index) => {
    const globalIndex = universityClientIndices + index;
    const status = statuses[index % statuses.length];
    const agentId = userIds.agents[index % userIds.agents.length];
    const universityId = universities[index % universities.length];
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
          note: 'University case created',
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
          verificationStatus: 'pending',
        },
        {
          id: generateId('doc'),
          type: 'academic_certificates' as const,
          name: 'academic_certificates.pdf',
          uploadedBy: agentId,
          uploadedAt: createdDate.toISOString(),
          size: 2048000,
          mimeType: 'application/pdf',
          verificationStatus: 'pending',
        },
        {
          id: generateId('doc'),
          type: 'transcripts' as const,
          name: 'transcripts.pdf',
          uploadedBy: agentId,
          uploadedAt: new Date(createdDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          size: 1536000,
          mimeType: 'application/pdf',
          verificationStatus: 'pending',
        },
      ],
      clientInfo: {
        name: seedClients[globalIndex]?.name || 'Student Name',
        dob: '2000-05-15',
        passport: `SD${2234567 + index}`,
        nationality: 'Sudanese',
        condition: courses[index % courses.length],
        phone: seedClients[globalIndex]?.phone || '+249-918-123-456',
        email: seedClients[globalIndex]?.email || 'student@email.com',
        address: 'Khartoum, Sudan',
        emergencyContact: 'Family Member',
        emergencyPhone: '+249-918-999-999',
      },
      attenderInfo: {
        name: 'Family Attender',
        relationship: 'Parent',
        passport: `SD${7654321 + index}`,
        phone: '+249-918-888-888',
        email: 'attender@email.com',
      },
      assignedUniversity: status !== 'new' && status !== 'case_agent_review' ? universityId : undefined,
      payments: generatePaymentsForCase(status, globalIndex, createdDate),
      visa: {
        status: status === 'visa_approved' ? 'approved' : status.includes('visa') ? 'processing' : 'not_started',
        applicationDate: status.includes('visa') ? new Date(createdDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
        visaNumber: status === 'visa_approved' ? `V${2234567 + index}` : undefined,
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
          action: 'University Case Created',
          details: 'New university case created for student',
          timestamp: createdDate.toISOString(),
        },
      ],
      createdAt: createdDate.toISOString(),
      updatedAt: now.toISOString(),
      priority: priorities[index % priorities.length],
    };
  });
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

  // Only use first clients (excluding last 3 which are for university)
  const hospitalClients = userIds.clients.slice(0, -3);

  return hospitalClients.map((clientId, index) => {
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

// Add universities if they don't exist
export const addUniversitiesIfMissing = async (): Promise<void> => {
  try {
    const existingUniversities = await getAllUniversities();
    if (existingUniversities.length > 0) {
      console.log('Universities already exist');
      return;
    }

    console.log('Adding seed universities...');
    for (const university of seedUniversities) {
      try {
        await addUniversity(university);
      } catch (error) {
        console.error(`Error adding university ${university.id}:`, error);
        // Continue with other universities even if one fails
      }
    }
    console.log('Universities added successfully');
  } catch (error) {
    console.error('Error in addUniversitiesIfMissing:', error);
    // Don't throw - allow app to continue even if universities can't be added
  }
};

// Add university cases if they don't exist
export const addUniversityCasesIfMissing = async (): Promise<void> => {
  try {
    const { getAllCases, getAllUsers, addCase } = await import('./storage');
    const existingCases = await getAllCases();
    const allUsers = await getAllUsers();
    
    // Get agent IDs
    const agents = allUsers.filter(u => u.role === 'agent').map(u => u.id);
    
    // Find university clients by username (client.yasir, client.layla, client.malik)
    // Ensure client.yasir is first since it's shown in login demo credentials
    const universityClientUsernames = ['client.yasir', 'client.layla', 'client.malik'];
    const universityClients = universityClientUsernames
      .map(username => allUsers.find(u => u.role === 'client' && u.username === username))
      .filter((u): u is NonNullable<typeof u> => u !== undefined);
    
    if (agents.length === 0 || universityClients.length < 3) {
      console.warn('Cannot create university cases: missing agents or university clients');
      console.warn(`Found ${universityClients.length} university clients, need 3`);
      console.warn(`Found ${agents.length} agents`);
      return;
    }

    const universityClientIds = universityClients.map(c => c.id);
    
    // Check which clients already have university cases
    const existingUniversityCases = existingCases.filter(c => 
      c.id.startsWith('case_university_') && universityClientIds.includes(c.clientId)
    );
    const clientsWithCases = new Set(existingUniversityCases.map(c => c.clientId));
    
    console.log('Checking university cases...');
    console.log(`Existing university cases: ${existingUniversityCases.length}`);
    console.log(`University clients: ${universityClients.map(c => `${c.username} (${c.id})`).join(', ')}`);
    console.log(`Clients with cases: ${Array.from(clientsWithCases).join(', ')}`);
    
    // First, fix existing cases that might have wrong agentId
    // Get university agents to fix existing cases
    const universityAgentIdsForFix = agents.filter(a => {
      const agentUser = allUsers.find(u => u.id === a);
      return agentUser && agentUser.agentType === 'university';
    });
    const finalUniversityAgentIdsForFix = universityAgentIdsForFix.length >= 2 
      ? universityAgentIdsForFix 
      : ['agent_004', 'agent_005'].filter(id => agents.includes(id));
    
    // Update existing cases to have correct agentId if they're university cases
    for (const existingCase of existingUniversityCases) {
      if (!finalUniversityAgentIdsForFix.includes(existingCase.agentId)) {
        // Case has wrong agentId, fix it
        const caseIndex = existingUniversityCases.indexOf(existingCase);
        const correctAgentId = finalUniversityAgentIdsForFix[caseIndex % finalUniversityAgentIdsForFix.length];
        console.log(`Fixing case ${existingCase.id}: changing agentId from ${existingCase.agentId} to ${correctAgentId}`);
        const { updateCase } = await import('./storage');
        await updateCase({
          ...existingCase,
          agentId: correctAgentId,
        });
      }
    }

    // Always ensure client.yasir has a case (shown in login demo)
    // Create cases for all clients that don't have one
    const clientsNeedingCases: number[] = [];
    for (let i = 0; i < universityClients.length; i++) {
      const clientId = universityClientIds[i];
      const clientUsername = universityClients[i].username;
      if (!clientsWithCases.has(clientId)) {
        clientsNeedingCases.push(i);
        console.log(`Client ${clientUsername} (${clientId}) needs a case`);
      } else {
        console.log(`Client ${clientUsername} (${clientId}) already has a case`);
      }
    }
    
    // Force create at least one case for client.yasir if they don't have one
    // This ensures the demo credential always has data
    const yasirIndex = universityClients.findIndex(c => c.username === 'client.yasir');
    if (yasirIndex >= 0 && !clientsWithCases.has(universityClientIds[yasirIndex])) {
      if (!clientsNeedingCases.includes(yasirIndex)) {
        clientsNeedingCases.unshift(yasirIndex); // Add to front to prioritize
      }
    }
    
    // Double-check: verify client.yasir has a case
    if (clientsNeedingCases.length === 0) {
      const yasirClient = universityClients.find(c => c.username === 'client.yasir');
      if (yasirClient) {
        const yasirCases = existingCases.filter(c => c.clientId === yasirClient.id);
        if (yasirCases.length === 0) {
          console.log('Force creating case for client.yasir (demo credential)');
          clientsNeedingCases.push(yasirIndex >= 0 ? yasirIndex : 0);
        }
      }
    }
    
    if (clientsNeedingCases.length === 0) {
      console.log('All university clients already have cases - verified');
      return;
    }
    
    console.log(`Creating ${clientsNeedingCases.length} new university cases...`);

    // Get university agents (agent_004 and agent_005) - filter by agentType
    const universityAgentIds = agents.filter(a => {
      const agentUser = allUsers.find(u => u.id === a);
      return agentUser && agentUser.agentType === 'university';
    });
    
    // If no university agents found, use agent_004 and agent_005 as fallback
    const finalUniversityAgentIds = universityAgentIds.length >= 2 
      ? universityAgentIds 
      : ['agent_004', 'agent_005'].filter(id => agents.includes(id));
    
    console.log(`Using university agents: ${finalUniversityAgentIds.join(', ')}`);

    // Generate cases for all university clients - only use university agents
    const universityCasesData = generateUniversityCases({ 
      agents: finalUniversityAgentIds, 
      clients: universityClientIds 
    });
    
    // Get all universities to assign cases
    const { getAllUniversities } = await import('./storage');
    const allUniversities = await getAllUniversities();
    const universityIds = ['university_001', 'university_002', 'university_003'];
    
    // Find the next available case number
    const existingCaseNumbers = existingUniversityCases
      .map(c => parseInt(c.id.replace('case_university_', '')))
      .filter(n => !isNaN(n));
    const maxCaseNumber = existingCaseNumbers.length > 0 ? Math.max(...existingCaseNumbers) : 0;
    
    for (let idx = 0; idx < clientsNeedingCases.length; idx++) {
      const i = clientsNeedingCases[idx];
      const clientId = universityClientIds[i];
      
      // Check if this client already has a case (by clientId, not by case ID)
      const existingCaseForClient = existingCases.find(c => c.clientId === clientId);
      if (existingCaseForClient) {
        console.log(`Client ${universityClients[i].username} (${clientId}) already has case ${existingCaseForClient.id}, skipping`);
        continue;
      }
      
      // Find a unique case ID for this client
      let caseNumber = maxCaseNumber + idx + 1;
      let caseId = `case_university_${String(caseNumber).padStart(3, '0')}`;
      let attempts = 0;
      
      // Keep trying until we find a unique case ID
      while (existingCases.some(c => c.id === caseId) && attempts < 100) {
        caseNumber++;
        caseId = `case_university_${String(caseNumber).padStart(3, '0')}`;
        attempts++;
      }
      
      if (existingCases.some(c => c.id === caseId)) {
        console.error(`Could not find unique case ID after ${attempts} attempts, skipping client ${universityClients[i].username}`);
        continue;
      }
      
      const caseData = {
        ...universityCasesData[i],
        id: caseId,
        clientId: universityClientIds[i], // Ensure correct client ID
      } as Case;
      
      // Ensure agentId is set correctly - use index relative to the clientsNeedingCases array
      // This ensures cases are distributed evenly among university agents
      const agentIndex = idx % finalUniversityAgentIds.length;
      caseData.agentId = finalUniversityAgentIds[agentIndex];
      console.log(`Case ${caseId} assigned to agent ${caseData.agentId} (index ${agentIndex} of ${finalUniversityAgentIds.length})`);
      
      // Assign to university - ensure university_001 (university.du) gets cases
      // Distribute: case 0, 1 → university_001, case 2 → university_002, case 3+ → rotate
      let assignedUniId: string;
      if (i === 0 || i === 1) {
        // First two cases go to university_001 (university.du)
        assignedUniId = 'university_001';
      } else {
        // Remaining cases distribute across all universities
        assignedUniId = universityIds[i % universityIds.length];
      }
      // Assign university even for early statuses so university agents can see them
      caseData.assignedUniversity = assignedUniId;
      
      // Update client info to match the actual client from seedClients
      const client = universityClients[i];
      const seedClientIndex = seedClients.findIndex(sc => sc.username === client?.username);
      if (client && seedClientIndex >= 0) {
        const seedClient = seedClients[seedClientIndex];
        caseData.clientInfo = {
          name: seedClient.name,
          dob: '2000-05-15',
          passport: `SD${2234567 + i}`,
          nationality: 'Sudanese',
          condition: caseData.clientInfo?.condition || 'Bachelor of Engineering - Computer Science',
          phone: seedClient.phone,
          email: seedClient.email,
          address: 'Khartoum, Sudan',
          emergencyContact: 'Family Member',
          emergencyPhone: '+249-918-999-999',
        };
      } else if (client) {
        // Fallback if seedClient not found
        caseData.clientInfo = {
          ...caseData.clientInfo,
          name: client.name,
          email: client.email,
          phone: client.phone,
        };
      }
      
      // Update activity log case IDs
      if (caseData.activityLog) {
        caseData.activityLog = caseData.activityLog.map(log => ({
          ...log,
          caseId: caseData.id,
        }));
      }
      
      try {
        await addCase(caseData);
        console.log(`✅ Created university case ${caseId} for client ${client?.username} (${caseData.clientId}), assigned to ${assignedUniId}`);
      } catch (caseError) {
        console.error(`❌ Failed to create case ${caseId} for client ${client?.username}:`, caseError);
        // Continue with other cases
      }
    }
    
    // Verify cases were created and log details
    const { getAllCases: verifyGetAllCases } = await import('./storage');
    const verifyCases = await verifyGetAllCases();
    const createdCases = verifyCases.filter(c => 
      c.id.startsWith('case_university_') && universityClientIds.includes(c.clientId)
    );
    console.log(`✅ University cases verification: ${createdCases.length} cases found for university clients`);
    console.log(`University client IDs: ${universityClientIds.join(', ')}`);
    createdCases.forEach(c => {
      const caseClient = universityClients.find(uc => uc.id === c.clientId);
      console.log(`  - Case ${c.id} for client ${caseClient?.username || 'unknown'} (${c.clientId}), assigned to ${c.assignedUniversity || 'none'}, status: ${c.status}`);
    });
    
    // Also check all cases for these clients (in case they have non-university cases)
    const allClientCases = verifyCases.filter(c => universityClientIds.includes(c.clientId));
    console.log(`Total cases for university clients: ${allClientCases.length}`);
    
    console.log(`University cases added successfully (${clientsNeedingCases.length} new cases)`);
  } catch (error) {
    console.error('Error in addUniversityCasesIfMissing:', error);
    // Don't throw - allow app to continue
  }
};

// Force create university cases - always creates cases for all university clients
export const forceCreateUniversityCases = async (): Promise<void> => {
  try {
    const { getAllUsers, addCase } = await import('./storage');
    const allUsers = await getAllUsers();
    const agents = allUsers.filter(u => u.role === 'agent').map(u => u.id);
    
    const universityClientUsernames = ['client.yasir', 'client.layla', 'client.malik'];
    const universityClients = universityClientUsernames
      .map(username => allUsers.find(u => u.role === 'client' && u.username === username))
      .filter((u): u is NonNullable<typeof u> => u !== undefined);
    
    if (universityClients.length === 0 || agents.length === 0) {
      console.warn('Cannot force create: missing university clients or agents');
      return;
    }
    
    console.log('Force creating university cases for all clients...');
    const universityClientIds = universityClients.map(c => c.id);
    
    // Get university agents (agent_004 and agent_005) - filter by agentType
    const { getAllUsers: getAllUsersForForce } = await import('./storage');
    const allUsersForForce = await getAllUsersForForce();
    const universityAgentIds = agents.filter(a => {
      const agentUser = allUsersForForce.find(u => u.id === a);
      return agentUser && agentUser.agentType === 'university';
    });
    
    // If no university agents found, use agent_004 and agent_005 as fallback
    const finalUniversityAgentIds = universityAgentIds.length >= 2 
      ? universityAgentIds 
      : ['agent_004', 'agent_005'].filter(id => agents.includes(id));
    
    console.log(`Using university agents: ${finalUniversityAgentIds.join(', ')}`);
    
    const universityCasesData = generateUniversityCases({ 
      agents: finalUniversityAgentIds, 
      clients: universityClientIds 
    });
    
    const universityIds = ['university_001', 'university_002', 'university_003'];
    
    for (let i = 0; i < universityClients.length; i++) {
      const caseId = `case_university_${String(i + 1).padStart(3, '0')}`;
      const caseData = {
        ...universityCasesData[i],
        id: caseId,
        clientId: universityClientIds[i],
        assignedUniversity: i === 0 || i === 1 ? 'university_001' : universityIds[i % universityIds.length],
      } as Case;
      
      const client = universityClients[i];
      const seedClient = seedClients.find(sc => sc.username === client.username);
      if (seedClient) {
        caseData.clientInfo = {
          name: seedClient.name,
          dob: '2000-05-15',
          passport: `SD${2234567 + i}`,
          nationality: 'Sudanese',
          condition: caseData.clientInfo?.condition || 'Bachelor of Engineering - Computer Science',
          phone: seedClient.phone,
          email: seedClient.email,
          address: 'Khartoum, Sudan',
          emergencyContact: 'Family Member',
          emergencyPhone: '+249-918-999-999',
        };
      }
      
      if (caseData.activityLog) {
        caseData.activityLog = caseData.activityLog.map(log => ({
          ...log,
          caseId: caseData.id,
        }));
      }
      
      try {
        await addCase(caseData);
        console.log(`✅ Force created case ${caseId} for ${client.username} (${caseData.clientId}), assigned to ${caseData.assignedUniversity}`);
      } catch (error) {
        console.error(`❌ Failed to force create case for ${client.username}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in forceCreateUniversityCases:', error);
  }
};

// Add agents if they don't exist
export const addAgentsIfMissing = async (): Promise<void> => {
  try {
    const allUsers = await getAllUsers();
    
    // Check if agent.hospital and agent.university exist by username
    const agentHospital = allUsers.find(u => u.username === 'agent.hospital');
    const agentUniversity = allUsers.find(u => u.username === 'agent.university');
    
    if (agentHospital && agentUniversity) {
      console.log('Agents already exist');
      return;
    }

    console.log('Adding missing agents...');
    // Create agents (indices 1-5 in seedUsers)
    for (let i = 1; i <= 5; i++) {
      const agentId = `agent_${String(i).padStart(3, '0')}`;
      const agentData = seedUsers[i];
      const existingUser = allUsers.find(u => u.username === agentData.username);
      
      if (!existingUser) {
        try {
          await addUser({ id: agentId, ...agentData });
          console.log(`✅ Added agent: ${agentData.username}`);
        } catch (error) {
          console.error(`Error adding agent ${agentData.username}:`, error);
          // Continue with other agents even if one fails
        }
      }
    }
    console.log('Agents added successfully');
  } catch (error) {
    console.error('Error in addAgentsIfMissing:', error);
    // Don't throw - allow app to continue even if agents can't be added
  }
};

// Add university users if they don't exist
export const addUniversityUsersIfMissing = async (): Promise<void> => {
  try {
    const allUsers = await getAllUsers();
    const universityUsers = allUsers.filter(u => u.role === 'university');
    
    if (universityUsers.length >= 3) {
      console.log('University users already exist');
      return;
    }

    console.log('Adding university users...');
    // Create university users (indices 9-11 in seedUsers)
    for (let i = 9; i <= 11; i++) {
      const universityUserId = `university_user_${String(i - 8).padStart(3, '0')}`;
      const existingUser = allUsers.find(u => u.id === universityUserId);
      if (!existingUser) {
        try {
          await addUser({ id: universityUserId, ...seedUsers[i] });
        } catch (error) {
          console.error(`Error adding university user ${universityUserId}:`, error);
          // Continue with other users even if one fails
        }
      }
    }
    console.log('University users added successfully');
  } catch (error) {
    console.error('Error in addUniversityUsersIfMissing:', error);
    // Don't throw - allow app to continue even if university users can't be added
  }
};

// Add university clients if they don't exist
export const addUniversityClientsIfMissing = async (): Promise<void> => {
  try {
    const { getAllUsers, addUser } = await import('./storage');
    const allUsers = await getAllUsers();
    
    // University clients are the last 3 clients in seedClients (indices 9, 10, 11)
    // They are: client.yasir, client.layla, client.malik
    const universityClientUsernames = ['client.yasir', 'client.layla', 'client.malik'];
    const existingUniversityClients = allUsers.filter(u => 
      u.role === 'client' && universityClientUsernames.includes(u.username)
    );
    
    if (existingUniversityClients.length >= 3) {
      console.log('University clients already exist');
      return;
    }

    console.log('Adding university clients...');
    
    // Find the indices of university clients in seedClients
    const universityClientIndices: number[] = [];
    seedClients.forEach((client, index) => {
      if (universityClientUsernames.includes(client.username)) {
        universityClientIndices.push(index);
      }
    });
    
    // Add missing university clients
    for (const index of universityClientIndices) {
      const client = seedClients[index];
      const existingUser = allUsers.find(u => u.username === client.username);
      
      if (!existingUser) {
        // Calculate client ID based on position in seedClients (indices 9, 10, 11 = client_010, client_011, client_012)
        const clientId = `client_${String(index + 1).padStart(3, '0')}`;
        try {
          await addUser({ id: clientId, ...client });
          console.log(`Added university client: ${client.username}`);
        } catch (error) {
          console.error(`Error adding university client ${client.username}:`, error);
          // Continue with other clients even if one fails
        }
      }
    }
    
    console.log('University clients added successfully');
  } catch (error) {
    console.error('Error in addUniversityClientsIfMissing:', error);
    // Don't throw - allow app to continue even if university clients can't be added
  }
};

// Initialize seed data
export const initializeSeedData = async (): Promise<void> => {
  try {
    const initialized = await isDbInitialized();
    if (initialized) {
      console.log('Database already initialized');
      // Try to add finance cases if they don't exist (with longer timeout)
      try {
        await Promise.race([
          addFinanceCases(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
        ]);
      } catch (error) {
        console.error('Error adding finance cases:', error);
      }
      
      // Update existing cases with payments (with longer timeout)
      try {
        await Promise.race([
          updateExistingCasesWithPayments(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
        ]);
      } catch (error) {
        console.error('Error updating cases with payments:', error);
      }
      
      // Add agents if they don't exist (must run early)
      try {
        await Promise.race([
          addAgentsIfMissing(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
        ]);
      } catch (error) {
        console.error('Error adding agents:', error);
      }
      
      // Add universities and university users if they don't exist (with longer timeout)
      try {
        await Promise.race([
          addUniversitiesIfMissing(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
        ]);
      } catch (error) {
        console.error('Error adding universities:', error);
      }
      
      try {
        await Promise.race([
          addUniversityUsersIfMissing(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
        ]);
      } catch (error) {
        console.error('Error adding university users:', error);
      }
      
      // Add university clients if they don't exist (must run before cases)
      try {
        await Promise.race([
          addUniversityClientsIfMissing(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
        ]);
        // Wait a bit to ensure clients are saved
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error adding university clients:', error);
      }
      
      // Add university cases if they don't exist (with timeout)
      // Force create cases even if some exist - ensure all clients have at least one
      try {
        await Promise.race([
          addUniversityCasesIfMissing(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 20000))
        ]);
      } catch (error) {
        console.error('Error adding university cases:', error);
        // Try one more time after a delay
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await addUniversityCasesIfMissing();
        } catch (retryError) {
          console.error('Retry failed for university cases:', retryError);
          // Last resort: force create cases
          console.log('Attempting force create of university cases...');
          try {
            await forceCreateUniversityCases();
          } catch (forceError) {
            console.error('Force create also failed:', forceError);
          }
        }
      }
      
      return;
    }
  } catch (error) {
    console.error('Error checking database initialization:', error);
    // Continue with initialization even if check fails
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

  // Create university users
  for (let i = 9; i <= 11; i++) {
    const universityUserId = `university_user_${String(i - 8).padStart(3, '0')}`;
    await addUser({ id: universityUserId, ...seedUsers[i] });
  }

  // Create finance users
  for (let i = 12; i <= 13; i++) {
    const financeId = `finance_${String(i - 11).padStart(3, '0')}`;
    await addUser({ id: financeId, ...seedUsers[i] });
  }

  // Create hospitals
  for (const hospital of seedHospitals) {
    await addHospital(hospital);
  }

  // Create universities
  for (const university of seedUniversities) {
    await addUniversity(university);
  }

  // Create clients and their cases
  const clientIds: string[] = [];
  for (let i = 0; i < seedClients.length; i++) {
    const clientId = `client_${String(i + 1).padStart(3, '0')}`;
    clientIds.push(clientId);
    await addUser({ id: clientId, ...seedClients[i] });
  }

  // Create hospital cases
  // Get hospital agents (first 3 agents with agentType: 'hospital')
  const hospitalAgentIds = agentIds.slice(0, 3); // agent_001, agent_002, agent_003 (hospital agents)
  // Get hospital clients (all except last 3 which are university clients)
  const hospitalClientIds = clientIds.slice(0, -3);
  
  const hospitalCasesData = generateSeedCases({ agents: hospitalAgentIds, clients: hospitalClientIds });
  for (let i = 0; i < hospitalCasesData.length; i++) {
    const caseId = `case_${String(i + 1).padStart(3, '0')}`;
    const caseData = hospitalCasesData[i];
    
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

  // Create university cases
  // Get university agents (last 2 agents with agentType: 'university')
  const universityAgentIds = agentIds.slice(3, 5); // agent_004, agent_005 (university agents)
  // Get university clients (last 3 clients)
  const universityClientIds = clientIds.slice(-3);
  
  const universityCasesData = generateUniversityCases({ agents: universityAgentIds, clients: universityClientIds });
  const universityIds = ['university_001', 'university_002', 'university_003'];
  
  for (let i = 0; i < universityCasesData.length; i++) {
    const caseId = `case_university_${String(i + 1).padStart(3, '0')}`;
    const caseData = {
      ...universityCasesData[i],
      id: caseId,
    } as Case;
    
    // Assign to university - ensure university_001 (university.du) gets cases
    // Distribute: case 0, 1 → university_001, case 2 → university_002, case 3+ → rotate
    let assignedUniId: string;
    if (i === 0 || i === 1) {
      // First two cases go to university_001 (university.du)
      assignedUniId = 'university_001';
    } else {
      // Remaining cases distribute across all universities
      assignedUniId = universityIds[i % universityIds.length];
    }
    // Assign university even for early statuses so university agents can see them
    caseData.assignedUniversity = assignedUniId;
    
    // Update activity log case IDs
    if (caseData.activityLog) {
      caseData.activityLog = caseData.activityLog.map(log => ({
        ...log,
        caseId: caseData.id,
      }));
    }
    
    await addCase(caseData);
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
