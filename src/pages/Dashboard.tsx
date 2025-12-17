import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import ClientDashboard from './dashboards/ClientDashboard';
import HospitalDashboard from './dashboards/HospitalDashboard';
import FinanceDashboard from './dashboards/FinanceDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { cases, hospitals, users, getStats, isLoading } = useData();

  const stats = getStats();

  // Filter cases based on user role
  const userCases = React.useMemo(() => {
    if (!user) return [];
    switch (user.role) {
      case 'admin':
        return cases;
      case 'agent':
        return cases.filter(c => c.agentId === user.id);
      case 'client':
        return cases.filter(c => c.clientId === user.id);
      case 'hospital':
        return cases.filter(c => c.assignedHospital === user.hospitalId);
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
      return c.status === 'admin_review';
    }
    if (user?.role === 'agent') {
      return c.status === 'new' || c.status === 'case_agent_review';
    }
    if (user?.role === 'hospital') {
      return c.status === 'hospital_review' || c.status === 'assigned_to_hospital';
    }
    if (user?.role === 'finance') {
      return c.status === 'visa_processing_payments' || c.status === 'credit_payment_upload';
    }
    return false;
  });

  const getStatusBadgeClass = (status: string) => {
    const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'status-neutral';
    return colorClass;
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
                        {STATUS_LABELS[caseItem.status]}
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
                            {hospital ? hospital.name : 'Not assigned'} • {new Date(caseItem.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusBadgeClass(caseItem.status)}>
                          {STATUS_LABELS[caseItem.status]}
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

      {/* Client-specific view */}
      {user?.role === 'client' && userCases.length > 0 && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground">Your Case Status</CardTitle>
            <CardDescription>Track the progress of your medical journey</CardDescription>
          </CardHeader>
          <CardContent>
            {userCases.map((caseItem) => (
              <Link
                key={caseItem.id}
                to={`/cases/${caseItem.id}`}
                className="block p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{caseItem.clientInfo.condition}</h3>
                    <p className="text-sm text-muted-foreground">Case ID: {caseItem.id}</p>
                  </div>
                  <Badge className={getStatusBadgeClass(caseItem.status)}>
                    {STATUS_LABELS[caseItem.status]}
                  </Badge>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-bar-fill" 
                    style={{ 
                      width: `${(Object.keys(STATUS_LABELS).indexOf(caseItem.status) + 1) / Object.keys(STATUS_LABELS).length * 100}%` 
                    }} 
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: {new Date(caseItem.updatedAt).toLocaleString()}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
