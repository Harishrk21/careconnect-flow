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
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Users,
  Award,
  BookOpen,
  X,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { University } from '@/types';
import { cn } from '@/lib/utils';

const UniversityManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { universities, users, cases, createUniversity, updateUniversity, deleteUniversity, refreshUniversities, isLoading } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    address: '',
    phone: '',
    email: '',
    courses: [] as string[],
    accreditation: [] as string[],
    contactPerson: '',
  });
  const [newCourse, setNewCourse] = useState('');
  const [newAccreditation, setNewAccreditation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common courses and accreditations
  const commonCourses = [
    'Engineering', 'Medicine', 'Business Administration', 'Computer Science',
    'Law', 'Arts', 'Science', 'Commerce', 'Pharmacy', 'Nursing',
    'Architecture', 'Management', 'Education', 'Agriculture',
  ];
  
  const commonAccreditations = ['UGC', 'AICTE', 'NAAC', 'NIRF'];

  // Filter universities
  const filteredUniversities = useMemo(() => {
    return universities.filter((u) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        searchQuery === '' ||
        u.name.toLowerCase().includes(searchLower) ||
        u.city.toLowerCase().includes(searchLower) ||
        u.state.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        u.phone.includes(searchQuery) ||
        u.courses.some(c => c.toLowerCase().includes(searchLower))
      );
    });
  }, [universities, searchQuery]);

  // Get university statistics
  const universityStats = useMemo(() => {
    const totalCases = universities.reduce((sum, u) => {
      return sum + cases.filter(c => c.assignedUniversity === u.id).length;
    }, 0);
    
    return {
      total: universities.length,
      totalCases,
    };
  }, [universities, cases]);

  const resetForm = () => {
    setFormData({
      name: '',
      city: '',
      state: '',
      address: '',
      phone: '',
      email: '',
      courses: [],
      accreditation: [],
      contactPerson: '',
    });
    setNewCourse('');
    setNewAccreditation('');
    setSelectedUniversity(null);
  };

  const handleCreateUniversity = async () => {
    if (!formData.name || !formData.city || !formData.email || !formData.phone) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createUniversity({
        name: formData.name,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        courses: formData.courses,
        accreditation: formData.accreditation,
        contactPerson: formData.contactPerson,
      });
      
      toast({
        title: 'University Created',
        description: `${formData.name} has been created successfully`,
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      await refreshUniversities();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create university',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUniversity = (university: University) => {
    setSelectedUniversity(university);
    setFormData({
      name: university.name,
      city: university.city,
      state: university.state,
      address: university.address,
      phone: university.phone,
      email: university.email,
      courses: [...university.courses],
      accreditation: [...university.accreditation],
      contactPerson: university.contactPerson,
    });
    setIsEditDialogOpen(true);
  };

  const handleViewUniversity = (university: University) => {
    setSelectedUniversity(university);
    setIsViewDialogOpen(true);
  };

  const handleUpdateUniversity = async () => {
    if (!selectedUniversity || !formData.name || !formData.city || !formData.email) {
      toast({
        title: 'Validation Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUniversity(selectedUniversity.id, {
        name: formData.name,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        courses: formData.courses,
        accreditation: formData.accreditation,
        contactPerson: formData.contactPerson,
      });
      
      toast({
        title: 'University Updated',
        description: `${formData.name} has been updated successfully`,
      });
      
      setIsEditDialogOpen(false);
      resetForm();
      await refreshUniversities();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update university',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUniversity = async () => {
    if (!selectedUniversity) return;

    setIsSubmitting(true);
    try {
      await deleteUniversity(selectedUniversity.id);
      
      toast({
        title: 'University Deleted',
        description: `${selectedUniversity.name} has been deleted`,
      });
      
      setIsDeleteDialogOpen(false);
      resetForm();
      await refreshUniversities();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete university',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCourse = () => {
    if (newCourse.trim() && !formData.courses.includes(newCourse.trim())) {
      setFormData({
        ...formData,
        courses: [...formData.courses, newCourse.trim()],
      });
      setNewCourse('');
    }
  };

  const removeCourse = (course: string) => {
    setFormData({
      ...formData,
      courses: formData.courses.filter(c => c !== course),
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

  const getUniversityUsers = (universityId: string) => {
    return users.filter(u => u.universityIds && u.universityIds.includes(universityId));
  };

  const getUniversityCases = (universityId: string) => {
    return cases.filter(c => c.assignedUniversity === universityId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse-soft text-muted-foreground">Loading universities...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">University Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage partner universities and their information
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
          Add University
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Universities</p>
                <p className="text-3xl font-bold text-foreground mt-1">{universityStats.total}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Cases</p>
                <p className="text-3xl font-bold text-foreground mt-1">{universityStats.totalCases}</p>
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
              placeholder="Search universities by name, city, state, email, phone, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Universities Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-foreground">Universities ({filteredUniversities.length})</CardTitle>
          <CardDescription>Manage partner universities and their details</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUniversities.length > 0 ? (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>University Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Cases</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUniversities.map((university) => {
                    const universityCases = getUniversityCases(university.id);
                    const universityUsers = getUniversityUsers(university.id);
                    
                    return (
                      <TableRow key={university.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{university.name}</p>
                            {university.accreditation.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {university.accreditation.slice(0, 2).map((acc) => (
                                  <Badge key={acc} variant="outline" className="text-xs">
                                    {acc}
                                  </Badge>
                                ))}
                                {university.accreditation.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{university.accreditation.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <span>{university.city}, {university.state}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {university.courses.slice(0, 2).map((course) => (
                              <Badge key={course} variant="secondary" className="text-xs">
                                {course}
                              </Badge>
                            ))}
                            {university.courses.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{university.courses.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              <span>{university.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate max-w-[150px]">{university.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{universityCases.length}</p>
                            <p className="text-xs text-muted-foreground">
                              {universityUsers.length} user(s)
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUniversity(university)}
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUniversity(university)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUniversity(university);
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
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No universities found</p>
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
                  Add your first university
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create University Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add New University</DialogTitle>
            <DialogDescription>
              Add a new partner university to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="create-name">University Name *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Delhi University"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-contact">Contact Person *</Label>
                <Input
                  id="create-contact"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="John Doe"
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
                  placeholder="Delhi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-state">State *</Label>
                <Input
                  id="create-state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Delhi"
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
                  placeholder="+91-11-2766-7000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@university.edu"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Courses/Programs</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.courses.map((course) => (
                  <Badge key={course} variant="secondary" className="flex items-center gap-1">
                    {course}
                    <button
                      type="button"
                      onClick={() => removeCourse(course)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCourse())}
                  placeholder="Add course"
                />
                <Button type="button" onClick={addCourse} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {commonCourses.filter(c => !formData.courses.includes(c)).map((course) => (
                  <Button
                    key={course}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!formData.courses.includes(course)) {
                        setFormData({
                          ...formData,
                          courses: [...formData.courses, course],
                        });
                      }
                    }}
                    className="h-7 text-xs"
                  >
                    + {course}
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
              onClick={handleCreateUniversity}
              disabled={isSubmitting}
              className="bg-gradient-primary"
            >
              {isSubmitting ? 'Creating...' : 'Create University'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit University Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit University</DialogTitle>
            <DialogDescription>
              Update university information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Same form fields as create dialog */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">University Name *</Label>
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

            <div className="space-y-2">
              <Label>Courses/Programs</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.courses.map((course) => (
                  <Badge key={course} variant="secondary" className="flex items-center gap-1">
                    {course}
                    <button
                      type="button"
                      onClick={() => removeCourse(course)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCourse())}
                  placeholder="Add course"
                />
                <Button type="button" onClick={addCourse} variant="outline" size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {commonCourses.filter(c => !formData.courses.includes(c)).map((course) => (
                  <Button
                    key={course}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!formData.courses.includes(course)) {
                        setFormData({
                          ...formData,
                          courses: [...formData.courses, course],
                        });
                      }
                    }}
                    className="h-7 text-xs"
                  >
                    + {course}
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
              onClick={handleUpdateUniversity}
              disabled={isSubmitting}
              className="bg-gradient-primary"
            >
              {isSubmitting ? 'Updating...' : 'Update University'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View University Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selectedUniversity?.name}</DialogTitle>
            <DialogDescription>
              Complete university information and statistics
            </DialogDescription>
          </DialogHeader>
          {selectedUniversity && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium">{selectedUniversity.city}, {selectedUniversity.state}</p>
                  <p className="text-sm text-muted-foreground">{selectedUniversity.address}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Person</Label>
                  <p className="font-medium">{selectedUniversity.contactPerson}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedUniversity.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedUniversity.email}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Active Cases</Label>
                <p className="font-medium">{getUniversityCases(selectedUniversity.id).length}</p>
                <p className="text-sm text-muted-foreground">
                  {getUniversityUsers(selectedUniversity.id).length} user(s) assigned
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground">Courses/Programs</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUniversity.courses.map((course) => (
                    <Badge key={course} variant="secondary">{course}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Accreditations</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUniversity.accreditation.map((acc) => (
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
            {selectedUniversity && (
              <Button
                onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditUniversity(selectedUniversity);
                }}
                className="bg-gradient-primary"
              >
                Edit University
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete University Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete University</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedUniversity?.name}</strong>? This action cannot be undone.
              {selectedUniversity && (
                <div className="mt-2 space-y-2 p-2 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Active Cases:</strong> {getUniversityCases(selectedUniversity.id).length}
                  </p>
                  <p className="text-sm">
                    <strong>Associated Users:</strong> {getUniversityUsers(selectedUniversity.id).length}
                  </p>
                  {(getUniversityCases(selectedUniversity.id).length > 0 || getUniversityUsers(selectedUniversity.id).length > 0) && (
                    <p className="text-sm text-medical-warning font-medium">
                      You must reassign or remove cases and users before deleting this university.
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUniversity}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? 'Deleting...' : 'Delete University'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UniversityManagement;

