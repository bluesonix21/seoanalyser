import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useAudio } from '../../lib/stores/useAudio';

// Icons
import { 
  FileType, 
  Download, 
  Calendar, 
  Share2, 
  Eye, 
  Trash2, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  BarChart2, 
  Printer, 
  FileText,
  BarChart,
  PieChart,
  LineChart,
  Mail
} from 'lucide-react';

// Report interface
interface Report {
  id: string;
  title: string;
  description: string;
  type: 'seo' | 'backlinks' | 'keywords' | 'content' | 'competitors' | 'performance';
  createdAt: string;
  status: 'ready' | 'scheduled' | 'generating';
  format: 'pdf' | 'csv' | 'excel';
  schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients?: string[];
}

// Mock reports data
const reports: Report[] = [
  {
    id: '1',
    title: 'SEO Performance Monthly Report',
    description: 'Comprehensive SEO performance report including rankings, traffic, and key metrics',
    type: 'seo',
    createdAt: '2023-05-20T10:30:00',
    status: 'ready',
    format: 'pdf',
    schedule: 'monthly',
    recipients: ['john@example.com', 'maria@example.com']
  },
  {
    id: '2',
    title: 'Backlink Analysis Q2 2023',
    description: 'Analysis of backlink profile with quality assessment and recommendations',
    type: 'backlinks',
    createdAt: '2023-04-15T14:45:00',
    status: 'ready',
    format: 'pdf'
  },
  {
    id: '3',
    title: 'Keyword Performance Report',
    description: 'Detailed report on keyword rankings and performance over time',
    type: 'keywords',
    createdAt: '2023-05-10T09:15:00',
    status: 'ready',
    format: 'excel',
    schedule: 'weekly',
    recipients: ['marketing@example.com']
  },
  {
    id: '4',
    title: 'Content Optimization Report',
    description: 'Analysis of content performance with recommendations for improvements',
    type: 'content',
    createdAt: '2023-05-05T11:20:00',
    status: 'ready',
    format: 'pdf'
  },
  {
    id: '5',
    title: 'Competitor Analysis Report',
    description: 'Detailed comparison with top 5 competitors in the industry',
    type: 'competitors',
    createdAt: '2023-04-28T16:30:00',
    status: 'ready',
    format: 'pdf',
    schedule: 'quarterly',
    recipients: ['executive@example.com', 'marketing@example.com']
  },
  {
    id: '6',
    title: 'Daily Performance Update',
    description: 'Quick summary of key SEO metrics and performance indicators',
    type: 'performance',
    createdAt: '2023-05-22T08:00:00',
    status: 'scheduled',
    format: 'pdf',
    schedule: 'daily',
    recipients: ['team@example.com']
  },
  {
    id: '7',
    title: 'Technical SEO Audit Report',
    description: 'Comprehensive audit of technical SEO factors affecting your website',
    type: 'seo',
    createdAt: '2023-05-21T15:45:00',
    status: 'generating',
    format: 'pdf'
  }
];

const ReportsPage: React.FC = () => {
  const { colors } = useTheme();
  const { playSound } = useAudio();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  
  // Filter reports based on active filter
  const filteredReports = reports.filter(report => 
    activeFilter === null || report.type === activeFilter
  );
  
  // Toggle report expansion
  const toggleReportExpansion = (id: string) => {
    setExpandedReport(expandedReport === id ? null : id);
    playSound('click');
  };
  
  // Set active filter
  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter);
    playSound('click');
  };
  
  // Toggle create report form
  const toggleCreateReport = () => {
    setIsCreatingReport(!isCreatingReport);
    playSound('click');
  };
  
  // Get icon based on report type
  const getReportIcon = (type: string) => {
    switch (type) {
      case 'seo':
        return <BarChart2 size={18} style={{ color: colors.primary }} />;
      case 'backlinks':
        return <PieChart size={18} style={{ color: colors.secondary }} />;
      case 'keywords':
        return <BarChart size={18} style={{ color: colors.accent }} />;
      case 'content':
        return <FileText size={18} style={{ color: colors.success }} />;
      case 'competitors':
        return <BarChart size={18} style={{ color: colors.warning }} />;
      case 'performance':
        return <LineChart size={18} style={{ color: colors.info }} />;
      default:
        return <FileType size={18} style={{ color: colors.primary }} />;
    }
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return colors.success;
      case 'scheduled':
        return colors.info;
      case 'generating':
        return colors.warning;
      default:
        return colors.text.secondary;
    }
  };
  
  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Hazır';
      case 'scheduled':
        return 'Planlandı';
      case 'generating':
        return 'Oluşturuluyor';
      default:
        return 'Bilinmiyor';
    }
  };
  
  // Get report type text
  const getReportTypeText = (type: string) => {
    switch (type) {
      case 'seo':
        return 'SEO Raporu';
      case 'backlinks':
        return 'Backlink Raporu';
      case 'keywords':
        return 'Anahtar Kelime Raporu';
      case 'content':
        return 'İçerik Raporu';
      case 'competitors':
        return 'Rakip Analizi';
      case 'performance':
        return 'Performans Raporu';
      default:
        return 'Diğer';
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get schedule text
  const getScheduleText = (schedule?: string) => {
    if (!schedule) return 'Bir kerelik';
    
    switch (schedule) {
      case 'daily':
        return 'Günlük';
      case 'weekly':
        return 'Haftalık';
      case 'monthly':
        return 'Aylık';
      case 'quarterly':
        return 'Üç Aylık';
      default:
        return 'Özel';
    }
  };
  
  // Count ready reports
  const readyReportsCount = reports.filter(r => r.status === 'ready').length;
  
  // Count scheduled reports
  const scheduledReportsCount = reports.filter(r => r.status === 'scheduled').length;
  
  // Count generating reports
  const generatingReportsCount = reports.filter(r => r.status === 'generating').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            Raporlar
          </h1>
          <p style={{ color: colors.text.secondary }}>
            Özel SEO raporları oluşturun, planlayın ve paylaşın
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: colors.primary, color: '#fff' }}
            onClick={toggleCreateReport}
          >
            <Plus size={18} />
            <span>{isCreatingReport ? 'İptal' : 'Yeni Rapor'}</span>
          </button>
        </div>
      </div>
      
      {/* Report Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          className="p-4 rounded-lg flex items-center space-x-4"
          style={{ backgroundColor: colors.background.card }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.success}20`, color: colors.success }}
          >
            <FileType size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>Hazır Raporlar</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{readyReportsCount}</h3>
          </div>
        </div>
        
        <div 
          className="p-4 rounded-lg flex items-center space-x-4"
          style={{ backgroundColor: colors.background.card }}
        >
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${colors.info}20`, color: colors.info }}
          >
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>Planlanmış Raporlar</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{scheduledReportsCount}</h3>
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
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm" style={{ color: colors.text.secondary }}>Oluşturuluyor</p>
            <h3 className="text-2xl font-bold" style={{ color: colors.text.primary }}>{generatingReportsCount}</h3>
          </div>
        </div>
      </div>
      
      {/* Create Report Form */}
      {isCreatingReport && (
        <div 
          className="rounded-lg border p-6"
          style={{ 
            backgroundColor: colors.background.card,
            borderColor: colors.border
          }}
        >
          <h2 
            className="text-lg font-bold mb-4"
            style={{ color: colors.text.primary }}
          >
            Yeni Rapor Oluştur
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text.secondary }}
                >
                  Rapor Başlığı
                </label>
                <input
                  type="text"
                  className="w-full p-3 rounded-lg bg-transparent border"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.text.primary
                  }}
                  placeholder="Rapor başlığı girin..."
                />
              </div>
              
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text.secondary }}
                >
                  Açıklama
                </label>
                <textarea
                  className="w-full p-3 rounded-lg bg-transparent border"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.text.primary
                  }}
                  placeholder="Rapor açıklaması..."
                  rows={3}
                />
              </div>
              
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text.secondary }}
                >
                  Rapor Türü
                </label>
                <select
                  className="w-full p-3 rounded-lg bg-transparent border"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.text.primary
                  }}
                >
                  <option value="seo" style={{ backgroundColor: colors.background.main }}>SEO Raporu</option>
                  <option value="backlinks" style={{ backgroundColor: colors.background.main }}>Backlink Raporu</option>
                  <option value="keywords" style={{ backgroundColor: colors.background.main }}>Anahtar Kelime Raporu</option>
                  <option value="content" style={{ backgroundColor: colors.background.main }}>İçerik Raporu</option>
                  <option value="competitors" style={{ backgroundColor: colors.background.main }}>Rakip Analizi</option>
                  <option value="performance" style={{ backgroundColor: colors.background.main }}>Performans Raporu</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text.secondary }}
                >
                  Format
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
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
                    <span style={{ color: colors.text.primary }}>PDF</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value="excel"
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
                    <span style={{ color: colors.text.primary }}>Excel</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value="csv"
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
                    <span style={{ color: colors.text.primary }}>CSV</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text.secondary }}
                >
                  Planlama
                </label>
                <select
                  className="w-full p-3 rounded-lg bg-transparent border"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.text.primary
                  }}
                >
                  <option value="once" style={{ backgroundColor: colors.background.main }}>Bir kerelik</option>
                  <option value="daily" style={{ backgroundColor: colors.background.main }}>Günlük</option>
                  <option value="weekly" style={{ backgroundColor: colors.background.main }}>Haftalık</option>
                  <option value="monthly" style={{ backgroundColor: colors.background.main }}>Aylık</option>
                  <option value="quarterly" style={{ backgroundColor: colors.background.main }}>Üç Aylık</option>
                </select>
              </div>
              
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text.secondary }}
                >
                  E-posta Alıcıları (opsiyonel)
                </label>
                <input
                  type="text"
                  className="w-full p-3 rounded-lg bg-transparent border"
                  style={{ 
                    borderColor: colors.border,
                    color: colors.text.primary
                  }}
                  placeholder="ad@ornek.com, ad2@ornek.com"
                />
                <p 
                  className="mt-1 text-xs"
                  style={{ color: colors.text.secondary }}
                >
                  Birden fazla e-posta adresi için virgülle ayırın
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              className="flex items-center space-x-2 px-6 py-3 rounded-lg"
              style={{ 
                backgroundColor: colors.primary,
                color: '#fff'
              }}
              onClick={() => {
                toggleCreateReport();
                playSound('click');
              }}
            >
              <FileType size={18} />
              <span>Rapor Oluştur</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Report Filters */}
      <div 
        className="rounded-lg border p-4"
        style={{ 
          backgroundColor: colors.background.card,
          borderColor: colors.border
        }}
      >
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeFilter === null ? 'text-white' : ''
            }`}
            style={{ 
              backgroundColor: activeFilter === null ? colors.primary : `${colors.primary}10`,
              color: activeFilter === null ? '#fff' : colors.primary
            }}
            onClick={() => handleFilterChange(null)}
          >
            Tümü
          </button>
          
          <button
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeFilter === 'seo' ? 'text-white' : ''
            }`}
            style={{ 
              backgroundColor: activeFilter === 'seo' ? colors.primary : `${colors.primary}10`,
              color: activeFilter === 'seo' ? '#fff' : colors.primary
            }}
            onClick={() => handleFilterChange('seo')}
          >
            <BarChart2 size={16} />
            <span>SEO Raporları</span>
          </button>
          
          <button
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeFilter === 'backlinks' ? 'text-white' : ''
            }`}
            style={{ 
              backgroundColor: activeFilter === 'backlinks' ? colors.secondary : `${colors.secondary}10`,
              color: activeFilter === 'backlinks' ? '#fff' : colors.secondary
            }}
            onClick={() => handleFilterChange('backlinks')}
          >
            <PieChart size={16} />
            <span>Backlink Raporları</span>
          </button>
          
          <button
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeFilter === 'keywords' ? 'text-white' : ''
            }`}
            style={{ 
              backgroundColor: activeFilter === 'keywords' ? colors.accent : `${colors.accent}10`,
              color: activeFilter === 'keywords' ? '#fff' : colors.accent
            }}
            onClick={() => handleFilterChange('keywords')}
          >
            <BarChart size={16} />
            <span>Anahtar Kelime</span>
          </button>
          
          <button
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeFilter === 'content' ? 'text-white' : ''
            }`}
            style={{ 
              backgroundColor: activeFilter === 'content' ? colors.success : `${colors.success}10`,
              color: activeFilter === 'content' ? '#fff' : colors.success
            }}
            onClick={() => handleFilterChange('content')}
          >
            <FileText size={16} />
            <span>İçerik</span>
          </button>
          
          <button
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              activeFilter === 'performance' ? 'text-white' : ''
            }`}
            style={{ 
              backgroundColor: activeFilter === 'performance' ? colors.info : `${colors.info}10`,
              color: activeFilter === 'performance' ? '#fff' : colors.info
            }}
            onClick={() => handleFilterChange('performance')}
          >
            <LineChart size={16} />
            <span>Performans</span>
          </button>
        </div>
      </div>
      
      {/* Reports List */}
      <div 
        className="rounded-lg border overflow-hidden"
        style={{ 
          backgroundColor: colors.background.card,
          borderColor: colors.border
        }}
      >
        {filteredReports.length > 0 ? (
          <div className="divide-y" style={{ borderColor: colors.border }}>
            {filteredReports.map((report) => (
              <div 
                key={report.id} 
                className="border-b last:border-b-0" 
                style={{ borderColor: colors.border }}
              >
                {/* Report Header */}
                <div 
                  className={`p-4 flex items-start justify-between cursor-pointer transition-colors ${
                    expandedReport === report.id ? 'bg-white/5' : 'hover:bg-white/5'
                  }`}
                  onClick={() => toggleReportExpansion(report.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${colors.background.main}` }}
                    >
                      {getReportIcon(report.type)}
                    </div>
                    
                    <div>
                      <div className="flex items-center">
                        <h3 
                          className="font-medium mr-3"
                          style={{ color: colors.text.primary }}
                        >
                          {report.title}
                        </h3>
                        <div 
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ 
                            backgroundColor: `${getStatusColor(report.status)}20`,
                            color: getStatusColor(report.status)
                          }}
                        >
                          {getStatusText(report.status)}
                        </div>
                      </div>
                      <p 
                        className="text-sm mt-1"
                        style={{ color: colors.text.secondary }}
                      >
                        {report.description}
                      </p>
                      <div className="flex items-center mt-2 text-sm space-x-4">
                        <div style={{ color: colors.text.secondary }}>
                          <span className="opacity-70">Tür:</span>{' '}
                          {getReportTypeText(report.type)}
                        </div>
                        <div style={{ color: colors.text.secondary }}>
                          <span className="opacity-70">Oluşturulma:</span>{' '}
                          {formatDate(report.createdAt)}
                        </div>
                        <div style={{ color: colors.text.secondary }}>
                          <span className="opacity-70">Format:</span>{' '}
                          {report.format.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {report.status === 'ready' && (
                      <div className="flex space-x-1 mr-4">
                        <button 
                          className="p-2 rounded hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound('click');
                          }}
                        >
                          <Download size={18} style={{ color: colors.primary }} />
                        </button>
                        <button 
                          className="p-2 rounded hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound('click');
                          }}
                        >
                          <Share2 size={18} style={{ color: colors.secondary }} />
                        </button>
                      </div>
                    )}
                    
                    {expandedReport === report.id ? (
                      <ChevronDown size={18} style={{ color: colors.text.secondary }} />
                    ) : (
                      <ChevronRight size={18} style={{ color: colors.text.secondary }} />
                    )}
                  </div>
                </div>
                
                {/* Expanded Report Details */}
                {expandedReport === report.id && (
                  <div className="p-4 bg-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 
                          className="text-sm font-medium mb-3"
                          style={{ color: colors.text.primary }}
                        >
                          Rapor Detayları
                        </h4>
                        
                        <div 
                          className="p-4 rounded-lg"
                          style={{ backgroundColor: colors.background.main }}
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p 
                                className="text-xs"
                                style={{ color: colors.text.secondary }}
                              >
                                Tür
                              </p>
                              <p 
                                className="font-medium"
                                style={{ color: colors.text.primary }}
                              >
                                {getReportTypeText(report.type)}
                              </p>
                            </div>
                            <div>
                              <p 
                                className="text-xs"
                                style={{ color: colors.text.secondary }}
                              >
                                Format
                              </p>
                              <p 
                                className="font-medium"
                                style={{ color: colors.text.primary }}
                              >
                                {report.format.toUpperCase()}
                              </p>
                            </div>
                            <div>
                              <p 
                                className="text-xs"
                                style={{ color: colors.text.secondary }}
                              >
                                Durum
                              </p>
                              <p 
                                className="font-medium"
                                style={{ color: getStatusColor(report.status) }}
                              >
                                {getStatusText(report.status)}
                              </p>
                            </div>
                            <div>
                              <p 
                                className="text-xs"
                                style={{ color: colors.text.secondary }}
                              >
                                Oluşturulma
                              </p>
                              <p 
                                className="font-medium"
                                style={{ color: colors.text.primary }}
                              >
                                {formatDate(report.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 
                          className="text-sm font-medium mb-3"
                          style={{ color: colors.text.primary }}
                        >
                          Planlama ve Dağıtım
                        </h4>
                        
                        <div 
                          className="p-4 rounded-lg"
                          style={{ backgroundColor: colors.background.main }}
                        >
                          <div className="mb-4">
                            <p 
                              className="text-xs mb-1"
                              style={{ color: colors.text.secondary }}
                            >
                              Zamanlama
                            </p>
                            <p 
                              className="font-medium"
                              style={{ color: colors.text.primary }}
                            >
                              {getScheduleText(report.schedule)}
                            </p>
                          </div>
                          
                          {report.recipients && report.recipients.length > 0 && (
                            <div>
                              <p 
                                className="text-xs mb-1"
                                style={{ color: colors.text.secondary }}
                              >
                                Alıcılar
                              </p>
                              <div className="space-y-1">
                                {report.recipients.map((recipient, index) => (
                                  <div 
                                    key={index}
                                    className="flex items-center"
                                  >
                                    <Mail 
                                      size={14} 
                                      className="mr-2" 
                                      style={{ color: colors.text.secondary }} 
                                    />
                                    <span style={{ color: colors.text.primary }}>
                                      {recipient}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-end mt-4 space-x-3">
                      {report.status === 'ready' && (
                        <>
                          <button
                            className="px-3 py-2 rounded-lg flex items-center text-sm"
                            style={{ 
                              backgroundColor: `${colors.info}10`,
                              color: colors.info
                            }}
                            onClick={() => playSound('click')}
                          >
                            <Printer size={16} className="mr-1.5" />
                            <span>Yazdır</span>
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
                            <Download size={16} className="mr-1.5" />
                            <span>İndir</span>
                          </button>
                        </>
                      )}
                      
                      {(report.status === 'scheduled' || report.status === 'generating') && (
                        <button
                          className="px-3 py-2 rounded-lg flex items-center text-sm"
                          style={{ 
                            backgroundColor: `${colors.error}10`,
                            color: colors.error
                          }}
                          onClick={() => playSound('click')}
                        >
                          <Trash2 size={16} className="mr-1.5" />
                          <span>İptal Et</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <FileType size={48} style={{ color: colors.text.secondary, opacity: 0.3 }} className="mx-auto mb-4" />
            <h3 
              className="text-lg font-medium mb-2"
              style={{ color: colors.text.primary }}
            >
              Rapor Bulunamadı
            </h3>
            <p style={{ color: colors.text.secondary }}>
              {activeFilter ? 
                `${getReportTypeText(activeFilter)} türünde rapor bulunamadı.` : 
                'Henüz rapor oluşturulmamış.'}
            </p>
            <button
              className="mt-4 px-4 py-2 rounded-lg inline-flex items-center"
              style={{ 
                backgroundColor: colors.primary,
                color: '#fff'
              }}
              onClick={toggleCreateReport}
            >
              <Plus size={18} className="mr-2" />
              <span>Yeni Rapor Oluştur</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;