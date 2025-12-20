import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Case, Hospital, User, Notification, CaseStatus, Document as CaseDocument, ActivityLog, Comment, PaymentRecord } from '@/types';
import {
  getAllCases,
  getCaseById,
  addCase,
  updateCase,
  getAllHospitals,
  getHospitalById,
  addHospital,
  updateHospital as updateHospitalStorage,
  deleteHospital as deleteHospitalStorage,
  getAllUsers,
  getUserById,
  addUser,
  updateUser as updateUserStorage,
  deleteUser as deleteUserStorage,
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
  updateUser: (userId: string, userData: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  // Hospital operations
  createHospital: (hospitalData: Omit<Hospital, 'id'>) => Promise<Hospital>;
  updateHospital: (hospitalId: string, hospitalData: Partial<Hospital>) => Promise<void>;
  deleteHospital: (hospitalId: string) => Promise<void>;
  refreshHospitals: () => Promise<void>;
  // Payment operations
  addPayment: (caseId: string, payment: Omit<PaymentRecord, 'id'>) => Promise<void>;
  updatePayment: (caseId: string, paymentId: string, payment: Partial<PaymentRecord>) => Promise<void>;
  deletePayment: (caseId: string, paymentId: string) => Promise<void>;
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

  // Generate chatbot auto-response based on case status and message
  const generateChatbotResponse = (caseStatus: CaseStatus, message: string): string => {
    const statusLower = caseStatus.toLowerCase();
    const messageLower = message.toLowerCase();

    // Status-based responses
    if (statusLower.includes('new') || statusLower.includes('agent_review')) {
      if (messageLower.includes('update') || messageLower.includes('status')) {
        return "Your case is currently under review by our SudInd coordination team. We're processing your documents and will update you soon.";
      }
      if (messageLower.includes('appointment') || messageLower.includes('when')) {
        return "Your appointment schedule will be confirmed once your case is reviewed and a hospital is assigned. We'll notify you as soon as this is arranged.";
      }
      return "Thank you for your message. Your case is in the initial review stage. Our team is working on processing your documents.";
    }

    if (statusLower.includes('admin_review') || statusLower.includes('assigned')) {
      if (messageLower.includes('update') || messageLower.includes('status')) {
        return "Your case is being reviewed by our admin team. Once approved, it will be forwarded to a hospital for evaluation.";
      }
      if (messageLower.includes('hospital')) {
        return "We're in the process of assigning your case to an appropriate hospital. You'll be notified once a hospital is assigned.";
      }
      return "Your case is currently under administrative review. We'll keep you updated on the progress.";
    }

    if (statusLower.includes('hospital_review') || statusLower.includes('case_accepted')) {
      if (messageLower.includes('appointment') || messageLower.includes('when')) {
        return "Your case has been assigned to a hospital and is under review. The hospital will provide treatment details and appointment schedule once they accept your case.";
      }
      if (messageLower.includes('treatment')) {
        return "The assigned hospital is reviewing your medical case. They will provide a treatment plan and schedule once the review is complete.";
      }
      return "Your case is being reviewed by the assigned hospital. They will provide treatment details and next steps shortly.";
    }

    if (statusLower.includes('treatment_plan')) {
      if (messageLower.includes('appointment') || messageLower.includes('when')) {
        return "A treatment plan has been uploaded for your case. The hospital will coordinate with you regarding appointment dates and travel arrangements.";
      }
      if (messageLower.includes('travel') || messageLower.includes('visa')) {
        return "Your treatment plan is ready. The next step is visa processing. Our team will guide you through the visa application process.";
      }
      return "Great news! A treatment plan has been prepared for your case. Our team will coordinate the next steps including visa processing and travel arrangements.";
    }

    if (statusLower.includes('visa')) {
      if (messageLower.includes('visa') || messageLower.includes('travel')) {
        if (statusLower.includes('approved')) {
          return "Your visa has been approved! Our team will now proceed with ticket booking and travel arrangements. You'll receive travel details soon.";
        }
        if (statusLower.includes('processing')) {
          return "Your visa application is currently being processed. We're working with the relevant authorities and will update you as soon as we have news.";
        }
        if (statusLower.includes('rejected')) {
          return "We understand your concern about the visa. Our team is working on reapplying or exploring alternative options. We'll keep you informed.";
        }
        return "Your visa application is in progress. Our team is handling all the necessary documentation and will update you on the status.";
      }
      return "Your visa application is being processed. We'll notify you as soon as there's an update on your visa status.";
    }

    if (statusLower.includes('ticket') || statusLower.includes('patient_manifest')) {
      if (messageLower.includes('travel') || messageLower.includes('when')) {
        return "Your travel arrangements are being finalized. Flight tickets and travel itinerary will be shared with you shortly.";
      }
      return "Your travel arrangements are in progress. We're coordinating your flight tickets and will share the details with you soon.";
    }

    if (statusLower.includes('treatment_in_progress') || statusLower.includes('frro')) {
      if (messageLower.includes('appointment') || messageLower.includes('treatment')) {
        return "Your treatment is currently in progress at the hospital. The medical team is providing the best care. We'll keep you updated on your progress.";
      }
      return "Your treatment is ongoing. The hospital medical team is taking excellent care of you. If you have any concerns, please let us know.";
    }

    if (statusLower.includes('discharge') || statusLower.includes('final_report')) {
      if (messageLower.includes('next') || messageLower.includes('steps')) {
        return "Your treatment is nearing completion. The hospital is preparing your discharge summary and final reports. We'll share these with you soon.";
      }
      return "Your treatment is complete. The hospital is finalizing your discharge documents and medical reports. We'll share these with you shortly.";
    }

    if (statusLower.includes('case_closed')) {
      return "Thank you for choosing SudInd services. Your case has been successfully completed. We wish you a speedy recovery and good health!";
    }

    // Generic responses based on message content
    if (messageLower.includes('thank')) {
      return "You're welcome! We're here to help. If you have any other questions, feel free to ask.";
    }

    if (messageLower.includes('document')) {
      return "If you need to upload additional documents, please contact your medical coordinator. They will guide you on which documents are needed.";
    }

    if (messageLower.includes('help') || messageLower.includes('question')) {
      return "We're here to help! Our SudInd team is available to answer your questions. Please let us know what specific information you need.";
    }

    // Default response
    return "Thank you for your message. Our team has received it and will respond accordingly. We're working on your case and will keep you updated.";
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

    const comments = [...existingCase.comments, comment];

    // If client sent a message, add auto-response
    if (user?.role === 'client' && isPreset) {
      await simulateDelay(1000); // Simulate AI processing time
      const autoResponse = generateChatbotResponse(existingCase.status, message);
      const botComment: Comment = {
        id: generateId('comment'),
        caseId,
        userId: 'system_bot',
        userName: 'SudInd Team',
        userRole: 'admin',
        message: autoResponse,
        timestamp: new Date().toISOString(),
        isPreset: false,
      };
      comments.push(botComment);
    }

    const updatedCase = {
      ...existingCase,
      comments,
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
    // Normalize username to lowercase and trim for consistency
    const newUser: User = {
      ...userData,
      username: userData.username.toLowerCase().trim(),
      id: generateId(userData.role),
    };
    
    // Debug logging for user creation
    console.log('Creating user:', {
      username: newUser.username,
      role: newUser.role,
      passwordLength: newUser.password?.length,
      passwordPreview: newUser.password?.substring(0, 20) + '...',
      passwordDecoded: newUser.password ? atob(newUser.password) : 'N/A',
      passwordChanged: newUser.passwordChanged,
    });
    
    await addUser(newUser);
    const usersData = await getAllUsers();
    setUsers(usersData);
    
    // Verify user was created correctly
    const createdUser = await getUserByUsername(newUser.username);
    if (createdUser) {
      console.log('User created successfully:', {
        id: createdUser.id,
        username: createdUser.username,
        passwordLength: createdUser.password?.length,
        passwordDecoded: createdUser.password ? atob(createdUser.password) : 'N/A',
      });
    }
    
    return newUser;
  };

  const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
    await simulateDelay(400);
    const existingUser = await getUserById(userId);
    if (!existingUser) throw new Error('User not found');
    
    const updatedUser: User = {
      ...existingUser,
      ...userData,
      id: userId, // Ensure ID doesn't change
    };
    
    await updateUserStorage(updatedUser);
    const usersData = await getAllUsers();
    setUsers(usersData);
  };

  const deleteUser = async (userId: string): Promise<void> => {
    await simulateDelay(400);
    // Prevent deleting own account
    if (userId === user?.id) {
      throw new Error('Cannot delete your own account');
    }
    
    await deleteUserStorage(userId);
    const usersData = await getAllUsers();
    setUsers(usersData);
  };

  const refreshUsers = async () => {
    const usersData = await getAllUsers();
    setUsers(usersData);
  };

  const createHospital = async (hospitalData: Omit<Hospital, 'id'>): Promise<Hospital> => {
    await simulateDelay(500);
    const newHospital: Hospital = {
      ...hospitalData,
      id: generateId('hospital'),
    };
    await addHospital(newHospital);
    const hospitalsData = await getAllHospitals();
    setHospitals(hospitalsData);
    return newHospital;
  };

  const updateHospital = async (hospitalId: string, hospitalData: Partial<Hospital>): Promise<void> => {
    await simulateDelay(400);
    const existingHospital = await getHospitalById(hospitalId);
    if (!existingHospital) throw new Error('Hospital not found');
    
    const updatedHospital: Hospital = {
      ...existingHospital,
      ...hospitalData,
      id: hospitalId, // Ensure ID doesn't change
    };
    
    await updateHospitalStorage(updatedHospital);
    const hospitalsData = await getAllHospitals();
    setHospitals(hospitalsData);
  };

  const deleteHospital = async (hospitalId: string): Promise<void> => {
    await simulateDelay(400);
    // Check if hospital has assigned cases
    const hospitalCases = cases.filter(c => c.assignedHospital === hospitalId);
    if (hospitalCases.length > 0) {
      throw new Error(`Cannot delete hospital with ${hospitalCases.length} assigned case(s)`);
    }
    
    // Check if hospital has users
    const hospitalUsers = users.filter(u => u.hospitalIds && u.hospitalIds.includes(hospitalId));
    if (hospitalUsers.length > 0) {
      throw new Error(`Cannot delete hospital with ${hospitalUsers.length} associated user(s)`);
    }
    
    await deleteHospitalStorage(hospitalId);
    const hospitalsData = await getAllHospitals();
    setHospitals(hospitalsData);
  };

  const refreshHospitals = async () => {
    const hospitalsData = await getAllHospitals();
    setHospitals(hospitalsData);
  };

  const addPayment = async (caseId: string, payment: Omit<PaymentRecord, 'id'>): Promise<void> => {
    await simulateDelay(400);
    const existingCase = await getCaseById(caseId);
    if (!existingCase) return;

    const newPayment: PaymentRecord = {
      ...payment,
      id: generateId('payment'),
    };

    const activityEntry: ActivityLog = {
      id: generateId('log'),
      caseId,
      userId: user?.id || '',
      userName: user?.name || '',
      userRole: user?.role || 'finance',
      action: 'Payment Added',
      details: `Added ${payment.type} payment: ${payment.amount} ${payment.currency}`,
      timestamp: new Date().toISOString(),
    };

    const updatedCase = {
      ...existingCase,
      payments: [...existingCase.payments, newPayment],
      activityLog: [...existingCase.activityLog, activityEntry],
      updatedAt: new Date().toISOString(),
    };

    await updateCase(updatedCase);
    await refreshCases();
  };

  const updatePayment = async (caseId: string, paymentId: string, paymentData: Partial<PaymentRecord>): Promise<void> => {
    await simulateDelay(400);
    const existingCase = await getCaseById(caseId);
    if (!existingCase) return;

    const updatedPayments = existingCase.payments.map(p => 
      p.id === paymentId ? { ...p, ...paymentData } : p
    );

    const activityEntry: ActivityLog = {
      id: generateId('log'),
      caseId,
      userId: user?.id || '',
      userName: user?.name || '',
      userRole: user?.role || 'finance',
      action: 'Payment Updated',
      details: `Updated payment ${paymentId}`,
      timestamp: new Date().toISOString(),
    };

    const updatedCase = {
      ...existingCase,
      payments: updatedPayments,
      activityLog: [...existingCase.activityLog, activityEntry],
      updatedAt: new Date().toISOString(),
    };

    await updateCase(updatedCase);
    await refreshCases();
  };

  const deletePayment = async (caseId: string, paymentId: string): Promise<void> => {
    await simulateDelay(400);
    const existingCase = await getCaseById(caseId);
    if (!existingCase) return;

    const payment = existingCase.payments.find(p => p.id === paymentId);

    const activityEntry: ActivityLog = {
      id: generateId('log'),
      caseId,
      userId: user?.id || '',
      userName: user?.name || '',
      userRole: user?.role || 'finance',
      action: 'Payment Deleted',
      details: `Deleted payment: ${payment?.type} - ${payment?.amount} ${payment?.currency}`,
      timestamp: new Date().toISOString(),
    };

    const updatedCase = {
      ...existingCase,
      payments: existingCase.payments.filter(p => p.id !== paymentId),
      activityLog: [...existingCase.activityLog, activityEntry],
      updatedAt: new Date().toISOString(),
    };

    await updateCase(updatedCase);
    await refreshCases();
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
      ? cases.filter(c => 
          c.assignedHospital && 
          (user.hospitalIds || []).includes(c.assignedHospital)
        )
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
        updateUser,
        deleteUser,
        refreshUsers,
        createHospital,
        updateHospital,
        deleteHospital,
        refreshHospitals,
        addPayment,
        updatePayment,
        deletePayment,
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
