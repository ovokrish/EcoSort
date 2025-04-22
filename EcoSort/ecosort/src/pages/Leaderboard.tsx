import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getLeaderboard, LeaderboardEntry } from '@/services/ecoPoints';
import { Separator } from '@/components/ui/separator';

// Define hardcoded users with full names from different regions
const hardcodedUsers = [
  { id: 'u1', name: 'Emma Johnson', region: 'United Kingdom', points: 9876, scans: 982 },
  { id: 'u2', name: 'Santiago Fernández', region: 'Spain', points: 9541, scans: 943 },
  { id: 'u3', name: 'Yuki Tanaka', region: 'Japan', points: 9320, scans: 891 },
  { id: 'u4', name: 'Priya Sharma', region: 'India', points: 8975, scans: 878 },
  { id: 'u5', name: 'Miguel Rodriguez', region: 'Brazil', points: 8721, scans: 845 },
  { id: 'u6', name: 'Liu Wei', region: 'China', points: 8542, scans: 832 },
  { id: 'u7', name: 'Olga Petrova', region: 'Russia', points: 8210, scans: 815 },
  { id: 'u8', name: 'Kwame Osei', region: 'Ghana', points: 7965, scans: 793 },
  { id: 'u9', name: 'Sofia Moretti', region: 'Italy', points: 7712, scans: 766 },
  { id: 'u10', name: 'Ahmed Al-Farsi', region: 'UAE', points: 7540, scans: 748 },
  { id: 'u11', name: 'Hannah Schmidt', region: 'Germany', points: 7328, scans: 725 },
  { id: 'u12', name: 'Carlos Vega', region: 'Mexico', points: 7125, scans: 703 },
  { id: 'u13', name: 'Olivia Thompson', region: 'Australia', points: 6945, scans: 682 },
  { id: 'u14', name: 'Jean-Pierre Dubois', region: 'France', points: 6780, scans: 671 },
  { id: 'u15', name: 'Kim Min-jun', region: 'South Korea', points: 6542, scans: 654 }
];

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Generate hardcoded leaderboard data
  const generateHardcodedLeaderboard = () => {
    // Create leaderboard entries from our hardcoded users
    const topUsers: LeaderboardEntry[] = hardcodedUsers.map((user, index) => ({
      id: user.id,
      displayName: `${user.name} (${user.region})`,
      points: user.points,
      scans: user.scans,
      rank: index + 1
    }));

    // Get user points from localStorage to match Dashboard behavior
    const localPoints = parseInt(localStorage.getItem('ecoPoints')) || 0;
    const userScans = Math.floor(localPoints / 5); // Calculate scans same way as Dashboard

    // Create the current user entry at position 1990
    const currentUserEntry: LeaderboardEntry | null = user ? {
      id: user.id,
      displayName: user.user_metadata?.display_name || 'You',
      points: localPoints,
      scans: userScans,
      rank: 1990
    } : null;

    return { topUsers, currentUserEntry };
  };

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      // Instead of fetching from the API, use our hardcoded data
      const { topUsers } = generateHardcodedLeaderboard();
      setLeaderboard(topUsers);
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <span className="text-gray-500">{rank}</span>;
    }
  };

  const getRowClass = (userId: string) => {
    if (user && userId === user.id) {
      return 'bg-ecosort-primary/10 font-medium';
    }
    return '';
  };

  // Get current user data for the user section
  const { currentUserEntry } = generateHardcodedLeaderboard();

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
          <h1 className="text-xl font-bold">Eco Leaderboard</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4">
        <Card>
          <CardHeader className="bg-gradient-to-r from-ecosort-primary to-ecosort-secondary text-white">
            <CardTitle className="text-center">Global Eco Warriors</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-pulse space-y-4 w-full px-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-5 bg-gray-200 rounded w-12"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {leaderboard.map((entry) => (
                  <div 
                    key={entry.id} 
                    className={`flex items-center px-4 py-3 ${getRowClass(entry.id)}`}
                  >
                    <div className="flex items-center justify-center h-8 w-8 mr-4">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{entry.displayName}</div>
                      <div className="text-sm text-gray-500">{entry.scans} scans</div>
                    </div>
                    <div className="text-ecosort-primary font-medium">{entry.points} pts</div>
                  </div>
                ))}
                
                {/* Add a separator and show current user's position */}
                {currentUserEntry && (
                  <>
                    <div className="px-4 py-2 bg-gray-100 text-gray-500 text-sm text-center">
                      • • •
                    </div>
                    <div 
                      className="flex items-center px-4 py-3 bg-ecosort-primary/10 font-medium"
                    >
                      <div className="flex items-center justify-center h-8 w-8 mr-4">
                        <span className="text-gray-500">{currentUserEntry.rank}</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{currentUserEntry.displayName} (You)</div>
                        <div className="text-sm text-gray-500">{currentUserEntry.scans} scans</div>
                      </div>
                      <div className="text-ecosort-primary font-medium">{currentUserEntry.points} pts</div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            <div className="p-4 text-sm text-center text-gray-500 bg-gray-50 rounded-b-lg">
              <div className="mb-3">
                Scan more waste to climb the leaderboard and earn badges!
              </div>
              
              {currentUserEntry && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{currentUserEntry.points} points</span>
                    <span>
                      {currentUserEntry.points < 100 ? (
                        <>Need {100 - currentUserEntry.points} more points for first badge</>
                      ) : currentUserEntry.points < 500 ? (
                        <>Need {500 - currentUserEntry.points} more points for next badge</>
                      ) : currentUserEntry.points < 1000 ? (
                        <>Need {1000 - currentUserEntry.points} more points for next badge</>
                      ) : currentUserEntry.points < 5000 ? (
                        <>Need {5000 - currentUserEntry.points} more points for next badge</>
                      ) : (
                        <>Master Eco Warrior achieved!</>
                      )}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-ecosort-primary to-ecosort-secondary h-2.5 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, currentUserEntry.points >= 5000 
                          ? 100 
                          : currentUserEntry.points >= 1000 
                            ? 75 + (currentUserEntry.points - 1000) / (5000 - 1000) * 25
                            : currentUserEntry.points >= 500 
                              ? 50 + (currentUserEntry.points - 500) / (1000 - 500) * 25 
                              : currentUserEntry.points >= 100 
                                ? 25 + (currentUserEntry.points - 100) / (500 - 100) * 25
                                : currentUserEntry.points / 100 * 25
                        )}%` 
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between mt-2 text-xs">
                    <span>Beginner<br/>100 pts</span>
                    <span>Bronze<br/>500 pts</span>
                    <span>Silver<br/>1000 pts</span>
                    <span>Gold<br/>5000 pts</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
