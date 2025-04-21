import React, { useEffect, useState } from 'react';
import { ArrowLeft, LogOut, Camera, Award, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';
import { fromProfiles } from '@/lib/supabase';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState({ 
    display_name: '', 
    points: 0,
    scans: 0,
    badges: []
  });
  const [loading, setLoading] = useState(true);

  // Check for refresh parameter in URL to force data reload
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const shouldRefresh = queryParams.get('refresh') === 'true';
    
    if (shouldRefresh && user) {
      // Clean up the URL
      const cleanUrl = location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Reload user data
      loadUserProfile(user.id);
    }
  }, [location, user]);

  // Fix: Move the navigation logic to useEffect
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      // Fetch profile data from Supabase
      loadUserProfile(user.id);
    }
  }, [user, navigate]);

  const loadUserProfile = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await fromProfiles()
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setProfile({
          display_name: data.display_name || 'Eco Warrior',
          points: data.points || 0,
          scans: data.scans || 0,
          badges: data.badges || []
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  // Add a conditional return while checking auth
  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-ecosort-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const calculateLevel = (points) => {
    if (points < 50) return 'Beginner';
    if (points < 150) return 'Recycler';
    if (points < 300) return 'Eco Warrior';
    if (points < 600) return 'Planet Defender';
    return 'Sustainability Master';
  };

  const level = calculateLevel(profile.points);
  const progress = Math.min(100, (profile.points % 100) / 100 * 100);
  const photoURL = user.user_metadata?.avatar_url;
  const displayName = profile.display_name;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-ecosort-primary p-4 text-white">
        <div className="max-w-xl mx-auto flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-1 rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold">Your Profile</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4">
        <div className="flex flex-col items-center -mt-12 mb-6">
          <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md">
            {photoURL ? (
              <img 
                src={photoURL} 
                alt={displayName} 
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <div className="h-full w-full rounded-full bg-ecosort-secondary flex items-center justify-center text-white text-2xl font-bold">
                {(displayName || 'U')[0]}
              </div>
            )}
          </div>
          <h2 className="mt-4 text-xl font-bold">{displayName}</h2>
          <p className="text-gray-600">{user.email}</p>
          
          <div className="mt-2 px-3 py-1 bg-ecosort-accent/20 text-ecosort-accent rounded-full text-sm font-medium">
            {level}
          </div>
          
          <div className="w-full mt-4 bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-ecosort-accent h-2.5 rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="mt-1 text-sm text-gray-600">{profile.points} points</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Activity</CardTitle>
            <CardDescription>Stats about your eco-friendly actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Camera className="h-5 w-5 text-ecosort-primary mr-2" />
                  <h3 className="font-medium">Total Scans</h3>
                </div>
                <p className="text-2xl font-bold">{profile.scans}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Award className="h-5 w-5 text-ecosort-highlight mr-2" />
                  <h3 className="font-medium">Badges</h3>
                </div>
                <p className="text-2xl font-bold">{profile.badges.length}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                <div className="flex items-center mb-2">
                  <Trash2 className="h-5 w-5 text-ecosort-primary mr-2" />
                  <h3 className="font-medium">Waste Impact</h3>
                </div>
                <p className="text-gray-600">
                  You've properly disposed of {profile.scans} items, helping reduce pollution and landfill waste.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <button className="flex items-center w-full p-3 text-left hover:bg-gray-50 rounded-md transition-colors">
              <div className="flex-1">Edit Profile</div>
            </button>
            <button className="flex items-center w-full p-3 text-left hover:bg-gray-50 rounded-md transition-colors">
              <div className="flex-1">Notification Settings</div>
            </button>
            <button className="flex items-center w-full p-3 text-left hover:bg-gray-50 rounded-md transition-colors">
              <div className="flex-1">Privacy Settings</div>
            </button>
            
            <Separator />
            
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;