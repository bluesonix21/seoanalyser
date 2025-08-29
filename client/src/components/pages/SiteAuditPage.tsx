import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useAudio } from '../../lib/stores/useAudio';
import { useGame } from '../../lib/stores/useGame';

// Icons
import { 
  Search, 
  AlertTriangle, 
  CheckSquare, 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  RefreshCw, 
  Download, 
  FileText, 
  Link, 
  Image, 
  Code, 
  Database, 
  Zap, 
  Smartphone, 
  Share2, 
  Shield, 
  Settings, 
  Play,
  X,
  Check,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

const SiteAuditPage: React.FC = () => {
  const { colors } = useTheme();
  const { playSound } = useAudio();
  const [expandedCategory, setExpandedCategory] = useState<string | null>('critical');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const { siteAuditData, loadingState, error } = useGame();
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
    playSound('click');
  };
  
  // Toggle issue expansion
  const toggleIssue = (id: string) => {
    setExpandedIssue(expandedIssue === id ? null : id);
    playSound('click');
  };
  
  // Get issue type icon
  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone size={18} style={{ color: colors.warning }} />;
      case 'performance':
        return <Zap size={18} style={{ color: colors.error }} />;
      case 'seo':
        return <Search size={18} style={{ color: colors.primary }} />;
      case 'security':
        return <Shield size={18} style={{ color: colors.error }} />;
      case 'content':
        return <FileText size={18} style={{ color: colors.secondary }} />;
      case 'links':
        return <Link size={18} style={{ color: colors.warning }} />;
      case 'images':
        return <Image size={18} style={{ color: colors.accent }} />;
      case 'code':
        return <Code size={18} style={{ color: colors.info }} />;
      default:
        return <AlertTriangle size={18} style={{ color: colors.warning }} />;
    }
  };
  
  // Get issue priority color
  const getIssuePriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return colors.error;
      case 'high':
        return colors.warning;
      case 'medium':
        return colors.info;
      case 'low':
        return colors.success;
      default:
        return colors.text.secondary;
    }
  };
  
  // Get issue category score
  const getCategoryScore = (category: string) => {
    switch (category) {
      case 'seo':
        return 78;
      case 'performance':
        return 62;
      case 'security':
        return 94;
      case 'mobile':
        return 87;
      case 'content':
        return 89;
      default:
        return 0;
    }
  };
  
  if (loadingState === "loading") {
    return <div className="text-center text-lg text-gray-300 py-12">Analiz verileri yükleniyor...</div>;
  }
  if (loadingState === "error") {
    return <div className="text-center text-red-400 py-12">{error || "Veri alınamadı."}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            Site Denetimi
          </h1>
          <p style={{ color: colors.text.secondary }}>
            Teknik SEO sorunlarını tespit edin ve site performansını artırın
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div 
            className="text-sm px-4 py-2 rounded-lg flex items-center"
            style={{ 
              backgroundColor: colors.background.card,
              color: colors.text.secondary 
            }}
          >
            <Clock size={16} className="mr-2" />
            <span>Son denetim: 23 Nisan 2025</span>
          </div>
          
          <button 
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: `${colors.secondary}20`, color: colors.secondary }}
            onClick={() => playSound('click')}
          >
            <Download size={18} />
            <span>İndir</span>
          </button>
          
          <button 
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: colors.primary, color: '#fff' }}
            onClick={() => playSound('click')}
          >
            <RefreshCw size={18} />
            <span>Yeniden Tara</span>
          </button>
        </div>
      </div>
      
      {/* Site Score */}
      <div 
        className="rounded-lg border p-6"
        style={{ 
          backgroundColor: colors.background.card,
          borderColor: colors.border
        }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <div 
                className="relative inline-flex items-center justify-center w-32 h-32 mb-3"
              >
                <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={`${colors.primary}30`}
                    strokeWidth="3"
                    strokeDasharray="100, 100"
                  />
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={colors.primary}
                    strokeWidth="3"
                    strokeDasharray="74, 100"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <div 
                      className="text-3xl font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      74
                    </div>
                    <div 
                      className="text-xs"
                      style={{ color: colors.text.secondary }}
                    >
                      / 100
                    </div>
                  </div>
                </div>
              </div>
              <div 
                className="text-lg font-bold"
                style={{ color: colors.text.primary }}
              >
                Genel Puan
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.primary }}
                  ></div>
                  <span style={{ color: colors.text.secondary }}>SEO</span>
                  <span 
                    className="font-medium ml-auto"
                    style={{ color: colors.text.primary }}
                  >
                    {getCategoryScore('seo')}/100
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.error }}
                  ></div>
                  <span style={{ color: colors.text.secondary }}>Performans</span>
                  <span 
                    className="font-medium ml-auto"
                    style={{ color: colors.text.primary }}
                  >
                    {getCategoryScore('performance')}/100
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.success }}
                  ></div>
                  <span style={{ color: colors.text.secondary }}>Güvenlik</span>
                  <span 
                    className="font-medium ml-auto"
                    style={{ color: colors.text.primary }}
                  >
                    {getCategoryScore('security')}/100
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.warning }}
                  ></div>
                  <span style={{ color: colors.text.secondary }}>Mobil</span>
                  <span 
                    className="font-medium ml-auto"
                    style={{ color: colors.text.primary }}
                  >
                    {getCategoryScore('mobile')}/100
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.secondary }}
                  ></div>
                  <span style={{ color: colors.text.secondary }}>İçerik</span>
                  <span 
                    className="font-medium ml-auto"
                    style={{ color: colors.text.primary }}
                  >
                    {getCategoryScore('content')}/100
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.info }}
                  ></div>
                  <span style={{ color: colors.text.secondary }}>Diğer</span>
                  <span 
                    className="font-medium ml-auto"
                    style={{ color: colors.text.primary }}
                  >
                    83/100
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 md:mt-0 flex space-x-6">
            <div className="text-center">
              <div 
                className="text-3xl font-bold mb-1"
                style={{ color: colors.error }}
              >
                3
              </div>
              <div className="text-sm" style={{ color: colors.text.secondary }}>
                Kritik Hata
              </div>
            </div>
            
            <div className="text-center">
              <div 
                className="text-3xl font-bold mb-1"
                style={{ color: colors.warning }}
              >
                4
              </div>
              <div className="text-sm" style={{ color: colors.text.secondary }}>
                Yüksek Öncelik
              </div>
            </div>
            
            <div className="text-center">
              <div 
                className="text-3xl font-bold mb-1"
                style={{ color: colors.info }}
              >
                3
              </div>
              <div className="text-sm" style={{ color: colors.text.secondary }}>
                Orta Öncelik
              </div>
            </div>
            
            <div className="text-center">
              <div 
                className="text-3xl font-bold mb-1"
                style={{ color: colors.success }}
              >
                31
              </div>
              <div className="text-sm" style={{ color: colors.text.secondary }}>
                Başarılı Öğe
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Issues Categories */}
      <div 
        className="rounded-lg border overflow-hidden"
        style={{ 
          backgroundColor: colors.background.card,
          borderColor: colors.border
        }}
      >
        {/* Category: Critical Issues */}
        <div>
          <button
            className={`w-full p-4 text-left flex items-center justify-between transition-colors border-b ${
              expandedCategory === 'critical' ? 'bg-white/5' : ''
            }`}
            style={{ borderColor: colors.border }}
            onClick={() => toggleCategory('critical')}
          >
            <div className="flex items-center">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.error}20` }}
              >
                <AlertTriangle size={16} style={{ color: colors.error }} />
              </div>
              <div>
                <h3 
                  className="font-medium"
                  style={{ color: colors.text.primary }}
                >
                  Kritik Hatalar
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  Acil dikkat gerektiren, sıralamanızı ve kullanıcı deneyimini önemli ölçüde etkileyen hatalar
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div 
                className="px-2 py-1 rounded-full text-sm mr-3"
                style={{ 
                  backgroundColor: `${colors.error}20`,
                  color: colors.error
                }}
              >
                3 Sorun
              </div>
              {expandedCategory === 'critical' ? (
                <ChevronDown size={20} style={{ color: colors.text.secondary }} />
              ) : (
                <ChevronRight size={20} style={{ color: colors.text.secondary }} />
              )}
            </div>
          </button>
          
          {expandedCategory === 'critical' && (
            <div className="divide-y" style={{ borderColor: colors.border }}>
              {siteAuditData.categories.map((cat, idx) => (
                <div key={cat.name} className="flex items-center justify-between p-4">
                  <span style={{ color: colors.text.primary }}>{cat.name}</span>
                  <span style={{
                    color:
                      cat.severity === 'error' ? colors.error :
                      cat.severity === 'warning' ? colors.warning :
                      colors.info
                  }}>
                    {cat.count} {cat.severity === 'error' ? 'sorun' : cat.severity === 'warning' ? 'uyarı' : 'bilgi'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Category: High Priority Issues */}
        <div>
          <button
            className={`w-full p-4 text-left flex items-center justify-between transition-colors border-b ${
              expandedCategory === 'high' ? 'bg-white/5' : ''
            }`}
            style={{ borderColor: colors.border }}
            onClick={() => toggleCategory('high')}
          >
            <div className="flex items-center">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.warning}20` }}
              >
                <AlertTriangle size={16} style={{ color: colors.warning }} />
              </div>
              <div>
                <h3 
                  className="font-medium"
                  style={{ color: colors.text.primary }}
                >
                  Yüksek Öncelikli Sorunlar
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  Yakın zamanda çözülmesi gereken, sitenizin performansını etkileyen sorunlar
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div 
                className="px-2 py-1 rounded-full text-sm mr-3"
                style={{ 
                  backgroundColor: `${colors.warning}20`,
                  color: colors.warning
                }}
              >
                4 Sorun
              </div>
              {expandedCategory === 'high' ? (
                <ChevronDown size={20} style={{ color: colors.text.secondary }} />
              ) : (
                <ChevronRight size={20} style={{ color: colors.text.secondary }} />
              )}
            </div>
          </button>
          
          {expandedCategory === 'high' && (
            <div className="divide-y" style={{ borderColor: colors.border }}>
              {siteAuditData.categories.map((cat, idx) => (
                <div key={cat.name} className="flex items-center justify-between p-4">
                  <span style={{ color: colors.text.primary }}>{cat.name}</span>
                  <span style={{
                    color:
                      cat.severity === 'error' ? colors.error :
                      cat.severity === 'warning' ? colors.warning :
                      colors.info
                  }}>
                    {cat.count} {cat.severity === 'error' ? 'sorun' : cat.severity === 'warning' ? 'uyarı' : 'bilgi'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Category: Medium Priority Issues */}
        <div>
          <button
            className={`w-full p-4 text-left flex items-center justify-between transition-colors border-b ${
              expandedCategory === 'medium' ? 'bg-white/5' : ''
            }`}
            style={{ borderColor: colors.border }}
            onClick={() => toggleCategory('medium')}
          >
            <div className="flex items-center">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.info}20` }}
              >
                <AlertTriangle size={16} style={{ color: colors.info }} />
              </div>
              <div>
                <h3 
                  className="font-medium"
                  style={{ color: colors.text.primary }}
                >
                  Orta Öncelikli Sorunlar
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  Sitenizi iyileştirmek için düzeltilmesi gereken, ancak acil olmayan sorunlar
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div 
                className="px-2 py-1 rounded-full text-sm mr-3"
                style={{ 
                  backgroundColor: `${colors.info}20`,
                  color: colors.info
                }}
              >
                3 Sorun
              </div>
              {expandedCategory === 'medium' ? (
                <ChevronDown size={20} style={{ color: colors.text.secondary }} />
              ) : (
                <ChevronRight size={20} style={{ color: colors.text.secondary }} />
              )}
            </div>
          </button>
          
          {expandedCategory === 'medium' && (
            <div className="divide-y" style={{ borderColor: colors.border }}>
              {siteAuditData.categories.map((cat, idx) => (
                <div key={cat.name} className="flex items-center justify-between p-4">
                  <span style={{ color: colors.text.primary }}>{cat.name}</span>
                  <span style={{
                    color:
                      cat.severity === 'error' ? colors.error :
                      cat.severity === 'warning' ? colors.warning :
                      colors.info
                  }}>
                    {cat.count} {cat.severity === 'error' ? 'sorun' : cat.severity === 'warning' ? 'uyarı' : 'bilgi'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Category: Passed Checks */}
        <div>
          <button
            className={`w-full p-4 text-left flex items-center justify-between transition-colors ${
              expandedCategory === 'passed' ? 'bg-white/5' : ''
            }`}
            style={{ borderColor: colors.border }}
            onClick={() => toggleCategory('passed')}
          >
            <div className="flex items-center">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                style={{ backgroundColor: `${colors.success}20` }}
              >
                <CheckSquare size={16} style={{ color: colors.success }} />
              </div>
              <div>
                <h3 
                  className="font-medium"
                  style={{ color: colors.text.primary }}
                >
                  Başarılı Kontroller
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  Sitenizin zaten doğru yapılandırıldığı ve iyi performans gösterdiği alanlar
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div 
                className="px-2 py-1 rounded-full text-sm mr-3"
                style={{ 
                  backgroundColor: `${colors.success}20`,
                  color: colors.success
                }}
              >
                31 Kontrol
              </div>
              {expandedCategory === 'passed' ? (
                <ChevronDown size={20} style={{ color: colors.text.secondary }} />
              ) : (
                <ChevronRight size={20} style={{ color: colors.text.secondary }} />
              )}
            </div>
          </button>
          
          {expandedCategory === 'passed' && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div 
                className="p-3 rounded-lg border flex items-center"
                style={{ 
                  backgroundColor: colors.background.main,
                  borderColor: colors.border
                }}
              >
                <Check size={16} className="mr-2" style={{ color: colors.success }} />
                <span style={{ color: colors.text.primary }}>Sitemap.xml mevcut ve düzgün yapılandırılmış</span>
              </div>
              <div 
                className="p-3 rounded-lg border flex items-center"
                style={{ 
                  backgroundColor: colors.background.main,
                  borderColor: colors.border
                }}
              >
                <Check size={16} className="mr-2" style={{ color: colors.success }} />
                <span style={{ color: colors.text.primary }}>Canonical URL'ler doğru kullanılmış</span>
              </div>
              <div 
                className="p-3 rounded-lg border flex items-center"
                style={{ 
                  backgroundColor: colors.background.main,
                  borderColor: colors.border
                }}
              >
                <Check size={16} className="mr-2" style={{ color: colors.success }} />
                <span style={{ color: colors.text.primary }}>Alt etiketi tüm resimler için mevcut</span>
              </div>
              <div 
                className="p-3 rounded-lg border flex items-center"
                style={{ 
                  backgroundColor: colors.background.main,
                  borderColor: colors.border
                }}
              >
                <Check size={16} className="mr-2" style={{ color: colors.success }} />
                <span style={{ color: colors.text.primary }}>İç bağlantı yapısı mantıklı ve tutarlı</span>
              </div>
              <div 
                className="p-3 rounded-lg border flex items-center"
                style={{ 
                  backgroundColor: colors.background.main,
                  borderColor: colors.border
                }}
              >
                <Check size={16} className="mr-2" style={{ color: colors.success }} />
                <span style={{ color: colors.text.primary }}>Tüm CSS ve JS dosyaları sıkıştırılmış</span>
              </div>
              <div 
                className="p-3 rounded-lg border flex items-center"
                style={{ 
                  backgroundColor: colors.background.main,
                  borderColor: colors.border
                }}
              >
                <Check size={16} className="mr-2" style={{ color: colors.success }} />
                <span style={{ color: colors.text.primary }}>Tarayıcı önbelleği etkinleştirilmiş</span>
              </div>
              
              <div 
                className="p-3 rounded-lg border flex items-center justify-center col-span-2"
                style={{ 
                  backgroundColor: colors.background.main,
                  borderColor: colors.border
                }}
              >
                <button
                  className="text-sm flex items-center"
                  style={{ color: colors.primary }}
                  onClick={() => playSound('click')}
                >
                  <span>Tüm Başarılı Kontrolleri Gör</span>
                  <ArrowRight size={14} className="ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Additional Resources */}
      <div
        className="rounded-lg border p-6 text-center"
        style={{ 
          backgroundColor: `${colors.primary}10`,
          borderColor: `${colors.primary}30`
        }}
      >
        <h3 
          className="text-lg font-bold mb-2"
          style={{ color: colors.text.primary }}
        >
          SEO Performansınızı Daha Da İyileştirin
        </h3>
        <p 
          className="mb-4 max-w-3xl mx-auto"
          style={{ color: colors.text.secondary }}
        >
          Sorunları düzelttikten sonra, aşağıdaki kaynaklarla SEO puanınızı daha da artırabilirsiniz
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            className="flex items-center space-x-2 px-4 py-2 rounded-lg"
            style={{ 
              backgroundColor: colors.background.card,
              color: colors.text.primary
            }}
            onClick={() => playSound('click')}
          >
            <Settings size={16} />
            <span>Denetim Ayarları</span>
          </button>
          
          <button
            className="flex items-center space-x-2 px-4 py-2 rounded-lg"
            style={{ 
              backgroundColor: colors.background.card,
              color: colors.text.primary
            }}
            onClick={() => playSound('click')}
          >
            <Download size={16} />
            <span>Tam Raporu İndir</span>
          </button>
          
          <button
            className="flex items-center space-x-2 px-4 py-2 rounded-lg"
            style={{ 
              backgroundColor: colors.background.card,
              color: colors.text.primary
            }}
            onClick={() => playSound('click')}
          >
            <RefreshCw size={16} />
            <span>Otomatik Denetim Planla</span>
          </button>
          
          <button
            className="flex items-center space-x-2 px-4 py-2 rounded-lg"
            style={{ 
              backgroundColor: colors.primary,
              color: '#fff'
            }}
            onClick={() => playSound('click')}
          >
            <Zap size={16} />
            <span>SEO Performansını Artır</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteAuditPage;