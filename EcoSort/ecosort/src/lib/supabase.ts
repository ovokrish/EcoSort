
// This file is for backward compatibility - redirecting to the official client
import { supabase as officialClient } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// Define types for our database tables that we can use in our code
export type Profile = {
  id: string;
  user_id: string;
  display_name: string;
  points: number;
  scans: number;
  badges: string[];
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

export type ChatMessage = {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  updated_at: string | null;
};

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
export const supabase = officialClient;

// Helper function to perform typed database operations
export const fromProfiles = () => supabase.from('profiles');
export const fromScans = () => supabase.from('scans');

// We need to access chat_messages directly instead of using the helper function
// until we update the types in integrations/supabase/types.ts
export const fromChatMessages = () => {
  // We use "as any" here as a temporary workaround because the TypeScript definitions
  // for chat_messages aren't in the generated types file yet
  return supabase.from('chat_messages' as any);
};
