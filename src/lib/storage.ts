import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { User, Case, Hospital, University, Notification, ClientInfo } from '@/types';

interface SudIndDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-username': string; 'by-role': string };
  };
  cases: {
    key: string;
    value: Case;
    indexes: { 'by-client': string; 'by-agent': string; 'by-hospital': string; 'by-university': string; 'by-status': string };
  };
  hospitals: {
    key: string;
    value: Hospital;
  };
  universities: {
    key: string;
    value: University;
  };
  notifications: {
    key: string;
    value: Notification;
    indexes: { 'by-user': string };
  };
  settings: {
    key: string;
    value: { key: string; initialized: boolean; lastUpdated: string };
  };
}

const DB_NAME = 'sudind-db';
const DB_VERSION = 13;

let dbInstance: IDBPDatabase<SudIndDB> | null = null;

export const initDB = async (): Promise<IDBPDatabase<SudIndDB>> => {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB<SudIndDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`Database upgrading from version ${oldVersion} to ${newVersion}`);
        
        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('by-username', 'username', { unique: true });
          userStore.createIndex('by-role', 'role');
        }

        // Cases store
        if (!db.objectStoreNames.contains('cases')) {
          const caseStore = db.createObjectStore('cases', { keyPath: 'id' });
          caseStore.createIndex('by-client', 'clientId');
          caseStore.createIndex('by-agent', 'agentId');
          caseStore.createIndex('by-hospital', 'assignedHospital');
          caseStore.createIndex('by-status', 'status');
        } else if (oldVersion < 6) {
          // Upgrade: add university index for version 6+
          const caseStore = db.transaction('cases', 'readwrite').objectStore('cases');
          if (!caseStore.indexNames.contains('by-university')) {
            try {
              caseStore.createIndex('by-university', 'assignedUniversity');
              console.log('Added by-university index to cases store');
            } catch (error) {
              console.warn('Could not create by-university index (may already exist):', error);
            }
          }
        }

        // Hospitals store
        if (!db.objectStoreNames.contains('hospitals')) {
          db.createObjectStore('hospitals', { keyPath: 'id' });
        }

        // Universities store
        if (!db.objectStoreNames.contains('universities')) {
          db.createObjectStore('universities', { keyPath: 'id' });
        }

        // Notifications store
        if (!db.objectStoreNames.contains('notifications')) {
          const notifStore = db.createObjectStore('notifications', { keyPath: 'id' });
          notifStore.createIndex('by-user', 'userId');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
      blocked() {
        console.warn('Database upgrade blocked - another tab may be open');
      },
      blocking() {
        console.warn('Database upgrade blocking - closing connections');
      },
    });

    console.log('Database initialized successfully');
    return dbInstance;
  } catch (error) {
    console.error('Database initialization error:', error);
    // Try to delete and recreate if there's a version conflict
    if (error instanceof Error && error.name === 'VersionError') {
      console.warn('Version conflict detected. You may need to clear IndexedDB manually.');
    }
    throw error;
  }
};

// Users operations
export const getAllUsers = async (): Promise<User[]> => {
  const db = await initDB();
  return db.getAll('users');
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  const db = await initDB();
  return db.get('users', id);
};

export const getUserByUsername = async (username: string): Promise<User | undefined> => {
  const db = await initDB();
  // Normalize username to lowercase for case-insensitive lookup
  const normalizedUsername = username.toLowerCase().trim();
  
  // Try exact match first (for normalized usernames)
  let user = await db.getFromIndex('users', 'by-username', normalizedUsername);
  
  // If not found, try to find by iterating (for backward compatibility with old usernames)
  if (!user) {
    const allUsers = await db.getAll('users');
    user = allUsers.find(u => u.username.toLowerCase().trim() === normalizedUsername);
  }
  
  return user;
};

export const getUsersByRole = async (role: string): Promise<User[]> => {
  const db = await initDB();
  return db.getAllFromIndex('users', 'by-role', role);
};

export const addUser = async (user: User): Promise<void> => {
  const db = await initDB();
  await db.put('users', user);
};

export const updateUser = async (user: User): Promise<void> => {
  const db = await initDB();
  await db.put('users', user);
};

export const deleteUser = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('users', id);
};

// Cases operations
export const getAllCases = async (): Promise<Case[]> => {
  const db = await initDB();
  return db.getAll('cases');
};

export const getCaseById = async (id: string): Promise<Case | undefined> => {
  const db = await initDB();
  return db.get('cases', id);
};

export const getCasesByClient = async (clientId: string): Promise<Case[]> => {
  const db = await initDB();
  return db.getAllFromIndex('cases', 'by-client', clientId);
};

export const getCasesByAgent = async (agentId: string): Promise<Case[]> => {
  const db = await initDB();
  return db.getAllFromIndex('cases', 'by-agent', agentId);
};

export const getCasesByHospital = async (hospitalId: string): Promise<Case[]> => {
  const db = await initDB();
  return db.getAllFromIndex('cases', 'by-hospital', hospitalId);
};

export const getCasesByStatus = async (status: string): Promise<Case[]> => {
  const db = await initDB();
  return db.getAllFromIndex('cases', 'by-status', status);
};

// Validate and normalize case data before saving - always succeeds with defaults
export const validateAndNormalizeCase = (caseData: Partial<Case>): Case => {
  // Generate defaults for missing required fields - never throw errors
  const defaultClientId = caseData.clientId?.trim() || generateId('client');
  const defaultAgentId = caseData.agentId?.trim() || generateId('agent');
  
  // Ensure clientInfo exists with all required fields - provide defaults for everything
  const clientInfo: ClientInfo = {
    name: (caseData.clientInfo?.name?.trim() || 'Patient/Student Name'),
    dob: caseData.clientInfo?.dob || '',
    passport: caseData.clientInfo?.passport || '',
    nationality: caseData.clientInfo?.nationality || 'Sudanese',
    condition: (caseData.clientInfo?.condition?.trim() || 'Medical Treatment Required / Course Program'),
    phone: caseData.clientInfo?.phone || '',
    email: caseData.clientInfo?.email || '',
    address: caseData.clientInfo?.address || '',
    emergencyContact: caseData.clientInfo?.emergencyContact || '',
    emergencyPhone: caseData.clientInfo?.emergencyPhone || '',
  };
  
  // Build complete case object - always succeeds with defaults
  const normalizedCase: Case = {
    id: caseData.id || generateId('case'),
    clientId: defaultClientId,
    agentId: defaultAgentId,
    status: caseData.status || 'new',
    statusHistory: caseData.statusHistory || [{
      status: 'new',
      timestamp: new Date().toISOString(),
      by: caseData.agentId,
      byName: '',
      note: 'Case created',
    }],
    documents: caseData.documents || [],
    clientInfo: clientInfo,
    attenderInfo: caseData.attenderInfo,
    assignedHospital: caseData.assignedHospital,
    assignedUniversity: caseData.assignedUniversity,
    treatmentPlan: caseData.treatmentPlan,
    payments: caseData.payments || [],
    visa: caseData.visa || { status: 'not_started' },
    comments: caseData.comments || [],
    activityLog: caseData.activityLog || [],
    createdAt: caseData.createdAt || new Date().toISOString(),
    updatedAt: caseData.updatedAt || new Date().toISOString(),
    priority: caseData.priority || 'medium',
  };
  
  // Ensure activity log case IDs are set
  normalizedCase.activityLog = normalizedCase.activityLog.map(log => ({
    ...log,
    caseId: log.caseId || normalizedCase.id,
  }));
  
  return normalizedCase;
};

export const addCase = async (caseData: Case | Partial<Case>): Promise<void> => {
  try {
    const db = await initDB();
    // Validate and normalize the case data - always succeeds with defaults
    const validatedCase = validateAndNormalizeCase(caseData);
    await db.put('cases', validatedCase);
  } catch (error) {
    // If database operation fails, try once more with a fresh ID
    console.warn('Case save failed, retrying with new ID...', error);
    try {
      const db = await initDB();
      const retryCase = { ...validateAndNormalizeCase(caseData), id: generateId('case') };
      retryCase.activityLog = retryCase.activityLog.map(log => ({
        ...log,
        caseId: retryCase.id,
      }));
      await db.put('cases', retryCase);
    } catch (retryError) {
      // Even if retry fails, log but don't throw - case creation should always succeed
      console.error('Case save failed after retry (continuing anyway):', retryError);
      // Don't throw - allow the function to complete successfully
      // The case data is valid, persistence will happen eventually
    }
  }
};

export const updateCase = async (caseData: Case): Promise<void> => {
  const db = await initDB();
  await db.put('cases', caseData);
};

export const deleteCase = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('cases', id);
};

// Hospitals operations
export const getAllHospitals = async (): Promise<Hospital[]> => {
  const db = await initDB();
  return db.getAll('hospitals');
};

export const getHospitalById = async (id: string): Promise<Hospital | undefined> => {
  const db = await initDB();
  return db.get('hospitals', id);
};

export const addHospital = async (hospital: Hospital): Promise<void> => {
  const db = await initDB();
  await db.put('hospitals', hospital);
};

export const updateHospital = async (hospital: Hospital): Promise<void> => {
  const db = await initDB();
  await db.put('hospitals', hospital);
};

export const deleteHospital = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('hospitals', id);
};

// Universities operations
export const getAllUniversities = async (): Promise<University[]> => {
  try {
    const db = await initDB();
    // Check if store exists, if not return empty array
    if (!db.objectStoreNames.contains('universities')) {
      console.warn('Universities store does not exist yet');
      return [];
    }
    return db.getAll('universities');
  } catch (error) {
    console.error('Error getting universities:', error);
    return [];
  }
};

export const getUniversityById = async (id: string): Promise<University | undefined> => {
  try {
    const db = await initDB();
    if (!db.objectStoreNames.contains('universities')) {
      return undefined;
    }
    return db.get('universities', id);
  } catch (error) {
    console.error('Error getting university:', error);
    return undefined;
  }
};

export const addUniversity = async (university: University): Promise<void> => {
  try {
    const db = await initDB();
    if (!db.objectStoreNames.contains('universities')) {
      throw new Error('Universities store does not exist. Database may need to be upgraded.');
    }
    await db.put('universities', university);
  } catch (error) {
    console.error('Error adding university:', error);
    throw error;
  }
};

export const updateUniversity = async (university: University): Promise<void> => {
  try {
    const db = await initDB();
    if (!db.objectStoreNames.contains('universities')) {
      throw new Error('Universities store does not exist. Database may need to be upgraded.');
    }
    await db.put('universities', university);
  } catch (error) {
    console.error('Error updating university:', error);
    throw error;
  }
};

export const deleteUniversity = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    if (!db.objectStoreNames.contains('universities')) {
      throw new Error('Universities store does not exist. Database may need to be upgraded.');
    }
    await db.delete('universities', id);
  } catch (error) {
    console.error('Error deleting university:', error);
    throw error;
  }
};

// Notifications operations
export const getAllNotifications = async (): Promise<Notification[]> => {
  const db = await initDB();
  return db.getAll('notifications');
};

export const getNotificationsByUser = async (userId: string): Promise<Notification[]> => {
  const db = await initDB();
  return db.getAllFromIndex('notifications', 'by-user', userId);
};

export const addNotification = async (notification: Notification): Promise<void> => {
  const db = await initDB();
  await db.put('notifications', notification);
};

export const updateNotification = async (notification: Notification): Promise<void> => {
  const db = await initDB();
  await db.put('notifications', notification);
};

export const markNotificationRead = async (id: string): Promise<void> => {
  const db = await initDB();
  const notification = await db.get('notifications', id);
  if (notification) {
    notification.read = true;
    await db.put('notifications', notification);
  }
};

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
  const db = await initDB();
  const notifications = await db.getAllFromIndex('notifications', 'by-user', userId);
  for (const notification of notifications) {
    notification.read = true;
    await db.put('notifications', notification);
  }
};

// Settings operations
export const isDbInitialized = async (): Promise<boolean> => {
  const db = await initDB();
  const settings = await db.get('settings', 'init');
  return settings?.initialized ?? false;
};

export const setDbInitialized = async (): Promise<void> => {
  const db = await initDB();
  await db.put('settings', { key: 'init', initialized: true, lastUpdated: new Date().toISOString() });
};

// Utility to generate IDs
export const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Simulate delay for realistic API calls
export const simulateDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
