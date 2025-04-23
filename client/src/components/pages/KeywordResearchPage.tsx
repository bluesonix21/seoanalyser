import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useGame } from '../../lib/stores/useGame';
import { useAudio } from '../../lib/stores/useAudio';

// Icons
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Download, 
  Zap, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Plus,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react';

// Mock keyword data
interface ExtendedKeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  position: number | null;
  trend: 'up' | 'down' | 'stable';
  competition: 'high' | 'medium' | 'low';
  intent: 'informational' | 'commercial' | 'navigational' | 'transactional';
  related: string[];
}

// Extended mock keyword data
const extendedKeywords: ExtendedKeywordData[] = [
  { 
    keyword: "seo tools", 
    volume: 12500, 
    difficulty: 67, 
    cpc: 3.42, 
    position: 8,
    trend: 'up',
    competition: 'high',
    intent: 'commercial',
    related: ['seo software', 'best seo tools', 'free seo tools']
  },
  { 
    keyword: "backlink analysis", 
    volume: 6300, 
    difficulty: 54, 
    cpc: 2.85, 
    position: 4,
    trend: 'stable',
    competition: 'medium',
    intent: 'informational',
    related: ['backlink checker', 'backlink tracker', 'backlink audit']
  },
  { 
    keyword: "seo dashboard", 
    volume: 4700, 
    difficulty: 42, 
    cpc: 2.31, 
    position: 2,
    trend: 'up',
    competition: 'medium',
    intent: 'commercial',
    related: ['seo reporting', 'seo analytics', 'seo metrics']
  },
  { 
    keyword: "competitor analysis", 
    volume: 9200, 
    difficulty: 61, 
    cpc: 3.17, 
    position: 12,
    trend: 'up',
    competition: 'high',
    intent: 'informational',
    related: ['competitor research', 'marketing competitor analysis', 'website competitor analysis']
  },
  { 
    keyword: "keyword research tool", 
    volume: 7800, 
    difficulty: 72, 
    cpc: 4.26, 
    position: 18,
    trend: 'down',
    competition: 'high',
    intent: 'commercial',
    related: ['keyword finder', 'keyword planner', 'keyword analyzer']
  },
  { 
    keyword: "site audit software", 
    volume: 3600, 
    difficulty: 49, 
    cpc: 2.93, 
    position: 7,
    trend: 'stable',
    competition: 'medium',
    intent: 'commercial',
    related: ['website audit tool', 'seo audit', 'technical seo audit']
  },
  { 
    keyword: "seo performance tracking", 
    volume: 2900, 
    difficulty: 37, 
    cpc: 1.98, 
    position: null,
    trend: 'up',
    competition: 'low',
    intent: 'informational',
    related: ['seo progress', 'track seo results', 'seo monitoring']
  },
  { 
    keyword: "content optimization", 
    volume: 5400, 
    difficulty: 58, 
    cpc: 3.56, 
    position: 5,
    trend: 'up',
    competition: 'medium',
    intent: 'informational',
    related: ['content seo', 'optimize content', 'content marketing']
  },
  { 
    keyword: "local seo", 
    volume: 8700, 
    difficulty: 64, 
    cpc: 3.89, 
    position: null,
    trend: 'up',
    competition: 'high',
    intent: 'informational',
    related: ['local search', 'google my business', 'local citations']
  },
  { 
    keyword: "mobile seo", 
    volume: 3200, 
    difficulty: 51, 
    cpc: 2.75, 
    position: 9,
    trend: 'stable',
    competition: 'medium',
    intent: 'informational',
    related: ['mobile optimization', 'mobile friendly', 'responsive design']
  },
  { 
    keyword: "voice search optimization", 
    volume: 1800, 
    difficulty: 45, 
    cpc: 1.92, 
    position: null,
    trend: 'up',
    competition: 'low',
    intent: 'informational',
    related: ['voice search seo', 'alexa seo', 'voice assistant optimization']
  },
  { 
    keyword: "ecommerce seo", 
    volume: 6800, 
    difficulty: 68, 
    cpc: 3.98, 
    position: 15,
    trend: 'up',
    competition: 'high',
    intent: 'commercial',
    related: ['online shop seo', 'product page optimization', 'ecommerce keywords']
  }
];

const KeywordResearchPage: React.FC = () => {
  const { colors } = useTheme();
  const { keywordData } = useGame();
  const { playSound } = useAudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [difficulty, setDifficulty] = useState<string[]>(['low', 'medium', 'high']);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isAddingKeyword, setIsAddingKeyword] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  
  // Handle filter toggle
  const toggleFilter = (filter: string) => {
    if (difficulty.includes(filter)) {
      if (difficulty.length > 1) { // Don't allow empty filter
        setDifficulty(difficulty.filter(d => d !== filter));
      }
    } else {
      setDifficulty([...difficulty, filter]);
    }
    
    playSound('click');
  };
  
  // Filter and sort keywords
  const filteredKeywords = extendedKeywords.filter(keyword => {
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      keyword.keyword.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by difficulty
    const difficultyLevel = 
      keyword.difficulty < 50 ? 'low' : 
      keyword.difficulty < 70 ? 'medium' : 'high';
    
    const matchesDifficulty = difficulty.includes(difficultyLevel);
    
    return matchesSearch && matchesDifficulty;
  }).sort((a, b) => {
    // Sort by selected criteria
    switch (sortBy) {
      case 'volume':
        return b.volume - a.volume;
      case 'difficulty':
        return a.difficulty - b.difficulty;
      case 'cpc':
        return b.cpc - a.cpc;
      case 'position':
        // Sort null positions last
        if (a.position === null && b.position === null) return 0;
        if (a.position === null) return 1;
        if (b.position === null) return -1;
        return a.position - b.position;
      default: // relevance
        return 0;
    }
  });
  
  // Get difficulty color
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 50) return colors.success;
    if (difficulty < 70) return colors.warning;
    return colors.error;
  };
  
  // Get difficulty text
  const getDifficultyText = (difficulty: number) => {
    if (difficulty < 50) return 'Düşük';
    if (difficulty < 70) return 'Orta';
    return 'Yüksek';
  };
  
  // Get competition color
  const getCompetitionColor = (competition: string) => {
    switch (competition) {
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
  
  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUp size={16} style={{ color: colors.success }} />;
      case 'down':
        return <ArrowDown size={16} style={{ color: colors.error }} />;
      default:
        return <ArrowRight size={16} style={{ color: colors.text.secondary }} />;
    }
  };
  
  // Get intent color
  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'commercial':
        return colors.success;
      case 'transactional':
        return colors.primary;
      case 'informational':
        return colors.info;
      case 'navigational':
        return colors.secondary;
      default:
        return colors.text.secondary;
    }
  };
  
  // Handle sort change
  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    playSound('click');
  };
  
  // Handle keyword selection
  const handleKeywordSelect = (keyword: string) => {
    setSelectedKeyword(keyword === selectedKeyword ? null : keyword);
    playSound('click');
  };
  
  // Toggle add keyword form
  const toggleAddKeyword = () => {
    setIsAddingKeyword(!isAddingKeyword);
    playSound('click');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            Anahtar Kelime Araştırması
          </h1>
          <p style={{ color: colors.text.secondary }}>
            Niş için yüksek performanslı anahtar kelimeler bulun ve optimize edin
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
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
            <span>Yenile</span>
          </button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className="p-4 rounded-lg flex items-center space-x-4"
          style={{ backgroundColor: colors.background.card }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
          >
            <Search size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>Toplam Anahtar Kelime</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{extendedKeywords.length}</h3>
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg flex items-center space-x-4"
          style={{ backgroundColor: colors.background.card }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.success}20`, color: colors.success }}
          >
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>İlk 10'daki Kelimeler</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              {extendedKeywords.filter(k => k.position !== null && k.position <= 10).length}
            </h3>
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg flex items-center space-x-4"
          style={{ backgroundColor: colors.background.card }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.warning}20`, color: colors.warning }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>Potansiyel Kelimeler</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              {extendedKeywords.filter(k => k.position === null).length}
            </h3>
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg flex items-center space-x-4"
          style={{ backgroundColor: colors.background.card }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.error}20`, color: colors.error }}
          >
            <XCircle size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>İyileştirme Gerektiren</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              {extendedKeywords.filter(k => k.position !== null && k.position > 10).length}
            </h3>
          </div>
        </div>
      </div>
      
      {/* Keyword Search and Filters */}
      <div 
        className="rounded-lg border overflow-hidden"
        style={{ 
          backgroundColor: colors.background.card,
          borderColor: colors.border
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Anahtar kelime ara..."
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
            
            {/* Filters */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <button
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg border"
                  style={{ borderColor: colors.border, color: colors.text.secondary }}
                  onClick={() => {
                    setIsFiltering(!isFiltering);
                    playSound('click');
                  }}
                >
                  <Filter size={18} />
                  <span>Zorluk</span>
                  <ChevronDown size={18} className={`transition-transform ${isFiltering ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Filter Dropdown */}
                {isFiltering && (
                  <div 
                    className="absolute top-full left-0 mt-2 p-3 rounded-lg border shadow-lg z-10"
                    style={{ 
                      backgroundColor: colors.background.card,
                      borderColor: colors.border
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={difficulty.includes('low')}
                          onChange={() => toggleFilter('low')}
                          className="sr-only"
                        />
                        <div 
                          className={`w-5 h-5 rounded flex items-center justify-center ${
                            difficulty.includes('low') ? '' : 'border'
                          }`}
                          style={{ 
                            backgroundColor: difficulty.includes('low') ? colors.success : 'transparent',
                            borderColor: difficulty.includes('low') ? 'transparent' : colors.border
                          }}
                        >
                          {difficulty.includes('low') && (
                            <CheckCircle size={12} color="#fff" />
                          )}
                        </div>
                        <span style={{ color: colors.text.primary }}>Düşük Zorluk</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={difficulty.includes('medium')}
                          onChange={() => toggleFilter('medium')}
                          className="sr-only"
                        />
                        <div 
                          className={`w-5 h-5 rounded flex items-center justify-center ${
                            difficulty.includes('medium') ? '' : 'border'
                          }`}
                          style={{ 
                            backgroundColor: difficulty.includes('medium') ? colors.warning : 'transparent',
                            borderColor: difficulty.includes('medium') ? 'transparent' : colors.border
                          }}
                        >
                          {difficulty.includes('medium') && (
                            <CheckCircle size={12} color="#fff" />
                          )}
                        </div>
                        <span style={{ color: colors.text.primary }}>Orta Zorluk</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={difficulty.includes('high')}
                          onChange={() => toggleFilter('high')}
                          className="sr-only"
                        />
                        <div 
                          className={`w-5 h-5 rounded flex items-center justify-center ${
                            difficulty.includes('high') ? '' : 'border'
                          }`}
                          style={{ 
                            backgroundColor: difficulty.includes('high') ? colors.error : 'transparent',
                            borderColor: difficulty.includes('high') ? 'transparent' : colors.border
                          }}
                        >
                          {difficulty.includes('high') && (
                            <CheckCircle size={12} color="#fff" />
                          )}
                        </div>
                        <span style={{ color: colors.text.primary }}>Yüksek Zorluk</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
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
                  <option value="relevance" style={{ backgroundColor: colors.background.main }}>İlgi</option>
                  <option value="volume" style={{ backgroundColor: colors.background.main }}>Hacim</option>
                  <option value="difficulty" style={{ backgroundColor: colors.background.main }}>Zorluk</option>
                  <option value="cpc" style={{ backgroundColor: colors.background.main }}>CPC</option>
                  <option value="position" style={{ backgroundColor: colors.background.main }}>Pozisyon</option>
                </select>
              </div>
              
              {/* Add Keyword Button */}
              <button
                className="flex items-center space-x-2 px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: colors.primary,
                  color: '#fff'
                }}
                onClick={toggleAddKeyword}
              >
                <Plus size={18} />
                <span>Ekle</span>
              </button>
            </div>
          </div>
          
          {/* Add Keyword Form */}
          {isAddingKeyword && (
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: colors.background.main }}>
              <h3 
                className="text-sm font-medium mb-3"
                style={{ color: colors.text.primary }}
              >
                Yeni Anahtar Kelime Ekle
              </h3>
              <div className="flex items-center mb-3">
                <input
                  type="text"
                  placeholder="Yeni anahtar kelime (örn. seo optimization)"
                  className="flex-1 py-2 px-3 rounded-lg bg-transparent border mr-2"
                  style={{ 
                    borderColor: colors.border, 
                    color: colors.text.primary
                  }}
                />
                <button
                  className="px-3 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: colors.primary,
                    color: '#fff'
                  }}
                  onClick={() => {
                    setIsAddingKeyword(false);
                    playSound('click');
                  }}
                >
                  Analiz Et
                </button>
              </div>
              <p 
                className="text-xs"
                style={{ color: colors.text.secondary }}
              >
                Anahtar kelimeyi ekledikten sonra, hacim, zorluk ve rekabet verileri otomatik olarak analiz edilecektir.
              </p>
            </div>
          )}
        </div>
        
        {/* Keywords Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: colors.border }}>
                <th className="p-3 text-left" style={{ color: colors.text.secondary }}>Anahtar Kelime</th>
                <th className="p-3 text-left" style={{ color: colors.text.secondary }}>Hacim</th>
                <th className="p-3 text-left" style={{ color: colors.text.secondary }}>Zorluk</th>
                <th className="p-3 text-left" style={{ color: colors.text.secondary }}>CPC (₺)</th>
                <th className="p-3 text-left" style={{ color: colors.text.secondary }}>Pozisyon</th>
                <th className="p-3 text-left" style={{ color: colors.text.secondary }}>Trend</th>
                <th className="p-3 text-left" style={{ color: colors.text.secondary }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeywords.map((keyword) => (
                <React.Fragment key={keyword.keyword}>
                  <tr 
                    className={`border-b hover:bg-white/5 cursor-pointer transition-colors ${
                      selectedKeyword === keyword.keyword ? 'bg-white/5' : ''
                    }`}
                    style={{ borderColor: colors.border }}
                    onClick={() => handleKeywordSelect(keyword.keyword)}
                  >
                    <td className="p-3 font-medium" style={{ color: colors.text.primary }}>
                      {keyword.keyword}
                    </td>
                    <td className="p-3" style={{ color: colors.text.primary }}>
                      {keyword.volume.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div 
                        className="px-2 py-1 rounded-full text-xs inline-flex items-center"
                        style={{ 
                          backgroundColor: `${getDifficultyColor(keyword.difficulty)}20`,
                          color: getDifficultyColor(keyword.difficulty)
                        }}
                      >
                        {keyword.difficulty}/100 ({getDifficultyText(keyword.difficulty)})
                      </div>
                    </td>
                    <td className="p-3" style={{ color: colors.text.primary }}>
                      {keyword.cpc.toFixed(2)}
                    </td>
                    <td className="p-3" style={{ color: colors.text.primary }}>
                      {keyword.position !== null ? (
                        <span 
                          className={`px-2 py-1 rounded-full text-xs ${
                            keyword.position <= 3 ? 'bg-green-900/20 text-green-500' :
                            keyword.position <= 10 ? 'bg-blue-900/20 text-blue-500' :
                            'bg-red-900/20 text-red-500'
                          }`}
                        >
                          #{keyword.position}
                        </span>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        {getTrendIcon(keyword.trend)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-1">
                        <button 
                          className="p-1.5 rounded hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound('click');
                          }}
                        >
                          <Zap size={18} style={{ color: colors.primary }} />
                        </button>
                        <button 
                          className="p-1.5 rounded hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound('click');
                          }}
                        >
                          <MoreHorizontal size={18} style={{ color: colors.text.secondary }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Detail Row */}
                  {selectedKeyword === keyword.keyword && (
                    <tr style={{ backgroundColor: colors.background.main }}>
                      <td colSpan={7} className="p-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div 
                              className="p-3 rounded-lg"
                              style={{ backgroundColor: colors.background.card }}
                            >
                              <h4 
                                className="text-sm font-medium mb-2"
                                style={{ color: colors.text.secondary }}
                              >
                                Rekabet
                              </h4>
                              <div 
                                className="text-sm font-medium inline-block px-2 py-1 rounded"
                                style={{ 
                                  backgroundColor: `${getCompetitionColor(keyword.competition)}20`,
                                  color: getCompetitionColor(keyword.competition)
                                }}
                              >
                                {keyword.competition === 'low' ? 'Düşük' : 
                                  keyword.competition === 'medium' ? 'Orta' : 'Yüksek'}
                              </div>
                            </div>
                            
                            <div 
                              className="p-3 rounded-lg"
                              style={{ backgroundColor: colors.background.card }}
                            >
                              <h4 
                                className="text-sm font-medium mb-2"
                                style={{ color: colors.text.secondary }}
                              >
                                Arama Niyeti
                              </h4>
                              <div 
                                className="text-sm font-medium inline-block px-2 py-1 rounded"
                                style={{ 
                                  backgroundColor: `${getIntentColor(keyword.intent)}20`,
                                  color: getIntentColor(keyword.intent)
                                }}
                              >
                                {keyword.intent === 'commercial' ? 'Ticari' : 
                                  keyword.intent === 'informational' ? 'Bilgi Arama' : 
                                  keyword.intent === 'navigational' ? 'Yönlendirme' : 'İşlem'}
                              </div>
                            </div>
                            
                            <div 
                              className="p-3 rounded-lg"
                              style={{ backgroundColor: colors.background.card }}
                            >
                              <h4 
                                className="text-sm font-medium mb-2"
                                style={{ color: colors.text.secondary }}
                              >
                                Tahmini Tıklamalar/Ay
                              </h4>
                              <div 
                                className="text-lg font-medium"
                                style={{ color: colors.text.primary }}
                              >
                                {keyword.position ? 
                                  Math.round(keyword.volume * (keyword.position <= 3 ? 0.3 : 
                                    keyword.position <= 5 ? 0.15 : 
                                    keyword.position <= 10 ? 0.05 : 0.01)).toLocaleString() : 
                                  "0"}
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 
                              className="text-sm font-medium mb-2"
                              style={{ color: colors.text.secondary }}
                            >
                              İlgili Anahtar Kelimeler
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {keyword.related.map((relatedKeyword, index) => (
                                <div 
                                  key={index} 
                                  className="px-3 py-1.5 rounded-full text-sm border"
                                  style={{ 
                                    borderColor: colors.border,
                                    color: colors.text.primary
                                  }}
                                >
                                  {relatedKeyword}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex justify-end space-x-2">
                            <button
                              className="px-3 py-2 rounded-lg flex items-center text-sm"
                              style={{ 
                                backgroundColor: `${colors.secondary}20`,
                                color: colors.secondary
                              }}
                              onClick={() => playSound('click')}
                            >
                              <ExternalLink size={16} className="mr-1.5" />
                              <span>Arama Sonuçlarında Gör</span>
                            </button>
                            
                            <button
                              className="px-3 py-2 rounded-lg flex items-center text-sm"
                              style={{ 
                                backgroundColor: `${colors.primary}20`,
                                color: colors.primary
                              }}
                              onClick={() => playSound('click')}
                            >
                              <TrendingUp size={16} className="mr-1.5" />
                              <span>Detaylı Analiz</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              
              {filteredKeywords.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center" style={{ color: colors.text.secondary }}>
                    {searchQuery || difficulty.length < 3 ? 
                      'Arama kriterlerinize uygun anahtar kelime bulunamadı.' : 
                      'Henüz anahtar kelime eklenmemiş.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default KeywordResearchPage;