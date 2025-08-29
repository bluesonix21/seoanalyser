import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useGame } from '../../lib/stores/useGame';
import { useAudio } from '../../lib/stores/useAudio';

// Icons
import { 
  Search, 
  FileText, 
  BarChart2, 
  Edit, 
  ExternalLink, 
  Trash2, 
  Eye, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  PenTool, 
  CheckSquare, 
  AlertTriangle,
  RefreshCw,
  Download,
  Sparkles,
  Lightbulb,
  Share2,
  Plus
} from 'lucide-react';

// Content item interface
interface ContentItem {
  id: string;
  url: string;
  title: string;
  length: number;
  score: number;
  readability: number;
  lastUpdated: string;
  published: string;
  keywords: string[];
  issues: {
    type: 'critical' | 'warning' | 'suggestion';
    message: string;
    suggestion: string;
    impact?: string;
  }[];
  recommendations: string[];
}

const ContentAnalysisPage: React.FC = () => {
  const { colors } = useTheme();
  const { contentData, loadingState, error } = useGame();
  const { playSound } = useAudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isAddingContent, setIsAddingContent] = useState(false);
  
  // Filter content items based on search query
  const filteredItems = contentData.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.url.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.score - a.score;
      case 'length':
        return b.length - a.length;
      case 'readability':
        return b.readability - a.readability;
      default:
        return 0;
    }
  });
  
  // Get average content score
  const avgScore = contentData.length > 0 ? contentData.reduce((sum, item) => sum + item.score, 0) / contentData.length : 0;
  
  // Get average readability score
  const avgReadability = contentData.length > 0 ? contentData.reduce((sum, item) => sum + item.readability, 0) / contentData.length : 0;
  
  // Get total content count
  const totalContent = contentData.length;
  
  // Get total word count
  const totalWords = contentData.reduce((sum, item) => sum + item.length, 0);
  
  // Toggle expanded item
  const toggleExpand = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
    playSound('click');
  };
  
  // Handle sort change
  const handleSortChange = (criteria: string) => {
    setSortBy(criteria);
    playSound('click');
  };
  
  // Toggle add content form
  const toggleAddContent = () => {
    setIsAddingContent(!isAddingContent);
    playSound('click');
  };
  
  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return colors.success;
    if (score >= 70) return colors.primary;
    if (score >= 50) return colors.warning;
    return colors.error;
  };
  
  // Get readability color
  const getReadabilityColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.primary;
    if (score >= 40) return colors.warning;
    return colors.error;
  };
  
  // Get issue type icon
  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle size={16} style={{ color: colors.error }} />;
      case 'warning':
        return <AlertTriangle size={16} style={{ color: colors.warning }} />;
      case 'suggestion':
        return <Lightbulb size={16} style={{ color: colors.info }} />;
      default:
        return <AlertTriangle size={16} style={{ color: colors.warning }} />;
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
            İçerik Analizi
          </h1>
          <p style={{ color: colors.text.secondary }}>
            SEO fırsatları için içeriğinizi analiz edin ve optimize edin
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
      
      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* SEO Score Stat */}
        <motion.div 
          className="p-4 rounded-xl flex items-center space-x-4 shadow-lg bg-gradient-to-br from-[${colors.primary}] to-[${colors.secondary}] relative overflow-hidden"
          whileHover={{ scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 border-2 border-white/20"
            style={{ color: colors.primary }}
          >
            <BarChart2 size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">Ort. SEO Puanı</p>
            <h3 className="text-3xl font-extrabold text-white drop-shadow">{Math.round(avgScore)}/100</h3>
          </div>
          {avgScore >= 90 && (
            <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full shadow">Mükemmel</span>
          )}
        </motion.div>
        {/* Readability Stat */}
        <motion.div 
          className="p-4 rounded-xl flex items-center space-x-4 shadow-lg bg-gradient-to-br from-[${colors.accent}] to-[${colors.primary}] relative overflow-hidden"
          whileHover={{ scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 border-2 border-white/20"
            style={{ color: colors.accent }}
          >
            <PenTool size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">Ort. Okunabilirlik</p>
            <h3 className="text-3xl font-extrabold text-white drop-shadow">{Math.round(avgReadability)}/100</h3>
          </div>
          {avgReadability >= 80 && (
            <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full shadow">Çok İyi</span>
          )}
        </motion.div>
        {/* Content Count Stat */}
        <motion.div 
          className="p-4 rounded-xl flex items-center space-x-4 shadow-lg bg-gradient-to-br from-[${colors.secondary}] to-[${colors.success}] relative overflow-hidden"
          whileHover={{ scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 border-2 border-white/20"
            style={{ color: colors.secondary }}
          >
            <FileText size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">İçerik Sayısı</p>
            <h3 className="text-3xl font-extrabold text-white drop-shadow">{totalContent}</h3>
          </div>
        </motion.div>
        {/* Total Words Stat */}
        <motion.div 
          className="p-4 rounded-xl flex items-center space-x-4 shadow-lg bg-gradient-to-br from-[${colors.success}] to-[${colors.accent}] relative overflow-hidden"
          whileHover={{ scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 border-2 border-white/20"
            style={{ color: colors.success }}
          >
            <Clock size={28} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80">Toplam Kelime</p>
            <h3 className="text-3xl font-extrabold text-white drop-shadow">{totalWords.toLocaleString()}</h3>
          </div>
        </motion.div>
      </div>
      
      {/* Content List */}
      <div 
        className="rounded-2xl border overflow-hidden mt-8"
        style={{ 
          backgroundColor: colors.background.card,
          borderColor: colors.border
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="İçerik ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 pl-10 pr-4 rounded-lg bg-transparent border focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  borderColor: colors.border, 
                  color: colors.text.primary,
                }}
              />
              <Search 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" 
                style={{ color: colors.text.secondary }} 
              />
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Sorting */}
              <div className="flex items-center space-x-2">
                <span className="text-sm" style={{ color: colors.text.secondary }}>Sırala:</span>
                <select
                  className="bg-transparent border rounded-lg px-2 py-2 text-sm focus:outline-none"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.text.primary 
                  }}
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="score" style={{ backgroundColor: colors.background.main }}>SEO Puanı</option>
                  <option value="readability" style={{ backgroundColor: colors.background.main }}>Okunabilirlik</option>
                  <option value="length" style={{ backgroundColor: colors.background.main }}>İçerik Uzunluğu</option>
                </select>
              </div>
              
              {/* Add Content Button */}
              <button
                className="flex items-center space-x-2 px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: colors.primary,
                  color: '#fff'
                }}
                onClick={toggleAddContent}
              >
                <Plus size={18} />
                <span>{isAddingContent ? 'İptal' : 'İçerik Ekle'}</span>
              </button>
            </div>
          </div>
          
          {/* Add Content Form */}
          {isAddingContent && (
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: colors.background.main }}>
              <h3 
                className="text-sm font-medium mb-3"
                style={{ color: colors.text.primary }}
              >
                Yeni İçerik Analizi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="URL (örn. https://example.com/blog/post)"
                  className="w-full py-2 px-3 rounded-lg bg-transparent border"
                  style={{ 
                    borderColor: colors.border, 
                    color: colors.text.primary
                  }}
                />
                <input
                  type="text"
                  placeholder="İçerik başlığı (opsiyonel)"
                  className="w-full py-2 px-3 rounded-lg bg-transparent border"
                  style={{ 
                    borderColor: colors.border, 
                    color: colors.text.primary
                  }}
                />
              </div>
              <div className="flex justify-end">
                <button
                  className="px-4 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: colors.primary,
                    color: '#fff'
                  }}
                  onClick={() => {
                    setIsAddingContent(false);
                    playSound('click');
                  }}
                >
                  Analiz Et
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Content Items */}
        <div>
          {filteredItems.length > 0 ? (
            <div className="divide-y" style={{ borderColor: colors.border }}>
              {filteredItems.map((item) => (
                <motion.div 
                  key={item.url} 
                  style={{ borderColor: colors.border }}
                  className="transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] bg-gradient-to-br from-white/5 to-white/0 rounded-xl my-2"
                  whileHover={{ scale: 1.01 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  {/* Content Header */}
                  <div 
                    className={`p-4 flex items-start justify-between cursor-pointer transition-colors`}
                    onClick={() => toggleExpand(item.url)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h3 
                          className="font-medium mr-3 text-lg"
                          style={{ color: colors.text.primary }}
                        >
                          {item.title}
                        </h3>
                        {item.score >= 90 && (
                          <div 
                            className="px-2 py-0.5 rounded text-xs flex items-center bg-green-500/20 text-green-600 font-semibold ml-2"
                          >
                            <Sparkles size={12} className="mr-1" />
                            <span>Mükemmel</span>
                          </div>
                        )}
                        {item.score < 70 && (
                          <div className="px-2 py-0.5 rounded text-xs flex items-center bg-yellow-400/20 text-yellow-700 font-semibold ml-2">
                            <AlertTriangle size={12} className="mr-1" />
                            <span>Geliştirilmeli</span>
                          </div>
                        )}
                      </div>
                      <p 
                        className="text-sm mb-2"
                        style={{ color: colors.text.secondary }}
                      >
                        {item.url}
                      </p>
                      <div className="flex items-center space-x-4 mb-2">
                        <div 
                          className="flex items-center"
                          style={{ color: colors.text.secondary }}
                        >
                          <BarChart2 size={14} className="mr-1" />
                          <span className="text-sm">SEO: </span>
                          <span 
                            className="text-sm font-medium"
                            style={{ color: getScoreColor(item.score) }}
                          >
                            {item.score}/100
                          </span>
                        </div>
                        <div 
                          className="flex items-center"
                          style={{ color: colors.text.secondary }}
                        >
                          <PenTool size={14} className="mr-1" />
                          <span className="text-sm">Okunabilirlik: </span>
                          <span 
                            className="text-sm font-medium"
                            style={{ color: getReadabilityColor(item.readability) }}
                          >
                            {item.readability}/100
                          </span>
                        </div>
                        <div 
                          className="flex items-center"
                          style={{ color: colors.text.secondary }}
                        >
                          <FileText size={14} className="mr-1" />
                          <span className="text-sm">{item.length} kelime</span>
                        </div>
                      </div>
                      {/* Kısa analiz cümlesi */}
                      <div className="text-xs italic text-gray-400 mb-1">
                        {item.score >= 90
                          ? 'Bu içerik SEO açısından mükemmel durumda.'
                          : item.score >= 70
                            ? 'İçeriğiniz iyi, ancak daha yüksek skor için optimizasyon yapılabilir.'
                            : 'SEO skorunuz düşük, başlık, anahtar kelime ve içerik yapısını gözden geçirin.'}
                      </div>
                    </div>
                    <div className="flex ml-4">
                      <div className="flex space-x-1 mr-3">
                        <button 
                          className="p-2 rounded hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound('click');
                          }}
                        >
                          <Edit size={18} style={{ color: colors.primary }} />
                        </button>
                        <button 
                          className="p-2 rounded hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://example.com${item.url}`, '_blank');
                            playSound('click');
                          }}
                        >
                          <ExternalLink size={18} style={{ color: colors.secondary }} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Expanded Content Details */}
                  {expandedItem === item.url && (
                    <motion.div 
                      className="p-4 bg-white/10 rounded-b-xl"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 
                            className="text-sm font-medium mb-3 flex items-center"
                            style={{ color: colors.text.primary }}
                          >
                            İçerik Bilgileri
                          </h4>
                          <ul className="text-sm" style={{ color: colors.text.secondary }}>
                            <li>Başlık: {item.title}</li>
                            <li>URL: {item.url}</li>
                            <li>Uzunluk: {item.length} kelime</li>
                            <li>SEO Skoru: {item.score}/100</li>
                            <li>Okunabilirlik: {item.readability}/100</li>
                          </ul>
                        </div>
                        {/* Sorunlar ve öneriler */}
                        <div className="md:col-span-2">
                          <h4 className="text-sm font-medium mb-3 flex items-center" style={{ color: colors.text.primary }}>
                            <AlertTriangle size={16} className="mr-2" style={{ color: colors.warning }} />
                            Sorunlar &amp; Öneriler
                          </h4>
                          {item.issues && item.issues.length > 0 ? (
                            <ul className="space-y-3">
                              {item.issues.map((issue, idx) => (
                                <li key={idx} className="p-3 rounded-lg border bg-white/5" style={{ borderColor: colors.border }}>
                                  <div className="flex items-center mb-1">
                                    {getIssueIcon(issue.type)}
                                    <span className="ml-2 font-semibold" style={{ color: colors.text.primary }}>
                                      {issue.type === 'warning' ? 'Uyarı' : issue.type === 'critical' ? 'Kritik' : 'Bilgi'}
                                    </span>
                                  </div>
                                  <div className="text-sm mb-1" style={{ color: colors.text.secondary }}>
                                    {issue.message}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    <span className="font-medium">Öneri:</span> {issue.suggestion}
                                    {issue.impact && (
                                      <span className="ml-2">(Etki: {issue.impact})</span>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-xs text-gray-400">Herhangi bir sorun veya öneri bulunamadı.</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <FileText size={48} style={{ color: colors.text.secondary, opacity: 0.3 }} className="mx-auto mb-4" />
              <h3 
                className="text-lg font-medium mb-2"
                style={{ color: colors.text.primary }}
              >
                İçerik Bulunamadı
              </h3>
              <p style={{ color: colors.text.secondary }}>
                {searchQuery ? 
                  'Arama kriterlerinize uygun içerik bulunamadı.' : 
                  'Henüz içerik analizi yapılmamış. Yukarıdaki "İçerik Ekle" butonunu kullanarak yeni bir içerik analiz edebilirsiniz.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentAnalysisPage;