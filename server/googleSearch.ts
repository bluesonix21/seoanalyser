import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// SerpAPI anahtarını .env dosyasından alın
const SERPAPI_KEY = process.env.SERPAPI_KEY;

// API key kontrolü
if (!SERPAPI_KEY) {
  console.error('SERPAPI_KEY is not set in environment variables');
}

// /api/search?query=...
router.get('/api/search', async (req, res) => {
  const query = req.query.query as string;
  if (!query) return res.status(400).json({ error: 'Query parametresi gerekli.' });

  try {
    // SerpAPI ile Google arama sonuçlarını çek
    const serpApiUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&hl=tr&gl=tr&api_key=${SERPAPI_KEY}`;
    const response = await fetch(serpApiUrl);
    
    // Define the response structure
    interface SerpApiResponse {
      organic_results?: Array<{
        title: string;
        link: string;
        snippet?: string;
        description?: string;
      }>;
    }
    
    const data = await response.json() as SerpApiResponse;

    // Sadece organik sonuçları döndür
    const results = (data.organic_results || []).map((item: any) => ({
      title: item.title,
      url: item.link,
      description: item.snippet || item.description || ''
    }));

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Google arama sonuçları alınamadı.' });
  }
});

export default router;
