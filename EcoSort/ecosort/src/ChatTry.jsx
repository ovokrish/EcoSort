import React, { useEffect, useState, useRef } from 'react';
import { MessageSquare, Globe, MessageCircle, Edit, Calendar, MapPin, Clock, Heart, Send, Smile, Image, Filter, AlertTriangle, Paperclip, ThumbsUp, Reply, Flag, User, Leaf, Award, Trash, Check } from 'lucide-react';
import { useTheme } from './context/ThemeContext';

// Avatar options based on level
const avatarIcons = {
  'Beginner': '🌱',
  'Recycler': '♻️',
  'Eco Champ': '🌍',
  'Eco Warrior': '🧑‍💻',
  'Sustainability Master': '👽'
};

// Quick reaction emojis
const quickEmojis = ['♻️', '🌱', '👍', '❤️', '🔥', '👏'];

// Calculate user level based on points
const calculateLevel = (points) => {
  if (points < 100) return { name: 'Beginner', icon: '🌱' };
  if (points < 500) return { name: 'Recycler', icon: '♻️' };
  if (points < 1000) return { name: 'Eco Champ', icon: '🌍' };
  if (points < 2000) return { name: 'Eco Warrior', icon: '🧑‍💻' };
  return { name: 'Sustainability Master', icon: '👽' };
};

// Parse message content for event data
const parseEventData = (message) => {
  // Check if the message contains event-like content
  const hasDate = /\b\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(message);
  const hasLocation = /\b(?:in|at|near)\s+\w+/i.test(message);
  
  if (hasDate && hasLocation && message.toLowerCase().includes('event')) {
    // Extract date
    const dateMatch = message.match(/\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i);
    const date = dateMatch ? `${dateMatch[1]} ${dateMatch[2]}` : 'Upcoming';
    
    // Extract location
    const locationMatch = message.match(/\b(?:in|at|near)\s+(\w+)/i);
    const location = locationMatch ? locationMatch[1] : 'TBD';
    
    // Extract contact
    const contactMatch = message.match(/(?:\+\d{1,3}\s?)?(?:\(\d{1,4}\)|\d{1,4})[-.\s]?\d{1,4}[-.\s]?\d{1,9}/);
    const contact = contactMatch ? contactMatch[0] : '';
    
    return {
      isEvent: true,
      date,
      location,
      contact,
      interested: Math.floor(Math.random() * 10) + 1 // Random number of interested people
    };
  }
  
  return { isEvent: false };
};

// Truncate and mask sensitive content like phone numbers
const maskSensitiveContent = (message) => {
  // Mask phone numbers
  return message.replace(/(?:\+\d{1,3}\s?)?(?:\(\d{1,4}\)|\d{1,4})[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '[Contact Hidden 🔒]');
};

const EcoSortCommunityChat = () => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sender, setSender] = useState('');
  const [nickname, setNickname] = useState('');
  const [editingNickname, setEditingNickname] = useState(false);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEmojis, setShowEmojis] = useState(false);
  const [typing, setTyping] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'events', 'questions'
  const [maskContent, setMaskContent] = useState(true);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Generate random points for demonstration
    const randomPoints = Math.floor(Math.random() * 2500);
    setPoints(randomPoints);
    
    const randomName = 'EcoUser_' + Math.floor(100 + Math.random() * 900);
    setSender(randomName);
    setNickname(randomName);
    fetchMessages();
    
    // Simulate someone typing randomly
    const typingInterval = setInterval(() => {
      const shouldType = Math.random() > 0.7;
      if (shouldType) {
        setTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(false), 3000);
      }
    }, 10000);
    
    return () => {
      clearInterval(typingInterval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/get-messages');
      const data = await res.json();
      
      // Process messages to check for events
      const processedMessages = data.messages.map(msg => ({
        ...msg,
        ...parseEventData(msg.message),
        timestamp: Date.now() - Math.floor(Math.random() * 86400000) // Random time within 24h
      }));
      
      setMessages(processedMessages.reverse());
    } catch (err) {
      console.error('Failed to fetch messages', err);
      // For demo purposes, generate some dummy messages if server is not available
      generateDummyMessages();
    } finally {
      setLoading(false);
    }
  };
  
  const generateDummyMessages = () => {
    const dummyMessages = [
      { 
        sender: 'EcoWarrior_42', 
        message: "Hey everyone! I'm organizing a waste collection event in Varanasi on 29 April. Contact me at +91 9123456789 if you're interested!",
        id: 1,
        timestamp: Date.now() - 3600000 * 5,
        reactions: ['👍', '❤️']
      },
      { 
        sender: 'GreenThumb_88', 
        message: "That sounds great! I'll try to make it. Has anyone tried composting at home?",
        id: 2,
        timestamp: Date.now() - 3600000 * 4,
        reactions: []
      },
      { 
        sender: 'RecycleQueen', 
        message: "Yes, I've been composting for years! It's amazing how much waste you can reduce.",
        id: 3,
        timestamp: Date.now() - 3600000 * 3,
        reactions: ['👍']
      },
      { 
        sender: 'PlasticFree_Life', 
        message: "I'm hosting a workshop on plastic alternatives in Mumbai on 15 May at the community center.",
        id: 4,
        timestamp: Date.now() - 3600000 * 2,
        reactions: ['🌱', '👏']
      }
    ];
    
    // Process dummy messages to check for events
    const processedMessages = dummyMessages.map(msg => ({
      ...msg,
      ...parseEventData(msg.message)
    }));
    
    setMessages(processedMessages);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Optimistic update
    const newMessage = { 
      sender: nickname, 
      message: input, 
      id: Date.now(),
      timestamp: Date.now(),
      reactions: [],
      ...parseEventData(input)
    };
    
    setMessages(prevMessages => [newMessage, ...prevMessages]);
    setInput('');
    
    try {
      await fetch('http://localhost:4000/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: nickname,
          message: input
        })
      });
      fetchMessages();
    } catch (err) {
      console.error('Failed to send message', err);
      // Keep the message for demo purposes even if the server call fails
      // setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleAddReaction = (messageId, emoji) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              reactions: msg.reactions.includes(emoji) 
                ? msg.reactions.filter(r => r !== emoji) 
                : [...msg.reactions, emoji] 
            }
          : msg
      )
    );
  };
  
  const handleNicknameUpdate = () => {
    if (nickname.trim()) {
      setEditingNickname(false);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const isToday = (timestamp) => {
    const today = new Date().setHours(0, 0, 0, 0);
    const messageDate = new Date(timestamp).setHours(0, 0, 0, 0);
    return today === messageDate;
  };
  
  const level = calculateLevel(points);
  
  const filteredMessages = messages.filter(msg => {
    if (filter === 'all') return true;
    if (filter === 'events') return msg.isEvent;
    if (filter === 'questions') return msg.message.includes('?');
    return true;
  });

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`${theme === 'dark' ? 'bg-ecosort-primary/80' : 'bg-ecosort-primary'} text-white p-6 relative overflow-hidden`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute text-3xl"
              style={{ 
                left: `${Math.random() * 100}%`, 
                top: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
                opacity: Math.random() * 0.5 + 0.1
              }}
            >
              🌿
            </div>
          ))}
        </div>
        
        <div className="max-w-xl mx-auto relative z-10">
          <div className="flex items-center">
            <Globe className="h-6 w-6 mr-3" />
            <h1 className="text-2xl font-bold">EcoSort Community Chat</h1>
          </div>
          <p className="opacity-90 mt-1">Connect with eco-minded people around the world</p>
          
          <div className={`mt-4 ${theme === 'dark' ? 'bg-white/5' : 'bg-white/10'} rounded-lg px-4 py-2 inline-block`}>
            {editingNickname ? (
              <div className="flex items-center">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onBlur={handleNicknameUpdate}
                  onKeyPress={(e) => e.key === 'Enter' && handleNicknameUpdate()}
                  autoFocus
                  className="bg-transparent border-b border-white/30 text-white px-1 py-0.5 outline-none text-sm w-40"
                />
                <button 
                  onClick={handleNicknameUpdate}
                  className="ml-2 text-white/70 hover:text-white"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <span className="mr-2 text-lg">{level.icon}</span>
                <div>
                  <div className="flex items-center">
                    <p className="text-sm font-medium">{nickname}</p>
                    <button 
                      onClick={() => setEditingNickname(true)}
                      className="ml-2 text-white/70 hover:text-white"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-xs opacity-80">Level {Math.floor(points/100) + 1} · {level.name} · {points} pts</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Filter buttons */}
          <div className="mt-4 flex space-x-2">
            <button 
              onClick={() => setFilter('all')}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                filter === 'all' 
                  ? 'bg-white text-ecosort-primary font-medium' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              All Messages
            </button>
            <button 
              onClick={() => setFilter('events')}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                filter === 'events' 
                  ? 'bg-white text-ecosort-primary font-medium' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              Events Only
            </button>
            <button 
              onClick={() => setFilter('questions')}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                filter === 'questions' 
                  ? 'bg-white text-ecosort-primary font-medium' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              Questions
            </button>
            <button 
              onClick={() => setMaskContent(!maskContent)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                !maskContent
                  ? 'bg-white text-ecosort-primary font-medium' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {maskContent ? 'Show All Content' : 'Hide Sensitive Info'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-xl mx-auto p-4 -mt-6">
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg border-none mb-4`}>
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4 relative" style={{ 
            backgroundImage: theme === 'dark' 
              ? 'radial-gradient(circle at 10% 20%, rgba(0, 100, 0, 0.03) 0%, rgba(0, 0, 0, 0) 80%)' 
              : 'radial-gradient(circle at 10% 20%, rgba(0, 200, 0, 0.03) 0%, rgba(255, 255, 255, 0) 80%)'
          }}>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <div className="text-lg font-medium">No messages yet</div>
                <div className="mt-2 text-sm text-center">🌍 Say hi to the community! Your message might spark a greener tomorrow.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {typing && (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 animate-pulse mb-2">
                    <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 mr-2"></div>
                    <div>Someone's typing...</div>
                  </div>
                )}
                
                {filteredMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`${msg.sender === nickname ? 'items-end' : 'items-start'} flex flex-col animate-[fadeIn_0.3s_ease-in-out]`}
                  >
                    {/* Timestamp if first message or new day */}
                    {(idx === filteredMessages.length - 1 || !isToday(filteredMessages[idx+1]?.timestamp)) && (
                      <div className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 mb-2 inline-block mx-auto">
                        {new Date(msg.timestamp).toLocaleDateString()}
                      </div>
                    )}
                  
                    {/* Regular message display */}
                    {!msg.isEvent ? (
                      <div className={`max-w-[80%] ${msg.sender === nickname ? 'ml-auto' : 'mr-auto'}`}>
                        <div className="flex items-center mb-1">
                          {msg.sender !== nickname && (
                            <div className="h-6 w-6 rounded-full bg-ecosort-secondary/20 dark:bg-ecosort-secondary/40 text-ecosort-secondary flex items-center justify-center text-xs mr-2">
                              {msg.sender.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {msg.sender === nickname ? 'You' : msg.sender}
                            <span className="font-normal ml-2">{formatTimestamp(msg.timestamp)}</span>
                          </div>
                        </div>
                        
                        <div className={`p-3 rounded-2xl ${
                          msg.sender === nickname 
                            ? 'bg-ecosort-primary text-white rounded-tr-none' 
                            : theme === 'dark'
                              ? 'bg-gray-700 text-white rounded-tl-none'
                              : 'bg-gray-100 text-gray-800 rounded-tl-none'
                        }`}>
                          {maskContent ? maskSensitiveContent(msg.message) : msg.message}
                        </div>
                        
                        {/* Message actions and reactions */}
                        <div className="flex items-center mt-1 text-gray-400 text-xs">
                          <button className="hover:text-gray-600 dark:hover:text-gray-200 mr-3 flex items-center">
                            <Reply className="h-3 w-3 mr-1" /> Reply
                          </button>
                          <div className="relative mr-3">
                            <button className="hover:text-gray-600 dark:hover:text-gray-200 flex items-center">
                              <ThumbsUp className="h-3 w-3 mr-1" /> React
                            </button>
                          </div>
                          <button className="hover:text-gray-600 dark:hover:text-gray-200 flex items-center">
                            <Flag className="h-3 w-3 mr-1" /> Report
                          </button>
                          
                          {/* Display reactions */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="ml-auto bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5 flex items-center">
                              {msg.reactions.map((reaction, i) => (
                                <span key={i} className="mx-0.5">{reaction}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Event card display
                      <div className={`max-w-[90%] ${msg.sender === nickname ? 'ml-auto' : 'mr-auto'} ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'
                      } rounded-lg p-3 border ${theme === 'dark' ? 'border-gray-600' : 'border-green-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-bold text-ecosort-primary dark:text-green-400 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Community Event
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Posted by {msg.sender === nickname ? 'you' : msg.sender}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                            <span className="font-medium">{msg.date}</span>
                          </div>
                          
                          <div className="flex items-center text-sm">
                            <MapPin className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                            <span>{msg.location}</span>
                          </div>
                          
                          {msg.contact && !maskContent && (
                            <div className="flex items-center text-sm">
                              <User className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                              <span>Contact: {msg.contact}</span>
                            </div>
                          )}
                          
                          {msg.contact && maskContent && (
                            <div className="flex items-center text-sm">
                              <User className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                              <span>Contact: [Contact Hidden 🔒]</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 flex justify-between items-center">
                          <div className="flex items-center text-ecosort-primary dark:text-green-400 text-sm">
                            <Heart className="h-4 w-4 mr-1 fill-current" />
                            <span>{msg.interested} interested</span>
                          </div>
                          
                          <button className={`text-xs px-3 py-1 rounded-full ${
                            theme === 'dark' 
                              ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                              : 'bg-ecosort-primary/10 hover:bg-ecosort-primary/20 text-ecosort-primary'
                          }`}>
                            Add to Calendar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} p-4`}>
            {/* Quick emoji reactions */}
            <div className="flex mb-2 justify-between items-center">
              <div className="flex">
                {quickEmojis.map((emoji, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setInput(prev => prev + ' ' + emoji);
                      inputRef.current?.focus();
                    }}
                    className={`mr-2 text-lg hover:scale-125 transition-transform ${
                      theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    } rounded-full p-1`}
                  >
                    {emoji}
                  </button>
                ))}
                <button 
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`p-1 rounded-full ${
                    theme === 'dark' 
                      ? 'hover:bg-gray-700 text-gray-400' 
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <Smile className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex">
                <button className={`p-1 rounded-full mr-2 ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-500'
                }`}>
                  <Paperclip className="h-5 w-5" />
                </button>
                <button className={`p-1 rounded-full ${
                  theme === 'dark' 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-500'
                }`}>
                  <Image className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Expandable textarea and send button */}
            <div className="flex">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Share your thoughts..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className={`flex-1 p-3 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-200'
                } border rounded-l outline-none focus:border-ecosort-primary resize-none text-sm`}
                style={{ height: input.split('\n').length > 3 ? 'auto' : '45px', minHeight: '45px', maxHeight: '150px' }}
              />
              <button 
                onClick={handleSend} 
                className={`${
                  theme === 'dark' 
                    ? 'bg-ecosort-primary hover:bg-ecosort-primary/90' 
                    : 'bg-ecosort-primary hover:bg-ecosort-primary/90'
                } text-white px-4 rounded-r transition-colors`}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
          Join the conversation about sustainable waste management and recycling tips
        </div>
      </div>
    </div>
  );
};

export default EcoSortCommunityChat;