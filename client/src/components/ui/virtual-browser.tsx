import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Search, RefreshCw, MousePointer, BookOpen, Bookmark, Info, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';

// GENEL AYARLAR VE SABITLER
// Debug ve simülasyon ayarları
const DEBUG = false;
const MIN_SEARCH_DURATION = 5000; // Minimum arama süresi (ms)
const MIN_PAGE_VIEW_DURATION = 8000; // Bir sayfada en az kalma süresi (ms)
const MAX_RESULTS_TO_SHOW = 6; // Gösterilecek maksimum arama sonucu sayısı
const RESULTS_TO_VISIT_PER_KEYWORD = 5; // Her anahtar kelime için ziyaret edilecek sayfa sayısı (5 sayfaya çıkarıldı, önceden 2'ydi)
const HUMAN_THINKING_DELAY_MIN = 1200; // İnsansı düşünme gecikmesi minimum süresi
const HUMAN_THINKING_DELAY_MAX = 2500; // İnsansı düşünme gecikmesi maksimum süresi
const TYPING_SPEED_BASE = 80; // Typing efekti temel hızı (ms)
const SCROLL_SPEED = 'smooth'; // Scroll davranışı

// İnsansı düşünme mesajları
const THINKING_MESSAGES = [
  'Şu konuyu da araştırsam iyi olur...',
  'Bir de buna bakayım...',
  'Bu konuyu da incelemem gerekiyor...',
  'Bunu da araştırmam lazım...',
  'Yapay zeka düşünüyor...',
  'Diğer konuya geçelim...'
];

// Debug log fonksiyonu
const debugLog = (...args: any[]) => {
  if (DEBUG) console.log('[VirtualBrowser]', ...args);
};

// Tip tanımlamaları
interface VirtualBrowserProps {
  keywords: string[];
  onComplete: (data: { keyword: string, content: string }[], totalSources: number) => void;
  onClose: () => void;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
}

// Fallback sonuçlar üretici (API başarısız olduğunda kullanılacak)
function generateFallbackResults(keyword: string): Array<{ title: string; link: string; snippet: string; favicon?: string }> {
  return [
    {
      title: `${keyword} hakkında genel bilgiler`,
      link: `https://tr.wikipedia.org/wiki/${encodeURIComponent(keyword)}`,
      snippet: `${keyword} ile ilgili temel bilgiler ve açıklamalar.`,
      favicon: "https://tr.wikipedia.org/static/favicon/wikipedia.ico"
    },
    {
      title: `${keyword} nedir? - Ekşi Sözlük`,
      link: `https://eksisozluk.com/${encodeURIComponent(keyword)}`,
      snippet: `${keyword} başlığı altında kullanıcı yorumları ve tartışmalar.`,
      favicon: "https://eksisozluk.com/favicon.ico"
    },
    {
      title: `${keyword} ile ilgili haberler - Google News`,
      link: `https://news.google.com/search?q=${encodeURIComponent(keyword)}`,
      snippet: `${keyword} ile ilgili güncel haberler ve gelişmeler.`,
      favicon: "https://news.google.com/favicon.ico"
    }
  ];
}

// Ana bileşen
const VirtualBrowser: React.FC<VirtualBrowserProps> = ({ keywords, onComplete, onClose }) => {
  const { colors } = useTheme();
  
  // Ana state'ler
  const [currentKeyword, setCurrentKeyword] = useState<string>(keywords[0] || '');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [pageContent, setPageContent] = useState<string>('');
  const [status, setStatus] = useState<'initializing' | 'searching' | 'loading' | 'browsing' | 'complete' | 'typing' | 'waitingForNextKeyword'>('initializing');
  const [progress, setProgress] = useState<number>(0);
  // --- DEĞİŞTİ: Anahtar kelime bazında içerik toplama ---
  const [collectedDataMap, setCollectedDataMap] = useState<Record<string, string[]>>({});
  const [currentKeywordIndex, setCurrentKeywordIndex] = useState<number>(0);
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(-1);
  
  // --- Akış state'leri ve insansı adım yönetimi ---
  const [flowStep, setFlowStep] = useState<'idle'|'preTyping'|'typing'|'searching'|'serp'|'serpReview'|'serpClick'|'loading'|'reading'|'readWait'|'nextKeywordWait'|'done'>('idle');
  const [typingText, setTypingText] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const [humanWaitMsg, setHumanWaitMsg] = useState<string|null>(null);
  
  // Referanslar
  const browserContentRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  
  // UI ve simülasyon state'leri
  const [pageMeta, setPageMeta] = useState<{ title?: string, favicon?: string }>({});
  const [mousePos, setMousePos] = useState<{ x: number, y: number }>({ x: -100, y: -100 });
  const [highlightedParagraph, setHighlightedParagraph] = useState<number | null>(null);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [readingInfo, setReadingInfo] = useState<string>('');
  const [showingResults, setShowingResults] = useState(false);
  const [simulatedClickIndex, setSimulatedClickIndex] = useState<number | null>(null);
  const [readingPhase, setReadingPhase] = useState<'start' | 'scrolling' | 'highlighting' | 'complete'>('start');
  const [simulationTimeouts, setSimulationTimeouts] = useState<NodeJS.Timeout[]>([]);
  const [visitedPages, setVisitedPages] = useState<{url: string, title: string, favicon?: string}[]>([]);
  const [serpPhase, setSerpPhase] = useState<'initializing' | 'showing' | 'reading' | 'clicking' | 'done'>('initializing');
  const [initialAnimationComplete, setInitialAnimationComplete] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [thinkingMessage, setThinkingMessage] = useState<string | null>(null);
  const [preSearchMessage, setPreSearchMessage] = useState<string | null>(null);
  
  // Simülasyon zamanlama kontrolü için kullanılan değişkenler
  const lastActionTimeRef = useRef<number>(Date.now());
  const simulationPaused = useRef<boolean>(false);
  const scrollPaused = useRef<boolean>(false);
  const nextActionQueueRef = useRef<(() => void) | null>(null);
  
  // İnsansı düşünme efekti oluşturan fonksiyon
  const humanThinking = (callback: () => void, minDelay = HUMAN_THINKING_DELAY_MIN, maxDelay = HUMAN_THINKING_DELAY_MAX) => {
    const randomMessage = THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)];
    setThinkingMessage(randomMessage);
    
    const delay = Math.floor(minDelay + Math.random() * (maxDelay - minDelay));
    const timeout = setTimeout(() => {
      setThinkingMessage(null);
      callback();
    }, delay);
    
    setSimulationTimeouts(prev => [...prev, timeout]);
    return timeout;
  };
  
  // İlk açılış animasyonu
  useEffect(() => {
    // İlk yükleme animasyonu
    const initialTimeout = setTimeout(() => {
      setInitialAnimationComplete(true);
      
      // Typing efekti için akış başlatma
      setFlowStep('preTyping');
      setTypingText(currentKeyword);
      debugLog("Virtual Browser başlatıldı, ilk anahtar kelime:", keywords[0]);
    }, 1200);
    
    return () => clearTimeout(initialTimeout);
  }, []);
  
  // Simülasyon sıfırlama fonksiyonu - temiz başlangıç için
  const resetSimulation = () => {
    debugLog("Simülasyon sıfırlanıyor...");
    
    // Önceki tüm timeoutları temizle
    simulationTimeouts.forEach(timeout => clearTimeout(timeout));
    setSimulationTimeouts([]);
    
    // UI durumlarını sıfırla
    setMousePos({ x: -100, y: -100 });
    setHighlightedParagraph(null);
    setHighlightedElement(null);
    setIsReading(false);
    setReadingInfo('');
    setReadingPhase('start');
    setSerpPhase('initializing');
    setSearchError(null);
    setThinkingMessage(null);
    setIsTransitioning(false);
    
    // Scroll ve timing kontrollerini sıfırla
    scrollPaused.current = false;
    nextActionQueueRef.current = null;
    
    // Son işlem zamanını güncelle
    lastActionTimeRef.current = Date.now();
  };
  
  // Anahtar kelime değişimi ve typing efekti yönetimi
  useEffect(() => {
    if (initialAnimationComplete && flowStep === 'searching' && typingDone) {
      resetSimulation();
      performSearch(currentKeyword);
      debugLog("Yeni anahtar kelime araştırması başladı:", currentKeyword);
    }
    
    return () => {
      // Component unmount olduğunda tüm timeoutları temizle
      simulationTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [flowStep, initialAnimationComplete, typingDone]);
  
  // Google araması simülasyonu - SERPER API kullanarak gerçek sonuçlar al
  const performSearch = async (keyword: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    resetSimulation();
    setStatus('searching');
    setPageContent('');
    setSearchResults([]);
    setProgress(0);
    setShowingResults(false);
    
    debugLog("Arama yapılıyor:", keyword);
    setReadingInfo(`"${keyword}" için arama yapılıyor...`);
    
    // Arama yükleme çubuğu animasyonu - daha doğal ilerleme
    const searchStartTime = Date.now();
    const searchProgressInterval = setInterval(() => {
      setProgress(prev => {
        const elapsedTime = Date.now() - searchStartTime;
        // Minimum süreye ulaşana kadar yavaşça ve düzgünce ilerle
        if (elapsedTime < MIN_SEARCH_DURATION) {
          return Math.min(85, (elapsedTime / MIN_SEARCH_DURATION) * 85);
        } else if (prev >= 90) {
          clearInterval(searchProgressInterval);
          return 90;
        }
        // Daha düzenli artış
        return prev + (0.5 + Math.random() * 1.5); 
      });
    }, 400);
    
    try {
      // API isteği
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: keyword })
      });
      
      if (!res.ok) throw new Error('SERPER API hatası');
      
      const data = await res.json();
      const results = (data.results || []).map((result: any) => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        favicon: result.favicon
      })).slice(0, MAX_RESULTS_TO_SHOW);
      
      debugLog("SERPER API'den alınan sonuç sayısı:", results.length);
      
      // Minimum süre kontrolü
      const elapsedTime = Date.now() - searchStartTime;
      const remainingTime = Math.max(0, MIN_SEARCH_DURATION - elapsedTime);
      
      // Sonuçları göstermeden önce minimum süre kadar bekle
      const searchResultsTimeout = setTimeout(() => {
        clearInterval(searchProgressInterval);
        setProgress(100);
        
        // Sonuçlar boş ise, fallback sonuçları göster
        if (results.length === 0) {
          const fallbackResults = generateFallbackResults(keyword).map((result: any) => ({
            title: result.title,
            url: result.link,
            snippet: result.snippet,
            favicon: result.favicon
          }));
          
          setSearchResults(fallbackResults);
          setShowingResults(true);
          debugLog("Fallback sonuçlar gösteriliyor");
          setSerpPhase('showing');
          setReadingInfo(`"${keyword}" için ${fallbackResults.length} sonuç bulundu`);
          
          // SERP inceleme simülasyonu başlat - ancak gecikme ile ve insansı
          humanThinking(() => {
            setIsTransitioning(false);
            startSerpSimulation(fallbackResults);
          }, 1800, 3000);
          return;
        }
        
        // Sonuçları göster
        setSearchResults(results);
        setShowingResults(true);
        setSerpPhase('showing');
        debugLog("Sonuçlar gösteriliyor, sonuç sayısı:", results.length);
        setReadingInfo(`"${keyword}" için ${results.length} sonuç bulundu`);
        
        // SERP inceleme simülasyonu başlat - gecikme ve düşünme ile
        humanThinking(() => {
          setIsTransitioning(false);
          startSerpSimulation(results);
        }, 1800, 3000);
      }, remainingTime);
      
      setSimulationTimeouts(prev => [...prev, searchResultsTimeout]);
      
    } catch (error) {
      console.error('SERPER API araması yapılırken hata oluştu:', error);
      clearInterval(searchProgressInterval);
      setProgress(100);
      setSearchError('API hatası: Arama sonuçları alınamadı');
      
      // Fallback sonuçları kullan
      const fallbackResults = generateFallbackResults(keyword).map((result: any) => ({
        title: result.title,
        url: result.link,
        snippet: result.snippet,
        favicon: result.favicon
      }));
      
      // Hata durumunda da gecikme ile devam et
      humanThinking(() => {
        setSearchResults(fallbackResults);
        setShowingResults(true);
        debugLog("Fallback sonuçlar gösteriliyor (hata nedeniyle)");
        setSerpPhase('showing');
        setIsTransitioning(false);
      
        // SERP inceleme simülasyonu başlat
        startSerpSimulation(fallbackResults);
      }, 2000, 3000);
    }
  };

  // Gelişmiş görüş alanı kontrolü - sayfa kaydırma ihtiyacını doğru belirleyen fonksiyon
  function isElementInViewport(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const containerRect = searchResultsRef.current?.getBoundingClientRect() || 
                          browserContentRef.current?.getBoundingClientRect();
    
    if (!containerRect) return false;
    
    // Element container içinde tamamen görünür mü kontrolü
    return (
      rect.top >= containerRect.top &&
      rect.left >= containerRect.left &&
      rect.bottom <= containerRect.bottom &&
      rect.right <= containerRect.right
    );
  }

  // Sadece gerekirse ve yumuşak şekilde scroll yapan fonksiyon
  function scrollToElementIfNeeded(element: HTMLElement, container: HTMLElement | null = null, block: ScrollLogicalPosition = 'center') {
    if (!element || scrollPaused.current) return false;
    
    // Element görünür mü?
    if (isElementInViewport(element)) return false; // Zaten görünüyorsa scroll yapma
    
    // Element görünmüyorsa yumuşak scroll
    element.scrollIntoView({ 
      behavior: SCROLL_SPEED as ScrollBehavior, 
      block: block 
    });
    
    return true; // Scroll yapıldı
  }

  // Arama sonuçlarında belirli bir sonuca kaydırmak için
  function scrollToResultIfNeeded(resultIndex: number) {
    if (!searchResultsRef.current || scrollPaused.current) return;
    
    const resultElements = searchResultsRef.current.querySelectorAll('.search-result-item');
    if (resultElements.length > resultIndex) {
      const element = resultElements[resultIndex] as HTMLElement;
      const didScroll = scrollToElementIfNeeded(element, searchResultsRef.current);
      
      // Scroll yapıldıysa ekstra gecikme ekle
      if (didScroll) {
        scrollPaused.current = true;
        setTimeout(() => {
          scrollPaused.current = false;
          if (nextActionQueueRef.current) {
            const action = nextActionQueueRef.current;
            nextActionQueueRef.current = null;
            action();
          }
        }, 800); // Scroll tamamlanması için gecikme
      }
    }
  }

  // İnsansı fare hareketleri için geliştirilmiş fonksiyon
  function moveMouseSmoothly(x: number, y: number, onArrive?: () => void) {
    // Easing fonksiyonu ile yumuşak animasyon
    const steps = 32;
    const startX = mousePos.x === -100 ? x - 60 : mousePos.x;
    const startY = mousePos.y === -100 ? y - 60 : mousePos.y;
    const dx = x - startX;
    const dy = y - startY;
    let i = 0;
    
    function ease(t: number) {
      // cubic ease-in-out
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    function step() {
      if (i > steps) {
        setMousePos({ x, y });
        if (onArrive) {
          // Fare varış noktasına ulaştıktan kısa bir süre sonra callback'i çağır
          // Daha insansı bir etki için
          setTimeout(onArrive, 100 + Math.random() * 200);
        }
        return;
      }
      
      const t = i / steps;
      const et = ease(t);
      
      // Hafif rastgele hareket ekle - daha insansı görünüm için
      const randomX = Math.random() * 2 - 1;
      const randomY = Math.random() * 2 - 1;
      
      setMousePos({ 
        x: startX + dx * et + (t > 0.2 ? randomX : 0), 
        y: startY + dy * et + (t > 0.2 ? randomY : 0) 
      });
      
      i++;
      setTimeout(step, 10 + Math.random() * 12); // Farklı hızlarda hareket
    }
    
    step();
  }

  // Elemente fareyi insansı şekilde hareket ettir
  function moveMouseToElement(
    element: HTMLElement, 
    offsetX = 20, 
    offsetY = 20, 
    onArrive?: () => void,
    randomizePosition = true
  ) {
    const rect = element.getBoundingClientRect();
    
    // Rastgele offset - daha doğal görünüm
    const finalOffsetX = randomizePosition ? 
      offsetX + (Math.random() * Math.min(30, rect.width/3)) : offsetX;
    const finalOffsetY = randomizePosition ? 
      offsetY + (Math.random() * Math.min(20, rect.height/3)) : offsetY;
    
    const x = rect.left + finalOffsetX;
    const y = rect.top + finalOffsetY;
    
    moveMouseSmoothly(x, y, onArrive);
  }

  // Geliştirilmiş SERP okuma simülasyonu - daha gerçekçi scroll ve fare
  const startSerpSimulation = (results: SearchResult[]) => {
    if (!searchResultsRef.current || results.length === 0 || serpPhase !== 'showing') {
      debugLog("SERP simülasyonu başlatılamadı - içerik yok veya phase uygun değil");
      return;
    }
    
    debugLog("SERP simülasyonu başlıyor...");
    setSerpPhase('reading');
    
    // İlk fareyi SERP sayfasına doğru hareket ettir
    const searchHeader = searchResultsRef.current.querySelector('div') as HTMLElement;
    if (searchHeader) {
      moveMouseToElement(searchHeader, 100, 30, () => {
        setIsReading(true);
        setReadingInfo("Arama sonuçları inceleniyor...");
        
        // Yeni simülasyonu başlat
        simulateReadingSearchResultsImproved(results);
      });
    } else {
      // Header bulunamadıysa genel pozisyona git
      moveMouseSmoothly(200 + Math.random() * 100, 150, () => {
        setIsReading(true);
        setReadingInfo("Arama sonuçları inceleniyor...");
        
        // Yeni simülasyonu başlat
        simulateReadingSearchResultsImproved(results);
      });
    }
  };

  // SERP okumayı daha gerçekçi ve yumuşak yapan yeni fonksiyon
  const simulateReadingSearchResultsImproved = (results: SearchResult[]) => {
    if (!searchResultsRef.current || results.length === 0) return;
    
    setReadingPhase('scrolling');
    setIsReading(true);
    setReadingInfo('Arama sonuçları inceleniyor...');
    
    let idx = 0;
    const visitNextResult = () => {
      if (idx >= Math.min(results.length, 4) || serpPhase !== 'reading') {
        // Sonuç okuma tamamlandı, ilk sonuca tıklamak için gecikme ekle
        setTimeout(() => {
          setSerpPhase('clicking');
          setReadingInfo(`"${results[0].title}" sayfasına gidiliyor...`);
          
          const resultElements = searchResultsRef.current!.querySelectorAll('.search-result-item');
          if (resultElements.length > 0) {
            const element = resultElements[0] as HTMLElement;
            
            // Önce sonuca kaydır (eğer gerekiyorsa)
            scrollToResultIfNeeded(0);
            
            // Scroll bitince fareyi hareket ettir
            setTimeout(() => {
              moveMouseToElement(element, 20, element.offsetHeight/2, () => {
                // Fare elementin üzerine gelince, tıklama için biraz bekle
                setTimeout(() => {
                  // Tıklama efekti göster
                  setSimulatedClickIndex(0);
                  
                  // Tıklama sonrası işlemler için yeterince bekle
                  setTimeout(() => {
                    setSimulatedClickIndex(null);
                    setSerpPhase('done');
                    setCurrentResultIndex(0);
                    setCurrentUrl(results[0].url);
                    setStatus('loading');
                    setShowingResults(false);
                    fetchWebpage(results[0].url);
                  }, 600 + Math.random() * 400);
                }, 400 + Math.random() * 300);
              });
            }, scrollPaused.current ? 1000 : 200);
          }
        }, 1200 + Math.random() * 800);
        return;
      }
      
      // Sonuçlar içinde gezinme
      const resultElements = searchResultsRef.current!.querySelectorAll('.search-result-item');
      if (resultElements.length > idx) {
        const element = resultElements[idx] as HTMLElement;
        
        // Önce elemente scroll yap (gerekiyorsa)
        scrollToResultIfNeeded(idx);
        
        // Scroll tamamlandıktan sonra fareyi hareket ettir
        setTimeout(() => {
          moveMouseToElement(element, 20, element.offsetHeight/3, () => {
            // Sonuca gelince highlight göster
            setSimulatedClickIndex(idx);
            
            // Snippet uzunluğuna göre okuma süresi
            const snippetLength = results[idx].snippet.length;
            // En az 1.5 saniye, maksimum 4 saniye okuma süresi - insansı
            const readTime = Math.max(1500, Math.min(4000, snippetLength * 15));
            
            // Okuma tamamlandıktan sonra highlight'ı kaldır
            setTimeout(() => {
              setSimulatedClickIndex(null);
              
              // Kısa bir gecikme ile sonraki sonuca geç
              setTimeout(() => {
                idx++;
                visitNextResult();
              }, 200 + Math.random() * 300);
            }, readTime);
          });
        }, scrollPaused.current ? 1000 : 400);
      } else {
        // Element bulunamadıysa sonrakine geç
        idx++;
        visitNextResult();
      }
    };
    
    // İlk sonucu ziyaret et
    visitNextResult();
  };

  // Web sayfası içeriğini çekme fonksiyonu - daha gerçekçi yükleme ve geçişlerle
  const fetchWebpage = async (url: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    resetSimulation();
    setStatus('loading');
    setPageContent('');
    setPageMeta({});
    
    debugLog("Sayfa içeriği alınıyor:", url);
    setReadingInfo(`"${url}" yükleniyor...`);
    
    // Gerçekçi yükleme çubuğu animasyonu
    const loadStartTime = Date.now();
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        // Daha insansı ilerleme - bazen hızlı, bazen yavaş
        const increment = (Math.random() < 0.3) ? 
          Math.random() * 8 : // Hızlı ilerleme
          Math.random() * 3;  // Normal ilerleme
        return prev + increment;
      });
    }, 200 + Math.random() * 100);
    
    try {
      // API ile içerik çekme
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (!res.ok) throw new Error('Scrape API hatası');
      const data = await res.json();
      const scrapedContent = data.content || 'İçerik alınamadı.';
      
      // Sayfayı ziyaret edilenlere ekle
      const newVisit = {
        url: url,
        title: url.split('/')[2] || url,
        favicon: undefined
      };
      setVisitedPages(prev => [...prev, newVisit]);
      
      // Minimum sayfa yükleme süresi kontrolü
      const elapsedTime = Date.now() - loadStartTime;
      const minLoadTime = 2000; // En az 2 saniye yükleme süresi
      const remainingTime = Math.max(0, minLoadTime - elapsedTime);
      
      const loadTimeout = setTimeout(() => {
        // Yükleme tamamlandı
        clearInterval(progressInterval);
        setProgress(100);
        setPageMeta({ title: url.split('/')[2] });
        
        debugLog("Sayfa içeriği alındı, yükleniyor...");
        
        // Sayfa içeriğini gösterme ve okumaya hazırlık - insansı gecikme
        setTimeout(() => {
          setPageContent(`<div style='white-space:pre-line;font-size:15px;'>${scrapedContent}</div>`);
          setStatus('browsing');
          debugLog("Sayfa içeriği gösteriliyor, okuma başlıyor...");
          
          // İçerik göründükten sonra okuma için hazırlık
          setTimeout(() => {
            // Fareyi sayfanın üst kısmına getir
            moveMouseSmoothly(250, 150, () => {
              // Fare hazır olduğunda sayfa okumayı başlat
              setIsTransitioning(false);
              startAutoScrollImproved();
            });
          }, 800 + Math.random() * 400);
        }, 1200);
      }, remainingTime);
      
      setSimulationTimeouts(prev => [...prev, loadTimeout]);
      
    } catch (error) {
      console.error('Sayfa içeriği alınamadı:', error);
      clearInterval(progressInterval);
      setProgress(100);
      
      // Hata mesajını daha insansı bir gecikme ile göster
      setTimeout(() => {
        // Hata mesajı göster
        setPageContent(`
          <div style="padding: 2rem; text-align: center;">
            <h2>Sayfa yüklenirken bir hata oluştu</h2>
            <p>Sayfayı yüklerken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.</p>
          </div>
        `);
        setStatus('browsing');
        setIsTransitioning(false);
        
        // Hata durumunda biraz bekleyip sonraki sayfaya geç
        setTimeout(() => moveToNextPage(), 3000);
      }, 1000);
    }
  };
  
  // Geliştirilmiş otomatik sayfa okuma simülasyonu - daha kontrollü scroll
  const startAutoScrollImproved = () => {
    if (!browserContentRef.current) return;
    if (status !== 'browsing' || !pageContent) return;
    
    // Sayfadaki önemli içerik elementlerini bul
    const elements = Array.from(browserContentRef.current.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, li, table'));
    
    if (elements.length === 0) {
      debugLog("Okunacak element bulunamadı");
      
      // Okunacak element yoksa, kısa bir süre bekleyip içeriği kaydet
      setTimeout(() => {
        humanThinking(() => {
          const extractedContent = extractContentFromPage(currentKeyword, pageContent);
          addContentForKeyword(currentKeyword, extractedContent);
          moveToNextPage();
        });
      }, 2000);
      return;
    }
    
    debugLog("Okuma simülasyonu başlatılıyor, element sayısı:", elements.length);
    setReadingPhase('scrolling');
    setIsReading(true);
    setReadingInfo("Sayfa içeriği okunuyor...");
    
    const pageStartTime = Date.now();
    let idx = 0;
    let scrolledElements = 0;
    
    // Scroll aktif mi kontrolü
    let scrollActive = true;
    function stopScroll() { 
      scrollActive = false; 
      scrollPaused.current = true;
    }
    
    // Bir sonraki elementi oku
    const readNextElement = () => {
      if (!scrollActive) return;
      
      // Minimum sayfa görüntüleme süresi kontrolü
      const timeOnPage = Date.now() - pageStartTime;
      
      // Yeterince element okundu veya minimum süre geçti mi?
      const readEnoughElements = idx >= elements.length || scrolledElements >= Math.min(10, elements.length);
      const spentEnoughTime = timeOnPage >= MIN_PAGE_VIEW_DURATION;
      
      if (readEnoughElements && spentEnoughTime) {
        // Okuma tamamlandı
        debugLog("Okuma simülasyonu tamamlandı, sonraki adıma geçiliyor");
        
        // Okuma modunu kapat ve tamamlandı olarak işaretle
        stopScroll();
        setReadingPhase('complete');
        setIsReading(false);
        setHighlightedParagraph(null);
        setHighlightedElement(null);
        setReadingInfo("Okuma tamamlandı");
        
        // Fareyi gizle
        setTimeout(() => setMousePos({ x: -100, y: -100 }), 800);
        
        // İçerik toplama ve sonraki adıma geçiş için insansı bekleme
        humanThinking(() => {
          // Elde edilen içeriği kaydet
          const extractedContent = extractContentFromPage(currentKeyword, pageContent);
          addContentForKeyword(currentKeyword, extractedContent);
          
          // Sonraki sayfaya geç
          moveToNextPage();
        }, 2000, 3500);
        
        return;
      }
      
      // Yeterli element okumadık ama minimum süreyi geçtik mi?
      if (spentEnoughTime && !readEnoughElements) {
        // Birkaç element daha okuyup bitirelim
        scrolledElements = Math.max(scrolledElements, elements.length - 3);
      }
      
      // Tüm elementler bitti mi kontrol et
      if (idx >= elements.length) {
        // Minimum süreyi kontrol et
        if (spentEnoughTime) {
          // Okuma tamamlandı, sonraki adıma geç
          readNextElement(); // Bu, üstteki readEnoughElements && spentEnoughTime koşulunu tetikleyecek
        } else {
          // Minimum süre dolana kadar bekle
          const waitTimeout = setTimeout(() => readNextElement(), 1000);
          setSimulationTimeouts(prev => [...prev, waitTimeout]);
        }
        return;
      }
      
      const element = elements[idx] as HTMLElement;
      if (!element) {
        idx++;
        readNextElement();
        return;
      }
      
      // Element görünür mü kontrol et ve gerekirse scroll yap
      const wasScrolled = scrollToElementIfNeeded(element);
      
      // Scroll yapıldıysa, scroll tamamlanması için biraz bekle
      const nextStepDelay = wasScrolled ? 800 : 200;
      
      setTimeout(() => {
        debugLog("Element okunuyor:", idx, element.tagName, element.textContent?.substring(0, 30));
        
        // Mouse'u elementin yakınına getir
        moveMouseToElement(
          element,
          20 + Math.random() * 20, 
          20 + Math.random() * 20,
          undefined,
          true // pozisyonu rastgele seç
        );
        
        // Elementi highlight yap
        setHighlightedElement(element);
        setHighlightedParagraph(idx);
        
        // Elementin içerik uzunluğuna göre okuma süresi
        const content = element.textContent || '';
        // İçerik ne kadar uzunsa o kadar oku (2-5 saniye arası)
        const readTime = Math.max(2000, Math.min(5000, content.length * 18));
        scrolledElements++;
        
        // Okuma tamamlandığında
        const timeout = setTimeout(() => {
          // Highlight'ı kaldır
          setHighlightedParagraph(null);
          setHighlightedElement(null);
          
          // İnsansı duraklama (daha uzun, daha tutarlı)
          const pauseTime = Math.random() < 0.3 ? 
            800 + Math.random() * 800 : // Uzun duraklama
            300 + Math.random() * 400;  // Normal duraklama
          
          // Okumaya devam et
          const nextTimeout = setTimeout(() => {
            idx++;
            readNextElement();
          }, pauseTime);
          setSimulationTimeouts(prev => [...prev, nextTimeout]);
        }, readTime);
        
        setSimulationTimeouts(prev => [...prev, timeout]);
      }, nextStepDelay);
    };
    
    // İlk paragrafı okumayı başlat
    setTimeout(() => readNextElement(), 1000); // Sayfa yüklendiğinde başlamadan önce kısa gecikme
  };
  
  // Bir sonraki sayfaya geç
  const moveToNextPage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // Yeni sayfaya geçmeden önce reset
    resetSimulation();

    // --- DÜZELTME: Her anahtar kelime için 5 siteyi sırayla gez ---
    if (currentResultIndex < RESULTS_TO_VISIT_PER_KEYWORD - 1 && currentResultIndex < searchResults.length - 1) {
      debugLog("Sonraki siteye geçiliyor...");
      humanThinking(() => {
        const nextIndex = currentResultIndex + 1;
        setCurrentResultIndex(nextIndex);
        setCurrentUrl(searchResults[nextIndex].url);
        setStatus('loading');
        setTimeout(() => {
          setIsTransitioning(false);
          fetchWebpage(searchResults[nextIndex].url);
        }, 1000);
      });
    } else {
      // 5 site bitti, bir sonraki anahtar kelimeye geç
      debugLog("Sonraki anahtar kelimeye geçiliyor...");
      moveToNextKeyword();
    }
  };

  // Sonraki anahtar kelimeye geç - insansı geçişlerle
  const moveToNextKeyword = () => {
    if (isTransitioning) return;
    resetSimulation();
    if (currentKeywordIndex < keywords.length - 1) {
      debugLog("Yeni anahtar kelimeye geçiliyor:", keywords[currentKeywordIndex + 1]);
      setStatus('waitingForNextKeyword');
      humanThinking(() => {
        const nextIndex = currentKeywordIndex + 1;
        setCurrentKeywordIndex(nextIndex);
        setCurrentKeyword(keywords[nextIndex]);
        setCurrentResultIndex(-1); // ilk siteye başlamak için -1
        setFlowStep('preTyping');
        setTypingText(keywords[nextIndex]);
        setIsTransitioning(false);
      }, 2000, 3500);
    } else {
      debugLog("Tüm araştırma tamamlandı, sonuçlar gönderiliyor");
      setStatus('complete');
      setTimeout(() => {
        const grouped = groupResearchDataByKeyword(collectedDataMap);
        const totalSources = Object.values(collectedDataMap).reduce((acc, arr) => acc + arr.length, 0);
        onComplete(grouped, totalSources);
      }, 2000);
    }
  };

  // İnsansı düşünme ve typing efekti akışı
  useEffect(() => {
    if (flowStep === 'idle' && initialAnimationComplete) {
      // İlk anahtar kelimeyle başla
      setTimeout(() => setFlowStep('preTyping'), 800);
    }
    
    if (flowStep === 'preTyping') {
      // İnsansı düşünme mesajı göster
      const randomMessage = THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)];
      setHumanWaitMsg(randomMessage);
      
      // Düşünme süresi sonunda typing başlat
      setTimeout(() => {
        setHumanWaitMsg(null);
        setFlowStep('typing');
      }, 1500 + Math.random() * 1000);
    }
  }, [flowStep, initialAnimationComplete]);

  // Typing efekti tamamlanınca arama başlat
  useEffect(() => {
    if (flowStep === 'typing' && typingDone) {
      setTimeout(() => {
        setFlowStep('searching');
      }, 800); // Typing bitince arama öncesi kısa bekleme
    }
  }, [typingDone, flowStep]);

  // Geliştirilmiş typing efekti hook'u
  const useTypingEffectImproved = (text: string, speed: number = TYPING_SPEED_BASE, onDone?: () => void) => {
    const [displayed, setDisplayed] = useState('');
    
    useEffect(() => {
      setDisplayed('');
      if (!text) return;
      
      let i = 0;
      const type = () => {
        if (i >= text.length) {
          if (onDone) setTimeout(onDone, 400);
          return;
        }
        
        setDisplayed(prev => prev + text[i]);
        i++;
        
        // İnsansı typing hızı - bazı harfler daha hızlı
        const nextDelay = speed + Math.random() * 80 - 20;
        setTimeout(type, nextDelay);
      };
      
      // İlk harfi yazmak için küçük bir gecikme
      setTimeout(type, 300);
      
      return () => {};
    }, [text, speed, onDone]);
    
    return displayed;
  };

  // --- Web sayfası içeriği: başlık, favicon, görseller, düzenli HTML ---
  function formatWebPageContent(rawHtml: string, meta: {title?: string, favicon?: string, url?: string}) {
    // Basit görsel ve başlık çıkarımı
    let title = meta.title || '';
    let favicon = meta.favicon || '';
    let url = meta.url || '';
    let doc: Document | null = null;
    try {
      doc = new DOMParser().parseFromString(rawHtml, 'text/html');
      if (!title) title = doc.title || '';
      if (!favicon) {
        const icon = doc.querySelector('link[rel~="icon"]') as HTMLLinkElement;
        if (icon) favicon = icon.href;
      }
    } catch {}
    // Görselleri çıkar
    let images: string[] = [];
    if (doc) {
      images = Array.from(doc.querySelectorAll('img')).map(img => img.src).filter(Boolean);
    }
    // Başlık ve görselleri üstte göster, ardından içerik
    return `
      <div class="webpage-header flex items-center mb-4">
        ${favicon ? `<img src="${favicon}" alt="favicon" class="w-7 h-7 mr-3 rounded" />` : ''}
        <div>
          <div class="text-lg font-bold text-gray-800">${title}</div>
          <div class="text-xs text-gray-500">${url}</div>
        </div>
      </div>
      ${images.length > 0 ? `<div class="flex flex-wrap gap-2 mb-4">${images.slice(0,3).map(src => `<img src='${src}' class='rounded shadow max-h-32' style='max-width:160px;object-fit:cover;' />`).join('')}</div>` : ''}
      <div class="webpage-content prose max-w-none">${rawHtml}</div>
    `;
  }

  // --- İnsansı bekleme ve typing efekti ile akış başlatıcı ---
  useEffect(() => {
    if (flowStep === 'idle') {
      setTimeout(() => setFlowStep('preTyping'), 800);
    }
    if (flowStep === 'preTyping') {
      setHumanWaitMsg('Şu konuyu da araştırsam iyi olur...');
      setTimeout(() => {
        setHumanWaitMsg(null);
        setTypingText(currentKeyword);
        setFlowStep('typing');
      }, 1200 + Math.random()*800);
    }
    if (flowStep === 'typing') {
      setTypingDone(false);
    }
    if (flowStep === 'searching' && typingDone) {
      performSearch(currentKeyword);
    }
  }, [flowStep, currentKeyword, typingDone]);

  // --- Typing efekti ---
  function useTypingEffect2(text: string, speed: number = 60, onDone?: () => void) {
    const [displayed, setDisplayed] = useState('');
    useEffect(() => {
      setDisplayed('');
      if (!text) return;
      let i = 0;
      const type = () => {
        setDisplayed(t => t + text[i]);
        i++;
        if (i < text.length) {
          setTimeout(type, speed + Math.random() * 40);
        } else if (onDone) {
          setTimeout(onDone, 400);
        }
      };
      type();
      // eslint-disable-next-line
    }, [text]);
    return displayed;
  }

  // Progress percentage helper
  function getProgressPercentage() {
    if (!keywords || keywords.length === 0) return 0;
    // Each keyword is a step, and each collectedData is a page visited
    // If you want to show progress as (keywords completed / total keywords) * 100:
    // const percent = Math.round(((currentKeywordIndex + 1) / keywords.length) * 100);
    // If you want to show progress as (collectedData.length / (keywords.length * RESULTS_TO_VISIT_PER_KEYWORD)) * 100:
    const totalPages = keywords.length * RESULTS_TO_VISIT_PER_KEYWORD;
    const percent = Math.round((Object.values(collectedDataMap).reduce((acc, arr) => acc + arr.length, 0) / totalPages) * 100);
    return percent > 100 ? 100 : percent;
  }

  // DOĞRU:
  const addContentForKeyword = (keyword: string, content: string) => {
    setCollectedDataMap((prev: Record<string, string[]>) => {
      const arr = prev[keyword] ? [...prev[keyword]] : [];
      if (arr.length < RESULTS_TO_VISIT_PER_KEYWORD) arr.push(content);
      return { ...prev, [keyword]: arr };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="w-[1180px] max-w-[98vw] h-[750px] max-h-[96vh] rounded-lg overflow-hidden flex flex-col shadow-2xl relative"
        style={{ backgroundColor: colors.background.card, borderColor: colors.border }}
      >
        {/* Browser Header and Tabs */}
        <div className="flex items-center space-x-2 px-4 py-2 border-b bg-gray-50" style={{ borderColor: colors.border }}>
          {keywords.map((kw, i) => (
            <motion.div
              key={kw}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center px-4 py-2 rounded-t-lg cursor-pointer transition-all ${i === currentKeywordIndex ? 'bg-white shadow-sm font-bold' : 'bg-gray-100'} border border-b-0`}
              style={{ 
                borderColor: colors.border, 
                color: i === currentKeywordIndex ? colors.primary : colors.text.secondary 
              }}
            >
              {i === currentKeywordIndex && pageMeta.favicon && (
                <img src={pageMeta.favicon} alt="favicon" className="w-4 h-4 mr-2" />
              )}
              <span className="truncate max-w-[120px]">{kw}</span>
              {i === currentKeywordIndex && pageMeta.title && (
                <span className="ml-2 text-xs text-gray-400 truncate max-w-[100px]">{pageMeta.title}</span>
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Browser Controls */}
        <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center space-x-3">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex items-center space-x-1 mr-2">
              <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
                <ChevronLeft size={16} style={{ color: colors.text.secondary }} />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
                <ChevronRight size={16} style={{ color: colors.text.secondary }} />
              </button>
            </div>
            
            {/* Address Bar */}
            <div className="flex items-center w-[600px] px-3 py-1.5 rounded border" style={{ 
              borderColor: colors.border,
              backgroundColor: colors.background.main
            }}>
              {status === 'searching' ? (
                <Search size={16} className="mr-2" style={{ color: colors.text.secondary }} />
              ) : (
                <ExternalLink size={16} className="mr-2" style={{ color: colors.text.secondary }} />
              )}
              
              <span style={{ 
                color: colors.text.primary, 
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {status === 'searching' ? `${currentKeyword}` : currentUrl}
              </span>
            </div>
            
            {/* Refresh Button */}
            <button className="p-1.5 rounded hover:bg-gray-100 transition-colors">
              <RefreshCw size={16} style={{ color: colors.text.secondary }} />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Finish Research Button - Gerçek tarayıcıyı taklit etmek için basit düğme */}
            <button
              className="text-xs px-2 py-1 rounded border text-gray-600 hover:bg-gray-100"
              style={{ borderColor: colors.border }}
              onClick={() => {
                setStatus('complete');
                setTimeout(() => {
                  onComplete(groupResearchDataByKeyword(collectedDataMap), Object.values(collectedDataMap).reduce((acc, arr) => acc + arr.length, 0));
                }, 1000);
              }}
            >
              Araştırmayı Bitir
            </button>
            
            {/* Close Button */}
            <button 
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={onClose}
            >
              <X size={18} style={{ color: colors.text.secondary }} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-1">
          {/* Main Browser Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Loading Progress Bar */}
            {(status === 'loading' || (status === 'searching' && progress < 100)) && (
              <div className="h-1 bg-gray-200 w-full">
                <motion.div 
                  className="h-full"
                  style={{ backgroundColor: colors.primary }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
            
            {/* Reading Indicator */}
            {isReading && (
              <div className="px-4 py-1.5 border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
                <div className="flex items-center">
                  <BookOpen size={14} className="mr-2" style={{ color: colors.primary }} />
                  <span className="text-sm" style={{ color: colors.text.secondary }}>
                    {readingInfo || "İçerik okunuyor..."}
                  </span>
                </div>
                <motion.div 
                  animate={{ opacity: [0.5, 1, 0.5] }} 
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
                >
                  AI Okuyor
                </motion.div>
              </div>
            )}
            
            {/* Browser Content Area */}
            <div className="flex-1 overflow-y-auto relative bg-white" ref={browserContentRef}>
              {/* Mouse Cursor */}
              <motion.div
                className="absolute z-50 pointer-events-none transition-all"
                initial={{ opacity: 0 }}
                animate={{ 
                  left: mousePos.x, 
                  top: mousePos.y,
                  opacity: mousePos.x > 0 && mousePos.y > 0 ? 1 : 0,
                  scale: simulatedClickIndex !== null ? [1, 0.8, 1] : 1
                }}
                transition={{ 
                  type: 'spring', 
                  damping: 25, 
                  stiffness: 300
                }}
              >
                <MousePointer size={20} color="#1a73e8" />
              </motion.div>
              
              {/* Loading State */}
              {status === 'initializing' && (
                <div className="flex flex-col items-center justify-center h-full">
                  <motion.div 
                    className="w-20 h-20 mb-4"
                    animate={{ scale: [0.8, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  </motion.div>
                  <div className="text-xl font-medium mb-2" style={{ color: colors.primary }}>
                    Yapay Zeka Araştırma Asistanı
                  </div>
                  <div className="text-gray-600 mb-6">
                    Sizin için web'de araştırma yapıyorum...
                  </div>
                  <motion.div 
                    className="w-32 h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: '#e6e6e6' }}
                  >
                    <motion.div
                      className="h-full"
                      style={{ backgroundColor: colors.primary }}
                      animate={{ 
                        x: ['-100%', '100%'],
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1.5,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                </div>
              )}
              
              {/* Google Search Results */}
              {status === 'searching' && showingResults && (
                <div className="p-6" ref={searchResultsRef}>
                  <div className="mb-6 flex justify-between items-center">
                    <div className="text-blue-600 text-xl font-medium">Google</div>
                    <div className="text-gray-600 text-sm">
                      Yaklaşık {Math.floor(Math.random() * 10000).toLocaleString()} sonuç ({(Math.random() * 0.8 + 0.2).toFixed(2)} saniye)
                    </div>
                  </div>
                  <div className="space-y-6">
                    {searchResults.map((result, index) => (
                      <div 
                        key={index}
                        className={`search-result-item cursor-pointer rounded-lg p-3 transition-all duration-300 ${
                          serpPhase === 'clicking' && index === 0 ? 'ring-2 ring-blue-400 bg-blue-50 scale-[0.98]' : 
                          simulatedClickIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center text-sm text-gray-600 mb-1.5">
                          {result.favicon && (
                            <img src={result.favicon} alt="favicon" className="w-4 h-4 mr-2" />
                          )}
                          <span className="truncate">{result.url}</span>
                        </div>
                        <div className="text-blue-700 text-lg hover:underline mb-1.5">
                          {result.title}
                        </div>
                        <div className="text-gray-600 text-sm">
                          {result.snippet}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Webpage Content */}
              {status === 'browsing' && pageContent && (
                <div className="p-6">
                  {/* Highlight effect for paragraph being read */}
                  {highlightedElement && (
                    <motion.div
                      className="absolute pointer-events-none bg-yellow-100 z-10 rounded"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.3 }}
                      transition={{ duration: 0.5 }}
                      style={{
                        left: highlightedElement.getBoundingClientRect().left - 4,
                        top: highlightedElement.getBoundingClientRect().top - 4,
                        width: highlightedElement.getBoundingClientRect().width + 8,
                        height: highlightedElement.getBoundingClientRect().height + 8,
                      }}
                    />
                  )}
                  {/* Webpage content with header and images */}
                  <div dangerouslySetInnerHTML={{ __html: formatWebPageContent(pageContent, {title: pageMeta.title, favicon: pageMeta.favicon, url: currentUrl}) }} />
                </div>
              )}
              
              {/* Loading State */}
              {status === 'loading' && (
                <div className="flex flex-col items-center justify-center h-full">
                  <motion.div 
                    className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="mt-4 text-gray-600">Sayfa yükleniyor...</div>
                </div>
              )}
              
              {/* Research Complete */}
              {status === 'complete' && (
                <div className="flex flex-col items-center justify-center h-full">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
                  >
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </motion.div>
                  <h2 className="text-2xl font-medium mb-2" style={{ color: colors.primary }}>
                    Araştırma Tamamlandı!
                  </h2>
                  <p className="text-gray-600 mb-6 text-center max-w-md">
                    {Object.values(collectedDataMap).reduce((acc, arr) => acc + arr.length, 0)} sayfa incelendi ve önemli bilgiler toplandı.
                    Bulgular AI içerik üreticinize aktarılıyor...
                  </p>
                  <motion.div 
                    className="h-1.5 bg-gray-200 rounded-full overflow-hidden w-64"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div 
                      className="h-full"
                      style={{ backgroundColor: colors.primary }}
                      animate={{ width: '100%' }}
                      initial={{ width: '0%' }}
                      transition={{ duration: 1 }}
                    />
                  </motion.div>
                </div>
              )}

              {/* Google ana ekranı ve typing efekti renderında responsive ve Google'a yakın düzenleme */}
              {(status === 'initializing' || status === 'typing' || status === 'waitingForNextKeyword') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
                  <div className="flex flex-col items-center w-full">
                    <img src="/google_logo.png" alt="Google" className="w-[272px] h-[92px] mt-24 mb-10" style={{objectFit:'contain'}} />
                    <div className="w-full max-w-[600px] flex flex-col items-center">
                      <div className="w-full flex items-center border border-gray-300 rounded-full px-6 py-4 shadow-md bg-white mb-8 focus-within:shadow-lg transition-shadow">
                        <Search size={22} className="mr-3 text-gray-400" />
                        <span className="text-lg text-gray-800 font-normal tracking-wide min-h-[32px]">
                          {status === 'typing' ? useTypingEffect2(currentKeyword, 60, () => setStatus('searching')) : currentKeyword}
                        </span>
                      </div>
                      <div className="flex space-x-4 mt-2">
                        <button className="bg-[#f8f9fa] hover:bg-[#f1f3f4] px-6 py-2 rounded text-[#3c4043] font-medium border border-gray-200 shadow-sm text-base">Google'da Ara</button>
                        <button className="bg-[#f8f9fa] hover:bg-[#f1f3f4] px-6 py-2 rounded text-[#3c4043] font-medium border border-gray-200 shadow-sm text-base">Kendimi Şanslı Hissediyorum</button>
                      </div>
                      {preSearchMessage && (
                        <div className="mt-10 text-lg text-gray-500 animate-pulse">{preSearchMessage}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Google ana ekranı ve typing efekti (yeni akışa göre) */}
              {(flowStep === 'idle' || flowStep === 'preTyping' || flowStep === 'typing') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
                  <div className="flex flex-col items-center w-full">
                    <img src="/google_logo.png" alt="Google" className="w-[272px] h-[92px] mt-24 mb-10" style={{objectFit:'contain'}} />
                    <div className="w-full max-w-[600px] flex flex-col items-center">
                      <div className="w-full flex items-center border border-gray-300 rounded-full px-6 py-4 shadow-md bg-white mb-8 focus-within:shadow-lg transition-shadow">
                        <Search size={22} className="mr-3 text-gray-400" />
                        <span className="text-lg text-gray-800 font-normal tracking-wide min-h-[32px]">
                          {flowStep === 'typing' ? useTypingEffect2(typingText, 60, () => { setTypingDone(true); setTimeout(()=>setFlowStep('searching'), 600); }) : typingText}
                        </span>
                      </div>
                      <div className="flex space-x-4 mt-2">
                        <button className="bg-[#f8f9fa] hover:bg-[#f1f3f4] px-6 py-2 rounded text-[#3c4043] font-medium border border-gray-200 shadow-sm text-base">Google'da Ara</button>
                        <button className="bg-[#f8f9fa] hover:bg-[#f1f3f4] px-6 py-2 rounded text-[#3c4043] font-medium border border-gray-200 shadow-sm text-base">Kendimi Şanslı Hissediyorum</button>
                      </div>
                      {humanWaitMsg && (
                        <div className="mt-10 text-lg text-gray-500 animate-pulse">{humanWaitMsg}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Sidebar: Visited Sites */}
          <div className="w-72 border-l bg-gray-50 flex flex-col" style={{ borderColor: colors.border }}>
            <div className="p-3 font-medium text-sm border-b flex items-center justify-between" style={{ borderColor: colors.border }}>
              <div className="flex items-center">
                <Bookmark size={14} className="mr-2" style={{ color: colors.secondary }} />
                Ziyaret Edilen Siteler
              </div>
              <div className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs">{visitedPages.length}</div>
            </div>
            
            {/* Visited Sites List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {visitedPages.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500">
                  Henüz site ziyaret edilmedi
                </div>
              ) : (
                visitedPages.map((page, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-lg shadow-sm p-3 border"
                    style={{ borderColor: colors.border }}
                  >
                    <div className="flex items-center mb-2">
                      {page.favicon ? (
                        <img src={page.favicon} alt="site icon" className="w-4 h-4 mr-2" />
                      ) : (
                        <Globe size={14} className="mr-2" style={{ color: colors.text.secondary }} />
                      )}
                      <div className="text-xs font-medium truncate" style={{ color: colors.text.primary }}>
                        {page.title || page.url}
                      </div>
                    </div>
                    <div className="text-xs text-blue-600 truncate mb-1">
                      {page.url.substring(0, 40)}{page.url.length > 40 ? '...' : ''}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            {/* Collected Research Data */}
            <div className="p-3 border-t" style={{ borderColor: colors.border }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center text-sm font-medium">
                  <Info size={14} className="mr-1.5" style={{ color: colors.primary }} />
                  Araştırma İlerlemesi
                </div>
                <div className="text-xs text-gray-500">
                  {currentKeywordIndex + 1}/{keywords.length}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: colors.primary }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              
              <div className="text-xs text-gray-600 flex justify-between items-center">
                <span>{Object.values(collectedDataMap).reduce((acc, arr) => acc + arr.length, 0)} sayfa incelendi</span>
                <span>{getProgressPercentage()}%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Browser Status Bar */}
        <div 
          className="px-4 py-2 text-xs border-t flex justify-between items-center"
          style={{ borderColor: colors.border, backgroundColor: colors.background.card }}
        >
          <div className="flex items-center" style={{ color: colors.text.secondary }}>
            <div className="w-2 h-2 rounded-full mr-1.5" style={{
              backgroundColor: status === 'complete' ? '#10b981' : 
                              status === 'loading' ? '#f59e0b' : 
                              status === 'searching' ? '#3b82f6' : '#9ca3af'
            }} />
            {status === 'searching' ? 'Arama yapılıyor...' : 
             status === 'loading' ? 'Sayfa yükleniyor...' : 
             status === 'browsing' ? 'Sayfa inceleniyor...' :
             status === 'complete' ? 'Araştırma tamamlandı' : 
             'Başlatılıyor...'}
          </div>
          <div style={{ color: colors.text.secondary }}>
            {currentKeyword} • {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        {/* Search Error Alert */}
        {searchError && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
            <span className="block sm:inline">{searchError}</span>
            <span className="absolute top-0 right-0 px-4 py-3">
              <button onClick={() => setSearchError(null)}>
                <X size={16} />
              </button>
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

  // --- Sayfa içeriğinden özet çıkaran fonksiyon ---
function extractContentFromPage(keyword: string, pageContent: string): string {
  // Basit bir örnek: pageContent içinden ilk 800 karakteri döndür
  // Daha gelişmiş bir özetleme için anahtar kelimeyle ilgili paragrafları seçebilirsiniz
  if (typeof pageContent === 'string') {
    // HTML etiketlerini temizle
    const tmp = document.createElement('div');
    tmp.innerHTML = pageContent;
    const text = tmp.textContent || tmp.innerText || '';
    // Anahtar kelimeyle ilgili paragrafları bul
    const keywordRegex = new RegExp(keyword, 'i');
    const paragraphs = text.split('\n').filter(p => p.trim().length > 40);
    const related = paragraphs.filter(p => keywordRegex.test(p));
    if (related.length > 0) {
      return related.slice(0, 2).join('\n').slice(0, 800);
    }
    // Yoksa ilk paragrafları döndür
    return paragraphs.slice(0, 2).join('\n').slice(0, 800);
  }
  return '';
}

// --- Araştırma sonuçlarını anahtar kelime bazında özetle ve backend'e uygun şekilde gönder ---
function groupResearchDataByKeyword(dataMap: Record<string, string[]>): { keyword: string, content: string }[] {
  return Object.entries(dataMap).map(([keyword, contents]) => ({
    keyword,
    content: contents.join('\n---\n')
  }));
}

export default VirtualBrowser;