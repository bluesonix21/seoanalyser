import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useGame } from '../../lib/stores/useGame';
import { useAudio } from '../../lib/stores/useAudio';

// Icons
import { 
  BarChart2, 
  Zap, 
  Accessibility, 
  Check, 
  Search,
  AlertTriangle,
  XCircle,
  Download,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Lightbulb,
  Rocket
} from 'lucide-react';

// Detay Modalı
const DetailModal = ({ open, onClose, data }: { open: boolean, onClose: () => void, data: any }) => {
  const { colors } = useTheme();
  if (!open || !data) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full p-6 relative"
        style={{ border: `2px solid ${colors.primary}` }}
        onClick={e => e.stopPropagation()}
      >
        <button className="absolute top-3 right-3 text-gray-400 hover:text-red-500" onClick={onClose}>
          <XCircle size={24} />
        </button>
        <h2 className="text-xl font-bold mb-2" style={{ color: colors.text.primary }}>{data.title || data.message}</h2>
        <div className="mb-2 text-sm" style={{ color: colors.text.secondary }}>{data.details?.explanation || data.explanation}</div>
        <div className="mb-2">
          <span className="font-medium">Etki:</span> {data.details?.impact || data.impact || '-'}
          <span className="ml-4 font-medium">Zorluk:</span> {data.details?.difficulty || data.difficulty || '-'}
          <span className="ml-4 font-medium">Kategori:</span> {data.details?.category || data.category || '-'}
        </div>
        <div className="mb-2">
          <span className="font-medium">Selector:</span> <span className="font-mono text-xs">{data.details?.selector || '-'}</span>
        </div>
        {data.details?.example && (
          <div className="mb-2">
            <span className="font-medium">Örnek Kod:</span>
            <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 mt-1 text-xs overflow-x-auto relative">
              {data.details.example}
              <button
                className="absolute top-1 right-1 text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-primary-500"
                onClick={() => {navigator.clipboard.writeText(data.details.example)}}
              >Kopyala</button>
            </pre>
          </div>
        )}
        {data.details?.reference && (
          <div className="mb-2">
            <a href={data.details.reference} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Referans</a>
          </div>
        )}
        {data.details?.suggestion && (
          <div className="mb-2">
            <span className="font-medium">Çözüm Önerisi:</span> {data.details.suggestion}
          </div>
        )}
      </div>
    </div>
  );
};

const SEOScorePage: React.FC = () => {
  const { colors } = useTheme();
  const { seoData, loadingState, error } = useGame();
  const { playSound } = useAudio();
  const [activeTab, setActiveTab] = useState('issues');
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [expandedImprovement, setExpandedImprovement] = useState<number | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterType, setFilterType] = useState<string[]>(['error', 'warning', 'info']);
  
  // Animate score on load
  const [animatedScore, setAnimatedScore] = useState(0);
  
  // Detay Modalı
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      playSound('notification');
    }, 500);
    
    return () => clearTimeout(timer);
  }, [playSound]);
  
  // Animate the SEO score
  useEffect(() => {
    let startValue = 0;
    const targetValue = seoData.score;
    const duration = 1500; // ms
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;
    
    const animate = () => {
      frame++;
      const progress = frame / totalFrames;
      const currentValue = Math.round(startValue + progress * (targetValue - startValue));
      
      setAnimatedScore(currentValue);
      
      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [seoData.score]);
  
  // Gerçek analizden sorunlar ve iyileştirmeler (backend'den gelmiyorsa boş dizi)
  const issues: any[] = Array.isArray(seoData.issues) ? seoData.issues : [];
  const improvements: any[] = Array.isArray(seoData.improvements) ? seoData.improvements : [];
  const filteredIssues = issues.filter((issue: any) => filterType.includes(issue.type));
  
  // Toggle filter type
  const toggleFilter = (type: string) => {
    if (filterType.includes(type)) {
      if (filterType.length > 1) { // Don't allow empty filter
        setFilterType(filterType.filter(t => t !== type));
      }
    } else {
      setFilterType([...filterType, type]);
    }
    
    playSound('click');
  };
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    playSound('click');
  };
  
  // Toggle issue expansion
  const toggleIssue = (id: number) => {
    setExpandedIssue(expandedIssue === id ? null : id);
    playSound('click');
  };
  
  // Toggle improvement expansion
  const toggleImprovement = (id: number) => {
    setExpandedImprovement(expandedImprovement === id ? null : id);
    playSound('click');
  };
  
  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 50) return colors.warning;
    return colors.error;
  };
  
  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'low':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'high':
        return colors.error;
      default:
        return colors.text.secondary;
    }
  };
  
  // Get impact color
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };
  
  // Get issue type icon
  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle size={20} style={{ color: colors.error }} />;
      case 'warning':
        return <AlertTriangle size={20} style={{ color: colors.warning }} />;
      case 'info':
        return <Lightbulb size={20} style={{ color: colors.info }} />;
      default:
        return <AlertTriangle size={20} style={{ color: colors.warning }} />;
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
            SEO Puanı ve Analizi
          </h1>
          <p style={{ color: colors.text.secondary }}>
            Sitenizin SEO performansını analiz edin ve iyileştirme fırsatlarını keşfedin
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: `${colors.secondary}20`, color: colors.secondary }}
            onClick={() => playSound('click')}
          >
            <Download size={18} />
            <span>Rapor İndir</span>
          </button>
          
          <button 
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: colors.primary, color: '#fff' }}
            onClick={() => playSound('click')}
          >
            <RefreshCw size={18} />
            <span>Yenile</span>
          </button>
        </div>
      </div>
      
      {/* SEO Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Main Score Card */}
        <motion.div 
          className="md:col-span-2 rounded-xl p-6 relative overflow-hidden"
          style={{ backgroundColor: colors.background.card }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-bold mb-4" style={{ color: colors.text.primary }}>
            Genel SEO Puanı
          </h2>
          
          <div className="flex items-center justify-center my-6">
            <div className="relative">
              {/* Score circle */}
              <svg width="160" height="160" viewBox="0 0 160 160">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={`${colors.border}`}
                  strokeWidth="4"
                />
                
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={getScoreColor(seoData.score)}
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 70 * (animatedScore / 100)} ${2 * Math.PI * 70}`}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                />
              </svg>
              
              {/* Score text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold" style={{ color: getScoreColor(seoData.score) }}>
                  {animatedScore}
                </span>
                <span style={{ color: colors.text.secondary }}>/ 100</span>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-4">
            <p className="mb-2" style={{ color: colors.text.primary }}>
              {seoData.score >= 80 
                ? 'Mükemmel! Siteniz SEO açısından oldukça iyi durumda.' 
                : seoData.score >= 50 
                  ? 'İyi! Ancak geliştirilebilecek alanlar var.' 
                  : 'Dikkat! SEO performansınız iyileştirilmelidir.'}
            </p>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Son analiz: 23 Nisan 2025
            </p>
          </div>
          
          <div 
            className="p-3 rounded-lg text-center"
            style={{ backgroundColor: `${colors.primary}10` }}
          >
            <p className="text-sm" style={{ color: colors.text.primary }}>
              <Rocket size={16} className="inline mr-1" />
              SEO puanınızı iyileştirmek için <strong>{issues.length}</strong> sorunu çözün ve <strong>{improvements.length}</strong> iyileştirme önerisini uygulayın.
            </p>
          </div>
          
          {/* Background decoration */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full opacity-5" 
            style={{ background: `radial-gradient(circle, ${colors.primary} 0%, transparent 70%)` }} 
          />
        </motion.div>
        
        {/* Performance Metrics Cards */}
        <motion.div 
          className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Performance Card */}
          <div 
            className="rounded-xl p-5 relative overflow-hidden"
            style={{ backgroundColor: colors.background.card }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm" style={{ color: colors.text.secondary }}>Performans</p>
                <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{seoData.performanceScore}</h3>
              </div>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Zap size={20} style={{ color: colors.primary }} />
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
              <motion.div 
                className="h-full rounded-full"
                style={{ backgroundColor: getScoreColor(seoData.performanceScore) }}
                initial={{ width: 0 }}
                animate={{ width: `${seoData.performanceScore}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            
            <p className="mt-3 text-sm" style={{ color: colors.text.secondary }}>
              Yükleme süresini 0.5s düşürün
            </p>
          </div>
          
          {/* Accessibility Card */}
          <div 
            className="rounded-xl p-5 relative overflow-hidden"
            style={{ backgroundColor: colors.background.card }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm" style={{ color: colors.text.secondary }}>Erişilebilirlik</p>
                <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{seoData.accessibilityScore}</h3>
              </div>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${colors.secondary}20` }}
              >
                <Accessibility size={20} style={{ color: colors.secondary }} />
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
              <motion.div 
                className="h-full rounded-full"
                style={{ backgroundColor: getScoreColor(seoData.accessibilityScore) }}
                initial={{ width: 0 }}
                animate={{ width: `${seoData.accessibilityScore}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            
            <p className="mt-3 text-sm" style={{ color: colors.text.secondary }}>
              Alt etiketleri ekleyin
            </p>
          </div>
          
          {/* SEO Card */}
          <div 
            className="rounded-xl p-5 relative overflow-hidden"
            style={{ backgroundColor: colors.background.card }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm" style={{ color: colors.text.secondary }}>SEO Teknik</p>
                <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{seoData.seoScore}</h3>
              </div>
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${colors.accent}20` }}
              >
                <Search size={20} style={{ color: colors.accent }} />
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
              <motion.div 
                className="h-full rounded-full"
                style={{ backgroundColor: getScoreColor(seoData.seoScore) }}
                initial={{ width: 0 }}
                animate={{ width: `${seoData.seoScore}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            
            <p className="mt-3 text-sm" style={{ color: colors.text.secondary }}>
              Meta etiketlerini optimize edin
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Main Content with Tabs */}
      <div 
        className="rounded-lg overflow-hidden border"
        style={{ 
          backgroundColor: colors.background.card,
          borderColor: colors.border
        }}
      >
        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: colors.border }}>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'issues' ? 'border-b-2' : ''}`}
            style={{ 
              borderColor: activeTab === 'issues' ? colors.primary : 'transparent',
              color: activeTab === 'issues' ? colors.text.primary : colors.text.secondary
            }}
            onClick={() => handleTabChange('issues')}
          >
            Sorunlar ({issues.length})
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'improvements' ? 'border-b-2' : ''}`}
            style={{ 
              borderColor: activeTab === 'improvements' ? colors.primary : 'transparent',
              color: activeTab === 'improvements' ? colors.text.primary : colors.text.secondary
            }}
            onClick={() => handleTabChange('improvements')}
          >
            İyileştirmeler ({improvements.length})
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'history' ? 'border-b-2' : ''}`}
            style={{ 
              borderColor: activeTab === 'history' ? colors.primary : 'transparent',
              color: activeTab === 'history' ? colors.text.primary : colors.text.secondary
            }}
            onClick={() => handleTabChange('history')}
          >
            Geçmiş
          </button>
        </div>
        
        {/* Filter for Issues Tab */}
        {activeTab === 'issues' && (
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: colors.border }}>
            <div className="relative">
              <button
                className="flex items-center space-x-2 px-4 py-2 rounded-lg border"
                style={{ borderColor: colors.border, color: colors.text.secondary }}
                onClick={() => {
                  setIsFiltering(!isFiltering);
                  playSound('click');
                }}
              >
                <span>Filtrele</span>
                <ChevronDown size={18} className={`transition-transform ${isFiltering ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Filter Dropdown */}
              {isFiltering && issues.length > 0 && (
                <div 
                  className="absolute top-full left-0 mt-2 p-3 rounded-lg border shadow-lg z-10"
                  style={{ 
                    backgroundColor: colors.background.card,
                    borderColor: colors.border
                  }}
                >
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterType.includes('error')}
                        onChange={() => toggleFilter('error')}
                        className="sr-only"
                      />
                      <div 
                        className={`w-5 h-5 rounded flex items-center justify-center ${
                          filterType.includes('error') ? '' : 'border'
                        }`}
                        style={{ 
                          backgroundColor: filterType.includes('error') ? colors.error : 'transparent',
                          borderColor: filterType.includes('error') ? 'transparent' : colors.border
                        }}
                      >
                        {filterType.includes('error') && (
                          <Check size={12} color="#fff" />
                        )}
                      </div>
                      <span className="flex items-center" style={{ color: colors.text.primary }}>
                        <XCircle size={16} className="mr-1.5" style={{ color: colors.error }} />
                        Hatalar
                      </span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterType.includes('warning')}
                        onChange={() => toggleFilter('warning')}
                        className="sr-only"
                      />
                      <div 
                        className={`w-5 h-5 rounded flex items-center justify-center ${
                          filterType.includes('warning') ? '' : 'border'
                        }`}
                        style={{ 
                          backgroundColor: filterType.includes('warning') ? colors.warning : 'transparent',
                          borderColor: filterType.includes('warning') ? 'transparent' : colors.border
                        }}
                      >
                        {filterType.includes('warning') && (
                          <Check size={12} color="#fff" />
                        )}
                      </div>
                      <span className="flex items-center" style={{ color: colors.text.primary }}>
                        <AlertTriangle size={16} className="mr-1.5" style={{ color: colors.warning }} />
                        Uyarılar
                      </span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterType.includes('info')}
                        onChange={() => toggleFilter('info')}
                        className="sr-only"
                      />
                      <div 
                        className={`w-5 h-5 rounded flex items-center justify-center ${
                          filterType.includes('info') ? '' : 'border'
                        }`}
                        style={{ 
                          backgroundColor: filterType.includes('info') ? colors.info : 'transparent',
                          borderColor: filterType.includes('info') ? 'transparent' : colors.border
                        }}
                      >
                        {filterType.includes('info') && (
                          <Check size={12} color="#fff" />
                        )}
                      </div>
                      <span className="flex items-center" style={{ color: colors.text.primary }}>
                        <Lightbulb size={16} className="mr-1.5" style={{ color: colors.info }} />
                        Bilgi
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-sm" style={{ color: colors.text.secondary }}>
              {filteredIssues.length} sorun gösteriliyor
            </div>
          </div>
        )}
        
        {/* Content */}
        <div>
          {/* Issues Tab */}
          {activeTab === 'issues' && (
            <div className="divide-y" style={{ borderColor: colors.border }}>
              {filteredIssues.length > 0 ? (
                filteredIssues.map((issue, idx) => (
                  <div 
                    key={idx}
                    className={`transition-colors ${
                      expandedIssue === idx ? 'bg-white/5' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Issue Header */}
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleIssue(idx)}
                    >
                      <div className="flex items-center space-x-3">
                        {getIssueTypeIcon(issue.type)}
                        <div>
                          <h3 
                            className="font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {issue.message}
                          </h3>
                          <p className="text-sm" style={{ color: colors.text.secondary }}>
                            {issue.field}
                          </p>
                        </div>
                      </div>
                      
                      <ChevronDown 
                        size={18} 
                        className={`transition-transform ${expandedIssue === idx ? 'rotate-180' : ''}`}
                        style={{ color: colors.text.secondary }}
                      />
                    </div>
                    
                    {/* Issue Details */}
                    {expandedIssue === idx && (
                      <div className="px-4 pb-4 pt-2 ml-8">
                        <p 
                          className="mb-3 text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {issue.explanation}
                        </p>
                        
                        <div 
                          className="p-3 rounded-lg mb-3"
                          style={{ backgroundColor: `${colors.primary}10` }}
                        >
                          <h4 
                            className="font-medium mb-1 text-sm"
                            style={{ color: colors.text.primary }}
                          >
                            Çözüm Önerisi:
                          </h4>
                          <p 
                            className="text-sm"
                            style={{ color: colors.text.secondary }}
                          >
                            {issue.suggestion}
                          </p>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm"
                            style={{ 
                              backgroundColor: colors.primary,
                              color: '#fff'
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              playSound('click');
                              setModalData(issue);
                              setModalOpen(true);
                            }}
                          >
                            <Maximize2 size={14} />
                            <span>Detayları Gör</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <p style={{ color: colors.text.secondary }}>
                    Seçilen filtrelere uygun sorun bulunamadı.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Improvements Tab */}
          {activeTab === 'improvements' && (
            <div className="divide-y" style={{ borderColor: colors.border }}>
              {improvements.map((improvement: any) => (
                <div 
                  key={improvement.id}
                  className={`transition-colors ${
                    expandedImprovement === improvement.id ? 'bg-white/5' : 'hover:bg-white/5'
                  }`}
                >
                  {/* Improvement Header */}
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleImprovement(improvement.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 
                          className="font-medium"
                          style={{ color: colors.text.primary }}
                        >
                          {improvement.title}
                        </h3>
                        
                        <div className="flex items-center space-x-2">
                          <div 
                            className="px-2 py-1 rounded text-xs"
                            style={{ 
                              backgroundColor: `${getDifficultyColor(improvement.difficulty)}20`,
                              color: getDifficultyColor(improvement.difficulty)
                            }}
                          >
                            {improvement.difficulty === 'low' ? 'Kolay' : 
                             improvement.difficulty === 'medium' ? 'Orta' : 'Zor'}
                          </div>
                          
                          <div 
                            className="px-2 py-1 rounded text-xs"
                            style={{ 
                              backgroundColor: `${getImpactColor(improvement.impact)}20`,
                              color: getImpactColor(improvement.impact)
                            }}
                          >
                            {improvement.impact === 'high' ? 'Yüksek Etki' : 
                             improvement.impact === 'medium' ? 'Orta Etki' : 'Düşük Etki'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <ChevronDown 
                      size={18} 
                      className={`ml-4 transition-transform ${expandedImprovement === improvement.id ? 'rotate-180' : ''}`}
                      style={{ color: colors.text.secondary }}
                    />
                  </div>
                  
                  {/* Improvement Details */}
                  {expandedImprovement === improvement.id && (
                    <div className="px-4 pb-4 pt-2">
                      <p 
                        className="mb-3 text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {improvement.description}
                      </p>
                      
                      <div className="flex justify-end">
                        <button
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm"
                          style={{ 
                            backgroundColor: `${colors.success}20`,
                            color: colors.success
                          }}
                          onClick={e => {
                            e.stopPropagation();
                            playSound('click');
                            setModalData(improvement);
                            setModalOpen(true);
                          }}
                        >
                          <ChevronRight size={14} />
                          <span>İyileştir</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="p-6">
              <div className="text-center py-12">
                <h3 className="text-xl font-bold mb-2" style={{ color: colors.text.primary }}>
                  SEO Puan Geçmişi
                </h3>
                <p style={{ color: colors.text.secondary }}>
                  Bu bölüm daha sonra eklenecektir. SEO puanınızın zaman içindeki değişimini gösterecektir.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal */}
      <DetailModal open={modalOpen} onClose={() => setModalOpen(false)} data={modalData} />
    </div>
  );
};

export default SEOScorePage;