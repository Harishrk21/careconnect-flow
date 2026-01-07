import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  DollarSign,
  TrendingUp,
  FileText,
  FolderKanban,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS, type Case, type PaymentRecord } from '@/types';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ActivityTimeline from '@/components/cases/ActivityTimeline';

interface PaymentWithCase extends PaymentRecord {
  caseId: string;
  patientName: string;
}

const FinanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const { cases, isLoading } = useData();

  // Filter payment-related cases (both hospital and university cases)
  const paymentCases = useMemo(() => {
    return cases.filter(c => 
      c.status === 'visa_processing_payments' || 
      c.status === 'credit_payment_upload' ||
      c.payments.length > 0
    );
  }, [cases]);

  // Flatten all payments
  const allPayments = useMemo(() => {
    const payments: PaymentWithCase[] = [];
    paymentCases.forEach((caseItem) => {
      caseItem.payments.forEach((payment) => {
        payments.push({
          ...payment,
          caseId: caseItem.id,
          patientName: caseItem.clientInfo.name,
        });
      });
    });
    return payments;
  }, [paymentCases]);

  const pendingPayments = allPayments.filter(p => p.status === 'pending');
  const completedPayments = allPayments.filter(p => p.status === 'completed');
  const failedPayments = allPayments.filter(p => p.status === 'failed');

  // Calculate financial stats
  const financialStats = useMemo(() => {
    const totalAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    
    const byCurrency = completedPayments.reduce((acc, p) => {
      acc[p.currency] = (acc[p.currency] || 0) + p.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAmount,
      pendingAmount,
      byCurrency,
      totalPayments: allPayments.length,
      completed: completedPayments.length,
      pending: pendingPayments.length,
      failed: failedPayments.length,
    };
  }, [completedPayments, pendingPayments, allPayments.length]);

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
          <h1 className="text-3xl font-display font-bold text-foreground">Finance Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage payments and financial operations
          </p>
        </div>
        <Button asChild className="bg-gradient-primary">
          <Link to="/payments">
            <CreditCard className="w-4 h-4 mr-2" />
            View All Payments
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Processed</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  ${financialStats.totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-medical-safe/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-medical-safe" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-3xl font-bold text-foreground mt-1">{financialStats.pending}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-medical-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-medical-warning" />
              </div>
            </div>
            {financialStats.pendingAmount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                ${financialStats.pendingAmount.toLocaleString()} pending
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-foreground mt-1">{financialStats.completed}</p>
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
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-3xl font-bold text-foreground mt-1">{financialStats.totalPayments}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Processing Queue */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-medical-warning" />
              Payment Processing Queue
            </CardTitle>
            <CardDescription>Payments awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingPayments.length > 0 ? (
              <div className="space-y-3">
                {pendingPayments.slice(0, 5).map((payment) => (
                  <Link
                    key={`${payment.caseId}-${payment.id}`}
                    to={`/payments`}
                    className="flex items-center justify-between p-3 rounded-lg bg-medical-warning/5 border border-medical-warning/20 hover:bg-medical-warning/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-medical-warning/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-medical-warning" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{payment.patientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.type} • {payment.currency} {payment.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-medical-warning/20 text-medical-warning border-0">
                      Pending
                    </Badge>
                  </Link>
                ))}
                <Button asChild variant="outline" className="w-full mt-3">
                  <Link to="/payments">Process All Payments</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No pending payments</p>
                <p className="text-xs mt-1">All payments have been processed</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Completed Payments */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-medical-safe" />
              Recent Completed Payments
            </CardTitle>
            <CardDescription>Recently processed payments</CardDescription>
          </CardHeader>
          <CardContent>
            {completedPayments.length > 0 ? (
              <div className="space-y-3">
                {completedPayments
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((payment) => (
                    <Link
                      key={`${payment.caseId}-${payment.id}`}
                      to={`/payments`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-medical-safe/10 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-medical-safe" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{payment.patientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.currency} {payment.amount.toLocaleString()} • {new Date(payment.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-medical-safe/20 text-medical-safe border-0">
                        Completed
                      </Badge>
                    </Link>
                  ))}
                <Button asChild variant="outline" className="w-full mt-3">
                  <Link to="/payments">View All Payments</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No completed payments yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Currency Breakdown */}
        {Object.keys(financialStats.byCurrency).length > 0 && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Currency Breakdown
              </CardTitle>
              <CardDescription>Total processed by currency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(financialStats.byCurrency)
                  .sort((a, b) => b[1] - a[1])
                  .map(([currency, amount]) => (
                    <div key={currency} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{currency}</span>
                      </div>
                      <span className="text-lg font-bold text-foreground">
                        {currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency} {amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cases Requiring Payment Processing */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              Cases Requiring Payment
            </CardTitle>
            <CardDescription>Cases in payment processing stages</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentCases.length > 0 ? (
              <div className="space-y-3">
                {paymentCases
                  .filter(c => c.status === 'visa_processing_payments' || c.status === 'credit_payment_upload')
                  .slice(0, 5)
                  .map((caseItem) => (
                    <Link
                      key={caseItem.id}
                      to={`/cases/${caseItem.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FolderKanban className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{caseItem.clientInfo.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {caseItem.payments.length} payment(s) • {STATUS_LABELS[caseItem.status]}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusBadgeClass(caseItem.status)}>
                        {STATUS_LABELS[caseItem.status]}
                      </Badge>
                    </Link>
                  ))}
                <Button asChild variant="outline" className="w-full mt-3">
                  <Link to="/cases">View All Cases</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No cases requiring payment processing</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Complete Case Information with Activity Timeline */}
        {paymentCases.length > 0 && (
          <Card className="card-elevated lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Case Details & Activity Timeline
              </CardTitle>
              <CardDescription>Complete information and activity tracking for payment-related cases</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={paymentCases[0]?.id || 'none'} className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-h-[200px] overflow-y-auto">
                  {paymentCases.slice(0, 5).map((caseItem) => (
                    <TabsTrigger key={caseItem.id} value={caseItem.id} className="text-xs">
                      {caseItem.clientInfo.name.slice(0, 15)}...
                    </TabsTrigger>
                  ))}
                </TabsList>
                {paymentCases.slice(0, 5).map((caseItem) => (
                  <TabsContent key={caseItem.id} value={caseItem.id} className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Case ID</p>
                          <p className="text-sm font-medium text-foreground">{caseItem.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{caseItem.assignedUniversity ? 'Student Name' : 'Patient Name'}</p>
                          <p className="text-sm font-medium text-foreground">{caseItem.clientInfo.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                          <Badge variant="outline" className={getStatusBadgeClass(caseItem.status)}>
                            {getStatusLabel(caseItem.status, caseItem)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{caseItem.assignedUniversity ? 'Course/Program' : 'Medical Condition'}</p>
                          <p className="text-sm text-foreground">{caseItem.clientInfo.condition}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Payments</p>
                          <p className="text-sm font-medium text-foreground">
                            {caseItem.payments.length} payment(s) • Total: {
                              caseItem.payments
                                .filter(p => p.status === 'completed')
                                .reduce((sum, p) => sum + p.amount, 0)
                                .toLocaleString()
                            }
                          </p>
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
                          <p className="text-xs text-muted-foreground mb-1">Visa Status</p>
                          <p className="text-sm text-foreground">
                            {caseItem.visa?.status ? caseItem.visa.status.replace('_', ' ').toUpperCase() : 'Not Started'}
                          </p>
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
                        View Full Case Details & Process Payments
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
    </div>
  );
};

export default FinanceDashboard;
