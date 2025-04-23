import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useAudio } from '../../lib/stores/useAudio';

// Icons
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  ExternalLink,
  Book,
  FileText,
  MessageSquare,
  Video,
  Coffee
} from 'lucide-react';

// FAQ items
interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    question: 'NovaSEO nedir?',
    answer: 'NovaSEO, web sitelerinizin arama motoru optimizasyonunu (SEO) analiz etmek, izlemek ve iyileştirmek için kullanılan kapsamlı bir araçtır. SEO puanı hesaplama, backlink analizi, rakip analizi, anahtar kelime araştırması ve daha fazlası gibi özellikler sunar.',
    category: 'genel'
  },
  {
    id: '2',
    question: 'SEO puanı nasıl hesaplanır?',
    answer: 'SEO puanı, web sitenizin çeşitli faktörlerine dayanarak hesaplanır: sayfa yükleme hızı, mobil uyumluluk, meta açıklamaları, başlık etiketleri, içerik kalitesi, site yapısı, backlink profili ve daha fazlası. Her faktör belirli bir ağırlığa sahiptir ve genel puan 100 üzerinden hesaplanır.',
    category: 'teknik'
  },
  {
    id: '3',
    question: 'Backlink haritası ne işe yarar?',
    answer: 'Backlink haritası, web sitenize bağlantı veren tüm domainleri görsel olarak gösterir. Bu, backlink profilinizi daha iyi anlamanıza, kaliteli ve düşük kaliteli bağlantıları belirlemenize ve backlink stratejinizi geliştirmenize yardımcı olur.',
    category: 'teknik'
  },
  {
    id: '4',
    question: 'NovaSEO\'nun AI Asistanı ne yapabilir?',
    answer: 'AI Asistanı, SEO stratejileri geliştirme, teknik sorunları tanımlama, içerik optimizasyonu önerileri sunma ve SEO ile ilgili sorularınızı yanıtlama konularında yardımcı olabilir. SEO verilerinizi analiz ederek kişiselleştirilmiş tavsiyeler sunar.',
    category: 'genel'
  },
  {
    id: '5',
    question: 'Rakiplerimi nasıl analiz edebilirim?',
    answer: 'Rakip Analizi sayfasını kullanarak rakiplerinizin SEO performansını izleyebilirsiniz. Burada, rakiplerinizin anahtar kelime sıralamaları, domain otoriteleri, backlink profilleri, içerik stratejileri ve sosyal medya etkileri hakkında bilgi edinebilirsiniz.',
    category: 'kullanım'
  },
  {
    id: '6',
    question: 'NovaSEO hangi dilleri destekliyor?',
    answer: 'NovaSEO şu anda Türkçe, İngilizce, Arapça, Rusça ve Çince dillerini desteklemektedir. Ayarlar sayfasından tercih ettiğiniz dili seçebilirsiniz.',
    category: 'genel'
  },
  {
    id: '7',
    question: 'Raporları dışa aktarabilir miyim?',
    answer: 'Evet, NovaSEO\'da oluşturduğunuz tüm raporları PDF, CSV veya Excel formatlarında dışa aktarabilirsiniz. Her rapor sayfasında bir "İndir" veya "Dışa Aktar" butonu bulunmaktadır.',
    category: 'kullanım'
  },
  {
    id: '8',
    question: 'Anahtar kelime araştırması nasıl yapılır?',
    answer: 'Anahtar Kelime Araştırması sayfasını kullanarak nişinizle ilgili en iyi anahtar kelimeleri bulabilirsiniz. Anahtar kelime zorluğu, arama hacmi, tıklama başına maliyet (CPC) ve rekabet bilgilerini görebilirsiniz. Ayrıca, uzun kuyruklu anahtar kelime önerileri de alabilirsiniz.',
    category: 'kullanım'
  },
  {
    id: '9',
    question: 'Site denetimi ne sıklıkla yapmalıyım?',
    answer: 'Sitenizin boyutuna ve değişiklik sıklığına bağlı olarak ayda en az bir kez site denetimi yapmanız önerilir. Büyük güncellemelerden sonra ek denetimler yapabilirsiniz. Otomatik denetim planı oluşturmak için Ayarlar sayfasını kullanabilirsiniz.',
    category: 'teknik'
  },
  {
    id: '10',
    question: 'Yardıma ihtiyacım olduğunda ne yapmalıyım?',
    answer: 'Yardıma ihtiyacınız olduğunda AI Asistanı\'nı kullanabilir, Yardım Merkezi\'ni ziyaret edebilir veya destek ekibimizle iletişime geçebilirsiniz. Ayrıca detaylı belgelendirmeye ve video eğitimlerine web sitemizden ulaşabilirsiniz.',
    category: 'genel'
  }
];

const HelpPage: React.FC = () => {
  const { colors } = useTheme();
  const { playSound } = useAudio();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Toggle FAQ item expansion
  const toggleItem = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
    playSound('click');
  };
  
  // Filter FAQ items based on search query and category
  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === null || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Select category
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    playSound('click');
  };
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
          Yardım ve Belgeler
        </h1>
        <p style={{ color: colors.text.secondary }}>
          NovaSEO'yu nasıl kullanacağınızı öğrenin ve sık sorulan sorulara yanıt bulun
        </p>
      </div>
      
      {/* Help Overview Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Documentation */}
        <motion.a
          href="#"
          className="block rounded-xl p-6 relative overflow-hidden"
          style={{ backgroundColor: colors.background.card }}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            e.preventDefault();
            playSound('click');
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
        >
          <div className="flex items-start space-x-4">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Book size={24} style={{ color: colors.primary }} />
            </div>
            <div>
              <h2 
                className="text-lg font-bold mb-2"
                style={{ color: colors.text.primary }}
              >
                Belgeler
              </h2>
              <p 
                className="text-sm mb-4"
                style={{ color: colors.text.secondary }}
              >
                NovaSEO'nun tüm özellikleri ve fonksiyonları hakkında detaylı kılavuzlara göz atın
              </p>
              <div className="flex items-center text-sm" style={{ color: colors.primary }}>
                <span>Belgelere Git</span>
                <ExternalLink size={14} className="ml-1" />
              </div>
            </div>
          </div>
        </motion.a>
        
        {/* Video Tutorials */}
        <motion.a
          href="#"
          className="block rounded-xl p-6 relative overflow-hidden"
          style={{ backgroundColor: colors.background.card }}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            e.preventDefault();
            playSound('click');
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } }}
        >
          <div className="flex items-start space-x-4">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${colors.secondary}15` }}
            >
              <Video size={24} style={{ color: colors.secondary }} />
            </div>
            <div>
              <h2 
                className="text-lg font-bold mb-2"
                style={{ color: colors.text.primary }}
              >
                Video Eğitimleri
              </h2>
              <p 
                className="text-sm mb-4"
                style={{ color: colors.text.secondary }}
              >
                NovaSEO'nun nasıl kullanılacağını gösteren video eğitimlerimizi izleyin
              </p>
              <div className="flex items-center text-sm" style={{ color: colors.secondary }}>
                <span>Videoları İzle</span>
                <ExternalLink size={14} className="ml-1" />
              </div>
            </div>
          </div>
        </motion.a>
        
        {/* Contact Support */}
        <motion.a
          href="#"
          className="block rounded-xl p-6 relative overflow-hidden"
          style={{ backgroundColor: colors.background.card }}
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            e.preventDefault();
            playSound('click');
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.2 } }}
        >
          <div className="flex items-start space-x-4">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${colors.accent}15` }}
            >
              <MessageSquare size={24} style={{ color: colors.accent }} />
            </div>
            <div>
              <h2 
                className="text-lg font-bold mb-2"
                style={{ color: colors.text.primary }}
              >
                Destek
              </h2>
              <p 
                className="text-sm mb-4"
                style={{ color: colors.text.secondary }}
              >
                Sorunlarınız için destek ekibimizle iletişime geçin veya topluluğumuza katılın
              </p>
              <div className="flex items-center text-sm" style={{ color: colors.accent }}>
                <span>Destek Al</span>
                <ExternalLink size={14} className="ml-1" />
              </div>
            </div>
          </div>
        </motion.a>
      </div>
      
      {/* FAQ Section */}
      <div 
        className="rounded-xl overflow-hidden border"
        style={{ 
          backgroundColor: colors.background.card,
          borderColor: colors.border
        }}
      >
        <div className="p-6 border-b" style={{ borderColor: colors.border }}>
          <h2 
            className="text-xl font-bold mb-6"
            style={{ color: colors.text.primary }}
          >
            Sık Sorulan Sorular
          </h2>
          
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Soru veya anahtar kelime ara..."
                value={searchQuery}
                onChange={handleSearch}
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
            
            <div className="flex space-x-2">
              <button
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === null ? 'border-2' : 'border'
                }`}
                style={{ 
                  borderColor: selectedCategory === null ? colors.primary : colors.border,
                  backgroundColor: selectedCategory === null ? `${colors.primary}10` : 'transparent',
                  color: selectedCategory === null ? colors.primary : colors.text.secondary 
                }}
                onClick={() => handleCategorySelect(null)}
              >
                Tümü
              </button>
              
              <button
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === 'genel' ? 'border-2' : 'border'
                }`}
                style={{ 
                  borderColor: selectedCategory === 'genel' ? colors.primary : colors.border,
                  backgroundColor: selectedCategory === 'genel' ? `${colors.primary}10` : 'transparent',
                  color: selectedCategory === 'genel' ? colors.primary : colors.text.secondary 
                }}
                onClick={() => handleCategorySelect('genel')}
              >
                Genel
              </button>
              
              <button
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === 'teknik' ? 'border-2' : 'border'
                }`}
                style={{ 
                  borderColor: selectedCategory === 'teknik' ? colors.primary : colors.border,
                  backgroundColor: selectedCategory === 'teknik' ? `${colors.primary}10` : 'transparent',
                  color: selectedCategory === 'teknik' ? colors.primary : colors.text.secondary 
                }}
                onClick={() => handleCategorySelect('teknik')}
              >
                Teknik
              </button>
              
              <button
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === 'kullanım' ? 'border-2' : 'border'
                }`}
                style={{ 
                  borderColor: selectedCategory === 'kullanım' ? colors.primary : colors.border,
                  backgroundColor: selectedCategory === 'kullanım' ? `${colors.primary}10` : 'transparent',
                  color: selectedCategory === 'kullanım' ? colors.primary : colors.text.secondary 
                }}
                onClick={() => handleCategorySelect('kullanım')}
              >
                Kullanım
              </button>
            </div>
          </div>
        </div>
        
        {/* FAQ List */}
        <div>
          {filteredFAQs.length > 0 ? (
            <div className="divide-y" style={{ borderColor: colors.border }}>
              {filteredFAQs.map((item) => (
                <div key={item.id} style={{ borderColor: colors.border }}>
                  <button
                    className={`w-full p-6 text-left flex items-center justify-between ${
                      expandedItem === item.id ? 'bg-black/5' : ''
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <HelpCircle size={16} style={{ color: colors.primary }} />
                      </div>
                      <h3 
                        className="font-medium"
                        style={{ color: colors.text.primary }}
                      >
                        {item.question}
                      </h3>
                    </div>
                    {expandedItem === item.id ? (
                      <ChevronDown style={{ color: colors.text.secondary }} />
                    ) : (
                      <ChevronRight style={{ color: colors.text.secondary }} />
                    )}
                  </button>
                  
                  {expandedItem === item.id && (
                    <div className="px-6 pb-6">
                      <div className="ml-11">
                        <p 
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {item.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="flex justify-center mb-4">
                <Coffee size={48} style={{ color: colors.text.secondary, opacity: 0.3 }} />
              </div>
              <h3 
                className="text-lg font-medium mb-2"
                style={{ color: colors.text.primary }}
              >
                Sonuç bulunamadı
              </h3>
              <p style={{ color: colors.text.secondary }}>
                Aramanızla eşleşen soru bulunamadı. Lütfen farklı anahtar kelimeler deneyin veya destek ekibimizle iletişime geçin.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Contact CTA */}
      <div 
        className="rounded-xl p-6 relative overflow-hidden border"
        style={{ 
          backgroundColor: `${colors.primary}10`,
          borderColor: `${colors.primary}30`
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 
            className="text-xl font-bold mb-3"
            style={{ color: colors.text.primary }}
          >
            Aradığınızı bulamadınız mı?
          </h2>
          <p 
            className="mb-6"
            style={{ color: colors.text.secondary }}
          >
            Sorularınız için destek ekibimize ulaşabilir veya AI Asistanımızdan yardım alabilirsiniz.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              className="px-4 py-2 rounded-lg"
              style={{ 
                backgroundColor: colors.primary,
                color: '#fff'
              }}
              onClick={() => playSound('click')}
            >
              Destek Ekibine Ulaş
            </button>
            <button
              className="px-4 py-2 rounded-lg border"
              style={{ 
                borderColor: colors.border,
                color: colors.text.primary
              }}
              onClick={() => playSound('click')}
            >
              AI Asistanına Sor
            </button>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full opacity-10" 
          style={{ background: `radial-gradient(circle, ${colors.primary} 0%, transparent 70%)` }} 
        />
      </div>
    </div>
  );
};

export default HelpPage;