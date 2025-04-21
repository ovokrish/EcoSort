import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Camera, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserScans, ScanRecord } from '@/services/ecoPoints';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { fromProfiles } from '@/lib/supabase';


const Dashboard = () => {
  const [points, setPoints] =  useState("");
  useEffect(()=>{
    const a = localStorage.getItem("ecoPoints");
    setPoints(a);
  })
  const { user, loading } = useAuth();
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({ 
    display_name: 'Eco Warrior', 
    points: 0,

    scans: 0,
    badges: []
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Check for refresh parameter in URL to force data reload
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const shouldRefresh = queryParams.get('refresh') === 'true';
    
    if (shouldRefresh && user) {
      // Clean up the URL
      const cleanUrl = location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Reload user data
      loadUserData(user.id);
    }
  }, [location, user]);

  useEffect(() => {
    // Check authentication status after auth loading is complete
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadUserData(user.id);
    }
  }, [user]);

  const loadUserData = async (userId) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // Load profile data
      const { data, error } = await fromProfiles()
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        throw error;
      }
    
      if (data) {
        const localPoints = parseInt(localStorage.getItem('ecoPoints')) || 0;
      
        setProfile({
          display_name: data.display_name || 'Eco Warrior',
          points: localPoints,
          scans:  localPoints/5,
          badges: data.badges || []
        });
      }
      
      
      
      // Load recent scans
      const scans = await getUserScans(userId);
      setRecentScans(scans.slice(0, 5)); // Get 5 most recent
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateTo = (path: string) => {
    navigate(path);
  };

  // Show loading state while auth is initializing
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-ecosort-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Auth check done in useEffect, this is just to satisfy TypeScript
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-ecosort-primary text-white p-6">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Welcome, {profile.display_name}</h1>
          <p className="opacity-90">Your journey to a greener planet continues</p>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-80">Total Points</p>
              <h2 className="text-2xl font-bold">{profile.points}</h2>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm opacity-80">Items Scanned</p>
              <h2 className="text-2xl font-bold">{profile.scans}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 -mt-6">
        <Card className="bg-white shadow-lg border-none">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigateTo('/try')}
                className="flex flex-col items-center justify-center bg-ecosort-secondary/10 hover:bg-ecosort-secondary/20 text-ecosort-secondary rounded-lg p-6 transition-colors"
              >
                <Camera className="h-8 w-8 mb-2" />
                <span className="font-medium">Scan Waste</span>
              </button>
              <button 
                onClick={() => navigateTo('/cht')}
                className="flex flex-col items-center justify-center bg-ecosort-accent/10 hover:bg-ecosort-accent/20 text-ecosort-accent rounded-lg p-6 transition-colors"
              >
                <MessageSquare className="h-8 w-8 mb-2" />
                <span className="font-medium">Chat</span>
              </button>
              <button 
                onClick={() => navigateTo('/leaderboard')}
                className="flex flex-col items-center justify-center bg-ecosort-highlight/10 hover:bg-ecosort-highlight/20 text-ecosort-highlight rounded-lg p-6 transition-colors"
              >
                <Trophy className="h-8 w-8 mb-2" />
                <span className="font-medium">Leaderboard</span>
              </button>
              <button 
                onClick={() => navigateTo('/profile')}
                className="flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg p-6 transition-colors"
              >
                <User className="h-8 w-8 mb-2" />
                <span className="font-medium">Profile</span>
              </button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="recent" className="mt-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="recent">Recent Scans</TabsTrigger>
            <TabsTrigger value="badges">Your Badges</TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest waste scans and points earned</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-pulse-light h-6 w-24 bg-gray-200 rounded"></div>
                  </div>
                ) : recentScans.length > 0 ? (
                  <div className="space-y-4">
                    {recentScans.map((scan) => (
                      <div key={scan.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
                        <div className="h-12 w-12 rounded bg-gray-200 overflow-hidden">
                          <img 
                            src={scan.imageUrl} 
                            alt={scan.wasteType} 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium capitalize">{scan.wasteType}</p>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(scan.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-ecosort-primary font-medium">
                          +{scan.points} pts
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No scans yet. Start by scanning your first waste item!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="badges" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Earned Badges</CardTitle>
                <CardDescription>Achievements you've unlocked on your eco journey</CardDescription>
              </CardHeader>
              <CardContent>
                {profile.badges.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {profile.badges.map((badge, index) => (
                      <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg text-center">
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-ecosort-primary text-white mb-2">
                          🏆
                        </div>
                        <h3 className="font-medium text-gray-900">{badge}</h3>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Scan more items to earn badges and achievements!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
