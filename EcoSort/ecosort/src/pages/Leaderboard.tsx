
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getLeaderboard, LeaderboardEntry } from '@/services/ecoPoints';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
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
    if (currentUser && userId === currentUser.id) {
      return 'bg-ecosort-primary/10 font-medium';
    }
    return '';
  };

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
            <CardTitle className="text-center">Top Eco Warriors</CardTitle>
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
              </div>
            )}
            
            <div className="p-4 text-sm text-center text-gray-500 bg-gray-50 rounded-b-lg">
              Scan more waste to climb the leaderboard and earn badges!
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
