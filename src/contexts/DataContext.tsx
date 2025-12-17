import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Case, Hospital, User, Notification, CaseStatus, Document as CaseDocument, ActivityLog, Comment } from '@/types';
import {
  getAllCases,
  getCaseById,
  addCase,
  updateCase,
  getAllHospitals,
  getAllUsers,
  addUser,
  getNotificationsByUser,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  generateId,
  simulateDelay,
} from '@/lib/storage';
import { useAuth } from './AuthContext';

interface DataContextType {
  cases: Case[];
  hospitals: Hospital[];
  users: User[];
  notifications: Notification[];
  isLoading: boolean;
  // Case operations
  refreshCases: () => Promise<void>;
  getCase: (id: string) => Promise<Case | undefined>;
  createCase: (caseData: Partial<Case>) => Promise<Case>;
  updateCaseStatus: (caseId: string, newStatus: CaseStatus, note?: string) => Promise<void>;
  updateCaseData: (caseId: string, updates: Partial<Case>) => Promise<void>;
  addDocument: (caseId: string, document: Omit<CaseDocument, 'id'>) => Promise<void>;
  removeDocument: (caseId: string, documentId: string) => Promise<void>;
  addComment: (caseId: string, message: string, isPreset?: boolean) => Promise<void>;
  assignHospital: (caseId: string, hospitalId: string) => Promise<void>;
  // User operations
  createUser: (userData: Omit<User, 'id'>) => Promise<User>;
  // Notification operations
  refreshNotifications: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  // Stats
  getStats: () => { total: number; active: number; pending: number; completed: number; urgent: number };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [casesData, hospitalsData, usersData] = await Promise.all([
        getAllCases(),
        getAllHospitals(),
        getAllUsers(),
      ]);
      
      setCases(casesData);
      setHospitals(hospitalsData);
      setUsers(usersData);
      
      if (user) {
        const notifs = await getNotificationsByUser(user.id);
        setNotifications(notifs.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const refreshCases = async () => {
    const casesData = await getAllCases();
    setCases(casesData);
  };

  const getCase = async (id: string): Promise<Case | undefined> => {
    return getCaseById(id);
  };

  const createCase = async (caseData: Partial<Case>): Promise<Case> => {
    await simulateDelay(600);
    const newCase: Case = {
      id: generateId('case'),
      clientId: caseData.clientId || '',
      agentId: user?.id || '',
      status: 'new',
      statusHistory: [{
        status: 'new',
        timestamp: new Date().toISOString(),
        by: user?.id || '',
        byName: user?.name || '',
        note: 'Case created',
      }],
      documents: [],
      clientInfo: caseData.clientInfo || {
        name: '',
        dob: '',
        passport: '',
        nationality: '',
        condition: '',
        phone: '',
        email: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
      },
      attenderInfo: caseData.attenderInfo,
      payments: [],
      visa: { status: 'not_started' },
      comments: [],
      activityLog: [{
        id: generateId('log'),
        caseId: '',
        userId: user?.id || '',
        userName: user?.name || '',
        userRole: user?.role || 'agent',
        action: 'Case Created',
        details: `New case created for ${caseData.clientInfo?.name || 'patient'}`,
        timestamp: new Date().toISOString(),
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priority: caseData.priority || 'medium',
    };

    newCase.activityLog[0].caseId = newCase.id;
    await addCase(newCase);
    await refreshCases();
    return newCase;
  };

  const updateCaseStatus = async (caseId: string, newStatus: CaseStatus, note?: string) => {
    await simulateDelay(400);
    const existingCase = await getCaseById(caseId);
    if (!existingCase) return;

    const statusEntry = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      by: user?.id || '',
      byName: user?.name || '',
      note,
    };

    const activityEntry: ActivityLog = {
      id: generateId('log'),
      caseId,
      userId: user?.id || '',
      userName: user?.name || '',
      userRole: user?.role || 'admin',
      action: 'Status Updated',
      details: `Status changed from ${existingCase.status} to ${newStatus}${note ? `: ${note}` : ''}`,
      timestamp: new Date().toISOString(),
    };

    const updatedCase = {
      ...existingCase,
      status: newStatus,
      statusHistory: [...existingCase.statusHistory, statusEntry],
      activityLog: [...existingCase.activityLog, activityEntry],
      updatedAt: new Date().toISOString(),
    };

    await updateCase(updatedCase);
    await refreshCases();
  };

  const updateCaseData = async (caseId: string, updates: Partial<Case>) => {
    await simulateDelay(400);
    const existingCase = await getCaseById(caseId);
    if (!existingCase) return;

    const updatedCase = {
      ...existingCase,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await updateCase(updatedCase);
    await refreshCases();
  };

  const addDocument = async (caseId: string, document: Omit<CaseDocument, 'id'>) => {
    await simulateDelay(300);
    const existingCase = await getCaseById(caseId);
    if (!existingCase) return;

    const newDoc: CaseDocument = {
      ...document,
      id: generateId('doc'),
    };

    const activityEntry: ActivityLog = {
      id: generateId('log'),
      caseId,
      userId: user?.id || '',
      userName: user?.name || '',
      userRole: user?.role || 'agent',
      action: 'Document Uploaded',
      details: `Uploaded ${document.name}`,
      timestamp: new Date().toISOString(),
    };

    const updatedCase = {
      ...existingCase,
      documents: [...existingCase.documents, newDoc],
      activityLog: [...existingCase.activityLog, activityEntry],
      updatedAt: new Date().toISOString(),
    };

    await updateCase(updatedCase);
    await refreshCases();
  };

  const removeDocument = async (caseId: string, documentId: string) => {
    await simulateDelay(300);
    const existingCase = await getCaseById(caseId);
    if (!existingCase) return;

    const doc = existingCase.documents.find(d => d.id === documentId);
    
    const activityEntry: ActivityLog = {
      id: generateId('log'),
      caseId,
      userId: user?.id || '',
      userName: user?.name || '',
      userRole: user?.role || 'agent',
      action: 'Document Removed',
      details: `Removed ${doc?.name || 'document'}`,
      timestamp: new Date().toISOString(),
    };

    const updatedCase = {
      ...existingCase,
      documents: existingCase.documents.filter(d => d.id !== documentId),
      activityLog: [...existingCase.activityLog, activityEntry],
      updatedAt: new Date().toISOString(),
    };

    await updateCase(updatedCase);
    await refreshCases();
  };

  const addComment = async (caseId: string, message: string, isPreset?: boolean) => {
    await simulateDelay(300);
    const existingCase = await getCaseById(caseId);
    if (!existingCase) return;

    const comment: Comment = {
      id: generateId('comment'),
      caseId,
      userId: user?.id || '',
      userName: user?.name || '',
      userRole: user?.role || 'client',
      message,
      timestamp: new Date().toISOString(),
      isPreset,
    };

    const updatedCase = {
      ...existingCase,
      comments: [...existingCase.comments, comment],
      updatedAt: new Date().toISOString(),
    };

    await updateCase(updatedCase);
    await refreshCases();
  };

  const assignHospital = async (caseId: string, hospitalId: string) => {
    await simulateDelay(400);
    const existingCase = await getCaseById(caseId);
    if (!existingCase) return;

    const hospital = hospitals.find(h => h.id === hospitalId);

    const activityEntry: ActivityLog = {
      id: generateId('log'),
      caseId,
      userId: user?.id || '',
      userName: user?.name || '',
      userRole: user?.role || 'admin',
      action: 'Hospital Assigned',
      details: `Case assigned to ${hospital?.name || 'hospital'}`,
      timestamp: new Date().toISOString(),
    };

    const statusEntry = {
      status: 'assigned_to_hospital' as CaseStatus,
      timestamp: new Date().toISOString(),
      by: user?.id || '',
      byName: user?.name || '',
      note: `Assigned to ${hospital?.name}`,
    };

    const updatedCase = {
      ...existingCase,
      assignedHospital: hospitalId,
      status: 'assigned_to_hospital' as CaseStatus,
      statusHistory: [...existingCase.statusHistory, statusEntry],
      activityLog: [...existingCase.activityLog, activityEntry],
      updatedAt: new Date().toISOString(),
    };

    await updateCase(updatedCase);
    await refreshCases();
  };

  const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    await simulateDelay(500);
    const newUser: User = {
      ...userData,
      id: generateId(userData.role),
    };
    await addUser(newUser);
    const usersData = await getAllUsers();
    setUsers(usersData);
    return newUser;
  };

  const refreshNotifications = async () => {
    if (!user) return;
    const notifs = await getNotificationsByUser(user.id);
    setNotifications(notifs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  };

  const markRead = async (notificationId: string) => {
    await markNotificationRead(notificationId);
    await refreshNotifications();
  };

  const markAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    await refreshNotifications();
  };

  const getStats = () => {
    const filteredCases = user?.role === 'agent' 
      ? cases.filter(c => c.agentId === user.id)
      : user?.role === 'client'
      ? cases.filter(c => c.clientId === user.id)
      : user?.role === 'hospital'
      ? cases.filter(c => c.assignedHospital === user.hospitalId)
      : cases;

    return {
      total: filteredCases.length,
      active: filteredCases.filter(c => c.status !== 'case_closed' && c.status !== 'visa_terminate').length,
      pending: filteredCases.filter(c => 
        c.status === 'admin_review' || 
        c.status === 'hospital_review' || 
        c.status.includes('pending')
      ).length,
      completed: filteredCases.filter(c => c.status === 'case_closed').length,
      urgent: filteredCases.filter(c => c.priority === 'urgent').length,
    };
  };

  return (
    <DataContext.Provider
      value={{
        cases,
        hospitals,
        users,
        notifications,
        isLoading,
        refreshCases,
        getCase,
        createCase,
        updateCaseStatus,
        updateCaseData,
        addDocument,
        removeDocument,
        addComment,
        assignHospital,
        createUser,
        refreshNotifications,
        markRead,
        markAllRead,
        getStats,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
