import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FolderKanban, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  ArrowRight,
  Users,
  Building2,
  FileText,
  Plus,
  Eye,
  Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { STATUS_LABELS, STATUS_COLORS, type Case } from '@/types';
import ClientDashboard from './dashboards/ClientDashboard';
import HospitalDashboard from './dashboards/HospitalDashboard';
import FinanceDashboard from './dashboards/FinanceDashboard';
import ActivityTimeline from '@/components/cases/ActivityTimeline';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { cases, hospitals, universities, users, getStats, isLoading } = useData();

  const stats = getStats();

  // Filter cases based on user role
  const userCases = React.useMemo(() => {
    if (!user) return [];
    switch (user.role) {
      case 'admin':
        return cases;
      case 'agent':
        // Filter by agent ID and agent type (hospital or university)
        return cases.filter(c => {
          if (c.agentId !== user.id) return false;
          // If agent has agentType, filter cases by type
          if (user.agentType === 'hospital') {
            return !c.assignedUniversity; // Hospital agents only see hospital cases
          } else if (user.agentType === 'university') {
            return !!c.assignedUniversity; // University agents only see university cases
          }
          // If no agentType set (legacy), show all cases
          return true;
        });
      case 'client':
        return cases.filter(c => c.clientId === user.id);
      case 'hospital':
        // Hospital users should only see hospital cases (not university cases)
        return cases.filter(c => 
          c.assignedHospital && 
          !c.assignedUniversity && // Exclude university cases
          (user.hospitalIds || []).includes(c.assignedHospital)
        );
      case 'university':
        // University users should only see university cases (not hospital cases)
        return cases.filter(c => 
          c.assignedUniversity && 
          !c.assignedHospital && // Exclude hospital cases
          (user.universityIds || []).includes(c.assignedUniversity)
        );
      case 'finance':
        return cases.filter(c => 
          c.status === 'visa_processing_payments' || 
          c.status === 'credit_payment_upload'
        );
      default:
        return [];
    }
  }, [user, cases]);

  const recentCases = userCases
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const pendingActionCases = userCases.filter(c => {
    if (user?.role === 'admin') {
      return c.status === 'admin_review' || c.status === 'case_agent_review';
    }
    if (user?.role === 'agent') {
      return c.status === 'new' || c.status === 'case_agent_review';
    }
    if (user?.role === 'hospital') {
      return c.status === 'hospital_review' || c.status === 'assigned_to_hospital';
    }
    if (user?.role === 'university') {
      return c.status === 'hospital_review' || c.status === 'assigned_to_hospital';
    }
    if (user?.role === 'finance') {
      return c.status === 'visa_processing_payments' || c.status === 'credit_payment_upload' || c.payments.length > 0;
    }
    return false;
  });

  const getStatusBadgeClass = (status: string) => {
    const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'status-neutral';
    return colorClass;
  };

  // Helper to get context-aware status labels
  const getStatusLabel = (status: string, caseItem?: Case): string => {
    const isUniCase = caseItem ? !!caseItem.assignedUniversity : false;
    if (status === 'assigned_to_hospital') {
      return isUniCase ? 'Assigned to University' : 'Assigned to Hospital';
    }
    if (status === 'hospital_review') {
      return isUniCase ? 'University Review' : 'Hospital Review';
    }
    return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  // Route to role-specific dashboard
  if (user?.role === 'client') {
    return <ClientDashboard />;
  }
  
  if (user?.role === 'hospital') {
    return <HospitalDashboard />;
  }
  
  if (user?.role === 'finance') {
    return <FinanceDashboard />;
  }

  // Generic dashboard for other roles (will be replaced with role-specific dashboards)
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your cases today
          </p>
        </div>
        {(user?.role === 'agent' || user?.role === 'admin') && (
          <Button asChild className="bg-gradient-primary hover:opacity-90">
            <Link to="/cases/new">
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cases</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
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
                <p className="text-sm text-muted-foreground">Active Cases</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.active}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-medical-info/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-medical-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-medical-safe/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-medical-safe" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stats.urgent}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-medical-urgent/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-medical-urgent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin-specific stats */}
      {user?.role === 'admin' && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Partner Hospitals</p>
                  <p className="text-2xl font-bold text-foreground">{hospitals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-medical-warning/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-medical-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-foreground">{pendingActionCases.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Actions */}
        {pendingActionCases.length > 0 && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertTriangle className="w-5 h-5 text-medical-warning" />
                Requires Your Action
              </CardTitle>
              <CardDescription>Cases that need your immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingActionCases.slice(0, 5).map((caseItem) => (
                  <Link
                    key={caseItem.id}
                    to={`/cases/${caseItem.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-medical-warning/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-medical-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{caseItem.clientInfo.name}</p>
                        <p className="text-xs text-muted-foreground">{caseItem.clientInfo.condition}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusBadgeClass(caseItem.status)}>
                        {getStatusLabel(caseItem.status, caseItem)}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Cases */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest updates on your cases</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                <Link to="/cases">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCases.length > 0 ? (
                recentCases.map((caseItem) => {
                  const hospital = hospitals.find(h => h.id === caseItem.assignedHospital);
                  const university = universities.find(u => u.id === caseItem.assignedUniversity);
                  const isUniversityCase = !!caseItem.assignedUniversity;
                  return (
                    <Link
                      key={caseItem.id}
                      to={`/cases/${caseItem.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderKanban className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{caseItem.clientInfo.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {isUniversityCase && university 
                              ? `${university.name} (University)` 
                              : hospital 
                              ? `${hospital.name} (Hospital)` 
                              : 'Not assigned'} • {new Date(caseItem.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusBadgeClass(caseItem.status)}>
                          {getStatusLabel(caseItem.status, caseItem)}
                        </Badge>
                        <Eye className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No cases yet</p>
                  {(user?.role === 'agent' || user?.role === 'admin') && (
                    <Button asChild variant="link" className="mt-2 text-primary">
                      <Link to="/cases/new">Create your first case</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complete Case Information with Activity Timeline - For Admin/Agent */}
      {(user?.role === 'admin' || user?.role === 'agent') && recentCases.length > 0 && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Case Details & Activity Timeline
            </CardTitle>
            <CardDescription>Complete information and activity tracking for your cases</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={recentCases[0]?.id || 'none'} className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-h-[200px] overflow-y-auto">
                {recentCases.slice(0, 5).map((caseItem) => (
                  <TabsTrigger key={caseItem.id} value={caseItem.id} className="text-xs">
                    {caseItem.clientInfo.name.slice(0, 15)}...
                  </TabsTrigger>
                ))}
              </TabsList>
              {recentCases.slice(0, 5).map((caseItem) => (
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
                          {getStatusLabel(caseItem.status, caseItem)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Medical Condition</p>
                        <p className="text-sm text-foreground">{caseItem.clientInfo.condition}</p>
                      </div>
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
                        <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                        <p className="text-sm text-foreground">{new Date(caseItem.updatedAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Comments</p>
                        <p className="text-sm text-foreground">{caseItem.comments.length} message(s)</p>
                      </div>
                    </div>
                  </div>
                  <ActivityTimeline caseData={caseItem} compact={true} />
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/cases/${caseItem.id}`}>
                      View Full Case Details
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
  );
};

export default Dashboard;
