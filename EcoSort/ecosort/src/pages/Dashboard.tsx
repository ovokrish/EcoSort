import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Camera, MessageSquare, User, Leaf, Zap, Award, Recycle, Droplet, DollarSign, FileText, Wine, Coffee } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserScans, ScanRecord } from '@/services/ecoPoints';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { fromProfiles } from '@/lib/supabase';
import "./dashboard.css"; // Import the CSS for animations

// Eco tips for daily inspiration
const ecoTips = [
  "Recycling one aluminum can saves enough energy to run a TV for 3 hours.",
  "A single plastic bottle takes 450 years to decompose in a landfill.",
  "The average person generates about 4.5 pounds of trash every day.",
  "Reducing your shower by just 2 minutes saves 10 gallons of water.",
  "Glass is 100% recyclable and can be recycled endlessly without quality loss.",
  "Americans use 500 million plastic straws every day.",
  "It takes 20 times less energy to make an aluminum can from recycled material.",
  "E-waste is the fastest growing waste stream in the world.",
  "Paper can be recycled 5-7 times before the fibers become too short."
];

// Material type icons mapping
const materialIcons = {
  "plastic": <DollarSign className="h-5 w-5" />,
  "glass": <Wine className="h-5 w-5" />,
  "paper": <FileText className="h-5 w-5" />,
  "metal": <Zap className="h-5 w-5" />,
  "organic": <Coffee className="h-5 w-5" />,
  "electronic": <Zap className="h-5 w-5" />,
  "default": <Recycle className="h-5 w-5" />
};

// Material type colors and backgrounds
const materialColors = {
  "plastic": { bg: "bg-blue-100", text: "text-blue-600", icon: "text-blue-500" },
  "glass": { bg: "bg-cyan-100", text: "text-cyan-600", icon: "text-cyan-500" },
  "paper": { bg: "bg-yellow-100", text: "text-yellow-700", icon: "text-yellow-600" },
  "metal": { bg: "bg-gray-100", text: "text-gray-700", icon: "text-gray-500" },
  "organic": { bg: "bg-green-100", text: "text-green-700", icon: "text-green-600" },
  "electronic": { bg: "bg-red-100", text: "text-red-600", icon: "text-red-500" },
  "default": { bg: "bg-ecosort-primary/10", text: "text-ecosort-primary", icon: "text-ecosort-primary" }
};

// Function to format dates in a more human-readable way
const formatScanDate = (date) => {
  const now = new Date();
  const scanDate = new Date(date);
  
  // Check if it's today
  if (scanDate.toDateString() === now.toDateString()) {
    const hours = scanDate.getHours();
    const minutes = scanDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `Today, ${formattedHours}:${formattedMinutes} ${ampm}`;
  }
  
  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (scanDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  
  // If it's within the last week
  const daysAgo = Math.floor((now.getTime() - scanDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysAgo < 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[scanDate.getDay()];
  }
  
  // Otherwise return a simple date
  return scanDate.toLocaleDateString();
};

// Group scans by date
const groupScansByDate = (scans) => {
  const groups = {};
  
  scans.forEach(scan => {
    const date = formatScanDate(scan.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(scan);
  });
  
  return groups;
};

const Dashboard = () => {
  const [points, setPoints] =  useState("");
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [dailyTip, setDailyTip] = useState("");
  
  useEffect(() => {
    const a = localStorage.getItem("ecoPoints");
    setPoints(a);
    
    // Set a random eco tip for today
    const randomTipIndex = Math.floor(Math.random() * ecoTips.length);
    setDailyTip(ecoTips[randomTipIndex]);
  }, []);
  
  // Function to handle click on points display
  const handlePointsClick = () => {
    const now = Date.now();
    // Reset counter if more than 1 second between clicks
    if (now - lastClickTime > 1000) {
      setClickCount(1);
    } else {
      setClickCount(prev => prev + 1);
    }
    setLastClickTime(now);
    
    // Reset points after 10 rapid clicks
    if (clickCount + 1 >= 10) {
      // Reset points in localStorage
      localStorage.removeItem('ecoPoints');
      localStorage.setItem('ecoPoints', '0');
      
      // Update state
      setPoints('0');
      setClickCount(0);
      
      // Show toast or alert
      alert('Points have been reset to 0');
      
      // Force reload to update all components
      window.location.reload();
    }
  };

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
          scans: Math.floor(localPoints/5),
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

  // Get material icon
  const getMaterialIcon = (type) => {
    const lowerType = type?.toLowerCase() || '';
    for (const [key, icon] of Object.entries(materialIcons)) {
      if (lowerType.includes(key)) {
        return React.cloneElement(icon, { className: `h-5 w-5 ${getMaterialColors(type).icon}` });
      }
    }
    return React.cloneElement(materialIcons.default, { className: `h-5 w-5 ${materialColors.default.icon}` });
  };
  
  // Get material colors
  const getMaterialColors = (type) => {
    const lowerType = type?.toLowerCase() || '';
    for (const [key, colors] of Object.entries(materialColors)) {
      if (lowerType.includes(key)) {
        return colors;
      }
    }
    return materialColors.default;
  };

  // Get scan method icon
  const getScanMethodIcon = (scan) => {
    // This is a placeholder - in a real implementation,
    // you'd have a field in the scan record to indicate AI vs manual
    const isAI = scan.id.length % 2 === 0; // Just for demo purposes
    return isAI ? (
      <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
        <Camera className="h-3 w-3" />AI
      </span>
    ) : (
      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
        <User className="h-3 w-3" />Manual
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-ecosort-primary text-white p-6">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Welcome, {profile.display_name}</h1>
          <div className="flex items-center gap-2 opacity-90">
            <Leaf className="h-5 w-5" />
            <p>Your journey to a greener planet continues</p>
          </div>
          <p className="text-xs mt-2 opacity-80 italic">"{dailyTip}"</p>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4 shadow-md hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-300" />
                <p className="text-sm opacity-80">Total Points</p>
              </div>
              <h2 className="text-2xl font-bold cursor-pointer" onClick={handlePointsClick}>{profile.points}</h2>
            </div>
            <div className="bg-white/10 rounded-lg p-4 shadow-md hover:bg-white/15 transition-colors">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-green-300" />
                <p className="text-sm opacity-80">Items Scanned</p>
              </div>
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
                className="flex flex-col items-center justify-center bg-ecosort-secondary/10 hover:bg-ecosort-secondary/20 hover:scale-102 text-ecosort-secondary rounded-lg p-6 transition-all shadow-sm hover:shadow-md"
              >
                <Camera className="h-8 w-8 mb-2" />
                <span className="font-medium">Scan Waste</span>
                <span className="text-xs mt-1 text-gray-600">Snap & Sort</span>
              </button>
              <button 
                onClick={() => navigateTo('/cht')}
                className="flex flex-col items-center justify-center bg-ecosort-accent/10 hover:bg-ecosort-accent/20 hover:scale-102 text-ecosort-accent rounded-lg p-6 transition-all shadow-sm hover:shadow-md"
              >
                <MessageSquare className="h-8 w-8 mb-2" />
                <span className="font-medium">Chat</span>
                <span className="text-xs mt-1 text-gray-600">Ask Eco Community</span>
              </button>
              <button 
                onClick={() => navigateTo('/leaderboard')}
                className="flex flex-col items-center justify-center bg-ecosort-highlight/10 hover:bg-ecosort-highlight/20 hover:scale-102 text-ecosort-highlight rounded-lg p-6 transition-all shadow-sm hover:shadow-md"
              >
                <Trophy className="h-8 w-8 mb-2" />
                <span className="font-medium">Leaderboard</span>
                <span className="text-xs mt-1 text-gray-600">See Top Scanners</span>
              </button>
              <button 
                onClick={() => navigateTo('/profile')}
                className="flex flex-col items-center justify-center bg-gray-100 hover:bg-gray-200 hover:scale-102 text-gray-700 rounded-lg p-6 transition-all shadow-sm hover:shadow-md"
              >
                <User className="h-8 w-8 mb-2" />
                <span className="font-medium">Profile</span>
                <span className="text-xs mt-1 text-gray-600">Track Your Journey</span>
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
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Recycle className="h-5 w-5 text-ecosort-primary" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Your latest waste scans and points earned</CardDescription>
                </div>
                <div className="flex gap-2">
                  <select className="text-xs bg-gray-100 border px-2 py-1 rounded">
                    <option value="all">All Types</option>
                    <option value="plastic">Plastic</option>
                    <option value="paper">Paper</option>
                    <option value="glass">Glass</option>
                    <option value="organic">Organic</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-pulse-light h-6 w-24 bg-gray-200 rounded"></div>
                  </div>
                ) : recentScans.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(groupScansByDate(recentScans)).map(([date, scans]) => (
                      <div key={date}>
                        <div className="date-group-header">
                          {date}
                        </div>
                        <div className="space-y-3">
                          {scans.map((scan, index) => {
                            const materialColor = getMaterialColors(scan.wasteType);
                            
                            return (
                              <div 
                                key={scan.id} 
                                className="flex items-start space-x-3 p-3 rounded-lg border bg-white hover:shadow-md transition-all animate-fadeIn hover-lift"
                              >
                                <div className="relative">
                                  <div className="h-14 w-14 scan-image-container bg-gray-200 overflow-hidden">
                                    {scan.imageUrl ? (
                                      <img 
                                        src={scan.imageUrl} 
                                        alt={scan.wasteType}
                                        onError={(e) => e.currentTarget.src = '/fallback-waste-icon.png'}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className={`${materialColor.bg} h-full w-full flex items-center justify-center`}>
                                        {getMaterialIcon(scan.wasteType)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="scan-method">
                                    {getScanMethodIcon(scan)}
                                  </div>
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-1">
                                        <span className={`material-tag ${materialColor.bg} ${materialColor.text}`}>
                                          {getMaterialIcon(scan.wasteType)}
                                          <span className="ml-1 capitalize">{scan.wasteType}</span>
                                        </span>
                                      </div>
                                      
                                      <p className="text-xs text-gray-500 mt-1">
                                        {new Date(scan.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </p>
                                    </div>
                                    
                                    <div className="flex flex-col items-end">
                                      <div className="text-ecosort-primary font-medium animate-points">
                                        +{scan.points} pts
                                      </div>
                                      
                                      {/* Show streak if applicable */}
                                      {index === 0 && date === 'Today' && (
                                        <div className="streak-badge">
                                          <Zap className="h-3 w-3" />
                                          3-Day Streak
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Progress toward category milestone */}
                                  <div className="mt-2">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                      <span>Category progress</span>
                                      <span>60%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-1 rounded-full">
                                      <div
                                        className={`${materialColor.bg} h-1 rounded-full`}
                                        style={{ width: '60%' }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    
                    {recentScans.length > 0 && (
                      <div className="text-center pt-3">
                        <button className="text-sm bg-gray-100 hover:bg-gray-200 text-ecosort-primary px-4 py-2 rounded-full transition-colors">
                          View All Activity
                        </button>
                      </div>
                    )}
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
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-ecosort-highlight" />
                  Earned Badges
                </CardTitle>
                <CardDescription>Achievements you've unlocked on your eco journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* First badge - either earned or placeholder */}
                  <div className={`${profile.points >= 100 
                      ? 'bg-gradient-to-r from-green-50 to-blue-50' 
                      : 'bg-gray-100'} p-4 rounded-lg text-center transition-all`}
                  >
                    <div className={`inline-flex items-center justify-center h-12 w-12 rounded-full 
                      ${profile.points >= 100 
                        ? 'bg-ecosort-primary text-white' 
                        : 'bg-gray-300 text-gray-500'} mb-2`}
                    >
                      {profile.points >= 100 ? '🏆' : '🔒'}
                    </div>
                    <h3 className="font-medium text-gray-900">Eco Starter</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {profile.points >= 100 
                        ? 'Unlocked!' 
                        : `Need ${100 - profile.points} more points`}
                    </p>
                  </div>
                  
                  {/* Second badge - either earned or placeholder */}
                  <div className={`${profile.points >= 500 
                      ? 'bg-gradient-to-r from-green-50 to-blue-50' 
                      : 'bg-gray-100'} p-4 rounded-lg text-center transition-all`}
                  >
                    <div className={`inline-flex items-center justify-center h-12 w-12 rounded-full 
                      ${profile.points >= 500 
                        ? 'bg-ecosort-primary text-white' 
                        : 'bg-gray-300 text-gray-500'} mb-2`}
                    >
                      {profile.points >= 500 ? '🌟' : '🔒'}
                    </div>
                    <h3 className="font-medium text-gray-900">Green Enthusiast</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {profile.points >= 500 
                        ? 'Unlocked!' 
                        : `Need ${500 - profile.points} more points`}
                    </p>
                  </div>
                  
                  {/* Third badge placeholder */}
                  <div className={`${profile.points >= 1000 
                      ? 'bg-gradient-to-r from-green-50 to-blue-50' 
                      : 'bg-gray-100'} p-4 rounded-lg text-center transition-all`}
                  >
                    <div className={`inline-flex items-center justify-center h-12 w-12 rounded-full 
                      ${profile.points >= 1000 
                        ? 'bg-ecosort-primary text-white' 
                        : 'bg-gray-300 text-gray-500'} mb-2`}
                    >
                      {profile.points >= 1000 ? '🌍' : '🔒'}
                    </div>
                    <h3 className="font-medium text-gray-900">Eco Activist</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {profile.points >= 1000 
                        ? 'Unlocked!' 
                        : `Need ${1000 - profile.points} more points`}
                    </p>
                  </div>
                  
                  {/* Fourth badge placeholder */}
                  <div className="bg-gray-100 p-4 rounded-lg text-center">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-300 text-gray-500 mb-2">
                      🔒
                    </div>
                    <h3 className="font-medium text-gray-900">Climate Champion</h3>
                    <p className="text-xs text-gray-500 mt-1">Unlock at 2000 points</p>
                  </div>
                </div>
                
                {/* Scan streak section */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Daily Scan Streak
                  </h3>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                    <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>3 days</span>
                    <span>Goal: 10 days</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Scan at least one item daily to build your streak!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
