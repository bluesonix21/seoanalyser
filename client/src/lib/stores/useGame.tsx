import { create } from "zustand";

// Game state types
export type SEOData = {
  score: number;
  issues: number;
  improvements: number;
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
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
  initializeGame: () => Promise<void>;
  setSEOData: (data: Partial<SEOData>) => void;
  setBacklinkData: (data: Partial<BacklinkData>) => void;
  setCompetitorData: (data: CompetitorData[]) => void;
  setKeywordData: (data: KeywordData[]) => void;
  setPerformanceData: (data: PerformanceData[]) => void;
  setContentData: (data: ContentData[]) => void;
  setSiteAuditData: (data: Partial<SiteAuditData>) => void;
  setLanguage: (lang: "en" | "tr" | "ar" | "ru" | "cn") => void;
}

// Generate mock data
const generateMockData = () => {
  // SEO data
  const mockSEOData: SEOData = {
    score: 76,
    issues: 12,
    improvements: 8,
    performanceScore: 82,
    accessibilityScore: 94,
    bestPracticesScore: 80,
    seoScore: 88
  };
  
  // Backlink data with 30 days of history
  const mockBacklinkData: BacklinkData = {
    total: 1247,
    domains: 342,
    quality: {
      high: 425,
      medium: 638,
      low: 184
    },
    newLinks: Array.from({ length: 30 }, () => Math.floor(Math.random() * 20)),
    lostLinks: Array.from({ length: 30 }, () => Math.floor(Math.random() * 15))
  };
  
  // Competitor data
  const mockCompetitorData: CompetitorData[] = [
    { name: "competitor1.com", score: 82, backlinks: 2043, traffic: 543000, keywords: 4281 },
    { name: "competitor2.com", score: 79, backlinks: 1876, traffic: 491000, keywords: 3942 },
    { name: "competitor3.com", score: 88, backlinks: 2371, traffic: 612000, keywords: 5102 },
    { name: "competitor4.com", score: 68, backlinks: 927, traffic: 267000, keywords: 2150 }
  ];
  
  // Keyword data
  const mockKeywordData: KeywordData[] = [
    { keyword: "seo tools", volume: 12500, difficulty: 67, cpc: 3.42, position: 8 },
    { keyword: "backlink analysis", volume: 6300, difficulty: 54, cpc: 2.85, position: 4 },
    { keyword: "seo dashboard", volume: 4700, difficulty: 42, cpc: 2.31, position: 2 },
    { keyword: "competitor analysis", volume: 9200, difficulty: 61, cpc: 3.17, position: 12 },
    { keyword: "keyword research tool", volume: 7800, difficulty: 72, cpc: 4.26, position: 18 },
    { keyword: "site audit software", volume: 3600, difficulty: 49, cpc: 2.93, position: 7 },
    { keyword: "seo performance tracking", volume: 2900, difficulty: 37, cpc: 1.98, position: null },
    { keyword: "content optimization", volume: 5400, difficulty: 58, cpc: 3.56, position: 5 }
  ];
  
  // Performance data (last 30 days)
  const mockPerformanceData: PerformanceData[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    
    return {
      date: date.toISOString().split('T')[0],
      visitors: 5000 + Math.floor(Math.random() * 2000),
      pageViews: 12000 + Math.floor(Math.random() * 4000),
      bounceRate: 35 + Math.floor(Math.random() * 15),
      avgTime: 120 + Math.floor(Math.random() * 60)
    };
  });
  
  // Content data
  const mockContentData: ContentData[] = [
    { url: "/blog/seo-tips-2023", title: "Top SEO Tips for 2023", length: 2456, score: 92, readability: 78 },
    { url: "/blog/backlink-strategies", title: "Effective Backlink Strategies", length: 3124, score: 85, readability: 82 },
    { url: "/blog/keyword-research", title: "Advanced Keyword Research", length: 1876, score: 79, readability: 75 },
    { url: "/blog/mobile-optimization", title: "Mobile SEO Optimization", length: 2234, score: 88, readability: 80 },
    { url: "/case-studies/ecommerce-seo", title: "E-commerce SEO Case Study", length: 3456, score: 94, readability: 76 }
  ];
  
  // Site audit data
  const mockSiteAuditData: SiteAuditData = {
    errors: 8,
    warnings: 24,
    improvements: 17,
    categories: [
      { name: "Broken Links", count: 4, severity: "error" },
      { name: "Missing Meta Tags", count: 12, severity: "warning" },
      { name: "Image Optimization", count: 18, severity: "warning" },
      { name: "Mobile Usability", count: 7, severity: "info" },
      { name: "Page Speed", count: 4, severity: "error" },
      { name: "Schema Markup", count: 9, severity: "warning" }
    ]
  };
  
  return {
    mockSEOData,
    mockBacklinkData,
    mockCompetitorData,
    mockKeywordData,
    mockPerformanceData,
    mockContentData,
    mockSiteAuditData
  };
};

// Create the store
export const useGame = create<GameState>((set) => ({
  // Initial state
  seoData: {
    score: 0,
    issues: 0,
    improvements: 0,
    performanceScore: 0,
    accessibilityScore: 0,
    bestPracticesScore: 0,
    seoScore: 0
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
  initializeGame: async () => {
    set({ loadingState: "loading" });
    
    try {
      // In a real app, this would fetch data from an API
      // For now, we'll simulate a delay and use mock data
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const {
        mockSEOData,
        mockBacklinkData,
        mockCompetitorData,
        mockKeywordData,
        mockPerformanceData,
        mockContentData,
        mockSiteAuditData
      } = generateMockData();
      
      set({
        seoData: mockSEOData,
        backlinkData: mockBacklinkData,
        competitorData: mockCompetitorData,
        keywordData: mockKeywordData,
        performanceData: mockPerformanceData,
        contentData: mockContentData,
        siteAuditData: mockSiteAuditData,
        loadingState: "success",
        isInitialized: true
      });
    } catch (error) {
      console.error("Failed to initialize game:", error);
      set({
        loadingState: "error",
        error: "Failed to load dashboard data. Please try again."
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