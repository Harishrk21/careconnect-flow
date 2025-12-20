import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Plus,
  Search,
  User,
  Mail,
  Phone,
  Trash2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { User } from '@/types';

const ClientsList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { users, cases, deleteUser, refreshUsers, isLoading } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter clients
  const clients = useMemo(() => {
    return users.filter(u => u.role === 'client');
  }, [users]);

  // Apply search filter
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        searchQuery === '' ||
        client.name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.phone.toLowerCase().includes(searchLower) ||
        client.username.toLowerCase().includes(searchLower)
      );
    });
  }, [clients, searchQuery]);

  // Get cases for a client
  const getClientCases = (clientId: string) => {
    return cases.filter(c => c.clientId === clientId);
  };

  // Handle delete client
  const handleDeleteClick = (client: User) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return;

    setIsDeleting(true);
    try {
      const clientCases = getClientCases(selectedClient.id);
      
      if (clientCases.length > 0) {
        toast({
          title: 'Cannot Delete Client',
          description: `This client has ${clientCases.length} associated case(s). Please remove or reassign cases before deleting the client.`,
          variant: 'destructive',
        });
        setIsDeleteDialogOpen(false);
        setIsDeleting(false);
        return;
      }

      await deleteUser(selectedClient.id);
      await refreshUsers();
      
      toast({
        title: 'Client Deleted',
        description: `${selectedClient.name} has been deleted successfully`,
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedClient(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete client',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-muted-foreground">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage patient client accounts
          </p>
        </div>
        {(user?.role === 'agent' || user?.role === 'admin') && (
          <Button asChild className="bg-gradient-primary hover:opacity-90">
            <Link to="/clients/new">
              <Plus className="w-4 h-4 mr-2" />
              New Client
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-foreground">
            {filteredClients.length} {filteredClients.length === 1 ? 'Client' : 'Clients'}
          </CardTitle>
          <CardDescription>
            {searchQuery ? 'Showing filtered results' : 'All clients in the system'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Name</TableHead>
                    <TableHead className="text-muted-foreground">Username</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Phone</TableHead>
                    <TableHead className="text-muted-foreground">Created</TableHead>
                    <TableHead className="text-muted-foreground w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow 
                      key={client.id} 
                      className="border-border hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {client.name}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              Client
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-foreground">
                        {client.username}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm text-foreground">{client.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm text-foreground">{client.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(client.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/cases/new?clientId=${client.id}`)}
                          >
                            Create Case
                          </Button>
                          {(user?.role === 'admin' || user?.role === 'agent') && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteClick(client)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No clients found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Get started by creating your first client'}
              </p>
              {(user?.role === 'agent' || user?.role === 'admin') && !searchQuery && (
                <Button asChild>
                  <Link to="/clients/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Client
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Client Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedClient?.name}</strong>? This action cannot be undone.
              {selectedClient && (
                <div className="mt-2 space-y-2 p-2 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Associated Cases:</strong> {getClientCases(selectedClient.id).length}
                  </p>
                  {getClientCases(selectedClient.id).length > 0 && (
                    <p className="text-sm text-medical-warning font-medium">
                      This client has active cases. You must remove or reassign cases before deleting the client.
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting || (selectedClient ? getClientCases(selectedClient.id).length > 0 : false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Client'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientsList;

