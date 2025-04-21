import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';

export interface ChatMessage {
  id: string;
  created_at: string;
  message: string;
  user_id: string;
  user_name: string;
  is_waste_related: boolean;
}

// Check if the messages table exists
export const checkMessagesTableExists = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('messages')
      .select('id')
      .limit(1);
    
    // If error code is 42P01, the table doesn't exist
    return !(error && error.code === '42P01');
  } catch (error) {
    console.error('Error checking if messages table exists:', error);
    return false;
  }
};

export const getRecentMessages = async (): Promise<ChatMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('is_waste_related', false)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecentMessages:', error);
    return [];
  }
};

export const getWasteClassificationMessages = async (): Promise<ChatMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('is_waste_related', true)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Error fetching waste messages:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getWasteClassificationMessages:', error);
    return [];
  }
};

export const sendMessage = async (message: string, isWasteRelated: boolean = false): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.from('messages').insert([
      {
        message,
        user_id: user.id,
        user_name: user.user_metadata?.full_name || 'Anonymous',
        is_waste_related: isWasteRelated
      },
    ]);

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};

export const subscribeToMessages = (
  onMessage: (message: ChatMessage) => void
): (() => void) => {
  const subscription = supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};
