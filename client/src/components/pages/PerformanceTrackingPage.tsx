import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useAudio } from '../../lib/stores/useAudio';

// Icons
import { 
  TrendingUp, 
  Activity, 
  Search, 
  Users, 
  Clock, 
  Calendar, 
  ChevronDown, 
  Download, 
  RefreshCw, 
  Filter, 
  BarChart2, 
  ArrowUp, 
  ArrowDown, 
  ChevronsUp, 
  ChevronsDown,
  Zap,
  ChevronRight,
  Maximize2,
  BarChart
} from 'lucide-react';

const PerformanceTrackingPage: React.FC = () => {
  const { colors } = useTheme();
  const { playSound } = useAudio();
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedMetric, setSelectedMetric] = useState('organic');
  const [isFiltering, setIsFiltering] = useState(false);
  
  // Handle date range change
  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    playSound('click');
  };
  
  // Handle metric selection
  const handleMetricSelect = (metric: string) => {
    setSelectedMetric(metric);
    playSound('click');
  };
  
  // Toggle filter panel
  const toggleFilter = () => {
    setIsFiltering(!isFiltering);
    playSound('click');
  };
  
  // Get date range text
  const getDateRangeText = () => {
    switch (dateRange) {
      case 'last7days':
        return 'Son 7 Gün';
      case 'last30days':
        return 'Son 30 Gün';
      case 'last90days':
        return 'Son 90 Gün';
      case 'lastYear':
        return 'Son 1 Yıl';
      case 'custom':
        return 'Özel Tarih Aralığı';
      default:
        return 'Son 30 Gün';
    }
  };
  
  // Get percentage change color
  const getChangeColor = (change: number) => {
    if (change > 0) return colors.success;
    if (change < 0) return colors.error;
    return colors.text.secondary;
  };
  
  // Get percentage change icon
  const getChangeIcon = (change: number) => {
    if (change > 15) return <ChevronsUp size={18} style={{ color: colors.success }} />;
    if (change > 0) return <ArrowUp size={18} style={{ color: colors.success }} />;
    if (change < -15) return <ChevronsDown size={18} style={{ color: colors.error }} />;
    if (change < 0) return <ArrowDown size={18} style={{ color: colors.error }} />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            Performans Takibi
          </h1>
          <p style={{ color: colors.text.secondary }}>
            SEO ve trafik metriklerinizi zaman içinde takip edin
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
      
      {/* Date Range and Filters */}
      <div 
        className="rounded-lg border p-4"
        style={{ 
          backgroundColor: colors.background.card,
          borderColor: colors.border
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Date Range Selector */}
          <div className="flex items-center space-x-4">
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === 'last7days' ? 'text-white' : ''
              }`}
              style={{ 
                backgroundColor: dateRange === 'last7days' ? colors.primary : `${colors.primary}10`,
                color: dateRange === 'last7days' ? '#fff' : colors.primary
              }}
              onClick={() => handleDateRangeChange('last7days')}
            >
              7 Gün
            </button>
            
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === 'last30days' ? 'text-white' : ''
              }`}
              style={{ 
                backgroundColor: dateRange === 'last30days' ? colors.primary : `${colors.primary}10`,
                color: dateRange === 'last30days' ? '#fff' : colors.primary
              }}
              onClick={() => handleDateRangeChange('last30days')}
            >
              30 Gün
            </button>
            
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === 'last90days' ? 'text-white' : ''
              }`}
              style={{ 
                backgroundColor: dateRange === 'last90days' ? colors.primary : `${colors.primary}10`,
                color: dateRange === 'last90days' ? '#fff' : colors.primary
              }}
              onClick={() => handleDateRangeChange('last90days')}
            >
              90 Gün
            </button>
            
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === 'lastYear' ? 'text-white' : ''
              }`}
              style={{ 
                backgroundColor: dateRange === 'lastYear' ? colors.primary : `${colors.primary}10`,
                color: dateRange === 'lastYear' ? '#fff' : colors.primary
              }}
              onClick={() => handleDateRangeChange('lastYear')}
            >
              1 Yıl
            </button>
            
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === 'custom' ? 'text-white' : ''
              }`}
              style={{ 
                backgroundColor: dateRange === 'custom' ? colors.primary : `${colors.primary}10`,
                color: dateRange === 'custom' ? '#fff' : colors.primary
              }}
              onClick={() => handleDateRangeChange('custom')}
            >
              <Calendar size={18} />
            </button>
          </div>
          
          {/* Filters Button */}
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
                <h3 
                  className="text-sm font-medium mb-3"
                  style={{ color: colors.text.primary }}
                >
                  Görünüm Ayarları
                </h3>
                
                <div className="space-y-2">
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
                    <span style={{ color: colors.text.primary }}>Organik Trafik</span>
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
                        backgroundColor: colors.secondary
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span style={{ color: colors.text.primary }}>Direct Trafik</span>
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
                        backgroundColor: colors.accent
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span style={{ color: colors.text.primary }}>Referral Trafik</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={false}
                      className="sr-only"
                    />
                    <div 
                      className="w-5 h-5 rounded flex items-center justify-center border"
                      style={{ 
                        borderColor: colors.border
                      }}
                    >
                    </div>
                    <span style={{ color: colors.text.primary }}>Sosyal Trafik</span>
                  </label>
                </div>
                
                <h3 
                  className="text-sm font-medium mt-5 mb-3"
                  style={{ color: colors.text.primary }}
                >
                  Karşılaştır
                </h3>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="comparison"
                      value="previousPeriod"
                      defaultChecked
                      className="sr-only"
                    />
                    <div 
                      className="w-5 h-5 rounded-full border flex items-center justify-center"
                      style={{ 
                        borderColor: colors.primary,
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      ></div>
                    </div>
                    <span style={{ color: colors.text.primary }}>Önceki Dönem</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="comparison"
                      value="previousYear"
                      className="sr-only"
                    />
                    <div 
                      className="w-5 h-5 rounded-full border flex items-center justify-center"
                      style={{ 
                        borderColor: colors.border,
                      }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full bg-transparent"
                      ></div>
                    </div>
                    <span style={{ color: colors.text.primary }}>Önceki Yıl</span>
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
      
      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: colors.background.card,
            borderColor: colors.border
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <div 
              className="text-sm font-medium"
              style={{ color: colors.text.secondary }}
            >
              Organik Trafik
            </div>
            {getChangeIcon(21.5)}
          </div>
          
          <div className="flex items-end space-x-2">
            <div 
              className="text-2xl font-bold"
              style={{ color: colors.text.primary }}
            >
              124,542
            </div>
            <div 
              className="text-sm font-medium"
              style={{ color: getChangeColor(21.5) }}
            >
              +21.5%
            </div>
          </div>
          
          <div 
            className="mt-4 h-1 rounded-full"
            style={{ backgroundColor: `${colors.primary}30` }}
          >
            <div 
              className="h-1 rounded-full"
              style={{ 
                backgroundColor: colors.primary,
                width: '75%'
              }}
            ></div>
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: colors.background.card,
            borderColor: colors.border
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <div 
              className="text-sm font-medium"
              style={{ color: colors.text.secondary }}
            >
              Ortalama Pozisyon
            </div>
            {getChangeIcon(-7.2)}
          </div>
          
          <div className="flex items-end space-x-2">
            <div 
              className="text-2xl font-bold"
              style={{ color: colors.text.primary }}
            >
              9.3
            </div>
            <div 
              className="text-sm font-medium"
              style={{ color: getChangeColor(-7.2) }}
            >
              -7.2%
            </div>
          </div>
          
          <div 
            className="mt-4 h-1 rounded-full"
            style={{ backgroundColor: `${colors.secondary}30` }}
          >
            <div 
              className="h-1 rounded-full"
              style={{ 
                backgroundColor: colors.secondary,
                width: '65%'
              }}
            ></div>
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: colors.background.card,
            borderColor: colors.border
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <div 
              className="text-sm font-medium"
              style={{ color: colors.text.secondary }}
            >
              Tıklama Oranı (CTR)
            </div>
            {getChangeIcon(3.8)}
          </div>
          
          <div className="flex items-end space-x-2">
            <div 
              className="text-2xl font-bold"
              style={{ color: colors.text.primary }}
            >
              4.7%
            </div>
            <div 
              className="text-sm font-medium"
              style={{ color: getChangeColor(3.8) }}
            >
              +3.8%
            </div>
          </div>
          
          <div 
            className="mt-4 h-1 rounded-full"
            style={{ backgroundColor: `${colors.accent}30` }}
          >
            <div 
              className="h-1 rounded-full"
              style={{ 
                backgroundColor: colors.accent,
                width: '45%'
              }}
            ></div>
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg border"
          style={{ 
            backgroundColor: colors.background.card,
            borderColor: colors.border
          }}
        >
          <div className="flex justify-between items-start mb-2">
            <div 
              className="text-sm font-medium"
              style={{ color: colors.text.secondary }}
            >
              Oturum Süresi
            </div>
            {getChangeIcon(12.3)}
          </div>
          
          <div className="flex items-end space-x-2">
            <div 
              className="text-2xl font-bold"
              style={{ color: colors.text.primary }}
            >
              3:42
            </div>
            <div 
              className="text-sm font-medium"
              style={{ color: getChangeColor(12.3) }}
            >
              +12.3%
            </div>
          </div>
          
          <div 
            className="mt-4 h-1 rounded-full"
            style={{ backgroundColor: `${colors.success}30` }}
          >
            <div 
              className="h-1 rounded-full"
              style={{ 
                backgroundColor: colors.success,
                width: '60%'
              }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Main Chart Section */}
      <div 
        className="rounded-lg border p-6"
        style={{ 
          backgroundColor: colors.background.card,
          borderColor: colors.border
        }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 
              className="text-lg font-bold"
              style={{ color: colors.text.primary }}
            >
              Trafik Trendi
            </h2>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              {getDateRangeText()} · Önceki dönemle karşılaştırma
            </p>
          </div>
          
          <div className="flex items-center space-x-2 mt-2 md:mt-0">
            <button
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedMetric === 'organic' ? 'text-white' : ''
              }`}
              style={{ 
                backgroundColor: selectedMetric === 'organic' ? colors.primary : `${colors.primary}10`,
                color: selectedMetric === 'organic' ? '#fff' : colors.primary
              }}
              onClick={() => handleMetricSelect('organic')}
            >
              Organik
            </button>
            
            <button
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedMetric === 'position' ? 'text-white' : ''
              }`}
              style={{ 
                backgroundColor: selectedMetric === 'position' ? colors.secondary : `${colors.secondary}10`,
                color: selectedMetric === 'position' ? '#fff' : colors.secondary
              }}
              onClick={() => handleMetricSelect('position')}
            >
              Pozisyon
            </button>
            
            <button
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedMetric === 'CTR' ? 'text-white' : ''
              }`}
              style={{ 
                backgroundColor: selectedMetric === 'CTR' ? colors.accent : `${colors.accent}10`,
                color: selectedMetric === 'CTR' ? '#fff' : colors.accent
              }}
              onClick={() => handleMetricSelect('CTR')}
            >
              CTR
            </button>
            
            <button
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedMetric === 'duration' ? 'text-white' : ''
              }`}
              style={{ 
                backgroundColor: selectedMetric === 'duration' ? colors.success : `${colors.success}10`,
                color: selectedMetric === 'duration' ? '#fff' : colors.success
              }}
              onClick={() => handleMetricSelect('duration')}
            >
              Süre
            </button>
            
            <button
              className="p-1.5 rounded-lg"
              style={{ 
                backgroundColor: `${colors.text.secondary}10`,
                color: colors.text.secondary
              }}
              onClick={() => playSound('click')}
            >
              <Maximize2 size={18} />
            </button>
          </div>
        </div>
        
        {/* Chart Placeholder */}
        <div 
          className="relative h-[400px] rounded-lg border flex items-center justify-center"
          style={{ 
            backgroundColor: colors.background.main,
            borderColor: colors.border
          }}
        >
          {/* Chart would go here in a real implementation */}
          <div className="text-center">
            <Activity size={64} style={{ color: colors.text.secondary, opacity: 0.3 }} className="mx-auto mb-4" />
            <p style={{ color: colors.text.secondary }}>
              {selectedMetric === 'organic' && "Organik trafik metriklerinin grafik gösterimi burada olacak"}
              {selectedMetric === 'position' && "Sayfa pozisyonlarının grafik gösterimi burada olacak"}
              {selectedMetric === 'CTR' && "Tıklama oranı (CTR) metriklerinin grafik gösterimi burada olacak"}
              {selectedMetric === 'duration' && "Oturum süresi metriklerinin grafik gösterimi burada olacak"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Landing Pages */}
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
              En İyi Açılış Sayfaları
            </h3>
          </div>
          
          <div className="p-2">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: colors.border }}>
                    <th className="p-2 text-left" style={{ color: colors.text.secondary }}>Sayfa</th>
                    <th className="p-2 text-left" style={{ color: colors.text.secondary }}>Oturumlar</th>
                    <th className="p-2 text-left" style={{ color: colors.text.secondary }}>Dönüşüm</th>
                    <th className="p-2 text-left" style={{ color: colors.text.secondary }}>Değişim</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b" style={{ borderColor: colors.border }}>
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="mr-2 w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary }}></div>
                        <span style={{ color: colors.text.primary }}>/ana-sayfa</span>
                      </div>
                    </td>
                    <td className="p-2" style={{ color: colors.text.primary }}>24,532</td>
                    <td className="p-2" style={{ color: colors.text.primary }}>3.8%</td>
                    <td className="p-2">
                      <div className="flex items-center" style={{ color: colors.success }}>
                        <ArrowUp size={14} className="mr-1" />
                        <span>14.2%</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: colors.border }}>
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="mr-2 w-2 h-2 rounded-full" style={{ backgroundColor: colors.secondary }}></div>
                        <span style={{ color: colors.text.primary }}>/blog/seo-tips</span>
                      </div>
                    </td>
                    <td className="p-2" style={{ color: colors.text.primary }}>18,721</td>
                    <td className="p-2" style={{ color: colors.text.primary }}>4.2%</td>
                    <td className="p-2">
                      <div className="flex items-center" style={{ color: colors.success }}>
                        <ArrowUp size={14} className="mr-1" />
                        <span>23.5%</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: colors.border }}>
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="mr-2 w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }}></div>
                        <span style={{ color: colors.text.primary }}>/urunler</span>
                      </div>
                    </td>
                    <td className="p-2" style={{ color: colors.text.primary }}>12,453</td>
                    <td className="p-2" style={{ color: colors.text.primary }}>5.7%</td>
                    <td className="p-2">
                      <div className="flex items-center" style={{ color: colors.success }}>
                        <ArrowUp size={14} className="mr-1" />
                        <span>8.1%</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: colors.border }}>
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="mr-2 w-2 h-2 rounded-full" style={{ backgroundColor: colors.success }}></div>
                        <span style={{ color: colors.text.primary }}>/hakkimizda</span>
                      </div>
                    </td>
                    <td className="p-2" style={{ color: colors.text.primary }}>9,245</td>
                    <td className="p-2" style={{ color: colors.text.primary }}>2.1%</td>
                    <td className="p-2">
                      <div className="flex items-center" style={{ color: colors.error }}>
                        <ArrowDown size={14} className="mr-1" />
                        <span>3.4%</span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="mr-2 w-2 h-2 rounded-full" style={{ backgroundColor: colors.warning }}></div>
                        <span style={{ color: colors.text.primary }}>/iletisim</span>
                      </div>
                    </td>
                    <td className="p-2" style={{ color: colors.text.primary }}>7,123</td>
                    <td className="p-2" style={{ color: colors.text.primary }}>6.2%</td>
                    <td className="p-2">
                      <div className="flex items-center" style={{ color: colors.success }}>
                        <ArrowUp size={14} className="mr-1" />
                        <span>15.8%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Top Keywords */}
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
              En İyi Anahtar Kelimeler
            </h3>
          </div>
          
          <div className="p-2">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: colors.border }}>
                    <th className="p-2 text-left" style={{ color: colors.text.secondary }}>Anahtar Kelime</th>
                    <th className="p-2 text-left" style={{ color: colors.text.secondary }}>Pozisyon</th>
                    <th className="p-2 text-left" style={{ color: colors.text.secondary }}>Tıklamalar</th>
                    <th className="p-2 text-left" style={{ color: colors.text.secondary }}>CTR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b" style={{ borderColor: colors.border }}>
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="mr-2 w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary }}></div>
                        <span style={{ color: colors.text.primary }}>seo analizi</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center" style={{ color: colors.success }}>
                        <span>3</span>
                        <ChevronRight size={14} className="ml-1 opacity-50" />
                      </div>
                    </td>
                    <td className="p-2" style={{ color: colors.text.primary }}>3,842</td>
                    <td className="p-2" style={{ color: colors.text.primary }}>5.7%</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: colors.border }}>
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="mr-2 w-2 h-2 rounded-full" style={{ backgroundColor: colors.secondary }}></div>
                        <span style={{ color: colors.text.primary }}>backlink analizi</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center" style={{ color: colors.success }}>
                        <span>4</span>
                        <ChevronRight size={14} className="ml-1 opacity-50" />
                      </div>
                    </td>
                    <td className="p-2" style={{ color: colors.text.primary }}>2,937</td>
                    <td className="p-2" style={{ color: colors.text.primary }}>4.8%</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: colors.border }}>
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="mr-2 w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }}></div>
                        <span style={{ color: colors.text.primary }}>anahtar kelime aracı</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center" style={{ color: colors.warning }}>
                        <span>9</span>
                        <ChevronRight size={14} className="ml-1 opacity-50" />
                      </div>
                    </td>
                    <td className="p-2" style={{ color: colors.text.primary }}>1,845</td>
                    <td className="p-2" style={{ color: colors.text.primary }}>3.2%</td>
                  </tr>
                  <tr className="border-b" style={{ borderColor: colors.border }}>
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="mr-2 w-2 h-2 rounded-full" style={{ backgroundColor: colors.success }}></div>
                        <span style={{ color: colors.text.primary }}>site analiz aracı</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center" style={{ color: colors.error }}>
                        <span>15</span>
                        <ChevronRight size={14} className="ml-1 opacity-50" />
                      </div>
                    </td>
                    <td className="p-2" style={{ color: colors.text.primary }}>1,324</td>
                    <td className="p-2" style={{ color: colors.text.primary }}>2.1%</td>
                  </tr>
                  <tr>
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="mr-2 w-2 h-2 rounded-full" style={{ backgroundColor: colors.warning }}></div>
                        <span style={{ color: colors.text.primary }}>ücretsiz seo aracı</span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center" style={{ color: colors.success }}>
                        <span>5</span>
                        <ChevronRight size={14} className="ml-1 opacity-50" />
                      </div>
                    </td>
                    <td className="p-2" style={{ color: colors.text.primary }}>942</td>
                    <td className="p-2" style={{ color: colors.text.primary }}>4.5%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Locations Chart */}
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
              Trafik Kaynakları
            </h3>
          </div>
          
          <div className="p-6 h-64 flex items-center justify-center">
            {/* Chart placeholder */}
            <div className="text-center">
              <BarChart size={48} style={{ color: colors.text.secondary, opacity: 0.3 }} className="mx-auto mb-3" />
              <p style={{ color: colors.text.secondary }}>
                Trafik kaynaklarının dağılımı burada gösterilecek
              </p>
            </div>
          </div>
        </div>
        
        {/* User Metrics */}
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
              Kullanıcı Metrikleri
            </h3>
          </div>
          
          <div className="grid grid-cols-2 p-2">
            <div className="p-4 border-r" style={{ borderColor: colors.border }}>
              <p className="text-center text-sm" style={{ color: colors.text.secondary }}>Yeni vs. Geri Dönen</p>
              <div className="flex items-center justify-center h-48">
                {/* Chart placeholder */}
                <div className="text-center">
                  <Users size={36} style={{ color: colors.text.secondary, opacity: 0.3 }} className="mx-auto mb-2" />
                  <p className="text-xs" style={{ color: colors.text.secondary }}>
                    Kullanıcı dağılımı grafiği burada olacak
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <p className="text-center text-sm" style={{ color: colors.text.secondary }}>Kullanıcı Davranışı</p>
              <div className="space-y-4 mt-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: colors.text.secondary }}>Hemen Çıkma Oranı</span>
                    <span style={{ color: colors.text.primary }}>42.3%</span>
                  </div>
                  <div 
                    className="h-1 rounded-full"
                    style={{ backgroundColor: `${colors.primary}20` }}
                  >
                    <div 
                      className="h-1 rounded-full"
                      style={{ 
                        backgroundColor: colors.primary,
                        width: '42.3%'
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: colors.text.secondary }}>Sayfa/Oturum</span>
                    <span style={{ color: colors.text.primary }}>3.4</span>
                  </div>
                  <div 
                    className="h-1 rounded-full"
                    style={{ backgroundColor: `${colors.secondary}20` }}
                  >
                    <div 
                      className="h-1 rounded-full"
                      style={{ 
                        backgroundColor: colors.secondary,
                        width: '65%'
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: colors.text.secondary }}>Ort. Oturum Süresi</span>
                    <span style={{ color: colors.text.primary }}>3:42</span>
                  </div>
                  <div 
                    className="h-1 rounded-full"
                    style={{ backgroundColor: `${colors.accent}20` }}
                  >
                    <div 
                      className="h-1 rounded-full"
                      style={{ 
                        backgroundColor: colors.accent,
                        width: '70%'
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: colors.text.secondary }}>Dönüşüm Oranı</span>
                    <span style={{ color: colors.text.primary }}>4.7%</span>
                  </div>
                  <div 
                    className="h-1 rounded-full"
                    style={{ backgroundColor: `${colors.success}20` }}
                  >
                    <div 
                      className="h-1 rounded-full"
                      style={{ 
                        backgroundColor: colors.success,
                        width: '47%'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTrackingPage;