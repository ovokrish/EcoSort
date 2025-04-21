// This file is for backward compatibility - redirecting to the official client
import { supabase as officialClient } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl ="https://nloyvkejuxdhbjjmxpxr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sb3l2a2VqdXhkaGJqam14cHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MjMxNjAsImV4cCI6MjA1OTQ5OTE2MH0.oE8UHL38Bgp3IoNqjf_oBsPPkvsoJdaK8_nSqOcQo58";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Define types for our database tables that we can use in our code
export type Profile = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
};

export type Scan = {
  id: string;
  user_id: string;
  waste_type: string;
  image_url: string;
  points: number;
  created_at: string;
};

export interface ChatMessage {
  id: string;
  created_at: string;
  message: string;
  user_id: string;
  user_name: string;
  is_waste_related: boolean;
}

// Export SupabaseUser and UserProfile types for backward compatibility
export type SupabaseUser = {
  id: string;
  email: string;
  user_metadata: {
    displayName?: string;
  };
};

export type UserProfile = Profile;

// Re-export the official client
export const fromProfiles = () => officialClient.from('profiles');
export const fromScans = () => officialClient.from('scans');

// We need to access chat_messages directly instead of using the helper function
// until we update the types in integrations/supabase/types.ts
export const fromChatMessages = () => {
  // We use "as any" here as a temporary workaround because the TypeScript definitions
  // for chat_messages aren't in the generated types file yet
  return officialClient.from('chat_messages' as any);
};
