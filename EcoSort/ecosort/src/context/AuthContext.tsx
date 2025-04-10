
import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { Profile, fromProfiles } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

type User = {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  points: number;
  scans: number;
  badges: string[];
};

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Set up auth state listener first (before checking existing session)
  useEffect(() => {
    console.log('Setting up auth state listener');
    
    // First set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        handleAuthChange(event, session);
      }
    );

    // Then check for existing session
    const checkExistingSession = async () => {
      try {
        console.log('Checking for existing session');
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Found existing session');
          await fetchAndSetUser(session);
        } else {
          console.log('No existing session found');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();

    return () => {
      console.log('Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Handle auth state changes without causing recursion
  const handleAuthChange = (event: string, session: Session | null) => {
    console.log('Handling auth change event:', event);
    setLoading(true);
    
    if (session) {
      // Use setTimeout to avoid deadlocks when fetching profile data
      setTimeout(() => {
        fetchAndSetUser(session).then(() => {
          if (event === 'SIGNED_IN') {
            navigate('/dashboard');
          }
          setLoading(false);
        });
      }, 0);
    } else {
      setCurrentUser(null);
      setLoading(false);
    }
  };

  const fetchAndSetUser = async (session: Session) => {
    try {
      const supabaseUser = session.user;
      console.log('Fetching user profile for:', supabaseUser.id);
      
      // Try to fetch user profile
      let { data: profile, error } = await fromProfiles()
        .select()
        .eq('user_id', supabaseUser.id)
        .maybeSingle();
      
      // If no profile found, create one
      if (!profile && (!error || error.code === 'PGRST116')) {
        console.log('No profile found, creating one');
        // Create user profile if it doesn't exist
        const { data: createdProfile, error: createError } = await fromProfiles()
          .insert({
            user_id: supabaseUser.id,
            display_name: supabaseUser.user_metadata.displayName || supabaseUser.email?.split('@')[0] || 'User',
            points: 0,
            scans: 0,
            badges: ['Newcomer']
          })
          .select()
          .single();
        
        if (createError) {
          // If error is duplicate key, try fetching again
          if (createError.code === '23505') {
            console.log('Duplicate key error, fetching profile again');
            const { data: retryProfile } = await fromProfiles()
              .select()
              .eq('user_id', supabaseUser.id)
              .maybeSingle();
            
            profile = retryProfile;
          } else {
            console.error('Error creating user profile:', createError);
            throw createError;
          }
        } else {
          profile = createdProfile;
        }
      } else if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        throw error;
      }
      
      // Set user data in state
      if (profile) {
        console.log('Setting current user with profile:', profile);
        setCurrentUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          displayName: profile.display_name,
          photoURL: supabaseUser.user_metadata.avatar_url || null,
          points: profile.points || 0,
          scans: profile.scans || 0,
          badges: profile.badges || ['Newcomer']
        });
      }
    } catch (error) {
      console.error('Error setting user:', error);
      setCurrentUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email, 
        password,
      });
      
      if (error) {
        console.error('Login error:', error);
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Successfully logged in!');
      // Navigation will be handled by onAuthStateChange
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Display a more helpful error message
      const errorMessage = error.message || 'Unknown error occurred';
      if (errorMessage.includes('blocked') || error.name === 'PopupBlockedError') {
        toast.error('Login popup was blocked by the browser. Please allow popups for this site or try a different login method.');
      } else {
        toast.error(`Login failed: ${errorMessage}`);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      console.log('Attempting signup for:', email);
      setLoading(true);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            displayName
          },
          emailRedirectTo: window.location.origin + '/dashboard'
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Account created successfully! Please check your email for verification.');
      
      // No navigation here since we want user to verify first
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Attempting logout');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        toast.error(error.message);
        throw error;
      }
      
      setCurrentUser(null);
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout
  };

  console.log('Auth provider state:', { currentUser, loading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
