import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../theme/ThemeProvider';
import { useAudio } from '../../lib/stores/useAudio';
import { cn } from '../../lib/utils'; // Assuming you have this utility

// Icons
import { 
  Search, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Globe, 
  ChevronDown,
  Lock,
  FileText,
  Star,
  BookOpen,
  PlusCircle,
  Menu,
  MousePointer
} from 'lucide-react';

// --- NEW: Typing Effect Hook ---
const useTypingEffect = (text: string, speed = 50) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Ensure text is a non-empty string before starting
    if (typeof text !== 'string' || text.length === 0) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    let cancelled = false;

    const intervalId = setInterval(() => {
      if (cancelled) return;
      // Use substring to avoid potential issues with character indexing
      setDisplayedText(text.substring(0, index + 1));
      index++;
      if (index >= text.length) {
        clearInterval(intervalId);
        setIsTyping(false);
      }
    }, speed + (Math.random() - 0.5) * (speed * 0.4)); // Slightly less randomness

    return () => {
      cancelled = true; // Prevent state update after unmount
      clearInterval(intervalId);
      setIsTyping(false); // Ensure typing state is reset on cleanup
    };
  }, [text, speed]);

  return { displayedText, isTyping };
};


interface VirtualResearchBoxProps {
  keywords: string[];
  // --- UPDATE: onComplete now receives structured data ---
  onComplete: (data: { [keyword: string]: { url: string; title: string; content: string }[] }, sourceCount: number) => void;
  onClose: () => void;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
}

interface ScrapedContent {
  url: string;
  title: string; // Add title to scraped content
  content: string;
}

// --- NEW: State Machine States ---
type SimulationStep =
  | 'idle'
  | 'thinking_before_search'
  | 'typing_search'
  | 'searching'
  | 'reviewing_results'
  | 'scrolling_to_result'
  | 'clicking_result'
  | 'loading_site'
  | 'reading_site'
  | 'thinking_next_keyword'
  | 'finishing'
  | 'done';

const VirtualResearchBox: React.FC<VirtualResearchBoxProps> = ({ keywords, onComplete, onClose }) => {
  const { colors } = useTheme();
  const { playSound } = useAudio();
  const browserRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null); // Ref for search input

  // --- REFINED STATE MANAGEMENT ---
  const [step, setStep] = useState<SimulationStep>('idle');
  const [keywordIdx, setKeywordIdx] = useState(0);
  const [siteIdx, setSiteIdx] = useState(0); // Index of the site being visited for the current keyword
  const [serp, setSerp] = useState<SearchResult[]>([]);
  const [siteContent, setSiteContent] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [clickEffect, setClickEffect] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false });
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0); // For individual loading bars
  const [collectedDataMap, setCollectedDataMap] = useState<{ [keyword: string]: ScrapedContent[] }>({});
  const [totalSources, setTotalSources] = useState(0);

  const currentKeyword = keywords[keywordIdx] || '';
  // --- UPDATE: Adjust typing speed slightly ---
  const { displayedText: displayedKeyword, isTyping } = useTypingEffect(step === 'typing_search' ? currentKeyword : '', 70); // Slightly slower typing

  // --- Status Messages ---
  const thinkingMessages = [
    "Hmm, şunu da araştırsam iyi olacak...",
    "Bir sonraki konuya geçelim.",
    "Acaba başka ne bulabilirim?",
    "Şimdi de şuna bakalım...",
    "Hmm, bu açıyı da değerlendirsem mi... Belki iki kaynaktan karşılaştırsam?",
    "Aa, az önceki notlarımla çelişiyor gibi. Tekrar kontrol etmeliyim.",
    "Acaba daha güncel bir kaynak var mıdır? Son 6 ayda çıkan verilere bakmalı...",
    "Ya bu kısım eksik kaldıysa? Biraz daha derinlemesine araştırmalıyım.",
    "Dur bir saniye, önce şu terimin tam tanımını netleştireyim.",
    "Belki infografik ile desteklesem daha anlaşılır olur... Daha ilginç kaynak arayayım.",
    "Vay, hiç böyle bir perspektif düşünmemiştim. Not alıp üzerine kafa yormalıyım.",
    "Bu kadar teknik olursa anlaşılmaz mı? Sadeleştirme yöntemlerini düşünüyorum...",
    "Of, kaç dakikadır aynı konudayım. Bir dakika ara verip taze bakışla devam etsem mi?",
    "İlginç... Şu 3 madde arasında nedensel ilişki olabilir mi acaba?"
  ];
  const readingMessages = [
    "İlginç bilgiler içeriyor.",
    "Bu site faydalı görünüyor.",
    "Notlar alıyorum...",
    "İçeriği tarıyorum.",
    "Önemli kısımları belirliyorum.",
    "Vay be! Bu veriler 2024 bilgileriyle tamamen çelişiyor.",
    "Kaynak güvenilir görünüyor..",
    "Alıntı yapılacak kadar vurucu bir cümle buldum! *bu sayfadaki 3 veriyi not ettim*",
    "Paragrafın son cümlesi bütün argümanı ters yüz ediyor, dikkat!",
    "Bu grafik mükemmel, direkt buradan bilgi koymalıyım. *ekran görüntüsü alır*",
    "Yazar burada 'kanıtlanmamış varsayım' hatasına düşmüş, not düşüyorum.",
    "Aha! Az önce aradığım istatistikler bu konuda saklıymış.",
    "Hmm, referans listesi çok eski. 2023 sonrası kaynak eklemeliyim.",
    "Bu bölüm biraz muallak kalmış. Ek açıklama için dipnot lazım...",
    "Müthiş! 3 farklı bakış açısını sentezleyen bir meta-analiz buldum."
  ];

  // --- Fallback Results ---
  function generateFallbackResults(keyword: string): SearchResult[] {
    return [
      {
        title: `${keyword} ile ilgili örnek sonuç 1`,
        url: `https://example.com/${encodeURIComponent(keyword)}`,
        snippet: `${keyword} hakkında örnek açıklama ve bilgi.`
      },
      {
        title: `${keyword} ile ilgili örnek sonuç 2`,
        url: `https://example.org/${encodeURIComponent(keyword)}`,
        snippet: `${keyword} ile ilgili başka bir örnek açıklama.`
      },
      {
        title: `${keyword} ile ilgili örnek sonuç 3`,
        url: `https://example.net/${encodeURIComponent(keyword)}`,
        snippet: `${keyword} konusunda detaylı bilgiler ve analizler.`
      }
    ];
  }

  // --- CORE SIMULATION LOGIC ---

  // Start the simulation
  useEffect(() => {
    if (keywords.length > 0) {
      setStep('thinking_before_search');
    } else {
      onComplete({}, 0); // No keywords, complete immediately
    }
  }, [keywords]); // Run only once when keywords change

  // State machine transitions
  useEffect(() => {
    const runStep = async () => {
      console.log("Current Step:", step, "Keyword:", keywordIdx, "Site:", siteIdx); // Debugging
      // --- UPDATE: Progress calculation based on 5 sites per keyword ---
      const totalSteps = keywords.length * 5;
      const currentStepNum = keywordIdx * 5 + siteIdx;
      setOverallProgress(totalSteps > 0 ? (currentStepNum / totalSteps) * 100 : 0);

      switch (step) {
        case 'thinking_before_search':
          setStatusMessage(keywordIdx === 0 ? "Araştırmaya başlıyorum..." : thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)]);
          await wait(1500 + Math.random() * 1000);
          setStatusMessage(null);
          setStep('typing_search');
          break;

        case 'typing_search':
          // Wait for typing animation to finish (handled by useTypingEffect)
          // Move mouse to search button after typing
          if (!isTyping && displayedKeyword === currentKeyword && currentKeyword.length > 0) { // Add check for non-empty keyword
             await wait(400); // Slightly shorter pause after typing
             // Simulate clicking the search button
             const searchButton = document.getElementById('nova-search-button');
             if (searchButton) {
                 const rect = searchButton.getBoundingClientRect();
                 await moveMouseToElement(searchButton, true); // Move and click
             }
             playSound('click');
             await wait(300);
             setStep('searching');
          }
          break;

        case 'searching':
          setStatusMessage(`"${currentKeyword}" aranıyor...`);
          setLoadingProgress(0); // Reset loading bar
          await fetchSerp(currentKeyword);
          // fetchSerp will set the next step ('reviewing_results' or 'thinking_next_keyword' on error/no results)
          break;

        case 'reviewing_results':
           // --- UPDATE: Limit to 5 sites per keyword ---
           if (serp.length === 0 || siteIdx >= serp.length || siteIdx >= 5) { // Visit up to 5 sites
             setStep('thinking_next_keyword');
             break;
           }
           setStatusMessage("Sonuçlar inceleniyor...");
           await wait(800); // Slightly shorter wait
           // Simulate moving mouse over the target result
           const resultElement = document.getElementById(`result-${siteIdx}`);
           if (resultElement) {
               // --- SCROLL CHECK ---
               if (!isElementInViewport(resultElement) && contentRef.current) {
                   setStatusMessage("Sonuca kaydırılıyor...");
                   await scrollToElement(resultElement);
                   await wait(600); // Wait slightly longer after scroll
               }
               // --- UPDATE: Ensure mouse moves *before* waiting ---
               await moveMouseToElement(resultElement.querySelector('h3') || resultElement, false); // Move to title
               await wait(700 + Math.random() * 400); // Pause on result
               setStatusMessage("Siteye gidiliyor...");
               // --- UPDATE: Ensure mouse moves to element *again* before click, then wait briefly ---
               await moveMouseToElement(resultElement.querySelector('h3') || resultElement, false); // Re-target before click
               await wait(150); // Short pause before click simulation
               showClickEffect(mousePos.x, mousePos.y); // Show click at current mouse pos
               playSound('click');
               await wait(350); // Wait for click effect
               setStep('loading_site');
           } else {
               // Element not found, skip to next
               console.warn(`Result element result-${siteIdx} not found.`);
               setStep('thinking_next_keyword');
           }
           break;

        case 'loading_site':
          const targetSite = serp[siteIdx];
          if (!targetSite) {
            setStep('thinking_next_keyword');
            break;
          }
          setCurrentUrl(targetSite.url);
          setStatusMessage(`"${targetSite.title}" yükleniyor...`);
          setLoadingProgress(0);
          await fetchSite(targetSite.url, targetSite.title);
          // fetchSite will set the next step ('reading_site' or 'thinking_next_keyword' on error)
          break;

        case 'reading_site':
          if (!siteContent) { // Ensure content is loaded
            setStep('thinking_next_keyword');
            break;
          }
          setStatusMessage(readingMessages[Math.floor(Math.random() * readingMessages.length)]);
          setLoadingProgress(100); // Ensure loading bar is full
          await wait(500); // Wait for content to render
          await simulateReading();
          // simulateReading will set the next step ('thinking_next_keyword')
          break;

        case 'thinking_next_keyword':
          // --- DÜZELTME: Sayfa içeriğini temizle ama SERP sonuçlarını bir sonraki sayfaya geçerken temizleme ---
          setSiteContent(''); // Clear site content
          setCurrentUrl('');
          
          // --- DÜZELTME: Aynı arama sonuçları arasında gezinme kontrolü ---
          if (siteIdx + 1 < 5) {
            // Aynı anahtar kelime için sonraki siteye geç (5 site ziyaret edilene kadar)
            setTimeout(() => {
              setSiteIdx(prev => prev + 1);
              setStep('reviewing_results');
            }, 0);
            setStatusMessage("Diğer kaynağa geçiliyor...");
            await wait(1200 + Math.random() * 600);
            setStatusMessage(null);
          } else if (keywordIdx + 1 < keywords.length) {
            // 5 site tamamlandı, arama sonuçlarını temizle ve sonraki anahtar kelimeye geç
            setTimeout(() => {
              setSiteIdx(0);
              setSerp([]); // Sadece burada temizle - anahtar kelime değiştiğinde
              setKeywordIdx(prev => prev + 1);
              setStep('thinking_before_search');
            }, 0);
            setStatusMessage("Yeni araştırma konusuna geçiliyor...");
            await wait(1500 + Math.random() * 800);
            setStatusMessage(null);
          } else {
            setStep('finishing');
          }
          break;

        case 'finishing':
          setStatusMessage("Araştırma tamamlanıyor...");
          await wait(1000);
          finishResearch(); // Calls onComplete
          setStep('done');
          break;

        case 'done':
          // Simulation finished
          break;

        case 'idle':
           // Initial state, do nothing until keywords are provided
           break;
      }
    };

    runStep();

  }, [step, keywordIdx, siteIdx, keywords, isTyping, displayedKeyword]); // Add displayedKeyword dependency


  // --- Helper Functions ---
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const isElementInViewport = (el: HTMLElement): boolean => {
      if (!contentRef.current) return false;
      const rect = el.getBoundingClientRect();
      const contentRect = contentRef.current.getBoundingClientRect();
      return (
          rect.top >= contentRect.top &&
          rect.left >= contentRect.left &&
          rect.bottom <= contentRect.bottom &&
          rect.right <= contentRect.right
      );
  };

  const scrollToElement = async (el: HTMLElement) => {
      if (!contentRef.current) return;
      const targetScrollTop = el.offsetTop - contentRef.current.offsetTop - 60; // Adjust offset as needed
      await animateScroll(contentRef.current, contentRef.current.scrollTop, targetScrollTop);
  };

  // --- UPDATED: Mouse Movement ---
  const moveMouse = useCallback(async (targetX: number, targetY: number, instant = false, click = false, targetElement?: HTMLElement) => {
    return new Promise<void>(resolve => {
        if (!browserRef.current) {
            resolve();
            return;
        }
        const browserRect = browserRef.current.getBoundingClientRect();
        
        // İlk olarak, browserRef tarafından tanımlanan görünür alanın içinde kalacak koordinatlar hesaplayalım
        const safeX = Math.min(Math.max(targetX, browserRect.left + 5), browserRect.right - 5);
        const safeY = Math.min(Math.max(targetY, browserRect.top + 5), browserRect.bottom - 5);
        
        // Adjust target coordinates to be relative to the browser window
        const relX = safeX - browserRect.left;
        const relY = safeY - browserRect.top;

        if (instant) {
            setMousePos({ x: relX, y: relY });
            if (click) showClickEffect(relX, relY);
            resolve();
            return;
        }

        const steps = 25 + Math.floor(Math.random() * 15); // 25-40 steps
        const startX = mousePos.x < 0 ? relX - 50 : mousePos.x; // Start from current or slightly off-screen
        const startY = mousePos.y < 0 ? relY - 100 : mousePos.y;
        const distX = relX - startX;
        const distY = relY - startY;

        // More natural curve - slight overshoot/undershoot sometimes
        const controlX = startX + distX * (0.4 + Math.random() * 0.4); // 0.4 to 0.8
        const controlY = startY + distY * (0.6 + Math.random() * 0.3); // 0.6 to 0.9

        const bezierPoint = (t: number, p0: number, p1: number, p2: number) =>
            (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;

        let i = 0;
        const moveStep = () => {
            if (i >= steps) {
                setMousePos({ x: relX, y: relY }); // Ensure final position is exact
                if (click) {
                  setTimeout(() => {
                    showClickEffect(relX, relY);
                    resolve();
                  }, 100); // 100ms sonra tıklama daha doğal
                } else {
                  resolve();
                }
                return;
            }
            const progress = i / steps;
            // Ease in-out cubic for smoother start/end
            const easing = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const easedProgress = easing(progress);

            const currentX = bezierPoint(easedProgress, startX, controlX, relX);
            const currentY = bezierPoint(easedProgress, startY, controlY, relY);

            // Micro-movements decrease as target is approached
            const microMovement = (1 - progress) * (1.0 + Math.random() * 0.5);
            const randomX = (Math.random() * 2 - 1) * microMovement;
            const randomY = (Math.random() * 2 - 1) * microMovement;

            setMousePos({ x: currentX + randomX, y: currentY });
            i++;
            // Slightly variable speed
            setTimeout(moveStep, 10 + Math.random() * 10);
        };
        moveStep();
    });
  }, [mousePos.x, mousePos.y]); // Dependencies for useCallback

  const moveMouseToElement = async (element: HTMLElement, click = false) => {
      if (!element) {
        console.warn("moveMouseToElement: Null element geçildi");
        return;
      }
      
      try {
        // Elementin güncel pozisyonunu her seferinde al
        const rect = element.getBoundingClientRect();
        
        if (rect.width === 0 || rect.height === 0) {
          console.warn("moveMouseToElement: Element görünür değil veya boyutu sıfır");
          return;
        }
        
        // Elemanın merkez noktasına git, ama biraz rastgele bir konum seç
        // Daha iyi hedefleme için merkeze yakın ol
        const offsetXPercent = 0.5 + (Math.random() * 0.3 - 0.15); // Merkezden %15 sapma
        const offsetYPercent = 0.5 + (Math.random() * 0.3 - 0.15);
        
        const targetX = rect.left + (rect.width * offsetXPercent);
        const targetY = rect.top + (rect.height * offsetYPercent);
        
        await moveMouse(targetX, targetY, false, click, element);
      } catch (err) {
        console.error("moveMouseToElement hatası:", err);
      }
  };

  // --- Click Effect ---
  const showClickEffect = (x: number, y: number) => {
    setClickEffect({ x, y, show: true });
    setTimeout(() => setClickEffect({ x, y, show: false }), 350);
  };

  // --- UPDATED: Scrolling Animation ---
  const animateScroll = (element: HTMLElement, start: number, end: number, durationScale = 1) => {
    return new Promise<void>(resolve => {
        // --- UPDATE: Slightly faster base duration ---
        const duration = (600 + Math.random() * 300) * durationScale; // 0.6s - 0.9s base
        const startTime = Date.now();

        const animateStep = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // EaseInOutCubic for smooth start/end
            const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            const easedProgress = easeInOutCubic(progress);

            // Subtle "wobble" or imperfection during scroll
            const wobble = Math.sin(progress * Math.PI * (3 + Math.random())) * (1 - progress) * 2.5; // Slightly reduced wobble

            const newPos = start + (end - start) * easedProgress + wobble;
            element.scrollTop = newPos;

            if (progress < 1) {
                requestAnimationFrame(animateStep);
            } else {
                element.scrollTop = end; // Ensure final position
                resolve();
            }
        };
        requestAnimationFrame(animateStep);
    });
  };


  // --- API Calls ---
  const fetchSerp = async (keyword: string) => {
    setLoadingProgress(30); // Initial progress
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: keyword })
      });
      setLoadingProgress(70);
      if (!response.ok) throw new Error('Arama sonuçları alınamadı');
      const data = await response.json();
      let results = data.results || [];

      // --- FIX: Use fallback ONLY on error or empty results ---
      if (results.length === 0) {
          console.warn("No results from API, using fallback.");
          results = generateFallbackResults(keyword);
      }

      setSerp(results.slice(0, 5)); // Limit to 5 results
      setLoadingProgress(100);
      setStatusMessage(null);
      await wait(500); // Pause after loading
      setStep('reviewing_results');

    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Arama sırasında bir hata oluştu.');
      // Use fallback on error
      setSerp(generateFallbackResults(keyword).slice(0, 5));
      setLoadingProgress(100); // Still complete loading bar visually
      setStatusMessage(null);
      await wait(500);
      // Decide whether to continue with fallback or stop
      if (serp.length > 0) {
         setStep('reviewing_results'); // Try with fallback results
      } else {
         setStep('thinking_next_keyword'); // Skip keyword if fallback also fails (shouldn't happen)
      }
    }
  };

  const fetchSite = async (url: string, title: string) => {
    setLoadingProgress(30);
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      setLoadingProgress(70);
      const data = await response.json();
      let content = data.content || '';

      // --- UPDATE: Increase content length threshold before using fallback ---
      if (!content || content.length < 250) { // Increased from 100 to 250
        console.warn("Scraped content short/missing, generating fallback content.");
        content = generateWebsiteContent(title, currentKeyword);
      }

      const formattedContent = formatAsHtml(content);
      setSiteContent(formattedContent);

      // Add to collected data
      const currentKeywordData = collectedDataMap[currentKeyword] || [];
      // --- UPDATE: Store structured data ---
      const newData: ScrapedContent = { url, title, content }; // Ensure content here is the potentially longer one
      setCollectedDataMap(prev => ({
          ...prev,
          [currentKeyword]: [...currentKeywordData, newData]
      }));
      setTotalSources(prev => prev + 1); // Increment total source count

      setLoadingProgress(100);
      setStatusMessage(null);
      await wait(500);
      setStep('reading_site');

    } catch (err: any) {
      console.error('Website visit error:', err);
      // Generate fallback content on error
      const fallbackContent = generateWebsiteContent(title, currentKeyword);
      setSiteContent(formatAsHtml(fallbackContent));

      // --- UPDATE: Store structured fallback data ---
      const currentKeywordData = collectedDataMap[currentKeyword] || [];
      const fallbackData: ScrapedContent = { url, title, content: fallbackContent };
       setCollectedDataMap(prev => ({
          ...prev,
          [currentKeyword]: [...currentKeywordData, fallbackData]
      }));
      setTotalSources(prev => prev + 1);

      setLoadingProgress(100);
      setStatusMessage(null);
      await wait(500);
      setStep('reading_site'); // Proceed with fallback content
    }
  };

  // --- UPDATED: HTML Formatting ---
  const formatAsHtml = (text: string): string => {
      if (!text) return "<p class='text-gray-500 italic'>İçerik bulunamadı veya yüklenemedi.</p>";

      try {
          // Basic Markdown to HTML (Keep existing logic, maybe refine later)
          let html = text;
          // Simple image placeholder (replace basic image tags if scraper provides them)
          html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="my-4 p-2 border rounded text-center bg-gray-100"><span class="text-gray-500 text-sm">🖼️ Görüntü: $1</span></div>');
          // Basic link styling
          html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');
          // Headlines
          html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold my-4">$1</h1>');
          html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold my-3">$1</h2>');
          html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold my-2">$1</h3>');
          // Lists (basic)
          html = html.replace(/^\* (.+)$/gm, '<li class="ml-5 list-disc">$1</li>');
          html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-5 list-decimal">$1</li>');
          // Bold/Italic
          html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
          // Code blocks
          html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded my-4 overflow-x-auto"><code>$1</code></pre>');
          html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-200 px-1 rounded text-sm">$1</code>');

          // Wrap paragraphs
          html = html.split('\n\n').map(p => `<p class="mb-4 leading-relaxed">${p.replace(/\n/g, '<br/>')}</p>`).join('');
          // Wrap list items in <ul> or <ol> (simple approach)
          // Fixed regex to avoid 's' flag issue
          html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>)+/g, (match) => {
              if (match.includes('list-disc')) return `<ul class="mb-4">${match}</ul>`;
              if (match.includes('list-decimal')) return `<ol class="mb-4">${match}</ol>`;
              return match; // Should not happen with current regex
          });


          return `<div class="prose prose-sm max-w-none px-4 py-2">${html}</div>`; // Use Tailwind prose for basic styling
      } catch (error) {
          console.error("Error formatting content:", error);
          // Return raw text in a paragraph on error
          return `<div class="prose prose-sm max-w-none px-4 py-2"><p>${text.replace(/\n/g, '<br/>')}</p></div>`;
      }
  };

  // --- Fallback Content Generation ---
  const generateWebsiteContent = (title: string, keyword: string) => {
    const cleanKeyword = keyword
      .toLowerCase()
      .replace(/araştır|araştırabilir|araştırma|araştırır|araştırsana|incele|inceleyebilir|bak|öğren|analiz et|analiz yap/g, '')
      .trim();

    // DAHA UZUN ve DETAYLI fallback içerik
    return `# ${title}

## ${cleanKeyword} Nedir?

${cleanKeyword} konusu, dijital dünyada başarıya ulaşmak isteyen herkes için kritik bir öneme sahiptir. Bu alanda yapılan çalışmalar, web sitelerinin arama motorlarında daha üst sıralarda yer almasını sağlar. ${cleanKeyword} ile ilgili temel kavramlar, stratejiler ve güncel trendler aşağıda detaylıca ele alınmıştır.

### Temel Kavramlar

- **Anahtar Kelime Analizi:** Hedef kitlenizin aradığı terimleri belirleyin ve içeriklerinizi bu anahtar kelimeler etrafında şekillendirin.
- **Teknik Optimizasyon:** Site hızı, mobil uyumluluk, güvenlik ve erişilebilirlik gibi teknik faktörler, ${cleanKeyword} başarısında önemli rol oynar.
- **İçerik Kalitesi:** Özgün, bilgilendirici ve kullanıcıya değer katan içerikler oluşturmak, arama motorlarının dikkatini çeker.
- **Backlink Stratejisi:** Güvenilir ve alakalı sitelerden alınan bağlantılar, otoritenizi artırır.

### Güncel Trendler

1. **Yapay Zeka Destekli SEO:** Arama motorları, yapay zeka algoritmalarını daha etkin kullanıyor. İçeriklerinizi bu gelişmelere uygun şekilde optimize edin.
2. **Kullanıcı Deneyimi (UX):** Ziyaretçilerin sitede geçirdiği süre, gezinme kolaylığı ve etkileşim oranları, sıralamaları doğrudan etkiler.
3. **Sesli Arama Optimizasyonu:** Mobil cihazların yaygınlaşmasıyla birlikte, sesli arama için optimize edilmiş içerikler önem kazandı.
4. **Video ve Görsel SEO:** Multimedya içeriklerin doğru etiketlenmesi ve optimize edilmesi, organik trafiği artırır.

### Uygulama Örneği

Bir e-ticaret sitesi, ${cleanKeyword} stratejilerini uygulayarak 6 ayda organik trafiğini %200 artırdı. Bunun için anahtar kelime analizi, blog içerikleri, teknik iyileştirmeler ve backlink çalışmaları yapıldı. Sonuç olarak, satışlarda da ciddi bir artış gözlendi.

### Sık Yapılan Hatalar

- Sadece anahtar kelimeye odaklanmak, kullanıcı deneyimini göz ardı etmek
- Kopya içerik kullanmak
- Mobil uyumluluğu ihmal etmek
- Backlink alırken kalitesiz ve alakasız siteleri tercih etmek

### Sonuç

${cleanKeyword} alanında başarıya ulaşmak için sürekli güncel kalmak, analiz yapmak ve stratejileri dinamik şekilde uygulamak gerekir. Bu makalede anlatılan yöntemler, dijital dünyada öne çıkmak isteyen herkes için yol gösterici olacaktır.

---

Daha fazla bilgi için güncel kaynakları ve sektörel blogları takip etmeyi unutmayın.`;
  };

  // --- UPDATED: Reading Simulation ---
  const simulateReading = async () => {
    if (!contentRef.current) {
        setStep('thinking_next_keyword');
        return;
    }

    const contentElement = contentRef.current;
    const scrollHeight = contentElement.scrollHeight;
    const clientHeight = contentElement.clientHeight;
    const maxScroll = scrollHeight - clientHeight;

    if (maxScroll <= 0) { // No scroll needed
        await wait(900 + Math.random() * 900); // Daha kısa bekle
        setStep('thinking_next_keyword');
        return;
    }

    // DAHA HIZLI okuma için süreyi azalt
    const baseReadTime = Math.min(9000, Math.max(2500, maxScroll * 2.5));
    const startTime = Date.now();
    let currentScroll = contentElement.scrollTop;
    let readingFinished = false;

    const readStep = async () => {
        if (!contentElement || readingFinished) return;

        const elapsed = Date.now() - startTime;
        let progress = Math.min(elapsed / baseReadTime, 1);

        // --- UPDATE: Add slight acceleration ---
        progress = Math.pow(progress, 0.85); // Daha hızlı başla

        // Human-like scroll easing (less robotic)
        const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
        const easedProgress = easeInOutSine(progress);

        let targetScroll = easedProgress * maxScroll;

        // Add some randomness and pauses
        if (Math.random() < 0.02 && progress < 0.9 && progress > 0.1) { // Slightly less frequent pauses
            setStatusMessage(readingMessages[Math.floor(Math.random() * readingMessages.length)]);
            await wait(200 + Math.random() * 400); // Shorter pauses
            setStatusMessage(null);
            // Adjust start time to account for pause - Recalculate progress based on new start time
            // This might be complex, simpler to just let it catch up or slightly extend total time implicitly.
        }

        // Simulate slight scroll adjustments / corrections
        const adjustment = (Math.random() - 0.5) * 6 * (1 - progress); // Reduced adjustment magnitude
        targetScroll = Math.max(0, Math.min(maxScroll, targetScroll + adjustment)); // Clamp scroll value

        // Apply scroll smoothly using animateScroll for larger jumps
        const scrollDiff = targetScroll - currentScroll;
        if (Math.abs(scrollDiff) > 8) {
             // --- UPDATE: Use faster animation for scroll steps ---
             await animateScroll(contentElement, currentScroll, targetScroll, 0.05); // Daha hızlı scroll
             currentScroll = contentElement.scrollTop; // Update current scroll after animation
        } else if (Math.abs(scrollDiff) > 1) {
             contentElement.scrollTop = targetScroll; // Small jumps are ok
             currentScroll = targetScroll;
        }
        // else: very small diff, do nothing to avoid jitter

        if (progress < 1) {
            requestAnimationFrame(readStep);
        } else {
            readingFinished = true;
            await wait(200 + Math.random() * 300); // Shorter final pause
            setStatusMessage(null);
            setStep('thinking_next_keyword'); // Move to next step
        }
    };

    // Initial scroll down slightly
    await animateScroll(contentElement, 0, Math.min(40, maxScroll), 0.2); // Slightly faster initial scroll
    currentScroll = contentElement.scrollTop;
    await wait(200); // Shorter wait

    requestAnimationFrame(readStep);
  };


  // --- UPDATED: Finish Research ---
  const finishResearch = () => {
    console.log("Research finished. Passing collected data to onComplete:", collectedDataMap);
    console.log(`Total sources collected: ${totalSources}`);
    
    // İstatistikleri loglayalım - her anahtar kelime için ne kadar kaynak toplandığını görelim
    const statsPerKeyword = Object.keys(collectedDataMap).map(keyword => {
      const count = collectedDataMap[keyword]?.length || 0;
      return `${keyword}: ${count} kaynak`;
    });
    console.log("Özet istatistikler:", statsPerKeyword.join(", "));

    // Tüm verileri onComplete'e iletiyoruz - API'ye gönderilecek yapı
    onComplete(collectedDataMap, totalSources);
  };

  // --- RENDER ---
  return (
    <motion.div
      // ... existing modal container styles ...
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 sm:p-6"
    >
      <motion.div
        ref={browserRef}
        // ... existing browser window styles ...
        className="w-full max-w-5xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-2xl flex flex-col"
        style={{ backgroundColor: colors.background.card }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Browser Header */}
        {/* ... existing header ... */}
         <div
          className="flex items-center justify-between p-2 border-b"
          style={{ borderColor: colors.border }}
        >
          {/* ... window buttons ... */}
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 text-center text-xs font-medium" style={{ color: colors.text.secondary }}>
             NovaSEO Araştırma AI
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={onClose}
            aria-label="Kapat"
          >
            <X size={16} />
          </button>
        </div>


        {/* Browser Toolbar */}
        <div
          className="flex items-center p-2 border-b space-x-2"
          style={{ borderColor: colors.border }}
        >
          {/* Nav Buttons */}
          <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50" disabled style={{ color: colors.text.secondary }}><ArrowLeft size={18} /></button>
          <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50" disabled style={{ color: colors.text.secondary }}><ArrowRight size={18} /></button>
          <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" onClick={() => step === 'searching' || step === 'loading_site' ? null : setStep('searching')} style={{ color: colors.text.secondary }}><RotateCw size={18} /></button>

          {/* Address Bar */}
          <div
            className="flex-1 flex items-center h-8 px-3 rounded-full border bg-gray-100 dark:bg-gray-700"
            style={{ borderColor: colors.border, backgroundColor: colors.background.main }}
          >
            {step === 'loading_site' || step === 'reading_site' ? (
              <>
                <Lock size={14} className="mr-2 flex-shrink-0" style={{ color: colors.success }} />
                <span className="text-sm truncate" style={{ color: colors.text.secondary }}>{currentUrl || '...'}</span>
              </>
            ) : (
              <>
                <Search size={14} className="mr-2 flex-shrink-0" style={{ color: colors.text.secondary }} />
                {/* Display static keyword here, typing happens in the main search view */}
                <span className="text-sm truncate" style={{ color: colors.text.primary }}>{currentKeyword || '...'}</span>
              </>
            )}
          </div>
           {/* Menu Button - Placeholder */}
           <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700" style={{ color: colors.text.secondary }}><Menu size={18} /></button>
        </div>

        {/* Loading Progress Bar */}
        {(step === 'searching' || step === 'loading_site') && (
          <div className="h-0.5 bg-gray-200 dark:bg-gray-700 w-full">
            <motion.div
              className="h-full"
              style={{ backgroundColor: colors.primary }}
              initial={{ width: '0%' }}
              animate={{ width: `${loadingProgress}%` }}
              transition={{ duration: 0.5, ease: "linear" }}
            />
          </div>
        )}

        {/* Overall Research Progress */}
        {/* ... existing progress bar ... */}
         <div className="px-4 py-1.5 flex items-center justify-between border-b text-xs" style={{ borderColor: colors.border }}>
          <div className="flex items-center space-x-2">
            <span style={{ color: colors.text.secondary }}>İlerleme:</span>
            <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <motion.div // Use motion here for smoother progress update
                className="h-full"
                style={{ backgroundColor: colors.primary }}
                initial={{ width: '0%' }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
          <div style={{ color: colors.text.secondary }}>
            {/* --- UPDATE: Display reflects 5 sites target --- */}
            Yapay Zeka Araştırma Araştırma Yapıyor:  {totalSources} kaynak toplandı (CANLI)
          </div>
        </div>


        {/* Browser Content */}
        <div
          className="flex-1 overflow-auto relative"
          style={{ backgroundColor: colors.background.main }}
          ref={contentRef}
        >
          {/* Mouse Cursor */}
          {/* ... existing mouse cursor & click effect ... */}
           <motion.div
            className="absolute z-50 pointer-events-none"
            style={{
              left: mousePos.x,
              top: mousePos.y,
              opacity: mousePos.x > -10 ? 1 : 0 // Show when position is valid
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }} // Spring physics for smoother movement
          >
            <MousePointer size={20} style={{ color: colors.primary }} className="drop-shadow-lg" />
            {clickEffect.show && (
              <motion.div
                // ... click effect styles ...
                 style={{
                  position: 'absolute',
                  left: -8, // Center the effect
                  top: -8,
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: `2px solid ${colors.primary}`,
                  pointerEvents: 'none',
                  zIndex: 100,
                  opacity: 0.7 // Start slightly transparent
                }}
                 initial={{ scale: 0.5, opacity: 0.7 }}
                 animate={{ scale: 1.8, opacity: 0 }}
                 transition={{ duration: 0.35, ease: "easeOut" }}
              />
            )}
          </motion.div>

          {/* Status Message */}
          <AnimatePresence>
            {statusMessage && (
              <motion.div
                // ... status message styles ...
                className="absolute left-1/2 top-4 transform -translate-x-1/2 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-4 py-2 rounded shadow-lg text-sm font-medium z-40"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {statusMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- UPDATED: Search Interface (Google Style) --- */}
          {(step === 'thinking_before_search' || step === 'typing_search' || (step === 'searching' && loadingProgress < 50)) && (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              {/* Google Logo */}
              <img src="/google_logo.png" alt="Google Logo" className="h-24 mb-8 object-contain" /> {/* Adjust path and size */}

              {/* Search Bar with Typing Effect */}
              <div className="w-full max-w-xl">
                <div
                  className="flex items-center h-11 px-4 rounded-full border hover:shadow-md focus-within:shadow-md transition-shadow mb-6 bg-white dark:bg-gray-700"
                  style={{ borderColor: colors.border }}
                >
                  <Search size={18} className="mr-3 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    readOnly // Display only, typing is simulated
                    value={displayedKeyword}
                    className="flex-1 h-full bg-transparent focus:outline-none"
                    style={{ color: colors.text.primary }}
                  />
                   {/* Blinking cursor simulation */}
                   {isTyping && <span className="animate-pulse">|</span>}
                </div>

                {/* Search Buttons */}
                <div className="flex justify-center space-x-3">
                  <button
                    id="nova-search-button" // ID for targeting click simulation
                    className="px-4 py-2 rounded text-sm"
                    style={{ backgroundColor: colors.background.card, color: colors.text.primary, border: `1px solid ${colors.border}` }}
                    onClick={() => step === 'typing_search' && !isTyping ? setStep('searching') : null} // Allow manual click if typing done
                  >
                    NovaSEO ile Ara
                  </button>
                  <button
                    className="px-4 py-2 rounded text-sm"
                    style={{ backgroundColor: colors.background.card, color: colors.text.primary, border: `1px solid ${colors.border}` }}
                  >
                    Kendimi Şanslı Hissediyorum
                  </button>
                </div>
               {/* Loading indicator during search */}
               {step === 'searching' && (
                 <div className="mt-8 text-sm" style={{ color: colors.text.secondary }}>
                   Arama yapılıyor...
                 </div>
               )}
              </div>
            </div>
          )}

          {/* --- UPDATED: Search Results --- */}
          {(step === 'reviewing_results' || step === 'scrolling_to_result' || step === 'clicking_result' || (step === 'loading_site' && loadingProgress < 50)) && (
            <div className="p-4 sm:p-6 max-w-3xl mx-auto">
              {/* Search Bar (static) */}
               <div className="flex items-center mb-6">
                 <img src="/google_logo.png" alt="Google Logo" className="h-6 mr-4 object-contain" />
                 <div
                    className="flex-1 flex items-center h-10 px-4 rounded-full border bg-white dark:bg-gray-700 shadow-sm"
                    style={{ borderColor: colors.border }}
                  >
                    <span className="text-sm" style={{ color: colors.text.primary }}>{currentKeyword}</span>
                    <Search size={18} className="ml-auto text-blue-600" />
                 </div>
               </div>

              {/* Result Count */}
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Yaklaşık {(Math.floor(Math.random() * 9) + 1).toLocaleString()}.{(Math.floor(Math.random() * 999) + 1).toString().padStart(3, '0')}.000 sonuç bulundu ({(Math.random() * 0.9 + 0.1).toFixed(2)} saniye)
              </div>

              {/* Results */}
              <div className="space-y-6">
                {serp.map((result, index) => (
                  <div
                    key={result.url + index} // Use URL + index for key
                    id={`result-${index}`} // ID for targeting scroll/mouse
                    className={cn(
                        "search-result-item transition-all duration-200 ease-in-out", // Added transition
                        // --- UPDATE: More subtle highlight ---
                        step === 'reviewing_results' && siteIdx === index && "bg-blue-50 dark:bg-gray-700/50 rounded-lg p-2",
                        step === 'clicking_result' && siteIdx === index && "bg-blue-100 dark:bg-blue-900/50 scale-[0.98] rounded-lg p-2" // Add scale effect on click
                    )}
                  >
                    <div className="flex items-center text-sm mb-1">
                       {/* Favicon Placeholder */}
                       <img
                         src={result.favicon || `https://www.google.com/s2/favicons?domain=${result.url?.split('/')[2]}&sz=16`}
                         alt=""
                         className="w-4 h-4 mr-2 inline-block align-middle" // Added align-middle
                         onError={(e) => {
                             // Attempt to fix potential relative path issues if needed
                             const placeholder = '/favicon-placeholder.png';
                             if (e.currentTarget.src !== placeholder) {
                                 e.currentTarget.src = placeholder;
                             }
                         }}
                       />
                      {/* --- UPDATE: Improved URL display --- */}
                      <span className="text-gray-600 dark:text-gray-400 text-xs truncate">{result.url?.replace(/^https?:\/\//, '').split('/')[0]}</span>
                    </div>
                    <a
                      href={result.url} // Make it a real link (though click is simulated)
                      target="_blank" // Open in new tab if user actually clicks
                      rel="noopener noreferrer"
                      onClick={(e) => e.preventDefault()} // Prevent default click
                      className="block group"
                    >
                      <h3
                        className="text-lg text-blue-700 dark:text-blue-400 group-hover:underline mb-1 truncate"
                      >
                        {result.title}
                      </h3>
                    </a>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
                      {result.snippet}
                    </p>
                  </div>
                ))}
              </div>

              {/* Pagination Placeholder */}
              {serp.length > 0 && (
                 <div className="mt-10 flex justify-center">
                   {/* ... existing pagination ... */}
                 </div>
              )}
            </div>
          )}


          {/* --- UPDATED: Website Content --- */}
          {(step === 'loading_site' || step === 'reading_site') && siteContent && (
            <div className="p-4 sm:p-6">
              {/* Highlight element - Needs refinement for positioning relative to scroll */}
              {/* {highlightedElement && ( ... )} */}
              <div
                className="website-content" // Tailwind prose handles styling via formatAsHtml
                dangerouslySetInnerHTML={{ __html: siteContent }}
              />
            </div>
          )}

          {/* Loading State (Generic) */}
          {(step === 'searching' || step === 'loading_site') && loadingProgress < 100 && !statusMessage && (
             <div className="flex items-center justify-center h-full p-6 text-center">
                <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                     style={{ borderColor: `${colors.primary}40`, borderTopColor: 'transparent' }}></div>
                <span className="ml-4 text-sm" style={{ color: colors.text.secondary }}>Yükleniyor...</span>
             </div>
          )}

          {/* Error Display */}
          {/* ... existing error display ... */}
           <AnimatePresence>
            {error && (
              <motion.div
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-lg text-sm z-40 flex items-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <span>{error}</span>
                <button className="ml-4 text-red-700 hover:text-red-900" onClick={() => setError(null)}>
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Browser Footer */}
        {/* ... existing footer ... */}
         <div
          className="flex items-center justify-between p-2 border-t text-xs"
          style={{ borderColor: colors.border, color: colors.text.secondary }}
        >
          <div className="flex items-center space-x-3">
            <span className="flex items-center"><FileText size={12} className="mr-1" /> {totalSources} Kaynak Toplandı</span>
          </div>
          <div className="flex items-center space-x-3">
             <span className="flex items-center"><Star size={12} className="mr-1 text-yellow-500" /> NovaSEO AI</span>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};

export default VirtualResearchBox;