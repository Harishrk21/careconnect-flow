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
  AlertTriangle,
  Building2,
  Users,
  BedDouble,
  FileText,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS, type Case } from '@/types';
import { cn } from '@/lib/utils';

const HospitalDashboard: React.FC = () => {
  const { user } = useAuth();
  const { cases, hospitals, isLoading } = useData();

  const assignedCases = useMemo(() => {
    if (!user?.hospitalId) return [];
    return cases.filter(c => c.assignedHospital === user.hospitalId);
  }, [user, cases]);

  const currentHospital = hospitals.find(h => h.id === user?.hospitalId);

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
    };
  }, [assignedCases]);

  const getStatusBadgeClass = (status: string) => {
    const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'status-neutral';
    return colorClass;
  };

  // Calculate bed availability
  const bedAvailability = useMemo(() => {
    if (!currentHospital) return { available: 0, total: 0, occupied: 0, percentage: 0 };
    const occupied = assignedCases.filter(c => 
      c.status === 'treatment_in_progress' || 
      c.status === 'admit_format_uploaded' ||
      c.status === 'frro_registration'
    ).length;
    const available = currentHospital.availableBeds - occupied;
    const percentage = currentHospital.bedCapacity > 0 
      ? ((currentHospital.bedCapacity - available) / currentHospital.bedCapacity) * 100 
      : 0;
    return {
      available: Math.max(0, available),
      total: currentHospital.bedCapacity,
      occupied,
      percentage: Math.round(percentage),
    };
  }, [currentHospital, assignedCases]);

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
          <h1 className="text-3xl font-display font-bold text-foreground">Hospital Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {currentHospital?.name || 'Hospital'} - Manage your assigned cases
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assigned Cases Queue */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              Assigned Cases Queue
            </CardTitle>
            <CardDescription>Cases requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            {assignedCases.length > 0 ? (
              <div className="space-y-3">
                {assignedCases
                  .sort((a, b) => {
                    // Prioritize cases needing review
                    const aPriority = casesByStatus.review.includes(a) ? 0 : 1;
                    const bPriority = casesByStatus.review.includes(b) ? 0 : 1;
                    if (aPriority !== bPriority) return aPriority - bPriority;
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                  })
                  .slice(0, 5)
                  .map((caseItem) => (
                    <Link
                      key={caseItem.id}
                      to={`/cases/${caseItem.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                    >
                      <div className="flex items-center gap-3">
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
                        <div>
                          <p className="font-medium text-foreground text-sm">{caseItem.clientInfo.name}</p>
                          <p className="text-xs text-muted-foreground">{caseItem.clientInfo.condition}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusBadgeClass(caseItem.status)}>
                          {STATUS_LABELS[caseItem.status]}
                        </Badge>
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
                <p>No assigned cases yet</p>
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

        {/* Cases Requiring Action */}
        {casesByStatus.review.length > 0 && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-medical-warning" />
                Requires Review
              </CardTitle>
              <CardDescription>Cases waiting for your review and decision</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {casesByStatus.review.slice(0, 3).map((caseItem) => (
                  <Link
                    key={caseItem.id}
                    to={`/cases/${caseItem.id}`}
                    className="block p-3 rounded-lg border border-medical-warning/20 bg-medical-warning/5 hover:bg-medical-warning/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground text-sm">{caseItem.clientInfo.name}</p>
                        <p className="text-xs text-muted-foreground">{caseItem.clientInfo.condition}</p>
                      </div>
                      <Badge variant="outline" className={getStatusBadgeClass(caseItem.status)}>
                        {STATUS_LABELS[caseItem.status]}
                      </Badge>
                    </div>
                  </Link>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link to="/cases">Review All Cases</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                {casesByStatus.inProgress.slice(0, 3).map((caseItem) => (
                  <Link
                    key={caseItem.id}
                    to={`/cases/${caseItem.id}`}
                    className="block p-3 rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground text-sm">{caseItem.clientInfo.name}</p>
                        <p className="text-xs text-muted-foreground">
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
                  <Link to="/cases">View All Active Cases</Link>
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
                        <div>
                          <p className="font-medium text-foreground text-sm">{caseItem.clientInfo.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Passport: {caseItem.clientInfo.passport} • {caseItem.clientInfo.condition}
                          </p>
                          {caseItem.attenderInfo && (
                            <p className="text-xs text-muted-foreground mt-1">
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
                  <Link to="/cases">View All Patients</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HospitalDashboard;
