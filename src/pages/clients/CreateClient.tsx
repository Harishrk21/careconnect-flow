import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const CreateClient: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createUser } = useData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', dob: '', passport: '', nationality: 'Sudanese',
    phone: '', email: '', address: '',
    emergencyContact: '', emergencyPhone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Normalize username to lowercase and ensure consistent format
      const normalizedUsername = `client.${formData.name.toLowerCase().trim().replace(/\s+/g, '.')}`;
      const defaultPassword = 'client123';
      
      const createdClient = await createUser({
        username: normalizedUsername,
        password: btoa(defaultPassword), 
        role: 'client', 
        name: formData.name,
        email: formData.email || 'patient@email.com', 
        phone: formData.phone,
        passwordChanged: false, 
        createdBy: user?.id || '', 
        createdAt: new Date().toISOString(), 
        lastLogin: '',
      });
      
      // Only show success if user was actually created
      if (createdClient) {
        toast({ 
          title: 'Success', 
          description: `Client account created successfully for ${formData.name}. Username: ${normalizedUsername}. Default password: ${defaultPassword}` 
        });
        // Small delay before navigation to ensure toast is visible
        setTimeout(() => {
          navigate('/clients');
        }, 500);
      } else {
        throw new Error('Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to create client', 
        variant: 'destructive' 
      });
    } finally { 
      setLoading(false); 
    }
  };

  const updateField = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Create New Client</h1>
          <p className="text-muted-foreground">Enter patient details to create a client account</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input 
                value={formData.name} 
                onChange={e => updateField('name', e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input 
                type="date" 
                value={formData.dob} 
                onChange={e => updateField('dob', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Passport Number</Label>
              <Input 
                value={formData.passport} 
                onChange={e => updateField('passport', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Nationality</Label>
              <Input 
                value={formData.nationality} 
                onChange={e => updateField('nationality', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input 
                value={formData.phone} 
                onChange={e => updateField('phone', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email" 
                value={formData.email} 
                onChange={e => updateField('email', e.target.value)} 
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Address</Label>
              <Input 
                value={formData.address} 
                onChange={e => updateField('address', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Emergency Contact</Label>
              <Input 
                value={formData.emergencyContact} 
                onChange={e => updateField('emergencyContact', e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Emergency Phone</Label>
              <Input 
                value={formData.emergencyPhone} 
                onChange={e => updateField('emergencyPhone', e.target.value)} 
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/clients')}>
            Cancel
          </Button>
          <Button type="submit" className="bg-gradient-primary" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Client'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateClient;

