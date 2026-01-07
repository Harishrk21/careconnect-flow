import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Plus,
  Search,
  Filter,
  Eye,
  Building2,
  GraduationCap,
  Calendar,
  User,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS, type CaseStatus, type Case } from '@/types';
import { cn } from '@/lib/utils';

const CasesList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cases, hospitals, universities, isLoading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [hospitalFilter, setHospitalFilter] = useState<string>('all');
  const [universityFilter, setUniversityFilter] = useState<string>('all');

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

  // Filter cases based on user role
  const userCases = useMemo(() => {
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
          c.status === 'credit_payment_upload' ||
          c.payments.length > 0
        );
      default:
        return [];
    }
  }, [user, cases]);

  // Apply filters
  const filteredCases = useMemo(() => {
    return userCases.filter((caseItem) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        searchQuery === '' ||
        caseItem.id.toLowerCase().includes(searchLower) ||
        caseItem.clientInfo.name.toLowerCase().includes(searchLower) ||
        caseItem.clientInfo.condition.toLowerCase().includes(searchLower) ||
        caseItem.clientInfo.passport.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || caseItem.status === statusFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || caseItem.priority === priorityFilter;

      // Hospital filter
      const matchesHospital = hospitalFilter === 'all' || caseItem.assignedHospital === hospitalFilter;
      // University filter
      const matchesUniversity = universityFilter === 'all' || caseItem.assignedUniversity === universityFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesHospital && matchesUniversity;
    });
  }, [userCases, searchQuery, statusFilter, priorityFilter, hospitalFilter]);

  // Sort by updated date (most recent first)
  const sortedCases = useMemo(() => {
    return [...filteredCases].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [filteredCases]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-muted-foreground">Loading cases...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Cases</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all SudInd cases
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

      {/* Filters */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, condition, or passport..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              {user?.role === 'admin' && (
                <>
                  <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Building2 className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Hospital" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Hospitals</SelectItem>
                      {hospitals.map((hospital) => (
                        <SelectItem key={hospital.id} value={hospital.id}>
                          {hospital.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={universityFilter} onValueChange={setUniversityFilter}>
                    <SelectTrigger className="w-[180px]">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="University" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Universities</SelectItem>
                      {universities.map((university) => (
                        <SelectItem key={university.id} value={university.id}>
                          {university.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-foreground">
            {filteredCases.length} {filteredCases.length === 1 ? 'Case' : 'Cases'}
          </CardTitle>
          <CardDescription>
            {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || hospitalFilter !== 'all'
              ? 'Showing filtered results'
              : 'All cases in the system'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedCases.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Case ID</TableHead>
                    <TableHead className="text-muted-foreground">Patient/Student</TableHead>
                    <TableHead className="text-muted-foreground">Condition/Course</TableHead>
                    <TableHead className="text-muted-foreground">Hospital/University</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Priority</TableHead>
                    <TableHead className="text-muted-foreground">Updated</TableHead>
                    <TableHead className="text-muted-foreground w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCases.map((caseItem) => {
                    const hospital = hospitals.find(h => h.id === caseItem.assignedHospital);
                    const university = universities.find(u => u.id === caseItem.assignedUniversity);
                    const isUniversityCase = !!caseItem.assignedUniversity;
                    return (
                      <TableRow 
                        key={caseItem.id} 
                        className="border-border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/cases/${caseItem.id}`)}
                      >
                        <TableCell className="font-mono text-sm text-foreground">
                          {caseItem.id.slice(-7).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {caseItem.clientInfo.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {caseItem.clientInfo.passport}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground max-w-[200px] truncate">
                          {caseItem.clientInfo.condition}
                        </TableCell>
                        <TableCell>
                          {isUniversityCase && university ? (
                            <div className="flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-medical-info" />
                              <span className="text-sm text-foreground">{university.name}</span>
                            </div>
                          ) : hospital ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm text-foreground">{hospital.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn('text-xs', getStatusBadgeClass(caseItem.status))}
                          >
                            {getStatusLabel(caseItem.status, caseItem)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(caseItem.priority)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="text-xs">
                              {new Date(caseItem.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button asChild variant="ghost" size="sm">
                            <Link to={`/cases/${caseItem.id}`}>
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No cases found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first case'}
              </p>
              {(user?.role === 'agent' || user?.role === 'admin') && !searchQuery && statusFilter === 'all' && (
                <Button asChild>
                  <Link to="/cases/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Case
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CasesList;
