import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Case, Hospital, University, User, Notification, CaseStatus, Document as CaseDocument, ActivityLog, Comment, PaymentRecord } from '@/types';
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
  getAllUniversities,
  getUniversityById,
  addUniversity,
  updateUniversity as updateUniversityStorage,
  deleteUniversity as deleteUniversityStorage,
  getAllUsers,
  getUserById,
  getUserByUsername,
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
  universities: University[];
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
  verifyDocument: (caseId: string, documentId: string, status: 'verified' | 'rejected', notes?: string) => Promise<void>;
  addComment: (caseId: string, message: string, isPreset?: boolean) => Promise<void>;
  assignHospital: (caseId: string, hospitalId: string) => Promise<void>;
  assignUniversity: (caseId: string, universityId: string) => Promise<void>;
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
  // University operations
  createUniversity: (universityData: Omit<University, 'id'>) => Promise<University>;
  updateUniversity: (universityId: string, universityData: Partial<University>) => Promise<void>;
  deleteUniversity: (universityId: string) => Promise<void>;
  refreshUniversities: () => Promise<void>;
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
  const [universities, setUniversities] = useState<University[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [casesData, hospitalsData, universitiesData, usersData] = await Promise.all([
        getAllCases().catch(err => { console.error('Error loading cases:', err); return []; }),
        getAllHospitals().catch(err => { console.error('Error loading hospitals:', err); return []; }),
        getAllUniversities().catch(err => { console.error('Error loading universities:', err); return []; }),
        getAllUsers().catch(err => { console.error('Error loading users:', err); return []; }),
      ]);
      
      setCases(casesData);
      setHospitals(hospitalsData);
      setUniversities(universitiesData);
      setUsers(usersData);
      
      if (user) {
        try {
          const notifs = await getNotificationsByUser(user.id);
          setNotifications(notifs.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ));
        } catch (error) {
          console.error('Error loading notifications:', error);
          setNotifications([]);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays to prevent infinite loading
      setCases([]);
      setHospitals([]);
      setUniversities([]);
      setUsers([]);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Always try to load data, even if user is null (for initial setup)
    // But set loading to false if no user after a short delay
    if (user) {
      loadData();
    } else {
      // If no user, still try to load basic data but don't wait forever
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      
      return () => clearTimeout(timeoutId);
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
    // Validate required fields
    if (!caseData.clientId || caseData.clientId.trim() === '') {
      throw new Error('Client ID is required to create a case');
    }
    if (!caseData.clientInfo || !caseData.clientInfo.condition || caseData.clientInfo.condition.trim() === '') {
      throw new Error('Medical condition or course/program is required');
    }
    if (!user?.id) {
      throw new Error('User must be logged in to create a case');
    }

    await simulateDelay(600);
    const newCase: Case = {
      id: generateId('case'),
      clientId: caseData.clientId,
      agentId: user.id,
      status: 'new',
      statusHistory: [{
        status: 'new',
        timestamp: new Date().toISOString(),
        by: user.id,
        byName: user.name || '',
        note: 'Case created',
      }],
      documents: [],
      clientInfo: caseData.clientInfo,
      attenderInfo: caseData.attenderInfo,
      assignedHospital: caseData.assignedHospital,
      assignedUniversity: caseData.assignedUniversity,
      payments: [],
      visa: { status: 'not_started' },
      comments: [],
      activityLog: [{
        id: generateId('log'),
        caseId: '',
        userId: user.id,
        userName: user.name || '',
        userRole: user.role || 'agent',
        action: 'Case Created',
        details: `New case created for ${caseData.clientInfo?.name || 'patient'}`,
        timestamp: new Date().toISOString(),
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priority: caseData.priority || 'medium',
    };

    newCase.activityLog[0].caseId = newCase.id;
    try {
      await addCase(newCase);
      await refreshCases();
    } catch (error) {
      console.error('Error saving case to database:', error);
      throw new Error(`Failed to save case: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      verificationStatus: 'pending', // New documents require verification
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

  const verifyDocument = async (caseId: string, documentId: string, status: 'verified' | 'rejected', notes?: string) => {
    await simulateDelay(300);
    const existingCase = await getCaseById(caseId);
    if (!existingCase) return;

    const updatedDocuments = existingCase.documents.map(doc => 
      doc.id === documentId 
        ? { 
            ...doc, 
            verificationStatus: status,
            verifiedBy: user?.id,
            verifiedAt: new Date().toISOString(),
            verificationNotes: notes
          }
        : doc
    );

    const doc = existingCase.documents.find(d => d.id === documentId);
    const activityEntry: ActivityLog = {
      id: generateId('log'),
      caseId,
      userId: user?.id || '',
      userName: user?.name || '',
      userRole: user?.role || 'admin',
      action: `Document ${status === 'verified' ? 'Verified' : 'Rejected'}`,
      details: `${status === 'verified' ? 'Verified' : 'Rejected'} ${doc?.name || 'document'}${notes ? `: ${notes}` : ''}`,
      timestamp: new Date().toISOString(),
    };

    const updatedCase = {
      ...existingCase,
      documents: updatedDocuments,
      activityLog: [...existingCase.activityLog, activityEntry],
      updatedAt: new Date().toISOString(),
    };

    await updateCase(updatedCase);
    await refreshCases();
  };

  // Generate chatbot auto-response based on case status and message
  const generateChatbotResponse = (caseStatus: CaseStatus, message: string, isUniversityCase: boolean = false): string => {
    const statusLower = caseStatus.toLowerCase();
    const messageLower = message.toLowerCase();
    const entityType = isUniversityCase ? 'university' : 'hospital';
    const programType = isUniversityCase ? 'program' : 'treatment';
    const admissionType = isUniversityCase ? 'admission date' : 'appointment';

    // Status-based responses
    if (statusLower.includes('new') || statusLower.includes('agent_review')) {
      if (messageLower.includes('update') || messageLower.includes('status')) {
        return "Your case is currently under review by our SudInd coordination team. We're processing your documents and will update you soon.";
      }
      if (messageLower.includes('appointment') || messageLower.includes('when') || messageLower.includes('admission')) {
        return isUniversityCase
          ? "Your admission schedule will be confirmed once your case is reviewed and a university is assigned. We'll notify you as soon as this is arranged."
          : "Your appointment schedule will be confirmed once your case is reviewed and a hospital is assigned. We'll notify you as soon as this is arranged.";
      }
      return "Thank you for your message. Your case is in the initial review stage. Our team is working on processing your documents.";
    }

    if (statusLower.includes('admin_review') || statusLower.includes('assigned')) {
      if (messageLower.includes('update') || messageLower.includes('status')) {
        return isUniversityCase
          ? "Your case is being reviewed by our admin team. Once approved, it will be forwarded to a university for evaluation."
          : "Your case is being reviewed by our admin team. Once approved, it will be forwarded to a hospital for evaluation.";
      }
      if (messageLower.includes('hospital') || messageLower.includes('university')) {
        return isUniversityCase
          ? "We're in the process of assigning your case to an appropriate university. You'll be notified once a university is assigned."
          : "We're in the process of assigning your case to an appropriate hospital. You'll be notified once a hospital is assigned.";
      }
      return "Your case is currently under administrative review. We'll keep you updated on the progress.";
    }

    if (statusLower.includes('hospital_review') || statusLower.includes('case_accepted')) {
      if (messageLower.includes('appointment') || messageLower.includes('when') || messageLower.includes('admission')) {
        return isUniversityCase
          ? "Your case has been assigned to a university and is under review. The university will provide program details and admission schedule once they accept your case."
          : "Your case has been assigned to a hospital and is under review. The hospital will provide treatment details and appointment schedule once they accept your case.";
      }
      if (messageLower.includes('treatment') || messageLower.includes('program')) {
        return isUniversityCase
          ? "The assigned university is reviewing your academic case. They will provide a program plan and schedule once the review is complete."
          : "The assigned hospital is reviewing your medical case. They will provide a treatment plan and schedule once the review is complete.";
      }
      return isUniversityCase
        ? "Your case is being reviewed by the assigned university. They will provide program details and next steps shortly."
        : "Your case is being reviewed by the assigned hospital. They will provide treatment details and next steps shortly.";
    }

    if (statusLower.includes('treatment_plan')) {
      if (messageLower.includes('appointment') || messageLower.includes('when') || messageLower.includes('admission')) {
        return isUniversityCase
          ? "A program plan has been uploaded for your case. The university will coordinate with you regarding admission dates and travel arrangements."
          : "A treatment plan has been uploaded for your case. The hospital will coordinate with you regarding appointment dates and travel arrangements.";
      }
      if (messageLower.includes('travel') || messageLower.includes('visa')) {
        return isUniversityCase
          ? "Your program plan is ready. The next step is visa processing. Our team will guide you through the visa application process."
          : "Your treatment plan is ready. The next step is visa processing. Our team will guide you through the visa application process.";
      }
      return isUniversityCase
        ? "Great news! A program plan has been prepared for your case. Our team will coordinate the next steps including visa processing and travel arrangements."
        : "Great news! A treatment plan has been prepared for your case. Our team will coordinate the next steps including visa processing and travel arrangements.";
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
      if (messageLower.includes('appointment') || messageLower.includes('treatment') || messageLower.includes('program')) {
        return isUniversityCase
          ? "Your program is currently in progress at the university. The academic team is providing the best support. We'll keep you updated on your progress."
          : "Your treatment is currently in progress at the hospital. The medical team is providing the best care. We'll keep you updated on your progress.";
      }
      return isUniversityCase
        ? "Your program is ongoing. The university academic team is providing excellent support. If you have any concerns, please let us know."
        : "Your treatment is ongoing. The hospital medical team is taking excellent care of you. If you have any concerns, please let us know.";
    }

    if (statusLower.includes('discharge') || statusLower.includes('final_report')) {
      if (messageLower.includes('next') || messageLower.includes('steps')) {
        return isUniversityCase
          ? "Your program is nearing completion. The university is preparing your completion summary and final reports. We'll share these with you soon."
          : "Your treatment is nearing completion. The hospital is preparing your discharge summary and final reports. We'll share these with you soon.";
      }
      return isUniversityCase
        ? "Your program is complete. The university is finalizing your completion documents and academic reports. We'll share these with you shortly."
        : "Your treatment is complete. The hospital is finalizing your discharge documents and medical reports. We'll share these with you shortly.";
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
      const isUniversityCase = !!existingCase.assignedUniversity;
      const autoResponse = generateChatbotResponse(existingCase.status, message, isUniversityCase);
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

  const assignUniversity = async (caseId: string, universityId: string) => {
    await simulateDelay(400);
    const existingCase = await getCaseById(caseId);
    if (!existingCase) return;

    const university = universities.find(u => u.id === universityId);

    const activityEntry: ActivityLog = {
      id: generateId('log'),
      caseId,
      userId: user?.id || '',
      userName: user?.name || '',
      userRole: user?.role || 'admin',
      action: 'University Assigned',
      details: `Case assigned to ${university?.name || 'university'}`,
      timestamp: new Date().toISOString(),
    };

    const statusEntry = {
      status: 'assigned_to_hospital' as CaseStatus, // Using same status for now
      timestamp: new Date().toISOString(),
      by: user?.id || '',
      byName: user?.name || '',
      note: `Assigned to ${university?.name}`,
    };

    const updatedCase = {
      ...existingCase,
      assignedUniversity: universityId,
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
    const normalizedUsername = userData.username.toLowerCase().trim();
    
    // Check if username already exists
    const existingUser = await getUserByUsername(normalizedUsername);
    if (existingUser) {
      throw new Error(`Username "${normalizedUsername}" already exists. Please use a different username.`);
    }
    
    const newUser: User = {
      ...userData,
      username: normalizedUsername,
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
    
    try {
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
      } else {
        throw new Error('User was not created successfully. Please try again.');
      }
      
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        throw error;
      }
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  const createUniversity = async (universityData: Omit<University, 'id'>): Promise<University> => {
    await simulateDelay(500);
    const newUniversity: University = {
      ...universityData,
      id: generateId('university'),
    };
    await addUniversity(newUniversity);
    const universitiesData = await getAllUniversities();
    setUniversities(universitiesData);
    return newUniversity;
  };

  const updateUniversity = async (universityId: string, universityData: Partial<University>): Promise<void> => {
    await simulateDelay(400);
    const existingUniversity = await getUniversityById(universityId);
    if (!existingUniversity) throw new Error('University not found');
    
    const updatedUniversity: University = {
      ...existingUniversity,
      ...universityData,
      id: universityId, // Ensure ID doesn't change
    };
    
    await updateUniversityStorage(updatedUniversity);
    const universitiesData = await getAllUniversities();
    setUniversities(universitiesData);
  };

  const deleteUniversity = async (universityId: string): Promise<void> => {
    await simulateDelay(400);
    // Check if university has assigned cases
    const universityCases = cases.filter(c => c.assignedUniversity === universityId);
    if (universityCases.length > 0) {
      throw new Error(`Cannot delete university with ${universityCases.length} assigned case(s)`);
    }
    
    // Check if university has users
    const universityUsers = users.filter(u => u.universityIds && u.universityIds.includes(universityId));
    if (universityUsers.length > 0) {
      throw new Error(`Cannot delete university with ${universityUsers.length} associated user(s)`);
    }
    
    await deleteUniversityStorage(universityId);
    const universitiesData = await getAllUniversities();
    setUniversities(universitiesData);
  };

  const refreshUniversities = async () => {
    const universitiesData = await getAllUniversities();
    setUniversities(universitiesData);
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
      : user?.role === 'university'
      ? cases.filter(c => 
          c.assignedUniversity && 
          (user.universityIds || []).includes(c.assignedUniversity)
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
        universities,
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
        verifyDocument,
        addComment,
        assignHospital,
        assignUniversity,
        createUser,
        updateUser,
        deleteUser,
        refreshUsers,
        createHospital,
        updateHospital,
        deleteHospital,
        refreshHospitals,
        createUniversity,
        updateUniversity,
        deleteUniversity,
        refreshUniversities,
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
