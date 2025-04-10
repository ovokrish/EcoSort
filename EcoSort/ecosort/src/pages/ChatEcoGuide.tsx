
import React, { useState, useRef } from 'react';
import { ArrowLeft, Users, Bot } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ChatMessages } from '@/components/chat/ChatMessages';
import { useWasteChatbot } from '@/hooks/useWasteChatbot';
import CommunityChat from '@/components/chat/CommunityChat';

const ChatEcoGuide = () => {
  const [activeTab, setActiveTab] = useState<string>('community');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // AI Chatbot
  const { messages, isTyping, sendMessage } = useWasteChatbot();
  const messageEndRef = useRef<HTMLDivElement>(null);

  const handleSendAIMessage = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-ecosort-primary p-4 text-white">
        <div className="max-w-xl mx-auto flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="mr-4 p-1 rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold">EcoSort Chat</h1>
        </div>
      </div>

      <div className="max-w-xl w-full mx-auto p-4 flex-1 flex flex-col">
        <Tabs 
          defaultValue="community" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="community" className="flex-1 flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900">Community Chat</h2>
              <p className="text-sm text-gray-500">
                Connect with other EcoSort users to share tips and discuss waste management.
              </p>
            </div>
            <div className="flex-1 flex flex-col">
              <CommunityChat />
            </div>
          </TabsContent>
          
          <TabsContent value="ai-assistant" className="flex-1 flex flex-col">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900">AI Waste Assistant</h2>
              <p className="text-sm text-gray-500">
                Ask questions about waste disposal, recycling, and environmental practices.
              </p>
            </div>
            
            <div className="flex-1 flex flex-col">
              {/* Reuse the existing AI chat component */}
              <div className="card flex-1 overflow-hidden flex flex-col bg-white rounded-lg border shadow-sm">
                <div className="p-4 flex-1 overflow-y-auto">
                  <ChatMessages 
                    messages={messages} 
                    isTyping={isTyping} 
                    messageEndRef={messageEndRef}
                  />
                </div>
                
                <div className="p-4 border-t">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const input = form.elements.namedItem('message') as HTMLInputElement;
                      if (input.value.trim()) {
                        handleSendAIMessage(input.value);
                        input.value = '';
                      }
                    }} 
                    className="flex gap-2"
                  >
                    <input
                      name="message"
                      className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ecosort-primary"
                      placeholder="Ask about waste disposal..."
                    />
                    <button 
                      type="submit" 
                      className="bg-ecosort-primary hover:bg-ecosort-secondary text-white px-4 py-2 rounded-md"
                    >
                      <span className="sr-only">Send</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  </form>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info mr-2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>
              <p>Remember: Local waste guidelines may vary. Always check with your municipality for specific disposal instructions.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChatEcoGuide;
