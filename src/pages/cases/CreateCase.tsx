import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, UserPlus, Building2, GraduationCap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const CreateCase: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { createCase, createUser, users, hospitals, universities } = useData();
  const [loading, setLoading] = useState(false);
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  // Determine case type based on agent type
  const agentCaseType = user?.role === 'agent' && user?.agentType 
    ? user.agentType 
    : 'hospital';
  
  const [caseType, setCaseType] = useState<'hospital' | 'university'>(agentCaseType);
  
  // Update case type when user changes (shouldn't happen, but safety check)
  useEffect(() => {
    if (user?.role === 'agent' && user?.agentType) {
      setCaseType(user.agentType);
    }
  }, [user]);

  // Check if clientId is provided in URL
  useEffect(() => {
    const clientIdParam = searchParams.get('clientId');
    if (clientIdParam) {
      setSelectedClientId(clientIdParam);
      setClientMode('existing');
    }
  }, [searchParams]);
  const [formData, setFormData] = useState({
    patientName: '', dob: '', passport: '', nationality: 'Sudanese',
    condition: '', phone: '', email: '', address: '',
    emergencyContact: '', emergencyPhone: '', priority: 'medium',
    attenderName: '', attenderRelationship: '', attenderPassport: '',
    attenderPhone: '', attenderEmail: '',
  });

  // Get all clients
  const clients = useMemo(() => {
    return users.filter(u => u.role === 'client');
  }, [users]);

  // Get selected client data
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find(c => c.id === selectedClientId);
  }, [selectedClientId, clients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.condition) {
      toast({ title: 'Error', description: 'Medical condition is required', variant: 'destructive' });
      return;
    }

    if (clientMode === 'existing' && !selectedClientId) {
      toast({ title: 'Error', description: 'Please select a client', variant: 'destructive' });
      return;
    }

    if (clientMode === 'new' && !formData.patientName) {
      toast({ title: 'Error', description: 'Patient name is required', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      let clientId: string;
      let clientInfo;

      if (clientMode === 'existing' && selectedClient) {
        clientId = selectedClient.id;
        clientInfo = {
          name: selectedClient.name,
          dob: formData.dob || '',
          passport: formData.passport || '',
          nationality: formData.nationality || 'Sudanese',
          condition: formData.condition,
          phone: selectedClient.phone || formData.phone,
          email: selectedClient.email || formData.email,
          address: formData.address || '',
          emergencyContact: formData.emergencyContact || '',
          emergencyPhone: formData.emergencyPhone || '',
        };
      } else {
        // Create new client
        // Normalize username to lowercase and ensure consistent format
        const normalizedUsername = `client.${formData.patientName.toLowerCase().trim().replace(/\s+/g, '.')}`;
        const defaultPassword = 'client123';
        
      const client = await createUser({
          username: normalizedUsername,
          password: btoa(defaultPassword), 
          role: 'client', 
          name: formData.patientName,
          email: formData.email || 'patient@email.com', 
          phone: formData.phone,
          passwordChanged: false, 
          createdBy: user?.id || '', 
          createdAt: new Date().toISOString(), 
          lastLogin: '',
      });
        clientId = client.id;
        clientInfo = {
          name: formData.patientName, 
          dob: formData.dob, 
          passport: formData.passport,
          nationality: formData.nationality, 
          condition: formData.condition,
          phone: formData.phone, 
          email: formData.email, 
          address: formData.address,
          emergencyContact: formData.emergencyContact, 
          emergencyPhone: formData.emergencyPhone,
        };
      }

      await createCase({
        clientId,
        clientInfo,
        attenderInfo: formData.attenderName ? {
          name: formData.attenderName, 
          relationship: formData.attenderRelationship,
          passport: formData.attenderPassport, 
          phone: formData.attenderPhone, 
          email: formData.attenderEmail,
        } : undefined,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        assignedHospital: caseType === 'hospital' ? undefined : undefined,
        assignedUniversity: caseType === 'university' ? undefined : undefined,
      });
      
      toast({ 
        title: 'Success', 
        description: `Case created successfully${clientMode === 'new' ? ` for ${formData.patientName}` : ''}` 
      });
      navigate('/cases');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create case', variant: 'destructive' });
    } finally { 
      setLoading(false); 
    }
  };

  const updateField = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cases')}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Create New Case</h1>
          <p className="text-muted-foreground">Select an existing client or create a new one, then enter case details</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selection */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground">Client Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                type="button"
                variant={clientMode === 'existing' ? 'default' : 'outline'}
                onClick={() => setClientMode('existing')}
                className={clientMode === 'existing' ? 'bg-gradient-primary' : ''}
              >
                Select Existing Client
              </Button>
              <Button
                type="button"
                variant={clientMode === 'new' ? 'default' : 'outline'}
                onClick={() => setClientMode('new')}
                className={clientMode === 'new' ? 'bg-gradient-primary' : ''}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create New Client
              </Button>
            </div>

            {clientMode === 'existing' ? (
              <div className="space-y-2">
                <Label>Select Client *</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border max-h-[300px]">
                    {clients.length > 0 ? (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.email ? `(${client.email})` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No clients found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {clients.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No clients available. <Link to="/clients/new" className="text-primary hover:underline">Create a new client</Link>
                  </p>
                )}
                {selectedClient && (
                  <div className="p-3 bg-muted/30 rounded-lg mt-2">
                    <p className="text-sm font-medium text-foreground">{selectedClient.name}</p>
                    {selectedClient.email && <p className="text-xs text-muted-foreground">{selectedClient.email}</p>}
                    {selectedClient.phone && <p className="text-xs text-muted-foreground">{selectedClient.phone}</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Client Name *</Label>
                <Input 
                  value={formData.patientName} 
                  onChange={e => updateField('patientName', e.target.value)} 
                  required 
                  placeholder="Enter patient full name"
                />
                <p className="text-xs text-muted-foreground">
                  A new client account will be created for this patient
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Case Type Selection - Only show for admin, hide for agents (they have fixed type) */}
        {user?.role === 'admin' && (
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground">Case Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={caseType === 'hospital' ? 'default' : 'outline'}
                onClick={() => setCaseType('hospital')}
                className={caseType === 'hospital' ? 'bg-gradient-primary' : ''}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Hospital Case
              </Button>
              <Button
                type="button"
                variant={caseType === 'university' ? 'default' : 'outline'}
                onClick={() => setCaseType('university')}
                className={caseType === 'university' ? 'bg-gradient-to-r from-medical-info to-medical-info/80' : ''}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                University Case
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {caseType === 'hospital' 
                ? 'For medical treatment cases' 
                : 'For university education cases'}
            </p>
          </CardContent>
        </Card>
        )}

        {/* Show agent type info for agents */}
        {user?.role === 'agent' && user?.agentType && (
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {user.agentType === 'hospital' ? (
                  <>
                    <Building2 className="w-4 h-4" />
                    <span>You are a Hospital Agent. You can only create hospital cases.</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4" />
                    <span>You are a University Agent. You can only create university cases.</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-foreground">
              {caseType === 'hospital' ? 'Case Information' : 'Student & Program Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {clientMode === 'new' && (
              <>
            <div className="space-y-2">
              <Label>{caseType === 'hospital' ? 'Patient Name *' : 'Student Name *'}</Label>
              <Input value={formData.patientName} onChange={e => updateField('patientName', e.target.value)} required />
            </div>
              </>
            )}
            <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={formData.dob} onChange={e => updateField('dob', e.target.value)} /></div>
            <div className="space-y-2"><Label>Passport Number</Label><Input value={formData.passport} onChange={e => updateField('passport', e.target.value)} /></div>
            <div className="space-y-2"><Label>Nationality</Label><Input value={formData.nationality} onChange={e => updateField('nationality', e.target.value)} /></div>
            <div className="md:col-span-2 space-y-2">
              <Label>{caseType === 'hospital' ? 'Medical Condition *' : 'Course/Program of Interest *'}</Label>
              <Textarea 
                value={formData.condition} 
                onChange={e => updateField('condition', e.target.value)} 
                required 
                placeholder={caseType === 'hospital' 
                  ? "Describe the medical condition requiring treatment (e.g., Cardiac Surgery, Kidney Transplant)"
                  : "Describe the course or program the student wants to pursue (e.g., Bachelor of Engineering - Computer Science, Master of Business Administration)"}
                rows={caseType === 'university' ? 3 : 2}
              />
              {caseType === 'university' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Include degree level (Bachelor/Master), field of study, and any specific specialization
                </p>
              )}
            </div>
            {clientMode === 'new' && (
              <>
            <div className="space-y-2"><Label>Phone</Label><Input value={formData.phone} onChange={e => updateField('phone', e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} /></div>
            <div className="md:col-span-2 space-y-2"><Label>Address</Label><Input value={formData.address} onChange={e => updateField('address', e.target.value)} /></div>
              </>
            )}
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
