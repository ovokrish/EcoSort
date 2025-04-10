
import React, { useState, useEffect } from 'react';
import { Leaf } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [showLogin, setShowLogin] = useState(true);
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (currentUser && !loading) {
      navigate('/dashboard');
    }
  }, [currentUser, loading, navigate]);

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-green-50">
        <div className="animate-spin w-12 h-12 border-4 border-ecosort-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-green-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-ecosort-primary mb-4">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-ecosort-primary">EcoSort</h1>
          <p className="text-gray-600">Scan, sort, save the planet</p>
        </div>
        
        {showLogin ? (
          <LoginForm onSwitchToSignup={() => setShowLogin(false)} />
        ) : (
          <SignupForm onSwitchToLogin={() => setShowLogin(true)} />
        )}
        
        <p className="mt-8 text-center text-sm text-gray-500">
          By continuing, you agree to EcoSort's 
          <a href="#" className="font-medium text-ecosort-primary hover:text-ecosort-secondary"> Terms of Service </a> 
          and 
          <a href="#" className="font-medium text-ecosort-primary hover:text-ecosort-secondary"> Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default Auth;
