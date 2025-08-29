import React from 'react';

// RealWebBrowser artık kullanılmıyor, VirtualResearchBox bileşenini kullanıyoruz
// Bu dosyayı VirtualResearchBox bileşenine yönlendirmek için kullanabiliriz
import VirtualResearchBox from '../virtualbox/VirtualResearchBox';

// Arayüz türlerini koru (geriye dönük uyumluluk için)
interface RealWebBrowserProps {
  keywords: string[];
  onComplete: (collectedData: string[]) => void;
  onClose: () => void;
}

// RealWebBrowser şimdi VirtualResearchBox'ı çağırıyor
const RealWebBrowser: React.FC<RealWebBrowserProps> = ({ 
  keywords, 
  onComplete,
  onClose 
}) => {
  // Veri dönüştürme fonksiyonu (veri tipi dönüşümü için)
  const handleComplete = (data: { keyword: string; content: string }[]) => {
    // Eski formata dönüştür
    const formattedData = data.map(item => item.content);
    onComplete(formattedData);
  };
  
  return (
    <VirtualResearchBox
      keywords={keywords}
      onComplete={handleComplete}
      onClose={onClose}
    />
  );
};

export default RealWebBrowser;