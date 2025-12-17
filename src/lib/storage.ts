import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { User, Case, Hospital, Notification } from '@/types';

interface SudIndDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-username': string; 'by-role': string };
  };
  cases: {
    key: string;
    value: Case;
    indexes: { 'by-client': string; 'by-agent': string; 'by-hospital': string; 'by-status': string };
  };
  hospitals: {
    key: string;
    value: Hospital;
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
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<SudIndDB> | null = null;

export const initDB = async (): Promise<IDBPDatabase<SudIndDB>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<SudIndDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
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
      }

      // Hospitals store
      if (!db.objectStoreNames.contains('hospitals')) {
        db.createObjectStore('hospitals', { keyPath: 'id' });
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
  });

  return dbInstance;
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

export const addCase = async (caseData: Case): Promise<void> => {
  const db = await initDB();
  await db.put('cases', caseData);
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
