import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';
import { getRecentMessages, sendMessage, subscribeToMessages, getWasteClassificationMessages } from '@/services/communityChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CommunityChat: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [wasteMessages, setWasteMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'community' | 'waste'>('community');
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const [recentMessages, recentWasteMessages] = await Promise.all([
          getRecentMessages(),
          getWasteClassificationMessages()
        ]);
        setMessages(recentMessages);
        setWasteMessages(recentWasteMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    const unsubscribeCommunity = subscribeToMessages((newMessage) => {
      if (!newMessage.is_waste_related) {
        setMessages((prev) => [...prev, newMessage]);
      }
    });

    const unsubscribeWaste = subscribeToMessages((newMessage) => {
      if (newMessage.is_waste_related) {
        setWasteMessages((prev) => [...prev, newMessage]);
      }
    });

    return () => {
      unsubscribeCommunity();
      unsubscribeWaste();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, wasteMessages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(newMessage.trim(), activeTab === 'waste');
      setNewMessage('');
      toast.success('Message sent successfully');
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

  const renderMessages = (chatMessages: any[]) => {
    if (chatMessages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <User className="h-12 w-12 mb-4 opacity-20" />
          <p>No messages yet. Be the first to say hello!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {chatMessages.map((message) => (
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
    );
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
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'community' | 'waste')} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="community" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Community Chat
          </TabsTrigger>
          <TabsTrigger value="waste" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Waste Classification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="community" className="flex-1 flex flex-col">
          <CardContent className="p-4 flex-1 overflow-y-auto">
            {renderMessages(messages)}
          </CardContent>
        </TabsContent>

        <TabsContent value="waste" className="flex-1 flex flex-col">
          <CardContent className="p-4 flex-1 overflow-y-auto">
            {renderMessages(wasteMessages)}
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder={activeTab === 'waste' ? "Ask about waste classification..." : "Type your message..."}
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
