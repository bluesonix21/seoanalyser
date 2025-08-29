import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';
import { useAudio } from '../../lib/stores/useAudio';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import { 
  Bell, 
  Search, 
  Moon, 
  Sun, 
  Globe, 
  User, 
  ChevronDown, 
  Volume2, 
  VolumeX 
} from 'lucide-react';

// Define the page title mapping
const pageTitles: Record<string, string> = {
  '/': 'Ana Sayfa',
  '/seo-score': 'SEO Puanı',
  '/backlink-map': 'Backlink Haritası',
  '/competitor-analysis': 'Rakip Analizi',
  '/keyword-research': 'Anahtar Kelime Araştırması',
  '/performance-tracking': 'Performans Takibi',
  '/content-analysis': 'İçerik Analizi',
  '/site-audit': 'Site Denetimi',
  '/reports': 'Raporlar',
  '/ai-assistant': 'AI Asistanı',
  '/settings': 'Ayarlar',
  '/help': 'Yardım',
};

const Header: React.FC = () => {
  const location = useLocation();
  const { colors, theme, setTheme } = useTheme();
  const { muted, toggleMute, playSound } = useAudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'warning',
      message: 'Sitenizde 3 kırık bağlantı bulundu',
      time: '10 dakika önce',
      read: false
    },
    {
      id: '2',
      type: 'success',
      message: 'Backlink sayınız %15 arttı',
      time: '2 saat önce',
      read: false
    },
    {
      id: '3',
      type: 'info',
      message: 'Haftalık SEO raporu hazır',
      time: '1 gün önce',
      read: true
    }
  ]);
  
  // Get current page title
  const pageTitle = pageTitles[location.pathname] || 'Free SeoAnalyser';
  
  // Handle theme toggle
  const toggleTheme = () => {
    const themes: any = {
      'cyber': 'matrix',
      'matrix': 'ocean',
      'ocean': 'blood',
      'blood': 'royal',
      'royal': 'cyber'
    };
    
    setTheme(themes[theme]);
    playSound('switch');
  };
  
  // Handle notifications toggle
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowProfile(false);
    setShowLanguages(false);
    playSound('click');
  };
  
  // Handle profile toggle
  const toggleProfile = () => {
    setShowProfile(!showProfile);
    setShowNotifications(false);
    setShowLanguages(false);
    playSound('click');
  };
  
  // Handle language toggle
  const toggleLanguages = () => {
    setShowLanguages(!showLanguages);
    setShowNotifications(false);
    setShowProfile(false);
    playSound('click');
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
    playSound('click');
  };
  
  // Handle sound toggle
  const handleToggleSound = () => {
    toggleMute();
    playSound('click');
  };
  
  // Handle notification read
  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    playSound('click');
  };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowNotifications(false);
      setShowProfile(false);
      setShowLanguages(false);
    };
    
    document.addEventListener('click', handleOutsideClick);
    
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);
  
  // Get unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Get notification item color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning':
        return colors.warning;
      case 'success':
        return colors.success;
      case 'info':
        return colors.info;
      default:
        return colors.text.secondary;
    }
  };

  return (
    <header 
      className="py-4 px-6 flex items-center justify-between border-b backdrop-blur-md bg-black/20"
      style={{ borderColor: colors.border }}
    >
      {/* Page Title with Animation */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.h1 
            key={location.pathname}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="text-xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {pageTitle}
          </motion.h1>
        </AnimatePresence>
      </div>
      
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              placeholder="Dashboard'da ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-10 pr-4 rounded-lg bg-white/5 border border-gray-700 focus:outline-none focus:ring-2 transition-all"
              style={{ 
                borderColor: colors.border, 
                color: colors.text.primary,
                caretColor: colors.accent
              }}
            />
            <button
              type="submit"
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
            >
              <Search size={18} className="opacity-50" style={{ color: colors.text.secondary }} />
            </button>
          </div>
        </form>
      </div>
      
      {/* Action Buttons */}
      <div className="flex-1 flex items-center justify-end space-x-5">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="relative p-2 rounded-full hover:bg-white/5 transition-colors"
        >
          {theme === 'cyber' || theme === 'blood' || theme === 'ocean' ? (
            <Moon size={20} style={{ color: colors.text.secondary }} />
          ) : (
            <Sun size={20} style={{ color: colors.text.secondary }} />
          )}
        </button>
        
        {/* Sound Toggle */}
        <button
          onClick={handleToggleSound}
          className="relative p-2 rounded-full hover:bg-white/5 transition-colors"
        >
          {muted ? (
            <VolumeX size={20} style={{ color: colors.text.secondary }} />
          ) : (
            <Volume2 size={20} style={{ color: colors.text.secondary }} />
          )}
        </button>
        
        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLanguages();
            }}
            className="relative p-2 rounded-full hover:bg-white/5 transition-colors flex items-center"
          >
            <Globe size={20} style={{ color: colors.text.secondary }} />
          </button>
          
          {/* Language Dropdown */}
          <AnimatePresence>
            {showLanguages && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border overflow-hidden z-20"
                style={{ 
                  backgroundColor: colors.background.card, 
                  borderColor: colors.border
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2">
                  {['Türkçe', 'English', 'العربية', 'Русский', '中文'].map((lang, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2 rounded-md hover:bg-white/5 transition-colors flex items-center"
                      style={{ color: colors.text.primary }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleNotifications();
            }}
            className="relative p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <Bell size={20} style={{ color: colors.text.secondary }} />
            {unreadCount > 0 && (
              <span 
                className="absolute top-0 right-0 w-4 h-4 rounded-full text-xs flex items-center justify-center"
                style={{ 
                  backgroundColor: colors.accent,
                  color: '#fff'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-80 rounded-lg shadow-lg border overflow-hidden z-20"
                style={{ 
                  backgroundColor: colors.background.card, 
                  borderColor: colors.border
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b" style={{ borderColor: colors.border }}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium" style={{ color: colors.text.primary }}>Bildirimler</h3>
                    <button 
                      className="text-xs opacity-70 hover:opacity-100" 
                      style={{ color: colors.text.secondary }}
                    >
                      Tümünü Temizle
                    </button>
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-3 border-b hover:bg-white/5 transition-colors relative ${notification.read ? 'opacity-60' : ''}`}
                        style={{ borderColor: colors.border }}
                      >
                        {!notification.read && (
                          <span 
                            className="absolute top-4 left-3 w-2 h-2 rounded-full"
                            style={{ backgroundColor: getNotificationColor(notification.type) }}
                          ></span>
                        )}
                        
                        <div className={`pl-${notification.read ? '0' : '4'}`}>
                          <p style={{ color: colors.text.primary }}>{notification.message}</p>
                          <div className="flex justify-between mt-1 text-xs">
                            <span style={{ color: colors.text.secondary }}>{notification.time}</span>
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="hover:underline"
                                style={{ color: colors.accent }}
                              >
                                Okundu olarak işaretle
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center" style={{ color: colors.text.secondary }}>
                      Bildirim yok
                    </div>
                  )}
                </div>
                
                <div className="p-2 border-t" style={{ borderColor: colors.border }}>
                  <button 
                    className="w-full py-2 rounded-md hover:bg-white/5 text-sm text-center transition-colors"
                    style={{ color: colors.accent }}
                  >
                    Tüm Bildirimleri Gör
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* User Profile */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleProfile();
            }}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-white/5 transition-colors"
          >
            <div 
              className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center"
            >
              <User size={16} color="#fff" />
            </div>
            <ChevronDown size={16} style={{ color: colors.text.secondary }} />
          </button>
          
          {/* Profile Dropdown */}
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border overflow-hidden z-20"
                style={{ 
                  backgroundColor: colors.background.card, 
                  borderColor: colors.border
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b" style={{ borderColor: colors.border }}>
                  <h4 className="font-medium" style={{ color: colors.text.primary }}>Demo Kullanıcı</h4>
                  <p className="text-xs" style={{ color: colors.text.secondary }}>demo@example.com</p>
                </div>
                
                <div className="p-2">
                  {['Profil', 'Hesap Ayarları', 'Çıkış'].map((item, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2 rounded-md hover:bg-white/5 transition-colors"
                      style={{ color: colors.text.primary }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;