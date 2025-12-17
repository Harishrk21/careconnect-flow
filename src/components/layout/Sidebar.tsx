import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  FileText,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Heart,
  UserCircle,
  LogOut,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  roles: string[];
  badge?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const { notifications } = useData();
  const location = useLocation();

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      href: '/dashboard',
      roles: ['admin', 'agent', 'client', 'hospital', 'finance'],
    },
    {
      icon: FolderKanban,
      label: 'Cases',
      href: '/cases',
      roles: ['admin', 'agent', 'hospital', 'finance'],
    },
    {
      icon: Users,
      label: 'User Management',
      href: '/users',
      roles: ['admin'],
    },
    {
      icon: Building2,
      label: 'Hospitals',
      href: '/hospitals',
      roles: ['admin'],
    },
    {
      icon: FileText,
      label: 'Documents',
      href: '/documents',
      roles: ['admin', 'agent'],
    },
    {
      icon: CreditCard,
      label: 'Payments',
      href: '/payments',
      roles: ['admin', 'finance'],
    },
  ];

  const filteredNavItems = navItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-medical-urgent/20 text-medical-urgent';
      case 'agent': return 'bg-primary/20 text-primary';
      case 'hospital': return 'bg-secondary/20 text-secondary';
      case 'finance': return 'bg-medical-warning/20 text-medical-warning';
      case 'client': return 'bg-medical-safe/20 text-medical-safe';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-display font-bold text-sidebar-primary text-sm">MedCoord</h1>
              <p className="text-xs text-sidebar-foreground/70">Platform</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-sidebar-primary')} />
              {!collapsed && (
                <span className="text-sm font-medium animate-fade-in">{item.label}</span>
              )}
              {item.badge && item.badge > 0 && (
                <Badge 
                  variant="destructive" 
                  className={cn(
                    'ml-auto text-xs h-5 min-w-5 flex items-center justify-center',
                    collapsed && 'absolute -top-1 -right-1'
                  )}
                >
                  {item.badge}
                </Badge>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-2 border-t border-sidebar-border">
        {/* Notifications */}
        <NavLink
          to="/notifications"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 mb-1',
            location.pathname === '/notifications'
              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
              : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50'
          )}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-medical-urgent text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {!collapsed && <span className="text-sm">Notifications</span>}
        </NavLink>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
              <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center flex-shrink-0">
                <UserCircle className="w-5 h-5 text-sidebar-accent-foreground" />
              </div>
              {!collapsed && (
                <div className="flex-1 text-left overflow-hidden animate-fade-in">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {user?.name}
                  </p>
                  <span className={cn('text-xs px-1.5 py-0.5 rounded capitalize', getRoleBadgeColor(user?.role || ''))}>
                    {user?.role}
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
            <DropdownMenuLabel className="text-foreground">
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild className="cursor-pointer">
              <NavLink to="/settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={logout} 
              className="text-medical-urgent cursor-pointer focus:text-medical-urgent focus:bg-medical-urgent/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-sm hover:bg-muted z-50"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-foreground" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-foreground" />
        )}
      </Button>
    </aside>
  );
};

export default Sidebar;
