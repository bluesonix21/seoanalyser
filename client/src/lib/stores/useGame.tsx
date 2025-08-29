import { create } from "zustand";
import { apiRequest } from "../queryClient";

// Game state types
export type SEOData = {
  score: number;
  seoScore: number;
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  issues: any[];
  improvements: any[];
  title?: string;
  description?: string;
  url?: string;
};

export type BacklinkData = {
  total: number;
  domains: number;
  quality: {
    high: number;
    medium: number;
    low: number;
  };
  newLinks: number[];
  lostLinks: number[];
};

export type CompetitorData = {
  name: string;
  score: number;
  backlinks: number;
  traffic: number;
  keywords: number;
};

export type KeywordData = {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  position: number | null;
};

export type PerformanceData = {
  date: string;
  visitors: number;
  pageViews: number;
  bounceRate: number;
  avgTime: number;
};

export type ContentData = {
  url: string;
  title: string;
  length: number;
  score: number;
  readability: number;
  issues?: {
    type: string;
    message: string;
    suggestion: string;
    impact?: string;
  }[];
};

export type SiteAuditData = {
  errors: number;
  warnings: number;
  improvements: number;
  categories: {
    name: string;
    count: number;
    severity: "error" | "warning" | "info";
  }[];
};

// Dashboard state
interface GameState {
  // Dashboard data
  seoData: SEOData;
  backlinkData: BacklinkData;
  competitorData: CompetitorData[];
  keywordData: KeywordData[];
  performanceData: PerformanceData[];
  contentData: ContentData[];
  siteAuditData: SiteAuditData;
  loadingState: "idle" | "loading" | "success" | "error";
  error: string | null;
  
  // User settings
  language: "en" | "tr" | "ar" | "ru" | "cn";
  
  // App state
  isInitialized: boolean;
  
  // Methods
  initializeGame: (url: string) => Promise<void>;
  setSEOData: (data: Partial<SEOData>) => void;
  setBacklinkData: (data: Partial<BacklinkData>) => void;
  setCompetitorData: (data: CompetitorData[]) => void;
  setKeywordData: (data: KeywordData[]) => void;
  setPerformanceData: (data: PerformanceData[]) => void;
  setContentData: (data: ContentData[]) => void;
  setSiteAuditData: (data: Partial<SiteAuditData>) => void;
  setLanguage: (lang: "en" | "tr" | "ar" | "ru" | "cn") => void;
}

// Create the store
export const useGame = create<GameState>((set) => ({
  // Initial state
  seoData: {
    score: 0,
    seoScore: 0,
    performanceScore: 0,
    accessibilityScore: 0,
    bestPracticesScore: 0,
    issues: [],
    improvements: [],
    title: '',
    description: '',
    url: ''
  },
  backlinkData: {
    total: 0,
    domains: 0,
    quality: {
      high: 0,
      medium: 0,
      low: 0
    },
    newLinks: [],
    lostLinks: []
  },
  competitorData: [],
  keywordData: [],
  performanceData: [],
  contentData: [],
  siteAuditData: {
    errors: 0,
    warnings: 0,
    improvements: 0,
    categories: []
  },
  loadingState: "idle",
  error: null,
  language: "en",
  isInitialized: false,
  
  // Initialize the game
  initializeGame: async (url: string) => {
    set({ loadingState: "loading" });
    try {
      // SEO ANALYSIS
      const seoRes = await apiRequest("POST", "/api/analyze-url", { url });
      const seoData = await seoRes.json();
      // BACKLINK ANALYSIS
      const backlinkRes = await apiRequest("POST", "/api/backlink-analysis", { url });
      const backlinkData = await backlinkRes.json();
      // COMPETITOR ANALYSIS
      const competitorRes = await apiRequest("POST", "/api/competitor-analysis", { url });
      const competitorData = (await competitorRes.json()).competitors;
      // KEYWORD ANALYSIS
      const keywordRes = await apiRequest("POST", "/api/keyword-analysis", { url });
      const keywordData = (await keywordRes.json()).keywords;
      // CONTENT ANALYSIS
      const contentRes = await apiRequest("POST", "/api/content-analysis", { url });
      const contentData = (await contentRes.json()).contents;
      // SITE AUDIT
      const auditRes = await apiRequest("POST", "/api/site-audit", { url });
      const auditData = await auditRes.json();

      set({
        seoData: {
          score: seoData.seoScore || 0,
          seoScore: seoData.seoScore || 0,
          performanceScore: seoData.performanceScore || 0,
          accessibilityScore: seoData.accessibilityScore || 0,
          bestPracticesScore: seoData.bestPracticesScore || 0,
          issues: Array.isArray(seoData.issues) ? seoData.issues : [],
          improvements: Array.isArray(seoData.improvements) ? seoData.improvements : [],
          title: seoData.title || '',
          description: seoData.description || '',
          url: seoData.url || ''
        },
        backlinkData: {
          total: backlinkData.total,
          domains: backlinkData.domains,
          quality: backlinkData.quality,
          newLinks: backlinkData.newLinks,
          lostLinks: backlinkData.lostLinks
        },
        competitorData: competitorData,
        keywordData: keywordData,
        performanceData: [], // API'den alınca doldur
        contentData: contentData,
        siteAuditData: {
          errors: auditData.errors,
          warnings: auditData.warnings,
          improvements: auditData.improvements,
          categories: auditData.categories
        },
        loadingState: "success",
        isInitialized: true,
        error: null
      });
    } catch (error: any) {
      set({
        loadingState: "error",
        error: error.message || "Veri alınırken hata oluştu."
      });
    }
  },
  
  // Update methods
  setSEOData: (data) => set((state) => ({
    seoData: { ...state.seoData, ...data }
  })),
  
  setBacklinkData: (data) => set((state) => ({
    backlinkData: { ...state.backlinkData, ...data }
  })),
  
  setCompetitorData: (data) => set({
    competitorData: data
  }),
  
  setKeywordData: (data) => set({
    keywordData: data
  }),
  
  setPerformanceData: (data) => set({
    performanceData: data
  }),
  
  setContentData: (data) => set({
    contentData: data
  }),
  
  setSiteAuditData: (data) => set((state) => ({
    siteAuditData: { ...state.siteAuditData, ...data }
  })),
  
  setLanguage: (lang) => set({
    language: lang
  })
}));