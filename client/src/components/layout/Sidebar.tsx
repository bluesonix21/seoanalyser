import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';

// Icons
import { 
  BarChart2, 
  Link as LinkIcon, 
  Crosshair, 
  Search, 
  Activity, 
  FileText, 
  Wrench, 
  FileType, 
  Settings,
  HelpCircle, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { colors, theme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  // Menu items
  const menuItems = [
    { name: 'Ana Sayfa', path: '/', icon: <Home /> },
    { name: 'SEO Puanı', path: '/seo-score', icon: <BarChart2 /> },
    { name: 'Backlink Haritası', path: '/backlink-map', icon: <LinkIcon /> },
    { name: 'Rakip Analizi', path: '/competitor-analysis', icon: <Crosshair /> },
    { name: 'Anahtar Kelime', path: '/keyword-research', icon: <Search /> },
    { name: 'Performans Takibi', path: '/performance-tracking', icon: <Activity /> },
    { name: 'İçerik Analizi', path: '/content-analysis', icon: <FileText /> },
    { name: 'Site Denetimi', path: '/site-audit', icon: <Wrench /> },
    { name: 'Raporlar', path: '/reports', icon: <FileType /> },
    { name: 'AI Asistanı', path: '/ai-assistant', icon: <MessageSquare /> },
  ];
  
  // Settings & Help
  const bottomMenuItems = [
    { name: 'Ayarlar', path: '/settings', icon: <Settings /> },
    { name: 'Yardım', path: '/help', icon: <HelpCircle /> },
  ];

  // Toggle sidebar
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  // Generate gradient background based on theme
  const getGradientBackground = () => {
    switch (theme) {
      case 'cyber':
        return 'bg-gradient-to-b from-purple-900/80 via-purple-900/30 to-blue-900/20';
      case 'matrix':
        return 'bg-gradient-to-b from-green-900/80 via-green-900/30 to-green-800/20';
      case 'ocean':
        return 'bg-gradient-to-b from-blue-900/80 via-blue-800/30 to-blue-900/20';
      case 'blood':
        return 'bg-gradient-to-b from-red-900/80 via-red-900/30 to-red-800/20';
      case 'royal':
        return 'bg-gradient-to-b from-amber-900/80 via-amber-800/30 to-amber-700/20';
      default:
        return 'bg-gradient-to-b from-purple-900/80 via-purple-900/30 to-blue-900/20';
    }
  };

  return (
    <motion.div
      initial={{ width: collapsed ? 80 : 280 }}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`${getGradientBackground()} relative h-screen border-r border-gray-800 flex flex-col shadow-2xl`}
      style={{ borderColor: colors.border }}
    >
      {/* Logo & Header */}
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center"
            >
              <span className="text-white font-bold">N</span>
            </motion.div>
            <h1 
              className="text-xl font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(to right, ${colors.primary}, ${colors.accent})` }}
            >
              Free SeoAnalyser
            </h1>
          </div>
        )}
        
        {collapsed && (
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mx-auto"
          >
            <span className="text-white font-bold">N</span>
          </motion.div>
        )}
        
        {!collapsed && (
          <button 
            onClick={toggleSidebar}
            className="rounded-full p-1 hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={20} color={colors.text.secondary} />
          </button>
        )}
      </div>

      {/* Collapse button for collapsed state */}
      {collapsed && (
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 bg-gray-800 rounded-full p-1 border border-gray-700 z-10"
        >
          <ChevronRight size={18} color={colors.text.secondary} />
        </button>
      )}

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 hover:bg-white/5 ${
                    isActive ? 'bg-white/10 shadow-lg' : ''
                  }`}
                >
                  {/* Icon with gradient on active */}
                  <span className={`${isActive ? 'text-transparent' : ''}`} style={{ 
                    color: isActive ? undefined : colors.text.secondary,
                    backgroundImage: isActive ? `linear-gradient(to right, ${colors.primary}, ${colors.accent})` : undefined,
                    backgroundClip: isActive ? 'text' : undefined,
                    WebkitBackgroundClip: isActive ? 'text' : undefined
                  }}>
                    {item.icon}
                  </span>
                  
                  {/* Text label (hidden when collapsed) */}
                  {!collapsed && (
                    <span 
                      className={`ml-4 ${isActive ? 'font-medium text-transparent' : ''}`}
                      style={{ 
                        color: isActive ? undefined : colors.text.secondary,
                        backgroundImage: isActive ? `linear-gradient(to right, ${colors.primary}, ${colors.accent})` : undefined,
                        backgroundClip: isActive ? 'text' : undefined,
                        WebkitBackgroundClip: isActive ? 'text' : undefined
                      }}
                    >
                      {item.name}
                    </span>
                  )}
                  
                  {/* Active indicator dot/line (only when collapsed) */}
                  {collapsed && isActive && (
                    <motion.div
                      className="absolute -right-1 w-1 h-6 rounded-full"
                      style={{ background: `linear-gradient(to bottom, ${colors.primary}, ${colors.accent})` }}
                      layoutId="activeIndicator"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom Menu Items (Settings, Help) */}
      <div className="px-4 pb-6">
        <div className={`${!collapsed ? 'mb-6 px-4' : 'mb-6 flex justify-center'}`}>
          <div className="border-t border-gray-800" style={{ borderColor: colors.border }}></div>
        </div>
        <ul className="space-y-2">
          {bottomMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center py-3 px-4 rounded-lg transition-all duration-200 hover:bg-white/5 ${
                    isActive ? 'bg-white/10 shadow-lg' : ''
                  }`}
                >
                  {/* Icon */}
                  <span style={{ color: colors.text.secondary }}>
                    {item.icon}
                  </span>
                  
                  {/* Text label (hidden when collapsed) */}
                  {!collapsed && (
                    <span className="ml-4" style={{ color: colors.text.secondary }}>
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      
      {/* Version */}
      {!collapsed && (
        <div className="px-6 pb-4">
          <p className="text-xs opacity-50" style={{ color: colors.text.secondary }}>
            Free SeoAnalyser v1.0.0
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default Sidebar;