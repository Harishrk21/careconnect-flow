import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  Shield,
  Building2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { User, UserRole } from '@/types';
import { cn } from '@/lib/utils';

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { users, hospitals, createUser, updateUser, deleteUser, refreshUsers, isLoading } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    role: 'agent' as UserRole,
    hospitalIds: [] as string[],
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter users (exclude current user and clients)
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Exclude current user and clients
      if (u.id === currentUser?.id || u.role === 'client') return false;
      
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        searchQuery === '' ||
        u.name.toLowerCase().includes(searchLower) ||
        u.username.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.phone.includes(searchQuery);
      
      // Role filter
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter, currentUser]);

  // Group users by role
  const usersByRole = useMemo(() => {
    const grouped: Record<string, number> = {
      all: filteredUsers.length,
      agent: 0,
      hospital: 0,
      finance: 0,
      admin: 0,
    };
    
    filteredUsers.forEach(u => {
      if (u.role in grouped) {
        grouped[u.role]++;
      }
    });
    
    return grouped;
  }, [filteredUsers]);

  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      email: '',
      phone: '',
      role: 'agent',
      hospitalIds: [] as string[],
      password: '',
    });
    setSelectedUser(null);
  };

  const handleCreateUser = async () => {
    if (!formData.username || !formData.name || !formData.email || !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    if (formData.role === 'hospital' && formData.hospitalIds.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one hospital for hospital agents',
        variant: 'destructive',
      });
      return;
    }

    // Check if username already exists
    const usernameExists = users.some(u => u.username.toLowerCase() === formData.username.toLowerCase());
    if (usernameExists) {
      toast({
        title: 'Username Exists',
        description: 'This username is already taken',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const createdUser = await createUser({
        username: formData.username.toLowerCase().trim(),
        password: btoa(formData.password.trim()), // Hash password
        role: formData.role,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        passwordChanged: false, // Force password change on first login
        createdBy: currentUser?.id || 'system',
        createdAt: new Date().toISOString(),
        lastLogin: '',
        hospitalIds: formData.role === 'hospital' ? formData.hospitalIds : undefined,
      });
      
      // Only show success if user was actually created
      if (createdUser) {
        const defaultPassword = formData.password;
        toast({
          title: 'User Created',
          description: `${formData.name} has been created successfully. Username: ${createdUser.username}. Default password: ${defaultPassword}. First-time login will require password reset.`,
        });
        
        setIsCreateDialogOpen(false);
        resetForm();
        await refreshUsers();
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      hospitalIds: user.hospitalIds || [],
      password: '', // Don't pre-fill password
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !formData.name || !formData.email) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Check if username changed and already exists
    if (formData.username !== selectedUser.username) {
      const usernameExists = users.some(u => 
        u.id !== selectedUser.id && u.username.toLowerCase() === formData.username.toLowerCase()
      );
      if (usernameExists) {
        toast({
          title: 'Username Exists',
          description: 'This username is already taken',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const updates: Partial<User> = {
        username: formData.username.toLowerCase(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        hospitalIds: formData.role === 'hospital' ? formData.hospitalIds : undefined,
      };

      // Only update password if provided
      if (formData.password) {
        updates.password = btoa(formData.password);
        updates.passwordChanged = false; // Force password change
      }

      await updateUser(selectedUser.id, updates);
      
      toast({
        title: 'User Updated',
        description: `${formData.name} has been updated successfully`,
      });
      
      setIsEditDialogOpen(false);
      resetForm();
      await refreshUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await deleteUser(selectedUser.id);
      
      toast({
        title: 'User Deleted',
        description: `${selectedUser.name} has been deleted`,
      });
      
      setIsDeleteDialogOpen(false);
      resetForm();
      await refreshUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      admin: 'bg-medical-urgent/20 text-medical-urgent',
      agent: 'bg-primary/20 text-primary',
      hospital: 'bg-secondary/20 text-secondary',
      finance: 'bg-medical-warning/20 text-medical-warning',
      client: 'bg-medical-safe/20 text-medical-safe',
    };
    return (
      <Badge className={cn('capitalize', colors[role])}>
        {role}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage agents, hospital agents (Sudaind hospital-related agents), and finance users
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}
          className="bg-gradient-primary hover:opacity-90"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-foreground mt-1">{usersByRole.all}</p>
              </div>
              <Users className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agents</p>
                <p className="text-3xl font-bold text-foreground mt-1">{usersByRole.agent}</p>
              </div>
              <Shield className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hospital Agents</p>
                <p className="text-3xl font-bold text-foreground mt-1">{usersByRole.hospital}</p>
              </div>
              <Building2 className="w-8 h-8 text-secondary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Finance</p>
                <p className="text-3xl font-bold text-foreground mt-1">{usersByRole.finance}</p>
              </div>
              <Shield className="w-8 h-8 text-medical-warning opacity-50" />
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
                  placeholder="Search by name, username, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="hospital">Hospital Agent (Sudaind)</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-foreground">Users ({filteredUsers.length})</CardTitle>
          <CardDescription>Manage system users and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="font-mono text-sm">{user.username}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{user.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(user.lastLogin).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-destructive hover:text-destructive"
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
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No users found</p>
              {searchQuery || roleFilter !== 'all' ? (
                <p className="text-sm mt-1">Try adjusting your filters</p>
              ) : (
                <Button
                  variant="link"
                  onClick={() => {
                    resetForm();
                    setIsCreateDialogOpen(true);
                  }}
                  className="mt-2"
                >
                  Create your first user
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account. The user will be required to change their password on first login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-username">Username *</Label>
                <Input
                  id="create-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="agent.khan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger id="create-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="hospital">Hospital</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-name">Full Name *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john.doe@sudind.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-phone">Phone</Label>
                <Input
                  id="create-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91-9876-543-210"
                />
              </div>
            </div>

            {formData.role === 'hospital' && (
              <div className="space-y-2">
                <Label htmlFor="create-hospital">Assign to Hospital Location(s) *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select one or more hospitals this agent will handle
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {hospitals.map((h) => (
                    <div key={h.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`create-hospital-${h.id}`}
                        checked={formData.hospitalIds.includes(h.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, hospitalIds: [...formData.hospitalIds, h.id] });
                          } else {
                            setFormData({ ...formData, hospitalIds: formData.hospitalIds.filter(id => id !== h.id) });
                          }
                        }}
                        className="w-4 h-4 rounded border-border"
                      />
                      <label htmlFor={`create-hospital-${h.id}`} className="text-sm cursor-pointer flex-1">
                        {h.name} - {h.city}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.hospitalIds.length === 0 && (
                  <p className="text-xs text-medical-warning mt-1">
                    Please select at least one hospital
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="create-password">Initial Password *</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="User will change on first login"
              />
              <p className="text-xs text-muted-foreground">
                User will be required to change this password on first login
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={isSubmitting}
              className="bg-gradient-primary"
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username *</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="hospital">Hospital</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {formData.role === 'hospital' && (
              <div className="space-y-2">
                <Label htmlFor="edit-hospital">Assign to Hospital Location(s) *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select one or more hospitals this agent will handle
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {hospitals.map((h) => (
                    <div key={h.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-hospital-${h.id}`}
                        checked={formData.hospitalIds.includes(h.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, hospitalIds: [...formData.hospitalIds, h.id] });
                          } else {
                            setFormData({ ...formData, hospitalIds: formData.hospitalIds.filter(id => id !== h.id) });
                          }
                        }}
                        className="w-4 h-4 rounded border-border"
                      />
                      <label htmlFor={`edit-hospital-${h.id}`} className="text-sm cursor-pointer flex-1">
                        {h.name} - {h.city}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.hospitalIds.length === 0 && (
                  <p className="text-xs text-medical-warning mt-1">
                    Please select at least one hospital
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password (optional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to keep current password"
              />
              <p className="text-xs text-muted-foreground">
                If provided, user will be required to change password on next login
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={isSubmitting}
              className="bg-gradient-primary"
            >
              {isSubmitting ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
              {selectedUser && (
                <div className="mt-2 p-2 bg-muted rounded-lg">
                  <p className="text-sm">Username: {selectedUser.username}</p>
                  <p className="text-sm">Role: {selectedUser.role}</p>
                  <p className="text-sm">Email: {selectedUser.email}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
