import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const router = express.Router();

// /api/fetch?url=...
router.get('/api/fetch', async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: 'URL parametresi gerekli.' });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    // Ana içerik çıkarımı (örnek: ana başlık ve ilk 5 paragraf)
    const title = $('h1').first().text() || $('title').text();
    const paragraphs: string[] = [];
    $('p').each((i, el) => {
      if (i < 5) paragraphs.push($(el).text());
    });
    const content = [title, ...paragraphs].filter(Boolean).join('\n\n');

    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: 'Sayfa içeriği alınamadı.' });
  }
});

export default router;
