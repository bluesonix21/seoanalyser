import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useAudio } from '../../lib/stores/useAudio';

// Icons
import { 
  Save, 
  ChevronRight,
  Globe,
  Palette,
  Bell,
  Key,
  Lock,
  User,
  Mail,
  HardDrive,
  RefreshCw,
  Volume2,
  VolumeX,
  Check,
  Moon,
  Sun
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { colors, theme, setTheme } = useTheme();
  const { volume, muted, setVolume, toggleMute, playSound } = useAudio();
  const [activeSection, setActiveSection] = useState<string>('appearance');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Sample notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    weeklyReports: true,
    scoreChanges: true,
    newBacklinks: true,
    competitorUpdates: false,
    securityAlerts: true
  });
  
  // Handle theme change
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as any);
    playSound('switch');
  };
  
  // Handle section change
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    playSound('click');
  };
  
  // Handle save settings
  const handleSave = () => {
    // In a real app, this would save settings to an API
    console.log('Saving settings...');
    console.log('Theme:', theme);
    console.log('Notification settings:', notificationSettings);
    
    // Show success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    
    playSound('success');
  };
  
  // Handle notification toggle
  const toggleNotification = (key: string) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: !notificationSettings[key as keyof typeof notificationSettings]
    });
    playSound('click');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: colors.text.primary }}>
        Ayarlar
      </h1>
      
      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div 
            className="rounded-xl border overflow-hidden"
            style={{ 
              backgroundColor: colors.background.card,
              borderColor: colors.border
            }}
          >
            <nav>
              <button
                className={`w-full p-4 text-left flex items-center justify-between ${
                  activeSection === 'appearance' ? 'bg-white/5' : ''
                } hover:bg-white/5 transition-colors`}
                onClick={() => handleSectionChange('appearance')}
              >
                <div className="flex items-center">
                  <Palette className="mr-3" size={18} style={{ color: colors.primary }} />
                  <span style={{ color: colors.text.primary }}>Görünüm</span>
                </div>
                {activeSection === 'appearance' && (
                  <ChevronRight size={18} style={{ color: colors.text.secondary }} />
                )}
              </button>
              
              <button
                className={`w-full p-4 text-left flex items-center justify-between ${
                  activeSection === 'notifications' ? 'bg-white/5' : ''
                } hover:bg-white/5 transition-colors`}
                onClick={() => handleSectionChange('notifications')}
              >
                <div className="flex items-center">
                  <Bell className="mr-3" size={18} style={{ color: colors.secondary }} />
                  <span style={{ color: colors.text.primary }}>Bildirimler</span>
                </div>
                {activeSection === 'notifications' && (
                  <ChevronRight size={18} style={{ color: colors.text.secondary }} />
                )}
              </button>
              
              <button
                className={`w-full p-4 text-left flex items-center justify-between ${
                  activeSection === 'account' ? 'bg-white/5' : ''
                } hover:bg-white/5 transition-colors`}
                onClick={() => handleSectionChange('account')}
              >
                <div className="flex items-center">
                  <User className="mr-3" size={18} style={{ color: colors.accent }} />
                  <span style={{ color: colors.text.primary }}>Hesap</span>
                </div>
                {activeSection === 'account' && (
                  <ChevronRight size={18} style={{ color: colors.text.secondary }} />
                )}
              </button>
              
              <button
                className={`w-full p-4 text-left flex items-center justify-between ${
                  activeSection === 'language' ? 'bg-white/5' : ''
                } hover:bg-white/5 transition-colors`}
                onClick={() => handleSectionChange('language')}
              >
                <div className="flex items-center">
                  <Globe className="mr-3" size={18} style={{ color: colors.info }} />
                  <span style={{ color: colors.text.primary }}>Dil</span>
                </div>
                {activeSection === 'language' && (
                  <ChevronRight size={18} style={{ color: colors.text.secondary }} />
                )}
              </button>
              
              <button
                className={`w-full p-4 text-left flex items-center justify-between ${
                  activeSection === 'api' ? 'bg-white/5' : ''
                } hover:bg-white/5 transition-colors`}
                onClick={() => handleSectionChange('api')}
              >
                <div className="flex items-center">
                  <Key className="mr-3" size={18} style={{ color: colors.warning }} />
                  <span style={{ color: colors.text.primary }}>API</span>
                </div>
                {activeSection === 'api' && (
                  <ChevronRight size={18} style={{ color: colors.text.secondary }} />
                )}
              </button>
              
              <button
                className={`w-full p-4 text-left flex items-center justify-between ${
                  activeSection === 'privacy' ? 'bg-white/5' : ''
                } hover:bg-white/5 transition-colors`}
                onClick={() => handleSectionChange('privacy')}
              >
                <div className="flex items-center">
                  <Lock className="mr-3" size={18} style={{ color: colors.error }} />
                  <span style={{ color: colors.text.primary }}>Gizlilik ve Güvenlik</span>
                </div>
                {activeSection === 'privacy' && (
                  <ChevronRight size={18} style={{ color: colors.text.secondary }} />
                )}
              </button>
              
              <button
                className={`w-full p-4 text-left flex items-center justify-between ${
                  activeSection === 'data' ? 'bg-white/5' : ''
                } hover:bg-white/5 transition-colors`}
                onClick={() => handleSectionChange('data')}
              >
                <div className="flex items-center">
                  <HardDrive className="mr-3" size={18} style={{ color: colors.success }} />
                  <span style={{ color: colors.text.primary }}>Veri Yönetimi</span>
                </div>
                {activeSection === 'data' && (
                  <ChevronRight size={18} style={{ color: colors.text.secondary }} />
                )}
              </button>
            </nav>
          </div>
        </div>
        
        {/* Content */}
        <div 
          className="lg:col-span-3 rounded-xl border"
          style={{ 
            backgroundColor: colors.background.card,
            borderColor: colors.border
          }}
        >
          <div className="p-6 border-b" style={{ borderColor: colors.border }}>
            <h2 
              className="text-xl font-bold"
              style={{ color: colors.text.primary }}
            >
              {activeSection === 'appearance' && 'Görünüm Ayarları'}
              {activeSection === 'notifications' && 'Bildirim Ayarları'}
              {activeSection === 'account' && 'Hesap Ayarları'}
              {activeSection === 'language' && 'Dil Ayarları'}
              {activeSection === 'api' && 'API Ayarları'}
              {activeSection === 'privacy' && 'Gizlilik ve Güvenlik'}
              {activeSection === 'data' && 'Veri Yönetimi'}
            </h2>
          </div>
          
          <div className="p-6">
            {/* Appearance Settings */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                {/* Theme Selection */}
                <div>
                  <h3 
                    className="text-lg font-medium mb-4"
                    style={{ color: colors.text.primary }}
                  >
                    Tema
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      className={`p-4 rounded-lg border ${
                        theme === 'cyber' ? 'ring-2' : ''
                      }`}
                      style={{ 
                        backgroundColor: '#0f1225',
                        borderColor: theme === 'cyber' ? colors.primary : colors.border,
                        ringColor: colors.primary
                      }}
                      onClick={() => handleThemeChange('cyber')}
                    >
                      <div 
                        className="w-full h-12 rounded mb-2"
                        style={{ background: 'linear-gradient(to right, #6a11cb, #2575fc)' }}
                      ></div>
                      <div className="flex justify-between items-center">
                        <span className="text-white">Cyber</span>
                        {theme === 'cyber' && (
                          <Check size={18} className="text-white" />
                        )}
                      </div>
                    </button>
                    
                    <button
                      className={`p-4 rounded-lg border ${
                        theme === 'matrix' ? 'ring-2' : ''
                      }`}
                      style={{ 
                        backgroundColor: '#0a0d0a',
                        borderColor: theme === 'matrix' ? '#00FF41' : colors.border,
                        ringColor: '#00FF41'
                      }}
                      onClick={() => handleThemeChange('matrix')}
                    >
                      <div 
                        className="w-full h-12 rounded mb-2"
                        style={{ background: 'linear-gradient(to right, #0D7A0D, #00FF41)' }}
                      ></div>
                      <div className="flex justify-between items-center">
                        <span className="text-green-400">Matrix</span>
                        {theme === 'matrix' && (
                          <Check size={18} className="text-green-400" />
                        )}
                      </div>
                    </button>
                    
                    <button
                      className={`p-4 rounded-lg border ${
                        theme === 'ocean' ? 'ring-2' : ''
                      }`}
                      style={{ 
                        backgroundColor: '#071B2F',
                        borderColor: theme === 'ocean' ? '#00CCFF' : colors.border,
                        ringColor: '#00CCFF'
                      }}
                      onClick={() => handleThemeChange('ocean')}
                    >
                      <div 
                        className="w-full h-12 rounded mb-2"
                        style={{ background: 'linear-gradient(to right, #0052D4, #4364F7, #00CCFF)' }}
                      ></div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-400">Ocean</span>
                        {theme === 'ocean' && (
                          <Check size={18} className="text-blue-400" />
                        )}
                      </div>
                    </button>
                    
                    <button
                      className={`p-4 rounded-lg border ${
                        theme === 'blood' ? 'ring-2' : ''
                      }`}
                      style={{ 
                        backgroundColor: '#1A0000',
                        borderColor: theme === 'blood' ? '#FF3E3E' : colors.border,
                        ringColor: '#FF3E3E'
                      }}
                      onClick={() => handleThemeChange('blood')}
                    >
                      <div 
                        className="w-full h-12 rounded mb-2"
                        style={{ background: 'linear-gradient(to right, #8E0E00, #FF3E3E)' }}
                      ></div>
                      <div className="flex justify-between items-center">
                        <span className="text-red-400">Blood</span>
                        {theme === 'blood' && (
                          <Check size={18} className="text-red-400" />
                        )}
                      </div>
                    </button>
                    
                    <button
                      className={`p-4 rounded-lg border ${
                        theme === 'royal' ? 'ring-2' : ''
                      }`}
                      style={{ 
                        backgroundColor: '#10151C',
                        borderColor: theme === 'royal' ? '#FFD700' : colors.border,
                        ringColor: '#FFD700'
                      }}
                      onClick={() => handleThemeChange('royal')}
                    >
                      <div 
                        className="w-full h-12 rounded mb-2"
                        style={{ background: 'linear-gradient(to right, #B88746, #FFD700)' }}
                      ></div>
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-400">Royal</span>
                        {theme === 'royal' && (
                          <Check size={18} className="text-yellow-400" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>
                
                {/* Sound Settings */}
                <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
                  <h3 
                    className="text-lg font-medium mb-4"
                    style={{ color: colors.text.primary }}
                  >
                    Ses Ayarları
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div 
                          className="text-base font-medium mb-1"
                          style={{ color: colors.text.primary }}
                        >
                          Ses Efektleri
                        </div>
                        <div 
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          Arayüz ses efektlerini aktifleştirin veya devre dışı bırakın
                        </div>
                      </div>
                      
                      <button
                        className="p-2 rounded-lg"
                        style={{ 
                          backgroundColor: muted ? `${colors.error}20` : `${colors.success}20`,
                          color: muted ? colors.error : colors.success
                        }}
                        onClick={() => {
                          toggleMute();
                          playSound('click');
                        }}
                      >
                        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                      </button>
                    </div>
                    
                    {!muted && (
                      <div className="space-y-2">
                        <div 
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          Ses Seviyesi: {Math.round(volume * 100)}%
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={(e) => {
                            setVolume(parseFloat(e.target.value));
                            if (parseFloat(e.target.value) > 0) {
                              playSound('click');
                            }
                          }}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, ${colors.primary} ${volume * 100}%, ${colors.border} ${volume * 100}%)`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Notification Settings */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 
                    className="text-lg font-medium mb-4"
                    style={{ color: colors.text.primary }}
                  >
                    E-posta Bildirimleri
                  </h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg" style={{ backgroundColor: colors.background.main }}>
                      <div>
                        <div style={{ color: colors.text.primary }}>E-posta Bildirimleri</div>
                        <div className="text-sm" style={{ color: colors.text.secondary }}>Tüm e-posta bildirimlerini etkinleştir</div>
                      </div>
                      <div 
                        className={`w-12 h-6 rounded-full relative ${
                          notificationSettings.emailNotifications ? 'bg-opacity-100' : 'bg-opacity-50'
                        }`}
                        style={{ 
                          backgroundColor: notificationSettings.emailNotifications ? colors.success : colors.border,
                        }}
                        onClick={() => toggleNotification('emailNotifications')}
                      >
                        <div 
                          className={`absolute w-5 h-5 rounded-full top-0.5 transition-all ${
                            notificationSettings.emailNotifications ? 'left-6.5' : 'left-0.5'
                          }`}
                          style={{ 
                            backgroundColor: '#fff',
                            left: notificationSettings.emailNotifications ? 'calc(100% - 1.5rem)' : '0.25rem',
                          }}
                        ></div>
                      </div>
                    </label>
                    
                    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg" style={{ backgroundColor: colors.background.main }}>
                      <div>
                        <div style={{ color: colors.text.primary }}>Haftalık Raporlar</div>
                        <div className="text-sm" style={{ color: colors.text.secondary }}>Haftalık SEO performans raporlarını al</div>
                      </div>
                      <div 
                        className={`w-12 h-6 rounded-full relative ${
                          notificationSettings.weeklyReports ? 'bg-opacity-100' : 'bg-opacity-50'
                        }`}
                        style={{ 
                          backgroundColor: notificationSettings.weeklyReports ? colors.success : colors.border,
                        }}
                        onClick={() => toggleNotification('weeklyReports')}
                      >
                        <div 
                          className={`absolute w-5 h-5 rounded-full top-0.5 transition-all ${
                            notificationSettings.weeklyReports ? 'left-6.5' : 'left-0.5'
                          }`}
                          style={{ 
                            backgroundColor: '#fff',
                            left: notificationSettings.weeklyReports ? 'calc(100% - 1.5rem)' : '0.25rem',
                          }}
                        ></div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
                  <h3 
                    className="text-lg font-medium mb-4"
                    style={{ color: colors.text.primary }}
                  >
                    Uygulama İçi Bildirimler
                  </h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg" style={{ backgroundColor: colors.background.main }}>
                      <div>
                        <div style={{ color: colors.text.primary }}>SEO Puanı Değişiklikleri</div>
                        <div className="text-sm" style={{ color: colors.text.secondary }}>SEO puanınız değiştiğinde bildirim al</div>
                      </div>
                      <div 
                        className={`w-12 h-6 rounded-full relative ${
                          notificationSettings.scoreChanges ? 'bg-opacity-100' : 'bg-opacity-50'
                        }`}
                        style={{ 
                          backgroundColor: notificationSettings.scoreChanges ? colors.success : colors.border,
                        }}
                        onClick={() => toggleNotification('scoreChanges')}
                      >
                        <div 
                          className={`absolute w-5 h-5 rounded-full top-0.5 transition-all ${
                            notificationSettings.scoreChanges ? 'left-6.5' : 'left-0.5'
                          }`}
                          style={{ 
                            backgroundColor: '#fff',
                            left: notificationSettings.scoreChanges ? 'calc(100% - 1.5rem)' : '0.25rem',
                          }}
                        ></div>
                      </div>
                    </label>
                    
                    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg" style={{ backgroundColor: colors.background.main }}>
                      <div>
                        <div style={{ color: colors.text.primary }}>Yeni Backlink'ler</div>
                        <div className="text-sm" style={{ color: colors.text.secondary }}>Yeni backlink'ler tespit edildiğinde bildirim al</div>
                      </div>
                      <div 
                        className={`w-12 h-6 rounded-full relative ${
                          notificationSettings.newBacklinks ? 'bg-opacity-100' : 'bg-opacity-50'
                        }`}
                        style={{ 
                          backgroundColor: notificationSettings.newBacklinks ? colors.success : colors.border,
                        }}
                        onClick={() => toggleNotification('newBacklinks')}
                      >
                        <div 
                          className={`absolute w-5 h-5 rounded-full top-0.5 transition-all ${
                            notificationSettings.newBacklinks ? 'left-6.5' : 'left-0.5'
                          }`}
                          style={{ 
                            backgroundColor: '#fff',
                            left: notificationSettings.newBacklinks ? 'calc(100% - 1.5rem)' : '0.25rem',
                          }}
                        ></div>
                      </div>
                    </label>
                    
                    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg" style={{ backgroundColor: colors.background.main }}>
                      <div>
                        <div style={{ color: colors.text.primary }}>Rakip Güncellemeleri</div>
                        <div className="text-sm" style={{ color: colors.text.secondary }}>Rakiplerinizde önemli değişiklikler olduğunda bildirim al</div>
                      </div>
                      <div 
                        className={`w-12 h-6 rounded-full relative ${
                          notificationSettings.competitorUpdates ? 'bg-opacity-100' : 'bg-opacity-50'
                        }`}
                        style={{ 
                          backgroundColor: notificationSettings.competitorUpdates ? colors.success : colors.border,
                        }}
                        onClick={() => toggleNotification('competitorUpdates')}
                      >
                        <div 
                          className={`absolute w-5 h-5 rounded-full top-0.5 transition-all ${
                            notificationSettings.competitorUpdates ? 'left-6.5' : 'left-0.5'
                          }`}
                          style={{ 
                            backgroundColor: '#fff',
                            left: notificationSettings.competitorUpdates ? 'calc(100% - 1.5rem)' : '0.25rem',
                          }}
                        ></div>
                      </div>
                    </label>
                    
                    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg" style={{ backgroundColor: colors.background.main }}>
                      <div>
                        <div style={{ color: colors.text.primary }}>Güvenlik Uyarıları</div>
                        <div className="text-sm" style={{ color: colors.text.secondary }}>Hesap güvenliği ile ilgili uyarılar al</div>
                      </div>
                      <div 
                        className={`w-12 h-6 rounded-full relative ${
                          notificationSettings.securityAlerts ? 'bg-opacity-100' : 'bg-opacity-50'
                        }`}
                        style={{ 
                          backgroundColor: notificationSettings.securityAlerts ? colors.success : colors.border,
                        }}
                        onClick={() => toggleNotification('securityAlerts')}
                      >
                        <div 
                          className={`absolute w-5 h-5 rounded-full top-0.5 transition-all ${
                            notificationSettings.securityAlerts ? 'left-6.5' : 'left-0.5'
                          }`}
                          style={{ 
                            backgroundColor: '#fff',
                            left: notificationSettings.securityAlerts ? 'calc(100% - 1.5rem)' : '0.25rem',
                          }}
                        ></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Account Settings */}
            {activeSection === 'account' && (
              <div>
                <div className="space-y-6">
                  <div>
                    <h3 
                      className="text-lg font-medium mb-4"
                      style={{ color: colors.text.primary }}
                    >
                      Profil Bilgileri
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label 
                          className="block text-sm font-medium mb-2"
                          style={{ color: colors.text.secondary }}
                        >
                          Ad
                        </label>
                        <input
                          type="text"
                          className="w-full p-3 rounded-lg bg-transparent border"
                          style={{ 
                            borderColor: colors.border,
                            color: colors.text.primary
                          }}
                          placeholder="Adınız"
                          defaultValue="Demo"
                        />
                      </div>
                      
                      <div>
                        <label 
                          className="block text-sm font-medium mb-2"
                          style={{ color: colors.text.secondary }}
                        >
                          Soyad
                        </label>
                        <input
                          type="text"
                          className="w-full p-3 rounded-lg bg-transparent border"
                          style={{ 
                            borderColor: colors.border,
                            color: colors.text.primary
                          }}
                          placeholder="Soyadınız"
                          defaultValue="Kullanıcı"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label 
                          className="block text-sm font-medium mb-2"
                          style={{ color: colors.text.secondary }}
                        >
                          E-posta
                        </label>
                        <div className="flex">
                          <input
                            type="email"
                            className="w-full p-3 rounded-lg bg-transparent border"
                            style={{ 
                              borderColor: colors.border,
                              color: colors.text.primary
                            }}
                            placeholder="E-posta adresiniz"
                            defaultValue="demo@example.com"
                            disabled
                          />
                          <button
                            className="ml-2 px-4 py-2 rounded-lg"
                            style={{ 
                              backgroundColor: colors.primary,
                              color: '#fff'
                            }}
                            onClick={() => playSound('click')}
                          >
                            Değiştir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t" style={{ borderColor: colors.border }}>
                    <h3 
                      className="text-lg font-medium mb-4"
                      style={{ color: colors.text.primary }}
                    >
                      Şifre Değiştir
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label 
                          className="block text-sm font-medium mb-2"
                          style={{ color: colors.text.secondary }}
                        >
                          Mevcut Şifre
                        </label>
                        <input
                          type="password"
                          className="w-full p-3 rounded-lg bg-transparent border"
                          style={{ 
                            borderColor: colors.border,
                            color: colors.text.primary
                          }}
                          placeholder="Mevcut şifreniz"
                        />
                      </div>
                      
                      <div>
                        <label 
                          className="block text-sm font-medium mb-2"
                          style={{ color: colors.text.secondary }}
                        >
                          Yeni Şifre
                        </label>
                        <input
                          type="password"
                          className="w-full p-3 rounded-lg bg-transparent border"
                          style={{ 
                            borderColor: colors.border,
                            color: colors.text.primary
                          }}
                          placeholder="Yeni şifreniz"
                        />
                      </div>
                      
                      <div>
                        <label 
                          className="block text-sm font-medium mb-2"
                          style={{ color: colors.text.secondary }}
                        >
                          Yeni Şifre (Tekrar)
                        </label>
                        <input
                          type="password"
                          className="w-full p-3 rounded-lg bg-transparent border"
                          style={{ 
                            borderColor: colors.border,
                            color: colors.text.primary
                          }}
                          placeholder="Yeni şifrenizi tekrar girin"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Language Settings */}
            {activeSection === 'language' && (
              <div>
                <div className="space-y-6">
                  <div>
                    <h3 
                      className="text-lg font-medium mb-4"
                      style={{ color: colors.text.primary }}
                    >
                      Uygulama Dili
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <button
                        className="p-4 rounded-lg border flex items-center"
                        style={{ 
                          borderColor: colors.border,
                          backgroundColor: colors.background.main
                        }}
                        onClick={() => playSound('click')}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                          style={{ backgroundColor: `${colors.primary}15` }}
                        >
                          <span className="text-sm font-medium" style={{ color: colors.primary }}>TR</span>
                        </div>
                        <div className="flex-1">
                          <div style={{ color: colors.text.primary }}>Türkçe</div>
                          <div className="text-xs" style={{ color: colors.text.secondary }}>Turkish</div>
                        </div>
                        <Check size={18} style={{ color: colors.success }} />
                      </button>
                      
                      <button
                        className="p-4 rounded-lg border flex items-center"
                        style={{ 
                          borderColor: colors.border,
                          backgroundColor: colors.background.main
                        }}
                        onClick={() => playSound('click')}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                          style={{ backgroundColor: `${colors.secondary}15` }}
                        >
                          <span className="text-sm font-medium" style={{ color: colors.secondary }}>EN</span>
                        </div>
                        <div className="flex-1">
                          <div style={{ color: colors.text.primary }}>English</div>
                          <div className="text-xs" style={{ color: colors.text.secondary }}>İngilizce</div>
                        </div>
                      </button>
                      
                      <button
                        className="p-4 rounded-lg border flex items-center"
                        style={{ 
                          borderColor: colors.border,
                          backgroundColor: colors.background.main
                        }}
                        onClick={() => playSound('click')}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                          style={{ backgroundColor: `${colors.accent}15` }}
                        >
                          <span className="text-sm font-medium" style={{ color: colors.accent }}>AR</span>
                        </div>
                        <div className="flex-1">
                          <div style={{ color: colors.text.primary }}>العربية</div>
                          <div className="text-xs" style={{ color: colors.text.secondary }}>Arapça</div>
                        </div>
                      </button>
                      
                      <button
                        className="p-4 rounded-lg border flex items-center"
                        style={{ 
                          borderColor: colors.border,
                          backgroundColor: colors.background.main
                        }}
                        onClick={() => playSound('click')}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                          style={{ backgroundColor: `${colors.error}15` }}
                        >
                          <span className="text-sm font-medium" style={{ color: colors.error }}>RU</span>
                        </div>
                        <div className="flex-1">
                          <div style={{ color: colors.text.primary }}>Русский</div>
                          <div className="text-xs" style={{ color: colors.text.secondary }}>Rusça</div>
                        </div>
                      </button>
                      
                      <button
                        className="p-4 rounded-lg border flex items-center"
                        style={{ 
                          borderColor: colors.border,
                          backgroundColor: colors.background.main
                        }}
                        onClick={() => playSound('click')}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                          style={{ backgroundColor: `${colors.warning}15` }}
                        >
                          <span className="text-sm font-medium" style={{ color: colors.warning }}>CN</span>
                        </div>
                        <div className="flex-1">
                          <div style={{ color: colors.text.primary }}>中文</div>
                          <div className="text-xs" style={{ color: colors.text.secondary }}>Çince</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Placeholder for other settings sections */}
            {(activeSection === 'api' || activeSection === 'privacy' || activeSection === 'data') && (
              <div className="py-12 text-center">
                <RefreshCw size={48} style={{ color: colors.text.secondary, opacity: 0.3 }} className="mx-auto mb-4" />
                <h3 
                  className="text-lg font-medium mb-2"
                  style={{ color: colors.text.primary }}
                >
                  {activeSection === 'api' && 'API Ayarları'}
                  {activeSection === 'privacy' && 'Gizlilik ve Güvenlik Ayarları'}
                  {activeSection === 'data' && 'Veri Yönetimi Ayarları'}
                </h3>
                <p style={{ color: colors.text.secondary }}>
                  Bu bölüm daha sonra eklenecektir.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          className="px-6 py-3 rounded-lg flex items-center"
          style={{ 
            backgroundColor: colors.primary,
            color: '#fff'
          }}
          onClick={handleSave}
        >
          <Save size={18} className="mr-2" />
          <span>Ayarları Kaydet</span>
        </button>
      </div>
      
      {/* Success Message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg flex items-center"
          style={{ 
            backgroundColor: colors.success,
            color: '#fff'
          }}
        >
          <Check size={18} className="mr-2" />
          <span>Ayarlar başarıyla kaydedildi</span>
        </motion.div>
      )}
    </div>
  );
};

export default SettingsPage;