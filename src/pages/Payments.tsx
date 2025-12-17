import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CreditCard,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  Calendar,
  User,
  FolderKanban,
  Filter,
  Loader2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { STATUS_LABELS, type PaymentRecord, type Case } from '@/types';
import { cn } from '@/lib/utils';

interface PaymentWithCase extends PaymentRecord {
  caseId: string;
  patientName: string;
  caseStatus: string;
}

const Payments: React.FC = () => {
  const { user } = useAuth();
  const { cases, users, addPayment, updatePayment, deletePayment, refreshCases, isLoading } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithCase | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [formData, setFormData] = useState({
    type: 'visa' as PaymentRecord['type'],
    amount: '',
    currency: 'USD',
    status: 'pending' as PaymentRecord['status'],
    method: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [processingData, setProcessingData] = useState({
    verificationNotes: '',
    processingNotes: '',
    finalStatus: 'completed' as 'completed' | 'failed',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter cases based on user role for payment-related cases
  const paymentCases = useMemo(() => {
    if (!user) return [];
    switch (user.role) {
      case 'admin':
        return cases.filter(c => 
          c.status === 'visa_processing_payments' || 
          c.status === 'credit_payment_upload' ||
          c.payments.length > 0
        );
      case 'finance':
        return cases.filter(c => 
          c.status === 'visa_processing_payments' || 
          c.status === 'credit_payment_upload' ||
          c.payments.length > 0
        );
      default:
        return [];
    }
  }, [cases, user]);

  // Flatten all payments from cases
  const allPayments = useMemo(() => {
    const payments: PaymentWithCase[] = [];
    
    paymentCases.forEach((caseItem) => {
      caseItem.payments.forEach((payment) => {
        payments.push({
          ...payment,
          caseId: caseItem.id,
          patientName: caseItem.clientInfo.name,
          caseStatus: caseItem.status,
        });
      });
    });
    
    return payments;
  }, [paymentCases]);

  // Filter payments
  const filteredPayments = useMemo(() => {
    return allPayments.filter((payment) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        searchQuery === '' ||
        payment.patientName.toLowerCase().includes(searchLower) ||
        payment.caseId.toLowerCase().includes(searchLower) ||
        payment.reference.toLowerCase().includes(searchLower) ||
        payment.method.toLowerCase().includes(searchLower) ||
        payment.notes?.toLowerCase().includes(searchLower);
      
      // Type filter
      const matchesType = typeFilter === 'all' || payment.type === typeFilter;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [allPayments, searchQuery, typeFilter, statusFilter]);

  // Payment statistics
  const paymentStats = useMemo(() => {
    const total = allPayments.length;
    const pending = allPayments.filter(p => p.status === 'pending').length;
    const completed = allPayments.filter(p => p.status === 'completed').length;
    const failed = allPayments.filter(p => p.status === 'failed').length;
    
    // Calculate totals by currency
    const totalsByCurrency: Record<string, number> = {};
    allPayments.forEach(p => {
      if (p.status === 'completed') {
        totalsByCurrency[p.currency] = (totalsByCurrency[p.currency] || 0) + p.amount;
      }
    });
    
    const totalAmount = Object.values(totalsByCurrency).reduce((sum, amount) => sum + amount, 0);
    
    return {
      total,
      pending,
      completed,
      failed,
      totalAmount,
      totalsByCurrency,
    };
  }, [allPayments]);

  const resetForm = () => {
    setFormData({
      type: 'visa',
      amount: '',
      currency: 'USD',
      status: 'pending',
      method: '',
      reference: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setSelectedCaseId('');
    setSelectedPayment(null);
  };

  const handleAddPayment = async () => {
    if (!selectedCaseId || !formData.amount || !formData.method || !formData.reference) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addPayment(selectedCaseId, {
        type: formData.type,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        status: formData.status,
        method: formData.method,
        reference: formData.reference,
        date: formData.date,
        processedBy: user?.id,
        notes: formData.notes,
      });
      
      toast({
        title: 'Payment Added',
        description: 'Payment has been added successfully',
      });
      
      setIsAddDialogOpen(false);
      resetForm();
      await refreshCases();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add payment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPayment = (payment: PaymentWithCase) => {
    setSelectedPayment(payment);
    setSelectedCaseId(payment.caseId);
    setFormData({
      type: payment.type,
      amount: payment.amount.toString(),
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      reference: payment.reference,
      date: payment.date,
      notes: payment.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment || !selectedCaseId || !formData.amount || !formData.method) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePayment(selectedCaseId, selectedPayment.id, {
        type: formData.type,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        status: formData.status,
        method: formData.method,
        reference: formData.reference,
        date: formData.date,
        processedBy: user?.id,
        notes: formData.notes,
      });
      
      toast({
        title: 'Payment Updated',
        description: 'Payment has been updated successfully',
      });
      
      setIsEditDialogOpen(false);
      resetForm();
      await refreshCases();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update payment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment || !selectedCaseId) return;

    setIsSubmitting(true);
    try {
      await deletePayment(selectedCaseId, selectedPayment.id);
      
      toast({
        title: 'Payment Deleted',
        description: 'Payment has been deleted',
      });
      
      setIsDeleteDialogOpen(false);
      resetForm();
      await refreshCases();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete payment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovePayment = async (payment: PaymentWithCase) => {
    // Open detailed processing dialog instead of direct approval
    setSelectedPayment(payment);
    setProcessingData({
      verificationNotes: '',
      processingNotes: '',
      finalStatus: 'completed',
    });
    setIsProcessingDialogOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedPayment) return;

    // Validation for failed payments
    if (processingData.finalStatus === 'failed' && !processingData.processingNotes.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for marking this payment as failed',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Combine existing notes with processing notes
      const combinedNotes = [
        selectedPayment.notes,
        processingData.verificationNotes,
        processingData.processingNotes,
      ]
        .filter(Boolean)
        .join('\n\n');

      const updateData: Partial<PaymentRecord> = {
        status: processingData.finalStatus,
        processedBy: user?.id,
        notes: combinedNotes || undefined,
      };

      await updatePayment(selectedPayment.caseId, selectedPayment.id, updateData);
      
      // Check if all payments are completed for workflow advancement
      if (processingData.finalStatus === 'completed') {
        const caseItem = cases.find(c => c.id === selectedPayment.caseId);
        if (caseItem && caseItem.status === 'visa_processing_payments') {
          // Check if all payments are completed
          const allPaymentsCompleted = caseItem.payments.every(p => 
            p.id === selectedPayment.id ? true : p.status === 'completed'
          );
          
          if (allPaymentsCompleted) {
            // All payments completed - notify user
            toast({
              title: 'All Payments Completed',
              description: 'All payments for this case have been processed. Case can proceed to next stage.',
            });
          }
        }
      }
      
      toast({
        title: processingData.finalStatus === 'completed' ? 'Payment Processed' : 'Payment Marked as Failed',
        description: `Payment has been ${processingData.finalStatus === 'completed' ? 'approved and processed successfully' : 'marked as failed'}`,
      });
      
      setIsProcessingDialogOpen(false);
      setSelectedPayment(null);
      setProcessingData({
        verificationNotes: '',
        processingNotes: '',
        finalStatus: 'completed',
      });
      await refreshCases();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-medical-safe/20 text-medical-safe border-0"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge className="bg-medical-warning/20 text-medical-warning border-0"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: PaymentRecord['type']) => {
    const colors: Record<PaymentRecord['type'], string> = {
      visa: 'bg-primary/20 text-primary',
      treatment: 'bg-secondary/20 text-secondary',
      travel: 'bg-medical-info/20 text-medical-info',
      other: 'bg-muted text-muted-foreground',
    };
    return (
      <Badge className={cn('capitalize', colors[type])}>
        {type}
      </Badge>
    );
  };

  const getProcessorName = (userId?: string) => {
    if (!userId) return 'N/A';
    const processor = users.find(u => u.id === userId);
    return processor?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-muted-foreground">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Manage payments, invoices, and financial transactions
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
          className="bg-gradient-primary hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-3xl font-bold text-foreground mt-1">{paymentStats.total}</p>
              </div>
              <CreditCard className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-foreground mt-1">{paymentStats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-medical-warning opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-foreground mt-1">{paymentStats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-medical-safe opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  ${paymentStats.totalAmount.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-medical-safe opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Breakdown */}
      {Object.keys(paymentStats.totalsByCurrency).length > 0 && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground">Total by Currency (Completed Payments)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(paymentStats.totalsByCurrency).map(([currency, amount]) => (
                <div key={currency} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">
                    {currency}
                  </Badge>
                  <span className="font-semibold text-foreground">
                    {currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency} {amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient name, case ID, reference, method, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="treatment">Treatment</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-foreground">All Payments ({filteredPayments.length})</CardTitle>
          <CardDescription>
            Payment records from all cases. Click on a case to view details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length > 0 ? (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case / Patient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Processed By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((payment) => (
                      <TableRow key={`${payment.caseId}-${payment.id}`}>
                        <TableCell>
                          <Link
                            to={`/cases/${payment.caseId}`}
                            className="hover:text-primary transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <FolderKanban className="w-3 h-3 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{payment.patientName}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {payment.caseId.slice(-7).toUpperCase()}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>{getTypeBadge(payment.type)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-foreground">
                              {payment.currency === 'USD' ? '$' : payment.currency === 'INR' ? '₹' : payment.currency} {payment.amount.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">{payment.currency}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{payment.method}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-mono">{payment.reference}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(payment.date).toLocaleDateString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span>{getProcessorName(payment.processedBy)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {payment.status === 'pending' && user?.role === 'finance' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprovePayment(payment)}
                                className="text-medical-safe hover:text-medical-safe"
                                title="Approve payment"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPayment(payment)}
                              title="Edit payment"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive"
                              title="Delete payment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No payments found</p>
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' ? (
                <p className="text-sm mt-1">Try adjusting your filters</p>
              ) : (
                <Button
                  variant="link"
                  onClick={() => {
                    resetForm();
                    setIsAddDialogOpen(true);
                  }}
                  className="mt-2"
                >
                  Add your first payment
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Payment</DialogTitle>
            <DialogDescription>
              Record a new payment for a case
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-case">Select Case *</Label>
              <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                <SelectTrigger id="add-case">
                  <SelectValue placeholder="Select a case" />
                </SelectTrigger>
                <SelectContent>
                  {paymentCases.map((caseItem) => (
                    <SelectItem key={caseItem.id} value={caseItem.id}>
                      {caseItem.clientInfo.name} - {caseItem.id.slice(-7).toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add-type">Payment Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as PaymentRecord['type'] })}
                >
                  <SelectTrigger id="add-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as PaymentRecord['status'] })}
                >
                  <SelectTrigger id="add-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="add-amount">Amount *</Label>
                <Input
                  id="add-amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-currency">Currency *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="add-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-date">Date *</Label>
                <Input
                  id="add-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="add-method">Payment Method *</Label>
                <Input
                  id="add-method"
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  placeholder="Bank Transfer, Credit Card, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-reference">Reference Number *</Label>
                <Input
                  id="add-reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Transaction ID or Reference"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-notes">Notes</Label>
              <Textarea
                id="add-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional payment details..."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddPayment}
              disabled={isSubmitting}
              className="bg-gradient-primary"
            >
              {isSubmitting ? 'Adding...' : 'Add Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Payment</DialogTitle>
            <DialogDescription>
              Update payment information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Payment Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as PaymentRecord['type'] })}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as PaymentRecord['status'] })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount *</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-currency">Currency *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="edit-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-method">Payment Method *</Label>
                <Input
                  id="edit-method"
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reference">Reference Number *</Label>
                <Input
                  id="edit-reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePayment}
              disabled={isSubmitting}
              className="bg-gradient-primary"
            >
              {isSubmitting ? 'Updating...' : 'Update Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment record? This action cannot be undone.
              {selectedPayment && (
                <div className="mt-2 p-2 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Amount:</strong> {selectedPayment.currency} {selectedPayment.amount}
                  </p>
                  <p className="text-sm">
                    <strong>Type:</strong> {selectedPayment.type}
                  </p>
                  <p className="text-sm">
                    <strong>Reference:</strong> {selectedPayment.reference}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Processing Dialog */}
      <Dialog open={isProcessingDialogOpen} onOpenChange={setIsProcessingDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Process Payment
            </DialogTitle>
            <DialogDescription>
              Review payment details and process the payment through the workflow
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              {/* Payment Information */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-sm text-foreground">Payment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Patient</p>
                      <p className="font-medium text-foreground">{selectedPayment.patientName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Case ID</p>
                      <p className="font-mono text-sm text-foreground">{selectedPayment.caseId.slice(-7).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Type</p>
                      <div className="mt-1">{getTypeBadge(selectedPayment.type)}</div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-semibold text-foreground">
                        {selectedPayment.currency === 'USD' ? '$' : selectedPayment.currency === 'INR' ? '₹' : selectedPayment.currency} {selectedPayment.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Method</p>
                      <p className="text-sm text-foreground">{selectedPayment.method}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reference</p>
                      <p className="font-mono text-sm text-foreground">{selectedPayment.reference}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Date</p>
                      <p className="text-sm text-foreground">{new Date(selectedPayment.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Current Status</p>
                      <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                    </div>
                  </div>
                  {selectedPayment.notes && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Existing Notes</p>
                      <p className="text-sm text-foreground">{selectedPayment.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Verification */}
              <div className="space-y-2">
                <Label htmlFor="verificationNotes">
                  Verification Notes
                </Label>
                <Textarea
                  id="verificationNotes"
                  value={processingData.verificationNotes}
                  onChange={(e) => setProcessingData({ ...processingData, verificationNotes: e.target.value })}
                  placeholder="Add verification notes (payment confirmation, bank details, etc.)..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  Document any verification steps taken (bank confirmation, receipt verification, etc.)
                </p>
              </div>

              {/* Processing Decision */}
              <div className="space-y-2">
                <Label htmlFor="finalStatus">
                  Processing Decision <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={processingData.finalStatus}
                  onValueChange={(value: 'completed' | 'failed') => 
                    setProcessingData({ ...processingData, finalStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-medical-safe" />
                        <span>Approve & Complete</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="failed">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-destructive" />
                        <span>Mark as Failed</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Processing Notes */}
              <div className="space-y-2">
                <Label htmlFor="processingNotes">
                  Processing Notes
                  {processingData.finalStatus === 'failed' && (
                    <span className="text-destructive"> *</span>
                  )}
                </Label>
                <Textarea
                  id="processingNotes"
                  value={processingData.processingNotes}
                  onChange={(e) => setProcessingData({ ...processingData, processingNotes: e.target.value })}
                  placeholder={
                    processingData.finalStatus === 'completed' 
                      ? "Add any processing notes or instructions..."
                      : "Explain why the payment failed (required)..."
                  }
                  className="min-h-[100px]"
                />
                {processingData.finalStatus === 'failed' && (
                  <p className="text-xs text-medical-warning">
                    Please provide a reason for marking this payment as failed
                  </p>
                )}
              </div>

              {/* Workflow Information */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-xs font-medium text-foreground mb-2">Case Workflow Status</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {STATUS_LABELS[selectedPayment.caseStatus as keyof typeof STATUS_LABELS] || selectedPayment.caseStatus}
                  </Badge>
                  {selectedPayment.caseStatus === 'visa_processing_payments' && processingData.finalStatus === 'completed' && (
                    <span className="text-xs text-muted-foreground">
                      → All payments completed. Case can proceed to next stage.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsProcessingDialogOpen(false);
                setSelectedPayment(null);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleProcessPayment}
              disabled={isProcessing || (processingData.finalStatus === 'failed' && !processingData.processingNotes.trim())}
              className={
                processingData.finalStatus === 'completed' 
                  ? 'bg-gradient-primary' 
                  : 'bg-destructive hover:bg-destructive/90'
              }
            >
              {isProcessing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : processingData.finalStatus === 'completed' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve & Complete
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Mark as Failed
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
