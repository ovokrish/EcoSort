
import { supabase } from '@/integrations/supabase/client';
import { Profile, Scan, fromProfiles, fromScans } from '@/lib/supabase';

export type ScanRecord = {
  id: string;
  userId: string;
  wasteType: string;
  imageUrl: string;
  points: number;
  timestamp: Date;
};

export type LeaderboardEntry = {
  id: string;
  displayName: string;
  points: number;
  scans: number;
  rank: number;
};

// Record a new waste scan
export const recordWasteScan = async (userId: string, wasteType: string, imageUrl: string): Promise<ScanRecord> => {
  const pointsAwarded = calculatePoints(wasteType);
  
  // First, upload the image to Supabase storage
  let finalImageUrl = imageUrl;
  
  if (imageUrl.startsWith('data:')) {
    // It's a base64 image, upload to storage
    const fileName = `${userId}/${Date.now()}.jpg`;
    const { data: fileData, error: fileError } = await supabase.storage
      .from('waste-scans')
      .upload(fileName, decode(imageUrl), {
        contentType: 'image/jpeg',
        upsert: false
      });
    
    if (fileError) {
      console.error('Failed to upload image:', fileError);
    } else if (fileData) {
      // Get public URL for the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('waste-scans')
        .getPublicUrl(fileName);
      
      finalImageUrl = publicUrl;
    }
  }
  
  // Create scan record in database
  const scanData = {
    user_id: userId,
    waste_type: wasteType,
    image_url: finalImageUrl,
    points: pointsAwarded,
    created_at: new Date().toISOString()
  };
  
  const { data, error } = await fromScans()
    .insert(scanData)
    .select()
    .single();
  
  if (error) {
    console.error('Failed to record scan:', error);
    throw error;
  }
  
  // Update user points in profile
  const { error: updateError } = await supabase.rpc('increment_user_points', {
    user_id_param: userId,
    points_to_add: pointsAwarded
  });
  
  if (updateError) {
    console.error('Failed to update user points:', updateError);
  }
  
  // Format the response
  return {
    id: data?.id || '',
    userId: data?.user_id || '',
    wasteType: data?.waste_type || '',
    imageUrl: data?.image_url || '',
    points: data?.points || 0,
    timestamp: data ? new Date(data.created_at) : new Date()
  };
};

// Get user's recent scans
export const getUserScans = async (userId: string): Promise<ScanRecord[]> => {
  const { data, error } = await fromScans()
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error('Failed to fetch user scans:', error);
    throw error;
  }
  
  return (data || []).map((scan: Scan) => ({
    id: scan.id || '',
    userId: scan.user_id || '',
    wasteType: scan.waste_type || '',
    imageUrl: scan.image_url || '',
    points: scan.points || 0,
    timestamp: new Date(scan.created_at)
  }));
};

// Get leaderboard data
export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const { data, error } = await fromProfiles()
    .select()
    .order('points', { ascending: false })
    .limit(50);
  
  if (error) {
    console.error('Failed to fetch leaderboard:', error);
    throw error;
  }
  
  return (data || []).map((profile: Profile, index: number) => ({
    id: profile.user_id || '',
    displayName: profile.display_name || 'Unknown',
    points: profile.points || 0,
    scans: profile.scans || 0,
    rank: index + 1
  }));
};

// Calculate points for a waste scan
const calculatePoints = (wasteType: string): number => {
  // Award points based on waste type
  switch (wasteType) {
    case 'plastic':
      return 10;
    case 'paper':
      return 8;
    case 'glass':
      return 12;
    case 'metal':
      return 15;
    case 'organic':
      return 5;
    case 'e-waste':
      return 20;
    default:
      return 5;
  }
};

// Helper function to decode base64 data URLs
const decode = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  return bytes;
};
