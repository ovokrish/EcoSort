import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Medal, Crown, Search, Filter, Users, Globe, Flag, Zap, ChevronDown, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getLeaderboard, LeaderboardEntry } from '@/services/ecoPoints';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Define motivational quotes for rotation
const motivationalQuotes = [
  "Every scan helps the Earth breathe better 🌍",
  "Small actions today, big impact tomorrow 🌱",
  "Join the movement, save our planet 🌊",
  "Be the change you want to see in the world 🌈",
  "Together we can make Earth greener 🌿",
  "Your eco actions inspire others to follow 🔆"
];

// Define hardcoded users with full names from different regions
const hardcodedUsers = [
  { id: 'u1', name: 'Emma Johnson', region: 'United Kingdom', points: 9876, scans: 982, level: 4, badge: 'Eco Guardian', streakDays: 14, lastActive: '2 hours ago', avatar: '👩‍🦰' },
  { id: 'u2', name: 'Santiago Fernández', region: 'Spain', points: 9541, scans: 943, level: 4, badge: 'Plastic Master', streakDays: 7, lastActive: '1 day ago', avatar: '👨' },
  { id: 'u3', name: 'Yuki Tanaka', region: 'Japan', points: 9320, scans: 891, level: 4, badge: 'Paper Hero', streakDays: 21, lastActive: '4 hours ago', avatar: '👩' },
  { id: 'u4', name: 'Priya Sharma', region: 'India', points: 8975, scans: 878, level: 3, badge: 'Eco Activist', streakDays: 5, lastActive: '1 hour ago', avatar: '👩‍🦱' },
  { id: 'u5', name: 'Miguel Rodriguez', region: 'Brazil', points: 8721, scans: 845, level: 3, badge: 'Composting King', streakDays: 12, lastActive: '3 hours ago', avatar: '👨‍🦱' },
  { id: 'u6', name: 'Liu Wei', region: 'China', points: 8542, scans: 832, level: 3, badge: 'Glass Guardian', streakDays: 9, lastActive: '5 hours ago', avatar: '👨‍🦲' },
  { id: 'u7', name: 'Olga Petrova', region: 'Russia', points: 8210, scans: 815, level: 3, badge: 'Waste Warrior', streakDays: 0, lastActive: '2 days ago', avatar: '👱‍♀️' },
  { id: 'u8', name: 'Kwame Osei', region: 'Ghana', points: 7965, scans: 793, level: 3, badge: 'Planet Protector', streakDays: 5, lastActive: '1 day ago', avatar: '👨‍🦳' },
  { id: 'u9', name: 'Sofia Moretti', region: 'Italy', points: 7712, scans: 766, level: 3, badge: 'Eco Champion', streakDays: 3, lastActive: '12 hours ago', avatar: '👩‍🦰' },
  { id: 'u10', name: 'Ahmed Al-Farsi', region: 'UAE', points: 7540, scans: 748, level: 3, badge: 'Green Guru', streakDays: 8, lastActive: '6 hours ago', avatar: '👳‍♂️' },
  { id: 'u11', name: 'Hannah Schmidt', region: 'Germany', points: 7328, scans: 725, level: 3, badge: 'Metal Magician', streakDays: 4, lastActive: '1 day ago', avatar: '👱‍♀️' },
  { id: 'u12', name: 'Carlos Vega', region: 'Mexico', points: 7125, scans: 703, level: 3, badge: 'Compost Creator', streakDays: 6, lastActive: '5 hours ago', avatar: '👨‍🦱' },
  { id: 'u13', name: 'Olivia Thompson', region: 'Australia', points: 6945, scans: 682, level: 3, badge: 'Wildlife Warrior', streakDays: 11, lastActive: '3 hours ago', avatar: '👩‍🦱' },
  { id: 'u14', name: 'Jean-Pierre Dubois', region: 'France', points: 6780, scans: 671, level: 2, badge: 'Eco Pioneer', streakDays: 2, lastActive: '1 day ago', avatar: '👨‍🦳' },
  { id: 'u15', name: 'Kim Min-jun', region: 'South Korea', points: 6542, scans: 654, level: 2, badge: 'Ocean Guardian', streakDays: 7, lastActive: '8 hours ago', avatar: '👨' }
];

// Mapping for region to flag emojis
const regionFlags = {
  'United Kingdom': '🇬🇧',
  'Spain': '🇪🇸',
  'Japan': '🇯🇵',
  'India': '🇮🇳',
  'Brazil': '🇧🇷',
  'China': '🇨🇳',
  'Russia': '🇷🇺',
  'Ghana': '🇬🇭',
  'Italy': '🇮🇹',
  'UAE': '🇦🇪',
  'Germany': '🇩🇪',
  'Mexico': '🇲🇽',
  'Australia': '🇦🇺',
  'France': '🇫🇷',
  'South Korea': '🇰🇷'
};

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [filterTab, setFilterTab] = useState('global');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('points');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserRef = useRef(null);

  // Generate hardcoded leaderboard data
  const generateHardcodedLeaderboard = () => {
    // Create leaderboard entries from our hardcoded users
    const topUsers: LeaderboardEntry[] = hardcodedUsers.map((user, index) => {
      const flag = regionFlags[user.region] || '🌍';
      return {
        id: user.id,
        displayName: user.name,
        region: user.region,
        flag,
        points: user.points,
        scans: user.scans,
        rank: index + 1,
        level: user.level,
        badge: user.badge,
        streakDays: user.streakDays,
        lastActive: user.lastActive,
        avatar: user.avatar
      };
    });

    // Get user points from localStorage to match Dashboard behavior
    const localPoints = parseInt(localStorage.getItem('ecoPoints')) || 0;
    const userScans = Math.floor(localPoints / 5); // Calculate scans same way as Dashboard

    // Determine user level based on points
    const getUserLevel = (points) => {
      if (points < 100) return 1;
      if (points < 500) return 2;
      if (points < 1000) return 3;
      if (points < 5000) return 4;
      return 5;
    };

    // Create the current user entry at position 1990
    const currentUserEntry: LeaderboardEntry | null = user ? {
      id: user.id,
      displayName: user.user_metadata?.display_name || 'You',
      region: 'Your Location',
      flag: '📍',
      points: localPoints,
      scans: userScans,
      rank: 1990,
      level: getUserLevel(localPoints),
      badge: 'Eco Beginner',
      streakDays: 0,
      lastActive: 'Just now',
      avatar: '😀'
    } : null;

    return { topUsers, currentUserEntry };
  };

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      // Instead of fetching from the API, use our hardcoded data
      const { topUsers } = generateHardcodedLeaderboard();
      setLeaderboard(topUsers);
      setFilteredLeaderboard(topUsers);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for refresh parameter in URL to force data reload
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const shouldRefresh = queryParams.get('refresh') === 'true';
    
    if (shouldRefresh) {
      // Clean up the URL
      const cleanUrl = location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Reload leaderboard data
      loadLeaderboard();
    }
  }, [location]);

  // Rotate motivational quotes
  useEffect(() => {
    const intervalId = setInterval(() => {
      setQuoteIndex((prevIndex) => (prevIndex + 1) % motivationalQuotes.length);
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Apply filters and search
  useEffect(() => {
    if (leaderboard.length === 0) return;

    let filtered = [...leaderboard];

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.region.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    if (sortBy === 'points') {
      filtered = filtered.sort((a, b) => b.points - a.points);
    } else if (sortBy === 'scans') {
      filtered = filtered.sort((a, b) => b.scans - a.scans);
    } else if (sortBy === 'streak') {
      filtered = filtered.sort((a, b) => b.streakDays - a.streakDays);
    }

    // Re-assign ranks
    filtered = filtered.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

    setFilteredLeaderboard(filtered);
  }, [leaderboard, searchTerm, sortBy]);

  useEffect(() => {
    loadLeaderboard();

    // Add listener for localStorage changes
    const handleStorageChange = (e) => {
      // Only reload if ecoPoints changed
      if (e.key === 'ecoPoints') {
        loadLeaderboard();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Scroll to current user's entry when reference is available
  useEffect(() => {
    if (currentUserRef.current) {
      // Smooth scroll to element with a slight delay to ensure rendering is complete
      setTimeout(() => {
        currentUserRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 500);
    }
  }, [currentUserRef.current]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="relative animate-pulse">
            <Crown className="h-6 w-6 text-yellow-500" />
            <span className="absolute -top-1 -right-1 text-xs">✨</span>
          </div>
        );
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-gray-500">{rank}</span>;
    }
  };

  const getRowClass = (userId: string, rank: number) => {
    // Highlight current user
    if (user && userId === user.id) {
      return 'bg-ecosort-primary/10 font-medium';
    }
    
    // Alternate row colors for better readability
    if (rank % 2 === 0) {
      return 'bg-green-50 dark:bg-green-900/10';
    }
    
    // Add special styling for top 3
    if (rank <= 3) {
      return 'bg-gradient-to-r from-yellow-50 to-white dark:from-yellow-900/10 dark:to-transparent';
    }
    
    return '';
  };

  const getProgressWidth = (points: number, level: number) => {
    switch (level) {
      case 1: return `${Math.min(100, (points / 100) * 100)}%`;
      case 2: return `${Math.min(100, ((points - 100) / 400) * 100)}%`;
      case 3: return `${Math.min(100, ((points - 500) / 500) * 100)}%`;
      case 4: return `${Math.min(100, ((points - 1000) / 4000) * 100)}%`;
      case 5: return '100%';
      default: return '0%';
    }
  };

  const getLevelTitle = (level: number) => {
    switch (level) {
      case 1: return 'Beginner';
      case 2: return 'Recycler';
      case 3: return 'Eco Warrior';
      case 4: return 'Planet Defender';
      case 5: return 'Sustainability Master';
      default: return 'Beginner';
    }
  };

  // Get current user data for the user section
  const { currentUserEntry } = generateHardcodedLeaderboard();

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
          <h1 className="text-xl font-bold">Eco Leaderboard</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4">
        {/* User stats preview - always pinned */}
        {currentUserEntry && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 border-l-4 border-ecosort-primary">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-ecosort-primary/10 w-10 h-10 rounded-full flex items-center justify-center text-xl mr-3">
                  {currentUserEntry.avatar}
                </div>
                <div>
                  <div className="font-bold text-ecosort-primary">
                    You're #{currentUserEntry.rank} with {currentUserEntry.points} pts!
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {currentUserEntry.scans} scans · Level {currentUserEntry.level} {getLevelTitle(currentUserEntry.level)}
                  </div>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate('/try')}
                className="bg-ecosort-primary hover:bg-ecosort-secondary"
              >
                Scan more!
              </Button>
            </div>
          </div>
        )}
        
        <Card className="mb-4 overflow-hidden shadow-md">
          {/* Dynamic Header Section */}
          <CardHeader className="bg-gradient-to-r from-ecosort-primary to-ecosort-secondary text-white pb-2">
            <CardTitle className="text-center flex items-center justify-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 animate-bounce" />
              Global Eco Warriors
              <Crown className="h-6 w-6 animate-pulse" />
            </CardTitle>
            <CardDescription className="text-white/90 text-center italic">
              "{motivationalQuotes[quoteIndex]}"
            </CardDescription>
          </CardHeader>
          
          {/* Filter and Search Section */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b">
            <div className="flex flex-wrap gap-2">
              <div className="flex-1">
                <Tabs defaultValue="global" value={filterTab} onValueChange={setFilterTab} className="w-full">
                  <TabsList className="w-full bg-gray-100 dark:bg-gray-700">
                    <TabsTrigger value="global" className="flex-1 flex items-center gap-1">
                      <Globe className="h-4 w-4" /> Global
                    </TabsTrigger>
                    <TabsTrigger value="country" className="flex-1 flex items-center gap-1">
                      <Flag className="h-4 w-4" /> Country
                    </TabsTrigger>
                    <TabsTrigger value="friends" className="flex-1 flex items-center gap-1">
                      <Users className="h-4 w-4" /> Friends
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <div className="flex items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="p-2 bg-white dark:bg-gray-700 border rounded-md text-sm flex-shrink-0"
                >
                  <option value="points">Top Points</option>
                  <option value="scans">Top Scanners</option>
                  <option value="streak">Hot Streaks 🔥</option>
                </select>
              </div>
            </div>
          </div>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-pulse space-y-4 w-full px-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="divide-y dark:divide-gray-700">
                {filteredLeaderboard.map((entry) => (
                  <div 
                    key={entry.id} 
                    className={`flex items-center px-4 py-3 ${getRowClass(entry.id, entry.rank)}`}
                    ref={user && entry.id === user.id ? currentUserRef : null}
                  >
                    <div className="flex items-center justify-center h-8 w-8 mr-3 flex-shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xl mr-3 flex-shrink-0">
                      {entry.avatar}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center">
                        <span className="truncate">{entry.displayName}</span>
                        <span className="ml-1">{entry.flag}</span>
                        {entry.streakDays >= 7 && (
                          <span className="ml-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 px-1 rounded flex items-center">
                            🔥 {entry.streakDays}
                          </span>
                        )}
                        {user && entry.id === user.id && (
                          <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-1 rounded">
                            You
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <span className="mr-2">🧪 {entry.scans} scans</span>
                        <span className="mr-1">|</span>
                        <span>
                          <span className="font-medium text-ecosort-primary dark:text-ecosort-accent">Lv{entry.level}</span>
                          <span className="ml-1 text-xs">{entry.badge}</span>
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-ecosort-primary to-ecosort-secondary h-1 rounded-full" 
                          style={{ width: getProgressWidth(entry.points, entry.level) }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-ecosort-primary dark:text-ecosort-accent font-medium ml-2 flex-shrink-0">
                      {entry.points} pts
                    </div>
                  </div>
                ))}
                
                {/* Add a separator and show current user's position if not in view */}
                {currentUserEntry && !filteredLeaderboard.some(entry => entry.id === currentUserEntry.id) && (
                  <>
                    <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm text-center">
                      • • •
                    </div>
                    <div 
                      className="flex items-center px-4 py-3 bg-ecosort-primary/10 font-medium"
                      ref={currentUserRef}
                    >
                      <div className="flex items-center justify-center h-8 w-8 mr-3 flex-shrink-0">
                        <span className="text-gray-500">{currentUserEntry.rank}</span>
                      </div>
                      
                      <div className="h-10 w-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xl mr-3 flex-shrink-0">
                        {currentUserEntry.avatar}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium flex items-center">
                          <span className="truncate">{currentUserEntry.displayName}</span>
                          <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-1 rounded">
                            You
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span className="mr-2">🧪 {currentUserEntry.scans} scans</span>
                          <span className="mr-1">|</span>
                          <span>
                            <span className="font-medium text-ecosort-primary dark:text-ecosort-accent">Lv{currentUserEntry.level}</span>
                            <span className="ml-1 text-xs">{currentUserEntry.badge}</span>
                          </span>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-ecosort-primary to-ecosort-secondary h-1 rounded-full" 
                            style={{ width: getProgressWidth(currentUserEntry.points, currentUserEntry.level) }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="text-ecosort-primary dark:text-ecosort-accent font-medium ml-2 flex-shrink-0">
                        {currentUserEntry.points} pts
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            <div className="p-4 text-sm text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-b-lg">
              <div className="mb-3">
                Scan more waste to climb the leaderboard and earn badges!
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
