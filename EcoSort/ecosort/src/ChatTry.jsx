import React, { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';

const EcoSortCommunityChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sender, setSender] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const randomName = 'Anonymous' + Math.floor(100 + Math.random() * 900);
    setSender(randomName);
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/get-messages');
      const data = await res.json();
      setMessages(data.messages.reverse());
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Optimistic update
    const newMessage = { sender, message: input, id: Date.now() };
    setMessages(prevMessages => [newMessage, ...prevMessages]);
    setInput('');
    
    try {
      await fetch('http://localhost:4000/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: sender,
          message: input
        })
      });
      fetchMessages();
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-ecosort-primary text-white p-6">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center">
            <MessageSquare className="h-6 w-6 mr-3" />
            <h1 className="text-2xl font-bold">EcoSort Community Chat</h1>
          </div>
          <p className="opacity-90 mt-1">Connect with eco-minded people around the world</p>
          
          <div className="mt-4 bg-white/10 rounded-lg px-4 py-2 inline-block">
            <p className="text-sm">Chatting as: <span className="font-medium">{sender}</span></p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-xl mx-auto p-4 -mt-6">
        <div className="bg-white rounded-lg shadow-lg border-none mb-4">
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                    <div className="h-16 bg-gray-100 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
                <div className="text-lg font-medium">No messages yet</div>
                <div className="mt-2 text-sm text-center">Be the first to share your thoughts on sustainable waste management!</div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`${msg.sender === sender ? 'ml-12' : 'mr-12'}`}>
                    <div className="flex items-center mb-1">
                      <div className="h-6 w-6 rounded-full bg-ecosort-secondary/20 text-ecosort-secondary flex items-center justify-center text-xs mr-2">
                        {msg.sender.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500">{msg.sender}</div>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      msg.sender === sender 
                        ? 'bg-ecosort-primary text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex">
              <input
                type="text"
                placeholder="Share your eco-friendly thoughts..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 p-3 border border-gray-200 rounded-l outline-none focus:border-ecosort-primary"
              />
              <button 
                onClick={handleSend} 
                className="bg-ecosort-primary hover:bg-ecosort-primary/90 text-white px-6 py-3 rounded-r transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-500 mt-2">
          Join the conversation about sustainable waste management and recycling tips
        </div>
      </div>
    </div>
  );
};

export default EcoSortCommunityChat;