import type { Express } from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from 'cheerio';

// ESM'de __dirname ekivalanı oluşturuyoruz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerResearchApi(app: Express) {
  // SERPER API ile SERP verisi dönen endpoint
  app.post("/api/search", async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query parametresi gerekli." });
    try {
      const SERPER_API_KEY = process.env.SERPER_API_KEY;
      
      if (!SERPER_API_KEY) {
        return res.status(500).json({ error: "SERPER_API_KEY is not configured" });
      }
      const response = await axios.post(
        "https://google.serper.dev/search",
        { q: query },
        { headers: { "X-API-KEY": SERPER_API_KEY } }
      );
      // Sadece başlık, url ve snippet döndür
      const results = (response.data.organic || []).map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet
      }));
      res.json({ results });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Serper API hatası" });
    }
  });

  // JavaScript (cheerio) ile web sayfası içerik çekme
  app.post("/api/scrape", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL parametresi gerekli." });
    
    try {
      // User-agent ve timeout ayarları ile axios isteği
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000,
        validateStatus: function (status) {
          return status < 500; // 5xx hataları dışındaki tüm kodları kabul et
        }
      });

      if (response.status >= 400) {
        return res.status(400).json({ 
          content: `# Sayfa Bulunamadı\n\nURL: ${url}\nDurum Kodu: ${response.status}`
        });
      }

      // HTML içeriği cheerio ile parse et
      const $ = cheerio.load(response.data);
      
      // Başlık al
      const title = $('title').text().trim() || "Başlık bulunamadı";
      
      // Gereksiz elementleri kaldır
      $('script, style, nav, header, footer, iframe, noscript').remove();
      
      // Metin içeriğini al
      let content = '';
      
      // Önce ana içerik containerlarını bulmaya çalış
      const mainSelectors = [
        'article', 
        'main', 
        '.content', 
        '.post-content', 
        '.entry-content', 
        '.article-content',
        '#content',
        '.page-content'
      ];
      
      let foundMainContent = false;
      
      // Ana içerik elementlerini kontrol et
      for (const selector of mainSelectors) {
        if ($(selector).length) {
          // İçeriği al
          $(selector).each((_, elem) => {
            const text = extractTextFromElement($, elem);
            if (text.length > 100) { // Anlamlı içerik
              content += text + "\n\n";
              foundMainContent = true;
            }
          });
          
          if (foundMainContent) break;
        }
      }
      
      // Ana içerik bulamazsak, body içindeki paragrafları topla
      if (!foundMainContent) {
        content = extractTextFromElement($, 'body');
      }
      
      // İçeriği Markdown formatla
      let markdownContent = formatContent(title, content);
      
      // İçerik çok kısaysa
      if (markdownContent.length < 200) {
        markdownContent = `# ${title}\n\nBu sayfadan yeterli içerik çekilemedi.`;
      }
      
      res.json({ content: markdownContent });
    } catch (err: any) {
      console.error('Scraping error:', err);
      // Hata durumunda yapay içerik oluştur
      const fallbackContent = generateFallbackContent(url);
      res.json({ content: fallbackContent });
    }
  });
}

// Bir HTML elementinden anlamlı metni çıkar
function extractTextFromElement($: cheerio.CheerioAPI, selector: string | any): string {
  let text = '';
  
  if (typeof selector === 'string') {
    // Başlıkları topla
    $(selector).find('h1, h2, h3, h4, h5, h6').each((_, elem) => {
      text += '## ' + $(elem).text().trim() + '\n\n';
    });
    
    // Paragrafları topla
    $(selector).find('p').each((_, elem) => {
      const paragraphText = $(elem).text().trim();
      if (paragraphText) {
        text += paragraphText + '\n\n';
      }
    });
    
    // Liste öğelerini topla
    let inList = false;
    $(selector).find('ul li, ol li').each((_, elem) => {
      if (!inList) {
        text += '\n';
        inList = true;
      }
      text += '- ' + $(elem).text().trim() + '\n';
    });
    if (inList) text += '\n';
  } else {
    // Element verilmişse
    const element = $(selector);
    
    // Başlıkları topla
    element.find('h1, h2, h3, h4, h5, h6').each((_, elem) => {
      text += '## ' + $(elem).text().trim() + '\n\n';
    });
    
    // Paragrafları topla
    element.find('p').each((_, elem) => {
      const paragraphText = $(elem).text().trim();
      if (paragraphText) {
        text += paragraphText + '\n\n';
      }
    });
    
    // Liste öğelerini topla
    let inList = false;
    element.find('ul li, ol li').each((_, elem) => {
      if (!inList) {
        text += '\n';
        inList = true;
      }
      text += '- ' + $(elem).text().trim() + '\n';
    });
    if (inList) text += '\n';
    
    // Hiçbir şey bulamadıysak, tüm metni al
    if (!text) {
      text = element.text()
        .replace(/\s+/g, ' ') // Fazla boşlukları temizle
        .trim()
        .split(/\. /) // Cümleleri böl
        .join('.\n\n'); // Cümle sonlarında paragraf oluştur
    }
  }
  
  // Gereksiz boş satırları temizle
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

// İçeriği düzgün Markdown formatına dönüştür
function formatContent(title: string, content: string): string {
  // Başlık ekle
  let formatted = `# ${title}\n\n`;
  
  // İçeriği ekle
  formatted += content;
  
  // İçerik çok uzunsa kırp
  if (formatted.length > 8000) {
    formatted = formatted.substring(0, 8000) + '\n\n...(içerik kırpıldı)...';
  }
  
  return formatted;
}

// Hata durumunda yapay içerik oluştur
function generateFallbackContent(url: string): string {
  // URL'den domain adını çıkar
  const domain = new URL(url).hostname;
  
  return `# ${domain} sitesinden içerik alınamadı

Bu site içeriği çekilemedi. Bunun nedenleri şunlar olabilir:

- Site robot erişimini engelliyor olabilir
- Site CORS politikaları erişimi engelliyor olabilir
- Site içeriği JavaScript ile dinamik olarak yükleniyor olabilir
- Sitenin yapısı standart HTML formatından farklı olabilir

## Alternatif Yöntemler

Bu siteyi manuel olarak ziyaret ederek içeriği görebilir veya farklı kaynaklardan benzer bilgilere ulaşabilirsiniz.`;
}
