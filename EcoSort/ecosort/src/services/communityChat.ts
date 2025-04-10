import { supabase } from '../lib/supabase';
import { ChatMessage } from '../lib/supabase';
import { toast } from '@/lib/toast';

export const sendMessage = async (message: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to send messages');
  }

  const { error } = await supabase
    .from('chat_messages')
    .insert([
      {
        user_id: user.id,
        message,
      },
    ]);

  if (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
};

export const getRecentMessages = async (limit = 50): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      *,
      profiles:user_id (
        display_name
      )
    `)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to fetch messages');
  }

  return data.map(message => ({
    ...message,
    user_name: message.profiles?.display_name || 'Anonymous',
  }));
};

export const subscribeToMessages = (callback: (message: ChatMessage) => void) => {
  const subscription = supabase
    .channel('chat_messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      },
      async (payload) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', payload.new.user_id)
          .single();

        const message: ChatMessage = {
          ...payload.new,
          user_name: profileData?.display_name || 'Anonymous',
        };
        
        callback(message);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to chat messages');
      } else if (status === 'CLOSED') {
        console.log('Subscription to chat messages closed');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Error in chat messages subscription');
      }
    });

  return () => {
    subscription.unsubscribe();
  };
};
