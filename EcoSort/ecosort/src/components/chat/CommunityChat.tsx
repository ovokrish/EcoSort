import React, { useState, useEffect, useRef } from 'react';
import { Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';
import { getRecentMessages, sendMessage, subscribeToMessages } from '@/services/communityChat';
import { ChatMessage } from '../../lib/supabase';

const CommunityChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const recentMessages = await getRecentMessages();
        setMessages(recentMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    const unsubscribe = subscribeToMessages((newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <Card className="flex-1 overflow-hidden flex flex-col">
      <CardContent className="p-4 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <User className="h-12 w-12 mb-4 opacity-20" />
            <p>No messages yet. Be the first to say hello!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${
                  message.user_id === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.user_id === user?.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {message.user_id === user?.id ? 'You' : message.user_name}
                  </p>
                  <p className="text-sm">{message.message}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
        )}
      </CardContent>
      
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            disabled={isSending}
          />
          <Button 
            type="submit" 
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSending || !newMessage.trim()}
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </Card>
  );
};

export default CommunityChat;
