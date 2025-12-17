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
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  BedDouble,
  Award,
  Stethoscope,
  X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Hospital } from '@/types';
import { cn } from '@/lib/utils';

const HospitalManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { hospitals, users, cases, createHospital, updateHospital, deleteHospital, refreshHospitals, isLoading } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    address: '',
    phone: '',
    email: '',
    specialties: [] as string[],
    bedCapacity: '',
    availableBeds: '',
    accreditation: [] as string[],
    contactPerson: '',
  });
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newAccreditation, setNewAccreditation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common specialties and accreditations
  const commonSpecialties = [
    'Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 'Transplants',
    'Cardiac Surgery', 'Neurosurgery', 'Bone Marrow Transplant',
    'Heart Institute', 'Cancer Institute', 'Neurosciences', 'Kidney & Urology',
  ];
  
  const commonAccreditations = ['JCI', 'NABH', 'NABL', 'CAP'];

  // Filter hospitals
  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        searchQuery === '' ||
        h.name.toLowerCase().includes(searchLower) ||
        h.city.toLowerCase().includes(searchLower) ||
        h.state.toLowerCase().includes(searchLower) ||
        h.email.toLowerCase().includes(searchLower) ||
        h.phone.includes(searchQuery) ||
        h.specialties.some(s => s.toLowerCase().includes(searchLower))
      );
    });
  }, [hospitals, searchQuery]);

  // Get hospital statistics
  const hospitalStats = useMemo(() => {
    const totalBeds = hospitals.reduce((sum, h) => sum + h.bedCapacity, 0);
    const availableBeds = hospitals.reduce((sum, h) => sum + h.availableBeds, 0);
    const totalCases = hospitals.reduce((sum, h) => {
      return sum + cases.filter(c => c.assignedHospital === h.id).length;
    }, 0);
    
    return {
      total: hospitals.length,
      totalBeds,
      availableBeds,
      occupiedBeds: totalBeds - availableBeds,
      totalCases,
    };
  }, [hospitals, cases]);

  const resetForm = () => {
    setFormData({
      name: '',
      city: '',
      state: '',
      address: '',
      phone: '',
      email: '',
      specialties: [],
      bedCapacity: '',
      availableBeds: '',
      accreditation: [],
      contactPerson: '',
    });
    setNewSpecialty('');
    setNewAccreditation('');
    setSelectedHospital(null);
  };

  const handleCreateHospital = async () => {
    if (!formData.name || !formData.city || !formData.email || !formData.phone) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (parseInt(formData.availableBeds) > parseInt(formData.bedCapacity)) {
      toast({
        title: 'Validation Error',
        description: 'Available beds cannot exceed total bed capacity',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createHospital({
        name: formData.name,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        specialties: formData.specialties,
        bedCapacity: parseInt(formData.bedCapacity) || 0,
        availableBeds: parseInt(formData.availableBeds) || 0,
        accreditation: formData.accreditation,
        contactPerson: formData.contactPerson,
      });
      
      toast({
        title: 'Hospital Created',
        description: `${formData.name} has been created successfully`,
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      await refreshHospitals();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create hospital',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setFormData({
      name: hospital.name,
      city: hospital.city,
      state: hospital.state,
      address: hospital.address,
      phone: hospital.phone,
      email: hospital.email,
      specialties: [...hospital.specialties],
      bedCapacity: hospital.bedCapacity.toString(),
      availableBeds: hospital.availableBeds.toString(),
      accreditation: [...hospital.accreditation],
      contactPerson: hospital.contactPerson,
    });
    setIsEditDialogOpen(true);
  };

  const handleViewHospital = (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setIsViewDialogOpen(true);
  };

  const handleUpdateHospital = async () => {
    if (!selectedHospital || !formData.name || !formData.city || !formData.email) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (parseInt(formData.availableBeds) > parseInt(formData.bedCapacity)) {
      toast({
        title: 'Validation Error',
        description: 'Available beds cannot exceed total bed capacity',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateHospital(selectedHospital.id, {
        name: formData.name,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        specialties: formData.specialties,
        bedCapacity: parseInt(formData.bedCapacity) || 0,
        availableBeds: parseInt(formData.availableBeds) || 0,
        accreditation: formData.accreditation,
        contactPerson: formData.contactPerson,
      });
      
      toast({
        title: 'Hospital Updated',
        description: `${formData.name} has been updated successfully`,
      });
      
      setIsEditDialogOpen(false);
      resetForm();
      await refreshHospitals();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update hospital',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHospital = async () => {
    if (!selectedHospital) return;

    setIsSubmitting(true);
    try {
      await deleteHospital(selectedHospital.id);
      
      toast({
        title: 'Hospital Deleted',
        description: `${selectedHospital.name} has been deleted`,
      });
      
      setIsDeleteDialogOpen(false);
      resetForm();
      await refreshHospitals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete hospital',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, newSpecialty.trim()],
      });
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty),
    });
  };

  const addAccreditation = () => {
    if (newAccreditation.trim() && !formData.accreditation.includes(newAccreditation.trim())) {
      setFormData({
        ...formData,
        accreditation: [...formData.accreditation, newAccreditation.trim()],
      });
      setNewAccreditation('');
    }
  };

  const removeAccreditation = (accreditation: string) => {
    setFormData({
      ...formData,
      accreditation: formData.accreditation.filter(a => a !== accreditation),
    });
  };

  const getHospitalUsers = (hospitalId: string) => {
    return users.filter(u => u.hospitalId === hospitalId);
  };

  const getHospitalCases = (hospitalId: string) => {
    return cases.filter(c => c.assignedHospital === hospitalId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-muted-foreground">Loading hospitals...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Hospital Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage partner hospitals and their information
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}
          className="bg-gradient-primary hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Hospital
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hospitals</p>
                <p className="text-3xl font-bold text-foreground mt-1">{hospitalStats.total}</p>
              </div>
              <Building2 className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Beds</p>
                <p className="text-3xl font-bold text-foreground mt-1">{hospitalStats.totalBeds}</p>
              </div>
              <BedDouble className="w-8 h-8 text-secondary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Beds</p>
                <p className="text-3xl font-bold text-foreground mt-1">{hospitalStats.availableBeds}</p>
              </div>
              <BedDouble className="w-8 h-8 text-medical-safe opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Cases</p>
                <p className="text-3xl font-bold text-foreground mt-1">{hospitalStats.totalCases}</p>
              </div>
              <Users className="w-8 h-8 text-medical-info opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="card-elevated">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search hospitals by name, city, state, email, phone, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Hospitals Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-foreground">Hospitals ({filteredHospitals.length})</CardTitle>
          <CardDescription>Manage partner hospitals and their details</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredHospitals.length > 0 ? (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Specialties</TableHead>
                    <TableHead>Beds</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Cases</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHospitals.map((hospital) => {
                    const hospitalCases = getHospitalCases(hospital.id);
                    const hospitalUsers = getHospitalUsers(hospital.id);
                    const occupancyRate = hospital.bedCapacity > 0 
                      ? ((hospital.bedCapacity - hospital.availableBeds) / hospital.bedCapacity * 100).toFixed(0)
                      : '0';
                    
                    return (
                      <TableRow key={hospital.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{hospital.name}</p>
                            {hospital.accreditation.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {hospital.accreditation.slice(0, 2).map((acc) => (
                                  <Badge key={acc} variant="outline" className="text-xs">
                                    {acc}
                                  </Badge>
                                ))}
                                {hospital.accreditation.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{hospital.accreditation.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span>{hospital.city}, {hospital.state}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {hospital.specialties.slice(0, 2).map((spec) => (
                              <Badge key={spec} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                            {hospital.specialties.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{hospital.specialties.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {hospital.availableBeds} / {hospital.bedCapacity}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {occupancyRate}% occupied
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span>{hospital.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate max-w-[150px]">{hospital.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{hospitalCases.length}</p>
                            <p className="text-xs text-muted-foreground">
                              {hospitalUsers.length} user(s)
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewHospital(hospital)}
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditHospital(hospital)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedHospital(hospital);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hospitals found</p>
              {searchQuery ? (
                <p className="text-sm mt-1">Try adjusting your search</p>
              ) : (
                <Button
                  variant="link"
                  onClick={() => {
                    resetForm();
                    setIsCreateDialogOpen(true);
                  }}
                  className="mt-2"
                >
                  Add your first hospital
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Hospital Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New Hospital</DialogTitle>
            <DialogDescription>
              Add a new partner hospital to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-name">Hospital Name *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Apollo Hospitals"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-contact">Contact Person *</Label>
                <Input
                  id="create-contact"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Dr. John Doe"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="create-city">City *</Label>
                <Input
                  id="create-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Chennai"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-state">State *</Label>
                <Input
                  id="create-state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Tamil Nadu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-address">Address</Label>
                <Input
                  id="create-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-phone">Phone *</Label>
                <Input
                  id="create-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91-44-2829-0200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@hospital.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-capacity">Total Bed Capacity *</Label>
                <Input
                  id="create-capacity"
                  type="number"
                  value={formData.bedCapacity}
                  onChange={(e) => setFormData({ ...formData, bedCapacity: e.target.value })}
                  placeholder="500"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-available">Available Beds *</Label>
                <Input
                  id="create-available"
                  type="number"
                  value={formData.availableBeds}
                  onChange={(e) => setFormData({ ...formData, availableBeds: e.target.value })}
                  placeholder="45"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specialties</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.specialties.map((spec) => (
                  <Badge key={spec} variant="secondary" className="flex items-center gap-1">
                    {spec}
                    <button
                      type="button"
                      onClick={() => removeSpecialty(spec)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                  placeholder="Add specialty"
                />
                <Button type="button" onClick={addSpecialty} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {commonSpecialties.filter(s => !formData.specialties.includes(s)).map((spec) => (
                  <Button
                    key={spec}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!formData.specialties.includes(spec)) {
                        setFormData({
                          ...formData,
                          specialties: [...formData.specialties, spec],
                        });
                      }
                    }}
                    className="h-7 text-xs"
                  >
                    + {spec}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Accreditations</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.accreditation.map((acc) => (
                  <Badge key={acc} variant="outline" className="flex items-center gap-1">
                    {acc}
                    <button
                      type="button"
                      onClick={() => removeAccreditation(acc)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newAccreditation}
                  onChange={(e) => setNewAccreditation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAccreditation())}
                  placeholder="Add accreditation"
                />
                <Button type="button" onClick={addAccreditation} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {commonAccreditations.filter(a => !formData.accreditation.includes(a)).map((acc) => (
                  <Button
                    key={acc}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!formData.accreditation.includes(acc)) {
                        setFormData({
                          ...formData,
                          accreditation: [...formData.accreditation, acc],
                        });
                      }
                    }}
                    className="h-7 text-xs"
                  >
                    + {acc}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateHospital}
              disabled={isSubmitting}
              className="bg-gradient-primary"
            >
              {isSubmitting ? 'Creating...' : 'Create Hospital'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Hospital Dialog - Same as Create but with update handler */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Hospital</DialogTitle>
            <DialogDescription>
              Update hospital information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Same form fields as create dialog */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Hospital Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact">Contact Person *</Label>
                <Input
                  id="edit-contact"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City *</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State *</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone *</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Total Bed Capacity *</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={formData.bedCapacity}
                  onChange={(e) => setFormData({ ...formData, bedCapacity: e.target.value })}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-available">Available Beds *</Label>
                <Input
                  id="edit-available"
                  type="number"
                  value={formData.availableBeds}
                  onChange={(e) => setFormData({ ...formData, availableBeds: e.target.value })}
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specialties</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.specialties.map((spec) => (
                  <Badge key={spec} variant="secondary" className="flex items-center gap-1">
                    {spec}
                    <button
                      type="button"
                      onClick={() => removeSpecialty(spec)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                  placeholder="Add specialty"
                />
                <Button type="button" onClick={addSpecialty} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {commonSpecialties.filter(s => !formData.specialties.includes(s)).map((spec) => (
                  <Button
                    key={spec}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!formData.specialties.includes(spec)) {
                        setFormData({
                          ...formData,
                          specialties: [...formData.specialties, spec],
                        });
                      }
                    }}
                    className="h-7 text-xs"
                  >
                    + {spec}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Accreditations</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.accreditation.map((acc) => (
                  <Badge key={acc} variant="outline" className="flex items-center gap-1">
                    {acc}
                    <button
                      type="button"
                      onClick={() => removeAccreditation(acc)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newAccreditation}
                  onChange={(e) => setNewAccreditation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAccreditation())}
                  placeholder="Add accreditation"
                />
                <Button type="button" onClick={addAccreditation} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {commonAccreditations.filter(a => !formData.accreditation.includes(a)).map((acc) => (
                  <Button
                    key={acc}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!formData.accreditation.includes(acc)) {
                        setFormData({
                          ...formData,
                          accreditation: [...formData.accreditation, acc],
                        });
                      }
                    }}
                    className="h-7 text-xs"
                  >
                    + {acc}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateHospital}
              disabled={isSubmitting}
              className="bg-gradient-primary"
            >
              {isSubmitting ? 'Updating...' : 'Update Hospital'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Hospital Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selectedHospital?.name}</DialogTitle>
            <DialogDescription>
              Complete hospital information and statistics
            </DialogDescription>
          </DialogHeader>
          {selectedHospital && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium">{selectedHospital.city}, {selectedHospital.state}</p>
                  <p className="text-sm text-muted-foreground">{selectedHospital.address}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Person</Label>
                  <p className="font-medium">{selectedHospital.contactPerson}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedHospital.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedHospital.email}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Bed Capacity</Label>
                  <p className="font-medium">
                    {selectedHospital.availableBeds} / {selectedHospital.bedCapacity} available
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {((selectedHospital.bedCapacity - selectedHospital.availableBeds) / selectedHospital.bedCapacity * 100).toFixed(0)}% occupied
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Active Cases</Label>
                  <p className="font-medium">{getHospitalCases(selectedHospital.id).length}</p>
                  <p className="text-sm text-muted-foreground">
                    {getHospitalUsers(selectedHospital.id).length} user(s) assigned
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Specialties</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedHospital.specialties.map((spec) => (
                    <Badge key={spec} variant="secondary">{spec}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Accreditations</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedHospital.accreditation.map((acc) => (
                    <Badge key={acc} variant="outline">{acc}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedHospital && (
              <Button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditHospital(selectedHospital);
                }}
                className="bg-gradient-primary"
              >
                Edit Hospital
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Hospital Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Hospital</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedHospital?.name}</strong>? This action cannot be undone.
              {selectedHospital && (
                <div className="mt-2 space-y-2 p-2 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Active Cases:</strong> {getHospitalCases(selectedHospital.id).length}
                  </p>
                  <p className="text-sm">
                    <strong>Associated Users:</strong> {getHospitalUsers(selectedHospital.id).length}
                  </p>
                  {(getHospitalCases(selectedHospital.id).length > 0 || getHospitalUsers(selectedHospital.id).length > 0) && (
                    <p className="text-sm text-medical-warning font-medium">
                      You must reassign or remove cases and users before deleting this hospital.
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHospital}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Hospital'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HospitalManagement;
