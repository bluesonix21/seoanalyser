import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useAudio } from '../../lib/stores/useAudio';
import { useGame } from '../../lib/stores/useGame';

// Icons
import { 
  Search, 
  Link, 
  AlertTriangle, 
  Zap, 
  Filter, 
  ChevronDown, 
  ExternalLink, 
  RefreshCw, 
  Download, 
  X, 
  CheckCircle, 
  ArrowRight, 
  BarChart2,
  PieChart,
  TrendingUp,
  Globe,
  Share2,
  Heart,
  Clock,
  Shield,
  Layers,
  Plus
} from 'lucide-react';

const BacklinkMapPage: React.FC = () => {
  const { colors } = useTheme();
  const { playSound } = useAudio();
  const { backlinkData, loadingState, error } = useGame();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFiltering, setIsFiltering] = useState(false);
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false);
  
  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    playSound('click');
  };
  
  // Toggle filter panel
  const toggleFilter = () => {
    setIsFiltering(!isFiltering);
    playSound('click');
  };
  
  // Toggle URL analysis form
  const toggleUrlAnalysis = () => {
    setIsAnalyzingUrl(!isAnalyzingUrl);
    playSound('click');
  };
  
  // Get domain authority category
  const getDomainAuthorityCategory = (da: number) => {
    if (da >= 80) return 'very-high';
    if (da >= 60) return 'high';
    if (da >= 40) return 'medium';
    if (da >= 20) return 'low';
    return 'very-low';
  };
  
  // Get domain authority color
  const getDomainAuthorityColor = (da: number) => {
    if (da >= 80) return colors.success;
    if (da >= 60) return colors.secondary;
    if (da >= 40) return colors.primary;
    if (da >= 20) return colors.warning;
    return colors.error;
  };
  
  // Get link type icon
  const getLinkTypeIcon = (type: string) => {
    switch (type) {
      case 'dofollow':
        return <Zap size={16} style={{ color: colors.success }} />;
      case 'nofollow':
        return <AlertTriangle size={16} style={{ color: colors.warning }} />;
      case 'sponsored':
        return <Heart size={16} style={{ color: colors.error }} />;
      case 'ugc':
        return <Share2 size={16} style={{ color: colors.info }} />;
      default:
        return <Link size={16} style={{ color: colors.primary }} />;
    }
  };
  
  // Backlink data
  const backlinks = [
    {
      domain: 'example-news.com',
      url: 'https://example-news.com/tech/latest-innovations',
      title: 'Latest Technology Innovations to Watch',
      anchor: 'SEO optimization tools',
      domainAuthority: 84,
      linkType: 'dofollow',
      firstSeen: '2023-02-15',
      lastSeen: '2023-05-21',
      category: 'news'
    },
    {
      domain: 'blog-platform.com',
      url: 'https://blog-platform.com/marketing/seo-tips-2023',
      title: 'Top SEO Tips to Implement in 2023',
      anchor: 'backlink analysis',
      domainAuthority: 72,
      linkType: 'dofollow',
      firstSeen: '2023-03-10',
      lastSeen: '2023-05-21',
      category: 'blog'
    },
    {
      domain: 'social-media.net',
      url: 'https://social-media.net/resources/marketing-tools',
      title: 'Best Marketing Tools for Social Media Managers',
      anchor: 'check your backlinks',
      domainAuthority: 76,
      linkType: 'nofollow',
      firstSeen: '2023-01-05',
      lastSeen: '2023-05-20',
      category: 'social'
    },
    {
      domain: 'marketing-forum.org',
      url: 'https://marketing-forum.org/threads/analytics-recommendations',
      title: 'What Analytics Tools Are You Using? - Discussion Thread',
      anchor: 'this backlink tool',
      domainAuthority: 65,
      linkType: 'dofollow',
      firstSeen: '2023-04-12',
      lastSeen: '2023-05-19',
      category: 'forum'
    },
    {
      domain: 'tech-reviews.io',
      url: 'https://tech-reviews.io/software/seo-tools-comparison',
      title: 'Comprehensive Comparison of SEO Tools in 2023',
      anchor: 'NovaSEO',
      domainAuthority: 68,
      linkType: 'dofollow',
      firstSeen: '2023-03-28',
      lastSeen: '2023-05-21',
      category: 'review'
    },
    {
      domain: 'webmaster-tips.com',
      url: 'https://webmaster-tips.com/articles/improve-seo-ranking',
      title: 'How to Improve Your SEO Ranking in 30 Days',
      anchor: 'comprehensive backlink analysis',
      domainAuthority: 62,
      linkType: 'dofollow',
      firstSeen: '2023-02-22',
      lastSeen: '2023-05-20',
      category: 'tutorial'
    },
    {
      domain: 'digital-agency.biz',
      url: 'https://digital-agency.biz/resources/favorite-tools',
      title: 'Tools Our Agency Uses Every Day',
      anchor: 'backlink mapping',
      domainAuthority: 58,
      linkType: 'sponsored',
      firstSeen: '2023-04-05',
      lastSeen: '2023-05-18',
      category: 'business'
    },
    {
      domain: 'seo-monthly.com',
      url: 'https://seo-monthly.com/issues/may-2023/top-tools',
      title: 'May 2023: Top Tools for SEO Professionals',
      anchor: 'visualization of backlinks',
      domainAuthority: 71,
      linkType: 'dofollow',
      firstSeen: '2023-05-01',
      lastSeen: '2023-05-21',
      category: 'news'
    },
    {
      domain: 'product-hunt.com',
      url: 'https://product-hunt.com/products/seo-tools-2023',
      title: 'Discover the Best SEO Tools of 2023',
      anchor: 'NovaSEO Dashboard',
      domainAuthority: 82,
      linkType: 'dofollow',
      firstSeen: '2023-04-18',
      lastSeen: '2023-05-21',
      category: 'social'
    },
    {
      domain: 'small-business-forum.com',
      url: 'https://small-business-forum.com/marketing/affordable-tools',
      title: 'Affordable Marketing Tools for Small Businesses',
      anchor: 'affordable SEO analysis',
      domainAuthority: 54,
      linkType: 'ugc',
      firstSeen: '2023-03-15',
      lastSeen: '2023-05-19',
      category: 'forum'
    },
    {
      domain: 'web-dev-community.org',
      url: 'https://web-dev-community.org/threads/best-seo-practices',
      title: 'Discussion: Best SEO Practices for Web Developers',
      anchor: 'comprehensive site analysis',
      domainAuthority: 69,
      linkType: 'dofollow',
      firstSeen: '2023-02-28',
      lastSeen: '2023-05-20',
      category: 'forum'
    },
    {
      domain: 'marketing-academy.edu',
      url: 'https://marketing-academy.edu/courses/digital-marketing/resources',
      title: 'Digital Marketing Resources - Marketing Academy',
      anchor: 'backlink research tool',
      domainAuthority: 76,
      linkType: 'dofollow',
      firstSeen: '2023-01-20',
      lastSeen: '2023-05-21',
      category: 'education'
    }
  ];
  
  // Filter backlinks
  const filteredBacklinks = backlinks.filter(backlink => {
    // Filter by search query
    const matchesSearch = searchQuery === '' || 
      backlink.domain.toLowerCase().includes(searchQuery.toLowerCase()) || 
      backlink.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      backlink.anchor.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = selectedCategory === 'all' || backlink.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Calculate stats
  const totalBacklinks = backlinks.length;
  const uniqueDomains = new Set(backlinks.map(b => b.domain)).size;
  const dofollowLinks = backlinks.filter(b => b.linkType === 'dofollow').length;
  const avgDomainAuthority = Math.round(backlinks.reduce((sum, b) => sum + b.domainAuthority, 0) / backlinks.length);
  
  // Domain authority distribution
  const daDistribution = {
    veryHigh: backlinks.filter(b => b.domainAuthority >= 80).length,
    high: backlinks.filter(b => b.domainAuthority >= 60 && b.domainAuthority < 80).length,
    medium: backlinks.filter(b => b.domainAuthority >= 40 && b.domainAuthority < 60).length,
    low: backlinks.filter(b => b.domainAuthority >= 20 && b.domainAuthority < 40).length,
    veryLow: backlinks.filter(b => b.domainAuthority < 20).length
  };
  
  // Category distribution
  const categories = Array.from(new Set(backlinks.map(b => b.category)));
  const categoryDistribution = categories.map(category => ({
    name: category,
    count: backlinks.filter(b => b.category === category).length
  }));
  
  // Link type distribution
  const linkTypes = Array.from(new Set(backlinks.map(b => b.linkType)));
  const linkTypeDistribution = linkTypes.map(type => ({
    name: type,
    count: backlinks.filter(b => b.linkType === type).length
  }));

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
            Backlink Haritası
          </h1>
          <p style={{ color: colors.text.secondary }}>
            Backlink profilinizi görselleştirin ve analiz edin
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: colors.primary, color: '#fff' }}
            onClick={toggleUrlAnalysis}
          >
            <Plus size={18} />
            <span>{isAnalyzingUrl ? 'İptal' : 'URL Analiz Et'}</span>
          </button>
          
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
            style={{ backgroundColor: `${colors.info}20`, color: colors.info }}
            onClick={() => playSound('click')}
          >
            <RefreshCw size={18} />
            <span>Yenile</span>
          </button>
        </div>
      </div>
      
      {/* URL Analysis Form */}
      {isAnalyzingUrl && (
        <div 
          className="rounded-lg border p-5"
          style={{ 
            backgroundColor: colors.background.card,
            borderColor: colors.border
          }}
        >
          <h3 
            className="text-lg font-bold mb-4"
            style={{ color: colors.text.primary }}
          >
            URL Backlink Analizi
          </h3>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Analiz etmek istediğiniz URL'yi girin (örn. https://example.com)"
                className="w-full py-3 px-4 rounded-lg bg-transparent border"
                style={{ 
                  borderColor: colors.border,
                  color: colors.text.primary
                }}
              />
            </div>
            
            <button
              className="px-6 py-3 rounded-lg"
              style={{ 
                backgroundColor: colors.primary,
                color: '#fff'
              }}
              onClick={() => {
                playSound('click');
                setIsAnalyzingUrl(false);
              }}
            >
              Analiz Et
            </button>
          </div>
          
          <p 
            className="mt-3 text-sm"
            style={{ color: colors.text.secondary }}
          >
            Domain veya tam URL girebilirsiniz. Tam URL girerseniz, sadece o sayfaya gelen backlinkleri analiz ederiz.
          </p>
        </div>
      )}
      
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
            <Link size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>Toplam Backlink</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{totalBacklinks}</h3>
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
            <Globe size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>Benzersiz Domain</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{uniqueDomains}</h3>
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
            <Zap size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>Dofollow Bağlantılar</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{dofollowLinks}</h3>
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
            <BarChart2 size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>Ort. Domain Otoritesi</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{avgDomainAuthority}/100</h3>
          </div>
        </div>
      </div>
      
      {/* Visualization and Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backlink Visualization */}
        <div 
          className="lg:col-span-2 rounded-lg border overflow-hidden"
          style={{ 
            backgroundColor: colors.background.card,
            borderColor: colors.border
          }}
        >
          <div className="p-4 border-b" style={{ borderColor: colors.border }}>
            <h3 
              className="text-base font-bold"
              style={{ color: colors.text.primary }}
            >
              Backlink Haritası Görselleştirmesi
            </h3>
          </div>
          
          <div className="p-6 h-[400px] flex items-center justify-center">
            {/* Visualization placeholder */}
            <div className="text-center">
              <Layers size={64} style={{ color: colors.text.secondary, opacity: 0.3 }} className="mx-auto mb-4" />
              <h3 
                className="text-lg font-medium mb-2"
                style={{ color: colors.text.primary }}
              >
                Backlink Gösterimi
              </h3>
              <p 
                className="max-w-md"
                style={{ color: colors.text.secondary }}
              >
                Burada sitenize gelen backlinklerin interaktif bir görselleştirmesi gösterilecektir. Yuvarlak düğümler referans veren domainlerdir ve merkezdeki düğüm sizin sitenizdir.
              </p>
            </div>
          </div>
        </div>
        
        {/* Metrics Breakdown */}
        <div>
          <div className="space-y-6">
            {/* Domain Authority Distribution */}
            <div 
              className="rounded-lg border overflow-hidden"
              style={{ 
                backgroundColor: colors.background.card,
                borderColor: colors.border
              }}
            >
              <div className="p-4 border-b" style={{ borderColor: colors.border }}>
                <h3 
                  className="text-base font-bold"
                  style={{ color: colors.text.primary }}
                >
                  Domain Otorite Dağılımı
                </h3>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: colors.text.secondary }}>Çok Yüksek (80-100)</span>
                      <span style={{ color: colors.text.primary }}>{daDistribution.veryHigh} bağlantı</span>
                    </div>
                    <div 
                      className="h-2 rounded-full"
                      style={{ backgroundColor: `${colors.success}20` }}
                    >
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: colors.success,
                          width: `${(daDistribution.veryHigh / totalBacklinks) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: colors.text.secondary }}>Yüksek (60-79)</span>
                      <span style={{ color: colors.text.primary }}>{daDistribution.high} bağlantı</span>
                    </div>
                    <div 
                      className="h-2 rounded-full"
                      style={{ backgroundColor: `${colors.secondary}20` }}
                    >
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: colors.secondary,
                          width: `${(daDistribution.high / totalBacklinks) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: colors.text.secondary }}>Orta (40-59)</span>
                      <span style={{ color: colors.text.primary }}>{daDistribution.medium} bağlantı</span>
                    </div>
                    <div 
                      className="h-2 rounded-full"
                      style={{ backgroundColor: `${colors.primary}20` }}
                    >
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: colors.primary,
                          width: `${(daDistribution.medium / totalBacklinks) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: colors.text.secondary }}>Düşük (20-39)</span>
                      <span style={{ color: colors.text.primary }}>{daDistribution.low} bağlantı</span>
                    </div>
                    <div 
                      className="h-2 rounded-full"
                      style={{ backgroundColor: `${colors.warning}20` }}
                    >
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: colors.warning,
                          width: `${(daDistribution.low / totalBacklinks) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: colors.text.secondary }}>Çok Düşük (0-19)</span>
                      <span style={{ color: colors.text.primary }}>{daDistribution.veryLow} bağlantı</span>
                    </div>
                    <div 
                      className="h-2 rounded-full"
                      style={{ backgroundColor: `${colors.error}20` }}
                    >
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: colors.error,
                          width: `${(daDistribution.veryLow / totalBacklinks) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Link Type Distribution */}
            <div 
              className="rounded-lg border overflow-hidden"
              style={{ 
                backgroundColor: colors.background.card,
                borderColor: colors.border
              }}
            >
              <div className="p-4 border-b" style={{ borderColor: colors.border }}>
                <h3 
                  className="text-base font-bold"
                  style={{ color: colors.text.primary }}
                >
                  Bağlantı Türü Dağılımı
                </h3>
              </div>
              
              <div className="p-4 flex flex-col items-center">
                {/* Placeholder chart */}
                <div className="w-32 h-32 mb-3">
                  <PieChart size={128} style={{ color: colors.text.secondary, opacity: 0.3 }} />
                </div>
                
                <div className="w-full space-y-2">
                  {linkTypeDistribution.map((type, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        {getLinkTypeIcon(type.name)}
                        <span 
                          className="ml-2 capitalize"
                          style={{ color: colors.text.primary }}
                        >
                          {type.name}
                        </span>
                      </div>
                      <span 
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {type.count} ({Math.round((type.count / totalBacklinks) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Trends */}
            <div 
              className="rounded-lg border overflow-hidden"
              style={{ 
                backgroundColor: colors.background.card,
                borderColor: colors.border
              }}
            >
              <div className="p-4 border-b" style={{ borderColor: colors.border }}>
                <h3 
                  className="text-base font-bold"
                  style={{ color: colors.text.primary }}
                >
                  Zaman İçinde Eğilimler
                </h3>
              </div>
              
              <div className="p-4 flex flex-col items-center">
                <div className="w-full h-16 mb-3">
                  <TrendingUp size={64} style={{ color: colors.text.secondary, opacity: 0.3 }} className="mx-auto" />
                </div>
                
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.text.secondary }}>Son 30 günde yeni</span>
                    <span 
                      style={{ color: colors.success }}
                      className="font-medium"
                    >
                      +24 bağlantı
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.text.secondary }}>Son 30 günde kaybedilen</span>
                    <span 
                      style={{ color: colors.error }}
                      className="font-medium"
                    >
                      -6 bağlantı
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.text.secondary }}>Net değişim</span>
                    <span 
                      style={{ color: colors.primary }}
                      className="font-medium"
                    >
                      +18 bağlantı
                    </span>
                  </div>
                </div>
                
                <button
                  className="mt-4 text-sm flex items-center"
                  style={{ color: colors.primary }}
                  onClick={() => playSound('click')}
                >
                  <span>Ayrıntılı Trend Raporu</span>
                  <ArrowRight size={14} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Backlinks Table */}
      <div 
        className="rounded-lg border overflow-hidden"
        style={{ 
          backgroundColor: colors.background.card,
          borderColor: colors.border
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 
                className="text-lg font-bold"
                style={{ color: colors.text.primary }}
              >
                Backlink Listesi
              </h3>
              <p 
                className="text-sm"
                style={{ color: colors.text.secondary }}
              >
                Sitenize bağlantı veren tüm web sayfalarını görüntüleyin
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Domain, başlık veya çapa metni ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="py-2 pl-10 pr-4 rounded-lg bg-transparent border"
                  style={{ 
                    borderColor: colors.border, 
                    color: colors.text.primary,
                    width: '280px'
                  }}
                />
                <Search 
                  size={18} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" 
                  style={{ color: colors.text.secondary }} 
                />
              </div>
              
              {/* Filter */}
              <div className="relative">
                <button
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg border"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.text.secondary,
                    backgroundColor: isFiltering ? `${colors.secondary}10` : 'transparent'
                  }}
                  onClick={toggleFilter}
                >
                  <Filter size={18} />
                  <span>Filtreler</span>
                  <ChevronDown size={18} className={`transition-transform ${isFiltering ? 'rotate-180' : ''}`} />
                </button>
                
                {isFiltering && (
                  <div 
                    className="absolute top-full right-0 mt-2 p-4 rounded-lg border shadow-lg z-10 min-w-[250px]"
                    style={{ 
                      backgroundColor: colors.background.card,
                      borderColor: colors.border
                    }}
                  >
                    <h4 
                      className="text-sm font-medium mb-3"
                      style={{ color: colors.text.primary }}
                    >
                      Bağlantı Türü
                    </h4>
                    
                    <div className="space-y-2 mb-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          className="sr-only"
                        />
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ 
                            backgroundColor: colors.primary
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span style={{ color: colors.text.primary }}>Dofollow</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          className="sr-only"
                        />
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ 
                            backgroundColor: colors.primary
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span style={{ color: colors.text.primary }}>Nofollow</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          className="sr-only"
                        />
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ 
                            backgroundColor: colors.primary
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span style={{ color: colors.text.primary }}>Sponsored</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          className="sr-only"
                        />
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ 
                            backgroundColor: colors.primary
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span style={{ color: colors.text.primary }}>UGC</span>
                      </label>
                    </div>
                    
                    <h4 
                      className="text-sm font-medium mb-3"
                      style={{ color: colors.text.primary }}
                    >
                      Domain Otoritesi
                    </h4>
                    
                    <div className="space-y-2 mb-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          className="sr-only"
                        />
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ 
                            backgroundColor: colors.primary
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span style={{ color: colors.text.primary }}>Çok Yüksek (80-100)</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          className="sr-only"
                        />
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ 
                            backgroundColor: colors.primary
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span style={{ color: colors.text.primary }}>Yüksek (60-79)</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          className="sr-only"
                        />
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ 
                            backgroundColor: colors.primary
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span style={{ color: colors.text.primary }}>Orta (40-59)</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          className="sr-only"
                        />
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ 
                            backgroundColor: colors.primary
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span style={{ color: colors.text.primary }}>Düşük (20-39)</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={true}
                          className="sr-only"
                        />
                        <div 
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ 
                            backgroundColor: colors.primary
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span style={{ color: colors.text.primary }}>Çok Düşük (0-19)</span>
                      </label>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <button
                        className="px-3 py-2 rounded-lg"
                        style={{ 
                          backgroundColor: colors.primary,
                          color: '#fff'
                        }}
                        onClick={toggleFilter}
                      >
                        Uygula
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Category Filters */}
          <div className="flex flex-wrap mt-4 gap-2">
            <button
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedCategory === 'all' ? 'text-white' : ''
              }`}
              style={{ 
                backgroundColor: selectedCategory === 'all' ? colors.primary : `${colors.primary}10`,
                color: selectedCategory === 'all' ? '#fff' : colors.primary
              }}
              onClick={() => handleCategorySelect('all')}
            >
              Tümü
            </button>
            
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedCategory === category ? 'text-white' : ''
                }`}
                style={{ 
                  backgroundColor: selectedCategory === category ? colors.primary : `${colors.primary}10`,
                  color: selectedCategory === category ? '#fff' : colors.primary
                }}
                onClick={() => handleCategorySelect(category)}
              >
                <span className="capitalize">{category}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {filteredBacklinks.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: colors.border }}>
                  <th className="p-3 text-left" style={{ color: colors.text.secondary }}>Kaynak</th>
                  <th className="p-3 text-left" style={{ color: colors.text.secondary }}>Çapa Metni</th>
                  <th className="p-3 text-left" style={{ color: colors.text.secondary }}>DA</th>
                  <th className="p-3 text-left" style={{ color: colors.text.secondary }}>Tür</th>
                  <th className="p-3 text-left" style={{ color: colors.text.secondary }}>İlk Görülme</th>
                  <th className="p-3 text-left" style={{ color: colors.text.secondary }}>Son Görülme</th>
                  <th className="p-3 text-left" style={{ color: colors.text.secondary }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredBacklinks.map((backlink, index) => (
                  <tr 
                    key={index} 
                    className="border-b hover:bg-white/5"
                    style={{ borderColor: colors.border }}
                  >
                    <td className="p-3">
                      <div>
                        <div 
                          className="font-medium truncate max-w-[200px]"
                          style={{ color: colors.text.primary }}
                        >
                          {backlink.domain}
                        </div>
                        <div 
                          className="text-xs truncate max-w-[200px]"
                          style={{ color: colors.text.secondary }}
                          title={backlink.title}
                        >
                          {backlink.title}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div 
                        className="inline-block px-3 py-1 rounded-full text-sm max-w-[200px] truncate"
                        style={{ 
                          backgroundColor: `${colors.primary}10`,
                          color: colors.primary
                        }}
                        title={backlink.anchor}
                      >
                        {backlink.anchor}
                      </div>
                    </td>
                    <td className="p-3">
                      <div 
                        className="inline-block px-2 py-1 rounded-full text-sm font-medium"
                        style={{ 
                          backgroundColor: `${getDomainAuthorityColor(backlink.domainAuthority)}20`,
                          color: getDomainAuthorityColor(backlink.domainAuthority)
                        }}
                      >
                        {backlink.domainAuthority}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        {getLinkTypeIcon(backlink.linkType)}
                        <span 
                          className="ml-1.5 text-sm capitalize"
                          style={{ color: colors.text.primary }}
                        >
                          {backlink.linkType}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div 
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {new Date(backlink.firstSeen).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="p-3">
                      <div 
                        className="text-sm"
                        style={{ color: colors.text.secondary }}
                      >
                        {new Date(backlink.lastSeen).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-1">
                        <button 
                          className="p-2 rounded hover:bg-white/10"
                          onClick={() => {
                            window.open(backlink.url, '_blank');
                            playSound('click');
                          }}
                          title="Bağlantıyı Gör"
                        >
                          <ExternalLink size={16} style={{ color: colors.secondary }} />
                        </button>
                        <button 
                          className="p-2 rounded hover:bg-white/10"
                          onClick={() => playSound('click')}
                          title="Daha Fazla Analiz"
                        >
                          <Search size={16} style={{ color: colors.primary }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center">
              <AlertTriangle size={48} style={{ color: colors.text.secondary, opacity: 0.3 }} className="mx-auto mb-4" />
              <h3 
                className="text-lg font-medium mb-2"
                style={{ color: colors.text.primary }}
              >
                Sonuç Bulunamadı
              </h3>
              <p style={{ color: colors.text.secondary }}>
                {searchQuery ? 'Arama kriterinize uygun backlink bulunamadı.' : 'Henüz backlink verisi bulunmuyor.'}
              </p>
              <button
                className="mt-4 px-4 py-2 rounded-lg inline-flex items-center"
                style={{ 
                  backgroundColor: colors.primary,
                  color: '#fff'
                }}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  playSound('click');
                }}
              >
                <RefreshCw size={18} className="mr-2" />
                <span>Tüm Sonuçları Göster</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BacklinkMapPage;