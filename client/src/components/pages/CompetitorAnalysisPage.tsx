import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useGame } from '../../lib/stores/useGame';
import { useAudio } from '../../lib/stores/useAudio';

// Icons
import { 
  Search, 
  Trash2, 
  Plus, 
  ChevronDown, 
  BarChart2, 
  Link as LinkIcon,
  Eye,
  Users,
  Share2,
  TrendingUp,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  MoreHorizontal,
  RefreshCw,
  Download
} from 'lucide-react';

// Competitor detail data
interface CompetitorMetric {
  name: string;
  value: number | string;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  unit?: string;
}

interface CompetitorDetailData {
  name: string;
  url: string;
  seoScore: number;
  backlinks: number;
  keywords: number;
  traffic: number;
  metrics: CompetitorMetric[];
}

// Sample competitor detail data
const competitorDetails: Record<string, CompetitorDetailData> = {
  'competitor1.com': {
    name: 'Competitor 1',
    url: 'https://competitor1.com',
    seoScore: 82,
    backlinks: 2043,
    keywords: 4281,
    traffic: 543000,
    metrics: [
      { name: 'Domain Otoritesi', value: 65, change: 3, changeType: 'positive', unit: '/100' },
      { name: 'Sayfa Sayısı', value: 1254, change: 45, changeType: 'positive' },
      { name: 'Ortalama Sayfa Yükleme Süresi', value: '1.8', change: -0.3, changeType: 'positive', unit: 's' },
      { name: 'Sosyal Medya Paylaşımları', value: 15240, change: 1250, changeType: 'positive' },
      { name: 'Referans Veren Domainler', value: 532, change: 17, changeType: 'positive' },
      { name: 'İlk 10\'daki Anahtar Kelimeler', value: 247, change: 12, changeType: 'positive' }
    ]
  },
  'competitor2.com': {
    name: 'Competitor 2',
    url: 'https://competitor2.com',
    seoScore: 79,
    backlinks: 1876,
    keywords: 3942,
    traffic: 491000,
    metrics: [
      { name: 'Domain Otoritesi', value: 61, change: 1, changeType: 'positive', unit: '/100' },
      { name: 'Sayfa Sayısı', value: 982, change: -24, changeType: 'negative' },
      { name: 'Ortalama Sayfa Yükleme Süresi', value: '2.1', change: 0.2, changeType: 'negative', unit: 's' },
      { name: 'Sosyal Medya Paylaşımları', value: 8640, change: 720, changeType: 'positive' },
      { name: 'Referans Veren Domainler', value: 487, change: -5, changeType: 'negative' },
      { name: 'İlk 10\'daki Anahtar Kelimeler', value: 183, change: 8, changeType: 'positive' }
    ]
  },
  'competitor3.com': {
    name: 'Competitor 3',
    url: 'https://competitor3.com',
    seoScore: 88,
    backlinks: 2371,
    keywords: 5102,
    traffic: 612000,
    metrics: [
      { name: 'Domain Otoritesi', value: 72, change: 5, changeType: 'positive', unit: '/100' },
      { name: 'Sayfa Sayısı', value: 1680, change: 120, changeType: 'positive' },
      { name: 'Ortalama Sayfa Yükleme Süresi', value: '1.5', change: -0.4, changeType: 'positive', unit: 's' },
      { name: 'Sosyal Medya Paylaşımları', value: 24750, change: 3250, changeType: 'positive' },
      { name: 'Referans Veren Domainler', value: 614, change: 28, changeType: 'positive' },
      { name: 'İlk 10\'daki Anahtar Kelimeler', value: 312, change: 34, changeType: 'positive' }
    ]
  },
  'competitor4.com': {
    name: 'Competitor 4',
    url: 'https://competitor4.com',
    seoScore: 68,
    backlinks: 927,
    keywords: 2150,
    traffic: 267000,
    metrics: [
      { name: 'Domain Otoritesi', value: 54, change: 2, changeType: 'positive', unit: '/100' },
      { name: 'Sayfa Sayısı', value: 745, change: 35, changeType: 'positive' },
      { name: 'Ortalama Sayfa Yükleme Süresi', value: '2.7', change: 0.3, changeType: 'negative', unit: 's' },
      { name: 'Sosyal Medya Paylaşımları', value: 5430, change: -320, changeType: 'negative' },
      { name: 'Referans Veren Domainler', value: 294, change: 12, changeType: 'positive' },
      { name: 'İlk 10\'daki Anahtar Kelimeler', value: 95, change: -7, changeType: 'negative' }
    ]
  }
};

const CompetitorAnalysisPage: React.FC = () => {
  const { colors } = useTheme();
  const { competitorData } = useGame();
  const { playSound } = useAudio();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [isAddingCompetitor, setIsAddingCompetitor] = useState(false);
  const [newCompetitorUrl, setNewCompetitorUrl] = useState('');
  
  // Filter competitors based on search query
  const filteredCompetitors = competitorData.filter(comp => 
    comp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    playSound('click');
  };
  
  // Handle competitor selection
  const handleCompetitorSelect = (name: string) => {
    setSelectedCompetitor(name);
    playSound('click');
  };
  
  // Handle competitor add toggle
  const toggleAddCompetitor = () => {
    setIsAddingCompetitor(!isAddingCompetitor);
    setNewCompetitorUrl('');
    playSound('click');
  };
  
  // Handle add competitor
  const handleAddCompetitor = () => {
    if (!newCompetitorUrl.trim()) return;
    
    // In a real app, this would call an API to add the competitor
    console.log('Adding competitor:', newCompetitorUrl);
    
    // Reset form
    setNewCompetitorUrl('');
    setIsAddingCompetitor(false);
    playSound('click');
    
    // Show toast (in a real app, you would use a toast component)
    alert('Competitor analysis has been scheduled');
  };
  
  // Get color based on change type
  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive':
        return colors.success;
      case 'negative':
        return colors.error;
      default:
        return colors.text.secondary;
    }
  };
  
  // Get change icon based on change type
  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'positive':
        return <ArrowUpRight size={14} />;
      case 'negative':
        return <ArrowDownRight size={14} />;
      default:
        return <Minus size={14} />;
    }
  };
  
  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };
  
  // Get color for metric name based on index
  const getMetricColor = (index: number) => {
    const colors = [
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#F59E0B', // Amber
      '#10B981', // Emerald
      '#3B82F6', // Blue
      '#EF4444', // Red
    ];
    
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            Rakip Analizi
          </h1>
          <p style={{ color: colors.text.secondary }}>
            Rakiplerinizin SEO performansını izleyin ve karşılaştırın
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
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Competitors List */}
        <div 
          className="rounded-xl border overflow-hidden"
          style={{ 
            backgroundColor: colors.background.card,
            borderColor: colors.border
          }}
        >
          <div className="p-4 border-b" style={{ borderColor: colors.border }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold" style={{ color: colors.text.primary }}>
                Rakipler
              </h2>
              
              <div className="flex items-center space-x-2">
                <button 
                  className="p-2 rounded-lg hover:bg-white/5"
                  onClick={toggleAddCompetitor}
                >
                  {isAddingCompetitor ? (
                    <Trash2 size={18} style={{ color: colors.error }} />
                  ) : (
                    <Plus size={18} style={{ color: colors.success }} />
                  )}
                </button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Rakip ara..."
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
            
            {/* Add Competitor Form */}
            {isAddingCompetitor && (
              <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: colors.background.main }}>
                <h3 
                  className="text-sm font-medium mb-3"
                  style={{ color: colors.text.primary }}
                >
                  Yeni Rakip Ekle
                </h3>
                <div className="flex items-center mb-3">
                  <input
                    type="text"
                    placeholder="Rakip URL (örn. competitor.com)"
                    value={newCompetitorUrl}
                    onChange={(e) => setNewCompetitorUrl(e.target.value)}
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
                      color: '#fff',
                      opacity: newCompetitorUrl.trim() ? 1 : 0.5
                    }}
                    onClick={handleAddCompetitor}
                    disabled={!newCompetitorUrl.trim()}
                  >
                    Ekle
                  </button>
                </div>
                <p 
                  className="text-xs"
                  style={{ color: colors.text.secondary }}
                >
                  URL ekledikten sonra, rakibiniz analiz edilecek ve sonuçlar hazır olduğunda gösterilecektir.
                </p>
              </div>
            )}
          </div>
          
          {/* Competitors List */}
          <div className="max-h-[600px] overflow-y-auto">
            {filteredCompetitors.length > 0 ? (
              <div className="divide-y" style={{ borderColor: colors.border }}>
                {filteredCompetitors.map((competitor) => (
                  <button
                    key={competitor.name}
                    className={`w-full p-4 text-left transition-colors ${
                      selectedCompetitor === competitor.name ? 'bg-white/5' : 'hover:bg-white/5'
                    }`}
                    onClick={() => handleCompetitorSelect(competitor.name)}
                    style={{ borderColor: colors.border }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 
                          className="font-medium mb-1"
                          style={{ color: colors.text.primary }}
                        >
                          {competitor.name}
                        </h3>
                        <div className="flex items-center text-sm" style={{ color: colors.text.secondary }}>
                          <BarChart2 size={14} className="mr-1" />
                          <span>Skor: {competitor.score}</span>
                        </div>
                      </div>
                      
                      <ChevronRight 
                        size={18} 
                        style={{ 
                          color: colors.text.secondary,
                          opacity: selectedCompetitor === competitor.name ? 1 : 0.5,
                          transform: selectedCompetitor === competitor.name ? 'rotate(90deg)' : 'none'
                        }} 
                      />
                    </div>
                    
                    {selectedCompetitor === competitor.name && (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div
                          className="p-2 rounded"
                          style={{ backgroundColor: colors.background.main }}
                        >
                          <div style={{ color: colors.text.secondary }}>Backlinks</div>
                          <div 
                            className="font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {competitor.backlinks.toLocaleString()}
                          </div>
                        </div>
                        
                        <div
                          className="p-2 rounded"
                          style={{ backgroundColor: colors.background.main }}
                        >
                          <div style={{ color: colors.text.secondary }}>Keywords</div>
                          <div 
                            className="font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {competitor.keywords.toLocaleString()}
                          </div>
                        </div>
                        
                        <div
                          className="p-2 rounded col-span-2"
                          style={{ backgroundColor: colors.background.main }}
                        >
                          <div style={{ color: colors.text.secondary }}>Traffic</div>
                          <div 
                            className="font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {competitor.traffic.toLocaleString()} ziyaretçi/ay
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p style={{ color: colors.text.secondary }}>
                  {searchQuery ? 'Arama sonucu bulunamadı.' : 'Henüz rakip eklenmemiş.'}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Competitor Details */}
        <div className="lg:col-span-2">
          {selectedCompetitor ? (
            <div>
              {/* Competitor Header */}
              <div 
                className="rounded-xl p-6 mb-6 border overflow-hidden"
                style={{ 
                  backgroundColor: colors.background.card,
                  borderColor: colors.border
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center mb-2">
                      <h2 
                        className="text-xl font-bold mr-3"
                        style={{ color: colors.text.primary }}
                      >
                        {competitorDetails[selectedCompetitor]?.name || selectedCompetitor}
                      </h2>
                      <a 
                        href={competitorDetails[selectedCompetitor]?.url || `https://${selectedCompetitor}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm flex items-center"
                        style={{ color: colors.secondary }}
                        onClick={() => playSound('click')}
                      >
                        <span>{selectedCompetitor}</span>
                        <Eye size={14} className="ml-1" />
                      </a>
                    </div>
                    <p 
                      className="text-sm"
                      style={{ color: colors.text.secondary }}
                    >
                      Son analiz: 23 Nisan 2025
                    </p>
                  </div>
                  
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: colors.background.main }}
                  >
                    <div className="flex items-center space-x-1 text-sm">
                      <span style={{ color: colors.text.secondary }}>SEO Puanı:</span>
                      <span 
                        className="font-bold"
                        style={{ color: getScoreColor(competitorDetails[selectedCompetitor]?.seoScore || 0) }}
                      >
                        {competitorDetails[selectedCompetitor]?.seoScore || 0}/100
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div 
                    className="rounded-lg p-3"
                    style={{ backgroundColor: colors.background.main }}
                  >
                    <div className="flex items-center mb-1">
                      <LinkIcon size={16} className="mr-2" style={{ color: colors.primary }} />
                      <div 
                        className="text-sm font-medium"
                        style={{ color: colors.text.secondary }}
                      >
                        Backlinks
                      </div>
                    </div>
                    <div 
                      className="text-xl font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {competitorDetails[selectedCompetitor]?.backlinks.toLocaleString() || 0}
                    </div>
                  </div>
                  
                  <div 
                    className="rounded-lg p-3"
                    style={{ backgroundColor: colors.background.main }}
                  >
                    <div className="flex items-center mb-1">
                      <Search size={16} className="mr-2" style={{ color: colors.primary }} />
                      <div 
                        className="text-sm font-medium"
                        style={{ color: colors.text.secondary }}
                      >
                        Keywords
                      </div>
                    </div>
                    <div 
                      className="text-xl font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {competitorDetails[selectedCompetitor]?.keywords.toLocaleString() || 0}
                    </div>
                  </div>
                  
                  <div 
                    className="rounded-lg p-3"
                    style={{ backgroundColor: colors.background.main }}
                  >
                    <div className="flex items-center mb-1">
                      <Users size={16} className="mr-2" style={{ color: colors.primary }} />
                      <div 
                        className="text-sm font-medium"
                        style={{ color: colors.text.secondary }}
                      >
                        Traffic
                      </div>
                    </div>
                    <div 
                      className="text-xl font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {competitorDetails[selectedCompetitor]?.traffic.toLocaleString() || 0}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tabs */}
              <div 
                className="rounded-xl border overflow-hidden"
                style={{ 
                  backgroundColor: colors.background.card,
                  borderColor: colors.border
                }}
              >
                {/* Tab Navigation */}
                <div className="flex border-b" style={{ borderColor: colors.border }}>
                  <button
                    className={`px-6 py-3 font-medium ${activeTab === 'overview' ? 'border-b-2' : ''}`}
                    style={{ 
                      borderColor: activeTab === 'overview' ? colors.primary : 'transparent',
                      color: activeTab === 'overview' ? colors.text.primary : colors.text.secondary
                    }}
                    onClick={() => handleTabChange('overview')}
                  >
                    Genel Bakış
                  </button>
                  <button
                    className={`px-6 py-3 font-medium ${activeTab === 'keywords' ? 'border-b-2' : ''}`}
                    style={{ 
                      borderColor: activeTab === 'keywords' ? colors.primary : 'transparent',
                      color: activeTab === 'keywords' ? colors.text.primary : colors.text.secondary
                    }}
                    onClick={() => handleTabChange('keywords')}
                  >
                    Anahtar Kelimeler
                  </button>
                  <button
                    className={`px-6 py-3 font-medium ${activeTab === 'backlinks' ? 'border-b-2' : ''}`}
                    style={{ 
                      borderColor: activeTab === 'backlinks' ? colors.primary : 'transparent',
                      color: activeTab === 'backlinks' ? colors.text.primary : colors.text.secondary
                    }}
                    onClick={() => handleTabChange('backlinks')}
                  >
                    Backlinks
                  </button>
                  <button
                    className={`px-6 py-3 font-medium ${activeTab === 'content' ? 'border-b-2' : ''}`}
                    style={{ 
                      borderColor: activeTab === 'content' ? colors.primary : 'transparent',
                      color: activeTab === 'content' ? colors.text.primary : colors.text.secondary
                    }}
                    onClick={() => handleTabChange('content')}
                  >
                    İçerik
                  </button>
                </div>
                
                {/* Tab Content */}
                <div>
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="p-6">
                      <h3 
                        className="text-lg font-bold mb-5"
                        style={{ color: colors.text.primary }}
                      >
                        Performans Metrikleri
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {competitorDetails[selectedCompetitor]?.metrics.map((metric, index) => (
                          <div 
                            key={metric.name}
                            className="p-4 rounded-lg border"
                            style={{ 
                              backgroundColor: colors.background.main,
                              borderColor: colors.border
                            }}
                          >
                            <div 
                              className="flex items-center mb-1"
                              style={{ color: colors.text.secondary }}
                            >
                              <div 
                                className="w-2 h-2 rounded-full mr-2"
                                style={{ backgroundColor: getMetricColor(index) }}
                              ></div>
                              <div className="text-sm">{metric.name}</div>
                            </div>
                            
                            <div className="flex items-end justify-between">
                              <div 
                                className="text-xl font-bold"
                                style={{ color: colors.text.primary }}
                              >
                                {metric.value}{metric.unit || ''}
                              </div>
                              
                              <div 
                                className="flex items-center text-sm"
                                style={{ color: getChangeColor(metric.changeType) }}
                              >
                                {getChangeIcon(metric.changeType)}
                                <span className="ml-0.5">
                                  {metric.change > 0 ? '+' : ''}{metric.change}{metric.unit?.includes('%') ? '%' : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: `${colors.primary}10` }}>
                        <h4 
                          className="font-medium mb-2"
                          style={{ color: colors.text.primary }}
                        >
                          Tavsiyeler
                        </h4>
                        <p 
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          Bu rakibin güçlü yönleri sayfalarının hızlı yüklenmesi ve yüksek kaliteli backlink profilidir. 
                          Rakip aynı zamanda sosyal medyada oldukça aktif. Bu alanları geliştirerek bu rakiple daha iyi 
                          rekabet edebilirsiniz.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Other Tabs - Placeholders */}
                  {activeTab === 'keywords' && (
                    <div className="p-6">
                      <div className="py-20 text-center">
                        <TrendingUp size={48} style={{ color: colors.text.secondary, opacity: 0.3 }} className="mx-auto mb-4" />
                        <h3 
                          className="text-lg font-medium mb-2"
                          style={{ color: colors.text.primary }}
                        >
                          Anahtar Kelime Analizi
                        </h3>
                        <p style={{ color: colors.text.secondary }}>
                          Bu bölüm daha sonra eklenecektir. Bu rakibin anahtar kelime sıralamalarını ve fırsatlarını gösterecektir.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'backlinks' && (
                    <div className="p-6">
                      <div className="py-20 text-center">
                        <LinkIcon size={48} style={{ color: colors.text.secondary, opacity: 0.3 }} className="mx-auto mb-4" />
                        <h3 
                          className="text-lg font-medium mb-2"
                          style={{ color: colors.text.primary }}
                        >
                          Backlink Analizi
                        </h3>
                        <p style={{ color: colors.text.secondary }}>
                          Bu bölüm daha sonra eklenecektir. Bu rakibin backlink profili ve kalitesi hakkında bilgiler içerecektir.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'content' && (
                    <div className="p-6">
                      <div className="py-20 text-center">
                        <Share2 size={48} style={{ color: colors.text.secondary, opacity: 0.3 }} className="mx-auto mb-4" />
                        <h3 
                          className="text-lg font-medium mb-2"
                          style={{ color: colors.text.primary }}
                        >
                          İçerik Analizi
                        </h3>
                        <p style={{ color: colors.text.secondary }}>
                          Bu bölüm daha sonra eklenecektir. Bu rakibin içerik stratejisi ve popüler içerikleri hakkında bilgiler içerecektir.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="rounded-xl p-6 border text-center flex flex-col items-center justify-center"
              style={{ 
                backgroundColor: colors.background.card,
                borderColor: colors.border,
                minHeight: '400px'
              }}
            >
              <Crosshair size={64} style={{ color: colors.text.secondary, opacity: 0.3 }} className="mb-6" />
              <h2 
                className="text-xl font-bold mb-3"
                style={{ color: colors.text.primary }}
              >
                Rakip Seçilmedi
              </h2>
              <p 
                className="text-base mb-6 max-w-md"
                style={{ color: colors.text.secondary }}
              >
                Detaylı analiz için sol taraftaki listeden bir rakip seçin veya yeni bir rakip ekleyin.
              </p>
              <button
                className="px-4 py-2 rounded-lg flex items-center"
                style={{ 
                  backgroundColor: colors.primary,
                  color: '#fff'
                }}
                onClick={toggleAddCompetitor}
              >
                <Plus size={18} className="mr-2" />
                <span>Yeni Rakip Ekle</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitorAnalysisPage;