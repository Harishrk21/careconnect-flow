import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getCase, hospitals, updateCaseStatus, assignHospital, addComment, addDocument, removeDocument, isLoading } = useData();
  
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [statusNote, setStatusNote] = useState('');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<CaseStatus | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | ''>('');

  useEffect(() => {
    const loadCase = async () => {
      if (!id) return;
      setLoading(true);
      const data = await getCase(id);
      setCaseData(data || null);
      setLoading(false);
    };
    loadCase();
  }, [id, getCase]);

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
  const currentStatusIndex = STATUS_FLOW.indexOf(caseData.status);
  const progressPercentage = ((currentStatusIndex + 1) / STATUS_FLOW.length) * 100;

  // Get available document types (not already uploaded)
  const uploadedDocTypes = caseData.documents.map(d => d.type);
  const availableDocTypes = Object.keys(DOCUMENT_TYPE_LABELS).filter(
    type => !uploadedDocTypes.includes(type as DocumentType)
  ) as DocumentType[];

  // Check required documents
  const missingRequired = REQUIRED_DOCUMENTS.filter(
    type => !uploadedDocTypes.includes(type)
  );

  // Determine available next statuses based on role
  const getAvailableStatuses = (): CaseStatus[] => {
    if (!user) return [];
    
    const currentIndex = STATUS_FLOW.indexOf(caseData.status);
    
    switch (user.role) {
      case 'admin':
        if (caseData.status === 'admin_review') {
          return ['assigned_to_hospital'];
        }
        if (caseData.status === 'case_rejected') {
          return ['assigned_to_hospital'];
        }
        if (caseData.status === 'pass_travel_documentation') {
          return ['visa_processing_documents'];
        }
        if (caseData.status === 'visa_processing_payments') {
          return ['visa_approved', 'visa_rejected'];
        }
        if (caseData.status === 'visa_rejected') {
          return ['visa_processing_documents', 'visa_terminate'];
        }
        if (caseData.status === 'credit_payment_upload') {
          return ['invoice_uploaded'];
        }
        if (caseData.status === 'invoice_uploaded') {
          return ['ticket_booking'];
        }
        if (caseData.status === 'ticket_booking') {
          return ['patient_manifest'];
        }
        if (caseData.status === 'admit_format_uploaded') {
          return ['frro_registration'];
        }
        return [];
        
      case 'agent':
        if (caseData.status === 'new') {
          return ['case_agent_review'];
        }
        if (caseData.status === 'case_agent_review' && missingRequired.length === 0) {
          return ['admin_review'];
        }
        if (caseData.status === 'visa_approved') {
          return ['visa_copy_uploaded'];
        }
        if (caseData.status === 'visa_copy_uploaded') {
          return ['credit_payment_upload'];
        }
        return [];
        
      case 'hospital':
        if (caseData.status === 'assigned_to_hospital' || caseData.status === 'hospital_review') {
          return ['case_accepted', 'case_rejected'];
        }
        if (caseData.status === 'case_accepted') {
          return ['treatment_plan_uploaded'];
        }
        if (caseData.status === 'treatment_plan_uploaded') {
          return ['pass_travel_documentation'];
        }
        if (caseData.status === 'patient_manifest') {
          return ['admit_format_uploaded'];
        }
        if (caseData.status === 'frro_registration') {
          return ['treatment_in_progress'];
        }
        if (caseData.status === 'treatment_in_progress') {
          return ['final_report_medicine'];
        }
        if (caseData.status === 'final_report_medicine') {
          return ['discharge_process'];
        }
        if (caseData.status === 'discharge_process') {
          return ['case_closed'];
        }
        return [];
        
      case 'finance':
        if (caseData.status === 'visa_processing_documents') {
          return ['visa_processing_payments'];
        }
        return [];
        
      default:
        return [];
    }
  };

  const availableStatuses = getAvailableStatuses();

  const handleStatusChange = async (newStatus: CaseStatus) => {
    setPendingStatus(newStatus);
    setIsStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus || !id) return;
    
    try {
      await updateCaseStatus(id, pendingStatus, statusNote);
      await refreshCase();
      toast({
        title: 'Status Updated',
        description: `Case status changed to ${STATUS_LABELS[pendingStatus]}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setIsStatusDialogOpen(false);
      setPendingStatus(null);
      setStatusNote('');
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

  const handleDocumentUpload = async () => {
    if (!selectedDocType || !id) return;
    
    // Simulate document upload
    const mockDoc = {
      type: selectedDocType,
      name: `${selectedDocType.replace(/_/g, '_')}.pdf`,
      uploadedBy: user?.id || '',
      uploadedAt: new Date().toISOString(),
      size: Math.floor(Math.random() * 2000000) + 500000,
      mimeType: 'application/pdf',
    };
    
    try {
      await addDocument(id, mockDoc);
      await refreshCase();
      toast({
        title: 'Document Uploaded',
        description: `${DOCUMENT_TYPE_LABELS[selectedDocType]} has been uploaded`,
      });
      setSelectedDocType('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
    }
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

  const canEditDocuments = user?.role === 'agent' && 
    (caseData.status === 'new' || caseData.status === 'case_agent_review');

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

      {/* Progress Bar */}
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
            Current Stage: {STATUS_LABELS[caseData.status]}
          </p>
        </CardContent>
      </Card>

      {/* Actions Panel (for non-client users) */}
      {user?.role !== 'client' && availableStatuses.length > 0 && (
        <Card className="card-elevated border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <Activity className="w-5 h-5 text-primary" />
              Available Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableStatuses.map((status) => (
                <Button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  variant={status === 'case_rejected' || status === 'visa_rejected' ? 'destructive' : 'default'}
                  className={status === 'case_rejected' || status === 'visa_rejected' ? '' : 'bg-gradient-primary hover:opacity-90'}
                >
                  <ChevronRight className="w-4 h-4 mr-1" />
                  {STATUS_LABELS[status]}
                </Button>
              ))}
              
              {user?.role === 'admin' && caseData.status === 'admin_review' && !caseData.assignedHospital && (
                <div className="flex items-center gap-2 ml-4">
                  <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                    <SelectTrigger className="w-[200px]">
                      <Building2 className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Select Hospital" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {hospitals.map((h) => (
                        <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssignHospital} disabled={!selectedHospital}>
                    Assign
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Confirm Status Change</DialogTitle>
            <DialogDescription>
              You are about to change the status to: <strong>{pendingStatus && STATUS_LABELS[pendingStatus]}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Add a note (optional)"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} className="bg-gradient-primary">
              Confirm
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
                  Hospital & Treatment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hospital ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned Hospital</p>
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
                    <p>No hospital assigned yet</p>
                  </div>
                )}
                
                {caseData.treatmentPlan && (
                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Treatment Plan</p>
                    <div className="space-y-2">
                      <p className="text-sm text-foreground"><strong>Treatment:</strong> {caseData.treatmentPlan.proposedTreatment}</p>
                      <p className="text-sm text-foreground"><strong>Duration:</strong> {caseData.treatmentPlan.estimatedDuration}</p>
                      <p className="text-sm text-foreground"><strong>Estimated Cost:</strong> ${caseData.treatmentPlan.estimatedCost.toLocaleString()} {caseData.treatmentPlan.currency}</p>
                    </div>
                  </div>
                )}
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

            {/* Visa Status */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Plane className="w-5 h-5 text-secondary" />
                  Visa Information
                </CardTitle>
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
                </div>
              </CardContent>
            </Card>
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
                <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                  <Select value={selectedDocType} onValueChange={(v) => setSelectedDocType(v as DocumentType)}>
                    <SelectTrigger className="flex-1">
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
                    disabled={!selectedDocType}
                    className="bg-gradient-primary"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
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
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {DOCUMENT_TYPE_LABELS[doc.type]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.name} • {(doc.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {REQUIRED_DOCUMENTS.includes(doc.type) && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </Badge>
                        {canEditDocuments && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="text-medical-urgent hover:text-medical-urgent"
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
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground">Status History</CardTitle>
              <CardDescription>Complete timeline of case status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                <div className="space-y-6">
                  {[...caseData.statusHistory].reverse().map((entry, index) => (
                    <div key={index} className="relative pl-10">
                      <div className={cn(
                        'absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        index === 0 
                          ? 'bg-primary border-primary' 
                          : 'bg-card border-border'
                      )}>
                        {index === 0 ? (
                          <Clock className="w-2.5 h-2.5 text-primary-foreground" />
                        ) : (
                          <CheckCircle2 className="w-2.5 h-2.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className={getStatusBadgeClass(entry.status)}>
                            {STATUS_LABELS[entry.status]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          By: {entry.byName}
                        </p>
                        {entry.note && (
                          <p className="text-sm text-foreground mt-1 italic">"{entry.note}"</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground">Activity Log</CardTitle>
              <CardDescription>All actions taken on this case</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...caseData.activityLog].reverse().map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-2 hover:bg-muted/30 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{log.userName}</span>
                        <span className="text-muted-foreground"> ({log.userRole})</span>
                      </p>
                      <p className="text-sm text-foreground">{log.action}: {log.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <MessageSquare className="w-5 h-5 text-primary" />
                Comments & Messages
              </CardTitle>
              <CardDescription>
                Communication history for this case
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client Preset Messages */}
              {user?.role === 'client' && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">Quick Messages:</p>
                  <div className="flex flex-wrap gap-2">
                    {CLIENT_PRESET_MESSAGES.map((msg, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddComment(msg, true)}
                        className="text-xs"
                      >
                        {msg}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment Input (for non-clients) */}
              {user?.role !== 'client' && (
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button
                    onClick={() => handleAddComment(newComment)}
                    disabled={!newComment.trim()}
                    className="bg-gradient-primary"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-3">
                {caseData.comments.length > 0 ? (
                  [...caseData.comments].reverse().map((comment) => (
                    <div
                      key={comment.id}
                      className={cn(
                        'p-3 rounded-lg',
                        comment.userId === user?.id
                          ? 'bg-primary/10 ml-8'
                          : 'bg-muted/30 mr-8'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-foreground">
                          {comment.userName}
                          <Badge variant="outline" className="ml-2 text-xs capitalize">
                            {comment.userRole}
                          </Badge>
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{comment.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No comments yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CaseDetail;
