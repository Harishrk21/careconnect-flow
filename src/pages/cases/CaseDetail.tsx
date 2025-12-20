import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  User,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Upload,
  Send,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  Plane,
  CreditCard,
  ChevronRight,
  Users,
  Activity,
  Loader2,
  Eye,
  Download,
  Play,
  Pause,
  X,
  Check,
  FileCheck,
  FileX,
  ArrowRight,
  Zap,
  Shield,
  Briefcase,
  Receipt,
  Ticket,
  UserCheck,
  ClipboardCheck,
  Pill,
  LogOut,
  Ban,
  RefreshCw,
  Info,
  Sparkles,
} from 'lucide-react';
import { 
  STATUS_LABELS, 
  STATUS_COLORS, 
  STATUS_FLOW,
  DOCUMENT_TYPE_LABELS,
  REQUIRED_DOCUMENTS,
  CLIENT_PRESET_MESSAGES,
  type Case, 
  type CaseStatus,
  type DocumentType
} from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import ActivityTimeline from '@/components/cases/ActivityTimeline';
import { getAvailableDocumentTypes, getRequiredDocuments } from '@/lib/documentPermissions';

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getCase, hospitals, updateCaseStatus, assignHospital, addComment, addDocument, removeDocument, updateCaseData, isLoading } = useData();
  
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [statusNote, setStatusNote] = useState('');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<CaseStatus | null>(null);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | ''>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTreatmentPlanDialogOpen, setIsTreatmentPlanDialogOpen] = useState(false);
  const [treatmentPlanData, setTreatmentPlanData] = useState({
    diagnosis: '',
    proposedTreatment: '',
    estimatedDuration: '',
    estimatedCost: '',
    currency: 'USD',
    doctorName: '',
    department: '',
    notes: '',
  });
  const [isSavingTreatmentPlan, setIsSavingTreatmentPlan] = useState(false);
  const [isVisaProcessingDialogOpen, setIsVisaProcessingDialogOpen] = useState(false);
  const [visaData, setVisaData] = useState({
    applicationDate: '',
    status: 'not_started' as 'not_started' | 'processing' | 'approved' | 'rejected' | 'reapply',
    visaNumber: '',
    issueDate: '',
    expiryDate: '',
    notes: '',
  });
  const [isSavingVisa, setIsSavingVisa] = useState(false);
  const [isFRRODialogOpen, setIsFRRODialogOpen] = useState(false);
  const [frroData, setFrroData] = useState({
    registrationNumber: '',
    registrationDate: '',
    expiryDate: '',
    registrationOffice: '',
    status: 'pending' as 'pending' | 'completed' | 'rejected',
    notes: '',
  });
  const [isSavingFRRO, setIsSavingFRRO] = useState(false);
  const [isDischargeDialogOpen, setIsDischargeDialogOpen] = useState(false);
  const [dischargeData, setDischargeData] = useState({
    dischargeDate: '',
    dischargeSummary: '',
    finalDiagnosis: '',
    treatmentProvided: '',
    medications: '',
    followUpInstructions: '',
    notes: '',
  });
  const [isSavingDischarge, setIsSavingDischarge] = useState(false);
  const [isTicketBookingDialogOpen, setIsTicketBookingDialogOpen] = useState(false);
  const [ticketData, setTicketData] = useState({
    flightNumber: '',
    airline: '',
    departureDate: '',
    departureTime: '',
    departureAirport: '',
    arrivalDate: '',
    arrivalTime: '',
    arrivalAirport: '',
    returnFlightNumber: '',
    returnAirline: '',
    returnDate: '',
    returnTime: '',
    ticketReference: '',
    bookingStatus: 'confirmed' as 'confirmed' | 'pending' | 'cancelled',
    notes: '',
  });
  const [isSavingTicket, setIsSavingTicket] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadCase = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        console.log('Loading case with ID:', id);
      const data = await getCase(id);
        console.log('Case data loaded:', data ? 'Found' : 'Not found', data);
        if (data) {
          setCaseData(data);
        } else {
          console.warn('Case not found for ID:', id);
          setCaseData(null);
        }
      } catch (error) {
        console.error('Error loading case:', error);
        setCaseData(null);
      } finally {
      setLoading(false);
      }
    };
    loadCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Initialize treatment plan form when dialog opens
  useEffect(() => {
    if (!isTreatmentPlanDialogOpen) return;
    
    if (caseData?.treatmentPlan) {
      setTreatmentPlanData({
        diagnosis: caseData.treatmentPlan.diagnosis || '',
        proposedTreatment: caseData.treatmentPlan.proposedTreatment || '',
        estimatedDuration: caseData.treatmentPlan.estimatedDuration || '',
        estimatedCost: caseData.treatmentPlan.estimatedCost.toString() || '',
        currency: caseData.treatmentPlan.currency || 'USD',
        doctorName: caseData.treatmentPlan.doctorName || '',
        department: caseData.treatmentPlan.department || '',
        notes: caseData.treatmentPlan.notes || '',
      });
    } else {
      // Reset form for new treatment plan
      setTreatmentPlanData({
        diagnosis: '',
        proposedTreatment: '',
        estimatedDuration: '',
        estimatedCost: '',
        currency: 'USD',
        doctorName: '',
        department: '',
        notes: '',
      });
    }
  }, [isTreatmentPlanDialogOpen, caseData?.treatmentPlan]);

  // Initialize visa form when dialog opens
  useEffect(() => {
    if (!isVisaProcessingDialogOpen) return;
    
    if (caseData?.visa) {
      setVisaData({
        applicationDate: caseData.visa.applicationDate || '',
        status: caseData.visa.status || 'not_started',
        visaNumber: caseData.visa.visaNumber || '',
        issueDate: caseData.visa.issueDate || '',
        expiryDate: caseData.visa.expiryDate || '',
        notes: caseData.visa.notes || '',
      });
    } else {
      // Reset form for new visa
      setVisaData({
        applicationDate: '',
        status: 'not_started',
        visaNumber: '',
        issueDate: '',
        expiryDate: '',
        notes: '',
      });
    }
  }, [isVisaProcessingDialogOpen, caseData?.visa]);

  // Initialize FRRO form when dialog opens
  useEffect(() => {
    if (isFRRODialogOpen) {
      // Reset form for FRRO registration
      setFrroData({
        registrationNumber: '',
        registrationDate: '',
        expiryDate: '',
        registrationOffice: '',
        status: 'pending',
        notes: '',
      });
    }
  }, [isFRRODialogOpen]);

  // Initialize Discharge form when dialog opens
  useEffect(() => {
    if (isDischargeDialogOpen) {
      // Reset form for discharge
      setDischargeData({
        dischargeDate: new Date().toISOString().split('T')[0],
        dischargeSummary: '',
        finalDiagnosis: '',
        treatmentProvided: '',
        medications: '',
        followUpInstructions: '',
        notes: '',
      });
    }
  }, [isDischargeDialogOpen]);

  // Initialize Ticket Booking form when dialog opens
  useEffect(() => {
    if (isTicketBookingDialogOpen) {
      // Reset form for ticket booking
      setTicketData({
        flightNumber: '',
        airline: '',
        departureDate: '',
        departureTime: '',
        departureAirport: '',
        arrivalDate: '',
        arrivalTime: '',
        arrivalAirport: '',
        returnFlightNumber: '',
        returnAirline: '',
        returnDate: '',
        returnTime: '',
        ticketReference: '',
        bookingStatus: 'confirmed',
        notes: '',
      });
    }
  }, [isTicketBookingDialogOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [caseData?.comments]);

  const refreshCase = async () => {
    if (!id) return;
    const data = await getCase(id);
    setCaseData(data || null);
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-muted-foreground">Loading case details...</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-foreground">Case not found</h2>
        <p className="text-muted-foreground mt-2">The requested case could not be found.</p>
        <Button asChild className="mt-4">
          <Link to="/cases">Back to Cases</Link>
        </Button>
      </div>
    );
  }

  const hospital = hospitals.find(h => h.id === caseData.assignedHospital);
  
  // Helper to check if case is assigned to current hospital user (supports multiple hospitals)
  const isAssignedToCurrentHospital = user?.role === 'hospital' && 
    caseData.assignedHospital && 
    (user.hospitalIds || []).includes(caseData.assignedHospital);
  
  // Helper to check if case belongs to current agent
  const isAssignedToCurrentAgent = user?.role === 'agent' && 
    caseData.agentId === user.id;
  
  // Calculate progress - handle statuses not in main flow (rejections)
  const getStatusIndex = (status: CaseStatus): number => {
    const index = STATUS_FLOW.indexOf(status);
    if (index >= 0) return index;
    
    // Map rejection statuses to their position in flow
    if (status === 'case_rejected') return STATUS_FLOW.indexOf('hospital_review'); // Can happen after hospital review
    if (status === 'visa_rejected') return STATUS_FLOW.indexOf('visa_processing_payments'); // Can happen after payment
    if (status === 'visa_terminate') return STATUS_FLOW.indexOf('visa_processing_payments'); // Can happen after payment
    if (status === 'visa_reapply') return STATUS_FLOW.indexOf('visa_processing_documents'); // Can happen after documents
    
    return 0; // Default to start
  };
  
  const currentStatusIndex = getStatusIndex(caseData.status);
  const progressPercentage = ((currentStatusIndex + 1) / STATUS_FLOW.length) * 100;

  // Get available document types (not already uploaded)
  const uploadedDocTypes = caseData.documents.map(d => d.type);
  // Get available document types based on role and status
  const availableDocTypes = user && caseData
    ? getAvailableDocumentTypes(user.role, caseData.status, uploadedDocTypes)
    : [];

  // Check required documents based on role and status
  const requiredDocs = user && caseData
    ? getRequiredDocuments(user.role, caseData.status)
    : [];
  const missingRequired = requiredDocs.filter(
    type => !uploadedDocTypes.includes(type)
  );

  // Complete status workflow rules for all 22 stages
  const getAvailableStatuses = (): CaseStatus[] => {
    if (!user || !caseData) return [];
    
    const currentStatus = caseData.status;
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    
    switch (user.role) {
      case 'admin':
        // Admin can manage all stages
        switch (currentStatus) {
          case 'admin_review':
            return ['assigned_to_hospital'];
          
          case 'case_rejected':
            // Can reassign to hospital after rejection
            return ['assigned_to_hospital', 'admin_review'];
          
          case 'assigned_to_hospital':
            // Can change back to admin review if needed
            return ['admin_review', 'hospital_review'];
          
          case 'pass_travel_documentation':
            return ['visa_processing_documents'];
          
          case 'visa_processing_documents':
            // Admin can move to payments or wait for finance
            return ['visa_processing_payments'];
          
          case 'visa_processing_payments':
            return ['visa_approved', 'visa_rejected'];
          
          case 'visa_rejected':
            return ['visa_processing_documents', 'visa_terminate', 'visa_reapply'];
          
          case 'visa_reapply':
            return ['visa_processing_documents'];
          
          case 'visa_approved':
            // Can wait for agent to upload visa copy
            return [];
          
          case 'credit_payment_upload':
            return ['invoice_uploaded'];
          
          case 'invoice_uploaded':
            return ['ticket_booking'];
          
          case 'ticket_booking':
            return ['patient_manifest'];
          
          case 'patient_manifest':
            // Can wait for hospital to upload admit format
            return [];
          
          case 'admit_format_uploaded':
            return ['frro_registration'];
          
          case 'frro_registration':
            // Can wait for hospital to start treatment
            return [];
          
          default:
            return [];
        }
        
      case 'agent':
        // Agent manages early stages and visa-related stages
        if (!isAssignedToCurrentAgent) return [];
        
        switch (currentStatus) {
          case 'new':
            return ['case_agent_review'];
          
          case 'case_agent_review':
            // Can only submit if all required documents uploaded
            if (missingRequired.length === 0) {
              return ['admin_review'];
            }
            return [];
          
          case 'admin_review':
          case 'assigned_to_hospital':
          case 'hospital_review':
          case 'case_accepted':
          case 'case_rejected':
          case 'treatment_plan_uploaded':
          case 'pass_travel_documentation':
          case 'visa_processing_documents':
          case 'visa_processing_payments':
            // Waiting for other roles
            return [];
          
          case 'visa_approved':
            return ['visa_copy_uploaded'];
          
          case 'visa_copy_uploaded':
            return ['credit_payment_upload'];
          
          case 'credit_payment_upload':
            // Waiting for admin/finance
            return [];
          
          case 'invoice_uploaded':
          case 'ticket_booking':
          case 'patient_manifest':
          case 'admit_format_uploaded':
          case 'frro_registration':
          case 'treatment_in_progress':
          case 'final_report_medicine':
          case 'discharge_process':
          case 'case_closed':
            // No actions for agent in these stages
            return [];
          
          default:
            return [];
        }
        
      case 'hospital':
        // Hospital manages assigned cases only
        if (!isAssignedToCurrentHospital) return [];
        
        switch (currentStatus) {
          case 'assigned_to_hospital':
            return ['hospital_review', 'case_accepted', 'case_rejected'];
          
          case 'hospital_review':
            return ['case_accepted', 'case_rejected'];
          
          case 'case_rejected':
            // Hospital rejected, waiting for admin reassignment
            return [];
          
          case 'case_accepted':
            return ['treatment_plan_uploaded'];
          
          case 'treatment_plan_uploaded':
            return ['pass_travel_documentation'];
          
          case 'pass_travel_documentation':
            // Waiting for admin to process visa
            return [];
          
          case 'visa_processing_documents':
          case 'visa_processing_payments':
          case 'visa_approved':
          case 'visa_rejected':
          case 'visa_reapply':
          case 'visa_terminate':
          case 'visa_copy_uploaded':
          case 'credit_payment_upload':
          case 'invoice_uploaded':
          case 'ticket_booking':
            // Waiting for other roles
            return [];
          
          case 'patient_manifest':
            return ['admit_format_uploaded'];
          
          case 'admit_format_uploaded':
            // Waiting for admin to process FRRO
            return [];
          
          case 'frro_registration':
            return ['treatment_in_progress'];
          
          case 'treatment_in_progress':
            return ['final_report_medicine'];
          
          case 'final_report_medicine':
            return ['discharge_process'];
          
          case 'discharge_process':
            return ['case_closed'];
          
          case 'case_closed':
            // Case completed
            return [];
          
          default:
            return [];
        }
        
      case 'finance':
        // Finance manages payment-related stages
        switch (currentStatus) {
          case 'visa_processing_documents':
            return ['visa_processing_payments'];
          
          case 'visa_processing_payments':
            // Finance processes payment, admin decides visa status
            return [];
          
          case 'credit_payment_upload':
            // Can verify and approve credit payment
            return [];
          
          default:
            return [];
        }
        
      case 'client':
        // Clients have view-only access, no status changes
        return [];
        
      default:
        return [];
    }
  };

  const availableStatuses = getAvailableStatuses();

  // Action icons mapping for professional UI
  const getActionIcon = (status: CaseStatus) => {
    const iconMap: Record<CaseStatus, React.ReactNode> = {
      new: <FileText className="w-4 h-4" />,
      case_agent_review: <FileCheck className="w-4 h-4" />,
      admin_review: <Shield className="w-4 h-4" />,
      assigned_to_hospital: <Building2 className="w-4 h-4" />,
      hospital_review: <Eye className="w-4 h-4" />,
      case_accepted: <CheckCircle2 className="w-4 h-4" />,
      case_rejected: <X className="w-4 h-4" />,
      treatment_plan_uploaded: <Stethoscope className="w-4 h-4" />,
      pass_travel_documentation: <FileCheck className="w-4 h-4" />,
      visa_processing_documents: <FileText className="w-4 h-4" />,
      visa_processing_payments: <CreditCard className="w-4 h-4" />,
      visa_approved: <CheckCircle2 className="w-4 h-4" />,
      visa_rejected: <X className="w-4 h-4" />,
      visa_reapply: <RefreshCw className="w-4 h-4" />,
      visa_terminate: <Ban className="w-4 h-4" />,
      visa_copy_uploaded: <Upload className="w-4 h-4" />,
      credit_payment_upload: <Receipt className="w-4 h-4" />,
      invoice_uploaded: <FileText className="w-4 h-4" />,
      ticket_booking: <Ticket className="w-4 h-4" />,
      patient_manifest: <Users className="w-4 h-4" />,
      admit_format_uploaded: <ClipboardCheck className="w-4 h-4" />,
      frro_registration: <Shield className="w-4 h-4" />,
      treatment_in_progress: <Activity className="w-4 h-4" />,
      final_report_medicine: <Pill className="w-4 h-4" />,
      discharge_process: <LogOut className="w-4 h-4" />,
      case_closed: <CheckCircle2 className="w-4 h-4" />,
    };
    return iconMap[status] || <ArrowRight className="w-4 h-4" />;
  };

  // Action descriptions for better UX
  const getActionDescription = (status: CaseStatus): string => {
    const descriptions: Record<CaseStatus, string> = {
      new: 'Start reviewing and uploading required documents',
      case_agent_review: 'Review case details and ensure all documents are uploaded',
      admin_review: 'Admin will validate the case and assign to hospital agent',
      assigned_to_hospital: 'Case has been assigned to a hospital agent for review',
      hospital_review: 'Hospital agent is reviewing the case',
      case_accepted: 'Hospital agent has accepted the case',
      case_rejected: 'Case has been rejected and returned for review',
      treatment_plan_uploaded: 'Treatment plan has been uploaded by hospital',
      pass_travel_documentation: 'Travel documentation has been approved',
      visa_processing_documents: 'Visa documents are being processed',
      visa_processing_payments: 'Visa payment processing is in progress',
      visa_approved: 'Visa has been approved',
      visa_rejected: 'Visa application has been rejected',
      visa_reapply: 'Visa application will be resubmitted',
      visa_terminate: 'Case has been terminated',
      visa_copy_uploaded: 'Visa copy has been uploaded to the system',
      credit_payment_upload: 'Credit payment documents are being processed',
      invoice_uploaded: 'Hospital invoice has been uploaded',
      ticket_booking: 'Flight tickets are being booked',
      patient_manifest: 'Patient arrival details are being prepared',
      admit_format_uploaded: 'Hospital admission format has been uploaded',
      frro_registration: 'FRRO registration is in progress',
      treatment_in_progress: 'Patient is currently undergoing treatment',
      final_report_medicine: 'Final medical report and medicines are ready',
      discharge_process: 'Patient discharge process is being completed',
      case_closed: 'Case has been successfully closed',
    };
    return descriptions[status] || 'Proceed to next stage';
  };

  // Action categories for better organization
  const getActionCategory = (status: CaseStatus): { name: string; color: string; icon: React.ReactNode } => {
    if (status.includes('review') || status === 'new') {
      return { name: 'Review', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: <Eye className="w-3 h-3" /> };
    }
    if (status.includes('rejected') || status.includes('terminate')) {
      return { name: 'Rejection', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: <X className="w-3 h-3" /> };
    }
    if (status.includes('accepted') || status.includes('approved') || status === 'case_closed') {
      return { name: 'Approval', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: <CheckCircle2 className="w-3 h-3" /> };
    }
    if (status.includes('visa') || status.includes('payment') || status.includes('ticket')) {
      return { name: 'Processing', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: <Zap className="w-3 h-3" /> };
    }
    if (status.includes('treatment') || status.includes('discharge') || status.includes('medicine')) {
      return { name: 'Medical', color: 'bg-teal-500/10 text-teal-600 border-teal-500/20', icon: <Stethoscope className="w-3 h-3" /> };
    }
    return { name: 'Action', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: <ArrowRight className="w-3 h-3" /> };
  };

  // Check if action requires special conditions
  const getActionRequirements = (status: CaseStatus): string[] => {
    const requirements: string[] = [];
    
    if (status === 'case_agent_review' && missingRequired.length > 0) {
      requirements.push(`${missingRequired.length} required document(s) missing`);
    }
    
    if (status === 'treatment_plan_uploaded' && !caseData?.treatmentPlan) {
      requirements.push('Treatment plan must be uploaded first');
    }
    
    if (status === 'assigned_to_hospital' && !caseData?.assignedHospital) {
      requirements.push('Hospital agent must be assigned first');
    }
    
    if (status === 'visa_copy_uploaded' && caseData?.status !== 'visa_approved') {
      requirements.push('Visa must be approved first');
    }
    
    return requirements;
  };

  const handleStatusChange = async (newStatus: CaseStatus) => {
    // Check requirements before opening dialog
    const requirements = getActionRequirements(newStatus);
    if (requirements.length > 0) {
      toast({
        title: 'Action Requirements Not Met',
        description: requirements.join('. '),
        variant: 'destructive',
      });
      return;
    }
    
    setPendingStatus(newStatus);
    setIsStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus || !id || !caseData) return;
    
    // Validation for specific status transitions
    if (pendingStatus === 'case_agent_review' && missingRequired.length > 0) {
      toast({
        title: 'Cannot Submit',
        description: 'Please upload all required documents before submitting for review',
        variant: 'destructive',
      });
      return;
    }
    
    if (pendingStatus === 'treatment_plan_uploaded' && !caseData.treatmentPlan) {
      toast({
        title: 'Treatment Plan Required',
        description: 'Please upload a treatment plan before changing status',
        variant: 'destructive',
      });
      return;
    }
    
    if (pendingStatus === 'assigned_to_hospital' && !caseData.assignedHospital) {
      toast({
        title: 'Hospital Required',
        description: 'Please assign a hospital before changing status',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSavingStatus(true);
    try {
      // Handle special status transitions that require additional data
      const updates: Partial<Case> = {};
      
      // Update visa status when visa is approved/rejected
      if (pendingStatus === 'visa_approved') {
        updates.visa = {
          ...caseData.visa,
          status: 'approved',
          applicationDate: caseData.visa.applicationDate || new Date().toISOString().split('T')[0],
          visaNumber: caseData.visa.visaNumber || `V${Date.now()}`,
          issueDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        };
      } else if (pendingStatus === 'visa_rejected') {
        updates.visa = {
          ...caseData.visa,
          status: 'rejected',
        };
      } else if (pendingStatus === 'visa_reapply') {
        updates.visa = {
          ...caseData.visa,
          status: 'reapply',
        };
      } else if (pendingStatus === 'visa_terminate') {
        updates.visa = {
          ...caseData.visa,
          status: 'rejected',
        };
      } else if (pendingStatus === 'visa_processing_documents') {
        updates.visa = {
          ...caseData.visa,
          status: 'processing',
          applicationDate: new Date().toISOString().split('T')[0],
        };
      } else if (pendingStatus === 'visa_processing_payments') {
        updates.visa = {
          ...caseData.visa,
          status: 'processing',
        };
      }
      
      // Update status with real-time feedback
      await updateCaseStatus(id, pendingStatus, statusNote);
      
      // Apply additional updates if any
      if (Object.keys(updates).length > 0) {
        await updateCaseData(id, updates);
      }
      
      await refreshCase();
      
      toast({
        title: 'Status Updated Successfully',
        description: `Case status changed from "${STATUS_LABELS[caseData.status]}" to "${STATUS_LABELS[pendingStatus]}"`,
      });
      
      // Close dialog after success
      setIsStatusDialogOpen(false);
      setPendingStatus(null);
      setStatusNote('');
    } catch (error) {
      toast({
        title: 'Error Updating Status',
        description: error instanceof Error ? error.message : 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleAssignHospital = async () => {
    if (!selectedHospital || !id) return;
    
    try {
      await assignHospital(id, selectedHospital);
      await refreshCase();
      toast({
        title: 'Hospital Assigned',
        description: 'Case has been assigned to the selected hospital',
      });
      setSelectedHospital('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign hospital',
        variant: 'destructive',
      });
    }
  };

  const handleAddComment = async (message: string, isPreset?: boolean) => {
    if (!message.trim() || !id) return;
    
    try {
      await addComment(id, message.trim(), isPreset);
      await refreshCase();
      setNewComment('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    }
  };

  // Simulate OCR extraction based on document type
  const simulateOCRExtraction = (file: File, docType: DocumentType): string => {
    // Simulate processing delay
    const extractedData: Record<string, string> = {};
    
    if (docType.includes('passport')) {
      extractedData.passportNumber = `SD${Math.floor(Math.random() * 10000000)}`;
      extractedData.name = caseData?.clientInfo.name || 'Extracted Name';
      extractedData.dob = caseData?.clientInfo.dob || '1985-05-15';
      extractedData.nationality = 'Sudanese';
      extractedData.issueDate = new Date().toISOString().split('T')[0];
      extractedData.expiryDate = new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return `PASSPORT EXTRACTION RESULTS:\n\nPassport Number: ${extractedData.passportNumber}\nName: ${extractedData.name}\nDate of Birth: ${extractedData.dob}\nNationality: ${extractedData.nationality}\nIssue Date: ${extractedData.issueDate}\nExpiry Date: ${extractedData.expiryDate}\n\nDocument Type: ${DOCUMENT_TYPE_LABELS[docType]}\nFile Name: ${file.name}\nFile Size: ${(file.size / 1024).toFixed(2)} KB\nExtracted At: ${new Date().toISOString()}`;
    } else if (docType.includes('medical') || docType.includes('lab') || docType.includes('radiology')) {
      extractedData.patientName = caseData?.clientInfo.name || 'Patient Name';
      extractedData.condition = caseData?.clientInfo.condition || 'Medical Condition';
      extractedData.dob = caseData?.clientInfo.dob || '1985-05-15';
      extractedData.doctorName = 'Specialist';
      extractedData.date = new Date().toISOString().split('T')[0];
      extractedData.findings = 'Medical findings and test results extracted from document.';
      return `MEDICAL DOCUMENT EXTRACTION RESULTS:\n\nPatient Name: ${extractedData.patientName}\nDate of Birth: ${extractedData.dob}\nCondition: ${extractedData.condition}\nMedical Specialist: ${extractedData.doctorName}\nDate: ${extractedData.date}\n\nFindings:\n${extractedData.findings}\n\nDocument Type: ${DOCUMENT_TYPE_LABELS[docType]}\nFile Name: ${file.name}\nFile Size: ${(file.size / 1024).toFixed(2)} KB\nExtracted At: ${new Date().toISOString()}`;
    } else {
      return `DOCUMENT EXTRACTION RESULTS:\n\nDocument Type: ${DOCUMENT_TYPE_LABELS[docType]}\nFile Name: ${file.name}\nFile Size: ${(file.size / 1024).toFixed(2)} KB\nMIME Type: ${file.type}\nExtracted At: ${new Date().toISOString()}\n\nContent extracted successfully.`;
    }
  };

  // Auto-fill client information from extracted text
  const autoFillClientInfo = (extractedText: string, docType: DocumentType) => {
    if (!caseData || !id) return;
    
    // Only auto-fill if case is in early stages and client info is incomplete
    if (caseData.status !== 'new' && caseData.status !== 'case_agent_review') return;
    if (user?.role !== 'agent') return;

    const updates: Partial<Case['clientInfo']> = {};
    let hasUpdates = false;

    // Extract passport number
    const passportMatch = extractedText.match(/Passport Number:\s*([A-Z0-9]+)/i);
    if (passportMatch && !caseData.clientInfo.passport) {
      updates.passport = passportMatch[1];
      hasUpdates = true;
    }

    // Extract name
    const nameMatch = extractedText.match(/Name:\s*([^\n]+)/i);
    if (nameMatch && !caseData.clientInfo.name) {
      updates.name = nameMatch[1].trim();
      hasUpdates = true;
    }

    // Extract DOB
    const dobMatch = extractedText.match(/Date of Birth:\s*([0-9-]+)/i);
    if (dobMatch && !caseData.clientInfo.dob) {
      updates.dob = dobMatch[1];
      hasUpdates = true;
    }

    // Extract nationality
    const nationalityMatch = extractedText.match(/Nationality:\s*([^\n]+)/i);
    if (nationalityMatch && !caseData.clientInfo.nationality) {
      updates.nationality = nationalityMatch[1].trim();
      hasUpdates = true;
    }

    // Extract condition from medical documents
    if (docType.includes('medical') || docType.includes('lab')) {
      const conditionMatch = extractedText.match(/Condition:\s*([^\n]+)/i);
      if (conditionMatch && !caseData.clientInfo.condition) {
        updates.condition = conditionMatch[1].trim();
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      // Update case with auto-filled info
      updateCaseData(id, {
        clientInfo: { ...caseData.clientInfo, ...updates }
      }).then(() => {
        toast({
          title: 'Auto-filled',
          description: 'Client information has been auto-filled from document',
        });
        refreshCase();
      });
    }
  };

  // Handle file selection
  const handleFileSelect = () => {
    if (!selectedDocType) {
      toast({
        title: 'Select Document Type',
        description: 'Please select a document type first',
        variant: 'destructive',
      });
      return;
    }
    fileInputRef.current?.click();
  };

  // Handle actual file upload
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDocType || !id) return;

    // File validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 10MB',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload PDF, Word, or Image files only',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    setIsUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;
        
        // Simulate OCR processing (2-3 second delay)
        await new Promise(resolve => setTimeout(resolve, 2000));
        const extractedText = simulateOCRExtraction(file, selectedDocType);

        // Create document object
        const document = {
          type: selectedDocType,
          name: file.name,
          uploadedBy: user?.id || '',
          uploadedAt: new Date().toISOString(),
          size: file.size,
          mimeType: file.type,
          fileData: fileData, // Store base64 data
          extractedText: extractedText,
          textFileId: `txt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Companion text file ID
        };

        // Upload document
        await addDocument(id, document);
        
        // Auto-fill client information
        autoFillClientInfo(extractedText, selectedDocType);
        
        await refreshCase();
        
        toast({
          title: 'Document Uploaded',
          description: `${DOCUMENT_TYPE_LABELS[selectedDocType]} has been uploaded and processed`,
        });
        
        setSelectedDocType('');
        setIsUploading(false);
        event.target.value = ''; // Reset input
      };

      reader.onerror = () => {
        toast({
          title: 'Error',
          description: 'Failed to read file',
          variant: 'destructive',
        });
        setIsUploading(false);
        event.target.value = '';
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDocumentUpload = () => {
    handleFileSelect();
  };

  const handleRemoveDocument = async (docId: string) => {
    if (!id) return;
    
    try {
      await removeDocument(id, docId);
      await refreshCase();
      toast({
        title: 'Document Removed',
        description: 'Document has been removed from the case',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove document',
        variant: 'destructive',
      });
    }
  };

  const handleSaveTreatmentPlan = async () => {
    if (!id || !caseData) return;

    // Validation
    if (!treatmentPlanData.diagnosis.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Diagnosis is required',
        variant: 'destructive',
      });
      return;
    }

    if (!treatmentPlanData.proposedTreatment.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Proposed treatment is required',
        variant: 'destructive',
      });
      return;
    }

    if (!treatmentPlanData.estimatedDuration.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Estimated duration is required',
        variant: 'destructive',
      });
      return;
    }

    if (!treatmentPlanData.estimatedCost || parseFloat(treatmentPlanData.estimatedCost) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Valid estimated cost is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingTreatmentPlan(true);

    try {
      const treatmentPlan = {
        id: caseData.treatmentPlan?.id || `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        diagnosis: treatmentPlanData.diagnosis.trim(),
        proposedTreatment: treatmentPlanData.proposedTreatment.trim(),
        estimatedDuration: treatmentPlanData.estimatedDuration.trim(),
        estimatedCost: parseFloat(treatmentPlanData.estimatedCost),
        currency: treatmentPlanData.currency,
        doctorName: treatmentPlanData.doctorName.trim(),
        department: treatmentPlanData.department.trim(),
        notes: treatmentPlanData.notes.trim(),
        createdAt: caseData.treatmentPlan?.createdAt || new Date().toISOString(),
        createdBy: user?.id || '',
      };

      // Update case with treatment plan
      await updateCaseData(id, { treatmentPlan });

      // If case is in 'case_accepted' status, optionally auto-advance to 'treatment_plan_uploaded'
      if (caseData.status === 'case_accepted' && user?.role === 'hospital') {
        await updateCaseStatus(id, 'treatment_plan_uploaded', 'Treatment plan uploaded');
      }

      await refreshCase();
      setIsTreatmentPlanDialogOpen(false);

      toast({
        title: 'Treatment Plan Saved',
        description: 'Treatment plan has been saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save treatment plan',
        variant: 'destructive',
      });
    } finally {
      setIsSavingTreatmentPlan(false);
    }
  };

  const handleSaveVisa = async () => {
    if (!id || !caseData) return;

    // Validation based on status
    if (visaData.status === 'processing' || visaData.status === 'approved') {
      if (!visaData.applicationDate) {
        toast({
          title: 'Validation Error',
          description: 'Application date is required when visa is processing or approved',
          variant: 'destructive',
        });
        return;
      }
    }

    if (visaData.status === 'approved') {
      if (!visaData.visaNumber) {
        toast({
          title: 'Validation Error',
          description: 'Visa number is required when visa is approved',
          variant: 'destructive',
        });
        return;
      }
      if (!visaData.issueDate) {
        toast({
          title: 'Validation Error',
          description: 'Issue date is required when visa is approved',
          variant: 'destructive',
        });
        return;
      }
      if (!visaData.expiryDate) {
        toast({
          title: 'Validation Error',
          description: 'Expiry date is required when visa is approved',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSavingVisa(true);

    try {
      const updatedVisa = {
        applicationDate: visaData.applicationDate || undefined,
        status: visaData.status,
        visaNumber: visaData.visaNumber || undefined,
        issueDate: visaData.issueDate || undefined,
        expiryDate: visaData.expiryDate || undefined,
        notes: visaData.notes || undefined,
      };

      // Determine if we need to update case status based on visa status
      let statusUpdate: CaseStatus | null = null;
      if (visaData.status === 'approved' && caseData.status !== 'visa_approved') {
        statusUpdate = 'visa_approved';
      } else if (visaData.status === 'rejected' && caseData.status !== 'visa_rejected') {
        statusUpdate = 'visa_rejected';
      } else if (visaData.status === 'processing') {
        // Determine which processing stage based on current status
        if (caseData.status === 'pass_travel_documentation') {
          statusUpdate = 'visa_processing_documents';
        } else if (caseData.status === 'visa_processing_documents') {
          statusUpdate = 'visa_processing_payments';
        }
      } else if (visaData.status === 'reapply' && caseData.status !== 'visa_reapply') {
        statusUpdate = 'visa_reapply';
      }

      // Update visa info
      await updateCaseData(id, { visa: updatedVisa });

      // Update status if needed
      if (statusUpdate) {
        await updateCaseStatus(id, statusUpdate, `Visa status updated to ${visaData.status}`);
      }

      await refreshCase();
      setIsVisaProcessingDialogOpen(false);

      toast({
        title: 'Visa Information Updated',
        description: 'Visa processing details have been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update visa information',
        variant: 'destructive',
      });
    } finally {
      setIsSavingVisa(false);
    }
  };

  const handleSaveFRRO = async () => {
    if (!id || !caseData) return;

    // Validation
    if (!frroData.registrationNumber.trim()) {
      toast({
        title: 'Validation Error',
        description: 'FRRO registration number is required',
        variant: 'destructive',
      });
      return;
    }

    if (!frroData.registrationDate) {
      toast({
        title: 'Validation Error',
        description: 'Registration date is required',
        variant: 'destructive',
      });
      return;
    }

    if (!frroData.registrationOffice.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Registration office is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingFRRO(true);

    try {
      // Create FRRO registration entry (we'll store it in case notes/activity log and update status)
      // For now, we'll add it as a comment/activity log entry and update status
      
      // Add activity log entry
      await addComment(id, `FRRO Registration Details:\nRegistration Number: ${frroData.registrationNumber}\nRegistration Office: ${frroData.registrationOffice}\nRegistration Date: ${frroData.registrationDate}\nExpiry Date: ${frroData.expiryDate || 'N/A'}\nStatus: ${frroData.status}\n${frroData.notes ? `Notes: ${frroData.notes}` : ''}`, false);

      // If case is in 'admit_format_uploaded' status, auto-advance to 'frro_registration'
      if (caseData.status === 'admit_format_uploaded' && user?.role === 'hospital') {
        await updateCaseStatus(id, 'frro_registration', `FRRO registration completed. Registration Number: ${frroData.registrationNumber}`);
      } else if (caseData.status !== 'frro_registration') {
        // If not in the right status, just update to frro_registration
        await updateCaseStatus(id, 'frro_registration', `FRRO registration details updated. Registration Number: ${frroData.registrationNumber}`);
      }

      await refreshCase();
      setIsFRRODialogOpen(false);

      toast({
        title: 'FRRO Registration Saved',
        description: 'FRRO registration details have been saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save FRRO registration',
        variant: 'destructive',
      });
    } finally {
      setIsSavingFRRO(false);
    }
  };

  const handleSaveDischarge = async () => {
    if (!id || !caseData) return;

    // Validation
    if (!dischargeData.dischargeDate) {
      toast({
        title: 'Validation Error',
        description: 'Discharge date is required',
        variant: 'destructive',
      });
      return;
    }

    if (!dischargeData.dischargeSummary.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Discharge summary is required',
        variant: 'destructive',
      });
      return;
    }

    if (!dischargeData.finalDiagnosis.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Final diagnosis is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingDischarge(true);

    try {
      // Create discharge summary entry as comment
      const dischargeInfo = `Discharge Summary:\nDischarge Date: ${dischargeData.dischargeDate}\nFinal Diagnosis: ${dischargeData.finalDiagnosis}\nTreatment Provided: ${dischargeData.treatmentProvided || 'N/A'}\nMedications: ${dischargeData.medications || 'N/A'}\nFollow-up Instructions: ${dischargeData.followUpInstructions || 'N/A'}\n${dischargeData.notes ? `Notes: ${dischargeData.notes}` : ''}`;
      
      await addComment(id, dischargeInfo, false);

      // If case is in 'final_report_medicine' status, auto-advance to 'discharge_process'
      if (caseData.status === 'final_report_medicine' && user?.role === 'hospital') {
        await updateCaseStatus(id, 'discharge_process', `Discharge summary completed. Discharge Date: ${dischargeData.dischargeDate}`);
      } else if (caseData.status !== 'discharge_process') {
        // If not in the right status, just update to discharge_process
        await updateCaseStatus(id, 'discharge_process', `Discharge summary updated. Discharge Date: ${dischargeData.dischargeDate}`);
      }

      await refreshCase();
      setIsDischargeDialogOpen(false);

      toast({
        title: 'Discharge Summary Saved',
        description: 'Discharge summary has been saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save discharge summary',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDischarge(false);
    }
  };

  const handleSaveTicketBooking = async () => {
    if (!id || !caseData) return;

    // Validation
    if (!ticketData.flightNumber.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Flight number is required',
        variant: 'destructive',
      });
      return;
    }

    if (!ticketData.airline.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Airline is required',
        variant: 'destructive',
      });
      return;
    }

    if (!ticketData.departureDate) {
      toast({
        title: 'Validation Error',
        description: 'Departure date is required',
        variant: 'destructive',
      });
      return;
    }

    if (!ticketData.departureAirport.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Departure airport is required',
        variant: 'destructive',
      });
      return;
    }

    if (!ticketData.arrivalDate) {
      toast({
        title: 'Validation Error',
        description: 'Arrival date is required',
        variant: 'destructive',
      });
      return;
    }

    if (!ticketData.arrivalAirport.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Arrival airport is required',
        variant: 'destructive',
      });
      return;
    }

    if (!ticketData.ticketReference.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Ticket reference/PNR is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingTicket(true);

    try {
      // Create ticket booking entry as comment
      const ticketInfo = `Ticket Booking Details:\nFlight: ${ticketData.airline} ${ticketData.flightNumber}\nDeparture: ${ticketData.departureAirport} on ${ticketData.departureDate} at ${ticketData.departureTime || 'TBD'}\nArrival: ${ticketData.arrivalAirport} on ${ticketData.arrivalDate} at ${ticketData.arrivalTime || 'TBD'}\n${ticketData.returnFlightNumber ? `Return: ${ticketData.returnAirline} ${ticketData.returnFlightNumber} on ${ticketData.returnDate} at ${ticketData.returnTime || 'TBD'}` : 'One-way ticket'}\nTicket Reference: ${ticketData.ticketReference}\nStatus: ${ticketData.bookingStatus}\n${ticketData.notes ? `Notes: ${ticketData.notes}` : ''}`;
      
      await addComment(id, ticketInfo, false);

      // If case is in 'invoice_uploaded' status, auto-advance to 'ticket_booking'
      if (caseData.status === 'invoice_uploaded' && user?.role === 'admin') {
        await updateCaseStatus(id, 'ticket_booking', `Ticket booked. Flight: ${ticketData.airline} ${ticketData.flightNumber}, Reference: ${ticketData.ticketReference}`);
      } else if (caseData.status !== 'ticket_booking') {
        // If not in the right status, just update to ticket_booking
        await updateCaseStatus(id, 'ticket_booking', `Ticket booking updated. Flight: ${ticketData.airline} ${ticketData.flightNumber}`);
      }

      await refreshCase();
      setIsTicketBookingDialogOpen(false);

      toast({
        title: 'Ticket Booking Saved',
        description: 'Ticket booking details have been saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save ticket booking',
        variant: 'destructive',
      });
    } finally {
      setIsSavingTicket(false);
    }
  };

  const getStatusBadgeClass = (status: CaseStatus) => {
    return STATUS_COLORS[status] || 'status-neutral';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-medical-warning/20 text-medical-warning border-0">High</Badge>;
      case 'medium':
        return <Badge className="bg-medical-info/20 text-medical-info border-0">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Document upload permissions based on role and status
  const canEditDocuments = (() => {
    if (!user || !caseData) return false;
    
    // Get available document types for this role and status
    const availableDocs = getAvailableDocumentTypes(
      user.role,
      caseData.status,
      uploadedDocTypes
    );
    
    // Can edit if there are available documents to upload
    if (availableDocs.length > 0) {
      // Additional checks for specific roles
      if (user.role === 'hospital') {
        return isAssignedToCurrentHospital;
      }
      if (user.role === 'agent') {
        return isAssignedToCurrentAgent;
      }
      return true; // Admin, finance can upload if documents are available
    }
    
    return false;
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cases')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-display font-bold text-foreground">
                {caseData.clientInfo.name}
              </h1>
              {getPriorityBadge(caseData.priority)}
            </div>
            <p className="text-muted-foreground">
              Case ID: <span className="font-mono">{caseData.id.slice(-7).toUpperCase()}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn('text-sm px-3 py-1', getStatusBadgeClass(caseData.status))}
          >
            {STATUS_LABELS[caseData.status]}
          </Badge>
        </div>
      </div>

      {/* Progress Bar & Workflow Overview */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Case Progress</span>
            <span className="text-sm font-medium text-foreground">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Current Stage: {STATUS_LABELS[caseData.status]} ({currentStatusIndex + 1} of {STATUS_FLOW.length})
          </p>
          
          {/* Compact Workflow Stages */}
          <div className="mt-4 pt-4 border-t border-border">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-foreground hover:text-primary transition-colors">
                View Complete Workflow ({STATUS_FLOW.length} stages)
              </summary>
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {STATUS_FLOW.map((status, index) => {
                  const isCurrent = status === caseData.status;
                  const isCompleted = index < currentStatusIndex;
                  const isUpcoming = index > currentStatusIndex;
                  const statusHistoryEntry = caseData.statusHistory.find(sh => sh.status === status);
                  
                  return (
                    <div
                      key={status}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg text-xs transition-colors',
                        isCurrent && 'bg-primary/10 border border-primary/20',
                        isCompleted && 'bg-muted/30',
                        isUpcoming && 'opacity-50'
                      )}
                    >
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-medium',
                        isCurrent && 'bg-primary text-primary-foreground',
                        isCompleted && 'bg-medical-safe text-white',
                        isUpcoming && 'bg-muted text-muted-foreground'
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-medium',
                          isCurrent && 'text-primary',
                          isCompleted && 'text-foreground',
                          isUpcoming && 'text-muted-foreground'
                        )}>
                          {STATUS_LABELS[status]}
                        </p>
                        {statusHistoryEntry && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(statusHistoryEntry.timestamp).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {isCurrent && (
                        <Badge variant="outline" className="text-xs bg-primary/10">
                          Current
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          </div>
        </CardContent>
      </Card>

      {/* Professional Actions Panel (for non-client users) */}
      {user?.role !== 'client' && (
        <Card className="card-elevated border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                    Available Actions
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {availableStatuses.length > 0 
                      ? `${availableStatuses.length} action${availableStatuses.length > 1 ? 's' : ''} available for this case`
                      : 'No actions available. Waiting for other roles to complete their tasks.'}
                  </CardDescription>
                </div>
              </div>
              {availableStatuses.length > 0 && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  <Activity className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {availableStatuses.length > 0 ? (
              <div className="space-y-4">
                {/* Group actions by category */}
                {(() => {
                  const groupedActions = availableStatuses.reduce((acc, status) => {
                    const category = getActionCategory(status);
                    if (!acc[category.name]) {
                      acc[category.name] = [];
                    }
                    acc[category.name].push(status);
                    return acc;
                  }, {} as Record<string, CaseStatus[]>);

                  return Object.entries(groupedActions).map(([categoryName, statuses]) => {
                    const category = getActionCategory(statuses[0]);
                    return (
                      <div key={categoryName} className="space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn('px-2 py-1 rounded-md border flex items-center gap-1', category.color)}>
                            {category.icon}
                            <span className="text-xs font-medium">{categoryName}</span>
                          </div>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {statuses.map((status) => {
                            const isRejection = status === 'case_rejected' || status === 'visa_rejected' || status === 'visa_terminate';
                            const requirements = getActionRequirements(status);
                            const canProceed = requirements.length === 0;
                            
                            return (
                              <div
                                key={status}
                                className={cn(
                                  'group relative p-4 rounded-xl border-2 transition-all duration-300',
                                  canProceed
                                    ? isRejection
                                      ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50 hover:bg-red-500/10 cursor-pointer'
                                      : 'border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 cursor-pointer hover:shadow-lg'
                                    : 'border-muted bg-muted/30 opacity-60 cursor-not-allowed',
                                  'animate-fade-in'
                                )}
                                onClick={() => canProceed && handleStatusChange(status)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={cn(
                                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110',
                                    canProceed
                                      ? isRejection
                                        ? 'bg-red-500/20 text-red-600'
                                        : 'bg-primary/20 text-primary'
                                      : 'bg-muted text-muted-foreground'
                                  )}>
                                    {getActionIcon(status)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className={cn(
                                        'font-semibold text-sm',
                                        canProceed ? 'text-foreground' : 'text-muted-foreground'
                                      )}>
                                        {STATUS_LABELS[status]}
                                      </h4>
                                      {!canProceed && (
                                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                      {getActionDescription(status)}
                                    </p>
                                    {requirements.length > 0 && (
                                      <div className="space-y-1">
                                        {requirements.map((req, idx) => (
                                          <div key={idx} className="flex items-center gap-1.5 text-xs text-medical-warning">
                                            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                            <span>{req}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    {canProceed && (
                                      <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                                        <span>Click to proceed</span>
                                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {canProceed && (
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className={cn(
                                      'w-2 h-2 rounded-full animate-pulse',
                                      isRejection ? 'bg-red-500' : 'bg-primary'
                                    )} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
                
                {/* Hospital Assignment (Admin only) - Hospital refers to Sudaind's hospital-related agent */}
                {user?.role === 'admin' && 
                 (caseData.status === 'admin_review' || caseData.status === 'case_rejected') && 
                 !caseData.assignedHospital && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-5 h-5 text-primary" />
                        <h4 className="font-semibold text-sm text-foreground">Assign Hospital Agent</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                          <SelectTrigger className="flex-1 bg-background">
                            <Building2 className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Select Hospital Agent to Assign" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover border-border">
                            {hospitals.map((h) => (
                              <SelectItem key={h.id} value={h.id}>
                                {h.name} - {h.city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          onClick={handleAssignHospital} 
                          disabled={!selectedHospital}
                          className="bg-gradient-primary hover:opacity-90 shadow-md"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Assign
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-muted-foreground opacity-50 animate-pulse" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Waiting for Next Action</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Other team members need to complete their tasks before you can proceed.
                </p>
                {user?.role === 'agent' && caseData.status === 'case_agent_review' && missingRequired.length > 0 && (
                  <div className="mt-4 p-3 bg-medical-warning/10 border border-medical-warning/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-medical-warning">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-medium">Action Required:</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload all {missingRequired.length} required document(s) to proceed
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={(open) => {
        setIsStatusDialogOpen(open);
        if (!open) {
          setStatusNote('');
          setPendingStatus(null);
        }
      }}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                {pendingStatus && getActionIcon(pendingStatus)}
              </div>
              <div>
                <DialogTitle className="text-foreground text-lg">Confirm Status Change</DialogTitle>
                <DialogDescription className="mt-1">
                  Review the status transition before confirming
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Status Transition Visualization */}
            <div className="relative">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    'bg-muted text-muted-foreground'
                  )}>
                    {getActionIcon(caseData.status)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                    <Badge variant="outline" className={getStatusBadgeClass(caseData.status)}>
                      {STATUS_LABELS[caseData.status]}
                    </Badge>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground mx-4" />
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    pendingStatus && (pendingStatus === 'case_rejected' || pendingStatus === 'visa_rejected' || pendingStatus === 'visa_terminate')
                      ? 'bg-red-500/20 text-red-600'
                      : 'bg-primary/20 text-primary'
                  )}>
                    {pendingStatus && getActionIcon(pendingStatus)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">New Status</p>
                    <Badge 
                      variant="outline" 
                      className={pendingStatus ? getStatusBadgeClass(pendingStatus) : ''}
                    >
                      {pendingStatus && STATUS_LABELS[pendingStatus]}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Description */}
            {pendingStatus && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>Action:</strong> {getActionDescription(pendingStatus)}
                </p>
              </div>
            )}

            {/* Warning for Rejection Actions */}
            {(pendingStatus === 'case_rejected' || pendingStatus === 'visa_rejected' || pendingStatus === 'visa_terminate') && (
              <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-600 mb-1">Warning: Critical Action</p>
                    <p className="text-xs text-muted-foreground">
                      This action will {pendingStatus === 'visa_terminate' ? 'terminate' : 'reject'} the case. 
                      Please provide a reason below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Status Note Input */}
            <div className="space-y-2">
              <Label htmlFor="statusNote" className="text-sm font-medium">
                {pendingStatus && (pendingStatus === 'case_rejected' || pendingStatus === 'visa_rejected' || pendingStatus === 'visa_terminate')
                  ? 'Reason for Rejection/Termination *'
                  : 'Optional Note'}
              </Label>
              <Textarea
                id="statusNote"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder={pendingStatus && (pendingStatus === 'case_rejected' || pendingStatus === 'visa_rejected' || pendingStatus === 'visa_terminate')
                  ? 'Please provide a reason for this action...'
                  : 'Add any notes about this status change...'}
                className="min-h-[80px] resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This note will be recorded in the case history
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsStatusDialogOpen(false);
                setStatusNote('');
                setPendingStatus(null);
              }}
              disabled={isSavingStatus}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={confirmStatusChange}
              disabled={
                isSavingStatus || 
                (pendingStatus && (pendingStatus === 'case_rejected' || pendingStatus === 'visa_rejected' || pendingStatus === 'visa_terminate') && !statusNote.trim())
              }
              className={cn(
                'flex-1 shadow-md',
                pendingStatus && (pendingStatus === 'case_rejected' || pendingStatus === 'visa_rejected' || pendingStatus === 'visa_terminate')
                  ? 'bg-destructive hover:bg-destructive/90'
                  : 'bg-gradient-primary hover:opacity-90'
              )}
            >
              {isSavingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {pendingStatus && (pendingStatus === 'case_rejected' || pendingStatus === 'visa_rejected' || pendingStatus === 'visa_terminate') ? (
                    <>
                      <X className="w-4 h-4 mr-2" />
                      Confirm Rejection
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirm Change
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Treatment Plan Upload/Edit Dialog */}
      <Dialog open={isTreatmentPlanDialogOpen} onOpenChange={setIsTreatmentPlanDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {caseData?.treatmentPlan ? 'Edit Treatment Plan' : 'Upload Treatment Plan'}
            </DialogTitle>
            <DialogDescription>
              {caseData?.treatmentPlan 
                ? 'Update the treatment plan details for this case'
                : 'Create a treatment plan for this case. This will enable progression to the next stage.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="diagnosis">
                  Diagnosis <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="diagnosis"
                  value={treatmentPlanData.diagnosis}
                  onChange={(e) => setTreatmentPlanData({ ...treatmentPlanData, diagnosis: e.target.value })}
                  placeholder="Enter diagnosis"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctorName">Medical Specialist Name</Label>
                <Input
                  id="doctorName"
                  value={treatmentPlanData.doctorName}
                  onChange={(e) => setTreatmentPlanData({ ...treatmentPlanData, doctorName: e.target.value })}
                  placeholder="Enter medical specialist name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposedTreatment">
                Proposed Treatment <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="proposedTreatment"
                value={treatmentPlanData.proposedTreatment}
                onChange={(e) => setTreatmentPlanData({ ...treatmentPlanData, proposedTreatment: e.target.value })}
                placeholder="Describe the proposed treatment plan..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="estimatedDuration">
                  Estimated Duration <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="estimatedDuration"
                  value={treatmentPlanData.estimatedDuration}
                  onChange={(e) => setTreatmentPlanData({ ...treatmentPlanData, estimatedDuration: e.target.value })}
                  placeholder="e.g., 2 weeks, 1 month"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedCost">
                  Estimated Cost <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={treatmentPlanData.estimatedCost}
                  onChange={(e) => setTreatmentPlanData({ ...treatmentPlanData, estimatedCost: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={treatmentPlanData.currency}
                  onValueChange={(value) => setTreatmentPlanData({ ...treatmentPlanData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={treatmentPlanData.department}
                  onChange={(e) => setTreatmentPlanData({ ...treatmentPlanData, department: e.target.value })}
                  placeholder="e.g., Cardiology, Oncology"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={treatmentPlanData.notes}
                onChange={(e) => setTreatmentPlanData({ ...treatmentPlanData, notes: e.target.value })}
                placeholder="Any additional notes or special instructions..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsTreatmentPlanDialogOpen(false)}
              disabled={isSavingTreatmentPlan}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTreatmentPlan}
              disabled={isSavingTreatmentPlan}
              className="bg-gradient-primary"
            >
              {isSavingTreatmentPlan ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {caseData?.treatmentPlan ? 'Update Plan' : 'Save & Upload Plan'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visa Processing Dialog */}
      <Dialog open={isVisaProcessingDialogOpen} onOpenChange={setIsVisaProcessingDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Plane className="w-5 h-5" />
              Visa Processing Management
            </DialogTitle>
            <DialogDescription>
              Manage visa application details, status, and tracking information for this case
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Visa Status */}
            <div className="space-y-2">
              <Label htmlFor="visaStatus">
                Visa Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={visaData.status}
                onValueChange={(value: 'not_started' | 'processing' | 'approved' | 'rejected' | 'reapply') => 
                  setVisaData({ ...visaData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="reapply">Reapply</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {visaData.status === 'processing' && 'Visa application is being processed'}
                {visaData.status === 'approved' && 'Visa has been approved - fill in visa details below'}
                {visaData.status === 'rejected' && 'Visa application was rejected'}
                {visaData.status === 'reapply' && 'Visa application needs to be resubmitted'}
              </p>
            </div>

            {/* Application Date */}
            <div className="space-y-2">
              <Label htmlFor="applicationDate">
                Application Date
                {(visaData.status === 'processing' || visaData.status === 'approved') && (
                  <span className="text-destructive"> *</span>
                )}
              </Label>
              <Input
                id="applicationDate"
                type="date"
                value={visaData.applicationDate}
                onChange={(e) => setVisaData({ ...visaData, applicationDate: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Date when visa application was submitted
              </p>
            </div>

            {/* Visa Details (shown when approved) */}
            {visaData.status === 'approved' && (
              <div className="space-y-4 p-4 bg-medical-safe/10 border border-medical-safe/20 rounded-lg">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-medical-safe" />
                  Visa Approval Details
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="visaNumber">
                      Visa Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="visaNumber"
                      value={visaData.visaNumber}
                      onChange={(e) => setVisaData({ ...visaData, visaNumber: e.target.value })}
                      placeholder="Enter visa number"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">
                      Issue Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={visaData.issueDate}
                      onChange={(e) => setVisaData({ ...visaData, issueDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">
                      Expiry Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={visaData.expiryDate}
                      onChange={(e) => setVisaData({ ...visaData, expiryDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Visa Notes */}
            <div className="space-y-2">
              <Label htmlFor="visaNotes">Processing Notes</Label>
              <Textarea
                id="visaNotes"
                value={visaData.notes}
                onChange={(e) => setVisaData({ ...visaData, notes: e.target.value })}
                placeholder="Add any notes about visa processing, requirements, or updates..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Internal notes about visa processing status and requirements
              </p>
            </div>

            {/* Visa Status Information */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-xs font-medium text-foreground mb-2">Current Case Status</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusBadgeClass(caseData.status)}>
                  {STATUS_LABELS[caseData.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {visaData.status === 'approved' && caseData.status !== 'visa_approved' && 
                    '→ Will update to "Visa Approved" status'}
                  {visaData.status === 'processing' && 
                    '→ Will update to appropriate visa processing stage'}
                  {visaData.status === 'rejected' && caseData.status !== 'visa_rejected' && 
                    '→ Will update to "Visa Rejected" status'}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsVisaProcessingDialogOpen(false)}
              disabled={isSavingVisa}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveVisa}
              disabled={isSavingVisa}
              className="bg-gradient-primary"
            >
              {isSavingVisa ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plane className="w-4 h-4 mr-2" />
                  Save Visa Information
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FRRO Registration Dialog */}
      <Dialog open={isFRRODialogOpen} onOpenChange={setIsFRRODialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5" />
              FRRO Registration
            </DialogTitle>
            <DialogDescription>
              Complete FRRO (Foreigners Regional Registration Office) registration for this patient
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">Patient Information</p>
              <p className="text-xs text-muted-foreground">
                <strong>Name:</strong> {caseData?.clientInfo.name} | <strong>Passport:</strong> {caseData?.clientInfo.passport} | <strong>Nationality:</strong> {caseData?.clientInfo.nationality}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="frroRegistrationNumber">
                  FRRO Registration Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="frroRegistrationNumber"
                  value={frroData.registrationNumber}
                  onChange={(e) => setFrroData({ ...frroData, registrationNumber: e.target.value })}
                  placeholder="Enter FRRO registration number"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frroRegistrationOffice">
                  Registration Office <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="frroRegistrationOffice"
                  value={frroData.registrationOffice}
                  onChange={(e) => setFrroData({ ...frroData, registrationOffice: e.target.value })}
                  placeholder="e.g., FRRO Delhi, FRRO Mumbai"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="frroRegistrationDate">
                  Registration Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="frroRegistrationDate"
                  type="date"
                  value={frroData.registrationDate}
                  onChange={(e) => setFrroData({ ...frroData, registrationDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frroExpiryDate">Expiry Date</Label>
                <Input
                  id="frroExpiryDate"
                  type="date"
                  value={frroData.expiryDate}
                  onChange={(e) => setFrroData({ ...frroData, expiryDate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty if registration is permanent
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frroStatus">Registration Status</Label>
              <Select
                value={frroData.status}
                onValueChange={(value: 'pending' | 'completed' | 'rejected') => 
                  setFrroData({ ...frroData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frroNotes">Registration Notes</Label>
              <Textarea
                id="frroNotes"
                value={frroData.notes}
                onChange={(e) => setFrroData({ ...frroData, notes: e.target.value })}
                placeholder="Add any notes about FRRO registration process, requirements, or special instructions..."
                className="min-h-[100px]"
              />
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-xs font-medium text-foreground mb-2">Current Case Status</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusBadgeClass(caseData?.status || 'new')}>
                  {caseData?.status ? STATUS_LABELS[caseData.status] : 'Unknown'}
                </Badge>
                {caseData?.status === 'admit_format_uploaded' && (
                  <span className="text-xs text-muted-foreground">
                    → Will update to "FRRO Registration" status after submission
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 bg-medical-info/10 border border-medical-info/20 rounded-lg">
              <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-medical-info" />
                FRRO Registration Requirements
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                <li>• Valid passport and visa</li>
                <li>• Proof of address in India</li>
                <li>• Medical documents (if applicable)</li>
                <li>• Registration must be completed within 14 days of arrival</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsFRRODialogOpen(false)}
              disabled={isSavingFRRO}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveFRRO}
              disabled={isSavingFRRO}
              className="bg-gradient-primary"
            >
              {isSavingFRRO ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save & Complete Registration
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discharge Process Dialog */}
      <Dialog open={isDischargeDialogOpen} onOpenChange={setIsDischargeDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Discharge Summary
            </DialogTitle>
            <DialogDescription>
              Complete discharge summary and finalize patient treatment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">Patient Information</p>
              <p className="text-xs text-muted-foreground">
                <strong>Name:</strong> {caseData?.clientInfo.name} | <strong>Case ID:</strong> {caseData?.id.slice(-7).toUpperCase()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dischargeDate">
                Discharge Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dischargeDate"
                type="date"
                value={dischargeData.dischargeDate}
                onChange={(e) => setDischargeData({ ...dischargeData, dischargeDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalDiagnosis">
                Final Diagnosis <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="finalDiagnosis"
                value={dischargeData.finalDiagnosis}
                onChange={(e) => setDischargeData({ ...dischargeData, finalDiagnosis: e.target.value })}
                placeholder="Enter final diagnosis after treatment..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dischargeSummary">
                Discharge Summary <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="dischargeSummary"
                value={dischargeData.dischargeSummary}
                onChange={(e) => setDischargeData({ ...dischargeData, dischargeSummary: e.target.value })}
                placeholder="Provide comprehensive discharge summary including treatment provided, patient condition, and outcomes..."
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatmentProvided">Treatment Provided</Label>
              <Textarea
                id="treatmentProvided"
                value={dischargeData.treatmentProvided}
                onChange={(e) => setDischargeData({ ...dischargeData, treatmentProvided: e.target.value })}
                placeholder="List all treatments, procedures, and interventions provided..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">Medications Prescribed</Label>
              <Textarea
                id="medications"
                value={dischargeData.medications}
                onChange={(e) => setDischargeData({ ...dischargeData, medications: e.target.value })}
                placeholder="List all medications, dosages, and instructions..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followUpInstructions">Follow-up Instructions</Label>
              <Textarea
                id="followUpInstructions"
                value={dischargeData.followUpInstructions}
                onChange={(e) => setDischargeData({ ...dischargeData, followUpInstructions: e.target.value })}
                placeholder="Provide follow-up care instructions, appointment schedules, and recommendations..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dischargeNotes">Additional Notes</Label>
              <Textarea
                id="dischargeNotes"
                value={dischargeData.notes}
                onChange={(e) => setDischargeData({ ...dischargeData, notes: e.target.value })}
                placeholder="Any additional notes or special instructions..."
                className="min-h-[80px]"
              />
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-xs font-medium text-foreground mb-2">Current Case Status</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusBadgeClass(caseData?.status || 'new')}>
                  {caseData?.status ? STATUS_LABELS[caseData.status] : 'Unknown'}
                </Badge>
                {caseData?.status === 'final_report_medicine' && (
                  <span className="text-xs text-muted-foreground">
                    → Will update to "Discharge Process" status after submission
                  </span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDischargeDialogOpen(false)}
              disabled={isSavingDischarge}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveDischarge}
              disabled={isSavingDischarge}
              className="bg-gradient-primary"
            >
              {isSavingDischarge ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save & Complete Discharge
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Booking Dialog */}
      <Dialog open={isTicketBookingDialogOpen} onOpenChange={setIsTicketBookingDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Plane className="w-5 h-5" />
              Flight Ticket Booking
            </DialogTitle>
            <DialogDescription>
              Book flight tickets and create travel itinerary for the patient
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">Patient Information</p>
              <p className="text-xs text-muted-foreground">
                <strong>Name:</strong> {caseData?.clientInfo.name} | <strong>Passport:</strong> {caseData?.clientInfo.passport} | <strong>Case ID:</strong> {caseData?.id.slice(-7).toUpperCase()}
              </p>
            </div>

            {/* Outbound Flight */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Plane className="w-4 h-4" />
                Outbound Flight
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="airline">
                    Airline <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="airline"
                    value={ticketData.airline}
                    onChange={(e) => setTicketData({ ...ticketData, airline: e.target.value })}
                    placeholder="e.g., Air India, Emirates"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flightNumber">
                    Flight Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="flightNumber"
                    value={ticketData.flightNumber}
                    onChange={(e) => setTicketData({ ...ticketData, flightNumber: e.target.value })}
                    placeholder="e.g., AI101, EK501"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureAirport">
                    Departure Airport <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="departureAirport"
                    value={ticketData.departureAirport}
                    onChange={(e) => setTicketData({ ...ticketData, departureAirport: e.target.value })}
                    placeholder="e.g., KRT (Khartoum), DEL (Delhi)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalAirport">
                    Arrival Airport <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="arrivalAirport"
                    value={ticketData.arrivalAirport}
                    onChange={(e) => setTicketData({ ...ticketData, arrivalAirport: e.target.value })}
                    placeholder="e.g., DEL (Delhi), BOM (Mumbai)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureDate">
                    Departure Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={ticketData.departureDate}
                    onChange={(e) => setTicketData({ ...ticketData, departureDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departureTime">Departure Time</Label>
                  <Input
                    id="departureTime"
                    type="time"
                    value={ticketData.departureTime}
                    onChange={(e) => setTicketData({ ...ticketData, departureTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalDate">
                    Arrival Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="arrivalDate"
                    type="date"
                    value={ticketData.arrivalDate}
                    onChange={(e) => setTicketData({ ...ticketData, arrivalDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">Arrival Time</Label>
                  <Input
                    id="arrivalTime"
                    type="time"
                    value={ticketData.arrivalTime}
                    onChange={(e) => setTicketData({ ...ticketData, arrivalTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Return Flight (Optional) */}
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-dashed">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Plane className="w-4 h-4 rotate-180" />
                  Return Flight (Optional)
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="returnAirline">Return Airline</Label>
                  <Input
                    id="returnAirline"
                    value={ticketData.returnAirline}
                    onChange={(e) => setTicketData({ ...ticketData, returnAirline: e.target.value })}
                    placeholder="e.g., Air India, Emirates"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="returnFlightNumber">Return Flight Number</Label>
                  <Input
                    id="returnFlightNumber"
                    value={ticketData.returnFlightNumber}
                    onChange={(e) => setTicketData({ ...ticketData, returnFlightNumber: e.target.value })}
                    placeholder="e.g., AI102, EK502"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="returnDate">Return Date</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    value={ticketData.returnDate}
                    onChange={(e) => setTicketData({ ...ticketData, returnDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="returnTime">Return Time</Label>
                  <Input
                    id="returnTime"
                    type="time"
                    value={ticketData.returnTime}
                    onChange={(e) => setTicketData({ ...ticketData, returnTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ticketReference">
                  Ticket Reference / PNR <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ticketReference"
                  value={ticketData.ticketReference}
                  onChange={(e) => setTicketData({ ...ticketData, ticketReference: e.target.value })}
                  placeholder="Enter booking reference/PNR"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bookingStatus">Booking Status</Label>
                <Select
                  value={ticketData.bookingStatus}
                  onValueChange={(value: 'confirmed' | 'pending' | 'cancelled') => 
                    setTicketData({ ...ticketData, bookingStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketNotes">Booking Notes</Label>
              <Textarea
                id="ticketNotes"
                value={ticketData.notes}
                onChange={(e) => setTicketData({ ...ticketData, notes: e.target.value })}
                placeholder="Add any notes about ticket booking, special requirements, or travel arrangements..."
                className="min-h-[80px]"
              />
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-xs font-medium text-foreground mb-2">Current Case Status</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getStatusBadgeClass(caseData?.status || 'new')}>
                  {caseData?.status ? STATUS_LABELS[caseData.status] : 'Unknown'}
                </Badge>
                {caseData?.status === 'invoice_uploaded' && (
                  <span className="text-xs text-muted-foreground">
                    → Will update to "Ticket Booking" status after submission
                  </span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsTicketBookingDialogOpen(false)}
              disabled={isSavingTicket}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveTicketBooking}
              disabled={isSavingTicket}
              className="bg-gradient-primary"
            >
              {isSavingTicket ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plane className="w-4 h-4 mr-2" />
                  Save & Book Tickets
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">
            Documents
            {missingRequired.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {missingRequired.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="comments">
            Comments
            {caseData.comments.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {caseData.comments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Patient Information */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <User className="w-5 h-5 text-primary" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium text-foreground">{caseData.clientInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="font-medium text-foreground">{caseData.clientInfo.dob}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Passport</p>
                    <p className="font-medium font-mono text-foreground">{caseData.clientInfo.passport}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nationality</p>
                    <p className="font-medium text-foreground">{caseData.clientInfo.nationality}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Stethoscope className="w-4 h-4" />
                    Medical Condition
                  </div>
                  <p className="font-medium text-foreground">{caseData.clientInfo.condition}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{caseData.clientInfo.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{caseData.clientInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{caseData.clientInfo.address}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hospital & Treatment */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Building2 className="w-5 h-5 text-secondary" />
                  Hospital Agent & Treatment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hospital ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned Hospital Agent</p>
                      <p className="font-semibold text-foreground">{hospital.name}</p>
                      <p className="text-sm text-muted-foreground">{hospital.city}, {hospital.state}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {hospital.accreditation.map((acc) => (
                        <Badge key={acc} variant="outline" className="text-xs">
                          {acc}
                        </Badge>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Specialties</p>
                      <div className="flex flex-wrap gap-1">
                        {hospital.specialties.slice(0, 4).map((spec) => (
                          <Badge key={spec} variant="secondary" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No hospital agent assigned yet</p>
                  </div>
                )}
                
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">Treatment Plan</p>
                    {user?.role === 'hospital' && 
                     isAssignedToCurrentHospital && 
                     (caseData.status === 'case_accepted' || caseData.status === 'treatment_plan_uploaded' || caseData.treatmentPlan) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsTreatmentPlanDialogOpen(true)}
                        className="h-7 text-xs"
                      >
                        {caseData.treatmentPlan ? (
                          <>
                            <FileText className="w-3 h-3 mr-1" />
                            Edit Plan
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3 mr-1" />
                            Upload Plan
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  {caseData.treatmentPlan ? (
                    <div className="space-y-2">
                      <p className="text-sm text-foreground"><strong>Diagnosis:</strong> {caseData.treatmentPlan.diagnosis}</p>
                      <p className="text-sm text-foreground"><strong>Treatment:</strong> {caseData.treatmentPlan.proposedTreatment}</p>
                      <p className="text-sm text-foreground"><strong>Duration:</strong> {caseData.treatmentPlan.estimatedDuration}</p>
                      <p className="text-sm text-foreground"><strong>Estimated Cost:</strong> {caseData.treatmentPlan.currency === 'USD' ? '$' : caseData.treatmentPlan.currency === 'INR' ? '₹' : caseData.treatmentPlan.currency} {caseData.treatmentPlan.estimatedCost.toLocaleString()}</p>
                      {caseData.treatmentPlan.doctorName && (
                        <p className="text-sm text-foreground"><strong>Medical Specialist:</strong> {caseData.treatmentPlan.doctorName}</p>
                      )}
                      {caseData.treatmentPlan.department && (
                        <p className="text-sm text-foreground"><strong>Department:</strong> {caseData.treatmentPlan.department}</p>
                      )}
                      {caseData.treatmentPlan.notes && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm text-foreground">{caseData.treatmentPlan.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No treatment plan uploaded yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Attender Information */}
            {caseData.attenderInfo && (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Users className="w-5 h-5 text-primary" />
                    Attender Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium text-foreground">{caseData.attenderInfo.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Relationship</p>
                      <p className="font-medium text-foreground">{caseData.attenderInfo.relationship}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Passport</p>
                      <p className="font-medium font-mono text-foreground">{caseData.attenderInfo.passport}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{caseData.attenderInfo.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">{caseData.attenderInfo.email}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ticket Booking */}
            {(caseData.status === 'invoice_uploaded' || caseData.status === 'ticket_booking' || caseData.status === 'patient_manifest') && (
              <Card className="card-elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Plane className="w-5 h-5 text-secondary" />
                      Ticket Booking
                    </CardTitle>
                    {user?.role === 'admin' && 
                     (caseData.status === 'invoice_uploaded' || caseData.status === 'ticket_booking') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsTicketBookingDialogOpen(true)}
                        className="h-7 text-xs"
                      >
                        <Plane className="w-3 h-3 mr-1" />
                        {caseData.status === 'ticket_booking' ? 'Update Booking' : 'Book Tickets'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {caseData.status === 'ticket_booking' || caseData.status === 'patient_manifest' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-medical-safe" />
                        <span className="text-sm text-foreground font-medium">Tickets Booked</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Flight tickets have been booked. Case can proceed to patient manifest.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Plane className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Ticket booking pending</p>
                      <p className="text-xs mt-1">Book flight tickets to proceed</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Visa Status */}
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Plane className="w-5 h-5 text-secondary" />
                    Visa Information
                  </CardTitle>
                  {user?.role === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsVisaProcessingDialogOpen(true)}
                      className="h-7 text-xs"
                    >
                      <Plane className="w-3 h-3 mr-1" />
                      Manage Visa
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={
                      caseData.visa.status === 'approved' ? 'default' :
                      caseData.visa.status === 'rejected' ? 'destructive' :
                      'secondary'
                    } className={caseData.visa.status === 'approved' ? 'bg-medical-safe' : ''}>
                      {caseData.visa.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  {caseData.visa.applicationDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Application Date</span>
                      <span className="text-foreground">{caseData.visa.applicationDate}</span>
                    </div>
                  )}
                  {caseData.visa.visaNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Visa Number</span>
                      <span className="font-mono text-foreground">{caseData.visa.visaNumber}</span>
                    </div>
                  )}
                  {caseData.visa.issueDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Issue Date</span>
                      <span className="text-foreground">{caseData.visa.issueDate}</span>
                    </div>
                  )}
                  {caseData.visa.expiryDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Expiry Date</span>
                      <span className="text-foreground">{caseData.visa.expiryDate}</span>
                    </div>
                  )}
                  {caseData.visa.notes && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm text-foreground">{caseData.visa.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* FRRO Registration */}
            {(caseData.status === 'admit_format_uploaded' || caseData.status === 'frro_registration' || caseData.status === 'treatment_in_progress') && (
              <Card className="card-elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <FileText className="w-5 h-5 text-secondary" />
                      FRRO Registration
                    </CardTitle>
                    {user?.role === 'hospital' && 
                     isAssignedToCurrentHospital && 
                     (caseData.status === 'admit_format_uploaded' || caseData.status === 'frro_registration') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFRRODialogOpen(true)}
                        className="h-7 text-xs"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Register FRRO
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {caseData.status === 'frro_registration' || caseData.status === 'treatment_in_progress' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-medical-safe" />
                        <span className="text-sm text-foreground font-medium">FRRO Registration Completed</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        FRRO registration has been completed. Case can proceed to treatment.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">FRRO registration pending</p>
                      <p className="text-xs mt-1">Complete FRRO registration to proceed</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Discharge Process */}
            {(caseData.status === 'final_report_medicine' || caseData.status === 'discharge_process' || caseData.status === 'case_closed') && (
              <Card className="card-elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="w-5 h-5 text-secondary" />
                      Discharge Process
                    </CardTitle>
                    {user?.role === 'hospital' && 
                     isAssignedToCurrentHospital && 
                     (caseData.status === 'final_report_medicine' || caseData.status === 'discharge_process') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDischargeDialogOpen(true)}
                        className="h-7 text-xs"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        {caseData.status === 'discharge_process' ? 'Update Discharge' : 'Complete Discharge'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {caseData.status === 'discharge_process' || caseData.status === 'case_closed' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-medical-safe" />
                        <span className="text-sm text-foreground font-medium">Discharge Process Completed</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Discharge summary has been completed. Case can be closed.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Discharge summary pending</p>
                      <p className="text-xs mt-1">Complete discharge summary to finalize case</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground">Documents</CardTitle>
              <CardDescription>
                {missingRequired.length > 0 ? (
                  <span className="text-medical-warning">
                    {missingRequired.length} required document(s) missing
                  </span>
                ) : (
                  'All required documents uploaded'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Section (for agents in early stages) */}
              {canEditDocuments && availableDocTypes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <Select value={selectedDocType} onValueChange={(v) => setSelectedDocType(v as DocumentType)}>
                      <SelectTrigger className="flex-1" disabled={isUploading}>
                        <FileText className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Select document type to upload" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border max-h-[300px]">
                        {availableDocTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {DOCUMENT_TYPE_LABELS[type]}
                            {REQUIRED_DOCUMENTS.includes(type) && (
                              <span className="text-medical-urgent ml-1">*</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleDocumentUpload}
                      disabled={!selectedDocType || isUploading}
                      className="bg-gradient-primary"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  
                  {isUploading && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing document and extracting information...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Missing Required Documents Warning */}
              {missingRequired.length > 0 && (
                <div className="p-3 bg-medical-warning/10 border border-medical-warning/20 rounded-lg">
                  <p className="text-sm font-medium text-medical-warning flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Missing Required Documents:
                  </p>
                  <ul className="mt-2 space-y-1">
                    {missingRequired.map((type) => (
                      <li key={type} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-medical-warning" />
                        {DOCUMENT_TYPE_LABELS[type]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Uploaded Documents List */}
              <div className="space-y-2">
                {caseData.documents.length > 0 ? (
                  caseData.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm">
                            {DOCUMENT_TYPE_LABELS[doc.type]}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.name} • {(doc.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {doc.extractedText && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ✓ Text extracted
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {REQUIRED_DOCUMENTS.includes(doc.type) && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </Badge>
                        {doc.fileData && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Open document in new tab
                                const newWindow = window.open();
                                if (newWindow && doc.fileData) {
                                  newWindow.document.write(`
                                    <html>
                                      <head><title>${doc.name}</title></head>
                                      <body style="margin:0;padding:20px;">
                                        ${doc.mimeType.startsWith('image/') 
                                          ? `<img src="${doc.fileData}" style="max-width:100%;height:auto;" />`
                                          : doc.mimeType === 'application/pdf'
                                          ? `<iframe src="${doc.fileData}" style="width:100%;height:100vh;border:none;"></iframe>`
                                          : `<p>Preview not available. <a href="${doc.fileData}" download="${doc.name}">Download</a></p>`
                                        }
                                      </body>
                                    </html>
                                  `);
                                }
                              }}
                              className="text-primary hover:text-primary"
                              title="View document"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Download document
                                if (doc.fileData) {
                                  const link = document.createElement('a');
                                  link.href = doc.fileData;
                                  link.download = doc.name;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }
                              }}
                              className="text-primary hover:text-primary"
                              title="Download document"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {canEditDocuments && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="text-medical-urgent hover:text-medical-urgent"
                            title="Remove document"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No documents uploaded yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <ActivityTimeline caseData={caseData} showStatusHistory={true} showActivityLog={true} compact={false} />
        </TabsContent>

        {/* Comments Tab - Chatbot Style */}
        <TabsContent value="comments" className="space-y-0">
          <Card className="card-elevated flex flex-col h-[calc(100vh-280px)] min-h-[600px]">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <span>Case Messages</span>
                {caseData.comments.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {caseData.comments.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Chat with the case team
              </CardDescription>
            </CardHeader>
            
            {/* Chat Messages Container */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/20">
              {caseData.comments.length > 0 ? (
                <>
                  {caseData.comments.map((comment) => {
                    const isCurrentUser = comment.userId === user?.id;
                    const isPreset = comment.isPreset;
                    const isSystem = comment.userRole === 'admin' || comment.userRole === 'system';
                    
                    return (
                      <div
                        key={comment.id}
                        className={cn(
                          'flex gap-3 max-w-[80%]',
                          isCurrentUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        )}
                      >
                        {/* Avatar */}
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold',
                          isCurrentUser 
                            ? 'bg-primary text-primary-foreground' 
                            : isSystem
                            ? 'bg-secondary text-secondary-foreground'
                            : 'bg-muted text-foreground'
                        )}>
                          {isCurrentUser ? (
                            <User className="w-4 h-4" />
                          ) : isSystem ? (
                            <MessageSquare className="w-4 h-4" />
                          ) : (
                            comment.userName.charAt(0).toUpperCase()
                          )}
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={cn(
                          'flex flex-col gap-1',
                          isCurrentUser ? 'items-end' : 'items-start'
                        )}>
                          <div className={cn(
                            'rounded-2xl px-4 py-2.5 shadow-sm',
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : isPreset
                              ? 'bg-muted border border-border rounded-bl-sm'
                              : 'bg-card border border-border rounded-bl-sm'
                          )}>
                            {!isCurrentUser && (
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-xs font-semibold text-foreground">
                                  {comment.userName}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className="text-[10px] px-1.5 py-0 capitalize h-4"
                                >
                                  {comment.userRole}
                                </Badge>
                              </div>
                            )}
                            <p className={cn(
                              'text-sm whitespace-pre-wrap break-words',
                              isCurrentUser ? 'text-primary-foreground' : 'text-foreground'
                            )}>
                              {comment.message}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground px-2">
                            {new Date(comment.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground opacity-50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start the conversation</p>
                </div>
              )}
            </CardContent>

            {/* Input Area - Fixed at Bottom */}
            <div className="border-t border-border p-4 bg-background">
              {/* Client Preset Messages */}
              {user?.role === 'client' && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2 px-1">Quick replies:</p>
                  <div className="flex flex-wrap gap-2">
                    {CLIENT_PRESET_MESSAGES.map((msg, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddComment(msg, true)}
                        className="text-xs h-7 px-3 rounded-full border-border hover:bg-primary/5 hover:border-primary/20"
                      >
                        {msg}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Input */}
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    placeholder={user?.role === 'client' ? 'Select a quick message or type your own...' : 'Type your message...'}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (newComment.trim()) {
                          handleAddComment(newComment);
                        }
                      }
                    }}
                    className="min-h-[44px] max-h-32 pr-12 resize-none rounded-2xl border-border focus:border-primary"
                    rows={1}
                  />
                  {user?.role !== 'client' && newComment.trim() && (
                    <Button
                      onClick={() => handleAddComment(newComment)}
                      size="sm"
                      className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full bg-gradient-primary hover:opacity-90"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
                {user?.role !== 'client' && (
                  <Button
                    onClick={() => handleAddComment(newComment)}
                    disabled={!newComment.trim()}
                    size="icon"
                    className="h-11 w-11 rounded-full bg-gradient-primary hover:opacity-90 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
              )}
                      </div>
                    </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CaseDetail;
