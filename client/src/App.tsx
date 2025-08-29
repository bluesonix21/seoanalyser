import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import "@fontsource/inter";
import { useGame } from "./lib/stores/useGame";
import { useAudio } from "./lib/stores/useAudio";

// Free SeoAnalyser Dashboard Components
import Dashboard from "./components/dashboard/Dashboard";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import SEOScorePage from "./components/pages/SEOScorePage";
import BacklinkMapPage from "./components/pages/BacklinkMapPage";
import CompetitorAnalysisPage from "./components/pages/CompetitorAnalysisPage";
import KeywordResearchPage from "./components/pages/KeywordResearchPage";
import PerformanceTrackingPage from "./components/pages/PerformanceTrackingPage";
import ContentAnalysisPage from "./components/pages/ContentAnalysisPage";
import SiteAuditPage from "./components/pages/SiteAuditPage";
import ReportsPage from "./components/pages/ReportsPage";
import SettingsPage from "./components/pages/SettingsPage";
import AIAssistantPage from "./components/pages/AIAssistantPage";
import HelpPage from "./components/pages/HelpPage";
import NotFoundPage from "./pages/not-found";

// Theme Provider
import { ThemeProvider } from "./components/theme/ThemeProvider";
import Toast from "./components/ui/Toast";

// Create a client for React Query
const queryClient = new QueryClient();

// Main App component
function App() {
  const { initializeGame } = useGame();
  const { initializeAudio } = useAudio();
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loadingState } = useGame();
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeStage, setAnalyzeStage] = useState("");

  // Başlat butonuna basınca analiz başlat
  const handleStart = async () => {
    setLoading(true);
    setError(null);
    setAnalyzeProgress(0);
    setAnalyzeStage("Bağlantı kuruluyor...");
    
    try {
      // Daha etkileyici bir yükleme animasyonu için yapay gecikme ve ilerleme aşamaları
      await simulateProgress("Bağlantı kuruluyor...", 0, 15);
      await simulateProgress("Sunucu yanıtı alınıyor...", 15, 30);
      await simulateProgress("Sayfa kaynakları inceleniyor...", 30, 45);
      await simulateProgress("SEO parametreleri hesaplanıyor...", 45, 60);
      await simulateProgress("Backlink analizi yapılıyor...", 60, 75);
      await simulateProgress("Performans metrikleri toplanıyor...", 75, 90);
      await simulateProgress("Sonuçlar hazırlanıyor...", 90, 99);
      
      await initializeGame(url);
      await initializeAudio();
      
      setAnalyzeProgress(100);
      setAnalyzeStage("Analiz tamamlandı!");
      
      // Kısa bir gecikme ile başlangıç ekranından çıkma
      setTimeout(() => {
        setStarted(true);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu");
      setAnalyzeProgress(0);
    } finally {
      setLoading(false);
    }
  };
  
  // İlerleme animasyonu için yardımcı fonksiyon
  const simulateProgress = async (stage: string, startPercent: number, endPercent: number) => {
    setAnalyzeStage(stage);
    const duration = 800; // milisaniye
    const stepCount = 20;
    const stepSize = (endPercent - startPercent) / stepCount;
    const stepTime = duration / stepCount;
    
    for (let i = 0; i <= stepCount; i++) {
      setAnalyzeProgress(startPercent + stepSize * i);
      await new Promise(resolve => setTimeout(resolve, stepTime));
    }
  };

  if (!started) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-950 to-black overflow-hidden">
        {/* Animasyonlu arka plan efektleri */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(var(--tw-gradient-stops))] from-blue-500 via-purple-600 to-blue-500 opacity-10 animate-slow-spin blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent"></div>
          <div className="grid grid-cols-8 grid-rows-8 gap-4 absolute inset-0 opacity-10">
            {Array(64).fill(0).map((_, i) => (
              <div key={i} className="border border-purple-500/10"></div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 w-full max-w-2xl mx-auto p-8">
          {/* Logo ve Başlık */}
          <div className="text-center mb-12">
            <div className="inline-block p-3 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg shadow-purple-500/30 mb-6">
              <div className="bg-black p-4 rounded-full">
                <svg className="w-20 h-20 text-purple-500 mx-auto" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500 tracking-tight">
              Free SeoAnalyser
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mt-3 mb-4"></div>
            <p className="text-gray-300 max-w-lg mx-auto">
              Gelişmiş yapay zeka algoritmaları ile web sitenizin SEO performansını detaylı analiz edin
            </p>
          </div>
          
          {/* Giriş Formu */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-1 rounded-2xl shadow-xl shadow-purple-900/20">
            <div className="bg-black/80 backdrop-blur-xl rounded-xl p-8 border border-gray-800">
              {/* URL Girişi */}
              <div className="mb-6">
                <label htmlFor="url-input" className="block text-sm font-medium text-gray-400 mb-2">
                  Web Site URL'i
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-purple-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                    </svg>
                  </div>
                  <input
                    id="url-input"
                    type="text"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="https://ornek.com"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              
              {/* İlerleme Durumu */}
              {loading && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-400">{analyzeStage}</span>
                    <span className="text-sm font-medium text-purple-400">{Math.round(analyzeProgress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 rounded-full transition-all duration-300" 
                      style={{ width: `${analyzeProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Başlat Butonu */}
              <button
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 relative overflow-hidden group ${
                  loading || !url.startsWith("http") 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/30'
                }`}
                onClick={handleStart}
                disabled={loading || !url.startsWith("http")}
              >
                {!loading && (
                  <span className="absolute inset-0 w-full h-full grid grid-cols-12 opacity-0 group-hover:opacity-10">
                    {Array(12).fill(0).map((_, i) => (
                      <div key={i} className="h-full bg-white"></div>
                    ))}
                  </span>
                )}
                <span className="relative flex items-center justify-center">
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analiz Ediliyor
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                      Analizi Başlat
                    </span>
                  )}
                </span>
              </button>
              
              {/* Hata Mesajı */}
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-900/20 border border-red-800">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Alt Bilgi */}
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>Free SeoAnalyser v1.0.0 | &copy; 2025 Open Source Community</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            {/* Sidebar */}
            <Sidebar />
            
            {/* Main Content */}
            <div className="flex flex-col flex-grow overflow-hidden">
              {/* Header */}
              <Header />
              
              {/* Global Loading Overlay */}
              {loadingState === "loading" && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80">
                  <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-purple-500 mb-8"></div>
                  <h2 className="text-2xl font-bold mb-2 text-white">Analiz Devam Ediyor...</h2>
                  <p className="text-lg text-gray-300">Lütfen bekleyin, web siteniz detaylı olarak analiz ediliyor.</p>
                </div>
              )}
              
              {/* Content Area */}
              <main className="flex-grow p-6 overflow-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/seo-score" element={<SEOScorePage />} />
                  <Route path="/backlink-map" element={<BacklinkMapPage />} />
                  <Route path="/competitor-analysis" element={<CompetitorAnalysisPage />} />
                  <Route path="/keyword-research" element={<KeywordResearchPage />} />
                  <Route path="/performance-tracking" element={<PerformanceTrackingPage />} />
                  <Route path="/content-analysis" element={<ContentAnalysisPage />} />
                  <Route path="/site-audit" element={<SiteAuditPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/ai-assistant" element={<AIAssistantPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/not-found" element={<NotFoundPage />} />
                  <Route path="*" element={<Navigate to="/not-found" replace />} />
                </Routes>
              </main>
              
              {/* Toast Notifications */}
              <Toast />
            </div>
          </div>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
