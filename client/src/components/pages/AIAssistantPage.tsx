import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useAudio } from '../../lib/stores/useAudio';
import { 
  callDeepSeekApi, 
  AiResponse, 
  isResearchQuery, 
  extractResearchKeywords,
  processResearchResults, 
  DEFAULT_API_KEY
} from '../../lib/services/deepseekService';
import { useApiKey } from '../../lib/stores/useApiKey';
import VirtualResearchBox from '../virtualbox/VirtualResearchBox'; // VirtualResearchBox bileşenini import ediyoruz

// Icons
import { 
  Send,
  Trash2,
  Download,
  Copy,
  MessagesSquare,
  Wand2,
  BookOpenCheck,
  HelpCircle,
  Bot,
  User,
  BarChart2,
  Link as LinkIcon, 
  Crosshair,
  Search,
  Key,
  Save,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Example conversation history
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const exampleConversation: Message[] = [
  {
    id: '1',
    content: "Merhaba! Ben Free SeoAnalyser'nun AI Asistanı. SEO, backlink analizi ve site optimizasyonu konularında size nasıl yardımcı olabilirim?",
    sender: 'ai',
    timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
  }
];

// Example SEO prompts
const examplePrompts = [
  {
    id: '1',
    title: 'SEO puanımı nasıl yükseltebilirim?',
    icon: <BarChart2 size={16} />
  },
  {
    id: '2',
    title: 'Backlink profilimi analiz et',
    icon: <LinkIcon size={16} />
  },
  {
    id: '3',
    title: 'Rakip site analizi nasıl yapılır?',
    icon: <Crosshair size={16} />
  },
  {
    id: '4',
    title: 'En iyi anahtar kelimeleri bul',
    icon: <Search size={16} />
  }
];

const AIAssistantPage: React.FC = () => {
  const { colors } = useTheme();
  const { playSound } = useAudio();
  const [messages, setMessages] = useState<Message[]>(exampleConversation);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // DeepSeek API Key
  const { deepseekApiKey, setDeepseekApiKey } = useApiKey();
  const [apiKeyInput, setApiKeyInput] = useState(deepseekApiKey || DEFAULT_API_KEY);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  
  // Research mode
  const [isResearching, setIsResearching] = useState(false);
  const [researchKeywords, setResearchKeywords] = useState<string[]>([]);
  const [currentUserQuery, setCurrentUserQuery] = useState('');
  
  // Suggested questions based on AI response
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "SEO puanımı nasıl yükseltebilirim?",
    "Backlink profilimi analiz et",
    "Rakip site analizi nasıl yapılır?",
    "En iyi anahtar kelimeleri bul"
  ]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Focus textarea on load
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Save API key
  const saveApiKey = () => {
    setDeepseekApiKey(apiKeyInput);
    setShowApiKeyInput(false);
    playSound('success');
  };
  
  // Handle completing research - process collected data
  const handleResearchComplete = async (
    collectedDataMap: { [keyword: string]: { url: string; title: string; content: string }[] },
    totalSources: number
  ) => {
    setIsResearching(false);
    try {
      setIsTyping(true);
      
      // Log the collected data for debugging
      console.log("Research complete! Collected data for keywords:", Object.keys(collectedDataMap));
      console.log("Total sources collected:", totalSources);
      
      // Transform the collected data into the format expected by processResearchResults
      const formattedDataArray = Object.entries(collectedDataMap).map(([keyword, sources]) => ({
        keyword,
        // Combine all content from sources for this keyword
        content: sources.map(source => 
          `[${source.title}]\n${source.url}\n${source.content}`
        ).join('\n\n---\n\n')
      }));
      
      // Only send to DeepSeek API if we have data to process
      if (formattedDataArray.length === 0) {
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: `Üzgünüm, araştırma sırasında herhangi bir veri toplanamadı. Lütfen başka bir konuda araştırma yapmayı deneyin.`,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
        return;
      }
      
      // Send collected data to DeepSeek for processing
      console.log("Sending to DeepSeek API for processing:", formattedDataArray.length, "research topics");
      const aiResponse = await processResearchResults(
        currentUserQuery,
        formattedDataArray,
        deepseekApiKey || DEFAULT_API_KEY
      );
      
      // Update suggested questions if available
      if (aiResponse.suggestedQuestions && aiResponse.suggestedQuestions.length > 0) {
        setSuggestedQuestions(aiResponse.suggestedQuestions);
      }
      
      // Add the AI response to the chat
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: aiResponse.response,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      playSound('notification');
    } catch (error) {
      console.error("Error processing research results:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `Üzgünüm, araştırma sonuçlarını işlerken bir hata oluştu. Toplam ${totalSources} kaynak ziyaret edildi, ancak verileri işleyemedim.`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  // Send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const message = inputMessage.trim();
    setInputMessage('');
    playSound('click');
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Check if this is a research query
    if (isResearchQuery(message)) {
      // Store the current query for later use
      setCurrentUserQuery(message);
      
      // Show AI typing indicator
      setIsTyping(true);
      
      try {
        // Call DeepSeek API to extract keywords for research
        const initialResponse = await callDeepSeekApi(message, deepseekApiKey || DEFAULT_API_KEY);
        
        // Add initial AI response ("Hemen araştırma yapıyorum...")
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: initialResponse.response,
          sender: 'ai',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        // Get research keywords from API
        const extractedKeywords = await extractResearchKeywords(message, deepseekApiKey || DEFAULT_API_KEY);
        
        setIsTyping(false);
        
        // Start research mode with keywords
        setResearchKeywords(extractedKeywords);
        setIsResearching(true);
        
      } catch (error) {
        console.error("Error starting research:", error);
        setIsTyping(false);
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Üzgünüm, araştırma başlatılırken bir hata oluştu.",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      
    } else {
      // Regular message processing
      // Show AI typing indicator
      setIsTyping(true);
      
      try {
        // Call DeepSeek API
        const aiResponse = await callDeepSeekApi(message, deepseekApiKey || DEFAULT_API_KEY);
        
        // Update suggested questions based on AI response
        if (aiResponse.suggestedQuestions && aiResponse.suggestedQuestions.length > 0) {
          setSuggestedQuestions(aiResponse.suggestedQuestions);
        }
        
        // Add AI response to messages
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse.response,
          sender: 'ai',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        playSound('notification');
      } catch (error) {
        console.error("Error getting AI response:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "Üzgünüm, yanıt alırken bir hata oluştu. Lütfen API anahtarınızı kontrol edin veya daha sonra tekrar deneyin.",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Clear conversation
  const clearConversation = () => {
    setMessages([exampleConversation[0]]);
    playSound('click');
  };
  
  // Copy conversation
  const copyConversation = () => {
    const text = messages.map(msg => `${msg.sender === 'user' ? 'Sen' : 'AI'}: ${msg.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
    playSound('click');
    
    // Show toast (in a real app, you would use a toast component)
    alert('Konuşma panoya kopyalandı');
  };
  
  // Use prompt
  const usePrompt = (prompt: string) => {
    setInputMessage(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    playSound('click');
  };
  
  // Format message with links and styling
  const formatMessage = (content: string) => {
    // Split by newlines and create paragraphs
    const paragraphs = content.split('\n\n');
    
    return paragraphs.map((paragraph, pIndex) => {
      // Handle lists
      if (paragraph.includes('\n1. ')) {
        const listItems = paragraph.split('\n');
        return (
          <div key={pIndex} className="mb-3">
            {listItems.map((item, lIndex) => {
              if (item.match(/^\d+\. /)) {
                return (
                  <div key={lIndex} className="flex items-start mb-1.5">
                    <div className="mr-2 mt-0.5" style={{ color: colors.accent }}>{item.split('. ')[0]}.</div>
                    <div>{item.split('. ').slice(1).join('. ')}</div>
                  </div>
                );
              }
              return <p key={lIndex} className="mb-1">{item}</p>;
            })}
          </div>
        );
      }
      
      // Handle bullet points
      if (paragraph.includes('\n- ')) {
        const listItems = paragraph.split('\n');
        return (
          <div key={pIndex} className="mb-3">
            {listItems.map((item, lIndex) => {
              if (item.startsWith('- ')) {
                return (
                  <div key={lIndex} className="flex items-start mb-1.5">
                    <div className="mr-2" style={{ color: colors.accent }}>•</div>
                    <div>{item.substring(2)}</div>
                  </div>
                );
              }
              return <p key={lIndex} className="mb-1">{item}</p>;
            })}
          </div>
        );
      }
      
      // Regular paragraph
      return <p key={pIndex} className="mb-3">{paragraph}</p>;
    });
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {/* VirtualBrowser for Research Mode */}
      <AnimatePresence>
        {isResearching && (
          <VirtualResearchBox
            keywords={researchKeywords} 
            onComplete={handleResearchComplete}
            onClose={() => setIsResearching(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Page Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            AI Asistanı
          </h1>
          <p style={{ color: colors.text.secondary }}>
            SEO ve site optimizasyonu konusunda uzman yapay zeka asistanınız
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: `${colors.secondary}10`, 
              color: colors.secondary
            }}
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          >
            <Key size={16} />
            <span>API Anahtarı</span>
          </button>
          
          <button 
            className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: `${colors.error}10`, 
              color: colors.error
            }}
            onClick={clearConversation}
          >
            <Trash2 size={16} />
            <span>Temizle</span>
          </button>
          
          <button 
            className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: `${colors.secondary}10`, 
              color: colors.secondary
            }}
            onClick={copyConversation}
          >
            <Copy size={16} />
            <span>Kopyala</span>
          </button>
          
          <button 
            className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: `${colors.primary}10`, 
              color: colors.primary
            }}
            onClick={() => playSound('click')}
          >
            <Download size={16} />
            <span>İndir</span>
          </button>
        </div>
      </div>
      
      {/* API Key Input Dialog */}
      <AnimatePresence>
        {showApiKeyInput && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="mb-4 p-4 rounded-lg border"
            style={{ 
              backgroundColor: colors.background.card,
              borderColor: colors.border
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium" style={{ color: colors.text.primary }}>
                DeepSeek API Anahtarı
              </h3>
              <button
                onClick={() => setShowApiKeyInput(false)}
                style={{ color: colors.text.secondary }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
              Free SeoAnalyser AI'nin çalışması için DeepSeek API anahtarı gereklidir. 
              Varsayılan API anahtarı zaten eklenmiştir ama isterseniz değiştirebilirsiniz.
            </p>
            
            <div className="flex items-center">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1 p-2 rounded-lg border mr-2"
                placeholder="DeepSeek API anahtarınızı girin"
                style={{ 
                  backgroundColor: colors.background.main,
                  borderColor: colors.border,
                  color: colors.text.primary
                }}
              />
              <button
                className="flex items-center space-x-2 px-3 py-2 rounded-lg"
                style={{ 
                  backgroundColor: colors.primary,
                  color: '#fff'
                }}
                onClick={saveApiKey}
              >
                <Save size={16} />
                <span>Kaydet</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Chat Area */}
      <div className="flex flex-col h-full">
        <div className="flex-1 flex">
          {/* Sidebar */}
          <div 
            className="w-64 mr-6 rounded-lg border overflow-hidden hidden lg:block"
            style={{ 
              backgroundColor: colors.background.card,
              borderColor: colors.border
            }}
          >
            <div className="p-4 border-b" style={{ borderColor: colors.border }}>
              <h3 className="font-medium" style={{ color: colors.text.primary }}>AI Özelliklerimiz</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <div 
                  className="flex items-center mb-2.5 text-sm font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  <MessagesSquare size={16} className="mr-2" />
                  <span>Genel Asistan</span>
                </div>
                <div 
                  className="p-2.5 rounded-lg cursor-pointer border border-transparent hover:border-gray-700"
                  style={{ backgroundColor: `${colors.primary}10` }}
                  onClick={() => usePrompt('SEO konusunda genel tavsiyeler verir misin?')}
                >
                  <p className="text-sm" style={{ color: colors.text.primary }}>
                    SEO konusunda genel tavsiyeler verir misin?
                  </p>
                </div>
              </div>
              
              <div>
                <div 
                  className="flex items-center mb-2.5 text-sm font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  <Wand2 size={16} className="mr-2" />
                  <span>SEO Optimizasyonu</span>
                </div>
                <div className="space-y-2">
                  {suggestedQuestions.slice(0, 4).map((question, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-lg cursor-pointer border border-transparent hover:border-gray-700 flex items-center"
                      style={{ backgroundColor: colors.background.main }}
                      onClick={() => usePrompt(question)}
                    >
                      <span className="mr-2" style={{ color: colors.accent }}>
                        {idx === 0 ? <BarChart2 size={16} /> : 
                         idx === 1 ? <LinkIcon size={16} /> : 
                         idx === 2 ? <Crosshair size={16} /> : 
                         <Search size={16} />}
                      </span>
                      <p className="text-sm" style={{ color: colors.text.primary }}>
                        {question}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div 
                  className="flex items-center mb-2.5 text-sm font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  <BookOpenCheck size={16} className="mr-2" />
                  <span>Öğrenme</span>
                </div>
                <div 
                  className="p-2.5 rounded-lg cursor-pointer border border-transparent hover:border-gray-700"
                  style={{ backgroundColor: colors.background.main }}
                  onClick={() => usePrompt('SEO terimlerini açıklayabilir misin?')}
                >
                  <p className="text-sm" style={{ color: colors.text.primary }}>
                    SEO terimlerini açıklayabilir misin?
                  </p>
                </div>
              </div>
              
              <div>
                <div 
                  className="flex items-center mb-2.5 text-sm font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  <HelpCircle size={16} className="mr-2" />
                  <span>Yardım</span>
                </div>
                <div 
                  className="p-2.5 rounded-lg cursor-pointer border border-transparent hover:border-gray-700"
                  style={{ backgroundColor: colors.background.main }}
                  onClick={() => usePrompt('Bana nasıl yardımcı olabilirsin?')}
                >
                  <p className="text-sm" style={{ color: colors.text.primary }}>
                    Bana nasıl yardımcı olabilirsin?
                  </p>
                </div>
              </div>
              
              <div>
                <div 
                  className="flex items-center mb-2.5 text-sm font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  <Search size={16} className="mr-2" />
                  <span>Araştırma Modu</span>
                </div>
                <div 
                  className="p-2.5 rounded-lg cursor-pointer border border-transparent hover:border-gray-700"
                  style={{ backgroundColor: colors.background.main }}
                  onClick={() => usePrompt('SEO trendlerini araştır ve analiz et')}
                >
                  <p className="text-sm" style={{ color: colors.text.primary }}>
                    SEO trendlerini araştır ve analiz et
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Messages */}
          <div 
            className="flex-1 rounded-lg border flex flex-col overflow-hidden"
            style={{ 
              backgroundColor: colors.background.card,
              borderColor: colors.border
            }}
          >
            {/* Messages Container */}
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`mb-6 ${message.sender === 'user' ? 'ml-12' : 'mr-12'}`}
                >
                  {/* Message Header */}
                  <div 
                    className="flex items-center mb-2"
                    style={{ color: colors.text.secondary }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                      style={{ backgroundColor: message.sender === 'user' ? `${colors.primary}20` : `${colors.secondary}20` }}
                    >
                      {message.sender === 'user' ? (
                        <User size={16} style={{ color: colors.primary }} />
                      ) : (
                        <Bot size={16} style={{ color: colors.secondary }} />
                      )}
                    </div>
                    <div className="font-medium" style={{ color: colors.text.primary }}>
                      {message.sender === 'user' ? 'Sen' : 'Free SeoAnalyser AI'}
                    </div>
                    <div className="text-xs ml-2">
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {/* Message Content */}
                  <div 
                    className="ml-10 p-4 rounded-lg"
                    style={{ 
                      backgroundColor: message.sender === 'user' ? `${colors.primary}10` : `${colors.background.main}`,
                      color: colors.text.primary
                    }}
                  >
                    {formatMessage(message.content)}
                  </div>
                </div>
              ))}
              
              {/* AI Typing Indicator */}
              {isTyping && (
                <div className="mb-6 mr-12">
                  <div 
                    className="flex items-center mb-2"
                    style={{ color: colors.text.secondary }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                      style={{ backgroundColor: `${colors.secondary}20` }}
                    >
                      <Bot size={16} style={{ color: colors.secondary }} />
                    </div>
                    <div className="font-medium" style={{ color: colors.text.primary }}>
                      Free SeoAnalyser AI
                    </div>
                  </div>
                  
                  <div 
                    className="ml-10 p-4 rounded-lg"
                    style={{ 
                      backgroundColor: colors.background.main,
                      color: colors.text.primary
                    }}
                  >
                    <div className="flex space-x-2">
                      <motion.div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colors.secondary }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colors.secondary }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: colors.secondary }}
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t" style={{ borderColor: colors.border }}>
              <div className="flex items-end">
                <div 
                  className="flex-1 rounded-lg border overflow-hidden bg-transparent focus-within:ring-1 transition-shadow"
                  style={{ 
                    borderColor: colors.border,
                    backgroundColor: colors.background.main
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    className="w-full p-3 bg-transparent resize-none outline-none"
                    placeholder="AI asistanına bir mesaj yazın..."
                    rows={1}
                    value={inputMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    style={{ color: colors.text.primary }}
                    disabled={isResearching}
                  />
                  
                  <div 
                    className="px-3 py-2 text-xs border-t"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.text.secondary
                    }}
                  >
                    Enter tuşuna basarak gönder, yeni satır için Shift+Enter {isResearchQuery(inputMessage) && "• Araştırma modu"}
                  </div>
                </div>
                
                <button
                  className="ml-2 h-10 w-10 flex items-center justify-center rounded-lg"
                  style={{ 
                    backgroundColor: colors.primary,
                    color: '#fff',
                    opacity: inputMessage.trim() && !isResearching ? 1 : 0.5
                  }}
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isResearching}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;