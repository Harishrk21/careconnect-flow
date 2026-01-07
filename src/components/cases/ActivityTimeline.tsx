import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, CheckCircle2 } from 'lucide-react';
import { STATUS_LABELS, STATUS_COLORS, type Case } from '@/types';
import { cn } from '@/lib/utils';

interface ActivityTimelineProps {
  caseData: Case;
  showStatusHistory?: boolean;
  showActivityLog?: boolean;
  compact?: boolean;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  caseData,
  showStatusHistory = true,
  showActivityLog = true,
  compact = false,
}) => {
  const isUniversityCase = !!caseData.assignedUniversity;
  
  const getStatusBadgeClass = (status: string) => {
    const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'status-neutral';
    return colorClass;
  };

  // Helper to get context-aware status labels
  const getStatusLabel = (status: string): string => {
    if (status === 'assigned_to_hospital') {
      return isUniversityCase ? 'Assigned to University' : 'Assigned to Hospital';
    }
    if (status === 'hospital_review') {
      return isUniversityCase ? 'University Review' : 'Hospital Review';
    }
    return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
  };

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      {/* Status History */}
      {showStatusHistory && caseData.statusHistory && caseData.statusHistory.length > 0 && (
        <Card className={cn('card-elevated', compact && 'border-0 shadow-sm')}>
          <CardHeader className={cn(compact && 'pb-3')}>
            <CardTitle className={cn('text-foreground', compact && 'text-base')}>
              Status History
            </CardTitle>
            {!compact && (
              <CardDescription>Complete timeline of case status changes</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              <div className={cn('space-y-6', compact && 'space-y-4')}>
                {[...caseData.statusHistory].reverse().map((entry, index) => (
                  <div key={index} className={cn('relative pl-10', compact && 'pl-8')}>
                    <div className={cn(
                      'absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      compact && 'w-4 h-4 left-1',
                      index === 0 
                        ? 'bg-primary border-primary' 
                        : 'bg-card border-border'
                    )}>
                      {index === 0 ? (
                        <Clock className={cn('text-primary-foreground', compact ? 'w-2 h-2' : 'w-2.5 h-2.5')} />
                      ) : (
                        <CheckCircle2 className={cn('text-muted-foreground', compact ? 'w-2 h-2' : 'w-2.5 h-2.5')} />
                      )}
                    </div>
                    <div className={cn('bg-muted/30 rounded-lg p-3', compact && 'p-2')}>
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className={cn(getStatusBadgeClass(entry.status), compact && 'text-xs')}>
                          {getStatusLabel(entry.status)}
                        </Badge>
                        <span className={cn('text-xs text-muted-foreground', compact && 'text-[10px]')}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className={cn('text-sm text-muted-foreground', compact && 'text-xs')}>
                        By: {entry.byName}
                      </p>
                      {entry.note && (
                        <p className={cn('text-sm text-foreground mt-1 italic', compact && 'text-xs')}>
                          "{entry.note}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      {showActivityLog && caseData.activityLog && caseData.activityLog.length > 0 && (
        <Card className={cn('card-elevated', compact && 'border-0 shadow-sm')}>
          <CardHeader className={cn(compact && 'pb-3')}>
            <CardTitle className={cn('text-foreground', compact && 'text-base')}>
              Activity Log
            </CardTitle>
            {!compact && (
              <CardDescription>All actions taken on this case</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className={cn('space-y-3', compact && 'space-y-2')}>
              {[...caseData.activityLog].reverse().map((log) => (
                <div 
                  key={log.id} 
                  className={cn(
                    'flex items-start gap-3 p-2 hover:bg-muted/30 rounded-lg',
                    compact && 'p-1.5 gap-2'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0',
                    compact && 'w-6 h-6'
                  )}>
                    <Activity className={cn('text-muted-foreground', compact ? 'w-3 h-3' : 'w-4 h-4')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm text-foreground', compact && 'text-xs')}>
                      <span className="font-medium">{log.userName}</span>
                      <span className="text-muted-foreground"> ({log.userRole})</span>
                    </p>
                    <p className={cn('text-sm text-foreground', compact && 'text-xs')}>
                      {log.action}: {log.details}
                    </p>
                    <p className={cn('text-xs text-muted-foreground mt-1', compact && 'text-[10px]')}>
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ActivityTimeline;
