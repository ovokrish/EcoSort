
import React from 'react';
import { Bot, User } from 'lucide-react';
import { Message } from '@/hooks/useWasteChatbot';

type ChatMessagesProps = {
  messages: Message[];
  isTyping: boolean;
  messageEndRef: React.RefObject<HTMLDivElement>;
};

export const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  isTyping, 
  messageEndRef 
}) => {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div 
          key={message.id} 
          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`
            flex max-w-[80%] rounded-2xl px-4 py-3
            ${message.sender === 'user' 
              ? 'bg-ecosort-primary text-white rounded-tr-none' 
              : 'bg-gray-100 text-gray-800 rounded-tl-none'}
          `}>
            {message.sender === 'bot' && (
              <div className="h-6 w-6 mr-2 flex-shrink-0 mt-1">
                <Bot className="h-6 w-6 text-ecosort-primary" />
              </div>
            )}
            <div>
              <p>{message.text}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {message.sender === 'user' && (
              <div className="h-6 w-6 ml-2 flex-shrink-0 mt-1">
                <User className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
        </div>
      ))}
      
      {isTyping && (
        <div className="flex justify-start">
          <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-none px-4 py-3">
            <div className="flex space-x-1">
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messageEndRef} />
    </div>
  );
};
