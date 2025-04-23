import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useAudio } from '../../lib/stores/useAudio';

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
  Search
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
    content: "Merhaba! Ben NovaSEO'nun AI Asistanı. SEO, backlink analizi ve site optimizasyonu konularında size nasıl yardımcı olabilirim?",
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
  
  // Send message
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    playSound('click');
    
    // Simulate AI response
    setIsTyping(true);
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      playSound('notification');
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };
  
  // Generate AI response based on user input
  const generateAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('seo puan') || lowerInput.includes('yükselt')) {
      return `SEO puanınızı yükseltmek için şu adımları izleyebilirsiniz:\n\n1. Sayfa yükleme hızını optimize edin\n2. Mobil uyumluluğu iyileştirin\n3. Meta açıklamalarını ve başlık etiketlerini düzenleyin\n4. İçerik kalitesini artırın\n5. İç bağlantıları iyileştirin\n6. Yapısal verileri ekleyin\n\nBu değişiklikleri uygulamak için SEO Puanı sayfasındaki tavsiyelere bakabilirsiniz. Daha detaylı analiz yapmamı ister misiniz?`;
    }
    
    if (lowerInput.includes('backlink') || lowerInput.includes('link')) {
      return `Backlink profilinizde şu anda toplam 1,247 bağlantı ve 342 benzersiz domain bulunuyor. Kalite dağılımı şöyle:\n\n- Yüksek Kalite: 425 bağlantı\n- Orta Kalite: 638 bağlantı\n- Düşük Kalite: 184 bağlantı\n\nSon 30 günde 87 yeni bağlantı kazandınız ve 32 bağlantı kaybettiniz. En değerli backlinkleriniz example.com, blog-platform.com ve social-media.net'ten geliyor.\n\nBacklink profilinizi daha detaylı analiz etmek ve görselleştirmek için Backlink Haritası sayfasını ziyaret edebilirsiniz.`;
    }
    
    if (lowerInput.includes('rakip') || lowerInput.includes('competitor')) {
      return `Rakip site analizini şu şekilde yapabilirsiniz:\n\n1. Rakiplerinizi belirleyin: Aynı anahtar kelimeler için sıralanan siteleri tespit edin\n2. SEO metriklerini karşılaştırın: Domain otoritesi, backlink sayısı, içerik miktarı\n3. Anahtar kelime örtüşmelerini analiz edin: Hangi kelimeler için sıralama yapıyorlar?\n4. İçerik stratejilerini inceleyin: İçerik uzunluğu, türü ve kalitesi nasıl?\n5. Teknik SEO durumlarını kontrol edin: Site hızı, mobil uyumluluk, yapısal veriler\n\nRakip Analizi sayfasında başlıca rakiplerinizin detaylı karşılaştırmasını görebilirsiniz. Belirli bir rakip hakkında daha fazla bilgi ister misiniz?`;
    }
    
    if (lowerInput.includes('anahtar kelime') || lowerInput.includes('keyword')) {
      return `Siteniz için en iyi anahtar kelimeleri belirlemek için şu faktörleri göz önünde bulundurmalısınız:\n\n1. Arama Hacmi: Aylık arama sayısı yüksek kelimeler\n2. Rekabet: Düşük-orta zorlukta kelimeler ideal olabilir\n3. Dönüşüm Potansiyeli: Satın alma niyeti olan kelimeler\n4. Alaka Düzeyi: İçeriğiniz ve ürünlerinizle ilgili olmalı\n\nAnaliz sonuçlarına göre öne çıkan anahtar kelimeler:\n- "seo araçları" (12,500 arama/ay)\n- "backlink analizi" (6,300 arama/ay)\n- "seo dashboard" (4,700 arama/ay)\n- "rakip analizi" (9,200 arama/ay)\n\nDaha fazla anahtar kelime önerisi için Anahtar Kelime Araştırması sayfasını kullanabilirsiniz.`;
    }
    
    // Default response
    return `Teşekkürler! Sorunuz üzerinde çalışıyorum. SEO, backlinkler, rakip analizi veya site optimizasyonu hakkında daha spesifik sorularınız varsa, size daha detaylı bilgi verebilirim. NovaSEO'nun tüm analitik özelliklerini kullanmanıza yardımcı olabilirim.`;
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
                  {examplePrompts.map(prompt => (
                    <div 
                      key={prompt.id}
                      className="p-2.5 rounded-lg cursor-pointer border border-transparent hover:border-gray-700 flex items-center"
                      style={{ backgroundColor: colors.background.main }}
                      onClick={() => usePrompt(prompt.title)}
                    >
                      <span className="mr-2" style={{ color: colors.accent }}>
                        {prompt.icon}
                      </span>
                      <p className="text-sm" style={{ color: colors.text.primary }}>
                        {prompt.title}
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
                      {message.sender === 'user' ? 'Sen' : 'NovaSEO AI'}
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
                      NovaSEO AI
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
                  />
                  
                  <div 
                    className="px-3 py-2 text-xs border-t"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.text.secondary
                    }}
                  >
                    Enter tuşuna basarak gönder, yeni satır için Shift+Enter
                  </div>
                </div>
                
                <button
                  className="ml-2 h-10 w-10 flex items-center justify-center rounded-lg"
                  style={{ 
                    backgroundColor: colors.primary,
                    color: '#fff',
                    opacity: inputMessage.trim() ? 1 : 0.5
                  }}
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
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