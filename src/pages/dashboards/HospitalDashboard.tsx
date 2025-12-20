import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FolderKanban, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Building2,
  Users,
  BedDouble,
  FileText,
  Activity,
  TrendingUp,
  X,
  Upload,
  Calendar,
  Stethoscope,
  Plane,
  FileCheck,
  MessageSquare,
  ArrowRight,
  Filter,
  Search,
} from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS, type Case } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ActivityTimeline from '@/components/cases/ActivityTimeline';

const HospitalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cases, hospitals, updateCaseData, isLoading } = useData();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const assignedCases = useMemo(() => {
    if (!user?.hospitalIds || user.hospitalIds.length === 0) return [];
    return cases.filter(c => 
      c.assignedHospital && 
      user.hospitalIds.includes(c.assignedHospital)
    );
  }, [user, cases]);

  // Get all hospitals assigned to this agent
  const assignedHospitals = useMemo(() => {
    if (!user?.hospitalIds) return [];
    return hospitals.filter(h => user.hospitalIds.includes(h.id));
  }, [user, hospitals]);

  // Filter cases
  const filteredCases = useMemo(() => {
    let filtered = assignedCases;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.clientInfo.name.toLowerCase().includes(query) ||
        c.clientInfo.condition.toLowerCase().includes(query) ||
        c.clientInfo.passport?.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [assignedCases, statusFilter, searchQuery]);

  // Cases by status
  const casesByStatus = useMemo(() => {
    return {
      review: assignedCases.filter(c => c.status === 'hospital_review' || c.status === 'assigned_to_hospital'),
      accepted: assignedCases.filter(c => c.status === 'case_accepted' || c.status === 'treatment_plan_uploaded'),
      inProgress: assignedCases.filter(c => 
        c.status === 'treatment_in_progress' || 
        c.status === 'frro_registration' ||
        c.status === 'admit_format_uploaded'
      ),
      discharge: assignedCases.filter(c => c.status === 'final_report_medicine' || c.status === 'discharge_process'),
      completed: assignedCases.filter(c => c.status === 'case_closed'),
    };
  }, [assignedCases]);

  // Urgent cases (high priority or pending for more than 3 days)
  const urgentCases = useMemo(() => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return assignedCases.filter(c => 
      c.priority === 'urgent' || 
      (casesByStatus.review.includes(c) && new Date(c.updatedAt) < threeDaysAgo)
    );
  }, [assignedCases, casesByStatus.review]);

  const getStatusBadgeClass = (status: string) => {
    const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'status-neutral';
    return colorClass;
  };

  // Calculate bed availability across all assigned hospitals
  const bedAvailability = useMemo(() => {
    if (assignedHospitals.length === 0) return { available: 0, total: 0, occupied: 0, percentage: 0 };
    
    const totalCapacity = assignedHospitals.reduce((sum, h) => sum + h.bedCapacity, 0);
    const totalAvailable = assignedHospitals.reduce((sum, h) => sum + h.availableBeds, 0);
    const occupied = assignedCases.filter(c => 
      c.status === 'treatment_in_progress' || 
      c.status === 'admit_format_uploaded' ||
      c.status === 'frro_registration'
    ).length;
    const available = totalAvailable - occupied;
    const percentage = totalCapacity > 0 
      ? ((totalCapacity - available) / totalCapacity) * 100 
      : 0;
    return {
      available: Math.max(0, available),
      total: totalCapacity,
      occupied,
      percentage: Math.round(percentage),
    };
  }, [assignedHospitals, assignedCases]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    const completed = casesByStatus.completed.length;
    const avgDays = assignedCases.length > 0 
      ? assignedCases
          .filter(c => c.status === 'case_closed')
          .reduce((acc, c) => {
            const created = new Date(c.createdAt);
            const closed = new Date(c.updatedAt);
            const days = Math.ceil((closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            return acc + days;
          }, 0) / completed || 0
      : 0;
    
    return {
      completed,
      avgDays: Math.round(avgDays),
      acceptanceRate: assignedCases.length > 0 
        ? Math.round((casesByStatus.accepted.length / assignedCases.length) * 100)
        : 0,
    };
  }, [assignedCases, casesByStatus]);

  const handleAcceptCase = async () => {
    if (!selectedCase) return;
    
    try {
      await updateCaseData(selectedCase.id, {
        status: 'case_accepted',
        statusHistory: [
          ...(selectedCase.statusHistory || []),
          {
            status: 'case_accepted',
            timestamp: new Date().toISOString(),
            by: user?.id || '',
            notes: 'Case accepted by hospital agent',
          },
        ],
      });
      
      toast({
        title: 'Case Accepted',
        description: `Case ${selectedCase.id.slice(-8).toUpperCase()} has been accepted`,
      });
      
      setIsAcceptDialogOpen(false);
      setSelectedCase(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept case',
        variant: 'destructive',
      });
    }
  };

  const handleRejectCase = async () => {
    if (!selectedCase || !rejectReason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await updateCaseData(selectedCase.id, {
        status: 'case_rejected',
        statusHistory: [
          ...(selectedCase.statusHistory || []),
          {
            status: 'case_rejected',
            timestamp: new Date().toISOString(),
            by: user?.id || '',
            notes: `Rejected: ${rejectReason}`,
          },
        ],
      });
      
      toast({
        title: 'Case Rejected',
        description: `Case ${selectedCase.id.slice(-8).toUpperCase()} has been rejected`,
      });
      
      setIsRejectDialogOpen(false);
      setSelectedCase(null);
      setRejectReason('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject case',
        variant: 'destructive',
      });
    }
  };

  const openAcceptDialog = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsAcceptDialogOpen(true);
  };

  const openRejectDialog = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setIsRejectDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Hospital Agent Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {currentHospital?.name || 'Hospital Agent'} - Manage hospital-related cases and activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/cases">
              <FileText className="w-4 h-4 mr-2" />
              View All Cases
            </Link>
          </Button>
        </div>
      </div>

      {/* Urgent Cases Alert */}
      {urgentCases.length > 0 && (
        <Card className="card-elevated border-medical-urgent/30 bg-medical-urgent/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-medical-urgent" />
                <div>
                  <p className="font-medium text-foreground">
                    {urgentCases.length} Urgent Case{urgentCases.length > 1 ? 's' : ''} Requiring Attention
                  </p>
                  <p className="text-sm text-muted-foreground">
                    High priority cases or cases pending review for more than 3 days
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/cases?priority=urgent">
                  Review Urgent Cases
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Assigned</p>
                <p className="text-3xl font-bold text-foreground mt-1">{assignedCases.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-3xl font-bold text-foreground mt-1">{casesByStatus.review.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-medical-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-medical-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Treatment</p>
                <p className="text-3xl font-bold text-foreground mt-1">{casesByStatus.inProgress.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-medical-info/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-medical-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bed Availability</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {bedAvailability.available} / {bedAvailability.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-medical-safe/10 flex items-center justify-center">
                <BedDouble className="w-6 h-6 text-medical-safe" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-foreground mt-1">{casesByStatus.completed.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                <p className="text-3xl font-bold text-foreground mt-1">{performanceMetrics.acceptanceRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Treatment Days</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {performanceMetrics.avgDays > 0 ? performanceMetrics.avgDays : 'N/A'}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-medical-info opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                <p className="text-3xl font-bold text-foreground mt-1">{bedAvailability.percentage}%</p>
              </div>
              <Building2 className="w-8 h-8 text-secondary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search cases by name, condition, passport, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="hospital_review">Pending Review</SelectItem>
                <SelectItem value="assigned_to_hospital">Assigned</SelectItem>
                <SelectItem value="case_accepted">Accepted</SelectItem>
                <SelectItem value="treatment_plan_uploaded">Treatment Plan</SelectItem>
                <SelectItem value="treatment_in_progress">In Treatment</SelectItem>
                <SelectItem value="frro_registration">FRRO Registration</SelectItem>
                <SelectItem value="discharge_process">Discharge</SelectItem>
                <SelectItem value="case_closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cases Requiring Review - Enhanced */}
        {casesByStatus.review.length > 0 && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-medical-warning" />
                Cases Requiring Review
              </CardTitle>
              <CardDescription>Review and accept/reject assigned cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {casesByStatus.review
                  .sort((a, b) => {
                    // Prioritize urgent cases
                    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
                    if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                  })
                  .slice(0, 5)
                  .map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="p-3 rounded-lg border border-medical-warning/20 bg-medical-warning/5 hover:bg-medical-warning/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-foreground text-sm">{caseItem.clientInfo.name}</p>
                            {caseItem.priority === 'urgent' && (
                              <Badge variant="outline" className="bg-medical-urgent/10 text-medical-urgent border-medical-urgent/30 text-xs">
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{caseItem.clientInfo.condition}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>ID: {caseItem.id.slice(-8).toUpperCase()}</span>
                            <span>•</span>
                            <span>{new Date(caseItem.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => openAcceptDialog(caseItem)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                            onClick={() => openRejectDialog(caseItem)}
                          >
                            <X className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => navigate(`/cases/${caseItem.id}`)}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                <Button asChild variant="outline" className="w-full">
                  <Link to="/cases?status=hospital_review">View All Cases Requiring Review</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                asChild
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
              >
                <Link to="/cases?status=treatment_plan_uploaded">
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Upload Treatment Plan</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
              >
                <Link to="/cases?status=frro_registration">
                  <FileCheck className="w-5 h-5" />
                  <span className="text-xs">FRRO Registration</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
              >
                <Link to="/cases?status=treatment_in_progress">
                  <Stethoscope className="w-5 h-5" />
                  <span className="text-xs">Update Progress</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
              >
                <Link to="/cases?status=discharge_process">
                  <FileText className="w-5 h-5" />
                  <span className="text-xs">Discharge Summary</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Cases Queue */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              Assigned Cases Queue
            </CardTitle>
            <CardDescription>All your assigned cases</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredCases.length > 0 ? (
              <div className="space-y-3">
                {filteredCases
                  .sort((a, b) => {
                    // Prioritize cases needing review
                    const aPriority = casesByStatus.review.includes(a) ? 0 : 1;
                    const bPriority = casesByStatus.review.includes(b) ? 0 : 1;
                    if (aPriority !== bPriority) return aPriority - bPriority;
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                  })
                  .slice(0, 8)
                  .map((caseItem) => (
                    <Link
                      key={caseItem.id}
                      to={`/cases/${caseItem.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          casesByStatus.review.includes(caseItem) 
                            ? "bg-medical-warning/10" 
                            : "bg-primary/10"
                        )}>
                          <FileText className={cn(
                            "w-5 h-5",
                            casesByStatus.review.includes(caseItem) 
                              ? "text-medical-warning" 
                              : "text-primary"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{caseItem.clientInfo.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{caseItem.clientInfo.condition}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusBadgeClass(caseItem.status)}>
                          {STATUS_LABELS[caseItem.status]}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </Link>
                  ))}
                <Button asChild variant="outline" className="w-full mt-3">
                  <Link to="/cases">View All Cases</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No cases found</p>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bed Availability */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-primary" />
              Bed Availability
            </CardTitle>
            <CardDescription>Current bed capacity and occupancy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                <span className="text-sm font-semibold text-foreground">{bedAvailability.percentage}%</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    bedAvailability.percentage > 80 ? "bg-medical-urgent" :
                    bedAvailability.percentage > 60 ? "bg-medical-warning" :
                    "bg-medical-safe"
                  )}
                  style={{ width: `${bedAvailability.percentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-xl font-bold text-medical-safe">{bedAvailability.available}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Occupied</p>
                <p className="text-xl font-bold text-foreground">{bedAvailability.occupied}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold text-foreground">{bedAvailability.total}</p>
              </div>
            </div>

            {bedAvailability.percentage > 80 && (
              <div className="p-3 bg-medical-urgent/10 border border-medical-urgent/20 rounded-lg">
                <p className="text-xs text-medical-urgent font-medium">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  High occupancy - Limited beds available
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Treatment in Progress */}
        {casesByStatus.inProgress.length > 0 && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-medical-info" />
                Treatment in Progress
              </CardTitle>
              <CardDescription>Active patient cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {casesByStatus.inProgress.slice(0, 5).map((caseItem) => (
                  <Link
                    key={caseItem.id}
                    to={`/cases/${caseItem.id}`}
                    className="block p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{caseItem.clientInfo.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {caseItem.treatmentPlan?.proposedTreatment || 'Treatment in progress'}
                        </p>
                      </div>
                      <Badge variant="outline" className={getStatusBadgeClass(caseItem.status)}>
                        {STATUS_LABELS[caseItem.status]}
                      </Badge>
                    </div>
                  </Link>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link to="/cases?status=treatment_in_progress">View All Active Cases</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patient Manifest */}
        {assignedCases.filter(c => c.status === 'patient_manifest' || c.status === 'admit_format_uploaded').length > 0 && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Patient Manifest
              </CardTitle>
              <CardDescription>Patients arriving or recently arrived</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {assignedCases
                  .filter(c => c.status === 'patient_manifest' || c.status === 'admit_format_uploaded')
                  .slice(0, 5)
                  .map((caseItem) => (
                    <Link
                      key={caseItem.id}
                      to={`/cases/${caseItem.id}`}
                      className="block p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{caseItem.clientInfo.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Passport: {caseItem.clientInfo.passport} • {caseItem.clientInfo.condition}
                          </p>
                          {caseItem.attenderInfo && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              Attender: {caseItem.attenderInfo.name}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className={getStatusBadgeClass(caseItem.status)}>
                          {STATUS_LABELS[caseItem.status]}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                <Button asChild variant="outline" className="w-full">
                  <Link to="/cases?status=patient_manifest">View All Patients</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complete Case Information with Activity Timeline */}
        {filteredCases.length > 0 && (
          <Card className="card-elevated lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Case Details & Activity Timeline
              </CardTitle>
              <CardDescription>Complete information and activity tracking for assigned cases</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={filteredCases[0]?.id || 'none'} className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-h-[200px] overflow-y-auto">
                  {filteredCases.slice(0, 5).map((caseItem) => (
                    <TabsTrigger key={caseItem.id} value={caseItem.id} className="text-xs">
                      {caseItem.clientInfo.name.slice(0, 15)}...
                    </TabsTrigger>
                  ))}
                </TabsList>
                {filteredCases.slice(0, 5).map((caseItem) => (
                  <TabsContent key={caseItem.id} value={caseItem.id} className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Case ID</p>
                          <p className="text-sm font-medium text-foreground">{caseItem.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Patient Name</p>
                          <p className="text-sm font-medium text-foreground">{caseItem.clientInfo.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                          <Badge variant="outline" className={getStatusBadgeClass(caseItem.status)}>
                            {STATUS_LABELS[caseItem.status]}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Medical Condition</p>
                          <p className="text-sm text-foreground">{caseItem.clientInfo.condition}</p>
                        </div>
                        {caseItem.treatmentPlan && (
                          <>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Treatment</p>
                              <p className="text-sm text-foreground">{caseItem.treatmentPlan.proposedTreatment}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Estimated Duration</p>
                              <p className="text-sm text-foreground">{caseItem.treatmentPlan.estimatedDuration}</p>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Priority</p>
                          <Badge variant="outline" className={
                            caseItem.priority === 'urgent' ? 'bg-medical-urgent/10 text-medical-urgent border-medical-urgent/30' :
                            caseItem.priority === 'high' ? 'bg-medical-warning/10 text-medical-warning border-medical-warning/30' :
                            'bg-muted'
                          }>
                            {caseItem.priority}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Documents</p>
                          <p className="text-sm text-foreground">{caseItem.documents.length} document(s)</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Comments</p>
                          <p className="text-sm text-foreground">{caseItem.comments.length} message(s)</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Payments</p>
                          <p className="text-sm text-foreground">{caseItem.payments.length} payment(s)</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                          <p className="text-sm text-foreground">{new Date(caseItem.updatedAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    <ActivityTimeline caseData={caseItem} compact={true} />
                    <Button asChild variant="outline" className="w-full">
                      <Link to={`/cases/${caseItem.id}`}>
                        View Full Case Details & Edit
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Accept Case Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Accept Case</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this case? You will be able to upload treatment plans and manage the case.
            </DialogDescription>
          </DialogHeader>
          {selectedCase && (
            <div className="py-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm text-foreground">{selectedCase.clientInfo.name}</p>
                <p className="text-xs text-muted-foreground">{selectedCase.clientInfo.condition}</p>
                <p className="text-xs text-muted-foreground mt-1">Case ID: {selectedCase.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcceptDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcceptCase} className="bg-gradient-primary">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Accept Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Case Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Reject Case</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this case. The case will be returned to admin for reassignment.
            </DialogDescription>
          </DialogHeader>
          {selectedCase && (
            <div className="py-4 space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium text-sm text-foreground">{selectedCase.clientInfo.name}</p>
                <p className="text-xs text-muted-foreground">{selectedCase.clientInfo.condition}</p>
                <p className="text-xs text-muted-foreground mt-1">Case ID: {selectedCase.id.slice(-8).toUpperCase()}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Rejection Reason *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full min-h-[100px] p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsRejectDialogOpen(false);
              setRejectReason('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleRejectCase} 
              variant="destructive"
              disabled={!rejectReason.trim()}
            >
              <X className="w-4 h-4 mr-2" />
              Reject Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HospitalDashboard;
