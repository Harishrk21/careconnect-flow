import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FolderKanban, 
  Clock, 
  CheckCircle2, 
  Calendar,
  Plane,
  CreditCard,
  FileText,
  Stethoscope,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS, STATUS_FLOW, type Case } from '@/types';
import { cn } from '@/lib/utils';

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { cases, isLoading } = useData();

  const clientCases = useMemo(() => {
    if (!user) return [];
    return cases.filter(c => c.clientId === user.id);
  }, [user, cases]);

  const activeCase = clientCases.find(c => c.status !== 'case_closed') || clientCases[0];

  const getStatusBadgeClass = (status: string) => {
    const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'status-neutral';
    return colorClass;
  };

  const getProgressPercentage = (caseItem: Case): number => {
    const currentIndex = STATUS_FLOW.indexOf(caseItem.status);
    return ((currentIndex + 1) / STATUS_FLOW.length) * 100;
  };

  const getNextMilestone = (caseItem: Case): string => {
    const currentIndex = STATUS_FLOW.indexOf(caseItem.status);
    if (currentIndex < STATUS_FLOW.length - 1) {
      return STATUS_LABELS[STATUS_FLOW[currentIndex + 1]];
    }
    return 'Case Completed';
  };

  // Extract travel information from comments (ticket booking)
  const getTravelInfo = (caseItem: Case) => {
    const travelComment = caseItem.comments.find(c => 
      c.message.includes('Ticket Booking Details') || c.message.includes('Flight:')
    );
    return travelComment?.message || null;
  };

  // Extract appointment info (simulated from treatment plan)
  const getAppointmentInfo = (caseItem: Case) => {
    if (caseItem.treatmentPlan) {
      return {
        treatment: caseItem.treatmentPlan.proposedTreatment,
        duration: caseItem.treatmentPlan.estimatedDuration,
        hospital: caseItem.assignedHospital,
      };
    }
    return null;
  };

  // Calculate payment status
  const getPaymentStatus = (caseItem: Case) => {
    const totalPayments = caseItem.payments.length;
    const completedPayments = caseItem.payments.filter(p => p.status === 'completed').length;
    const pendingPayments = caseItem.payments.filter(p => p.status === 'pending').length;
    const totalAmount = caseItem.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    
    return {
      total: totalPayments,
      completed: completedPayments,
      pending: pendingPayments,
      totalAmount,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (clientCases.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderKanban className="w-16 h-16 mx-auto mb-4 opacity-30 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground mb-2">No Cases Found</h2>
        <p className="text-muted-foreground">Your medical coordinator will create a case for you soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">My Medical Journey</h1>
        <p className="text-muted-foreground mt-1">
          Track your case progress and stay updated
        </p>
      </div>

      {/* Active Case Progress Tracker */}
      {activeCase && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Case Progress
            </CardTitle>
            <CardDescription>
              Current status: {STATUS_LABELS[activeCase.status]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(getProgressPercentage(activeCase))}%</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-primary transition-all duration-500"
                  style={{ width: `${getProgressPercentage(activeCase)}%` }}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Current Stage</p>
                <Badge variant="outline" className={getStatusBadgeClass(activeCase.status)}>
                  {STATUS_LABELS[activeCase.status]}
                </Badge>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Next Milestone</p>
                <p className="text-sm font-medium text-foreground">{getNextMilestone(activeCase)}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(activeCase.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <Button asChild className="w-full bg-gradient-primary">
              <Link to={`/cases/${activeCase.id}`}>
                View Full Case Details
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Treatment Plan & Appointment */}
        {activeCase && getAppointmentInfo(activeCase) && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Treatment Information
              </CardTitle>
              <CardDescription>Your treatment plan and appointment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeCase.treatmentPlan && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Treatment</p>
                    <p className="text-sm font-medium text-foreground">{activeCase.treatmentPlan.proposedTreatment}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Duration</p>
                    <p className="text-sm font-medium text-foreground">{activeCase.treatmentPlan.estimatedDuration}</p>
                  </div>
                  {activeCase.assignedHospital && (
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned Hospital</p>
                      <p className="text-sm font-medium text-foreground">Hospital ID: {activeCase.assignedHospital.slice(-7).toUpperCase()}</p>
                    </div>
                  )}
                </>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link to={`/cases/${activeCase.id}`}>
                  View Full Treatment Plan
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Status */}
        {activeCase && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Payment Status
              </CardTitle>
              <CardDescription>Track your payment records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeCase.payments.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Total Payments</p>
                      <p className="text-lg font-bold text-foreground">{getPaymentStatus(activeCase).total}</p>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-lg font-bold text-medical-safe">{getPaymentStatus(activeCase).completed}</p>
                    </div>
                  </div>
                  {getPaymentStatus(activeCase).pending > 0 && (
                    <div className="p-3 bg-medical-warning/10 border border-medical-warning/20 rounded-lg">
                      <p className="text-xs text-medical-warning font-medium">
                        {getPaymentStatus(activeCase).pending} payment(s) pending
                      </p>
                    </div>
                  )}
                  {getPaymentStatus(activeCase).totalAmount > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Total Paid</p>
                      <p className="text-lg font-bold text-foreground">
                        ${getPaymentStatus(activeCase).totalAmount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No payment records yet</p>
                </div>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link to={`/cases/${activeCase.id}`}>
                  View Payment Details
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Appointment Schedule */}
        {activeCase && getAppointmentInfo(activeCase) && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Appointment Schedule
              </CardTitle>
              <CardDescription>Your treatment schedule and appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeCase.treatmentPlan && (
                <>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Treatment</p>
                    <p className="text-sm font-medium text-foreground">{activeCase.treatmentPlan.proposedTreatment}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Estimated Duration</p>
                    <p className="text-sm font-medium text-foreground">{activeCase.treatmentPlan.estimatedDuration}</p>
                  </div>
                  {activeCase.status === 'treatment_in_progress' && (
                    <div className="p-3 bg-medical-info/10 border border-medical-info/20 rounded-lg">
                      <p className="text-xs text-medical-info font-medium">
                        <Activity className="w-3 h-3 inline mr-1" />
                        Treatment currently in progress
                      </p>
                    </div>
                  )}
                  {activeCase.status === 'treatment_plan_uploaded' && (
                    <div className="p-3 bg-medical-warning/10 border border-medical-warning/20 rounded-lg">
                      <p className="text-xs text-medical-warning font-medium">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Awaiting travel documentation approval
                      </p>
                    </div>
                  )}
                </>
              )}
              <Button asChild variant="outline" className="w-full">
                <Link to={`/cases/${activeCase.id}`}>
                  View Full Treatment Plan
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Travel Itinerary */}
        {activeCase && getTravelInfo(activeCase) && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Plane className="w-5 h-5 text-primary" />
                Travel Itinerary
              </CardTitle>
              <CardDescription>Your flight and travel information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Flight Details</p>
                <p className="text-sm text-foreground whitespace-pre-line">
                  {getTravelInfo(activeCase)?.split('\n').slice(0, 4).join('\n')}
                </p>
              </div>
              <Button asChild variant="outline" className="w-full mt-3">
                <Link to={`/cases/${activeCase.id}`}>
                  View Full Travel Details
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Documents Overview */}
        {activeCase && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Documents
              </CardTitle>
              <CardDescription>Your uploaded documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Documents</p>
                  <p className="text-lg font-bold text-foreground">{activeCase.documents.length}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">With Text</p>
                  <p className="text-lg font-bold text-medical-safe">
                    {activeCase.documents.filter(d => d.extractedText).length}
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to={`/cases/${activeCase.id}`}>
                  View All Documents
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common actions for your case</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button asChild variant="outline" className="justify-start">
              <Link to={`/cases/${activeCase?.id || ''}`}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to={`/cases/${activeCase?.id || ''}`}>
                <FileText className="w-4 h-4 mr-2" />
                View Documents
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to={`/cases/${activeCase?.id || ''}`}>
                <Activity className="w-4 h-4 mr-2" />
                View Timeline
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/notifications">
                <Clock className="w-4 h-4 mr-2" />
                View Notifications
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboard;
