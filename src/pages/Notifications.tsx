import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  Bell,
  Search,
  CheckCircle2,
  AlertCircle,
  Info,
  XCircle,
  CheckCheck,
  Filter,
  FolderKanban,
  Calendar,
  Mail,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Notification } from '@/types';
import { cn } from '@/lib/utils';

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const { notifications, markRead, markAllRead, refreshNotifications, isLoading } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        searchQuery === '' ||
        notif.title.toLowerCase().includes(searchLower) ||
        notif.message.toLowerCase().includes(searchLower);
      
      // Type filter
      const matchesType = typeFilter === 'all' || notif.type === typeFilter;
      
      // Read filter
      const matchesRead = 
        readFilter === 'all' || 
        (readFilter === 'read' && notif.read) ||
        (readFilter === 'unread' && !notif.read);
      
      return matchesSearch && matchesType && matchesRead;
    });
  }, [notifications, searchQuery, typeFilter, readFilter]);

  // Notification statistics
  const notificationStats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const read = notifications.filter(n => n.read).length;
    const byType = {
      info: notifications.filter(n => n.type === 'info').length,
      success: notifications.filter(n => n.type === 'success').length,
      warning: notifications.filter(n => n.type === 'warning').length,
      error: notifications.filter(n => n.type === 'error').length,
    };
    
    return {
      total,
      unread,
      read,
      byType,
    };
  }, [notifications]);

  const handleMarkRead = async (notificationId: string) => {
    try {
      await markRead(notificationId);
      toast({
        title: 'Notification marked as read',
        description: 'Notification has been marked as read',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      toast({
        title: 'All notifications marked as read',
        description: 'All notifications have been marked as read',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  };

  const handleMarkUnread = async (notificationId: string) => {
    // Note: This would require adding a markUnread function to DataContext
    // For now, we'll just show a message
    toast({
      title: 'Feature Coming Soon',
      description: 'Mark as unread functionality will be available soon',
    });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-medical-safe" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-medical-warning" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-medical-urgent" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-medical-info" />;
    }
  };

  const getNotificationBadge = (type: Notification['type']) => {
    const colors: Record<Notification['type'], string> = {
      info: 'bg-medical-info/20 text-medical-info',
      success: 'bg-medical-safe/20 text-medical-safe',
      warning: 'bg-medical-warning/20 text-medical-warning',
      error: 'bg-medical-urgent/20 text-medical-urgent',
    };
    return (
      <Badge className={cn('capitalize', colors[type])}>
        {type}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-muted-foreground">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with case activities and system alerts
          </p>
        </div>
        {notificationStats.unread > 0 && (
          <Button 
            onClick={handleMarkAllRead}
            variant="outline"
            className="bg-gradient-primary/10 hover:bg-gradient-primary/20"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold text-foreground mt-1">{notificationStats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-3xl font-bold text-foreground mt-1">{notificationStats.unread}</p>
              </div>
              <div className="w-8 h-8 bg-medical-warning/20 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-medical-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Read</p>
                <p className="text-3xl font-bold text-foreground mt-1">{notificationStats.read}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-medical-safe opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Filtered</p>
                <p className="text-3xl font-bold text-foreground mt-1">{filteredNotifications.length}</p>
              </div>
              <Filter className="w-8 h-8 text-medical-info opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications by title or message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-foreground">Notifications ({filteredNotifications.length})</CardTitle>
          <CardDescription>
            Your notification center - stay updated with all activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length > 0 ? (
            <div className="space-y-2">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'p-4 rounded-lg border transition-all',
                    notif.read
                      ? 'bg-muted/30 border-border'
                      : 'bg-primary/5 border-primary/20 shadow-sm'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                      notif.read ? 'bg-muted' : 'bg-primary/10'
                    )}>
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={cn(
                              'font-semibold text-foreground',
                              !notif.read && 'font-bold'
                            )}>
                              {notif.title}
                            </h3>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-primary"></span>
                            )}
                            {getNotificationBadge(notif.type)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notif.message}
                          </p>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(notif.timestamp).toLocaleString()}</span>
                        </div>
                        {notif.caseId && (
                          <Link
                            to={`/cases/${notif.caseId}`}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <FolderKanban className="w-3 h-3" />
                            <span>View Case</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-start gap-2 flex-shrink-0">
                      {!notif.read ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkRead(notif.id)}
                          title="Mark as read"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkUnread(notif.id)}
                          title="Mark as unread"
                          className="opacity-50"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No notifications found</p>
              {searchQuery || typeFilter !== 'all' || readFilter !== 'all' ? (
                <p className="text-sm mt-1">Try adjusting your filters</p>
              ) : (
                <p className="text-sm mt-1">You're all caught up! No new notifications.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types Breakdown */}
      {notificationStats.total > 0 && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground">Notification Types</CardTitle>
            <CardDescription>Breakdown of notifications by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-medical-info/20 flex items-center justify-center">
                  <Info className="w-5 h-5 text-medical-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Info</p>
                  <p className="text-xl font-bold text-foreground">{notificationStats.byType.info}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-medical-safe/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-medical-safe" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success</p>
                  <p className="text-xl font-bold text-foreground">{notificationStats.byType.success}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-medical-warning/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-medical-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warning</p>
                  <p className="text-xl font-bold text-foreground">{notificationStats.byType.warning}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-medical-urgent/20 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-medical-urgent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Error</p>
                  <p className="text-xl font-bold text-foreground">{notificationStats.byType.error}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Notifications;
