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
  }[];
  recommendations: string[];
}

// Mock content data
const contentItems: ContentItem[] = [
  {
    id: '1',
    url: '/blog/seo-tips-2023',
    title: 'Top SEO Tips for 2023',
    length: 2456,
    score: 92,
    readability: 78,
    lastUpdated: '2023-04-12',
    published: '2023-01-15',
    keywords: ['seo tips', 'seo strategy', 'seo 2023', 'search engine optimization'],
    issues: [
      { type: 'warning', message: 'Add more internal links to improve link structure' },
      { type: 'suggestion', message: 'Consider adding more examples to increase reader engagement' }
    ],
    recommendations: [
      'Add 2-3 more internal links to relevant content',
      'Update the statistics in the third paragraph',
      'Consider adding a FAQ section at the end'
    ]
  },
  {
    id: '2',
    url: '/blog/backlink-strategies',
    title: 'Effective Backlink Strategies',
    length: 3124,
    score: 85,
    readability: 82,
    lastUpdated: '2023-03-28',
    published: '2023-02-10',
    keywords: ['backlink strategies', 'link building', 'quality backlinks', 'seo backlinks'],
    issues: [
      { type: 'critical', message: 'Missing meta description, add one to improve SERP appearance' },
      { type: 'warning', message: 'Content is slightly keyword stuffed, consider revising' },
      { type: 'suggestion', message: 'Add more visuals to break up text' }
    ],
    recommendations: [
      'Add a compelling meta description of 150-160 characters',
      'Reduce keyword density from 3.8% to around 2%',
      'Add at least 2 more relevant images or infographics'
    ]
  },
  {
    id: '3',
    url: '/blog/keyword-research',
    title: 'Advanced Keyword Research',
    length: 1876,
    score: 79,
    readability: 75,
    lastUpdated: '2023-05-02',
    published: '2023-01-28',
    keywords: ['keyword research', 'seo keywords', 'keyword analysis', 'long tail keywords'],
    issues: [
      { type: 'warning', message: 'Content is shorter than competitors (avg. 2500 words)' },
      { type: 'warning', message: 'Readability could be improved, too many complex sentences' },
      { type: 'suggestion', message: 'Add more recent keyword research tools' }
    ],
    recommendations: [
      'Expand content by at least 500 words with valuable information',
      'Simplify sentences in the methodology section',
      'Update with 2-3 new keyword research tools for 2023'
    ]
  },
  {
    id: '4',
    url: '/blog/mobile-optimization',
    title: 'Mobile SEO Optimization',
    length: 2234,
    score: 88,
    readability: 80,
    lastUpdated: '2023-04-19',
    published: '2023-03-05',
    keywords: ['mobile seo', 'mobile optimization', 'mobile-friendly', 'responsive design'],
    issues: [
      { type: 'suggestion', message: 'Add more case studies to strengthen your arguments' }
    ],
    recommendations: [
      'Add at least one case study showing mobile optimization success',
      'Update the section on mobile page speed with latest benchmarks',
      'Add a section on mobile-first indexing best practices'
    ]
  },
  {
    id: '5',
    url: '/case-studies/ecommerce-seo',
    title: 'E-commerce SEO Case Study',
    length: 3456,
    score: 94,
    readability: 76,
    lastUpdated: '2023-05-10',
    published: '2023-02-22',
    keywords: ['ecommerce seo', 'online store optimization', 'ecommerce case study', 'product page seo'],
    issues: [
      { type: 'suggestion', message: 'Add more specific metrics to strengthen the case study' }
    ],
    recommendations: [
      'Include specific conversion rate improvement data',
      'Add more technical details on the implementation',
      'Consider adding a section on lessons learned'
    ]
  }
];

const ContentAnalysisPage: React.FC = () => {
  const { colors } = useTheme();
  const { contentData } = useGame();
  const { playSound } = useAudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isAddingContent, setIsAddingContent] = useState(false);
  
  // Filter content items based on search query
  const filteredItems = contentItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
  ).sort((a, b) => {
    // Sort based on selected criteria
    switch (sortBy) {
      case 'score':
        return b.score - a.score;
      case 'length':
        return b.length - a.length;
      case 'readability':
        return b.readability - a.readability;
      case 'date':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      default:
        return 0;
    }
  });
  
  // Get average content score
  const avgScore = contentItems.reduce((sum, item) => sum + item.score, 0) / contentItems.length;
  
  // Get average readability score
  const avgReadability = contentItems.reduce((sum, item) => sum + item.readability, 0) / contentItems.length;
  
  // Get total content count
  const totalContent = contentItems.length;
  
  // Get total word count
  const totalWords = contentItems.reduce((sum, item) => sum + item.length, 0);
  
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
        <div 
          className="p-4 rounded-lg flex items-center space-x-4"
          style={{ backgroundColor: colors.background.card }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
          >
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>İçerik Sayısı</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{totalContent}</h3>
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg flex items-center space-x-4"
          style={{ backgroundColor: colors.background.card }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.secondary}20`, color: colors.secondary }}
          >
            <BarChart2 size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>Ort. SEO Puanı</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{Math.round(avgScore)}/100</h3>
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg flex items-center space-x-4"
          style={{ backgroundColor: colors.background.card }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
          >
            <PenTool size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>Ort. Okunabilirlik</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{Math.round(avgReadability)}/100</h3>
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
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>Toplam Kelime</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{totalWords.toLocaleString()}</h3>
          </div>
        </div>
      </div>
      
      {/* Content List */}
      <div 
        className="rounded-lg border overflow-hidden"
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
                  <option value="date" style={{ backgroundColor: colors.background.main }}>Son Güncelleme</option>
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
                <div key={item.id} style={{ borderColor: colors.border }}>
                  {/* Content Header */}
                  <div 
                    className={`p-4 flex items-start justify-between cursor-pointer transition-colors ${
                      expandedItem === item.id ? 'bg-white/5' : 'hover:bg-white/5'
                    }`}
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <h3 
                          className="font-medium mr-3"
                          style={{ color: colors.text.primary }}
                        >
                          {item.title}
                        </h3>
                        {item.score >= 90 && (
                          <div 
                            className="px-2 py-0.5 rounded text-xs flex items-center"
                            style={{ 
                              backgroundColor: `${colors.success}20`,
                              color: colors.success
                            }}
                          >
                            <Sparkles size={12} className="mr-1" />
                            <span>Mükemmel</span>
                          </div>
                        )}
                      </div>
                      <p 
                        className="text-sm mb-2"
                        style={{ color: colors.text.secondary }}
                      >
                        {item.url}
                      </p>
                      <div className="flex items-center space-x-4">
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
                        <div 
                          className="flex items-center"
                          style={{ color: colors.text.secondary }}
                        >
                          <Clock size={14} className="mr-1" />
                          <span className="text-sm">
                            Son Güncelleme: {new Date(item.lastUpdated).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
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
                      
                      {expandedItem === item.id ? (
                        <ChevronDown size={18} style={{ color: colors.text.secondary }} />
                      ) : (
                        <ChevronRight size={18} style={{ color: colors.text.secondary }} />
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Content Details */}
                  {expandedItem === item.id && (
                    <div className="p-4 bg-white/5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Content Issues */}
                        <div>
                          <h4 
                            className="text-sm font-medium mb-3 flex items-center"
                            style={{ color: colors.text.primary }}
                          >
                            <AlertTriangle size={16} className="mr-2" />
                            Sorunlar ve İyileştirmeler ({item.issues.length})
                          </h4>
                          
                          {item.issues.length > 0 ? (
                            <div className="space-y-2">
                              {item.issues.map((issue, index) => (
                                <div 
                                  key={index}
                                  className="p-3 rounded-lg border"
                                  style={{ 
                                    backgroundColor: colors.background.main,
                                    borderColor: colors.border
                                  }}
                                >
                                  <div className="flex items-start">
                                    <div className="mr-2 mt-0.5">
                                      {getIssueIcon(issue.type)}
                                    </div>
                                    <div>
                                      <p 
                                        className="text-sm"
                                        style={{ color: colors.text.primary }}
                                      >
                                        {issue.message}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div 
                              className="p-3 rounded-lg border"
                              style={{ 
                                backgroundColor: colors.background.main,
                                borderColor: colors.border
                              }}
                            >
                              <p 
                                className="text-sm text-center"
                                style={{ color: colors.text.secondary }}
                              >
                                Hiçbir sorun bulunamadı
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Recommendations */}
                        <div>
                          <h4 
                            className="text-sm font-medium mb-3 flex items-center"
                            style={{ color: colors.text.primary }}
                          >
                            <Lightbulb size={16} className="mr-2" />
                            İyileştirme Önerileri ({item.recommendations.length})
                          </h4>
                          
                          {item.recommendations.length > 0 ? (
                            <div className="space-y-2">
                              {item.recommendations.map((recommendation, index) => (
                                <div 
                                  key={index}
                                  className="p-3 rounded-lg border"
                                  style={{ 
                                    backgroundColor: colors.background.main,
                                    borderColor: colors.border
                                  }}
                                >
                                  <div className="flex items-start">
                                    <div 
                                      className="mr-2 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                                      style={{ 
                                        backgroundColor: `${colors.primary}20`,
                                        color: colors.primary
                                      }}
                                    >
                                      {index + 1}
                                    </div>
                                    <div>
                                      <p 
                                        className="text-sm"
                                        style={{ color: colors.text.primary }}
                                      >
                                        {recommendation}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div 
                              className="p-3 rounded-lg border"
                              style={{ 
                                backgroundColor: colors.background.main,
                                borderColor: colors.border
                              }}
                            >
                              <p 
                                className="text-sm text-center"
                                style={{ color: colors.text.secondary }}
                              >
                                İyileştirme önerisi yok
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Keywords and Metadata */}
                        <div>
                          <h4 
                            className="text-sm font-medium mb-3 flex items-center"
                            style={{ color: colors.text.primary }}
                          >
                            <Search size={16} className="mr-2" />
                            Anahtar Kelimeler ve Meta Bilgiler
                          </h4>
                          
                          <div 
                            className="p-3 rounded-lg border mb-3"
                            style={{ 
                              backgroundColor: colors.background.main,
                              borderColor: colors.border
                            }}
                          >
                            <h5 
                              className="text-xs mb-2"
                              style={{ color: colors.text.secondary }}
                            >
                              Anahtar Kelimeler
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {item.keywords.map((keyword, index) => (
                                <div 
                                  key={index}
                                  className="px-2 py-1 rounded-full text-xs border"
                                  style={{ 
                                    borderColor: colors.border,
                                    color: colors.text.primary
                                  }}
                                >
                                  {keyword}
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div 
                            className="p-3 rounded-lg border"
                            style={{ 
                              backgroundColor: colors.background.main,
                              borderColor: colors.border
                            }}
                          >
                            <h5 
                              className="text-xs mb-2"
                              style={{ color: colors.text.secondary }}
                            >
                              Meta Bilgiler
                            </h5>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-xs" style={{ color: colors.text.secondary }}>Yayınlanma</p>
                                <p style={{ color: colors.text.primary }}>{new Date(item.published).toLocaleDateString('tr-TR')}</p>
                              </div>
                              <div>
                                <p className="text-xs" style={{ color: colors.text.secondary }}>Son Güncelleme</p>
                                <p style={{ color: colors.text.primary }}>{new Date(item.lastUpdated).toLocaleDateString('tr-TR')}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex justify-end mt-4 space-x-3">
                        <button
                          className="px-3 py-2 rounded-lg flex items-center text-sm"
                          style={{ 
                            backgroundColor: `${colors.error}10`,
                            color: colors.error
                          }}
                          onClick={() => playSound('click')}
                        >
                          <Trash2 size={16} className="mr-1.5" />
                          <span>Sil</span>
                        </button>
                        
                        <button
                          className="px-3 py-2 rounded-lg flex items-center text-sm"
                          style={{ 
                            backgroundColor: `${colors.secondary}10`,
                            color: colors.secondary
                          }}
                          onClick={() => playSound('click')}
                        >
                          <Eye size={16} className="mr-1.5" />
                          <span>Önizleme</span>
                        </button>
                        
                        <button
                          className="px-3 py-2 rounded-lg flex items-center text-sm"
                          style={{ 
                            backgroundColor: `${colors.success}10`,
                            color: colors.success
                          }}
                          onClick={() => playSound('click')}
                        >
                          <Share2 size={16} className="mr-1.5" />
                          <span>Paylaş</span>
                        </button>
                        
                        <button
                          className="px-3 py-2 rounded-lg flex items-center text-sm"
                          style={{ 
                            backgroundColor: colors.primary,
                            color: '#fff'
                          }}
                          onClick={() => playSound('click')}
                        >
                          <Edit size={16} className="mr-1.5" />
                          <span>Düzenle</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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