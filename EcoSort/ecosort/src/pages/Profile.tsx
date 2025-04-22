import React, { useEffect, useState } from 'react';
import { ArrowLeft, LogOut, Camera, Award, Trash2, Leaf, Sprout, Globe, Zap, Star, Shield, Copy, Settings, Edit, Bell, Lock, SunMoon, Download, Check, ChevronDown, ChevronRight, Recycle, Moon, Sun, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { toast } from '@/lib/toast';
import { fromProfiles } from '@/lib/supabase';

// Level icon mapping
const levelIcons = {
  'Beginner': <Leaf className="h-5 w-5 text-green-500" />,
  'Recycler': <Recycle className="h-5 w-5 text-blue-400" />,
  'Eco Warrior': <Sprout className="h-5 w-5 text-emerald-500" />,
  'Planet Defender': <Globe className="h-5 w-5 text-blue-500" />,
  'Sustainability Master': <Shield className="h-5 w-5 text-purple-500" />
};

// Badge definitions based on point milestones
const badgeDefinitions = [
  { name: "Eco Starter", milestone: 100, icon: Leaf, color: "text-green-500", description: "Awarded for reaching 100 points" },
  { name: "Green Enthusiast", milestone: 500, icon: Sprout, color: "text-emerald-600", description: "Awarded for reaching 500 points" },
  { name: "Eco Activist", milestone: 1000, icon: Globe, color: "text-blue-500", description: "Awarded for reaching 1,000 points" },
  { name: "Climate Champion", milestone: 2000, icon: Zap, color: "text-yellow-500", description: "Awarded for reaching 2,000 points" },
  { name: "Sustainability Hero", milestone: 5000, icon: Star, color: "text-purple-500", description: "Awarded for reaching 5,000 points" },
  { name: "Earth Guardian", milestone: 10000, icon: Shield, color: "text-red-500", description: "Awarded for reaching 10,000 points" }
];

// Fixed avatar options (could be expanded)
const avatarOptions = [
  { id: "leaf", icon: <Leaf className="w-full h-full p-4 text-white" />, color: "bg-green-500" },
  { id: "globe", icon: <Globe className="w-full h-full p-4 text-white" />, color: "bg-blue-500" },
  { id: "sprout", icon: <Sprout className="w-full h-full p-4 text-white" />, color: "bg-emerald-500" },
  { id: "star", icon: <Star className="w-full h-full p-4 text-white" />, color: "bg-yellow-500" },
  { id: "shield", icon: <Shield className="w-full h-full p-4 text-white" />, color: "bg-red-500" }
];

const Profile = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState({ 
    display_name: '', 
    points: 0,
    scans: 0,
    badges: []
  });
  const [loading, setLoading] = useState(true);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState(null);

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

  // Calculate earned badges based on points
  const calculateEarnedBadges = (points) => {
    return badgeDefinitions.filter(badge => points >= badge.milestone);
  };

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
      
      // Get points from localStorage to match Dashboard and Leaderboard
      const localPoints = parseInt(localStorage.getItem('ecoPoints')) || 0;
      const userScans = Math.floor(localPoints / 5); // Calculate scans same way as Dashboard
      
      if (data) {
        const profileData = {
          display_name: data.display_name || 'Eco Warrior',
          points: localPoints,
          scans: userScans,
          badges: data.badges || []
        };
        
        setProfile(profileData);
        setEarnedBadges(calculateEarnedBadges(localPoints));
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-ecosort-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your profile...</p>
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

  // Avatar progress ring calculation
  const calculateProgressRing = (points, nextMilestone) => {
    const progressPercent = Math.min(100, (points / nextMilestone) * 100);
    const radius = 44; // Circle radius
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercent / 100) * circumference;
    return { radius, circumference, offset };
  };

  // Get the next milestone points target
  const getNextMilestone = (points) => {
    if (points < 100) return 100;
    if (points < 500) return 500;
    if (points < 1000) return 1000;
    if (points < 5000) return 5000;
    return 10000;
  };

  // Weekly scan streak calculation (mock data for now)
  const streakDays = 3; // This would come from actual user data

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
          {/* Profile avatar with progress ring */}
          <div className="relative">
            <svg className="w-28 h-28">
              <circle
                className="text-gray-200 dark:text-gray-700"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="44"
                cx="56"
                cy="56"
              />
              <circle
                className="text-ecosort-primary dark:text-ecosort-accent transition-all duration-1000 ease-in-out"
                strokeWidth="4"
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="44"
                cx="56"
                cy="56"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 - (profile.points / getNextMilestone(profile.points)) * 2 * Math.PI * 44}
                transform="rotate(-90 56 56)"
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full bg-white dark:bg-gray-800 shadow-md p-1">
              {photoURL ? (
                <img 
                  src={photoURL} 
                  alt={displayName} 
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gradient-to-br from-ecosort-primary to-ecosort-secondary flex items-center justify-center text-white text-2xl font-bold">
                  {(displayName || 'U')[0]}
                </div>
              )}
              <button className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-700 p-1 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <Edit className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
          
          <h2 className="mt-4 text-xl font-bold dark:text-white">{displayName}</h2>
          
          <div className="relative group mt-1">
            <p className="text-gray-600 dark:text-gray-300 text-lg flex items-center gap-2">
              {user.email}
              <button 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(user.email);
                  toast.success("Email copied to clipboard");
                }}
              >
                <Copy className="h-4 w-4" />
              </button>
            </p>
          </div>
          
          <div className="mt-3 px-4 py-1.5 bg-gradient-to-r from-ecosort-primary/20 to-ecosort-secondary/20 text-ecosort-accent dark:text-ecosort-accent rounded-full text-sm font-medium flex items-center gap-2">
            {levelIcons[level] || <Leaf className="h-5 w-5 text-green-500" />}
            {level}
          </div>
          
          <div className="w-full mt-4 relative group">
            {/* Simple meter (always visible) */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>{profile.points} points</span>
              <span>Next: {getNextMilestone(profile.points)} points</span>
            </div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-ecosort-primary to-ecosort-secondary h-2.5 rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${Math.min(100, (profile.points / getNextMilestone(profile.points)) * 100)}%` }}
              ></div>
            </div>
            
            {/* Detailed badge meter (visible on hover) */}
            <div className="absolute top-0 left-0 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out z-10 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg mt-6">
              <div className="flex justify-between text-xs mb-1">
                <span className="dark:text-gray-300">{profile.points} points</span>
                <span className="dark:text-gray-300">
                  {profile.points < 100 ? (
                    <>Need {100 - profile.points} more points for first badge</>
                  ) : profile.points < 500 ? (
                    <>Need {500 - profile.points} more points for next badge</>
                  ) : profile.points < 1000 ? (
                    <>Need {1000 - profile.points} more points for next badge</>
                  ) : profile.points < 5000 ? (
                    <>Need {5000 - profile.points} more points for next badge</>
                  ) : (
                    <>Master Eco Warrior achieved!</>
                  )}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-ecosort-primary to-ecosort-secondary h-2.5 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, profile.points >= 5000 
                      ? 100 
                      : profile.points >= 1000 
                        ? 75 + (profile.points - 1000) / (5000 - 1000) * 25
                        : profile.points >= 500 
                          ? 50 + (profile.points - 500) / (1000 - 500) * 25 
                          : profile.points >= 100 
                            ? 25 + (profile.points - 100) / (500 - 100) * 25
                            : profile.points / 100 * 25
                    )}%` 
                  }}
                ></div>
              </div>
              
              <div className="flex justify-between mt-2 text-xs dark:text-gray-400">
                <span>Beginner<br/>100 pts</span>
                <span>Bronze<br/>500 pts</span>
                <span>Silver<br/>1000 pts</span>
                <span>Gold<br/>5000 pts</span>
              </div>
            </div>
          </div>
        </div>

        <Card className="mb-6 overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-ecosort-primary" />
              Your Activity
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Stats about your eco-friendly actions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 border-b dark:border-gray-700">
              <div className="p-4 border-r dark:border-gray-700">
                <div className="flex items-center mb-2">
                  <Camera className="h-5 w-5 text-ecosort-primary mr-2" />
                  <h3 className="font-medium dark:text-white">Total Scans</h3>
                </div>
                <p className="text-2xl font-bold dark:text-white">{profile.scans}</p>
              </div>
              <div className="p-4">
                <div className="flex items-center mb-2">
                  <Award className="h-5 w-5 text-ecosort-highlight mr-2" />
                  <h3 className="font-medium dark:text-white">Badges</h3>
                </div>
                <div className="flex items-center">
                  <p className="text-2xl font-bold dark:text-white">{earnedBadges.length}</p>
                  <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    {earnedBadges.length === 0 ? (
                      <span>
                        Need {100 - profile.points} more points
                      </span>
                    ) : (
                      <span>
                        Next badge: {getNextMilestone(profile.points) - profile.points} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Scan streak section */}
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                  <h3 className="font-medium dark:text-white">Scan Streak</h3>
                </div>
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">
                  {streakDays} days
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {[...Array(7)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2 rounded-full ${i < streakDays ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-700'}`}
                  ></div>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Keep scanning daily to maintain your streak!
              </p>
            </div>
            
            {/* Waste category chart */}
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center mb-3">
                <Trash2 className="h-5 w-5 text-ecosort-primary mr-2" />
                <h3 className="font-medium dark:text-white">Waste Categories</h3>
              </div>
              <div className="flex items-center gap-1 mb-3">
                {/* Circular category representation */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="relative h-16 w-16 mb-1">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" strokeWidth="3"></circle>
                      <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#22c55e" strokeWidth="3" strokeDasharray="40 100" strokeDashoffset="25"></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium dark:text-white">40%</div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Plastic</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="relative h-16 w-16 mb-1">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" strokeWidth="3"></circle>
                      <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#3b82f6" strokeWidth="3" strokeDasharray="30 100" strokeDashoffset="25"></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium dark:text-white">30%</div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Paper</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="relative h-16 w-16 mb-1">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" strokeWidth="3"></circle>
                      <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#eab308" strokeWidth="3" strokeDasharray="20 100" strokeDashoffset="25"></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium dark:text-white">20%</div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Glass</span>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="relative h-16 w-16 mb-1">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" strokeWidth="3"></circle>
                      <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#64748b" strokeWidth="3" strokeDasharray="10 100" strokeDashoffset="25"></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium dark:text-white">10%</div>
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Other</span>
                </div>
              </div>
            </div>
            
            {/* Recent Scans */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Camera className="h-5 w-5 text-ecosort-primary mr-2" />
                  <h3 className="font-medium dark:text-white">Recent Scans</h3>
                </div>
                <button className="text-xs text-ecosort-primary dark:text-ecosort-accent hover:underline">
                  View All
                </button>
              </div>
              
              {/* Recent scan items */}
              <div className="space-y-3">
                <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center mr-3">
                    <Leaf className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium text-sm dark:text-white">Plastic Bottle</p>
                      <span className="text-xs text-ecosort-primary dark:text-ecosort-accent">+5 pts</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 days ago</p>
                  </div>
                  <div className="ml-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full">
                    ✓ Recycled
                  </div>
                </div>
                
                <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="h-10 w-10 bg-yellow-100 dark:bg-yellow-900 rounded flex items-center justify-center mr-3">
                    <Leaf className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium text-sm dark:text-white">Cardboard Box</p>
                      <span className="text-xs text-ecosort-primary dark:text-ecosort-accent">+5 pts</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">3 days ago</p>
                  </div>
                  <div className="ml-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full">
                    ✓ Recycled
                  </div>
                </div>
                
                <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center mr-3">
                    <Leaf className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium text-sm dark:text-white">Glass Jar</p>
                      <span className="text-xs text-ecosort-primary dark:text-ecosort-accent">+5 pts</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">5 days ago</p>
                  </div>
                  <div className="ml-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full">
                    ✓ Recycled
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges Card */}
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-ecosort-highlight" />
              Your Eco Badges
            </CardTitle>
            <CardDescription className="dark:text-gray-400">Badges earned through your sustainability efforts</CardDescription>
          </CardHeader>
          <CardContent className="p-4 dark:bg-gray-900">
            {earnedBadges.length > 0 ? (
              <>
                <h3 className="font-medium text-sm mb-3 text-gray-700 dark:text-gray-300">Earned Badges</h3>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {earnedBadges.map((badge, index) => {
                    const BadgeIcon = badge.icon;
                    return (
                      <div 
                        key={index} 
                        className="group relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg flex flex-col items-center hover:shadow-md transition-all cursor-pointer"
                      >
                        <div 
                          className={`p-3 rounded-full ${badge.color.replace('text-', 'bg-')} bg-opacity-20 mb-2 transform group-hover:scale-110 transition-transform`}
                        >
                          <BadgeIcon className={`h-6 w-6 ${badge.color}`} />
                        </div>
                        <h3 className="font-medium text-sm text-center dark:text-white">{badge.name}</h3>
                        
                        {/* Tooltip on hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-10 transition-opacity flex flex-col justify-center items-center">
                          <BadgeIcon className={`h-8 w-8 ${badge.color} mb-2`} />
                          <h3 className="font-medium dark:text-white">{badge.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">{badge.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}
            
            {/* Locked Badges */}
            <h3 className="font-medium text-sm mb-3 text-gray-700 dark:text-gray-300">Badges to Unlock</h3>
            <div className="grid grid-cols-3 gap-3">
              {badgeDefinitions
                .filter(badge => profile.points < badge.milestone)
                .map((badge, index) => {
                  const BadgeIcon = badge.icon;
                  const progress = Math.min(100, (profile.points / badge.milestone) * 100);
                  
                  return (
                    <div 
                      key={index} 
                      className="group relative bg-gray-100 dark:bg-gray-800 p-4 rounded-lg flex flex-col items-center hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="relative">
                        <div className="p-3 rounded-full bg-gray-300 dark:bg-gray-700 bg-opacity-50 mb-2">
                          <BadgeIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div className="absolute -top-1 -right-1">
                          <div className="bg-gray-200 dark:bg-gray-600 rounded-full p-1">
                            <Lock className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <h3 className="font-medium text-sm text-center text-gray-500 dark:text-gray-400">{badge.name}</h3>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-gray-400 dark:bg-gray-500 h-1 rounded-full" 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {Math.floor(progress)}%
                      </p>
                      
                      {/* Tooltip on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-10 transition-opacity flex flex-col justify-center items-center">
                        <BadgeIcon className={`h-8 w-8 ${badge.color} mb-2`} />
                        <h3 className="font-medium dark:text-white">{badge.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">{badge.description}</p>
                        <div className="mt-2 text-xs font-medium text-ecosort-primary dark:text-ecosort-accent">
                          Unlock at {badge.milestone} points
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {badge.milestone - profile.points} points to go!
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {earnedBadges.length === 0 && (
              <div className="flex flex-col items-center mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Award className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-600 dark:text-gray-400 text-center">Keep scanning to earn your first badge!</p>
                <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-ecosort-primary to-ecosort-secondary h-2"
                    style={{ width: `${(profile.points / 100) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {profile.points}/100 points to first badge
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Settings Card */}
        <Card>
          <CardHeader className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 cursor-pointer" onClick={() => setSettingsExpanded(!settingsExpanded)}>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                Account Settings
              </CardTitle>
              <button className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <ChevronDown
                  className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${settingsExpanded ? 'transform rotate-180' : ''}`}
                />
              </button>
            </div>
          </CardHeader>
          
          {settingsExpanded && (
            <CardContent className="p-0 divide-y dark:divide-gray-700">
              <div className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="bg-ecosort-primary/10 dark:bg-ecosort-primary/20 p-2 rounded-full mr-3">
                  <Edit className="h-5 w-5 text-ecosort-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium dark:text-white">Edit Profile</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Change your name and profile picture</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              
              <div className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="bg-ecosort-accent/10 dark:bg-ecosort-accent/20 p-2 rounded-full mr-3">
                  <Bell className="h-5 w-5 text-ecosort-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium dark:text-white">Notification Settings</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Manage app notifications</p>
                </div>
                <div className="flex items-center">
                  <Switch defaultChecked className="bg-ecosort-primary data-[state=checked]:bg-ecosort-primary" />
                </div>
              </div>
              
              <div className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="bg-ecosort-highlight/10 dark:bg-ecosort-highlight/20 p-2 rounded-full mr-3">
                  <Lock className="h-5 w-5 text-ecosort-highlight" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium dark:text-white">Privacy Settings</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Control your data and visibility</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              
              <div className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer" onClick={toggleTheme}>
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-3">
                  <SunMoon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium dark:text-white">App Theme</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark mode</p>
                </div>
                <div className="flex items-center">
                  <div className={`w-10 h-5 ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-300'} rounded-full relative cursor-pointer`}>
                    <div className={`h-4 w-4 bg-white rounded-full absolute ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'} top-0.5 shadow-sm transition-transform`}></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full mr-3">
                  <Download className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium dark:text-white">Export Your Data</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Download your activity history</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              
              <div className="p-4">
                <Button 
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Profile;