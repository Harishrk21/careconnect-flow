import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const CreateCase: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createCase, createUser } = useData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '', dob: '', passport: '', nationality: 'Sudanese',
    condition: '', phone: '', email: '', address: '',
    emergencyContact: '', emergencyPhone: '', priority: 'medium',
    attenderName: '', attenderRelationship: '', attenderPassport: '',
    attenderPhone: '', attenderEmail: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName || !formData.condition) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const client = await createUser({
        username: `client.${formData.patientName.toLowerCase().replace(/\s+/g, '.')}`,
        password: btoa('client123'), role: 'client', name: formData.patientName,
        email: formData.email || 'patient@email.com', phone: formData.phone,
        passwordChanged: false, createdBy: user?.id || '', createdAt: new Date().toISOString(), lastLogin: '',
      });
      await createCase({
        clientId: client.id,
        clientInfo: {
          name: formData.patientName, dob: formData.dob, passport: formData.passport,
          nationality: formData.nationality, condition: formData.condition,
          phone: formData.phone, email: formData.email, address: formData.address,
          emergencyContact: formData.emergencyContact, emergencyPhone: formData.emergencyPhone,
        },
        attenderInfo: formData.attenderName ? {
          name: formData.attenderName, relationship: formData.attenderRelationship,
          passport: formData.attenderPassport, phone: formData.attenderPhone, email: formData.attenderEmail,
        } : undefined,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
      });
      toast({ title: 'Success', description: 'Case created successfully' });
      navigate('/cases');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create case', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const updateField = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cases')}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Create New Case</h1>
          <p className="text-muted-foreground">Enter patient details to create a new case</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="card-elevated">
          <CardHeader><CardTitle className="text-foreground">Patient Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Full Name *</Label><Input value={formData.patientName} onChange={e => updateField('patientName', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={formData.dob} onChange={e => updateField('dob', e.target.value)} /></div>
            <div className="space-y-2"><Label>Passport Number</Label><Input value={formData.passport} onChange={e => updateField('passport', e.target.value)} /></div>
            <div className="space-y-2"><Label>Nationality</Label><Input value={formData.nationality} onChange={e => updateField('nationality', e.target.value)} /></div>
            <div className="md:col-span-2 space-y-2"><Label>Medical Condition *</Label><Textarea value={formData.condition} onChange={e => updateField('condition', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => updateField('phone', e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} /></div>
            <div className="md:col-span-2 space-y-2"><Label>Address</Label><Input value={formData.address} onChange={e => updateField('address', e.target.value)} /></div>
            <div className="space-y-2"><Label>Priority</Label>
              <Select value={formData.priority} onValueChange={v => updateField('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader><CardTitle className="text-foreground">Attender Information (Optional)</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Attender Name</Label><Input value={formData.attenderName} onChange={e => updateField('attenderName', e.target.value)} /></div>
            <div className="space-y-2"><Label>Relationship</Label><Input value={formData.attenderRelationship} onChange={e => updateField('attenderRelationship', e.target.value)} /></div>
            <div className="space-y-2"><Label>Passport</Label><Input value={formData.attenderPassport} onChange={e => updateField('attenderPassport', e.target.value)} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={formData.attenderPhone} onChange={e => updateField('attenderPhone', e.target.value)} /></div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/cases')}>Cancel</Button>
          <Button type="submit" className="bg-gradient-primary" disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Case'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateCase;
