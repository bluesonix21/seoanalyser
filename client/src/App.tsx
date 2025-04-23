import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import "@fontsource/inter";
import { useGame } from "./lib/stores/useGame";
import { useAudio } from "./lib/stores/useAudio";

// NovaSEO Dashboard Components
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
  const { initializeGame, gameState } = useGame();
  const { initializeAudio } = useAudio();
  const [loading, setLoading] = useState(true);

  // Initialize the app
  useEffect(() => {
    const loadApp = async () => {
      try {
        await initializeGame();
        await initializeAudio();
      } catch (error) {
        console.error("Failed to initialize app:", error);
      } finally {
        setLoading(false);
      }
    };

    loadApp();
  }, [initializeGame, initializeAudio]);

  // Show loading screen while initializing
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold text-white">NovaSEO Dashboard Yükleniyor...</h2>
          <p className="mt-2 text-gray-400">Gelişmiş analiz araçları hazırlanıyor...</p>
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
