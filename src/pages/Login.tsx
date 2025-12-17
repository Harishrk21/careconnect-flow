import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Loader2, Eye, EyeOff, Shield, Stethoscope, Plane, Users, CheckCircle2, Globe } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, updatePassword, isLoading, isAuthenticated, user } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter both username and password',
        variant: 'destructive',
      });
      return;
    }

    const result = await login(username.trim(), password);
    
    if (result.success) {
      if (result.requiresPasswordChange) {
        setShowPasswordChange(true);
        toast({
          title: 'Password Change Required',
          description: 'Please set a new password for your account',
        });
        // Don't navigate - stay on login page to change password
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have been logged in successfully',
        });
        // Navigation will happen via useEffect when isAuthenticated changes
      }
    } else {
      toast({
        title: 'Login Failed',
        description: result.error || 'Invalid credentials',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    const success = await updatePassword(newPassword);
    
    if (success) {
      toast({
        title: 'Success',
        description: 'Password updated successfully. Redirecting to dashboard...',
      });
      setShowPasswordChange(false);
      setNewPassword('');
      setConfirmPassword('');
      // Redirect to dashboard after password change
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update password',
        variant: 'destructive',
      });
    }
  };

  // Redirect if already authenticated and password changed (but not showing password change form)
  useEffect(() => {
    if (isAuthenticated && user?.passwordChanged && !showPasswordChange) {
      navigate('/dashboard', { replace: true });
    }
    // Only depend on isAuthenticated to prevent loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#DEE8EB' }}>
      {/* Medical-themed background with lighter gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#DEE8EB] via-[#DEE8EB]/98 to-[#0F1B42]/5" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48ZyBmaWxsPSIjMEYxQjQyIiBmaWxsLW9wYWNpdHk9IjAuMDMiPjxwYXRoIGQ9Ik0yMCAyMHYyMGgyMFYyMEgyMHptNDAgNDB2MjBoMjB2LTIwSDYwem0tNDAgNDB2MjBoMjB2LTIwSDIwem00MCAwVjgwSDYwVjYwSDQwem0wLTIwSDQwVjQwSDYwdjIweiIvPjwvZz48L2c+PC9zdmc+')] opacity-10" />
      
      {/* Decorative medical icons in background */}
      <div className="absolute top-20 left-10 w-32 h-32 opacity-5">
        <Stethoscope className="w-full h-full" style={{ color: '#0A9D96' }} />
      </div>
      <div className="absolute bottom-20 right-10 w-40 h-40 opacity-5">
        <Heart className="w-full h-full" style={{ color: '#F8983A' }} />
      </div>
      <div className="absolute top-1/2 right-20 w-24 h-24 opacity-5">
        <Plane className="w-full h-full" style={{ color: '#0F1B42' }} />
      </div>

      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Information about SudInd */}
        <div className="hidden lg:block space-y-6 animate-fade-in" style={{ color: '#0F1B42' }}>
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white shadow-lg" style={{ border: '1px solid rgba(15, 27, 66, 0.1)' }}>
                <img 
                  src="/logo.png" 
                  alt="SudInd Logo" 
                  className="h-20 w-auto"
                  style={{ 
                    maxWidth: '200px'
                  }}
                />
              </div>
            </div>
            <h1 className="text-4xl font-display font-bold leading-tight" style={{ color: '#0F1B42' }}>
              Welcome to <span style={{ color: '#0A9D96' }}>SudInd Portal</span>
            </h1>
            <p className="text-lg leading-relaxed" style={{ color: '#0F1B42', opacity: 0.8 }}>
              Your trusted partner for seamless medical coordination and tourism management. 
              Connecting Sudan Office, Indian Medical Agents, Patients, Hospitals, and Finance teams 
              for a smooth healthcare journey.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-white rounded-lg border transition-colors shadow-sm hover:shadow-md" style={{ borderColor: 'rgba(10, 157, 150, 0.3)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0A9D96'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(10, 157, 150, 0.3)'}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(10, 157, 150, 0.1)' }}>
                <Stethoscope className="w-5 h-5" style={{ color: '#0A9D96' }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: '#0F1B42' }}>Medical Excellence</h3>
              <p className="text-sm" style={{ color: '#0F1B42', opacity: 0.7 }}>World-class healthcare coordination</p>
            </div>
            <div className="p-4 bg-white rounded-lg border transition-colors shadow-sm hover:shadow-md" style={{ borderColor: 'rgba(248, 152, 58, 0.3)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#F8983A'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(248, 152, 58, 0.3)'}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(248, 152, 58, 0.1)' }}>
                <Plane className="w-5 h-5" style={{ color: '#F8983A' }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: '#0F1B42' }}>Travel Management</h3>
              <p className="text-sm" style={{ color: '#0F1B42', opacity: 0.7 }}>Seamless visa & ticket coordination</p>
            </div>
            <div className="p-4 bg-white rounded-lg border transition-colors shadow-sm hover:shadow-md" style={{ borderColor: 'rgba(10, 157, 150, 0.3)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0A9D96'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(10, 157, 150, 0.3)'}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(10, 157, 150, 0.1)' }}>
                <Users className="w-5 h-5" style={{ color: '#0A9D96' }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: '#0F1B42' }}>Multi-Role Platform</h3>
              <p className="text-sm" style={{ color: '#0F1B42', opacity: 0.7 }}>Coordinated workflow for all stakeholders</p>
            </div>
            <div className="p-4 bg-white rounded-lg border transition-colors shadow-sm hover:shadow-md" style={{ borderColor: 'rgba(198, 26, 0, 0.3)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#C61A00'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(198, 26, 0, 0.3)'}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(198, 26, 0, 0.1)' }}>
                <CheckCircle2 className="w-5 h-5" style={{ color: '#C61A00' }} />
              </div>
              <h3 className="font-semibold mb-1" style={{ color: '#0F1B42' }}>Complete Tracking</h3>
              <p className="text-sm" style={{ color: '#0F1B42', opacity: 0.7 }}>Real-time case status & updates</p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white rounded-lg border shadow-sm" style={{ borderColor: 'rgba(10, 157, 150, 0.3)' }}>
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#0A9D96' }} />
              <div>
                <h3 className="font-semibold mb-1" style={{ color: '#0F1B42' }}>Global Medical Tourism</h3>
                <p className="text-sm" style={{ color: '#0F1B42', opacity: 0.7 }}>
                  Facilitating medical journeys from Sudan to India with complete documentation, 
                  visa processing, and treatment coordination.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full flex justify-center lg:justify-end">
          <Card className="w-full max-w-md shadow-medical-xl animate-scale-in border-0 bg-card/95 backdrop-blur-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex items-center justify-center">
                <div className="p-3 rounded-xl bg-white shadow-md" style={{ border: '1px solid rgba(15, 27, 66, 0.1)' }}>
                  <img 
                    src="/logo.png" 
                    alt="SudInd Logo" 
                    className="h-16 w-auto"
                    style={{ 
                      maxWidth: '180px'
                    }}
                  />
                </div>
              </div>
              <CardTitle className="text-2xl font-display text-foreground">Welcome Back</CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to access your account
              </CardDescription>
            </CardHeader>
        
        <CardContent>
          {!showPasswordChange ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-background border-border focus:border-primary"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-background border-border focus:border-primary pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-medical-warning/10 rounded-lg border border-medical-warning/20 mb-4">
                <Shield className="w-5 h-5 text-medical-warning flex-shrink-0" />
                <p className="text-sm text-foreground">
                  First time login - please set a new password
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-foreground">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-background border-border focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background border-border focus:border-primary"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Set New Password'
                )}
              </Button>
            </form>
          )}
          
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-muted rounded-md">
                <p className="font-medium text-foreground">Admin</p>
                <p className="text-muted-foreground">admin / admin123</p>
              </div>
              <div className="p-2 bg-muted rounded-md">
                <p className="font-medium text-foreground">Agent</p>
                <p className="text-muted-foreground">agent.khan / agent123</p>
              </div>
              <div className="p-2 bg-muted rounded-md">
                <p className="font-medium text-foreground">Hospital</p>
                <p className="text-muted-foreground">hospital.apollo / hospital123</p>
              </div>
              <div className="p-2 bg-muted rounded-md">
                <p className="font-medium text-foreground">Finance</p>
                <p className="text-muted-foreground">finance.omar / finance123</p>
              </div>
              <div className="p-2 bg-muted rounded-md col-span-2">
                <p className="font-medium text-foreground">Client (First-time Login)</p>
                <p className="text-muted-foreground">client.aisha / client123</p>
                <p className="text-xs text-muted-foreground mt-1">Will prompt for password change</p>
              </div>
            </div>
          </div>
        </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
