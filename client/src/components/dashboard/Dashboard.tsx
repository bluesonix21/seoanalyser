import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';
import { useGame } from '../../lib/stores/useGame';
import { useAudio } from '../../lib/stores/useAudio';

// Icons
import { 
  BarChart2, 
  Link as LinkIcon, 
  Crosshair, 
  Search, 
  Activity, 
  FileText, 
  Tool, 
  FileBar,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Dashboard card animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};

const Dashboard: React.FC = () => {
  const { colors } = useTheme();
  const { seoData, backlinkData, competitorData, keywordData, performanceData } = useGame();
  const { playSound } = useAudio();
  
  // Play sound when component mounts
  useEffect(() => {
    playSound('notification');
  }, [playSound]);
  
  // Card data for the dashboard
  const cards = [
    {
      title: 'SEO Puanı',
      description: 'Sitenizin SEO performansını analiz edin',
      icon: <BarChart2 size={24} />,
      color: colors.primary,
      path: '/seo-score',
      value: seoData.score,
      suffix: '/100',
      change: '+5%',
      changeType: 'positive'
    },
    {
      title: 'Backlink Haritası',
      description: 'Backlink profilinizi görselleştirin',
      icon: <LinkIcon size={24} />,
      color: colors.secondary,
      path: '/backlink-map',
      value: backlinkData.total,
      suffix: ' bağlantı',
      change: '+24',
      changeType: 'positive'
    },
    {
      title: 'Rakip Analizi',
      description: 'Rakip siteleri izleyin ve karşılaştırın',
      icon: <Crosshair size={24} />,
      color: colors.info,
      path: '/competitor-analysis',
      value: competitorData.length,
      suffix: ' rakip',
      change: '+1',
      changeType: 'neutral'
    },
    {
      title: 'Anahtar Kelime Araştırması',
      description: 'Niş için yüksek performanslı anahtar kelimeler bulun',
      icon: <Search size={24} />,
      color: colors.accent,
      path: '/keyword-research',
      value: keywordData.length,
      suffix: ' kelime',
      change: '+3',
      changeType: 'positive'
    },
    {
      title: 'Performans Takibi',
      description: 'Sitenizin performansını zaman içinde takip edin',
      icon: <Activity size={24} />,
      color: colors.warning,
      path: '/performance-tracking',
      value: performanceData.length > 0 ? performanceData[performanceData.length - 1].visitors : 0,
      suffix: ' ziyaretçi',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'İçerik Analizi',
      description: 'SEO fırsatları için içeriğinizi analiz edin',
      icon: <FileText size={24} />,
      color: colors.success,
      path: '/content-analysis',
      value: '5',
      suffix: ' içerik',
      change: '+2',
      changeType: 'positive'
    },
    {
      title: 'Site Denetimi',
      description: 'Teknik sorunları tanımlayın ve düzeltin',
      icon: <Tool size={24} />,
      color: colors.error,
      path: '/site-audit',
      value: seoData.issues,
      suffix: ' sorun',
      change: '-3',
      changeType: 'positive'
    },
    {
      title: 'Raporlar',
      description: 'Özel SEO raporları oluşturun',
      icon: <FileBar size={24} />,
      color: '#8B5CF6',
      path: '/reports',
      value: '7',
      suffix: ' rapor',
      change: '+1',
      changeType: 'positive'
    }
  ];
  
  // SEO score circle calculation
  const seoScoreCircleSize = 120;
  const seoScoreStrokeWidth = 8;
  const seoScoreRadius = (seoScoreCircleSize - seoScoreStrokeWidth) / 2;
  const seoScoreCircumference = 2 * Math.PI * seoScoreRadius;
  const seoScoreOffset = seoScoreCircumference - (seoData.score / 100) * seoScoreCircumference;
  
  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SEO Score Card */}
        <motion.div 
          className="rounded-xl p-6 relative overflow-hidden"
          style={{ backgroundColor: colors.background.card, borderLeft: `4px solid ${colors.primary}` }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: colors.text.primary }}>
                SEO Genel Durum
              </h2>
              <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                Son 30 günlük performans
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <AlertTriangle size={16} className="mr-2" style={{ color: colors.error }} />
                  <span className="text-sm" style={{ color: colors.text.secondary }}>
                    {seoData.issues} Sorun
                  </span>
                </div>
                <div className="flex items-center">
                  <TrendingUp size={16} className="mr-2" style={{ color: colors.warning }} />
                  <span className="text-sm" style={{ color: colors.text.secondary }}>
                    {seoData.improvements} İyileştirme
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle size={16} className="mr-2" style={{ color: colors.success }} />
                  <span className="text-sm" style={{ color: colors.text.secondary }}>
                    72 Başarılı
                  </span>
                </div>
              </div>
            </div>
            
            <div className="relative flex items-center justify-center">
              <svg width={seoScoreCircleSize} height={seoScoreCircleSize} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx={seoScoreCircleSize / 2}
                  cy={seoScoreCircleSize / 2}
                  r={seoScoreRadius}
                  fill="none"
                  stroke={`${colors.border}`}
                  strokeWidth={seoScoreStrokeWidth / 2}
                />
                {/* Progress circle */}
                <circle
                  cx={seoScoreCircleSize / 2}
                  cy={seoScoreCircleSize / 2}
                  r={seoScoreRadius}
                  fill="none"
                  stroke={getScoreColor(seoData.score)}
                  strokeWidth={seoScoreStrokeWidth}
                  strokeDasharray={seoScoreCircumference}
                  strokeDashoffset={seoScoreOffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: colors.text.primary }}>{seoData.score}</span>
                <span className="text-xs" style={{ color: colors.text.secondary }}>/ 100</span>
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full opacity-10" 
            style={{ background: `radial-gradient(circle, ${colors.primary} 0%, transparent 70%)` }} 
          />
        </motion.div>
        
        {/* Backlinks Card */}
        <motion.div 
          className="rounded-xl p-6 relative overflow-hidden"
          style={{ backgroundColor: colors.background.card, borderLeft: `4px solid ${colors.secondary}` }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-xl font-bold mb-1" style={{ color: colors.text.primary }}>
            Backlink Durumu
          </h2>
          <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
            Backlink kalite dağılımı
          </p>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-3 rounded bg-white/5">
              <div className="text-2xl font-bold" style={{ color: colors.success }}>
                {backlinkData.quality.high}
              </div>
              <div className="text-xs" style={{ color: colors.text.secondary }}>
                Yüksek Kalite
              </div>
            </div>
            <div className="p-3 rounded bg-white/5">
              <div className="text-2xl font-bold" style={{ color: colors.warning }}>
                {backlinkData.quality.medium}
              </div>
              <div className="text-xs" style={{ color: colors.text.secondary }}>
                Orta Kalite
              </div>
            </div>
            <div className="p-3 rounded bg-white/5">
              <div className="text-2xl font-bold" style={{ color: colors.error }}>
                {backlinkData.quality.low}
              </div>
              <div className="text-xs" style={{ color: colors.text.secondary }}>
                Düşük Kalite
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                Toplam Backlink
              </div>
              <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                {backlinkData.total}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                Toplam Domain
              </div>
              <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                {backlinkData.domains}
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full opacity-10" 
            style={{ background: `radial-gradient(circle, ${colors.secondary} 0%, transparent 70%)` }} 
          />
        </motion.div>
        
        {/* Keywords Card */}
        <motion.div 
          className="rounded-xl p-6 relative overflow-hidden"
          style={{ backgroundColor: colors.background.card, borderLeft: `4px solid ${colors.accent}` }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-bold mb-1" style={{ color: colors.text.primary }}>
            Anahtar Kelime Durumu
          </h2>
          <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
            İlk 10 anahtar kelime performansı
          </p>
          
          <div className="space-y-3">
            {keywordData.slice(0, 3).map((keyword, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getPositionColor(keyword.position) }}
                  />
                  <span className="text-sm truncate max-w-[150px]" style={{ color: colors.text.primary }}>
                    {keyword.keyword}
                  </span>
                </div>
                <div className="flex items-center">
                  {keyword.position ? (
                    <span className="text-sm font-medium" style={{ color: getPositionColor(keyword.position) }}>
                      #{keyword.position}
                    </span>
                  ) : (
                    <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                      --
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.border }}>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                  İlk 10'da
                </div>
                <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                  {keywordData.filter(k => k.position !== null && k.position <= 10).length}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                  Toplam Anahtar Kelime
                </div>
                <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                  {keywordData.length}
                </div>
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full opacity-10" 
            style={{ background: `radial-gradient(circle, ${colors.accent} 0%, transparent 70%)` }} 
          />
        </motion.div>
      </section>
      
      {/* Main Cards */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            SEO Araçları
          </h2>
          <Link 
            to="/ai-assistant"
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{ 
              backgroundColor: `${colors.primary}20`, 
              color: colors.primary 
            }}
            onMouseEnter={() => playSound('hover')}
            onClick={() => playSound('click')}
          >
            <span>AI Asistanı</span>
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              →
            </motion.div>
          </Link>
        </div>
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {cards.map((card, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="rounded-xl overflow-hidden relative"
              style={{ backgroundColor: colors.background.card }}
              onMouseEnter={() => playSound('hover')}
              onClick={() => playSound('click')}
            >
              <Link to={card.path} className="block p-6">
                <div className="mb-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${card.color}20`, color: card.color }}
                  >
                    {card.icon}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mb-1" style={{ color: colors.text.primary }}>
                  {card.title}
                </h3>
                <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                  {card.description}
                </p>
                
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
                      {card.value}
                      <span className="text-sm ml-1" style={{ color: colors.text.secondary }}>
                        {card.suffix}
                      </span>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
                      card.changeType === 'positive' ? 'bg-green-500/10' :
                      card.changeType === 'negative' ? 'bg-red-500/10' : 'bg-gray-500/10'
                    }`}
                    style={{ 
                      color: card.changeType === 'positive' ? colors.success :
                             card.changeType === 'negative' ? colors.error : colors.text.secondary 
                    }}
                  >
                    {card.change}
                  </div>
                </div>
                
                {/* Decorative corner */}
                <div className="absolute bottom-0 right-0 w-24 h-24 rounded-tl-full opacity-10" style={{ background: card.color }} />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
};

// Helper function to get score color
const getScoreColor = (score: number) => {
  if (score >= 80) return '#0cdf9a'; // Success
  if (score >= 50) return '#ffb347'; // Warning
  return '#ff5e5e'; // Error
};

// Helper function to get position color
const getPositionColor = (position: number | null) => {
  if (!position) return '#8B5CF6'; // No position
  if (position <= 3) return '#0cdf9a'; // Top 3
  if (position <= 10) return '#ffb347'; // Top 10
  return '#ff5e5e'; // Above 10
};

export default Dashboard;