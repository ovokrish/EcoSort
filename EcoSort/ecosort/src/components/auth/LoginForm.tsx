
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';

type Props = {
  onSwitchToSignup: () => void;
};

const LoginForm: React.FC<Props> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsSubmitting(true);

    try {
      await login(email, password);
      // Navigation is handled in AuthContext
    } catch (error: any) {
      console.error('Login form error:', error);
      // Error messages are handled in the AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-ecosort-primary text-2xl font-bold">Welcome to EcoSort</CardTitle>
        <CardDescription>Login to start scanning and sorting waste efficiently</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="eco-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="eco-input"
            />
          </div>
          <div className="text-sm text-right">
            <a href="#" className="text-ecosort-primary hover:text-ecosort-secondary">
              Forgot password?
            </a>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            type="submit"
            className="w-full bg-ecosort-primary hover:bg-ecosort-secondary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
          <div className="text-sm text-center mt-2">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-ecosort-primary hover:text-ecosort-secondary font-medium"
            >
              Sign up
            </button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default LoginForm;
