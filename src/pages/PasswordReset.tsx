import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2, Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const PasswordReset: React.FC = () => {
  const navigate = useNavigate();
  const { user, updatePassword, logout, isLoading } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string;
  }>({ score: 0, feedback: '' });

  // Check if user needs password reset
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // User is not logged in, redirect to login
        navigate('/login', { replace: true });
      } else if (user.passwordChanged) {
        // User already changed password, redirect to login
        navigate('/login', { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  // Calculate password strength
  useEffect(() => {
    if (newPassword.length === 0) {
      setPasswordStrength({ score: 0, feedback: '' });
      return;
    }

    let score = 0;
    const feedback: string[] = [];

    if (newPassword.length >= 6) score += 1;
    else feedback.push('At least 6 characters');

    if (newPassword.length >= 8) score += 1;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) {
      score += 1;
    } else {
      feedback.push('Mix of uppercase and lowercase');
    }
    if (/\d/.test(newPassword)) {
      score += 1;
    } else {
      feedback.push('Include numbers');
    }
    if (/[^a-zA-Z0-9]/.test(newPassword)) {
      score += 1;
    } else {
      feedback.push('Include special characters');
    }

    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    setPasswordStrength({
      score,
      feedback: feedback.length > 0 ? feedback.join(', ') : strengthLabels[score - 1] || 'Weak',
    });
  }, [newPassword]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'Please ensure both passwords are identical',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);

    try {
      // Simulate real-time password reset with delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const success = await updatePassword(newPassword);
      
      if (success) {
        toast({
          title: 'Password Reset Successful',
          description: 'Your password has been updated. Please login with your new password.',
        });
        
        // Logout user and redirect to login
        setTimeout(() => {
          logout();
          navigate('/login', { replace: true });
        }, 2000);
      } else {
        toast({
          title: 'Password Reset Failed',
          description: 'Unable to update password. Please try again.',
          variant: 'destructive',
        });
        setIsUpdating(false);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while resetting your password',
        variant: 'destructive',
      });
      setIsUpdating(false);
    }
  };

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-destructive';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse-soft text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || user.passwordChanged) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#DEE8EB' }}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#DEE8EB] via-[#DEE8EB]/98 to-[#0F1B42]/5" />
      
      <div className="w-full max-w-md relative z-10">
        <Card className="shadow-medical-xl border-0 bg-card/95 backdrop-blur-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-display text-foreground">Reset Your Password</CardTitle>
            <CardDescription className="text-muted-foreground">
              First-time login requires password reset for security
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20 mb-4">
                <Lock className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Security Requirement</p>
                  <p className="text-xs text-muted-foreground">
                    You must set a new password before accessing your account
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-foreground">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-background border-border focus:border-primary pr-10"
                    disabled={isUpdating}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isUpdating}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={cn(
                            'flex-1 rounded-full transition-all',
                            passwordStrength.score >= level
                              ? getStrengthColor(passwordStrength.score)
                              : 'bg-muted'
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {passwordStrength.score > 0 && (
                        <span className={cn(
                          passwordStrength.score <= 2 ? 'text-destructive' : 
                          passwordStrength.score <= 3 ? 'text-orange-500' : 
                          'text-green-500'
                        )}>
                          {passwordStrength.feedback}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-background border-border focus:border-primary pr-10"
                    disabled={isUpdating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isUpdating}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
                {confirmPassword.length > 0 && newPassword === confirmPassword && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Passwords match</span>
                  </div>
                )}
              </div>
              
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium h-11"
                  disabled={isUpdating || newPassword.length < 6 || newPassword !== confirmPassword}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-center pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    navigate('/login', { replace: true });
                  }}
                  disabled={isUpdating}
                  className="text-xs text-muted-foreground"
                >
                  Cancel and return to login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PasswordReset;

