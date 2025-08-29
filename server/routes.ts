import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerResearchApi } from "./researchApi";
// Gerekli modülleri import ediyoruz. Eğer modüller eksikse, terminalde aşağıdaki komutları çalıştırarak yükleyebilirsiniz:
// npm install axios cheerio jsonwebtoken bcryptjs lighthouse chrome-launcher

import { storage } from "./storage";
// Gerekli modülleri import ediyoruz. Eğer modüller eksikse, terminalde aşağıdaki komutları çalıştırarak yükleyebilirsiniz:
// npm install axios cheerio jsonwebtoken bcryptjs lighthouse chrome-launcher

import axios from "axios";
import * as cheerio from "cheerio";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher"
import * as crypto from "crypto";
import CSS from 'css';
import type { CheerioAPI, Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import * as os from 'os';
import * as path from 'path';

import type { Element } from "domhandler";

// Not: Eğer Node.js ortamında çalışıyorsanız, 'crypto' ve 'url' modüllerini kullanabilirsiniz. 
// Ancak tarayıcı ortamında veya bazı TypeScript projelerinde bu modüller bulunmayabilir. 
// Hata alıyorsanız, projenize @types/node paketini ekleyin veya ilgili kodları kaldırın.
// import * as crypto from "crypto";
// import { URL } from "url";

// JWT_SECRET için process.env doğrudan kullanımı Node.js ortamı gerektirir.
// Eğer tarayıcıda çalışıyorsanız veya hata alıyorsanız, .env dosyası veya başka bir yöntemle anahtarı yönetin.
const JWT_SECRET = (typeof process !== "undefined" && process.env && process.env.JWT_SECRET) 
  ? process.env.JWT_SECRET 
  : "supersecretkey";

// In-memory user & project storage (demo amaçlı, gerçek DB ile değiştirilmeli)
const users: { username: string; passwordHash: string }[] = [];
const projects: any[] = [];

// Middleware: JWT auth
function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Yetkisiz. Token gerekli." });
  }
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Geçersiz token." });
  }
}

// --- MODÜLER SEO ANALİZ FONKSİYONLARI ---
type SEOIssue = { type: string; field: string; message: string; suggestion: string; impact?: string; difficulty?: string; example?: string; explanation?: string; reference?: string; category?: string };
type SEOSuccess = { field: string; message: string; impact?: string; example?: string; explanation?: string; reference?: string; category?: string };
type SEOImprovement = { title: string; description: string; impact?: string; difficulty?: string; example?: string; explanation?: string; reference?: string; category?: string };

function analyzeTitle($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  const title = $("title").text().trim();
  
  // Başlık varlık kontrolü
  if (!title) {
    issues.push({
      type: 'error',
      field: 'title',
      message: 'Başlık etiketi bulunamadı veya boş.',
      suggestion: '<title> etiketi ekleyin ve anlamlı bir başlık yazın.',
      impact: 'kritik',
      difficulty: 'kolay',
      example: '<title>Sitenizin Ana Başlığı | Marka Adı</title>',
      explanation: 'Başlıksız sayfalar arama motoru sonuçlarında ciddi şekilde dezavantajlıdır ve kullanıcı deneyimini olumsuz etkiler.',
      reference: 'https://developers.google.com/search/docs/appearance/title-link',
      category: 'SEO'
    });
    return { issues, successes };
  }
  
  // Başlık uzunluk kontrolü
  if (title.length >= 10 && title.length <= 60) {
    successes.push({
      field: 'title',
      message: 'Başlık uzunluğu ideal aralıkta (10-60 karakter).',
      impact: 'SERP'
    });
  } else if (title.length < 10) {
    issues.push({
      type: 'error',
      field: 'title',
      message: 'Başlık çok kısa.',
      suggestion: 'Başlık en az 10 karakter olmalıdır.',
      impact: 'yüksek',
      difficulty: 'kolay',
      example: '<title>Ev Dekorasyonu İçin En İyi 10 Öneri | DekorEvi</title>',
      explanation: 'Çok kısa başlıklar içerik hakkında yeterli bilgi vermez ve arama motoru sıralamasını olumsuz etkiler.',
      reference: 'https://moz.com/learn/seo/title-tag',
      category: 'SEO'
    });
  } else if (title.length > 60) {
    issues.push({
      type: 'warning',
      field: 'title',
      message: `Başlık çok uzun (${title.length} karakter).`,
      suggestion: 'Başlık 60 karakterden kısa olmalıdır. Şu anki karakter sayısı: ' + title.length,
      impact: 'orta',
      difficulty: 'kolay',
      example: '<title>En İyi 5 Ürün | Marka Adı</title>',
      explanation: 'Google arama sonuçlarında uzun başlıklar kırpılır, bu da tıklama oranını olumsuz etkileyebilir.',
      reference: 'https://developers.google.com/search/docs/appearance/title-link',
      category: 'SEO'
    });
  }
  
  // Anahtar kelime kontrolü
  const h1Text = $("h1").first().text().trim();
  if (h1Text && !title.toLowerCase().includes(h1Text.toLowerCase().substring(0, Math.min(15, h1Text.length)))) {
    issues.push({
      type: 'warning',
      field: 'title',
      message: 'Başlık, H1 etiketi ile uyumlu değil.',
      suggestion: 'Başlığa H1 etiketindeki ana anahtar kelimeyi ekleyin.',
      impact: 'orta',
      difficulty: 'kolay',
      example: 'H1: "En İyi SEO Teknikleri" → <title>En İyi SEO Teknikleri 2025 | Site Adı</title>',
      explanation: 'Başlık ve H1 etiketinin uyumlu olması, içerik tutarlılığını gösterir ve SEO açısından olumlu etki yaratır.',
      reference: 'https://www.searchenginejournal.com/on-page-seo/title-tag-optimization/',
      category: 'SEO'
    });
  }
  
  // Benzersizlik kontrolü (sayfalar arası karşılaştırma yapılamıyor, bu yüzden yönlendirici bir uyarı eklendi)
  const allTitles = $("title").map((_, el) => $(el).text().trim()).get();
  if (allTitles.length > 1) {
    issues.push({
      type: 'error', 
      field: 'title',
      message: 'Sayfada birden fazla <title> etiketi bulundu.',
      suggestion: 'Sadece bir <title> etiketi kullanın.',
      impact: 'yüksek',
      difficulty: 'kolay',
      example: '<head><title>Sayfa Başlığı</title></head>',
      explanation: 'Birden fazla başlık etiketi arama motorlarının hangi başlığı kullanacağı konusunda karışıklık yaratır.',
      reference: 'https://developers.google.com/search/docs/crawling-indexing/special-tags',
      category: 'SEO'
    });
  }
  
  // Başlık formatı kontrolü
  if (title.includes('|') || title.includes('-') || title.includes(':')) {
    successes.push({
      field: 'title',
      message: 'Başlık uygun bir ayırıcı ile formatlanmış.',
      impact: 'SERP'
    });
  } else {
    issues.push({
      type: 'suggestion',
      field: 'title',
      message: 'Başlıkta ayırıcı kullanılmamış.',
      suggestion: 'Başlığa marka adını eklemek için | veya - gibi ayırıcılar kullanın.',
      impact: 'düşük',
      difficulty: 'kolay',
      example: '<title>Sayfa Başlığı | Marka Adı</title>',
      explanation: 'Ayırıcılar kullanarak başlığın içerik ve marka kısmını ayırmak, kullanıcı deneyimini ve marka bilinirliğini artırır.',
      reference: 'https://moz.com/learn/seo/title-tag',
      category: 'SEO'
    });
  }
  
  // Spam kelimeleri kontrolü
  const spamWords = ['bedava', 'ücretsiz', 'kazanç', 'zengin ol', 'para kazan', 'hemen tıkla', 'inanılmaz', 'şok', 'inanılmaz teklif'];
  const lowerTitle = title.toLowerCase();
  
  const foundSpamWords = spamWords.filter(word => lowerTitle.includes(word));
  if (foundSpamWords.length > 0) {
    issues.push({
      type: 'warning',
      field: 'title',
      message: `Başlıkta potansiyel spam kelimeleri bulundu: ${foundSpamWords.join(', ')}`,
      suggestion: 'Bu kelimeleri daha profesyonel alternatiflerle değiştirin.',
      impact: 'yüksek',
      difficulty: 'orta',
      example: '"BEDaVA Ürünler" yerine "Ücretsiz Deneme Sürümü"',
      explanation: 'Spam olarak algılanabilecek kelimeler, arama motorlarının sitenizi güvenilmez olarak değerlendirmesine neden olabilir.',
      reference: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
      category: 'SEO'
    });
  }
  
  // Büyük harf kontrolü
  if (title === title.toUpperCase() && title.length > 5) {
    issues.push({
      type: 'warning',
      field: 'title',
      message: 'Başlık tamamen büyük harflerle yazılmış.',
      suggestion: 'Başlıkta normal büyük/küçük harf kullanımını tercih edin.',
      impact: 'orta',
      difficulty: 'kolay',
      example: '"TÜM ÜRÜNLER KAMPANYALI" yerine "Tüm Ürünler Kampanyalı"',
      explanation: 'Tamamen büyük harflerle yazılmış başlıklar, spam olarak algılanabilir ve kullanıcı deneyimini olumsuz etkiler.',
      reference: 'https://developers.google.com/search/docs/appearance/title-link',
      category: 'SEO'
    });
  }
  
  // Başlıkta marka adı kontrolü (varsayımsal olarak domain adını kullanıyoruz)
  const domain = $('meta[property="og:site_name"]').attr('content') || 
                $('meta[name="application-name"]').attr('content') || 
                $('link[rel="canonical"]').attr('href')?.match(/https?:\/\/(?:www\.)?([^\/]+)/)?.[1] || '';
                
  if (domain && !lowerTitle.includes(domain.toLowerCase())) {
    issues.push({
      type: 'suggestion',
      field: 'title',
      message: 'Başlıkta marka/site adı bulunmuyor.',
      suggestion: 'Başlığın sonuna marka adınızı ekleyin.',
      impact: 'düşük',
      difficulty: 'kolay',
      example: '<title>Sayfa İçeriği | ' + domain + '</title>',
      explanation: 'Başlığa marka adını eklemek, marka bilinirliğini artırır ve kullanıcıların sitenizi tanımasına yardımcı olur.',
      reference: 'https://developers.google.com/search/docs/appearance/title-link',
      category: 'SEO'
    });
  }
  
  // Anahtar kelime yoğunluğu kontrolü (basit bir yaklaşım)
  const words = title.toLowerCase().split(/\s+/);
  const wordCounts: {[key: string]: number} = {};
  
  words.forEach(word => {
    if (word.length > 2) { // 3 karakterden uzun kelimeleri say
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  const repeatedWords = Object.entries(wordCounts)
    .filter(([_, count]) => count > 1)
    .map(([word]) => word);
  
  if (repeatedWords.length > 0) {
    issues.push({
      type: 'suggestion',
      field: 'title',
      message: `Başlıkta tekrar eden kelimeler: ${repeatedWords.join(', ')}`,
      suggestion: 'Aynı kelimeleri tekrar etmek yerine eş anlamlılar kullanın.',
      impact: 'düşük',
      difficulty: 'kolay',
      example: '"SEO SEO Teknikleri" yerine "En İyi SEO Teknikleri ve Stratejileri"',
      explanation: 'Aşırı kelime tekrarı, arama motorları tarafından anahtar kelime doldurma (keyword stuffing) olarak algılanabilir.',
      reference: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
      category: 'SEO'
    });
  }
  
  // Karakter kontrolü (özel karakterler ve Unicode)
  const specialChars = /[^\u0020-\u007E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u0400-\u04FF\u0370-\u03FF\u0590-\u05FF]/g;
  const specialCharsFound = title.match(specialChars);
  
  if (specialCharsFound) {
    issues.push({
      type: 'warning',
      field: 'title',
      message: 'Başlıkta desteklenmeyen özel karakterler kullanılmış.',
      suggestion: 'Emoji ve özel karakterleri standart karakterlerle değiştirin.',
      impact: 'orta',
      difficulty: 'kolay',
      example: '"✨Ürünler🔥" yerine "Yeni Ürünler - Kampanya"',
      explanation: 'Bazı özel karakterler ve emojiler tarayıcılar ve arama motorları tarafından düzgün görüntülenemeyebilir.',
      reference: 'https://developers.google.com/search/docs/appearance/title-link',
      category: 'SEO'
    });
  }
  
  // Tüm analiz bitti, genel başarı durumu
  if (issues.length === 0) {
    successes.push({
      field: 'title',
      message: 'Başlık tüm SEO gereksinimlerini karşılıyor.',
      impact: 'SERP'
    });
  }
  
  return { issues, successes };
}

function analyzeDescription($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  const descriptionTag = $('meta[name="description"]');
  const description = descriptionTag.attr('content') || '';
  
  // Meta açıklama varlık kontrolü
  if (!descriptionTag.length) {
    issues.push({
      type: 'error',
      field: 'description',
      message: 'Meta açıklama etiketi bulunamadı.',
      suggestion: '<meta name="description"> etiketi ekleyin.',
      impact: 'yüksek',
      difficulty: 'kolay',
      example: '<meta name="description" content="Sitenizin içeriğini kısaca anlatan 150 karakterlik açıklama.">',
      explanation: 'Meta açıklama, arama motoru sonuçlarında gösterilen ve tıklama oranlarını doğrudan etkileyen önemli bir SEO öğesidir.',
      reference: 'https://developers.google.com/search/docs/appearance/snippet',
      category: 'SEO'
    });
    return { issues, successes };
  }
  
  // Açıklama içerik kontrolü
  if (!description.trim()) {
    issues.push({
      type: 'error',
      field: 'description',
      message: 'Meta açıklama etiketi bulundu ancak içeriği boş.',
      suggestion: 'Meta açıklama etiketine anlamlı bir içerik ekleyin.',
      impact: 'yüksek',
      difficulty: 'kolay',
      example: '<meta name="description" content="Sitenizin içeriğini kısaca anlatan 150 karakterlik açıklama.">',
      explanation: 'Boş meta açıklama, arama motorlarının sayfa içeriğinden rastgele bir metin seçmesine neden olur, bu da görüntülenme oranını düşürebilir.',
      reference: 'https://developers.google.com/search/docs/appearance/snippet',
      category: 'SEO'
    });
    return { issues, successes };
  }
  
  // Açıklama uzunluk kontrolü - Daha detaylı
  const descLength = description.length;
  if (descLength >= 50 && descLength <= 160) {
    successes.push({
      field: 'description',
      message: `Meta açıklama uzunluğu ideal (${descLength} karakter).`,
      impact: 'SERP'
    });
  } else if (descLength < 50) {
    issues.push({
      type: 'warning',
      field: 'description',
      message: `Meta açıklama çok kısa (${descLength} karakter).`,
      suggestion: 'Açıklamayı en az 50 karakter olacak şekilde genişletin.',
      impact: 'orta',
      difficulty: 'kolay',
      example: '<meta name="description" content="Bu sayfada en iyi SEO tekniklerini bulabilir, web sitenizin arama motorlarındaki görünürlüğünü artırabilirsiniz.">',
      explanation: 'Çok kısa açıklamalar, sayfanın içeriğini yeterince tanıtmaz ve düşük tıklama oranına neden olabilir.',
      reference: 'https://moz.com/learn/seo/meta-description',
      category: 'SEO'
    });
  } else if (descLength > 160) {
    issues.push({
      type: 'warning',
      field: 'description',
      message: `Meta açıklama çok uzun (${descLength} karakter).`,
      suggestion: 'Açıklamayı 160 karakterden az olacak şekilde kısaltın.',
      impact: 'orta',
      difficulty: 'kolay',
      example: '<meta name="description" content="Web sitenizi SEO ile optimize edin. İçeriklerinizin arama motorlarında daha iyi sıralamalara ulaşması için ipuçları.">',
      explanation: 'Uzun açıklamalar arama motorlarında kırpılır, bu da mesajınızın tam olarak iletilmemesine neden olur.',
      reference: 'https://developers.google.com/search/docs/appearance/snippet',
      category: 'SEO'
    });
  }
  
  // Sayfa içeriği ve açıklama uyumu
  const h1Text = $('h1').first().text().trim();
  const pageContent = $('body').text().trim().substring(0, 500).toLowerCase();
  
  if (h1Text && !description.toLowerCase().includes(h1Text.toLowerCase().substring(0, Math.min(10, h1Text.length)))) {
    issues.push({
      type: 'suggestion',
      field: 'description',
      message: 'Meta açıklamada H1 başlığındaki ana anahtar kelime bulunmuyor.',
      suggestion: 'Meta açıklamaya sayfanın H1 başlığındaki ana anahtar kelimeyi ekleyin.',
      impact: 'orta',
      difficulty: 'kolay',
      example: 'H1: "SEO Teknikleri" → <meta name="description" content="SEO Teknikleri ile web sitenizin arama motorlarındaki görünürlüğünü artırın...">',
      explanation: 'Meta açıklamada H1 başlığındaki anahtar kelimelerin bulunması, tutarlılık sağlar ve arama motorlarına sayfanın ana konusunu vurgular.',
      reference: 'https://developers.google.com/search/docs/appearance/snippet',
      category: 'SEO'
    });
  }
  
  // Çağrı aksiyonu kontrolü
  const ctaPatterns = [
    /(?:şimdi|hemen|bugün|acele|fırsat|kaçırma|incele|keşfet|dene|başla|satın al|ücretsiz|indir|öğren|bul|ara|oku|izle|katıl|kaydol|üye ol|bize ulaş|iletişim)/i
  ];
  
  const hasCTA = ctaPatterns.some(pattern => pattern.test(description));
  if (!hasCTA) {
    issues.push({
      type: 'suggestion',
      field: 'description',
      message: 'Meta açıklamada çağrı aksiyonu (CTA) ifadesi yok.',
      suggestion: 'Kullanıcıyı harekete geçirecek bir ifade ekleyin.',
      impact: 'düşük',
      difficulty: 'kolay',
      example: '<meta name="description" content="... Hemen inceleyin!" veya "... Şimdi daha fazla bilgi edinin.">',
      explanation: 'Çağrı aksiyonu içeren meta açıklamalar tıklama oranlarını artırabilir çünkü kullanıcıları harekete geçmeye teşvik eder.',
      reference: 'https://moz.com/learn/seo/meta-description',
      category: 'SEO'
    });
  } else {
    successes.push({
      field: 'description',
      message: 'Meta açıklama, kullanıcıyı harekete geçirecek ifadeler içeriyor.',
      impact: 'SERP'
    });
  }
  
  // Çoklu açıklama kontrolü
  const allDescriptions = $('meta[name="description"]');
  if (allDescriptions.length > 1) {
    issues.push({
      type: 'error',
      field: 'description',
      message: 'Sayfada birden fazla meta açıklama etiketi bulundu.',
      suggestion: 'Sadece bir meta açıklama etiketi kullanın.',
      impact: 'yüksek',
      difficulty: 'kolay',
      example: 'Fazla olan <meta name="description"> etiketlerini kaldırın.',
      explanation: 'Birden fazla açıklama etiketi, arama motorlarının hangisini kullanacağı konusunda karışıklık yaratabilir.',
      reference: 'https://developers.google.com/search/docs/crawling-indexing/special-tags',
      category: 'SEO'
    });
  }
  
  // Açıklamada spam kelime kontrolü
  const spamWords = ['bedava', 'ücretsiz', 'kazanç', 'zengin ol', 'para kazan', 'hemen tıkla', 'inanılmaz', 'şok', 'inanılmaz teklif', 'kazandınız', 'mucize', '%100'];
  const lowerDesc = description.toLowerCase();
  
  const foundSpamWords = spamWords.filter(word => lowerDesc.includes(word.toLowerCase()));
  if (foundSpamWords.length > 0) {
    issues.push({
      type: 'warning',
      field: 'description',
      message: `Meta açıklamada potansiyel spam kelimeleri bulundu: ${foundSpamWords.join(', ')}.`,
      suggestion: 'Bu kelimeleri daha profesyonel alternatiflerle değiştirin.',
      impact: 'yüksek',
      difficulty: 'orta',
      example: '"Bedava ürünler" yerine "Deneme sürümü" kullanın.',
      explanation: 'Spam görünen ifadeler, sayfanızın arama motorları tarafından düşük kaliteli olarak algılanmasına neden olabilir.',
      reference: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
      category: 'SEO'
    });
  }
  
  // Büyük harf kullanımı kontrolü
  if (description === description.toUpperCase() && description.length > 20) {
    issues.push({
      type: 'warning',
      field: 'description',
      message: 'Meta açıklama tamamen büyük harflerle yazılmış.',
      suggestion: 'Normal büyük/küçük harf kullanımını tercih edin.',
      impact: 'orta',
      difficulty: 'kolay',
      example: '"TÜM ÜRÜNLER KAMPANYALI" yerine "Tüm ürünler kampanyalı"',
      explanation: 'Tamamen büyük harflerle yazılmış açıklamalar spam görünebilir ve kullanıcı deneyimini olumsuz etkileyebilir.',
      reference: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
      category: 'SEO'
    });
  }
  
  // Anahtar kelime tekrarı kontrolü
  const words = description.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  const wordCounts: {[key: string]: number} = {};
  
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  const repeatedWords = Object.entries(wordCounts)
    .filter(([_, count]) => count > 2)
    .map(([word]) => word);
  
  if (repeatedWords.length > 0) {
    issues.push({
      type: 'warning',
      field: 'description',
      message: `Meta açıklamada aşırı tekrar eden kelimeler: ${repeatedWords.join(', ')}.`,
      suggestion: 'Anahtar kelimeleri daha doğal bir şekilde kullanın ve aşırı tekrardan kaçının.',
      impact: 'orta',
      difficulty: 'kolay',
      example: '"SEO SEO SEO teknikleri" yerine "SEO teknikleri ve dijital pazarlama stratejileri"',
      explanation: 'Aşırı tekrar eden kelimeler, "keyword stuffing" olarak algılanabilir ve sayfanızın spam olarak değerlendirilmesine neden olabilir.',
      reference: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
      category: 'SEO'
    });
  }
  
  // İçerikle uyum kontrolü
  const pageKeywords = pageContent
    .replace(/[^\wşçöğüıİŞÇÖĞÜ\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 4)
    .reduce<{[key: string]: number}>((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

  // pageKeywords'in tipi zaten {[key: string]: number} olarak tanımlı, ancak linter hatası almamak için türü açıkça belirtiyoruz.
  const topKeywords = Object.entries(pageKeywords as {[key: string]: number})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  const keywordsInDescription = topKeywords.filter(word => 
    lowerDesc.includes(word.toLowerCase())
  );
  
  if (keywordsInDescription.length < 2 && topKeywords.length >= 3) {
    issues.push({
      type: 'suggestion',
      field: 'description',
      message: 'Meta açıklama, sayfa içeriğindeki anahtar kelimelerle yeterince uyumlu değil.',
      suggestion: `Sayfanın ana anahtar kelimelerinden bazılarını (örn: ${topKeywords.slice(0, 3).join(', ')}) meta açıklamaya ekleyin.`,
      impact: 'orta',
      difficulty: 'orta',
      example: `<meta name="description" content="Sayfanızın içeriğini anlatan ve ${topKeywords[0]}, ${topKeywords[1]} gibi anahtar kelimeleri içeren açıklama.">`,
      explanation: 'Meta açıklamanın sayfa içeriğiyle uyumlu olması, arama motorlarına sayfanın ne hakkında olduğunu doğru şekilde iletir.',
      reference: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
      category: 'SEO'
    });
  } else if (keywordsInDescription.length >= 2) {
    successes.push({
      field: 'description',
      message: 'Meta açıklama, sayfa içeriğiyle iyi derecede uyumlu.',
      impact: 'SERP'
    });
  }
  
  // Özel karakter kontrolü
  const specialChars = /[^\u0020-\u007E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u0400-\u04FF\u0370-\u03FF\u0590-\u05FF]/g;
  const specialCharsFound = description.match(specialChars);
  
  if (specialCharsFound) {
    issues.push({
      type: 'warning',
      field: 'description',
      message: 'Meta açıklamada desteklenmeyen özel karakterler kullanılmış.',
      suggestion: 'Emoji ve desteklenmeyen özel karakterleri standart karakterlerle değiştirin.',
      impact: 'düşük',
      difficulty: 'kolay',
      example: '"✨Ürünler🔥" yerine "Yeni Ürünler - Kampanya"',
      explanation: 'Bazı özel karakterler ve emojiler arama motorları tarafından düzgün görüntülenemeyebilir ve sorunlara neden olabilir.',
      reference: 'https://developers.google.com/search/docs/appearance/snippet',
      category: 'SEO'
    });
  }
  
  // Açıklamada noktalama işaretleri kontrolü
  const punctuationMarks = description.match(/[.!?]/g);
  if (!punctuationMarks) {
    issues.push({
      type: 'suggestion',
      field: 'description',
      message: 'Meta açıklamada noktalama işaretleri eksik.',
      suggestion: 'Cümleleri nokta, ünlem veya soru işareti ile sonlandırın.',
      impact: 'düşük',
      difficulty: 'kolay',
      example: '<meta name="description" content="SEO teknikleri hakkında bilgi edinin. Web sitenizin performansını artırın!">',
      explanation: 'Doğru noktalama işaretleri, açıklamanızın profesyonel görünmesini sağlar ve okunabilirliği artırır.',
      reference: 'https://developers.google.com/search/docs/appearance/snippet',
      category: 'SEO'
    });
  }
  
  // URL ve meta açıklama ilişkisi
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || '';
  const urlSegments = canonicalUrl.split('/').filter(Boolean);
  const lastUrlSegment = urlSegments[urlSegments.length - 1]?.replace(/-/g, ' ').replace(/\.(html|php|asp|jsp)$/i, '');
  
  if (lastUrlSegment && lastUrlSegment.length > 3 && !lowerDesc.includes(lastUrlSegment.toLowerCase())) {
    issues.push({
      type: 'suggestion',
      field: 'description',
      message: 'Meta açıklama, URL ile uyumlu değil.',
      suggestion: 'Meta açıklamaya URL\'deki anahtar kelimeleri ekleyin.',
      impact: 'düşük',
      difficulty: 'orta',
      example: `URL: "/seo-teknikleri" → <meta name="description" content="SEO teknikleri ile sitenizin sıralamasını yükseltin...">`,
      explanation: 'URL\'deki anahtar kelimelerin meta açıklamada da bulunması, arama motorlarına daha tutarlı sinyaller gönderir.',
      reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
      category: 'SEO'
    });
  }
  
  // Meta açıklamanın içeriği tekrarlayan karakterlerle doldurulmuş mu
  const repeatedPatternsRegex = /(.)\1{4,}/;
  if (repeatedPatternsRegex.test(description)) {
    issues.push({
      type: 'error',
      field: 'description',
      message: 'Meta açıklamada tekrarlayan karakterler tespit edildi.',
      suggestion: 'Tekrarlayan karakterleri (örn: "aaaaa", "-----") kaldırın.',
      impact: 'yüksek',
      difficulty: 'kolay',
      example: '"SEO----Teknikleri" yerine "SEO Teknikleri"',
      explanation: 'Tekrarlayan karakterler spam olarak algılanabilir ve arama motoru sıralamalarını olumsuz etkileyebilir.',
      reference: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
      category: 'SEO'
    });
  }
  
  // Meta açıklama benzersizlik kontrolü - sadece uyarı verebiliriz
  // Not: Burada gerçek bir test yapamıyoruz çünkü diğer sayfaları göremiyoruz
  // Bu yüzden sadece bilgilendirici bir not ekliyoruz
  if (description.indexOf('Hoş geldiniz') !== -1 || 
      description.indexOf('Anasayfa') !== -1 || 
      description.indexOf('Hakkımızda') !== -1 ||
      description.length < 60 && description.length > 0) {
    issues.push({
      type: 'suggestion',
      field: 'description',
      message: 'Meta açıklama genelleştirilmiş ve sıradan görünüyor.',
      suggestion: 'Her sayfa için benzersiz ve içeriği yansıtan bir meta açıklama oluşturun.',
      impact: 'orta',
      difficulty: 'orta',
      example: '"Sitemize hoş geldiniz." yerine "SEO Teknikleri: Sitenizi arama motorlarında üst sıralara taşıyacak 10 temel strateji."',
      explanation: 'Benzersiz meta açıklamalar, arama motorlarında sayfanızın doğru şekilde temsil edilmesini sağlar ve tıklama oranlarını artırır.',
      reference: 'https://developers.google.com/search/docs/appearance/snippet',
      category: 'SEO'
    });
  }
  
  // Tüm analiz bitti, genel başarı durumu
  if (issues.length === 0) {
    successes.push({
      field: 'description',
      message: 'Meta açıklama tüm SEO gereksinimlerini karşılıyor.',
      impact: 'SERP'
    });
  }
  
  return { issues, successes };
}

function analyzeH1($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  const h1Elements = $("h1");
  const h1Count = h1Elements.length;
  
  // H1 varlık kontrolü
  if (h1Count === 0) {
    issues.push({
      type: 'error',
      field: 'h1',
      message: 'Sayfada H1 başlığı bulunamadı.',
      suggestion: 'Her sayfada mutlaka bir adet H1 başlığı olmalı.',
      impact: 'yüksek',
      difficulty: 'kolay',
      example: '<h1>Ana Başlık</h1>',
      explanation: 'H1 başlığı, sayfanın ana konusunu belirtir ve arama motorları için en önemli içerik belirteçlerinden biridir. Her sayfada bir H1 bulunması, sayfanın hiyerarşik yapısını güçlendirir.',
      reference: 'https://developers.google.com/search/docs/appearance/structured-data',
      category: 'SEO'
    });
    return { issues, successes };
  } else if (h1Count === 1) {
    successes.push({
      field: 'h1',
      message: 'Sayfada doğru sayıda (1) H1 başlığı mevcut.',
      impact: 'SEO structure'
    });
  } else {
    issues.push({
      type: 'warning',
      field: 'h1',
      message: `Sayfada birden fazla H1 başlığı bulundu (${h1Count} adet).`,
      suggestion: 'Sayfada yalnızca bir H1 başlığı kullanın. Diğer başlıklar için H2-H6 etiketlerini tercih edin.',
      impact: 'orta',
      difficulty: 'kolay',
      example: 'Tek bir <h1>Ana Başlık</h1> kullanın, alt başlıklar için <h2>, <h3>... kullanın.',
      explanation: 'Birden fazla H1 başlığı, sayfanın ana konusunun ne olduğu konusunda arama motorlarını karıştırabilir. HTML5 ile birden fazla H1 kullanımı teknik olarak mümkün olsa da, SEO açısından tek bir H1 kullanmak hala en iyi uygulamadır.',
      reference: 'https://developers.google.com/search/docs/appearance/structured-data',
      category: 'SEO'
    });
  }
  
  // Buradan itibaren H1 içerik analizleri yapılır - en az bir H1 var demektir
  const firstH1 = h1Elements.first();
  const h1Text = firstH1.text().trim();
  
  // H1 içerik kontrolü
  if (!h1Text) {
    issues.push({
      type: 'error',
      field: 'h1',
      message: 'H1 başlığı boş içeriğe sahip.',
      suggestion: 'H1 başlığına anlamlı bir içerik ekleyin.',
      impact: 'yüksek',
      difficulty: 'kolay',
      example: '<h1>Sayfanın Ana Konusu</h1>',
      explanation: 'Boş bir H1 başlığı, arama motorlarına sayfanın ana konusu hakkında bilgi vermez ve kullanıcı deneyimini olumsuz etkiler.',
      reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
      category: 'SEO'
    });
    return { issues, successes };
  }
  
  // H1 uzunluk kontrolü
  if (h1Text.length < 10) {
    issues.push({
      type: 'warning',
      field: 'h1',
      message: `H1 başlığı çok kısa (${h1Text.length} karakter).`,
      suggestion: 'H1 başlığı en az 10 karakter içermeli ve sayfanın ana konusunu açıkça belirtmeli.',
      impact: 'orta',
      difficulty: 'kolay',
      example: 'Çok kısa: <h1>SEO</h1>, Daha iyi: <h1>SEO Teknikleri ve İpuçları</h1>',
      explanation: 'Çok kısa H1 başlıkları genellikle içeriği tam olarak tanımlamaz ve arama motorlarına yeterli bilgi sağlamaz.',
      reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
      category: 'SEO'
    });
  } else if (h1Text.length > 70) {
    issues.push({
      type: 'suggestion',
      field: 'h1',
      message: `H1 başlığı çok uzun (${h1Text.length} karakter).`,
      suggestion: 'H1 başlığını 70 karakterden kısa tutmaya çalışın.',
      impact: 'düşük',
      difficulty: 'kolay',
      example: '<h1>SEO Teknikleri: Web Sitenizi Arama Motorlarında Üst Sıralara Taşımanın Yolları</h1> yerine <h1>SEO Teknikleri: Web Sitenizi Üst Sıralara Taşıma</h1>',
      explanation: 'Çok uzun H1 başlıkları, kullanıcı deneyimini olumsuz etkileyebilir ve ana mesajın kaybolmasına neden olabilir.',
      reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
      category: 'SEO'
    });
  } else {
    successes.push({
      field: 'h1',
      message: `H1 başlığı ideal uzunlukta (${h1Text.length} karakter).`,
      impact: 'SEO structure'
    });
  }
  
  // Başlık (title) ve H1 uyumu
  const pageTitle = $("title").text().trim();
  if (pageTitle) {
    const titleLower = pageTitle.toLowerCase();
    const h1Lower = h1Text.toLowerCase();
    
    // H1 ve title tamamen aynı mı?
    if (titleLower === h1Lower) {
      issues.push({
        type: 'suggestion',
        field: 'h1',
        message: 'H1 başlığı ve sayfa başlığı (title) tamamen aynı.',
        suggestion: 'H1 ve title etiketlerini birebir aynı yapmak yerine, benzer ancak farklı şekilde optimize edin.',
        impact: 'düşük',
        difficulty: 'kolay',
        example: 'Title: "SEO Teknikleri | Siteniz" ve H1: "SEO Teknikleri: Arama Motoru Optimizasyonu"',
        explanation: 'H1 ve title etiketlerinin tamamen aynı olması, arama motorlarında çeşitlilik açısından kaçırılmış bir fırsattır. Farklı ancak ilişkili içerikler, arama motorlarında daha fazla anahtar kelime kapsamı sağlar.',
        reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
        category: 'SEO'
      });
    }
    // Title içinde H1'in temel anahtar kelimeleri var mı?
    else {
      const h1Words = h1Lower.split(/\s+/).filter(word => word.length > 3);
      const primaryKeywords = h1Words.slice(0, 2).filter(word => word.length > 3);
      
      if (primaryKeywords.length > 0) {
        const keywordsInTitle = primaryKeywords.filter(word => titleLower.includes(word));
        
        if (keywordsInTitle.length === 0) {
          issues.push({
            type: 'warning',
            field: 'h1',
            message: 'H1 başlığının ana anahtar kelimeleri, sayfa başlığında (title) bulunmuyor.',
            suggestion: 'H1 ve title etiketlerinde tutarlı anahtar kelimeler kullanın.',
            impact: 'orta',
            difficulty: 'kolay',
            example: 'H1: "SEO Teknikleri" için title: "SEO Teknikleri | Siteniz"',
            explanation: 'H1 ve title etiketlerinin benzer anahtar kelimeler içermesi, arama motorlarına sayfanın ana konusu hakkında tutarlı sinyaller gönderir.',
            reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
            category: 'SEO'
          });
        } else {
          successes.push({
            field: 'h1',
            message: 'H1 başlığı ve sayfa başlığı (title) uyumlu anahtar kelimeler içeriyor.',
            impact: 'SEO structure'
          });
        }
      }
    }
  }
  
  // H1'in HTML yapısı içindeki konumu
  const bodyChildren = $("body").children();
  let h1Position = -1;
  
  bodyChildren.each((index, element) => {
    if ($(element).find("h1").length > 0 || $(element).is("h1")) {
      h1Position = index;
      return false; // döngüden çık
    }
  });
  
  if (h1Position > 3 && bodyChildren.length > 5) {
    issues.push({
      type: 'suggestion',
      field: 'h1',
      message: 'H1 başlığı sayfanın üst kısmında değil.',
      suggestion: 'H1 başlığını sayfanın en üst kısmına yakın yerleştirin.',
      impact: 'düşük',
      difficulty: 'orta',
      example: '<header>...<h1>Ana Başlık</h1>...</header> şeklinde sayfa başında konumlandırın.',
      explanation: 'H1 başlığının sayfanın üst kısmında yer alması, hem kullanıcılar hem de arama motorları için sayfanın ana konusunu hızlıca anlamayı sağlar.',
      reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
      category: 'SEO'
    });
  } else if (h1Position >= 0 && h1Position <= 3) {
    successes.push({
      field: 'h1',
      message: 'H1 başlığı sayfanın üst kısmında doğru konumlandırılmış.',
      impact: 'SEO structure'
    });
  }
  
  // H1 formatting kontrolü
  const h1Html = $.html(firstH1);
  if (/<h1[^>]*>\s*<[^>]+>[^<]*<\/[^>]+>\s*<\/h1>/i.test(h1Html)) {
    // H1 içinde başka bir etiket var
    if (/<h1[^>]*>\s*<(strong|b|em|i|span|a)[^>]*>[^<]*<\/(strong|b|em|i|span|a)>\s*<\/h1>/i.test(h1Html)) {
      // Bu normal bir durum, h1 içinde formatlama etiketleri olabilir
    } else {
      issues.push({
        type: 'warning',
        field: 'h1',
        message: 'H1 başlığı içinde beklenmeyen HTML etiketleri bulunuyor.',
        suggestion: 'H1 içinde sadece metin veya temel formatlama etiketleri (strong, em, span, a) kullanın.',
        impact: 'düşük',
        difficulty: 'kolay',
        example: '<h1>SEO <strong>Teknikleri</strong></h1> şeklinde kullanabilirsiniz.',
        explanation: 'H1 içinde karmaşık HTML yapıları, başlığın okunabilirliğini ve arama motorları tarafından anlaşılmasını zorlaştırabilir.',
        reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
        category: 'SEO'
      });
    }
  }
  
  // H1 stili kontrolü - CSS class kullanılıyor mu?
  if (firstH1.attr('style') || (firstH1.attr('class') && firstH1.attr('class')!.length > 20)) {
    issues.push({
      type: 'suggestion',
      field: 'h1',
      message: 'H1 başlığında karmaşık inline stil veya uzun CSS sınıf adları kullanılmış.',
      suggestion: 'H1 stillerini CSS dosyasında tanımlayın ve etiket üzerinde minimum stil kullanın.',
      impact: 'düşük',
      difficulty: 'orta',
      example: '<h1 class="heading">Başlık</h1> ve stillerinizi CSS dosyasında tanımlayın.',
      explanation: 'Inline stiller ve uzun sınıf adları, sayfanın kod/içerik oranını olumsuz etkileyebilir ve sayfa yüklenme süresini artırabilir.',
      reference: 'https://developers.google.com/speed/docs/insights/OptimizeCSSDelivery',
      category: 'SEO'
    });
  }
  
  // H1'de anahtar kelime yoğunluğu kontrolü - SEO açısından aşırı optimizasyon riski
  const h1Words = h1Text.toLowerCase().split(/\s+/);
  const h1WordCounts: {[key: string]: number} = {};
  
  h1Words.forEach(word => {
    if (word.length > 3) { // 3 karakterden uzun kelimeleri say
      h1WordCounts[word] = (h1WordCounts[word] || 0) + 1;
    }
  });
  
  const repeatedWords = Object.entries(h1WordCounts)
    .filter(([_, count]) => count > 1)
    .map(([word]) => word);
  
  if (repeatedWords.length > 0) {
    issues.push({
      type: 'suggestion',
      field: 'h1',
      message: `H1 başlığında tekrar eden kelimeler: ${repeatedWords.join(', ')}`,
      suggestion: 'H1 başlığında aynı kelimeleri tekrar etmeyin.',
      impact: 'düşük',
      difficulty: 'kolay',
      example: '"SEO SEO Teknikleri" yerine "SEO Teknikleri ve Stratejileri"',
      explanation: 'Anahtar kelimelerin aşırı tekrarı, arama motorları tarafından spam olarak algılanabilir.',
      reference: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
      category: 'SEO'
    });
  }
  
  // H1'de büyük harf kullanımı kontrolü
  if (h1Text === h1Text.toUpperCase() && h1Text.length > 5) {
    issues.push({
      type: 'warning',
      field: 'h1',
      message: 'H1 başlığı tamamen büyük harflerle yazılmış.',
      suggestion: 'H1 başlığında normal büyük/küçük harf kullanımını tercih edin.',
      impact: 'düşük',
      difficulty: 'kolay',
      example: '"TÜM ÜRÜNLER" yerine "Tüm Ürünler"',
      explanation: 'Tamamen büyük harflerle yazılmış başlıklar, okunabilirliği azaltır ve kullanıcı deneyimini olumsuz etkiler.',
      reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
      category: 'SEO'
    });
  }
  
  // H1 içinde HTML entity kontrolü
  if (/&[a-z]+;/i.test(h1Text)) {
    issues.push({
      type: 'suggestion',
      field: 'h1',
      message: 'H1 başlığında HTML entity karakterleri kullanılmış.',
      suggestion: 'Mümkünse doğrudan Unicode karakterleri kullanın.',
      impact: 'düşük',
      difficulty: 'kolay',
      example: '"SEO &amp; Dijital Pazarlama" yerine "SEO & Dijital Pazarlama"',
      explanation: 'HTML entity karakterleri bazen arama motorları tarafından farklı yorumlanabilir ve okunabilirliği azaltabilir.',
      reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
      category: 'SEO'
    });
  }
  
  // URL ve H1 uyumu kontrolü
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || '';
  const urlSegments = canonicalUrl.split('/').filter(Boolean);
  const lastUrlSegment = urlSegments[urlSegments.length - 1]?.replace(/-/g, ' ').replace(/\.(html|php|asp|jsp)$/i, '');
  
  if (lastUrlSegment && lastUrlSegment.length > 3) {
    const urlKeywords = lastUrlSegment.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const h1Keywords = h1Text.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    
    const commonKeywords = urlKeywords.filter(word => h1Keywords.includes(word));
    
    if (urlKeywords.length > 0 && commonKeywords.length === 0) {
      issues.push({
        type: 'suggestion',
        field: 'h1',
        message: 'H1 başlığı ve URL arasında anahtar kelime uyumu yok.',
        suggestion: 'H1 başlığınızda URL\'deki anahtar kelimeleri kullanmayı düşünün.',
        impact: 'düşük',
        difficulty: 'orta',
        example: 'URL: "/seo-teknikleri" için H1: "SEO Teknikleri: Başarılı Stratejiler"',
        explanation: 'H1 başlığı ve URL\'nin benzer anahtar kelimeler içermesi, arama motorlarına tutarlı sinyaller gönderir.',
        reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
        category: 'SEO'
      });
    } else if (commonKeywords.length > 0) {
      successes.push({
        field: 'h1',
        message: 'H1 başlığı ve URL benzer anahtar kelimeler içeriyor.',
        impact: 'SEO structure'
      });
    }
  }
  
  // H1 ve meta açıklama uyumu kontrolü
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  if (metaDescription) {
    const descriptionLower = metaDescription.toLowerCase();
    const h1KeywordsInDescription = h1Text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .some(word => descriptionLower.includes(word));
    
    if (!h1KeywordsInDescription && h1Text.length > 10) {
      issues.push({
        type: 'suggestion',
        field: 'h1',
        message: 'H1 başlığındaki anahtar kelimeler meta açıklamada bulunmuyor.',
        suggestion: 'Meta açıklamada H1 başlığınızdaki önemli anahtar kelimeleri kullanın.',
        impact: 'düşük',
        difficulty: 'kolay',
        example: 'H1: "SEO Teknikleri" için meta açıklama: "SEO Teknikleri ile sitenizin arama motoru sıralamalarını yükseltin."',
        explanation: 'H1 ve meta açıklamanın tutarlı olması, arama motorlarına sayfanın ana konusu hakkında güçlü sinyaller gönderir.',
        reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
        category: 'SEO'
      });
    } else if (h1KeywordsInDescription) {
      successes.push({
        field: 'h1',
        message: 'H1 başlığı ve meta açıklama uyumlu anahtar kelimeler içeriyor.',
        impact: 'SEO structure'
      });
    }
  }
  
  // H1 başlığında sayı kullanımı - bu genellikle olumlu bir şeydir
  if (/\d+/.test(h1Text) && /(en iyi|ipuçları|yolları|adımları|teknikleri|yöntemleri)/i.test(h1Text)) {
    successes.push({
      field: 'h1',
      message: 'H1 başlığında liste/sayı formatı kullanılmış, bu tıklama oranını artırabilir.',
      impact: 'SEO structure'
    });
  }
  
  // H1'de soru biçimi kullanımı - bu genellikle kullanıcı etkileşimini artırır
  if (/\?/.test(h1Text)) {
    successes.push({
      field: 'h1',
      message: 'H1 başlığında soru formatı kullanılmış, bu kullanıcı etkileşimini artırabilir.',
      impact: 'SEO structure'
    });
  }
  
  // Heading hiyerarşisi kontrolü
  const h2Count = $("h2").length;
  const h3Count = $("h3").length;
  
  if (h2Count === 0 && h3Count > 0) {
    issues.push({
      type: 'warning',
      field: 'h1',
      message: 'Sayfa H2 başlık kullanmadan H3 başlıklar içeriyor.',
      suggestion: 'Başlık hiyerarşisine uyun: H1 > H2 > H3.',
      impact: 'orta',
      difficulty: 'orta',
      example: 'Doğru hiyerarşi: <h1>Ana Başlık</h1> <h2>Alt Başlık</h2> <h3>Alt başlığın alt başlığı</h3>',
      explanation: 'Doğru başlık hiyerarşisi, sayfa yapısını arama motorlarına daha iyi anlatır ve erişilebilirliği artırır.',
      reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
      category: 'SEO'
    });
  }
  
  // H1'de özel karakter kontrolü
  const specialChars = /[^\u0020-\u007E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u0400-\u04FF\u0370-\u03FF\u0590-\u05FF]/g;
  const specialCharsFound = h1Text.match(specialChars);
  
  if (specialCharsFound) {
    issues.push({
      type: 'suggestion',
      field: 'h1',
      message: 'H1 başlığında desteklenmeyen özel karakterler kullanılmış.',
      suggestion: 'Emoji ve özel karakterleri standart karakterlerle değiştirin.',
      impact: 'düşük',
      difficulty: 'kolay',
      example: '"✨SEO Teknikleri🔥" yerine "SEO Teknikleri"',
      explanation: 'Bazı özel karakterler ve emojiler arama motorları tarafından düzgün işlenemeyebilir.',
      reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
      category: 'SEO'
    });
  }
  
  // Tüm analiz bitti, genel başarı durumu
  if (issues.length === 0) {
    successes.push({
      field: 'h1',
      message: 'H1 başlığı tüm SEO gereksinimlerini karşılıyor.',
      impact: 'SEO structure'
    });
  }
  
  return { issues, successes };
}

function analyzeImgAlt($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  
  // Tüm görselleri bul
  const allImages = $("img").toArray();
  const totalImages = allImages.length;
  
  if (totalImages === 0) {
    // Sayfada hiç görsel yoksa bilgilendirme ekle
    return {
      issues: [{ 
        type: 'bilgi', 
        field: 'img', 
        message: 'Sayfada hiç görsel bulunmuyor.', 
        suggestion: 'İçeriğinizi desteklemek için ilgili görseller ekleyebilirsiniz.', 
        impact: 'engagement', 
        difficulty: 'orta', 
        example: '<img src="ilgili-gorsel.jpg" alt="İçeriği açıklayıcı metin">', 
        explanation: 'Kaliteli ve içeriğe uygun görseller kullanıcı deneyimini iyileştirir ve sayfada kalma süresini artırır.', 
        reference: 'https://developers.google.com/search/docs/appearance/google-images', 
        category: 'SEO' 
      }],
      successes: []
    };
  }
  
  // Alt etiketi olmayanları bul
  const imgsWithoutAlt = allImages.filter(img => !$(img).attr('alt') || $(img).attr('alt')?.trim() === '');
  const imgsWithoutAltCount = imgsWithoutAlt.length;
  
  // Yetersiz alt metin içeren görselleri bul (çok kısa veya generic alt metinler)
  const imgsWithPoorAlt = allImages.filter(img => {
    const alt = $(img).attr('alt')?.trim() || '';
    // Boş değil ama çok kısa (1-3 karakter) veya generic ifadeler içeren alt metinler
    return alt !== '' && (alt.length < 4 || 
      /^(image|picture|photo|icon|resim|görsel|foto|ikon)$/i.test(alt) ||
      /^img[0-9]*$/i.test(alt));
  });
  const imgsWithPoorAltCount = imgsWithPoorAlt.length;
  
  // Çok uzun alt metin içeren görseller (125 karakterden uzun)
  const imgsWithLongAlt = allImages.filter(img => {
    const alt = $(img).attr('alt')?.trim() || '';
    return alt.length > 125;
  });
  const imgsWithLongAltCount = imgsWithLongAlt.length;
  
  // İstatistikleri hesapla
  const goodAltCount = totalImages - imgsWithoutAltCount - imgsWithPoorAltCount - imgsWithLongAltCount;
  const altCoveragePercent = Math.round(((totalImages - imgsWithoutAltCount) / totalImages) * 100);
  const goodAltPercent = Math.round((goodAltCount / totalImages) * 100);
  
  // Sonuçları oluştur
  if (imgsWithoutAltCount > 0) {
    issues.push({ 
      type: 'hata', 
      field: 'img', 
      message: `${imgsWithoutAltCount} adet görselde alt etiketi eksik (${totalImages} görselin %${100 - altCoveragePercent}'i).`, 
      suggestion: 'Tüm görsellere içerikle ilgili açıklayıcı alt metinler ekleyin.', 
      impact: 'yüksek', 
      difficulty: 'kolay', 
      example: '<img src="urun-gorsel.jpg" alt="Mavi Pamuklu Slim Fit Erkek Gömlek">', 
      explanation: 'Alt etiketleri eksik olan görseller, arama motorları tarafından anlaşılamaz ve görme engelli kullanıcılar için erişilebilirlik sorunları yaratır. Uygun alt metinler hem SEO performansınızı hem de sitenizin erişilebilirliğini iyileştirir.', 
      reference: 'https://developers.google.com/search/docs/appearance/google-images/images-with-markup', 
      category: 'SEO-Erişilebilirlik' 
    });
    
    // İlk 3 eksik alt etiketli görsel için örnekler ver
    if (imgsWithoutAlt.length > 0) {
      const examples = imgsWithoutAlt.slice(0, 3).map(img => {
        const src = $(img).attr('src') || '';
        const srcShort = src.length > 40 ? src.substring(0, 37) + '...' : src;
        return `<img src="${srcShort}">`;
      }).join('\n');
      
      issues.push({ 
        type: 'örnek', 
        field: 'img', 
        message: 'Alt etiketi eksik olan görseller:', 
        suggestion: examples, 
        impact: 'bilgi', 
        difficulty: 'kolay', 
        example: '', 
        explanation: 'Yukarıdaki görsellere anlamlı alt metinler ekleyin.', 
        reference: '', 
        category: 'SEO-Erişilebilirlik' 
      });
    }
  }
  
  if (imgsWithPoorAltCount > 0) {
    issues.push({ 
      type: 'uyarı', 
      field: 'img', 
      message: `${imgsWithPoorAltCount} adet görselde yetersiz alt metin kullanılmış.`, 
      suggestion: 'Yetersiz alt metinleri, görselin içeriğini açıklayan daha spesifik metinlerle değiştirin.', 
      impact: 'orta', 
      difficulty: 'kolay', 
      example: 'Yetersiz: <img src="..." alt="resim">\nİyi: <img src="..." alt="2023 Yaz Koleksiyonu Çiçek Desenli Elbise">', 
      explanation: 'Generic alt metinler ("resim", "görsel" gibi) veya çok kısa açıklamalar, arama motorlarına ve ekran okuyuculara yeterli bilgi sağlamaz. Her görselin içeriğini net bir şekilde açıklayan 4-125 karakter arasında metinler kullanın.', 
      reference: 'https://developers.google.com/search/docs/advanced/guidelines/google-images', 
      category: 'SEO-Erişilebilirlik' 
    });
  }
  
  if (imgsWithLongAltCount > 0) {
    issues.push({ 
      type: 'uyarı', 
      field: 'img', 
      message: `${imgsWithLongAltCount} adet görselde çok uzun alt metin kullanılmış.`, 
      suggestion: 'Alt metinleri 125 karakterden kısa, öz ve açıklayıcı olacak şekilde düzenleyin.', 
      impact: 'düşük', 
      difficulty: 'kolay', 
      example: 'Uzun: <img src="..." alt="Bu ürün son derece kaliteli malzemelerden üretilmiş olup uzun yıllar dayanıklılığını koruyacak şekilde tasarlanmıştır ve her türlü ortamda...">\nİyi: <img src="..." alt="Uzun Ömürlü Dayanıklı Deri Koltuk - Kahverengi">', 
      explanation: 'Çok uzun alt metinler ekran okuyucular tarafından okunması zor olabilir ve kullanıcı deneyimini olumsuz etkileyebilir. Kısa ve öz açıklamalar kullanıcılar ve arama motorları için daha etkilidir.', 
      reference: 'https://www.w3.org/WAI/tutorials/images/tips/', 
      category: 'SEO-Erişilebilirlik' 
    });
  }
  
  // Başarılar
  if (totalImages > 0 && imgsWithoutAltCount === 0) {
    successes.push({ 
      field: 'img', 
      message: 'Harika! Sayfadaki tüm görsellerde alt etiketi mevcut.', 
      impact: 'erişilebilirlik' 
    });
  }
  
  if (goodAltPercent >= 80) {
    successes.push({ 
      field: 'img', 
      message: `Görsellerin %${goodAltPercent}'inde uygun uzunlukta ve açıklayıcı alt metinler kullanılmış.`, 
      impact: 'seo' 
    });
  }
  
  // Dekoratif görseller için role="presentation" veya aria-hidden="true" kullanımı önerisi
  const decorativeImagesTip = allImages.length > 5;
  if (decorativeImagesTip) {
    issues.push({ 
      type: 'suggestion', 
      field: 'img', 
      message: 'Dekoratif görseller için erişilebilirlik iyileştirmeleri yapılabilir.', 
      suggestion: 'Sadece dekoratif amaçlı görseller için role="presentation" veya aria-hidden="true" kullanabilirsiniz.', 
      impact: 'düşük', 
      difficulty: 'kolay', 
      example: '<img src="dekoratif-arka-plan.jpg" alt="" role="presentation">', 
      explanation: 'Saf dekoratif görseller için (içerik değeri olmayan) boş alt metinle birlikte role="presentation" kullanımı, ekran okuyucuların bu görselleri atlamasını sağlayarak erişilebilirliği artırır.', 
      reference: 'https://www.w3.org/WAI/tutorials/images/decorative/', 
      category: 'Erişilebilirlik' 
    });
  }
  
  return { issues, successes };
}

function analyzeCanonical($: CheerioAPI, url: string): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Find all canonical tags (there should normally be just one)
  const canonicalElements = $('link[rel="canonical"]');
  
  // Check if there are multiple canonical tags
  if (canonicalElements.length > 1) {
    issues.push({ 
      type: 'warning', 
      field: 'canonical', 
      message: 'Sayfada birden fazla canonical etiketi bulundu.', 
      suggestion: 'Sadece tek bir canonical etiketi kullanın.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<link rel="canonical" href="https://site.com/sayfa">', 
      explanation: 'Birden fazla canonical etiketi, arama motorlarının hangi URL\'nin gerçek kaynak sayfa olduğunu anlamasını zorlaştırır. Tüm fazla etiketleri kaldırıp sadece bir tane bırakın.', 
      reference: 'https://developers.google.com/search/docs/appearance/canonical', 
      category: 'SEO' 
    });
  }
  
  // Check if canonical tag exists
  if (canonicalElements.length === 0) {
    issues.push({ 
      type: 'warning', 
      field: 'canonical', 
      message: 'Sayfada canonical etiketi yok.', 
      suggestion: 'Her sayfada doğru canonical etiketi kullanın.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<link rel="canonical" href="https://site.com/sayfa">', 
      explanation: 'Canonical etiketler, arama motorlarına içeriklerin tekrarlanmasını önlemek için hangi URL\'nin tercih edilen URL olduğunu bildirir. Bu etiketin olmaması, arama motorlarının içeriğinizin farklı URL\'lerdeki kopyalarını bağımsız sayfalar olarak değerlendirmesine yol açabilir.', 
      reference: 'https://developers.google.com/search/docs/appearance/canonical', 
      category: 'SEO' 
    });
    return { issues, successes };
  }
  
  // Get canonical URL
  const canonical = $(canonicalElements[0]).attr('href') || '';
  
  if (!canonical) {
    issues.push({ 
      type: 'error', 
      field: 'canonical', 
      message: 'Canonical etiketi mevcut fakat href özelliği boş.', 
      suggestion: 'Canonical etiketine geçerli bir URL ekleyin.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<link rel="canonical" href="https://site.com/sayfa">', 
      explanation: 'Href özelliği olmayan bir canonical etiketi, arama motorları tarafından göz ardı edilir ve SEO değeri sağlamaz. Etikete geçerli bir URL eklemelisiniz.', 
      reference: 'https://developers.google.com/search/docs/appearance/canonical', 
      category: 'SEO' 
    });
    return { issues, successes };
  }
  
  // Check if it's a relative URL
  const isRelativeUrl = !canonical.startsWith('http://') && !canonical.startsWith('https://') && !canonical.startsWith('//');
  
  if (isRelativeUrl) {
    issues.push({ 
      type: 'info', 
      field: 'canonical', 
      message: 'Canonical etiketi göreceli URL kullanıyor.', 
      suggestion: 'Mümkünse mutlak URL kullanın.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<link rel="canonical" href="https://site.com/sayfa">', 
      explanation: 'Göreceli URL\'ler genellikle çalışsa da, mutlak URL\'ler daha güvenilirdir ve tüm durumlarda doğru şekilde yorumlanmasını sağlar. Özellikle farklı protokoller veya alt alanlar varsa, mutlak URL\'ler karışıklığı önler.', 
      reference: 'https://developers.google.com/search/docs/appearance/canonical', 
      category: 'SEO' 
    });
  }
  
  // Try to resolve and compare URLs properly
  try {
    // Normalize both URLs for proper comparison
    const canonicalUrl = new URL(canonical, url);
    const currentUrl = new URL(url);
    
    // Normalize URLs by removing trailing slashes, default ports, and normalizing to lowercase
    const normalizeUrl = (inputUrl: URL): string => {
      let normalized = inputUrl.href.toLowerCase()
        .replace(/\/$/, '') // Remove trailing slash
        .replace(/^http:\/\//, 'https://'); // Normalize to https where possible
      
      // Remove www if present in one URL but not the other
      if (currentUrl.hostname.startsWith('www.') !== canonicalUrl.hostname.startsWith('www.')) {
        normalized = normalized.replace(/^https:\/\/www\./, 'https://');
      }
      
      // Remove common tracking parameters
      const urlObj = new URL(normalized);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      return urlObj.href.replace(/\/$/, '');
    };
    
    const normalizedCanonical = normalizeUrl(canonicalUrl);
    const normalizedCurrent = normalizeUrl(currentUrl);
    
    // Check if canonical points to current page
    if (normalizedCanonical === normalizedCurrent) {
      successes.push({ 
        field: 'canonical', 
        message: 'Canonical etiketi doğru şekilde yapılandırılmış ve gerçek URL ile eşleşiyor.', 
        impact: 'positive' 
      });
    } else {
      // Check if this is intentional canonicalization to a different URL
      const canonicalDomain = canonicalUrl.hostname;
      const currentDomain = currentUrl.hostname;
      
      if (canonicalDomain !== currentDomain) {
        issues.push({ 
          type: 'warning', 
          field: 'canonical', 
          message: `Canonical etiketi farklı bir alan adına işaret ediyor: ${canonicalDomain}`, 
          suggestion: 'Eğer kasıtlı değilse, canonical etiketini mevcut sayfaya işaret etmesi için düzeltin.', 
          impact: 'high', 
          difficulty: 'orta', 
          example: `<link rel="canonical" href="${currentUrl.href}">`, 
          explanation: 'Farklı bir alan adına işaret eden canonical etiketleri, arama trafiğinizi başka bir siteye yönlendirir. Bu bazen bilinçli bir stratejinin parçası olabilir, ancak genellikle bir hatadır.', 
          reference: 'https://developers.google.com/search/docs/appearance/canonical', 
          category: 'SEO' 
        });
      } else if (canonicalUrl.pathname !== currentUrl.pathname) {
        // Canonical points to a different page on the same domain
        issues.push({ 
          type: 'info', 
          field: 'canonical', 
          message: `Canonical etiketi aynı site içinde farklı bir sayfaya işaret ediyor: ${canonicalUrl.pathname}`, 
          suggestion: 'Eğer kasıtlı bir yönlendirme değilse, canonical etiketini düzeltin.', 
          impact: 'medium', 
          difficulty: 'orta', 
          example: `<link rel="canonical" href="${currentUrl.href}">`, 
          explanation: 'Bu sayfa, canonical etiketiyle başka bir sayfaya işaret ediyor. Bu, içerik kopyası olarak görüldüğü ve arama sıralamasında öncelik verilmeyeceği anlamına gelir. Bu kasıtlı bir strateji olabilir, ancak yanlışlıkla yapıldıysa düzeltilmelidir.', 
          reference: 'https://developers.google.com/search/docs/appearance/canonical', 
          category: 'SEO' 
        });
      }
      
      // Check for www vs non-www inconsistency
      if (canonicalDomain.startsWith('www.') !== currentDomain.startsWith('www.')) {
        const correctDomain = currentDomain.startsWith('www.') ? currentDomain : `www.${currentDomain}`;
        issues.push({ 
          type: 'warning', 
          field: 'canonical', 
          message: 'Canonical URL ve gerçek URL arasında www tutarsızlığı var.', 
          suggestion: `Tüm site genelinde tutarlı bir şekilde ${correctDomain} kullanın.`, 
          impact: 'medium', 
          difficulty: 'orta', 
          example: `<link rel="canonical" href="https://${correctDomain}${currentUrl.pathname}">`, 
          explanation: 'Arama motorlarının bakış açısından www ve www olmayan URL\'ler farklı URL\'lerdir. Site genelinde tutarlı bir şekilde tek bir versiyonu tercih etmeli ve canonical etiketlerinizde buna uymalısınız.', 
          reference: 'https://developers.google.com/search/docs/appearance/canonical', 
          category: 'SEO' 
        });
      }
      
      // Check for protocol inconsistency (http vs https)
      if (canonicalUrl.protocol !== currentUrl.protocol) {
        issues.push({ 
          type: 'warning', 
          field: 'canonical', 
          message: `Canonical URL protokolü (${canonicalUrl.protocol}) gerçek URL protokolünden (${currentUrl.protocol}) farklı.`, 
          suggestion: 'Tüm site genelinde HTTPS protokolünü kullanın.', 
          impact: 'medium', 
          difficulty: 'orta', 
          example: `<link rel="canonical" href="https://${currentUrl.host}${currentUrl.pathname}">`, 
          explanation: 'Protokol tutarsızlıkları arama motorlarının içeriğinizi doğru bir şekilde dizine eklemesini engelleyebilir. Tüm canonical URL\'lerde HTTPS kullanılması önerilir.', 
          reference: 'https://developers.google.com/search/docs/appearance/canonical', 
          category: 'SEO' 
        });
      }
    }
    
    // Check if canonical has unnecessary query parameters
    if (canonicalUrl.search) {
      issues.push({ 
        type: 'info', 
        field: 'canonical', 
        message: 'Canonical URL sorgu parametreleri içeriyor.', 
        suggestion: 'Genellikle canonical URL\'lerde sorgu parametreleri olmamalıdır.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: `<link rel="canonical" href="https://${canonicalUrl.host}${canonicalUrl.pathname}">`, 
        explanation: 'Sorgu parametreleri genellikle filtreleme, sıralama veya takip için kullanılır ve çoğu zaman içerik değiştirmez. Canonical URL\'lerde sorgu parametrelerinin bulunması, benzer içeriğin farklı URL\'ler olarak görülmesine neden olabilir.', 
        reference: 'https://developers.google.com/search/docs/appearance/canonical', 
        category: 'SEO' 
      });
    }
  } catch (error) {
    // URL parsing failed
    issues.push({ 
      type: 'error', 
      field: 'canonical', 
      message: 'Canonical URL geçerli bir URL formatında değil.', 
      suggestion: 'Geçerli bir mutlak URL kullanın.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<link rel="canonical" href="https://site.com/sayfa">', 
      explanation: 'Canonical etiketinde geçersiz bir URL formatı var. Arama motorları bu etiketi görmezden gelecek ve bu, potansiyel SEO değerini kaybetmenize neden olabilir.', 
      reference: 'https://developers.google.com/search/docs/appearance/canonical', 
      category: 'SEO' 
    });
  }
  
  return { issues, successes };
}


function analyzeRobots($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Find all robots meta tags
  const robotsElements = $('meta[name="robots"]');
  const googlebotsElements = $('meta[name="googlebot"]');
  
  // Check if there are multiple standard robots meta tags
  if (robotsElements.length > 1) {
    issues.push({ 
      type: 'warning', 
      field: 'robots', 
      message: 'Sayfada birden fazla robots meta etiketi bulundu.', 
      suggestion: 'Sadece bir robots meta etiketi kullanın.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<meta name="robots" content="index,follow">', 
      explanation: 'Birden fazla robots meta etiketi olması, arama motorlarının çelişkili sinyaller almasına ve beklenmedik davranışlara neden olabilir. En katı kısıtlama genellikle öncelik alır, ancak arama motorlarının yorumlaması değişiklik gösterebilir.', 
      reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
      category: 'SEO' 
    });
  }
  
  // If no robots meta tag exists
  if (robotsElements.length === 0) {
    issues.push({ 
      type: 'info', 
      field: 'robots', 
      message: 'Robots meta etiketi eksik.', 
      suggestion: 'Arama motoru kontrolü için robots meta etiketi ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<meta name="robots" content="index,follow">', 
      explanation: 'Robots meta etiketi, arama motorlarına sayfanızın nasıl işlenmesi ve dizine eklenmesi gerektiğini belirtir. Varsayılan olarak arama motorları sayfaları dizine ekler ve bağlantıları takip eder, ancak bu davranışı açıkça belirtmek daha iyi bir uygulamadır.', 
      reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
      category: 'SEO' 
    });
    
    // Add info about googlebot meta tag if it exists without standard robots tag
    if (googlebotsElements.length > 0) {
      issues.push({ 
        type: 'warning', 
        field: 'robots', 
        message: 'Standart robots meta etiketi olmadan googlebot meta etiketi kullanılmış.', 
        suggestion: 'Hem standart robots meta etiketi hem de googlebot meta etiketi kullanın.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<meta name="robots" content="index,follow">\n<meta name="googlebot" content="index,follow,max-snippet:-1">', 
        explanation: 'Sadece googlebot meta etiketi kullanmak, Google dışındaki arama motorlarının bu talimatları görmemesine neden olur. En iyi uygulama, genel talimatlar için robots meta etiketi kullanmak ve Google\'a özel talimatlar için ilave googlebot meta etiketi eklemektir.', 
        reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
        category: 'SEO' 
      });
    }
    
    return { issues, successes };
  }
  
  // Analyze the content of robots meta tag
  const robotsContent = $(robotsElements[0]).attr('content') || '';
  const googlebotContent = googlebotsElements.length > 0 ? $(googlebotsElements[0]).attr('content') || '' : '';
  
  // Success message for having a robots tag
  successes.push({ 
    field: 'robots', 
    message: 'Robots meta etiketi mevcut.', 
    impact: 'positive' 
  });
  
  // Parse directive values
  const directives = robotsContent.toLowerCase().split(',').map(d => d.trim());
  const googlebotDirectives = googlebotContent.toLowerCase().split(',').map(d => d.trim());
  
  // Check for critical directives
  const hasNoindex = directives.includes('noindex');
  const hasNofollow = directives.includes('nofollow');
  const hasNone = directives.includes('none');
  const hasNoarchive = directives.includes('noarchive');
  const hasNosnippet = directives.includes('nosnippet');
  const hasNoimageindex = directives.includes('noimageindex');
  const hasNoindexGooglebot = googlebotDirectives.includes('noindex');
  
  // Check for conflicting directives
  const hasIndex = directives.includes('index');
  const hasFollow = directives.includes('follow');
  const hasAll = directives.includes('all');
  
  // Check for "none" directive which is equivalent to "noindex, nofollow"
  if (hasNone) {
    issues.push({ 
      type: 'error', 
      field: 'robots', 
      message: '"none" direktifi kullanılmış - bu sayfa tamamen arama motorlarından gizlenir.', 
      suggestion: 'Eğer bu sayfa arama motorlarında görünmeli ise, "none" direktifini kaldırın.', 
      impact: 'critical', 
      difficulty: 'kolay', 
      example: '<meta name="robots" content="index,follow">', 
      explanation: '"none" direktifi, hem "noindex" hem de "nofollow" direktiflerinin birleşimidir. Bu, sayfanızın arama sonuçlarında gösterilmeyeceği ve arama motorlarının bu sayfadaki bağlantıları takip etmeyeceği anlamına gelir. Bu genellikle yalnızca özel veya gizli kalması gereken sayfalar için kullanılmalıdır.', 
      reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
      category: 'SEO' 
    });
  }
  
  // Check for noindex directive
  if (hasNoindex) {
    issues.push({ 
      type: 'warning', 
      field: 'robots', 
      message: '"noindex" direktifi kullanılmış - bu sayfa arama sonuçlarında gösterilmeyecek.', 
      suggestion: 'Eğer bu sayfa arama motorlarında görünmeli ise, "noindex" direktifini kaldırın.', 
      impact: 'critical', 
      difficulty: 'kolay', 
      example: '<meta name="robots" content="index,follow">', 
      explanation: '"noindex" direktifi arama motorlarına bu sayfayı dizinlerine eklememelerini söyler, bu da sayfanın arama sonuçlarında gösterilmeyeceği anlamına gelir. Bu, test sayfaları, içerik tekrarı olan sayfalar veya özel sayfalar için kullanılmalıdır. Herkese açık ve değerli içerik için kullanılmamalıdır.', 
      reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
      category: 'SEO' 
    });
  }
  
  // Check for nofollow directive
  if (hasNofollow) {
    issues.push({ 
      type: 'warning', 
      field: 'robots', 
      message: '"nofollow" direktifi kullanılmış - arama motorları bu sayfadaki bağlantıları takip etmeyecek.', 
      suggestion: 'Eğer sayfadaki bağlantıların takip edilmesi gerekiyorsa, "nofollow" direktifini kaldırın.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<meta name="robots" content="index,follow">', 
      explanation: '"nofollow" direktifi, arama motorlarının bu sayfadaki bağlantıları takip etmemesini ve bu bağlantıların hedef sayfalarına SEO değeri aktarmamasını sağlar. Bu, sitenizdeki iç bağlantı yapısının önemli bir kısmını etkisiz hale getirebilir.', 
      reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
      category: 'SEO' 
    });
  }
  
  // Check for contradictory directives
  if ((hasIndex && hasNoindex) || (hasFollow && hasNofollow)) {
    issues.push({ 
      type: 'error', 
      field: 'robots', 
      message: 'Robots meta etiketinde çelişkili direktifler var.', 
      suggestion: 'Çelişkili direktifleri kaldırın (index/noindex veya follow/nofollow birlikte kullanılamaz).', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<meta name="robots" content="index,follow">', 
      explanation: 'Çelişkili direktifler arama motorlarının kafa karışıklığı yaşamasına neden olabilir. Genellikle en kısıtlayıcı direktif (noindex, nofollow) öncelikli olacaktır, ancak doğru ve net direktifler kullanmak en iyisidir.', 
      reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
      category: 'SEO' 
    });
  }
  
  // Check if "all" is used with restrictive directives
  if (hasAll && (hasNoindex || hasNofollow || hasNoarchive || hasNoimageindex || hasNosnippet)) {
    issues.push({ 
      type: 'warning', 
      field: 'robots', 
      message: '"all" direktifi kısıtlayıcı direktiflerle birlikte kullanılmış.', 
      suggestion: 'Ya "all" direktifini ya da kısıtlayıcı direktifleri kaldırın.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<meta name="robots" content="index,follow">', 
      explanation: '"all" direktifi "index,follow" ile eşdeğerdir ve kısıtlayıcı direktiflerle birlikte kullanıldığında çelişkili sonuçlar doğurabilir. Genellikle kısıtlayıcı direktifler (noindex, nofollow vb.) öncelikli olacaktır, ancak netlik için çelişkili direktifleri kullanmaktan kaçının.', 
      reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
      category: 'SEO' 
    });
  }
  
  // Check for noarchive, nosnippet, noimageindex directives
  if (hasNoarchive) {
    issues.push({ 
      type: 'info', 
      field: 'robots', 
      message: '"noarchive" direktifi kullanılmış - sayfanın önbelleğe alınmış versiyonları gösterilmeyecek.', 
      suggestion: 'Bu kasıtlı bir kısıtlama değilse, "noarchive" direktifini kaldırmayı düşünün.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<meta name="robots" content="index,follow">', 
      explanation: '"noarchive" direktifi, arama motorlarının bu sayfanın önbelleğe alınmış versiyonunu göstermemesini sağlar. Bu, sık değişen veya hassas içerik için kullanışlı olabilir, ancak çoğu sayfa için önbellekleme, kullanıcı deneyimini iyileştirir ve siteniz geçici olarak erişilemez olduğunda bile erişimi sağlar.', 
      reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
      category: 'SEO' 
    });
  }
  
  if (hasNosnippet) {
    issues.push({ 
      type: 'info', 
      field: 'robots', 
      message: '"nosnippet" direktifi kullanılmış - arama sonuçlarında açıklama gösterilmeyecek.', 
      suggestion: 'Bu kasıtlı bir kısıtlama değilse, "nosnippet" direktifini kaldırmayı düşünün.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<meta name="robots" content="index,follow">', 
      explanation: '"nosnippet" direktifi, arama sonuçlarında bu sayfa için açıklama metninin gösterilmemesini sağlar. Bu, tıklama oranını önemli ölçüde azaltabilir çünkü kullanıcılar sayfa içeriği hakkında ön bilgi alamayacaktır.', 
      reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
      category: 'SEO' 
    });
  }
  
  if (hasNoimageindex) {
    issues.push({ 
      type: 'info', 
      field: 'robots', 
      message: '"noimageindex" direktifi kullanılmış - sayfadaki resimler görsellerde gösterilmeyecek.', 
      suggestion: 'Bu kasıtlı bir kısıtlama değilse, "noimageindex" direktifini kaldırmayı düşünün.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<meta name="robots" content="index,follow">', 
      explanation: '"noimageindex" direktifi, arama motorlarının bu sayfadaki resimleri görsel aramada dizine eklememesini sağlar. Bu, görsellerin telif hakkı korumalı olduğu veya özel olması gerektiği durumlarda kullanışlı olabilir, ancak görsel trafiği kaybetmenize neden olur.', 
      reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
      category: 'SEO' 
    });
  }
  
  // Check Google-specific directives
  const hasMaxSnippet = directives.some(d => d.startsWith('max-snippet:')) || googlebotDirectives.some(d => d.startsWith('max-snippet:'));
  const hasMaxImagePreview = directives.some(d => d.startsWith('max-image-preview:')) || googlebotDirectives.some(d => d.startsWith('max-image-preview:'));
  const hasMaxVideoPreview = directives.some(d => d.startsWith('max-video-preview:')) || googlebotDirectives.some(d => d.startsWith('max-video-preview:'));
  const hasUnavailableAfter = directives.some(d => d.startsWith('unavailable_after:')) || googlebotDirectives.some(d => d.startsWith('unavailable_after:'));
  
  // Check for restrictive max-snippet value
  if (hasMaxSnippet) {
    const maxSnippetDir = [...directives, ...googlebotDirectives].find(d => d.startsWith('max-snippet:'));
    if (maxSnippetDir) {
      const snippetValue = maxSnippetDir.split(':')[1];
      if (snippetValue === '0' || snippetValue === '-1') {
        const impactType = snippetValue === '0' ? 'high' : 'info';
        const message = snippetValue === '0' ? 
          '"max-snippet:0" direktifi kullanılmış - hiçbir metin snippet\'i gösterilmeyecek.' : 
          '"max-snippet:-1" direktifi kullanılmış - tam uzunlukta snippet gösterilecek.';
          
        issues.push({ 
          type: snippetValue === '0' ? 'warning' : 'info', 
          field: 'robots', 
          message: message, 
          suggestion: snippetValue === '0' ? 'Snippet gösterimi için daha büyük bir değer kullanın.' : 'Bu kasıtlı bir ayar ise sorun yok.', 
          impact: impactType, 
          difficulty: 'kolay', 
          example: '<meta name="robots" content="index,follow,max-snippet:160">', 
          explanation: snippetValue === '0' ? 
            '"max-snippet:0" arama sonuçlarında sayfanız için metin önizlemesi gösterilmesini engeller, bu da tıklama oranını önemli ölçüde düşürebilir.' : 
            '"max-snippet:-1" arama sonuçlarında sayfanız için tam uzunlukta önizleme gösterilmesine izin verir, bu genellikle SEO açısından olumludur.', 
          reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag#directives', 
          category: 'SEO' 
        });
      }
    }
  }
  
  // Check for max-image-preview with restrictive value
  if (hasMaxImagePreview) {
    const maxImageDir = [...directives, ...googlebotDirectives].find(d => d.startsWith('max-image-preview:'));
    if (maxImageDir) {
      const imageValue = maxImageDir.split(':')[1];
      if (imageValue === 'none') {
        issues.push({ 
          type: 'warning', 
          field: 'robots', 
          message: '"max-image-preview:none" direktifi kullanılmış - görsel önizlemeleri gösterilmeyecek.', 
          suggestion: 'Görsel önizlemelere izin vermek için "standard" veya "large" değerini kullanın.', 
          impact: 'medium', 
          difficulty: 'kolay', 
          example: '<meta name="robots" content="index,follow,max-image-preview:large">', 
          explanation: '"max-image-preview:none" arama sonuçlarında sayfanızdaki görsellerin önizlemesinin gösterilmesini engeller, bu da görselle ilgili arama sonuçlarında tıklama oranınızı düşürebilir.', 
          reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag#directives', 
          category: 'SEO' 
        });
      }
    }
  }
  
  // Check for unavailable_after directive
  if (hasUnavailableAfter) {
    const unavailableDir = [...directives, ...googlebotDirectives].find(d => d.startsWith('unavailable_after:'));
    if (unavailableDir) {
      const dateStr = unavailableDir.replace('unavailable_after:', '').trim();
      const expiryDate = new Date(dateStr);
      const currentDate = new Date();
      
      if (!isNaN(expiryDate.getTime()) && expiryDate < currentDate) {
        issues.push({ 
          type: 'error', 
          field: 'robots', 
          message: `"unavailable_after" direktifi geçmiş bir tarih (${dateStr}) için ayarlanmış - sayfa artık arama sonuçlarında gösterilmiyor.`, 
          suggestion: 'Eğer sayfa hala geçerli ise, bu direktifi kaldırın.', 
          impact: 'critical', 
          difficulty: 'kolay', 
          example: '<meta name="robots" content="index,follow">', 
          explanation: '"unavailable_after" direktifi, belirtilen tarihten sonra sayfanın arama sonuçlarından kaldırılması gerektiğini söyler. Belirtilen tarih geçmişte kalmışsa, sayfanız artık arama sonuçlarında gösterilmiyor olabilir.', 
          reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag#directives', 
          category: 'SEO' 
        });
      } else if (!isNaN(expiryDate.getTime())) {
        issues.push({ 
          type: 'info', 
          field: 'robots', 
          message: `"unavailable_after" direktifi gelecek bir tarih (${dateStr}) için ayarlanmış.`, 
          suggestion: 'Bu kasıtlı bir ayar değilse, bu direktifi kaldırın.', 
          impact: 'medium', 
          difficulty: 'kolay', 
          example: '<meta name="robots" content="index,follow">', 
          explanation: '"unavailable_after" direktifi, belirtilen tarihten sonra sayfanın arama sonuçlarından kaldırılmasını sağlar. Bu direktif genellikle belirli bir süre sonra geçersiz olacak içerik veya teklifler için kullanılır.', 
          reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag#directives', 
          category: 'SEO' 
        });
      }
    }
  }
  
  // Check for inconsistency between standard robots and googlebot tags
  if (googlebotsElements.length > 0) {
    if (hasNoindex !== hasNoindexGooglebot) {
      issues.push({ 
        type: 'warning', 
        field: 'robots', 
        message: 'Robots ve googlebot meta etiketleri arasında index/noindex tutarsızlığı var.', 
        suggestion: 'Her iki meta etiketi için aynı indexleme direktiflerini kullanın.', 
        impact: 'high', 
        difficulty: 'orta', 
        example: '<meta name="robots" content="index,follow">\n<meta name="googlebot" content="index,follow">', 
        explanation: 'Robots ve googlebot meta etiketleri arasındaki tutarsızlık, arama motorlarının farklı şekillerde davranmasına neden olabilir. Google öncelikle googlebot meta etiketini dikkate alacak, diğer arama motorları ise standart robots etiketini kullanacaktır. Bu tutarsızlık, indeksleme sorunlarına neden olabilir.', 
        reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
        category: 'SEO' 
      });
    }
  }
  
  // If robots tag looks good with standard directives
  if ((!hasNoindex && !hasNofollow && !hasNone) && 
      (hasIndex || hasFollow || hasAll || (directives.length === 0))) {
    successes.push({ 
      field: 'robots', 
      message: 'Robots meta etiketi doğru şekilde yapılandırılmış ve içeriğin indekslenmesine izin veriyor.', 
      impact: 'positive' 
    });
  }
  
  return { issues, successes };
}

function analyzeOpenGraph($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Extract all Open Graph tags
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogDescription = $('meta[property="og:description"]').attr('content') || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  const ogUrl = $('meta[property="og:url"]').attr('content') || '';
  const ogType = $('meta[property="og:type"]').attr('content') || '';
  const ogSiteName = $('meta[property="og:site_name"]').attr('content') || '';
  
  // Extract Twitter Card tags
  const twitterCard = $('meta[name="twitter:card"]').attr('content') || '';
  const twitterTitle = $('meta[name="twitter:title"]').attr('content') || '';
  const twitterDescription = $('meta[name="twitter:description"]').attr('content') || '';
  const twitterImage = $('meta[name="twitter:image"]').attr('content') || '';
  
  // Extract standard HTML tags for comparison
  const htmlTitle = $('title').text() || '';
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  
  // Count how many essential OG tags are present
  const essentialTags = [
    { name: 'og:title', value: ogTitle },
    { name: 'og:description', value: ogDescription },
    { name: 'og:image', value: ogImage },
    { name: 'og:url', value: ogUrl },
    { name: 'og:type', value: ogType }
  ];
  
  const presentEssentialTags = essentialTags.filter(tag => tag.value).length;
  const missingEssentialTags = essentialTags.filter(tag => !tag.value);
  
  // Check if all essential OG tags are present
  if (presentEssentialTags === essentialTags.length) {
    successes.push({ 
      field: 'og', 
      message: 'Tüm temel Open Graph meta etiketleri mevcut.', 
      impact: 'high positive' 
    });
  } else {
    // Report missing essential tags
    issues.push({ 
      type: 'warning', 
      field: 'og', 
      message: `Temel Open Graph meta etiketlerinden ${missingEssentialTags.length} tanesi eksik.`, 
      suggestion: `Eksik etiketleri ekleyin: ${missingEssentialTags.map(t => t.name).join(', ')}.`, 
      impact: 'high', 
      difficulty: 'orta', 
      example: missingEssentialTags.map(t => `<meta property="${t.name}" content="...">`).join('\n'), 
      explanation: 'Temel Open Graph meta etiketlerinin tamamı, sosyal medya platformlarında içeriğinizin doğru bir şekilde görüntülenmesi için gereklidir. Eksik etiketler, içeriğinizin paylaşıldığında yanlış veya eksik bilgilerle gösterilmesine neden olabilir.', 
      reference: 'https://ogp.me/', 
      category: 'Social SEO' 
    });
  }
  
  // Check og:title
  if (ogTitle) {
    successes.push({ 
      field: 'og:title', 
      message: 'Open Graph başlık etiketi mevcut.', 
      impact: 'positive' 
    });
    
    // Check title length
    if (ogTitle.length < 15) {
      issues.push({ 
        type: 'info', 
        field: 'og:title', 
        message: 'Open Graph başlık etiketi çok kısa.', 
        suggestion: 'Başlık en az 15 karakter olmalıdır.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<meta property="og:title" content="Sitenizin Açıklayıcı ve Dikkat Çekici Başlığı">', 
        explanation: 'Kısa başlıklar, içeriğinizi yeterince açıklamayabilir ve sosyal medyada dikkat çekmeyebilir. İdeal başlık uzunluğu 60-90 karakter arasındadır.', 
        reference: 'https://ahrefs.com/blog/open-graph-meta-tags/', 
        category: 'Social SEO' 
      });
    } else if (ogTitle.length > 90) {
      issues.push({ 
        type: 'info', 
        field: 'og:title', 
        message: 'Open Graph başlık etiketi çok uzun.', 
        suggestion: 'Başlık 60-90 karakter arasında olmalıdır.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<meta property="og:title" content="Sitenizin Ana Başlığı - Kısa ve Öz">', 
        explanation: 'Çok uzun başlıklar sosyal medya platformlarında kırpılabilir. Facebook genellikle başlıkları 88 karakterden sonra kırpar. Mesajınızın tam olarak görüntülenmesi için başlığı kısaltın.', 
        reference: 'https://ahrefs.com/blog/open-graph-meta-tags/', 
        category: 'Social SEO' 
      });
    }
    
    // Check consistency with HTML title
    if (htmlTitle && ogTitle !== htmlTitle) {
      issues.push({ 
        type: 'info', 
        field: 'og:title', 
        message: 'Open Graph başlığı ile HTML başlığı aynı değil.', 
        suggestion: 'Tutarlılık için aynı başlık kullanmayı değerlendirin veya sosyal medya için özelleştirilmiş bir başlık kullanın.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<meta property="og:title" content="HTML başlığı ile aynı veya sosyal medya için optimize edilmiş başlık">', 
        explanation: 'Farklı başlıklar mutlaka bir sorun değildir - sosyal medya için daha cazip bir başlık kullanmak isteyebilirsiniz. Ancak genellikle tutarlılık kullanıcı deneyimi için faydalıdır. Eğer farklı başlık kullanıyorsanız, sosyal medyaya özgü amaçlı olduğundan emin olun.', 
        reference: 'https://developers.facebook.com/docs/sharing/webmasters/', 
        category: 'Social SEO' 
      });
    }
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'og:title', 
      message: 'Open Graph başlık etiketi eksik.', 
      suggestion: 'Sosyal medya paylaşımları için og:title etiketi ekleyin.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<meta property="og:title" content="Sitenizin Başlığı">', 
      explanation: 'og:title etiketi, içeriğiniz sosyal medyada paylaşıldığında görünecek başlığı belirler. Bu etiket olmadan, sosyal platformlar başlığı tahmin etmeye çalışacak ve bu genellikle ideal olmayan sonuçlar doğurur.', 
      reference: 'https://ogp.me/', 
      category: 'Social SEO' 
    });
  }
  
  // Check og:description
  if (ogDescription) {
    successes.push({ 
      field: 'og:description', 
      message: 'Open Graph açıklama etiketi mevcut.', 
      impact: 'positive' 
    });
    
    // Check description length
    if (ogDescription.length < 50) {
      issues.push({ 
        type: 'info', 
        field: 'og:description', 
        message: 'Open Graph açıklama etiketi çok kısa.', 
        suggestion: 'Açıklama en az 50 karakter olmalıdır.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<meta property="og:description" content="İçeriğinizi tam olarak açıklayan, kullanıcıların ilgisini çekecek bir açıklama. En az 50 karakter kullanın.">', 
        explanation: 'Kısa açıklamalar, içeriğinizi yeterince tanımlamaz ve tıklanma oranını düşürebilir. İdeal açıklama uzunluğu 100-200 karakter arasındadır.', 
        reference: 'https://ahrefs.com/blog/open-graph-meta-tags/', 
        category: 'Social SEO' 
      });
    } else if (ogDescription.length > 300) {
      issues.push({ 
        type: 'info', 
        field: 'og:description', 
        message: 'Open Graph açıklama etiketi çok uzun.', 
        suggestion: 'Açıklama 100-200 karakter arasında olmalıdır.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<meta property="og:description" content="Sayfanızın kısa ve öz bir açıklaması.">', 
        explanation: 'Çok uzun açıklamalar sosyal medya platformlarında kırpılacaktır. Facebook genellikle 200 karakter civarında kırpar. Mesajınızın tam olarak görüntülenmesi için açıklamayı kısaltın.', 
        reference: 'https://ahrefs.com/blog/open-graph-meta-tags/', 
        category: 'Social SEO' 
      });
    }
    
    // Check consistency with meta description
    if (metaDescription && ogDescription !== metaDescription) {
      issues.push({ 
        type: 'info', 
        field: 'og:description', 
        message: 'Open Graph açıklaması ile meta açıklaması aynı değil.', 
        suggestion: 'Tutarlılık için aynı açıklama kullanmayı değerlendirin veya sosyal medya için özelleştirilmiş bir açıklama kullanın.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<meta property="og:description" content="Meta açıklaması ile aynı veya sosyal medya için optimize edilmiş açıklama">', 
        explanation: 'Farklı açıklamalar mutlaka bir sorun değildir - sosyal medya için daha cazip bir açıklama kullanmak isteyebilirsiniz. Ancak genellikle tutarlılık kullanıcı deneyimi için faydalıdır. Eğer farklı açıklama kullanıyorsanız, sosyal medyaya özgü amaçlı olduğundan emin olun.', 
        reference: 'https://developers.facebook.com/docs/sharing/webmasters/', 
        category: 'Social SEO' 
      });
    }
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'og:description', 
      message: 'Open Graph açıklama etiketi eksik.', 
      suggestion: 'Sosyal medya paylaşımları için og:description etiketi ekleyin.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<meta property="og:description" content="Sitenizin veya sayfanızın kısa açıklaması">', 
      explanation: 'og:description etiketi, içeriğiniz sosyal medyada paylaşıldığında görünecek açıklamayı belirler. Bu etiket olmadan, sosyal platformlar içerikten bir açıklama çıkarmaya çalışacak ve bu genellikle ideal olmayan sonuçlar doğurur.', 
      reference: 'https://ogp.me/', 
      category: 'Social SEO' 
    });
  }
  
  // Check og:image
  if (ogImage) {
    successes.push({ 
      field: 'og:image', 
      message: 'Open Graph görsel etiketi mevcut.', 
      impact: 'positive' 
    });
    
    // Check if image URL is absolute
    if (!ogImage.startsWith('http://') && !ogImage.startsWith('https://')) {
      issues.push({ 
        type: 'warning', 
        field: 'og:image', 
        message: 'Open Graph görsel URL\'si göreceli bir yol kullanıyor.', 
        suggestion: 'Mutlak URL kullanın (https://yoursite.com/image.jpg gibi).', 
        impact: 'high', 
        difficulty: 'kolay', 
        example: '<meta property="og:image" content="https://site.com/images/og-image.jpg">', 
        explanation: 'Sosyal medya platformları göreceli URL\'leri çözemez. og:image etiketi mutlaka tam URL içermelidir, aksi takdirde görsel görüntülenmeyecektir.', 
        reference: 'https://developers.facebook.com/docs/sharing/webmasters/images/', 
        category: 'Social SEO' 
      });
    }
    
    // Check for image dimensions tags
    const hasImageWidth = $('meta[property="og:image:width"]').length > 0;
    const hasImageHeight = $('meta[property="og:image:height"]').length > 0;
    
    if (!hasImageWidth || !hasImageHeight) {
      issues.push({ 
        type: 'info', 
        field: 'og:image', 
        message: 'Open Graph görsel boyut etiketleri eksik.', 
        suggestion: 'Görselin boyutlarını belirten og:image:width ve og:image:height etiketlerini ekleyin.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">', 
        explanation: 'Görsel boyut etiketleri, sosyal medya platformlarının görseli daha hızlı işlemesine yardımcı olur ve görüntüleme sorunlarını önler. Facebook için ideal görsel boyutları 1200x630 pikseldir.', 
        reference: 'https://developers.facebook.com/docs/sharing/webmasters/images/', 
        category: 'Social SEO' 
      });
    }
    
    // Check for additional og:image:alt tag
    if ($('meta[property="og:image:alt"]').length === 0) {
      issues.push({ 
        type: 'info', 
        field: 'og:image', 
        message: 'Open Graph görsel alt etiketi eksik.', 
        suggestion: 'Erişilebilirlik için og:image:alt etiketi ekleyin.', 
        impact: 'low', 
        difficulty: 'kolay',
        example: '<meta property="og:image:alt" content="Görselin kısa açıklaması">',
        explanation: 'og:image:alt etiketi, görsel yüklenemediğinde veya ekran okuyucu kullanan kişiler için alternatif metin sağlar. Bu, erişilebilirliği artırır ve bazı platformlarda SEO\'ya katkıda bulunabilir.',
        reference: 'https://ogp.me/#structured',
        category: 'Social SEO'
      });
    }
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'og:image', 
      message: 'Open Graph görsel etiketi eksik.', 
      suggestion: 'Sosyal medya paylaşımları için og:image etiketi ekleyin.', 
      impact: 'high', 
      difficulty: 'orta', 
      example: '<meta property="og:image" content="https://site.com/images/og-image.jpg">', 
      explanation: 'Görseller, sosyal medya paylaşımlarında dikkat çekmek için kritik öneme sahiptir. og:image etiketi olmadan, içeriğiniz paylaşıldığında çekici bir görsel gösterilmeyecek ve tıklama oranları önemli ölçüde düşecektir. Facebook için ideal görsel boyutları 1200x630 pikseldir.', 
      reference: 'https://developers.facebook.com/docs/sharing/webmasters/images/', 
      category: 'Social SEO' 
    });
  }
  
  // Check og:url
  if (ogUrl) {
    successes.push({ 
      field: 'og:url', 
      message: 'Open Graph URL etiketi mevcut.', 
      impact: 'positive' 
    });
    
    // Check if URL is valid
    try {
      new URL(ogUrl);
      
      // Check for HTTP instead of HTTPS
      if (ogUrl.startsWith('http://')) {
        issues.push({ 
          type: 'info', 
          field: 'og:url', 
          message: 'Open Graph URL HTTP protokolü kullanıyor.', 
          suggestion: 'HTTPS kullanın.', 
          impact: 'low', 
          difficulty: 'kolay', 
          example: '<meta property="og:url" content="https://site.com/sayfa">', 
          explanation: 'Güvenlik ve SEO açısından HTTPS kullanmak önerilir. Bazı platformlar, HTTPS olmayan içerikleri paylaşırken uyarı gösterebilir.', 
          reference: 'https://developers.google.com/search/docs/advanced/security/https', 
          category: 'Social SEO' 
        });
      }
      
    } catch (e) {
      issues.push({ 
        type: 'warning', 
        field: 'og:url', 
        message: 'Open Graph URL\'si geçerli bir URL değil.', 
        suggestion: 'Geçerli, tam bir URL kullanın.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<meta property="og:url" content="https://site.com/sayfa">', 
        explanation: 'og:url etiketi, içeriğinizin kanonik URL\'sini belirtir. Geçersiz bir URL, sosyal platformların içeriğinizi doğru şekilde tanımlayamamasına neden olabilir.', 
        reference: 'https://ogp.me/', 
        category: 'Social SEO' 
      });
    }
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'og:url', 
      message: 'Open Graph URL etiketi eksik.', 
      suggestion: 'Sosyal medya paylaşımları için og:url etiketi ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<meta property="og:url" content="https://site.com/sayfa">', 
      explanation: 'og:url etiketi, içeriğinizin kanonik URL\'sini belirtir. Bu etiket olmadan, aynı içerik farklı URL\'lerden paylaşıldığında sosyal platformlar bunları farklı içerik olarak görebilir ve engagement metriklerini bölebilir.', 
      reference: 'https://ogp.me/', 
      category: 'Social SEO' 
    });
  }
  
  // Check og:type
  if (ogType) {
    successes.push({ 
      field: 'og:type', 
      message: 'Open Graph tür etiketi mevcut.', 
      impact: 'positive' 
    });
    
    // Check if type is a standard value
    const standardTypes = ['website', 'article', 'blog', 'book', 'profile', 'product', 'music', 'video'];
    if (!standardTypes.includes(ogType)) {
      issues.push({ 
        type: 'info', 
        field: 'og:type', 
        message: `Open Graph türü standart değil: "${ogType}"`, 
        suggestion: 'Yaygın kullanılan türlerden birini kullanmayı değerlendirin.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<meta property="og:type" content="website"> veya <meta property="og:type" content="article">', 
        explanation: 'Standart ol:type değerleri, sosyal platformların içeriğinizi daha iyi anlamasına yardımcı olur. En yaygın türler: website (çoğu sayfa için), article (blog yazıları ve haberler için), product (ürün sayfaları için).', 
        reference: 'https://ogp.me/#types', 
        category: 'Social SEO' 
      });
    }
    
    // If type is article, check for article-specific tags
    if (ogType === 'article') {
      const articlePublishedTime = $('meta[property="article:published_time"]').attr('content') || '';
      const articleAuthor = $('meta[property="article:author"]').attr('content') || '';
      
      if (!articlePublishedTime) {
        issues.push({ 
          type: 'info', 
          field: 'og:type', 
          message: 'Makale türü için article:published_time etiketi eksik.', 
          suggestion: 'Makale yayınlanma tarihini ekleyin.', 
          impact: 'low', 
          difficulty: 'kolay', 
          example: '<meta property="article:published_time" content="2023-06-15T08:30:00+00:00">', 
          explanation: 'article:published_time etiketi, makalenizin yayınlanma tarihini belirtir. Bu, sosyal platformların ve arama motorlarının içeriğinizin ne zaman yayınlandığını anlamasına yardımcı olur.', 
          reference: 'https://ogp.me/#type_article', 
          category: 'Social SEO' 
        });
      }
      
      if (!articleAuthor) {
        issues.push({ 
          type: 'info', 
          field: 'og:type', 
          message: 'Makale türü için article:author etiketi eksik.', 
          suggestion: 'Makale yazarını ekleyin.', 
          impact: 'low', 
          difficulty: 'kolay', 
          example: '<meta property="article:author" content="https://example.com/yazarlar/yazar-ismi">', 
          explanation: 'article:author etiketi, makalenizin yazarını belirtir. Bu, içeriğin yazarı hakkında ek bilgi sağlar ve bazı platformlarda yazarın profil bilgilerinin görüntülenmesine yardımcı olabilir.', 
          reference: 'https://ogp.me/#type_article', 
          category: 'Social SEO' 
        });
      }
    }
    
    // If type is product, check for product-specific tags
    if (ogType === 'product') {
      const productPrice = $('meta[property="product:price:amount"]').attr('content') || '';
      const productCurrency = $('meta[property="product:price:currency"]').attr('content') || '';
      
      if (!productPrice || !productCurrency) {
        issues.push({ 
          type: 'info', 
          field: 'og:type', 
          message: 'Ürün türü için fiyat etiketleri eksik.', 
          suggestion: 'Ürün fiyatı ve para birimi etiketlerini ekleyin.', 
          impact: 'medium', 
          difficulty: 'kolay', 
          example: '<meta property="product:price:amount" content="149.99">\n<meta property="product:price:currency" content="TRY">', 
          explanation: 'Ürün fiyat etiketleri, sosyal platformların ürününüzün fiyatını doğru şekilde göstermesine olanak tanır. Bu, kullanıcıların tıklamadan önce fiyat bilgisini görmesini sağlar ve dönüşüm oranlarını iyileştirebilir.', 
          reference: 'https://developers.facebook.com/docs/marketing-api/catalog/reference', 
          category: 'Social SEO' 
        });
      }
    }
  } else {
    issues.push({ 
      type: 'info', 
      field: 'og:type', 
      message: 'Open Graph tür etiketi eksik.', 
      suggestion: 'Sayfa türünüzü belirten og:type etiketi ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<meta property="og:type" content="website"> veya <meta property="og:type" content="article">', 
      explanation: 'og:type etiketi, içeriğinizin türünü belirtir. Bu etiket, sosyal platformların içeriğinizi doğru şekilde kategorize etmesine yardımcı olur. Genel sayfalar için "website", blog yazıları için "article", ürün sayfaları için "product" kullanın.', 
      reference: 'https://ogp.me/', 
      category: 'Social SEO' 
    });
  }
  
  // Check og:site_name
  if (!ogSiteName) {
    issues.push({ 
      type: 'info', 
      field: 'og:site_name', 
      message: 'Open Graph site adı etiketi eksik.', 
      suggestion: 'Site adınızı belirten og:site_name etiketi ekleyin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<meta property="og:site_name" content="Sitenizin Adı">', 
      explanation: 'og:site_name etiketi, içeriğin hangi siteye ait olduğunu belirtir. Bu, sosyal platformlarda paylaşımlarınızın marka kimliğinizle ilişkilendirilmesine yardımcı olur.', 
      reference: 'https://ogp.me/', 
      category: 'Social SEO' 
    });
  } else {
    successes.push({ 
      field: 'og:site_name', 
      message: 'Open Graph site adı etiketi mevcut.', 
      impact: 'positive' 
    });
  }
  
  // Check Twitter Card tags
  if (twitterCard) {
    successes.push({ 
      field: 'twitter:card', 
      message: 'Twitter Card etiketi mevcut.', 
      impact: 'positive' 
    });
    
    // Check if card type is valid
    const validCardTypes = ['summary', 'summary_large_image', 'app', 'player'];
    if (!validCardTypes.includes(twitterCard)) {
      issues.push({ 
        type: 'warning', 
        field: 'twitter:card', 
        message: `Geçersiz Twitter Card türü: "${twitterCard}"`, 
        suggestion: 'Geçerli bir Twitter Card türü kullanın.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<meta name="twitter:card" content="summary_large_image">', 
        explanation: 'Geçerli Twitter Card türleri: summary (standart kart), summary_large_image (büyük resimli kart), app (uygulama kartı), player (medya oynatıcı kartı). Geçersiz bir tür kullanıldığında, Twitter içeriğinizi doğru şekilde göstermeyebilir.', 
        reference: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards', 
        category: 'Social SEO' 
      });
    }
    
    // Check for required Twitter Card tags based on card type
    if (twitterCard === 'summary' || twitterCard === 'summary_large_image') {
      if (!twitterTitle && !ogTitle) {
        issues.push({ 
          type: 'warning', 
          field: 'twitter:title', 
          message: 'Twitter başlık etiketi ve og:title etiketi eksik.', 
          suggestion: 'Twitter paylaşımları için twitter:title veya og:title etiketi ekleyin.', 
          impact: 'high', 
          difficulty: 'kolay', 
          example: '<meta name="twitter:title" content="Sayfanızın Başlığı">', 
          explanation: 'Twitter, twitter:title etiketi yoksa og:title etiketini kullanmaya çalışır. Hiçbiri yoksa, Twitter paylaşımınız eksik veya yanlış bilgilerle görüntülenebilir.', 
          reference: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup', 
          category: 'Social SEO' 
        });
      }
      
      if (!twitterDescription && !ogDescription) {
        issues.push({ 
          type: 'warning', 
          field: 'twitter:description', 
          message: 'Twitter açıklama etiketi ve og:description etiketi eksik.', 
          suggestion: 'Twitter paylaşımları için twitter:description veya og:description etiketi ekleyin.', 
          impact: 'high', 
          difficulty: 'kolay', 
          example: '<meta name="twitter:description" content="Sayfanızın kısa açıklaması">', 
          explanation: 'Twitter, twitter:description etiketi yoksa og:description etiketini kullanmaya çalışır. Hiçbiri yoksa, Twitter paylaşımınız eksik veya yanlış bilgilerle görüntülenebilir.', 
          reference: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup', 
          category: 'Social SEO' 
        });
      }
      
      if (!twitterImage && !ogImage) {
        issues.push({ 
          type: 'warning', 
          field: 'twitter:image', 
          message: 'Twitter görsel etiketi ve og:image etiketi eksik.', 
          suggestion: 'Twitter paylaşımları için twitter:image veya og:image etiketi ekleyin.', 
          impact: 'high', 
          difficulty: 'orta', 
          example: '<meta name="twitter:image" content="https://site.com/images/twitter-image.jpg">', 
          explanation: 'Twitter, twitter:image etiketi yoksa og:image etiketini kullanmaya çalışır. Hiçbiri yoksa, Twitter paylaşımınız görselsiz görüntülenecek ve bu tıklama oranlarını önemli ölçüde düşürebilir. Twitter için önerilen görsel boyutları: summary_large_image için 1200x628 piksel, summary için 600x600 piksel.', 
          reference: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/summary-card-with-large-image', 
          category: 'Social SEO' 
        });
      }
    }
  } else {
    issues.push({ 
      type: 'info', 
      field: 'twitter:card', 
      message: 'Twitter Card etiketi eksik.', 
      suggestion: 'Twitter paylaşımları için twitter:card etiketi ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<meta name="twitter:card" content="summary_large_image">', 
      explanation: 'Twitter Card etiketleri, içeriğiniz Twitter\'da paylaşıldığında zengin önizlemeler oluşturmanıza olanak tanır. Twitter genellikle Open Graph etiketlerini kullanabilir, ancak Twitter Card etiketleri daha fazla kontrol ve özelleştirme sağlar.', 
      reference: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards', 
      category: 'Social SEO' 
    });
  }
  
  // Overall summary
  if (presentEssentialTags >= 3) {
    if (presentEssentialTags === essentialTags.length) {
      successes.push({ 
        field: 'og', 
        message: 'Open Graph etiketleri tam ve doğru şekilde yapılandırılmış.', 
        impact: 'high positive' 
      });
    } else {
      successes.push({ 
        field: 'og', 
        message: `Open Graph etiketlerinin çoğu mevcut (${presentEssentialTags}/${essentialTags.length}).`, 
        impact: 'medium positive' 
      });
    }
  }
  
  return { issues, successes };
}

function analyzeViewport($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  const viewportTag = $('meta[name="viewport"]');
  const viewport = viewportTag.attr('content') ?? '';
  // Check if viewport meta tag exists
  if (!viewport) {
    issues.push({ 
      type: 'error', 
      field: 'viewport', 
      message: 'Viewport meta etiketi eksik.', 
      suggestion: 'Mobil uyumluluk için viewport meta etiketi ekleyin.', 
      impact: 'critical', 
      difficulty: 'kolay', 
      example: '<meta name="viewport" content="width=device-width, initial-scale=1">', 
      explanation: 'Viewport meta etiketi, sitenizin mobil cihazlarda nasıl görüntüleneceğini kontrol eder. Bu etiket olmadan, mobil tarayıcılar sayfanızı masaüstü genişliğinde gösterir ve bu da kullanıcıların yakınlaştırma yapmasını gerektirir. Google ve diğer arama motorları, mobil uyumlu olmayan siteleri mobil arama sonuçlarında daha alt sıralara yerleştirebilir.', 
      reference: 'https://developers.google.com/search/docs/appearance/mobile-sites', 
      category: 'Mobile SEO' 
    });
    return { issues, successes };
  }
  
  // Basic success for having a viewport tag
  successes.push({ 
    field: 'viewport', 
    message: 'Viewport meta etiketi mevcut.', 
    impact: 'positive' 
  });
  
  // Parse viewport parameters into a map
  const viewportParams: Record<string, string> = {};
  viewport.split(',').forEach(param => {
    const [key, value] = param.trim().split('=');
    if (key && value) {
      viewportParams[key.trim()] = value.trim();
    }
  });
  
  // Check for width parameter
  if (!viewportParams.width) {
    issues.push({ 
      type: 'error', 
      field: 'viewport', 
      message: 'Viewport width parametresi eksik.', 
      suggestion: 'width=device-width parametresi ekleyin.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<meta name="viewport" content="width=device-width, initial-scale=1">', 
      explanation: 'width parametresi, sayfanın görünüm alanının genişliğini kontrol eder. Responsive tasarım için "width=device-width" değeri, sayfanın cihaz ekranının genişliğine uyum sağlamasını sağlar.', 
      reference: 'https://developers.google.com/search/docs/appearance/mobile-sites', 
      category: 'Mobile SEO' 
    });
  } else if (viewportParams.width !== 'device-width') {
    // Check if width is a specific pixel value instead of device-width
    if (/^\d+$/.test(viewportParams.width)) {
      issues.push({ 
        type: 'warning', 
        field: 'viewport', 
        message: `Viewport width sabit bir değere (${viewportParams.width}px) ayarlanmış.`, 
        suggestion: 'Responsive tasarım için width=device-width kullanın.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '<meta name="viewport" content="width=device-width, initial-scale=1">', 
        explanation: 'Sabit genişlik değeri, sayfanızın farklı cihazlarda uyum sağlayamamasına neden olabilir. "width=device-width" kullanmak, sayfanızın cihazın ekran genişliğine göre otomatik olarak ölçeklenmesini sağlar ve responsive tasarımın temelidir.', 
        reference: 'https://developers.google.com/search/docs/appearance/mobile-sites', 
        category: 'Mobile SEO' 
      });
    } else if (viewportParams.width !== 'device-width') {
      issues.push({ 
        type: 'warning', 
        field: 'viewport', 
        message: `Viewport width değeri standart değil: "${viewportParams.width}"`, 
        suggestion: 'Responsive tasarım için width=device-width kullanın.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<meta name="viewport" content="width=device-width, initial-scale=1">', 
        explanation: 'Standart olmayan width değerleri beklenmedik görüntüleme sorunlarına neden olabilir. "width=device-width" kullanmak en yaygın ve önerilen yaklaşımdır.', 
        reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag', 
        category: 'Mobile SEO' 
      });
    }
  } else {
    successes.push({ 
      field: 'viewport-width', 
      message: 'Viewport width parametresi doğru yapılandırılmış (device-width).', 
      impact: 'positive' 
    });
  }
  
  // Check for initial-scale parameter
  if (!viewportParams['initial-scale']) {
    issues.push({ 
      type: 'warning', 
      field: 'viewport', 
      message: 'Viewport initial-scale parametresi eksik.', 
      suggestion: 'initial-scale=1 parametresi ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<meta name="viewport" content="width=device-width, initial-scale=1">', 
      explanation: 'initial-scale parametresi, sayfa ilk yüklendiğinde zoom seviyesini belirler. "initial-scale=1" değeri, sayfanın %100 zoom ile görüntülenmesini sağlar ve responsive tasarım için genellikle en iyi seçenektir.', 
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag', 
      category: 'Mobile SEO' 
    });
  } else {
    const initialScale = parseFloat(viewportParams['initial-scale']);
    
    if (isNaN(initialScale)) {
      issues.push({ 
        type: 'warning', 
        field: 'viewport', 
        message: 'Viewport initial-scale değeri geçerli bir sayı değil.', 
        suggestion: 'initial-scale=1 kullanın.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<meta name="viewport" content="width=device-width, initial-scale=1">', 
        explanation: 'initial-scale parametresi sayısal bir değer olmalıdır. Geçersiz değerler tarayıcılar tarafından göz ardı edilebilir ve beklenmeyen davranışlara neden olabilir.', 
        reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag', 
        category: 'Mobile SEO' 
      });
    } else if (initialScale !== 1) {
      issues.push({ 
        type: 'info', 
        field: 'viewport', 
        message: `Viewport initial-scale değeri standart değerden (1) farklı: ${initialScale}`, 
        suggestion: 'Çoğu durumda initial-scale=1 kullanılması önerilir.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<meta name="viewport" content="width=device-width, initial-scale=1">', 
        explanation: 'initial-scale=1 değeri genellikle en iyi kullanıcı deneyimini sağlar. Farklı bir değer kullanmak için özel bir nedeniniz yoksa, standart değeri kullanmanız önerilir.', 
        reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag', 
        category: 'Mobile SEO' 
      });
    } else {
      successes.push({ 
        field: 'viewport-scale', 
        message: 'Viewport initial-scale parametresi doğru yapılandırılmış (1).', 
        impact: 'positive' 
      });
    }
  }
  
  // Check for user-scalable parameter (accessibility concern)
  if (viewportParams['user-scalable'] === 'no' || viewportParams['user-scalable'] === '0') {
    issues.push({ 
      type: 'warning', 
      field: 'viewport', 
      message: 'Viewport user-scalable=no kullanılmış - bu erişilebilirlik sorunlarına neden olabilir.', 
      suggestion: 'Kullanıcıların sayfayı yakınlaştırabilmesi için bu parametreyi kaldırın.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<meta name="viewport" content="width=device-width, initial-scale=1">', 
      explanation: 'user-scalable=no, kullanıcıların sayfayı yakınlaştırmasını/uzaklaştırmasını engeller. Bu, görme engelli kullanıcılar için erişilebilirlik sorunları yaratır ve WCAG uyumluluğunu etkileyebilir. Ayrıca, bazı mobil tarayıcılar (özellikle iOS Safari) artık bu ayarı göz ardı edebilir.', 
      reference: 'https://dequeuniversity.com/rules/axe/4.4/meta-viewport', 
      category: 'Accessibility' 
    });
  }
  
  // Check for minimum-scale parameter (accessibility concern)
  if (viewportParams['minimum-scale']) {
    const minScale = parseFloat(viewportParams['minimum-scale']);
    if (!isNaN(minScale) && minScale > 0.5) {
      issues.push({ 
        type: 'info', 
        field: 'viewport', 
        message: `Viewport minimum-scale değeri (${minScale}) 0.5'ten büyük - bu erişilebilirlik sorunlarına neden olabilir.`, 
        suggestion: 'Kullanıcıların yeterince uzaklaştırabilmesi için minimum-scale=0.5 veya daha düşük bir değer kullanın.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=0.5">', 
        explanation: 'Yüksek bir minimum-scale değeri, kullanıcıların sayfayı yeterince uzaklaştırmasını engelleyebilir. Bu, sayfa düzenini bir bütün olarak görmek isteyen kullanıcılar için sorun yaratabilir.', 
        reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag', 
        category: 'Accessibility' 
      });
    }
  }
  
  // Check for maximum-scale parameter (accessibility concern)
  if (viewportParams['maximum-scale']) {
    const maxScale = parseFloat(viewportParams['maximum-scale']);
    if (!isNaN(maxScale) && maxScale < 3) {
      issues.push({ 
        type: 'warning', 
        field: 'viewport', 
        message: `Viewport maximum-scale değeri (${maxScale}) çok düşük - bu erişilebilirlik sorunlarına neden olabilir.`, 
        suggestion: 'Kullanıcıların yeterince yakınlaştırabilmesi için maximum-scale=3 veya daha yüksek bir değer kullanın ya da bu parametreyi tamamen kaldırın.', 
        impact: 'high', 
        difficulty: 'kolay', 
        example: '<meta name="viewport" content="width=device-width, initial-scale=1">', 
        explanation: 'Düşük bir maximum-scale değeri, görme engelli kullanıcıların metni okuyabilmek için sayfayı yeterince yakınlaştırmasını engelleyebilir. WCAG 2.1 AA uyumluluğu için, sayfanızın en az %200 yakınlaştırılabilir olması gerekir.', 
        reference: 'https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html', 
        category: 'Accessibility' 
      });
    }
  }
  
  // iOS cihazlar için shrink-to-fit parametresi kontrolü
  if (
    typeof navigator !== 'undefined' &&
    navigator &&
    typeof navigator.userAgent === 'string' &&
    !viewportParams['shrink-to-fit'] &&
    /iPhone|iPad|iPod/.test(navigator.userAgent)
  ) {
    issues.push({ 
      type: 'info', 
      field: 'viewport', 
      message: 'iOS cihazlar için shrink-to-fit=no parametresi eksik.', 
      suggestion: 'iOS için ekstra uyumluluk sağlamak için shrink-to-fit=no ekleyin.', 
      impact: 'low', 
      difficulty: 'kolay',
      example: '<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">',
      explanation: 'shrink-to-fit=no parametresi, Safari tarayıcısında görüntüleme sorunlarını önlemeye yardımcı olur. Bu parametre, içeriğin viewport\'tan taşması durumunda otomatik olarak küçültülmesini engeller.',
      reference: 'https://webkit.org/blog/7929/designing-websites-for-iphone-x/',
      category: 'Mobile SEO'
    });
  }

  // Çentikli cihazlar (iPhone X ve sonrası) için viewport-fit parametresi kontrolü
  if (
    typeof navigator !== 'undefined' &&
    navigator &&
    typeof navigator.userAgent === 'string' &&
    !viewportParams['viewport-fit'] &&
    /iPhone|iPad|iPod/.test(navigator.userAgent)
  ) {
    issues.push({ 
      type: 'info', 
      field: 'viewport', 
      message: 'Çentikli cihazlar için viewport-fit parametresi eksik.', 
      suggestion: 'iPhone X ve sonrası için viewport-fit=cover ekleyin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">', 
      explanation: 'viewport-fit=cover parametresi, çentikli ekranlara sahip cihazlarda (örn. iPhone X ve sonrası) ekranın tamamını kullanmanızı sağlar. Bu, tam ekran kullanıcı deneyimi için önemlidir.', 
      reference: 'https://webkit.org/blog/7929/designing-websites-for-iphone-x/', 
      category: 'Mobile SEO' 
    });
  }
   {
    issues.push({ 
      type: 'info', 
      field: 'viewport', 
      message: 'Çentikli cihazlar için viewport-fit parametresi eksik.', 
      suggestion: 'iPhone X ve sonrası için viewport-fit=cover ekleyin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">', 
      explanation: 'viewport-fit=cover parametresi, çentikli ekranlara sahip cihazlarda (örn. iPhone X ve sonrası) ekranın tamamını kullanmanızı sağlar. Bu, tam ekran kullanıcı deneyimi için önemlidir.', 
      reference: 'https://webkit.org/blog/7929/designing-websites-for-iphone-x/', 
      category: 'Mobile SEO' 
    });
  }
  
  // Check for deprecated/unnecessary parameters
  const deprecatedParams = ['target-densitydpi', 'minimal-ui'];
  for (const param of deprecatedParams) {
    if (param in viewportParams) {
      issues.push({ 
        type: 'info', 
        field: 'viewport', 
        message: `"${param}" artık kullanılmayan bir viewport parametresi.`, 
        suggestion: `${param} parametresini kaldırın.`, 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<meta name="viewport" content="width=device-width, initial-scale=1">', 
        explanation: `"${param}" parametresi artık desteklenmiyor veya önerilmiyor. Modern tarayıcılarda bir etkisi olmayabilir ve viewport meta etiketinizi gereksiz yere şişirebilir.`, 
        reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag', 
        category: 'Mobile SEO' 
      });
    }
  }
  
  // Check for unknown parameters
  const knownParams = [
    'width', 'height', 'initial-scale', 'minimum-scale', 
    'maximum-scale', 'user-scalable', 'viewport-fit', 
    'shrink-to-fit', 'target-densitydpi', 'minimal-ui'
  ];
  
  for (const param in viewportParams) {
    if (!knownParams.includes(param)) {
      issues.push({ 
        type: 'info', 
        field: 'viewport', 
        message: `"${param}" bilinmeyen bir viewport parametresi.`, 
        suggestion: `Bilinmeyen "${param}" parametresini kaldırın.`, 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<meta name="viewport" content="width=device-width, initial-scale=1">', 
        explanation: `"${param}" standart bir viewport parametresi değil ve tarayıcılar tarafından göz ardı edilebilir. Standart parametrelerle sınırlı kalmanız önerilir.`, 
        reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag', 
        category: 'Mobile SEO' 
      });
    }
  }
  
  // Check for optimal configuration
  const hasOptimalConfig = 
    viewportParams.width === 'device-width' && 
    viewportParams['initial-scale'] === '1' && 
    !viewportParams['user-scalable'] && 
    !viewportParams['maximum-scale'];
  
  if (hasOptimalConfig) {
    successes.push({ 
      field: 'viewport-optimal', 
      message: 'Viewport meta etiketi, mobil uyumluluk ve erişilebilirlik için ideal yapılandırmaya sahip.', 
      impact: 'high positive' 
    });
  }
  
  // Check if the viewport meta tag has the recommended basic configuration
  const hasBasicConfig = 
    viewportParams.width === 'device-width' && 
    viewportParams['initial-scale'] && 
    parseFloat(viewportParams['initial-scale']) === 1;
  
  if (hasBasicConfig && !hasOptimalConfig) {
    successes.push({ 
      field: 'viewport-basic', 
      message: 'Viewport meta etiketi temel mobil uyumluluk gereksinimlerini karşılıyor.', 
      impact: 'medium positive' 
    });
  }
  
  return { issues, successes };
}

function analyzeFavicon($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Check for various favicon types
  const standardFavicon = $('link[rel="icon"], link[rel="shortcut icon"]');
  const appleTouchIcon = $('link[rel~="apple-touch-icon"]');
  const maskIcon = $('link[rel="mask-icon"]');
  const androidIcon = $('link[rel="manifest"]');
  const msTileIcon = $('meta[name="msapplication-TileImage"]');
  
  // Check for web app manifest
  const webManifest = $('link[rel="manifest"]');
  
  // Count total favicon types present
  let faviconTypesCount = 0;
  if (standardFavicon.length) faviconTypesCount++;
  if (appleTouchIcon.length) faviconTypesCount++;
  if (maskIcon.length) faviconTypesCount++;
  if (androidIcon.length) faviconTypesCount++;
  if (msTileIcon.length) faviconTypesCount++;
  
  // Check standard favicon
  if (standardFavicon.length) {
    // Get all standard favicons
    const favicons: {href: string, type?: string, sizes?: string}[] = [];
    standardFavicon.each((_, element) => {
      const favicon = $(element);
      favicons.push({
        href: favicon.attr('href') || '',
        type: favicon.attr('type') || '',
        sizes: favicon.attr('sizes') || ''
      });
    });
    
    // Check if any valid favicons exist
    const validFavicons = favicons.filter(f => {
      const href = f.href.toLowerCase();
      return href && (href.endsWith('.ico') || href.endsWith('.png') || href.endsWith('.svg'));
    });
    
    if (validFavicons.length) {
      successes.push({ 
        field: 'favicon', 
        message: 'Standart favicon mevcut.', 
        impact: 'positive' 
      });
      
      // Check if multiple sizes are provided
      const hasSizes = favicons.some(f => f.sizes);
      const hasSvg = favicons.some(f => f.href.toLowerCase().endsWith('.svg'));
      const hasMultipleSizes = favicons.filter(f => f.sizes).length > 1;
      
      if (!hasMultipleSizes && !hasSvg) {
        issues.push({ 
          type: 'info', 
          field: 'favicon', 
          message: 'Farklı boyutlarda favicon bulunamadı.', 
          suggestion: 'Farklı cihazlar için çeşitli favicon boyutları sağlayın.', 
          impact: 'medium', 
          difficulty: 'orta', 
          example: '<link rel="icon" href="favicon-16x16.png" sizes="16x16">\n<link rel="icon" href="favicon-32x32.png" sizes="32x32">\n<link rel="icon" href="favicon.svg" type="image/svg+xml">', 
          explanation: 'Farklı cihazlar ve tarayıcılar, farklı favicon boyutları gerektirir. En sık kullanılan boyutlar 16x16, 32x32 ve 48x48 pikseldir. Ayrıca SVG formatında bir favicon eklemek, tüm ekran boyutlarında keskin bir görüntü sağlar.', 
          reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types/icon', 
          category: 'Branding' 
        });
      }
      
      // Check for SVG favicon (recommended for modern browsers)
      if (!hasSvg) {
        issues.push({ 
          type: 'info', 
          field: 'favicon', 
          message: 'SVG formatında favicon bulunamadı.', 
          suggestion: 'Modern tarayıcılar için SVG formatında bir favicon ekleyin.', 
          impact: 'low', 
          difficulty: 'kolay', 
          example: '<link rel="icon" href="favicon.svg" type="image/svg+xml">', 
          explanation: 'SVG formatındaki faviconlar, hem yüksek çözünürlüklü ekranlarda keskin görüntü sağlar hem de tüm ekran boyutlarına otomatik olarak uyarlanabilir. Modern tarayıcılar SVG faviconları destekler ve PNG/ICO yerine SVG kullanmak, daha iyi görüntü kalitesi sağlar.', 
          reference: 'https://css-tricks.com/favicon-quiz/', 
          category: 'Branding' 
        });
      }
      
      // Check if favicon URLs are valid
      for (const favicon of favicons) {
        if (!favicon.href) continue;
        
        // Check if URL is relative without leading slash
        if (!favicon.href.startsWith('/') && !favicon.href.startsWith('http')) {
          issues.push({ 
            type: 'info', 
            field: 'favicon', 
            message: `"${favicon.href}" göreceli bir URL ve bazı sayfalarda çalışmayabilir.`, 
            suggestion: 'Root\'tan başlayan veya mutlak URL kullanın.', 
            impact: 'low', 
            difficulty: 'kolay', 
            example: '<link rel="icon" href="/favicon.ico">', 
            explanation: 'Göreceli URL\'ler, sitenizin farklı derinlikteki sayfalarında sorun çıkarabilir. Root\'tan başlayan bir yol (örn. "/favicon.ico") veya mutlak URL (örn. "https://site.com/favicon.ico") kullanmak, tüm sayfalarda doğru çalışmasını sağlar.', 
            reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link', 
            category: 'Branding' 
          });
        }
      }
    } else {
      issues.push({ 
        type: 'warning', 
        field: 'favicon', 
        message: 'Favicon etiketi var ancak geçerli bir dosya formatı belirtilmemiş.', 
        suggestion: 'Geçerli bir favicon formatı kullanın (.ico, .png veya .svg).', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<link rel="icon" href="favicon.ico">', 
        explanation: 'Tarayıcılar genellikle .ico, .png ve .svg formatlarındaki faviconları tanır. Geçerli bir dosya uzantısı olmayan favicon, tarayıcılar tarafından görmezden gelinebilir.', 
        reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link', 
        category: 'Branding' 
      });
    }
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'favicon', 
      message: 'Standart favicon bulunamadı.', 
      suggestion: 'Siteniz için bir favicon ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<link rel="icon" href="favicon.ico">\n<link rel="icon" href="favicon-32x32.png" sizes="32x32">\n<link rel="icon" href="favicon.svg" type="image/svg+xml">', 
      explanation: 'Favicon, sitenizin tarayıcı sekmesinde, yer imlerinde ve geçmiş listesinde görünen küçük bir ikondur. Marka kimliğinizi güçlendirir ve kullanıcıların sitenizi daha kolay tanımasını sağlar.', 
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link', 
      category: 'Branding' 
    });
    
    // Check if favicon might exist in root directory but not linked
    issues.push({ 
      type: 'info', 
      field: 'favicon', 
      message: 'Favicon bağlantısı belirtilmemiş, ancak kök dizinde "favicon.ico" bulunabilir.', 
      suggestion: 'Açıkça favicon bağlantısı belirtin veya kök dizinde "favicon.ico" dosyası olduğundan emin olun.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<link rel="icon" href="/favicon.ico">', 
      explanation: 'Bazı tarayıcılar, açıkça belirtilmese bile kök dizindeki "favicon.ico" dosyasını otomatik olarak arar. Ancak en iyi uygulama, favicon\'u HTML içinde açıkça belirtmektir.', 
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link', 
      category: 'Branding' 
    });
  }
  
  // Check Apple Touch Icon (for iOS devices)
  if (appleTouchIcon.length) {
    successes.push({ 
      field: 'apple-touch-icon', 
      message: 'Apple Touch Icon mevcut.', 
      impact: 'positive' 
    });
    
    // Check if sizes attribute is present
    const hasSizes = appleTouchIcon.toArray().some(el => $(el).attr('sizes'));
    
    if (!hasSizes) {
      issues.push({ 
        type: 'info', 
        field: 'favicon', 
        message: 'Apple Touch Icon boyut bilgisi içermiyor.', 
        suggestion: 'Apple cihazlar için boyut bilgisi ekleyin.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">', 
        explanation: 'Modern iOS cihazları genellikle 180x180 piksel boyutunda bir ikon bekler. Boyut belirtmek, cihazların doğru ikonu seçmesine yardımcı olur.', 
        reference: 'https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html', 
        category: 'Branding' 
      });
    }
  } else {
    issues.push({ 
      type: 'info', 
      field: 'favicon', 
      message: 'Apple Touch Icon eksik.', 
      suggestion: 'iOS cihazlar için Apple Touch Icon ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">', 
      explanation: 'Apple Touch Icon, iOS cihazlarda kullanıcılar sitenizi ana ekrana eklediğinde görünen ikondur. Bu özelliği eklememek, iOS kullanıcılarının ana ekranlarında sitenizin varsayılan ve genellikle daha az çekici bir görüntüye sahip olmasına neden olur.', 
      reference: 'https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html', 
      category: 'Branding' 
    });
  }
  
  // Check for Web App Manifest (for Android devices)
  if (webManifest.length) {
    successes.push({ 
      field: 'web-manifest', 
      message: 'Web App Manifest mevcut.', 
      impact: 'positive' 
    });
  } else {
    issues.push({ 
      type: 'info', 
      field: 'favicon', 
      message: 'Web App Manifest eksik.', 
      suggestion: 'Android cihazlar ve PWA desteği için manifest.json ekleyin.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<link rel="manifest" href="/manifest.json">', 
      explanation: 'Web App Manifest, Android cihazlarda sitenizin ana ekrana eklenmesi için gereklidir ve PWA (Progressive Web App) oluşturmak için kullanılır. Bu dosya, sitenizin görünümünü ve davranışını tanımlar ve farklı cihazlar için ikon boyutlarını içerir.', 
      reference: 'https://developer.mozilla.org/en-US/docs/Web/Manifest', 
      category: 'Branding' 
    });
  }
  
  // Check for Safari Pinned Tab Icon
  if (maskIcon.length) {
    successes.push({ 
      field: 'mask-icon', 
      message: 'Safari Pinned Tab Icon mevcut.', 
      impact: 'positive' 
    });
    
    // Check if color attribute is present
    const hasColor = maskIcon.attr('color');
    if (!hasColor) {
      issues.push({ 
        type: 'info', 
        field: 'favicon', 
        message: 'Safari Pinned Tab Icon renk bilgisi içermiyor.', 
        suggestion: 'mask-icon için renk bilgisi ekleyin.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">', 
        explanation: 'Safari\'de sabitlenmiş bir sekmenin rengini belirlemek için color özelliği kullanılır. Bu özellik olmadan, tarayıcı varsayılan bir renk kullanır.', 
        reference: 'https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/pinnedTabs/pinnedTabs.html', 
        category: 'Branding' 
      });
    }
  } else {
    issues.push({ 
      type: 'info', 
      field: 'favicon', 
      message: 'Safari Pinned Tab Icon eksik.', 
      suggestion: 'Safari\'de sabitlenmiş sekmeler için mask-icon ekleyin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">', 
      explanation: 'Safari\'de sabitlenmiş sekmelerde kullanılan mono renkli bir SVG ikondur. Bu, Safari kullanıcılarına daha iyi bir sekme deneyimi sağlar.', 
      reference: 'https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/pinnedTabs/pinnedTabs.html', 
      category: 'Branding' 
    });
  }
  
  // Check for Microsoft Tile Icon
  if (msTileIcon.length) {
    successes.push({ 
      field: 'ms-tile', 
      message: 'Microsoft Tile Icon mevcut.', 
      impact: 'positive' 
    });
    
    // Check if tile color is present
    const tileColor = $('meta[name="msapplication-TileColor"]').attr('content');
    if (!tileColor) {
      issues.push({ 
        type: 'info', 
        field: 'favicon', 
        message: 'Microsoft Tile renk bilgisi eksik.', 
        suggestion: 'msapplication-TileColor meta etiketi ekleyin.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<meta name="msapplication-TileColor" content="#2b5797">', 
        explanation: 'msapplication-TileColor meta etiketi, Windows cihazlarında sitenizin Live Tile arka plan rengini belirler. Bu, Windows kullanıcılarına daha tutarlı bir marka deneyimi sunar.', 
        reference: 'https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/dn255024(v=vs.85)', 
        category: 'Branding' 
      });
    }
  } else {
    issues.push({ 
      type: 'info', 
      field: 'favicon', 
      message: 'Microsoft Tile Icon eksik.', 
      suggestion: 'Windows cihazları için msapplication-TileImage meta etiketi ekleyin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<meta name="msapplication-TileImage" content="/mstile-144x144.png">\n<meta name="msapplication-TileColor" content="#2b5797">', 
      explanation: 'Microsoft Tile Icon, Windows cihazlarında başlat menüsünde ve görev çubuğunda siteniz için kullanılan ikondur. Genellikle 144x144 piksel boyutundadır.', 
      reference: 'https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/dn255024(v=vs.85)', 
      category: 'Branding' 
    });
  }
  
  // Check theme color for mobile browsers
  const themeColor = $('meta[name="theme-color"]').attr('content');
  if (!themeColor) {
    issues.push({ 
      type: 'info', 
      field: 'favicon', 
      message: 'Theme-color meta etiketi eksik.', 
      suggestion: 'Mobil tarayıcılarda adres çubuğu rengini belirlemek için theme-color ekleyin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<meta name="theme-color" content="#4285f4">', 
      explanation: 'Theme-color meta etiketi, mobil tarayıcılarda (özellikle Chrome ve Safari) adres çubuğunun rengini belirler. Bu, marka kimliğiniz ile uyumlu bir kullanıcı deneyimi sağlar.', 
      reference: 'https://developers.google.com/web/updates/2014/11/Support-for-theme-color-in-Chrome-39-for-Android', 
      category: 'Branding' 
    });
  } else {
    successes.push({ 
      field: 'theme-color', 
      message: 'Theme-color meta etiketi mevcut.', 
      impact: 'positive' 
    });
  }
  
  // Overall assessment
  if (faviconTypesCount >= 4) {
    successes.push({ 
      field: 'favicon-complete', 
      message: 'Kapsamlı favicon desteği sağlanmış.', 
      impact: 'high positive' 
    });
  } else if (faviconTypesCount >= 2) {
    successes.push({ 
      field: 'favicon-partial', 
      message: 'Temel favicon desteği sağlanmış, ancak bazı cihaz türleri için eksikler var.', 
      impact: 'medium positive' 
    });
  } else if (standardFavicon.length) {
    successes.push({ 
      field: 'favicon-basic', 
      message: 'Temel favicon desteği mevcut, ancak modern cihazlar için ek ikonlar gerekli.', 
      impact: 'low positive' 
    });
  }
  
  // Recommendation for favicon generators
  if (faviconTypesCount < 3) {
    issues.push({ 
      type: 'info', 
      field: 'favicon', 
      message: 'Favicon çeşitliliği artırılabilir.', 
      suggestion: 'Favicon üreteçleri kullanarak tüm cihaz türleri için ikonlar oluşturun.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: 'https://realfavicongenerator.net veya https://favicon.io gibi araçları kullanabilirsiniz.', 
      explanation: 'Favicon üreteçleri, tek bir yüksek çözünürlüklü görselden tüm cihaz türleri için ikonlar ve gerekli HTML kodunu otomatik olarak oluşturabilir. Bu, tüm modern cihaz ve tarayıcılar için kapsamlı ikon desteği sağlamanın en kolay yoludur.', 
      reference: 'https://css-tricks.com/favicon-quiz/', 
      category: 'Branding' 
    });
  }
  
  return { issues, successes };
}

function analyzeStructuredData($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Find all structured data implementations
  const jsonLdScripts = $('script[type="application/ld+json"]');
  const microdataElements = $('[itemscope]');
  const rdfa = $('[property^="og:"], [property^="article:"], [typeof]').length > 0;
  
  // Check if any structured data exists
  const hasJsonLd = jsonLdScripts.length > 0;
  const hasMicrodata = microdataElements.length > 0;
  const hasAnyStructuredData = hasJsonLd || hasMicrodata || rdfa;
  
  // Extract page information to provide context-aware recommendations
  const pageTitle = $('title').text();
  const h1Text = $('h1').first().text();
  const metaDescription = $('meta[name="description"]').attr('content');
  const isArticlePage = $('article').length > 0 || pageTitle.includes('Blog') || pageTitle.includes('Article') || pageTitle.includes('News');
  const isProductPage = pageTitle.includes('Product') || $('[class*="product"]').length > 0 || $('button:contains("Add to Cart")').length > 0;
  const isLocalBusiness = $('[class*="contact"], [class*="address"], [class*="location"]').length > 0 || $('iframe[src*="maps"]').length > 0;
  const hasFAQ = $('dt, .faq, [class*="faq"], h2:contains("FAQ"), h3:contains("FAQ")').length > 0;
  
  // If no structured data found
  if (!hasAnyStructuredData) {
    const suggestedTypes: string[] = [];
    if (isArticlePage) suggestedTypes.push('Article');
    if (isProductPage) suggestedTypes.push('Product');
    if (isLocalBusiness) suggestedTypes.push('LocalBusiness');
    if (hasFAQ) suggestedTypes.push('FAQPage');
    if (suggestedTypes.length === 0) suggestedTypes.push('WebSite', 'WebPage');
    
    const recommendedTypes = suggestedTypes.join(', ');
    
    let example = '';
    if (isArticlePage) {
      example = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${pageTitle || 'Makale Başlığı'}",
  "description": "${metaDescription || 'Makale açıklaması'}",
  "image": "https://example.com/article-image.jpg",
  "author": {
    "@type": "Person",
    "name": "Yazar Adı"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Yayıncı İsmi",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "datePublished": "2023-01-01T08:00:00+03:00",
  "dateModified": "2023-01-02T09:30:00+03:00"
}
</script>`;
    } else if (isProductPage) {
      example = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "${pageTitle || 'Ürün Adı'}",
  "description": "${metaDescription || 'Ürün açıklaması'}",
  "image": "https://example.com/product-image.jpg",
  "brand": {
    "@type": "Brand",
    "name": "Marka İsmi"
  },
  "offers": {
    "@type": "Offer",
    "price": "99.95",
    "priceCurrency": "TRY",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": "89"
  }
}
</script>`;
    }
    
    issues.push({ 
      type: 'warning', 
      field: 'structuredData', 
      message: 'Structured data bulunamadı.', 
      suggestion: `${recommendedTypes} için JSON-LD yapılandırılmış veri ekleyin.`, 
      impact: 'high', 
      difficulty: 'orta', 
      example: example || '<script type="application/ld+json">{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Sayfa Başlığı",\n  "description": "Sayfa açıklaması"\n}</script>', 
      explanation: 'Yapılandırılmış veriler (structured data), arama motorlarının içeriğinizi daha iyi anlamasını ve zengin sonuçlar (rich results) olarak göstermesini sağlar. Zengin sonuçlar, daha yüksek tıklanma oranları (CTR) ve daha fazla trafik anlamına gelir. JSON-LD formatı, Google\'ın önerdiği en temiz ve kolay yapılandırılmış veri uygulama yöntemidir.', 
      reference: 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data', 
      category: 'Structured Data' 
    });
    
    return { issues, successes };
  }
  
  let validSchemas = 0;
  let schemaTypes: string[] = [];
  
  // Analyze JSON-LD implementation
  if (hasJsonLd) {
    successes.push({ 
      field: 'structuredData', 
      message: `${jsonLdScripts.length} adet JSON-LD yapılandırılmış veri bloğu bulundu.`, 
      impact: 'positive' 
    });
    
    // Analyze each JSON-LD block
    jsonLdScripts.each((index, element) => {
      try {
        const jsonContent = $(element).html();
        if (!jsonContent) return;
        
        const jsonData = JSON.parse(jsonContent);
        
        // Check for @context
        if (!jsonData['@context'] || !jsonData['@context'].includes('schema.org')) {
          issues.push({ 
            type: 'warning', 
            field: 'structuredData', 
            message: `JSON-LD bloğunda (@context) eksik veya hatalı.`, 
            suggestion: 'JSON-LD bloğuna "@context": "https://schema.org" ekleyin.', 
            impact: 'high', 
            difficulty: 'kolay', 
            example: '{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  ...\n}', 
            explanation: '@context özelliği, yapılandırılmış verinin Schema.org standardını kullandığını belirtir ve arama motorları tarafından doğru şekilde yorumlanması için gereklidir.', 
            reference: 'https://schema.org/docs/jsonld.html', 
            category: 'Structured Data' 
          });
        }
        
        // Check for @type
        if (!jsonData['@type']) {
          issues.push({ 
            type: 'error', 
            field: 'structuredData', 
            message: 'JSON-LD bloğunda @type özelliği eksik.', 
            suggestion: 'JSON-LD bloğuna "@type" özelliği ekleyin.', 
            impact: 'critical', 
            difficulty: 'kolay', 
            example: '{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  ...\n}', 
            explanation: '@type özelliği, yapılandırılmış verinin hangi schema.org tipini kullandığını belirtir ve olmadan yapılandırılmış veri geçersizdir.', 
            reference: 'https://schema.org/docs/schemas.html', 
            category: 'Structured Data' 
          });
        } else {
          // Add to schema types list
          const schemaType = Array.isArray(jsonData['@type']) ? jsonData['@type'][0] : jsonData['@type'];
          schemaTypes.push(schemaType);
          validSchemas++;
          
          // Check for required properties based on schema type
          if (schemaType === 'Article' || schemaType === 'NewsArticle' || schemaType === 'BlogPosting') {
            const requiredProps = ['headline', 'author', 'datePublished'];
            const missingProps = requiredProps.filter(prop => !jsonData[prop]);
            
            if (missingProps.length > 0) {
              issues.push({ 
                type: 'warning', 
                field: 'structuredData', 
                message: `Article şemasında gerekli özellikler eksik: ${missingProps.join(', ')}.`, 
                suggestion: 'Tüm gerekli özellikleri ekleyin.', 
                impact: 'medium', 
                difficulty: 'orta', 
                example: '{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "Makale Başlığı",\n  "author": {\n    "@type": "Person",\n    "name": "Yazar Adı"\n  },\n  "datePublished": "2023-01-01T08:00:00+03:00"\n}', 
                explanation: 'Google\'ın zengin sonuçlar gösterimi için Article şemasında bazı özellikler gereklidir. Eksik özellikler, zengin sonuç gösterimini engelleyebilir veya sınırlayabilir.', 
                reference: 'https://developers.google.com/search/docs/appearance/structured-data/article', 
                category: 'Structured Data' 
              });
            }
            
            // Check image property format
            if (jsonData.image && typeof jsonData.image === 'string') {
              issues.push({ 
                type: 'info', 
                field: 'structuredData', 
                message: 'Article şemasında image özelliği basit bir URL olarak tanımlanmış.', 
                suggestion: 'Gelişmiş ImageObject yapısını kullanın.', 
                impact: 'low', 
                difficulty: 'kolay', 
                example: '{\n  "image": {\n    "@type": "ImageObject",\n    "url": "https://example.com/image.jpg",\n    "width": 800,\n    "height": 600\n  }\n}', 
                explanation: 'Görsel özelliklerini daha ayrıntılı tanımlamak, arama motorlarının görseli daha iyi anlamasını sağlar ve zengin sonuçların görünümünü iyileştirebilir.', 
                reference: 'https://developers.google.com/search/docs/appearance/structured-data/article#article-types', 
                category: 'Structured Data' 
              });
            }
          }
          
          if (schemaType === 'Product') {
            const requiredProps = ['name', 'offers'];
            const recommendedProps = ['image', 'description', 'brand'];
            const missingRequired = requiredProps.filter(prop => !jsonData[prop]);
            const missingRecommended = recommendedProps.filter(prop => !jsonData[prop]);
            
            if (missingRequired.length > 0) {
              issues.push({ 
                type: 'warning', 
                field: 'structuredData', 
                message: `Product şemasında gerekli özellikler eksik: ${missingRequired.join(', ')}.`, 
                suggestion: 'Tüm gerekli özellikleri ekleyin.', 
                impact: 'high', 
                difficulty: 'orta', 
                example: '{\n  "@context": "https://schema.org",\n  "@type": "Product",\n  "name": "Ürün Adı",\n  "offers": {\n    "@type": "Offer",\n    "price": "99.95",\n    "priceCurrency": "TRY"\n  }\n}', 
                explanation: 'Google\'ın zengin ürün sonuçları için Product şemasında bazı özellikler gereklidir. Eksik özellikler, zengin sonuç gösterimini engelleyebilir.', 
                reference: 'https://developers.google.com/search/docs/appearance/structured-data/product', 
                category: 'Structured Data' 
              });
            }
            
            if (missingRecommended.length > 0) {
              issues.push({ 
                type: 'info', 
                field: 'structuredData', 
                message: `Product şemasında önerilen özellikler eksik: ${missingRecommended.join(', ')}.`, 
                suggestion: 'Daha zengin sonuçlar için önerilen özellikleri de ekleyin.', 
                impact: 'medium', 
                difficulty: 'orta', 
                example: '{\n  "@context": "https://schema.org",\n  "@type": "Product",\n  "name": "Ürün Adı",\n  "image": "https://example.com/product.jpg",\n  "description": "Ürün açıklaması",\n  "brand": {\n    "@type": "Brand",\n    "name": "Marka İsmi"\n  }\n}', 
                explanation: 'Bu özellikler gerekli olmasa da, ürün zengin sonuçlarının daha eksiksiz görünmesini sağlar ve kullanıcıların ürününüzü seçme olasılığını artırabilir.', 
                reference: 'https://developers.google.com/search/docs/appearance/structured-data/product', 
                category: 'Structured Data' 
              });
            }
            
            // Check offers property
            if (jsonData.offers) {
              const offers = Array.isArray(jsonData.offers) ? jsonData.offers[0] : jsonData.offers;
              if (!offers.price || !offers.priceCurrency) {
                issues.push({ 
                  type: 'warning', 
                  field: 'structuredData', 
                  message: 'Product şemasındaki offers özelliğinde fiyat veya para birimi eksik.', 
                  suggestion: 'Offers nesnesine price ve priceCurrency ekleyin.', 
                  impact: 'high', 
                  difficulty: 'kolay', 
                  example: '{\n  "offers": {\n    "@type": "Offer",\n    "price": "99.95",\n    "priceCurrency": "TRY",\n    "availability": "https://schema.org/InStock"\n  }\n}', 
                  explanation: 'Fiyat ve para birimi, ürün zengin sonuçlarının en önemli bileşenlerindendir. Bu özellikler olmadan, Google ürün zengin sonuçları göstermeyebilir.', 
                  reference: 'https://developers.google.com/search/docs/appearance/structured-data/product#price-details', 
                  category: 'Structured Data' 
                });
              }
            }
          }
          
          if (schemaType === 'LocalBusiness' || schemaType === 'Restaurant' || schemaType === 'Store') {
            const requiredProps = ['name', 'address'];
            const recommendedProps = ['telephone', 'openingHours', 'geo'];
            const missingRequired = requiredProps.filter(prop => !jsonData[prop]);
            const missingRecommended = recommendedProps.filter(prop => !jsonData[prop]);
            
            if (missingRequired.length > 0) {
              issues.push({ 
                type: 'warning', 
                field: 'structuredData', 
                message: `LocalBusiness şemasında gerekli özellikler eksik: ${missingRequired.join(', ')}.`, 
                suggestion: 'Tüm gerekli özellikleri ekleyin.', 
                impact: 'high', 
                difficulty: 'orta', 
                example: '{\n  "@context": "https://schema.org",\n  "@type": "LocalBusiness",\n  "name": "İşletme Adı",\n  "address": {\n    "@type": "PostalAddress",\n    "streetAddress": "Atatürk Cad. No:123",\n    "addressLocality": "İstanbul",\n    "postalCode": "34100",\n    "addressCountry": "TR"\n  }\n}', 
                explanation: 'İşletme bilgilerinizin Google Haritalar ve yerel arama sonuçlarında doğru gösterilmesi için bu özellikler gereklidir.', 
                reference: 'https://developers.google.com/search/docs/appearance/structured-data/local-business', 
                category: 'Structured Data' 
              });
            }
            
            if (missingRecommended.length > 0) {
              issues.push({ 
                type: 'info', 
                field: 'structuredData', 
                message: `LocalBusiness şemasında önerilen özellikler eksik: ${missingRecommended.join(', ')}.`, 
                suggestion: 'Daha zengin yerel işletme bilgileri için önerilen özellikleri ekleyin.', 
                impact: 'medium', 
                difficulty: 'orta', 
                example: '{\n  "telephone": "+902121234567",\n  "openingHours": "Mo,Tu,We,Th,Fr 09:00-18:00",\n  "geo": {\n    "@type": "GeoCoordinates",\n    "latitude": "40.9928",\n    "longitude": "29.0257"\n  }\n}', 
                explanation: 'Bu özellikler, işletmenizin yerel arama sonuçlarında ve Google Haritalar\'da daha fazla bilgiyle görüntülenmesini sağlar, bu da kullanıcıların işletmenizi ziyaret etme olasılığını artırabilir.', 
                reference: 'https://developers.google.com/search/docs/appearance/structured-data/local-business', 
                category: 'Structured Data' 
              });
            }
          }
          
          if (schemaType === 'FAQPage') {
            if (!jsonData.mainEntity || !Array.isArray(jsonData.mainEntity)) {
              issues.push({ 
                type: 'warning', 
                field: 'structuredData', 
                message: 'FAQPage şemasında mainEntity dizisi eksik veya yanlış formatlanmış.', 
                suggestion: 'Soru ve cevapları içeren bir mainEntity dizisi ekleyin.', 
                impact: 'high', 
                difficulty: 'orta', 
                example: '{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [\n    {\n      "@type": "Question",\n      "name": "Soru metni?",\n      "acceptedAnswer": {\n        "@type": "Answer",\n        "text": "Cevap metni"\n      }\n    },\n    {\n      "@type": "Question",\n      "name": "Başka bir soru?",\n      "acceptedAnswer": {\n        "@type": "Answer",\n        "text": "Başka bir cevap"\n      }\n    }\n  ]\n}', 
                explanation: 'FAQPage şeması, Google arama sonuçlarında SSS bölümünüzün genişletilebilir bir liste olarak gösterilmesini sağlar. Bu format olmadan, zengin sonuçlar gösterilmeyecektir.', 
                reference: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage', 
                category: 'Structured Data' 
              });
            } else if (jsonData.mainEntity && Array.isArray(jsonData.mainEntity)) {
              // Check each question-answer pair
              let hasIssues = false;
              for (const item of jsonData.mainEntity) {
                if (!item['@type'] || item['@type'] !== 'Question' || !item.name || !item.acceptedAnswer) {
                  hasIssues = true;
                  break;
                }
                
                const answer = item.acceptedAnswer;
                if (!answer['@type'] || answer['@type'] !== 'Answer' || !answer.text) {
                  hasIssues = true;
                  break;
                }
              }
              
              if (hasIssues) {
                issues.push({ 
                  type: 'warning', 
                  field: 'structuredData', 
                  message: 'FAQPage şemasındaki bazı soru-cevap çiftleri hatalı formatlanmış.', 
                  suggestion: 'Her soru-cevap çiftinin gerekli tüm özelliklere sahip olduğundan emin olun.', 
                  impact: 'medium', 
                  difficulty: 'orta', 
                  example: '{\n  "mainEntity": [\n    {\n      "@type": "Question",\n      "name": "Soru metni?",\n      "acceptedAnswer": {\n        "@type": "Answer",\n        "text": "Cevap metni"\n      }\n    }\n  ]\n}', 
                  explanation: 'Her soru-cevap çifti, Question tipi bir nesne ve içinde acceptedAnswer olarak Answer tipi bir nesne içermelidir. Her ikisi de gerekli metin özellikleriyle tam olmalıdır.', 
                  reference: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage', 
                  category: 'Structured Data' 
                });
              }
            }
          }
          
          // Check for nested data with missing properties
          const checkForMissingProps = (obj: any, path = '') => {
            if (!obj || typeof obj !== 'object') return;
            
            // Check for empty objects
            if (Object.keys(obj).length === 0 && path) {
              issues.push({ 
                type: 'warning', 
                field: 'structuredData', 
                message: `JSON-LD içinde boş bir nesne bulundu: ${path}`, 
                suggestion: 'Boş nesneleri kaldırın veya gerekli özellikleri ekleyin.', 
                impact: 'medium', 
                difficulty: 'kolay', 
                example: '', 
                explanation: 'Boş nesneler, arama motorlarının yapılandırılmış verileri doğru şekilde işlemesini engelleyebilir ve potansiyel zengin sonuçları etkileyebilir.', 
                reference: 'https://schema.org/docs/schemas.html', 
                category: 'Structured Data' 
              });
              return;
            }
            
            // Check specific types that need certain properties
            if (obj['@type']) {
              const type = obj['@type'];
              if (type === 'ImageObject' && !obj.url) {
                issues.push({ 
                  type: 'warning', 
                  field: 'structuredData', 
                  message: `${path} içindeki ImageObject'te url özelliği eksik.`, 
                  suggestion: 'ImageObject içine url özelliği ekleyin.', 
                  impact: 'medium', 
                  difficulty: 'kolay', 
                  example: '{\n  "@type": "ImageObject",\n  "url": "https://example.com/image.jpg"\n}', 
                  explanation: 'ImageObject türündeki nesnelerde url özelliği bulunmalıdır. Bu olmadan, arama motorları görseli tanımlayamaz.', 
                  reference: 'https://schema.org/ImageObject', 
                  category: 'Structured Data' 
                });
              }
              
              if ((type === 'Person' || type === 'Organization') && !obj.name) {
                issues.push({ 
                  type: 'warning', 
                  field: 'structuredData', 
                  message: `${path} içindeki ${type} nesnesinde name özelliği eksik.`, 
                  suggestion: `${type} nesnesine name özelliği ekleyin.`, 
                  impact: 'medium', 
                  difficulty: 'kolay', 
                  example: `{\n  "@type": "${type}",\n  "name": "${type === 'Person' ? 'Kişi Adı' : 'Kuruluş Adı'}"\n}`, 
                  explanation: `${type} türündeki nesnelerde name özelliği bulunmalıdır. Bu olmadan, arama motorları varlığı doğru şekilde tanımlayamaz.`, 
                  reference: `https://schema.org/${type}`, 
                  category: 'Structured Data' 
                });
              }
            }
            
            // Recursively check all nested objects
            for (const key in obj) {
              if (obj[key] && typeof obj[key] === 'object') {
                const newPath = path ? `${path}.${key}` : key;
                checkForMissingProps(obj[key], newPath);
              }
            }
          };
          
          checkForMissingProps(jsonData);
        }
      } catch (e) {
        issues.push({ 
          type: 'error', 
          field: 'structuredData', 
          message: `JSON-LD bloğu geçerli JSON formatında değil.`, 
          suggestion: 'JSON formatını kontrol edin ve düzeltin.', 
          impact: 'critical', 
          difficulty: 'orta', 
          example: '', 
          explanation: 'Geçersiz JSON formatı, yapılandırılmış verilerin tamamen yok sayılmasına neden olur. JSON sözdizimini kontrol edin ve sorunları düzeltin.', 
          reference: 'https://schema.org/docs/jsonld.html', 
          category: 'Structured Data' 
        });
      }
    });
  }
  
  // Analyze Microdata implementation
  if (hasMicrodata) {
    successes.push({ 
      field: 'structuredData', 
      message: `${microdataElements.length} adet Microdata yapılandırılmış veri öğesi bulundu.`, 
      impact: 'positive' 
    });
    
    // Check if itemtype is present
    let validMicrodataCount = 0;
    let microdataTypes: string[] = [];
    
    microdataElements.each((_, element) => {
      const itemtype = $(element).attr('itemtype') || '';
      if (!itemtype) {
        issues.push({ 
          type: 'warning', 
          field: 'structuredData', 
          message: 'itemscope özelliği olan bir öğede itemtype özelliği eksik.', 
          suggestion: 'itemscope özelliği olan her öğeye itemtype ekleyin.', 
          impact: 'high', 
          difficulty: 'kolay', 
          example: '<div itemscope itemtype="https://schema.org/Product">', 
          explanation: 'itemscope özelliği, bir öğenin yapılandırılmış bir veri bloğu olduğunu belirtir, ancak itemtype olmadan, bu bloğun hangi şema tipini temsil ettiği bilinmemektedir.', 
          reference: 'https://schema.org/docs/gs.html#microdata_how', 
          category: 'Structured Data' 
        });
      } else if (!itemtype.includes('schema.org')) {
        issues.push({ 
          type: 'info', 
          field: 'structuredData', 
          message: `Microdata itemtype değeri schema.org URL'sini içermiyor: ${itemtype}`, 
          suggestion: 'itemtype değerini schema.org URL\'si ile güncelleyin.', 
          impact: 'medium', 
          difficulty: 'kolay', 
          example: '<div itemscope itemtype="https://schema.org/Product">', 
          explanation: 'Schema.org, arama motorları tarafından en iyi desteklenen yapılandırılmış veri sözlüğüdür. Schema.org olmayan itemtype değerleri, zengin sonuçlar oluşturmayabilir.', 
          reference: 'https://schema.org/docs/gs.html#microdata_why', 
          category: 'Structured Data' 
        });
      } else {
        // Extract the schema type from URL
        const typeMatch = itemtype.match(/schema\.org\/([^\/]+)/i);
        if (typeMatch && typeMatch[1]) {
          microdataTypes.push(typeMatch[1]);
          validMicrodataCount++;
        }
        
        // Check for itemprop children
        const itemprops = $(element).find('[itemprop]');
        if (itemprops.length === 0) {
          issues.push({ 
            type: 'warning', 
            field: 'structuredData', 
            message: `itemscope özelliği olan bir öğede hiç itemprop özelliği yok.`, 
            suggestion: 'Bu schema için gerekli itemprop özelliklerini ekleyin.', 
            impact: 'high', 
            difficulty: 'orta', 
            example: '<div itemscope itemtype="https://schema.org/Product">\n  <h1 itemprop="name">Ürün Adı</h1>\n  <img itemprop="image" src="urun.jpg" />\n</div>', 
            explanation: 'itemprop özellikleri, schema.org türü için gerekli özellikleri tanımlar. Bunlar olmadan, yapılandırılmış veri bloğu eksik kabul edilir ve muhtemelen zengin sonuçlar üretmez.', 
            reference: 'https://schema.org/docs/gs.html#microdata_itemprops', 
            category: 'Structured Data' 
          });
        }
      }
    });
    
    if (validMicrodataCount > 0) {
      schemaTypes = [...schemaTypes, ...microdataTypes];
      validSchemas += validMicrodataCount;
    }
  }
  
  // Check for RDFa Lite
  if (rdfa) {
    successes.push({ 
      field: 'structuredData', 
      message: 'RDFa Lite yapılandırılmış veri bulundu.', 
      impact: 'positive' 
    });
    
    issues.push({ 
      type: 'info', 
      field: 'structuredData', 
      message: 'RDFa formatında yapılandırılmış veri kullanılıyor.', 
      suggestion: 'Google\'ın önerdiği JSON-LD formatını kullanmayı değerlendirin.', 
      impact: 'low', 
      difficulty: 'orta', 
      example: '<script type="application/ld+json">{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "Sayfa Başlığı"\n}</script>', 
      explanation: 'RDFa geçerli bir yapılandırılmış veri formatı olsa da, Google özellikle JSON-LD formatını önermektedir çünkü HTML içeriğinden ayrılmıştır, bakımı daha kolaydır ve JavaScript ile dinamik olarak güncellenebilir.', 
      reference: 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data#structured-data-format', 
      category: 'Structured Data' 
    });
  }
  
  // Check for multiple structured data formats
  if ((hasJsonLd && hasMicrodata) || (hasJsonLd && rdfa) || (hasMicrodata && rdfa)) {
    issues.push({ 
      type: 'info', 
      field: 'structuredData', 
      message: 'Birden fazla yapılandırılmış veri formatı kullanılıyor.', 
      suggestion: 'Tek bir yapılandırılmış veri formatı (tercihen JSON-LD) kullanın.', 
      impact: 'low', 
      difficulty: 'orta', 
      example: '', 
      explanation: 'Birden fazla format kullanmak geçerli olsa da, bakımı zorlaştırabilir ve arama motorlarının veriyi yorumlamasında tutarsızlıklara neden olabilir. Google, JSON-LD formatını önermektedir.', 
      reference: 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data#structured-data-format', 
      category: 'Structured Data' 
    });
  }
  
  // Check for schema type implementation based on page content
  if (schemaTypes.length > 0) {
    // Convert schema types to lowercase for case-insensitive comparison
    const lowerSchemaTypes = schemaTypes.map(t => t.toLowerCase());
    
    // Check for Article schema on article pages
    if (isArticlePage && !lowerSchemaTypes.some(t => ['article', 'newsarticle', 'blogposting'].includes(t))) {
      issues.push({ 
        type: 'info', 
        field: 'structuredData', 
        message: 'Bu sayfa bir makale gibi görünüyor ancak Article şeması kullanılmıyor.', 
        suggestion: 'Bu içerik türü için Article, NewsArticle veya BlogPosting şeması ekleyin.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '<script type="application/ld+json">{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "Makale Başlığı",\n  "author": {\n    "@type": "Person",\n    "name": "Yazar Adı"\n  },\n  "datePublished": "2023-01-01T08:00:00+03:00"\n}</script>', 
        explanation: 'Makale içeriği için Article şeması kullanmak, Google\'ın içeriğinizi daha iyi anlamasını sağlar ve zengin sonuçlarda gösterilme olasılığını artırır.', 
        reference: 'https://developers.google.com/search/docs/appearance/structured-data/article', 
        category: 'Structured Data' 
      });
    }
    
    // Check for Product schema on product pages
    if (isProductPage && !lowerSchemaTypes.some(t => t.includes('product'))) {
      issues.push({ 
        type: 'info', 
        field: 'structuredData', 
        message: 'Bu sayfa bir ürün sayfası gibi görünüyor ancak Product şeması kullanılmıyor.', 
        suggestion: 'Bu içerik türü için Product şeması ekleyin.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '<script type="application/ld+json">{\n  "@context": "https://schema.org",\n  "@type": "Product",\n  "name": "Ürün Adı",\n  "image": "https://example.com/product.jpg",\n  "offers": {\n    "@type": "Offer",\n    "price": "99.95",\n    "priceCurrency": "TRY"\n  }\n}</script>', 
        explanation: 'Ürün sayfaları için Product şeması kullanmak, arama sonuçlarında fiyat, stok durumu ve ürün değerlendirmeleri gibi zengin sonuçların görüntülenmesini sağlar.', 
        reference: 'https://developers.google.com/search/docs/appearance/structured-data/product', 
        category: 'Structured Data' 
      });
    }
    
    // Check for LocalBusiness schema on location pages
    if (isLocalBusiness && !lowerSchemaTypes.some(t => t.includes('business') || t.includes('restaurant') || t.includes('store'))) {
      issues.push({ 
        type: 'info', 
        field: 'structuredData', 
        message: 'Bu sayfa bir işletme bilgisi sayfası gibi görünüyor ancak LocalBusiness şeması kullanılmıyor.', 
        suggestion: 'Bu içerik türü için LocalBusiness veya ilgili bir şema ekleyin.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '<script type="application/ld+json">{\n  "@context": "https://schema.org",\n  "@type": "LocalBusiness",\n  "name": "İşletme Adı",\n  "address": {\n    "@type": "PostalAddress",\n    "streetAddress": "Atatürk Cad. No:123",\n    "addressLocality": "İstanbul",\n    "postalCode": "34100",\n    "addressCountry": "TR"\n  },\n  "telephone": "+902121234567"\n}</script>', 
        explanation: 'İşletme sayfaları için LocalBusiness şeması kullanmak, Google Haritalar ve yerel arama sonuçlarında daha iyi görünürlük sağlar.', 
        reference: 'https://developers.google.com/search/docs/appearance/structured-data/local-business', 
        category: 'Structured Data' 
      });
    }
    
    // Check for FAQ schema on FAQ pages
    if (hasFAQ && !lowerSchemaTypes.some(t => t.includes('faq'))) {
      issues.push({ 
        type: 'info', 
        field: 'structuredData', 
        message: 'Bu sayfa SSS içeriği gibi görünüyor ancak FAQPage şeması kullanılmıyor.', 
        suggestion: 'SSS içeriği için FAQPage şeması ekleyin.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '<script type="application/ld+json">{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [\n    {\n      "@type": "Question",\n      "name": "Soru 1?",\n      "acceptedAnswer": {\n        "@type": "Answer",\n        "text": "Cevap 1"\n      }\n    }\n  ]\n}</script>', 
        explanation: 'SSS içeriği için FAQPage şeması kullanmak, arama sonuçlarında genişletilebilir soru-cevap listelerinin görüntülenmesini sağlar ve daha fazla SERP görünürlüğü sağlar.', 
        reference: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage', 
        category: 'Structured Data' 
      });
    }
  }
  
  // Overall schema quality assessment
  if (validSchemas > 0) {
    successes.push({ 
      field: 'structuredData-overview', 
      message: `Toplam ${validSchemas} geçerli yapılandırılmış veri şeması tespit edildi.`, 
      impact: 'high positive' 
    });
    
    if (hasJsonLd) {
      successes.push({ 
        field: 'structuredData-format', 
        message: 'Google\'ın önerdiği JSON-LD formatı kullanılıyor.', 
        impact: 'medium positive' 
      });
    }
  }
  
  return { issues, successes };
}

function analyzeLazyLoading($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Analyze all images on the page
  const allImages = $('img');
  const lazyLoadedImages = $("img[loading='lazy']");
  const dataLazyImages = $("img[data-src], img[data-lazy-src], img[data-lazy], img[data-lazyload]");
  const classLazyImages = $("img.lazy, img.lazyload, img.lazy-load");
  
  // Analyze iframes for lazy loading
  const allIframes = $('iframe');
  const lazyLoadedIframes = $("iframe[loading='lazy']");
  const dataLazyIframes = $("iframe[data-src], iframe[data-lazy-src]");
  
  // Analyze videos for lazy loading
  const allVideos = $('video');
  const videoLazyAttributes = $("video[preload='none'], video[preload='metadata']");
  
  // Count images with potential lazy loading attributes or classes
  const totalLazyImages = new Set([
    ...lazyLoadedImages.toArray(), 
    ...dataLazyImages.toArray(),
    ...classLazyImages.toArray()
  ]).size;
  
  // Calculate total lazy-loaded elements across all types
  const totalElements = allImages.length + allIframes.length + allVideos.length;
  const totalLazyElements = totalLazyImages + lazyLoadedIframes.length + videoLazyAttributes.length;
  
  // Check for lazy-loading libraries
  const hasLazyLoadLib = $("script[src*='lazy'], script[src*='lozad'], script:contains('lazy')").length > 0;
  
  // Look for common lazy loading implementations in script tags
  const hasInlineLazyImplementation = $('script:contains("lazy"), script:contains("IntersectionObserver")').length > 0;
  
  // Check if any lazy loading is implemented
  const hasAnyLazyLoading = totalLazyElements > 0 || hasLazyLoadLib || hasInlineLazyImplementation;
  
  // Define thresholds for LCP (Largest Contentful Paint) images
  const potentialLCPImages = $('img').filter((_, el) => {
    const img = $(el);
    // Hero görselleri, büyük görseller veya önemli pozisyondaki görselleri bul
    return (
      img.parent().is('header, .header, #hero, .hero, .banner, .main-banner') ||
      // Cheerio'nun width fonksiyonu yok, bu yüzden attr ile kontrol et ve sayıya çevir
      (parseInt(img.attr('width') || '0', 10) > 300) ||
      // Yükseklik de büyükse LCP adayı olabilir
      (parseInt(img.attr('height') || '0', 10) > 200) ||
      // Sık kullanılan logo/brand/header-img class'larından biri varsa
      img.hasClass('logo') || img.hasClass('brand') || img.hasClass('header-img')
    );
  });
  // LCP görselleri arasında yanlış şekilde lazy yüklenenleri tespit et
  const lazyLoadedLCPImages = potentialLCPImages.filter((_, el) => {
    const img = $(el);
    return (
      img.attr('loading') === 'lazy' ||
      !!img.attr('data-src') ||
      img.hasClass('lazy') ||
      img.hasClass('lazyload')
    );
           img.hasClass('lazyload');
  });
  
  // Count images that could benefit from lazy loading but aren't using it
  const nonLazyImages = allImages.length - totalLazyImages;
  
  // Check for large images (>100KB estimation based on dimensions)
  const largeImages = $('img').filter((_, el) => {
    const img = $(el);
    const width = parseInt(img.attr('width') || '0', 10);
    const height = parseInt(img.attr('height') || '0', 10);
    // Simple check for potentially large images based on dimensions
    return (width > 1000 && height > 1000);
  });
  
  const largeNonLazyImages = largeImages.filter((_, el) => {
    const img = $(el);
    return img.attr('loading') !== 'lazy' && 
           !img.attr('data-src') && 
           !img.hasClass('lazy') &&
           !img.hasClass('lazyload');
  });
  
  // Check for native loading attribute vs JS-based solutions
  const hasNativeLazy = lazyLoadedImages.length > 0;
  const hasJsLazy = dataLazyImages.length > 0 || classLazyImages.length > 0 || hasLazyLoadLib || hasInlineLazyImplementation;
  
  // Identify missing width/height attributes on images
  const imagesWithoutDimensions = $('img').filter((_, el) => {
    const img = $(el);
    return (!img.attr('width') || !img.attr('height')) && 
           !img.attr('style')?.includes('width') &&
           !img.attr('style')?.includes('height');
  });
  
  // Report successes based on analysis
  if (hasAnyLazyLoading) {
    if (allImages.length > 0 && totalLazyImages / allImages.length > 0.7) {
      successes.push({ 
        field: 'lazy', 
        message: 'Görsellerin çoğunda lazy loading kullanılıyor.', 
        impact: 'high positive' 
      });
    } else if (allImages.length > 0) {
      successes.push({ 
        field: 'lazy', 
        message: 'Bazı görsellerde lazy loading kullanılıyor.', 
        impact: 'medium positive' 
      });
    }
    
    if (hasNativeLazy) {
      successes.push({ 
        field: 'native-lazy', 
        message: 'Native lazy loading kullanılıyor.', 
        impact: 'positive' 
      });
    }
    
    if (lazyLoadedIframes.length > 0) {
      successes.push({ 
        field: 'iframe-lazy', 
        message: 'Iframe\'lerde lazy loading kullanılıyor.', 
        impact: 'positive' 
      });
    }
    
    if (videoLazyAttributes.length > 0) {
      successes.push({ 
        field: 'video-lazy', 
        message: 'Video elementlerinde lazy loading kullanılıyor.', 
        impact: 'positive' 
      });
    }
  }
  
  // Report issues based on analysis
  if (!hasAnyLazyLoading && totalElements > 5) {
    issues.push({ 
      type: 'warning', 
      field: 'lazy', 
      message: 'Sayfada lazy loading kullanılmıyor.', 
      suggestion: 'Görsel, iframe ve video elementleri için lazy loading uygulayın.', 
      impact: 'high', 
      difficulty: 'orta', 
      example: '<img src="resim.jpg" loading="lazy" width="800" height="600" alt="Açıklama">', 
      explanation: 'Lazy loading, sayfa ilk yüklendiğinde görünür olmayan elementlerin yüklenmesini erteleyerek sayfa yükleme süresini ve kaynak kullanımını azaltır. Bu, özellikle çok sayıda görsel veya büyük medya dosyaları içeren sayfalar için Temel Web Ölçümlerini (Core Web Vitals) iyileştirir ve kullanıcı deneyimini geliştirir.', 
      reference: 'https://web.dev/browser-level-image-lazy-loading/', 
      category: 'Performance' 
    });
  } else {
    // Report specific lazy loading improvement opportunities
    if (nonLazyImages > 5) {
      issues.push({ 
        type: 'info', 
        field: 'lazy', 
        message: `${nonLazyImages} adet görsel lazy loading kullanmıyor.`, 
        suggestion: 'Görünür alan dışındaki tüm görsellere lazy loading ekleyin.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<img src="resim.jpg" loading="lazy" width="800" height="600" alt="Açıklama">', 
        explanation: 'Görünür alan (viewport) dışındaki görsellere lazy loading eklemek, sayfa yükleme hızını artırır ve veri kullanımını azaltır. Modern tarayıcılar native lazy loading özelliğini destekler, böylece ek JavaScript kütüphanelerine gerek kalmaz.', 
        reference: 'https://web.dev/browser-level-image-lazy-loading/', 
        category: 'Performance' 
      });
    }
    
    if (largeNonLazyImages.length > 0) {
      issues.push({ 
        type: 'warning', 
        field: 'lazy', 
        message: `${largeNonLazyImages.length} adet büyük görsel lazy loading kullanmıyor.`, 
        suggestion: 'Büyük boyutlu görsellere öncelikli olarak lazy loading ekleyin.', 
        impact: 'high', 
        difficulty: 'kolay', 
        example: '<img src="buyuk-resim.jpg" loading="lazy" width="1200" height="800" alt="Açıklama">', 
        explanation: 'Büyük görseller (yüksek çözünürlüklü veya boyutça büyük) sayfa performansını önemli ölçüde etkileyebilir. Bu görsellere lazy loading eklemek, sayfa yükleme süresinde ve kullanıcı deneyiminde önemli iyileştirmeler sağlar.', 
        reference: 'https://web.dev/optimize-lcp/', 
        category: 'Performance' 
      });
    }
    
    if (allIframes.length > 0 && lazyLoadedIframes.length === 0 && dataLazyIframes.length === 0) {
      issues.push({ 
        type: 'info', 
        field: 'iframe-lazy', 
        message: 'Iframe\'lerde lazy loading kullanılmıyor.', 
        suggestion: 'Görünür alan dışındaki iframe\'lere lazy loading ekleyin.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<iframe src="embed.html" loading="lazy"></iframe>', 
        explanation: 'Iframe\'ler genellikle haritalar, videolar veya üçüncü taraf içerikleri gibi ağır kaynakları yükler. Bunlara lazy loading eklemek, sayfa performansını önemli ölçüde iyileştirebilir.', 
        reference: 'https://web.dev/iframe-lazy-loading/', 
        category: 'Performance' 
      });
    }
    
    if (allVideos.length > 0 && videoLazyAttributes.length === 0) {
      issues.push({ 
        type: 'info', 
        field: 'video-lazy', 
        message: 'Video elementlerinde preload optimizasyonu yapılmamış.', 
        suggestion: 'Video elementlerine preload="none" veya preload="metadata" ekleyin.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<video src="video.mp4" preload="none" controls></video>', 
        explanation: 'Video elementlerinde preload="none" kullanımı, kullanıcı video ile etkileşime geçene kadar video içeriğinin yüklenmesini engeller. preload="metadata" ise yalnızca meta verileri (süre, boyutlar, ilk kare) yükler. Bu, sayfa yükleme süresini önemli ölçüde azaltabilir.', 
        reference: 'https://web.dev/efficiently-load-third-party-javascript/', 
        category: 'Performance' 
      });
    }
  }
  
  // Check for potential LCP (Largest Contentful Paint) issues
  if (lazyLoadedLCPImages.length > 0) {
    issues.push({ 
      type: 'warning', 
      field: 'lcp-lazy', 
      message: 'Kritik görsellere (muhtemel LCP elementleri) lazy loading uygulanmış.', 
      suggestion: 'Ana banner, hero görselleri gibi kritik görsellerde lazy loading kullanmayın.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<img src="hero.jpg" width="1200" height="600" alt="Hero Görsel">', 
      explanation: 'Görünür alandaki kritik görsellere (LCP - Largest Contentful Paint adayları) lazy loading uygulamak, sayfanın görsel olarak tamamlanmasını geciktirir ve Core Web Vitals performansını olumsuz etkiler. Bu görseller için lazy loading özelliğini kaldırın.', 
      reference: 'https://web.dev/lcp/#how-to-optimize-lcp', 
      category: 'Performance' 
    });
  }
  
  // Check for mixed lazy loading implementations
  if (hasNativeLazy && hasJsLazy) {
    issues.push({ 
      type: 'info', 
      field: 'mixed-lazy', 
      message: 'Hem native hem JavaScript tabanlı lazy loading kullanılıyor.', 
      suggestion: 'Tutarlılık için tek bir lazy loading yaklaşımı kullanmayı tercih edin.', 
      impact: 'low', 
      difficulty: 'orta', 
      example: '<img src="resim.jpg" loading="lazy" width="800" height="600" alt="Açıklama">', 
      explanation: 'Karışık lazy loading uygulamaları bakımı zorlaştırabilir ve bazı durumlarda çakışmalara neden olabilir. Modern tarayıcılar için native lazy loading (loading="lazy" özelliği) kullanımı önerilir ve fallback olarak JavaScript çözümleri eklenebilir.', 
      reference: 'https://web.dev/browser-level-image-lazy-loading/', 
      category: 'Performance' 
    });
  }
  
  // Check for images without dimensions
  if (imagesWithoutDimensions.length > 0) {
    issues.push({ 
      type: 'info', 
      field: 'image-dimensions', 
      message: `${imagesWithoutDimensions.length} adet görsel width ve height özelliklerine sahip değil.`, 
      suggestion: 'Tüm görsellere width ve height özellikleri ekleyin.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<img src="resim.jpg" width="800" height="600" loading="lazy" alt="Açıklama">', 
      explanation: 'Görsellere width ve height özellikleri eklemek, tarayıcının daha sayfa yüklenirken görsel için gerekli alanı ayırmasını sağlar. Bu, Cumulative Layout Shift (CLS) metriğini iyileştirir ve lazy loading ile birlikte kullanıldığında daha iyi bir kullanıcı deneyimi sunar.', 
      reference: 'https://web.dev/optimize-cls/#images-without-dimensions', 
      category: 'Performance' 
    });
  }
  
  // Check for lazy loading with IntersectionObserver API
  if (!hasInlineLazyImplementation && hasJsLazy && !hasLazyLoadLib) {
    issues.push({ 
      type: 'info', 
      field: 'intersection-observer', 
      message: 'JavaScript tabanlı lazy loading kullanılıyor ancak modern IntersectionObserver API kullanımı tespit edilemedi.', 
      suggestion: 'Lazy loading için IntersectionObserver API kullanın.', 
      impact: 'low', 
      difficulty: 'orta', 
      example: `<script>
  document.addEventListener("DOMContentLoaded", function() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          observer.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach((img) => {
      observer.observe(img);
    });
  });
</script>`, 
      explanation: 'IntersectionObserver API, elementlerin görünür alana girip çıktığını tespit etmek için modern ve performanslı bir yöntemdir. Scroll event dinleyicilerine dayalı eski lazy loading yöntemlerinden daha verimlidir ve ana thread\'i bloke etmez.', 
      reference: 'https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API', 
      category: 'Performance' 
    });
  }
  
  // Check for above-the-fold (non-lazy) vs below-the-fold (lazy) balance
  if (hasAnyLazyLoading && allImages.length > 5) {
    const approxAboveFold = Math.min(3, Math.ceil(allImages.length * 0.3));
    const nonLazyPercentage = nonLazyImages / allImages.length;
    
    if (nonLazyPercentage < 0.1) {
      issues.push({ 
        type: 'info', 
        field: 'excessive-lazy', 
        message: 'Neredeyse tüm görsellere lazy loading uygulanmış.', 
        suggestion: 'Görünür alandaki (above the fold) görsellere lazy loading uygulamayın.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '', 
        explanation: 'Sayfa ilk yüklendiğinde görünür alanda (viewport) olan görsellere lazy loading uygulamak, bu görsellerin gereksiz yere gecikmesine neden olabilir. Yalnızca görünür alan dışındaki görsellere lazy loading uygulamak en iyi yaklaşımdır.', 
        reference: 'https://web.dev/lcp/#optimize-when-the-resource-is-discovered', 
        category: 'Performance' 
      });
    }
  }
  
  return { issues, successes };
}

function analyzeLargeImages($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Analyze all images on the page
  const allImages = $("img").toArray();
  const totalImages = allImages.length;
  
  // Track different types of image issues
  let largeImagesCount = 0;
  let unoptimizedFormatCount = 0;
  let missingDimensionsCount = 0;
  let missingAltCount = 0;
  let nonResponsiveCount = 0;
  let highDensityCount = 0;
  let oversizedCount = 0;
  
  // Collection of large images for specific recommendations
  const largeImages: Array<{element: any, width: number, height: number, src: string, format: string}> = [];
  
  // Check all images
  allImages.forEach(img => {
    const imgEl = $(img);
    const src = imgEl.attr('src') || '';
    const dataSrc = imgEl.attr('data-src') || '';
    const srcset = imgEl.attr('srcset') || '';
    const imgUrl = src || dataSrc;
    let hasWidth = false, hasHeight = false;
    
    // Extract dimensions from various sources
    const width = parseInt(imgEl.attr('width') || '0', 10);
    const height = parseInt(imgEl.attr('height') || '0', 10);
    const styleAttr = imgEl.attr('style') || '';
    
    // Check for width/height in style attribute
    let styleWidth = 0, styleHeight = 0;
    if (styleAttr) {
      const widthMatch = styleAttr.match(/width\s*:\s*(\d+)px/i);
      const heightMatch = styleAttr.match(/height\s*:\s*(\d+)px/i);
      if (widthMatch) styleWidth = parseInt(widthMatch[1], 10);
      if (heightMatch) styleHeight = parseInt(heightMatch[1], 10);
    }
    
    // Determine final dimensions using the most reliable source
    const finalWidth = width || styleWidth;
    const finalHeight = height || styleHeight;
    
    hasWidth = width > 0 || styleWidth > 0;
    hasHeight = height > 0 || styleHeight > 0;
    
    // Check for missing dimensions
    if (!hasWidth || !hasHeight) {
      missingDimensionsCount++;
    }
    
    // Check if image has alt attribute
    if (!imgEl.attr('alt') && imgEl.attr('aria-hidden') !== 'true') {
      missingAltCount++;
    }
    
    // Determine image format
    let imageFormat = 'unknown';
    if (imgUrl) {
      const formatMatch = imgUrl.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
      if (formatMatch) {
        imageFormat = formatMatch[1].toLowerCase();
      }
    }
    
    // Check for large image dimensions
    let isLargeImage = false;
    
    // Different thresholds for different contexts
    const dimensionThresholds = {
      hero: 2000,  // Hero images can be a bit larger
      content: 1200,  // Regular content images
      thumbnail: 400   // Thumbnails/icons
    };
    
    // Try to determine the image context
    const isLikelyHero = 
      imgEl.parent().is('header, .header, .hero, #hero, .banner, .masthead') || 
      imgEl.hasClass('hero') || 
      imgEl.hasClass('banner') || 
      imgEl.hasClass('header');
      
    const isLikelyThumbnail = 
      imgEl.hasClass('thumbnail') || 
      imgEl.hasClass('avatar') || 
      imgEl.hasClass('icon') || 
      imgEl.parent().hasClass('thumbnail') ||
      (finalWidth > 0 && finalWidth < 150 && finalHeight > 0 && finalHeight < 150);
    
    const threshold = isLikelyHero ? dimensionThresholds.hero : 
                      isLikelyThumbnail ? dimensionThresholds.thumbnail : 
                      dimensionThresholds.content;
    
    if ((finalWidth > threshold || finalHeight > threshold) && finalWidth > 0 && finalHeight > 0) {
      isLargeImage = true;
      largeImagesCount++;
      
      largeImages.push({
        element: img,
        width: finalWidth,
        height: finalHeight,
        src: imgUrl,
        format: imageFormat
      });
    }
    
    // Check for potentially oversized images (used much smaller than their actual size)
    if (finalWidth > 0 && finalHeight > 0) {
      const containerWidth = getContainerWidth(imgEl, $);
      if (containerWidth > 0 && finalWidth > containerWidth * 1.5) {
        oversizedCount++;
      }
    }
    
    // Check for responsive image techniques
    if (!srcset && finalWidth >= 600) {
      nonResponsiveCount++;
    }
    
    // Check for high density/retina images without proper handling
    if ((finalWidth > 1000 || finalHeight > 1000) && !srcset && !imgUrl.includes('@2x')) {
      highDensityCount++;
    }
    
    // Check for unoptimized formats
    if (['jpg', 'jpeg', 'png', 'gif'].includes(imageFormat) && finalWidth > 500) {
      unoptimizedFormatCount++;
    }
  });
  
  // Check for background images in CSS
  const elementsWithStyle = $('*[style*="background"]').toArray();
  let largeBackgroundImages = 0;
  
  elementsWithStyle.forEach(el => {
    const style = $(el).attr('style') || '';
    if (style.includes('background-image') || style.includes('background:')) {
      // Cheerio'nun width ve height fonksiyonları yok, bu yüzden native DOM'dan veya style'dan tahmin etmeye çalışalım
      let width = 0;
      let height = 0;

      // Inline style'dan width ve height çekmeye çalış
      const widthMatch = style.match(/width\s*:\s*([0-9.]+)px/i);
      const heightMatch = style.match(/height\s*:\s*([0-9.]+)px/i);

      if (widthMatch) {
        width = parseFloat(widthMatch[1]);
      }
      if (heightMatch) {
        height = parseFloat(heightMatch[1]);
      }

      // Eğer inline style'da yoksa, elementin attribute'larından bak
      if (!width) {
        const attrWidth = $(el).attr('width');
        if (attrWidth) width = parseFloat(attrWidth) || 0;
      }
      if (!height) {
        const attrHeight = $(el).attr('height');
        if (attrHeight) height = parseFloat(attrHeight) || 0;
      }

      if (width > 1200 || height > 1200) {
        largeBackgroundImages++;
      }
      
      // Check for unoptimized formats in background images
      const urlMatch = style.match(/url\(['"]?([^'"]+\.(jpg|jpeg|png|gif))['"]?\)/i);
      if (urlMatch && width > 500) {
        unoptimizedFormatCount++;
      }
    }
  });
  
  // Add background images to total count if found
  if (largeBackgroundImages > 0) {
    largeImagesCount += largeBackgroundImages;
  }
  
  // Generate detailed analysis and recommendations
  if (totalImages === 0) {
    successes.push({ 
      field: 'img', 
      message: 'Sayfada görsel element bulunmamakta.', 
      impact: 'neutral' 
    });
  } else if (largeImagesCount === 0 && unoptimizedFormatCount === 0 && oversizedCount === 0) {
    successes.push({ 
      field: 'img', 
      message: 'Sayfa görsel optimizasyonu açısından iyi durumda.', 
      impact: 'high positive' 
    });
    
    if (totalImages > 5 && missingDimensionsCount === 0) {
      successes.push({ 
        field: 'img-dimensions', 
        message: 'Tüm görseller width ve height özelliklerine sahip, bu CLS (Cumulative Layout Shift) performansını olumlu etkiler.', 
        impact: 'medium positive' 
      });
    }
    
    if (totalImages > 3 && missingAltCount === 0) {
      successes.push({ 
        field: 'img-alt', 
        message: 'Tüm görseller alt özelliğine sahip, bu erişilebilirlik açısından olumludur.', 
        impact: 'medium positive' 
      });
    }
  } else {
    // Report issues based on the findings
    if (largeImagesCount > 0) {
      // Generate detailed recommendations for each large image
      const specificRecommendations = largeImages.slice(0, 3).map(img => {
        const dimension = `${img.width}x${img.height}`;
        let recommendation = `• ${dimension} boyutlu görsel`;
        
        if (img.format === 'jpg' || img.format === 'jpeg' || img.format === 'png') {
          recommendation += `, WebP formatına dönüştürün`;
        }
        
        if (img.width > 1600 || img.height > 1600) {
          recommendation += `, boyutları küçültün`;
        }
        
        return recommendation;
      }).join('\n');
      
      issues.push({ 
        type: 'warning', 
        field: 'large-images', 
        message: `${largeImagesCount} adet büyük boyutlu görsel tespit edildi.`, 
        suggestion: `Büyük görselleri optimize edin ve boyutlarını küçültün.\n${specificRecommendations}${largeImages.length > 3 ? '\n• ...ve diğer görseller' : ''}`, 
        impact: 'high', 
        difficulty: 'orta', 
        example: '<img src="optimized-image.webp" width="800" height="600" alt="Açıklama" loading="lazy">', 
        explanation: 'Büyük boyutlu görseller, sayfa yüklenme süresini artırır, bant genişliği tüketir ve özellikle mobil cihazlarda kullanıcı deneyimini olumsuz etkiler. Görselleri modern formatlara dönüştürmek ve uygun boyutlara küçültmek, sayfa performansını önemli ölçüde iyileştirebilir.', 
        reference: 'https://web.dev/use-imagemin-to-compress-images/', 
        category: 'Performance' 
      });
    }
    
    if (unoptimizedFormatCount > 0) {
      issues.push({ 
        type: 'info', 
        field: 'image-formats', 
        message: `${unoptimizedFormatCount} adet görsel modern formatlara (WebP/AVIF) dönüştürülebilir.`, 
        suggestion: 'JPEG, PNG ve GIF formatındaki görselleri WebP veya AVIF formatlarına dönüştürün.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '<picture>\n  <source srcset="image.avif" type="image/avif">\n  <source srcset="image.webp" type="image/webp">\n  <img src="image.jpg" alt="Açıklama" width="800" height="600">\n</picture>', 
        explanation: 'WebP ve AVIF gibi yeni nesil görsel formatları, JPEG ve PNG formatlarına göre %25-35 daha küçük dosya boyutu sağlar ve aynı kalitede görsel sunar. Bu, sayfa yükleme süresini kısaltır ve kullanıcı deneyimini iyileştirir.', 
        reference: 'https://web.dev/serve-images-webp/', 
        category: 'Performance' 
      });
    }
    
    if (missingDimensionsCount > 0) {
      issues.push({ 
        type: 'warning', 
        field: 'image-dimensions', 
        message: `${missingDimensionsCount} adet görsel width ve height özelliklerine sahip değil.`, 
        suggestion: 'Tüm görsellere width ve height özellikleri ekleyin.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<img src="gorsel.jpg" width="800" height="600" alt="Açıklama">', 
        explanation: 'Görsellere width ve height özellikleri eklemek, tarayıcının daha sayfa yüklenirken görsel için gerekli alanı ayırmasını sağlar. Bu, görseller yüklendiğinde sayfa öğelerinin kaymasını (layout shift) önler ve Cumulative Layout Shift (CLS) metriğini iyileştirir.', 
        reference: 'https://web.dev/optimize-cls/#images-without-dimensions', 
        category: 'Performance' 
      });
    }
    
    if (missingAltCount > 0) {
      issues.push({ 
        type: 'warning', 
        field: 'image-alt', 
        message: `${missingAltCount} adet görsel alt özelliğine sahip değil.`, 
        suggestion: 'Tüm görsellere açıklayıcı alt özellikleri ekleyin.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<img src="gorsel.jpg" alt="Ürün fotoğrafı: Kırmızı spor ayakkabı">', 
        explanation: 'Alt özellikleri, erişilebilirlik için kritik öneme sahiptir. Görme engelli kullanıcılar için ekran okuyucular bu metinleri okur. Ayrıca, görsel yüklenemediğinde veya Google Görseller gibi arama motorlarında da alt metinleri kullanılır.', 
        reference: 'https://web.dev/image-alt/', 
        category: 'Accessibility' 
      });
    }
    
    if (nonResponsiveCount > 0) {
      issues.push({ 
        type: 'info', 
        field: 'responsive-images', 
        message: `${nonResponsiveCount} adet büyük görsel srcset özelliği kullanmıyor.`, 
        suggestion: 'Büyük görseller için responsive srcset özelliği kullanın.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '<img src="gorsel.jpg" srcset="gorsel-small.jpg 400w, gorsel.jpg 800w, gorsel-large.jpg 1200w" sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px" alt="Açıklama">', 
        explanation: 'srcset özelliği, farklı ekran boyutları ve piksel yoğunlukları için farklı görsel kaynaklarını belirtmenizi sağlar. Bu sayede mobil cihazlar daha küçük görselleri indirebilir ve bant genişliği tasarrufu sağlanabilir.', 
        reference: 'https://web.dev/serve-responsive-images/', 
        category: 'Performance' 
      });
    }
    
    if (oversizedCount > 0) {
      issues.push({ 
        type: 'warning', 
        field: 'oversized-images', 
        message: `${oversizedCount} adet görsel, görüntülendiğinden çok daha büyük boyutlara sahip.`, 
        suggestion: 'Görselleri görüntülenecekleri boyutlara uygun olarak yeniden boyutlandırın.', 
        impact: 'high', 
        difficulty: 'orta', 
        example: '<!-- Konteyner 300px genişliğinde ise -->\n<img src="600px-genisliginde-optimize-edilmis.jpg" width="300" height="200">', 
        explanation: 'Bir görsel, görüntülendiği boyuttan çok daha büyük olduğunda (örneğin 300px genişliğinde bir alanda 1200px genişliğinde bir görsel), kullanıcılar gereksiz yere büyük dosyalar indirir. Her görseli, görüntüleneceği maksimum boyuta uygun olarak optimize edin.', 
        reference: 'https://web.dev/uses-responsive-images/', 
        category: 'Performance' 
      });
    }
    
    if (highDensityCount > 0) {
      issues.push({ 
        type: 'info', 
        field: 'high-density', 
        message: `${highDensityCount} adet büyük görsel için yüksek çözünürlüklü ekran desteği eksik.`, 
        suggestion: 'Retina ve yüksek DPI ekranlar için srcset veya @2x görselleri ekleyin.', 
        impact: 'low', 
        difficulty: 'orta', 
        example: '<img src="gorsel.jpg" srcset="gorsel.jpg 1x, gorsel@2x.jpg 2x" alt="Açıklama">', 
        explanation: 'Yüksek çözünürlüklü ekranlarda (Retina gibi) normal görseller bulanık görünebilir. srcset özelliği ile piksel yoğunluğu oranlarını (1x, 2x) belirterek, bu ekranlarda daha keskin görseller sunabilirsiniz.', 
        reference: 'https://web.dev/codelab-serve-images-correct-dimensions/', 
        category: 'User Experience' 
      });
    }
    
    // Check overall image count for page size concerns
    if (totalImages > 15) {
      issues.push({ 
        type: 'info', 
        field: 'image-count', 
        message: `Sayfada ${totalImages} adet görsel bulunmakta, bu sayfa yükleme süresini etkileyebilir.`, 
        suggestion: 'Gerekli olmayan görselleri kaldırın veya lazy loading kullanın.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '<img src="gorsel.jpg" loading="lazy" alt="Açıklama">', 
        explanation: 'Çok sayıda görsel, HTTP isteklerini artırır ve sayfa yükleme süresini uzatır. Görsellerin sayısını azaltmak, sıkıştırmak ve lazy loading uygulamak sayfa performansını iyileştirir.', 
        reference: 'https://web.dev/fast/#optimize-your-images', 
        category: 'Performance' 
      });
    }
  }
  
  // Check for proper image optimization success
  if (totalImages > 0 && largeImagesCount === 0 && missingDimensionsCount === 0) {
    successes.push({ 
      field: 'img-optimized', 
      message: 'Görseller boyut açısından iyi optimize edilmiş.', 
      impact: 'high positive' 
    });
  }
  
  return { issues, successes };
}

// Helper function to estimate container width of an image
function getContainerWidth(imgEl: any, $: CheerioAPI): number {
  let container = imgEl.parent();
  let width = 0;
  
  // Try to find a parent with specified width
  for (let i = 0; i < 3; i++) { // Check up to 3 levels up
    const style = container.attr('style') || '';
    const widthMatch = style.match(/width\s*:\s*(\d+)px/i);
    
    if (widthMatch) {
      width = parseInt(widthMatch[1], 10);
      break;
    }
    
    // Check for bootstrap-like classes
    const classes = container.attr('class') || '';
    if (classes.includes('col-')) {
      if (classes.includes('col-12') || classes.includes('col-md-12')) width = 1200; // Estimate
      else if (classes.includes('col-8') || classes.includes('col-md-8')) width = 800; // Estimate
      else if (classes.includes('col-6') || classes.includes('col-md-6')) width = 600; // Estimate
      else if (classes.includes('col-4') || classes.includes('col-md-4')) width = 400; // Estimate
      
      if (width > 0) break;
    }
    
    container = container.parent();
  }
  
  return width;
}

function analyzeAssets($: CheerioAPI, html: string): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // HTML size analysis
  const htmlSize = Buffer.byteLength(html, 'utf8');
  const htmlSizeKB = Math.round(htmlSize / 1024);
  
  // CSS analysis
  const cssLinks = $('link[rel="stylesheet"]');
  const cssFiles = cssLinks.length;
  const inlineStyles = $('style').length;
  const totalCSSResources = cssFiles + inlineStyles;
  
  // Detect render-blocking CSS
  const renderBlockingCSS = cssLinks.filter((_, el) => {
    const media = $(el).attr('media');
    const isAsync = $(el).attr('media') === 'print' && $(el).attr('onload');
    return !media || media.includes('screen') || media.includes('all') && !isAsync;
  }).length;
  
  // JS analysis
  const scriptTags = $('script[src]');
  const jsFiles = scriptTags.length;
  const inlineScripts = $('script').not('[src]').length;
  const totalJSResources = jsFiles + inlineScripts;
  
  // Detect render-blocking JS
  const renderBlockingJS = scriptTags.filter((_, el) => {
    return !$(el).attr('async') && !$(el).attr('defer');
  }).length;
  
  // Modern JS module usage
  const esModules = $('script[type="module"]').length;
  
  // Font analysis
  const fontLinks = $('link[href*=".woff"], link[href*=".woff2"], link[href*=".ttf"], link[href*=".otf"], link[href*="fonts.googleapis.com"]');
  const fontFiles = fontLinks.length;
  const fontPreloads = $('link[rel="preload"][as="font"]').length;
  const fontDisplayUsage = html.includes('font-display:') || html.includes('font-display=');
  
  // Analyze third-party resources
  const thirdPartyDomains = new Set();
  const firstPartyDomains = new Set();
  const resourceUrls: string[] = [];
  
  // Extract host from current URL or use a placeholder
  const currentHost = 'example.com'; // This should be dynamically determined in a real implementation
  
  // Process all external resources
  $('link[href], script[src], img[src], iframe[src], source[src]').each((_, el) => {
    const url = $(el).attr('href') || $(el).attr('src') || '';
    if (!url || url.startsWith('data:') || url.startsWith('#')) return;
    
    resourceUrls.push(url);
    
    try {
      let host;
      if (url.startsWith('//')) {
        host = new URL(`https:${url}`).host;
      } else if (url.startsWith('http')) {
        host = new URL(url).host;
      } else {
        // Relative URL, considered first-party
        firstPartyDomains.add(currentHost);
        return;
      }
      
      if (host === currentHost || host.endsWith(`.${currentHost}`)) {
        firstPartyDomains.add(host);
      } else {
        thirdPartyDomains.add(host);
      }
    } catch (e) {
      // URL parsing error, ignore
    }
  });
  
  // Image analysis
  const images = $('img');
  const imageCount = images.length;
  const lazyLoadedImages = $('img[loading="lazy"]').length;
  
  // Resource hints analysis
  const preloads = $('link[rel="preload"]').length;
  const prefetches = $('link[rel="prefetch"]').length;
  const preconnects = $('link[rel="preconnect"]').length;
  const dnsPrefetches = $('link[rel="dns-prefetch"]').length;
  
  // Check for minification indicators
  const potentiallyUnminifiedJS = scriptTags.filter((_, el) => {
    const src = $(el).attr('src') || '';
    return !!(src && !src.includes('.min.js') && !src.includes('dist') && 
           !src.includes('bundle') && !src.includes('production'));
  }).length;

  const potentiallyUnminifiedCSS = cssLinks.filter((_, el) => {
    const href = $(el).attr('href') || '';
    return (
      !!href &&
      !href.includes('.min.css') &&
      !href.includes('dist') &&
      !href.includes('bundle') &&
      !href.includes('production')
    );
  }).length;
  
  // Analysis output
  
  // 1. HTML Size Analysis
  if (htmlSize <= 1024 * 100) { // 100KB
    successes.push({ 
      field: 'html-size', 
      message: `HTML boyutu oldukça iyi (${htmlSizeKB}KB).`, 
      impact: 'high positive' 
    });
  } else if (htmlSize <= 1024 * 200) { // 200KB
    successes.push({ 
      field: 'html-size', 
      message: `HTML boyutu makul düzeyde (${htmlSizeKB}KB).`, 
      impact: 'medium positive' 
    });
  } else if (htmlSize <= 1024 * 400) { // 400KB
    issues.push({ 
      type: 'info', 
      field: 'html-size', 
      message: `HTML boyutu biraz büyük (${htmlSizeKB}KB).`, 
      suggestion: 'HTML içeriğini optimize edin, gereksiz markup\'ı azaltın.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<!-- HTML içeriğini sadeleştirin, yorum ve gereksiz boşlukları kaldırın -->', 
      explanation: 'Büyük HTML boyutu, tarayıcının HTML\'i ayrıştırma ve işleme süresini uzatır. Bu, First Contentful Paint (FCP) ve Time to Interactive (TTI) metriklerini olumsuz etkiler. HTML sıkıştırma, gereksiz yorumların ve boşlukların kaldırılması, büyük veri yapılarının ayrı dosyalara taşınması gibi yöntemlerle HTML boyutu azaltılabilir.', 
      reference: 'https://web.dev/reduce-the-scope-and-complexity-of-style-calculations/', 
      category: 'Performance' 
    });
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'html-size', 
      message: `HTML boyutu çok büyük (${htmlSizeKB}KB).`, 
      suggestion: 'HTML içeriğini önemli ölçüde optimize edin, gereksiz markup\'ı kaldırın, içeriği parçalara bölün.', 
      impact: 'high', 
      difficulty: 'orta', 
      example: '<!-- Büyük listeleri sayfalara bölün, gereksiz nesting\'i azaltın -->', 
      explanation: 'Çok büyük HTML belgeleri, özellikle mobil cihazlarda yavaş yüklenir ve işlenir. Bu, First Paint, First Contentful Paint (FCP) ve Time to Interactive (TTI) metriklerini ciddi şekilde olumsuz etkiler. HTML\'i parçalara bölmek, gereksiz DOM öğelerini kaldırmak ve dinamik yükleme teknikleri kullanmak, kullanıcı deneyimini önemli ölçüde iyileştirebilir.', 
      reference: 'https://web.dev/dom-size/', 
      category: 'Performance' 
    });
  }
  
  // 2. CSS Analysis
  if (cssFiles <= 5) {
    successes.push({ 
      field: 'css-count', 
      message: `CSS dosya sayısı ideal (${cssFiles}).`, 
      impact: 'high positive' 
    });
  } else if (cssFiles <= 10) {
    successes.push({ 
      field: 'css-count', 
      message: `CSS dosya sayısı makul düzeyde (${cssFiles}).`, 
      impact: 'medium positive' 
    });
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'css-count', 
      message: `Çok fazla CSS dosyası var (${cssFiles}).`, 
      suggestion: 'CSS dosyalarını birleştirin, HTTP/2 sunucu kullanıyorsanız bile birleştirme genellikle faydalıdır.', 
      impact: 'high', 
      difficulty: 'orta', 
      example: '<!-- Birden fazla CSS dosyası yerine -->\n<link rel="stylesheet" href="combined.min.css">', 
      explanation: 'Fazla sayıda CSS dosyası, her biri için ayrı HTTP isteği yapılmasına neden olur. Bu, ek bağlantı kurma süresi ve gecikme ekler. HTTP/2 protokolü bu sorunu kısmen azaltsa da, dosyaları birleştirmek ve minify etmek genellikle daha iyi performans sağlar. Özellikle yüksek gecikmeli bağlantılarda, fazla HTTP isteği olumsuz etki yaratır.', 
      reference: 'https://web.dev/reduce-network-payloads-using-text-compression/', 
      category: 'Performance' 
    });
  }
  
  if (renderBlockingCSS > 0) {
    issues.push({ 
      type: 'info', 
      field: 'render-blocking-css', 
      message: `${renderBlockingCSS} adet render-blocking CSS kaynağı tespit edildi.`, 
      suggestion: 'Kritik CSS\'i inline olarak ekleyin ve geri kalanı asenkron yükleyin.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<style>\n  /* Kritik CSS buraya */\n</style>\n<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">\n<noscript><link rel="stylesheet" href="styles.css"></noscript>', 
      explanation: 'Render-blocking CSS dosyaları, tarayıcının sayfayı render etmeden önce yüklenmesini ve işlenmesini beklemesine neden olur. Bu, First Contentful Paint (FCP) metriğini olumsuz etkiler. Kritik CSS\'i inline olarak eklemek ve geri kalan CSS\'i asenkron yüklemek, sayfanın daha hızlı render edilmesini sağlar.', 
      reference: 'https://web.dev/extract-critical-css/', 
      category: 'Performance' 
    });
  } else if (cssFiles > 0) {
    successes.push({ 
      field: 'render-blocking-css', 
      message: 'Render-blocking CSS kaynağı tespit edilmedi.', 
      impact: 'high positive' 
    });
  }
  
  // 3. JavaScript Analysis
  if (jsFiles <= 5) {
    successes.push({ 
      field: 'js-count', 
      message: `JavaScript dosya sayısı ideal (${jsFiles}).`, 
      impact: 'high positive' 
    });
  } else if (jsFiles <= 10) {
    successes.push({ 
      field: 'js-count', 
      message: `JavaScript dosya sayısı makul düzeyde (${jsFiles}).`, 
      impact: 'medium positive' 
    });
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'js-count', 
      message: `Çok fazla JavaScript dosyası var (${jsFiles}).`, 
      suggestion: 'JavaScript dosyalarını birleştirin ve ihtiyaç olduğunda yükleyin.', 
      impact: 'high', 
      difficulty: 'orta', 
      example: '<!-- Çoklu script dosyaları yerine -->\n<script src="combined.min.js" defer></script>', 
      explanation: 'Fazla sayıda JavaScript dosyası, sayfa yükleme performansını olumsuz etkiler. Her dosya için ayrı HTTP isteği ve parse süresi gerekir. Dosyaları birleştirmek ve minify etmek, toplam yükleme süresini ve parse süresini azaltır. Ayrıca, code splitting ve lazy loading kullanarak, yalnızca gerektiğinde yüklenecek şekilde optimize edebilirsiniz.', 
      reference: 'https://web.dev/apply-instant-loading-with-prpl/', 
      category: 'Performance' 
    });
  }
  
  if (renderBlockingJS > 0) {
    issues.push({ 
      type: 'warning', 
      field: 'render-blocking-js', 
      message: `${renderBlockingJS} adet render-blocking JavaScript kaynağı tespit edildi.`, 
      suggestion: 'JavaScript dosyalarına async veya defer özelliği ekleyin.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<script src="app.js" defer></script>\n<!-- veya -->\n<script src="analytics.js" async></script>', 
      explanation: 'Render-blocking JavaScript dosyaları, tarayıcının sayfayı render etmesini geciktirir. \'defer\' özelliği, script\'in HTML parsing bittikten sonra yürütülmesini sağlar. \'async\' özelliği, script\'in indirildiği anda yürütülmesini sağlar. Kritik olmayan scriptler için bu özellikleri kullanmak, First Contentful Paint (FCP) ve Time to Interactive (TTI) metriklerini önemli ölçüde iyileştirir.', 
      reference: 'https://web.dev/render-blocking-resources/', 
      category: 'Performance' 
    });
  } else if (jsFiles > 0) {
    successes.push({ 
      field: 'js-loading', 
      message: 'JavaScript kaynakları düzgün şekilde yükleniyor (async/defer).', 
      impact: 'high positive' 
    });
  }
  
  if (esModules > 0) {
    successes.push({ 
      field: 'es-modules', 
      message: 'Modern JavaScript modülleri (ES Modules) kullanılıyor.', 
      impact: 'medium positive' 
    });
  }
  
  // 4. Font Analysis
  if (fontFiles === 0) {
    successes.push({ 
      field: 'font-count', 
      message: 'Özel font kullanılmıyor, bu performansı olumlu etkiler.', 
      impact: 'medium positive' 
    });
  } else if (fontFiles <= 2) {
    successes.push({ 
      field: 'font-count', 
      message: `Font dosya sayısı ideal (${fontFiles}).`, 
      impact: 'medium positive' 
    });
  } else if (fontFiles <= 5) {
    successes.push({ 
      field: 'font-count', 
      message: `Font dosya sayısı makul düzeyde (${fontFiles}).`, 
      impact: 'low positive' 
    });
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'font-count', 
      message: `Çok fazla font dosyası var (${fontFiles}).`, 
      suggestion: 'Font ailelerini ve varyasyonlarını sınırlandırın.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '/* 5+ font yerine 2-3 font kullanın */\n/* Sadece gerçekten ihtiyaç duyulan font ağırlıklarını ekleyin */', 
      explanation: 'Çok sayıda font dosyası, sayfa yükleme performansını olumsuz etkiler ve Largest Contentful Paint (LCP) süresini uzatır. Her font dosyası indirme zamanı ekler ve özellikle yavaş bağlantılarda kullanıcı deneyimini bozar. Font varyasyonlarını (light, regular, bold, italic vb.) sınırlandırmak ve variable font teknolojisini kullanmak, performansı iyileştirebilir.', 
      reference: 'https://web.dev/optimize-webfont-loading/', 
      category: 'Performance' 
    });
  }
  
  if (fontDisplayUsage) {
    successes.push({ 
      field: 'font-display', 
      message: 'font-display kullanımı tespit edildi, bu font yükleme davranışını optimize eder.', 
      impact: 'medium positive' 
    });
  } else if (fontFiles > 0) {
    issues.push({ 
      type: 'info', 
      field: 'font-display', 
      message: 'font-display özelliği kullanılmıyor.', 
      suggestion: 'Font tanımlarına font-display: swap; veya font-display: optional; ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '@font-face {\n  font-family: \'MyFont\';\n  src: url(\'myfont.woff2\') format(\'woff2\');\n  font-display: swap;\n}', 
      explanation: 'font-display özelliği, tarayıcıya fontlar yüklenirken nasıl davranması gerektiğini söyler. \'swap\' değeri, font yüklenene kadar sistem fontlarının kullanılmasını sağlar. Bu, içeriğin hemen görüntülenmesini sağlar ve Cumulative Layout Shift (CLS) ve Flash of Invisible Text (FOIT) sorunlarını önler.', 
      reference: 'https://web.dev/font-display/', 
      category: 'Performance' 
    });
  }
  
  if (fontPreloads > 0) {
    successes.push({ 
      field: 'font-preload', 
      message: 'Font preloading kullanılıyor, bu font yükleme performansını artırır.', 
      impact: 'medium positive' 
    });
  } else if (fontFiles > 0) {
    issues.push({ 
      type: 'info', 
      field: 'font-preload', 
      message: 'Font preloading kullanılmıyor.', 
      suggestion: 'Kritik fontlar için preload direktifi ekleyin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>', 
      explanation: 'Font preloading, kritik fontların daha erken keşfedilmesini ve indirilmesini sağlar. Bu, özellikle CSS\'in işlenmesini beklemeden fontların indirilmesini sağlayarak, font yükleme performansını iyileştirir ve Largest Contentful Paint (LCP) süresini kısaltabilir.', 
      reference: 'https://web.dev/preload-critical-assets/', 
      category: 'Performance' 
    });
  }
  
  // 5. Third Party Resources Analysis
  const thirdPartyCount = thirdPartyDomains.size;
  if (thirdPartyCount === 0) {
    successes.push({ 
      field: 'third-party', 
      message: 'Üçüncü parti kaynak kullanılmıyor, bu performansı olumlu etkiler.', 
      impact: 'high positive' 
    });
  } else if (thirdPartyCount <= 3) {
    successes.push({ 
      field: 'third-party', 
      message: `Üçüncü parti kaynak sayısı makul düzeyde (${thirdPartyCount}).`, 
      impact: 'medium positive' 
    });
  } else if (thirdPartyCount <= 7) {
    issues.push({ 
      type: 'info', 
      field: 'third-party', 
      message: `${thirdPartyCount} farklı üçüncü parti domain'den kaynak yükleniyor.`, 
      suggestion: 'Üçüncü parti kaynakları sınırlandırın ve gerekli olanları asenkron yükleyin.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<script src="analytics.js" async defer></script>', 
      explanation: 'Çok sayıda üçüncü parti kaynak, sayfa yükleme performansını olumsuz etkiler. Her üçüncü parti domain için DNS çözümleme, TCP bağlantısı ve TLS anlaşması gerekir. Bu, özellikle yavaş bağlantılarda kullanıcı deneyimini bozar. Üçüncü parti scriptlerini defer veya async olarak yüklemek ve kritik olmayan kaynakları lazy load etmek, performansı iyileştirebilir.', 
      reference: 'https://web.dev/efficiently-load-third-party-javascript/', 
      category: 'Performance' 
    });
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'third-party', 
      message: `Çok fazla üçüncü parti domain'den kaynak yükleniyor (${thirdPartyCount}).`, 
      suggestion: 'Üçüncü parti kaynakları azaltın ve host-limit uygulayın.', 
      impact: 'high', 
      difficulty: 'zor', 
      example: '<!-- Gereksiz üçüncü parti script\'leri kaldırın -->\n<!-- Gereklileri self-host edin veya asenkron yükleyin -->', 
      explanation: 'Çok sayıda üçüncü parti kaynağın yüklenmesi, sayfa performansını ciddi şekilde etkileyebilir. Bu kaynaklar genellikle render-blocking olur, tarayıcı ana thread\'ini bloke edebilir ve Main Thread çalışma süresini artırabilir. Ayrıca her domain için ek bağlantı kurulumu gerekir. Üçüncü parti kaynakları konsolide etmek, kritik olmayanları kaldırmak veya lazy load etmek, Core Web Vitals metriklerini önemli ölçüde iyileştirebilir.', 
      reference: 'https://web.dev/third-party-summary/', 
      category: 'Performance' 
    });
  }
  
  // 6. Resource Hints Analysis
  const usesResourceHints = preconnects > 0 || preloads > 0 || dnsPrefetches > 0 || prefetches > 0;
  
  if (usesResourceHints) {
    successes.push({ 
      field: 'resource-hints', 
      message: 'Resource hints (preconnect/preload/prefetch) kullanılıyor.', 
      impact: 'medium positive' 
    });
  } else if (resourceUrls.length > 5) {
    issues.push({ 
      type: 'info', 
      field: 'resource-hints', 
      message: 'Resource hints kullanılmıyor.', 
      suggestion: 'Kritik kaynaklar için preload ve önemli domainler için preconnect direktifleri ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="preload" href="critical.css" as="style">', 
      explanation: 'Resource hints, tarayıcıya hangi kaynakları önceliklendireceğini söyler. Preconnect, bir domain ile erken bağlantı kurulmasını sağlar. Preload, kritik kaynakların erken indirilmesini sağlar. DNS-prefetch, DNS çözümlemesini hızlandırır. Bu optimizasyonlar, özellikle kritik render yolu kaynaklarının daha hızlı yüklenmesini sağlayarak First Contentful Paint (FCP) ve Largest Contentful Paint (LCP) metriklerini iyileştirebilir.', 
      reference: 'https://web.dev/preconnect-and-dns-prefetch/', 
      category: 'Performance' 
    });
  }
  
  // 7. Minification Analysis
  if (potentiallyUnminifiedJS > 0) {
    issues.push({ 
      type: 'info', 
      field: 'js-minification', 
      message: `${potentiallyUnminifiedJS} adet JavaScript dosyası minify edilmemiş olabilir.`, 
      suggestion: 'Tüm JavaScript dosyalarını minify edin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<!-- script.js yerine -->\n<script src="script.min.js"></script>', 
      explanation: 'Minify edilmemiş JavaScript dosyaları, gereksiz boşluklar, yorumlar ve uzun değişken adları içerir. Minification, dosya boyutunu %30-40 oranında azaltabilir. Bu, indirme süresini kısaltır ve JavaScript parse süresini azaltır. Tercihen Terser, UglifyJS veya yapı araçlarınızın (webpack, rollup, vb.) minification özelliklerini kullanabilirsiniz.', 
      reference: 'https://web.dev/unminified-javascript/', 
      category: 'Performance' 
    });
  }
  
  if (potentiallyUnminifiedCSS > 0) {
    issues.push({ 
      type: 'info', 
      field: 'css-minification', 
      message: `${potentiallyUnminifiedCSS} adet CSS dosyası minify edilmemiş olabilir.`, 
      suggestion: 'Tüm CSS dosyalarını minify edin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<!-- styles.css yerine -->\n<link rel="stylesheet" href="styles.min.css">', 
      explanation: 'Minify edilmemiş CSS dosyaları, gereksiz boşluklar, yorumlar ve tekrarlayan tanımlamalar içerir. Minification, dosya boyutunu %25-30 oranında azaltabilir. Bu, indirme süresini kısaltır ve CSS parse süresini azaltır. Tercihen cssnano, clean-css veya yapı araçlarınızın minification özelliklerini kullanabilirsiniz.', 
      reference: 'https://web.dev/unminified-css/', 
      category: 'Performance' 
    });
  }
  
  // 8. Image Loading Analysis
  if (imageCount > 5 && lazyLoadedImages === 0) {
    issues.push({ 
      type: 'info', 
      field: 'lazy-loading', 
      message: `${imageCount} görsel var ancak lazy loading kullanılmıyor.`, 
      suggestion: 'Görünür alan dışındaki görsellere lazy loading ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<img src="image.jpg" loading="lazy" alt="Açıklama">', 
      explanation: 'Lazy loading, görünür alan dışındaki görsellerin yüklenmesini erteleyerek, sayfa yükleme süresini ve veri kullanımını azaltır. Modern tarayıcılar, native lazy loading özelliğini destekler (loading="lazy"). Bu özellik, özellikle çok sayıda görsel içeren uzun sayfalarda önemli bir performans artışı sağlar.', 
      reference: 'https://web.dev/browser-level-image-lazy-loading/', 
      category: 'Performance' 
    });
  } else if (imageCount > 5 && lazyLoadedImages > 0) {
    successes.push({ 
      field: 'lazy-loading', 
      message: 'Görsellerde lazy loading kullanılıyor.', 
      impact: 'medium positive' 
    });
  }
  
  // 9. Overall Asset Optimization
  if (cssFiles <= 5 && jsFiles <= 5 && fontFiles <= 3 && htmlSizeKB <= 100 && thirdPartyCount <= 3) {
    successes.push({ 
      field: 'overall-optimization', 
      message: 'Sayfadaki tüm varlıklar (assets) iyi optimize edilmiş.', 
      impact: 'high positive' 
    });
  } else if ((cssFiles > 10 || jsFiles > 10 || fontFiles > 5 || htmlSizeKB > 200 || thirdPartyCount > 7) && renderBlockingCSS + renderBlockingJS > 5) {
    issues.push({ 
      type: 'warning', 
      field: 'overall-optimization', 
      message: 'Sayfa varlıkları (assets) optimize edilmemiş.', 
      suggestion: 'Render-blocking kaynakları azaltın, kaynakları birleştirin ve minify edin.', 
      impact: 'high', 
      difficulty: 'zor', 
      example: '1. Kritik CSS\'i inline ekleyin\n2. Render-blocking JS\'leri defer/async yapın\n3. Üçüncü parti kaynakları sınırlandırın\n4. Kaynakları birleştirin ve minify edin', 
      explanation: 'Sayfanızdaki varlıkların sayısı ve yapılandırması, Core Web Vitals metriklerini önemli ölçüde etkiler. Kritik render yolunu optimize etmek, kaynakları önceliklendirmek ve gereksiz kaynakları ertelemek veya kaldırmak, sayfanın yükleme ve etkileşim süresini önemli ölçüde iyileştirebilir. Bu optimizasyonlar, özellikle mobil cihazlarda ve yavaş bağlantılarda kritik öneme sahiptir.', 
      reference: 'https://web.dev/fast/#optimize-your-third-party-resources', 
      category: 'Performance' 
    });
  }
  
  // 10. Modern Web Optimizations
  const modernOptimizations = [
    { feature: 'HTTP/2', detected: html.includes('http2') || html.includes('h2') },
    { feature: 'WebP', detected: html.includes('.webp') },
    { feature: 'AVIF', detected: html.includes('.avif') },
    { feature: 'ES Modules', detected: esModules > 0 },
    { feature: 'Font preloading', detected: fontPreloads > 0 },
    { feature: 'Resource hints', detected: usesResourceHints },
    { feature: 'Native lazy loading', detected: lazyLoadedImages > 0 }
  ];
  
  const detectedModernOptimizations = modernOptimizations.filter(opt => opt.detected);
  
  if (detectedModernOptimizations.length >= 4) {
    successes.push({ 
      field: 'modern-techniques', 
      message: `Modern web optimizasyon teknikleri kullanılıyor: ${detectedModernOptimizations.map(o => o.feature).join(', ')}.`, 
      impact: 'high positive' 
    });
  } else if (detectedModernOptimizations.length >= 1) {
    successes.push({ 
      field: 'modern-techniques', 
      message: `Bazı modern web optimizasyon teknikleri kullanılıyor: ${detectedModernOptimizations.map(o => o.feature).join(', ')}.`, 
      impact: 'medium positive' 
    });
  } else {
    issues.push({ 
      type: 'info', 
      field: 'modern-techniques', 
      message: 'Modern web optimizasyon teknikleri kullanılmıyor.', 
      suggestion: 'WebP/AVIF formatları, HTTP/2, resource hints gibi modern teknikleri kullanmayı değerlendirin.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<picture>\n  <source srcset="image.webp" type="image/webp">\n  <img src="image.jpg" alt="Açıklama">\n</picture>', 
      explanation: 'Modern web teknolojileri, daha iyi performans ve kullanıcı deneyimi sağlar. WebP/AVIF görselleri %25-50 daha küçüktür, HTTP/2 çoklu istek gönderimini optimize eder, ES Modules daha verimli JavaScript yüklemesi sağlar. Bu teknikleri kullanmak, Core Web Vitals metriklerini iyileştirerek SEO ve kullanıcı deneyimini olumlu etkiler.', 
      reference: 'https://web.dev/vitals/', 
      category: 'Performance' 
    });
  }
  
  return { issues, successes };
}

function analyzeDuplicateMeta($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Track different types of meta tags
  const metaNames: Record<string, Array<{content: string, index: number}>> = {};
  const metaProperties: Record<string, Array<{content: string, index: number}>> = {};
  const metaHttpEquiv: Record<string, Array<{content: string, index: number}>> = {};
  
  // Track open graph and twitter card meta tags separately
  const openGraphTags: string[] = [];
  const twitterCardTags: string[] = [];
  
  // Important meta tag presence tracking
  let hasDescription = false;
  let hasViewport = false;
  let hasRobots = false;
  let hasCanonical = false;
  let hasCharset = false;
  
  // Find all meta tags
  $('meta').each((index, el) => {
    const meta = $(el);
    const name = meta.attr('name')?.toLowerCase();
    const property = meta.attr('property')?.toLowerCase();
    const httpEquiv = meta.attr('http-equiv')?.toLowerCase();
    const content = meta.attr('content') || '';
    
    // Track meta name tags
    if (name) {
      if (!metaNames[name]) {
        metaNames[name] = [];
      }
      metaNames[name].push({content, index});
      
      // Check important meta tags
      if (name === 'description') hasDescription = true;
      if (name === 'viewport') hasViewport = true;
      if (name === 'robots') hasRobots = true;
    }
    
    // Track meta property tags (mostly Open Graph and others)
    if (property) {
      if (!metaProperties[property]) {
        metaProperties[property] = [];
      }
      metaProperties[property].push({content, index});
      
      // Identify Open Graph tags
      if (property.startsWith('og:')) {
        openGraphTags.push(property);
      }
      
      // Identify Twitter Card tags
      if (property.startsWith('twitter:')) {
        twitterCardTags.push(property);
      }
      
      // Check for canonical in property
      if (property === 'og:url') {
        hasCanonical = true;
      }
    }
    
    // Track http-equiv tags
    if (httpEquiv) {
      if (!metaHttpEquiv[httpEquiv]) {
        metaHttpEquiv[httpEquiv] = [];
      }
      metaHttpEquiv[httpEquiv].push({content, index});
    }
    
    // Check for charset
    if (meta.attr('charset') || (httpEquiv === 'content-type' && content.includes('charset'))) {
      hasCharset = true;
    }
  });
  
  // Also check for link canonical
  const linkCanonical = $('link[rel="canonical"]');
  if (linkCanonical.length > 0) {
    hasCanonical = true;
  }
  
  // Check for title
  const titleTag = $('title');
  const hasTitle = titleTag.length > 0;
  const titleContent = titleTag.text();
  
  // 1. Check for duplicate meta name tags
  const duplicateMetaNames = Object.entries(metaNames)
    .filter(([_, instances]) => instances.length > 1)
    .map(([name, instances]) => ({
      name,
      count: instances.length,
      content: instances.map(i => i.content)
    }));
  
  // 2. Check for duplicate meta property tags
  const duplicateMetaProperties = Object.entries(metaProperties)
    .filter(([_, instances]) => instances.length > 1)
    .map(([property, instances]) => ({
      property,
      count: instances.length,
      content: instances.map(i => i.content)
    }));
  
  // 3. Check for duplicate http-equiv tags
  const duplicateHttpEquiv = Object.entries(metaHttpEquiv)
    .filter(([_, instances]) => instances.length > 1)
    .map(([httpEquiv, instances]) => ({
      httpEquiv,
      count: instances.length,
      content: instances.map(i => i.content)
    }));
  
  // 4. Check for canonical issues
  const canonicalLinks = $('link[rel="canonical"]');
  const canonicalCount = canonicalLinks.length;
  const canonicalUrl = canonicalLinks.attr('href');
  
  // 5. Check for description quality
  let descriptionIssues: string[] = [];
  if (hasDescription) {
    const description = metaNames['description'][0].content;
    if (description.length < 70) {
      descriptionIssues.push('Meta açıklaması çok kısa (70 karakterden az)');
    } else if (description.length > 160) {
      descriptionIssues.push('Meta açıklaması çok uzun (160 karakterden fazla)');
    }
    
    // Check for common SEO issues
    if (/[A-Z]{5,}/.test(description)) {
      descriptionIssues.push('Meta açıklaması büyük harflerden oluşan kelimeler içeriyor');
    }
    if (/(.)\1{4,}/.test(description)) {
      descriptionIssues.push('Meta açıklaması tekrarlanan karakterler içeriyor');
    }
    if (/\s{2,}/.test(description)) {
      descriptionIssues.push('Meta açıklaması birden fazla boşluk içeriyor');
    }
  }
  
  // 6. Check for title quality
  let titleIssues: string[] = [];
  if (hasTitle) {
    if (titleContent.length < 10) {
      titleIssues.push('Title etiketi çok kısa (10 karakterden az)');
    } else if (titleContent.length > 70) {
      titleIssues.push('Title etiketi çok uzun (70 karakterden fazla)');
    }
    
    // Check for common title issues
    if (/[A-Z]{5,}/.test(titleContent)) {
      titleIssues.push('Title etiketi büyük harflerden oluşan kelimeler içeriyor');
    }
    if (/(.)\1{4,}/.test(titleContent)) {
      titleIssues.push('Title etiketi tekrarlanan karakterler içeriyor');
    }
    if (/\s{2,}/.test(titleContent)) {
      titleIssues.push('Title etiketi birden fazla boşluk içeriyor');
    }
  }
  
  // 7. Check for viewport settings
  let viewportIssues: string[] = [];
  if (hasViewport) {
    const viewportContent = metaNames['viewport'][0].content.toLowerCase();
    if (viewportContent.includes('user-scalable=no') || viewportContent.includes('maximum-scale=1')) {
      viewportIssues.push('Viewport kullanıcı ölçeklendirmesini engelliyor - bu erişilebilirlik sorunudur');
    }
    if (!viewportContent.includes('width=device-width')) {
      viewportIssues.push('Viewport width=device-width içermiyor - responsive tasarım için gereklidir');
    }
    if (!viewportContent.includes('initial-scale=1')) {
      viewportIssues.push('Viewport initial-scale=1 içermiyor - sayfanın doğru ölçeklenmesi için önerilir');
    }
  }
  
  // 8. Check for robots directives
  let robotsIssues: string[] = [];
  if (hasRobots) {
    const robotsContent = metaNames['robots'][0].content.toLowerCase();
    if (robotsContent.includes('noindex')) {
      robotsIssues.push('Robots etiketinde noindex direktifi var - sayfa arama motorlarında indekslenmeyecek');
    }
    if (robotsContent.includes('nofollow')) {
      robotsIssues.push('Robots etiketinde nofollow direktifi var - arama motorları sayfadaki linkleri takip etmeyecek');
    }
  }
  
  // 9. Check for conflict between meta tags
  const conflicts: string[] = [];
  
  // Check for Open Graph and Twitter Card conflicts/redundancies
  if (openGraphTags.includes('og:title') && twitterCardTags.includes('twitter:title')) {
    const ogTitle = metaProperties['og:title'][0].content;
    const twitterTitle = metaProperties['twitter:title'][0].content;
    if (ogTitle !== twitterTitle) {
      conflicts.push('og:title ve twitter:title içerikleri farklı - tutarlı olmalıdır');
    }
  }
  
  if (openGraphTags.includes('og:description') && twitterCardTags.includes('twitter:description')) {
    const ogDesc = metaProperties['og:description'][0].content;
    const twitterDesc = metaProperties['twitter:description'][0].content;
    if (ogDesc !== twitterDesc) {
      conflicts.push('og:description ve twitter:description içerikleri farklı - tutarlı olmalıdır');
    }
  }
  
  // 10. Check for deprecated meta tags
  const deprecatedTags: string[] = [];
  const knownDeprecated = ['keywords', 'author', 'generator', 'revisit-after', 'rating'];
  
  knownDeprecated.forEach(tag => {
    if (metaNames[tag]) {
      deprecatedTags.push(tag);
    }
  });
  
  // 11. Check for missing important meta tags
  const missingTags: string[] = [];
  
  if (!hasTitle) missingTags.push('title');
  if (!hasDescription) missingTags.push('description');
  if (!hasViewport) missingTags.push('viewport');
  if (!hasCharset) missingTags.push('charset');
  
  // Analyze social media meta tags
  const hasSocialTags = openGraphTags.length > 0 || twitterCardTags.length > 0;
  let missingSocialTags: string[] = [];
  
  // Check for essential Open Graph tags
  if (openGraphTags.length > 0) {
    const essentialOgTags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
    essentialOgTags.forEach(tag => {
      if (!openGraphTags.includes(tag)) {
        missingSocialTags.push(tag);
      }
    });
  }
  
  // Check for essential Twitter Card tags
  if (twitterCardTags.length > 0) {
    const essentialTwitterTags = ['twitter:card'];
    essentialTwitterTags.forEach(tag => {
      if (!twitterCardTags.includes(tag)) {
        missingSocialTags.push(tag);
      }
    });
  }
  
  // Generate report
  
  // 1. Report duplicate meta name tags
  if (duplicateMetaNames.length === 0) {
    successes.push({ 
      field: 'meta-name', 
      message: 'Duplicate meta[name] etiketi yok.', 
      impact: 'medium positive' 
    });
  } else {
    let message = `Duplicate meta name etiketleri tespit edildi: ${duplicateMetaNames.map(d => d.name).join(', ')}`;
    
    // Add details for specific common meta tags
    const duplicateDetails = duplicateMetaNames.map(item => {
      return `• ${item.name}: ${item.count} adet, içerikler: "${item.content.join('", "')}"`;
    }).join('\n');
    
    issues.push({ 
      type: 'warning', 
      field: 'meta-name', 
      message: message, 
      suggestion: `Her meta name etiketi sayfada yalnızca bir kez olmalıdır. Aşağıdaki tekrarlanan etiketleri kaldırın veya birleştirin:\n\n${duplicateDetails}`, 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<meta name="description" content="Sayfanın benzersiz ve açıklayıcı açıklaması">', 
      explanation: 'Duplicate meta name etiketleri, arama motorlarının hangi içeriğin doğru olduğunu belirlemesini zorlaştırabilir. Arama motorları genellikle ilk meta etiketi değerini kullanır, ancak bu davranış tutarsız olabilir. Her meta name etiketi (özellikle description ve viewport gibi önemli etiketler) sayfada yalnızca bir kez bulunmalıdır.', 
      reference: 'https://developers.google.com/search/docs/appearance/snippet', 
      category: 'SEO' 
    });
  }
  
  // 2. Report duplicate meta property tags
  if (duplicateMetaProperties.length === 0) {
    successes.push({ 
      field: 'meta-property', 
      message: 'Duplicate meta[property] etiketi yok.', 
      impact: 'medium positive' 
    });
  } else {
    let message = `Duplicate meta property etiketleri tespit edildi: ${duplicateMetaProperties.map(d => d.property).join(', ')}`;
    
    const duplicateDetails = duplicateMetaProperties.map(item => {
      return `• ${item.property}: ${item.count} adet, içerikler: "${item.content.join('", "')}"`;
    }).join('\n');
    
    issues.push({ 
      type: 'warning', 
      field: 'meta-property', 
      message: message, 
      suggestion: `Her meta property etiketi sayfada yalnızca bir kez olmalıdır. Aşağıdaki tekrarlanan etiketleri kaldırın:\n\n${duplicateDetails}`, 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<meta property="og:title" content="Sayfa Başlığı">', 
      explanation: 'Duplicate meta property etiketleri, özellikle Open Graph ve Twitter Card meta etiketleri için, sosyal medya platformlarının içeriği nasıl yorumladığını etkileyebilir. Bu, sosyal medya paylaşımlarında yanlış veya tutarsız gösterimlere neden olabilir.', 
      reference: 'https://developers.facebook.com/docs/sharing/webmasters/', 
      category: 'Social Media' 
    });
  }
  
  // 3. Report duplicate http-equiv tags
  if (duplicateHttpEquiv.length === 0) {
    successes.push({ 
      field: 'meta-http-equiv', 
      message: 'Duplicate meta[http-equiv] etiketi yok.', 
      impact: 'low positive' 
    });
  } else {
    let message = `Duplicate meta http-equiv etiketleri tespit edildi: ${duplicateHttpEquiv.map(d => d.httpEquiv).join(', ')}`;
    
    const duplicateDetails = duplicateHttpEquiv.map(item => {
      return `• ${item.httpEquiv}: ${item.count} adet, içerikler: "${item.content.join('", "')}"`;
    }).join('\n');
    
    issues.push({ 
      type: 'warning', 
      field: 'meta-http-equiv', 
      message: message, 
      suggestion: `Her meta http-equiv etiketi sayfada yalnızca bir kez olmalıdır. Aşağıdaki tekrarlanan etiketleri kaldırın:\n\n${duplicateDetails}`, 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">', 
      explanation: 'Duplicate http-equiv etiketleri, tarayıcının sayfa hakkında çelişkili yönergeler almasına neden olabilir. Bu, beklenmeyen davranışlara ve potansiyel olarak tarayıcı uyumluluk sorunlarına yol açabilir.', 
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta', 
      category: 'HTML Standards' 
    });
  }
  
  // 4. Report canonical issues
  if (canonicalCount > 1) {
    issues.push({ 
      type: 'error', 
      field: 'canonical', 
      message: `${canonicalCount} adet canonical link tespit edildi.`, 
      suggestion: 'Sayfada yalnızca bir canonical link olmalıdır.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<link rel="canonical" href="https://www.example.com/product/unique-canonical-url">', 
      explanation: 'Birden fazla canonical link etiketi, arama motorlarının hangi URL\'nin gerçek canonical URL olduğunu belirlemesini imkansız hale getirir. Bu durum, arama motorlarının kendi kararlarını vermesine ve potansiyel olarak yanlış URL\'yi canonical olarak seçmesine neden olabilir.', 
      reference: 'https://developers.google.com/search/docs/advanced/crawling/consolidate-duplicate-urls', 
      category: 'SEO' 
    });
  } else if (canonicalCount === 1 && canonicalUrl) {
    // Check if canonical URL is empty or malformed
    if (canonicalUrl.trim() === '') {
      issues.push({ 
        type: 'warning', 
        field: 'canonical', 
        message: 'Canonical link boş bir URL içeriyor.', 
        suggestion: 'Canonical link\'e geçerli ve tam bir URL ekleyin.', 
        impact: 'high', 
        difficulty: 'kolay', 
        example: '<link rel="canonical" href="https://www.example.com/current-page">', 
        explanation: 'Boş bir canonical URL, arama motorlarının duplicate içerik sorunlarını çözmesini engeller ve rank kaybına neden olabilir.', 
        reference: 'https://developers.google.com/search/docs/advanced/crawling/consolidate-duplicate-urls', 
        category: 'SEO' 
      });
    } else if (!canonicalUrl.startsWith('http')) {
      // Relative URLs are technically allowed but might cause issues
      issues.push({ 
        type: 'info', 
        field: 'canonical', 
        message: 'Canonical link göreceli bir URL kullanıyor.', 
        suggestion: 'En iyi uygulama, canonical link için mutlak URL kullanmaktır.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<link rel="canonical" href="https://www.example.com/current-page">', 
        explanation: 'Canonical URL\'ler için göreceli yollar yerine mutlak (tam) URL\'ler kullanmak, arama motorlarının canonical URL\'yi doğru şekilde yorumlamasını sağlar. Göreceli URL\'ler çalışsa da, bazı durumlarda yanlış yorumlanabilir.', 
        reference: 'https://developers.google.com/search/docs/advanced/crawling/consolidate-duplicate-urls', 
        category: 'SEO' 
      });
    } else {
      successes.push({ 
        field: 'canonical', 
        message: 'Canonical link doğru formatta ve tek.', 
        impact: 'medium positive' 
      });
    }
  } else if (!hasCanonical) {
    issues.push({ 
      type: 'info', 
      field: 'canonical', 
      message: 'Canonical link bulunamadı.', 
      suggestion: 'Sayfaya canonical link ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<link rel="canonical" href="https://www.example.com/current-page">', 
      explanation: 'Canonical link, arama motorlarına sayfanın tercih edilen URL\'sini bildirir. Bu, duplicate içerik sorunlarını önler ve arama sıralamasını iyileştirir. Özellikle benzer içeriğe sahip sayfalar veya farklı URL\'lerden erişilebilen sayfalar için önemlidir.', 
      reference: 'https://developers.google.com/search/docs/advanced/crawling/consolidate-duplicate-urls', 
      category: 'SEO' 
    });
  }
  
  // 5. Report description issues
  if (!hasDescription) {
    issues.push({ 
      type: 'warning', 
      field: 'description', 
      message: 'Meta description etiketi bulunamadı.', 
      suggestion: 'Sayfaya açıklayıcı bir meta description ekleyin.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<meta name="description" content="Bu sayfa hakkında kısa ve etkileyici bir açıklama, 50-160 karakter arası olmalı.">', 
      explanation: 'Meta description, arama motoru sonuç sayfalarında (SERP) görüntülenen özettir. İyi bir açıklama, tıklama oranınızı (CTR) artırabilir. Description olmaması durumunda, Google genellikle sayfadan ilgili içeriği otomatik olarak çıkarır, ancak bu her zaman en etkili açıklama olmayabilir.', 
      reference: 'https://developers.google.com/search/docs/appearance/snippet', 
      category: 'SEO' 
    });
  } else if (descriptionIssues.length > 0) {
    issues.push({ 
      type: 'info', 
      field: 'description', 
      message: `Meta description kalite sorunları: ${descriptionIssues.join(', ')}`, 
      suggestion: 'Meta açıklamanızı optimize edin, ideal uzunluk 50-160 karakterdir.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<meta name="description" content="Bu makale, meta etiketlerinin SEO üzerindeki etkisini ve doğru uygulamaları açıklıyor. Kapsamlı rehberimizle meta etiketlerini optimize edin.">', 
      explanation: 'İyi bir meta description, kullanıcıların neden sayfanızı ziyaret etmeleri gerektiğini açıklamalı ve arama motorlarında tıklama oranını artırmalıdır. Çok kısa açıklamalar yetersiz bilgi sağlar, çok uzun açıklamalar ise genellikle kısaltılır. Büyük harflerden oluşan kelimeler ve gereksiz tekrarlar kullanıcı deneyimini olumsuz etkiler.', 
      reference: 'https://moz.com/learn/seo/meta-description', 
      category: 'SEO' 
    });
  } else {
    successes.push({ 
      field: 'description', 
      message: 'Meta description etiketi uygun formatta ve içerikte.', 
      impact: 'medium positive' 
    });
  }
  
  // 6. Report title issues
  if (!hasTitle) {
    issues.push({ 
      type: 'error', 
      field: 'title', 
      message: 'Title etiketi bulunamadı.', 
      suggestion: 'Sayfaya uygun bir title etiketi ekleyin.', 
      impact: 'critical', 
      difficulty: 'kolay', 
      example: '<title>Ana Başlık - Site Adı</title>', 
      explanation: 'Title etiketi, SEO için en önemli faktörlerden biridir. Arama motorları ve sosyal medya platformları bu başlığı gösterir. Title olmadan, arama motorları sitenizi doğru şekilde indeksleyemez ve kullanıcılar sonuç sayfalarında tanımlayıcı bir başlık göremez.', 
      reference: 'https://developers.google.com/search/docs/appearance/title-link', 
      category: 'SEO' 
    });
  } else if (titleIssues.length > 0) {
    issues.push({ 
      type: 'warning', 
      field: 'title', 
      message: `Title etiketi kalite sorunları: ${titleIssues.join(', ')}`, 
      suggestion: 'Title etiketini optimize edin, ideal uzunluk 50-60 karakterdir.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<title>Ürün Adı | Kategori - Site Adı</title>', 
      explanation: 'Title etiketi, arama motorlarında ve tarayıcı sekmelerinde görünen ilk içeriktir. Çok kısa başlıklar yetersiz bilgi sağlar, çok uzun başlıklar ise kesilerek görüntülenir. Başlığın sayfanın içeriğini doğru yansıtması ve anahtar kelimeler içermesi önemlidir.', 
      reference: 'https://moz.com/learn/seo/title-tag', 
      category: 'SEO' 
    });
  } else {
    successes.push({ 
      field: 'title', 
      message: 'Title etiketi uygun formatta ve içerikte.', 
      impact: 'high positive' 
    });
  }
  
  // 7. Report viewport issues
  if (!hasViewport) {
    issues.push({ 
      type: 'warning', 
      field: 'viewport', 
      message: 'Viewport meta etiketi bulunamadı.', 
      suggestion: 'Mobil uyumluluk için viewport meta etiketi ekleyin.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<meta name="viewport" content="width=device-width, initial-scale=1">', 
      explanation: 'Viewport meta etiketi, sayfanın farklı cihazlarda nasıl ölçekleneceğini belirler. Bu etiket olmadan, mobil cihazlar masaüstü görünümünü taklit etmeye çalışır ve bu durum kullanıcıların içeriği görmek için yakınlaştırması gerektiği anlamına gelir. Mobile-first indexing kullanan Google için, viewport etiketi önemli bir SEO faktörüdür.', 
      reference: 'https://developers.google.com/search/docs/appearance/responsive-web-design', 
      category: 'Mobile Optimization' 
    });
  } else if (viewportIssues.length > 0) {
    issues.push({ 
      type: 'warning', 
      field: 'viewport', 
      message: `Viewport etiketi sorunları: ${viewportIssues.join(', ')}`, 
      suggestion: 'Viewport ayarlarını düzeltin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<meta name="viewport" content="width=device-width, initial-scale=1">', 
      explanation: 'Viewport ayarlarının doğru yapılandırılması, kullanıcıların içeriği yakınlaştırma/uzaklaştırma ihtiyacı olmadan görüntülemesini sağlar. Kullanıcı ölçeklendirmesini devre dışı bırakmak (user-scalable=no veya maximum-scale=1) erişilebilirlik sorunları yaratır ve artık önerilmemektedir.', 
      reference: 'https://web.dev/responsive-web-design-basics/', 
      category: 'Mobile Optimization' 
    });
  } else {
    successes.push({ 
      field: 'viewport', 
      message: 'Viewport meta etiketi doğru ayarlarla mevcut.', 
      impact: 'medium positive' 
    });
  }
  
  // 8. Report robots issues
  if (hasRobots && robotsIssues.length > 0) {
    issues.push({ 
      type: 'info', 
      field: 'robots', 
      message: `Robots meta etiketi dikkat edilmesi gereken direktifler içeriyor: ${robotsIssues.join(', ')}`, 
      suggestion: 'Robots direktiflerini gözden geçirin, eğer bu sayfa indekslenmelidir diyorsanız noindex direktifini kaldırın.', 
      impact: 'critical', 
      difficulty: 'kolay', 
      example: '<meta name="robots" content="index, follow">', 
      explanation: 'Robots meta etiketi, arama motorlarına sayfanın nasıl indeksleneceğini ve işleneceğini söyler. noindex direktifi sayfanın arama sonuçlarında görünmesini engeller, nofollow direktifi ise arama motorlarının sayfadaki bağlantıları takip etmemesini sağlar. Bu direktiflerin kullanımı, sayfanın arama motorlarında görünürlüğünü doğrudan etkiler.', 
      reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
      category: 'SEO' 
    });
  } else if (!hasRobots) {
    // Not having a robots meta tag is actually fine - default behavior is index, follow
    successes.push({ 
      field: 'robots', 
      message: 'Robots meta etiketi bulunamadı - varsayılan olarak index, follow uygulanır.', 
      impact: 'low positive' 
    });
  } else {
    successes.push({ 
      field: 'robots', 
      message: 'Robots meta etiketi sayfa indekslemesi için engel içermiyor.', 
      impact: 'low positive' 
    });
  }
  
  // 9. Report social media meta tag issues
  if (!hasSocialTags) {
    issues.push({ 
      type: 'info', 
      field: 'social-tags', 
      message: 'Sosyal medya meta etiketleri (Open Graph, Twitter Card) bulunamadı.', 
      suggestion: 'Sosyal medya paylaşımlarını optimize etmek için Open Graph ve Twitter Card meta etiketleri ekleyin.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<meta property="og:title" content="Sayfa Başlığı">\n<meta property="og:description" content="Sayfa açıklaması">\n<meta property="og:image" content="https://example.com/image.jpg">\n<meta property="og:url" content="https://example.com/page">\n<meta name="twitter:card" content="summary_large_image">', 
      explanation: 'Sosyal medya meta etiketleri, içeriğiniz sosyal platformlarda paylaşıldığında nasıl görüneceğini kontrol eder. Bu etiketler olmadan, sosyal platformlar sayfanızdan rastgele içerik çıkarmaya çalışır, bu da ideal olmayan temsillere yol açabilir. İyi yapılandırılmış Open Graph ve Twitter Card etiketleri, sosyal paylaşımlarınızın görünürlüğünü ve tıklama oranını artırabilir.', 
      reference: 'https://ogp.me/ ve https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards', 
      category: 'Social Media' 
    });
  } else if (missingSocialTags.length > 0) {
    issues.push({ 
      type: 'info', 
      field: 'social-tags', 
      message: `Eksik sosyal medya meta etiketleri: ${missingSocialTags.join(', ')}`, 
      suggestion: 'Eksik sosyal medya meta etiketlerini ekleyin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<meta property="og:image" content="https://example.com/image.jpg">\n<meta name="twitter:card" content="summary_large_image">', 
      explanation: 'Eksiksiz bir sosyal medya meta etiket seti, içeriğinizin sosyal platformlarda nasıl görüntüleneceği üzerinde tam kontrol sağlar. Eksik etiketler, görüntüleme sorunlarına veya eksik bilgilere neden olabilir. Özellikle og:image gibi görsellerin eksikliği, içeriğinizin görsel çekiciliğini azaltır.', 
      reference: 'https://developers.facebook.com/docs/sharing/webmasters/', 
      category: 'Social Media' 
    });
  } else if (conflicts.length > 0) {
    issues.push({ 
      type: 'info', 
      field: 'social-tags', 
      message: `Sosyal medya meta etiketlerinde tutarsızlıklar: ${conflicts.join(', ')}`, 
      suggestion: 'Tutarsız meta etiketleri içeriklerini düzeltin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<meta property="og:title" content="Başlık">\n<meta name="twitter:title" content="Aynı Başlık">', 
      explanation: 'Open Graph ve Twitter Card meta etiketleri arasındaki tutarsızlıklar, içeriğinizin farklı platformlarda farklı görünmesine neden olabilir. Başlık, açıklama ve görsel gibi öğeler için tutarlı içerik sağlamak, marka bütünlüğü ve kullanıcı deneyimi açısından önemlidir.', 
      reference: 'https://developers.facebook.com/docs/sharing/webmasters/', 
      category: 'Social Media' 
    });
  } else {
    successes.push({ 
      field: 'social-tags', 
      message: 'Sosyal medya meta etiketleri (Open Graph, Twitter Card) doğru ayarlanmış.', 
      impact: 'medium positive' 
    });
  }
  
  // 10. Report deprecated meta tags
  if (deprecatedTags.length > 0) {
    issues.push({ 
      type: 'info', 
      field: 'deprecated-tags', 
      message: `Kullanımdan kaldırılmış veya etkisi azalmış meta etiketleri: ${deprecatedTags.join(', ')}`, 
      suggestion: 'Bu meta etiketlerine bağımlı olmayın, modern alternatiflere geçin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<!-- meta keywords yerine içerik optimizasyonu yapın -->', 
      explanation: 'Bu meta etiketleri ya resmi olarak kullanımdan kaldırılmış ya da modern arama motorları tarafından büyük ölçüde göz ardı edilmektedir. Örneğin, meta keywords etiketi, aşırı kullanım ve spam nedeniyle Google tarafından artık sıralama faktörü olarak kullanılmamaktadır. Etkili SEO için, sayfa içeriğini ve diğer daha önemli meta etiketlerini optimize etmek daha değerlidir.', 
      reference: 'https://developers.google.com/search/blog/2009/09/google-does-not-use-keywords-meta-tag', 
      category: 'SEO' 
    });
  }
  
  // 11. Report charset issues
  if (!hasCharset) {
    issues.push({ 
      type: 'warning', 
      field: 'charset', 
      message: 'Charset meta etiketi bulunamadı.', 
      suggestion: 'UTF-8 karakter seti belirten bir meta charset etiketi ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<meta charset="UTF-8">', 
      explanation: 'Charset meta etiketi, sayfanın hangi karakter setini kullandığını belirtir. Bu etiket olmadan, bazı tarayıcılar veya sistemler özel karakterleri yanlış görüntüleyebilir. Modern web sayfaları için UTF-8 karakter seti önerilir, çünkü neredeyse tüm dil karakterlerini destekler.', 
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-charset', 
      category: 'HTML Standards' 
    });
  } else {
    successes.push({ 
      field: 'charset', 
      message: 'Charset meta etiketi mevcut.', 
      impact: 'low positive' 
    });
  }
  
  // 12. Overall meta tags assessment
  if (missingTags.length === 0 && duplicateMetaNames.length === 0 && 
      duplicateMetaProperties.length === 0 && duplicateHttpEquiv.length === 0 && 
      canonicalCount <= 1 && descriptionIssues.length === 0 && 
      titleIssues.length === 0 && viewportIssues.length === 0 && 
      robotsIssues.length === 0) {
    
    successes.push({ 
      field: 'meta-overall', 
      message: 'Meta etiketleri genel olarak iyi yapılandırılmış.', 
      impact: 'high positive' 
    });
  } else if (missingTags.length > 2 || duplicateMetaNames.length > 1 || canonicalCount > 1 || !hasTitle) {
    // Critical meta tag issues
    issues.push({ 
      type: 'warning', 
      field: 'meta-overall', 
      message: 'Meta etiketlerinde önemli sorunlar tespit edildi.', 
      suggestion: 'Yukarıda belirtilen meta etiketi sorunlarını çözün.', 
      impact: 'high', 
      difficulty: 'orta', 
      example: '', 
      explanation: 'Meta etiketleri, arama motorlarına ve sosyal medya platformlarına sayfanız hakkında kritik bilgiler sağlar. Doğru yapılandırılmış meta etiketleri, daha iyi SEO, daha çekici SERP sonuçları ve gelişmiş sosyal medya paylaşımları anlamına gelir. Tespit edilen sorunların çözülmesi, web sitenizin görünürlüğünü ve kullanıcı etkileşimini artıracaktır.', 
      reference: 'https://developers.google.com/search/docs/advanced/structured-data/intro-structured-data', 
      category: 'SEO' 
    });
  }
  
  return { issues, successes };
}

function analyzeNoindexNofollow($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Extract all robots-related meta tags
  const generalRobots = $('meta[name="robots"]').attr('content') || '';
  const googleBot = $('meta[name="googlebot"]').attr('content') || '';
  const bingBot = $('meta[name="bingbot"]').attr('content') || '';
  const yahooBot = $('meta[name="slurp"]').attr('content') || '';
  const yandexBot = $('meta[name="yandex"]').attr('content') || '';
  
  // Extract canonical information
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || '';
  
  // Check for robots.txt references in HTML comments (limited capability)
  const hasRobotsTxtComment = $.html().includes('robots.txt');
  
  // Extract all link elements with nofollow attributes
  const allLinks = $('a[href]').length;
  const nofollowLinks = $('a[rel*="nofollow"]').length;
  const ugcLinks = $('a[rel*="ugc"]').length;
  const sponsoredLinks = $('a[rel*="sponsored"]').length;
  
  // Calculate percentage of nofollow links if there are links
  const nofollowPercentage = allLinks > 0 ? Math.round((nofollowLinks / allLinks) * 100) : 0;
  
  // Function to check directives
  function checkDirective(content: string, directive: string): boolean {
    return content.toLowerCase().includes(directive.toLowerCase());
  }
  
  // Group all robots contents for comprehensive analysis
  const allRobotsContent = [generalRobots, googleBot, bingBot, yahooBot, yandexBot].filter(Boolean);
  
  // Check for specific directives across all robots meta tags
  const hasNoindex = allRobotsContent.some(content => checkDirective(content, 'noindex'));
  const hasNofollow = allRobotsContent.some(content => checkDirective(content, 'nofollow'));
  const hasNoarchive = allRobotsContent.some(content => checkDirective(content, 'noarchive'));
  const hasNosnippet = allRobotsContent.some(content => checkDirective(content, 'nosnippet'));
  const hasNoimageindex = allRobotsContent.some(content => checkDirective(content, 'noimageindex'));
  const hasNotranslate = allRobotsContent.some(content => checkDirective(content, 'notranslate'));
  const hasUnavailableAfter = allRobotsContent.some(content => /unavailable_after:.*/.test(content));
  const hasMaxSnippet = allRobotsContent.some(content => /max-snippet:.*/.test(content));
  const hasMaxImagePreview = allRobotsContent.some(content => /max-image-preview:.*/.test(content));
  const hasMaxVideoPreview = allRobotsContent.some(content => /max-video-preview:.*/.test(content));
  const hasNone = allRobotsContent.some(content => checkDirective(content, 'none'));
  const hasAll = allRobotsContent.some(content => checkDirective(content, 'all'));
  
  // Check for conflicting directives
  const hasConflictingDirectives = (hasNoindex && allRobotsContent.some(content => checkDirective(content, 'index'))) ||
                                  (hasNofollow && allRobotsContent.some(content => checkDirective(content, 'follow')));
  
  // Check for conflict between robots directives and canonical URL
  const hasCanonicalConflict = hasNoindex && canonicalUrl && !canonicalUrl.includes('javascript:');
  
  // Different search engine specific directives
  const hasGoogleSpecific = googleBot.length > 0 && googleBot !== generalRobots;
  const hasBingSpecific = bingBot.length > 0 && bingBot !== generalRobots;
  const hasOtherEngineSpecific = (yahooBot.length > 0 && yahooBot !== generalRobots) || 
                                (yandexBot.length > 0 && yandexBot !== generalRobots);
  
  // Detect if the robot directives suggest a staging/development environment
  const isStagingEnvironment = hasNoindex && hasNofollow;
  
  // Detect if this could be a private/protected page
  const isLikelyPrivatePage = hasNoindex && $('form[method="post"], input[type="password"]').length > 0;
  
  // Extract page type hints
  const isLikelyArticle = $('article, .article, .post, .blog-post').length > 0 || 
                          $('meta[property="article:published_time"]').length > 0;
                          
  const isLikelyProductPage = $('[itemtype*="Product"], .product, #product, .product-page').length > 0 ||
                            $('.buy-now, .add-to-cart, #add-to-cart').length > 0;
                            
  const isLikelyHomepage = $('link[rel="canonical"]').attr('href')?.endsWith('/') || 
                          $('meta[property="og:type"][content="website"]').length > 0;
                          
  const isLikelySearchPage = $('form[role="search"], input[name="q"], input[name="search"]').length > 0 || 
                            window.location.href?.includes('search=') || 
                            window.location.href?.includes('query=');
                            
  const isLikelyUtilityPage = $('h1:contains("Privacy Policy"), h1:contains("Terms of Service"), h1:contains("Contact Us")').length > 0;
  
  // Analysis and Recommendations
  
  // 1. General noindex analysis
  if (hasNone) {
    issues.push({ 
      type: 'warning', 
      field: 'robots-none', 
      message: '"none" direktifi tespit edildi - bu hem noindex hem de nofollow anlamına gelir.', 
      suggestion: 'Bu sayfa arama sonuçlarında görünmeyecek ve bağlantıları takip edilmeyecek. Bu bilinçli bir seçimse sorun yok, değilse kaldırın.', 
      impact: 'critical', 
      difficulty: 'kolay', 
      example: '<meta name="robots" content="index, follow">', 
      explanation: 'robots meta etiketindeki "none" direktifi, hem "noindex" hem de "nofollow" direktiflerini birleştirir. Bu, sayfanın arama motorları tarafından tamamen göz ardı edilmesini sağlar. Sayfa arama sonuçlarında gösterilmez ve sayfadaki hiçbir bağlantı arama motoru tarayıcıları tarafından takip edilmez. Bu genellikle yalnızca tamamen özel veya yayınlanmamış sayfalar için istenen bir durumdur.',
      reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
      category: 'SEO' 
    });
  } else if (hasNoindex) {
    // Check context to provide better recommendations
    if (isLikelyArticle) {
      issues.push({ 
        type: 'warning', 
        field: 'noindex-article', 
        message: 'Bu makale/blog yazısı noindex olarak işaretlenmiş.', 
        suggestion: 'İçerik değerli ise ve arama sonuçlarında görünmesini istiyorsanız noindex direktifini kaldırın.', 
        impact: 'critical', 
        difficulty: 'kolay', 
        example: '<meta name="robots" content="index, follow">', 
        explanation: 'Makale ve blog yazıları genellikle arama trafiği için değerli kaynaklardır. noindex direktifi, bu içeriğin arama sonuçlarında gösterilmemesini sağlar, bu da potansiyel organik trafik kaybına neden olur. Eğer içerik hala taslak halindeyse veya geçici ise noindex mantıklıdır, ancak yayınlanmış bir makalenin genellikle indekslenmesi istenir.',
        reference: 'https://developers.google.com/search/docs/advanced/crawling/block-indexing', 
        category: 'SEO' 
      });
    } else if (isLikelyProductPage) {
      issues.push({ 
        type: 'warning', 
        field: 'noindex-product', 
        message: 'Bu ürün sayfası noindex olarak işaretlenmiş.', 
        suggestion: 'Ürün satışta ise ve arama sonuçlarında görünmesini istiyorsanız noindex direktifini kaldırın.', 
        impact: 'critical', 
        difficulty: 'kolay', 
        example: '<meta name="robots" content="index, follow">', 
        explanation: 'Ürün sayfaları, arama motorları aracılığıyla potansiyel müşterilerin sizi bulması için önemlidir. noindex direktifi, bu ürünün arama sonuçlarında gösterilmemesini sağlar. Eğer ürün stokta yoksa veya artık satılmıyorsa noindex uygun olabilir, ancak aktif bir ürün genellikle indekslenmek istenir.',
        reference: 'https://developers.google.com/search/docs/advanced/ecommerce/product-page-seo', 
        category: 'SEO' 
      });
    } else if (isLikelyHomepage) {
      issues.push({ 
        type: 'error', 
        field: 'noindex-homepage', 
        message: 'Ana sayfa noindex olarak işaretlenmiş - bu çok ciddi bir SEO sorunudur!', 
        suggestion: 'Ana sayfadan noindex direktifini hemen kaldırın.', 
        impact: 'critical', 
        difficulty: 'kolay', 
        example: '<meta name="robots" content="index, follow">', 
        explanation: 'Ana sayfanın noindex olarak işaretlenmesi, sitenizin arama motorlarındaki görünürlüğünü ciddi şekilde etkiler. Ana sayfa genellikle en yüksek otorite sahibi sayfadır ve arama motorlarının sitenizi anlamasında kritik öneme sahiptir. Bu, neredeyse her zaman istenmeyen bir yapılandırmadır ve acilen düzeltilmelidir.',
        reference: 'https://developers.google.com/search/docs/advanced/crawling/block-indexing', 
        category: 'SEO' 
      });
    } else if (isLikelySearchPage) {
      successes.push({ 
        field: 'noindex-search', 
        message: 'Arama sonuçları sayfası doğru şekilde noindex olarak işaretlenmiş.', 
        impact: 'medium positive' 
      });
    } else {
      issues.push({ 
        type: 'info', 
        field: 'robots-noindex', 
        message: 'Sayfa noindex olarak işaretlenmiş.', 
        suggestion: 'Arama motorlarında görünmesini istiyorsanız noindex direktifini kaldırın.', 
        impact: 'high', 
        difficulty: 'kolay', 
        example: '<meta name="robots" content="index, follow">', 
        explanation: 'noindex direktifi, sayfanın arama motoru sonuç sayfalarında (SERP) gösterilmemesini sağlar. Arama motorları hala sayfayı tarayabilir, ancak indekslemezler ve sonuçlarda göstermezler. Bu, test sayfaları, dahili sayfalar veya duplicate içerik için uygun olabilir, ancak değerli içerik için genellikle istenmez.',
        reference: 'https://developers.google.com/search/docs/advanced/crawling/block-indexing', 
        category: 'SEO' 
      });
    }
  } else {
    if (isLikelySearchPage) {
      issues.push({ 
        type: 'warning', 
        field: 'index-search', 
        message: 'Arama sonuçları sayfası noindex olarak işaretlenmemiş.', 
        suggestion: 'Arama sonuçları sayfalarına noindex direktifi ekleyin.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<meta name="robots" content="noindex, follow">', 
        explanation: 'Arama sonuçları sayfaları genellikle duplicate içerik ve thin content olarak kabul edilir. Bu sayfaların indekslenmesi, crawl bütçenizin verimsiz kullanımına ve potansiyel olarak arama motorlarında cezalandırılmaya neden olabilir. İyi bir uygulama, tüm dahili arama sonuçları sayfalarını noindex olarak işaretlemektir.',
        reference: 'https://developers.google.com/search/docs/advanced/crawling/block-indexing', 
        category: 'SEO' 
      });
    } else if (isLikelyUtilityPage) {
      successes.push({ 
        field: 'index-utility', 
        message: 'Genel yardımcı sayfalar indekslenebilir durumda.', 
        impact: 'low positive' 
      });
    } else {
      successes.push({ 
        field: 'robots-index', 
        message: 'Sayfa noindex olarak işaretlenmemiş.', 
        impact: 'high positive' 
      });
    }
  }
  
  // 2. Nofollow analysis
  if (hasNofollow) {
    if (isLikelyHomepage) {
      issues.push({ 
        type: 'error', 
        field: 'nofollow-homepage', 
        message: 'Ana sayfa nofollow olarak işaretlenmiş - bu ciddi bir SEO sorunudur!', 
        suggestion: 'Ana sayfadan nofollow direktifini kaldırın.', 
        impact: 'critical', 
        difficulty: 'kolay', 
        example: '<meta name="robots" content="index, follow">', 
        explanation: 'Ana sayfanın nofollow olarak işaretlenmesi, arama motorlarının site yapınızı anlamasını ciddi şekilde engeller. Bu direktif, arama motorlarına ana sayfadaki hiçbir bağlantıyı takip etmemesini söyler, bu da sitenizin iç sayfalarının keşfedilmesini ve indekslenmesini engeller. Bu, neredeyse her zaman istenmeyen bir yapılandırmadır.',
        reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
        category: 'SEO' 
      });
    } else {
      issues.push({ 
        type: 'info', 
        field: 'robots-nofollow', 
        message: 'Sayfa nofollow olarak işaretlenmiş.', 
        suggestion: 'Arama motorlarının bu sayfadaki linkleri takip etmesini istiyorsanız nofollow direktifini kaldırın.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<meta name="robots" content="index, follow">', 
        explanation: 'nofollow direktifi, arama motorlarına sayfadaki hiçbir bağlantıyı takip etmemesini söyler. Bu, sayfanın bağlantı değerini (link equity) iletmesini engeller. Güvenilmeyen içerik, kullanıcı tarafından oluşturulan yorumlar veya dış kaynaklara fazla bağlantı olan sayfalar için uygun olabilir, ancak iç linkler için genellikle istenmez.',
        reference: 'https://developers.google.com/search/docs/advanced/guidelines/qualify-outbound-links', 
        category: 'SEO' 
      });
    }
  } else {
    successes.push({ 
      field: 'robots-follow', 
      message: 'Sayfa nofollow olarak işaretlenmemiş.', 
      impact: 'medium positive' 
    });
  }
  
  // 3. Check individual link nofollow attributes
  if (nofollowLinks > 0) {
    if (nofollowPercentage > 90) {
      issues.push({ 
        type: 'info', 
        field: 'link-nofollows', 
        message: `Sayfadaki bağlantıların çoğu (${nofollowPercentage}%) nofollow olarak işaretlenmiş.`, 
        suggestion: 'Tüm bağlantılar için nofollow kullanmak yerine, yalnızca gerekli durumlarda kullanmayı değerlendirin.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '<a href="https://example.com">Takip edilecek bağlantı</a>\n<a href="https://untrusted.com" rel="nofollow">Takip edilmeyecek bağlantı</a>', 
        explanation: 'Sayfadaki neredeyse tüm bağlantıların nofollow olarak işaretlenmesi, sayfanın link equity iletmesini engeller ve arama motorlarının web yapısını anlamasını zorlaştırabilir. Nofollow özniteliğini yalnızca güvenilmeyen, ücretli veya kullanıcı tarafından oluşturulan içerik bağlantılarında kullanmak en iyi uygulamadır.',
        reference: 'https://developers.google.com/search/docs/advanced/guidelines/qualify-outbound-links', 
        category: 'SEO' 
      });
    } else {
      successes.push({ 
        field: 'link-nofollows', 
        message: `Sayfa seçici olarak nofollow bağlantıları kullanıyor (${nofollowLinks}/${allLinks} bağlantı).`, 
        impact: 'low positive' 
      });
    }
  }
  
  // 4. Check for modern link relationship types
  if (sponsoredLinks > 0 || ugcLinks > 0) {
    successes.push({ 
      field: 'modern-rel-types', 
      message: `Sayfa modern link ilişki tiplerini kullanıyor (sponsored: ${sponsoredLinks}, ugc: ${ugcLinks}).`, 
      impact: 'low positive' 
    });
  }
  
  // 5. Check for advanced robots directives
  const advancedDirectives: string[] = [];
  if (hasNoarchive) advancedDirectives.push('noarchive');
  if (hasNosnippet) advancedDirectives.push('nosnippet');
  if (hasNoimageindex) advancedDirectives.push('noimageindex');
  if (hasNotranslate) advancedDirectives.push('notranslate');
  // advancedDirectives dizisinin tipini genişletmek gerekiyor.
  // Eğer advancedDirectives bir string[] ise, aşağıdaki kod doğrudan çalışır.
  // Ancak advancedDirectives'in tipi daha kısıtlıysa, tip tanımını güncellemelisin.
  if (hasUnavailableAfter) advancedDirectives.push('unavailable_after' as string);
  if (hasMaxSnippet) advancedDirectives.push('max-snippet');
  if (hasMaxImagePreview) advancedDirectives.push('max-image-preview');
  if (hasMaxVideoPreview) advancedDirectives.push('max-video-preview');

  if (advancedDirectives.length > 0) {
    issues.push({ 
      type: 'info', 
      field: 'advanced-directives', 
      message: `Gelişmiş robots direktifleri kullanılıyor: ${advancedDirectives.join(', ')}.`, 
      suggestion: 'Bu direktiflerin arama sonuçlarında gösteriminizi nasıl etkilediğini gözden geçirin.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<meta name="robots" content="index, follow, max-snippet:50, max-image-preview:large">', 
      explanation: 'Gelişmiş robots direktifleri, arama sonuçlarında içeriğinizin nasıl gösterileceğini kontrol etmenizi sağlar. Örneğin, nosnippet direktifi snippet gösterimini engeller, noimageindex direktifi görsellerin indekslenmesini engeller. Bu direktifler, belirli durumlarda faydalı olabilir, ancak arama sonuçlarında görünürlüğünüzü sınırlandırabilir.',
      reference: 'https://developers.google.com/search/reference/robots_meta_tag', 
      category: 'SEO' 
    });
  }
  
  // 6. Check for conflicts
  if (hasConflictingDirectives) {
    issues.push({ 
      type: 'error', 
      field: 'conflicting-directives', 
      message: 'Çelişkili robots direktifleri tespit edildi.', 
      suggestion: 'Meta robots etiketlerindeki çelişkileri giderin. Aynı sayfada hem index hem noindex veya hem follow hem nofollow olmamalı.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<!-- Doğru -->\n<meta name="robots" content="index, follow">\n\n<!-- Yanlış -->\n<meta name="robots" content="index">\n<meta name="googlebot" content="noindex">', 
      explanation: 'Çelişkili robots direktifleri, arama motorlarının sayfanızı nasıl işlemesi gerektiği konusunda kafa karışıklığına neden olur. Farklı meta etiketleri aracılığıyla çelişkili talimatlar vermek (örneğin, bir meta etiketi "index" derken diğeri "noindex" demek) beklenmeyen sonuçlar doğurabilir. Arama motorları genellikle en kısıtlayıcı direktifi seçer, bu da istenmeyen indeksleme sorunlarına yol açabilir.',
      reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
      category: 'SEO' 
    });
  }
  
  // 7. Check for canonical conflict
  if (hasCanonicalConflict) {
    issues.push({ 
      type: 'warning', 
      field: 'canonical-conflict', 
      message: 'Sayfa hem noindex olarak işaretlenmiş hem de canonical URL içeriyor.', 
      suggestion: 'Ya noindex direktifini kaldırın ya da canonical linki kaldırın. İkisi birlikte önerilmez.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<!-- Canonical ile -->\n<link rel="canonical" href="https://example.com/sayfa">\n<meta name="robots" content="index, follow">\n\n<!-- VEYA noindex ile -->\n<meta name="robots" content="noindex, follow">', 
      explanation: 'noindex ve canonical birlikte kullanıldığında çelişkili sinyaller gönderir. Canonical URL, arama motorlarına "bu, tercih edilen URL\'dir, lütfen indeksleyin" derken, noindex "bu sayfayı indekslemeyin" der. Google, bu durumda genellikle noindex direktifini önceliklendirir ve sayfayı indekslemez, ancak canonical URL\'yi dikkate almaz. Bu, SEO açısından verimsiz ve kafa karıştırıcıdır.',
      reference: 'https://developers.google.com/search/docs/advanced/crawling/consolidate-duplicate-urls', 
      category: 'SEO' 
    });
  }
  
  // 8. Check for search engine specific directives
  if (hasGoogleSpecific || hasBingSpecific || hasOtherEngineSpecific) {
    if (hasGoogleSpecific && googleBot.includes('noindex') && !generalRobots.includes('noindex')) {
      issues.push({ 
        type: 'info', 
        field: 'google-specific', 
        message: 'Sayfa sadece Google için noindex olarak işaretlenmiş.', 
        suggestion: 'Eğer tüm arama motorları için geçerli olması gerekiyorsa, genel robots etiketini kullanın.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<meta name="robots" content="noindex, follow">', 
        explanation: 'Sadece Google için noindex direktifi kullanmak, sayfanın diğer arama motorlarında (Bing, Yandex, vb.) görünmesine, ancak Google\'da görünmemesine neden olur. Bu, nadiren istenen bir durumdur ve genellikle tüm arama motorları için tutarlı yönergeler kullanmak daha iyidir.',
        reference: 'https://developers.google.com/search/reference/robots_meta_tag', 
        category: 'SEO' 
      });
    } else {
      issues.push({ 
        type: 'info', 
        field: 'engine-specific', 
        message: 'Sayfa arama motoru özel direktifleri kullanıyor.', 
        suggestion: 'Farklı arama motorları için tutarlı direktifler kullanmayı düşünün.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<meta name="robots" content="index, follow">', 
        explanation: 'Farklı arama motorları için farklı direktifler kullanmak, arama sonuçlarında tutarsızlıklara yol açabilir. Bu, bazı durumlarda istenen bir stratejiyse sorun olmayabilir, ancak genellikle tüm arama motorları için tutarlı direktifler kullanmak daha basit ve daha az hata eğilimlidir.',
        reference: 'https://developers.google.com/search/docs/advanced/robots/robots_meta_tag', 
        category: 'SEO' 
      });
    }
  }
  
  // 9. Check for staging/development environment
  if (isStagingEnvironment) {
    successes.push({ 
      field: 'staging-protection', 
      message: 'Sayfa staging/geliştirme ortamı için uygun şekilde korunmuş (noindex, nofollow).', 
      impact: 'medium positive' 
    });
  }
  
  // 10. Check for private page appropriate directives
  if (isLikelyPrivatePage && hasNoindex) {
    successes.push({ 
      field: 'private-page', 
      message: 'Özel/korumalı sayfa doğru şekilde noindex olarak işaretlenmiş.', 
      impact: 'medium positive' 
    });
  } else if (isLikelyPrivatePage && !hasNoindex) {
    issues.push({ 
      type: 'warning', 
      field: 'private-page-indexed', 
      message: 'Bu özel/korumalı sayfa noindex olarak işaretlenmemiş.', 
      suggestion: 'Özel içerik veya form sayfalarına noindex direktifi ekleyin.', 
      impact: 'high', 
      difficulty: 'kolay', 
      example: '<meta name="robots" content="noindex, follow">', 
      explanation: 'Şifre formları veya özel içerik içeren sayfaların genellikle arama sonuçlarında görünmemesi gerekir. Bu tür sayfaların noindex olarak işaretlenmesi, özel içeriğin yanlışlıkla arama sonuçlarında görünmesini engeller ve kullanıcıların erişemeyecekleri içeriğe yönlendirilmesini önler.',
      reference: 'https://developers.google.com/search/docs/advanced/crawling/block-indexing', 
      category: 'Security' 
    });
  }
  
  return { issues, successes };
}

function analyzeHreflang($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Get all hreflang links and their attributes
  const hreflangLinks = $('link[rel="alternate"][hreflang]');
  const hreflangCount = hreflangLinks.length;
  
  // Extract HTML lang attribute
  const htmlLang = $('html').attr('lang') || '';
  
  // Get the canonical URL
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || '';
  
  // Get content language header if available (limited capability in static analysis)
  const contentLanguageTag = $('meta[http-equiv="content-language"]').attr('content') || '';
  
  // Check for x-default hreflang
  const hasXDefault = $('link[rel="alternate"][hreflang="x-default"]').length > 0;
  
  // Track all language codes and their respective URLs
  const hreflangMap: Record<string, string> = {};
  const invalidCodes: string[] = [];
  const duplicatedCodes: string[] = [];
  const invalidUrls: string[] = [];
  const nonAbsoluteUrls: string[] = [];
  
  // Pattern for valid language codes (simplified)
  const validLangRegex = /^([a-z]{2,3})(-[A-Z]{2})?$/;
  
  // Track if current page has a self-referencing hreflang
  let hasSelfReference = false;
  
  // Get current page URL (if available, otherwise use canonical)
  const currentUrl = canonicalUrl;
  
  // Detect if page has multiple languages (indicators)
  const hasLanguageSwitcher = $('.language-switcher, .lang-switch, .language-selector, [id*="language"], [class*="language"]').length > 0;
  
  // Analyze all hreflang links
  hreflangLinks.each((_, el) => {
    const link = $(el);
    const lang = link.attr('hreflang');
    const href = link.attr('href');
    
    // Skip if attributes are missing
    if (!lang || !href) return;
    
    // Check if language code is valid
    if (lang !== 'x-default' && !validLangRegex.test(lang)) {
      invalidCodes.push(lang);
    }
    
    // Check for duplicate language codes
    if (hreflangMap[lang]) {
      duplicatedCodes.push(lang);
    }
    
    // Store the language and URL mapping
    hreflangMap[lang] = href;
    
    // Check if URL is absolute
    if (href && !href.startsWith('http') && !href.startsWith('https')) {
      nonAbsoluteUrls.push(href);
    }
    
    // Check if URL is valid
    try {
      new URL(href);
    } catch {
      invalidUrls.push(href);
    }
    
    // Check for self-reference
    if (href === currentUrl) {
      hasSelfReference = true;
    }
  });
  
  // Check for bidirectional/reciprocal linking issues
  const bidirectionalIssues: string[] = [];
  const checkedUrls = new Set<string>();
  
  // In a real implementation, we'd need to fetch and analyze each alternate URL
  // This is a simplified example assuming we don't have access to alternate pages
  
  // Start analysis output
  
  // 1. Basic presence check
  if (hreflangCount === 0) {
    if (hasLanguageSwitcher) {
      // If we detect signs of a multilingual site but no hreflang
      issues.push({ 
        type: 'warning', 
        field: 'hreflang-missing', 
        message: 'Sayfa bir dil değiştirici içeriyor ancak hreflang etiketleri eksik.', 
        suggestion: 'Çok dilli siteniz için hreflang etiketleri ekleyin.', 
        impact: 'high', 
        difficulty: 'orta', 
        example: '<link rel="alternate" hreflang="en" href="https://example.com/en/">\n<link rel="alternate" hreflang="de" href="https://example.com/de/">\n<link rel="alternate" hreflang="tr" href="https://example.com/tr/">\n<link rel="alternate" hreflang="x-default" href="https://example.com/">', 
        explanation: 'Hreflang etiketleri, arama motorlarına farklı dillerde veya bölgelerde hedeflenen kullanıcılar için içeriğin hangi versiyonunu göstermesi gerektiğini söyler. Bu etiketler olmadan, arama motorları yanlış dilde içerik gösterebilir, bu da kullanıcı deneyimini olumsuz etkiler ve dil/bölge hedefli trafik kaybına neden olabilir.', 
        reference: 'https://developers.google.com/search/docs/specialty/international/localized-versions', 
        category: 'International SEO' 
      });
    } else {
      // Simple information if no multilingual indicators
      issues.push({ 
        type: 'info', 
        field: 'hreflang', 
        message: 'Hreflang etiketleri tespit edilmedi.', 
        suggestion: 'Eğer siteniz çokdilli ise, dil ve bölgeye özel URL\'ler için hreflang etiketleri ekleyin.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '<link rel="alternate" hreflang="tr" href="https://example.com/tr/">', 
        explanation: 'Hreflang etiketleri, arama motorlarına farklı dillerde veya bölgelerde kullanıcılar için doğru URL versiyonunu göstermesi gerektiğini belirtir. Çokdilli veya farklı bölgelere içerik sunan siteler için önemlidir. Siteniz tek dilli ise, bu etiketlere gerek yoktur.', 
        reference: 'https://developers.google.com/search/docs/specialty/international/localized-versions', 
        category: 'International SEO' 
      });
    }
  } else {
    // 2. Check implementation quality when hreflang tags exist
    
    // Check for self-reference
    if (!hasSelfReference && Object.keys(hreflangMap).length > 0) {
      issues.push({ 
        type: 'warning', 
        field: 'hreflang-self-reference', 
        message: 'Sayfada kendine referans veren (self-referencing) hreflang etiketi eksik.', 
        suggestion: 'Bu sayfa için kendi diline/bölgesine işaret eden bir hreflang ekleyin.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<!-- Eğer bu tr-TR dil sayfasıysa -->\n<link rel="alternate" hreflang="tr-TR" href="https://example.com/tr/">', 
        explanation: 'Her dil/bölge varyantı, kendi diline/bölgesine referans veren bir hreflang etiketi içermelidir. Kendine referans vermek, arama motorlarının sayfanın hangi dil/bölge versiyonu olduğunu açıkça anlamasına yardımcı olur ve hreflang uygulamasının tutarlılığını sağlar.', 
        reference: 'https://developers.google.com/search/docs/specialty/international/localized-versions#html', 
        category: 'International SEO' 
      });
    }
    
    // Check for x-default
    if (!hasXDefault && Object.keys(hreflangMap).length > 3) {
      issues.push({ 
        type: 'info', 
        field: 'hreflang-x-default', 
        message: 'x-default hreflang etiketi eksik.', 
        suggestion: 'Diğer dillere uymayan kullanıcılar için varsayılan bir sayfa belirleyen x-default ekleyin.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<link rel="alternate" hreflang="x-default" href="https://example.com/">', 
        explanation: 'x-default hreflang etiketi, kullanıcının dili/bölgesi için özel bir içerik sürümü olmadığında hangi sayfanın gösterileceğini arama motorlarına belirtir. Bu, genellikle dil seçim sayfası veya ana dilinizdir. Bu etiket, desteklenen dillerin dışındaki kullanıcılara doğru yönlendirme yapılmasını sağlar.', 
        reference: 'https://developers.google.com/search/blog/2013/04/x-default-hreflang-for-international-pages', 
        category: 'International SEO' 
      });
    } else if (hasXDefault) {
      successes.push({ 
        field: 'hreflang-x-default', 
        message: 'x-default hreflang etiketi doğru şekilde uygulanmış.', 
        impact: 'medium positive' 
      });
    }
    
    // Check for invalid codes
    if (invalidCodes.length > 0) {
      issues.push({ 
        type: 'error', 
        field: 'hreflang-invalid-codes', 
        message: `Geçersiz hreflang dil/bölge kodları: ${invalidCodes.join(', ')}`, 
        suggestion: 'Tüm hreflang değerlerinin ISO 639-1 dil kodu (ve isteğe bağlı ISO 3166-1 Alpha 2 ülke kodu) formatında olduğundan emin olun.', 
        impact: 'high', 
        difficulty: 'kolay', 
        example: '<!-- Doğru -->\n<link rel="alternate" hreflang="en" href="https://example.com/en/">\n<link rel="alternate" hreflang="en-US" href="https://example.com/en-us/">\n<link rel="alternate" hreflang="tr-TR" href="https://example.com/tr/">\n\n<!-- Yanlış -->\n<link rel="alternate" hreflang="english" href="https://example.com/english/">', 
        explanation: 'Hreflang değerleri, ISO standardına uygun olmalıdır: dil için ISO 639-1 kodu (ör. "en", "tr") ve isteğe bağlı bölge için ISO 3166-1 Alpha 2 kodu (ör. "US", "GB", "TR"). Geçersiz kodlar, arama motorları tarafından göz ardı edilir ve uluslararası SEO çabalarınızı etkisiz hale getirebilir.', 
        reference: 'https://developers.google.com/search/docs/specialty/international/localized-versions#language-codes', 
        category: 'International SEO' 
      });
    }
    
    // Check for duplicated codes
    if (duplicatedCodes.length > 0) {
      issues.push({ 
        type: 'error', 
        field: 'hreflang-duplicate-codes', 
        message: `Tekrarlanan hreflang kodları: ${duplicatedCodes.join(', ')}`, 
        suggestion: 'Her dil/bölge kodu için yalnızca bir hreflang etiketi olduğundan emin olun.', 
        impact: 'high', 
        difficulty: 'kolay', 
        example: '<!-- Doğru -->\n<link rel="alternate" hreflang="en-US" href="https://example.com/en-us/">\n\n<!-- Yanlış -->\n<link rel="alternate" hreflang="en-US" href="https://example.com/en-us/">\n<link rel="alternate" hreflang="en-US" href="https://example.com/english/">', 
        explanation: 'Aynı hreflang kodunu birden fazla URL\'ye atamak, arama motorlarının hangi sayfanın doğru olduğunu belirleyememesine neden olur. Her dil/bölge kombinasyonu için yalnızca bir URL olmalıdır. Tekrarlanan kodlar, genellikle hreflang uygulamasının tamamen göz ardı edilmesine yol açar.', 
        reference: 'https://developers.google.com/search/docs/specialty/international/localized-versions#common-mistakes', 
        category: 'International SEO' 
      });
    }
    
    // Check for invalid URLs
    if (invalidUrls.length > 0) {
      issues.push({ 
        type: 'error', 
        field: 'hreflang-invalid-urls', 
        message: `Geçersiz URL'ler hreflang etiketlerinde: ${invalidUrls.join(', ')}`, 
        suggestion: 'Tüm alternatiflerin geçerli, tam URL\'ler olduğundan emin olun.', 
        impact: 'high', 
        difficulty: 'kolay', 
        example: '<link rel="alternate" hreflang="en" href="https://example.com/en/">', 
        explanation: 'Hreflang href değerleri geçerli URL\'ler olmalıdır. Geçersiz URL\'ler, arama motorlarının alternatif dil sürümlerini bulamamasına neden olur ve hreflang uygulamanızı etkisiz hale getirir.', 
        reference: 'https://developers.google.com/search/docs/specialty/international/localized-versions#html', 
        category: 'International SEO' 
      });
    }
    
    // Check for relative URLs
    if (nonAbsoluteUrls.length > 0) {
      issues.push({ 
        type: 'warning', 
        field: 'hreflang-relative-urls', 
        message: `Hreflang etiketlerinde göreceli URL'ler kullanılmış.`, 
        suggestion: 'Göreceli URL\'ler yerine mutlak URL\'ler (tam URL\'ler) kullanın.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '<!-- Doğru -->\n<link rel="alternate" hreflang="en" href="https://example.com/en/">\n\n<!-- Yanlış -->\n<link rel="alternate" hreflang="en" href="/en/">', 
        explanation: 'Google, hreflang etiketlerinde göreceli URL\'leri işleyebilir, ancak mutlak URL\'ler (protokol ve alan adı dahil) kullanmak daha güvenli ve sorunsuz bir uygulamadır. Bazı arama motorları göreceli URL\'leri doğru işleyemeyebilir ve bu, hreflang uygulamasının düzgün çalışmamasına neden olabilir.', 
        reference: 'https://developers.google.com/search/docs/specialty/international/localized-versions#html', 
        category: 'International SEO' 
      });
    }
    
    // Check for consistency with HTML lang
    if (htmlLang && Object.keys(hreflangMap).length > 0) {
      // Normalize HTML lang to match hreflang format
      const normalizedHtmlLang = htmlLang.replace('_', '-');
      
      if (!Object.keys(hreflangMap).includes(normalizedHtmlLang)) {
        issues.push({ 
          type: 'warning', 
          field: 'hreflang-html-lang-mismatch', 
          message: `HTML lang özelliği (${htmlLang}) ile eşleşen hreflang etiketi bulunamadı.`, 
          suggestion: 'HTML lang özelliği ile hreflang etiketleri arasında tutarlılık sağlayın.', 
          impact: 'medium', 
          difficulty: 'kolay', 
          example: '<!-- Eğer sayfa İngilizce ise -->\n<html lang="en">\n...\n<link rel="alternate" hreflang="en" href="https://example.com/en/">', 
          explanation: 'HTML lang özelliği ve hreflang etiketleri arasındaki tutarlılık, arama motorlarına ve tarayıcılara sayfanın dili hakkında net sinyaller gönderir. Tutarsızlık, kullanıcıların dilinize göre doğru sayfayı görmemesine neden olabilir ve arama motoru sıralamasını etkileyebilir.', 
          reference: 'https://developers.google.com/search/docs/specialty/international/localized-versions#html', 
          category: 'International SEO' 
        });
      } else {
        successes.push({ 
          field: 'hreflang-html-consistency', 
          message: 'HTML lang özelliği ile hreflang etiketleri tutarlı.', 
          impact: 'medium positive' 
        });
      }
    }
    
    // Check content language header consistency
    if (contentLanguageTag && Object.keys(hreflangMap).length > 0) {
      const contentLangs = contentLanguageTag.split(',').map(l => l.trim());
      let contentLangMatch = false;
      
      // Check if any content-language matches hreflang
      for (const contentLang of contentLangs) {
        const normalizedContentLang = contentLang.replace('_', '-');
        if (Object.keys(hreflangMap).includes(normalizedContentLang)) {
          contentLangMatch = true;
          break;
        }
      }
      
      if (!contentLangMatch && contentLangs.length > 0) {
        issues.push({ 
          type: 'info', 
          field: 'hreflang-content-language-mismatch', 
          message: `Content-Language meta etiketi (${contentLanguageTag}) hreflang etiketleri ile uyuşmuyor.`, 
          suggestion: 'Content-Language ve hreflang etiketleri arasında tutarlılık sağlayın.', 
          impact: 'low', 
          difficulty: 'kolay', 
          example: '<!-- Eğer sayfa Türkçe ise -->\n<meta http-equiv="content-language" content="tr">\n...\n<link rel="alternate" hreflang="tr" href="https://example.com/tr/">', 
          explanation: 'Tüm dil belirteçlerinin tutarlı olması, arama motorlarına ve diğer sistemlere sayfanızın dili hakkında net sinyaller gönderir. Tutarsız dil belirteçleri kafa karıştırıcı olabilir ve arama motorlarının sayfanızı uygun olmayan dillerde göstermesine neden olabilir.', 
          reference: 'https://developers.google.com/search/docs/specialty/international/localized-versions', 
          category: 'International SEO' 
        });
      }
    }
    
    // Overall success for good implementation
    if (invalidCodes.length === 0 && duplicatedCodes.length === 0 && invalidUrls.length === 0 && 
        nonAbsoluteUrls.length === 0 && hasSelfReference) {
      successes.push({ 
        field: 'hreflang', 
        message: `${hreflangCount} adet hreflang etiketi doğru şekilde uygulanmış.`, 
        impact: 'high positive' 
      });
      
      // Check comprehensive language coverage
      const languageCount = Object.keys(hreflangMap).length;
      if (languageCount >= 3 && hasXDefault) {
        successes.push({ 
          field: 'hreflang-coverage', 
          message: `İyi yapılandırılmış çokdilli SEO: ${languageCount} dil/bölge ve x-default.`, 
          impact: 'high positive' 
        });
      }
    }
    
    // Additional suggestions for popular language/region combinations
    const commonCombos = ['en', 'en-US', 'en-GB', 'es', 'de', 'fr', 'it', 'nl', 'ru', 'zh', 'ja', 'ar'];
    const implementedLangs = Object.keys(hreflangMap);
    const missingPopularLanguages = commonCombos.filter(lang => !implementedLangs.includes(lang));
    
    // Only suggest if they already have a decent multilingual implementation
    if (hreflangCount >= 2 && missingPopularLanguages.length > 0 && missingPopularLanguages.length <= 3) {
      issues.push({ 
        type: 'info', 
        field: 'hreflang-language-expansion', 
        message: `Popüler dil alternatiflerini eklemeyi düşünün: ${missingPopularLanguages.join(', ')}`, 
        suggestion: 'Uluslararası erişiminizi genişletmek için daha fazla dil/bölge alternatifi ekleyin.', 
        impact: 'low', 
        difficulty: 'zor', 
        example: '<link rel="alternate" hreflang="en" href="https://example.com/en/">\n<link rel="alternate" hreflang="de" href="https://example.com/de/">\n<link rel="alternate" hreflang="fr" href="https://example.com/fr/">', 
        explanation: 'Dil ve bölge alternatifleri eklemek, küresel hedef kitlenize daha iyi hizmet vermenizi sağlar. Çeşitli pazarlara doğru içerikle ulaşmak, organik trafik potansiyelinizi genişletir ve kullanıcı deneyimini iyileştirir. Eksik popüler diller, hedef kitlenize bağlı olarak iş fırsatları sunabilir.', 
        reference: 'https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites', 
        category: 'International SEO' 
      });
    }
  }
  
  return { issues, successes };
}

function analyzeAMP($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Extract basic AMP link
  const ampLink = $('link[rel="amphtml"]');
  const ampHref = ampLink.attr('href') || '';
  
  // Check for canonical link
  const canonicalLink = $('link[rel="canonical"]');
  const canonicalHref = canonicalLink.attr('href') || '';
  
  // Detect page type (article, product, etc.)
  const isArticle = $('article').length > 0 || 
    $('[itemtype*="Article"]').length > 0 || 
    $('meta[property="og:type"][content="article"]').length > 0;
    
  const isProduct = $('[itemtype*="Product"]').length > 0 || 
    $('.product').length > 0 || 
    $('meta[property="og:type"][content="product"]').length > 0;
    
  const isHomepage = $('body').hasClass('home') || 
    $('meta[property="og:type"][content="website"]').length > 0 || 
    canonicalHref.split('/').filter(Boolean).length <= 1;
    
  const isContactPage = $('body').hasClass('contact') || 
    $('h1:contains("Contact")').length > 0 || 
    $('form:contains("Name")').length > 0 && 
    $('form:contains("Email")').length > 0 && 
    $('form:contains("Message")').length > 0;
  
  // Check for potential PWA indicators
  const hasPWA = $('link[rel="manifest"]').length > 0 || 
    $('meta[name="apple-mobile-web-app-capable"]').length > 0;
  
  // Check for mobile optimizations
  const hasResponsiveMeta = $('meta[name="viewport"][content*="width=device-width"]').length > 0;
  
  // Detect if the page is already using modern web performance techniques
  const usesModernOptimizations = $('script[type="module"]').length > 0 || 
    $('link[rel="preload"]').length > 0 || 
    $('img[loading="lazy"]').length > 0;
  
  // Look for structured data that could enhance AMP pages
  const hasStructuredData = $('script[type="application/ld+json"]').length > 0;
  
  // Check for common AMP component hints in regular HTML
  const mightUseAdvancedAmpFeatures = $.html().includes('amp-') || 
    $('form').length > 0 || 
    $('video').length > 0 || 
    $('iframe').length > 0;
  
  // Check if there's a mobile-specific version of the site
  const hasMobileVersion = $('link[media="only screen and (max-width: 640px)"]').length > 0 || 
    $.html().includes('mobile') && $.html().includes('redirect');
  
  // AMP URL structure validation (basic check)
  const hasValidAmpUrl = ampHref && (
    ampHref.includes('/amp/') || 
    ampHref.endsWith('/amp') || 
    ampHref.includes('amp=1') || 
    ampHref.includes('?amp') || 
    ampHref.includes('.amp')
  );
  
  // Analyze bidirectional linking (would need to fetch the AMP page in a real implementation)
  const hasBidirectionalLinking = ampHref && canonicalHref;
  
  // Check for potential AMP validation errors in the HTML
  // (This is a simplified check, actual validation requires fetching the AMP page)
  const potentialAmpValidationIssues = ampHref && (
    $.html().includes('<script async custom-element="amp-') && 
    !$.html().includes('<script async src="https://cdn.ampproject.org/v0.js"></script>')
  );
  
  // Start analysis report
  
  // 1. Basic AMP implementation check
  if (ampHref) {
    // AMP link exists, check for proper implementation
    if (hasValidAmpUrl && hasBidirectionalLinking) {
      successes.push({ 
        field: 'amp-implementation', 
        message: 'AMP implementasyonu düzgün yapılandırılmış.', 
        impact: 'high positive' 
      });
    } else if (!hasValidAmpUrl) {
      issues.push({ 
        type: 'warning', 
        field: 'amp-url-format', 
        message: 'AMP URL formatı alışılmadık bir yapıda.', 
        suggestion: 'AMP URL\'nizin yaygın formatlardan birine uyduğundan emin olun (ör: /amp/ dizini, .amp uzantısı veya ?amp parametresi).', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '<link rel="amphtml" href="https://example.com/current-page/amp/">', 
        explanation: 'AMP URL\'lerinin belirli bir yapıyı takip etmesi, kullanıcıların ve arama motorlarının AMP sürümünü tanımasını kolaylaştırır. En yaygın uygulamalar, URL sonuna /amp/ eklemek, .amp uzantısı kullanmak veya URL parametresi olarak ?amp eklemektir. Tutarlı bir URL yapısı, AMP sayfalarınızın düzgün keşfedilmesini ve indekslenmesini sağlar.',
        reference: 'https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/discovery/', 
        category: 'Mobile Optimization' 
      });
    } else if (!hasBidirectionalLinking) {
      issues.push({ 
        type: 'error', 
        field: 'amp-bidirectional', 
        message: 'AMP sayfasına link var, ancak canonical link eksik olabilir.', 
        suggestion: 'AMP ve standart HTML sayfaları arasında çift yönlü bağlantı olduğundan emin olun.', 
        impact: 'high', 
        difficulty: 'kolay', 
        example: '<!-- Standart HTML sayfasında -->\n<link rel="amphtml" href="https://example.com/story/amp/">\n\n<!-- AMP sayfasında -->\n<link rel="canonical" href="https://example.com/story/">', 
        explanation: 'AMP implementasyonunda, standart HTML sayfası AMP sürümüne "amphtml" rel özelliğiyle bağlanmalı, AMP sayfası da standart HTML sayfasına "canonical" rel özelliğiyle bağlanmalıdır. Bu çift yönlü bağlantı, arama motorlarının içeriğin farklı versiyonları arasındaki ilişkiyi anlamasını sağlar ve duplicate content sorunlarını önler.',
        reference: 'https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/discovery/', 
        category: 'Mobile Optimization' 
      });
    }
    
    if (potentialAmpValidationIssues) {
      issues.push({ 
        type: 'warning', 
        field: 'amp-validation', 
        message: 'AMP sayfasında olası doğrulama sorunları olabilir.', 
        suggestion: 'AMP sayfanızı AMP Validator aracıyla kontrol edin.', 
        impact: 'high', 
        difficulty: 'orta', 
        example: '<script async src="https://cdn.ampproject.org/v0.js"></script>', 
        explanation: 'Geçerli bir AMP sayfası, AMP HTML spesifikasyonlarına tam olarak uymalıdır. Doğrulama sorunları olan AMP sayfaları, AMP önbelleğinde sunulmaz ve AMP\'nin performans avantajlarından tam olarak yararlanamaz. En yaygın hatalar arasında eksik veya yanlış yerleştirilmiş temel AMP JS dosyaları, geçersiz HTML veya izin verilmeyen etiketlerin kullanımı bulunur.',
        reference: 'https://amp.dev/documentation/guides-and-tutorials/learn/validation-workflow/validate_amp/', 
        category: 'Mobile Optimization' 
      });
    }
    
    // Page type specific checks for AMP
    if (isArticle) {
      successes.push({ 
        field: 'amp-article', 
        message: 'Makale sayfası için AMP sürümü mevcut - bu ideal bir uygulama.', 
        impact: 'high positive' 
      });
      
      if (!hasStructuredData) {
        issues.push({ 
          type: 'info', 
          field: 'amp-article-structured-data', 
          message: 'Makale AMP sayfası için yapılandırılmış veri eksik olabilir.', 
          suggestion: 'AMP makalenize Article veya NewsArticle yapılandırılmış verisi ekleyin.', 
          impact: 'medium', 
          difficulty: 'orta', 
          example: '<script type="application/ld+json">{\n  "@context": "https://schema.org",\n  "@type": "NewsArticle",\n  "headline": "Makale Başlığı",\n  "image": ["https://example.com/photos/1x1/photo.jpg"],\n  "datePublished": "2023-01-01T12:00:00+00:00",\n  "author": [{"@type": "Person", "name": "Yazar Adı"}]\n}</script>', 
          explanation: 'Yapılandırılmış veriler, arama motorlarının içeriğinizi daha iyi anlamasını sağlar ve zengin sonuç görünümleri için fırsatlar yaratır. AMP makaleleri için Article veya NewsArticle şeması eklemek, içeriğinizin AMP Carousel\'de veya Top Stories bölümünde gösterilme şansını artırabilir.',
          reference: 'https://developers.google.com/search/docs/appearance/structured-data/article', 
          category: 'Structured Data' 
        });
      }
    } else if (isProduct) {
      issues.push({ 
        type: 'info', 
        field: 'amp-product', 
        message: 'Ürün sayfası için AMP sürümü mevcut.', 
        suggestion: 'Ürün AMP sayfalarında dinamik içeriklerin (stok durumu, fiyat vb.) doğru çalıştığından emin olun.', 
        impact: 'medium', 
        difficulty: 'zor', 
        example: '<amp-state id="product">\n  <script type="application/json">\n  {\n    "sku": "1234",\n    "price": "99.99",\n    "inStock": true\n  }\n  </script>\n</amp-state>', 
        explanation: 'Ürün sayfaları genellikle dinamik içerik ve etkileşim gerektirir, bu da AMP\'de bazı zorluklara neden olabilir. amp-bind, amp-state ve amp-list gibi AMP bileşenlerini kullanarak dinamik ürün bilgilerini ve kullanıcı etkileşimlerini yönetebilirsiniz. Ayrıca, ürün AMP sayfalarınızın Product yapılandırılmış verisi içerdiğinden emin olun.',
        reference: 'https://amp.dev/documentation/examples/e-commerce/product_page/', 
        category: 'E-commerce' 
      });
    } else if (isContactPage) {
      issues.push({ 
        type: 'info', 
        field: 'amp-contact', 
        message: 'İletişim sayfası için AMP sürümü mevcut.', 
        suggestion: 'İletişim formlarının AMP versiyonunda amp-form kullandığından emin olun.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '<form method="post" action-xhr="https://example.com/submit" target="_top">\n  <input type="text" name="name" required>\n  <input type="submit" value="Gönder">\n  <div submit-success><template type="amp-mustache">Teşekkürler {{name}}!</template></div>\n</form>', 
        explanation: 'AMP sayfalarında standart HTML formları kullanılamaz. Bunun yerine, amp-form bileşeni kullanılmalıdır. Bu bileşen, sunucuya XHR istekleri gönderir ve kullanıcı deneyimini bozmadan form gönderimlerini yönetir. Form doğrulama, başarı/hata mesajları ve dinamik davranışlar için amp-form\'un özelliklerini kullanın.',
        reference: 'https://amp.dev/documentation/components/amp-form/', 
        category: 'User Interaction' 
      });
    } else if (isHomepage) {
      issues.push({ 
        type: 'info', 
        field: 'amp-homepage', 
        message: 'Ana sayfa için AMP sürümü mevcut.', 
        suggestion: 'Ana sayfa için AMP kullanımı yaygın değildir ve genellikle gerekli olmayabilir.', 
        impact: 'low', 
        difficulty: 'bilgi', 
        example: '', 
        explanation: 'Ana sayfalar genellikle karmaşık etkileşimler ve dinamik öğeler içerdiğinden, bunları AMP ile oluşturmak zor olabilir ve kullanıcı deneyiminde bazı kısıtlamalara neden olabilir. Ana sayfalar yerine, makale sayfaları veya ürün detay sayfaları gibi içerik sayfalarını AMP formatında sunmak daha yaygın bir yaklaşımdır. Ana sayfanız için responsive tasarım ve hızlı yükleme teknikleri kullanmak genellikle daha etkilidir.',
        reference: 'https://amp.dev/about/websites/', 
        category: 'Strategy' 
      });
    }
    
    // Check for PWA and AMP combination (AMP for PWA)
    if (hasPWA) {
      successes.push({ 
        field: 'amp-pwa', 
        message: 'Site hem AMP hem de PWA teknolojilerini kullanıyor olabilir.', 
        impact: 'high positive' 
      });
      
      issues.push({ 
        type: 'info', 
        field: 'amp-pwa-strategy', 
        message: 'AMP ve PWA birlikte kullanılıyor - "AMP as PWA" veya "AMP to PWA" stratejisini değerlendirin.', 
        suggestion: 'PWA ve AMP entegrasyonunuzu optimize edin.', 
        impact: 'medium', 
        difficulty: 'zor', 
        example: '<!-- AMP to PWA geçişi için -->\n<amp-install-serviceworker src="https://example.com/sw.js" data-iframe-src="https://example.com/install-sw.html" layout="nodisplay"></amp-install-serviceworker>', 
        explanation: 'AMP ve PWA birlikte kullanıldığında güçlü bir kombinasyon oluşturabilir. "AMP as PWA" yaklaşımı, AMP sayfalarını PWA\'ya dönüştürür, böylece AMP sayfaları hızlı yüklenir ve aynı zamanda PWA özellikleri sunar. "AMP to PWA" yaklaşımı, kullanıcılara önce hızlı yüklenen AMP sayfaları sunar, ardından arka planda PWA\'yı yükler ve daha zengin bir deneyime geçiş yapar. Her iki yaklaşım da, ilk yükleme hızı ve zengin uygulama özellikleri arasında iyi bir denge sağlar.',
        reference: 'https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/amp_to_pwa/', 
        category: 'Advanced Strategy' 
      });
    }
    
  } else {
    // No AMP implementation
    
    // Context-aware recommendations for implementing AMP
    if (isArticle) {
      issues.push({ 
        type: 'suggestion', 
        field: 'amp-for-article', 
        message: 'Bu makale sayfası için AMP sürümü oluşturmayı düşünün.', 
        suggestion: 'Makale sayfaları AMP uygulaması için idealdir. Özellikle mobil okuyucular için hızlı yükleme sağlar.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '<!-- HTML sayfasında -->\n<link rel="amphtml" href="https://example.com/article/amp/">\n\n<!-- AMP sayfasında -->\n<!doctype html>\n<html ⚡>\n<head>\n  <meta charset="utf-8">\n  <link rel="canonical" href="https://example.com/article/">\n  <meta name="viewport" content="width=device-width">\n  <script async src="https://cdn.ampproject.org/v0.js"></script>\n  <style amp-boilerplate>...</style>\n</head>\n<body>\n  <h1>Makale Başlığı</h1>\n  <p>Makale içeriği...</p>\n</body>\n</html>', 
        explanation: 'Makale sayfaları, AMP\'nin sunduğu hızlı yükleme avantajlarından en çok yararlanan sayfa türleridir. AMP ile oluşturulan makale sayfaları, Google Arama\'da AMP karuselinde veya Top Stories bölümünde gösterilerek görünürlüğünüzü artırabilir. AMP makaleleri ayrıca mobil cihazlarda önemli ölçüde daha hızlı yüklenir, bu da daha düşük hemen çıkma oranlarına ve daha iyi kullanıcı deneyimine katkıda bulunur.',
        reference: 'https://amp.dev/documentation/guides-and-tutorials/start/create/basic_markup/', 
        category: 'Content Strategy' 
      });
    } else if (isProduct && !hasResponsiveMeta) {
      issues.push({ 
        type: 'warning', 
        field: 'mobile-optimization', 
        message: 'Ürün sayfası AMP kullanmıyor ve mobil optimizasyonu eksik olabilir.', 
        suggestion: 'Ürün sayfanızı AMP ile veya kapsamlı duyarlı tasarım ile mobil için optimize edin.', 
        impact: 'high', 
        difficulty: 'orta', 
        example: '<meta name="viewport" content="width=device-width, initial-scale=1">', 
        explanation: 'Mobil cihazlarda hızlı yükleme, e-ticaret dönüşüm oranları için kritik öneme sahiptir. AMP kullanmamanız durumunda, sayfanızın responsive tasarım prensiplerine uyduğundan ve mobil cihazlarda hızlı yüklendiğinden emin olun. Viewport meta etiketi, responsive tasarımın ilk adımıdır ancak yeterli değildir. Görsel optimizasyonu, önbelleğe alma, CSS ve JavaScript minimizasyonu gibi diğer mobil performans teknikleri de uygulanmalıdır.',
        reference: 'https://web.dev/vitals/', 
        category: 'Mobile Optimization' 
      });
    } else if (hasResponsiveMeta && usesModernOptimizations) {
      successes.push({ 
        field: 'modern-alternatives', 
        message: 'AMP kullanılmıyor ancak modern web performans teknikleri uygulanmış.', 
        impact: 'medium positive' 
      });
      
      issues.push({ 
        type: 'info', 
        field: 'amp-alternatives', 
        message: 'Site zaten modern web performans teknikleri kullanıyor.', 
        suggestion: 'AMP yerine Core Web Vitals optimizasyonuna odaklanmak daha uygun olabilir.', 
        impact: 'medium', 
        difficulty: 'bilgi', 
        example: '', 
        explanation: 'Google artık hızlı sayfalar için tek çözüm olarak AMP\'yi tanıtmıyor. 2021\'den bu yana, Google arama sıralamasında AMP\'ye özel bir avantaj vermek yerine Core Web Vitals gibi performans metriklerine daha fazla odaklanıyor. Siteniz zaten iyi tasarlanmış responsive bir sayfaya ve modern performans optimizasyonlarına sahipse, AMP uygulamak yerine Core Web Vitals\'a odaklanmak daha etkili olabilir. Bu, LCP (Largest Contentful Paint), FID (First Input Delay) ve CLS (Cumulative Layout Shift) gibi metriklerin optimizasyonunu içerir.',
        reference: 'https://web.dev/vitals/', 
        category: 'Strategy' 
      });
    } else {
      issues.push({ 
        type: 'info', 
        field: 'amp', 
        message: 'AMP desteği tespit edilmedi.', 
        suggestion: 'Hızlı mobil deneyimler için AMP\'yi değerlendirin veya modern web performans tekniklerine odaklanın.', 
        impact: 'medium', 
        difficulty: 'zor', 
        example: '<link rel="amphtml" href="https://site.com/current-path/amp/">', 
        explanation: 'AMP (Accelerated Mobile Pages), mobil sayfalarda hızlı yükleme sağlamak için tasarlanmış bir web bileşeni çerçevesidir. Google artık AMP\'yi arama sıralaması için bir gereklilik olarak görmese de, AMP sayfaları hala Google Arama sonuçlarında özelleştirilmiş görünümlerden yararlanabilir. 2025 itibarıyla, AMP veya AMP olmayan implementasyon arasındaki karar, daha çok iş ihtiyaçlarınıza ve teknik ekibinizin kapasitesine bağlıdır. AMP uygulama zorluğu ve bakım maliyetiyle gelse de, belirli içerik türleri için (özellikle haberler ve makaleler) hala avantajlar sunabilir.',
        reference: 'https://amp.dev/about/websites/', 
        category: 'Mobile Optimization' 
      });
    }
    
    // If it's a news/media site without AMP, provide more specific guidance
    if (isArticle && $.html().includes('news') || $.html().includes('blog')) {
      issues.push({ 
        type: 'warning', 
        field: 'news-without-amp', 
        message: 'Haber/blog sitesi AMP kullanmıyor.', 
        suggestion: 'Haber ve blog siteleri için AMP hala önemli avantajlar sunabilir.', 
        impact: 'high', 
        difficulty: 'orta', 
        example: '<link rel="amphtml" href="https://news-site.com/article/amp/">', 
        explanation: 'Haber ve blog içeriği için AMP, Google\'ın Top Stories karuselinde ve Google Haberler\'de daha fazla görünürlük sağlayabilir. 2021\'den bu yana, Google Top Stories\'a girmek için AMP gerekli olmasa da, AMP sayfaları hala önbelleğe alma avantajları ve daha hızlı yükleme süreleri sunar. Özellikle yüksek hacimli trafik alan veya mobil kullanıcıların çoğunlukta olduğu haber siteleri için, AMP implementasyonu hala önemli bir mobil strateji olabilir.',
        reference: 'https://developers.google.com/search/docs/appearance/google-news', 
        category: 'News SEO' 
      });
    }
  }
  
  // 2. Core Web Vitals and AMP Relationship
  if (ampHref) {
    issues.push({ 
      type: 'info', 
      field: 'amp-cwv', 
      message: 'AMP sayfalarınız da Core Web Vitals metriklerine göre değerlendirilir.', 
      suggestion: 'AMP sayfalarınızın Core Web Vitals performansını da izleyin ve optimize edin.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '', 
      explanation: 'AMP sayfalarının genellikle iyi Core Web Vitals sonuçları vermesi beklenir, ancak bu garantili değildir. Büyük resimler, ağır üçüncü taraf komponentler veya karmaşık AMP özel elementleri kullanan AMP sayfaları hala performans sorunları yaşayabilir. Search Console\'da AMP sayfalarınızın Core Web Vitals raporlarını düzenli olarak kontrol edin ve gerekirse optimize edin. Bunun için amp-img boyutlandırma, layout özellikleri ve AMP önbellek kullanımı gibi faktörlere dikkat edin.',
      reference: 'https://web.dev/vitals/', 
      category: 'Performance' 
    });
  }
  
  // 3. AMP Cache Usage
  if (ampHref) {
    successes.push({ 
      field: 'amp-cache', 
      message: 'AMP sayfaları Google AMP Cache üzerinden sunulabilir.', 
      impact: 'medium positive' 
    });
    
    issues.push({ 
      type: 'info', 
      field: 'amp-cache-analytics', 
      message: 'AMP Cache analitik ölçümlerini doğru yapılandırdığınızdan emin olun.', 
      suggestion: 'AMP sayfalarında hem orijinal site hem de AMP Cache görüntülemeleri için Analytics kurulumu yapın.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<amp-analytics type="googleanalytics">\n  <script type="application/json">{\n    "vars": {\n      "account": "UA-YYYY-Y"\n    },\n    "triggers": {\n      "default pageview": {\n        "on": "visible",\n        "request": "pageview",\n        "vars": {\n          "title": "AMP Sayfası"\n        }\n      }\n    }\n  }</script>\n</amp-analytics>', 
      explanation: 'AMP sayfaları Google AMP Cache üzerinden sunulduğunda, kullanıcılar teknik olarak Google\'ın sunucularından içeriğinizi görüntüler. Bu durum, analitik ölçümlerinizi karmaşıklaştırabilir ve trafik kayıplarına yol açabilir. AMP Analytics\'i doğru şekilde yapılandırmak, AMP Cache ve orijinal domain üzerinden gelen tüm trafiği doğru şekilde ölçmenizi sağlar. Google Analytics veya diğer analitik araçları için AMP\'ye özel yapılandırmaları kullanın.',
      reference: 'https://amp.dev/documentation/components/amp-analytics/', 
      category: 'Analytics' 
    });
  }
  
  // 4. Recent changes in AMP's role in SEO
  issues.push({ 
    type: 'info', 
    field: 'amp-2025', 
    message: 'AMP\'nin SEO rolü 2021\'den bu yana değişti.', 
    suggestion: 'AMP yerine veya AMP ile birlikte Core Web Vitals optimizasyonuna odaklanın.', 
    impact: 'medium', 
    difficulty: 'bilgi', 
    example: '', 
    explanation: '2021\'den önce, AMP sayfaları Google Arama\'da Top Stories karuselinde görünmek için gerekliydi. 2021\'den itibaren Google, bu gerekliliği kaldırdı ve bunun yerine Page Experience sinyallerini ve Core Web Vitals metriklerini öne çıkardı. 2025 itibarıyla, AMP hala faydalı bir teknoloji olabilir, ancak artık SEO için zorunlu değildir. AMP\'yi uygulamaya yönelik kararınız, teknik kapasitenize, içerik türünüze ve kullanıcı tabanınıza dayanmalıdır. İyi performans gösteren responsive bir site, AMP olmadan da SEO avantajları elde edebilir.',
    reference: 'https://developers.google.com/search/blog/2020/05/evaluating-page-experience', 
    category: 'SEO Strategy' 
  });
  
  // 5. AMP Stories and other AMP formats
  const potentialForAmpStories = isArticle && $.html().includes('gallery') || 
    $.html().includes('slideshow') ||
    $('img').length > 5;
    
  if (potentialForAmpStories) {
    issues.push({ 
      type: 'info', 
      field: 'amp-stories', 
      message: 'İçeriğiniz AMP Stories formatına uygun olabilir.', 
      suggestion: 'Görsel hikayeleriniz için AMP Stories formatını değerlendirin.', 
      impact: 'low', 
      difficulty: 'zor', 
      example: '<amp-story standalone title="Başlık" publisher="Yayıncı" poster-portrait-src="poster.jpg">\n  <amp-story-page id="cover">\n    <amp-story-grid-layer template="fill">\n      <amp-img src="background.jpg" layout="fill"></amp-img>\n    </amp-story-grid-layer>\n    <amp-story-grid-layer template="vertical">\n      <h1>Hikaye Başlığı</h1>\n    </amp-story-grid-layer>\n  </amp-story-page>\n</amp-story>', 
      explanation: 'AMP Stories (Web Stories), zengin, tam ekran deneyimler oluşturmanıza olanak tanıyan bir AMP formatıdır. Bu format, Instagram veya Snapchat hikayeleri gibi görsel hikaye anlatımına benzer şekilde çalışır ve Google Arama Sonuçları\'nda özel görünümlerden yararlanabilir. Görsel içerik ağırlıklı web siteniz varsa veya ilgi çekici hikayeler anlatmak istiyorsanız, AMP Stories içeriğinizi sunmanın etkili bir yolu olabilir.',
      reference: 'https://amp.dev/about/stories/', 
      category: 'Content Format' 
    });
  }
  
  // 6. Mobile-First and AMP strategy alignment
  if (!ampHref && !hasResponsiveMeta) {
    issues.push({ 
      type: 'warning', 
      field: 'mobile-strategy', 
      message: 'Site AMP kullanmıyor ve mobil optimizasyonu eksik.', 
      suggestion: 'En azından temel responsive tasarım uygulamasıyla başlayın.', 
      impact: 'critical', 
      difficulty: 'orta', 
      example: '<meta name="viewport" content="width=device-width, initial-scale=1">\n<style>\n  @media (max-width: 600px) {\n    /* Mobil stilleriniz */\n  }\n</style>', 
      explanation: 'Google, mobil öncelikli indeksleme kullanır, yani web sitenizin mobil versiyonu, indeksleme ve sıralama için kullanılan birincil versiyon olarak kabul edilir. AMP implementasyonu yapmamayı tercih etseniz bile, sitenizin mobil cihazlarda düzgün görüntülenmesi ve hızlı yüklenmesi çok önemlidir. En azından viewport meta etiketi, responsive medya sorguları ve mobil dostu bir tasarım uygulamalısınız. Mobil optimizasyon eksikliği, arama sonuçlarında daha düşük sıralama anlamına gelebilir.',
      reference: 'https://developers.google.com/search/mobile-sites', 
      category: 'Mobile SEO' 
    });
  } else if (!ampHref && hasResponsiveMeta) {
    successes.push({ 
      field: 'mobile-responsive', 
      message: 'AMP kullanılmıyor ama site temel responsive tasarım prensiplerine uyuyor.', 
      impact: 'medium positive' 
    });
  }
  
  return { issues, successes };
}

function analyzeReadability($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Main content extraction
  let mainContent = "";
  
  // Try to find the main content area using common selectors
  const contentSelectors = [
    'article', 
    '.content', 
    '.post-content', 
    '.entry-content', 
    '.article-content', 
    'main', 
    '#content',
    '.main-content'
  ];
  
  // Find main content or use body if not found
  let $content: CheerioAPI | Cheerio<any> = $('body');
  for (const selector of contentSelectors) {
    if ($(selector).length) {
      $content = $(selector);
      break;
    }
  }
  
  // Remove navigation, sidebars, footers, comments, ads, etc.
  const elementsToRemove = [
    'header', 'footer', 'nav', '.navigation', '.menu', '.sidebar', 
    '.widget', '.comment', '.comments', '.ads', '.advertisement',
    'script', 'style', 'noscript', '.social-media', '.share',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]'
  ];
  
  // Clone the content to avoid modifying the original DOM
  const $contentClone = $content.clone();
  
  // Remove unwanted elements from the clone
  elementsToRemove.forEach(selector => {
    $contentClone.find(selector).remove();
  });
  
  // Get text from the cleaned content
  mainContent = $contentClone.text();
  
  // Basic text statistics
  const text = mainContent.trim();
  const paragraphs = $contentClone.find('p');
  const paragraphCount = paragraphs.length;
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Remove punctuation for word analysis
  const cleanWords = words.map(word => word.toLowerCase().replace(/[^\wçğıöşü]/g, ''));
  
  // Calculate unique words ratio
  const uniqueWords = new Set(cleanWords);
  const uniqueWordRatio = uniqueWords.size / wordCount;
  
  // Sentences analysis
  const sentenceRegex = /[^.!?…]+[.!?…]+/g;
  const sentences = text.match(sentenceRegex) || [];
  const sentenceCount = sentences.length;
  
  // Calculate sentence lengths
  const sentenceLengths = sentences.map(sentence => {
    return sentence.split(/\s+/).filter(Boolean).length;
  });
  
  // Calculate average sentence length
  const avgSentenceLength = wordCount / (sentenceCount || 1);
  
  // Identify very long sentences (more than 25 words)
  const longSentences = sentenceLengths.filter(length => length > 25);
  const longSentencesRatio = longSentences.length / sentenceCount;
  
  // Identify very short sentences (less than 5 words)
  const shortSentences = sentenceLengths.filter(length => length > 0 && length < 5);
  const shortSentencesRatio = shortSentences.length / sentenceCount;

  // Cümle uzunluğu çeşitliliğini hesapla
  function standartSapma(arr: number[]): number {
    const ort = arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
    const kareFarklar = arr.map(x => Math.pow(x - ort, 2));
    const varyans = kareFarklar.reduce((a, b) => a + b, 0) / (arr.length || 1);
    return Math.sqrt(varyans);
  }
  const sentenceLengthVariety = standartSapma(sentenceLengths) / avgSentenceLength;

  // Paragraf uzunluklarını hesapla
  const paragraphLengths: number[] = [];
  paragraphs.each((_, paragraph) => {
    const paragraphText = $(paragraph).text().trim();
    const paragraphWordCount = paragraphText.split(/\s+/).filter(Boolean).length;
    paragraphLengths.push(paragraphWordCount);
  });
  
  // Calculate average paragraph length
  const avgParagraphLength = wordCount / (paragraphCount || 1);
  
  // Count very long paragraphs (more than 150 words)
  const longParagraphs = paragraphLengths.filter(length => length > 150);
  const longParagraphsRatio = longParagraphs.length / paragraphCount;
  
  // Calculate Flesch Reading Ease - Türkçe uyarlanmış formül
  // Note: This is an adaptation for Turkish, actual values may need calibration
  const fleschScore = 198.825 - (1.015 * avgSentenceLength) - (84.6 * (wordCount / (sentenceCount || 1) / 100));
  
  // Evaluate readability level based on Flesch score
  let readabilityLevel = "";
  if (fleschScore >= 90) readabilityLevel = "çok kolay";
  else if (fleschScore >= 80) readabilityLevel = "kolay";
  else if (fleschScore >= 70) readabilityLevel = "biraz kolay";
  else if (fleschScore >= 60) readabilityLevel = "standart";
  else if (fleschScore >= 50) readabilityLevel = "biraz zor";
  else if (fleschScore >= 30) readabilityLevel = "zor";
  else readabilityLevel = "çok zor";
  
  // Analyze heading structure
  const headings = {
    h1: $contentClone.find('h1').length,
    h2: $contentClone.find('h2').length,
    h3: $contentClone.find('h3').length,
    h4: $contentClone.find('h4').length,
    h5: $contentClone.find('h5').length,
    h6: $contentClone.find('h6').length
  };
  
  const totalHeadings = headings.h1 + headings.h2 + headings.h3 + headings.h4 + headings.h5 + headings.h6;
  const headingDensity = totalHeadings / (paragraphCount || 1);
  
  // Check heading hierarchy
  const headingHierarchyIssues: string[] = [];
  if (headings.h1 > 1) {
    headingHierarchyIssues.push("Birden fazla H1 başlık kullanılmış");
  }
  if (headings.h1 === 0) {
    headingHierarchyIssues.push("H1 başlık eksik");
  }
  if (headings.h2 === 0 && wordCount > 300) {
    headingHierarchyIssues.push("Alt başlıklar (H2) eksik");
  }
  if (headings.h3 === 0 && wordCount > 1000) {
    headingHierarchyIssues.push("Detay başlıklar (H3) eksik");
  }
  
  // Check for sequential heading levels (e.g. H1 should be followed by H2, not H3)
  const allHeadings: string[] = [];
  $contentClone.find('h1, h2, h3, h4, h5, h6').each((_, element) => {
    allHeadings.push(element.name);
  });
  
  let headingSequenceIssue = false;
  for (let i = 0; i < allHeadings.length - 1; i++) {
    const current = parseInt(allHeadings[i].replace('h', ''));
    const next = parseInt(allHeadings[i + 1].replace('h', ''));
    if (next > current + 1) {
      headingSequenceIssue = true;
      break;
    }
  }
  
  if (headingSequenceIssue) {
    headingHierarchyIssues.push("Başlık sıralaması düzensiz (örn. H1'den sonra H3 geliyor)");
  }
  
  // Check for formatting elements
  const lists = $contentClone.find('ul, ol');
  const hasLists = lists.length > 0;
  const listItems = $contentClone.find('li');
  const listItemCount = listItems.length;
  
  const hasTables = $contentClone.find('table').length > 0;
  const hasImages = $contentClone.find('img').length > 0;
  const hasBlockquotes = $contentClone.find('blockquote').length > 0;
  
  // Check for excessive bold or italic text
  const boldText = $contentClone.find('strong, b');
  const italicText = $contentClone.find('em, i');
  const formattedTextCount = boldText.length + italicText.length;
  const formattedTextRatio = formattedTextCount / (paragraphCount || 1);
  
  // Check for passive voice indicators (simplified)
  // Note: A proper passive voice detector for Turkish would be more complex
  const passiveIndicators = [
    "edildi", "edilmiş", "edilen", "edilebilir",
    "olundu", "olunmuş", "olunan", "olunabilir",
    "yapıldı", "yapılmış", "yapılan", "yapılabilir"
  ];
  
  let passiveVoiceCount = 0;
  for (const indicator of passiveIndicators) {
    const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
    const matches = text.match(regex) || [];
    passiveVoiceCount += matches.length;
  }
  
  const passiveVoiceRatio = passiveVoiceCount / (sentenceCount || 1);
  
  // Check for transition words (connecting words)
  const transitionWords = [
    "ayrıca", "bunun yanında", "bununla birlikte", "dahası", "aynı zamanda",
    "öncelikle", "ilk olarak", "ikinci olarak", "son olarak", "özetle",
    "sonuç olarak", "bu nedenle", "bu sebeple", "çünkü", "dolayısıyla",
    "örneğin", "örnek olarak", "diğer bir deyişle", "başka bir ifadeyle",
    "ancak", "fakat", "lakin", "buna rağmen", "öte yandan"
  ];
  
  let transitionWordCount = 0;
  for (const word of transitionWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex) || [];
    transitionWordCount += matches.length;
  }
  
  const transitionWordsRatio = transitionWordCount / (sentenceCount || 1);
  
  // Check for filler words and redundant expressions
  const fillerWords = [
    "aslında", "gerçekten", "tabii ki", "elbette", "kesinlikle",
    "yani", "işte", "şey", "falan", "filan", "hani", "bayağı",
    "bir nevi", "bir çeşit", "bir tür", "bir sürü", "epey",
    "oldukça", "çok fazla", "gayet", "son derece"
  ];
  
  let fillerWordCount = 0;
  for (const word of fillerWords) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex) || [];
    fillerWordCount += matches.length;
  }
  
  const fillerWordsRatio = fillerWordCount / (wordCount || 1);
  
  // Content type detection for tailored recommendations
  const isArticle = $('article').length > 0 || 
    paragraphCount > 5 || 
    $('[itemtype*="Article"]').length > 0 ||
    $('meta[property="og:type"][content="article"]').length > 0;
    
  const isProductPage = $('[itemtype*="Product"]').length > 0 ||
    $('.product').length > 0 ||
    $('#product').length > 0 ||
    $('.buy, .purchase, .add-to-cart, .price').length > 0;
    
  const isHomepage = $('body').hasClass('home') || 
    $('meta[property="og:type"][content="website"]').length > 0 ||
    ($('link[rel="canonical"]').attr('href') || '').split('/').filter(Boolean).length <= 1;
  
  // Analyzing content richness and engagement factors
  const contentRichnessScore = (
    (hasLists ? 1 : 0) +
    (hasTables ? 1 : 0) +
    (hasImages ? 1 : 0) +
    (hasBlockquotes ? 1 : 0) +
    (headingDensity > 0.1 ? 1 : 0) +
    (transitionWordsRatio > 0.1 ? 1 : 0)
  ) / 6; // Scale from 0 to 1
  
  // Calculate overall readability score (weighted combination of factors)
  // Adjust weights based on importance for your use case
  const readabilityScore = Math.round(
    (fleschScore * 0.4) + 
    (100 - (longSentencesRatio * 100) * 0.2) +
    (100 - (longParagraphsRatio * 100) * 0.1) +
    (uniqueWordRatio * 50) + 
    (Math.min(transitionWordsRatio, 0.4) * 60) +
    (contentRichnessScore * 100 * 0.2) -
    (passiveVoiceRatio * 20) -
    (fillerWordsRatio * 100)
  );
  
  // Cap score between 0-100
  const finalReadabilityScore = Math.max(0, Math.min(100, readabilityScore));
  
  // Generate readability report
  
  // 1. Overall readability assessment
  if (finalReadabilityScore >= 80) {
    successes.push({ 
      field: 'readability-score', 
      message: `Okunabilirlik skoru mükemmel: ${finalReadabilityScore}/100`, 
      impact: 'high positive' 
    });
  } else if (finalReadabilityScore >= 60) {
    successes.push({ 
      field: 'readability-score', 
      message: `Okunabilirlik skoru iyi: ${finalReadabilityScore}/100`, 
      impact: 'medium positive' 
    });
  } else if (finalReadabilityScore >= 40) {
    issues.push({ 
      type: 'warning', 
      field: 'readability-score', 
      message: `Okunabilirlik skoru ortalama: ${finalReadabilityScore}/100`, 
      suggestion: 'Aşağıdaki önerileri uygulayarak içeriğinizin okunabilirliğini iyileştirin.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '', 
      explanation: 'İçerik okunabilirliği, kullanıcı deneyimini doğrudan etkiler. Kolay okunan içerikler, kullanıcıların sayfada daha uzun süre kalmasını ve içeriği daha iyi anlamasını sağlar. Bu, daha düşük hemen çıkma oranı ve daha yüksek dönüşüm oranlarıyla sonuçlanabilir.', 
      reference: 'https://developers.google.com/search/docs/appearance/page-experience', 
      category: 'User Experience' 
    });
  } else {
    issues.push({ 
      type: 'error', 
      field: 'readability-score', 
      message: `Okunabilirlik skoru düşük: ${finalReadabilityScore}/100`, 
      suggestion: 'İçeriğinizin okunabilirliğini artırmak için kapsamlı bir düzenleme yapmalısınız.', 
      impact: 'high', 
      difficulty: 'zor', 
      example: '', 
      explanation: 'Düşük okunabilirlik, kullanıcıların içeriğinizi anlamakta zorlanmasına ve sayfanızı hızla terk etmesine neden olur. Bu, engagement metriklerinizi olumsuz etkiler ve dönüşüm oranlarınızı düşürür. Google gibi arama motorları, kullanıcı deneyimini giderek daha fazla önemsediğinden, okunabilirlik dolaylı olarak sıralama faktörlerini de etkiler.', 
      reference: 'https://developers.google.com/search/docs/appearance/page-experience', 
      category: 'User Experience' 
    });
  }
  
  // 2. Content volume assessment
  if (wordCount < 300 && isArticle) {
    issues.push({ 
      type: 'warning', 
      field: 'content-length', 
      message: `İçerik çok kısa: ${wordCount} kelime`, 
      suggestion: 'İçeriği genişletin ve derinleştirin. Makaleler için en az 300-500 kelime önerilir.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '', 
      explanation: 'Çok kısa içerikler genellikle bir konuyu yeterince kapsamaz ve arama motorları tarafından "thin content" (yetersiz içerik) olarak değerlendirilebilir. Kapsamlı içerikler, kullanıcı sorularını daha iyi yanıtlar ve daha fazla anahtar kelime için sıralama potansiyeli taşır.', 
      reference: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content', 
      category: 'Content Quality' 
    });
  } else if (wordCount > 300 && wordCount < 600 && isArticle) {
    issues.push({ 
      type: 'info', 
      field: 'content-length', 
      message: `İçerik yeterli uzunlukta değil: ${wordCount} kelime`, 
      suggestion: 'Daha kapsamlı bir içerik oluşturmayı düşünün. Ortalama bir makale için 600-1200 kelime idealdir.', 
      impact: 'low', 
      difficulty: 'orta', 
      example: '', 
      explanation: 'İçeriğiniz temel bilgileri kapsıyor olabilir, ancak rakip içeriklerin kapsamını ve derinliğini inceleyerek daha fazla değer sunabilirsiniz. Daha kapsamlı içerikler genellikle daha iyi sıralama potansiyeline sahiptir.', 
      reference: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content', 
      category: 'Content Quality' 
    });
  } else if (wordCount > 600 && isArticle) {
    successes.push({ 
      field: 'content-length', 
      message: `İçerik yeterli uzunlukta: ${wordCount} kelime`, 
      impact: 'medium positive' 
    });
  }
  
  if (isProductPage && wordCount < 250) {
    issues.push({ 
      type: 'info', 
      field: 'product-content-length', 
      message: `Ürün açıklaması kısa: ${wordCount} kelime`, 
      suggestion: 'Ürün açıklamasını genişletin. Ürünün özelliklerini, faydalarını ve kullanım senaryolarını detaylandırın.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<p>Bu ergonomik sandalye, uzun çalışma saatleri için tasarlanmıştır. Ayarlanabilir kol dayamaları, yükseklik ayarı ve özel bel desteği ile ofiste konforunuzu artırır. Nefes alabilen file malzeme ile sıcak havalarda bile rahat kullanım sağlar. 5 tekerlekli sağlam taban, 150 kg ağırlığa kadar destekler ve her türlü zemin için uygundur.</p>', 
      explanation: 'Detaylı ürün açıklamaları, müşterilerin satın alma kararlarını olumlu etkiler ve dönüşüm oranlarını artırır. Ayrıca, daha fazla anahtar kelime için sıralama potansiyeli yaratır ve ürünle ilgili müşteri sorularını yanıtlayarak müşteri hizmetleri yükünü azaltır.', 
      reference: 'https://developers.google.com/search/docs/specialty/ecommerce', 
      category: 'E-commerce' 
    });
  }
  
  // 3. Sentence length assessment
  if (avgSentenceLength > 20) {
    issues.push({ 
      type: 'warning', 
      field: 'sentence-length', 
      message: `Ortalama cümle uzunluğu çok fazla: ${avgSentenceLength.toFixed(1)} kelime`, 
      suggestion: 'Uzun cümleleri bölün. İdeal ortalama cümle uzunluğu 15-20 kelimedir.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<!-- Uzun cümle -->\n<p>Modern web tasarımında kullanıcı deneyimi, görsel çekicilik, kullanılabilirlik, erişilebilirlik, sayfa yükleme hızı, mobil uyumluluk ve etkili içerik stratejisi gibi birçok faktörün bir araya gelmesiyle oluşur ve bu unsurların her biri kullanıcıların sitede kalma süresini ve dönüşüm oranlarını doğrudan etkiler.</p>\n\n<!-- Bölünmüş cümleler -->\n<p>Modern web tasarımında kullanıcı deneyimi birçok faktörden oluşur. Görsel çekicilik, kullanılabilirlik ve erişilebilirlik bunların başında gelir. Sayfa yükleme hızı ve mobil uyumluluk da kritik öneme sahiptir. Bu unsurların her biri, kullanıcıların sitede kalma süresini ve dönüşüm oranlarını doğrudan etkiler.</p>', 
      explanation: 'Uzun cümleler, okuyucuların anlamasını zorlaştırır ve odaklanma sorunlarına yol açar. Özellikle web içeriği hızlı taranarak okunduğundan, daha kısa ve net cümleler kullanmak, mesajınızın daha iyi anlaşılmasını sağlar. Türkçe için ideal ortalama cümle uzunluğu 15-20 kelime arasındadır.', 
      reference: 'https://developers.google.com/search/docs/appearance/content-best-practices', 
      category: 'Content Quality' 
    });
  } else if (avgSentenceLength < 10) {
    issues.push({ 
      type: 'info', 
      field: 'sentence-length', 
      message: `Ortalama cümle uzunluğu çok kısa: ${avgSentenceLength.toFixed(1)} kelime`, 
      suggestion: 'Bazı cümleleri birleştirerek daha akıcı bir anlatım elde edin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<!-- Çok kısa cümleler -->\n<p>Web siteniz hızlı olmalı. Kullanıcılar beklemez. Hızlı siteler daha çok ziyaret alır. Google hızlı siteleri sever.</p>\n\n<!-- Daha dengeli cümleler -->\n<p>Web siteniz hızlı olmalıdır çünkü kullanıcılar beklemek istemez. Hızlı siteler daha çok ziyaret alır ve Google algoritmaları tarafından da tercih edilir.</p>', 
      explanation: 'Çok kısa cümlelerden oluşan içerikler kopuk ve akıcı olmayan bir okuma deneyimi yaratabilir. Cümleleri mantıksal bağlantılarla birleştirmek, içeriğin akıcılığını artırır ve daha profesyonel bir ton oluşturur. İdeal bir içerikte farklı uzunluktaki cümlelerin dengeli kullanımı önerilir.', 
      reference: 'https://developers.google.com/search/docs/appearance/page-experience', 
      category: 'Content Quality' 
    });
  } else {
    successes.push({ 
      field: 'sentence-length', 
      message: `Ortalama cümle uzunluğu ideal: ${avgSentenceLength.toFixed(1)} kelime`, 
      impact: 'medium positive' 
    });
  }
  
  if (longSentencesRatio > 0.2) {
    issues.push({ 
      type: 'warning', 
      field: 'long-sentences', 
      message: `Çok uzun cümle oranı yüksek: %${(longSentencesRatio * 100).toFixed(1)}`, 
      suggestion: '25 kelimeden uzun cümleleri bölün veya kısaltın.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<!-- Çok uzun bir cümle -->\n<p>E-ticaret platformunuzdaki dönüşüm oranlarını artırmak için ürün sayfalarınızın optimizasyonu, ödeme sürecinin basitleştirilmesi, mobil kullanıcı deneyiminin iyileştirilmesi, sayfa yükleme hızının artırılması, güven unsurlarının belirgin şekilde gösterilmesi, kişiselleştirilmiş öneriler sunulması ve A/B testleriyle sürekli iyileştirme yapılması gibi stratejileri bir arada uygulamanız gerekmektedir.</p>\n\n<!-- Bölünmüş hali -->\n<p>E-ticaret platformunuzdaki dönüşüm oranlarını artırmak için çeşitli stratejiler uygulamalısınız. Öncelikle ürün sayfalarınızı optimize edin ve ödeme sürecini basitleştirin. Mobil kullanıcı deneyimini iyileştirin ve sayfa yükleme hızını artırın. Güven unsurlarını belirgin şekilde gösterin ve kişiselleştirilmiş öneriler sunun. Son olarak, A/B testleriyle sürekli iyileştirmeler yapın.</p>', 
      explanation: 'Çok uzun cümleler (25+ kelime), okuyucunun dikkatini dağıtır ve anlamayı zorlaştırır. Bu tür cümleler genellikle birden fazla fikir içerir ve okuyucunun bunları zihninde tutması gerekir. Uzun cümleleri mantıklı şekilde böldüğünüzde, her bir cümle tek bir fikre odaklanır ve okuyucu için daha kolay anlaşılır hale gelir.', 
      reference: 'https://developers.google.com/search/docs/appearance/page-experience', 
      category: 'Content Quality' 
    });
  }
  
  // 4. Paragraph length assessment
  if (avgParagraphLength > 100) {
    issues.push({ 
      type: 'warning', 
      field: 'paragraph-length', 
      message: `Ortalama paragraf uzunluğu çok fazla: ${avgParagraphLength.toFixed(1)} kelime`, 
      suggestion: 'Paragraflardaki farklı fikirleri ayrı paragraflara bölün. Web içeriği için ideal paragraf uzunluğu 40-80 kelimedir.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<!-- Çok uzun paragraf -->\n<p>Çok uzun bir paragraf metni...</p>\n\n<!-- Bölünmüş paragraflar -->\n<p>İlk fikri açıklayan kısa paragraf.</p>\n<p>İkinci konuyu ele alan ayrı bir paragraf.</p>\n<p>Sonuç ve kapanış cümleleri içeren kısa bir paragraf.</p>', 
      explanation: 'Uzun paragraflar, özellikle mobil cihazlarda okuyucuları caydırır ve içeriğin "taranabilirliğini" azaltır. Web okuyucuları genellikle içeriği tarar, detaylı okumazlar. Kısa paragraflar (40-80 kelime) okuyucunun gözünü dinlendirir ve içeriğin ana fikirlerini daha kolay yakalamasını sağlar.', 
      reference: 'https://developers.google.com/search/docs/appearance/text-best-practices', 
      category: 'Content Quality' 
    });
  } else if (paragraphCount > 0 && avgParagraphLength < 20) {
    issues.push({ 
      type: 'info', 
      field: 'paragraph-short', 
      message: `Ortalama paragraf uzunluğu çok kısa: ${avgParagraphLength.toFixed(1)} kelime`, 
      suggestion: 'Çok kısa paragraflar yerine biraz daha geliştirilmiş paragraflar kullanmayı düşünün.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<!-- Çok kısa paragraflar -->\n<p>Web siteniz için SEO önemlidir.</p>\n<p>Anahtar kelimeleri doğru kullanın.</p>\n<p>İçerik kalitesi kritiktir.</p>\n\n<!-- Daha dengeli paragraflar -->\n<p>Web siteniz için SEO önemlidir. Doğru stratejilerle arama motorlarında görünürlüğünüzü artırabilirsiniz.</p>\n<p>Anahtar kelimeleri doğru kullanmak, hedef kitlenizin sizi bulmasını sağlar. Ancak aşırı kullanımdan kaçının.</p>', 
      explanation: 'Tek cümlelik çok kısa paragraflar, bazen etkili olabilse de, sürekli kullanıldığında içeriğin akışını bozabilir ve metni parçalanmış gösterebilir. Fikirlerinizi biraz daha geliştirmek ve destekleyici cümlelerle zenginleştirmek, içeriğinizin daha profesyonel ve kapsamlı görünmesini sağlar.', 
      reference: 'https://developers.google.com/search/docs/appearance/text-best-practices', 
      category: 'Content Quality' 
    });
  } else if (paragraphCount > 0) {
    successes.push({ 
      field: 'paragraph-length', 
      message: `Paragraf uzunlukları iyi dengelenmiş: ${avgParagraphLength.toFixed(1)} kelime`, 
      impact: 'medium positive' 
    });
  }
  
  // 5. Heading structure assessment
  if (headingHierarchyIssues.length > 0) {
    issues.push({ 
      type: 'warning', 
      field: 'heading-structure', 
      message: `Başlık yapısıyla ilgili sorunlar: ${headingHierarchyIssues.join(', ')}`, 
      suggestion: 'Doğru başlık hiyerarşisi kullanın (H1, H2, H3...) ve içeriği mantıksal olarak bölümleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<!-- Doğru başlık hiyerarşisi -->\n<h1>Ana Sayfa Başlığı</h1>\n<p>Giriş paragrafı...</p>\n\n<h2>Birinci Bölüm</h2>\n<p>İçerik...</p>\n\n<h3>Alt Başlık</h3>\n<p>Detaylar...</p>\n\n<h2>İkinci Bölüm</h2>\n<p>İçerik...</p>', 
      explanation: 'Başlıklar (H1-H6), içeriğinizin yapısını hem kullanıcılara hem de arama motorlarına aktarır. Doğru başlık hiyerarşisi, içeriğin taranabilirliğini artırır, kullanıcı deneyimini iyileştirir ve arama motorlarının içeriğinizi daha iyi anlamasını sağlar. Her sayfada tek bir H1 başlığı olmalı ve alt başlıklar mantıksal bir sıra izlemelidir.', 
      reference: 'https://developers.google.com/search/docs/appearance/structured-data/article', 
      category: 'SEO' 
    });
  } else if (totalHeadings > 0) {
    successes.push({ 
      field: 'heading-structure', 
      message: `Başlık yapısı düzgün: ${totalHeadings} başlık`, 
      impact: 'medium positive' 
    });
  }
  
  if (wordCount > 500 && headingDensity < 0.05) {
    issues.push({ 
      type: 'warning', 
      field: 'heading-density', 
      message: 'Başlık yoğunluğu düşük', 
      suggestion: 'Daha fazla başlık ve alt başlık ekleyerek içeriği bölümlere ayırın.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<h2>Önemli Bölüm Başlığı</h2>\n<p>İçerik...</p>\n<h3>Detaylı Alt Başlık</h3>\n<p>Daha fazla içerik...</p>', 
      explanation: 'Başlıklar, uzun içerikleri daha okunaklı hale getirir ve kullanıcıların ilgilendikleri bilgileri hızlıca bulmalarını sağlar. Başlık kullanımı, içeriğinizi anlamlı bölümlere ayırır ve içeriğin taranmasını kolaylaştırır. Ayrıca, arama motorlarının içerik yapınızı ve ana konularınızı anlamasına yardımcı olur.', 
      reference: 'https://developers.google.com/search/docs/appearance/structured-data/article', 
      category: 'Content Quality' 
    });
  }
  
  // 6. Formatting and visual structure
  let formattingScore = 0;
  const formattingIssues: string[] = [];
  
  if (!hasLists && wordCount > 500) {
    formattingIssues.push("Liste (ul/ol) eksikliği");
  } else {
    formattingScore += 1;
  }
  
  if (!hasImages && wordCount > 300 && !isHomepage) {
    formattingIssues.push("Görsellerin eksikliği");
  } else {
    formattingScore += 1;
  }
  
  if (formattedTextRatio > 0.5) {
    formattingIssues.push("Aşırı kalın/italik metin kullanımı");
  } else if (formattedTextRatio > 0) {
    formattingScore += 1;
  }
  
  if (formattingIssues.length > 0) {
    issues.push({ 
      type: 'warning', 
      field: 'visual-formatting', 
      message: `İçerik formatlamasında sorunlar: ${formattingIssues.join(', ')}`, 
      suggestion: 'Listeleme, görsel öğeler ve uygun metin vurguları ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<p>Önemli noktalar şunlardır:</p>\n<ul>\n  <li>Birinci madde</li>\n  <li>İkinci madde</li>\n  <li>Üçüncü madde</li>\n</ul>\n\n<p>Ayrıca <strong>önemli noktaları</strong> vurgulamak için kalın metin kullanabilirsiniz.</p>', 
      explanation: 'İyi formatlanmış içerik, kullanıcıların bilgiyi daha kolay işlemesini sağlar. Listeler, önemli noktaları gruplar. Görseller, karmaşık bilgileri basitleştirir ve metnin görsel çekiciliğini artırır. Kalın veya italik metin, anahtar noktaları vurgular. Ancak bu formatlamaların aşırı kullanımı içeriğin okunabilirliğini azaltabilir.', 
      reference: 'https://developers.google.com/search/docs/appearance/text-best-practices', 
      category: 'User Experience' 
    });
  } else if (formattingScore >= 2) {
    successes.push({ 
      field: 'visual-formatting', 
      message: 'İçerik iyi formatlanmış, listeler ve/veya görseller uygun şekilde kullanılmış.', 
      impact: 'medium positive' 
    });
  }
  
  // 7. Passive voice assessment
  if (passiveVoiceRatio > 0.3) {
    issues.push({ 
      type: 'info', 
      field: 'passive-voice', 
      message: `Edilgen çatı kullanımı yüksek: Yaklaşık ${Math.round(passiveVoiceRatio * 100)}% oranında`, 
      suggestion: 'Daha az edilgen çatı kullanarak anlatımı güçlendirin.', 
      impact: 'low', 
      difficulty: 'orta', 
      example: '<!-- Edilgen çatı -->\n<p>Ürünler tarafımızdan özenle seçilmiştir.</p>\n\n<!-- Etken çatı -->\n<p>Ürünleri özenle seçiyoruz.</p>', 
      explanation: 'Edilgen çatı (örn. "yapılmıştır", "edilmiştir") genellikle etken çatıdan daha az etkilidir ve daha fazla kelime gerektirir. Etken çatı kullanmak, metninizi daha net, doğrudan ve güçlü hale getirir. Ancak bazı durumlarda, özellikle akademik veya teknik yazılarda, edilgen çatı uygun olabilir.', 
      reference: 'https://developers.google.com/search/docs/appearance/content-best-practices', 
      category: 'Content Quality' 
    });
  }
  
  // 8. Transition words usage
  if (transitionWordsRatio < 0.1 && sentenceCount > 10) {
    issues.push({ 
      type: 'info', 
      field: 'transition-words', 
      message: 'Bağlayıcı ifadeler (geçiş kelimeleri) yetersiz', 
      suggestion: 'Cümleler ve paragraflar arasında bağlantı kuran geçiş kelimeleri ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<p>Web sitenizde SEO uygulamaları önemlidir. <strong>Bunun yanında</strong>, kullanıcı deneyimi de dikkate alınmalıdır. <strong>Örneğin</strong>, hızlı yüklenen sayfalar kullanıcı memnuniyetini artırır. <strong>Sonuç olarak</strong>, hem SEO hem de kullanıcı deneyimi faktörleri bir arada düşünülmelidir.</p>', 
      explanation: 'Geçiş kelimeleri ve ifadeleri (örneğin, "bunun yanında", "örneğin", "sonuç olarak"), fikirler ve cümleler arasında mantıksal bağlantılar kurar. Bu ifadeler, içeriğin akıcılığını artırır ve okuyucuların metindeki fikir akışını takip etmesini kolaylaştırır. Yeterli geçiş kelimesi kullanımı, içeriğinizin daha profesyonel ve tutarlı görünmesini sağlar.', 
      reference: 'https://developers.google.com/search/docs/appearance/content-best-practices', 
      category: 'Content Quality' 
    });
  } else if (transitionWordsRatio >= 0.15) {
    successes.push({ 
      field: 'transition-words', 
      message: 'Geçiş kelimeleri etkin şekilde kullanılmış.', 
      impact: 'medium positive' 
    });
  }
  
  // 9. Redundant expressions and filler words
  if (fillerWordsRatio > 0.05) {
    issues.push({ 
      type: 'info', 
      field: 'filler-words', 
      message: 'Gereksiz dolgu kelimeleri ve ifadeler yüksek oranda kullanılmış', 
      suggestion: 'Gereksiz ifadeleri ve dolgu kelimelerini azaltın.', 
      impact: 'low', 
      difficulty: 'orta', 
      example: '<!-- Dolgu kelimeli -->\n<p>Aslında bu ürün gerçekten çok fazla fayda sağlıyor ve yani kesinlikle oldukça etkileyici özelliklere sahip diyebiliriz.</p>\n\n<!-- Sadeleştirilmiş -->\n<p>Bu ürün önemli faydalar sağlıyor ve etkileyici özelliklere sahip.</p>', 
      explanation: 'Dolgu kelimeleri ve gereksiz ifadeler, içeriğinizi şişirir ve ana mesajınızı zayıflatır. "Aslında", "gerçekten", "kesinlikle" gibi kelimeler genellikle anlama çok az katkı sağlar. Metninizi bu tür ifadelerden arındırdığınızda, daha özlü, net ve etkili bir anlatım elde edersiniz.', 
      reference: 'https://developers.google.com/search/docs/appearance/content-best-practices', 
      category: 'Content Quality' 
    });
  }
  
  // 10. Content-specific recommendations
  if (isArticle) {
    // Check for article-specific readability factors
    if (!hasBlockquotes && wordCount > 800) {
      issues.push({ 
        type: 'info', 
        field: 'article-format', 
        message: 'Makale içeriği daha fazla çeşitlilik ve görsel bölünme gerektirebilir', 
        suggestion: 'Alıntılar, öne çıkan ifadeler veya ilgi çekici notlar ekleyin.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: '<blockquote>\n  <p>"Önemli bir alıntı veya vurgulanması gereken bir ifade buraya gelebilir."</p>\n</blockquote>', 
        explanation: 'Uzun makalelerde içeriği çeşitlendirmek, okuyucuların ilgisini canlı tutar. Alıntılar, öne çıkan ifadeler ve görsel bölücüler, uzun metinleri daha çekici hale getirir ve önemli noktaları vurgular. Bu öğeler, okuyucuya görsel molalar sağlar ve metnin anahtar noktalarını hatırlamalarına yardımcı olur.', 
        reference: 'https://developers.google.com/search/docs/appearance/structured-data/article', 
        category: 'Content Format' 
      });
    }
  } else if (isProductPage) {
    // Check for product-specific content factors
    if (wordCount > 0 && !hasLists) {
      issues.push({ 
        type: 'warning', 
        field: 'product-lists', 
        message: 'Ürün sayfasında özellik listeleri eksik', 
        suggestion: 'Ürün özelliklerini ve faydalarını liste halinde sunun.', 
        impact: 'high', 
        difficulty: 'kolay', 
        example: '<h3>Özellikler:</h3>\n<ul>\n  <li>Yüksek çözünürlüklü ekran (1920x1080)</li>\n  <li>12 saat pil ömrü</li>\n  <li>Su geçirmez tasarım (IP68)</li>\n  <li>64GB depolama alanı</li>\n</ul>', 
        explanation: 'Ürün sayfalarında madde işaretli listeler, özellikle önemlidir çünkü müşteriler genellikle ürün özelliklerini hızlıca taramak ister. Listeler, teknik özellikleri ve faydaları açıkça gösterir, bilgileri kolayca karşılaştırılabilir hale getirir ve müşterilerin satın alma kararını hızlandırır.', 
        reference: 'https://developers.google.com/search/docs/specialty/ecommerce', 
        category: 'E-commerce' 
      });
    }
  }
  
  // 11. Overall content organization assessment
  if (wordCount > 300 && headingDensity < 0.05 && paragraphCount > 0 && avgParagraphLength > 100) {
    issues.push({ 
      type: 'warning', 
      field: 'content-organization', 
      message: 'İçerik yapısı ve organizasyonu iyileştirilmeli', 
      suggestion: 'İçeriği daha küçük, sindirilebilir bölümlere ayırın ve uygun başlıklar kullanın.', 
      impact: 'high', 
      difficulty: 'orta', 
      example: '<h2>Önemli Konu Başlığı</h2>\n<p>Kısa ve öz bir paragraf (40-80 kelime).</p>\n<h3>Detaylı Alt Başlık</h3>\n<p>Başka bir kısa paragraf.</p>\n<ul>\n  <li>Önemli nokta 1</li>\n  <li>Önemli nokta 2</li>\n</ul>', 
      explanation: 'İyi organize edilmiş içerik, kullanıcının bilgiyi daha kolay işlemesini sağlar. Mantıksal bir yapı, başlıklar, kısa paragraflar ve listeler, içeriğin "taranabilirliğini" artırır. Web kullanıcıları genellikle içeriği okumaz, tararlar. İyi yapılandırılmış içerik, bu tarama davranışına uyum sağlar ve kullanıcıların ihtiyaç duydukları bilgiyi hızlıca bulmalarını kolaylaştırır.', 
      reference: 'https://developers.google.com/search/docs/appearance/page-experience', 
      category: 'User Experience' 
    });
  }
  
  // 12. Word variety and vocabulary richness
  if (wordCount > 200 && uniqueWordRatio < 0.4) {
    issues.push({ 
      type: 'info', 
      field: 'vocabulary-richness', 
      message: 'Kelime çeşitliliği düşük', 
      suggestion: 'Daha zengin bir kelime dağarcığı kullanarak içeriği zenginleştirin.', 
      impact: 'low', 
      difficulty: 'orta', 
      example: '<!-- Tekrarlayan kelimeler -->\n<p>Bu ürün iyi bir üründür. İyi özelliklere sahiptir. İyi fiyatlandırılmıştır.</p>\n\n<!-- Daha zengin kelime dağarcığı -->\n<p>Bu ürün mükemmel bir seçimdir. Etkileyici özelliklere sahiptir. Uygun fiyatıyla da dikkat çeker.</p>', 
      explanation: 'Aynı kelimeleri sürekli tekrar etmek, içeriğinizi sıkıcı ve tekdüze hale getirebilir. Daha zengin bir kelime dağarcığı kullanmak, metninizi daha ilgi çekici ve profesyonel yapar. Ancak, hedef kitlenizin anlayabileceği kelimeler kullanmaya dikkat edin - çok karmaşık veya teknik kelimeler de anlaşılırlığı azaltabilir.', 
      reference: 'https://developers.google.com/search/docs/appearance/content-best-practices', 
      category: 'Content Quality' 
    });
  } else if (wordCount > 200 && uniqueWordRatio > 0.6) {
    successes.push({ 
      field: 'vocabulary-richness', 
      message: 'Kelime çeşitliliği zengin ve içerik dilsel açıdan çeşitli.', 
      impact: 'medium positive' 
    });
  }
  
  // Add a Math.std function for standard deviation calculation
  function std(array: number[]): number {
    if (array.length === 0) return 0;
    const mean = array.reduce((a, b) => a + b, 0) / array.length;
    const variance = array.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / array.length;
    return Math.sqrt(variance);
  }
  
  return { issues, successes };
}

function analyzeLinks($: CheerioAPI, url: string): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // CSS için güvenli karakter dönüşümü yapan fonksiyon - global olarak tanımla
  function cssEscape(value: string) {
    if (value === '') return '';
    
    let str = String(value);
    const length = str.length;
    let index = -1;
    let result = '';
    const firstCodeUnit = str.charCodeAt(0);
    
    // İlk karakter için özel durum
    if (
      firstCodeUnit === 0x0000 ||
      (firstCodeUnit >= 0x0001 && firstCodeUnit <= 0x001F) ||
      firstCodeUnit === 0x007F ||
      (firstCodeUnit >= 0x0030 && firstCodeUnit <= 0x0039)
    ) {
      result = '\\' + firstCodeUnit.toString(16) + ' ';
    } else {
      result = str.charAt(0);
    }
    
    // Kalanlar
    while (++index < length) {
      const codeUnit = str.charCodeAt(index);
      
      // Özel karakterleri kaçır
      if (
        codeUnit === 0x0000 ||
        (codeUnit >= 0x0001 && codeUnit <= 0x001F) ||
        codeUnit === 0x007F ||
        (codeUnit === 0x002E && index === 0) || // nokta ilk karakterse
        (codeUnit >= 0x0030 && codeUnit <= 0x0039 && index === 0) // rakam ilk karakterse
      ) {
        result += '\\' + codeUnit.toString(16) + ' ';
      } else if (
        codeUnit === 0x002D || // -
        codeUnit === 0x005F || // _
        codeUnit === 0x002E || // .
        (codeUnit >= 0x0030 && codeUnit <= 0x0039) || // 0-9
        (codeUnit >= 0x0041 && codeUnit <= 0x005A) || // A-Z
        (codeUnit >= 0x0061 && codeUnit <= 0x007A) // a-z
      ) {
        result += str.charAt(index);
      } else {
        result += '\\' + str.charAt(index);
      }
    }
    
    return result;
  }
  
  // Parse the base URL for domain comparison
  const baseUrl = new URL(url);
  const baseDomain = baseUrl.hostname;
  
  // Get all links
  const allLinks = $("a[href]");
  const allLinksArray = allLinks.toArray();
  const allLinksCount = allLinksArray.length;
  
  // Initialize counters and collections
  const internalLinks: any[] = [];
  const externalLinks: any[] = [];
  const internalLinksBySection: Record<string, number> = {
    navigation: 0,
    footer: 0,
    sidebar: 0,
    content: 0,
    other: 0
  };
  
  // Empty/Placeholder links
  const emptyLinks: any[] = [];  // href="#" or javascript:void(0)
  const javascriptLinks: any[] = [];  // href="javascript:..."
  
  // Links with issues
  const brokenLinkCandidates: any[] = [];  // 404 potential (can't actually check without HTTP)
  const relativeLinkMissingSlash: any[] = [];  // href="path" instead of href="/path"
  const httpLinks: any[] = [];  // Using http instead of https
  const missingTitleAttrs: any[] = [];  // Links without title attributes
  const blankTargetNoRel: any[] = [];  // target="_blank" without rel="noopener noreferrer"
  const linkToFiles: any[] = [];  // Links to PDFs, DOCs, etc.
  const anchorsNoHref: any[] = [];  // <a> tags without href attributes
  
  // SEO-specific link issues
  const sameAnchorDifferentUrls: Record<string, string[]> = {};  // Same anchor text, different URLs
  const genericAnchors: any[] = [];  // "click here", "read more", etc.
  const longAnchors: any[] = [];  // Very long anchor text (>8 words)
  const duplicateLinks: Record<string, number> = {};  // Same URL repeated multiple times
  
  // Special links
  const nofollowLinks: any[] = [];
  const ugcLinks: any[] = [];
  const sponsoredLinks: any[] = [];
  const hasCanonical = $('link[rel="canonical"]').length > 0;
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || '';
  
  // Identify site sections based on common selectors and patterns
  function identifySectionFromElement(element: any): string {
    const parents = $(element).parents().get();
    
    // Check for main navigation
    for (const parent of parents) {
      const $parent = $(parent);
      if (
        $parent.is('nav') || 
        $parent.attr('id')?.includes('nav') || 
        $parent.attr('class')?.includes('nav') ||
        $parent.attr('id')?.includes('menu') ||
        $parent.attr('class')?.includes('menu') ||
        $parent.attr('role') === 'navigation'
      ) {
        return 'navigation';
      }
    }
    
    // Check for footer
    for (const parent of parents) {
      const $parent = $(parent);
      if (
        $parent.is('footer') ||
        $parent.attr('id')?.includes('footer') ||
        $parent.attr('class')?.includes('footer')
      ) {
        return 'footer';
      }
    }
    
    // Check for sidebar
    for (const parent of parents) {
      const $parent = $(parent);
      if (
        $parent.attr('id')?.includes('sidebar') ||
        $parent.attr('class')?.includes('sidebar') ||
        $parent.attr('id')?.includes('side') ||
        $parent.attr('class')?.includes('side') ||
        $parent.attr('class')?.includes('widget')
      ) {
        return 'sidebar';
      }
    }
    
    // Check for main content area
    for (const parent of parents) {
      const $parent = $(parent);
      if (
        $parent.is('main') ||
        $parent.attr('id')?.includes('content') ||
        $parent.attr('class')?.includes('content') ||
        $parent.attr('id')?.includes('main') ||
        $parent.attr('class')?.includes('main') ||
        $parent.is('article')
      ) {
        return 'content';
      }
    }
    
    return 'other';
  }
  
  // Process each link
  allLinks.each((_, element) => {
    const $link = $(element);
    const href = $link.attr('href') || '';
    const text = $link.text().trim();
    const title = $link.attr('title') || '';
    const rel = $link.attr('rel') || '';
    const target = $link.attr('target') || '';
    const section = identifySectionFromElement(element);
    
    // Categorize by link type
    try {
      // Handle empty or javascript links
      if (!href || href === '#' || href === '/' || href === 'javascript:void(0)') {
        emptyLinks.push({ element, href, text, section });
        return;
      }
      
      if (href.toLowerCase().startsWith('javascript:')) {
        javascriptLinks.push({ element, href, text, section });
        return;
      }
      
      // Handle file links
      const fileExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.txt'];
      if (fileExtensions.some(ext => href.toLowerCase().endsWith(ext))) {
        linkToFiles.push({ element, href, text, section });
      }
      
      // Check if internal or external
      let isInternal = false;
      
      // Absolute URLs that match the base domain
      if (href.includes('://')) {
        try {
          const linkUrl = new URL(href);
          isInternal = linkUrl.hostname === baseDomain;
          
          if (!isInternal) {
            externalLinks.push({ element, href, text, section });
          } else {
            internalLinks.push({ element, href, text, section });
            internalLinksBySection[section]++;
            
            if (href.startsWith('http:') && url.startsWith('https:')) {
              httpLinks.push({ element, href, text, section });
            }
          }
        } catch (e) {
          brokenLinkCandidates.push({ element, href, text, section });
        }
      } 
      // Relative URLs are always internal
      else {
        isInternal = true;
        internalLinks.push({ element, href, text, section });
        internalLinksBySection[section]++;
        
        if (href.startsWith('//')) {
          // Protocol-relative URL
          if (url.startsWith('https:')) {
            httpLinks.push({ element, href, text, section });
          }
        } else if (!href.startsWith('/') && !href.startsWith('#') && !href.startsWith('?')) {
          relativeLinkMissingSlash.push({ element, href, text, section });
        }
      }
      
      // Track duplicate links
      if (!duplicateLinks[href]) {
        duplicateLinks[href] = 1;
      } else {
        duplicateLinks[href]++;
      }
      
      // Check SEO issues with anchor text
      if (isInternal) {
        const genericTexts = ['tıkla', 'tıklayın', 'buradan', 'daha fazla', 'devamını oku', 'devamı', 'detaylar', 'burada', 'incele', 'devam'];
        if (genericTexts.some(generic => text.toLowerCase().includes(generic)) || text.length < 3) {
          genericAnchors.push({ element, href, text, section });
        }
        
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        if (wordCount > 8) {
          longAnchors.push({ element, href, text, section });
        }
        
        // Track same anchor text pointing to different URLs
        const normalizedText = text.toLowerCase().trim();
        if (normalizedText.length >= 3) {
          if (!sameAnchorDifferentUrls[normalizedText]) {
            sameAnchorDifferentUrls[normalizedText] = [href];
          } else if (!sameAnchorDifferentUrls[normalizedText].includes(href)) {
            sameAnchorDifferentUrls[normalizedText].push(href);
          }
        }
      }
      
      // Check for accessibility and best practices
      if (!title && text.length < 4) {
        missingTitleAttrs.push({ element, href, text, section });
      }
      
      if (target === '_blank' && !rel.includes('noopener')) {
        blankTargetNoRel.push({ element, href, text, section });
      }
      
      // Special link attributes
      if (rel.includes('nofollow')) {
        nofollowLinks.push({ element, href, text, section });
      }
      
      if (rel.includes('ugc')) {
        ugcLinks.push({ element, href, text, section });
      }
      
      if (rel.includes('sponsored')) {
        sponsoredLinks.push({ element, href, text, section });
      }
      
    } catch (e) {
      brokenLinkCandidates.push({ element, href, text, section });
    }
  });
  
  // Find <a> tags without href
  $('a:not([href])').each((_, element) => {
    anchorsNoHref.push({
      element,
      text: $(element).text().trim(),
      section: identifySectionFromElement(element)
    });
  });
  
  // Calculate metrics
  const internalLinksCount = internalLinks.length;
  const externalLinksCount = externalLinks.length;
  const internalLinkRatio = internalLinksCount / (allLinksCount || 1);
  const contentInternalLinks = internalLinksBySection.content;
  
  // Identify anchors with multiple destinations
  const inconsistentAnchors = Object.keys(sameAnchorDifferentUrls)
    .filter(text => sameAnchorDifferentUrls[text].length > 1);
  
  // Identify duplicate links (same URL used many times)
  const excessiveDuplicateLinks = Object.entries(duplicateLinks)
    .filter(([_, count]) => count > 4 && count < allLinksCount * 0.5) // Ignore navigation and pagination
    .map(([href, count]) => ({ href, count }));
  
  // Check for no links in content area
  const hasContentLinks = internalLinksBySection.content > 0;
  
  // Check for orphaned content signals (pages not linked from nav or sidebar)
  const potentialOrphanedContent = !hasCanonical || (canonicalUrl && !canonicalUrl.includes(baseDomain));
  
  // Check for link-to-text ratio (too many links can be overwhelming)
  const bodyText = $('body').text().length;
  const linkDensity = allLinksCount / (bodyText || 1) * 1000; // Links per 1000 characters
  
  // Check if headings are linked (good for long-form content)
  const headingsCount = $('h2, h3, h4').length;
  const linkedHeadings = $('h2 a, h3 a, h4 a, a > h2, a > h3, a > h4').length;
  const linkedHeadingsRatio = linkedHeadings / (headingsCount || 1);
  
  // Check breadcrumb presence
  const hasBreadcrumbs = 
    $('[itemtype*="BreadcrumbList"]').length > 0 || 
    $('.breadcrumb').length > 0 || 
    $('#breadcrumb').length > 0 || 
    $('[class*="breadcrumb"]').length > 0;
  
  // START ANALYSIS REPORT
  
  // 1. Overall link structure assessment
  if (allLinksCount === 0) {
    issues.push({ 
      type: 'error', 
      field: 'no-links', 
      message: 'Sayfada hiç link bulunamadı.', 
      suggestion: 'İçerik içinde gerekli yerlere linkler ekleyin ve gezinti menüleri oluşturun.', 
      impact: 'critical', 
      difficulty: 'orta', 
      example: '<a href="/ilgili-sayfa">İlgili içerik</a>', 
      explanation: 'Linkler, bir web sitesinin temel yapı taşlarıdır. Linkler olmadan, kullanıcılar sitenizde gezinmekte zorlanır ve arama motorları içeriğinizi düzgün bir şekilde tarayamaz. Her sayfada en azından bir ana menü ve içerik içinde ilgili sayfalara linkler bulunmalıdır. Linksiz sayfalar, "çıkmaz sokaklar" olarak nitelendirilir ve hem kullanıcı deneyimi hem de SEO için zararlıdır.',
      reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide', 
      category: 'Site Structure' 
    });
  } else {
    if (internalLinkRatio >= 0.5) {
      successes.push({ 
        field: 'internal-link-ratio', 
        message: `Dahili link oranı iyi: %${Math.round(internalLinkRatio * 100)} (${internalLinksCount}/${allLinksCount})`, 
        impact: 'high positive' 
      });
    } else if (internalLinkRatio >= 0.3) {
      successes.push({ 
        field: 'internal-link-ratio', 
        message: `Dahili link oranı kabul edilebilir: %${Math.round(internalLinkRatio * 100)} (${internalLinksCount}/${allLinksCount})`, 
        impact: 'medium positive' 
      });
    } else {
      issues.push({ 
        type: 'warning', 
        field: 'internal-link-ratio', 
        message: `Dahili link oranı düşük: %${Math.round(internalLinkRatio * 100)} (${internalLinksCount}/${allLinksCount})`, 
        suggestion: 'Sayfanıza daha fazla dahili link ekleyin. İlgili içeriklerinize referans verin.', 
        impact: 'high', 
        difficulty: 'kolay', 
        example: '<p>Bu konuyla ilgili <a href="/ilgili-icerik">şu makalemiz</a> de ilginizi çekebilir.</p>', 
        explanation: 'Dahili linkler, web sitenizin yapısını güçlendirir ve link değerinin (link equity) sitenizdeki sayfalar arasında dağıtılmasını sağlar. Dahili link oranının düşük olması, sitenizin dışarıya çok fazla link değeri kaybettiğini ve kendi içeriğinizi yeterince desteklemediğinizi gösterir. Dengeli bir dahili-harici link oranı, SEO için önemlidir ve sayfalar arasında güçlü bir ilişki ağı kurmanıza yardımcı olur.',
        reference: 'https://yoast.com/internal-linking-for-seo/', 
        category: 'SEO' 
      });
    }
  }
  
  // 2. Links in content assessment
  if (contentInternalLinks > 3 && internalLinksBySection.content / (internalLinksCount || 1) >= 0.3) {
    successes.push({ 
      field: 'content-links', 
      message: `İçerik bölümünde iyi sayıda dahili link var: ${contentInternalLinks}`, 
      impact: 'medium positive' 
    });
    
    if (contentInternalLinks / (internalLinksCount || 1) >= 0.5) {
      successes.push({ 
        field: 'contextual-linking', 
        message: 'İçerik içi bağlamsal (contextual) linkleme stratejisi uygulanmış.', 
        impact: 'high positive' 
      });
    }
  } else if (internalLinksCount > 5 && contentInternalLinks < 2) {
    issues.push({ 
      type: 'warning', 
      field: 'content-links', 
      message: 'İçerik bölümünde çok az dahili link var.', 
      suggestion: 'Ana içerik bölümünüze ilgili diğer sayfalara linkler ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<p>Web sitenizin hızını artırmak için <a href="/site-hizi-artirma-ipuclari">bu ipuçlarını</a> uygulayabilirsiniz.</p>', 
      explanation: 'İçerik içi linkler (contextual links), SEO için en değerli link türlerindendir. Navigasyon veya footer linki yerine, içerik içindeki doğal linkler hem kullanıcılar hem de arama motorları tarafından daha değerli görülür. Bu tür linkler, konuyla ilgili olduklarından kullanıcıların ilgisini çeker ve tıklanma oranını artırır. Ayrıca, arama motorlarına sayfalar arasındaki tematik ilişkiyi daha net gösterir.',
      reference: 'https://moz.com/learn/seo/internal-link', 
      category: 'Content SEO' 
    });
  }
  
  // 3. Link accessibility and usability issues
  if (blankTargetNoRel.length > 0) {
    issues.push({ 
      type: 'warning', 
      field: 'blank-target-security', 
      message: `${blankTargetNoRel.length} adet target="_blank" link rel="noopener" özelliği eksik.`, 
      suggestion: 'Yeni sekmede açılan linklere rel="noopener noreferrer" ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a>', 
      explanation: 'Yeni pencerede açılan linkler (target="_blank"), güvenlik açığı oluşturabilir. Bu linkler, bağlantılı sayfanın açılan yeni pencereden kaynak sayfanıza erişmesine izin verir (window.opener API aracılığıyla). Bu, potansiyel olarak kimlik avı ve diğer güvenlik sorunlarına yol açabilir. rel="noopener" özelliği bu güvenlik açığını kapatır ve performans iyileştirmesi sağlar.',
      reference: 'https://web.dev/external-anchors-use-rel-noopener/', 
      category: 'Security' 
    });
  }
  
  if (genericAnchors.length > Math.min(5, internalLinksCount * 0.2)) {
    issues.push({ 
      type: 'warning', 
      field: 'generic-anchors', 
      message: `${genericAnchors.length} adet jenerik link metni ("tıkla", "buradan" vb.) kullanılmış.`, 
      suggestion: 'Linklerde hedef sayfayı açıklayan, anlamlı metinler kullanın.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<!-- Kaçınılması gereken -->\n<a href="/urunler">buraya tıklayın</a>\n\n<!-- Tercih edilen -->\n<a href="/urunler">Tüm ürünlerimizi inceleyin</a>', 
      explanation: 'Link metinleri (anchor text), hem kullanıcılara hem de arama motorlarına bağlantının nereye gittiği ve ne hakkında olduğu konusunda önemli bilgiler verir. "Tıkla", "buradan", "daha fazla" gibi jenerik terimler bu değerli bilgiyi sağlamaz. Açıklayıcı link metinleri, erişilebilirliği artırır (ekran okuyucu kullanıcılar için), SEO\'yu iyileştirir ve kullanıcıların linke tıklayıp tıklamama konusunda daha bilinçli kararlar vermesini sağlar.',
      reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide', 
      category: 'Accessibility & SEO' 
    });
  }
  
  if (missingTitleAttrs.length > Math.min(10, allLinksCount * 0.3)) {
    issues.push({ 
      type: 'info', 
      field: 'missing-titles', 
      message: `${missingTitleAttrs.length} adet kısa link metinli link title özelliği eksik.`, 
      suggestion: 'Kısa veya belirsiz link metinleri için açıklayıcı title özellikleri ekleyin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<a href="/iletisim" title="Bizimle iletişime geçin">İletişim</a>', 
      explanation: 'Title özelliği, özellikle kısa veya bağlamdan anlaşılmayan link metinleri için ek bilgi sağlar. Bu özellik, fare imleci linkin üzerine geldiğinde araç ipucu olarak görüntülenir ve erişilebilirliği artırır. Title özelliği, ekran okuyucu kullanıcılar ve linkten ne bekleyeceklerini anlamaya çalışan tüm kullanıcılar için faydalıdır. Ancak, her linkte title özelliği olması zorunlu değildir - özellikle link metni zaten açıklayıcıysa gereksizdir.',
      reference: 'https://www.w3.org/WAI/WCAG21/Techniques/html/H33', 
      category: 'Accessibility' 
    });
  }
  
  // 4. Link URL structure issues
  if (httpLinks.length > 0) {
    issues.push({ 
      type: 'warning', 
      field: 'http-links', 
      message: `${httpLinks.length} adet güvenli olmayan HTTP link kullanılmış.`, 
      suggestion: 'HTTP bağlantılarını HTTPS\'e güncelleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: '<!-- Kaçınılması gereken -->\n<a href="http://example.com">Link</a>\n\n<!-- Tercih edilen -->\n<a href="https://example.com">Link</a>', 
      explanation: 'HTTPS\'e geçiş yapmış bir sitede HTTP linklerinin bulunması güvenlik sorunlarına ve karma içerik (mixed content) uyarılarına neden olabilir. Tüm dahili ve mümkünse harici linklerinizin HTTPS protokolünü kullandığından emin olun. Bu, sitenizin güvenliğini artırır ve modern tarayıcılarda oluşabilecek engelleme sorunlarını önler. Ayrıca Google, HTTPS sayfaları ve bağlantıları hafifçe de olsa önceliklendirir.',
      reference: 'https://developers.google.com/search/docs/crawling-indexing/https', 
      category: 'Security & SEO' 
    });
  }
  
  if (relativeLinkMissingSlash.length > 3) {
    issues.push({ 
      type: 'info', 
      field: 'relative-links', 
      message: `${relativeLinkMissingSlash.length} adet başında / olmayan göreceli link var.`, 
      suggestion: 'Göreceli (relative) linklerinizin başına / ekleyin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<!-- Sorunlu -->\n<a href="iletisim">İletişim</a>\n\n<!-- Tercih edilen -->\n<a href="/iletisim">İletişim</a>', 
      explanation: 'Başında / olmayan göreceli linkler, geçerli URL\'nin mevcut dizinine göre çözümlenir, bu da özellikle alt klasörlerde bulunan sayfalar için sorunlara neden olabilir. Örneğin, "/blog/makale/" sayfasındaki "iletisim" linki, "/blog/makale/iletisim" olarak çözümlenirken, "/iletisim" linki doğru şekilde kök dizine göre çözümlenir. Tutarlılık ve hata önleme için göreceli linklerin başına her zaman / eklemek önerilir.',
      reference: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls', 
      category: 'Technical SEO' 
    });
  }
  
  // 5. Empty and problematic links
  const problematicLinksCount = emptyLinks.length + javascriptLinks.length;
  if (problematicLinksCount > 3) {
    issues.push({ 
      type: 'warning', 
      field: 'empty-js-links', 
      message: `${problematicLinksCount} adet boş veya JavaScript link kullanılmış.`, 
      suggestion: 'Boş linkler (#) veya JavaScript linkler yerine gerçek URL\'ler kullanın.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<!-- Kaçınılması gereken -->\n<a href="#" onclick="showContent()">İçeriği Göster</a>\n\n<!-- Tercih edilen -->\n<a href="/icerik">İçeriği Göster</a>\nveya\n<button onclick="showContent()">İçeriği Göster</button>', 
      explanation: 'Boş linkler (href="#") veya JavaScript linkleri (href="javascript:void(0)"), arama motorları tarafından takip edilemez ve erişilebilirlik sorunlarına neden olabilir. Eğer bir etkileşim için JavaScript kullanmanız gerekiyorsa, <a> etiketi yerine <button> etiketi kullanmayı düşünün. Eğer mutlaka link kullanılması gerekiyorsa, gerçek bir URL ile birlikte gerekirse JavaScript event handler ekleyin. Bu yaklaşım, JavaScript devre dışı bırakıldığında bile temel işlevselliğin korunmasını sağlar.',
      reference: 'https://web.dev/how-to-use-links/', 
      category: 'Accessibility & SEO' 
    });
  }
  
  if (anchorsNoHref.length > 2) {
    issues.push({ 
      type: 'info', 
      field: 'anchors-no-href', 
      message: `${anchorsNoHref.length} adet href özelliği olmayan <a> etiketi var.`, 
      suggestion: 'Tüm <a> etiketlerine bir href özelliği ekleyin veya bunları <span> ya da <button> ile değiştirin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<!-- Sorunlu -->\n<a onclick="doSomething()">Tıkla</a>\n\n<!-- Tercih edilen -->\n<button onclick="doSomething()">Tıkla</button>\nveya\n<a href="/sayfa">Tıkla</a>', 
      explanation: 'href özelliği olmayan <a> etiketleri, klavye gezintisini ve ekran okuyucu erişilebilirliğini olumsuz etkiler. Eğer etiket gerçekten bir sayfaya bağlantı vermiyorsa, <span> veya <button> gibi daha uygun bir HTML etiketi kullanmanız önerilir. Her <a> etiketi bir sayfaya veya içerik parçasına bağlanmalıdır.',
      reference: 'https://www.w3.org/WAI/WCAG21/Techniques/html/H91', 
      category: 'Accessibility' 
    });
  }
  
  // 6. Link distribution and page structure
  const sectionWithMostLinks = Object.entries(internalLinksBySection)
    .reduce((max, [section, count]) => count > max.count ? {section, count} : max, {section: '', count: 0});
    
  if (sectionWithMostLinks.count > internalLinksCount * 0.7 && sectionWithMostLinks.section !== 'content') {
    const sectionName = sectionWithMostLinks.section === 'navigation' ? 'navigasyon' : 
                       sectionWithMostLinks.section === 'footer' ? 'alt bilgi' : 
                       sectionWithMostLinks.section === 'sidebar' ? 'yan panel' : 'diğer';
                       
    issues.push({ 
      type: 'info', 
      field: 'link-distribution', 
      message: `Linklerinizin çoğu (${sectionWithMostLinks.count}) ${sectionName} bölümünde.`, 
      suggestion: 'İçerik bölümüne daha fazla bağlamsal link ekleyin.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<p>Web sitenizin <a href="/seo-analizi">SEO analizini</a> yaparak daha fazla ziyaretçi çekebilirsiniz.</p>', 
      explanation: 'Linklerinizin çoğunun navigasyon veya footer gibi yapısal alanlarda yoğunlaşması, içerik içi bağlamsal linklemeyi ihmal ettiğinizi gösterir. İçerik içindeki doğal linkler, kullanıcıların ilgili içerikleri keşfetmelerine yardımcı olur ve arama motorlarına sayfalarınız arasındaki ilişkileri daha iyi anlatır. Dengeli bir link dağılımı, yapısal linkler (navigasyon, footer) ile içerik içi doğal linkleri birleştirir.',
      reference: 'https://moz.com/learn/seo/internal-link', 
      category: 'Content SEO' 
    });
  }
  
  if (!hasBreadcrumbs && internalLinksCount > 10) {
    issues.push({ 
      type: 'info', 
      field: 'breadcrumbs', 
      message: 'Ekmek kırıntısı (breadcrumb) navigasyonu tespit edilemedi.', 
      suggestion: 'Kullanıcı deneyimini ve SEO\'yu iyileştirmek için breadcrumb navigasyonu ekleyin.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<nav aria-label="Ekmek Kırıntısı" itemscope itemtype="https://schema.org/BreadcrumbList">\n  <ol>\n    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">\n      <a itemprop="item" href="/"><span itemprop="name">Ana Sayfa</span></a>\n      <meta itemprop="position" content="1" />\n    </li>\n    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">\n      <a itemprop="item" href="/kategori"><span itemprop="name">Kategori</span></a>\n      <meta itemprop="position" content="2" />\n    </li>\n    <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">\n      <span itemprop="name">Mevcut Sayfa</span>\n      <meta itemprop="position" content="3" />\n    </li>\n  </ol>\n</nav>', 
      explanation: 'Breadcrumb navigasyonu, kullanıcılara site hiyerarşisinde nerede olduklarını gösterir ve üst kategorilere kolay erişim sağlar. Bu navigasyon türü, kullanıcı deneyimini iyileştirir, hemen çıkma oranını azaltır ve site yapısının arama motorları tarafından daha iyi anlaşılmasını sağlar. Ayrıca, breadcrumb\'lar zengin sonuçlar olarak Google arama sonuçlarında görüntülenebilir, bu da tıklanma oranını artırabilir.',
      reference: 'https://developers.google.com/search/docs/advanced/structured-data/breadcrumb', 
      category: 'UX & SEO' 
    });
  }
  
  if (linkedHeadingsRatio < 0.1 && headingsCount > 5) {
    issues.push({ 
      type: 'info', 
      field: 'linked-headings', 
      message: 'Başlıklarda çok az link kullanılıyor.', 
      suggestion: 'Uzun içerikte başlıklara ID\'ler ekleyip link verilebilir hale getirin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<h2 id="baslık-1">Önemli Başlık</h2>\n\n<p>Bu başlığa <a href="#baslık-1">buradan</a> ulaşabilirsiniz.</p>\n\n<p>İçindekiler listesi için:</p>\n<ul>\n  <li><a href="#baslık-1">Önemli Başlık</a></li>\n  <li><a href="#baslık-2">Diğer Başlık</a></li>\n</ul>', 
      explanation: 'Uzun içeriklerde başlıklara ID\'ler eklemek ve bunlara link vermek, bir içindekiler tablosu oluşturmanızı sağlar ve kullanıcıların içerikte hızlıca gezinmelerine yardımcı olur. Bu yaklaşım, özellikle kapsamlı makaleler veya dokümantasyon sayfaları için kullanıcı deneyimini iyileştirir ve içeriğin taranabilirliğini artırır. Ayrıca, Google bazen bu yapıyı kullanarak arama sonuçlarında "sayfada atla" bağlantıları gösterebilir.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#linking_to_an_element_on_the_same_page', 
      category: 'User Experience' 
    });
  }
  
  // 7. Duplicate and inconsistent linking
  if (inconsistentAnchors.length > 2) {
    issues.push({ 
      type: 'warning', 
      field: 'inconsistent-anchors', 
      message: `${inconsistentAnchors.length} adet aynı metin farklı sayfalara linkliyor.`, 
      suggestion: 'Aynı link metni her zaman aynı hedefe yönlendirmelidir.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '<!-- Sayfa 1\'de -->\n<a href="/urunler">Ürünlerimiz</a>\n\n<!-- Sayfa 2\'de, farklı URL fakat aynı metin -->\n<a href="/katalog">Ürünlerimiz</a>\n\n<!-- Doğru kullanım: benzersiz link metinleri -->\n<a href="/urunler">Tüm Ürünlerimiz</a>\n<a href="/katalog">Ürün Kataloğumuz</a>', 
      explanation: 'Aynı link metninin farklı sayfalara yönlendirilmesi, kullanıcılarda kafa karışıklığına neden olabilir ve arama motorlarına çelişkili sinyaller gönderir. Her benzersiz hedef için benzersiz ve açıklayıcı link metinleri kullanmak, kullanıcı deneyimini iyileştirir ve arama motorlarının içeriğinizi daha iyi anlamasını sağlar. Bu, özellikle site genelinde tutarlı bir navigasyon ve linkleme stratejisi için önemlidir.',
      reference: 'https://developers.google.com/search/docs/advanced/guidelines/link-text', 
      category: 'User Experience & SEO' 
    });
  }
  
  if (excessiveDuplicateLinks.length > 0) {
    const topDuplicate = excessiveDuplicateLinks[0];
    
    issues.push({ 
      type: 'info', 
      field: 'duplicate-links', 
      message: `Aynı URL'ye (${topDuplicate.href.substring(0, 50)}${topDuplicate.href.length > 50 ? '...' : ''}) ${topDuplicate.count} kez link verilmiş.`, 
      suggestion: 'Aynı URL\'ye gereksiz tekrarlayan linklerden kaçının.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '', 
      explanation: 'Aynı sayfada aynı URL\'ye birden çok kez link vermek genellikle gereksizdir ve kullanıcı deneyimini karmaşıklaştırabilir. Navigasyon menüsü ve footer gibi yapısal elementlerde tekrarlayan linkler normal olsa da, içerik içinde aynı URL\'nin defalarca kullanılması genellikle bir tasarım sorunudur. Her link, kullanıcıya yeni ve değerli bir seçenek sunmalıdır.',
      reference: 'https://www.semrush.com/blog/internal-linking/', 
      category: 'User Experience' 
    });
  }
  
  // 8. Special link attributes analysis
  const specialLinkCount = nofollowLinks.length + ugcLinks.length + sponsoredLinks.length;
  
  if (specialLinkCount > 0) {
    successes.push({ 
      field: 'link-attributes', 
      message: `${specialLinkCount} adet özel link özniteliği (${nofollowLinks.length} nofollow, ${ugcLinks.length} ugc, ${sponsoredLinks.length} sponsored) doğru kullanılmış.`, 
      impact: 'medium positive' 
    });
  } else if (externalLinksCount > 5) {
    issues.push({ 
      type: 'info', 
      field: 'missing-link-attributes', 
      message: 'Dış bağlantılarda link öznitelikleri (nofollow, ugc, sponsored) eksik olabilir.', 
      suggestion: 'Uygun durumlarda dış bağlantılara rel öznitelikleri ekleyin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<!-- Reklam/sponsor içeriği -->\n<a href="https://sponsor.com" rel="sponsored">Sponsor</a>\n\n<!-- Kullanıcı tarafından oluşturulan içerik -->\n<a href="https://ornek.com" rel="ugc">Kullanıcı bağlantısı</a>\n\n<!-- Güvenmediğiniz veya desteklemek istemediğiniz içerik -->\n<a href="https://ornek.com" rel="nofollow">Link</a>', 
      explanation: 'Link öznitelikleri (rel="nofollow", rel="ugc", rel="sponsored"), Google\'a hangi linklerin takip edilmemesi veya link değeri (link equity) aktarmaması gerektiğini belirtir. Bu öznitelikler, reklamlar, affiliate linkler, kullanıcı tarafından oluşturulan içerikler ve endorsement yapmak istemediğiniz içerikler için önerilir. Doğru kullanıldığında, bu öznitelikler yapay link oluşturma (unnatural links) cezalarından kaçınmanıza yardımcı olabilir.',
      reference: 'https://developers.google.com/search/docs/advanced/guidelines/qualify-outbound-links', 
      category: 'SEO' 
    });
  }
  
  if (linkToFiles.length > 0 && linkToFiles.length <= 3) {
    successes.push({ 
      field: 'file-links', 
      message: `${linkToFiles.length} adet dosya bağlantısı mevcut.`, 
      impact: 'low positive' 
    });
  } else if (linkToFiles.length > 3) {
    issues.push({ 
      type: 'info', 
      field: 'file-links-indicator', 
      message: `${linkToFiles.length} adet dosya bağlantısı var, ancak dosya türü belirtilmemiş olabilir.`, 
      suggestion: 'Dosya bağlantılarının yanında dosya türü ve boyutunu belirtin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '<a href="rapor.pdf">Yıllık Rapor (PDF, 2.5MB)</a>', 
      explanation: 'Kullanıcılar, bir bağlantının dosya indirmeye neden olacağını önceden bilmek ister. Bağlantı metninde veya yanında dosya türü (PDF, DOCX vb.) ve mümkünse dosya boyutunu belirtmek, kullanıcıların ne bekleyeceklerini anlamalarına ve özellikle mobil cihazlarda veya sınırlı internet bağlantısı olan kullanıcılar için beklenmedik indirmelerden kaçınmalarına yardımcı olur.',
      reference: 'https://www.w3.org/WAI/WCAG21/Techniques/general/G197', 
      category: 'Accessibility' 
    });
  }
  
  // 9. Link density analysis
  if (linkDensity > 20) {
    issues.push({ 
      type: 'warning', 
      field: 'link-density', 
      message: 'Link yoğunluğu çok yüksek.', 
      suggestion: 'İçerikte link olmayan metin oranını artırın.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '', 
      explanation: 'Çok yüksek link yoğunluğu (çok sayıda link ve az metin), içeriğinizin kalitesini olumsuz etkileyebilir ve aşırı optimizasyon izlenimi verebilir. Arama motorları, çok fazla link içeren ve az değerli içerik sunan sayfaları düşük kaliteli olarak değerlendirebilir. İçerik-link dengesini korumak, hem kullanıcı deneyimi hem de SEO açısından önemlidir. Her link bir amaca hizmet etmeli ve içerik akışını bozmamalıdır.',
      reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide', 
      category: 'Content SEO' 
    });
  }
  
  // 10. Advanced link pattern analysis
  if (potentialOrphanedContent) {
    issues.push({ 
      type: 'info', 
      field: 'orphaned-content', 
      message: 'Bu sayfa yeterince dahili link almıyor olabilir.', 
      suggestion: 'Bu sayfaya diğer sayfalardan daha fazla link verin.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '', 
      explanation: 'Yalnızca birkaç sayfadan link alan veya hiç link almayan içerikler (orphaned content), arama motorları tarafından daha az önemli olarak değerlendirilir ve daha düşük sıralanabilir. Her önemli sayfanın site genelinde, özellikle ilgili diğer içeriklerden yeterli dahili link alması önemlidir. Sitenizin ana navigasyonu, breadcrumbs, ilgili içerik önerileri ve içerik içi bağlamsal linkler aracılığıyla tüm önemli sayfalarınızın yeterli dahili link aldığından emin olun.',
      reference: 'https://www.semrush.com/blog/orphaned-content/', 
      category: 'Technical SEO' 
    });
  }
  
  // 11. Overall link strategy assessment
  if (internalLinksCount > 10 && externalLinksCount > 0 && specialLinkCount > 0) {
    successes.push({ 
      field: 'link-strategy', 
      message: 'Dengeli ve çeşitli bir link stratejisi uygulanmış.', 
      impact: 'high positive' 
    });
  }
  
  return { issues, successes };
}

// --- Gelişmiş Güvenlik Analizleri ---
function analyzeSecurityHeaders(resHeaders: Record<string, string | undefined>): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  const lowercaseHeaders: Record<string, string> = {};
  
  // Normalize header names to lowercase for case-insensitive matching
  for (const [key, value] of Object.entries(resHeaders)) {
    if (value !== undefined) {
      lowercaseHeaders[key.toLowerCase()] = value;
    }
  }
  
  // Helper function to check header existence and add appropriate issue/success
  function checkHeader(
    headerName: string, 
    displayName: string, 
    impact: string, 
    difficulty: string,
    suggestion: string,
    explanation: string,
    example: string,
    reference: string,
    validator?: (value: string) => {isValid: boolean, message?: string}
  ) {
    const headerValue = lowercaseHeaders[headerName.toLowerCase()];
    
    if (headerValue) {
      if (validator) {
        const validation = validator(headerValue);
        if (validation.isValid) {
          successes.push({ 
            field: 'security', 
            message: `${displayName} başlığı mevcut ve doğru yapılandırılmış.`, 
            impact: impact 
          });
        } else {
          issues.push({ 
            type: 'warning', 
            field: 'security', 
            message: `${displayName} başlığı mevcut fakat yanlış yapılandırılmış: ${validation.message}`, 
            suggestion: suggestion, 
            impact: impact, 
            difficulty: difficulty, 
            example: example, 
            explanation: explanation, 
            reference: reference, 
            category: 'Güvenlik' 
          });
        }
      } else {
        successes.push({ 
          field: 'security', 
          message: `${displayName} başlığı mevcut.`, 
          impact: impact 
        });
      }
    } else {
      issues.push({ 
        type: 'info', 
        field: 'security', 
        message: `${displayName} başlığı eksik.`, 
        suggestion: suggestion, 
        impact: impact, 
        difficulty: difficulty, 
        example: example, 
        explanation: explanation, 
        reference: reference, 
        category: 'Güvenlik' 
      });
    }
  }
  
  // Helper function to detect if site uses HTTPS
  function isHttps(): boolean {
    return lowercaseHeaders['strict-transport-security'] !== undefined || 
           lowercaseHeaders['content-security-policy']?.includes('upgrade-insecure-requests') === true;
  }
  
  // Helper function to detect if site is likely an API endpoint
  function isLikelyApi(): boolean {
    return lowercaseHeaders['content-type']?.includes('application/json') === true || 
           lowercaseHeaders['content-type']?.includes('application/xml') === true;
  }
  
  // Helper function to detect if site likely has user authentication
  function hasLikelyAuthentication(): boolean {
    return lowercaseHeaders['set-cookie']?.toLowerCase().includes('auth') === true || 
           lowercaseHeaders['set-cookie']?.toLowerCase().includes('session') === true ||
           lowercaseHeaders['www-authenticate'] !== undefined;
  }
  
  // Helper function to detect if site uses a CDN
  function usesCdn(): boolean {
    return lowercaseHeaders['server']?.toLowerCase().includes('cloudflare') === true || 
           lowercaseHeaders['server']?.toLowerCase().includes('cloudfront') === true ||
           lowercaseHeaders['server']?.toLowerCase().includes('akamai') === true ||
           lowercaseHeaders['server']?.toLowerCase().includes('fastly') === true ||
           lowercaseHeaders['cf-ray'] !== undefined ||
           lowercaseHeaders['x-served-by'] !== undefined;
  }
  
  // 1. HTTPS-Related Security Headers
  
  // Strict-Transport-Security (HSTS)
  checkHeader(
    'strict-transport-security',
    'Strict-Transport-Security (HSTS)',
    'security',
    'orta',
    'HTTPS bağlantılarını zorunlu kılmak için Strict-Transport-Security başlığı ekleyin.',
    'Strict-Transport-Security başlığı, tarayıcıya sitenize yapılan tüm isteklerin HTTPS üzerinden yapılması gerektiğini bildirir. Bu, HTTPS downgrade ve cookie hijacking saldırılarını önler. max-age parametresi en az 6 ay (15768000 saniye) olmalı ve idealde includeSubDomains ve preload direktifleri eklenmelidir.',
    'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security',
    (value) => {
      const maxAgeMatch = value.match(/max-age=(\d+)/);
      if (!maxAgeMatch) return {isValid: false, message: "max-age direktifi eksik"};
      
      const maxAge = parseInt(maxAgeMatch[1]);
      if (maxAge < 15768000) { // 6 months in seconds
        return {isValid: false, message: "max-age çok kısa (en az 6 ay olmalı)"};
      }
      
      if (!value.includes('includeSubDomains')) {
        return {isValid: false, message: "includeSubDomains direktifi eksik"};
      }
      
      return {isValid: true};
    }
  );
  
  // 2. Content Security Policy (CSP)
  checkHeader(
    'content-security-policy',
    'Content-Security-Policy (CSP)',
    'security',
    'zor',
    'XSS saldırılarına karşı kapsamlı bir Content-Security-Policy başlığı yapılandırın.',
    'Content-Security-Policy, web sitenizdeki kaynakların (script, style, image, font, vb.) yüklenebileceği güvenilir kaynakları tanımlayarak XSS (Cross-Site Scripting) saldırılarına karşı güçlü bir savunma hattı oluşturur. Etkin bir CSP, inline script ve eval() gibi tehlikeli JavaScript uygulamalarını sınırlayabilir ve veri hırsızlığını önleyebilir.',
    'Content-Security-Policy: default-src \'self\'; script-src \'self\' https://trusted-cdn.com; img-src \'self\' https://trusted-images.com; style-src \'self\' https://trusted-styles.com; font-src \'self\' https://trusted-fonts.com; frame-ancestors \'self\'; form-action \'self\'; upgrade-insecure-requests;',
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
    (value) => {
      // Basic validation - could be much more sophisticated
      if (value.includes('unsafe-inline') && !value.includes('nonce-') && !value.includes('sha')) {
        return {isValid: false, message: "unsafe-inline kullanımı nonce veya hash olmadan güvenli değil"};
      }
      
      if (!value.includes('default-src')) {
        return {isValid: false, message: "default-src direktifi eksik"};
      }
      
      if (value === "default-src 'none';") {
        return {isValid: false, message: "Çok kısıtlayıcı bir CSP"};
      }
      
      return {isValid: true};
    }
  );
  
  // 3. X-Content-Type-Options
  checkHeader(
    'x-content-type-options',
    'X-Content-Type-Options',
    'security',
    'kolay',
    'MIME type sniffing saldırılarını önlemek için X-Content-Type-Options: nosniff başlığını ekleyin.',
    'X-Content-Type-Options başlığı, tarayıcıların MIME type sniffing yapmasını engeller. Bu, özellikle kullanıcıların yükleyebileceği içerikler barındıran siteler için önemlidir. Tarayıcılar bazen dosyaların içeriğini inceleyerek Content-Type başlığını geçersiz kılabilir, bu da güvenlik sorunlarına yol açabilir.',
    'X-Content-Type-Options: nosniff',
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options',
    (value) => {
      if (value.toLowerCase() !== 'nosniff') {
        return {isValid: false, message: "Yalnızca 'nosniff' değeri geçerlidir"};
      }
      return {isValid: true};
    }
  );
  
  // 4. X-Frame-Options
  checkHeader(
    'x-frame-options',
    'X-Frame-Options',
    'security',
    'kolay',
    'Clickjacking saldırılarını önlemek için X-Frame-Options başlığını ekleyin.',
    'X-Frame-Options başlığı, sitenizin başka siteler tarafından iframe içinde görüntülenmesini kontrol eder. Bu, clickjacking saldırılarını önlemek için önemlidir. DENY, sayfanızın hiçbir sitede frame içinde gösterilmemesini sağlar. SAMEORIGIN, yalnızca aynı kaynakta (aynı site) izin verir.',
    'X-Frame-Options: SAMEORIGIN',
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options',
    (value) => {
      const validValues = ['deny', 'sameorigin'];
      if (!validValues.includes(value.toLowerCase())) {
        return {isValid: false, message: "Yalnızca DENY veya SAMEORIGIN değerleri önerilir"};
      }
      return {isValid: true};
    }
  );
  
  // 5. Referrer-Policy
  checkHeader(
    'referrer-policy',
    'Referrer-Policy',
    'security',
    'kolay',
    'Referrer bilgilerini kontrol etmek için Referrer-Policy başlığını ekleyin.',
    'Referrer-Policy başlığı, tarayıcının hangi referrer (yönlendiren) bilgilerini hedef sayfalara göndereceğini kontrol eder. Bu, kullanıcı gizliliğini korumak ve bilgi sızıntısını önlemek için önemlidir. Örneğin, HTTPS\'den HTTP\'ye geçişlerde ya da farklı kaynaklara yapılan isteklerde referrer bilgisinin gönderilmemesi güvenlik açısından önemlidir.',
    'Referrer-Policy: strict-origin-when-cross-origin',
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy',
    (value) => {
      const recommendedValues = [
        'no-referrer', 
        'no-referrer-when-downgrade', 
        'strict-origin', 
        'strict-origin-when-cross-origin'
      ];
      if (!recommendedValues.includes(value.toLowerCase())) {
        return {isValid: false, message: "Önerilen değerler: no-referrer, strict-origin-when-cross-origin"};
      }
      return {isValid: true};
    }
  );
  
  // 6. Permissions-Policy (formerly Feature-Policy)
  const permissionsPolicy = lowercaseHeaders['permissions-policy'] || lowercaseHeaders['feature-policy'];
  if (permissionsPolicy) {
    successes.push({ 
      field: 'security', 
      message: 'Permissions-Policy başlığı mevcut.', 
      impact: 'security' 
    });
  } else {
    issues.push({ 
      type: 'info', 
      field: 'security', 
      message: 'Permissions-Policy başlığı eksik.', 
      suggestion: 'Hassas tarayıcı özelliklerinin kullanımını kontrol etmek için Permissions-Policy başlığı ekleyin.', 
      impact: 'security', 
      difficulty: 'orta', 
      example: 'Permissions-Policy: camera=(), microphone=(), geolocation=(self), fullscreen=(self)', 
      explanation: 'Permissions-Policy başlığı (eski adıyla Feature-Policy), web sitenizin hangi tarayıcı özelliklerine ve API\'lerine erişebileceğini kontrol etmenizi sağlar. Bu, özellikle kamera, mikrofon, konum gibi hassas izinlerin kontrolü için önemlidir. Ayrıca, iframe içindeki gömülü içeriklerin izinlerini de sınırlayabilirsiniz.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy', 
      category: 'Güvenlik' 
    });
  }
  
  // 7. X-XSS-Protection
  // Note: This header is somewhat deprecated in modern browsers that use CSP,
  // but still useful for older browsers
  checkHeader(
    'x-xss-protection',
    'X-XSS-Protection',
    'security',
    'kolay',
    'Eski tarayıcılarda XSS koruması için X-XSS-Protection başlığını ekleyin.',
    'X-XSS-Protection başlığı, tarayıcının yerleşik XSS koruma mekanizmasını kontrol eder. Modern tarayıcılarda Content-Security-Policy tarafından büyük ölçüde geçersiz kılınmıştır, ancak eski tarayıcılar için ek bir koruma katmanı sağlar. "1; mode=block" değeri, XSS saldırısı tespit edildiğinde sayfanın tamamen engellenmesini sağlar.',
    'X-XSS-Protection: 1; mode=block',
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection',
    (value) => {
      if (value !== '1; mode=block' && value !== '1') {
        return {isValid: false, message: "Önerilen değer: 1; mode=block"};
      }
      return {isValid: true};
    }
  );
  
  // 8. Access-Control-Allow-Origin (CORS)
  // Only check if this looks like an API
  if (isLikelyApi()) {
    checkHeader(
      'access-control-allow-origin',
      'Access-Control-Allow-Origin',
      'security',
      'orta',
      'CORS politikasını güvenli bir şekilde yapılandırın.',
      'Access-Control-Allow-Origin başlığı, bir kaynağın (API endpoint gibi) hangi origin\'lerden erişilebileceğini belirtir. "*" değeri tüm kaynaklara izin verir ve bu genellikle güvenli değildir. Mümkün olduğunca spesifik origins tanımlamak daha güvenlidir. Bu başlık özellikle API\'ler için önemlidir.',
      'Access-Control-Allow-Origin: https://trusted-site.com',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin',
      (value) => {
        if (value === '*') {
          return {isValid: false, message: "Tüm kaynaklara (*) izin vermek yerine spesifik domainler belirtilmeli"};
        }
        return {isValid: true};
      }
    );
  }
  
  // 9. Set-Cookie Security Attributes
  if (lowercaseHeaders['set-cookie']) {
    const cookies = Array.isArray(lowercaseHeaders['set-cookie']) 
      ? lowercaseHeaders['set-cookie'] 
      : [lowercaseHeaders['set-cookie']];
    
    let hasSecureFlag = true;
    let hasHttpOnlyFlag = true;
    let hasSameSiteFlag = true;
    
    for (const cookie of cookies) {
      if (!cookie.toLowerCase().includes('secure')) {
        hasSecureFlag = false;
      }
      if (!cookie.toLowerCase().includes('httponly')) {
        hasHttpOnlyFlag = false;
      }
      if (!cookie.toLowerCase().includes('samesite')) {
        hasSameSiteFlag = false;
      }
    }
    
    if (hasSecureFlag && hasHttpOnlyFlag && hasSameSiteFlag) {
      successes.push({ 
        field: 'cookie-security', 
        message: 'Çerezler tüm güvenlik özellikleriyle (Secure, HttpOnly, SameSite) yapılandırılmış.', 
        impact: 'high positive' 
      });
    } else {
      if (!hasSecureFlag) {
        issues.push({ 
          type: 'warning', 
          field: 'cookie-security', 
          message: 'Çerezlerde Secure bayrağı eksik.', 
          suggestion: 'Tüm çerezlere Secure bayrağı ekleyin.', 
          impact: 'high', 
          difficulty: 'kolay', 
          example: 'Set-Cookie: sessionid=abc123; Path=/; Secure; HttpOnly; SameSite=Lax', 
          explanation: 'Secure bayrağı, çerezlerin yalnızca HTTPS bağlantıları üzerinden iletilmesini sağlar. Bu olmadan, çerezler şifrelenmemiş bağlantılar üzerinden gönderilebilir ve man-in-the-middle saldırılarına karşı savunmasız kalır. Özellikle oturum çerezleri veya hassas bilgiler içeren çerezler için Secure bayrağının kullanılması kritik önem taşır.',
          reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies', 
          category: 'Güvenlik' 
        });
      }
      
      if (!hasHttpOnlyFlag) {
        issues.push({ 
          type: 'warning', 
          field: 'cookie-security', 
          message: 'Çerezlerde HttpOnly bayrağı eksik.', 
          suggestion: 'Oturum ve kimlik doğrulama çerezlerine HttpOnly bayrağı ekleyin.', 
          impact: 'high', 
          difficulty: 'kolay', 
          example: 'Set-Cookie: sessionid=abc123; Path=/; Secure; HttpOnly; SameSite=Lax', 
          explanation: 'HttpOnly bayrağı, çerezlere JavaScript üzerinden erişilmesini engeller. Bu, XSS saldırıları sırasında çerez hırsızlığını önler. Kullanıcı oturumları ve kimlik doğrulama bilgileri için HttpOnly bayrağının kullanılması önemlidir. Bu bayrak, çerezin yalnızca HTTP istekleri sırasında sunucuya gönderilmesini ve tarayıcı içindeki JavaScript kodlarının çereze erişememesini sağlar.',
          reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#httponly_cookies', 
          category: 'Güvenlik' 
        });
      }
      
      if (!hasSameSiteFlag) {
        issues.push({ 
          type: 'warning', 
          field: 'cookie-security', 
          message: 'Çerezlerde SameSite bayrağı eksik.', 
          suggestion: 'Çerezlere SameSite bayrağı ekleyin (Lax, Strict veya None).', 
          impact: 'medium', 
          difficulty: 'kolay', 
          example: 'Set-Cookie: sessionid=abc123; Path=/; Secure; HttpOnly; SameSite=Lax', 
          explanation: 'SameSite bayrağı, çerezlerin site-arası isteklerle (cross-site requests) gönderilip gönderilmeyeceğini kontrol eder. Bu, CSRF (Cross-Site Request Forgery) saldırılarını önlemeye yardımcı olur. "Lax" değeri çoğu uygulama için iyi bir denge sağlar: GET istekleri için çerezleri gönderir ancak POST istekleri için göndermez. "Strict" en güvenli seçenektir ama kullanıcı deneyimini etkileyebilir. "None" ise en az güvenli seçenektir ve yalnızca Secure bayrağıyla birlikte kullanılmalıdır.',
          reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite', 
          category: 'Güvenlik' 
        });
      }
    }
  }
  
  // 10. Cache-Control for sensitive pages
  if (hasLikelyAuthentication()) {
    const cacheControl = lowercaseHeaders['cache-control'];
    if (!cacheControl || 
        !(cacheControl.includes('no-store') || 
          (cacheControl.includes('no-cache') && cacheControl.includes('private')))) {
      issues.push({ 
        type: 'warning', 
        field: 'security', 
        message: 'Hassas sayfalar için sıkı Cache-Control başlığı eksik.', 
        suggestion: 'Kimlik doğrulama içeren sayfalar için "Cache-Control: no-store, must-revalidate" kullanın.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: 'Cache-Control: no-store, must-revalidate', 
        explanation: 'Hassas bilgiler içeren sayfaların tarayıcı veya proxy önbelleklerinde saklanmaması önemlidir. no-store direktifi hiçbir önbellekleme yapılmamasını sağlar. must-revalidate ise önbellek geçerlilik süresinin hemen sona erdiğinde sunucuyla yeniden doğrulama yapılmasını zorunlu kılar. Bu, oturum bilgileri ve kişisel veriler içeren sayfalar için özellikle önemlidir.',
        reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control', 
        category: 'Güvenlik' 
      });
    }
  }
  
  // 11. Server Header Information Leakage
  const serverHeader = lowercaseHeaders['server'];
  if (serverHeader && (serverHeader.includes('/') || /\d/.test(serverHeader))) {
    issues.push({ 
      type: 'info', 
      field: 'security', 
      message: 'Server başlığı sürüm bilgisi açıklıyor.', 
      suggestion: 'Server başlığından detaylı sürüm bilgilerini kaldırın.', 
      impact: 'low', 
      difficulty: 'orta', 
      example: 'Server: nginx', 
      explanation: 'Server başlığı genellikle web sunucusu türü ve sürüm bilgilerini içerir. Bu bilgiler, saldırganların belirli sürümlerde bulunan güvenlik açıklarını hedeflemesini kolaylaştırabilir. İdeal olarak, bu başlık tamamen kaldırılmalı veya minimum bilgi içerecek şekilde yapılandırılmalıdır (örn. sadece "nginx" veya "Apache" yazmalı, sürüm numarası içermemeli).',
      reference: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/02-Fingerprint_Web_Server', 
      category: 'Güvenlik' 
    });
  }
  
  // 12. X-Powered-By Information Leakage
  if (lowercaseHeaders['x-powered-by']) {
    issues.push({ 
      type: 'info', 
      field: 'security', 
      message: 'X-Powered-By başlığı teknik bilgi açıklıyor.', 
      suggestion: 'X-Powered-By başlığını kaldırın.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: '', 
      explanation: 'X-Powered-By başlığı, web uygulamasının arka uç teknolojisi hakkında bilgi verir (örn. PHP, ASP.NET). Bu bilgi, saldırganların belirli teknolojilere özgü güvenlik açıklarını hedeflemesine yardımcı olabilir. Güvenlik açısından bu başlığın tamamen kaldırılması önerilir.',
      reference: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/02-Fingerprint_Web_Server', 
      category: 'Güvenlik' 
    });
  }
  
  // 13. Expect-CT Header
  if (!lowercaseHeaders['expect-ct'] && isHttps()) {
    issues.push({ 
      type: 'info', 
      field: 'security', 
      message: 'Expect-CT başlığı eksik.', 
      suggestion: 'Certificate Transparency uyumluluğunu zorlamak için Expect-CT başlığını ekleyin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: 'Expect-CT: max-age=86400, enforce', 
      explanation: 'Expect-CT başlığı, Certificate Transparency gereksinimlerine uygunluğu zorlar ve yanlış veya sahte SSL sertifikalarına karşı koruma sağlar. Bu başlık özellikle Domain Validation (DV) sertifikaları kullanan siteler için önemlidir. max-age parametresi, tarayıcının bu politikayı ne kadar süre hatırlaması gerektiğini belirtir.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Expect-CT', 
      category: 'Güvenlik' 
    });
  }
  
  // 14. Cross-Origin Resource Policy (CORP)
  if (!lowercaseHeaders['cross-origin-resource-policy'] && !isLikelyApi()) {
    issues.push({ 
      type: 'info', 
      field: 'security', 
      message: 'Cross-Origin Resource Policy (CORP) başlığı eksik.', 
      suggestion: 'Kaynakları cross-origin davranışlara karşı korumak için CORP başlığı ekleyin.', 
      impact: 'medium', 
      difficulty: 'kolay', 
      example: 'Cross-Origin-Resource-Policy: same-origin', 
      explanation: 'Cross-Origin Resource Policy başlığı, web sayfanızın kaynaklarının (JavaScript, CSS, görüntüler vb.) diğer siteler tarafından kullanılmasını kısıtlar. Bu, Spectre gibi yan kanal saldırılarına karşı koruma sağlar. "same-origin" değeri en kısıtlayıcı ve güvenli olanıdır, ancak CDN\'lerden kaynak yükleyen siteler için "same-site" veya bazı durumlarda "cross-origin" gerekebilir.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy', 
      category: 'Güvenlik' 
    });
  }
  
  // 15. Cross-Origin Opener Policy (COOP)
  if (!lowercaseHeaders['cross-origin-opener-policy']) {
    issues.push({ 
      type: 'info', 
      field: 'security', 
      message: 'Cross-Origin Opener Policy (COOP) başlığı eksik.', 
      suggestion: 'Top-level pencereler arası iletişimi kontrol etmek için COOP başlığı ekleyin.', 
      impact: 'low', 
      difficulty: 'kolay', 
      example: 'Cross-Origin-Opener-Policy: same-origin', 
      explanation: 'Cross-Origin Opener Policy, sitenizin diğer origin\'lerden açılan pencerelerle paylaştığı browsing context\'i izole eder. Bu, XS-Leaks (cross-site leaks) saldırılarına karşı koruma sağlar ve "same-origin" değeriyle siteniz aynı kaynaktan olmayan sayfalarla window.opener ilişkisini keser.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy', 
      category: 'Güvenlik' 
    });
  }
  
  // 16. Cross-Origin Embedder Policy (COEP)
  if (!lowercaseHeaders['cross-origin-embedder-policy']) {
    issues.push({ 
      type: 'info', 
      field: 'security', 
      message: 'Cross-Origin Embedder Policy (COEP) başlığı eksik.', 
      suggestion: 'Güçlü izolasyon için COEP başlığı ekleyin.', 
      impact: 'low', 
      difficulty: 'zor', 
      example: 'Cross-Origin-Embedder-Policy: require-corp', 
      explanation: 'Cross-Origin Embedder Policy başlığı, bir belgenin yalnızca CORS veya CORP ile açıkça izin verilen kaynakları yüklemesini zorunlu kılar. "require-corp" değeri, cross-origin kaynaklar için CORP veya CORS ile açık izin gerektirir. Bu başlık özellikle güçlü izolasyon gerektiren uygulamalar için önemlidir ve SharedArrayBuffer kullanımı için gereklidir.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy', 
      category: 'Güvenlik' 
    });
  }
  
  // 17. Overall Security Assessment
  
  // Count critical security headers present
  const criticalHeaders = [
    'content-security-policy', 
    'x-content-type-options', 
    'x-frame-options'
  ];
  
  const importantHeaders = [
    'strict-transport-security', 
    'referrer-policy'
  ];
  
  let criticalHeadersPresent = 0;
  criticalHeaders.forEach(header => {
    if (lowercaseHeaders[header]) criticalHeadersPresent++;
  });
  
  let importantHeadersPresent = 0;
  importantHeaders.forEach(header => {
    if (lowercaseHeaders[header]) importantHeadersPresent++;
  });
  
  // Calculate overall security score based on headers
  const maxScore = criticalHeaders.length + importantHeaders.length * 0.7;
  const actualScore = criticalHeadersPresent + importantHeadersPresent * 0.7;
  const securityScore = Math.round((actualScore / maxScore) * 100);
  
  if (securityScore >= 80) {
    successes.push({ 
      field: 'security-score', 
      message: `Güvenlik başlıkları skoru: ${securityScore}/100 (İyi)`, 
      impact: 'high positive' 
    });
  } else if (securityScore >= 50) {
    issues.push({ 
      type: 'warning', 
      field: 'security-score', 
      message: `Güvenlik başlıkları skoru: ${securityScore}/100 (Orta)`, 
      suggestion: 'Kritik güvenlik başlıklarını ekleyin ve doğru yapılandırın.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '', 
      explanation: 'Web siteniz bazı güvenlik başlıklarını kullanıyor ancak önemli başlıklar eksik veya yanlış yapılandırılmış olabilir. Sitenizin güvenliğini artırmak için en azından Content-Security-Policy, X-Content-Type-Options ve X-Frame-Options başlıklarını doğru şekilde yapılandırın.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers', 
      category: 'Güvenlik' 
    });
  } else {
    issues.push({ 
      type: 'error', 
      field: 'security-score', 
      message: `Güvenlik başlıkları skoru: ${securityScore}/100 (Düşük)`, 
      suggestion: 'Kritik güvenlik başlıklarını hemen ekleyin.', 
      impact: 'high', 
      difficulty: 'orta', 
      example: '', 
      explanation: 'Web sitenizde çoğu önemli güvenlik başlığı eksik. Bu, sitenizi XSS, clickjacking ve diğer birçok saldırı türüne karşı savunmasız bırakır. Öncelikle Content-Security-Policy, X-Content-Type-Options ve X-Frame-Options başlıklarını yapılandırın.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers', 
      category: 'Güvenlik' 
    });
  }
  
  // 18. Add recommendations for specific web server configurations
  
  if (issues.length > 0) {
    let serverType = 'bilinmeyen';
    
    if (lowercaseHeaders['server']) {
      const serverHeaderValue = lowercaseHeaders['server'].toLowerCase();
      if (serverHeaderValue.includes('nginx')) {
        serverType = 'nginx';
      } else if (serverHeaderValue.includes('apache')) {
        serverType = 'apache';
      } else if (serverHeaderValue.includes('iis')) {
        serverType = 'iis';
      }
    }
    
    let configExample = '';
    
    switch (serverType) {
      case 'nginx':
        configExample = `# Nginx Güvenlik Başlıkları Konfigürasyonu
server {
  # Diğer konfigürasyonlar...
  
  # Güvenlik başlıkları
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header Content-Security-Policy "default-src 'self';" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self)" always;
  add_header X-XSS-Protection "1; mode=block" always;
}`;
        break;
        
      case 'apache':
        configExample = `# Apache Güvenlik Başlıkları Konfigürasyonu (.htaccess veya httpd.conf)
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header always set Content-Security-Policy "default-src 'self';"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(self)"
  Header always set X-XSS-Protection "1; mode=block"
  
  # Gereksiz başlıkları kaldır
  Header unset X-Powered-By
  ServerSignature Off
</IfModule>`;
        break;
        
      case 'iis':
        configExample = `<!-- IIS Güvenlik Başlıkları Konfigürasyonu (web.config) -->
<configuration>
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
        <add name="Content-Security-Policy" value="default-src 'self';" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
        <add name="Permissions-Policy" value="camera=(), microphone=(), geolocation=(self)" />
        <add name="X-XSS-Protection" value="1; mode=block" />
        
        <remove name="X-Powered-By" />
      </customHeaders>
    </httpProtocol>
    <security>
      <requestFiltering removeServerHeader="true" />
    </security>
  </system.webServer>
</configuration>`;
        break;
        
      default:
        configExample = `# Express.js (Node.js) Güvenlik Başlıkları Örneği
const helmet = require('helmet');
const express = require('express');
const app = express();

// Temel güvenlik başlıklarını ekler
app.use(helmet());

// Özel Content-Security-Policy tanımı
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "trusted-cdn.com"],
      // Diğer direktifler...
    },
  })
);

// HSTS ayarları (Strict-Transport-Security)
app.use(
  helmet.hsts({
    maxAge: 31536000, // 1 yıl
    includeSubDomains: true,
    preload: true,
  })
);`;
        break;
    }
    
    issues.push({ 
      type: 'info', 
      field: 'security-config', 
      message: `${serverType.charAt(0).toUpperCase() + serverType.slice(1)} sunucusu için güvenlik başlıkları yapılandırma örneği`, 
      suggestion: 'Aşağıdaki yapılandırma örneğini sunucunuza göre uyarlayın.', 
      impact: 'info', 
      difficulty: 'referans', 
      example: configExample, 
      explanation: 'Yukarıdaki örnek, bir web sunucusunda temel güvenlik başlıklarını yapılandırmanın genel bir yoludur. Uygulamanızın ihtiyaçlarına ve gereksinimlerine göre bu yapılandırmayı düzenlemeniz önerilir. Özellikle Content-Security-Policy, sitenizin kaynakları ve işlevselliği için özel olarak yapılandırılmalıdır.',
      reference: 'https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html', 
      category: 'Yapılandırma' 
    });
  }
  
  return { issues, successes };
}

// --- Gelişmiş HTTPS ve HTTP/2-3 Protokol Analizi ---
function analyzeProtocol(url: string, responseHeaders: Record<string, string | string[] | undefined> = {}, protocolInfo: { protocol?: string; tlsVersion?: string; ciphers?: string[] } = {}): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // --- HTTPS Analizi ---
  const isHttps = url.toLowerCase().startsWith('https://');
  if (isHttps) {
    successes.push({ 
      field: 'protocol', 
      message: 'HTTPS protokolü kullanılıyor.', 
      impact: 'security' 
    });
    
    // HTTPS doğru şekilde yapılandırılmış mı kontrol et
    const hasHsts = responseHeaders['strict-transport-security'] !== undefined;
    if (hasHsts) {
      const hstsValue = Array.isArray(responseHeaders['strict-transport-security']) 
        ? responseHeaders['strict-transport-security'][0] 
        : responseHeaders['strict-transport-security'] as string;
        
      const hstsMaxAge = hstsValue && hstsValue.match(/max-age=(\d+)/i) ? parseInt(hstsValue.match(/max-age=(\d+)/i)![1]) : 0;
      const hasIncludeSubDomains = hstsValue && hstsValue.toLowerCase().includes('includesubdomains');
      const hasPreload = hstsValue && hstsValue.toLowerCase().includes('preload');
      
      if (hstsMaxAge >= 31536000 && hasIncludeSubDomains) { // 1 yıl veya daha uzun
        successes.push({ 
          field: 'hsts', 
          message: 'Güçlü HSTS politikası yapılandırılmış.', 
          impact: 'high positive' 
        });
      } else if (hstsMaxAge > 0) {
        successes.push({ 
          field: 'hsts', 
          message: 'HSTS politikası mevcut.', 
          impact: 'medium positive' 
        });
        
        if (hstsMaxAge < 31536000) {
          issues.push({ 
            type: 'info', 
            field: 'hsts', 
            message: 'HSTS max-age değeri düşük.', 
            suggestion: 'HSTS max-age değerini en az 1 yıl (31536000 saniye) olarak ayarlayın.', 
            impact: 'medium', 
            difficulty: 'kolay', 
            example: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload', 
            explanation: 'HTTP Strict Transport Security (HSTS), tarayıcıya bir alanın yalnızca HTTPS üzerinden erişilmesi gerektiğini bildirir. Uzun bir max-age değeri (en az 1 yıl önerilir), tarayıcının bu politikayı uzun süre hatırlamasını ve güvenlik açığı riskini azaltmasını sağlar.',
            reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security', 
            category: 'Güvenlik' 
          });
        }
        
        if (!hasIncludeSubDomains) {
          issues.push({ 
            type: 'info', 
            field: 'hsts', 
            message: 'HSTS includeSubDomains direktifi eksik.', 
            suggestion: 'HSTS başlığına includeSubDomains direktifini ekleyin.', 
            impact: 'low', 
            difficulty: 'kolay', 
            example: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload', 
            explanation: 'includeSubDomains direktifi, HSTS politikasını ana alan adının tüm alt alan adlarına uygular. Bu, alt alanlar için de güvenli bağlantı sağlayarak, güvenlik açıklarına karşı daha kapsamlı koruma sunar.',
            reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security', 
            category: 'Güvenlik' 
          });
        }
      } else {
        issues.push({ 
          type: 'warning', 
          field: 'hsts', 
          message: 'HSTS politikası yapılandırılmamış.', 
          suggestion: 'HTTPS güvenliğini artırmak için HSTS politikası ekleyin.', 
          impact: 'medium', 
          difficulty: 'kolay', 
          example: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload', 
          explanation: 'HTTP Strict Transport Security (HSTS), tarayıcıya bir alanın yalnızca HTTPS üzerinden erişilmesi gerektiğini bildirir. Bu, "downgrade attacks" ve "cookie hijacking" gibi saldırılara karşı koruma sağlar. HSTS olmadan, kullanıcılar başlangıçta HTTP üzerinden bağlanabilir ve bu da man-in-the-middle saldırılarına karşı savunmasız kalabilirler.',
          reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security', 
          category: 'Güvenlik' 
        });
      }
    } else {
      issues.push({ 
        type: 'warning', 
        field: 'hsts', 
        message: 'HSTS başlığı eksik.', 
        suggestion: 'HTTPS güvenliğini artırmak için HSTS başlığı ekleyin.', 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload', 
        explanation: 'HTTP Strict Transport Security (HSTS), tarayıcıya bir alanın yalnızca HTTPS üzerinden erişilmesi gerektiğini bildirir. Bu, "downgrade attacks" ve "cookie hijacking" gibi saldırılara karşı koruma sağlar. HSTS olmadan, kullanıcılar başlangıçta HTTP üzerinden bağlanabilir ve bu da man-in-the-middle saldırılarına karşı savunmasız kalabilirler.',
        reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security', 
        category: 'Güvenlik' 
      });
    }
    
    // TLS versiyonu kontrolü
    if (protocolInfo.tlsVersion) {
      const tlsVersion = protocolInfo.tlsVersion;
      
      if (tlsVersion.includes('1.3')) {
        successes.push({ 
          field: 'tls', 
          message: 'En güncel TLS 1.3 protokolü kullanılıyor.', 
          impact: 'high positive' 
        });
      } else if (tlsVersion.includes('1.2')) {
        successes.push({ 
          field: 'tls', 
          message: 'TLS 1.2 protokolü kullanılıyor.', 
          impact: 'medium positive' 
        });
        
        issues.push({ 
          type: 'info', 
          field: 'tls', 
          message: 'TLS 1.3 protokolü kullanılmıyor.', 
          suggestion: 'Performans ve güvenlik için TLS 1.3 protokolünü etkinleştirin.', 
          impact: 'low', 
          difficulty: 'orta', 
          example: '', 
          explanation: 'TLS 1.3, TLS 1.2\'ye göre daha hızlı bağlantı kurulumu, daha güçlü şifreleme ve daha az gecikme sağlar. TLS 1.3, bağlantı kurulumu sırasında gereken yolculuk sayısını azaltarak sayfa yükleme sürelerini iyileştirir. Ayrıca, eski ve güvensiz şifreleme algoritmalarını tamamen kaldırarak güvenliği artırır.',
          reference: 'https://www.cloudflare.com/learning/ssl/why-use-tls-1.3/', 
          category: 'Performans ve Güvenlik' 
        });
      } else if (tlsVersion.includes('1.1') || tlsVersion.includes('1.0')) {
        issues.push({ 
          type: 'error', 
          field: 'tls', 
          message: `Eski TLS ${tlsVersion} protokolü kullanılıyor.`, 
          suggestion: 'Güvenlik için TLS 1.2 veya 1.3 protokolüne yükseltin.', 
          impact: 'high', 
          difficulty: 'orta', 
          example: '', 
          explanation: 'TLS 1.0 ve 1.1, artık güvensiz kabul edilir ve birçok modern tarayıcı tarafından desteklenmemektedir. Bu eski TLS sürümlerini kullanmak, BEAST ve POODLE gibi bilinen güvenlik açıklarına karşı sisteminizi savunmasız bırakır. En azından TLS 1.2, tercihen TLS 1.3 kullanarak hem güvenliği hem de performansı artırabilirsiniz.',
          reference: 'https://blog.qualys.com/product-tech/2018/11/19/grade-change-for-tls-1-0-and-tls-1-1-protocols', 
          category: 'Güvenlik' 
        });
      }
      
      // Şifreleme takımı kontrolü
      if (protocolInfo.ciphers && protocolInfo.ciphers.length > 0) {
        const hasStrongCiphers = protocolInfo.ciphers.some(cipher => 
          cipher.includes('ECDHE') && (cipher.includes('AES-256') || cipher.includes('CHACHA20'))
        );
        
        const hasWeakCiphers = protocolInfo.ciphers.some(cipher => 
          cipher.includes('RC4') || cipher.includes('DES') || cipher.includes('3DES') || 
          cipher.includes('MD5') || cipher.includes('NULL') || cipher.includes('EXPORT')
        );
        
        if (hasStrongCiphers && !hasWeakCiphers) {
          successes.push({ 
            field: 'ciphers', 
            message: 'Güçlü şifreleme takımları kullanılıyor.', 
            impact: 'medium positive' 
          });
        } else if (hasStrongCiphers && hasWeakCiphers) {
          issues.push({ 
            type: 'warning', 
            field: 'ciphers', 
            message: 'Güçlü ve zayıf şifreleme takımları karışık kullanılıyor.', 
            suggestion: 'Zayıf şifreleme takımlarını devre dışı bırakın.', 
            impact: 'medium', 
            difficulty: 'orta', 
            example: '', 
            explanation: 'Sunucu yapılandırmanız hem güçlü hem de zayıf şifreleme takımlarını destekliyor. RC4, DES, 3DES, MD5 gibi zayıf algoritmalar bilinen güvenlik açıklarına sahiptir ve modern web güvenliği için uygun değildir. Yalnızca ECDHE tabanlı ve AES-256/CHACHA20 gibi güçlü algoritmaları etkinleştirin.',
            reference: 'https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices', 
            category: 'Güvenlik' 
          });
        } else {
          issues.push({ 
            type: 'error', 
            field: 'ciphers', 
            message: 'Zayıf şifreleme takımları kullanılıyor.', 
            suggestion: 'Güçlü şifreleme takımlarına geçin.', 
            impact: 'high', 
            difficulty: 'orta', 
            example: '', 
            explanation: 'Sunucunuz, modern güvenlik standartları için uygun olmayan zayıf şifreleme algoritmalarını kullanıyor. Bu, potansiyel saldırılara karşı savunmasız kalmanıza neden olabilir. ECDHE anahtar değişimi ve AES-256 veya ChaCha20 şifreleme kullanan modern şifreleme takımlarına geçmeniz önerilir.',
            reference: 'https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices', 
            category: 'Güvenlik' 
          });
        }
      }
    }
    
    // HTTPS yönlendirmesi kontrolü (HTTP olmayan bir URL için yapılamaz, sadece bilgi amaçlı)
    if (url.toLowerCase().includes('www.') || url.split('.').length > 2) {
      issues.push({ 
        type: 'info', 
        field: 'https-redirect', 
        message: "HTTP'den HTTPS'e ve www/www-olmayan yönlendirmeleri kontrol edin.", 
        suggestion: "Tüm HTTP trafiğini 301 yönlendirme ile HTTPS'e yönlendirin ve canonical domain seçin.", 
        impact: 'medium', 
        difficulty: 'kolay', 
        example: '', 
        explanation: `Web siteniz için hem HTTP hem de HTTPS, ve www/www-olmayan varyantlarının doğru şekilde yapılandırıldığından emin olun. Şunları kontrol edin:
1. HTTP://example.com -> HTTPS://example.com
2. HTTP://www.example.com -> HTTPS://www.example.com
3. Canonical domain seçin (ya www ya da www-olmayan) ve diğerini buna yönlendirin
Bu yönlendirmeler, bölünmüş trafik ve SEO sorunlarını önler.`,
        reference: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls', 
        category: 'SEO ve Güvenlik' 
      });
    }
  } else {
    issues.push({ 
      type: 'error', 
      field: 'protocol', 
      message: 'HTTPS kullanılmıyor.', 
      suggestion: 'Tüm sayfalarınızı HTTPS ile sunun.', 
      impact: 'high', 
      difficulty: 'orta', 
      example: 'https://site.com', 
      explanation: 'HTTPS, web sitenizle kullanıcılar arasındaki tüm iletişimin şifrelenmesini sağlayarak güvenliği artırır. Google ve diğer arama motorları, HTTPS kullanımını bir sıralama faktörü olarak görüyor. Ayrıca, modern tarayıcılar HTTP sayfalarını "güvenli değil" olarak işaretleyerek kullanıcıları uyarıyor. HTTP\'den HTTPS\'e geçiş, sitenizin güvenliği, kullanıcı güveni ve SEO için kritiktir.',
      reference: 'https://developers.google.com/search/docs/advanced/security/https', 
      category: 'SEO ve Güvenlik' 
    });
  }
  
  // --- HTTP/2 ve HTTP/3 Analizi ---
  if (protocolInfo.protocol) {
    const protocol = protocolInfo.protocol.toLowerCase();
    
    if (protocol.includes('h3') || protocol.includes('http/3')) {
      successes.push({ 
        field: 'http-version', 
        message: 'En güncel HTTP/3 protokolü kullanılıyor.', 
        impact: 'high positive' 
      });
      
      // HTTP/3 QUIC parametrelerini kontrol et
      if (!responseHeaders['alt-svc']) {
        issues.push({ 
          type: 'info', 
          field: 'alt-svc', 
          message: 'HTTP/3 kullanılıyor ancak Alt-Svc başlığı eksik.', 
          suggestion: 'HTTP/3 kullanımını optimize etmek için Alt-Svc başlığı ekleyin.', 
          impact: 'low', 
          difficulty: 'kolay', 
          example: 'Alt-Svc: h3=":443"; ma=86400, h3-29=":443"; ma=86400', 
          explanation: 'Alt-Svc (Alternative Services) başlığı, tarayıcıya aynı kaynağa erişmek için alternatif protokollerin ve bağlantı noktalarının mevcut olduğunu bildirir. HTTP/3 için bu başlık, tarayıcıların hızlıca HTTP/3\'e yükseltmelerini sağlar ve tekrar tekrar HTTP/1.1 veya HTTP/2 üzerinden bağlanmaya çalışmalarını önler.',
          reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Alt-Svc', 
          category: 'Performans' 
        });
      }
    } else if (protocol.includes('h2') || protocol.includes('http/2')) {
      successes.push({ 
        field: 'http-version', 
        message: 'HTTP/2 protokolü kullanılıyor.', 
        impact: 'medium positive' 
      });
      
      // HTTP/3 yükseltme tavsiyeleri
      issues.push({ 
        type: 'info', 
        field: 'http-version-upgrade', 
        message: 'HTTP/3 protokolü kullanılmıyor.', 
        suggestion: 'Daha iyi performans için HTTP/3 protokolüne yükseltin.', 
        impact: 'low', 
        difficulty: 'zor', 
        example: '', 
        explanation: 'HTTP/3, HTTP/2\'ye göre önemli performans avantajları sunar, özellikle mobil bağlantılarda ve paket kaybı yaşanan ağlarda. UDP tabanlı QUIC protokolünü kullanarak, bağlantı kurulumu gecikmelerini azaltır ve hızlı bağlantı yeniden kurulumu sağlar. HTTP/3\'e yükseltmek, sayfa yükleme sürelerini iyileştirebilir ve kullanıcı deneyimini artırabilir, özellikle yüksek gecikme süresi olan bağlantılarda.',
        reference: 'https://developers.google.com/web/updates/2019/09/http3-and-quic', 
        category: 'Performans' 
      });
      
      // Alt-Svc başlığının eklenmesini tavsiye et
      if (!responseHeaders['alt-svc']) {
        issues.push({ 
          type: 'info', 
          field: 'alt-svc', 
          message: 'HTTP/3\'e yumuşak geçiş için Alt-Svc başlığı eksik.', 
          suggestion: 'HTTP/3\'e yumuşak geçiş sağlamak için Alt-Svc başlığı ekleyin.', 
          impact: 'low', 
          difficulty: 'kolay', 
          example: 'Alt-Svc: h3=":443"; ma=86400, h3-29=":443"; ma=86400', 
          explanation: 'Alt-Svc başlığı, HTTP/3\'ü desteklemeniz durumunda bile eklenebilir. Bu, tarayıcılara HTTP/3\'ün mevcut olduğunu bildirir ve kullanılabilir olduğunda bağlantıların otomatik olarak yükseltilmesini sağlar. HTTP/3\'e kademeli geçiş yapmanın en iyi yollarından biridir.',
          reference: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Alt-Svc', 
          category: 'Performans' 
        });
      }
    } else if (protocol.includes('http/1.1')) {
      issues.push({ 
        type: 'warning', 
        field: 'http-version', 
        message: 'Eski HTTP/1.1 protokolü kullanılıyor.', 
        suggestion: 'HTTPS ile birlikte HTTP/2 veya HTTP/3 protokolüne yükseltin.', 
        impact: 'high', 
        difficulty: 'orta', 
        example: '', 
        explanation: 'HTTP/1.1, modern web siteleri için performans açısından önemli sınırlamalara sahiptir. Her kaynak için ayrı bir TCP bağlantısı gerektirerek, çok sayıda istek içeren sayfaların yüklenmesini yavaşlatır. HTTP/2, çoklu bağlantı (multiplexing), sunucu push, başlık sıkıştırma gibi özelliklerle sayfa yükleme sürelerini önemli ölçüde iyileştirir. HTTP/2\'ye yükseltmek, özellikle çok sayıda kaynak içeren siteler için büyük performans artışı sağlayabilir.',
        reference: 'https://developers.google.com/web/fundamentals/performance/http2', 
        category: 'Performans' 
      });
    }
  } else if (isHttps) {
    // Protokol bilgisi yoksa ancak HTTPS kullanılıyorsa tahmini öneri yap
    issues.push({ 
      type: 'info', 
      field: 'http-version', 
      message: 'HTTP protokol versiyonu tespit edilemedi.', 
      suggestion: 'Modern protokolleri (HTTP/2 veya HTTP/3) etkinleştirin.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '', 
      explanation: 'HTTP protokol versiyonunuz tespit edilemedi. HTTPS kullandığınıza göre, HTTP/2 protokolünü etkinleştirmeniz performans açısından önemli avantajlar sağlayabilir. HTTP/2, tek bağlantı üzerinden çoklu akış, başlık sıkıştırma ve öncelikli akışlar gibi özelliklerle sayfa yükleme sürelerini önemli ölçüde iyileştirir. Çoğu modern web sunucusu HTTP/2\'yi destekler ve genellikle yapılandırması kolaydır.',
      reference: 'https://developers.google.com/web/fundamentals/performance/http2', 
      category: 'Performans' 
    });
  }
  
  // --- Sıkıştırma Analizi ---
  const contentEncoding = responseHeaders['content-encoding'];
  if (contentEncoding) {
    const encodings = Array.isArray(contentEncoding) 
      ? contentEncoding.map(e => e.toLowerCase())
      : [contentEncoding.toLowerCase()];
    
    if (encodings.some(e => e.includes('br'))) {
      successes.push({ 
        field: 'compression', 
        message: 'Brotli sıkıştırma kullanılıyor.', 
        impact: 'medium positive' 
      });
    } else if (encodings.some(e => e.includes('gzip'))) {
      successes.push({ 
        field: 'compression', 
        message: 'GZIP sıkıştırma kullanılıyor.', 
        impact: 'low positive' 
      });
      
      issues.push({ 
        type: 'info', 
        field: 'compression', 
        message: 'Brotli sıkıştırma kullanılmıyor.', 
        suggestion: 'Daha iyi sıkıştırma oranları için Brotli sıkıştırmayı etkinleştirin.', 
        impact: 'low', 
        difficulty: 'orta', 
        example: '', 
        explanation: 'Brotli, GZIP\'e göre daha iyi sıkıştırma oranları sunan modern bir sıkıştırma algoritmasıdır. Özellikle metin tabanlı kaynaklar (HTML, CSS, JavaScript) için %15-25 daha iyi sıkıştırma sağlayabilir. Bu, sayfa yükleme sürelerini iyileştirir ve bant genişliğinden tasarruf sağlar. Çoğu modern tarayıcı Brotli\'yi destekler ve statik içerik için önceden sıkıştırma yapılabilir.',
        reference: 'https://web.dev/serve-modern-content-to-legacy-browsers-with-content-negotiation/', 
        category: 'Performans' 
      });
    } else {
      issues.push({ 
        type: 'warning', 
        field: 'compression', 
        message: 'Tanınan herhangi bir sıkıştırma yöntemi kullanılmıyor.', 
        suggestion: 'Dosya boyutlarını azaltmak için Brotli veya GZIP sıkıştırma ekleyin.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '', 
        explanation: 'İçerik sıkıştırma, web sayfalarını ve kaynaklarını daha küçük dosya boyutlarına sıkıştırarak sayfa yükleme sürelerini önemli ölçüde iyileştirir. HTML, CSS, JavaScript ve diğer metin tabanlı kaynaklar için Brotli (tercih edilen) veya GZIP sıkıştırma kullanarak, dosya boyutlarını %70\'e kadar azaltabilirsiniz. Bu, özellikle mobil kullanıcılar ve yavaş bağlantılar için önemli performans kazanımları sağlar.',
        reference: 'https://web.dev/reduce-network-payloads-using-text-compression/', 
        category: 'Performans' 
      });
    }
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'compression', 
      message: 'İçerik sıkıştırma kullanılmıyor.', 
      suggestion: 'Dosya boyutlarını azaltmak için Brotli veya GZIP sıkıştırma ekleyin.', 
      impact: 'high', 
      difficulty: 'orta', 
      example: '', 
      explanation: 'İçerik sıkıştırma, web sayfalarını ve kaynaklarını daha küçük dosya boyutlarına sıkıştırarak sayfa yükleme sürelerini önemli ölçüde iyileştirir. HTML, CSS, JavaScript ve diğer metin tabanlı kaynaklar için Brotli (tercih edilen) veya GZIP sıkıştırma kullanarak, dosya boyutlarını %70\'e kadar azaltabilirsiniz. Bu, özellikle mobil kullanıcılar ve yavaş bağlantılar için önemli performans kazanımları sağlar.',
      reference: 'https://web.dev/reduce-network-payloads-using-text-compression/', 
      category: 'Performans' 
    });
  }
  
  // --- Önbellekleme Stratejisi Analizi ---
  const cacheControl = responseHeaders['cache-control'];
  if (cacheControl) {
    const cacheValue = Array.isArray(cacheControl) ? cacheControl[0] : cacheControl;
    
    if (cacheValue.includes('no-store') || cacheValue.includes('no-cache')) {
      successes.push({ 
        field: 'caching', 
        message: 'Önbellekleme politikası yapılandırılmış.', 
        impact: 'low positive' 
      });
      
      // HTML içeriği için uygun, ancak statik içerik için ek öneriler
      issues.push({ 
        type: 'info', 
        field: 'caching', 
        message: 'Statik içerikler için önbellekleme stratejinizi kontrol edin.', 
        suggestion: 'Statik içerikler için agresif önbellekleme kullanın; HTML için ise daha dikkatli yaklaşın.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '# HTML içeriği için:\nCache-Control: no-cache, must-revalidate\n\n# Statik varlıklar (JS, CSS, resimler) için:\nCache-Control: public, max-age=31536000, immutable', 
        explanation: 'Etkili bir önbellekleme stratejisi, içerik türüne göre farklılaştırılmalıdır. HTML içeriği için dikkatli önbellekleme (no-cache veya kısa max-age) kullanılmalı, böylece kullanıcılar her zaman en güncel içeriği görür. Statik varlıklar (JavaScript, CSS, resimler) için ise agresif önbellekleme (uzun max-age ve immutable) uygulanmalıdır. Sürüm etiketleri veya içerik hash\'leri kullanarak statik varlıkların URL\'lerini değiştirme stratejisi ile bu yaklaşım, hem tazeliği korur hem de performansı optimize eder.',
        reference: 'https://web.dev/http-cache/', 
        category: 'Performans' 
      });
    } else if (cacheValue.includes('max-age=')) {
      const maxAge = parseInt(cacheValue.match(/max-age=(\d+)/i)?.[1] || '0');
      
      if (maxAge > 0) {
        successes.push({ 
          field: 'caching', 
          message: 'Önbellekleme politikası yapılandırılmış.', 
          impact: 'medium positive' 
        });
        
        if (maxAge < 604800 && !cacheValue.includes('must-revalidate')) { // 7 gün
          issues.push({ 
            type: 'info', 
            field: 'caching', 
            message: 'Önbellekleme süresi kısa veya orta seviyede.', 
            suggestion: 'İçerik türüne göre önbellekleme stratejinizi optimize edin.', 
            impact: 'low', 
            difficulty: 'orta', 
            example: '# HTML içeriği için:\nCache-Control: no-cache, must-revalidate\n\n# Statik varlıklar (JS, CSS, resimler) için:\nCache-Control: public, max-age=31536000, immutable', 
            explanation: 'Önbellekleme stratejiniz makul görünüyor, ancak içerik türüne göre daha fazla optimizasyon yapılabilir. Değişmeyen statik varlıklar için daha uzun max-age değerleri (1 yıl gibi) ve immutable direktifi kullanarak, tekrar ziyaretlerde hızlı yükleme sağlayabilirsiniz. İçeriğin güncellendiği durumlarda, varlık URL\'lerinde sürüm numaraları veya içerik hash\'leri kullanarak önbellek geçersizleştirme yapabilirsiniz.',
            reference: 'https://web.dev/http-cache/', 
            category: 'Performans' 
          });
        }
      }
    } else {
      issues.push({ 
        type: 'warning', 
        field: 'caching', 
        message: 'Etkili bir önbellekleme politikası tanımlanmamış.', 
        suggestion: 'İçerik türüne göre uygun Cache-Control başlıkları ekleyin.', 
        impact: 'medium', 
        difficulty: 'orta', 
        example: '# HTML içeriği için:\nCache-Control: no-cache, must-revalidate\n\n# Statik varlıklar (JS, CSS, resimler) için:\nCache-Control: public, max-age=31536000, immutable', 
        explanation: 'Etkili bir önbellekleme stratejisi, tekrar ziyaretleri hızlandırır, sunucu yükünü azaltır ve bant genişliği maliyetlerini düşürür. HTML gibi sık değişen içerikler için dikkatli önbellekleme, statik varlıklar için ise agresif önbellekleme kullanın. Değişmeyen statik içerikler (JS, CSS, resimler) için uzun max-age ve immutable direktifleri en iyi performansı sağlar. İçerik güncellendiğinde URL\'leri değiştirerek (örn. sürüm numaraları ekleyerek) önbelleği geçersiz kılabilirsiniz.',
        reference: 'https://web.dev/http-cache/', 
        category: 'Performans' 
      });
    }
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'caching', 
      message: 'Önbellekleme politikası tanımlanmamış.', 
      suggestion: 'İçerik türüne göre uygun Cache-Control başlıkları ekleyin.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '# HTML içeriği için:\nCache-Control: no-cache, must-revalidate\n\n# Statik varlıklar (JS, CSS, resimler) için:\nCache-Control: public, max-age=31536000, immutable', 
      explanation: 'Önbellekleme başlıkları olmadan, tarayıcılar ve proxy sunucuları içeriğinizi nasıl önbelleğe alacaklarını bilemezler. Bu, her istekte tüm kaynakların yeniden yüklenmesine neden olabilir, bu da performansı olumsuz etkiler ve sunucu yükünü artırır. Uygun Cache-Control başlıkları ekleyerek, içeriğinizin ne kadar süreyle önbelleğe alınacağını kontrol edebilir ve tekrarlanan ziyaretlerde sayfa yükleme sürelerini önemli ölçüde azaltabilirsiniz.',
      reference: 'https://web.dev/http-cache/', 
      category: 'Performans' 
    });
  }
  
  // --- HTTP/3 ve HTTP/2 Sunucu Yapılandırması İpuçları ---
  // Sunucu tipini tespit etmeye çalış
  let serverType = 'bilinmeyen';
  if (responseHeaders['server']) {
    const serverHeader = Array.isArray(responseHeaders['server']) 
      ? responseHeaders['server'][0].toLowerCase()
      : responseHeaders['server'].toLowerCase();
      
    if (serverHeader.includes('nginx')) {
      serverType = 'Nginx';
    } else if (serverHeader.includes('apache')) {
      serverType = 'Apache';
    } else if (serverHeader.includes('iis')) {
      serverType = 'IIS';
    } else if (serverHeader.includes('express') || serverHeader.includes('node')) {
      serverType = 'Node.js (Express)';
    }
  } else if (responseHeaders['x-powered-by']) {
    const poweredBy = Array.isArray(responseHeaders['x-powered-by']) 
      ? responseHeaders['x-powered-by'][0].toLowerCase()
      : responseHeaders['x-powered-by'].toLowerCase();
      
    if (poweredBy.includes('express') || poweredBy.includes('node')) {
      serverType = 'Node.js (Express)';
    } else if (poweredBy.includes('php')) {
      serverType = 'PHP (Apache/Nginx muhtemelen)';
    } else if (poweredBy.includes('asp.net')) {
      serverType = 'IIS';
    }
  }
  
  // CF-Ray başlığı varsa Cloudflare kullanıyor olabilir
  if (responseHeaders['cf-ray']) {
    serverType = 'Cloudflare';
  }
  
  // Sunucu türüne göre özel yapılandırma önerileri
  let configExample = '';
  let extraAdvice = '';
  
  if ((protocolInfo.protocol && !protocolInfo.protocol.includes('h2') && !protocolInfo.protocol.includes('http/2') && 
       !protocolInfo.protocol.includes('h3') && !protocolInfo.protocol.includes('http/3')) || !protocolInfo.protocol) {
      
    switch (serverType) {
      case 'Nginx':
        configExample = `# ${serverType} için HTTP/2 ve HTTP/3 yapılandırması örneği
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  # HTTP/3 desteği için (Nginx 1.25+ veya özel derlenmiş sürüm gerekir)
  # listen 443 quic reuseport;
  # listen [::]:443 quic reuseport;
  
  server_name example.com www.example.com;
  
  # SSL sertifikası ve ayarları
  ssl_certificate /path/to/certificate.crt;
  ssl_certificate_key /path/to/private.key;
  
  # Modern TLS yapılandırması
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers off;
  ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305";
  
  # OCSP Stapling
  ssl_stapling on;
  ssl_stapling_verify on;
  resolver 8.8.8.8 8.8.4.4 valid=300s;
  resolver_timeout 5s;
  
  # HTTP/3 için Alt-Svc başlığı
  add_header Alt-Svc 'h3=":443"; ma=86400, h3-29=":443"; ma=86400';
  
  # HSTS (HTTP Strict Transport Security)
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
  
  # Brotli sıkıştırma (ngx_brotli modülü gerektirir)
  brotli on;
  brotli_comp_level 6;
  brotli_types text/plain text/css application/javascript application/json application/xml text/xml text/javascript application/wasm image/svg+xml;
  
  # GZIP sıkıştırma (Brotli desteklenmeyen eski tarayıcılar için)
  gzip on;
  gzip_vary on;
  gzip_proxied any;
  gzip_comp_level 6;
  gzip_types text/plain text/css application/javascript application/json application/xml text/xml text/javascript application/wasm image/svg+xml;
  
  # Statik dosyalar için önbelleğe alma
  location ~* \\.(?:css|js|jpg|jpeg|png|gif|ico|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
  }
  
  # HTML ve XML dosyaları için daha kısa önbellek süresi veya no-cache
  location ~* \\.(?:html|xml)$ {
    add_header Cache-Control "no-cache, must-revalidate";
  }
}

# HTTP'den HTTPS'ye yönlendirme
server {
  listen 80;
  listen [::]:80;
  server_name example.com www.example.com;
  
  location / {
    return 301 https://$host$request_uri;
  }
}`;
        extraAdvice = `Nginx HTTP/2 desteği için Nginx 1.9.5+ gereklidir. HTTP/3 için ya özel derlenmiş bir Nginx sürümü (quic desteğine sahip) ya da Nginx 1.25+ kullanmalısınız. HTTP/3 hala deneysel olduğundan, HTTP/2 ile birlikte kullanmanız önerilir.`;
        break;
        
      case 'Apache':
        configExample = `# ${serverType} için HTTP/2 ve TLS yapılandırması örneği
<VirtualHost *:443>
  ServerName example.com
  ServerAlias www.example.com
  
  # HTTP/2 etkinleştirme
  Protocols h2 http/1.1
  
  # SSL sertifikası ve ayarları
  SSLEngine on
  SSLCertificateFile /path/to/certificate.crt
  SSLCertificateKeyFile /path/to/private.key
  
  # Modern TLS yapılandırması
  SSLProtocol -all +TLSv1.2 +TLSv1.3
  SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AE`;
        break;
        
      default:
        configExample = `# Bilinmeyen sunucu türü için genel protokol optimizasyonları
# Öncelikle aşağıdaki öğeleri web sunucunuzda yapılandırın:

1. HTTPS'i etkinleştirin:
   - Let's Encrypt gibi güvenilir bir sertifika yetkilisinden ücretsiz SSL sertifikası edinin
   - TLS 1.2 ve 1.3 protokollerini etkinleştirin, TLS 1.0 ve 1.1'i devre dışı bırakın
   - Güçlü şifreleme takımlarını kullanın: ECDHE tabanlı modern şifreler

2. HTTP/2'yi etkinleştirin:
   - Çoğu modern web sunucusu HTTP/2'yi destekler
   - HTTP/2 hemen hemen her zaman HTTPS gerektirir

3. HTTP'den HTTPS'e yönlendirme:
   - Tüm HTTP trafiğini 301 kalıcı yönlendirmelerle HTTPS'e yönlendirin

4. HSTS başlığı ekleyin:
   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

5. Sıkıştırma etkinleştirin:
   - GZIP ve ideal olarak Brotli sıkıştırma kullanın
   - HTML, CSS, JavaScript, JSON, XML ve SVG için sıkıştırmayı yapılandırın

6. Verimli önbellekleme için Cache-Control başlıkları:
   - Statik varlıklar için: Cache-Control: public, max-age=31536000, immutable
   - Dinamik HTML için: Cache-Control: no-cache, must-revalidate`;
        extraAdvice = `Web sunucunuzun türü otomatik olarak tespit edilemedi. Kullandığınız web sunucusu veya hizmetine özel HTTP/2 ve TLS yapılandırma talimatlarını arayın. Çoğu durumda, bir CDN (Cloudflare, Fastly, Akamai vb.) kullanmak, bu özellikleri daha kolay yapılandırmanın en hızlı yoludur.`;
        break;
    }
    
    issues.push({ 
      type: 'info', 
      field: 'server-specific', 
      message: `${serverType} için HTTP/2 ve HTTPS yapılandırma önerileri`, 
      suggestion: 'Web sunucunuzda HTTP/2 ve modern TLS yapılandırmasını etkinleştirin.', 
      impact: 'guide', 
      difficulty: 'referans', 
      example: configExample, 
      explanation: `Tespit edilen sunucu türünüz: ${serverType}. ${extraAdvice}`,
      reference: serverType === 'Nginx' ? 'https://nginx.org/en/docs/http/ngx_http_v2_module.html' : 
                 serverType === 'Apache' ? 'https://httpd.apache.org/docs/2.4/mod/mod_http2.html' :
                 'https://web.dev/performance-http2/', 
      category: 'Yapılandırma' 
    });
  }
  
  // --- Protokollerin Genel Skorlaması ---
  let protocolScore = 0;
  // HTTPS: +40 puan
  if (isHttps) protocolScore += 40;
  // HTTP/2: +30 puan
  if (protocolInfo.protocol && (protocolInfo.protocol.includes('h2') || protocolInfo.protocol.includes('http/2'))) {
    protocolScore += 30;
  }
  // HTTP/3: +40 puan (HTTP/2 yerine)
  if (protocolInfo.protocol && (protocolInfo.protocol.includes('h3') || protocolInfo.protocol.includes('http/3'))) {
    protocolScore += 40;
    protocolScore -= 30; // HTTP/2 puanını çıkar (çift sayılmasın)
  }
  // TLS 1.3: +10 puan
  if (protocolInfo.tlsVersion && protocolInfo.tlsVersion.includes('1.3')) {
    protocolScore += 10;
  }
  // HSTS: +10 puan
  if (responseHeaders['strict-transport-security']) protocolScore += 10;
  // Brotli: +5 puan
  if (contentEncoding && contentEncoding.toString().toLowerCase().includes('br')) {
    protocolScore += 5;
  } else if (contentEncoding && contentEncoding.toString().toLowerCase().includes('gzip')) {
    // GZIP: +3 puan
    protocolScore += 3;
  }
  // Etkili önbellekleme: +5 puan
  if (cacheControl && (cacheControl.toString().includes('max-age=') || 
                       cacheControl.toString().includes('no-cache') || 
                       cacheControl.toString().includes('no-store'))) {
    protocolScore += 5;
  }
  
  // Protokol skoru mesajı
  if (protocolScore >= 80) {
    successes.push({ 
      field: 'protocol-score', 
      message: `Protokol optimizasyonu skoru: ${protocolScore}/100 (Mükemmel)`, 
      impact: 'high positive' 
    });
  } else if (protocolScore >= 60) {
    successes.push({ 
      field: 'protocol-score', 
      message: `Protokol optimizasyonu skoru: ${protocolScore}/100 (İyi)`, 
      impact: 'medium positive' 
    });
  } else if (protocolScore >= 40) {
    issues.push({ 
      type: 'info', 
      field: 'protocol-score', 
      message: `Protokol optimizasyonu skoru: ${protocolScore}/100 (Geliştirilmeli)`, 
      suggestion: 'Modern protokoller ve optimizasyon teknikleri kullanın.', 
      impact: 'medium', 
      difficulty: 'orta', 
      example: '', 
      explanation: 'Web siteniz temel protokol gereksinimlerini karşılıyor ancak önemli iyileştirmeler yapabilirsiniz. En azından HTTPS ve HTTP/2 protokollerini etkinleştirerek, web sitenizin performansını ve güvenliğini önemli ölçüde artırabilirsiniz. Ayrıca, içerik sıkıştırma, verimli önbellekleme ve TLS optimizasyonları gibi ek geliştirmeler yaparak kullanıcı deneyimini daha da iyileştirebilirsiniz.',
      reference: 'https://web.dev/fast/#optimize-your-server', 
      category: 'Performans ve Güvenlik' 
    });
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'protocol-score', 
      message: `Protokol optimizasyonu skoru: ${protocolScore}/100 (Zayıf)`, 
      suggestion: 'Protokol optimizasyonunu öncelikli olarak iyileştirin.', 
      impact: 'high', 
      difficulty: 'orta', 
      example: '', 
      explanation: 'Web siteniz modern protokol standartlarını karşılamıyor. HTTPS kullanmak artık web için bir standart haline geldi ve HTTP/2 desteği eklemek performans açısından önemli avantajlar sağlar. Güvenlik ve performansı iyileştirmek için bu temel protokolleri etkinleştirmenizi şiddetle tavsiye ederiz. Ayrıca, içerik sıkıştırma ve verimli önbellekleme gibi ek optimizasyonlar yaparak kullanıcı deneyimini daha da iyileştirebilirsiniz.',
      reference: 'https://web.dev/secure/#secure-your-site-with-https', 
      category: 'Performans ve Güvenlik' 
    });
  }
  
  // Düşük skorlu sitelere ek yardımcı bilgiler
  if (protocolScore < 60 && !isHttps) {
    issues.push({ 
      type: 'info', 
      field: 'https-guide', 
      message: 'HTTPS\'e geçiş kılavuzu', 
      suggestion: 'Let\'s Encrypt ile ücretsiz SSL sertifikası alabilirsiniz.', 
      impact: 'guide', 
      difficulty: 'referans', 
      example: '', 
      explanation: `HTTPS'e geçiş yapmak için basit adımlar:
1. SSL sertifikası edinin:
   - Let's Encrypt ile ücretsiz sertifika alabilirsiniz: https://letsencrypt.org/
   - Certbot aracı çoğu web sunucusu için kurulum sürecini otomatikleştirir: https://certbot.eff.org/
   - Birçok hosting sağlayıcısı artık ücretsiz SSL sertifikaları sunuyor

2. Web sunucunuzu yapılandırın:
   - SSL sertifikaları ve özel anahtarları yükleyin
   - Modern şifreleme ve TLS 1.2+ protokolünü etkinleştirin
   - HTTP'den HTTPS'e otomatik yönlendirme ekleyin (301 yönlendirme)
   
3. İçeriğinizi güncelleyin:
   - Mixed content uyarılarını önlemek için tüm bağıntılı kaynakları HTTPS ile yükleyin
   - İç bağlantıları ve URL'leri protokol göreceli yapmayı düşünün (//example.com yerine)
   
4. HSTS politikasını ekleyin:
   - İlk başta kısa bir süre ile test edin: max-age=300 (5 dakika)
   - Sorun olmadığından emin olunca uzun süreye geçin: max-age=31536000 (1 yıl)`,
      reference: 'https://web.dev/why-https-matters/', 
      category: 'Rehber' 
    });
  }
  
  return { issues, successes };
}

// --- Gelişmiş Badge/Rozet Sistemi ---
type Badge = { 
  key: string; 
  title: string; 
  description: string; 
  icon: string; 
  category?: string; 
  level?: 'bronze' | 'silver' | 'gold' | 'platinum';
  score?: number;
  color?: string;
  requirements?: string[];
};

function getBadges(successes: SEOSuccess[], issues: SEOIssue[] = []): Badge[] {
  const badges: Badge[] = [];
  const allEntries = [...successes, ...issues.map(issue => ({field: issue.field, message: issue.message, impact: issue.impact}))];
  
  // Yardımcı fonksiyon: Bir alandaki başarıları sayar
  function countSuccessesInField(field: string | RegExp): number {
    if (field instanceof RegExp) {
      return successes.filter(s => field.test(s.field)).length;
    }
    return successes.filter(s => s.field === field).length;
  }
  
  // Yardımcı fonksiyon: Bir alanla ilgili başarı var mı kontrol eder
  function hasSuccess(field: string | RegExp, containsText?: string): boolean {
    if (field instanceof RegExp) {
      return successes.some(s => field.test(s.field) && (!containsText || s.message.includes(containsText)));
    }
    return successes.some(s => s.field === field && (!containsText || s.message.includes(containsText)));
  }
  
  // Yardımcı fonksiyon: Bir alanla ilgili sorun var mı kontrol eder
  function hasIssue(field: string | RegExp, containsText?: string): boolean {
    if (field instanceof RegExp) {
      return issues.some(s => field.test(s.field) && (!containsText || s.message.includes(containsText)));
    }
    return issues.some(s => s.field === field && (!containsText || s.message.includes(containsText)));
  }
  
  // Yardımcı fonksiyon: Belirli bir mesaj içeren başarı var mı
  function hasSuccessContaining(text: string): boolean {
    return successes.some(s => s.message.includes(text));
  }
  
  // Yardımcı fonksiyon: İlgili başarıların yüzdesini hesaplar
  function calculateCompletionPercentage(fields: string[]): number {
    const relevantSuccesses = successes.filter(s => fields.includes(s.field)).length;
    return Math.round((relevantSuccesses / fields.length) * 100);
  }
  
  // Yardımcı fonksiyon: Alanlar grubunda belirli sayıda başarı var mı
  function hasMinimumSuccessesInFields(fields: string[], minimum: number): boolean {
    const count = successes.filter(s => fields.includes(s.field)).length;
    return count >= minimum;
  }
  
  // Yardımcı fonksiyon: Bir değer aralığında uygun seviye belirler
  function determineLevel(value: number, thresholds: {bronze: number, silver: number, gold: number, platinum: number}): 'bronze' | 'silver' | 'gold' | 'platinum' | undefined {
    if (value >= thresholds.platinum) return 'platinum';
    if (value >= thresholds.gold) return 'gold';
    if (value >= thresholds.silver) return 'silver';
    if (value >= thresholds.bronze) return 'bronze';
    return undefined;
  }
  
  // -----------------
  // 1. Güvenlik Rozetleri
  // -----------------
  
  // HTTPS / Güvenli Site Rozeti (farklı seviyeler)
  if (hasSuccess(/https|protocol|security/)) {
    let level: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    let description = 'HTTPS ile güvenli bağlantı sağlanıyor.';
    const requirements = ['HTTPS Bağlantısı'];
    
    // Temel HTTPS için bronze
    if (hasSuccess(/https|protocol/, 'HTTP/2')) {
      level = 'silver';
      requirements.push('HTTP/2 Protokolü');
    }
    
    if (hasSuccess(/hsts/)) {
      level = 'gold';
      requirements.push('HSTS Politikası');
      description = 'HTTPS, HSTS politikası ile güçlendirilmiş güvenli bağlantı.';
    }
    
    if (hasSuccess(/tls/) && hasSuccessContaining('TLS 1.3')) {
      level = 'platinum';
      requirements.push('TLS 1.3');
      description = 'HTTPS, HSTS ve en güncel TLS 1.3 ile maksimum güvenlik.';
    }
    
    badges.push({ 
      key: 'secure-site', 
      title: 'Güvenli Site', 
      description, 
      icon: level === 'platinum' ? '🔐' : level === 'gold' ? '🔒' : '🔓', 
      category: 'Güvenlik', 
      level,
      requirements,
      color: level === 'platinum' ? '#8A2BE2' : level === 'gold' ? '#FFD700' : level === 'silver' ? '#C0C0C0' : '#CD7F32'
    });
  }
  
  // Güvenlik Başlıkları Rozeti
  const securityHeaderFields = [
    'content-security-policy', 'x-content-type-options', 'x-frame-options', 
    'referrer-policy', 'permissions-policy', 'csp', 'security'
  ];
  
  const securityHeaderCount = securityHeaderFields.reduce((count, field) => 
    count + (hasSuccess(field) ? 1 : 0), 0);
  
  if (securityHeaderCount > 0) {
    let level: 'bronze' | 'silver' | 'gold' | 'platinum' | undefined;
    let requirements: string[] = [];
    
    if (hasSuccess(/content-security-policy|csp/)) {
      requirements.push('Content-Security-Policy');
    }
    if (hasSuccess(/x-content-type-options/)) {
      requirements.push('X-Content-Type-Options');
    }
    if (hasSuccess(/x-frame-options/)) {
      requirements.push('X-Frame-Options');
    }
    if (hasSuccess(/referrer-policy/)) {
      requirements.push('Referrer-Policy');
    }
    if (hasSuccess(/permissions-policy/)) {
      requirements.push('Permissions-Policy');
    }
    
    level = determineLevel(securityHeaderCount, {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 5
    });
    
    if (level) {
      badges.push({ 
        key: 'security-headers', 
        title: 'Güvenlik Başlıkları', 
        description: `${requirements.length} güvenlik başlığı doğru yapılandırılmış.`, 
        icon: '🛡️', 
        category: 'Güvenlik', 
        level,
        requirements,
        score: securityHeaderCount
      });
    }
  }
  
  // Veri Koruma Rozeti
  if (hasSuccess(/cookie/) || hasSuccess(/gdpr/) || hasSuccess(/privacy/)) {
    const hasCookiePolicy = hasSuccess(/cookie/, 'politika');
    const hasSecureCookies = hasSuccess(/cookie-security/);
    const hasGdprCompliance = hasSuccess(/gdpr/);
    
    let level: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    const requirements: string[] = [];
    
    if (hasCookiePolicy) {
      level = 'bronze';
      requirements.push('Çerez Politikası');
    }
    
    if (hasSecureCookies) {
      level = 'silver';
      requirements.push('Güvenli Çerezler');
    }
    
    if (hasCookiePolicy && hasSecureCookies) {
      level = 'gold';
    }
    
    if (hasGdprCompliance) {
      level = 'platinum';
      requirements.push('GDPR Uyumluluğu');
    }
    
    badges.push({ 
      key: 'data-protection', 
      title: 'Veri Koruma', 
      description: 'Kullanıcı verilerinin korunması için gerekli önlemler alınmış.', 
      icon: '🔐', 
      category: 'Güvenlik', 
      level,
      requirements
    });
  }
  
  // -----------------
  // 2. Performans Rozetleri
  // -----------------
  
  // Hız Performansı Rozeti
  const performanceFields = [
    'performance', 'speed', 'lcp', 'fid', 'cls', 'ttfb', 
    'compression', 'http-version', 'caching', 'images', 'scripts'
  ];
  
  const performanceSuccessCount = performanceFields.reduce((count, field) => 
    count + (hasSuccess(field) ? 1 : 0), 0);
  
  if (performanceSuccessCount > 0) {
    let level = determineLevel(performanceSuccessCount, {
      bronze: 1,
      silver: 3,
      gold: 5,
      platinum: 8
    });
    
    const requirements: string[] = [];
    
    if (hasSuccess(/lcp/)) requirements.push('İyi LCP (En Büyük İçerik Boyama)');
    if (hasSuccess(/fid/)) requirements.push('İyi FID (İlk Giriş Gecikmesi)');
    if (hasSuccess(/cls/)) requirements.push('İyi CLS (Kümülatif Düzen Kayması)');
    if (hasSuccess(/ttfb/)) requirements.push('Hızlı TTFB (İlk Bayt Süresi)');
    if (hasSuccess(/compression/)) requirements.push('İçerik Sıkıştırma');
    if (hasSuccess(/http-version/)) requirements.push('Modern HTTP Protokolü');
    if (hasSuccess(/caching/)) requirements.push('Etkili Önbellekleme');
    if (hasSuccess(/images/, 'optimize')) requirements.push('Optimize Edilmiş Görseller');
    
    if (level) {
      badges.push({ 
        key: 'performance', 
        title: 'Hız Performansı', 
        description: 'Sayfa hızı ve kullanıcı deneyimi metrikleri optimize edilmiş.', 
        icon: '⚡', 
        category: 'Performans', 
        level,
        requirements,
        score: performanceSuccessCount
      });
    }
  }
  
  // Kaynak Optimizasyonu Rozeti
  const resourceOptimizationFields = ['images', 'css', 'js', 'compression', 'minification', 'lazyload'];
  const resourceOptCount = resourceOptimizationFields.reduce((count, field) => 
    count + (hasSuccess(field) ? 1 : 0), 0);
  
  if (resourceOptCount > 0) {
    let level = determineLevel(resourceOptCount, {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 5
    });
    
    const requirements: string[] = [];
    
    if (hasSuccess(/images/)) requirements.push('Görsel Optimizasyonu');
    if (hasSuccess(/css/)) requirements.push('CSS Optimizasyonu');
    if (hasSuccess(/js/)) requirements.push('JavaScript Optimizasyonu');
    if (hasSuccess(/compression/)) requirements.push('İçerik Sıkıştırma');
    if (hasSuccess(/minification/)) requirements.push('Kod Küçültme');
    if (hasSuccess(/lazyload/)) requirements.push('Lazy Loading');
    
    if (level) {
      badges.push({ 
        key: 'resource-optimization', 
        title: 'Kaynak Optimizasyonu', 
        description: 'Web sayfası kaynakları optimize edilmiş.', 
        icon: '📦', 
        category: 'Performans', 
        level,
        requirements
      });
    }
  }
  
  // -----------------
  // 3. SEO Rozetleri
  // -----------------
  
  // Temel SEO Rozeti
  const basicSeoFields = ['title', 'description', 'headings', 'canonical'];
  const basicSeoCompletion = calculateCompletionPercentage(basicSeoFields);
  
  if (basicSeoCompletion > 0) {
    let level = determineLevel(basicSeoCompletion, {
      bronze: 25,
      silver: 50,
      gold: 75,
      platinum: 100
    });
    
    const requirements: string[] = [];
    if (hasSuccess('title')) requirements.push('Optimize Başlık Etiketi');
    if (hasSuccess('description')) requirements.push('Optimize Meta Açıklama');
    if (hasSuccess('headings')) requirements.push('Doğru Başlık Hiyerarşisi');
    if (hasSuccess('canonical')) requirements.push('Canonical URL');
    
    if (level) {
      badges.push({ 
        key: 'basic-seo', 
        title: 'Temel SEO', 
        description: `Temel SEO optimizasyonların ${basicSeoCompletion}%'i tamamlanmış.`, 
        icon: '🔍', 
        category: 'SEO', 
        level,
        requirements,
        score: basicSeoCompletion
      });
    }
  }
  
  // Gelişmiş SEO Rozeti
  const advancedSeoFields = ['structuredData', 'og', 'twitter', 'sitelinks', 'breadcrumbs', 'schema'];
  const advancedSeoCount = advancedSeoFields.reduce((count, field) => 
    count + (hasSuccess(field) ? 1 : 0), 0);
  
  if (advancedSeoCount > 0) {
    let level = determineLevel(advancedSeoCount, {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 5
    });
    
    const requirements: string[] = [];
    if (hasSuccess(/structuredData|schema/)) requirements.push('Yapılandırılmış Veri');
    if (hasSuccess('og')) requirements.push('Open Graph Etiketleri');
    if (hasSuccess('twitter')) requirements.push('Twitter Cards');
    if (hasSuccess('sitelinks')) requirements.push('Site Bağlantıları');
    if (hasSuccess('breadcrumbs')) requirements.push('Ekmek Kırıntıları');
    
    if (level) {
      badges.push({ 
        key: 'advanced-seo', 
        title: 'Gelişmiş SEO', 
        description: 'Zengin sonuçlar ve gelişmiş arama özellikleri için optimizasyon.', 
        icon: '🌟', 
        category: 'SEO', 
        level,
        requirements,
        score: advancedSeoCount
      });
    }
  }
  
  // Sosyal Medya Entegrasyonu Rozeti
  const socialMediaFields = ['og', 'twitter', 'social'];
  const socialMediaCount = socialMediaFields.reduce((count, field) => 
    count + (hasSuccess(field) ? 1 : 0), 0);
  
  if (socialMediaCount > 0) {
    let level = determineLevel(socialMediaCount, {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4
    });
    
    const requirements: string[] = [];
    if (hasSuccess('og')) {
      if (hasSuccess('og', 'image')) requirements.push('OG Görseli');
      if (hasSuccess('og', 'title')) requirements.push('OG Başlığı');
      if (hasSuccess('og', 'description')) requirements.push('OG Açıklaması');
    }
    if (hasSuccess('twitter')) {
      if (hasSuccess('twitter', 'card')) requirements.push('Twitter Card Tipi');
      if (hasSuccess('twitter', 'image')) requirements.push('Twitter Görseli');
    }
    
    if (level) {
      badges.push({ 
        key: 'social-integration', 
        title: 'Sosyal Medya Uyumlu', 
        description: 'Sosyal medya platformlarında optimum paylaşım için yapılandırılmış.', 
        icon: '💬', 
        category: 'SEO', 
        level,
        requirements
      });
    }
  }
  
  // -----------------
  // 4. Mobile ve Responsive Rozetleri
  // -----------------
  
  // Mobil Uyumluluk Rozeti
  if (hasSuccess(/mobile|viewport|responsive/)) {
    let level: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    const requirements: string[] = ['Mobil Viewport'];
    
    if (hasSuccess('viewport')) {
      level = 'bronze';
    }
    
    if (hasSuccess(/responsive/)) {
      level = 'silver';
      requirements.push('Responsive Tasarım');
    }
    
    if (hasSuccess(/mobile/, 'friendly')) {
      level = 'gold';
      requirements.push('Mobil Dostu Tasarım');
    }
    
    if (hasSuccess(/mobile/, 'first') || hasSuccessContaining('Mobil Öncelikli')) {
      level = 'platinum';
      requirements.push('Mobil Öncelikli Tasarım');
    }
    
    badges.push({ 
      key: 'mobile-friendly', 
      title: 'Mobil Dostu', 
      description: level === 'platinum' ? 'Mobil öncelikli, mükemmel mobil kullanıcı deneyimi.' : 
                 level === 'gold' ? 'Mobil dostu, iyi mobil deneyim.' : 
                 'Mobil cihazlarda görüntülenebilir tasarım.', 
      icon: '📱', 
      category: 'Kullanıcı Deneyimi', 
      level,
      requirements
    });
  }
  
  // -----------------
  // 5. İçerik Rozetleri
  // -----------------
  
  // Okunabilirlik Rozeti
  if (hasSuccess(/readability|content/)) {
    let level: 'bronze' | 'silver' | 'gold' | 'platinum' = 'bronze';
    let readabilityScore: number | undefined;
    const requirements: string[] = ['Okunabilir İçerik'];
    
    // Okunabilirlik puanını bul
    const readabilitySuccess = successes.find(s => /readability|content/.test(s.field));
    if (readabilitySuccess) {
      const scoreMatch = readabilitySuccess.message.match(/(\d+([.,]\d+)?)/);
      if (scoreMatch) {
        readabilityScore = parseFloat(scoreMatch[0].replace(',', '.'));
      }
    }
    
    if (readabilityScore !== undefined) {
      if (readabilityScore >= 90) {
        level = 'platinum';
        requirements.push('Mükemmel Okunabilirlik Puanı');
      } else if (readabilityScore >= 80) {
        level = 'gold';
        requirements.push('Yüksek Okunabilirlik Puanı');
      } else if (readabilityScore >= 70) {
        level = 'silver';
        requirements.push('İyi Okunabilirlik Puanı');
      }
    } else if (hasSuccessContaining('yüksek')) {
      level = 'gold';
      requirements.push('Yüksek Okunabilirlik');
    }
    
    badges.push({ 
      key: 'readable-content', 
      title: 'Okunabilir İçerik', 
      description: readabilityScore ? `İçerik okunabilirlik puanı: ${readabilityScore}` : 'İçerik okunabilirlik açısından optimize edilmiş.', 
      icon: '📖', 
      category: 'İçerik', 
      level,
      requirements,
      score: readabilityScore
    });
  }
  
  // İçerik Kalitesi Rozeti
  const contentQualityFields = ['content', 'readability', 'wordcount', 'paragraphs', 'grammar'];
  const contentQualityCount = contentQualityFields.reduce((count, field) => 
    count + (hasSuccess(field) ? 1 : 0), 0);
  
  if (contentQualityCount > 0) {
    let level = determineLevel(contentQualityCount, {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 5
    });
    
    const requirements: string[] = [];
    if (hasSuccess(/content/, 'kalite')) requirements.push('Kaliteli İçerik');
    if (hasSuccess(/wordcount/)) requirements.push('Yeterli Kelime Sayısı');
    if (hasSuccess(/readability/)) requirements.push('İyi Okunabilirlik');
    if (hasSuccess(/paragraphs/)) requirements.push('İyi Paragraflama');
    if (hasSuccess(/grammar/)) requirements.push('Dilbilgisi Kontrolü');
    
    if (level) {
      badges.push({ 
        key: 'content-quality', 
        title: 'İçerik Kalitesi', 
        description: 'Yüksek kaliteli, değerli ve iyi yapılandırılmış içerik.', 
        icon: '✍️', 
        category: 'İçerik', 
        level,
        requirements
      });
    }
  }
  
  // -----------------
  // 6. Erişilebilirlik Rozetleri
  // -----------------
  
  // Erişilebilirlik Rozeti
  const accessibilityFields = [
    'accessibility', 'a11y', 'alt', 'aria', 'contrast', 'keyboard'
  ];
  
  const accessibilityCount = accessibilityFields.reduce((count, field) => 
    count + (hasSuccess(field) ? 1 : 0), 0);
  
  if (accessibilityCount > 0) {
    let level = determineLevel(accessibilityCount, {
      bronze: 1,
      silver: 2,
      gold: 4,
      platinum: 6
    });
    
    const requirements: string[] = [];
    if (hasSuccess(/alt/)) requirements.push('Alt Metinler');
    if (hasSuccess(/aria/)) requirements.push('ARIA Özellikleri');
    if (hasSuccess(/contrast/)) requirements.push('Kontrast Oranları');
    if (hasSuccess(/keyboard/)) requirements.push('Klavye Erişilebilirliği');
    if (hasSuccess(/a11y|accessibility/)) requirements.push('Genel Erişilebilirlik');
    
    if (level) {
      badges.push({ 
        key: 'accessibility', 
        title: 'Erişilebilir Site', 
        description: 'Engelli kullanıcılar için optimize edilmiş tasarım.', 
        icon: '♿', 
        category: 'Erişilebilirlik', 
        level,
        requirements,
        score: accessibilityCount
      });
    }
  }
  
  // -----------------
  // 7. Teknik Mükemmellik Rozetleri
  // -----------------
  
  // Teknik SEO Rozeti
  const technicalFields = [
    'https', 'protocol', 'robots', 'sitemap', 'canonical', 'hreflang', 'amp', 
    'http-version', 'redirects', 'status-code'
  ];
  
  const technicalCount = technicalFields.reduce((count, field) => 
    count + (hasSuccess(field) ? 1 : 0), 0);
  
  if (technicalCount > 0) {
    let level = determineLevel(technicalCount, {
      bronze: 2,
      silver: 4,
      gold: 6,
      platinum: 8
    });
    
    const requirements: string[] = [];
    if (hasSuccess(/https|protocol/)) requirements.push('HTTPS');
    if (hasSuccess('robots')) requirements.push('Robots.txt');
    if (hasSuccess('sitemap')) requirements.push('XML Sitemap');
    if (hasSuccess('canonical')) requirements.push('Canonical URL');
    if (hasSuccess('hreflang')) requirements.push('Hreflang');
    if (hasSuccess('amp')) requirements.push('AMP');
    if (hasSuccess(/http-version/)) requirements.push('Modern HTTP');
    if (hasSuccess(/redirects/)) requirements.push('Doğru Yönlendirmeler');
    
    if (level) {
      badges.push({ 
        key: 'technical-seo', 
        title: 'Teknik SEO Mükemmelliği', 
        description: 'Teknik SEO gereksinimleri başarıyla uygulanmış.', 
        icon: '🔧', 
        category: 'SEO', 
        level,
        requirements,
        score: technicalCount
      });
    }
  }
  
  // -----------------
  // 8. Özel Başarı Rozetleri
  // -----------------
  
  // E-Ticaret Optimizasyonu (eğer varsa)
  if (hasSuccess(/ecommerce|product|schema:product/)) {
    const ecommerceFields = ['ecommerce', 'product', 'schema:product', 'rich-results'];
    const ecommerceCount = ecommerceFields.reduce((count, field) => 
      count + (hasSuccess(field) ? 1 : 0), 0);
    
    let level = determineLevel(ecommerceCount, {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4
    });
    
    const requirements: string[] = [];
    if (hasSuccess(/schema:product|structuredData/, 'product')) requirements.push('Ürün Şeması');
    if (hasSuccess(/rich-results/)) requirements.push('Zengin Sonuçlar');
    if (hasSuccess(/product/)) requirements.push('Ürün Optimizasyonu');
    
    if (level) {
      badges.push({ 
        key: 'ecommerce-optimization', 
        title: 'E-Ticaret Optimizasyonu', 
        description: 'E-Ticaret siteleri için özel optimizasyon uygulanmış.', 
        icon: '🛒', 
        category: 'Özel', 
        level,
        requirements
      });
    }
  }
  
  // Yerel İşletme Optimizasyonu (eğer varsa)
  if (hasSuccess(/local|business|map/)) {
    const localFields = ['local', 'business', 'map', 'schema:localbusiness', 'address'];
    const localCount = localFields.reduce((count, field) => 
      count + (hasSuccess(field) ? 1 : 0), 0);
    
    let level = determineLevel(localCount, {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4
    });
    
    const requirements: string[] = [];
    if (hasSuccess(/schema:localbusiness|structuredData/, 'business')) requirements.push('İşletme Şeması');
    if (hasSuccess(/map/)) requirements.push('Harita Entegrasyonu');
    if (hasSuccess(/address/)) requirements.push('Adres Bilgileri');
    if (hasSuccess(/local/)) requirements.push('Yerel SEO');
    
    if (level) {
      badges.push({ 
        key: 'local-business', 
        title: 'Yerel İşletme Optimizasyonu', 
        description: 'Yerel arama sonuçlarında öne çıkmak için optimizasyon.', 
        icon: '📍', 
        category: 'Özel', 
        level,
        requirements
      });
    }
  }
  
  // Tam Uyumluluk Rozeti (Hiç kritik hata yoksa)
  const hasCriticalIssues = issues.some(issue => issue.type === 'error' || (issue.impact === 'high' && issue.type !== 'info'));
  
  if (!hasCriticalIssues && successes.length > 5) {
    badges.push({ 
      key: 'compliance', 
      title: 'Tam Uyumluluk', 
      description: 'Kritik SEO ve performans sorunları çözülmüş.', 
      icon: '✅', 
      category: 'Genel', 
      level: 'gold',
      requirements: ['Kritik hata yok']
    });
  }
  
  // Toplam Başarı Skoru
  const totalScorePercentage = Math.min(100, Math.round((successes.length / (successes.length + issues.filter(i => i.type !== 'info').length)) * 100));
  
  if (totalScorePercentage > 0) {
    let level = determineLevel(totalScorePercentage, {
      bronze: 40,
      silver: 60,
      gold: 80,
      platinum: 95
    });
    
    if (level) {
      badges.push({ 
        key: 'total-score', 
        title: 'Toplam Başarı Puanı', 
        description: `Genel değerlendirme puanı: ${totalScorePercentage}%`, 
        icon: totalScorePercentage >= 90 ? '🏆' : totalScorePercentage >= 75 ? '🥇' : totalScorePercentage >= 50 ? '🥈' : '🥉', 
        category: 'Genel', 
        level,
        score: totalScorePercentage
      });
    }
  }
  
  return badges;
}

// --- Gelişmiş Kırık Link ve Link Kalitesi Analizi ---
async function analyzeBrokenLinks($: CheerioAPI, baseUrl: string): Promise<{ issues: SEOIssue[]; successes: SEOSuccess[] }> {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Tüm linkleri topla ve sınıflandır
  const allLinks = $("a[href]").toArray();
  const linkMap = new Map<string, {
    url: string, 
    normalizedUrl: string,
    isInternal: boolean, 
    isAnchor: boolean,
    isSpecial: boolean, // mailto, tel, vb.
    occurrences: { element: Cheerio<Element>, anchorText: string, location: string }[]
  }>();
  
  // URL'leri normalize etme yardımcı fonksiyonu
  function normalizeUrl(url: string): string {
    try {
      // Bağıl URL'leri baseUrl ile birleştir
      const fullUrl = new URL(url, baseUrl);
      
      // Fragment'ı (#) kaldır
      fullUrl.hash = '';
      
      // URL'yi normalize et ve döndür
      return fullUrl.toString();
    } catch {
      // Geçersiz URL ise orijinali döndür
      return url;
    }
  }
  
  // Bağlantının iç link olup olmadığını belirle
  function isInternalLink(url: string): boolean {
    try {
      const linkUrl = new URL(url, baseUrl);
      const siteUrl = new URL(baseUrl);
      
      return linkUrl.hostname === siteUrl.hostname;
    } catch {
      // URL parsing hatası durumunda, bağlantıyı harici olarak varsay
      return false;
    }
  }
  
  // Sayfadaki diğer elementlerden konum bilgisi topla
  function getLocationContext(element: Cheerio<Element>): string {
    // Baştan dizinin string türünde olduğunu belirtelim
    const location: string[] = [];
    
    const parentHeading = element.closest('h1, h2, h3, h4, h5, h6').text().trim();
    const hasParentList = element.closest('ul, ol, dl').length > 0;
    const parentElement = element.closest('section, article, div[class*="section"], div[id]');
    const parentSection = parentElement.attr('id') || parentElement.attr('class');
    
    // Başlık bilgisi varsa ekle
    if (parentHeading) {
      const truncatedHeading = parentHeading.length > 30 
        ? `${parentHeading.substring(0, 30)}...` 
        : parentHeading;
      location.push(`Başlık: "${truncatedHeading}"`);
    }
    
    // Liste içinde mi kontrol et
    if (hasParentList) {
      location.push('Liste içinde');
    }
    
    // Bölüm bilgisi varsa ekle
    if (parentSection) {
      location.push(`Bölüm: ${parentSection}`);
    }
    
    // Eğer konum bilgisi bulunamadıysa sayfadaki pozisyonunu tahmin et
    if (location.length === 0) {
      const bodyText = $('body').text();
      const elementText = element.text();
      const elementIndex = bodyText.indexOf(elementText);
      
      if (elementIndex !== -1) {
        const position = elementIndex / bodyText.length;
        if (position < 0.33) {
          location.push('Sayfa üst kısmı');
        } else if (position < 0.66) {
          location.push('Sayfa orta kısmı');
        } else {
          location.push('Sayfa alt kısmı');
        }
      }
    }
    
    return location.join(', ') || 'Belirsiz konum';
  }
  
  // Tüm linkleri topla ve analiz et
  for (const link of allLinks) {
    const element = $(link);
    const href = element.attr("href");
    
    if (!href) continue;
    
    const anchorText = element.text().trim() || element.find('img').attr('alt') || '[Metin Yok]';
    const isAnchor = href.startsWith('#');
    const isSpecial = /^(mailto:|tel:|javascript:|data:)/.test(href);
    
    // Zaten işlenmiş URL'leri tekrar işlememek için normalize et
    const normalizedUrl = isAnchor || isSpecial ? href : normalizeUrl(href);
    const isInternal = !isSpecial && isInternalLink(normalizedUrl);
    const location = getLocationContext(element);
    
    // Link haritasına ekle veya güncelle
    if (!linkMap.has(normalizedUrl)) {
      linkMap.set(normalizedUrl, {
        url: href,
        normalizedUrl,
        isInternal,
        isAnchor,
        isSpecial,
        occurrences: [{ element, anchorText, location }]
      });
    } else {
      linkMap.get(normalizedUrl)!.occurrences.push({ element, anchorText, location });
    }
  }
  
  // Farklı link türlerini ayırma
  const standardLinks = new Map<string, any>();
  const anchorLinks = new Map<string, any>();
  const specialLinks = new Map<string, any>();
  const emptyLinks = new Map<string, any>();
  
  // Linkleri kategorilere ayır
  linkMap.forEach((linkInfo, url) => {
    if (url === '' || url === '#' || url === 'javascript:void(0)') {
      emptyLinks.set(url, linkInfo);
    } else if (linkInfo.isAnchor) {
      anchorLinks.set(url, linkInfo);
    } else if (linkInfo.isSpecial) {
      specialLinks.set(url, linkInfo);
    } else {
      standardLinks.set(url, linkInfo);
    }
  });
  
  // Boş veya problemli linkleri kontrol et
  emptyLinks.forEach((linkInfo, url) => {
    linkInfo.occurrences.forEach((occurrence: { element: Cheerio<Element>, anchorText: string, location: string }) => {
      issues.push({
        type: "warning",
        field: "link",
        message: `Boş veya geçersiz link: "${occurrence.anchorText}"`,
        suggestion: "Link hedefi olmayan bağlantıları düzeltin veya kaldırın.",
        impact: "user experience",
        difficulty: "kolay",
        example: `<a href="${linkInfo.url}">${occurrence.anchorText}</a>`,
        explanation: "Boş veya hedefi olmayan bağlantılar (# veya javascript:void(0) gibi), kullanıcı deneyimini olumsuz etkiler ve SEO için değer sağlamaz. Gerçek bir hedef URL ile değiştirin veya gerekli değilse tamamen kaldırın.",
        reference: "https://developers.google.com/search/docs/crawling-indexing/links-crawlable",
        category: "SEO ve Kullanılabilirlik"
      });
    });
  });
  
  // Sayfa içi bağlantıları kontrol et
  anchorLinks.forEach((linkInfo, url) => {
    const anchorId = url.substring(1); // # karakterini kaldır
    
    // CSS için güvenli karakter dönüşümü yapan fonksiyon
    function cssEscape(value: string): string {
      if (value === '') return '';
      
      let str = String(value);
      const length = str.length;
      let index = -1;
      let result = '';
      const firstCodeUnit = str.charCodeAt(0);
      
      // İlk karakter için özel durum
      if (
        firstCodeUnit === 0x0000 ||
        (firstCodeUnit >= 0x0001 && firstCodeUnit <= 0x001F) ||
        firstCodeUnit === 0x007F ||
        (firstCodeUnit >= 0x0030 && firstCodeUnit <= 0x0039)
      ) {
        result = '\\' + firstCodeUnit.toString(16) + ' ';
      } else {
        result = str.charAt(0);
      }
      
      // Kalanlar
      while (++index < length) {
        const codeUnit = str.charCodeAt(index);
        
        // Özel karakterleri kaçır
        if (
          codeUnit === 0x0000 ||
          (codeUnit >= 0x0001 && codeUnit <= 0x001F) ||
          codeUnit === 0x007F ||
          (codeUnit === 0x002E && index === 0) || // nokta ilk karakterse
          (codeUnit >= 0x0030 && codeUnit <= 0x0039 && index === 0) // rakam ilk karakterse
        ) {
          result += '\\' + codeUnit.toString(16) + ' ';
        } else if (
          codeUnit === 0x002D || // -
          codeUnit === 0x005F || // _
          codeUnit === 0x002E || // .
          (codeUnit >= 0x0030 && codeUnit <= 0x0039) || // 0-9
          (codeUnit >= 0x0041 && codeUnit <= 0x005A) || // A-Z
          (codeUnit >= 0x0061 && codeUnit <= 0x007A) // a-z
        ) {
          result += str.charAt(index);
        } else {
          result += '\\' + str.charAt(index);
        }
      }
      
      return result;
    }
    
    const targetExists = anchorId === '' || $('#' + cssEscape(anchorId)).length > 0 || $(`[name="${anchorId}"]`).length > 0;
    
    if (!targetExists) {
      linkInfo.occurrences.forEach((occurrence: { element: Cheerio<Element>, anchorText: string, location: string }) => {
        issues.push({
          type: "warning",
          field: "link",
          message: `Hedefi olmayan sayfa içi bağlantı: "${occurrence.anchorText}" (${url})`,
          suggestion: "Sayfa içi bağlantının doğru bir ID'ye işaret ettiğinden emin olun.",
          impact: "user experience",
          difficulty: "kolay",
          example: `<a href="#doğru-id">${occurrence.anchorText}</a>`,
          explanation: "Sayfa içi bağlantılar (çapa bağlantılar) sayfada var olmayan bir ID'ye işaret ediyorsa, kullanıcılar tıkladığında hiçbir şey olmaz. Bu, kullanıcı deneyimini olumsuz etkiler. Bağlantının doğru ID'ye işaret ettiğinden emin olun veya gerekli ID'yi ilgili öğeye ekleyin.",
          reference: "https://developers.google.com/search/docs/crawling-indexing/links-crawlable",
          category: "Kullanılabilirlik"
        });
      });
    }
  });
  
  // Özel bağlantıları kontrol et (mailto:, tel:, vb.)
  specialLinks.forEach((linkInfo, url) => {
    // mailto kontrolü
    if (url.startsWith('mailto:')) {
      const email = url.substring(7);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        linkInfo.occurrences.forEach((occurrence: { element: Cheerio<Element>, anchorText: string, location: string }) => {
          issues.push({
            type: "info",
            field: "link",
            message: `Geçersiz e-posta bağlantısı: "${email}"`,
            suggestion: "Geçerli bir e-posta adresi kullanın.",
            impact: "low",
            difficulty: "kolay",
            example: `<a href="mailto:ornek@domain.com">${occurrence.anchorText}</a>`,
            explanation: "E-posta bağlantınız (mailto:) geçerli bir e-posta formatında değil. Bu, kullanıcıların e-posta istemcilerinin doğru şekilde açılmamasına neden olabilir.",
            reference: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#linking_to_an_email_address",
            category: "Kullanılabilirlik"
          });
        });
      }
    }
    
    // tel kontrolü
    if (url.startsWith('tel:')) {
      const phone = url.substring(4);
      if (!/^[+]?[\d\s()-]{6,20}$/.test(phone)) {
        linkInfo.occurrences.forEach((occurrence: { element: Cheerio<Element>, anchorText: string, location: string }) => {
          issues.push({
            type: "info",
            field: "link",
            message: `Şüpheli telefon bağlantısı: "${phone}"`,
            suggestion: "Geçerli bir telefon numarası formatı kullanın.",
            impact: "low",
            difficulty: "kolay",
            example: `<a href="tel:+901234567890">${occurrence.anchorText}</a>`,
            explanation: "Telefon bağlantınız (tel:) şüpheli bir format içeriyor. En iyi uygulama, uluslararası formatta (+90 gibi ülke kodu ile) telefon numaraları kullanmaktır.",
            reference: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#linking_to_a_telephone_number",
            category: "Kullanılabilirlik"
          });
        });
      }
    }
    
    // javascript bağlantıları
    if (url.startsWith('javascript:')) {
      linkInfo.occurrences.forEach((occurrence: { element: Cheerio<Element>, anchorText: string, location: string }) => {
        issues.push({
          type: "info",
          field: "link",
          message: `JavaScript protokol bağlantısı: "${occurrence.anchorText}"`,
          suggestion: "JavaScript protokolü yerine modern event handler kullanın.",
          impact: "medium",
          difficulty: "orta",
          example: `<a href="#" onclick="myFunction()">${occurrence.anchorText}</a> veya <button onclick="myFunction()">${occurrence.anchorText}</button>`,
          explanation: "JavaScript protokol bağlantıları (javascript:) eski bir yaklaşımdır ve bazı tarayıcılarda güvenlik nedeniyle engellenebilir. Bunun yerine, onclick olay işleyicileri veya modern JavaScript kullanarak bağlantıları yönetin. Ayrıca, bağlantı yerine bir düğme kullanmanız gerekiyorsa, semantik olarak <button> elementi tercih edilmelidir.",
          reference: "https://developer.mozilla.org/en-US/docs/Web/Security/Fixing_website_security_vulnerabilities",
          category: "Güvenlik ve Kullanılabilirlik"
        });
      });
    }
  });
  
  // HTTP vs HTTPS kontrolü yap
  standardLinks.forEach((linkInfo, url) => {
    if (url.startsWith('http:')) {
      linkInfo.occurrences.forEach((occurrence: { element: Cheerio<Element>, anchorText: string, location: string }) => {
        issues.push({
          type: "warning",
          field: "link",
          message: `Güvensiz HTTP bağlantısı: "${occurrence.anchorText}"`,
          suggestion: "Mümkünse HTTPS bağlantıları kullanın.",
          impact: "medium",
          difficulty: "kolay",
          example: url.replace('http:', 'https:'),
          explanation: "HTTP bağlantıları şifreleme içermez ve güvenli değildir. Modern web siteleri güvenlik ve SEO avantajları için HTTPS kullanmalıdır. Bağlantıları HTTPS versiyonlarına güncelleyin veya alternatif güvenli kaynaklar bulun.",
          reference: "https://developers.google.com/search/docs/advanced/security/https",
          category: "Güvenlik ve SEO"
        });
      });
    }
  });
  
  // Dış linklerde rel="noopener" kontrolü yap
  standardLinks.forEach((linkInfo, url) => {
    if (!linkInfo.isInternal) {
      linkInfo.occurrences.forEach((occurrence: { element: Cheerio<Element>; anchorText: string; location: string }) => {
        const hasNoopener = occurrence.element.attr('rel')?.includes('noopener');
        const hasTarget = occurrence.element.attr('target') === '_blank';
        
        if (hasTarget && !hasNoopener) {
          issues.push({
            type: "info",
            field: "link",
            message: `Harici bağlantıda noopener eksik: "${occurrence.anchorText}"`,
            suggestion: `target="_blank" kullanan harici bağlantılarda rel="noopener" ekleyin.`,
            impact: "low",
            difficulty: "kolay",
            example: `<a href="${url}" target="_blank" rel="noopener">${occurrence.anchorText}</a>`,
            explanation: "Yeni sekmelerde açılan harici bağlantılar (target='_blank') güvenlik açığı oluşturabilir; bağlantı açılan yeni sayfa, window.opener API aracılığıyla orijinal sayfanıza erişebilir. Bu, olası kimlik avı saldırıları için bir vektör oluşturabilir. rel='noopener' bu güvenlik açığını kapatır.",
            reference: "https://web.dev/external-anchors-use-rel-noopener/",
            category: "Güvenlik"
          });
        }
      });
    }
  });
  
  // Dahili ve harici linklerin nofollow durumunu kontrol et
  standardLinks.forEach((linkInfo, url) => {
    linkInfo.occurrences.forEach((occurrence: { element: Cheerio<Element>; anchorText: string; location: string }) => {
      const rel = occurrence.element.attr('rel') || '';
      const hasNofollow = rel.includes('nofollow');
      
      if (linkInfo.isInternal && hasNofollow) {
        issues.push({
          type: "info",
          field: "link",
          message: `Dahili bağlantıda nofollow: "${occurrence.anchorText}"`,
          suggestion: "Dahili bağlantılarda genellikle nofollow kullanmaktan kaçının.",
          impact: "low",
          difficulty: "kolay",
          example: `<a href="${url}">${occurrence.anchorText}</a>`,
          explanation: "Dahili bağlantılarda 'nofollow' kullanmak, arama motorlarının sitenizin içerisinde dolaşmasını engelleyebilir ve bu, site içi SEO sinyallerini zayıflatabilir. Nofollow sadece arama motorlarının takip etmesini istemediğiniz özel içerikler için kullanılmalıdır (kullanıcı tarafından oluşturulan içerik, yorumlar, giriş bağlantıları vb.).",
          reference: "https://developers.google.com/search/docs/advanced/guidelines/qualify-outbound-links",
          category: "SEO"
        });
      }
    });
  });
  
  // Kırık linkleri kontrol et (en fazla 20 benzersiz URL)
  const urlsToCheck = Array.from(standardLinks.keys()).slice(0, 20);
  const brokenLinkResults = await Promise.allSettled(
    urlsToCheck.map(async url => {
      try {
        // Önce HEAD isteği dene, daha hızlı
        const res = await axios.head(url, { 
          timeout: 5000,
          maxRedirects: 3,
          validateStatus: null, // Tüm durum kodlarını kabul et
          headers: {
            'User-Agent': 'Mozilla/5.0 SEO Analyzer Bot (compatible; SEOAnalyzer/1.0; +https://example.com/bot)'
          }
        });
        
        return {
          url,
          status: res.status,
          redirectUrl: res.request?.res?.responseUrl || url,
          redirectCount: res.request?.res?.req?._redirectable?._redirectCount || 0,
          success: res.status < 400
        };
      } catch (error) {
        // HEAD isteği başarısız olursa GET dene
        try {
          const res = await axios.get(url, { 
            timeout: 5000,
            maxRedirects: 3,
            validateStatus: null,
            headers: {
              'User-Agent': 'Mozilla/5.0 SEO Analyzer Bot (compatible; SEOAnalyzer/1.0; +https://example.com/bot)'
            }
          });
          
          return {
            url,
            status: res.status,
            redirectUrl: res.request?.res?.responseUrl || url,
            redirectCount: res.request?.res?.req?._redirectable?._redirectCount || 0,
            success: res.status < 400
          };
        } catch (error) {
          // Type cast the error to access its properties
          const getError = error as { response?: { status?: number }; message?: string };
          
          return {
            url,
            status: getError.response?.status || 0,
            error: getError.message || 'Bağlantı hatası',
            success: false
          };
        }
      }
    })
  );
  
  // Kırık link sonuçlarını işle
  let brokenCount = 0;
  let redirectCount = 0;
  brokenLinkResults.forEach((result, index) => {
    const url = urlsToCheck[index];
    const linkInfo = standardLinks.get(url);
    
    if (result.status === 'fulfilled') {
      if (!result.value.success) {
        brokenCount++;
        
        linkInfo.occurrences.forEach((occurrence: { element: Cheerio<Element>, anchorText: string, location: string }) => {
          issues.push({
            type: "warning",
            field: "link",
            message: `Kırık bağlantı: "${occurrence.anchorText}" - Durum: ${result.value.status || 'Erişilemedi'}`,
            suggestion: "Kırık bağlantıyı güncelleyin veya kaldırın.",
            impact: "user experience",
            difficulty: "kolay",
            example: `<a href="[Çalışan alternatif URL]">${occurrence.anchorText}</a>`,
            explanation: `Bu bağlantı bir hata döndürüyor (HTTP ${result.value.status || 'hata'}). Bağlantının çalıştığını doğrulayın ve gerekirse güncelleyin veya alternatif bir kaynak bulun. Bağlantı yerleşimi: ${occurrence.location}`,
            reference: "https://developers.google.com/search/docs/appearance/broken-links",
            category: "SEO ve Kullanıcı Deneyimi"
          });
        });
      } else if (result.value.redirectCount > 0) {
        redirectCount++;
        
        // Yalnızca 2'den fazla yönlendirme varsa bildir
        if (result.value.redirectCount > 1) {
          linkInfo.occurrences.forEach((occurrence: { element: Cheerio<Element>, anchorText: string, location: string }) => {
            issues.push({
              type: "info",
              field: "link",
              message: `Yönlendirilen bağlantı: "${occurrence.anchorText}" (${result.value.redirectCount} yönlendirme)`,
              suggestion: "Doğrudan hedef URL'yi kullanın.",
              impact: "low",
              difficulty: "kolay",
              example: `<a href="${result.value.redirectUrl}">${occurrence.anchorText}</a>`,
              explanation: "Bu bağlantı birden fazla yönlendirme içeriyor. Yönlendirmeler, sayfa yükleme süresini artırabilir ve kullanıcı deneyimini olumsuz etkileyebilir. En iyi uygulama, doğrudan hedef URL'yi kullanmaktır.",
              reference: "https://developers.google.com/search/docs/advanced/guidelines/301-redirects",
              category: "Performans"
            });
          });
        }
      }
    } else {
      // İstek başarısız oldu
      brokenCount++;
      
      linkInfo.occurrences.forEach((occurrence: { element: Cheerio<Element>, anchorText: string, location: string }) => {
        issues.push({
          type: "warning",
          field: "link",
          message: `Erişilemeyen bağlantı: "${occurrence.anchorText}"`,
          suggestion: "Bağlantının doğru olduğunu ve hedef sitenin çalıştığını kontrol edin.",
          impact: "medium",
          difficulty: "kolay",
          example: `<a href="[Doğrulanmış URL]">${occurrence.anchorText}</a>`,
          explanation: `Bu bağlantıya erişilemedi. Hata: ${result.reason || 'Bilinmeyen hata'}. Hedef site geçici olarak çalışmıyor olabilir veya URL yanlış olabilir. Bağlantıyı doğrulayın ve gerekirse güncelleyin.`,
          reference: "https://developers.google.com/search/docs/appearance/broken-links",
          category: "SEO ve Kullanıcı Deneyimi"
        });
      });
    }
  });
  
  // Özet bilgiler
  const totalLinks = allLinks.length;
  const uniqueLinks = linkMap.size;
  const internalLinks = Array.from(linkMap.values()).filter(link => link.isInternal).length;
  const externalLinks = Array.from(linkMap.values()).filter(link => !link.isInternal && !link.isAnchor && !link.isSpecial).length;
  
  // Başarı mesajları ekle
  if (brokenCount === 0 && urlsToCheck.length > 0) {
    successes.push({ 
      field: "link", 
      message: `Test edilen ${urlsToCheck.length} bağlantıda kırık bağlantı bulunamadı.`, 
      impact: "high positive" 
    });
  }
  
  if (totalLinks > 0) {
    successes.push({ 
      field: "link-summary", 
      message: `Toplam ${totalLinks} bağlantı bulundu (${uniqueLinks} benzersiz URL, ${internalLinks} dahili, ${externalLinks} harici).`, 
      impact: "info" 
    });
  }
  
  if (redirectCount > 0) {
    successes.push({ 
      field: "link-redirects", 
      message: `${redirectCount} bağlantı yönlendirme içeriyor.`, 
      impact: "info" 
    });
  }
  
  // Kontrol edilen link sayısını sınırla
  if (uniqueLinks > urlsToCheck.length) {
    issues.push({
      type: "info",
      field: "link-limit",
      message: `Bağlantıların yalnızca ilk ${urlsToCheck.length} tanesi kontrol edildi (toplam ${uniqueLinks} benzersiz bağlantı var).`,
      suggestion: "Tam link analizi için tüm sayfalarınızı kontrol etmeniz önerilir.",
      impact: "info",
      difficulty: "bilgi",
      example: "",
      explanation: "Performans nedenleriyle, sadece sınırlı sayıda bağlantı kontrol edildi. Kapsamlı bir link analizi için tam SEO denetimi veya bağlantı kontrol araçları kullanmanız önerilir.",
      reference: "https://developers.google.com/search/docs/crawling-indexing/links-crawlable",
      category: "Bilgi"
    });
  }
  
  return { issues, successes };
}

// --- Gelişmiş Robots.txt ve Sitemap.xml Analizi (asenkron) ---
async function analyzeRobotsSitemap(url: string): Promise<{ issues: SEOIssue[]; successes: SEOSuccess[] }> {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  const u = new URL(url);
  const origin = u.origin;
  const domain = u.hostname;
  
  // Analiz edilecek robots.txt ve sitemap konumları
  const robotsUrl = `${origin}/robots.txt`;
  const commonSitemapURLs = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
    `${origin}/sitemaps/sitemap.xml`,
    `${origin}/sitemap/sitemap.xml`,
  ];
  
  // ----------------
  // ROBOTS.TXT ANALİZİ
  // ----------------
  let robotsContent = '';
  let robotsFound = false;
  let sitemapsInRobots: string[] = [];
  let userAgentRules: {
    userAgent: string;
    allow: string[];
    disallow: string[];
    crawlDelay?: string;
  }[] = [];
  
  try {
    const robotsRes = await axios.get(robotsUrl, { 
      timeout: 5000,
      validateStatus: status => status < 500, // 4xx hatalarını kabul et (404 gibi)
      headers: {
        'User-Agent': 'Mozilla/5.0 SEO Analyzer Bot (compatible; SEOAnalyzer/1.0; +https://example.com/bot)'
      }
    });
    
    if (robotsRes.status === 200) {
      robotsFound = true;
      robotsContent = robotsRes.data;
      
      // Başarı mesajı ekle
      successes.push({ 
        field: "robots.txt", 
        message: "robots.txt dosyası mevcut ve erişilebilir.", 
        impact: "indexing" 
      });
      
      // Robots.txt içeriğini analiz et
      const lines = robotsContent.split('\n').map(line => line.trim());
      let currentUserAgent: string | null = null;
      let currentRules: typeof userAgentRules[0] | null = null;
      
      for (let line of lines) {
        // Yorumları kaldır
        line = line.split('#')[0].trim();
        if (!line) continue;
        
        // User-agent satırlarını kontrol et
        const userAgentMatch = line.match(/^user-agent:\s*(.+)/i);
        if (userAgentMatch) {
          currentUserAgent = userAgentMatch[1].trim().toLowerCase();
          // Yeni bir user-agent kuralı başlat
          currentRules = {
            userAgent: currentUserAgent,
            allow: [],
            disallow: []
          };
          userAgentRules.push(currentRules);
          continue;
        }
        
        // Eğer aktif bir user-agent varsa kuralları topla
        if (currentRules) {
          // Disallow kuralları
          const disallowMatch = line.match(/^disallow:\s*(.+)/i);
          if (disallowMatch) {
            const disallowPath = disallowMatch[1].trim();
            if (disallowPath) {
              currentRules.disallow.push(disallowPath);
            }
            continue;
          }
          
          // Allow kuralları
          const allowMatch = line.match(/^allow:\s*(.+)/i);
          if (allowMatch) {
            const allowPath = allowMatch[1].trim();
            if (allowPath) {
              currentRules.allow.push(allowPath);
            }
            continue;
          }
          
          // Crawl-delay kuralı
          const crawlDelayMatch = line.match(/^crawl-delay:\s*(.+)/i);
          if (crawlDelayMatch) {
            currentRules.crawlDelay = crawlDelayMatch[1].trim();
            continue;
          }
        }
        
        // Sitemap referanslarını topla
        const sitemapMatch = line.match(/^sitemap:\s*(.+)/i);
        if (sitemapMatch) {
          const sitemapUrl = sitemapMatch[1].trim();
          if (sitemapUrl) {
            sitemapsInRobots.push(sitemapUrl);
          }
          continue;
        }
      }
      
      // Toplanan bilgileri analiz et
      
      // Kontrol: robots.txt'de disallow: / var mı?
      const hasFullDisallow = userAgentRules.some(rule => 
        (rule.userAgent === '*' || rule.userAgent === 'googlebot' || rule.userAgent === 'bingbot') && 
        rule.disallow.some(path => path === '/' || path === '/*')
      );
      
      if (hasFullDisallow) {
        issues.push({
          type: "warning",
          field: "robots.txt",
          message: "robots.txt tüm site indekslemesini engelliyor.",
          suggestion: "Site tamamlanana kadar geliştirme aşamasındaysa bu normal olabilir, ancak canlı siteler için indekslemeyi engellemek SEO açısından zararlıdır.",
          impact: "high",
          difficulty: "kolay",
          example: "User-agent: *\nDisallow: /admin/\nAllow: /",
          explanation: "robots.txt dosyanızdaki 'Disallow: /' komutu, arama motorlarının sitenizin tamamını taramasını engelliyor. Bu, geliştirme aşamasındaki veya özel siteler için normal olabilir, ancak canlı ve halka açık bir site için tüm içeriğinizi arama motorlarından gizleyerek SEO'nuza ciddi şekilde zarar verir.",
          reference: "https://developers.google.com/search/docs/crawling-indexing/robots/intro",
          category: "SEO"
        });
      }
      
      // Kontrol: robots.txt'de hiç disallow yok mu?
      const hasNoDisallows = userAgentRules.every(rule => rule.disallow.length === 0);
      
      if (hasNoDisallows && userAgentRules.length > 0) {
        issues.push({
          type: "info",
          field: "robots.txt",
          message: "robots.txt'de hiç Disallow kuralı bulunmuyor.",
          suggestion: "Admin paneli, özel sayfalar ve duplike içerikler için Disallow kuralları ekleyin.",
          impact: "low",
          difficulty: "kolay",
          example: "User-agent: *\nDisallow: /admin/\nDisallow: /temp/\nDisallow: /duplicate-content/",
          explanation: "Disallow kuralları olmayan bir robots.txt, arama motorlarının sitenizin her yerine erişmesine izin verir. Bu genellikle iyi olsa da, admin panelleri, taslak sayfalar, test sayfaları ve duplike içerikler gibi indekslenmemesi gereken alanları koruma altına almanız önerilir.",
          reference: "https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt",
          category: "SEO"
        });
      }
      
      // Kontrol: Sitemap belirtilmiş mi?
      if (sitemapsInRobots.length === 0) {
        issues.push({
          type: "info",
          field: "robots.txt",
          message: "robots.txt'de sitemap tanımlanmamış.",
          suggestion: "robots.txt dosyanıza sitemap referansı ekleyin.",
          impact: "low",
          difficulty: "kolay",
          example: "Sitemap: https://example.com/sitemap.xml",
          explanation: "robots.txt dosyanızda sitemap referansı bulunmuyor. Sitemap referansı eklemek, arama motorlarının sitenizin yapısını anlamasına ve içeriğinizi daha verimli taramasına yardımcı olur. Özellikle büyük siteler için sitemap kullanmak, indeksleme sürecini hızlandırabilir.",
          reference: "https://developers.google.com/search/docs/advanced/sitemaps/build-sitemap",
          category: "SEO"
        });
      } else {
        successes.push({ 
          field: "robots.txt", 
          message: `robots.txt'de ${sitemapsInRobots.length} sitemap referansı bulundu.`, 
          impact: "medium positive" 
        });
      }
      
      // Kontrol: Crawl-delay kullanılıyor mu?
      const hasCrawlDelay = userAgentRules.some(rule => rule.crawlDelay !== undefined);
      
      if (hasCrawlDelay) {
        issues.push({
          type: "info",
          field: "robots.txt",
          message: "robots.txt'de Crawl-delay direktifi kullanılıyor.",
          suggestion: "Google ve Bing Crawl-delay'i dikkate almaz, bunun yerine arama motoru konsollarını kullanın.",
          impact: "low",
          difficulty: "bilgi",
          example: "Google Search Console veya Bing Webmaster Tools üzerinden tarama hızını ayarlayın.",
          explanation: "Crawl-delay direktifi bazı arama motorları tarafından desteklenir, ancak Google ve Bing gibi büyük arama motorları bu direktifi dikkate almaz. Tarama hızını kontrol etmek için, Google Search Console veya Bing Webmaster Tools gibi arama motoru webmaster araçlarını kullanmanız daha etkilidir.",
          reference: "https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt",
          category: "SEO"
        });
      }
      
      // Kontrol: robots.txt boyutu çok büyük mü?
      if (robotsContent.length > 50000) {
        issues.push({
          type: "warning",
          field: "robots.txt",
          message: "robots.txt dosyası çok büyük.",
          suggestion: "robots.txt dosyasını 500KB'den küçük tutun ve kuralları optimize edin.",
          impact: "medium",
          difficulty: "orta",
          example: "Wildcard karakter kullanarak benzer kuralları birleştirin.\nUser-agent: *\nDisallow: /*.pdf$",
          explanation: "Çok büyük robots.txt dosyaları işlenme süresini uzatabilir veya bazı durumlarda tamamen yoksayılabilir. Arama motorları genellikle robots.txt için bir boyut sınırı uygular (Google için 500KB). Boyutu küçültmek için joker karakterler (*) kullanarak benzer kuralları birleştirin ve gereksiz veya tekrarlayan kuralları kaldırın.",
          reference: "https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt",
          category: "SEO"
        });
      }
      
      // Kontrol: robots.txt'de hatalı sözdizimi var mı?
      const hasInvalidSyntax = lines.some(line => {
        if (!line.trim() || line.startsWith('#')) return false;
        return !(
          /^user-agent:/i.test(line) ||
          /^disallow:/i.test(line) ||
          /^allow:/i.test(line) ||
          /^sitemap:/i.test(line) ||
          /^crawl-delay:/i.test(line) ||
          /^host:/i.test(line) ||
          /^(#|$)/.test(line)
        );
      });
      
      if (hasInvalidSyntax) {
        issues.push({
          type: "warning",
          field: "robots.txt",
          message: "robots.txt dosyasında olası biçim hataları var.",
          suggestion: "robots.txt dosyasının sözdizimini kontrol edin.",
          impact: "medium",
          difficulty: "kolay",
          example: "User-agent: *\nDisallow: /admin/\n# Yorum satırı",
          explanation: "robots.txt dosyanızda tanınmayan direktifler veya yanlış biçimlendirilmiş satırlar olabilir. robots.txt, belirli bir formata sahip olmalıdır ve tanınmayan direktifler genellikle yoksayılır, bu da beklediğiniz davranışın gerçekleşmemesine neden olabilir. Her satırın geçerli bir direktif veya yorum olduğundan emin olun.",
          reference: "https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt",
          category: "SEO"
        });
      }
      
      // Önemli dizinlerin kontrolü
      const importantUserPaths = ['/wp-admin/', '/admin/', '/login/', '/wp-login.php', '/user/', '/cart/', '/checkout/', '/account/'];
      const protectedPaths = userAgentRules.flatMap(rule => rule.disallow);
      
      const unprotectedImportantPaths = importantUserPaths.filter(path => 
        !protectedPaths.some(disallow => disallow.includes(path) || path.includes(disallow))
      );
      
      if (unprotectedImportantPaths.length > 0) {
        issues.push({
          type: "info",
          field: "robots.txt",
          message: "Bazı önemli dizinler robots.txt'de korunmuyor olabilir.",
          suggestion: "Admin, oturum açma ve kullanıcı sayfaları için Disallow kuralları ekleyin.",
          impact: "medium",
          difficulty: "kolay",
          example: "User-agent: *\nDisallow: /admin/\nDisallow: /login/\nDisallow: /wp-admin/\nDisallow: /wp-login.php",
          explanation: "Kullanıcı panelinizi, admin sayfalarını ve oturum açma sayfalarını robots.txt ile korumak, arama motorlarının bu sayfaları indekslemesini önler ve güvenlik açısından önemlidir. Bu tür sayfalar genellikle arama sonuçlarında değerli değildir ve kullanıcı özel bilgilerini içerebilir.",
          reference: "https://developers.google.com/search/docs/crawling-indexing/robots/intro",
          category: "Güvenlik ve SEO"
        });
      }
      
      // robots.txt başarılı bir şekilde analiz edildi
      if (userAgentRules.length > 0) {
        successes.push({ 
          field: "robots.txt-analysis", 
          message: `robots.txt ${userAgentRules.length} farklı user-agent kuralı içeriyor.`, 
          impact: "medium positive" 
        });
      }
      
      // Robots.txt'de bulunan Sitemap URL'lerini de analiz edilecek listeye ekle
      sitemapsInRobots.forEach(url => {
        if (!commonSitemapURLs.includes(url)) {
          commonSitemapURLs.push(url);
        }
      });
      
    } else if (robotsRes.status === 404) {
      // robots.txt bulunamadı
      issues.push({
        type: "info",
        field: "robots.txt",
        message: "robots.txt dosyası bulunamadı.",
        suggestion: "Site kökünde bir robots.txt dosyası oluşturun.",
        impact: "low",
        difficulty: "kolay",
        example: `User-agent: *
Allow: /
Sitemap: https://${domain}/sitemap.xml`,
        explanation: "robots.txt dosyası, arama motoru botlarının sitenizin hangi bölümlerine erişebileceğini kontrol etmenize olanak tanır. Bu dosya olmadan da siteniz indekslenebilir, ancak admin paneli, özel sayfalar ve duplike içerikler gibi alanları koruyamayabilirsiniz. Varsayılan olarak, botlar sitenizin tamamını tarar, ancak bu her zaman istediğiniz davranış olmayabilir.",
        reference: "https://developers.google.com/search/docs/crawling-indexing/robots/intro",
        category: "SEO"
      });
    } else {
      // diğer HTTP hataları
      issues.push({
        type: "warning",
        field: "robots.txt",
        message: `robots.txt dosyasına erişim hatalı: HTTP ${robotsRes.status}`,
        suggestion: "Sunucu yapılandırmanızı kontrol edin ve geçerli bir robots.txt dosyası ekleyin.",
        impact: "medium",
        difficulty: "orta",
        example: `User-agent: *
Allow: /
Sitemap: https://${domain}/sitemap.xml`,
        explanation: `robots.txt dosyanız HTTP ${robotsRes.status} hatası döndürüyor. Bu, arama motorlarının robots.txt talimatlarınıza erişmesini engeller. robots.txt dosyanızın düzgün bir şekilde yapılandırıldığından ve sunucunuzun doğru şekilde yanıt verdiğinden emin olun.`,
        reference: "https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt",
        category: "SEO"
      });
    }
  } catch (error) {
    // Bağlantı hatası
    issues.push({
      type: "info",
      field: "robots.txt",
      message: `robots.txt dosyasına erişilemedi: ${(error as Error).message}`,
      suggestion: "robots.txt dosyanızın olduğundan ve erişilebilir olduğundan emin olun.",
      impact: "low",
      difficulty: "kolay",
      example: `User-agent: *
Allow: /
Sitemap: https://${domain}/sitemap.xml`,
      explanation: "robots.txt dosyanıza erişmeye çalışırken bir hata oluştu. Bu, sunucu sorunları, zaman aşımı veya başka bir teknik problemden kaynaklanabilir. robots.txt dosyanızın sunucunuzda doğru konumda bulunduğundan ve genel olarak erişilebilir olduğundan emin olun.",
      reference: "https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt",
      category: "SEO"
    });
  }
  
  // ----------------
  // SITEMAP ANALİZİ
  // ----------------
  let sitemapFound = false;
  let validSitemapURLs: string[] = [];
  let sitemapURLCount = 0;
  let isIndexSitemap = false;
  let sitemapFormatValid = false;
  let sitemapLocations: {url: string, status: number, format: string, urlCount: number}[] = [];
  
  // Her bir olası sitemap URL'sini kontrol et
  for (const sitemapUrl of commonSitemapURLs) {
    try {
      const sitemapRes = await axios.get(sitemapUrl, { 
        timeout: 5000,
        validateStatus: status => status < 500, // 4xx hatalarını kabul et
        headers: {
          'User-Agent': 'Mozilla/5.0 SEO Analyzer Bot (compatible; SEOAnalyzer/1.0; +https://example.com/bot)'
        }
      });
      
      if (sitemapRes.status === 200) {
        sitemapFound = true;
        let format = 'unknown';
        let urlCount = 0;
        
        // Sitemap içeriğini analiz et
        const content = sitemapRes.data;
        if (typeof content === 'string') {
          // XML sitemap mı?
          if (content.includes('<urlset') || content.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/')) {
            format = 'XML';
            sitemapFormatValid = true;
            
            // URL sayısını yüzeysel olarak hesapla
            urlCount = (content.match(/<url>/g) || []).length;
            sitemapURLCount += urlCount;
          } 
          // Sitemap indeksi mi?
          else if (content.includes('<sitemapindex') || content.includes('<sitemap>')) {
            format = 'Sitemap Index';
            isIndexSitemap = true;
            sitemapFormatValid = true;
            
            // Alt sitemap sayısını hesapla
            urlCount = (content.match(/<sitemap>/g) || []).length;
          }
          // Metin formatı mı?
          else if (content.trim().split('\n').every(line => {
            const trimmedLine = line.trim();
            return trimmedLine === '' || /^https?:\/\//.test(trimmedLine);
          })) {
            format = 'Text';
            sitemapFormatValid = true;
            
            // Metin formatında URL sayısını hesapla
            urlCount = content.trim().split('\n').filter(line => /^https?:\/\//.test(line.trim())).length;
            sitemapURLCount += urlCount;
          }
          // RSS/Atom formatı mı?
          else if (content.includes('<rss') || content.includes('<feed')) {
            format = 'RSS/Atom';
            sitemapFormatValid = true;
            
            // RSS/Atom içindeki giriş sayısını hesapla
            urlCount = (content.match(/<item>|<entry>/g) || []).length;
            sitemapURLCount += urlCount;
          }
        }
        
        // Bulunan sitemap bilgilerini kaydet
        sitemapLocations.push({
          url: sitemapUrl,
          status: sitemapRes.status,
          format,
          urlCount
        });
        
        // Geçerli bir sitemap URL'si olarak ekle
        validSitemapURLs.push(sitemapUrl);
      }
    } catch (error) {
      // Bu URL için hata oluştu, bir sonraki URL'ye geç
      continue;
    }
  }
  
  // Sitemap analiz sonuçlarını değerlendi
  if (sitemapFound) {
    // Başarılı sitemap bulundu
    successes.push({ 
      field: "sitemap", 
      message: `${validSitemapURLs.length} geçerli sitemap bulundu.`, 
      impact: "indexing" 
    });
    
    // Sitemap formatı
    if (sitemapFormatValid) {
      successes.push({ 
        field: "sitemap-format", 
        message: "Sitemap geçerli bir formatta.", 
        impact: "low positive" 
      });
    }
    
    // Sitemap içerik bilgileri
    if (sitemapURLCount > 0 || isIndexSitemap) {
      let message = isIndexSitemap 
        ? "Sitemap indeksi bulundu, birden fazla alt sitemap içeriyor." 
        : `Sitemap toplam ${sitemapURLCount} URL içeriyor.`;
        
      successes.push({ 
        field: "sitemap-content", 
        message, 
        impact: "medium positive" 
      });
    }
    
    // Her bir sitemap konumu için detaylı bilgiler
    sitemapLocations.forEach(location => {
      successes.push({ 
        field: "sitemap-details", 
        message: `${location.url}: ${location.format} formatında, ${location.urlCount} URL içeriyor.`, 
        impact: "info" 
      });
    });
    
    // Sitemap çok büyükse uyar
    if (sitemapURLCount > 50000 && !isIndexSitemap) {
      issues.push({
        type: "warning",
        field: "sitemap-size",
        message: "Sitemap çok fazla URL içeriyor.",
        suggestion: "Sitemap'i daha küçük dosyalara bölerek bir sitemap indeksi oluşturun.",
        impact: "medium",
        difficulty: "orta",
        example: `sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap>\n    <loc>https://${domain}/sitemap-pages.xml</loc>\n  </sitemap>\n  <sitemap>\n    <loc>https://${domain}/sitemap-posts.xml</loc>\n  </sitemap>\n</sitemapindex>`,
        explanation: "Google, tek bir sitemap dosyasında en fazla 50.000 URL ve 50MB boyut sınırı uygular. Siteniz daha büyükse, içeriği daha küçük sitemap dosyalarına bölmeniz ve bunları bir sitemap indeksinde bir araya getirmeniz önerilir. Bu, arama motorlarının sitenizi daha verimli bir şekilde taramasına yardımcı olur.",
        reference: "https://developers.google.com/search/docs/advanced/sitemaps/build-sitemap",
        category: "SEO"
      });
    }
    
    // Sitemap robots.txt'de belirtilmemiş mi?
    if (robotsFound && sitemapsInRobots.length === 0 && validSitemapURLs.length > 0) {
      issues.push({
        type: "info",
        field: "sitemap-reference",
        message: "Sitemap mevcut ancak robots.txt'de belirtilmemiş.",
        suggestion: "Sitemap URL'nizi robots.txt dosyanıza ekleyin.",
        impact: "low",
        difficulty: "kolay",
        example: `Sitemap: ${validSitemapURLs[0]}`,
        explanation: "Sitenizde sitemap mevcut, ancak robots.txt dosyanızda belirtilmemiş. Sitemap URL'nizi robots.txt dosyanıza eklemek, arama motorlarının sitemap'inizi daha kolay bulmasını sağlar ve indeksleme sürecini iyileştirebilir. Bu zorunlu değildir, ancak SEO için iyi bir uygulamadır.",
        reference: "https://developers.google.com/search/docs/advanced/sitemaps/build-sitemap",
        category: "SEO"
      });
    }
    
  } else {
    // Sitemap bulunamadı
    issues.push({
      type: "info",
      field: "sitemap",
      message: "Sitemap.xml bulunamadı.",
      suggestion: "Site kökünde bir sitemap.xml dosyası oluşturun ve robots.txt'de referans verin.",
      impact: "medium",
      difficulty: "orta",
      example: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${domain}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
      explanation: "Sitemap, arama motorlarının sitenizin yapısını anlamasına ve içeriğinizi verimli bir şekilde taramasına yardımcı olur. Özellikle büyük veya karmaşık siteler için, tüm önemli sayfalarınızın taranmasını ve indekslenmesini sağlamak için bir sitemap gereklidir. Sitemap.xml dosyanızı oluşturduktan sonra, Google Search Console'a da göndermek indeksleme sürecini hızlandırabilir.",
      reference: "https://developers.google.com/search/docs/advanced/sitemaps/build-sitemap",
      category: "SEO"
    });
    
    // HTML sitemap'i kontrol et
    try {
      const htmlSitemapRes = await axios.get(`${origin}/sitemap.html`, { 
        timeout: 3000,
        validateStatus: status => status < 500
      });
      
      if (htmlSitemapRes.status === 200) {
        // HTML sitemap bulundu
        successes.push({ 
          field: "html-sitemap", 
          message: "HTML sitemap sayfası bulundu.", 
          impact: "low positive" 
        });
      } else {
        // HTML sitemap için öneri
        issues.push({
          type: "info",
          field: "html-sitemap",
          message: "HTML sitemap sayfası bulunamadı.",
          suggestion: "Kullanıcılar için bir HTML sitemap sayfası oluşturmayı düşünün.",
          impact: "low",
          difficulty: "orta",
          example: `<h1>Site Haritası</h1>
<ul>
  <li><a href="/">Ana Sayfa</a></li>
  <li><a href="/hakkimizda">Hakkımızda</a></li>
  <li><a href="/hizmetler">Hizmetlerimiz</a>
    <ul>
      <li><a href="/hizmetler/hizmet1">Hizmet 1</a></li>
      <li><a href="/hizmetler/hizmet2">Hizmet 2</a></li>
    </ul>
  </li>
  <li><a href="/iletisim">İletişim</a></li>
</ul>`,
          explanation: "XML sitemap arama motorları için, HTML sitemap ise kullanıcılar içindir. HTML sitemap, kullanıcıların sitenizde gezinmesine yardımcı olur ve site içi bağlantı yapısını güçlendirir. Bu, hem kullanıcı deneyimini hem de SEO'yu iyileştirebilir, özellikle büyük ve karmaşık içeriğe sahip siteler için faydalıdır.",
          reference: "https://developers.google.com/search/docs/advanced/sitemaps/overview",
          category: "Kullanıcı Deneyimi ve SEO"
        });
      }
    } catch {
      // HTML sitemap yok, öneri ekle
      issues.push({
        type: "info",
        field: "html-sitemap",
        message: "HTML sitemap sayfası bulunamadı.",
        suggestion: "Kullanıcılar için bir HTML sitemap sayfası oluşturmayı düşünün.",
        impact: "low",
        difficulty: "orta",
        example: `<h1>Site Haritası</h1>
<ul>
  <li><a href="/">Ana Sayfa</a></li>
  <li><a href="/hakkimizda">Hakkımızda</a></li>
  <li><a href="/hizmetler">Hizmetlerimiz</a>
    <ul>
      <li><a href="/hizmetler/hizmet1">Hizmet 1</a></li>
      <li><a href="/hizmetler/hizmet2">Hizmet 2</a></li>
    </ul>
  </li>
  <li><a href="/iletisim">İletişim</a></li>
</ul>`,
        explanation: "XML sitemap arama motorları için, HTML sitemap ise kullanıcılar içindir. HTML sitemap, kullanıcıların sitenizde gezinmesine yardımcı olur ve site içi bağlantı yapısını güçlendirir. Bu, hem kullanıcı deneyimini hem de SEO'yu iyileştirebilir, özellikle büyük ve karmaşık içeriğe sahip siteler için faydalıdır.",
        reference: "https://developers.google.com/search/docs/advanced/sitemaps/overview",
        category: "Kullanıcı Deneyimi ve SEO"
      });
    }
  }
  
  // ----------------
  // GENEL DEĞERLENDİRME
  // ----------------
  // robots.txt ve sitemap beraber değerlendirme
  if (robotsFound && sitemapFound) {
    successes.push({ 
      field: "crawlability", 
      message: "robots.txt ve sitemap dosyaları düzgün yapılandırılmış.", 
      impact: "high positive" 
    });
  }
  
  return { issues, successes };
}

// --- Gelişmiş Form Güvenliği ve Kullanılabilirlik Analizi ---
function analyzeFormSecurity($: CheerioAPI, url: string): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  const formCount = $("form").length;
  
  // Form yoksa erken dön
  if (formCount === 0) {
    successes.push({ 
      field: "form", 
      message: "Sayfada form bulunamadı (form güvenlik riski yok).", 
      impact: "security" 
    });
    return { issues, successes };
  }
  
  // Sayfadaki tüm formları analiz et
  $("form").each((formIndex, formElement) => {
    const $form = $(formElement);
    const formId = $form.attr("id") || "";
    const formClass = $form.attr("class") || "";
    const formName = $form.attr("name") || "";
    const formMethod = ($form.attr("method") || "get").toLowerCase();
    const formAction = $form.attr("action") || url;
    const formEnctype = $form.attr("enctype");
    
    // Form tanımlayıcısını oluştur (anlamlı bir tanımlama için)
    const formIdentifier = formId 
      ? `#${formId}` 
      : formName 
        ? `[name="${formName}"]` 
        : formClass 
          ? `.${formClass.split(' ')[0]}`
          : `Form #${formIndex + 1}`;
    
    // Form içi elementleri analiz et
    const inputs = $form.find("input, select, textarea, button");
    const hasSubmitButton = $form.find('input[type="submit"], button[type="submit"], button:not([type])').length > 0;
    const passwordFields = $form.find('input[type="password"]');
    const fileFields = $form.find('input[type="file"]');
    const visibleInputs = $form.find('input:not([type="hidden"]), select, textarea');
    
    // --------- CSRF KORUMA ANALİZİ ---------
    
    // Modern CSRF koruma belirteçlerini kontrol et
    const csrfTokens = [
      'csrf', '_csrf', 'csrftoken', 'xsrf', '_token', 'token',
      'csrf_token', 'authenticity_token', '__RequestVerificationToken',
      'anti-forgery-token', 'CSRFName', 'CSRFValue', 'csrf-token'
    ];
    
    // CSRF token kontrolü (girdi alanları, meta tag ve header olarak)
    const hasCsrfInput = csrfTokens.some(token => 
      $form.find(`input[name*="${token}" i]`).length > 0);
    
    const hasCsrfMeta = csrfTokens.some(token => 
      $(`meta[name*="${token}" i]`).length > 0);
      
    // CSRF belirteci olup olmadığını kontrol et
    if (formMethod === 'post' && !hasCsrfInput && !hasCsrfMeta) {
      issues.push({ 
        type: "warning", 
        field: "form-csrf", 
        message: `${formIdentifier}: CSRF koruması bulunamadı.`, 
        suggestion: "POST formlarına CSRF token ekleyin.", 
        impact: "security", 
        difficulty: "orta", 
        example: `<form method="post">
  <input type="hidden" name="csrf_token" value="random_generated_token">
  <!-- diğer form alanları -->
</form>`, 
        explanation: "Cross-Site Request Forgery (CSRF) saldırıları, kullanıcıların bilgisi olmadan kötü niyetli web siteleri tarafından isteklerin sahte bir şekilde gönderilmesine izin verir. CSRF token'ları, isteğin meşru bir kullanıcıdan geldiğini doğrulayarak bu tür saldırıları önler. Özellikle kullanıcı bilgilerini değiştiren veya işlem yapan her POST formu için CSRF koruması kullanmalısınız.", 
        reference: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", 
        category: "Güvenlik" 
      });
    } else if (formMethod === 'post' && (hasCsrfInput || hasCsrfMeta)) {
      successes.push({ 
        field: "form-csrf", 
        message: `${formIdentifier}: CSRF koruması mevcut.`, 
        impact: "security" 
      });
    }
    
    // --------- HTTPS KORUMA ANALİZİ ---------
    
    // Form action URL'sini analiz et
    let actionUrl = formAction;
    let isRelativeUrl = false;
    
    // Göreli URL'yi çözümle
    if (!actionUrl.startsWith('http://') && !actionUrl.startsWith('https://')) {
      isRelativeUrl = true;
      
      // Tam URL oluştur
      try {
        const baseUrl = new URL(url);
        actionUrl = new URL(actionUrl, baseUrl.origin).toString();
      } catch (e) {
        actionUrl = url; // URL oluşturulamazsa, sayfa URL'sini kullan
      }
    }
    
    // Form güvenli bir endpoint'e mi gönderiliyor?
    if (!actionUrl.startsWith('https://') && formMethod === 'post') {
      issues.push({ 
        type: "warning", 
        field: "form-https", 
        message: `${formIdentifier}: Form güvensiz bir endpoint'e gönderiliyor (HTTPS kullanılmıyor).`, 
        suggestion: isRelativeUrl 
          ? "Sitenin tamamını HTTPS'e taşıyın ve tüm bağlantıları güvenli hale getirin." 
          : "Form action'ı HTTPS ile başlayacak şekilde düzenleyin.", 
        impact: "high", 
        difficulty: "orta", 
        example: isRelativeUrl 
          ? "Tüm site için HTTPS sertifikası kurun ve HTTP -> HTTPS yönlendirmesi yapın." 
          : `<form action="https://example.com/form-handler">`, 
        explanation: "Form verileri HTTP üzerinden gönderildiğinde, bu veriler ağ üzerinde düz metin olarak aktarılır ve araya girme (man-in-the-middle) saldırılarına karşı savunmasızdır. HTTPS, verileri şifreleyerek bu tür saldırılara karşı koruma sağlar. Özellikle kullanıcı adı, şifre, kişisel bilgiler veya ödeme bilgileri gibi hassas bilgiler içeren formlar için HTTPS kullanımı kritik önemdedir.", 
        reference: "https://developers.google.com/search/docs/advanced/security/https", 
        category: "Güvenlik" 
      });
    } else if (actionUrl.startsWith('https://') || (isRelativeUrl && url.startsWith('https://'))) {
      successes.push({ 
        field: "form-https", 
        message: `${formIdentifier}: Form güvenli bir endpoint'e gönderiliyor (HTTPS kullanılıyor).`, 
        impact: "security" 
      });
    }
    
    // --------- METHOD ANALİZİ ---------
    
    // GET ve POST metotlarının doğru kullanımını kontrol et
    if (!$form.attr("method")) {
      issues.push({ 
        type: "info", 
        field: "form-method", 
        message: `${formIdentifier}: Form method belirtilmemiş (varsayılan GET kullanılıyor).`, 
        suggestion: "Veri göndermek için POST, veri almak için GET metodu kullanın.", 
        impact: "low", 
        difficulty: "kolay", 
        example: `<form method="post">`, 
        explanation: "Method belirtilmediğinde, formlar varsayılan olarak GET metodu kullanır. GET istekleri URL'de parametreler olarak görünür ve veri boyutu sınırlıdır. Kullanıcı verisi gönderimi, veritabanında değişiklik yapan işlemler veya hassas veri içeren formlar için POST metodu tercih edilmelidir.", 
        reference: "https://developer.mozilla.org/en-US/docs/Learn/Forms/Sending_and_retrieving_form_data", 
        category: "Güvenlik ve Kullanılabilirlik" 
      });
    } else if (formMethod === 'get' && (passwordFields.length > 0 || fileFields.length > 0)) {
      issues.push({ 
        type: "warning", 
        field: "form-method", 
        message: `${formIdentifier}: Hassas bilgi içeren form GET metodu kullanıyor.`, 
        suggestion: "Şifre veya dosya içeren formlar için POST metodu kullanın.", 
        impact: "high", 
        difficulty: "kolay", 
        example: `<form method="post">`, 
        explanation: "GET metodu ile gönderilen veriler URL'de görünür, tarayıcı geçmişinde saklanır ve sunucu loglarına kaydedilir. Şifre alanları veya dosya yüklemeleri gibi hassas içerikler için bu kesinlikle uygun değildir. Bu tür formlar her zaman POST metodunu kullanmalıdır.", 
        reference: "https://developer.mozilla.org/en-US/docs/Learn/Forms/Sending_and_retrieving_form_data", 
        category: "Güvenlik" 
      });
    } else if (formMethod === 'post' && visibleInputs.length > 0) {
      successes.push({ 
        field: "form-method", 
        message: `${formIdentifier}: Doğru metod kullanımı (POST).`, 
        impact: "security" 
      });
    }
    
    // --------- ENCTYPE ANALİZİ ---------
    
    // Dosya yüklemesi olan formlarda enctype kontrolü
    if (fileFields.length > 0) {
      if (formEnctype !== "multipart/form-data") {
        issues.push({ 
          type: "error", 
          field: "form-enctype", 
          message: `${formIdentifier}: Dosya yüklemesi var ancak enctype="multipart/form-data" eksik.`, 
          suggestion: 'Dosya yükleme formlarına enctype="multipart/form-data" ekleyin.', 
          impact: "high", 
          difficulty: "kolay", 
          example: `<form method="post" enctype="multipart/form-data">
  <input type="file" name="document">
  <button type="submit">Yükle</button>
</form>`, 
          explanation: "Dosya yükleme formları için enctype='multipart/form-data' özelliği gereklidir. Bu özellik olmadan, dosya adı sunucuya gönderilir ancak dosyanın kendisi gönderilmez. Bu, kullanıcıların dosya yükleyememesine ve web uygulamanızın düzgün çalışmamasına neden olur.", 
          reference: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#attr-enctype", 
          category: "Fonksiyonellik" 
        });
      } else {
        successes.push({ 
          field: "form-enctype", 
          message: `${formIdentifier}: Dosya yükleme formu için doğru enctype kullanılmış.`, 
          impact: "functionality" 
        });
      }
    }
    
    // --------- AUTOCOMPLETE ANALİZİ ---------
    
    // Şifre alanları için otomatik doldurma kontrolü
    passwordFields.each((_, pwField) => {
      const $pwField = $(pwField);
      const fieldId = $pwField.attr('id') || $pwField.attr('name') || 'password';
      
      if ($pwField.attr('autocomplete') === undefined) {
        // Modern güvenlik yaklaşımında şifre yöneticileri için autocomplete="new-password" veya "current-password" önerilir
        issues.push({ 
          type: "info", 
          field: "form-autocomplete", 
          message: `${formIdentifier}: Şifre alanında ('${fieldId}') autocomplete özniteliği belirtilmemiş.`, 
          suggestion: "Şifre alanlarına 'new-password' veya 'current-password' autocomplete değerleri ekleyin.", 
          impact: "low", 
          difficulty: "kolay", 
          example: `<input type="password" name="password" autocomplete="current-password">
<input type="password" name="new_password" autocomplete="new-password">`, 
          explanation: "Modern güvenlik yaklaşımında, şifre alanları için 'off' değeri yerine, kullanıcıların güvenli şifre yönetimi yapabilmeleri için 'new-password' veya 'current-password' değerleri önerilmektedir. Bu, güvenli şifre yöneticilerinin düzgün çalışmasına olanak tanır ve kullanıcıların güçlü, benzersiz şifreler kullanmasını kolaylaştırır.", 
          reference: "https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete", 
          category: "Güvenlik ve Kullanılabilirlik" 
        });
      } else if ($pwField.attr('autocomplete') === 'off') {
        // Bilgilendirme: Güncel tavsiyeler artık autocomplete="off" yerine daha spesifik değerler öneriyor
        issues.push({ 
          type: "info", 
          field: "form-autocomplete", 
          message: `${formIdentifier}: Şifre alanında ('${fieldId}') autocomplete="off" kullanılmış.`, 
          suggestion: "Modern şifre yöneticileri için 'new-password' veya 'current-password' değerlerini kullanın.", 
          impact: "low", 
          difficulty: "kolay", 
          example: `<input type="password" name="password" autocomplete="current-password">`, 
          explanation: "Şifre alanlarında autocomplete='off' kullanmak eski bir yaklaşımdır ve artık tavsiye edilmemektedir. Modern tarayıcılar ve şifre yöneticileri, kullanıcıların güvenli şifre yönetimi yapabilmeleri için 'new-password' veya 'current-password' gibi değerleri tercih eder. Bu, kullanıcıların güçlü ve benzersiz şifreler kullanmasını kolaylaştırarak genel güvenliği artırır.", 
          reference: "https://www.chromium.org/developers/design-documents/form-styles-that-chromium-understands", 
          category: "Güvenlik ve Kullanılabilirlik" 
        });
      } else if (['new-password', 'current-password'].includes($pwField.attr('autocomplete')!)) {
        successes.push({ 
          field: "form-autocomplete", 
          message: `${formIdentifier}: Şifre alanı ('${fieldId}') için doğru autocomplete değeri kullanılmış.`, 
          impact: "security" 
        });
      }
    });
    
    // Hassas alanlar için otomatik doldurma kontrolü
    const sensitiveFields = $form.find('input[name*="credit"], input[name*="card"], input[name*="cvv"], input[name*="ccv"], input[name*="cvc"]');
    
    sensitiveFields.each((_, field) => {
      const $field = $(field);
      const fieldName = $field.attr('name') || 'sensitive-field';
      
      if ($field.attr('autocomplete') !== 'off' && !$field.attr('autocomplete')) {
        issues.push({ 
          type: "info", 
          field: "form-sensitive-autocomplete", 
          message: `${formIdentifier}: Hassas alan ('${fieldName}') için autocomplete koruması yok.`, 
          suggestion: "Kredi kartı gibi hassas alanlarda autocomplete='off' kullanın.", 
          impact: "medium", 
          difficulty: "kolay", 
          example: `<input type="text" name="credit_card" autocomplete="off">`, 
          explanation: "Kredi kartı numarası, CVC ve diğer hassas finans bilgileri için autocomplete='off' kullanılması önerilir. Bu tip bilgilerin tarayıcı tarafından kaydedilmesi, paylaşılan bilgisayarlarda güvenlik riski oluşturabilir.", 
          reference: "https://developer.mozilla.org/en-US/docs/Web/Security/Securing_your_site/Turning_off_form_autocompletion", 
          category: "Güvenlik" 
        });
      } else if ($field.attr('autocomplete') === 'off') {
        successes.push({ 
          field: "form-sensitive-autocomplete", 
          message: `${formIdentifier}: Hassas alan ('${fieldName}') için autocomplete koruması mevcut.`, 
          impact: "security" 
        });
      }
    });
    
    // --------- INPUT VALİDASYON ANALİZİ ---------
    
    // Form alanları için validasyon kontrolü
    const emailFields = $form.find('input[type="email"]');
    const urlFields = $form.find('input[type="url"]');
    const requiredFields = $form.find('[required]');
    const patternFields = $form.find('input[pattern]');
    
    // Form doğrulama için required, pattern, type kullanımı kontrol et
    if (visibleInputs.length > 0 && requiredFields.length === 0 && patternFields.length === 0) {
      issues.push({ 
        type: "info", 
        field: "form-validation", 
        message: `${formIdentifier}: Görünür hiçbir form alanında doğrulama niteliği bulunmuyor.`, 
        suggestion: "Gerekli alanlara 'required', e-posta alanlarına 'type=\"email\"' gibi doğrulama nitelikleri ekleyin.", 
        impact: "low", 
        difficulty: "kolay", 
        example: `<input type="email" name="email" required>
<input type="text" name="phone" pattern="[0-9]{10}" title="10 haneli telefon numarası giriniz">`, 
        explanation: "HTML5 form doğrulama özellikleri (required, pattern, type vb.), kullanıcı girdilerinin doğruluğunu kontrol etmeye yardımcı olur ve güvenliği artırır. Bu özellikler hem kullanıcı deneyimini iyileştirir hem de form gönderiminden önce hataların tespit edilmesini sağlar. Not: Client-side doğrulama tek başına yeterli değildir, sunucu tarafında da doğrulama yapılması gerekir.", 
        reference: "https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation", 
        category: "Güvenlik ve Kullanılabilirlik" 
      });
    } else if (requiredFields.length > 0 || patternFields.length > 0) {
      successes.push({ 
        field: "form-validation", 
        message: `${formIdentifier}: Form doğrulama nitelikleri kullanılmış.`, 
        impact: "security" 
      });
    }
    
    // E-posta alanları için doğrulama
    emailFields.each((_, emailField) => {
      const $email = $(emailField);
      if (!$email.attr('pattern')) {
        successes.push({ 
          field: "form-email-validation", 
          message: `${formIdentifier}: E-posta alanı için doğru input type kullanılmış.`, 
          impact: "low positive" 
        });
      }
    });
    
    // --------- GÖNDER DÜĞME KONTROLÜ ---------
    
    // Form gönderme düğmesi kontrolü
    if (!hasSubmitButton) {
      issues.push({ 
        type: "warning", 
        field: "form-submit", 
        message: `${formIdentifier}: Form gönderme düğmesi (submit button) bulunamadı.`, 
        suggestion: "Forma submit düğmesi ekleyin veya JavaScript ile form gönderimi sağladığınızdan emin olun.", 
        impact: "functionality", 
        difficulty: "kolay", 
        example: `<button type="submit">Gönder</button> veya <input type="submit" value="Gönder">`, 
        explanation: "Bir formda submit düğmesi olmaması, kullanıcıların formu nasıl göndereceğini bilmemesine neden olabilir. Eğer JavaScript ile özel form gönderimi yapıyorsanız bile, erişilebilirlik ve JavaScript devre dışı bırakıldığında çalışabilirlik için bir submit düğmesi bulunması en iyi uygulamadır.", 
        reference: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form#technical_summary", 
        category: "Kullanılabilirlik ve Erişilebilirlik" 
      });
    }
    
    // --------- LABEL KONTROLÜ (Erişilebilirlik) ---------
    
    // Form etiketleri ve erişilebilirlik kontrolü
    const inputsWithoutLabels = visibleInputs.filter(function() {
      const $input = $(this);
      const id = $input.attr('id');
      
      // Eğer id yoksa, bu input için bir label eşleşemez
      if (!id) return true;
      
      // İlgili label'ı ara
      const hasLabel = $form.find(`label[for="${id}"]`).length > 0;
      
      // Input bir etiket içinde mi?
      const isInsideLabel = $input.parent('label').length > 0;
      
      // Görünür metin veya placeholder var mı?
      const hasPlaceholder = !!$input.attr('placeholder');
      const hasAriaLabel = !!$input.attr('aria-label');
      
      return !hasLabel && !isInsideLabel && !hasPlaceholder && !hasAriaLabel;
    });
    
    if (inputsWithoutLabels.length > 0) {
      issues.push({ 
        type: "info", 
        field: "form-accessibility", 
        message: `${formIdentifier}: ${inputsWithoutLabels.length} form alanı etiket (label) içermiyor.`, 
        suggestion: "Her form alanı için label kullanın veya aria-label niteliği ekleyin.", 
        impact: "accessibility", 
        difficulty: "kolay", 
        example: `<label for="email">E-posta</label>
<input type="email" id="email" name="email">

<!-- veya -->
<input type="email" name="email" aria-label="E-posta">`, 
        explanation: "Label (etiket) kullanımı, ekran okuyucu kullanan kullanıcılar için form alanlarının amacını anlamalarını sağlar. Ayrıca, etiketlere tıklandığında ilgili alanın seçilmesini sağlayarak kullanılabilirliği artırır. Her görünür form alanı için bir label kullanılması, erişilebilirlik için en iyi uygulamadır.", 
        reference: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label", 
        category: "Erişilebilirlik" 
      });
    } else if (visibleInputs.length > 0) {
      successes.push({ 
        field: "form-accessibility", 
        message: `${formIdentifier}: Tüm form alanları düzgün şekilde etiketlenmiş.`, 
        impact: "accessibility" 
      });
    }
    
    // --------- CAPTCHA / ANTI-BOT ÖNLEMLERİ ---------
    
    // Captcha veya Anti-bot önlemleri var mı?
    const hasCaptcha = $form.find('[class*="captcha" i], [id*="captcha" i], [name*="captcha" i], iframe[src*="recaptcha"], iframe[src*="hcaptcha"], div[class*="g-recaptcha"], script[src*="recaptcha"]').length > 0;
    const hasHoneypot = $form.find('input[name*="bot" i][style*="display:none"], input[name*="honey" i][style*="display:none"], input[style*="position:absolute;left:-9999px"]').length > 0;
    
    // Halka açık formlar ve etkileşimli formlar için captcha önerisi
    if (!hasCaptcha && !hasHoneypot && (
        $form.find('input[name*="comment" i], input[name*="message" i], textarea, input[name*="subscribe" i], input[name*="contact" i]').length > 0 ||
        formAction.includes('comment') || formAction.includes('contact') || formAction.includes('subscribe')
      )) {
      issues.push({ 
        type: "info", 
        field: "form-spam-protection", 
        message: `${formIdentifier}: Görünür bir spam koruması (CAPTCHA/honeypot) bulunamadı.`, 
        suggestion: "Halka açık formlara CAPTCHA veya honeypot koruması ekleyin.", 
        impact: "security", 
        difficulty: "orta", 
        example: `<!-- reCAPTCHA örneği -->
<div class="g-recaptcha" data-sitekey="your_site_key"></div>

<!-- veya honeypot örneği -->
<div class="hidden" style="display:none;">
  <label for="honeypot">Bu alanı boş bırakın</label>
  <input type="text" name="honeypot" id="honeypot">
</div>`, 
        explanation: "Halka açık formlar (iletişim formları, yorum formları vb.), otomatik spam gönderimlerine karşı savunmasızdır. CAPTCHA kullanımı veya honeypot alanlar eklenmesi, bot trafiğini engellemek ve spam gönderimlerini azaltmak için etkili yöntemlerdir. Honeypot yöntemi, insanlar tarafından görülmeyen ancak botların doldurduğu gizli alanlar kullanarak bot trafiğini tespit etmeyi amaçlar.", 
        reference: "https://developers.google.com/recaptcha/docs/v3", 
        category: "Güvenlik" 
      });
    } else if (hasCaptcha || hasHoneypot) {
      successes.push({ 
        field: "form-spam-protection", 
        message: `${formIdentifier}: Spam koruması tespit edildi (${hasCaptcha ? 'CAPTCHA' : 'honeypot'}).`, 
        impact: "security" 
      });
    }
    
    // --------- ŞİFRE GÜVENLİĞİ ANALİZİ ---------
    
    // Şifre alanlarını derinlemesine analiz et
    if (passwordFields.length > 0) {
      // Şifre gücü doğrulaması kontrol et
      const hasPasswordFeedback = $form.find('[id*="password-strength"], [class*="password-strength"], [id*="password-feedback"], [class*="password-meter"]').length > 0;
      const hasPasswordPattern = passwordFields.filter((_, el) => $(el).attr('pattern') !== undefined).length > 0;
      const hasMinLength = passwordFields.filter((_, el) => $(el).attr('minlength') !== undefined).length > 0;
      
      if (!hasPasswordFeedback && !hasPasswordPattern && !hasMinLength) {
        issues.push({ 
          type: "info", 
          field: "form-password-strength", 
          message: `${formIdentifier}: Şifre gücü doğrulaması veya gereksinimleri bulunamadı.`, 
          suggestion: "Şifre alanlarına minlength niteliği ekleyin ve güçlü şifre gereksinimleri belirtin.", 
          impact: "security", 
          difficulty: "orta", 
          example: `<input type="password" name="password" minlength="8" required>
<p class="password-requirements">Şifreniz en az 8 karakter içermeli ve harf, rakam ve özel karakter içermelidir.</p>`, 
          explanation: "Güçlü şifre politikaları, kullanıcı hesaplarının güvenliğini artırır. Şifreler için minimum uzunluk (genellikle en az 8 karakter) ve karmaşıklık gereksinimleri (büyük/küçük harfler, rakamlar, özel karakterler) belirlenmesi önerilir. Ayrıca, kullanıcılara şifre gereksinimlerini açıkça belirten metinler ve mümkünse şifre gücü göstergeleri sunmak iyi bir uygulamadır.", 
          reference: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#implement-proper-password-strength-controls", 
          category: "Güvenlik" 
        });
      } else {
        successes.push({ 
          field: "form-password-strength", 
          message: `${formIdentifier}: Şifre gücü doğrulaması veya gereksinimleri mevcut.`, 
          impact: "security" 
        });
      }
      
      // Şifre görünürlük kontrolü (kullanıcı deneyimi için)
      const hasPasswordToggle = $form.find('[id*="show-password"], [class*="show-password"], [id*="toggle-password"], [class*="toggle-password"], [aria-label*="show password"]').length > 0;
      
      if (!hasPasswordToggle) {
        issues.push({ 
          type: "info", 
          field: "form-password-visibility", 
          message: `${formIdentifier}: Şifre görünürlük kontrolü bulunamadı.`, 
          suggestion: "Şifre alanları için görünürlük açma/kapatma düğmesi ekleyin.", 
          impact: "user experience", 
          difficulty: "orta", 
          example: `<div class="password-field">
  <input type="password" id="password" name="password">
  <button type="button" class="toggle-password" aria-label="Şifreyi göster/gizle">👁️</button>
</div>
<script>
  document.querySelector('.toggle-password').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
  });
</script>`, 
          explanation: "Şifre görünürlük kontrolü, kullanıcıların şifre giriş hatalarını azaltmalarına ve daha güvenli şifreler oluşturmalarına yardımcı olur. Bu, özellikle mobil cihazlarda, kullanıcıların şifrelerini kontrol etmelerini kolaylaştırır ve kullanıcı deneyimini iyileştirir. Güvenlik açısından bu kontrol, sadece kullanıcının isteği üzerine şifreyi göstermeli ve varsayılan olarak gizli kalmalıdır.", 
          reference: "https://www.nngroup.com/articles/password-creation/", 
          category: "Kullanıcı Deneyimi" 
        });
      } else {
        successes.push({ 
          field: "form-password-visibility", 
          message: `${formIdentifier}: Şifre görünürlük kontrolü mevcut.`, 
          impact: "user experience" 
        });
      }
    }
    
    // --------- GDPR VE ÇEREZ POLİTİKASI ---------
    
    // Kişisel veri içeren formlarda GDPR uyumluluğu
    const isPersonalDataForm = $form.find('input[type="email"], input[name*="name" i], input[name*="surname" i], input[name*="phone" i], input[name*="address" i]').length > 0;
    
    if (isPersonalDataForm) {
      const hasPrivacyConsent = $form.find('input[type="checkbox"][name*="privacy" i], input[type="checkbox"][name*="consent" i], input[type="checkbox"][name*="gdpr" i], input[type="checkbox"][name*="terms" i]').length > 0;
      const hasPrivacyText = $form.text().toLowerCase().includes('privacy') || $form.text().toLowerCase().includes('gdpr') || $form.text().toLowerCase().includes('consent') || $form.text().toLowerCase().includes('kişisel veri') || $form.text().toLowerCase().includes('gizlilik');
      
      if (!hasPrivacyConsent && !hasPrivacyText) {
        issues.push({ 
          type: "info", 
          field: "form-privacy", 
          message: `${formIdentifier}: Kişisel veri işleyen formda gizlilik politikası onayı bulunamadı.`, 
          suggestion: "Kişisel veri toplayan formlara açık rıza ve gizlilik politikası onay kutusu ekleyin.", 
          impact: "legal", 
          difficulty: "kolay", 
          example: `<div class="form-group">
  <input type="checkbox" id="privacy-consent" name="privacy-consent" required>
  <label for="privacy-consent">Kişisel verilerimin <a href="/privacy-policy">Gizlilik Politikası</a>'na uygun olarak işlenmesine onay veriyorum.</label>
</div>`, 
          explanation: "Kişisel verilerin işlenmesi için birçok ülkede (özellikle GDPR kapsamındaki bölgelerde) açık rıza alınması zorunludur. İsim, e-posta, telefon gibi kişisel bilgileri toplayan formlar, kullanıcılardan verilerin nasıl kullanılacağına dair açık onay almalı ve gizlilik politikasına bağlantı içermelidir. Bu hem yasal bir zorunluluktur hem de kullanıcı güvenini artırır.", 
          reference: "https://gdpr.eu/gdpr-consent-requirements/", 
          category: "Yasal Uyumluluk" 
        });
      } else if (hasPrivacyConsent || hasPrivacyText) {
        successes.push({ 
          field: "form-privacy", 
          message: `${formIdentifier}: Kişisel veri işleyen formda gizlilik politikası bilgisi mevcut.`, 
          impact: "legal" 
        });
      }
    }
    
    // --------- FORM ERİŞİLEBİLİRLİK ANALİZİ ---------
    
    // Form erişilebilirlik özelliklerini kontrol et
    const hasAriaAttributes = $form.find('[aria-required], [aria-invalid], [aria-describedby]').length > 0;
    const hasErrorFields = $form.find('.error, .invalid, [aria-invalid="true"]').length > 0;
    
    if (!hasAriaAttributes && visibleInputs.length > 3) {
      issues.push({ 
        type: "info", 
        field: "form-a11y", 
        message: `${formIdentifier}: ARIA erişilebilirlik özellikleri eksik.`, 
        suggestion: "Ekran okuyucular için ARIA özellikleri ekleyin.", 
        impact: "accessibility", 
        difficulty: "orta", 
        example: `<label for="email">E-posta</label>
<input type="email" id="email" name="email" aria-required="true" aria-describedby="email-help">
<p id="email-help" class="help-text">Size ulaşabilmemiz için e-posta adresinizi girin</p>`, 
        explanation: "ARIA özellikleri, ekran okuyucu kullanan kullanıcılar için form alanlarının işlevini, durumunu ve ilişkilerini belirtir. aria-required, zorunlu alanları belirtir; aria-describedby, bir alanla ilişkili açıklama metnini bağlar; aria-invalid, doğrulama hatalarını belirtir. Bu özellikler, erişilebilir web formları oluşturmak için önemlidir ve engelli kullanıcılar için formların kullanılabilirliğini artırır.", 
        reference: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/forms/Basic_form_hints", 
        category: "Erişilebilirlik" 
      });
    } else if (hasAriaAttributes) {
      successes.push({ 
        field: "form-a11y", 
        message: `${formIdentifier}: ARIA erişilebilirlik özellikleri kullanılmış.`, 
        impact: "accessibility" 
      });
    }
    
    // --------- GELİŞMİŞ GÜVENLİK ÖZELLİKLERİ ---------
    
    // Content-Security-Policy kontrolü
    const hasCSP = $('meta[http-equiv="Content-Security-Policy"]').length > 0;
    
    if (!hasCSP && formMethod === 'post' && (passwordFields.length > 0 || sensitiveFields.length > 0)) {
      issues.push({ 
        type: "info", 
        field: "security-csp", 
        message: "Hassas veri işleyen sitede Content-Security-Policy bulunamadı.", 
        suggestion: "XSS saldırılarına karşı Content-Security-Policy ekleyin.", 
        impact: "security", 
        difficulty: "zor", 
        example: `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://trusted-cdn.com">

<!-- veya sunucu tarafında (önerilen): -->
<!-- HTTP başlığı: Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com -->`, 
        explanation: "Content Security Policy (CSP), Cross-Site Scripting (XSS) ve veri enjeksiyon saldırılarına karşı güçlü bir savunma katmanıdır. CSP, web sayfanızın hangi kaynaklardan içerik yükleyebileceğini belirleyerek, güvenilmeyen kaynaklardan gelen komut dosyalarının çalıştırılmasını engeller. Özellikle hassas veri işleyen formlar için CSP uygulamak, güvenliği önemli ölçüde artırır.", 
        reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP", 
        category: "Güvenlik" 
      });
    } else if (hasCSP) {
      successes.push({ 
        field: "security-csp", 
        message: "Content-Security-Policy tespit edildi.", 
        impact: "security" 
      });
    }
  });
  
  // --------- GENEL FORM DEĞERLENDİRMESİ ---------
  
  // Sayfadaki form sayısı için bilgilendirme ekle
  if (formCount > 0) {
    successes.push({ 
      field: "form-count", 
      message: `Sayfada toplam ${formCount} form tespit edildi.`, 
      impact: "info" 
    });
    
    // Form güvenlik özeti
    const securityIssueCount = issues.filter(issue => 
      issue.impact === "security" || issue.impact === "high" || issue.category === "Güvenlik").length;
      
    if (securityIssueCount === 0) {
      successes.push({ 
        field: "form-security-summary", 
        message: "Formlarda kritik güvenlik sorunu tespit edilmedi.", 
        impact: "high positive" 
      });
    } else {
      issues.push({ 
        type: "info", 
        field: "form-security-summary", 
        message: `Formlarda ${securityIssueCount} potansiyel güvenlik sorunu tespit edildi.`, 
        suggestion: "Yukarıda listelenen güvenlik tavsiyelerini inceleyip uygulayın.", 
        impact: "medium", 
        difficulty: "değişken", 
        example: "Belirtilen güvenlik sorunlarını giderin.", 
        explanation: "Form güvenliği, web uygulamalarındaki en kritik güvenlik alanlarından biridir. Formlar üzerinden veri girişi yapıldığından, CSRF, XSS, veri sızıntısı gibi birçok saldırı vektörü oluşabilir. Yukarıda belirtilen güvenlik sorunlarını çözmek, web sitenizin genel güvenliğini önemli ölçüde artıracaktır.", 
        reference: "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html", 
        category: "Güvenlik" 
      });
    }
  }
  
  return { issues, successes };
}

// --- Gelişmiş Render-Blocking Kaynaklar Analizi ---
function analyzeRenderBlocking($: CheerioAPI, url: string): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  
  // Analiz için hazırlık
  const baseUrl = new URL(url).origin;
  
  // --------- CSS KAYNAKLARI ANALİZİ ---------
  
  // 1. Harici CSS dosyaları
  const cssLinks = $('link[rel="stylesheet"]').toArray();
  const renderBlockingCss = cssLinks.filter(l => {
    const media = $(l).attr('media') || 'all';
    // print, speech gibi bloklamayan medya tiplerini veya sadece belirli ekran boyutlarını hedefleyen sorguları hariç tut
    return media === 'all' || media === 'screen' || !/print|speech|^(min|max)-/.test(media);
  });
  
  // Farklı kategorilerdeki CSS dosyalarının gruplara ayrılması
  const criticalCssLinks = cssLinks.filter(l => {
    const href = $(l).attr('href') || '';
    return href.includes('critical') || href.includes('above-fold') || href.includes('core');
  });
  
  const thirdPartyCssLinks = renderBlockingCss.filter(l => {
    const href = $(l).attr('href') || '';
    try {
      const resourceUrl = new URL(href, baseUrl);
      return resourceUrl.origin !== baseUrl;
    } catch (e) {
      return false;
    }
  });
  
  // 2. Inline CSS stil etiketleri
  const inlineStyles = $('style').toArray();
  const largeInlineStyles = inlineStyles.filter(s => $(s).html()?.length && $(s).html()!.length > 2000);
  
  // 3. Kritik olmayan CSS'lerin optimizasyon durumu
  const optimizedCssLinks = cssLinks.filter(l => {
    const rel = $(l).attr('rel');
    const onload = $(l).attr('onload');
    const mediaAttr = $(l).attr('media');
    
    return rel?.includes('preload') || 
           onload?.includes('this.rel') || 
           mediaAttr === 'print' ||
           $(l).attr('disabled') !== undefined;
  });
  
  // 4. Kaynak ipucu (resource hint) kullanımı
  const preloadLinks = $('link[rel="preload"]').toArray();
  const fontPreloads = preloadLinks.filter(l => $(l).attr('as') === 'font');
  const cssPreloads = preloadLinks.filter(l => $(l).attr('as') === 'style');
  
  // Prefetch ve preconnect kullanımı
  const hasPrefetch = $('link[rel="prefetch"]').length > 0;
  const hasPreconnect = $('link[rel="preconnect"]').length > 0;
  
  // --------- JAVASCRİPT KAYNAKLARI ANALİZİ ---------
  
  // 1. Harici JavaScript dosyaları
  const scriptTags = $('script[src]').toArray();
  const renderBlockingJs = scriptTags.filter(s => !$(s).attr('async') && !$(s).attr('defer') && !$(s).attr('type')?.includes('module'));
  const headScripts = $('head script[src]').toArray();
  const blockingHeadScripts = headScripts.filter(s => !$(s).attr('async') && !$(s).attr('defer') && !$(s).attr('type')?.includes('module'));
  
  // JS dosyalarının farklı kategorilere ayrılması
  const asyncScripts = scriptTags.filter(s => $(s).attr('async') !== undefined);
  const deferScripts = scriptTags.filter(s => $(s).attr('defer') !== undefined);
  const moduleScripts = scriptTags.filter(s => $(s).attr('type')?.includes('module'));
  const thirdPartyScripts = scriptTags.filter(s => {
    const src = $(s).attr('src') || '';
    try {
      const resourceUrl = new URL(src, baseUrl);
      return resourceUrl.origin !== baseUrl;
    } catch (e) {
      return false;
    }
  });
  
  // Yaygın büyük JS kütüphanelerini tespit et
  const largeLibraries = scriptTags.filter(s => {
    const src = $(s).attr('src') || '';
    return (
      src.includes('jquery') || 
      src.includes('bootstrap') || 
      src.includes('react') || 
      src.includes('angular') || 
      src.includes('vue') || 
      src.includes('lodash') ||
      src.includes('moment')
    );
  });
  
  // 2. Inline JavaScript kodları
  const inlineScripts = $('script:not([src])').toArray();
  const largeInlineScripts = inlineScripts.filter(s => $(s).html()?.length && $(s).html()!.length > 1000);
  const inlineHeadScripts = $('head script:not([src])').toArray().filter(s => $(s).html()?.length && $(s).html()!.length > 200);
  
  // 3. Özel JavaScript yükleme stratejileri
  const hasLazyLoad = inlineScripts.some(s => {
    const content = $(s).html() || '';
    return content.includes('lazy') || 
           content.includes('observer') || 
           content.includes('IntersectionObserver') || 
           content.includes('addEventListener("scroll"') || 
           content.includes('onload');
  });
  
  // --------- FONT KAYNAKLARI ANALİZİ ---------
  
  // 1. Font dosyaları
  const fontLinks = cssLinks.filter(l => {
    const href = $(l).attr('href') || '';
    return href.includes('font') || href.includes('icon');
  });
  
  const inlineFonts = inlineStyles.filter(s => {
    const content = $(s).html() || '';
    return content.includes('@font-face') || content.includes('font-family');
  });
  
  const googleFonts = cssLinks.filter(l => {
    const href = $(l).attr('href') || '';
    return href.includes('fonts.googleapis.com');
  });
  
  // 2. Font yükleme stratejileri
  const hasFontDisplay = inlineStyles.some(s => {
    const content = $(s).html() || '';
    return content.includes('font-display');
  });
  
  // --------- GENEL ANALİZ VE DEĞERLENDİRME ---------
  
  // Toplam ve kritik render-blocking kaynak sayıları
  const totalBlockingResources = renderBlockingCss.length + renderBlockingJs.length;
  const criticalBlockingResources = criticalCssLinks.length + blockingHeadScripts.length;
  const totalNonBlockingResources = optimizedCssLinks.length + asyncScripts.length + deferScripts.length + moduleScripts.length;
  
  // --------- ANALİZ SONUÇLARI VE ÖNERİLER ---------
  
  // Başarım: Hiç render-blocking kaynak yoksa
  if (totalBlockingResources === 0) {
    successes.push({ 
      field: 'render-blocking', 
      message: 'Render-blocking kaynak tespit edilmedi. Sayfa yükleme performansı mükemmel!', 
      impact: 'high positive' 
    });
  } else {
    // CSS Analiz Sonuçları
    if (renderBlockingCss.length > 0) {
      // Render-blocking CSS'ler için sorun raporla
      issues.push({ 
        type: 'info', 
        field: 'css-blocking', 
        message: `${renderBlockingCss.length} adet render-blocking CSS kaynağı tespit edildi.`, 
        suggestion: 'Kritik CSS stratejisi uygulayarak sadece ilk görünüm için gerekli stilleri inline olarak ekleyin ve kalan CSS dosyalarını asenkron yükleyin.', 
        impact: 'performance', 
        difficulty: 'orta', 
        example: `<!-- Kritik CSS inline olarak -->
<style>
  /* İlk görünüm için kritik stiller */
  .header, .hero, .main-nav { /* kritik stiller */ }
</style>

<!-- Kalan CSS'ler asenkron olarak -->
<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="styles.css"></noscript>`, 
        explanation: 'Render-blocking CSS dosyaları, tarayıcının sayfayı render edebilmesi için tamamen yüklenmesi ve işlenmesi gereken kaynaklardır. Bu, First Contentful Paint (FCP) ve Largest Contentful Paint (LCP) metriklerini olumsuz etkiler. Modern bir yaklaşım, ilk görünüm için gerekli kritik CSS\'i inline olarak eklemek ve kalan CSS\'leri asenkron yüklemektir. Bu strateji, kullanıcıların sayfanın içeriğini daha hızlı görmesini sağlar.', 
        reference: 'https://web.dev/extract-critical-css/', 
        category: 'Performans Optimizasyonu' 
      });
      
      // Kritik CSS yoksa
      if (criticalCssLinks.length === 0 && inlineStyles.length === 0) {
        issues.push({ 
          type: 'info', 
          field: 'critical-css', 
          message: 'Kritik CSS stratejisi uygulanmamış.', 
          suggestion: 'İlk görünüm için gerekli olan CSS\'i belirleyip inline olarak ekleyin.', 
          impact: 'performance', 
          difficulty: 'orta', 
          example: `<style>
  /* Sadece ilk görünüm için kritik stiller */
  header, .hero, nav, h1, .main-content { /* temel stiller */ }
</style>`, 
          explanation: 'Kritik CSS, sayfanın ilk görünümü için gerekli olan minimum CSS setidir. Bu stilleri inline olarak eklemek, harici CSS dosyalarının yüklenmesini beklemeden sayfanın hızlıca render edilmesini sağlar. Google PageSpeed ve Core Web Vitals ölçümlerinde önemli iyileştirmeler sağlayabilir.', 
          reference: 'https://web.dev/optimize-css/', 
          category: 'Performans Optimizasyonu' 
        });
      }
      
      // Büyük inline stil dosyaları varsa
      if (largeInlineStyles.length > 0) {
        issues.push({ 
          type: 'info', 
          field: 'large-inline-css', 
          message: `${largeInlineStyles.length} adet büyük inline CSS tespit edildi.`, 
          suggestion: 'Büyük inline stil bloklarını harici dosyalara taşıyın ve asenkron yükleyin.', 
          impact: 'performance', 
          difficulty: 'kolay', 
          example: `<!-- Büyük CSS'i harici dosyaya taşıyın -->
<link rel="preload" href="non-critical.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="non-critical.css"></noscript>`, 
          explanation: 'Büyük inline CSS blokları HTML belgesinin boyutunu artırır ve initial payload\'u şişirir. Sadece kritik CSS inline olmalı, büyük CSS blokları harici dosyalara taşınmalı ve asenkron olarak yüklenmelidir. Bu, ilk içerik gösterim süresini (FCP) iyileştirir.', 
          reference: 'https://web.dev/defer-non-critical-css/', 
          category: 'Performans Optimizasyonu' 
        });
      }
      
      // Üçüncü taraf CSS kaynakları varsa
      if (thirdPartyCssLinks.length > 0) {
        issues.push({ 
          type: 'info', 
          field: 'third-party-css', 
          message: `${thirdPartyCssLinks.length} adet üçüncü taraf CSS kaynağı tespit edildi.`, 
          suggestion: 'Üçüncü taraf CSS kaynaklarını yerel olarak barındırın veya dns-prefetch ve preconnect kullanarak bağlantı sürelerini optimize edin.', 
          impact: 'performance', 
          difficulty: 'orta', 
          example: `<!-- Üçüncü taraf domain için bağlantı optimizasyonu -->
<link rel="dns-prefetch" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>`, 
          explanation: 'Üçüncü taraf kaynaklara bağımlılık, DNS sorgulama ve bağlantı kurma süreleri nedeniyle performansı olumsuz etkiler. Bu kaynakları yerel olarak barındırmak veya mümkün değilse dns-prefetch ve preconnect kullanarak bağlantı sürelerini optimize etmek faydalıdır.', 
          reference: 'https://web.dev/preconnect-and-dns-prefetch/', 
          category: 'Performans Optimizasyonu' 
        });
      }
      
      // Google Fonts kullanımı
      if (googleFonts.length > 0) {
        issues.push({ 
          type: 'info', 
          field: 'google-fonts', 
          message: `${googleFonts.length} adet Google Fonts kaynağı tespit edildi.`, 
          suggestion: 'Google Fonts\'u optimize edin veya yerel olarak barındırın.', 
          impact: 'performance', 
          difficulty: 'orta', 
          example: `<!-- Google Fonts optimizasyonu -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap" rel="stylesheet">

<!-- veya daha iyisi: fontu yerel barındırın -->
<style>
  @font-face {
    font-family: 'Open Sans';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: local('Open Sans'), url('/fonts/open-sans.woff2') format('woff2');
  }
</style>`, 
          explanation: 'Google Fonts gibi harici font servisleri yükleme performansını etkileyebilir. Kritik fontları yerel olarak barındırmak, preconnect kullanmak ve font-display: swap eklemek gibi optimizasyonlar LCP ve CLS metriklerini iyileştirebilir.', 
          reference: 'https://web.dev/optimize-webfont-loading/', 
          category: 'Performans Optimizasyonu' 
        });
      }
      
      // Başarım: CSS kaynak ipuçları
      if (cssPreloads.length > 0 || hasPreconnect) {
        successes.push({ 
          field: 'css-resource-hints', 
          message: `CSS kaynakları için resource hints (${cssPreloads.length} preload, ${hasPreconnect ? 'preconnect' : 'preconnect yok'}) kullanılmış.`, 
          impact: 'performance' 
        });
      }
    } else {
      // CSS için başarım
      successes.push({ 
        field: 'css-blocking', 
        message: 'Render-blocking CSS kaynağı tespit edilmedi.', 
        impact: 'performance' 
      });
    }
    
    // JavaScript Analiz Sonuçları
    if (renderBlockingJs.length > 0) {
      // Render-blocking JavaScript'ler için sorun raporla
      issues.push({ 
        type: 'warning', 
        field: 'js-blocking', 
        message: `${renderBlockingJs.length} adet render-blocking JavaScript kaynağı tespit edildi.`, 
        suggestion: 'Kritik olmayan JavaScript\'leri async veya defer niteliği kullanarak asenkron yükleyin.', 
        impact: 'high', 
        difficulty: 'kolay', 
        example: `<!-- Kritik olmayan script -->
<script src="analytics.js" defer></script>

<!-- Kritik script (hızlı yüklenme gerekli) -->
<script src="critical.js" async></script>`, 
        explanation: 'Render-blocking JavaScript dosyaları, HTML parsing işlemini duraklatır ve sayfanın render edilmesini geciktirir. Bu, First Contentful Paint (FCP) ve Time to Interactive (TTI) metriklerini olumsuz etkiler. Kritik olmayan scriptler için \'defer\', kritik olanlar için \'async\' niteliği kullanılması önerilir. \'defer\' niteliği, HTML parsing işlemini durdurmaz ve DOM tamamen yüklendikten sonra çalıştırılır. \'async\' niteliği ise HTML parsing işlemini duraklatmadan dosya yüklenir yüklenmez scripti çalıştırır.', 
        reference: 'https://web.dev/efficiently-load-third-party-javascript/', 
        category: 'Performans Optimizasyonu' 
      });
      
      // Head'deki blokleyici scriptler
      if (blockingHeadScripts.length > 0) {
        issues.push({ 
          type: 'warning', 
          field: 'head-blocking-js', 
          message: `${blockingHeadScripts.length} adet head içinde blocking JavaScript tespit edildi.`, 
          suggestion: 'Head içindeki JavaScript dosyalarına mutlaka async veya defer ekleyin.', 
          impact: 'high', 
          difficulty: 'kolay', 
          example: `<head>
  <!-- Kötü: -->
  <script src="app.js"></script>
  
  <!-- İyi: -->
  <script src="app.js" defer></script>
</head>`, 
          explanation: 'Head bölümündeki blokleyici JavaScript dosyaları, sayfanın render edilmesini ciddi şekilde geciktirir. Head\'deki tüm scriptler, kritik olmadıkça defer veya async niteliği ile yüklenmelidir. Bu küçük değişiklik, sayfa yükleme performansında dramatik iyileştirmeler sağlayabilir.', 
          reference: 'https://web.dev/render-blocking-resources/', 
          category: 'Performans Optimizasyonu' 
        });
      }
      
      // Büyük JS kütüphaneleri
      if (largeLibraries.length > 0) {
        issues.push({ 
          type: 'info', 
          field: 'large-libraries', 
          message: `${largeLibraries.length} adet büyük JavaScript kütüphanesi tespit edildi.`, 
          suggestion: 'Büyük kütüphaneleri daha hafif alternatiflerle değiştirmeyi veya ihtiyacınız olan fonksiyonları seçici olarak import etmeyi düşünün.', 
          impact: 'medium', 
          difficulty: 'zor', 
          example: `<!-- Tüm jQuery yerine -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<!-- Daha iyi alternatifler -->
<script src="https://cdn.jsdelivr.net/npm/cash-dom@8.1.1/dist/cash.min.js"></script>
<!-- veya -->
<script>
  // Sadece ihtiyaç duyulan fonksiyonları import edin
  import { ajax } from 'jquery/ajax';
</script>`, 
          explanation: 'Büyük JavaScript kütüphaneleri (jQuery, Lodash, Moment.js gibi) sayfa boyutunu önemli ölçüde artırır ve parse/execution süresini uzatır. Modern web geliştirmede, bu kütüphanelerin sağladığı birçok fonksiyon artık native JavaScript API\'leri ile gerçekleştirilebilir. Eğer bu kütüphanelere ihtiyacınız varsa, sadece gerekli modülleri import etmeyi veya daha hafif alternatifleri (örn. jQuery yerine Cash, Moment.js yerine Day.js) düşünün.', 
          reference: 'https://web.dev/publish-modern-javascript/', 
          category: 'Performans Optimizasyonu' 
        });
      }
      
      // İnline head scriptleri
      if (inlineHeadScripts.length > 0) {
        issues.push({ 
          type: 'info', 
          field: 'inline-head-scripts', 
          message: `${inlineHeadScripts.length} adet head içinde büyük inline script tespit edildi.`, 
          suggestion: 'Head içindeki büyük inline scriptleri harici dosyalara taşıyın ve defer ile yükleyin.', 
          impact: 'medium', 
          difficulty: 'kolay', 
          example: `<!-- Bunun yerine -->
<head>
  <script>
    // Büyük bir JavaScript kodu...
  </script>
</head>

<!-- Bunu tercih edin -->
<head>
  <script src="app.js" defer></script>
</head>`, 
          explanation: 'Head içindeki büyük inline JavaScript kodları HTML belgesinin boyutunu artırır ve parsing süresini uzatır. Kritik olmayan kodlar harici dosyalara taşınmalı ve defer ile yüklenmelidir. Sadece sayfanın ilk render edilmesi için gereken kritik kodlar inline kalmalıdır.', 
          reference: 'https://web.dev/optimize-fid/', 
          category: 'Performans Optimizasyonu' 
        });
      }
      
      // Başarım: async/defer kullanımı
      if ((asyncScripts.length + deferScripts.length + moduleScripts.length) > 0) {
        successes.push({ 
          field: 'js-async-defer', 
          message: `${asyncScripts.length + deferScripts.length + moduleScripts.length} JavaScript kaynağı non-blocking olarak yükleniyor (${asyncScripts.length} async, ${deferScripts.length} defer, ${moduleScripts.length} module).`, 
          impact: 'performance' 
        });
      }
      
      // Başarım: JavaScript lazy loading
      if (hasLazyLoad) {
        successes.push({ 
          field: 'js-lazy-loading', 
          message: 'JavaScript içinde lazy loading stratejisi tespit edildi.', 
          impact: 'performance' 
        });
      }
    } else {
      // JavaScript için başarım
      successes.push({ 
        field: 'js-blocking', 
        message: 'Render-blocking JavaScript kaynağı tespit edilmedi.', 
        impact: 'performance' 
      });
    }
    
    // Font Analiz Sonuçları
    if (fontLinks.length > 0 || inlineFonts.length > 0) {
      // Font yükleme stratejisi
      if (!hasFontDisplay && (fontLinks.length > 0 || inlineFonts.length > 0)) {
        issues.push({ 
          type: 'info', 
          field: 'font-display', 
          message: 'Font kaynakları için font-display stratejisi tespit edilmedi.', 
          suggestion: 'Web fontları için font-display: swap kullanarak yazı görünürlüğünü optimize edin.', 
          impact: 'low', 
          difficulty: 'kolay', 
          example: `@font-face {
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 400;
  font-display: swap; /* Önemli: font yüklenirken sistem fontları gösterilir */
  src: local('Open Sans'), url('/fonts/open-sans.woff2') format('woff2');
}`, 
          explanation: 'font-display özelliği, web fontları yüklenirken tarayıcının nasıl davranacağını belirler. \'swap\' değeri, font yüklenene kadar sistem fontlarının gösterilmesini sağlayarak içeriğin hemen görünür olmasını sağlar. Bu, Cumulative Layout Shift (CLS) metriğini iyileştirir ve kullanıcının içeriği daha hızlı görmesini sağlar.', 
          reference: 'https://web.dev/optimize-webfont-loading/', 
          category: 'Performans Optimizasyonu' 
        });
      }
      
      // Font preload
      if (fontPreloads.length === 0 && (fontLinks.length > 0 || googleFonts.length > 0)) {
        issues.push({ 
          type: 'info', 
          field: 'font-preload', 
          message: 'Kritik fontlar için preload stratejisi tespit edilmedi.', 
          suggestion: 'Ana fontları preload ile önden yükleyin.', 
          impact: 'low', 
          difficulty: 'kolay', 
          example: `<link rel="preload" href="/fonts/open-sans.woff2" as="font" type="font/woff2" crossorigin>`, 
          explanation: 'Kritik fontlar için preload kullanmak, bu kaynakların CSS\'den bağımsız olarak hızlı bir şekilde yüklenmesini sağlar. Bu, özellikle Google Fonts gibi üçüncü taraf fontlar için faydalıdır ve font görünürlüğünü hızlandırır.', 
          reference: 'https://web.dev/preload-optional-fonts/', 
          category: 'Performans Optimizasyonu' 
        });
      }
    }
    
    // Kaynak ipuçları analizi
    if (!hasPreconnect && thirdPartyCssLinks.length + thirdPartyScripts.length > 0) {
      issues.push({ 
        type: 'info', 
        field: 'resource-hints', 
        message: 'Üçüncü taraf kaynaklar için preconnect kullanılmamış.', 
        suggestion: 'Üçüncü taraf domainler için preconnect veya dns-prefetch kullanın.', 
        impact: 'low', 
        difficulty: 'kolay', 
        example: `<link rel="preconnect" href="https://third-party-domain.com">
<link rel="dns-prefetch" href="https://another-domain.com">`, 
        explanation: 'preconnect ve dns-prefetch, üçüncü taraf kaynaklara olan bağlantıları önceden kurarak yükleme süresini kısaltır. preconnect, DNS çözümleme, TCP bağlantısı ve TLS anlaşması dahil olmak üzere tüm bağlantı adımlarını önceden gerçekleştirir. dns-prefetch ise sadece DNS çözümlemesini yapar ve daha az kaynağa sahip tarayıcılarda kullanılabilir.', 
        reference: 'https://web.dev/preconnect-and-dns-prefetch/', 
        category: 'Performans Optimizasyonu' 
      });
    }
    
    // Genel değerlendirme
    if (totalBlockingResources > 5) {
      issues.push({ 
        type: 'warning', 
        field: 'total-blocking-resources', 
        message: `Toplam ${totalBlockingResources} render-blocking kaynak tespit edildi.`, 
        suggestion: 'Render-blocking kaynakları azaltmak için yukarıda belirtilen optimizasyon tekniklerini uygulayın.', 
        impact: 'high', 
        difficulty: 'orta', 
        example: 'Her bir render-blocking kaynak için önerilen optimizasyon tekniklerini uygulayın.', 
        explanation: 'Render-blocking kaynakların sayısı, sayfanın yüklenmesini önemli ölçüde etkiler. Google\'ın Core Web Vitals metriklerinden Largest Contentful Paint (LCP) ve First Contentful Paint (FCP) üzerinde doğrudan etkisi vardır. Sayfanın ilk render edilme süresi her render-blocking kaynak ile artarken, kullanıcı deneyimi olumsuz etkilenir.', 
        reference: 'https://web.dev/render-blocking-resources/', 
        category: 'Performans Optimizasyonu' 
      });
    } else if (totalNonBlockingResources > 0) {
      // Başarım: Optimize edilmiş kaynaklar
      successes.push({ 
        field: 'optimized-resources', 
        message: `${totalNonBlockingResources} kaynak asenkron/non-blocking şekilde yükleniyor.`, 
        impact: 'performance' 
      });
    }
  }
  
  // Kaynakların genel dağılımını göster
  successes.push({ 
    field: 'resource-summary', 
    message: `Toplam kaynaklar: ${cssLinks.length} CSS, ${scriptTags.length} JavaScript, ${inlineStyles.length} inline stil, ${inlineScripts.length} inline script.`, 
    impact: 'info' 
  });
  
  return { issues, successes };
}

// --- Gelişmiş Duplicate Content Analizi ---
function analyzeDuplicateContent($: CheerioAPI, url: string): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];

  // --------- İÇERİK ÇIKARMA VE NORMALİZASYON ---------
  
  // 1. Ana içerik bölümlerini belirleme ve ayıklama
  const mainContent = extractMainContent($);
  const title = $('title').text().trim();
  const h1 = $('h1').first().text().trim();
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  
  // 2. İçerik normalleştirme - daha hassas duplikasyon analizi için
  const normalizedBody = getNormalizedContent($('body'));
  const normalizedMain = getNormalizedContent(mainContent);
  
  // 3. Sayfa içeriğine ait çeşitli hash'ler oluştur
  const bodyHash = crypto.createHash('md5').update(normalizedBody).digest('hex');
  const mainContentHash = crypto.createHash('md5').update(normalizedMain).digest('hex');
  const titleHash = crypto.createHash('md5').update(title).digest('hex');
  
  // 4. İçerik özeti için metrikler hesapla
  const wordCount = countWords(normalizedBody);
  const mainContentWordCount = countWords(normalizedMain);
  const paragraphCount = $('p').length;
  const sentenceCount = countSentences(normalizedBody);
  
  // Not: Gerçek bir uygulamada bu hash'ler veritabanı ile karşılaştırılır
  // Bu örnek fonksiyonda sadece içerik analizi yapılacak
  
  // --------- CANONICAL TAG ANALİZİ ---------
  
  const canonicalUrl = $('link[rel="canonical"]').attr('href');
  const isCanonicalSelf = canonicalUrl === url || canonicalUrl === '/' || !canonicalUrl;
  
  if (!canonicalUrl) {
    issues.push({
      type: "warning",
      field: "canonical",
      message: "Canonical URL belirtilmemiş.",
      suggestion: "Sayfaya canonical URL ekleyin.",
      impact: "medium",
      difficulty: "kolay",
      example: `<link rel="canonical" href="${url}">`,
      explanation: "Canonical tag, arama motorlarına hangi URL'nin tercih edilen/asıl URL olduğunu belirtir. Bu özellikle içerik duplikasyonu sorununu çözmek için önemlidir. Canonical tag olmadığında, arama motorları hangi sayfanın indekslenmesi gerektiğine karar vermekte zorlanabilir ve bu da SEO değerinin bölünmesine neden olabilir.",
      reference: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
      category: "SEO"
    });
  } else if (!isCanonicalSelf) {
    issues.push({
      type: "info",
      field: "canonical",
      message: `Bu sayfa kendisini canonical olarak işaretlemiyor, canonical URL: ${canonicalUrl}`,
      suggestion: "Bu sayfa duplicate içerik olarak işaretlenmiş, bu bilinçli yapıldıysa sorun yok.",
      impact: "medium",
      difficulty: "bilgi",
      example: "",
      explanation: "Bu sayfa kendisini canonical URL olarak göstermiyor, başka bir sayfaya canonical veriyor. Bu, mevcut sayfanın duplicate (tekrarlanan) içerik olarak değerlendirilmesine ve arama motorlarının canonical olarak belirtilen URL'yi tercih etmesine neden olur. Eğer bu bilinçli olarak yapıldıysa (örneğin, bu sayfa gerçekten bir içerik kopyasıysa), bir sorun yoktur.",
      reference: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
      category: "SEO"
    });
  } else {
    successes.push({
      field: "canonical",
      message: "Sayfa doğru canonical tag kullanıyor.",
      impact: "medium positive"
    });
  }
  
  // --------- SAYFA PARAMETRELERİ ANALİZİ ---------
  
  // URL parametrelerini kontrol et ve duplikasyon riski oluşturup oluşturmadıklarını değerlendir
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    if (params.toString().length > 0) {
      const paramCount = Array.from(params.keys()).length;
      const sortParams = params.has('sort') || params.has('order') || params.has('sırala');
      const filterParams = params.has('filter') || params.has('filtre') || params.has('kategori');
      const sessionParams = params.has('session') || params.has('sid') || params.has('oturum');
      const trackingParams = params.has('utm_source') || params.has('utm_medium') || params.has('utm_campaign');
      
      if (paramCount > 0) {
        issues.push({
          type: "info",
          field: "url-parameters",
          message: `URL'de ${paramCount} parametre bulunuyor, bu duplikasyon riski oluşturabilir.`,
          suggestion: "Gerekli olmayan parametreler için canonical tag kullanın veya robots.txt ile parametreleri yönetin.",
          impact: "medium",
          difficulty: "orta",
          example: `# robots.txt örneği
User-agent: *
Disallow: /*?sort=
Disallow: /*?order=

# veya Search Console URL Parametreleri aracını kullanın`,
          explanation: "URL parametreleri (özellikle sıralama, filtreleme gibi), aynı içeriğin farklı URL'lerde bulunmasına neden olabilir. Bu, içerik duplikasyonu sorununa yol açar. Önemli olmayan parametreler için 'noindex' direktifi veya canonical URL kullanmak ya da robots.txt dosyasında belirli parametreli URL'leri engellemek iyi bir uygulamadır.",
          reference: "https://developers.google.com/search/docs/crawling-indexing/url-parameters",
          category: "SEO"
        });
        
        if (trackingParams) {
          issues.push({
            type: "info",
            field: "tracking-parameters",
            message: "URL'de UTM takip parametreleri bulunuyor.",
            suggestion: "Takip parametrelerinin indekslenmediğinden emin olun.",
            impact: "low",
            difficulty: "orta",
            example: `# robots.txt ekleyin
User-agent: *
Disallow: /*?utm_

# veya canonical tag kullanın
<link rel="canonical" href="${urlObj.origin}${urlObj.pathname}">`,
            explanation: "UTM parametreleri gibi takip parametreleri, içerik duplikasyonu riski oluşturabilir. Bu parametreler genellikle içeriği değiştirmez, ancak farklı URL'ler oluşturur. Bu tür URL'lerin doğru canonical tag ile işaretlenmesi veya robots.txt ile engellenmesi önerilir.",
            reference: "https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters",
            category: "SEO"
          });
        }
      }
    }
  } catch (e) {
    // URL parse edilemedi, bu durumda hiçbir şey yapma
  }
  
  // --------- SAYFA İÇİ KONUDAN SAPMA ANALİZİ ---------
  
  // Sayfa başlığı ve ana içerik arasında tema tutarlılığını kontrol et
  if (title && h1 && !hasThematicRelation(title, h1)) {
    issues.push({
      type: "info",
      field: "content-theme",
      message: "Sayfa başlığı ve H1 başlığı arasında tematik ilişki zayıf görünüyor.",
      suggestion: "Başlık ve H1 etiketlerinin sayfanın ana konusunu tutarlı şekilde yansıttığından emin olun.",
      impact: "low",
      difficulty: "kolay",
      example: `<title>Ana konu hakkında açıklayıcı başlık</title>
<h1>Ana konu ile uyumlu başlık</h1>`,
      explanation: "Sayfanın <title> etiketi ve ana başlığı (H1) arasında tematik bir tutarlılık olması önemlidir. Bu tutarlılık, hem kullanıcı deneyimini iyileştirir hem de arama motorlarına sayfanın ana konusu hakkında net sinyaller verir. Başlıkların birbiriyle çelişmesi veya ilişkisiz olması, sayfanın odak eksikliği olduğu izlenimini verebilir.",
      reference: "https://developers.google.com/search/docs/appearance/title-link",
      category: "SEO ve İçerik"
    });
  }
  
  // --------- İÇERİK YOĞUNLUĞU ANALİZİ ---------
  
  // İnce içerik (thin content) kontrolü
  if (mainContentWordCount < 300 && !isSpecialPage($)) {
    issues.push({
      type: "warning",
      field: "thin-content",
      message: `Ana içerik sadece ${mainContentWordCount} kelime içeriyor. Bu, ince içerik (thin content) olarak değerlendirilebilir.`,
      suggestion: "Sayfaya daha fazla özgün ve değerli içerik ekleyin.",
      impact: "high",
      difficulty: "orta",
      example: "",
      explanation: "İnce içerik (thin content), sayfada çok az miktarda özgün ve değerli içerik bulunması durumudur. Google gibi arama motorları, kullanıcılara değer sağlayan, kapsamlı ve derinlemesine içerikleri tercih eder. 300 kelimeden az içerik genellikle yeterli derinlikte olmayabilir ve sayfanın daha düşük sıralanmasına neden olabilir. İçeriğinizi genişleterek, konuyla ilgili detaylar ekleyerek ve kullanıcı sorularını kapsamlı şekilde yanıtlayarak içeriğinizi zenginleştirin.",
      reference: "https://developers.google.com/search/docs/appearance/write-high-quality-content",
      category: "İçerik Kalitesi"
    });
  } else if (mainContentWordCount >= 300) {
    successes.push({
      field: "content-length",
      message: `İçerik uzunluğu yeterli (${mainContentWordCount} kelime).`,
      impact: "medium positive"
    });
  }
  
  // --------- SAYFA İÇİ TEKRAR EDEN İÇERİK ANALİZİ ---------
  
  // Sayfadaki paragrafları, pasajları ve bölümleri çıkarıp birbirleriyle karşılaştırarak içerik tekrarlarını tespit et
  const duplicateParagraphs = findDuplicateContent($, 'p');
  const duplicateBlocks = findDuplicateContent($, 'div > p, section > p, article > p');
  
  if (duplicateParagraphs.length > 0) {
    issues.push({
      type: "info",
      field: "internal-duplicate",
      message: `Sayfa içinde ${duplicateParagraphs.length} tekrar eden paragraf tespit edildi.`,
      suggestion: "Sayfa içindeki tekrarlanan içerikleri kaldırın veya yeniden yazın.",
      impact: "low",
      difficulty: "kolay",
      example: "",
      explanation: "Aynı sayfada içeriğin tekrarlanması, kullanıcı deneyimini olumsuz etkileyebilir ve sayfa kalitesini düşürebilir. Tekrarlanan paragraflar genellikle yazım hataları, kopyala-yapıştır işlemleri veya içerik yönetim sistemi sorunlarından kaynaklanır. Bu tekrarları kaldırmak veya her birini özgün hale getirmek, içerik kalitesini artıracaktır.",
      reference: "https://developers.google.com/search/docs/appearance/write-high-quality-content",
      category: "İçerik Kalitesi"
    });
  }
  
  // --------- BOILERPLATE İÇERİK ANALİZİ ---------
  
  // Tekrar eden yapılar, şablonlar ve standart metinleri tespit et
  const boilerplateRatio = calculateBoilerplateRatio($);
  
  if (boilerplateRatio > 0.7) {
    issues.push({
      type: "warning",
      field: "boilerplate-content",
      message: `Sayfanın yaklaşık %${Math.round(boilerplateRatio * 100)}'i şablon içerik (header, footer, menü, yan panel vb.).`,
      suggestion: "Ana içerik oranını artırın, şablon içeriği azaltın.",
      impact: "medium",
      difficulty: "orta",
      example: "",
      explanation: "Sayfadaki şablon içeriği (header, footer, sidebar, menü gibi), özgün içeriğe göre çok fazlaysa, bu durum 'içerik-gürültü oranı' (content-to-noise ratio) açısından sorun oluşturabilir. Arama motorları, sayfadaki asıl (özgün) içeriğe odaklanırken, şablon içeriğinin fazlalığı sayfanın değerini düşürebilir. Ana içerik/şablon oranını iyileştirin ve kullanıcılara sunulan özgün içeriğin oranını artırın.",
      reference: "https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics",
      category: "İçerik Kalitesi"
    });
  } else if (boilerplateRatio < 0.3) {
    successes.push({
      field: "content-ratio",
      message: `Sayfada yüksek ana içerik oranı var (şablon içerik: %${Math.round(boilerplateRatio * 100)}).`,
      impact: "medium positive"
    });
  }
  
  // --------- İÇERİK ÖZGÜNLÜK ANALİZİ ---------
  
  // İçerik özgünlük göstergeleri (bu bir tahmindir, gerçek bir AI içerik tespit aracı değildir)
  const uniquenessSignals = analyzeContentUniqueness($);
  
  if (uniquenessSignals.suspiciousPatterns > 1) {
    issues.push({
      type: "info",
      field: "content-originality",
      message: "İçerikte potansiyel kopyalama belirtileri tespit edildi.",
      suggestion: "İçeriğin tamamen özgün olduğundan emin olun.",
      impact: "medium",
      difficulty: "orta",
      example: "",
      explanation: "Sayfadaki içerik, kopyalanmış veya düşük özgünlükte içerik belirtileri gösteriyor. Bu belirtiler arasında tutarsız biçimlendirme, birbirine uymayan yazı stili veya belirli kalıplar olabilir. Özgün olmayan içerik, Google'ın spam ve düşük kalite değerlendirmelerine neden olabilir. Tüm içeriğin benzersiz, değerli ve özgün olduğundan emin olun.",
      reference: "https://developers.google.com/search/docs/essentials/spam-policies",
      category: "İçerik Kalitesi"
    });
  } else {
    successes.push({
      field: "content-originality",
      message: "İçeriğin özgünlük göstergeleri olumlu.",
      impact: "high positive"
    });
  }
  
  // --------- HREFLANG VE ALTERNATİF URL ANALİZİ ---------
  
  // Hreflang etiketleri ve alternatif URL'ler (dil/bölge bazlı içerik duplikasyonu için)
  const hreflangTags = $('link[rel="alternate"][hreflang]');
  
  if (hreflangTags.length > 0) {
    // Hreflang etiketlerinde kendi URL'sinin olup olmadığını kontrol et
    const hasCurrentLocale = Array.from(hreflangTags).some(tag => {
      const href = $(tag).attr('href');
      return href === url || href === canonicalUrl;
    });
    
    if (!hasCurrentLocale) {
      issues.push({
        type: "warning",
        field: "hreflang",
        message: "Hreflang etiketleri mevcut, ancak bu sayfanın kendi locale'i belirtilmemiş.",
        suggestion: "Mevcut sayfa için de hreflang etiketi ekleyin.",
        impact: "medium",
        difficulty: "kolay",
        example: `<link rel="alternate" hreflang="tr" href="${url}">`,
        explanation: "Hreflang etiketleri, içeriğinizin farklı dil ve bölgelere yönelik versiyonlarını belirtir. Ancak, mevcut sayfanın kendi dil kodunu (hreflang) belirtmemek bir eksikliktir. Her sayfa, hem kendisini hem de alternatif versiyonlarını hreflang etiketleriyle belirtmelidir. Bu, arama motorlarının doğru sayfayı doğru kullanıcılara göstermesine yardımcı olur.",
        reference: "https://developers.google.com/search/docs/specialty/international/localized-versions",
        category: "Uluslararası SEO"
      });
    } else {
      successes.push({
        field: "hreflang",
        message: "Hreflang etiketleri doğru şekilde uygulanmış.",
        impact: "medium positive"
      });
    }
  }
  
  // --------- PAGINATED İÇERİK ANALİZİ ---------
  
  // Sayfalandırılmış içerik kontrolü
  const hasPaginationRel = $('link[rel="prev"], link[rel="next"]').length > 0;
  const hasPaginationUI = $('a:contains("Sonraki"), a:contains("İleri"), a:contains("Next"), .pagination, nav.pages').length > 0;
  
  if (hasPaginationUI && !hasPaginationRel) {
    issues.push({
      type: "info",
      field: "pagination",
      message: "Sayfada sayfalandırma arayüzü var, ancak rel=\"prev\"/\"next\" bağlantıları eksik.",
      suggestion: "Sayfalandırılmış içeriğiniz için rel=\"prev\" ve rel=\"next\" bağlantılarını ekleyin.",
      impact: "low",
      difficulty: "kolay",
      example: `<!-- Sayfa 2 için örnek -->
<link rel="prev" href="https://example.com/sayfa-1">
<link rel="next" href="https://example.com/sayfa-3">`,
      explanation: "Sayfalandırılmış içerik için rel=\"prev\" ve rel=\"next\" bağlantıları kullanmak, arama motorlarına sayfalar arasındaki ilişkiyi gösterir. Google artık bu bağlantıları kanonikleştirme sinyali olarak kullanmasa da, bu bağlantılar hala tarama ve indeksleme için faydalıdır ve diğer arama motorları bunları dikkate alabilir.",
      reference: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
      category: "SEO"
    });
  } else if (hasPaginationRel) {
    successes.push({
      field: "pagination",
      message: "Sayfalandırma için rel=\"prev\"/\"next\" bağlantıları doğru kullanılmış.",
      impact: "low positive"
    });
  }
  
  // --------- ÖZET BİLGİLERİ ---------
  
  successes.push({
    field: 'content-hash',
    message: `Ana içerik hash: ${mainContentHash}`,
    impact: 'info'
  });
  
  successes.push({
    field: 'content-metrics',
    message: `İçerik metrikleri: ${wordCount} kelime, ${paragraphCount} paragraf, ${sentenceCount} cümle`,
    impact: 'info'
  });
  
  // --------- YARDIMCI FONKSİYONLAR ---------
  
  // Ana içeriği sayfadan çıkarmaya çalışır
  function extractMainContent($: CheerioAPI): Cheerio<AnyNode> {
    // Yaygın ana içerik selektörleri
    const contentSelectors = [
      'main', 
      'article', 
      '.content', 
      '.post', 
      '.post-content',
      '.entry-content', 
      '.article-content',
      '#content', 
      '.main-content'
    ];
    
    // Tüm olası içerik konteynerlarını bul
    let bestSelector = '';
    let maxWordCount = 0;
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length) {
        const text = element.text();
        const words = countWords(text);
        
        if (words > maxWordCount) {
          maxWordCount = words;
          bestSelector = selector;
        }
      }
    }
    
    // En iyi seçici bulunamazsa, body'yi kullan ama header/footer/sidebar gibi elemanları çıkar
    if (!bestSelector) {
      return $('body').clone()
        .find('header, footer, nav, aside, .sidebar, .menu, .comments, script, style, .banner, .ads, .advertisement')
        .remove()
        .end();
    }
    
    return $(bestSelector);
  }
  
  // İçeriği normalize et - duplikasyon kontrolü için daha temiz bir şekilde
  function getNormalizedContent(element: Cheerio<AnyNode>): string {
    let text = element.text() || '';
    
    // Fazla boşlukları temizle
    text = text.replace(/\s+/g, ' ');
    
    // Noktalama işaretlerini ve özel karakterleri çıkar
    text = text.replace(/[^\w\s]/g, '');
    
    // Küçük harfe çevir
    text = text.toLowerCase();
    
    // Gereksiz kelime ve karakterleri temizle
    text = text
      .replace(/\b(ve|veya|ile|ya da|fakat|ama|lakin|ancak|zira|çünkü)\b/g, ' ')
      .replace(/\b(the|and|or|but|with|for|in|on|at|to|by|a|an)\b/g, ' ')
      .trim();
    
    return text;
  }
  
  // Kelime sayısını hesapla
  function countWords(text: string): number {
    return text.split(/\s+/).filter(Boolean).length;
  }
  
  // Cümle sayısını tahmin et
  function countSentences(text: string): number {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  }
  
  // Verilen iki metin arasında tematik ilişki olup olmadığını kontrol et
  function hasThematicRelation(text1: string, text2: string): boolean {
    // Basit bir benzerlik hesaplaması, gerçek bir uygulamada daha gelişmiş NLP teknikleri kullanılabilir
    const normalized1 = text1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    const normalized2 = text2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    
    // Ortak kelime sayısını hesapla
    const commonWords = normalized1.filter(word => normalized2.includes(word));
    
    // Benzerlik skoru
    const similarityScore = commonWords.length / Math.max(normalized1.length, normalized2.length);
    
    return similarityScore > 0.2; // %20 veya daha fazla benzerlik varsa tematik ilişki var kabul et
  }
  
  // Bu sayfanın özel bir sayfa olup olmadığını kontrol et (örn. iletişim, hakkımızda vb.)
  function isSpecialPage($: CheerioAPI): boolean {
    const specialPageIndicators = [
      'iletişim', 'contact', 'about', 'hakkımızda', 'hakkında', 'gizlilik', 'privacy', 
      'sss', 'faq', 'yardım', 'help', '404', 'bulunamadı', 'not found', 'terms', 'koşullar'
    ];
    
    // URL'de özel sayfa belirteci var mı?
    let isSpecial = specialPageIndicators.some(term => 
      url.toLowerCase().includes(term));
    
    // Başlıkta özel sayfa belirteci var mı?
    isSpecial = isSpecial || specialPageIndicators.some(term => 
      title.toLowerCase().includes(term));
      
    // H1'de özel sayfa belirteci var mı?
    isSpecial = isSpecial || specialPageIndicators.some(term => 
      h1.toLowerCase().includes(term));
    
    // Form içeriyor mu?
    isSpecial = isSpecial || $('form').length > 0;
    
    return isSpecial;
  }
  
  // Sayfada tekrar eden içerikleri bul
  function findDuplicateContent($: CheerioAPI, selector: string): string[] {
    const elements = $(selector);
    const contentMap = new Map<string, number>();
    const duplicateContents: string[] = [];
    
    elements.each((_, element) => {
      const content = $(element).text().trim();
      if (content.length > 30) { // 30 karakterden uzun içerikler için kontrol yap
        const normalizedContent = content.toLowerCase().replace(/\s+/g, ' ');
        const count = contentMap.get(normalizedContent) || 0;
        
        if (count > 0 && !duplicateContents.includes(normalizedContent)) {
          duplicateContents.push(normalizedContent);
        }
        
        contentMap.set(normalizedContent, count + 1);
      }
    });
    
    return duplicateContents;
  }
  
  // Sayfanın şablon içerik oranını tahmin et
  function calculateBoilerplateRatio($: CheerioAPI): number {
    // Tüm sayfanın metin içeriği
    const totalText = $('body').text().trim();
    const totalLength = totalText.length;
    
    if (totalLength === 0) return 0;
    
    // Şablon olması muhtemel bölgeler
    const boilerplateElements = $('header, footer, nav, sidebar, aside, .menu, .navigation, .sidebar, .widget, .banner, .ads').text().trim();
    const boilerplateLength = boilerplateElements.length;
    
    return boilerplateLength / totalLength;
  }
  
  // İçerik özgünlüğü için göstergeleri analiz et
  function analyzeContentUniqueness($: CheerioAPI): { suspiciousPatterns: number } {
    let suspiciousPatterns = 0;
    
    // 1. Tutarsız biçimlendirme kontrolü
    const paragraphs = $('p');
    let formatConsistencyScore = 0;
    
    paragraphs.each((i, p) => {
      if (i > 0 && i < paragraphs.length - 1) {
        const prevLength = $(paragraphs[i-1]).text().length;
        const currLength = $(p).text().length;
        const nextLength = $(paragraphs[i+1]).text().length;
        
        // Paragraf uzunluklarında aşırı tutarsızlık arama
        if (currLength < prevLength * 0.3 && currLength < nextLength * 0.3 && currLength > 10) {
          formatConsistencyScore++;
        }
      }
    });
    
    if (formatConsistencyScore > paragraphs.length * 0.2) {
      suspiciousPatterns++;
    }
    
    // 2. Farklı yazım stillerini kontrol et
    const fullText = $('p').text();
    const firstPersonCount = (fullText.match(/\b(ben|biz|benim|bizim|bize|bizi|kendim|kendimiz)\b/gi) || []).length;
    const thirdPersonCount = (fullText.match(/\b(o|onlar|onun|onların|kendisi|kendileri)\b/gi) || []).length;
    
    if (firstPersonCount > 0 && thirdPersonCount > 0 && 
        (firstPersonCount > thirdPersonCount * 3 || thirdPersonCount > firstPersonCount * 3)) {
      suspiciousPatterns++;
    }
    
    // 3. Diğer olası belirtiler kontrol edilebilir
    
    return { suspiciousPatterns };
  }
  
  return { issues, successes };
}

// --- Gelişmiş Anahtar Kelime ve İçerik Optimizasyonu Analizi ---
function analyzeKeywordSpam($: CheerioAPI, url: string): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  
  // --------- İÇERİK TOPLAMA VE HAZIRLIK ---------
  
  // Temel HTML elementlerinden içerik topla
  const title = $('title').text().trim();
  const metaDesc = $('meta[name="description"]').attr('content')?.trim() || '';
  const metaKeywords = $('meta[name="keywords"]').attr('content')?.trim() || '';
  const h1Text = $('h1').map((_, el) => $(el).text().trim()).get().join(' ');
  const h2Text = $('h2').map((_, el) => $(el).text().trim()).get().join(' ');
  const headings = $('h1, h2, h3').map((_, el) => $(el).text().trim()).get();
  
  // Ana içeriği topla
  const mainContent = extractMainContent($);
  const mainContentText = mainContent.text().trim();
  const bodyText = $('body').text().trim();
  
  // Görünmez içeriği tespit et
  const hiddenContent = findHiddenContent($);
  
  // Alt etiketlerini topla
  const imgAltTexts = $('img[alt]').map((_, el) => $(el).attr('alt')?.trim() || '').get();
  
  // URL analizi
  const urlParts = url.toLowerCase().split('/').filter(Boolean);
  const urlEnd = urlParts[urlParts.length - 1]?.split('?')[0]?.split('.')[0] || '';
  const urlKeywords = urlEnd
    .split(/[-_]/g)
    .filter(k => k.length > 2)
    .filter(k => !['html', 'php', 'asp', 'jsx', 'htm'].includes(k));
  
  // --------- KELİME FREKANSI ANALİZİ ---------
  
  // Metin normalleştirme fonksiyonları
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\wğüşöçıİĞÜŞÖÇ\s]/g, ' ')  // Türkçe karakterleri destekle
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const extractWords = (text: string): string[] => {
    return normalizeText(text)
      .split(/\s+/)
      .filter(word => word.length > 2)  // 3 karakterden kısa kelimeleri filtrele
      .filter(word => !STOP_WORDS.includes(word));
  };
  
  // Türkçe ve İngilizce yaygın stop words
  const STOP_WORDS = [
    "ve", "veya", "ile", "için", "bu", "bir", "da", "de", "ki", "mi",
    "the", "and", "or", "for", "to", "in", "on", "at", "is", "are", "was", "were",
    "gibi", "kadar", "dolayı", "önce", "sonra", "göre", "her", "çok", "daha", "nasıl",
    "of", "from", "with", "by", "as", "but", "not", "what", "all", "about"
  ];
  
  // Farklı bölümlerdeki kelimeleri ayıkla
  const titleWords = extractWords(title);
  const metaDescWords = extractWords(metaDesc);
  const metaKeywordsArr = metaKeywords ? metaKeywords.split(',').map(k => k.trim().toLowerCase()) : [];
  const headingWords = extractWords(headings.join(' '));
  const mainContentWords = extractWords(mainContentText);
  const bodyWords = extractWords(bodyText);
  const altTextWords = extractWords(imgAltTexts.join(' '));
  
  // Tüm kelimeler (öncelikle ana içerik)
  const allWords = mainContentWords.length > 0 ? mainContentWords : bodyWords;
  
  // Kelime frekanslarını hesapla
  const calculateFrequency = (words: string[]): Record<string, number> => {
    const freq: Record<string, number> = {};
    words.forEach(word => {
      freq[word] = (freq[word] || 0) + 1;
    });
    return freq;
  };
  
  // Farklı bölümlerdeki kelime frekansları
  const mainFreq = calculateFrequency(allWords);
  const titleFreq = calculateFrequency(titleWords);
  const headingFreq = calculateFrequency(headingWords);
  const metaFreq = calculateFrequency([...metaDescWords, ...metaKeywordsArr]);
  const altFreq = calculateFrequency(altTextWords);
  
  // En sık kullanılan kelimeler
  const topKeywords = Object.entries(mainFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .filter(([word, count]) => count > 2);  // En az 3 kez kullanılmış kelimeler
  
  // Kelime yoğunluğu hesaplama
  const calculateDensity = (count: number, totalWords: number): number => {
    return totalWords > 0 ? (count / totalWords) * 100 : 0;
  };
  
  // En yoğun anahtar kelimeler ve yoğunlukları
  const densities = topKeywords.map(([word, count]) => {
    const density = calculateDensity(count, allWords.length);
    return { word, count, density };
  });
  
  // --------- ANAHTAR KELİME SPAM ANALİZİ ---------
  
  // 1. Aşırı Anahtar Kelime Yoğunluğu Kontrolü
  const highDensityKeywords = densities.filter(k => k.density > 4);  // %4'ten fazla yoğunluk kuşkulu
  const extremeDensityKeywords = densities.filter(k => k.density > 8);  // %8'den fazla yoğunluk sorunlu
  
  if (extremeDensityKeywords.length > 0) {
    const keyword = extremeDensityKeywords[0];
    issues.push({
      type: 'warning',
      field: 'keyword-density',
      message: `Anahtar kelime stuffing riski: '${keyword.word}' kelimesi aşırı sık kullanılmış (${keyword.count} kez, %${keyword.density.toFixed(1)} yoğunluk).`,
      suggestion: 'Anahtar kelime yoğunluğunu doğal bir seviyeye (%1-3 arası) düşürün ve içeriği zenginleştirin.',
      impact: 'high',
      difficulty: 'orta',
      example: `İçeriğinizde '${keyword.word}' kelimesi yerine eş anlamlılarını veya ilgili terimleri kullanın:
"${keyword.word}" yerine → "${findSynonyms(keyword.word).join('", "')}"`,
      explanation: 'Anahtar kelime stuffing (doldurma), içerikte aynı kelimeleri aşırı derecede tekrar etme uygulamasıdır. Modern arama motorları, anahtar kelime yoğunluğunun doğal olmasına büyük önem verir. Aşırı anahtar kelime kullanımı, spam olarak algılanabilir ve sitenizin sıralamasını olumsuz etkileyebilir. İçeriğinizin akıcı ve doğal olmasını sağlayın.',
      reference: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
      category: 'İçerik Optimizasyonu'
    });
  } else if (highDensityKeywords.length > 0) {
    const keyword = highDensityKeywords[0];
    issues.push({
      type: 'info',
      field: 'keyword-density',
      message: `Yüksek anahtar kelime yoğunluğu: '${keyword.word}' kelimesi sık kullanılmış (${keyword.count} kez, %${keyword.density.toFixed(1)} yoğunluk).`,
      suggestion: 'Anahtar kelime yoğunluğunu biraz azaltın ve içeriğinizi daha doğal hale getirin.',
      impact: 'medium',
      difficulty: 'kolay',
      example: `İçeriğinizde şu tarz değişiklikler yapın:
"${keyword.word} ürünlerimiz ile ${keyword.word} sorunlarınızı çözebilirsiniz."
↓
"Ürünlerimiz ile bu tür sorunlarınıza etkili çözümler sunabilirsiniz."`,
      explanation: 'Belirli kelimelerin yüksek yoğunlukta kullanımı, içeriğin yapay ve okuyucu odaklı değil, arama motoru odaklı olduğu izlenimini verebilir. Modern SEO, doğallığa ve kullanıcı deneyimine öncelik verir. Anahtar kelime yoğunluğunun %1-3 arasında tutulması idealdir.',
      reference: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
      category: 'İçerik Optimizasyonu'
    });
  } else if (topKeywords.length > 0) {
    const mainKeyword = topKeywords[0][0];
    const mainKeywordCount = topKeywords[0][1];
    const mainKeywordDensity = calculateDensity(mainKeywordCount, allWords.length);
    
    if (mainKeywordDensity > 0.5 && mainKeywordDensity <= 4) {
      successes.push({
        field: 'keyword-density',
        message: `Ana anahtar kelime '${mainKeyword}' dengeli bir yoğunlukta kullanılmış (%${mainKeywordDensity.toFixed(1)}).`,
        impact: 'high positive'
      });
    }
  }
  
  // 2. Meta Keywords Spam Kontrolü
  if (metaKeywordsArr.length > 10) {
    issues.push({
      type: 'info',
      field: 'meta-keywords',
      message: `Meta keywords etiketinde çok fazla anahtar kelime var (${metaKeywordsArr.length} adet).`,
      suggestion: 'Meta keywords etiketini kaldırın veya sadece 3-5 en önemli anahtar kelimeye indirgeyin.',
      impact: 'low',
      difficulty: 'kolay',
      example: `<meta name="keywords" content="birincil anahtar kelime, ikincil anahtar kelime, marka">`,
      explanation: 'Meta keywords etiketi günümüzde Google tarafından sıralama faktörü olarak kullanılmamaktadır ve genellikle spam sinyali olarak algılanabilir. Çok fazla anahtar kelime içeren meta keywords etiketi, eski ve optimize edilmemiş bir web sitesi izlenimi verebilir. Modern SEO uygulamalarında bu etiketi tamamen kaldırmak veya çok sınırlı sayıda kullanmak önerilir.',
      reference: 'https://developers.google.com/search/blog/2009/09/google-does-not-use-keywords-meta-tag',
      category: 'Teknik SEO'
    });
  }
  
  // 3. Başlık Optimizasyonu Kontrolü
  if (title) {
    const titleLength = title.length;
    const titleWordCount = titleWords.length;
    
    // Başlık uzunluğu kontrolü
    if (titleLength > 70) {
      issues.push({
        type: 'info',
        field: 'title-length',
        message: `Başlık etiketi çok uzun (${titleLength} karakter).`,
        suggestion: 'Başlık etiketini 50-60 karakter arasında tutun.',
        impact: 'medium',
        difficulty: 'kolay',
        example: `<title>Ana Anahtar Kelime | Marka Adı</title>`,
        explanation: 'Uzun başlıklar, arama motorlarında kırpılabilir ve kullanıcı deneyimini olumsuz etkileyebilir. Google genellikle başlığın ilk 50-60 karakterini gösterir. Başlığın kısa, öz ve anahtar kelimenizi vurgulayan bir şekilde yazılması önemlidir.',
        reference: 'https://developers.google.com/search/docs/appearance/title-link',
        category: 'Teknik SEO'
      });
    } else if (titleLength < 20) {
      issues.push({
        type: 'info',
        field: 'title-length',
        message: `Başlık etiketi çok kısa (${titleLength} karakter).`,
        suggestion: 'Başlık etiketini daha açıklayıcı hale getirin (en az 30 karakter önerilir).',
        impact: 'medium',
        difficulty: 'kolay',
        example: `<title>Mevcut Başlık + Tanımlayıcı Ekleme | Marka Adı</title>`,
        explanation: 'Çok kısa başlıklar, sayfanızın içeriği hakkında yeterli bilgi vermez ve arama motorlarında daha az dikkat çeker. Başlığınızı, içeriğinizi doğru tanımlayan ve anahtar kelimelerinizi içeren şekilde genişletin.',
        reference: 'https://developers.google.com/search/docs/appearance/title-link',
        category: 'Teknik SEO'
      });
    } else {
      successes.push({
        field: 'title-length',
        message: `Başlık etiketi ideal uzunlukta (${titleLength} karakter).`,
        impact: 'medium positive'
      });
    }
    
    // Başlık kelime tekrarı kontrolü
    const titleWordFreq = calculateFrequency(title.toLowerCase().split(/\s+/));
    const repeatedTitleWords = Object.entries(titleWordFreq)
      .filter(([word, count]) => count > 1 && word.length > 2 && !STOP_WORDS.includes(word));
    
    if (repeatedTitleWords.length > 0) {
      issues.push({
        type: 'info',
        field: 'title-keyword',
        message: `Başlıkta kelime tekrarı: "${repeatedTitleWords.map(([word]) => word).join(', ')}" kelimesi birden fazla kullanılmış.`,
        suggestion: 'Başlıkta kelimeleri tekrar etmeyin, her kelimeyi bir kez kullanın.',
        impact: 'low',
        difficulty: 'kolay',
        example: `Şu başlık yerine:
<title>Ucuz Ayakkabı Ucuz Spor Ayakkabı Modelleri</title>

Bunu tercih edin:
<title>Ucuz Spor Ayakkabı Modelleri ve Fiyatları</title>`,
        explanation: 'Başlıkta aynı kelimeleri tekrar etmek, anahtar kelime stuffing olarak algılanabilir ve spam sinyali verebilir. Her kelimeyi başlıkta bir kez kullanmak daha etkili ve profesyonel bir yaklaşımdır.',
        reference: 'https://developers.google.com/search/docs/appearance/title-link',
        category: 'İçerik Optimizasyonu'
      });
    }
    
    // Başlık-içerik uyumu kontrolü
    if (topKeywords.length > 0) {
      const mainKeyword = topKeywords[0][0];
      if (!title.toLowerCase().includes(mainKeyword.toLowerCase())) {
        issues.push({
          type: 'info',
          field: 'title-content-match',
          message: `Başlık, içerikte en sık geçen '${mainKeyword}' anahtar kelimesini içermiyor.`,
          suggestion: `Ana anahtar kelimenizi başlığa doğal bir şekilde ekleyin.`,
          impact: 'medium',
          difficulty: 'kolay',
          example: `<title>Mevcut Başlık ile ${mainKeyword.charAt(0).toUpperCase() + mainKeyword.slice(1)} | Marka</title>`,
          explanation: 'Başlığın içeriğin ana konusuyla uyumlu olması, hem kullanıcı deneyimi hem de SEO açısından önemlidir. İçerikte en sık kullanılan anahtar kelimenin başlıkta da yer alması, sayfanın ne hakkında olduğunu arama motorlarına ve kullanıcılara net bir şekilde belirtir.',
          reference: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
          category: 'İçerik Optimizasyonu'
        });
      } else {
        successes.push({
          field: 'title-keyword',
          message: `Başlık ana anahtar kelime (${mainKeyword}) ile uyumlu.`,
          impact: 'medium positive'
        });
      }
    }
  }
  
  // 4. Meta Açıklama Kontrolü
  if (metaDesc) {
    const metaDescLength = metaDesc.length;
    
    // Meta açıklama uzunluğu
    if (metaDescLength > 160) {
      issues.push({
        type: 'info',
        field: 'meta-desc-length',
        message: `Meta açıklama çok uzun (${metaDescLength} karakter).`,
        suggestion: 'Meta açıklamayı 150-160 karakter arasında tutun.',
        impact: 'medium',
        difficulty: 'kolay',
        example: `<meta name="description" content="Özet ve aksiyon çağrısı içeren 150-160 karakterlik açıklama. Anahtar kelimeleri doğal şekilde kullanın.">`,
        explanation: 'Uzun meta açıklamalar arama sonuçlarında kırpılır ve etkilerini kaybedebilir. Meta açıklamanın amacı, kullanıcıları sayfanızı ziyaret etmeye teşvik etmektir. İdeal meta açıklama 150-160 karakter arasında olmalı, sayfanın özeti ve bir aksiyon çağrısı içermelidir.',
        reference: 'https://developers.google.com/search/docs/appearance/snippet',
        category: 'Teknik SEO'
      });
    } else if (metaDescLength < 70) {
      issues.push({
        type: 'info',
        field: 'meta-desc-length',
        message: `Meta açıklama çok kısa (${metaDescLength} karakter).`,
        suggestion: 'Meta açıklamayı en az 100 karakter olacak şekilde genişletin.',
        impact: 'low',
        difficulty: 'kolay',
        example: `<meta name="description" content="Mevcut açıklamaya ek olarak sayfanın sunduğu faydaları ve değeri vurgulayacak bilgiler ekleyin. Aksiyon çağrısı unutmayın.">`,
        explanation: 'Çok kısa meta açıklamalar, sayfanızın içeriği hakkında yeterli bilgi vermez ve tıklanma oranını (CTR) düşürebilir. Meta açıklamanın sayfanın değerini ve içeriğini net bir şekilde ifade etmesi, kullanıcıları sayfaya çekmek için önemlidir.',
        reference: 'https://developers.google.com/search/docs/appearance/snippet',
        category: 'Teknik SEO'
      });
    } else {
      successes.push({
        field: 'meta-desc-length',
        message: `Meta açıklama ideal uzunlukta (${metaDescLength} karakter).`,
        impact: 'low positive'
      });
    }
    
    // Meta açıklama anahtar kelime kontrolü
    if (topKeywords.length > 0) {
      const mainKeyword = topKeywords[0][0];
      if (!metaDesc.toLowerCase().includes(mainKeyword.toLowerCase())) {
        issues.push({
          type: 'info',
          field: 'meta-desc-keyword',
          message: `Meta açıklama, ana anahtar kelime '${mainKeyword}' içermiyor.`,
          suggestion: 'Ana anahtar kelimeyi meta açıklamaya doğal bir şekilde ekleyin.',
          impact: 'low',
          difficulty: 'kolay',
          example: `<meta name="description" content="...${mainKeyword}... hakkında bilgi içeren açıklayıcı bir meta açıklama.">`,
          explanation: 'Meta açıklamada ana anahtar kelimenin bulunması, arama motorlarında eşleşen kelimelerin kalın gösterilmesini sağlar ve kullanıcıların dikkatini çeker. Bu, tıklanma oranını (CTR) artırmaya yardımcı olabilir.',
          reference: 'https://developers.google.com/search/docs/appearance/snippet',
          category: 'İçerik Optimizasyonu'
        });
      } else {
        successes.push({
          field: 'meta-desc-keyword',
          message: `Meta açıklama ana anahtar kelime (${mainKeyword}) içeriyor.`,
          impact: 'low positive'
        });
      }
    }
    
    // Meta açıklama kelime tekrarı kontrolü
    const metaDescWords = metaDesc.toLowerCase().split(/\s+/);
    const metaWordFreq = calculateFrequency(metaDescWords);
    const repeatedMetaWords = Object.entries(metaWordFreq)
      .filter(([word, count]) => count > 2 && word.length > 3 && !STOP_WORDS.includes(word));
    
    if (repeatedMetaWords.length > 0) {
      issues.push({
        type: 'info',
        field: 'meta-desc-repetition',
        message: `Meta açıklamada aşırı kelime tekrarı: "${repeatedMetaWords[0][0]}" kelimesi ${repeatedMetaWords[0][1]} kez tekrar edilmiş.`,
        suggestion: 'Meta açıklamada anahtar kelimeleri en fazla 1-2 kez kullanın.',
        impact: 'low',
        difficulty: 'kolay',
        example: `Şu meta açıklama yerine:
"Ucuz ayakkabı modelleri, ucuz spor ayakkabı, ucuz günlük ayakkabı modellerimiz ile tarzınızı yansıtın."

Bunu tercih edin:
"Ekonomik fiyatlı spor ve günlük ayakkabı modellerimizle tarzınızı yansıtın. Kaliteli ayakkabılar için hemen inceleyin."`,
        explanation: 'Meta açıklamalarda aşırı kelime tekrarı, spam olarak algılanabilir ve profesyonellikten uzak bir görüntü verebilir. Daha doğal ve akıcı bir dil kullanmak, hem kullanıcılar hem de arama motorları tarafından daha olumlu karşılanır.',
        reference: 'https://developers.google.com/search/docs/appearance/snippet',
        category: 'İçerik Optimizasyonu'
      });
    }
  } else {
    issues.push({
      type: 'warning',
      field: 'meta-desc-missing',
      message: 'Meta açıklama (description) etiketi eksik.',
      suggestion: 'Sayfanın içeriğini özetleyen bir meta açıklama ekleyin.',
      impact: 'high',
      difficulty: 'kolay',
      example: `<meta name="description" content="Sayfanın içeriğini özetleyen, anahtar kelimeleri içeren ve kullanıcıları harekete geçiren 150-160 karakterlik açıklama.">`,
      explanation: 'Meta açıklama, arama sonuçlarında görünen snippet\'i kontrol etmenize olanak tanır. İyi yazılmış bir meta açıklama, tıklanma oranını (CTR) artırabilir ve doğru kullanıcıları sayfanıza çekebilir. Meta açıklama olmadığında, Google sayfa içeriğinden otomatik olarak bir snippet oluşturur, ancak bu her zaman istediğiniz mesajı iletmeyebilir.',
      reference: 'https://developers.google.com/search/docs/appearance/snippet',
      category: 'Teknik SEO'
    });
  }
  
  // 5. Başlık (H1, H2, H3) Anahtar Kelime Kontrolü
  const h1Count = $('h1').length;
  
  if (h1Count === 0) {
    issues.push({
      type: 'warning',
      field: 'h1-missing',
      message: 'Sayfada H1 başlık etiketi yok.',
      suggestion: 'Her sayfada bir H1 başlığı kullanın.',
      impact: 'high',
      difficulty: 'kolay',
      example: `<h1>Ana Konuyu İçeren Açıklayıcı Başlık</h1>`,
      explanation: 'H1 başlığı, sayfanın ana konusunu belirtir ve SEO açısından önemli bir sinyal olarak kabul edilir. Her sayfada yalnızca bir H1 başlığı olmalı ve bu başlık sayfanın ana konusunu net bir şekilde yansıtmalıdır.',
      reference: 'https://developers.google.com/search/docs/appearance/structured-data',
      category: 'Teknik SEO'
    });
  } else if (h1Count > 1) {
    issues.push({
      type: 'info',
      field: 'h1-multiple',
      message: `Sayfada birden fazla H1 başlık etiketi var (${h1Count} adet).`,
      suggestion: 'Her sayfada yalnızca bir H1 başlığı kullanın.',
      impact: 'medium',
      difficulty: 'kolay',
      example: `<!-- Sadece tek bir H1 kullanın -->
<h1>Ana Sayfa Başlığı</h1>
<!-- Diğer başlıklar için H2, H3 kullanın -->
<h2>Alt Başlık</h2>`,
      explanation: 'Birden fazla H1 başlığı kullanmak, sayfanın hiyerarşik yapısını bozabilir ve arama motorlarının sayfanın ana konusunu anlamasını zorlaştırabilir. HTML5\'te birden fazla H1 kullanmak teknik olarak mümkün olsa da, SEO açısından hala tek H1 kullanmak önerilir.',
      reference: 'https://developers.google.com/search/docs/appearance/structured-data',
      category: 'Teknik SEO'
    });
  } else {
    successes.push({
      field: 'h1-count',
      message: 'Sayfada doğru sayıda (1) H1 başlık etiketi var.',
      impact: 'medium positive'
    });
    
    // H1 ve Title uyumu
    const h1Text = $('h1').first().text().trim();
    if (title && h1Text && !areSimilarTexts(title, h1Text)) {
      issues.push({
        type: 'info',
        field: 'h1-title-match',
        message: 'H1 başlığı ve Title etiketi birbirinden çok farklı.',
        suggestion: 'H1 başlığı ve Title etiketinin benzer olmasını sağlayın.',
        impact: 'low',
        difficulty: 'kolay',
        example: `<title>Ana Anahtar Kelime - Site Adı</title>
<h1>Ana Anahtar Kelime İçeren Başlık</h1>`,
        explanation: 'H1 başlığı ve Title etiketinin tamamen aynı olması gerekmez, ancak benzer temel anahtar kelimeleri içermesi ve sayfanın konusunu tutarlı bir şekilde yansıtması önemlidir. Bu tutarlılık, kullanıcı deneyimini iyileştirir ve arama motorlarına sayfanın ana konusu hakkında güçlü sinyaller gönderir.',
        reference: 'https://developers.google.com/search/docs/appearance/title-link',
        category: 'İçerik Optimizasyonu'
      });
    } else if (title && h1Text) {
      successes.push({
        field: 'h1-title-match',
        message: 'H1 başlığı ve Title etiketi uyumlu.',
        impact: 'low positive'
      });
    }
  }
  
  // H1, H2, H3 başlıklarında anahtar kelime kontrolü
  if (topKeywords.length > 0 && h1Count > 0) {
    const mainKeyword = topKeywords[0][0];
    const h1Contains = $('h1').text().toLowerCase().includes(mainKeyword);
    const h2Contains = $('h2').filter((_, el) => $(el).text().toLowerCase().includes(mainKeyword)).length > 0;
    
    if (!h1Contains && !h2Contains) {
      issues.push({
        type: 'info',
        field: 'headings-keyword',
        message: `Ana anahtar kelime '${mainKeyword}' başlıklarda (H1, H2) yer almıyor.`,
        suggestion: 'Ana anahtar kelimeyi H1 veya H2 başlıklarında kullanın.',
        impact: 'medium',
        difficulty: 'kolay',
        example: `<h1>Ana Başlık: ${mainKeyword.charAt(0).toUpperCase() + mainKeyword.slice(1)} Hakkında</h1>
<h2>${mainKeyword.charAt(0).toUpperCase() + mainKeyword.slice(1)} Nasıl Kullanılır?</h2>`,
        explanation: 'Başlıklar, sayfanın yapısını belirler ve arama motorlarına içeriğin hiyerarşisini gösterir. Ana anahtar kelimenin H1 veya üst düzey H2 başlıklarında yer alması, sayfanın konusunu netleştirir ve SEO açısından olumlu bir sinyal sağlar.',
        reference: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
        category: 'İçerik Optimizasyonu'
      });
    } else {
      successes.push({
        field: 'headings-keyword',
        message: `Ana anahtar kelime '${mainKeyword}' başlıklarda yer alıyor.`,
        impact: 'medium positive'
      });
    }
  }
  
  // 6. Görünmez Metin ve Anahtar Kelime Kontrolü
  if (hiddenContent.length > 0) {
    issues.push({
      type: 'warning',
      field: 'hidden-text',
      message: `Sayfada ${hiddenContent.length} adet potansiyel gizli metin veya CSS ile gizlenmiş içerik tespit edildi.`,
      suggestion: 'Görünmez metinler ve anahtar kelime stuffing için CSS ile gizlenmiş içerikleri kaldırın.',
      impact: 'high',
      difficulty: 'orta',
      example: `<!-- Şu tür gizli metinleri temizleyin -->
<div style="display:none">anahtar kelimeler anahtar kelimeler anahtar kelimeler</div>
<div style="visibility:hidden">gizli içerik</div>
<span style="color:#FFFFFF; background-color:#FFFFFF">beyaz üzerine beyaz metin</span>`,
      explanation: 'Gizli metin veya CSS ile gizlenmiş anahtar kelimeler, Google\'ın Webmaster Yönergeleri\'ni ihlal eder ve spam tekniği olarak kabul edilir. Bu tür uygulamalar, sitenizin sıralamasını ciddi şekilde etkileyebilir ve hatta indeksten çıkarılmasına neden olabilir. Tüm içerik kullanıcılar tarafından görülebilir olmalı ve doğal bir şekilde yerleştirilmelidir.',
      reference: 'https://developers.google.com/search/docs/essentials/spam-policies',
      category: 'Black Hat SEO'
    });
  }
  
  // 7. Alt Metinlerinde Anahtar Kelime Stuffing Kontrolü
  const altTextsWithKeywordStuffing = $('img[alt]').filter((_, el) => {
    const alt = $(el).attr('alt') || '';
    if (alt.length > 10) {
      const altWords = alt.toLowerCase().split(/\s+/);
      const altFreq = calculateFrequency(altWords);
      return Object.values(altFreq).some(count => count > 2);  // Bir kelime 3 veya daha fazla tekrar ediliyorsa
    }
    return false;
  }).length;
  
  if (altTextsWithKeywordStuffing > 0) {
    issues.push({
      type: 'info',
      field: 'alt-text-stuffing',
      message: `${altTextsWithKeywordStuffing} görselde alt metin içinde anahtar kelime stuffing tespit edildi.`,
      suggestion: 'Alt metinlerde anahtar kelimeleri doğal bir şekilde kullanın ve tekrarlardan kaçının.',
      impact: 'medium',
      difficulty: 'kolay',
      example: `<!-- Şu şekilde kullanmayın -->
<img src="mavi-gomlek.jpg" alt="mavi gömlek mavi gömlek en ucuz mavi gömlek fiyatları">

<!-- Bunun yerine şunu tercih edin -->
<img src="mavi-gomlek.jpg" alt="Slim fit mavi erkek gömlek modeli">`,
      explanation: 'Görsel alt metinleri (alt attribute), görsellerin içeriğini açıklamak ve erişilebilirliği artırmak için kullanılır. Alt metinlerde anahtar kelimelerin aşırı tekrarlanması, spam olarak algılanabilir. Alt metinler kısa, açıklayıcı olmalı ve görselin içeriğini doğru bir şekilde yansıtmalıdır.',
      reference: 'https://developers.google.com/search/docs/appearance/google-images',
      category: 'İçerik Optimizasyonu'
    });
  }
  
  // 8. URL Anahtar Kelime Kontrolü
  if (urlKeywords.length > 0 && topKeywords.length > 0) {
    const mainKeyword = topKeywords[0][0];
    const urlContainsMainKeyword = urlKeywords.some(k => 
      k.includes(mainKeyword) || mainKeyword.includes(k));
    
    if (!urlContainsMainKeyword) {
      issues.push({
        type: 'info',
        field: 'url-keyword',
        message: `URL, ana anahtar kelime '${mainKeyword}' içermiyor.`,
        suggestion: 'URL yapısında ana anahtar kelimenizi kullanmayı düşünün.',
        impact: 'low',
        difficulty: 'orta',
        example: `https://example.com/${mainKeyword.replace(/\s+/g, '-').toLowerCase()}/`,
        explanation: 'URL\'de ana anahtar kelimenin bulunması, hem kullanıcılara hem de arama motorlarına sayfanın içeriği hakkında bilgi verir. Ancak bu, URL\'i aşırı uzatmamak ve kullanıcı dostu tutmak koşuluyla yapılmalıdır. Anahtar kelime içeren URL\'ler genellikle arama sonuçlarında daha tıklanabilir olur.',
        reference: 'https://developers.google.com/search/docs/crawling-indexing/url-structure',
        category: 'Teknik SEO'
      });
    } else {
      successes.push({
        field: 'url-keyword',
        message: `URL, ana anahtar kelime ile ilişkili.`,
        impact: 'low positive'
      });
    }
  }
  
  // 9. Kelime Tekrarı ve Cümle Başları Kontrolü
  const paragraphs = $('p').map((_, el) => $(el).text().trim()).get();
  let consecutiveStartMatches = 0;
  
  for (let i = 1; i < paragraphs.length; i++) {
    if (paragraphs[i] && paragraphs[i-1]) {
      const prevStart = paragraphs[i-1].split(' ').slice(0, 3).join(' ').toLowerCase();
      const currStart = paragraphs[i].split(' ').slice(0, 3).join(' ').toLowerCase();
      
      if (prevStart.length > 10 && prevStart === currStart) {
        consecutiveStartMatches++;
      }
    }
  }
  
  if (consecutiveStartMatches > 0) {
    issues.push({
      type: 'info',
      field: 'paragraph-repetition',
      message: `${consecutiveStartMatches} paragraf benzer kelimelerle başlıyor.`,
      suggestion: 'Her paragrafı özgün bir şekilde başlatın ve çeşitlilik sağlayın.',
      impact: 'low',
      difficulty: 'kolay',
      example: `<!-- Farklı başlangıçlar kullanın -->
<p>Bu konuda dikkat edilmesi gereken ilk nokta...</p>
<p>Araştırmalar gösteriyor ki...</p>
<p>Uzmanlar tarafından önerilen bir diğer yaklaşım...</p>`,
      explanation: 'Ardışık paragrafların aynı veya çok benzer kelimelerle başlaması, içerik kalitesini düşürür ve yapay veya otomatik oluşturulmuş içerik izlenimi verebilir. Paragraflarınızı çeşitli ve doğal geçişlerle başlatmak, okuyucu deneyimini iyileştirir ve içeriğinizin özgünlüğünü artırır.',
      reference: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
      category: 'İçerik Kalitesi'
    });
  }
  
  // 10. Genel Kelime Dağılımı ve LSI Anahtar Kelimeler
  if (topKeywords.length > 2) {
    const mainKeywords = topKeywords.slice(0, 3).map(k => k[0]);
    const mainTopicsCount = mainKeywords.length;
    const relatedKeywordsCount = topKeywords.slice(3).filter(([word]) => 
      mainKeywords.some(mk => areSemanticallyRelated(word, mk))).length;
    
    if (relatedKeywordsCount > 0) {
      successes.push({
        field: 'semantic-keywords',
        message: `İçerik ana konuyla ilişkili semantik anahtar kelimeler içeriyor (${relatedKeywordsCount} adet).`,
        impact: 'high positive'
      });
    }
  }
  
  // --------- GENEL DEĞERLENDİRME VE ÖZET ---------
  
  // Ana anahtar kelimeler özeti
  if (topKeywords.length > 0) {
    const keywordSummary = topKeywords.slice(0, 5)
      .map(([word, count]) => `${word} (${count} kez)`)
      .join(', ');
    
    successes.push({
      field: 'keyword-summary',
      message: `En sık kullanılan anahtar kelimeler: ${keywordSummary}`,
      impact: 'info'
    });
  }
  
  // Genel içerik değerlendirmesi
  if (issues.filter(i => i.field.includes('keyword') && (i.type === 'warning' || i.impact === 'high')).length === 0) {
    successes.push({
      field: 'general-content',
      message: 'İçerik genel olarak anahtar kelime spam riski taşımıyor.',
      impact: 'high positive'
    });
  }
  
  return { issues, successes };
  
  // --------- YARDIMCI FONKSİYONLAR ---------
  
  function extractMainContent($: CheerioAPI): Cheerio<AnyNode> {
    // Yaygın içerik konteyner seçicileri
    const contentSelectors = [
      'main', 'article', '.content', '.post', '.post-content',
      '.entry-content', '#content', '.main-content'
    ];
    
    // Tüm olası içerik konteynerlarını kontrol et
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length) {
        return element;
      }
    }
    
    // İçerik konteynerı bulunamadıysa, header/footer vb. elementleri çıkar
    return $('body').clone()
      .find('header, footer, nav, aside, .sidebar, .menu, .comments, script, style')
      .remove()
      .end();
  }
  
  function findHiddenContent($: CheerioAPI): string[] {
    const hiddenContent: string[] = [];
    
    // CSS ile gizlenmiş içerik kontrolü
    $('*').each((_, el) => {
      const style = $(el).attr('style') || '';
      const classes = $(el).attr('class') || '';
      const text = $(el).text().trim();
      
      if (text.length < 10) return; // Kısa metinleri atla
      
      const isVisibilityHidden = style.includes('visibility:hidden') || style.includes('visibility: hidden');
      const isDisplayNone = style.includes('display:none') || style.includes('display: none');
      const isTextHidden = style.includes('text-indent:-') || style.includes('color:#FFF') || style.includes('color:#FFFFFF') || style.includes('color: #FFF');
      
      // Yaygın gizli sınıf adları
      const hasHiddenClass = ['hidden', 'hide', 'invisible', 'd-none', 'visually-hidden']
        .some(cls => classes.split(/\s+/).includes(cls));
      
      if (isVisibilityHidden || isDisplayNone || isTextHidden || hasHiddenClass) {
        hiddenContent.push(text);
      }
    });
    
    return hiddenContent;
  }
  
  function areSimilarTexts(text1: string, text2: string): boolean {
    // Metinleri normalleştirme
    const normalize = (text: string) => text.toLowerCase().replace(/[^\wğüşöçıİĞÜŞÖÇ\s]/g, '').trim();
    
    const normalizedText1 = normalize(text1);
    const normalizedText2 = normalize(text2);
    
    // Benzerlik eşiği: Daha kısa metnin %60'ı veya 3 kelime (hangisi büyükse)
    const words1 = normalizedText1.split(/\s+/);
    const words2 = normalizedText2.split(/\s+/);
    
    // Ortak kelime sayısı
    const commonWords = words1.filter(w => words2.includes(w));
    const similarityThreshold = Math.max(3, Math.min(words1.length, words2.length) * 0.6);
    
    return commonWords.length >= similarityThreshold;
  }
  
  function findSynonyms(word: string): string[] {
    // Basit bir eşanlamlılar sözlüğü (gerçek bir sistemde daha kapsamlı olabilir)
    const synonyms: Record<string, string[]> = {
      'ucuz': ['uygun fiyatlı', 'ekonomik', 'hesaplı', 'bütçe dostu'],
      'fiyat': ['ücret', 'bedel', 'değer', 'maliyet'],
      'satın': ['alma', 'edinme', 'temin etme', 'sipariş'],
      'satış': ['ticaret', 'pazarlama', 'sunum', 'alışveriş'],
      'kalite': ['nitelik', 'standart', 'üstünlük', 'değer'],
      'indirim': ['kampanya', 'fırsat', 'promosyon', 'iskonto'],
      'hızlı': ['süratli', 'çabuk', 'acil', 'ekspres'],
      'yeni': ['güncel', 'modern', 'taze', 'son model'],
      'ücretsiz': ['bedava', 'karşılıksız', 'gratis', 'complimentary'],
      'en iyi': ['premium', 'birinci sınıf', 'üstün kalite', 'mükemmel'],
      'ürün': ['mal', 'eşya', 'mamul', 'meta'],
      'hizmet': ['servis', 'destek', 'yardım', 'bakım']
    };
    
    // Bu kelimeyle alakalı eşanlamlılar var mı?
    for (const [key, values] of Object.entries(synonyms)) {
      if (word.includes(key) || key.includes(word)) {
        return values;
      }
    }
    
    // Eşanlamlılar bulunamadıysa, genel öneriler
    return ['farklı bir terim', 'alternatif kelime', 'eş anlamlı kelime'];
  }
  
  function areSemanticallyRelated(word1: string, word2: string): boolean {
    // Basit semantik ilişki kontrolü (gerçek bir sistemde NLP/ML kullanılabilir)
    if (word1.includes(word2) || word2.includes(word1)) return true;
    
    // Kök-gövde ilişkisi kontrolü
    if (word1.length > 4 && word2.length > 4) {
      const stem1 = word1.substring(0, Math.ceil(word1.length * 0.7));
      const stem2 = word2.substring(0, Math.ceil(word2.length * 0.7));
      if (stem1 === stem2) return true;
    }
    
    // Basit bir ilişkili kelimeler sözlüğü
    const relatedTerms: Record<string, string[]> = {
      'araba': ['otomobil', 'araç', 'vasıta', 'taşıt', 'sürüş', 'direksiyon'],
      'telefon': ['cep', 'mobil', 'akıllı', 'çağrı', 'arama', 'iletişim'],
      'ev': ['konut', 'daire', 'apartman', 'yaşam', 'emlak', 'gayrimenkul'],
      'sağlık': ['hastalık', 'tedavi', 'doktor', 'hastane', 'ilaç', 'bakım'],
      'eğitim': ['okul', 'öğrenci', 'öğretmen', 'kurs', 'öğrenme', 'ders']
    };
    
    // İki kelime birbiriyle semantik olarak ilişkili mi kontrol et
    for (const [key, values] of Object.entries(relatedTerms)) {
      if ((word1.includes(key) || key.includes(word1)) && 
          values.some(v => word2.includes(v) || v.includes(word2))) {
        return true;
      }
      if ((word2.includes(key) || key.includes(word2)) && 
          values.some(v => word1.includes(v) || v.includes(word1))) {
        return true;
      }
    }
    
    return false;
  }
}

// --- Kapsamlı Erişilebilirlik ve ARIA Analizi ---
function analyzeAccessibility($: CheerioAPI, url: string): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  
  // --------- SEMANTİK YAPI ANALİZİ ---------
  
  // 1. Temel Sayfa Yapısı ve Landmark Bölgeleri
  const hasHtml = $('html').length > 0;
  const hasHead = $('head').length > 0;
  const hasBody = $('body').length > 0;
  const hasTitle = $('title').length > 0;
  
  const hasLangAttr = $('html').attr('lang') !== undefined;
  const lang = $('html').attr('lang') || '';
  
  // Landmark bölgelerini kontrol et
  const landmarkElements = {
    header: $('header').length,
    nav: $('nav').length,
    main: $('main').length,
    footer: $('footer').length,
    aside: $('aside').length,
    section: $('section').length,
    article: $('article').length
  };
  
  const totalLandmarks = Object.values(landmarkElements).reduce((sum, count) => sum + count, 0);
  
  // ARIA landmark rollerini kontrol et
  const ariaLandmarks = {
    banner: $('[role="banner"]').length,
    navigation: $('[role="navigation"]').length,
    main: $('[role="main"]').length,
    contentinfo: $('[role="contentinfo"]').length,
    complementary: $('[role="complementary"]').length,
    search: $('[role="search"]').length,
    form: $('[role="form"]').length
  };
  
  const totalAriaLandmarks = Object.values(ariaLandmarks).reduce((sum, count) => sum + count, 0);
  
  // Landmark değerlendirmesi
  if (totalLandmarks === 0 && totalAriaLandmarks === 0) {
    issues.push({
      type: 'warning',
      field: 'landmarks',
      message: 'Sayfada landmark bölgeleri (header, nav, main, footer, aside) veya ARIA landmark rolleri bulunmuyor.',
      suggestion: 'Sayfanızı semantik HTML5 etiketleri veya ARIA landmark rolleri kullanarak yapılandırın.',
      impact: 'high',
      difficulty: 'orta',
      example: `<header>Site Başlığı</header>
<nav>Ana Menü</nav>
<main>
  <article>Ana İçerik</article>
  <aside>İlgili İçerik</aside>
</main>
<footer>Site Altbilgisi</footer>`,
      explanation: 'Landmark bölgeleri, ekran okuyucu kullanıcıların sayfada gezinmesini kolaylaştırır ve sayfanın temel bölümlerini tanımlar. HTML5 semantik etiketleri (header, nav, main, article, section, aside, footer) veya eşdeğer ARIA rolleri (banner, navigation, main, contentinfo, complementary) kullanarak sayfanızı yapılandırmak, erişilebilirliği önemli ölçüde artırır ve tüm kullanıcılara daha iyi bir deneyim sunar.',
      reference: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/',
      category: 'Erişilebilirlik'
    });
  } else if (landmarkElements.main === 0 && ariaLandmarks.main === 0) {
    issues.push({
      type: 'warning',
      field: 'main-landmark',
      message: 'Sayfada ana içerik bölgesi (<main> etiketi veya role="main") bulunmuyor.',
      suggestion: 'Sayfa ana içeriğini <main> etiketi veya role="main" ile işaretleyin.',
      impact: 'high',
      difficulty: 'kolay',
      example: `<main>
  <h1>Sayfa Başlığı</h1>
  <p>Ana içerik buraya gelir...</p>
</main>

<!-- veya -->
<div role="main">
  <h1>Sayfa Başlığı</h1>
  <p>Ana içerik buraya gelir...</p>
</div>`,
      explanation: 'Her sayfada, o sayfaya özgü ana içeriği içeren bir <main> elementi bulunmalıdır. Bu, ekran okuyucu kullanıcıların tekrarlayan içeriği atlayıp doğrudan sayfa içeriğine geçmelerini sağlar. Ayrıca, bu etiket arama motorlarına sayfanın en önemli kısmını işaret eder. Modern HTML5 uyumlu siteler için <main> etiketi, eski tarayıcı desteği için ise role="main" kullanılması önerilir.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/main_role',
      category: 'Erişilebilirlik'
    });
  } else {
    successes.push({
      field: 'landmarks',
      message: `Sayfada ${totalLandmarks + totalAriaLandmarks} landmark bölgesi bulunuyor.`,
      impact: 'high positive'
    });
  }
  
  // Dil bilgisi kontrolü
  if (!hasLangAttr) {
    issues.push({
      type: 'warning',
      field: 'language',
      message: 'HTML etiketinde lang özniteliği eksik.',
      suggestion: 'HTML etiketine lang özniteliği ekleyin.',
      impact: 'high',
      difficulty: 'kolay',
      example: `<html lang="tr">`,
      explanation: 'HTML lang özniteliği, sayfanın hangi dilde olduğunu belirtir. Bu, ekran okuyucuların doğru telaffuz ve vurgu kullanmasını sağlar ve tarayıcıların çeviri önerilerini doğru şekilde sunmasına yardımcı olur. Ayrıca arama motorlarına içeriğinizin hangi dilde olduğunu bildirerek, doğru dil hedeflemesine katkıda bulunur.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang',
      category: 'Erişilebilirlik'
    });
  } else if (lang.length < 2) {
    issues.push({
      type: 'info',
      field: 'language-code',
      message: 'HTML lang özniteliği geçersiz veya eksik bir değere sahip.',
      suggestion: 'Geçerli bir dil kodu kullanın (örn. "tr", "en", "fr").',
      impact: 'medium',
      difficulty: 'kolay',
      example: `<html lang="tr">  <!-- Türkçe için -->
<html lang="en">  <!-- İngilizce için -->
<html lang="de-AT">  <!-- Avusturya Almancası için -->`,
      explanation: 'HTML lang özniteliği, ISO 639-1 dil kodlarına uygun olmalıdır. Geçersiz veya eksik bir dil kodu, ekran okuyucuların ve tarayıcıların sayfanızın dilini doğru tanımlayamamasına neden olur. Bu, erişilebilirliği ve kullanıcı deneyimini olumsuz etkiler.',
      reference: 'https://www.w3.org/International/questions/qa-html-language-declarations',
      category: 'Erişilebilirlik'
    });
  } else {
    successes.push({
      field: 'language',
      message: `Sayfa dili belirtilmiş: ${lang}`,
      impact: 'medium positive'
    });
  }
  
  // Başlık hiyerarşisi kontrolü
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  const h4Count = $('h4').length;
  const h5Count = $('h5').length;
  const h6Count = $('h6').length;
  
  const headingsInOrder = checkHeadingOrder($);
  
  if (h1Count === 0) {
    issues.push({
      type: 'warning',
      field: 'headings',
      message: 'Sayfada H1 başlık etiketi yok.',
      suggestion: 'Ana sayfa başlığı için H1 etiketi ekleyin.',
      impact: 'high',
      difficulty: 'kolay',
      example: `<h1>Ana Sayfa Başlığı</h1>`,
      explanation: 'H1 etiketi, sayfanın ana başlığını belirtir ve hem erişilebilirlik hem de SEO için kritik öneme sahiptir. Her sayfada bir H1 etiketi bulunmalı ve bu etiket sayfanın içeriğini açıkça tanımlamalıdır. Ekran okuyucular ve arama motorları, H1 etiketini sayfanın temel konusunu anlamak için kullanır.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements',
      category: 'Erişilebilirlik ve SEO'
    });
  } else if (h1Count > 1) {
    issues.push({
      type: 'info',
      field: 'multiple-h1',
      message: `Sayfada birden fazla H1 başlık etiketi (${h1Count} adet) var.`,
      suggestion: 'Her sayfada sadece bir H1 başlık etiketi kullanın.',
      impact: 'medium',
      difficulty: 'kolay',
      example: `<!-- İyi Uygulama -->
<h1>Ana Sayfa Başlığı</h1>
<h2>Alt Başlık 1</h2>
<h2>Alt Başlık 2</h2>`,
      explanation: 'Geleneksel olarak, her sayfada yalnızca bir H1 etiketi bulunması önerilir. Bu, sayfanın hiyerarşik yapısını netleştirir ve ekran okuyucu kullanıcılar için gezinmeyi kolaylaştırır. HTML5 ile birden fazla H1 kullanılması teknik olarak mümkün olsa da (özellikle section ve article elementleri içinde), erişilebilirlik açısından tek H1 kullanmak hala en iyi uygulamadır.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements',
      category: 'Erişilebilirlik'
    });
  }
  
  if (!headingsInOrder) {
    issues.push({
      type: 'warning',
      field: 'heading-order',
      message: 'Başlık etiketleri (h1, h2, h3...) düzgün sırada kullanılmamış.',
      suggestion: 'Başlık etiketlerini hiyerarşik sırayla kullanın (h1 sonra h2, sonra h3 vb.).',
      impact: 'medium',
      difficulty: 'orta',
      example: `<h1>Ana Başlık</h1>
<h2>Alt Başlık</h2>
<h3>Daha Alt Başlık</h3>
<!-- h3'ten sonra h5 değil, h4 gelmeli -->
<h4>En Alt Başlık</h4>`,
      explanation: 'Başlık etiketleri (h1 - h6), içeriğin hiyerarşik yapısını gösterir ve ekran okuyucu kullanıcıların sayfa yapısını anlamalarına yardımcı olur. Başlık seviyelerini atlamamak (örn. h2\'den h4\'e geçmek) önemlidir, çünkü bu atlama ekran okuyucu kullanıcılar için kafa karıştırıcı olabilir ve sayfa yapısını anlaşılmaz hale getirebilir.',
      reference: 'https://www.w3.org/WAI/tutorials/page-structure/headings/',
      category: 'Erişilebilirlik'
    });
  } else if (h1Count === 1 && (h2Count > 0 || h3Count > 0)) {
    successes.push({
      field: 'heading-structure',
      message: 'Başlık yapısı doğru bir şekilde kullanılmış.',
      impact: 'medium positive'
    });
  }
  
  // --------- RESİM ERİŞİLEBİLİRLİĞİ ANALİZİ ---------
  
  // Resim alt metin kontrolü
  const allImages = $('img');
  const imagesWithoutAlt = $('img:not([alt])');
  const imagesWithEmptyAlt = $('img[alt=""]');
  const decorativeImages = $('img[role="presentation"], img[aria-hidden="true"]');
  
  if (allImages.length > 0) {
    const missingAltCount = imagesWithoutAlt.length;
    const hasAltCount = allImages.length - missingAltCount;
    const altPercentage = Math.round((hasAltCount / allImages.length) * 100);
    
    if (missingAltCount > 0) {
      issues.push({
        type: 'warning',
        field: 'img-alt',
        message: `${missingAltCount} resimde alt özniteliği eksik (toplam ${allImages.length} resmin %${100-altPercentage}'i).`,
        suggestion: 'Tüm içeriksel resimlere açıklayıcı alt metni ekleyin.',
        impact: 'high',
        difficulty: 'kolay',
        example: `<!-- İçeriksel resim -->
<img src="product.jpg" alt="Mavi Deri Koltuk - 3 Kişilik">

<!-- Dekoratif resim -->
<img src="decorative.jpg" alt="" role="presentation">`,
        explanation: 'Alt metni, ekran okuyucu kullanıcıların resimlerin içeriğini anlaması için gereklidir. Her içeriksel resmin ne olduğunu açıklayan bir alt metni olmalıdır. Yalnızca dekoratif resimler (içerik değeri olmayan) boş alt metni (alt="") ile işaretlenmelidir. Alt metni olmayan resimler, ekran okuyucular tarafından ya dosya adıyla okunur (kötü kullanıcı deneyimi) ya da tamamen atlanır - bu da içeriğin bir kısmının görme engelli kullanıcılara iletilmemesi anlamına gelir.',
        reference: 'https://www.w3.org/WAI/tutorials/images/',
        category: 'Erişilebilirlik'
      });
    } else if (hasAltCount === allImages.length) {
      successes.push({
        field: 'img-alt',
        message: `Tüm resimler (${allImages.length} adet) alt özniteliği içeriyor.`,
        impact: 'high positive'
      });
    }
    
    // Alt metni kalitesi kontrolü
    const suspiciousAlt: any[] = [];
    allImages.each((_, img) => {
      const alt = $(img).attr('alt');
      if (alt && alt.length > 0) {
        // Aşağıdaki durumlar kalitesiz alt metin olabilir
        if (
          alt.toLowerCase().includes('resim') || 
          alt.toLowerCase().includes('image') || 
          alt.toLowerCase().includes('picture') ||
          alt.toLowerCase().includes('photo') ||
          alt.toLowerCase().includes('fotoğraf') ||
          alt === 'img' ||
          alt.length < 5 ||
          /\.(jpg|jpeg|png|gif|webp)$/i.test(alt) // Dosya uzantısı içeriyor
        ) {
          suspiciousAlt.push(alt);
        }
      }
    });
    
    if (suspiciousAlt.length > 0 && suspiciousAlt.length <= 5) {
      issues.push({
        type: 'info',
        field: 'alt-quality',
        message: `${suspiciousAlt.length} resimde şüpheli alt metni var: "${suspiciousAlt.join('", "')}"`,
        suggestion: 'Alt metinlerini resmin içeriğini ve amacını açıklayacak şekilde iyileştirin.',
        impact: 'medium',
        difficulty: 'kolay',
        example: `<!-- Zayıf alt metni -->
<img src="chair.jpg" alt="resim">

<!-- İyi alt metni -->
<img src="chair.jpg" alt="Modern çalışma sandalyesi, ergonomik tasarım, siyah">`,
        explanation: 'Kaliteli alt metni, resmin içeriğini ve bağlamsal amacını açıklamalıdır. "resim", "fotoğraf" gibi genel terimler veya dosya uzantıları içeren alt metinleri, ekran okuyucu kullanıcılara resmin gerçek içeriği hakkında bilgi vermez. Her resim için, o resmin sayfadaki işlevini ve neyi gösterdiğini açıklayan, kısa ama açıklayıcı alt metinleri yazın.',
        reference: 'https://www.w3.org/WAI/tutorials/images/decision-tree/',
        category: 'Erişilebilirlik'
      });
    } else if (suspiciousAlt.length > 5) {
      issues.push({
        type: 'info',
        field: 'alt-quality',
        message: `${suspiciousAlt.length} resimde şüpheli alt metni var (örn. "resim", "image", çok kısa metin).`,
        suggestion: 'Alt metinlerini resmin içeriğini ve amacını açıklayacak şekilde iyileştirin.',
        impact: 'medium',
        difficulty: 'orta',
        example: `<!-- Zayıf -->
<img src="product.jpg" alt="Resim">

<!-- Daha iyi -->
<img src="product.jpg" alt="Kahve Fincanı - Seramik, 250ml, Mavi Desenli">`,
        explanation: 'Kaliteli alt metni, resmin içeriğini ve bağlamsal amacını açıklamalıdır. Genel terimler kullanmak yerine, resmin ne gösterdiğini ve sayfa bağlamındaki amacını belirtin. Bu, görme engelli kullanıcıların içeriği daha iyi anlamasını sağlar ve aynı zamanda resim yüklenemediğinde tüm kullanıcılar için daha iyi bir deneyim sunar.',
        reference: 'https://www.w3.org/WAI/tutorials/images/decision-tree/',
        category: 'Erişilebilirlik'
      });
    }
  }
  
  // SVG erişilebilirlik kontrolü
  const svgElements = $('svg');
  let svgWithoutTitle = 0;
  let svgWithoutAriaLabel = 0;
  
  svgElements.each((_, svg) => {
    const hasTitle = $(svg).find('title').length > 0;
    const hasAriaLabel = $(svg).attr('aria-label') !== undefined;
    const hasAriaLabelledby = $(svg).attr('aria-labelledby') !== undefined;
    
    if (!hasTitle) svgWithoutTitle++;
    if (!hasAriaLabel && !hasAriaLabelledby) svgWithoutAriaLabel++;
  });
  
  if (svgElements.length > 0 && (svgWithoutTitle > 0 || svgWithoutAriaLabel > 0)) {
    issues.push({
      type: 'info',
      field: 'svg-accessibility',
      message: `${svgElements.length} SVG elementinden ${svgWithoutTitle} tanesi title etiketi, ${svgWithoutAriaLabel} tanesi aria-label içermiyor.`,
      suggestion: 'SVG elementleri için erişilebilirlik sağlayın.',
      impact: 'medium',
      difficulty: 'orta',
      example: `<!-- Erişilebilir SVG -->
<svg aria-label="Facebook Logosu">
  <title>Facebook</title>
  <!-- SVG içeriği -->
</svg>

<!-- veya -->
<svg aria-labelledby="svg-title">
  <title id="svg-title">Facebook</title>
  <!-- SVG içeriği -->
</svg>`,
      explanation: 'SVG elementleri, ekran okuyucu erişilebilirliği için ek özniteliklere ihtiyaç duyar. <title> etiketi, SVG\'nin ne olduğunu tanımlarken, aria-label veya aria-labelledby öznitelikleri ekran okuyuculara bu bilgiyi iletir. Bu elementlerden en az birini her SVG\'ye eklemek, görme engelli kullanıcıların SVG içeriğini anlamasını sağlar.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/Graphics_Document',
      category: 'Erişilebilirlik'
    });
  } else if (svgElements.length > 0) {
    successes.push({
      field: 'svg-accessibility',
      message: `SVG elementleri (${svgElements.length} adet) erişilebilirlik öznitelikleri içeriyor.`,
      impact: 'medium positive'
    });
  }
  
  // --------- FORM ERİŞİLEBİLİRLİĞİ ANALİZİ ---------
  
  // Form elementleri kontrolü
  const formElements = $('form');
  const inputElements = $('input:not([type="hidden"]), select, textarea');
  const inputsWithLabels = $('input[id]:not([type="hidden"]), select[id], textarea[id]').filter((_, el) => {
    const id = $(el).attr('id');
    return $(`label[for="${id}"]`).length > 0;
  });
  
  const inputsWithAriaLabel = $('input[aria-label]:not([type="hidden"]), select[aria-label], textarea[aria-label]');
  const inputsWithAriaLabelledby = $('input[aria-labelledby]:not([type="hidden"]), select[aria-labelledby], textarea[aria-labelledby]');
  
  const totalAccessibleInputs = inputsWithLabels.length + inputsWithAriaLabel.length + inputsWithAriaLabelledby.length;
  
  if (inputElements.length > 0) {
    if (totalAccessibleInputs < inputElements.length) {
      const missingCount = inputElements.length - totalAccessibleInputs;
      issues.push({
        type: 'warning',
        field: 'form-labels',
        message: `${missingCount} form elemanı erişilebilir etiket içermiyor (toplam ${inputElements.length} elemanın %${Math.round((missingCount / inputElements.length) * 100)}'i).`,
        suggestion: 'Tüm form elemanları için label, aria-label veya aria-labelledby kullanın.',
        impact: 'high',
        difficulty: 'orta',
        example: `<!-- En iyi yöntem: label etiketi -->
<label for="name">Ad Soyad</label>
<input type="text" id="name" name="name">

<!-- Alternatif: aria-label -->
<input type="text" name="name" aria-label="Ad Soyad">

<!-- Alternatif: aria-labelledby -->
<h3 id="name-heading">Ad Soyad</h3>
<input type="text" name="name" aria-labelledby="name-heading">`,
        explanation: 'Form elemanları için erişilebilir etiketler, ekran okuyucu kullanıcıların bu alanların amacını anlamasını sağlar. Label etiketi hem görsel hem de ekran okuyucu kullanıcılar için en iyi çözümdür. Görsel etiket kullanılamadığında, aria-label veya aria-labelledby kullanılabilir. Etiketlenmemiş form elemanları, görme engelli kullanıcıların formları doldurmasını zorlaştırır ve genel erişilebilirliği düşürür.',
        reference: 'https://www.w3.org/WAI/tutorials/forms/labels/',
        category: 'Erişilebilirlik'
      });
    } else {
      successes.push({
        field: 'form-labels',
        message: `Tüm form elemanları (${inputElements.length} adet) erişilebilir etiketler içeriyor.`,
        impact: 'high positive'
      });
    }
    
    // Gerekli alan işaretlemesi kontrolü
    const requiredInputs = $('input[required], select[required], textarea[required]');
    const requiredWithAriaRequired = $('input[aria-required="true"], select[aria-required="true"], textarea[aria-required="true"]');
    
    if (requiredInputs.length > 0 && requiredInputs.length === requiredWithAriaRequired.length) {
      successes.push({
        field: 'required-fields',
        message: `Tüm gerekli alanlar (${requiredInputs.length} adet) doğru işaretlenmiş.`,
        impact: 'medium positive'
      });
    } else if (requiredInputs.length > 0 && requiredWithAriaRequired.length === 0) {
      issues.push({
        type: 'info',
        field: 'required-fields',
        message: `${requiredInputs.length} gerekli alan var, ancak hiçbiri aria-required ile işaretlenmemiş.`,
        suggestion: 'Gerekli alanlara aria-required="true" özniteliği ekleyin.',
        impact: 'low',
        difficulty: 'kolay',
        example: `<label for="email">E-posta (zorunlu)</label>
<input type="email" id="email" name="email" required aria-required="true">`,
        explanation: 'required özniteliği tarayıcı doğrulaması için kullanılır, ancak bazı eski ekran okuyucular bunu tanımayabilir. Ek olarak aria-required="true" kullanmak, en geniş ekran okuyucu desteğini sağlar ve kullanıcıların hangi alanların zorunlu olduğunu anlamalarına yardımcı olur.',
        reference: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-required',
        category: 'Erişilebilirlik'
      });
    }
    
    // Form validasyon mesajları kontrolü
    const formWithNovalidate = $('form[novalidate]');
    if (formElements.length > 0 && formWithNovalidate.length === 0 && !checkCustomValidation($)) {
      issues.push({
        type: 'info',
        field: 'form-validation',
        message: 'Formlar için erişilebilir özel hata mesajları tespit edilemedi.',
        suggestion: 'Erişilebilir form doğrulama mesajları için aria-describedby kullanın.',
        impact: 'medium',
        difficulty: 'orta',
        example: `<label for="password">Şifre</label>
<input type="password" id="password" aria-describedby="password-requirements">
<div id="password-requirements">En az 8 karakter, bir büyük harf ve bir rakam içermelidir.</div>

<!-- Hata durumunda -->
<label for="email">E-posta</label>
<input type="email" id="email" aria-invalid="true" aria-describedby="email-error">
<div id="email-error" role="alert">Geçerli bir e-posta adresi giriniz.</div>`,
        explanation: 'Erişilebilir form doğrulaması, hataları ve gereksinimleri ekran okuyucu kullanıcılara da iletmeyi gerektirir. aria-describedby, bir form elemanını açıklamayla ilişkilendirir. Hata durumunda, aria-invalid="true" eklenebilir ve hata mesajı role="alert" ile işaretlenebilir. Bu yaklaşım, tüm kullanıcıların form gereksinimlerini anlamasını ve hataları düzeltebilmesini sağlar.',
        reference: 'https://www.w3.org/WAI/tutorials/forms/notifications/',
        category: 'Erişilebilirlik'
      });
    }
  }
  
  // --------- BAĞLANTI VE GEZİNME ERİŞİLEBİLİRLİĞİ ---------
  
  // Link metni kontrolü
  const allLinks = $('a[href]');
  const emptyLinks = $('a[href]:empty');
  const imageOnlyLinks = $('a[href]:has(img:only-child):not([aria-label])').filter((_, link) => {
    const img = $(link).find('img');
    return img.length === 1 && !img.attr('alt') && $(link).text().trim() === '';
  });
  
  const suspiciousLinkTexts = ['tıkla', 'tıklayın', 'buraya tıkla', 'buraya tıklayın', 'burada', 'link', 'click', 'click here', 'here', 'read more', 'daha fazla', 'devamı', 'devamını oku'];
  
  const badTextLinks = allLinks.filter((_, link) => {
    const text = $(link).text().trim().toLowerCase();
    return text.length > 0 && suspiciousLinkTexts.some(suspiciousText => text === suspiciousText);
  });
  
  const problemLinks = emptyLinks.length + imageOnlyLinks.length + badTextLinks.length;
  
  if (problemLinks > 0) {
    issues.push({
      type: 'warning',
      field: 'link-text',
      message: `${problemLinks} bağlantıda erişilebilir metin sorunu tespit edildi (${emptyLinks.length} boş, ${imageOnlyLinks.length} yalnızca alt metni olmayan resim, ${badTextLinks.length} anlamsız metin).`,
      suggestion: 'Tüm bağlantılar için anlam ifade eden, açıklayıcı metinler kullanın.',
      impact: 'high',
      difficulty: 'orta',
      example: `<!-- Kötü örnek -->
<a href="makale.html">tıkla</a>
<a href="urun.html"><img src="urun.jpg"></a>

<!-- İyi örnek -->
<a href="makale.html">Makalenin tamamını oku: SEO için En İyi Uygulamalar</a>
<a href="urun.html"><img src="urun.jpg" alt="Pamuklu Mavi Gömlek"></a>

<!-- Veya -->
<a href="urun.html" aria-label="Pamuklu Mavi Gömlek - Ürün Detayı">
  <img src="urun.jpg" alt="">
</a>`,
      explanation: 'Anlam ifade eden bağlantı metinleri, ekran okuyucu kullanıcıların bağlantının amacını anlamasını sağlar. "Tıkla", "burada" gibi kelimeler bağlantının nereye gittiği hakkında bilgi vermez. Ekran okuyucu kullanıcılar genellikle bir sayfadaki tüm bağlantıları listeler, bu nedenle her bağlantının bağlamından bağımsız olarak anlaşılabilir olması gerekir. Görüntü içeren bağlantılarda, görüntünün alt metni veya bağlantının aria-label özniteliği olmalıdır.',
      reference: 'https://www.w3.org/WAI/tips/writing/#write-meaningful-link-text',
      category: 'Erişilebilirlik'
    });
  } else if (allLinks.length > 0) {
    successes.push({
      field: 'link-text',
      message: `Tüm bağlantılar (${allLinks.length} adet) erişilebilir metin içeriyor.`,
      impact: 'high positive'
    });
  }
  
  // Geçiş bağlantıları kontrolü
  const skipLink = $('a[href^="#"]:contains("geç"), a[href^="#"]:contains("atla"), a[href^="#"]:contains("skip"), a[href^="#"]:contains("içeriğe")');
  
  if (skipLink.length === 0 && allLinks.length > 20) {
    issues.push({
      type: 'info',
      field: 'skip-link',
      message: 'Sayfada içeriğe geçiş bağlantısı (skip to content) yok.',
      suggestion: 'Sayfa başına, tekrarlayan içeriği atlayan bir geçiş bağlantısı ekleyin.',
      impact: 'medium',
      difficulty: 'kolay',
      example: `<body>
  <a href="#main-content" class="skip-link">İçeriğe Geç</a>
  <!-- Header, menü vb. -->
  <main id="main-content">
    <!-- Sayfa ana içeriği -->
  </main>
</body>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px;
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}
</style>`,
      explanation: 'İçeriğe geçiş bağlantısı, klavye kullanıcılarının tekrarlayan gezinme menülerini atlamasına ve doğrudan ana içeriğe erişmesine olanak tanır. Bu, özellikle klavye ve ekran okuyucu kullanıcıları için çok değerlidir, çünkü her sayfada aynı menü öğelerini tekrar tekrar geçmek zorunda kalmazlar. Skip link genellikle sayfanın en üstüne yerleştirilir ve sadece klavye odağı aldığında görünür hale gelir.',
      reference: 'https://www.w3.org/WAI/WCAG21/Techniques/general/G1',
      category: 'Erişilebilirlik'
    });
  } else if (skipLink.length > 0) {
    successes.push({
      field: 'skip-link',
      message: 'Sayfada içeriğe geçiş bağlantısı (skip to content) mevcut.',
      impact: 'medium positive'
    });
  }
  
  // --------- KLAVYE ERİŞİLEBİLİRLİĞİ ---------
  
  // Tabindex kontrolü
  const negativeTabindex = $('[tabindex^="-"]');
  const highTabindex = $('[tabindex]').filter((_, el) => {
    const tabindex = parseInt($(el).attr('tabindex') || '0', 10);
    return tabindex > 0;
  });
  
  if (highTabindex.length > 0) {
    issues.push({
      type: 'warning',
      field: 'tabindex',
      message: `${highTabindex.length} element pozitif tabindex değeri kullanıyor.`,
      suggestion: 'Pozitif tabindex değerlerinden (1 ve üzeri) kaçının.',
      impact: 'medium',
      difficulty: 'kolay',
      example: `<!-- Sorunlu -->
<button tabindex="1">İlk Buton</button>
<button tabindex="2">İkinci Buton</button>

<!-- İyi Uygulama -->
<button>İlk Buton</button>
<button>İkinci Buton</button>

<!-- Gerekirse -->
<div tabindex="0" role="button">Etkileşimli Öğe</div>
<div tabindex="-1">Programatik Odak İçin</div>`,
      explanation: 'Pozitif tabindex değerleri (1, 2, vb.), dokümanın doğal odaklanma sırasını bozar ve bakımı zor bir özel odaklanma sırası oluşturur. Bu, klavye kullanıcıları için kafa karıştırıcı olabilir ve sayfanın mantıksal akışını bozabilir. tabindex="0" bir elementi doğal odaklanma sırasına ekler, tabindex="-1" ise elementi sadece JavaScript ile odaklanabilir hale getirir. Mümkün olduğunca doğal HTML odaklanma sırasını koruyun.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex',
      category: 'Erişilebilirlik'
    });
  }
  
  // Klavye tuzakları kontrolü (sınırlı statik analiz)
  const potentialKeyboardTraps = $('dialog:not([role="dialog"]):not([aria-modal])');
  if (potentialKeyboardTraps.length > 0) {
    issues.push({
      type: 'info',
      field: 'keyboard-trap',
      message: 'Potansiyel klavye tuzağı olabilecek dialog elementi tespit edildi.',
      suggestion: 'Dialog elementlerine uygun ARIA rolü ve öznitelikleri ekleyin.',
      impact: 'medium',
      difficulty: 'orta',
      example: `<!-- İyi Uygulama -->
<dialog role="dialog" aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">Dialog Başlığı</h2>
  <!-- İçerik -->
  <button autofocus>Tamam</button>
  <button>İptal</button>
</dialog>

<script>
  // ESC tuşunu işleyin
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dialog.close();
    }
  });
</script>`,
      explanation: 'Dialog, modal ve benzeri arayüz elementleri, uygun şekilde uygulanmazsa klavye kullanıcıları için "tuzak" oluşturabilir. Erişilebilir bir modal dialog: (1) aria-modal="true" ve role="dialog" içermeli, (2) açıldığında odağı içine almalı, (3) ESC tuşu ile kapatılabilmeli, (4) kapatıldığında odağı önceki elemente geri döndürmeli ve (5) dialog içinde focus trap uygulamalıdır (focus son elementten sonra ilk elemente geri dönmeli).',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/dialog_role',
      category: 'Erişilebilirlik'
    });
  }
  
  // --------- DİNAMİK İÇERİK ERİŞİLEBİLİRLİĞİ ---------
  
  // ARIA canlı bölgeleri kontrolü
  const liveRegions = $('[aria-live]');
  const usesAriaExpanded = $('[aria-expanded]').length > 0;
  const usesAriaHidden = $('[aria-hidden]').length > 0;
  
  // Açılır menüler için erişilebilirlik kontrolü
  const dropdowns = $('.dropdown, .menu, .submenu, [class*="dropdown"], [class*="menu"]').filter((_, el) => {
    // Muhtemel açılır menüleri bulmaya çalış
    const hasChildList = $(el).find('ul, ol').length > 0;
    const hasToggleButton = $(el).find('button, [role="button"]').length > 0;
    return hasChildList && hasToggleButton;
  });
  
  if (dropdowns.length > 0 && !usesAriaExpanded) {
    issues.push({
      type: 'info',
      field: 'aria-expanded',
      message: 'Potansiyel açılır menüler tespit edildi, ancak aria-expanded özniteliği kullanılmıyor.',
      suggestion: 'Açılır menüler için aria-expanded özniteliği kullanın.',
      impact: 'medium',
      difficulty: 'orta',
      example: `<nav>
  <button aria-expanded="false" aria-controls="dropdown-menu">
    Menü
    <span class="icon" aria-hidden="true">▼</span>
  </button>
  <ul id="dropdown-menu" hidden>
    <li><a href="#">Ana Sayfa</a></li>
    <li><a href="#">Hakkımızda</a></li>
    <li><a href="#">İletişim</a></li>
  </ul>
</nav>

<script>
  const button = document.querySelector('button');
  const menu = document.getElementById('dropdown-menu');
  
  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', !expanded);
    menu.hidden = expanded;
  });
</script>`,
      explanation: 'aria-expanded özniteliği, bir menü veya bölümün açık mı kapalı mı olduğunu ekran okuyuculara bildirir. Bu, klavye ve ekran okuyucu kullanıcılarının açılır menülerin durumunu anlamasını sağlar. Ayrıca, aria-controls özniteliği kontrol edilen elementin ID\'sini belirtir. Bu öznitelikler, ekran okuyucu kullanıcıların dinamik içeriği anlamasına yardımcı olur ve herkesin gezinme deneyimini iyileştirir.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-expanded',
      category: 'Erişilebilirlik'
    });
  }
  
  if (formElements.length > 0 && liveRegions.length === 0) {
    issues.push({
      type: 'info',
      field: 'live-regions',
      message: 'Sayfada aria-live bölgeleri tespit edilmedi.',
      suggestion: 'Dinamik içerik değişiklikleri için aria-live bölgeleri kullanın.',
      impact: 'medium',
      difficulty: 'orta',
      example: `<!-- Form gönderim durumu -->
<div class="status" aria-live="polite" role="status"></div>

<!-- Form hatası -->
<div class="errors" aria-live="assertive" role="alert"></div>

<script>
  // Form gönderildikten sonra
  document.querySelector('.status').textContent = 'Form başarıyla gönderildi.';
  
  // Form hatası oluştuğunda
  document.querySelector('.errors').textContent = 'Lütfen gerekli alanları doldurun.';
</script>`,
      explanation: 'aria-live bölgeleri, sayfa içeriğinde dinamik değişiklikler olduğunda ekran okuyucuların kullanıcıları bilgilendirmesini sağlar. "polite" değeri, ekran okuyucunun mevcut okumayı bitirdikten sonra kullanıcıyı bilgilendireceği anlamına gelir. "assertive" ise, mevcut okumayı kesip hemen kullanıcıyı bilgilendirir (sadece önemli bildirimler için kullanılmalıdır). Form gönderimlerinde, hata mesajlarında ve sayfa içeriğinin JavaScript ile güncellendiği yerlerde aria-live bölgeleri kullanmak, erişilebilirliği önemli ölçüde artırır.',
      reference: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions',
      category: 'Erişilebilirlik'
    });
  }
  
  // --------- RENK VE GÖRSEL ERİŞİLEBİLİRLİK ---------
  
  // Kontrast analizi sınırlı (tam analiz için CSS işleme gerekli)
  const inlineStyles = $('[style*="color"], [style*="background"]');
  const hasCSSColors = inlineStyles.length > 0;
  
  if (hasCSSColors) {
    issues.push({
      type: 'info',
      field: 'color-contrast',
      message: 'Sayfada inline stil renkleri tespit edildi; kontrast oranı manuel olarak kontrol edilmelidir.',
      suggestion: 'Metin ve arka plan renkleri arasında en az 4.5:1 kontrast oranı sağlayın.',
      impact: 'medium',
      difficulty: 'orta',
      example: `/* Yetersiz kontrast */
.low-contrast {
  color: #aaa;
  background-color: #eee;
}

/* Yeterli kontrast */
.good-contrast {
  color: #333;
  background-color: #fff;
}`,
      explanation: 'Renk kontrastı, metin okunabilirliği için çok önemlidir. WCAG 2.1 AA standardına göre, normal metin için en az 4.5:1, büyük metin (18pt veya 14pt kalın) için en az 3:1 kontrast oranı gereklidir. İyi kontrast, görme zorluğu olan kullanıcılar ve parlak ışık altında sayfanızı görüntüleyen herkes için kritik öneme sahiptir. Kontrast oranını kontrol etmek için WebAIM Contrast Checker gibi araçlar kullanabilirsiniz.',
      reference: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
      category: 'Erişilebilirlik'
    });
  }
  
  // Renk bağımlılığı kontrolü (sınırlı)
  const colorOnlyInstructions = $('p, span, div').filter((_, el) => {
    const text = $(el).text().toLowerCase();
    return (
      (text.includes('kırmızı') || text.includes('yeşil') || text.includes('mavi') || text.includes('renk')) && 
      (text.includes('tıklayın') || text.includes('seçin') || text.includes('kullanın'))
    );
  });
  
  if (colorOnlyInstructions.length > 0) {
    issues.push({
      type: 'info',
      field: 'color-dependence',
      message: 'Potansiyel renk bağımlı talimatlar tespit edildi.',
      suggestion: 'Bilgiyi iletmek için sadece renge güvenmeyin.',
      impact: 'medium',
      difficulty: 'orta',
      example: `<!-- Sorunlu -->
<p>Ürünü satın almak için yeşil butona tıklayın.</p>

<!-- İyi Uygulama -->
<p>Ürünü satın almak için "Satın Al" butonuna tıklayın.</p>

<!-- veya -->
<p>Ürünü satın almak için yeşil renkli "Satın Al" butonuna tıklayın.</p>`,
      explanation: 'Bilgi iletmek için sadece renge güvenmek, renk körlüğü olan kullanıcılar için sorun yaratır. Dünya nüfusunun yaklaşık %8\'i (erkeklerin %8\'i, kadınların %0.5\'i) bir tür renk körlüğüne sahiptir. Rengin yanı sıra metinsel etiketler, simgeler veya desenler kullanarak bilgiyi birden fazla şekilde iletmek, erişilebilirliği artırır ve tüm kullanıcılar için daha iyi bir deneyim sağlar.',
      reference: 'https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html',
      category: 'Erişilebilirlik'
    });
  }
  
  // --------- ÖZET VE GENEL ERİŞİLEBİLİRLİK DEĞERLENDİRMESİ ---------
  
  // Genel erişilebilirlik puanı hesaplama (basit bir hesaplama)
  let a11yScore = 0;
  let maxScore = 0;
  
  // Kritik faktörlerin skorlara katkısı
  if (hasLangAttr) a11yScore += 10; maxScore += 10;
  if (h1Count > 0) a11yScore += 5; maxScore += 5;
  if (headingsInOrder) a11yScore += 5; maxScore += 5;
  if (landmarkElements.main > 0 || ariaLandmarks.main > 0) a11yScore += 10; maxScore += 10;
  if (allImages.length > 0) {
    maxScore += 10;
    a11yScore += 10 * (allImages.length - imagesWithoutAlt.length) / allImages.length;
  }
  if (inputElements.length > 0) {
    maxScore += 10;
    a11yScore += 10 * totalAccessibleInputs / inputElements.length;
  }
  if (allLinks.length > 0) {
    maxScore += 10;
    a11yScore += 10 * (allLinks.length - problemLinks) / allLinks.length;
  }
  
  const finalScore = maxScore > 0 ? Math.round((a11yScore / maxScore) * 100) : 0;
  
  // Sonuçları ekle
  if (finalScore >= 80) {
    successes.push({
      field: 'a11y-score',
      message: `Erişilebilirlik Puanı: ${finalScore}/100 - İyi`,
      impact: 'high positive'
    });
  } else if (finalScore >= 60) {
    successes.push({
      field: 'a11y-score',
      message: `Erişilebilirlik Puanı: ${finalScore}/100 - Orta`,
      impact: 'medium positive'
    });
  } else {
    issues.push({
      type: 'warning',
      field: 'a11y-score',
      message: `Erişilebilirlik Puanı: ${finalScore}/100 - İyileştirme gerekli`,
      suggestion: 'Yukarıdaki erişilebilirlik sorunlarını giderin.',
      impact: 'high',
      difficulty: 'değişken',
      example: '',
      explanation: 'Düşük erişilebilirlik puanı, sitenizin bazı kullanıcılar için kullanımının zor olabileceğini gösterir. Erişilebilir web siteleri, tüm kullanıcılara eşit erişim sağlar, SEO performansını iyileştirebilir ve yasal uyumluluk sağlayabilir (birçok ülkede kamu web siteleri için erişilebilirlik gereksinimleri vardır).',
      reference: 'https://www.w3.org/WAI/fundamentals/accessibility-intro/',
      category: 'Erişilebilirlik'
    });
  }
  
  return { issues, successes };
  
  // --------- YARDIMCI FONKSİYONLAR ---------
  
  // Başlık hiyerarşisi kontrolü
  function checkHeadingOrder($: CheerioAPI): boolean {
    const headings = $('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    let isOrdered = true;
    
    headings.each((_, el) => {
      const level = parseInt(el.tagName.substring(1), 10);
      
      // İlk başlık seviyesi sıfırdan büyük olmalı
      if (lastLevel === 0) {
        lastLevel = level;
        return;
      }
      
      // Başlık seviyeleri en fazla bir seviye atlayabilir (h2'den h4'e geçiş hatalı)
      if (level > lastLevel && level - lastLevel > 1) {
        isOrdered = false;
      }
      
      lastLevel = level;
    });
    
    return isOrdered;
  }
  
  // Özel form validasyon kontrolü
  function checkCustomValidation($: CheerioAPI): boolean {
    // aria-describedby kullanılan input'lar
    const inputsWithDescribedby = $('input[aria-describedby]').length > 0;
    
    // aria-invalid kullanan form elemanları
    const elementsWithAriaInvalid = $('[aria-invalid]').length > 0;
    
    // Alert role ile işaretlenmiş elementler (genellikle form hataları için)
    const alerts = $('[role="alert"]').length > 0;
    
    return inputsWithDescribedby || elementsWithAriaInvalid || alerts;
  }
}

// --- Kapsamlı Sosyal Medya ve Paylaşılabilirlik Analizi ---
async function analyzeSocialImages($: CheerioAPI, url: string): Promise<{ issues: SEOIssue[]; successes: SEOSuccess[] }> {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  
  // --------- META VERİLERİN TOPLANMASI ---------
  
  // Sayfa URL'i için temel bilgiler
  const pageUrl = url;
  const domain = new URL(url).hostname;
  
  // Temel sayfa bilgileri (karşılaştırma için)
  const pageTitle = $('title').text().trim();
  const pageDescription = $('meta[name="description"]').attr('content')?.trim() || '';
  
  // --------- OPEN GRAPH META ETİKETLERİ ANALİZİ ---------
  
  const ogTags = {
    title: $('meta[property="og:title"]').attr('content')?.trim(),
    description: $('meta[property="og:description"]').attr('content')?.trim(),
    image: $('meta[property="og:image"]').attr('content')?.trim(),
    url: $('meta[property="og:url"]').attr('content')?.trim(),
    type: $('meta[property="og:type"]').attr('content')?.trim(),
    siteName: $('meta[property="og:site_name"]').attr('content')?.trim(),
    locale: $('meta[property="og:locale"]').attr('content')?.trim(),
    // İleri düzey OG etiketleri
    imageWidth: $('meta[property="og:image:width"]').attr('content')?.trim(),
    imageHeight: $('meta[property="og:image:height"]').attr('content')?.trim(),
    imageAlt: $('meta[property="og:image:alt"]').attr('content')?.trim(),
    videoUrl: $('meta[property="og:video"]').attr('content')?.trim(),
    videoSecureUrl: $('meta[property="og:video:secure_url"]').attr('content')?.trim(),
    videoType: $('meta[property="og:video:type"]').attr('content')?.trim(),
    videoWidth: $('meta[property="og:video:width"]').attr('content')?.trim(),
    videoHeight: $('meta[property="og:video:height"]').attr('content')?.trim()
  };
  
  // --------- TWITTER CARD META ETİKETLERİ ANALİZİ ---------
  
  const twitterTags = {
    card: $('meta[name="twitter:card"]').attr('content')?.trim(),
    title: $('meta[name="twitter:title"]').attr('content')?.trim(),
    description: $('meta[name="twitter:description"]').attr('content')?.trim(),
    image: $('meta[name="twitter:image"]').attr('content')?.trim(),
    imageAlt: $('meta[name="twitter:image:alt"]').attr('content')?.trim(),
    site: $('meta[name="twitter:site"]').attr('content')?.trim(),
    creator: $('meta[name="twitter:creator"]').attr('content')?.trim(),
    player: $('meta[name="twitter:player"]').attr('content')?.trim(),
    playerWidth: $('meta[name="twitter:player:width"]').attr('content')?.trim(),
    playerHeight: $('meta[name="twitter:player:height"]').attr('content')?.trim()
  };
  
  // --------- DİĞER SOSYAL MEDYA META ETİKETLERİ ---------
  
  const facebookTags = {
    appId: $('meta[property="fb:app_id"]').attr('content')?.trim(),
    admins: $('meta[property="fb:admins"]').attr('content')?.trim(),
  };
  
  const pinterestTags = {
    pin: $('meta[name="pinterest-rich-pin"]').attr('content')?.trim(),
    description: $('meta[name="pinterest:description"]').attr('content')?.trim(),
    image: $('meta[name="pinterest:image"]').attr('content')?.trim(),
  };
  
  const linkedInTags = {
    title: $('meta[name="linkedin:title"]').attr('content')?.trim() || ogTags.title,
    description: $('meta[name="linkedin:description"]').attr('content')?.trim() || ogTags.description,
    image: $('meta[name="linkedin:image"]').attr('content')?.trim() || ogTags.image
  };
  
  // --------- TEMEL META ETİKETLERİNİN VARLIK KONTROLÜ ---------
  
  // Open Graph Zorunlu Etiketleri Kontrolü
  const requiredOgTags = ['title', 'description', 'image', 'url'] as const;
  const missingOgTags = requiredOgTags.filter(tag => !ogTags[tag]);
  
  if (missingOgTags.length > 0) {
    issues.push({
      type: 'warning',
      field: 'og-required-tags',
      message: `Zorunlu Open Graph etiketleri eksik: ${missingOgTags.join(', ')}.`,
      suggestion: 'Tüm zorunlu Open Graph etiketlerini ekleyin.',
      impact: 'high',
      difficulty: 'kolay',
      example: missingOgTags.map(tag => `<meta property="og:${tag}" content="${getRecommendedValue(tag, pageTitle, pageDescription, pageUrl)}">`).join('\n'),
      explanation: 'Open Graph protokolü, içeriğinizin sosyal medyada paylaşıldığında nasıl görüneceğini belirlemenize olanak tanır. Temel og: etiketleri, Facebook, LinkedIn, Pinterest ve diğer platformlarda paylaşımların zengin önizlemelerle görüntülenmesini sağlar. Bu etiketler olmadan, içeriğiniz paylaşıldığında basit bir bağlantıdan ibaret olabilir veya platformlar sayfa içeriğinden tahminler yapabilir.',
      reference: 'https://ogp.me/',
      category: 'Sosyal Medya Optimizasyonu'
    });
  } else {
    successes.push({
      field: 'og-required-tags',
      message: 'Tüm zorunlu Open Graph etiketleri mevcut.',
      impact: 'high positive'
    });
  }
  
  // Twitter Card Etiketleri Kontrolü
  if (!twitterTags.card) {
    issues.push({
      type: 'warning',
      field: 'twitter-card',
      message: 'Twitter Card etiketi (twitter:card) eksik.',
      suggestion: 'Twitter Card etiketi ekleyin.',
      impact: 'medium',
      difficulty: 'kolay',
      example: '<meta name="twitter:card" content="summary_large_image">',
      explanation: 'Twitter Card etiketi, içeriğinizin Twitter\'da paylaşıldığında nasıl görüneceğini belirler. Bu etiket olmadan, Twitter\'da paylaşımlar basit bir bağlantı olarak görüntülenir. "summary_large_image" genellikle içerik paylaşımları için en etkili seçenektir ve büyük bir görsel önizleme sunar.',
      reference: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards',
      category: 'Sosyal Medya Optimizasyonu'
    });
  } else if (['summary', 'summary_large_image', 'app', 'player'].includes(twitterTags.card)) {
    successes.push({
      field: 'twitter-card',
      message: `Twitter Card tipi tanımlanmış: ${twitterTags.card}`,
      impact: 'medium positive'
    });
  }
  
  // Twitter ve OG eksiklikleri kontrolü (Twitter'da OG'ye fallback)
  if (!twitterTags.title && ogTags.title) {
    successes.push({
      field: 'twitter-fallback',
      message: 'Twitter başlık etiketi eksik, ancak Open Graph başlık etiketi mevcut (fallback olarak kullanılabilir).',
      impact: 'low positive'
    });
  }
  
  if (!twitterTags.image && ogTags.image) {
    successes.push({
      field: 'twitter-image-fallback',
      message: 'Twitter görsel etiketi eksik, ancak Open Graph görsel etiketi mevcut (fallback olarak kullanılabilir).',
      impact: 'low positive'
    });
  }
  
  // --------- GÖRSEL ERİŞİLEBİLİRLİK VE KALİTE KONTROLÜ ---------
  
  // OG Image Erişilebilirlik Kontrolü
  if (ogTags.image) {
    const ogImageUrl = makeAbsoluteUrl(ogTags.image, pageUrl);
    
    try {
      const res = await axios.get(ogImageUrl, { 
        timeout: 5000,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEO-Analyzer/1.0; +http://example.com)'
        }
      });
      
      if (res.status === 200) {
        // Görsel meta verilerini analiz et
        const imageData = {
          size: res.data.length,
          contentType: res.headers['content-type'],
        };
        
        // Görsel boyutunu değerlendir
        if (imageData.size < 10240) {  // 10KB'dan küçük
          issues.push({
            type: 'info',
            field: 'og-image-size',
            message: `Open Graph görseli çok küçük (${formatBytes(imageData.size)}).`,
            suggestion: 'Daha yüksek kaliteli/çözünürlüklü bir görsel kullanın.',
            impact: 'low',
            difficulty: 'kolay',
            example: '',
            explanation: 'Çok küçük dosya boyutuna sahip görseller genellikle düşük kalitede görünür. Sosyal medya paylaşımlarında daha etkili olması için en az 30KB-100KB boyutunda görseller önerilir (aşırı sıkıştırma olmadan).',
            reference: 'https://developers.facebook.com/docs/sharing/webmasters/images/',
            category: 'Sosyal Medya Optimizasyonu'
          });
        } else if (imageData.size > 5242880) {  // 5MB'dan büyük
          issues.push({
            type: 'info',
            field: 'og-image-large',
            message: `Open Graph görseli çok büyük (${formatBytes(imageData.size)}).`,
            suggestion: 'Görseli optimize edin, sosyal paylaşım için 1MB altı önerilir.',
            impact: 'low',
            difficulty: 'kolay',
            example: '',
            explanation: 'Çok büyük görseller yüklenmesi yavaş olabilir ve bazı platformlarda sorun çıkarabilir. Sosyal medya paylaşımları için görselleri 1MB altında tutmak iyi bir uygulamadır.',
            reference: 'https://developers.facebook.com/docs/sharing/webmasters/images/',
            category: 'Sosyal Medya Optimizasyonu'
          });
        } else {
          successes.push({
            field: 'og-image-size',
            message: `Open Graph görseli uygun boyutta (${formatBytes(imageData.size)}).`,
            impact: 'low positive'
          });
        }
        
        // Görsel tipini değerlendir
        if (imageData.contentType) {
          const isOptimalFormat = ['image/jpeg', 'image/png', 'image/webp'].includes(imageData.contentType);
          if (!isOptimalFormat) {
            issues.push({
              type: 'info',
              field: 'og-image-format',
              message: `Open Graph görseli optimal format değil (${imageData.contentType}).`,
              suggestion: 'JPEG, PNG veya WebP formatı kullanın.',
              impact: 'low',
              difficulty: 'kolay',
              example: '',
              explanation: "JPEG, PNG ve WebP formatları tüm sosyal medya platformlarında en iyi şekilde desteklenir. GIF'ler hareketli içerik için kullanılabilir, ancak diğer formatlar önerilmez.",
              reference: 'https://developers.facebook.com/docs/sharing/webmasters/images/',
              category: 'Sosyal Medya Optimizasyonu'
            });
          } else {
            successes.push({
              field: 'og-image-format',
              message: `Open Graph görseli optimal formatta (${imageData.contentType}).`,
              impact: 'low positive'
            });
          }
        }
        
        // Görsel boyutlarını kontrol et (eğer width/height belirtilmişse)
        if (ogTags.imageWidth && ogTags.imageHeight) {
          const width = parseInt(ogTags.imageWidth);
          const height = parseInt(ogTags.imageHeight);
          
          if (width < 600 || height < 315) {
            issues.push({
              type: 'info',
              field: 'og-image-dimensions',
              message: `Open Graph görseli önerilen boyutlardan küçük (${width}x${height}).`,
              suggestion: 'En az 1200x630 boyutunda bir görsel kullanın.',
              impact: 'medium',
              difficulty: 'orta',
              example: `<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">`,
              explanation: 'Facebook ve diğer sosyal medya platformları için önerilen en düşük görsel boyutu 1200x630 pikseldir. Daha küçük görseller, platformlar tarafından düşük kalitede gösterilebilir veya küçük önizlemelerle sınırlandırılabilir.',
              reference: 'https://developers.facebook.com/docs/sharing/webmasters/images/',
              category: 'Sosyal Medya Optimizasyonu'
            });
          } else if (width < 1200 || height < 630) {
            issues.push({
              type: 'info',
              field: 'og-image-dimensions',
              message: `Open Graph görseli minimum boyuta uygun ancak optimal değil (${width}x${height}).`,
              suggestion: 'Optimal paylaşım için 1200x630 veya daha büyük boyutta bir görsel kullanın.',
              impact: 'low',
              difficulty: 'orta',
              example: '',
              explanation: 'Sosyal medya platformları için optimal görsel boyutu genellikle 1200x630 pikseldir. Bu boyut, hem masaüstü hem de mobil cihazlarda yüksek kaliteli önizlemeler sağlar.',
              reference: 'https://developers.facebook.com/docs/sharing/webmasters/images/',
              category: 'Sosyal Medya Optimizasyonu'
            });
          } else if (width / height < 1.6 || width / height > 2.2) {
            issues.push({
              type: 'info',
              field: 'og-image-ratio',
              message: `Open Graph görselinin en-boy oranı optimal değil (${(width/height).toFixed(2)}).`,
              suggestion: 'İdeal oran 1.91:1 (1200x630 gibi) olmalıdır.',
              impact: 'low',
              difficulty: 'orta',
              example: '',
              explanation: 'Sosyal medya platformları genellikle 1.91:1 en-boy oranına sahip görselleri en iyi şekilde görüntüler. Bu oran dışındaki görseller kırpılabilir veya boşluklarla gösterilebilir.',
              reference: 'https://developers.facebook.com/docs/sharing/webmasters/images/',
              category: 'Sosyal Medya Optimizasyonu'
            });
          } else {
            successes.push({
              field: 'og-image-dimensions',
              message: `Open Graph görseli optimal boyutta (${width}x${height}, oran: ${(width/height).toFixed(2)}).`,
              impact: 'medium positive'
            });
          }
        } else {
          // Görsel boyutları belirtilmemiş
          issues.push({
            type: 'info',
            field: 'og-image-dimensions-missing',
            message: 'Open Graph görsel boyutları (og:image:width, og:image:height) belirtilmemiş.',
            suggestion: 'Görsel boyutlarını meta etiketlerine ekleyin.',
            impact: 'low',
            difficulty: 'kolay',
            example: `<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">`,
            explanation: 'Görsel boyutlarını belirtmek, sosyal medya platformlarının görseli doğru şekilde işlemesine yardımcı olur ve sayfa yüklenme hızını artırabilir çünkü platform görselin boyutlarını önceden bilebilir.',
            reference: 'https://ogp.me/#structured',
            category: 'Sosyal Medya Optimizasyonu'
          });
        }
        
        successes.push({
          field: 'og-image',
          message: 'Open Graph görseli erişilebilir durumda.',
          impact: 'high positive'
        });
        
      } else {
        issues.push({
          type: 'warning',
          field: 'og-image',
          message: `Open Graph görseline erişilemiyor (HTTP ${res.status}).`,
          suggestion: 'Görsel URL\'sini kontrol edin ve erişilebilir olduğundan emin olun.',
          impact: 'high',
          difficulty: 'orta',
          example: '',
          explanation: 'Sosyal medya platformları, erişilemeyen görselleri gösteremez. Bu, içeriğinizin paylaşıldığında görsel içermemesine veya varsayılan bir görüntü ile gösterilmesine neden olabilir.',
          reference: 'https://developers.facebook.com/docs/sharing/webmasters/images/',
          category: 'Sosyal Medya Optimizasyonu'
        });
      }
    } catch (error) {
      issues.push({
        type: 'warning',
        field: 'og-image-error',
        message: `Open Graph görseline erişim hatası: ${getErrorMessage(error)}.`,
        suggestion: 'Görsel URL\'sini kontrol edin, geçerli ve erişilebilir olduğundan emin olun.',
        impact: 'high',
        difficulty: 'orta',
        example: `<meta property="og:image" content="https://${domain}/images/share-image.jpg">`,
        explanation: 'Sosyal medya platformları, erişilemeyen veya hatalı URL\'lerdeki görselleri gösteremez. URL\'nin doğru ve tam olduğundan (http/https dahil) ve görselin herkese açık olarak erişilebilir olduğundan emin olun.',
        reference: 'https://developers.facebook.com/docs/sharing/webmasters/images/',
        category: 'Sosyal Medya Optimizasyonu'
      });
    }
  }
  
  // Twitter Image Erişilebilirlik Kontrolü
  if (twitterTags.image) {
    const twitterImageUrl = makeAbsoluteUrl(twitterTags.image, pageUrl);
    
    try {
      const res = await axios.get(twitterImageUrl, { 
        timeout: 5000,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEO-Analyzer/1.0; +http://example.com)'
        }
      });
      
      if (res.status === 200) {
        // Twitter Card tipine göre önerilen boyutları kontrol et
        if (twitterTags.card === 'summary_large_image') {
          // Görsel minimum boyutları: En az 300x157 pixel, ideal olarak 1200x628
          // Bu işlem gerçek bir uygulamada image-size gibi kütüphanelerle yapılabilir
          // Burada sadece boyut kontrolü yapılıyor
          
          if (res.data.length < 20480) { // 20KB'dan küçük
            issues.push({
              type: 'info',
              field: 'twitter-image-size',
              message: `Twitter görseli çok küçük (${formatBytes(res.data.length)}).`,
              suggestion: 'Daha yüksek kaliteli bir görsel kullanın (en az 1200x628 piksel önerilir).',
              impact: 'medium',
              difficulty: 'kolay',
              example: '',
              explanation: 'Twitter Card türü "summary_large_image" için, görselin minimum 300x157 piksel, ideal olarak 1200x628 piksel olması önerilir. Çok küçük dosya boyutu, görselin düşük çözünürlükte olabileceğini gösterir.',
              reference: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/summary-card-with-large-image',
              category: 'Sosyal Medya Optimizasyonu'
            });
          }
        }
        
        successes.push({
          field: 'twitter-image',
          message: 'Twitter görseli erişilebilir durumda.',
          impact: 'high positive'
        });
      } else {
        issues.push({
          type: 'warning',
          field: 'twitter-image',
          message: `Twitter görseline erişilemiyor (HTTP ${res.status}).`,
          suggestion: 'Görsel URL\'sini kontrol edin ve erişilebilir olduğundan emin olun.',
          impact: 'high',
          difficulty: 'orta',
          example: '',
          explanation: 'Twitter, erişilemeyen görselleri Twitter Card\'ınızda gösteremez. Bu, içeriğinizin paylaşıldığında görsel içermemesine veya varsayılan bir görüntü ile gösterilmesine neden olabilir.',
          reference: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards',
          category: 'Sosyal Medya Optimizasyonu'
        });
      }
    } catch (error) {
      issues.push({
        type: 'warning',
        field: 'twitter-image-error',
        message: `Twitter görseline erişim hatası: ${getErrorMessage(error)}.`,
        suggestion: 'Görsel URL\'sini kontrol edin, geçerli ve erişilebilir olduğundan emin olun.',
        impact: 'high',
        difficulty: 'orta',
        example: `<meta name="twitter:image" content="https://${domain}/images/twitter-share.jpg">`,
        explanation: 'Twitter, erişilemeyen veya hatalı URL\'lerdeki görselleri gösteremez. URL\'nin doğru ve tam olduğundan (http/https dahil) ve görselin herkese açık olarak erişilebilir olduğundan emin olun.',
        reference: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards',
        category: 'Sosyal Medya Optimizasyonu'
      });
    }
  } else if (ogTags.image && !twitterTags.image) {
    // Twitter görseli yok ama OG görseli var - fallback çalışabilir ama açıkça belirtilmesi daha iyi
    issues.push({
      type: 'info',
      field: 'twitter-image-missing',
      message: 'Twitter için özel görsel tanımlanmamış, Open Graph görseline fallback yapılacak.',
      suggestion: 'Twitter için özel bir görsel tanımlayın.',
      impact: 'low',
      difficulty: 'kolay',
      example: `<meta name="twitter:image" content="${ogTags.image}">`,
      explanation: 'Twitter, twitter:image etiketi belirtilmediğinde Open Graph görselini kullanabilir. Ancak, Twitter için özel bir görsel tanımlamak daha iyi kontrol sağlar ve bazı durumlarda farklı en-boy oranları veya içerik türleri için optimize edilmiş görseller kullanmanıza olanak tanır.',
      reference: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup',
      category: 'Sosyal Medya Optimizasyonu'
    });
  }
  
  // --------- URL VE BAĞLANTI KONTROLÜ ---------
  
  // OG URL kontrolü
  if (ogTags.url) {
    const ogUrl = ogTags.url;
    
    // URL geçerli mi?
    try {
      new URL(ogUrl);
      
      // Canonical URL ile karşılaştır
      const canonicalUrl = $('link[rel="canonical"]').attr('href');
      if (canonicalUrl && canonicalUrl !== ogUrl) {
        issues.push({
          type: 'info',
          field: 'og-url-canonical',
          message: 'Open Graph URL ile canonical URL eşleşmiyor.',
          suggestion: 'og:url ve canonical URL\'nin aynı olması önerilir.',
          impact: 'low',
          difficulty: 'kolay',
          example: `<meta property="og:url" content="${canonicalUrl}">`,
          explanation: 'og:url etiketinin canonical URL ile aynı olması en iyi uygulamadır. Bu, sosyal medya paylaşımlarında doğru URL\'nin kullanılmasını sağlar ve içerik duplikasyonu sorunlarını önler.',
          reference: 'https://ogp.me/',
          category: 'Sosyal Medya Optimizasyonu'
        });
      } else {
        successes.push({
          field: 'og-url',
          message: 'Open Graph URL doğru tanımlanmış.',
          impact: 'medium positive'
        });
      }
    } catch {
      issues.push({
        type: 'warning',
        field: 'og-url-invalid',
        message: 'Open Graph URL geçersiz bir format içeriyor.',
        suggestion: 'Geçerli bir mutlak URL kullanın.',
        impact: 'medium',
        difficulty: 'kolay',
        example: `<meta property="og:url" content="${pageUrl}">`,
        explanation: 'og:url etiketi tam ve geçerli bir URL içermelidir (örn. https://example.com/page). Göreceli URL\'ler veya geçersiz formatlar kullanılmamalıdır.',
        reference: 'https://ogp.me/',
        category: 'Sosyal Medya Optimizasyonu'
      });
    }
  }
  
  // --------- META VERİ TUTARLILIĞI KONTROLÜ ---------
  
  // Title tutarlılığı kontrolü
  if (ogTags.title && pageTitle) {
    if (normalizeText(ogTags.title) !== normalizeText(pageTitle) && !ogTags.title.includes(pageTitle) && !pageTitle.includes(ogTags.title)) {
      issues.push({
        type: 'info',
        field: 'og-title-consistency',
        message: 'Open Graph başlığı ile sayfa başlığı çok farklı.',
        suggestion: 'Open Graph başlığı sayfanın gerçek içeriğini yansıtmalıdır.',
        impact: 'low',
        difficulty: 'kolay',
        example: `<meta property="og:title" content="${pageTitle}">`,
        explanation: 'Open Graph başlığının sayfa başlığıyla tamamen aynı olması gerekmez, ancak içeriği doğru bir şekilde yansıtması önemlidir. Çok farklı başlıklar kullanıcılarda kafa karışıklığına neden olabilir veya yanıltıcı paylaşımlar oluşturabilir.',
        reference: 'https://ogp.me/',
        category: 'Sosyal Medya Optimizasyonu'
      });
    } else {
      successes.push({
        field: 'og-title-consistency',
        message: 'Open Graph başlığı sayfa içeriği ile tutarlı.',
        impact: 'low positive'
      });
    }
  }
  
  // Description tutarlılığı kontrolü
  if (ogTags.description && pageDescription) {
    if (normalizeText(ogTags.description) !== normalizeText(pageDescription) && !isSubstantiallySimilar(ogTags.description, pageDescription)) {
      issues.push({
        type: 'info',
        field: 'og-description-consistency',
        message: 'Open Graph açıklaması meta description ile çok farklı.',
        suggestion: 'Open Graph açıklaması sayfanın gerçek içeriğini yansıtmalıdır.',
        impact: 'low',
        difficulty: 'kolay',
        example: `<meta property="og:description" content="${pageDescription}">`,
        explanation: 'Open Graph açıklamasının meta description ile tamamen aynı olması gerekmez, ancak içeriği doğru bir şekilde yansıtması önemlidir. Çok farklı açıklamalar kullanıcılar için tutarsız bir deneyim oluşturabilir.',
        reference: 'https://ogp.me/',
        category: 'Sosyal Medya Optimizasyonu'
      });
    } else {
      successes.push({
        field: 'og-description-consistency',
        message: 'Open Graph açıklaması sayfa içeriği ile tutarlı.',
        impact: 'low positive'
      });
    }
  }
  
  // Twitter ve OG tutarlılığı kontrolü
  if (twitterTags.title && ogTags.title) {
    if (!isSubstantiallySimilar(twitterTags.title, ogTags.title)) {
      issues.push({
        type: 'info',
        field: 'twitter-og-title-consistency',
        message: 'Twitter başlığı ile Open Graph başlığı farklı.',
        suggestion: 'Tutarlı bir sosyal medya deneyimi için başlıkları uyumlu hale getirin.',
        impact: 'low',
        difficulty: 'kolay',
        example: '',
        explanation: 'Twitter ve Open Graph başlıklarının benzer veya aynı olması, içeriğinizin farklı platformlarda tutarlı bir şekilde görüntülenmesini sağlar. Çok farklı başlıklar kullanmak bazı durumlarda stratejik olabilir, ancak genellikle tutarlılık tercih edilir.',
        reference: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup',
        category: 'Sosyal Medya Optimizasyonu'
      });
    }
  }
  
  // --------- İLERİ PAYLAŞIM ÖZELLİKLERİ KONTROLÜ ---------
  
  // Facebook App ID/Admins kontrolü
  if (!facebookTags.appId && !facebookTags.admins) {
    issues.push({
      type: 'info',
      field: 'facebook-app',
      message: 'Facebook App ID veya Admins tanımlanmamış.',
      suggestion: 'Facebook içerik paylaşım analitikleri için fb:app_id veya fb:admins ekleyin.',
      impact: 'low',
      difficulty: 'orta',
      example: '<meta property="fb:app_id" content="123456789012345">',
      explanation: 'fb:app_id veya fb:admins meta etiketleri, Facebook paylaşım istatistiklerini izlemenize ve Facebook Domain Insights\'a erişmenize olanak tanır. Ayrıca, Facebook\'un içeriğinizi daha iyi anlamasına yardımcı olur.',
      reference: 'https://developers.facebook.com/docs/sharing/webmasters/',
      category: 'Sosyal Medya Optimizasyonu'
    });
  } else {
    successes.push({
      field: 'facebook-app',
      message: 'Facebook App ID veya Admins tanımlanmış.',
      impact: 'low positive'
    });
  }
  
  // Twitter site/creator kontrolü
  if (!twitterTags.site && !twitterTags.creator) {
    issues.push({
      type: 'info',
      field: 'twitter-accounts',
      message: 'Twitter site veya creator tanımlanmamış.',
      suggestion: 'İçerik ile ilişkili Twitter hesaplarını belirtin.',
      impact: 'low',
      difficulty: 'kolay',
      example: `<meta name="twitter:site" content="@websitename">
<meta name="twitter:creator" content="@authorname">`,
      explanation: 'twitter:site ve twitter:creator meta etiketleri, içeriğin kaynağını ve yazarını belirtir. Bu etiketler, Twitter paylaşımlarında ilgili hesapların etiketlenmesini sağlar ve içeriğinizin güvenilirliğini artırır.',
      reference: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup',
      category: 'Sosyal Medya Optimizasyonu'
    });
  } else {
    successes.push({
      field: 'twitter-accounts',
      message: 'Twitter site veya creator tanımlanmış.',
      impact: 'low positive'
    });
  }
  
  // Görsel alt metin kontrolü (erişilebilirlik)
  if (ogTags.image && !ogTags.imageAlt) {
    issues.push({
      type: 'info',
      field: 'og-image-alt',
      message: 'Open Graph görsel alt metni (og:image:alt) tanımlanmamış.',
      suggestion: 'Görselin içeriğini açıklayan bir alt metin ekleyin.',
      impact: 'low',
      difficulty: 'kolay',
      example: '<meta property="og:image:alt" content="Görselin kısa açıklaması">',
      explanation: 'og:image:alt etiketi, görme engelli kullanıcıların ekran okuyucularıyla görselin içeriğini anlamalarını sağlar. Bu, içeriğinizin erişilebilirliğini artırır ve bazı platformlarda görselin açıklaması olarak kullanılabilir.',
      reference: 'https://ogp.me/#structured',
      category: 'Erişilebilirlik ve Sosyal Medya'
    });
  } else if (ogTags.imageAlt) {
    successes.push({
      field: 'og-image-alt',
      message: 'Open Graph görsel alt metni tanımlanmış.',
      impact: 'low positive'
    });
  }
  
  if (twitterTags.image && !twitterTags.imageAlt) {
    issues.push({
      type: 'info',
      field: 'twitter-image-alt',
      message: 'Twitter görsel alt metni (twitter:image:alt) tanımlanmamış.',
      suggestion: 'Görselin içeriğini açıklayan bir alt metin ekleyin.',
      impact: 'low',
      difficulty: 'kolay',
      example: '<meta name="twitter:image:alt" content="Görselin kısa açıklaması">',
      explanation: 'twitter:image:alt etiketi, görme engelli kullanıcıların ekran okuyucularıyla görselin içeriğini anlamalarını sağlar. Bu, Twitter\'da içeriğinizin erişilebilirliğini artırır.',
      reference: 'https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup',
      category: 'Erişilebilirlik ve Sosyal Medya'
    });
  } else if (twitterTags.imageAlt) {
    successes.push({
      field: 'twitter-image-alt',
      message: 'Twitter görsel alt metni tanımlanmış.',
      impact: 'low positive'
    });
  }
  
  // WhatsApp ve Pinterest için OpenGraph kontrolü
  if (ogTags.title && ogTags.description && ogTags.image) {
    successes.push({
      field: 'whatsapp-compatibility',
      message: 'İçerik WhatsApp paylaşımları için uyumlu (Open Graph meta etiketleri mevcut).',
      impact: 'medium positive'
    });
    
    if (!pinterestTags.pin && !pinterestTags.description && !pinterestTags.image) {
      successes.push({
        field: 'pinterest-compatibility',
        message: 'Pinterest için Open Graph meta etiketleri kullanılabilir.',
        impact: 'low positive'
      });
    }
  }
  
  // --------- GENEL DEĞERLENDİRME ---------
  
  // Open Graph karşılama
  const ogImplementationScore = calculateOgImplementationScore(ogTags);
  if (ogImplementationScore >= 80) {
    successes.push({
      field: 'social-media-optimization',
      message: `İçerik sosyal medya paylaşımları için iyi optimize edilmiş (OG skoru: ${ogImplementationScore}%).`,
      impact: 'high positive'
    });
  } else if (ogImplementationScore >= 50) {
    issues.push({
      type: 'info',
      field: 'social-media-optimization',
      message: `İçerik sosyal medya paylaşımları için kısmen optimize edilmiş (OG skoru: ${ogImplementationScore}%).`,
      suggestion: 'Tüm önerilen Open Graph ve Twitter Card meta etiketlerini ekleyin.',
      impact: 'medium',
      difficulty: 'orta',
      example: '',
      explanation: 'Sosyal medya optimizasyonu (SMO), içeriğinizin sosyal medyada doğru ve etkili bir şekilde görüntülenmesi için önemlidir. Önerilen tüm meta etiketleri ekleyerek, paylaşımların daha fazla etkileşim almasını sağlayabilirsiniz.',
      reference: 'https://ogp.me/',
      category: 'Sosyal Medya Optimizasyonu'
    });
  } else {
    issues.push({
      type: 'warning',
      field: 'social-media-optimization',
      message: `İçerik sosyal medya paylaşımları için yeterince optimize edilmemiş (OG skoru: ${ogImplementationScore}%).`,
      suggestion: 'En azından temel Open Graph meta etiketlerini ekleyin (og:title, og:description, og:image, og:url).',
      impact: 'high',
      difficulty: 'kolay',
      example: `<meta property="og:title" content="${pageTitle}">
<meta property="og:description" content="${pageDescription || 'Sayfa açıklaması'}">
<meta property="og:image" content="https://${domain}/images/share-image.jpg">
<meta property="og:url" content="${pageUrl}">`,
      explanation: 'Open Graph meta etiketleri olmadan, içeriğiniz sosyal medyada paylaşıldığında kontrol edemeyeceğiniz bir şekilde görüntülenecektir. Bu, düşük kaliteli önizlemeler, yanlış başlıklar veya eksik görseller anlamına gelebilir ve bu da kullanıcıların bağlantınıza tıklama olasılığını azaltır.',
      reference: 'https://ogp.me/',
      category: 'Sosyal Medya Optimizasyonu'
    });
  }
  
  return { issues, successes };
  
  // --------- YARDIMCI FONKSİYONLAR ---------
  
  // URL'yi mutlak URL'ye dönüştürür
  function makeAbsoluteUrl(relativeOrAbsoluteUrl: string, baseUrl: string): string {
    try {
      // Zaten mutlak URL mi?
      new URL(relativeOrAbsoluteUrl);
      return relativeOrAbsoluteUrl;
    } catch {
      // Göreceli URL
      try {
        return new URL(relativeOrAbsoluteUrl, baseUrl).href;
      } catch {
        // Geçersiz URL
        return relativeOrAbsoluteUrl;
      }
    }
  }
  
  // Hata mesajını daha okunaklı hale getirir
  function getErrorMessage(error: any): string {
    if (error.response) {
      return `HTTP ${error.response.status}`;
    } else if (error.code === 'ENOTFOUND') {
      return 'Sunucu bulunamadı';
    } else if (error.code === 'ETIMEDOUT') {
      return 'Bağlantı zaman aşımına uğradı';
    } else if (error.code === 'ECONNREFUSED') {
      return 'Bağlantı reddedildi';
    } else {
      return error.message || 'Bilinmeyen hata';
    }
  }
  
  // Belirli tag için önerilen değeri döndürür
  function getRecommendedValue(tag: string, title: string, description: string, url: string): string {
    switch (tag) {
      case 'title': return title;
      case 'description': return description;
      case 'url': return url;
      case 'image': return `https://${domain}/images/share-image.jpg`;
      default: return `[${tag} için değer]`;
    }
  }
  
  // Bayt boyutunu insan tarafından okunabilir formata dönüştürür
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Metin normalleştirme
  function normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // İki metin arasındaki önemli benzerliği kontrol eder
  function isSubstantiallySimilar(text1: string, text2: string): boolean {
    // Basit bir benzerlik kontrolü, daha gelişmiş algoritmalar kullanılabilir
    const normalized1 = normalizeText(text1);
    const normalized2 = normalizeText(text2);
    
    // Kısa metinlerden birini içeriyor mu?
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return true;
    }
    
    // Ortak kelime oranını hesapla
    const words1 = normalized1.split(/\s+/);
    const words2 = normalized2.split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = commonWords.length / Math.max(words1.length, words2.length);
    
    // %50'den fazla benzerlik varsa önemli derecede benzer kabul et
    return similarity > 0.5;
  }
  
  // Open Graph implementasyon skorunu hesaplar (0-100)
  function calculateOgImplementationScore(tags: typeof ogTags): number {
    const requiredTags = ['title', 'description', 'image', 'url'];
    const recommendedTags = ['type', 'siteName', 'imageAlt', 'imageWidth', 'imageHeight'];
    
    let score = 0;
    let maxScore = 100;
    
    // Zorunlu etiketler (her biri 15 puan)
    requiredTags.forEach(tag => {
      if (tags[tag as keyof typeof tags]) {
        score += 15;
      }
    });
    
    // Önerilen etiketler (her biri 5 puan)
    recommendedTags.forEach(tag => {
      if (tags[tag as keyof typeof tags]) {
        score += 5;
      }
    });
    
    // Sonucu 100 üzerinden ölçeklendirme
    return Math.min(100, Math.round((score / maxScore) * 100));
  }
}

/**
 * Analyzes Progressive Web App (PWA) implementation by checking manifest.json
 * and related configuration elements
 */
async function analyzePWA($: CheerioAPI, url: string): Promise<{ issues: SEOIssue[]; successes: SEOSuccess[] }> {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  const manifestLink = $('link[rel="manifest"]').attr('href');
  
  // Check for service worker registration in HTML
  const hasServiceWorkerScript = $('script').text().includes('serviceWorker.register');
  
  // Check for PWA-related meta tags
  const hasAppleMobileWebAppCapable = $('meta[name="apple-mobile-web-app-capable"]').length > 0;
  const hasAppleMobileWebAppStatusBar = $('meta[name="apple-mobile-web-app-status-bar-style"]').length > 0;
  const hasAppleTouchIcon = $('link[rel="apple-touch-icon"]').length > 0;
  const hasThemeColor = $('meta[name="theme-color"]').length > 0;

  if (manifestLink) {
    try {
      const manifestUrl = new URL(manifestLink, url);
      const response = await axios.get(manifestUrl.href, { 
        timeout: 5000,
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.status === 200) {
        successes.push({ 
          field: 'pwa', 
          message: 'manifest.json dosyası başarıyla erişilebilir.', 
          impact: 'PWA' 
        });
        
        // Validate manifest content
        try {
          const manifest = response.data;
          
          // Check required properties
          const requiredProps = ['name', 'short_name', 'start_url', 'display', 'icons'];
          const missingProps = requiredProps.filter(prop => !manifest[prop]);
          
          if (missingProps.length === 0) {
            successes.push({ 
              field: 'pwa-manifest', 
              message: 'manifest.json tüm gerekli alanları içeriyor.', 
              impact: 'PWA' 
            });
          } else {
            issues.push({ 
              type: 'warning', 
              field: 'pwa-manifest', 
              message: `manifest.json dosyasında eksik alanlar: ${missingProps.join(', ')}`, 
              suggestion: 'manifest.json dosyasına eksik alanları ekleyin.', 
              impact: 'PWA', 
              difficulty: 'düşük', 
              example: `{\n  "name": "Uygulama Adı",\n  "short_name": "Kısa Ad",\n  "start_url": "/",\n  "display": "standalone",\n  "icons": [...]\n}`, 
              explanation: 'PWA için manifest.json dosyası tüm gerekli alanları içermelidir.', 
              reference: 'https://web.dev/add-manifest/', 
              category: 'PWA' 
            });
          }
          
          // Farklı boyutlarda ikonları kontrol et
          if (manifest.icons && Array.isArray(manifest.icons)) {
            const hasLargeIcon = manifest.icons.some((icon: { sizes?: string }) => {
              const size = icon.sizes?.match(/(\d+)x\d+/)?.[1];
              return size && parseInt(size) >= 192;
            });
            if (hasLargeIcon) {
              successes.push({ 
                field: 'pwa-icons', 
                message: 'manifest.json yüksek çözünürlüklü ikon içeriyor.', 
                impact: 'PWA' 
              });
            } else {
              issues.push({ 
                type: 'warning', 
                field: 'pwa-icons', 
                message: 'manifest.json yeterli boyutta ikon içermiyor.', 
                suggestion: 'En az 192x192px ve 512x512px boyutunda ikonlar ekleyin.', 
                impact: 'PWA', 
                difficulty: 'düşük', 
                example: `"icons": [\n  {\n    "src": "/icon-192.png",\n    "sizes": "192x192",\n    "type": "image/png"\n  },\n  {\n    "src": "/icon-512.png",\n    "sizes": "512x512",\n    "type": "image/png"\n  }\n]`, 
                explanation: 'PWA için farklı cihazlarda doğru görünüm sağlamak amacıyla çeşitli boyutlarda ikonlar gereklidir.', 
                reference: 'https://web.dev/add-manifest/#icons', 
                category: 'PWA' 
              });
            }
          }
          
          // Check display mode
          if (manifest.display) {
            const recommendedModes = ['standalone', 'fullscreen', 'minimal-ui'];
            if (recommendedModes.includes(manifest.display)) {
              successes.push({ 
                field: 'pwa-display', 
                message: `manifest.json uygun display modu kullanıyor: ${manifest.display}`, 
                impact: 'PWA' 
              });
            } else {
              issues.push({ 
                type: 'info', 
                field: 'pwa-display', 
                message: `Optimum olmayan display modu: ${manifest.display}`, 
                suggestion: 'display modunu "standalone" veya "fullscreen" olarak değiştirin.', 
                impact: 'PWA', 
                difficulty: 'düşük', 
                example: `"display": "standalone"`, 
                explanation: 'PWA deneyimi için tarayıcı arayüzünü gizlemek önemlidir.', 
                reference: 'https://web.dev/add-manifest/#display', 
                category: 'PWA' 
              });
            }
          }
          
          // Check theme_color
          if (!manifest.theme_color) {
            issues.push({ 
              type: 'info', 
              field: 'pwa-theme', 
              message: 'manifest.json dosyasında theme_color tanımlanmamış.', 
              suggestion: 'Tarayıcı arayüzü rengini özelleştirmek için theme_color ekleyin.', 
              impact: 'PWA', 
              difficulty: 'düşük', 
              example: `"theme_color": "#4285f4"`, 
              explanation: 'theme_color özelliği PWA kullanıcı arayüzünün rengini belirler.', 
              reference: 'https://web.dev/add-manifest/#theme-color', 
              category: 'PWA' 
            });
          }
        } catch (parseError) {
          issues.push({ 
            type: 'error', 
            field: 'pwa-manifest-format', 
            message: 'manifest.json dosyası geçerli JSON formatında değil.', 
            suggestion: 'manifest.json dosyasını geçerli JSON formatında düzenleyin.', 
            impact: 'PWA', 
            difficulty: 'orta', 
            example: '{\n  "name": "Uygulama Adı",\n  "short_name": "Kısa Ad"\n}', 
            explanation: 'manifest.json dosyası geçerli JSON formatında olmalıdır.', 
            reference: 'https://web.dev/add-manifest/', 
            category: 'PWA' 
          });
        }
      } else {
        issues.push({ 
          type: 'error', 
          field: 'pwa', 
          message: `manifest.json dosyasına erişilemiyor (HTTP ${response.status}).`, 
          suggestion: 'manifest.json dosyasının doğru konumda ve erişilebilir olduğunu kontrol edin.', 
          impact: 'PWA', 
          difficulty: 'orta', 
          example: `<link rel="manifest" href="/manifest.json">`, 
          explanation: 'PWA için manifest.json dosyası erişilebilir olmalıdır.', 
          reference: 'https://web.dev/add-manifest/', 
          category: 'PWA' 
        });
      }
    } catch (error) {
      issues.push({ 
        type: 'error', 
        field: 'pwa', 
        message: `manifest.json dosyasına erişilemedi: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, 
        suggestion: 'manifest.json dosyasının doğru konumda ve erişilebilir olduğunu kontrol edin.', 
        impact: 'PWA', 
        difficulty: 'orta', 
        example: `<link rel="manifest" href="/manifest.json">`, 
        explanation: 'PWA için manifest.json dosyası erişilebilir olmalıdır.', 
        reference: 'https://web.dev/add-manifest/', 
        category: 'PWA' 
      });
    }
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'pwa', 
      message: 'manifest.json için link etiketi bulunamadı.', 
      suggestion: 'PWA uyumluluğu için manifest.json dosyası ekleyin.', 
      impact: 'PWA', 
      difficulty: 'orta', 
      example: `<link rel="manifest" href="/manifest.json">`, 
      explanation: 'Web uygulamanızın PWA olarak yüklenebilmesi için manifest.json gereklidir.', 
      reference: 'https://web.dev/add-manifest/', 
      category: 'PWA' 
    });
  }
  
  // Service worker check
  if (!hasServiceWorkerScript) {
    issues.push({ 
      type: 'warning', 
      field: 'pwa-sw', 
      message: 'Service Worker kaydı bulunamadı.', 
      suggestion: 'Service Worker ekleyerek çevrimdışı çalışma ve push bildirimleri gibi PWA özellikleri sağlayın.', 
      impact: 'PWA', 
      difficulty: 'yüksek', 
      example: `<script>\n  if ('serviceWorker' in navigator) {\n    navigator.serviceWorker.register('/sw.js')\n      .then(registration => console.log('SW registered'))\n      .catch(error => console.log('SW error', error));\n  }\n</script>`, 
      explanation: 'Service Worker, PWA\'larda çevrimdışı çalışma ve push bildirimleri için gereklidir.', 
      reference: 'https://web.dev/service-workers-cache-storage/', 
      category: 'PWA' 
    });
  } else {
    successes.push({ 
      field: 'pwa-sw', 
      message: 'Service Worker kayıt kodu tespit edildi.', 
      impact: 'PWA' 
    });
  }
  
  // Check for related meta tags
  if (!hasThemeColor) {
    issues.push({ 
      type: 'info', 
      field: 'pwa-theme-meta', 
      message: 'theme-color meta etiketi eksik.', 
      suggestion: 'Mobil tarayıcılarda adres çubuğu rengini özelleştirmek için theme-color meta etiketi ekleyin.', 
      impact: 'PWA', 
      difficulty: 'düşük', 
      example: `<meta name="theme-color" content="#4285f4">`, 
      explanation: 'theme-color meta etiketi, tarayıcı adres çubuğu rengini belirtir.', 
      reference: 'https://web.dev/add-manifest/#theme-color', 
      category: 'PWA' 
    });
  } else {
    successes.push({ 
      field: 'pwa-theme-meta', 
      message: 'theme-color meta etiketi mevcut.', 
      impact: 'PWA' 
    });
  }
  
  // iOS PWA meta tags
  const iosPwaIssues: string[] = [];
  
  if (!hasAppleTouchIcon) {
    iosPwaIssues.push('apple-touch-icon');
  }
  
  if (!hasAppleMobileWebAppCapable) {
    iosPwaIssues.push('apple-mobile-web-app-capable');
  }

  if (!hasAppleMobileWebAppStatusBar) {
    iosPwaIssues.push('apple-mobile-web-app-status-bar-style' as any);
  }

  if (iosPwaIssues.length > 0) {
    issues.push({ 
      type: 'info', 
      field: 'pwa-ios', 
      message: `iOS için PWA meta etiketleri eksik: ${iosPwaIssues.join(', ')}`, 
      suggestion: 'iOS cihazlarda daha iyi PWA deneyimi için eksik meta etiketleri ekleyin.', 
      impact: 'PWA', 
      difficulty: 'düşük', 
      example: `<link rel="apple-touch-icon" href="icon.png">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="black">`, 
      explanation: 'iOS cihazlarda tam PWA deneyimi için özel meta etiketleri gereklidir.', 
      reference: 'https://web.dev/apple-touch-icon/', 
      category: 'PWA' 
    });
  } else if (hasAppleTouchIcon && hasAppleMobileWebAppCapable) {
    successes.push({ 
      field: 'pwa-ios', 
      message: 'iOS için PWA meta etiketleri mevcut.', 
      impact: 'PWA' 
    });
  }

  return { issues, successes };
}

// --- Favicon.ico ve Apple Touch Icon erişimi ---
async function analyzeFaviconIcons(url: string): Promise<{ issues: SEOIssue[]; successes: SEOSuccess[] }> {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  try {
    const u = new URL(url);
    const favUrl = `${u.origin}/favicon.ico`;
    const favRes = await axios.get(favUrl, { timeout: 3000 });
    if (favRes.status === 200) successes.push({ field: 'favicon', message: 'favicon.ico erişilebilir.', impact: 'branding' });
    else issues.push({ type: 'info', field: 'favicon', message: 'favicon.ico erişilemiyor.', suggestion: 'favicon.ico dosyası ekleyin.', impact: 'branding', difficulty: 'kolay', example: `<link rel="icon" href="favicon.ico">`, explanation: 'Favicon, markanın veya site logosunun kullanıcıların tarayıcısındaki simgesidir. Arama motorlarına ve kullanıcıların tarayıcısındaki simgesi olarak görüntülenir.', reference: 'https://developers.google.com/search/docs/appearance/favicon', category: 'SEO' });
  } catch {
    issues.push({ type: 'info', field: 'favicon', message: 'favicon.ico erişilemiyor.', suggestion: 'favicon.ico dosyası ekleyin.', impact: 'branding', difficulty: 'kolay', example: `<link rel="icon" href="favicon.ico">`, explanation: 'Favicon, markanın veya site logosunun kullanıcıların tarayıcısındaki simgesidir. Arama motorlarına ve kullanıcıların tarayıcısındaki simgesi olarak görüntülenir.', reference: 'https://developers.google.com/search/docs/appearance/favicon', category: 'SEO' });
  }
  try {
    const u = new URL(url);
    const appleUrl = `${u.origin}/apple-touch-icon.png`;
    const appleRes = await axios.get(appleUrl, { timeout: 3000 });
    if (appleRes.status === 200) successes.push({ field: 'apple-touch-icon', message: 'apple-touch-icon erişilebilir.', impact: 'branding' });
    else issues.push({ type: 'info', field: 'apple-touch-icon', message: 'apple-touch-icon erişilemiyor.', suggestion: 'apple-touch-icon ekleyin.', impact: 'branding', difficulty: 'kolay', example: `<link rel="apple-touch-icon" href="apple-touch-icon.png">`, explanation: 'apple-touch-icon, markanın veya site logosunun mobil cihazlarda kullanılır. Arama motorlarına ve mobil cihazlara uygun tasarım için önemli bir etkiye sahiptir.', reference: 'https://developers.google.com/search/docs/appearance/apple-touch-icon', category: 'SEO' });
  } catch {
    issues.push({ type: 'info', field: 'apple-touch-icon', message: 'apple-touch-icon erişilemiyor.', suggestion: 'apple-touch-icon ekleyin.', impact: 'branding', difficulty: 'kolay', example: `<link rel="apple-touch-icon" href="apple-touch-icon.png">`, explanation: 'apple-touch-icon, markanın veya site logosunun mobil cihazlarda kullanılır. Arama motorlarına ve mobil cihazlara uygun tasarım için önemli bir etkiye sahiptir.', reference: 'https://developers.google.com/search/docs/appearance/apple-touch-icon', category: 'SEO' });
  }
  return { issues, successes };
}

/**
 * Advanced charset and viewport meta tags analysis
 * Checks for proper declarations and comprehensive viewport settings
 */
function analyzeMetaCharsetViewport($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Check for charset
  const charsetTag = $('meta[charset]');
  const httpEquivCharset = $('meta[http-equiv="content-type"][content*="charset"]');
  const hasCharset = charsetTag.length > 0 || httpEquivCharset.length > 0;
  let charsetValue = charsetTag.attr('charset') || 
    (httpEquivCharset.attr('content')?.match(/charset=([^;]+)/i)?.[1] || '');
  
  if (hasCharset) {
    if (charsetValue.toLowerCase() === 'utf-8') {
      successes.push({ 
        field: 'charset', 
        message: 'Meta charset UTF-8 olarak tanımlı.', 
        impact: 'technical' 
      });
    } else {
      issues.push({ 
        type: 'warning', 
        field: 'charset', 
        message: `Meta charset UTF-8 dışında bir değere (${charsetValue}) ayarlanmış.`, 
        suggestion: 'charset değerini UTF-8 olarak ayarlayın.', 
        impact: 'technical', 
        difficulty: 'kolay', 
        example: `<meta charset="utf-8">`, 
        explanation: 'UTF-8 karakterleri dünya çapında karakterleri destekler ve günümüz web standartlarında önerilir.', 
        reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-charset', 
        category: 'Technical SEO' 
      });
    }
    
    // Check position of charset meta (should be first in head)
    if ($('head').children().first().is('meta[charset]')) {
      successes.push({ 
        field: 'charset-position', 
        message: 'Meta charset head içinde ilk eleman olarak konumlandırılmış.', 
        impact: 'technical' 
      });
    } else {
      issues.push({ 
        type: 'info', 
        field: 'charset-position', 
        message: 'Meta charset head içinde ilk eleman değil.', 
        suggestion: 'Meta charset etiketini head içindeki ilk eleman olarak yerleştirin.', 
        impact: 'technical', 
        difficulty: 'kolay', 
        example: `<head>\n  <meta charset="utf-8">\n  <!-- diğer meta etiketleri -->`, 
        explanation: 'Meta charset, içeriğin nasıl yorumlanacağını erken belirlemek için head içindeki ilk eleman olmalıdır.', 
        reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-charset', 
        category: 'Technical SEO' 
      });
    }
  } else {
    issues.push({ 
      type: 'error', 
      field: 'charset', 
      message: 'Meta charset eksik.', 
      suggestion: 'UTF-8 charset meta etiketi ekleyin.', 
      impact: 'technical', 
      difficulty: 'kolay', 
      example: `<meta charset="utf-8">`, 
      explanation: 'Meta charset, tarayıcıya sayfanızın karakter kodlamasını bildirir ve içeriğin doğru gösterilmesini sağlar.', 
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta#attr-charset', 
      category: 'Technical SEO' 
    });
  }
  
  // Check viewport
  const viewport = $('meta[name="viewport"]');
  const viewportContent = viewport.attr('content') || '';
  
  if (viewport.length > 0) {
    // Parse viewport content
    const viewportProps = viewportContent.split(',').reduce((acc, prop) => {
      const [key, value] = prop.trim().split('=');
      if (key && value) acc[key.trim()] = value.trim();
      return acc;
    }, {} as Record<string, string>);
    
    if (viewportProps['width'] === 'device-width' && viewportProps['initial-scale'] === '1') {
      successes.push({ 
        field: 'viewport', 
        message: 'Viewport doğru şekilde tanımlanmış.', 
        impact: 'mobile' 
      });
    } else if (!viewportProps['width'] || !viewportProps['initial-scale']) {
      issues.push({ 
        type: 'warning', 
        field: 'viewport', 
        message: 'Viewport eksik parametreler içeriyor.', 
        suggestion: 'Viewport tanımına width=device-width, initial-scale=1 ekleyin.', 
        impact: 'mobile', 
        difficulty: 'kolay', 
        example: `<meta name="viewport" content="width=device-width, initial-scale=1">`, 
        explanation: 'Doğru viewport tanımı responsive tasarım ve mobil SEO için önemlidir.', 
        reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag', 
        category: 'Mobile SEO' 
      });
    }
    
    // Check for user-scalable=no (accessibility issue)
    if (viewportProps['user-scalable'] === 'no' || viewportProps['maximum-scale'] === '1') {
      issues.push({ 
        type: 'warning', 
        field: 'viewport-scaling', 
        message: 'Viewport zoom engelleniyor (user-scalable=no veya maximum-scale=1).', 
        suggestion: 'Erişilebilirlik için kullanıcıların sayfayı yakınlaştırmasına izin verin.', 
        impact: 'accessibility', 
        difficulty: 'kolay', 
        example: `<meta name="viewport" content="width=device-width, initial-scale=1">`, 
        explanation: 'Sayfayı yakınlaştırma özelliğini engellemek görme engelli kullanıcılar için erişilebilirlik sorunları yaratır.', 
        reference: 'https://dequeuniversity.com/rules/axe/4.4/meta-viewport', 
        category: 'Accessibility' 
      });
    }
  } else {
    issues.push({ 
      type: 'error', 
      field: 'viewport', 
      message: 'Viewport meta etiketi eksik.', 
      suggestion: 'Responsive tasarım için viewport meta etiketi ekleyin.', 
      impact: 'mobile', 
      difficulty: 'kolay', 
      example: `<meta name="viewport" content="width=device-width, initial-scale=1">`, 
      explanation: 'Viewport meta etiketi, mobil cihazlarda içeriğin düzgün gösterilmesi için gereklidir.', 
      reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag', 
      category: 'Mobile SEO' 
    });
  }
  
  // Combined charset and viewport check
  if (hasCharset && viewport.length > 0) {
    successes.push({ 
      field: 'meta-combined', 
      message: 'Meta charset ve viewport birlikte mevcut.', 
      impact: 'mobile' 
    });
  }
  
  // Check for X-UA-Compatible meta tag
  const uaCompatible = $('meta[http-equiv="X-UA-Compatible"]');
  if (uaCompatible.length > 0) {
    const content = uaCompatible.attr('content') || '';
    if (content.includes('IE=edge')) {
      successes.push({ 
        field: 'x-ua-compatible', 
        message: 'X-UA-Compatible IE=edge olarak ayarlanmış.', 
        impact: 'technical' 
      });
    } else {
      issues.push({ 
        type: 'info', 
        field: 'x-ua-compatible', 
        message: 'X-UA-Compatible IE=edge olarak ayarlanmamış.', 
        suggestion: 'X-UA-Compatible meta etiketini IE=edge olarak ayarlayın.', 
        impact: 'technical', 
        difficulty: 'kolay', 
        example: `<meta http-equiv="X-UA-Compatible" content="IE=edge">`, 
        explanation: 'IE=edge, Internet Explorer\'ın en son sürümünü kullanmasını sağlar.', 
        reference: 'https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/compatibility/jj676915(v=vs.85)', 
        category: 'Technical SEO' 
      });
    }
  }
  
  return { issues, successes };
}

/**
 * Advanced font size analysis for accessibility and readability
 */
function analyzeFontSize($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Check for inline font-size on text elements
  const smallFontElements = $('[style*="font-size"]').filter((_, el) => {
    const style = $(el).attr('style') || '';
    const fontSizeMatch = style.match(/font-size\s*:\s*(\d+)(px|pt|em|rem)/i);
    if (!fontSizeMatch) return false;
    
    const size = parseInt(fontSizeMatch[1]);
    const unit = fontSizeMatch[2].toLowerCase();
    
    // Convert to approximate pixels for comparison
    if (unit === 'px') return size < 16;
    if (unit === 'pt') return size < 12;
    if (unit === 'em' || unit === 'rem') return size < 1;
    return false;
  });
  
  if (smallFontElements.length > 0) {
    issues.push({ 
      type: 'warning', 
      field: 'font-size', 
      message: `${smallFontElements.length} eleman çok küçük yazı boyutuna sahip.`, 
      suggestion: 'Metin okunabilirliği için en az 16px (veya 1rem) yazı boyutu kullanın.', 
      impact: 'accessibility', 
      difficulty: 'orta', 
      example: `/* CSS */\nbody { font-size: 16px; }\n.small-text { font-size: 1rem; }`, 
      explanation: 'Küçük yazı boyutları mobil cihazlarda okunabilirliği azaltır ve erişilebilirlik sorunları yaratır.', 
      reference: 'https://web.dev/font-size/?utm_source=lighthouse&utm_medium=devtools', 
      category: 'Accessibility' 
    });
  }
  
  // Check for CSS classes that might indicate small text
  const potentialSmallTextClasses = ['small', 'xsmall', 'xs', 'tiny', 'caption', 'footnote'];
  const smallClassElements = potentialSmallTextClasses.map(cls => $(`.${cls}`).length).reduce((a, b) => a + b, 0);
  
  if (smallClassElements > 0) {
    issues.push({ 
      type: 'info', 
      field: 'font-size-classes', 
      message: 'Küçük yazı boyutu olabilecek CSS sınıfları tespit edildi.', 
      suggestion: 'Küçük metinlerin okunabilir olduğundan emin olun (en az 16px).', 
      impact: 'accessibility', 
      difficulty: 'orta', 
      example: `/* CSS */\n.small { font-size: 16px; } /* 12px yerine */`, 
      explanation: 'Küçük metin sınıfları genellikle erişilebilirlik sorunlarına yol açan küçük yazı boyutları içerir.', 
      reference: 'https://web.dev/font-size/?utm_source=lighthouse&utm_medium=devtools', 
      category: 'Accessibility' 
    });
  }
  
  // Check for line-height (readability)
  const styleElements = $('style').text();
  const inlineStyles = $('[style*="line-height"]').toArray().map(el => $(el).attr('style') || '').join(' ');
  const allStyles = styleElements + inlineStyles;
  
  if (allStyles.includes('line-height:') && !allStyles.match(/line-height\s*:\s*(1\.5|1\.6|1\.7|1\.8|1\.9|2)/)) {
    issues.push({ 
      type: 'info', 
      field: 'line-height', 
      message: 'İdeal satır yüksekliği (1.5-2) bulunamadı.', 
      suggestion: 'Okunabilirlik için satır yüksekliğini 1.5-2 arası ayarlayın.', 
      impact: 'readability', 
      difficulty: 'kolay', 
      example: `/* CSS */\nbody { line-height: 1.6; }`, 
      explanation: 'Yeterli satır yüksekliği metin okunabilirliğini artırır ve göz yorgunluğunu azaltır.', 
      reference: 'https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html', 
      category: 'Accessibility' 
    });
  }
  
  // Check for contrast issues via text colors
  const lightColoredElements = $('[style*="color"]').filter((_, el) => {
    const style = $(el).attr('style') || '';
    // Light colors that might have contrast issues
    return /color\s*:\s*(#([fF]{3,6}|[eE]{3,6}|[aA-cC]{3,6}[fF]{3}|[dD-fF]{3,6})|rgba?\s*\(\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\s*,\s*(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9]))/i.test(style);
  });
  
  if (lightColoredElements.length > 0) {
    issues.push({ 
      type: 'warning', 
      field: 'text-contrast', 
      message: 'Düşük kontrastlı metin renkleri tespit edildi.', 
      suggestion: 'Erişilebilirlik için yeterli metin-arka plan kontrastı sağlayın (4.5:1).', 
      impact: 'accessibility', 
      difficulty: 'orta', 
      example: `/* Kötü kontrast */\ncolor: #aaa; background: #fff;\n\n/* İyi kontrast */\ncolor: #444; background: #fff;`, 
      explanation: 'Düşük kontrast oranları görme engelli kullanıcıların içeriği okumasını zorlaştırır.', 
      reference: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html', 
      category: 'Accessibility' 
    });
  }
  
  successes.push({ 
    field: 'font-analysis', 
    message: 'Font analizi tamamlandı.', 
    impact: 'accessibility' 
  });
  
  return { issues, successes };
}

/**
 * Comprehensive input type analysis for accessibility and UX
 */
function analyzeInputTypes($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Map of common input purposes and their recommended types
  const inputPurposes = {
    'email': ['email', 'mail', 'e-mail', 'eposta', 'e-posta'],
    'phone': ['phone', 'telefon', 'tel', 'telephone', 'mobile'],
    'number': ['number', 'sayı', 'sayi', 'miktar', 'amount', 'quantity'],
    'url': ['url', 'website', 'site', 'link'],
    'search': ['search', 'ara', 'arama'],
    'date': ['date', 'tarih', 'birthday', 'doğum'],
    'time': ['time', 'saat', 'zaman'],
    'password': ['password', 'şifre', 'sifre', 'pass']
  };
  
  const inputsChecked = {
    total: 0,
    optimized: 0,
    withLabels: 0,
    nonOptimized: [] as {input: string, suggestedType: string}[]
  };
  
  $('input').each((_, el) => {
    inputsChecked.total++;
    const input = $(el);
    const type = input.attr('type') || 'text';
    const name = (input.attr('name') || '').toLowerCase();
    const id = (input.attr('id') || '').toLowerCase();
    const placeholder = (input.attr('placeholder') || '').toLowerCase();
    const ariaLabel = (input.attr('aria-label') || '').toLowerCase();
    
    // Check if input has a visible label
    const hasExplicitLabel = id && $(`label[for="${id}"]`).length > 0;
    const hasImplicitLabel = input.parent('label').length > 0;
    const hasAriaLabel = !!ariaLabel;
    const hasLabel = hasExplicitLabel || hasImplicitLabel || hasAriaLabel;
    
    if (hasLabel) {
      inputsChecked.withLabels++;
    }
    
    // Analyze if input type is optimized
    if (type !== 'text') {
      inputsChecked.optimized++;
      successes.push({ 
        field: 'input-type', 
        message: `Input type="${type}" doğru kullanılmış.`, 
        impact: 'accessibility' 
      });
    } else {
      // Check if the input should have a specific type based on name/id/placeholder
      let suggestedType = '';
      
      Object.entries(inputPurposes).forEach(([inputType, keywords]) => {
        if (suggestedType) return;
        
        if (keywords.some(keyword => 
          name.includes(keyword) || 
          id.includes(keyword) || 
          placeholder.includes(keyword) || 
          ariaLabel.includes(keyword)
        )) {
          suggestedType = inputType;
        }
      });
      
      // Cheerio tip uyuşmazlığı hatasını önlemek için input'u string olarak saklıyoruz
      if (suggestedType) {
        inputsChecked.nonOptimized.push({
          input: $.html(input), // input'u HTML string olarak kaydet
          suggestedType
        });
      }
    }
    
    // Check for autocomplete attribute on common fields
    if (type !== 'hidden' && 
        !input.attr('autocomplete') && 
        (name.includes('email') || name.includes('phone') || name.includes('name') || name.includes('address'))) {
      issues.push({ 
        type: 'info', 
        field: 'input-autocomplete', 
        message: `"${name}" alanında autocomplete özelliği eksik.`, 
        suggestion: 'Yaygın form alanlarında autocomplete özelliği kullanın.', 
        impact: 'user-experience', 
        difficulty: 'kolay', 
        example: `<input type="email" name="email" autocomplete="email">`, 
        explanation: 'autocomplete özelliği, kullanıcıların form alanlarını daha hızlı doldurmasını sağlar.', 
        reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete', 
        category: 'User Experience' 
      });
    }
  });
  
  // Generate issues for non-optimized inputs
  if (inputsChecked.nonOptimized.length > 0) {
    inputsChecked.nonOptimized.forEach(({input, suggestedType}) => {
      // Cheerio tip uyuşmazlığı hatasını düzeltmek için .attr fonksiyonunu AnyNode ile kullanıyoruz
      const name = (input as any).attr ? (input as any).attr('name') || '' : '';
      issues.push({ 
        type: 'warning', 
        field: 'input-type-optimization', 
        message: `"${name}" alanı için type="text" yerine type="${suggestedType}" kullanılmalı.`, 
        suggestion: `Input type özelliğini "${suggestedType}" olarak değiştirin.`, 
        impact: 'user-experience', 
        difficulty: 'kolay', 
        example: `<input type="${suggestedType}" name="${name}">`, 
        explanation: 'Özelleştirilmiş input tipleri mobil cihazlarda doğru klavye tipinin gösterilmesini sağlar ve form doldurma deneyimini iyileştirir.', 
        reference: 'https://developers.google.com/web/fundamentals/design-and-ux/input/forms', 
        category: 'User Experience' 
      });
    });
  }
  
  // Summary success messages
  if (inputsChecked.total > 0) {
    if (inputsChecked.optimized === inputsChecked.total) {
      successes.push({ 
        field: 'input-types-summary', 
        message: `Tüm input alanları (${inputsChecked.total}) optimize edilmiş tiplere sahip.`, 
        impact: 'accessibility' 
      });
    } else {
      successes.push({ 
        field: 'input-types-summary', 
        message: `${inputsChecked.total} input alanından ${inputsChecked.optimized} tanesi optimize edilmiş tiplere sahip.`, 
        impact: 'accessibility' 
      });
    }
    
    if (inputsChecked.withLabels === inputsChecked.total) {
      successes.push({ 
        field: 'input-labels', 
        message: 'Tüm input alanları label etiketine veya aria-label özelliğine sahip.', 
        impact: 'accessibility' 
      });
    } else {
      issues.push({ 
        type: 'warning', 
        field: 'input-labels', 
        message: `${inputsChecked.total - inputsChecked.withLabels} input alanı label veya aria-label içermiyor.`, 
        suggestion: 'Tüm input alanlarına label etiketi veya aria-label özelliği ekleyin.', 
        impact: 'accessibility', 
        difficulty: 'kolay', 
        example: `<label for="email">E-posta</label>\n<input type="email" id="email" name="email">`, 
        explanation: 'Label etiketleri ekran okuyucu kullanıcıları için input alanlarını tanımlar ve erişilebilirliği artırır.', 
        reference: 'https://www.w3.org/WAI/tutorials/forms/labels/', 
        category: 'Accessibility' 
      });
    }
  } else {
    successes.push({ 
      field: 'input-types', 
      message: 'Sayfada input alanı bulunamadı.', 
      impact: 'accessibility' 
    });
  }
  
  return { issues, successes };
}

/**
 * Enhanced tab order and landmark analysis
 */
function analyzeTabOrderLandmarks($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  
  // Tab order analysis
  const elementsWithTabIndex = $('[tabindex]').toArray();
  const elementsWithNegativeTabIndex = $('[tabindex^="-"]').length;
  const tabindexValues = elementsWithTabIndex.map(el => {
    const value = $(el).attr('tabindex');
    return value ? parseInt(value) : 0;
  });
  
  // Find elements with tabindex > 0 (potential accessibility issue)
  const positiveTabIndices = tabindexValues.filter(val => val > 0);
  
  if (elementsWithTabIndex.length > 0) {
    successes.push({ 
      field: 'tabindex', 
      message: `${elementsWithTabIndex.length} eleman tabindex özelliğine sahip.`, 
      impact: 'accessibility' 
    });
    
    if (positiveTabIndices.length > 0) {
      issues.push({ 
        type: 'warning', 
        field: 'tabindex-positive', 
        message: `${positiveTabIndices.length} eleman pozitif tabindex (>0) kullanıyor.`, 
        suggestion: 'tabindex>0 kullanmaktan kaçının, doğal HTML sıralamasını kullanın.', 
        impact: 'accessibility', 
        difficulty: 'orta', 
        example: `<!-- Kaçının -->\n<div tabindex="5">...</div>\n\n<!-- Tercih edin -->\n<div tabindex="0">...</div>`, 
        explanation: 'Pozitif tabindex değerleri doğal klavye gezinme sırasını bozar ve bakımı zorlaştırır.', 
        reference: 'https://webaim.org/techniques/keyboard/tabindex', 
        category: 'Accessibility' 
      });
    }
    
    if (elementsWithNegativeTabIndex > 0) {
      successes.push({ 
        field: 'tabindex-negative', 
        message: `${elementsWithNegativeTabIndex} eleman negatif tabindex kullanıyor (programatik odaklanma için).`, 
        impact: 'accessibility' 
      });
    }
  } else {
    // Only raise issue if there are interactive elements
    if ($('a, button, input, select, textarea').length > 0) {
      issues.push({ 
        type: 'info', 
        field: 'tabindex', 
        message: 'tabindex özelliği kullanılmıyor.', 
        suggestion: 'Klavye erişilebilirliği için özel etkileşimli elemanlara tabindex="0" ekleyin.', 
        impact: 'accessibility', 
        difficulty: 'orta', 
        example: `<div role="button" tabindex="0" onclick="...">Etkileşimli Öğe</div>`, 
        explanation: 'tabindex="0", doğal olarak odaklanabilir olmayan ama etkileşimli öğeleri klavye kullanıcıları için erişilebilir yapar.', 
        reference: 'https://webaim.org/techniques/keyboard/tabindex', 
        category: 'Accessibility' 
      });
    }
  }
  
  // Landmark analysis
  const landmarkElements = {
    header: $('header, [role="banner"]').length,
    nav: $('nav, [role="navigation"]').length,
    main: $('main, [role="main"]').length,
    footer: $('footer, [role="contentinfo"]').length,
    aside: $('aside, [role="complementary"]').length,
    search: $('[role="search"]').length,
    form: $('form:not([role]), [role="form"]').length,
    region: $('section[aria-label], section[aria-labelledby], [role="region"][aria-label], [role="region"][aria-labelledby]').length
  };
  
  const totalLandmarks = Object.values(landmarkElements).reduce((sum, count) => sum + count, 0);
  
  if (totalLandmarks > 0) {
    successes.push({ 
      field: 'landmarks', 
      message: `Toplam ${totalLandmarks} landmark etiketi/rolü tespit edildi.`, 
      impact: 'accessibility' 
    });
    
    // Check for essential landmarks
    if (landmarkElements.main === 0) {
      issues.push({ 
        type: 'warning', 
        field: 'landmark-main', 
        message: '<main> etiketi veya role="main" eksik.', 
        suggestion: 'Ana içeriğiniz için <main> etiketi ekleyin.', 
        impact: 'accessibility', 
        difficulty: 'kolay', 
        example: `<main>\n  <!-- Ana sayfa içeriği -->\n</main>`, 
        explanation: 'main landmark, ekran okuyucuların ana içeriğe doğrudan geçiş yapabilmesini sağlar.', 
        reference: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/', 
        category: 'Accessibility' 
      });
    }
    
    if (landmarkElements.nav === 0) {
      issues.push({ 
        type: 'info', 
        field: 'landmark-nav', 
        message: '<nav> etiketi veya role="navigation" eksik.', 
        suggestion: 'Ana navigasyon için <nav> etiketi ekleyin.', 
        impact: 'accessibility', 
        difficulty: 'kolay', 
        example: `<nav>\n  <!-- Navigasyon linkleri -->\n</nav>`, 
        explanation: 'navigation landmark, ekran okuyucu kullanıcılar için site gezinimini kolaylaştırır.', 
        reference: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/', 
        category: 'Accessibility' 
      });
    }
    
    // Check for landmark label issues
    const multipleNavs = $('nav, [role="navigation"]').length > 1;
    const unlabeledNavs = $('nav:not([aria-label]):not([aria-labelledby]), [role="navigation"]:not([aria-label]):not([aria-labelledby])').length;
    
    if (multipleNavs && unlabeledNavs > 0) {
      issues.push({ 
        type: 'warning', 
        field: 'landmark-labels', 
        message: 'Birden fazla nav etiketi var, ancak hepsi etiketlenmemiş.', 
        suggestion: 'Her navigasyon öğesini aria-label veya aria-labelledby ile tanımlayın.', 
        impact: 'accessibility', 
        difficulty: 'kolay', 
        example: `<nav aria-label="Ana Menü">...</nav>\n<nav aria-label="Alt Menü">...</nav>`, 
        explanation: 'Birden fazla aynı türde landmark olduğunda, ekran okuyucu kullanıcıları için ayırt edici etiketler gerekir.', 
        reference: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/', 
        category: 'Accessibility' 
      });
    }
  } else {
    issues.push({ 
      type: 'warning', 
      field: 'landmarks', 
      message: 'Landmark etiketleri/rolleri eksik.', 
      suggestion: 'Semantik HTML5 etiketleri (header, nav, main, footer) veya ARIA landmark rolleri ekleyin.', 
      impact: 'accessibility', 
      difficulty: 'orta', 
      example: `<header>...</header>\n<nav>...</nav>\n<main>...</main>\n<footer>...</footer>`, 
      explanation: 'Landmark etiketleri ekran okuyucu kullanıcıların sayfada gezinmesini kolaylaştırır ve sayfa yapısını belirler.', 
      reference: 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/', 
      category: 'Accessibility' 
    });
  }
  
  return { issues, successes };
}

/**
 * SEO sorunlarını önceliklendirir ve en önemli iyileştirme önerilerini oluşturur
 * @param issues Tespit edilen SEO sorunları
 * @returns Önceliklendirilmiş SEO iyileştirme önerileri
 */
function generateImprovements(issues: SEOIssue[]): SEOImprovement[] {
  // Önce yüksek etkili sorunları önceliklendiriyoruz
  const prioritizedIssues = [...issues].sort((a, b) => {
    // Önce etki seviyesine göre sıralama
    const impactOrder: Record<string, number> = { 'yüksek': 0, 'orta': 1, 'düşük': 2, 'SEO': 1, 'accessibility': 1 };
    const aImpact = a.impact ?? '';
    const bImpact = b.impact ?? '';
    const impactDiff = (impactOrder[aImpact] !== undefined ? impactOrder[aImpact] : 3) - (impactOrder[bImpact] !== undefined ? impactOrder[bImpact] : 3);

    if (impactDiff !== 0) return impactDiff;

    // Sonra zorluk seviyesine göre sıralama (kolay çözülebilir sorunlar önce)
    const difficultyOrder: Record<string, number> = { 'kolay': 0, 'orta': 1, 'zor': 2 };
    const aDifficulty = a.difficulty ?? '';
    const bDifficulty = b.difficulty ?? '';
    return (difficultyOrder[aDifficulty] !== undefined ? difficultyOrder[aDifficulty] : 3) - 
           (difficultyOrder[bDifficulty] !== undefined ? difficultyOrder[bDifficulty] : 3);
  });

  // En önemli 10 sorunu alıp iyileştirme önerilerine dönüştürüyoruz
  return prioritizedIssues.slice(0, 10).map(issue => ({
    title: issue.message,
    description: issue.suggestion || 
      `${issue.field} alanındaki bu sorunu düzeltmeniz önerilir.`,
    impact: issue.impact,
    difficulty: issue.difficulty,
    category: issue.category || 'SEO',
    reference: issue.reference || '',
    field: issue.field
  }));
}

/**
 * Meta açıklama alanında emoji ve özel sembol kullanımını analiz eder
 * @param $ Cheerio API referansı
 * @returns Tespit edilen sorunlar ve başarılı noktalar
 */
function analyzeDescriptionEmojiSpam($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  
  // Meta açıklama içeriğini al
  const desc = $('meta[name="description"]').attr('content') || '';
  
  // Açıklama yoksa erken dön
  if (!desc) {
    issues.push({
      type: 'error',
      field: 'description',
      message: 'Meta açıklama alanı bulunamadı.',
      suggestion: 'Sayfanıza meta açıklama ekleyin.',
      impact: 'yüksek',
      difficulty: 'kolay',
      example: `<meta name="description" content="Sayfanızın içeriğini açıklayan 150-160 karakterlik bir metin.">`,
      explanation: 'Meta açıklama, arama sonuçlarında görüntülenir ve tıklama oranını etkiler.',
      reference: 'https://developers.google.com/search/docs/appearance/snippet',
      category: 'SEO'
    });
    return { issues, successes };
  }
  
  // Daha kapsamlı emoji ve sembol regex'i
  // Unicode property escapes (\p{Emoji}) require ES2018+. Use a broad emoji range instead.
  const emojiRegex = /[\u203C-\u3299\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF\u263A-\u263C]+/;
  const emojis = desc.match(emojiRegex) || [];
  
  if (emojis.length > 0) {
    const emojiCount = emojis.length;
    
    // Emoji sayısına göre uyarı seviyesi belirleme
    const type = emojiCount > 3 ? 'warning' : 'info';
    const impact = emojiCount > 3 ? 'orta' : 'düşük';
    
    issues.push({
      type,
      field: 'description',
      message: `Meta açıklama alanında ${emojiCount} adet emoji/özel sembol tespit edildi.`,
      suggestion: 'Meta açıklama alanında emoji ve özel semboller kullanmaktan kaçının. Google bunları bazen göstermeyebilir veya farklı yorumlayabilir.',
      impact,
      difficulty: 'kolay',
      example: `<meta name="description" content="${desc.replace(emojiRegex, '[emoji]')}">`,
      explanation: 'Meta açıklama alanında emoji kullanımı profesyonellikten uzak görünebilir ve bazı arama motorları tarafından farklı şekillerde yorumlanabilir. Ayrıca, karakter sınırlarınızın gereksiz yere dolmasına neden olabilir.',
      reference: 'https://developers.google.com/search/docs/appearance/snippet/meta-descriptions',
      category: 'SEO'
    });
  } else {
    successes.push({
      field: 'description',
      message: 'Meta açıklama alanında emoji veya özel sembol kullanılmamış - bu iyi bir uygulama.',
      impact: 'orta'
    });
  }
  
  return { issues, successes };
}

/**
 * Sayfa başlığında aşırı sembol kullanımını analiz eder
 * @param $ Cheerio API referansı
 * @returns Tespit edilen sorunlar ve başarılı noktalar
 */
function analyzeTitleSymbolSpam($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  const title = $('title').text();
  
  // Başlık yoksa erken dön
  if (!title) {
    issues.push({
      type: 'error',
      field: 'title',
      message: 'Sayfa başlığı (title) bulunamadı.',
      suggestion: 'Sayfanız için açıklayıcı bir başlık ekleyin.',
      impact: 'yüksek',
      difficulty: 'kolay',
      example: '<title>Sayfanızın Ana Konusu | Site Adınız</title>',
      explanation: 'Başlık etiketi, arama sonuçlarında görünen ilk şeydir ve SEO için çok önemlidir.',
      reference: 'https://developers.google.com/search/docs/appearance/title-link',
      category: 'SEO'
    });
    return { issues, successes };
  }
  
  // Farklı sembol kategorileri ve etki seviyeleri
  const aggressiveSymbols = title.match(/[!?★☆⚡✅❌]/g) || [];
  const normalSymbols = title.match(/[@#$%^&*()_+=\[\]{};':"\\|,.<>\/~`-]/g) || [];
  const totalSymbols = aggressiveSymbols.length + normalSymbols.length;
  
  // Sembol sayılarına göre uyarı oluşturma
  if (totalSymbols > 0) {
    let type = 'info';
    let impact = 'düşük';
    let message = '';
    let suggestion = '';
    
    if (aggressiveSymbols.length > 2) {
      type = 'warning';
      impact = 'orta';
      message = `Başlıkta ${aggressiveSymbols.length} adet dikkat çekici sembol (!?★☆ vb.) tespit edildi.`;
      suggestion = 'Başlıkta dikkat çekici sembolleri kaldırın. Bu tür semboller spam olarak değerlendirilebilir.';
    } else if (totalSymbols > 5) {
      type = 'warning';
      impact = 'orta';
      message = `Başlıkta toplam ${totalSymbols} sembol kullanılmış, bu çok fazla.`;
      suggestion = 'Başlıkta sembol sayısını azaltın, doğal ve açıklayıcı bir başlık kullanın.';
    } else if (totalSymbols > 2) {
      type = 'info';
      impact = 'düşük';
      message = `Başlıkta ${totalSymbols} sembol kullanılmış.`;
      suggestion = 'Başlıkta daha az sembol kullanmayı değerlendirin.';
    }
    
    if (message) {
      issues.push({
        type,
        field: 'title',
        message,
        suggestion,
        impact,
        difficulty: 'kolay',
        example: `<title>${title}</title>`,
        explanation: 'Başlıkta aşırı sembol kullanımı, arama motorları tarafından spam olarak algılanabilir ve kullanıcı deneyimini olumsuz etkileyebilir. Açıklayıcı ve doğal başlıklar daha iyi sonuç verir.',
        reference: 'https://developers.google.com/search/docs/appearance/title-link',
        category: 'SEO'
      });
    }
  } else {
    successes.push({
      field: 'title',
      message: 'Başlıkta gereksiz sembol kullanımı tespit edilmedi - bu iyi bir uygulama.',
      impact: 'orta'
    });
  }
  
  return { issues, successes };
}

/**
 * Sayfa içinde UTM parametresi içeren linkleri analiz eder ve uygun kullanımını kontrol eder
 * @param $ Cheerio API referansı
 * @returns Tespit edilen sorunlar ve başarılı noktalar
 */
function analyzeUTMLinks($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  
  // Tüm UTM parametreli linkleri bul
  const utmLinks = $("a[href*='utm_']");
  const utmLinksCount = utmLinks.length;
  
  // İç linklerde UTM kullanımı - bu genellikle bir sorundur
  const internalUtmLinks = utmLinks.filter(function() {
    const href = $(this).attr('href') || '';
    // Tam URL olmayan veya aynı domaindeki linkler
    return !href.startsWith('http') || href.includes(window.location.hostname);
  }).length;
  
  // Eksik UTM parametreli linkler
  const incompleteUtmLinks = utmLinks.filter(function() {
    const href = $(this).attr('href') || '';
    const hasSource = href.includes('utm_source');
    const hasMedium = href.includes('utm_medium');
    const hasCampaign = href.includes('utm_campaign');
    return !(hasSource && hasMedium && hasCampaign);
  }).length;

  if (utmLinksCount > 0) {
    // İç linklerde UTM kullanımı sorunu
    if (internalUtmLinks > 0) {
      issues.push({
        type: 'warning',
        field: 'link',
        message: `${internalUtmLinks} adet iç linkte UTM parametresi kullanılmış.`,
        suggestion: 'İç sayfalara yönlendiren linklerde UTM parametresi kullanmaktan kaçının. Bu durum, Analytics üzerinde trafik kaynağı verilerinin parçalanmasına ve yanlış raporlamaya yol açabilir.',
        impact: 'analytics',
        difficulty: 'orta',
        example: `<a href="/hizmetler?utm_source=anasayfa">Hizmetlerimiz</a> yerine <a href="/hizmetler">Hizmetlerimiz</a>`,
        explanation: 'İç linklerde UTM parametreleri kullanmak, kullanıcı aynı sitede gezindiğinde oturum bilgisinin sıfırlanmasına ve analiz verilerinin yanlış çıkmasına neden olur. İç navigasyon için UTM yerine farklı takip yöntemleri tercih edilmelidir.',
        reference: 'https://support.google.com/analytics/answer/1033863',
        category: 'Analytics'
      });
    }
    
    // Eksik UTM parametreleri sorunu
    if (incompleteUtmLinks > 0) {
      issues.push({
        type: 'info',
        field: 'link',
        message: `${incompleteUtmLinks} linkte eksik UTM parametreleri var.`,
        suggestion: 'UTM parametreli linklerde en azından utm_source, utm_medium ve utm_campaign parametrelerini kullanın.',
        impact: 'analytics',
        difficulty: 'kolay',
        example: `<a href="https://example.com?utm_source=website&utm_medium=banner&utm_campaign=summer_sale">Kampanya</a>`,
        explanation: 'Tam bir kampanya takibi için gerekli UTM parametreleri (source, medium, campaign) eksik. Eksik parametreler analiz verilerinizin yetersiz kalmasına neden olur.',
        reference: 'https://ga-dev-tools.google/campaign-url-builder/',
        category: 'Analytics'
      });
    }
    
    // Genel UTM kullanımı bilgisi
    if (utmLinksCount > 10) {
      issues.push({
        type: 'info',
        field: 'link',
        message: `Sayfada ${utmLinksCount} adet UTM parametreli link tespit edildi.`,
        suggestion: 'UTM parametrelerini sadece harici kampanya takibi için kullanın ve sayfa içinde minimum sayıda tutun.',
        impact: 'analytics',
        difficulty: 'kolay',
        example: `<a href="https://example.com?utm_source=newsletter&utm_medium=email&utm_campaign=april2025">Kampanya Linki</a>`,
        explanation: 'UTM parametreleri, pazarlama kampanyalarını takip etmek için kullanılır. Aşırı kullanım karmaşaya neden olabilir. Gerekli durumlarda ve düzenli bir sistem dahilinde kullanın.',
        reference: 'https://developers.google.com/analytics/devguides/collection/analyticsjs/parameters',
        category: 'Analytics'
      });
    }
  } else {
    // UTM link kullanımı yok
    successes.push({
      field: 'link',
      message: 'Sayfada UTM parametresi içeren link bulunmuyor. Bu, site içi navigasyon için idealdir.',
      impact: 'analytics'
    });
  }
  
  return { issues, successes };
}

/**
 * H1 başlığının sayfanın üst kısmında olup olmadığını ve doğru kullanımını kontrol eder
 * @param $ Cheerio API referansı
 * @returns Tespit edilen sorunlar ve başarılı noktalar
 */
function analyzeH1AtTop($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  
  // H1 etiketlerini kontrol et
  const h1Elements = $('h1');
  const h1Count = h1Elements.length;
  
  // H1 etiketi hiç yoksa
  if (h1Count === 0) {
    issues.push({
      type: 'error',
      field: 'h1',
      message: 'Sayfada H1 başlığı bulunmuyor.',
      suggestion: 'Sayfanın ana konusunu yansıtan bir H1 başlığı ekleyin.',
      impact: 'yüksek',
      difficulty: 'kolay',
      example: '<h1>Sayfanın Ana Başlığı</h1>',
      explanation: 'H1 başlığı, sayfanın ana konusunu belirtir ve arama motorları için en önemli başlık etiketidir. Her sayfada mutlaka bir H1 başlığı bulunmalıdır.',
      reference: 'https://developers.google.com/search/docs/appearance/title-link',
      category: 'SEO'
    });
    return { issues, successes };
  }
  
  // Birden fazla H1 etiketi varsa
  if (h1Count > 1) {
    issues.push({
      type: 'warning',
      field: 'h1',
      message: `Sayfada ${h1Count} adet H1 başlığı bulunuyor.`,
      suggestion: 'Sayfada sadece bir adet H1 başlığı kullanın.',
      impact: 'orta',
      difficulty: 'kolay',
      example: 'Sayfada sadece bir adet <h1>Ana Başlık</h1> kullanın, diğer başlıklar için H2-H6 etiketlerini tercih edin.',
      explanation: 'Birden fazla H1 kullanımı, sayfa hiyerarşisini bozar ve arama motorlarının sayfanın ana konusunu anlamasını zorlaştırabilir.',
      reference: 'https://developers.google.com/search/docs/appearance/structured-data',
      category: 'SEO'
    });
  }
  
  // İlk H1 etiketinin konumunu kontrol et
  const firstH1 = h1Elements.first();
  const body = $('body');
  
  // Sayfadaki ilk 3 element içinde H1 var mı?
  const firstElements = body.children().slice(0, 3);
  let h1InFirstElements = false;
  let h1Position = -1;
  
  firstElements.each((index, element) => {
    if ($(element).find('h1').length > 0 || element === firstH1[0]) {
      h1InFirstElements = true;
      h1Position = index;
    }
  });
  
  // H1 başlığının içeriğini ve uzunluğunu kontrol et
  const h1Text = firstH1.text().trim();
  const h1TextLength = h1Text.length;
  
  // H1 içeriği kontrolleri
  if (h1TextLength < 10) {
    issues.push({
      type: 'info',
      field: 'h1',
      message: 'H1 başlığı çok kısa.',
      suggestion: 'H1 başlığını daha açıklayıcı ve içeriğe uygun hale getirin.',
      impact: 'düşük',
      difficulty: 'kolay',
      example: `<h1>${h1Text}</h1> yerine <h1>Daha açıklayıcı ve kapsamlı bir başlık</h1>`,
      explanation: 'H1 başlığı, sayfanın içeriğini özetlemeli ve kullanıcılara sayfanın ne hakkında olduğunu açıkça anlatmalıdır.',
      reference: 'https://developers.google.com/search/docs/appearance/title-link',
      category: 'SEO'
    });
  } else if (h1TextLength > 70) {
    issues.push({
      type: 'info',
      field: 'h1',
      message: 'H1 başlığı çok uzun.',
      suggestion: 'H1 başlığını daha kısa ve öz hale getirin.',
      impact: 'düşük',
      difficulty: 'kolay',
      example: `<h1>${h1Text.substring(0, 30)}...</h1>`,
      explanation: 'Çok uzun H1 başlıkları, kullanıcı deneyimini olumsuz etkileyebilir ve mobil cihazlarda düzgün görüntülenmeyebilir.',
      reference: 'https://developers.google.com/search/docs/appearance/title-link',
      category: 'SEO'
    });
  }
  
  // H1'in konumu ile ilgili değerlendirme
  if (h1InFirstElements) {
    successes.push({
      field: 'h1',
      message: `H1 başlığı sayfanın üst kısmında (${h1Position+1}. element) bulunuyor.`,
      impact: 'SEO structure'
    });
  } else {
    issues.push({
      type: 'info',
      field: 'h1',
      message: 'H1 başlığı sayfanın üst kısmında değil.',
      suggestion: 'H1 başlığını sayfanın başına veya üst kısmına taşıyın.',
      impact: 'orta',
      difficulty: 'orta',
      example: '<body>\n  <header>...</header>\n  <h1>Ana Başlık</h1>\n  <main>...</main>\n</body>',
      explanation: 'H1 başlığının sayfanın üst kısımlarında olması, hem kullanıcılar için hem de arama motorları için sayfanın ana konusunu hızlıca anlamalarını sağlar.',
      reference: 'https://developers.google.com/search/docs/appearance/structured-data',
      category: 'SEO'
    });
  }
  
  return { issues, successes };
}

/**
 * Sayfa içindeki başlık hiyerarşisini analiz eder ve SEO açısından uygunluğunu değerlendirir
 * @param $ Cheerio API referansı
 * @returns Tespit edilen sorunlar ve başarılı noktalar
 */
function analyzeHeadingHierarchy($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  
  // Başlık sayılarını hesapla
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  const h4Count = $('h4').length;
  const h5Count = $('h5').length;
  const h6Count = $('h6').length;
  
  // Başlık hiyerarşisi doğruluğunu kontrol et
  const allHeadings = $('h1, h2, h3, h4, h5, h6');
  let previousLevel = 0;
  let hierarchyViolations = 0;
  let skippedLevels: string[] = []; // String türünü belirttim
  
  allHeadings.each((index, element) => {
    const currentTag = element.tagName.toLowerCase();
    const currentLevel = parseInt(currentTag.substring(1));
    
    // Başlık seviyesi atlanmış mı kontrol et
    if (previousLevel > 0 && currentLevel > previousLevel + 1) {
      hierarchyViolations++;
      skippedLevels.push(`H${previousLevel} → H${currentLevel}`);
    }
    
    previousLevel = currentLevel;
  });
  
  // Başlık yapısıyla ilgili başarılı noktalar
  const hasGoodStructure = h1Count === 1 && h2Count >= 2 && h3Count > 0;
  
  if (hasGoodStructure) {
    successes.push({
      field: 'heading',
      message: 'Sayfa iyi yapılandırılmış bir başlık hiyerarşisine sahip (1 H1, birden fazla H2 ve H3).',
      impact: 'yüksek'
    });
  }
  
  // H1 kontrolü (zaten başka fonksiyonda yapıldığı için sadece referans)
  if (h1Count === 0) {
    issues.push({
      type: 'error',
      field: 'heading',
      message: 'Sayfada H1 başlığı bulunmuyor.',
      suggestion: 'Sayfaya bir H1 başlığı ekleyin.',
      impact: 'yüksek',
      difficulty: 'kolay',
      example: '<h1>Ana Başlık</h1>',
      explanation: 'Her sayfada bir adet H1 başlığı olmalıdır. H1, sayfanın ana konusunu belirtir.',
      reference: 'https://developers.google.com/search/docs/appearance/structured-data',
      category: 'SEO'
    });
  } else if (h1Count > 1) {
    issues.push({
      type: 'warning',
      field: 'heading',
      message: `Sayfada ${h1Count} adet H1 başlığı var.`,
      suggestion: 'Sayfada sadece bir adet H1 başlığı kullanın.',
      impact: 'orta',
      difficulty: 'kolay',
      example: 'Sayfada sadece bir adet <h1>Ana Başlık</h1> bulunmalı.',
      explanation: 'Birden fazla H1 kullanımı, sayfa hiyerarşisini bozar ve arama motorlarının sayfayı anlamasını zorlaştırır.',
      reference: 'https://developers.google.com/search/docs/appearance/structured-data',
      category: 'SEO'
    });
  }
  
  // H2 başlık kontrolü
  if (h2Count === 0) {
    issues.push({
      type: 'warning',
      field: 'heading',
      message: 'Sayfada H2 başlığı bulunmuyor.',
      suggestion: 'İçeriği bölümlere ayırmak için H2 başlıkları ekleyin.',
      impact: 'orta',
      difficulty: 'kolay',
      example: '<h2>Bölüm Başlığı</h2>\n<p>İlgili içerik...</p>',
      explanation: 'H2 başlıkları, içeriği mantıksal bölümlere ayırır ve arama motorlarının içeriği daha iyi anlamasına yardımcı olur.',
      reference: 'https://developers.google.com/search/docs/appearance/structured-data',
      category: 'SEO'
    });
  }
  
  // H3 başlık kontrolü
  if (h2Count > 0 && h3Count === 0) {
    issues.push({
      type: 'info',
      field: 'heading',
      message: 'H2 başlıkları var, ancak H3 başlığı bulunmuyor.',
      suggestion: 'H2 bölümlerini alt başlıklara ayırmak için H3 başlıkları ekleyin.',
      impact: 'düşük',
      difficulty: 'kolay',
      example: '<h2>Ana Bölüm</h2>\n<h3>Alt Bölüm</h3>\n<p>İlgili içerik...</p>',
      explanation: 'H3 başlıkları, H2 ile belirtilen bölümleri daha küçük ve odaklı alt bölümlere ayırmak için kullanılır. Bu, daha iyi bir içerik organizasyonu sağlar.',
      reference: 'https://developers.google.com/search/docs/appearance/structured-data',
      category: 'SEO'
    });
  }
  
  // Atlanan başlık seviyeleri kontrolü
  if (hierarchyViolations > 0) {
    issues.push({
      type: 'warning',
      field: 'heading',
      message: `Başlık hiyerarşisinde ${hierarchyViolations} adet atlama tespit edildi (${skippedLevels.join(', ')}).`,
      suggestion: 'Başlık seviyelerini sırayla kullanın, seviye atlamayın.',
      impact: 'orta',
      difficulty: 'orta',
      example: 'H1 → H2 → H3 → H4 şeklinde düzenli bir hiyerarşi kullanın, H1 → H3 gibi atlamalar yapmayın.',
      explanation: 'Başlık seviyelerini atlamak (örneğin H2\'den sonra H4 kullanmak), içerik yapısının bozulmasına ve erişilebilirlik sorunlarına yol açabilir.',
      reference: 'https://developers.google.com/search/docs/appearance/structured-data',
      category: 'SEO'
    });
  }
  
  // Başlık sayısı dengesi kontrolü
  if (h2Count > 0 && h3Count > h2Count * 5) {
    issues.push({
      type: 'info',
      field: 'heading',
      message: `H3 başlık sayısı (${h3Count}), H2 başlık sayısına (${h2Count}) göre çok fazla.`,
      suggestion: 'İçerik yapısını gözden geçirin ve başlık dengesini sağlayın.',
      impact: 'düşük',
      difficulty: 'orta',
      example: 'Her H2 başlığı altında makul sayıda H3 başlığı kullanın.',
      explanation: 'Dengesiz başlık dağılımı, içerik yapısının karmaşık veya düzensiz olduğunu gösterebilir.',
      reference: 'https://developers.google.com/search/docs/appearance/structured-data',
      category: 'SEO'
    });
  }
  
  // Genel başarı durumu
  if (issues.length === 0 && h1Count === 1 && h2Count > 0) {
    successes.push({
      field: 'heading',
      message: 'Başlık hiyerarşisi düzgün yapılandırılmış ve SEO açısından uygun.',
      impact: 'yüksek'
    });
  }
  
  return { issues, successes };
}

/**
 * Meta refresh yönlendirmelerini analiz eder ve SEO açısından uygunluğunu değerlendirir
 * @param $ Cheerio API referansı
 * @returns Tespit edilen sorunlar ve başarılı noktalar
 */
function analyzeMetaRefresh($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  
  // Meta refresh etiketlerini bul
  const metaRefreshElements = $('meta[http-equiv="refresh"]');
  const metaRefreshCount = metaRefreshElements.length;
  
  if (metaRefreshCount > 0) {
    // Her meta refresh etiketi için ayrı analiz yap
    metaRefreshElements.each((index, element) => {
      const content = $(element).attr('content') || '';
      
      // Refresh süresini ve URL'i analiz et
      const refreshMatch = content.match(/^(\d+)(?:;\s*url=(.+))?$/i);
      
      if (refreshMatch) {
        const seconds = parseInt(refreshMatch[1], 10);
        const targetUrl = refreshMatch[2] || '';
        const isInstantRefresh = seconds === 0;
        const isDelayedRefresh = seconds > 0;
        const isInternalUrl = targetUrl && !targetUrl.match(/^https?:\/\//i);
        
        // Anında yönlendirme (0 saniye)
        if (isInstantRefresh) {
          issues.push({
            type: 'error',
            field: 'meta',
            message: 'Anında meta refresh yönlendirmesi kullanılıyor.',
            suggestion: 'Meta refresh yerine 301 (kalıcı) veya 302 (geçici) HTTP yönlendirmesi kullanın.',
            impact: 'yüksek',
            difficulty: 'orta',
            example: `<meta http-equiv="refresh" content="0; URL=${targetUrl}"> yerine sunucu taraflı yönlendirme kullanın.`,
            explanation: 'Anında meta refresh yönlendirmeleri, arama motorları tarafından genellikle spam olarak algılanabilir ve SEO puanınızı düşürebilir. Ayrıca, kullanıcı deneyimini olumsuz etkileyebilir ve tarayıcı geçmişini bozabilir.',
            reference: 'https://developers.google.com/search/docs/crawling-indexing/301-redirects',
            category: 'SEO'
          });
        } 
        // Gecikmeli yönlendirme
        else if (isDelayedRefresh) {
          issues.push({
            type: 'warning',
            field: 'meta',
            message: `${seconds} saniyelik gecikmeli meta refresh yönlendirmesi tespit edildi.`,
            suggestion: 'Gecikmeli yönlendirmeler yerine kullanıcıya link sunmayı veya JavaScript ile daha kontrollü yönlendirme yapmayı tercih edin.',
            impact: 'orta',
            difficulty: 'orta',
            example: `<meta http-equiv="refresh" content="${seconds}; URL=${targetUrl}"> yerine <a href="${targetUrl}">Bu sayfaya git</a>`,
            explanation: 'Gecikmeli meta refresh yönlendirmeleri, kullanıcı deneyimini olumsuz etkileyebilir, erişilebilirlik sorunlarına yol açabilir ve bazı tarayıcılarda engellenir veya uyarı gösterilir.',
            reference: 'https://www.w3.org/TR/WCAG21/#timing-adjustable',
            category: 'SEO'
          });
        }
        
        // İç sayfalara meta refresh ile yönlendirme
        if (isInternalUrl) {
          issues.push({
            type: 'info',
            field: 'meta',
            message: 'İç sayfaya meta refresh ile yönlendirme yapılıyor.',
            suggestion: 'Site içi yönlendirmeler için sunucu taraflı yönlendirme veya JavaScript tabanlı çözümler daha uygundur.',
            impact: 'düşük',
            difficulty: 'kolay',
            example: `<meta http-equiv="refresh" content="${seconds}; URL=${targetUrl}">`,
            explanation: 'İç sayfalara meta refresh ile yönlendirme yapmak, site içi link juice akışını olumsuz etkileyebilir ve crawl budget\'ınızı verimsiz kullanmanıza neden olabilir.',
            reference: 'https://support.google.com/webmasters/answer/139066',
            category: 'SEO'
          });
        }
      } else {
        // Hatalı meta refresh formatı
        issues.push({
          type: 'error',
          field: 'meta',
          message: 'Hatalı formatta meta refresh etiketi tespit edildi.',
          suggestion: 'Meta refresh etiketinin doğru formatını kullanın veya tercihen HTTP yönlendirmesi kullanın.',
          impact: 'yüksek',
          difficulty: 'kolay',
          example: `<meta http-equiv="refresh" content="${content}"> yerine <meta http-equiv="refresh" content="0; URL=https://example.com">`,
          explanation: 'Hatalı formattaki meta refresh etiketleri, tarayıcılarda beklenmedik davranışlara yol açabilir ve doğru çalışmayabilir.',
          reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta',
          category: 'Teknik SEO'
        });
      }
    });
    
    // Birden fazla meta refresh tespit edildi
    if (metaRefreshCount > 1) {
      issues.push({
        type: 'error',
        field: 'meta',
        message: `Sayfada ${metaRefreshCount} adet meta refresh etiketi bulundu.`,
        suggestion: 'Bir sayfada sadece bir adet yönlendirme olmalıdır. Fazla meta refresh etiketlerini kaldırın.',
        impact: 'yüksek',
        difficulty: 'kolay',
        example: 'Sayfada birden fazla <meta http-equiv="refresh"> etiketi var.',
        explanation: 'Birden fazla meta refresh etiketi, tarayıcılarda çakışmalara ve öngörülemeyen davranışlara neden olabilir. Bu, kullanıcı deneyimini ciddi şekilde bozar ve arama motorları tarafından spam olarak algılanabilir.',
        reference: 'https://developers.google.com/search/docs/crawling-indexing/301-redirects',
        category: 'Teknik SEO'
      });
    }
  } else {
    // Hiç meta refresh yok - bu iyi bir durum
    successes.push({
      field: 'meta',
      message: 'Sayfada meta refresh ile yönlendirme kullanılmamış, bu SEO açısından olumlu bir durumdur.',
      impact: 'orta'
    });
  }
  
  return { issues, successes };
}

/**
 * Sayfa içindeki formların validation özelliklerini ve erişilebilirlik durumunu analiz eder
 * @param $ Cheerio API referansı
 * @returns Tespit edilen sorunlar ve başarılı noktalar
 */
/**
 * Sayfa içindeki formların validation özelliklerini ve erişilebilirlik durumunu analiz eder
 * @param $ Cheerio API referansı
 * @returns Tespit edilen sorunlar ve başarılı noktalar
 */
function analyzeFormValidation($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  
  // Formu olmayan sayfalar için erken dönüş
  const forms = $('form');
  if (forms.length === 0) {
    successes.push({
      field: 'form',
      message: 'Sayfada form elementi bulunamadı, bu nedenle form validasyonu gereksiz.',
      impact: 'accessibility'
    });
    return { issues, successes };
  }
  
  // Her form için ayrı analiz
  forms.each((formIndex, formElement) => {
    const $form = $(formElement);
    const formId = $form.attr('id') || `form-${formIndex + 1}`;
    const formAction = $form.attr('action') || '';
    const formMethod = ($form.attr('method') || 'get').toLowerCase();
    const inputs = $form.find('input, select, textarea');
    
    // Form temel özellik kontrolleri
    if (!formAction) {
      issues.push({
        type: 'warning',
        field: 'form',
        message: `"${formId}" formunda action özelliği tanımlanmamış.`,
        suggestion: 'Her forma bir action özelliği ekleyin, boş olsa bile.',
        impact: 'orta',
        difficulty: 'kolay',
        example: `<form id="${formId}" action="/submit-form" method="${formMethod}">`,
        explanation: 'Action özelliği olmayan formlar, JavaScript olmadan çalışmaz ve erişilebilirlik sorunlarına yol açabilir.',
        reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form',
        category: 'Erişilebilirlik'
      });
    }
    
    if (formMethod === 'get' && inputs.length > 3) {
      issues.push({
        type: 'info',
        field: 'form',
        message: `"${formId}" formu GET metodu kullanıyor ve ${inputs.length} adet input içeriyor.`,
        suggestion: 'Çok sayıda input içeren formlar için POST metodunu tercih edin.',
        impact: 'düşük',
        difficulty: 'kolay',
        example: `<form id="${formId}" action="${formAction}" method="post">`,
        explanation: `GET metodu, form verilerini URL'de gönderir ve uzun URL'lere neden olabilir. 
Ayrıca hassas verilerin URL'de görünmesine yol açabilir.`,
        reference: 'https://developer.mozilla.org/en-US/docs/Learn/Forms/Sending_and_retrieving_form_data',
        category: 'Güvenlik'
      });
    }
    
    // Validation kontrolü yapılacak input sayısı
    let totalInputs = 0;
    let validatedInputs = 0;
    let inputsWithLabels = 0;
    let accessibleInputs = 0;
    
    // Her input için validation kontrolü
    inputs.each((_, inputElement) => {
      const $input = $(inputElement);
      const inputType = $input.attr('type') || 'text';
      const inputId = $input.attr('id') || '';
      const inputName = $input.attr('name') || '';
      
      // Gizli veya submit inputlar için validation gerekmez
      if (inputType === 'hidden' || inputType === 'submit' || inputType === 'button' || inputType === 'reset') {
        return;
      }
      
      totalInputs++;
      
      // Validation özellikleri kontrolü
      const hasRequired = $input.attr('required') !== undefined;
      const hasPattern = $input.attr('pattern') !== undefined;
      const hasMinlength = $input.attr('minlength') !== undefined;
      const hasMaxlength = $input.attr('maxlength') !== undefined;
      const hasMin = $input.attr('min') !== undefined;
      const hasMax = $input.attr('max') !== undefined;
      
      // HTML5 tipleri kontrolü
      const isSpecialType = ['email', 'url', 'tel', 'number', 'date', 'time', 'datetime-local', 'month', 'week'].includes(inputType);
      
      // Input validation durumu
      if (hasRequired || hasPattern || hasMinlength || hasMaxlength || hasMin || hasMax || isSpecialType) {
        validatedInputs++;
      }
      
      // Label kontrolü
      const hasDirectLabel = $form.find(`label[for="${inputId}"]`).length > 0;
      const hasWrappingLabel = $input.parent('label').length > 0;
      
      if (hasDirectLabel || hasWrappingLabel) {
        inputsWithLabels++;
      }
      
      // Erişilebilirlik kontrolü
      const hasAriaLabel = $input.attr('aria-label') !== undefined;
      const hasAriaLabelledBy = $input.attr('aria-labelledby') !== undefined;
      const hasPlaceholder = $input.attr('placeholder') !== undefined;
      
      if (hasDirectLabel || hasWrappingLabel || hasAriaLabel || hasAriaLabelledBy) {
        accessibleInputs++;
      } else if (hasPlaceholder && !hasDirectLabel && !hasWrappingLabel) {
        // Sadece placeholder yeterli değildir
        issues.push({
          type: 'warning',
          field: 'form',
          message: `"${formId}" formunda ${inputType} tipi input sadece placeholder kullanıyor, label eksik.`,
          suggestion: 'Her input için görünür bir label ekleyin, sadece placeholder yeterli değildir.',
          impact: 'orta',
          difficulty: 'kolay',
          example: `<label for="${inputId || 'example-id'}">Input Etiketi</label>\n<input type="${inputType}" id="${inputId || 'example-id'}" ${hasPlaceholder ? 'placeholder="..."' : ''}>`,
          explanation: 'Placeholder, label yerine geçmez ve erişilebilirlik standartlarına uymaz. Placeholder, input içine veri girildiğinde kaybolur.',
          reference: 'https://www.w3.org/WAI/tutorials/forms/labels/',
          category: 'Erişilebilirlik'
        });
      }
      
      // E-posta inputu için özel kontrol
      if (inputType === 'email' && !hasPattern) {
        // Email için pattern önerisi
        issues.push({
          type: 'info',
          field: 'form',
          message: `"${formId}" formundaki e-posta alanı için gelişmiş doğrulama eksik.`,
          suggestion: 'E-posta inputlarına daha sıkı bir doğrulama deseni ekleyin.',
          impact: 'düşük',
          difficulty: 'kolay',
          example: `<input type="email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$" title="Geçerli bir e-posta adresi girin">`,
          explanation: 'HTML5 email tipi, temel bir e-posta doğrulaması yapar, ancak daha sıkı kurallar için pattern özelliği de eklenmelidir.',
          reference: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email',
          category: 'Form Validasyonu'
        });
      }
    });
    
    // Label kullanımını değerlendir
    if (totalInputs > 0 && inputsWithLabels < totalInputs) {
      issues.push({
        type: 'warning',
        field: 'form',
        message: `"${formId}" formundaki ${totalInputs} inputun sadece ${inputsWithLabels} tanesi label ile ilişkilendirilmiş.`,
        suggestion: 'Her input için bir label ekleyin veya aria-label kullanın.',
        impact: 'yüksek',
        difficulty: 'kolay',
        example: '<label for="input-id">Input Adı</label>\n<input id="input-id" type="text">',
        explanation: 'Label olmayan inputlar, erişilebilirlik standartlarına uymaz ve ekran okuyucu kullanan ziyaretçiler için sorun oluşturur. Ayrıca, kullanıcı deneyimini de olumsuz etkiler.',
        reference: 'https://www.w3.org/WAI/tutorials/forms/labels/',
        category: 'Erişilebilirlik'
      });
    }
    
    // Validation durumunu değerlendir
    if (totalInputs > 0) {
      const validationRatio = validatedInputs / totalInputs;
      
      if (validationRatio === 1) {
        // Tüm inputlar doğrulanıyor
        successes.push({
          field: 'form',
          message: `"${formId}" formundaki tüm inputlar (${totalInputs}/${totalInputs}) doğrulama içeriyor, bu mükemmel.`,
          impact: 'yüksek'
        });
      } else if (validationRatio >= 0.7) {
        // İyi oranda validation var
        successes.push({
          field: 'form',
          message: `"${formId}" formunda ${validatedInputs}/${totalInputs} input doğrulama içeriyor, bu iyi bir oran.`,
          impact: 'orta'
        });
        
        if (validationRatio < 1) {
          issues.push({
            type: 'info',
            field: 'form',
            message: `"${formId}" formundaki ${totalInputs - validatedInputs} input için doğrulama eksik.`,
            suggestion: 'Tüm kritik inputlar için validation ekleyin (required, pattern, minlength vb.).',
            impact: 'düşük',
            difficulty: 'kolay',
            example: '<input type="text" required minlength="3" pattern="[A-Za-z0-9]+">',
            explanation: 'Form validation, kullanıcı hatalarını azaltır ve form güvenliğini artırır. HTML5 validation özellikleri, JavaScript olmadan temel doğrulama sağlar.',
            reference: 'https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation',
            category: 'Form Validasyonu'
          });
        }
      } else if (validationRatio > 0) {
        // Yetersiz validation var
        issues.push({
          type: 'warning',
          field: 'form',
          message: `"${formId}" formundaki inputların sadece ${validatedInputs}/${totalInputs} tanesi doğrulama içeriyor.`,
          suggestion: 'Daha fazla input için validation ekleyin (required, pattern, minlength vb.).',
          impact: 'orta',
          difficulty: 'orta',
          example: '<input type="text" required minlength="3">\n<input type="email" required pattern=".+@.+\\..+">',
          explanation: 'Yetersiz form validation, spam gönderimlerine ve kullanıcı hatalarına neden olabilir. HTML5 validation özellikleri kolay ve etkili bir çözümdür.',
          reference: 'https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation',
          category: 'Form Validasyonu'
        });
      } else {
        // Hiç validation yok
        issues.push({
          type: 'error',
          field: 'form',
          message: `"${formId}" formundaki hiçbir input doğrulama içermiyor.`,
          suggestion: 'En az temel validasyon ekleyin (required özelliği ve uygun input tipleri).',
          impact: 'yüksek',
          difficulty: 'kolay',
          example: '<input type="text" required>\n<input type="email" required>\n<input type="tel" pattern="[0-9]{10}">',
          explanation: 'Form validation olmadan, formunuz spam ve geçersiz veriler için açık bir hedef haline gelir. Bu, veri kalitesini düşürür ve güvenlik riskleri oluşturabilir.',
          reference: 'https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation',
          category: 'Form Validasyonu'
        });
      }
      
      // Submit butonu kontrolü
      const hasSubmitButton = $form.find('button[type="submit"], input[type="submit"]').length > 0;
      
      if (!hasSubmitButton) {
        issues.push({
          type: 'warning',
          field: 'form',
          message: `"${formId}" formunda submit butonu bulunamadı.`,
          suggestion: 'Her forma bir submit butonu ekleyin.',
          impact: 'orta',
          difficulty: 'kolay',
          example: '<button type="submit">Gönder</button> veya <input type="submit" value="Gönder">',
          explanation: 'Submit butonu olmayan formlar, klavye kullanıcıları için erişilemez olabilir ve kullanıcı deneyimini olumsuz etkiler.',
          reference: 'https://www.w3.org/WAI/tutorials/forms/instructions/',
          category: 'Erişilebilirlik'
        });
      }
    }
  });
  
  return { issues, successes };
}

// --- Video/embed erişimi ---
function analyzeVideoEmbed($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  if ($('video,iframe,embed').length > 0) successes.push({ field: 'media', message: 'Video/embed içerik mevcut.', impact: 'content' });
  else issues.push({ type: 'info', field: 'media', message: 'Video/embed içerik yok.', suggestion: 'Zengin medya için video veya embed ekleyin.', impact: 'content', difficulty: 'kolay', example: `<video src="video.mp4"></video>`, explanation: 'Video veya embed, zengin medya için kullanılır. Zengin medya için video veya embed ekleyin.', reference: 'https://developers.google.com/search/docs/appearance/video-use', category: 'SEO' });
  return { issues, successes };
}

// --- Tablo ve liste erişilebilirliği ---
function analyzeTableListAccessibility($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  if ($('table').length > 0) successes.push({ field: 'table', message: 'Tablo mevcut.', impact: 'content' });
  if ($('ul,ol').length > 0) successes.push({ field: 'list', message: 'Liste mevcut.', impact: 'content' });
  return { issues, successes };
}

// --- PDF/download linki kontrolü ---
function analyzeDownloadLinks($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  const pdfLinks = $("a[href$='.pdf']").length;
  if (pdfLinks > 0) successes.push({ field: 'download', message: `${pdfLinks} adet PDF/download linki var.`, impact: 'content' });
  else successes.push({ field: 'download', message: 'PDF/download linki yok.', impact: 'content' });
  return { issues, successes };
}

// --- Harici kaynak sayısı ---
function analyzeExternalResources($: CheerioAPI, url: string): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  const allLinks = $("a[href]").toArray();
  const internalLinks = allLinks.filter(a => {
    const href = $(a).attr('href') || '';
    return href.startsWith('/') || href.includes(url.replace(/https?:\/\//, '').split('/')[0]);
  });
  const externalLinks = allLinks.length - internalLinks.length;
  if (externalLinks > 20) issues.push({ type: 'info', field: 'link', message: 'Çok fazla harici link var.', suggestion: 'Harici link sayısını azaltın.', impact: 'SEO', difficulty: 'orta', example: `<a href="https://site.com">Site</a>`, explanation: 'Harici link sayısı, SEO için önemli bir faktördür. Harici link sayısını azaltın.', reference: 'https://developers.google.com/search/docs/advanced/crawl-docs/link-structure', category: 'SEO' });
  else successes.push({ field: 'link', message: 'Harici link sayısı makul.', impact: 'SEO' });
  return { issues, successes };
}

// --- Skip link kontrolü ---
function analyzeSkipLink($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  if ($('a[href="#main"],a[href="#content"],a.skip-link').length > 0) {
    successes.push({ field: 'a11y', message: 'Skip link mevcut.', impact: 'accessibility' });
  } else {
    issues.push({ type: 'info', field: 'a11y', message: 'Skip link yok.', suggestion: 'Ana içeriğe atlamak için skip link ekleyin.', impact: 'accessibility', difficulty: 'kolay', example: `<a href="#main" class="skip-link">Skip to main content</a>`, explanation: 'Skip link, kullanıcıların sayfanın ana içeriğine hızlıca erişmesini sağlar. Ana içeriğe atlamak için skip link ekleyin.', reference: 'https://developers.google.com/search/docs/appearance/skip-links', category: 'SEO' });
  }
  return { issues, successes };
}

// --- Focus-visible/focus outline kontrolü (örnek) ---
function analyzeFocusVisible($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  // Not: Gerçek kontrol için CSS parse gerekir, burada örnek olarak kontrol ediliyor.
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  successes.push({ field: 'a11y', message: 'Focus-visible/focus outline kontrolü (örnek).', impact: 'accessibility' });
  return { issues, successes };
}

// --- ARIA role kullanımı ---
function analyzeARIARoles($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  if ($('[role]').length > 0) successes.push({ field: 'a11y', message: 'ARIA role kullanılmış.', impact: 'accessibility' });
  else issues.push({ type: 'info', field: 'a11y', message: 'ARIA role kullanılmamış.', suggestion: 'Erişilebilirlik için uygun ARIA role kullanın.', impact: 'accessibility', difficulty: 'kolay', example: `<button role="button">Button</button>`, explanation: 'ARIA role, erişilebilirlik için kullanılır. Erişilebilirlik için uygun ARIA role kullanın.', reference: 'https://developers.google.com/search/docs/appearance/aria-use', category: 'SEO' });
  return { issues, successes };
}

// --- Lang etiketi doğruluğu ---
function analyzeLangTag($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  const lang = $('html').attr('lang');
  if (lang && /^[a-z]{2}(-[A-Z]{2})?$/.test(lang)) successes.push({ field: 'lang', message: 'Lang etiketi doğru.', impact: 'accessibility' });
  else issues.push({ type: 'info', field: 'lang', message: 'Lang etiketi eksik veya hatalı.', suggestion: 'Doğru bir lang etiketi ekleyin. Örn: <html lang="tr">', impact: 'accessibility', difficulty: 'kolay', example: `<html lang="tr">`, explanation: 'Lang etiketi, erişilebilirlik için kullanılır. Doğru bir lang etiketi ekleyin. Örn: <html lang="tr">', reference: 'https://developers.google.com/search/docs/appearance/html-language-declarations', category: 'SEO' });
  return { issues, successes };
}

// --- Input placeholder ---
function analyzeInputPlaceholder($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  $('input').each((_, el) => {
    if ($(el).attr('placeholder')) successes.push({ field: 'input', message: 'Input placeholder mevcut.', impact: 'accessibility' });
    else issues.push({ type: 'info', field: 'input', message: 'Input placeholder yok.', suggestion: 'Inputlara açıklayıcı placeholder ekleyin.', impact: 'accessibility', difficulty: 'kolay', example: `<input type="email" placeholder="Email">`, explanation: 'Placeholder, form güvenliği ve erişilebilirlik için kullanılır. Inputlara açıklayıcı placeholder ekleyin.', reference: 'https://developers.google.com/search/docs/appearance/form-input-placeholder', category: 'SEO' });
  });
  if ($('input').length === 0) successes.push({ field: 'input', message: 'Input bulunamadı.', impact: 'accessibility' });
  return { issues, successes };
}

// --- Button label ---
function analyzeButtonLabel($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  $('button').each((_, el) => {
    if ($(el).text().trim().length > 0) successes.push({ field: 'button', message: 'Button label mevcut.', impact: 'accessibility' });
    else issues.push({ type: 'info', field: 'button', message: 'Button label yok.', suggestion: 'Tüm butonlara açıklayıcı metin ekleyin.', impact: 'accessibility', difficulty: 'kolay', example: `<button>Button</button>`, explanation: 'Button label, form güvenliği ve erişilebilirlik için kullanılır. Tüm butonlara açıklayıcı metin ekleyin.', reference: 'https://developers.google.com/search/docs/appearance/form-input-button', category: 'SEO' });
  });
  if ($('button').length === 0) successes.push({ field: 'button', message: 'Button bulunamadı.', impact: 'accessibility' });
  return { issues, successes };
}



// --- Dokunmatik alan boyutu analizi (geliştirilmiş) ---
function analyzeTouchTarget($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  
  // Etkileşimli elementleri seç
  const interactiveElements = $('a, button, input[type="button"], input[type="submit"], input[type="reset"], input[type="checkbox"], input[type="radio"], select, [role="button"], [tabindex]');
  
  let smallTargetCount = 0;
  
  // Her bir etkileşimli elementi kontrol et
  interactiveElements.each((_, element) => {
    // Element genişlik ve yüksekliğini al
    const width = $(element).css('width');
    const height = $(element).css('height');
    const padding = $(element).css('padding');
    
    // Inline stil varsa kontrol et
    if (width || height) {
      // Piksel değerlerini sayısal değerlere dönüştür
      const numWidth = parseInt(width || '0', 10);
      const numHeight = parseInt(height || '0', 10);
      
      // 44x44 piksel minimum hedef boyutu (WCAG 2.5.5 için)
      if (numWidth > 0 && numWidth < 44 || numHeight > 0 && numHeight < 44) {
        smallTargetCount++;
        
        // Maksimum 5 örnek göster
        if (smallTargetCount <= 5) {
          const elementHtml = $.html(element).substring(0, 100);
          issues.push({
            type: 'warning',
            field: 'a11y',
            message: `Küçük dokunmatik hedef: ${$(element).prop('tagName')} elementi 44x44px minimum boyutunun altında.`,
            suggestion: 'Mobil kullanıcılar için dokunmatik hedefler en az 44x44px olmalıdır.',
            impact: 'accessibility',
            difficulty: 'orta',
            example: elementHtml,
            explanation: 'Küçük dokunmatik hedefler, özellikle motor becerileri sınırlı olan kullanıcılar için tıklamayı zorlaştırır ve hatalara neden olabilir.',
            reference: 'https://www.w3.org/WAI/WCAG21/Understanding/target-size.html',
            category: 'Accessibility'
          });
        }
      }
    }
  });
  
  if (smallTargetCount === 0) {
    successes.push({
      field: 'a11y',
      message: 'Tüm etkileşimli elementler yeterli dokunmatik alan boyutuna sahip görünüyor.',
      impact: 'accessibility'
    });
  } else if (smallTargetCount > 5) {
    issues.push({
      type: 'warning',
      field: 'a11y',
      message: `Toplamda ${smallTargetCount} adet küçük dokunmatik hedef tespit edildi.`,
      suggestion: 'Tüm dokunmatik hedeflerin en az 44x44px boyutunda olduğundan emin olun.',
      impact: 'accessibility',
      difficulty: 'orta',
      category: 'Accessibility'
    });
  }
  
  return { issues, successes };
}

// --- Landmark analizi (geliştirilmiş) ---
function analyzeLandmarkDuplicates($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [];
  const successes: SEOSuccess[] = [];
  
  // Landmark etiketleri ve rolleri
  const landmarks = {
    header: 'banner',
    nav: 'navigation',
    main: 'main', 
    aside: 'complementary',
    footer: 'contentinfo',
    section: 'region',
    form: 'form',
    search: 'search'
  };
  
  // Her landmark kategorisi için benzersiz olmayan olanları kontrol et
  for (const [tag, role] of Object.entries(landmarks)) {
    const elements = $(tag);
    const roledElements = $(`[role="${role}"]`);
    
    // Landmark etiketi veya rolü sayısını hesapla
    const totalCount = elements.length + roledElements.filter((_, el) => ($(el).prop('tagName')?.toLowerCase() || '') !== tag).length;
    
    // Birden fazla varsa sorun oluştur
    if (totalCount > 1) {
      // Her bir bağımsız öğenin içeriğini getir
      const examples: string[] = [];
      
      elements.each((i, el) => {
        if (examples.length < 3) {
          examples.push($.html(el).substring(0, 100) + '...');
        }
      });
      
      roledElements.each((i, el) => {
        const tagName = $(el).prop('tagName');
        if (tagName && tagName.toLowerCase() !== tag && examples.length < 3) {
          examples.push($.html(el).substring(0, 100) + '...');
        }
      });
      
      issues.push({
        type: 'info',
        field: 'a11y',
        message: `Birden fazla ${tag} etiketi veya [role="${role}"] özelliği var (${totalCount} adet).`,
        suggestion: `Her landmark türü mümkünse bir kez kullanılmalı veya aria-labelledby/aria-label ile ayırt edilmelidir.`,
        impact: 'accessibility',
        difficulty: 'orta',
        example: examples.join('\n\n'),
        explanation: `Çoklu landmark etiketleri, ekran okuyucu kullanıcıları için kafa karıştırıcı olabilir. Her bir ${tag} etiketi veya [role="${role}"] özelliği benzersiz bir alana işaret etmeli veya aria-label ile ayırt edilmelidir.`,
        reference: 'https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/',
        category: 'Accessibility'
      });
    }
  }
  
  // Role olmayan landmark'ları kontrol et
  $('header, nav, main, aside, footer, section, form').each((_, el) => {
    if (!$(el).attr('role') && !$(el).attr('aria-label') && !$(el).attr('aria-labelledby')) {
      const tagName = ($(el).prop('tagName') || '').toLowerCase();
      
      if (tagName === 'section' || tagName === 'form') {
        issues.push({
          type: 'info',
          field: 'a11y',
          message: `${tagName} etiketinin tanımlayıcı aria özelliği eksik.`,
          suggestion: `${tagName} etiketine aria-label veya aria-labelledby ekleyin.`,
          impact: 'accessibility',
          difficulty: 'kolay',
          example: $.html(el).substring(0, 100),
          explanation: `${tagName} etiketlerinin erişilebilir olması için aria-label veya aria-labelledby ile tanımlanması önerilir.`,
          reference: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles',
          category: 'Accessibility'
        });
      }
    }
  });
  
  // Landmark olmayan (kök) role değeri atanmış elementleri kontrol et
  const invalidRoleValues = $('[role]:not([role="banner"]):not([role="navigation"]):not([role="main"]):not([role="complementary"]):not([role="contentinfo"]):not([role="region"]):not([role="form"]):not([role="search"]):not([role="dialog"]):not([role="alert"]):not([role="alertdialog"]):not([role="application"]):not([role="tablist"]):not([role="tabpanel"]):not([role="group"]):not([role="button"]):not([role="checkbox"]):not([role="link"]):not([role="list"]):not([role="listitem"]):not([role="menu"]):not([role="menuitem"])');
  
  if (invalidRoleValues.length > 0) {
    issues.push({
      type: 'warning',
      field: 'a11y',
      message: `Geçersiz veya az kullanılan role değerleri tespit edildi.`,
      suggestion: 'ARIA role değerlerinin WAI-ARIA spesifikasyonuna uygun olduğundan emin olun.',
      impact: 'accessibility',
      difficulty: 'orta',
      example: $.html(invalidRoleValues[0]).substring(0, 100),
      explanation: 'Geçersiz veya az bilinen role değerleri, ekran okuyucularda beklenmedik sonuçlar doğurabilir.',
      reference: 'https://www.w3.org/TR/wai-aria-1.1/#role_definitions',
      category: 'Accessibility'
    });
  }
  
  // Başarı mesajları
  if (issues.length === 0) {
    successes.push({
      field: 'a11y',
      message: 'Tüm landmark etiketleri uygun şekilde kullanılmış görünüyor.',
      impact: 'accessibility'
    });
  }
  
  return { issues, successes };
}

// --- Görselde alt etiketi uzunluğu ---
function analyzeImgAltLength($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  $('img').each((_, el) => {
    const alt = $(el).attr('alt') || '';
    if (alt.length > 100) issues.push({ type: 'info', field: 'img', message: 'Alt etiketi çok uzun.', suggestion: 'Alt etiketini 100 karakterden kısa tutun.', impact: 'accessibility', difficulty: 'kolay', example: `<img src="image.jpg" alt="...">`, explanation: 'Alt etiket uzunluğu, görselin anlamını ve içeriğini arama motorlarına açıklayıcı bilgi verir. Alt etiketini 100 karakterden kısa tutun.', reference: 'https://developers.google.com/search/docs/appearance/image-use', category: 'SEO' });
    else if (alt.length > 0) successes.push({ field: 'img', message: 'Alt etiketi uzunluğu uygun.', impact: 'accessibility' });
  });
  if ($('img').length === 0) successes.push({ field: 'img', message: 'Görsel bulunamadı.', impact: 'accessibility' });
  return { issues, successes };
}

// --- Formda autocomplete ---
function analyzeFormAutocomplete($: CheerioAPI): { issues: SEOIssue[]; successes: SEOSuccess[] } {
  const issues: SEOIssue[] = [], successes: SEOSuccess[] = [];
  $('form').each((_, el) => {
    if ($(el).attr('autocomplete') === 'off') successes.push({ field: 'form', message: 'Formda autocomplete kapalı.', impact: 'security' });
    else issues.push({ type: 'info', field: 'form', message: 'Formda autocomplete açık.', suggestion: 'Gizli alanlar için autocomplete="off" kullanın.', impact: 'security', difficulty: 'kolay', example: `<input type="email" autocomplete="off">`, explanation: 'Autocomplete, form güvenliği ve erişilebilirlik için kullanılır. Gizli alanlar için autocomplete="off" kullanın.', reference: 'https://developers.google.com/search/docs/appearance/form-input-autocomplete', category: 'SEO' });
  });
  if ($('form').length === 0) successes.push({ field: 'form', message: 'Form bulunamadı.', impact: 'security' });
  return { issues, successes };
}

export async function registerRoutes(app: Express): Promise<Server> {
  registerResearchApi(app);
  // put application routes here
  // prefix all routes with /api

  app.post("/api/analyze-url", async (req, res) => {
    const { url, keyword, brand, language = 'tr' } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL gerekli" });
    }
    try {
      // 1. Sayfa içeriğini çek
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);
      // 2. Lighthouse ile skorları al
      // Geçici dizin belirleme - izin hatası çözmek için kullanıcının kendi klasöründe oluştur
      const tmpDir = path.join(os.tmpdir(), 'lighthouse-' + Date.now());
      // İzin hatası olmayacak şekilde Chrome başlatma konfigürasyonu
      const chrome = await chromeLauncher.launch({ 
        chromeFlags: ['--headless', `--user-data-dir=${tmpDir}`, '--no-sandbox', '--disable-gpu'], 
        chromePath: 'C:/Users/mirza/Downloads/chrome-win/chrome-win/chrome.exe',
        ignoreDefaultFlags: true
      });
      const opts = { port: chrome.port, output: 'json' as any, logLevel: 'error' as const };
      const runnerResult = await lighthouse(url, opts);
      const lhr = runnerResult && runnerResult.lhr ? runnerResult.lhr : { categories: {} };
      const categories: Record<string, any> = lhr.categories || {};
      const seoScore = Math.round((categories.seo && categories.seo.score ? categories.seo.score : 0) * 100);
      const performanceScore = Math.round((categories.performance && categories.performance.score ? categories.performance.score : 0) * 100);
      const accessibilityScore = Math.round((categories.accessibility && categories.accessibility.score ? categories.accessibility.score : 0) * 100);
      const bestPracticesScore = Math.round((categories["best-practices"] && categories["best-practices"].score ? categories["best-practices"].score : 0) * 100);
      await chrome.kill();
      // 3. Senkron analizler (önceki fonksiyonlar)
      let issues: SEOIssue[] = [], successes: SEOSuccess[] = [], improvements: SEOImprovement[] = [];
      const syncResults = [
        analyzeTitle($),
        analyzeDescription($),
        analyzeH1($),
        analyzeImgAlt($),
        analyzeCanonical($, url),
        analyzeRobots($),
        analyzeOpenGraph($),
        // analyzeTwitterCard fonksiyonu tanımlı değil, bu satırı kaldırdım
        analyzeViewport($),
        analyzeFavicon($),
        analyzeStructuredData($),
        analyzeLazyLoading($),
        analyzeLargeImages($),
        analyzeAssets($, html),
        analyzeDuplicateMeta($),
        analyzeNoindexNofollow($),
        analyzeHreflang($),
        analyzeAMP($),
        analyzeReadability($),
        analyzeLinks($, url),
        analyzeFormSecurity($, url),
        analyzeRenderBlocking($, url),
        analyzeDuplicateContent($, url),
        analyzeKeywordSpam($, url),
        analyzeAccessibility($, url),
        analyzeMetaCharsetViewport($),
        analyzeFontSize($),
        analyzeInputTypes($),
        analyzeTabOrderLandmarks($),
        analyzeDescriptionEmojiSpam($),
        analyzeTitleSymbolSpam($),
        analyzeUTMLinks($),
        analyzeH1AtTop($),
        analyzeHeadingHierarchy($),
        analyzeMetaRefresh($),
        analyzeFormValidation($),
        analyzeVideoEmbed($),
        analyzeTableListAccessibility($),
        analyzeDownloadLinks($),
        analyzeExternalResources($, url),
        analyzeSkipLink($),
        analyzeFocusVisible($),
        analyzeARIARoles($),
        analyzeLangTag($),
        analyzeInputPlaceholder($),
        analyzeButtonLabel($),
        analyzeLandmarkDuplicates($),
        analyzeTouchTarget($),
        analyzeImgAltLength($),
        analyzeFormAutocomplete($)
      ];
      for (const result of syncResults) {
        issues = issues.concat(result.issues);
        successes = successes.concat(result.successes);
      }
      // 4. Asenkron analizler
      const [
        brokenLinkResult,
        robotsSitemapResult,
        socialImgResult,
        pwaResult,
        favIconResult
      ] = await Promise.all([
        analyzeBrokenLinks($, url),
        analyzeRobotsSitemap(url), // analyzeRobotsSitemap fonksiyonu yalnızca bir argüman almalı
        analyzeSocialImages($, url),
        analyzePWA($, url),
        analyzeFaviconIcons(url)
      ]);
      issues = issues.concat(brokenLinkResult.issues, robotsSitemapResult.issues, socialImgResult.issues, pwaResult.issues, favIconResult.issues);
      successes = successes.concat(brokenLinkResult.successes, robotsSitemapResult.successes, socialImgResult.successes, pwaResult.successes, favIconResult.successes);
      // 5. Güvenlik başlıkları
      const headerObj: Record<string, string | undefined> = Object.fromEntries(
        Object.entries(response.headers || {}).map(([k, v]) => [k.toLowerCase(), typeof v === 'string' ? v : undefined])
      );
      const secResult = analyzeSecurityHeaders(headerObj);
      issues = issues.concat(secResult.issues);
      successes = successes.concat(secResult.successes);
      // 6. HTTPS/HTTP kontrolü
      const protoResult = analyzeProtocol(url);
      issues = issues.concat(protoResult.issues);
      successes = successes.concat(protoResult.successes);
      // 7. Badge/rozet sistemi
      const badges = getBadges(successes);
      // 8. Improvements alanı
      improvements = generateImprovements(issues);
      // 9. Her issue ve improvement için detaylı alanlar ekle
      const addDetails = (item: any) => ({
        ...item,
        details: {
          selector: item.field ? `[${item.field}]` : '',
          line: null, // Satır bilgisi için ek analiz gerekebilir
          example: item.example || '<!-- Örnek kod burada -->',
          explanation: item.explanation || item.suggestion || 'Bu kriter SEO ve kullanıcı deneyimi için önemlidir.',
          reference: item.reference || 'https://developers.google.com/search/docs/appearance/title-link',
          category: item.category || 'SEO',
          suggestion: item.suggestion || '',
          impact: item.impact || '',
          difficulty: item.difficulty || '',
        }
      });
      // 10. Response formatı zenginleştirildi
      res.json({
        url,
        language,
        seoScore,
        performanceScore,
        accessibilityScore,
        bestPracticesScore,
        issues: issues.map(addDetails),
        successes: successes.map(addDetails),
        improvements: improvements.map(addDetails),
        badges,
        message: 'Ultra-zengin analiz ve öneri formatı!'
      });
    } catch (err: unknown) {
      let message = "Bilinmeyen hata";
      if (err && typeof err === "object" && "message" in err) {
        message = (err as any).message;
      }
      res.status(500).json({ error: "Analiz sırasında hata oluştu", detail: message });
    }
  });

  // BACKLINK ANALYSIS
  app.post("/api/backlink-analysis", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL gerekli" });
    }
    try {
      // Sayfanın HTML'ini çek
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);
      // Tüm <a href> linklerini bul
      const links: string[] = [];
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (href && href.startsWith("http")) {
          links.push(href);
        }
      });
      // Domainleri çıkar
      const domains = Array.from(new Set(links.map(link => {
        try {
          return new URL(link).hostname;
        } catch {
          return null;
        }
      }).filter(Boolean)));
      // Kaliteyi basitçe link sayısına göre uydur
      const quality = {
        high: Math.floor(links.length * 0.3),
        medium: Math.floor(links.length * 0.5),
        low: links.length - Math.floor(links.length * 0.3) - Math.floor(links.length * 0.5)
      };
      // Yeni ve kaybolan linkler için örnek
      const newLinks = links.slice(0, 2);
      const lostLinks = links.slice(-1);
      res.json({
        url,
        total: links.length,
        domains: domains.length,
        quality,
        newLinks,
        lostLinks
      });
    } catch (err: unknown) {
      let message = "Bilinmeyen hata";
      if (err && typeof err === "object" && "message" in err) {
        message = (err as any).message;
      }
      res.status(500).json({ error: "Backlink analizi sırasında hata oluştu", detail: message });
    }
  });

  // COMPETITOR ANALYSIS
  app.post("/api/competitor-analysis", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL gerekli" });
    }
    // TODO: Gerçek rakip analizi entegrasyonu
    res.json({
      url,
      competitors: [
        { name: "rakip1.com", score: 82, backlinks: 2043, traffic: 543000, keywords: 4281 },
        { name: "rakip2.com", score: 79, backlinks: 1876, traffic: 491000, keywords: 3942 }
      ]
    });
  });

  // KEYWORD ANALYSIS
  app.post("/api/keyword-analysis", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL gerekli" });
    }
    try {
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);
      // Sayfa metnini al
      const text = $("body").text();
      // Temizle ve kelimelere ayır
      const words = text
        .replace(/[^\wğüşöçıİĞÜŞÖÇ\s]/gi, " ")
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 2 && isNaN(Number(w)));
      // Stopword'leri çıkar (Türkçe + İngilizce)
      const stopwords = [
        "the","and","for","are","but","not","with","you","that","this","was","from","have","has","had","all","can","will","your","his","her","its","our","their","who","what","which","when","where","how","why","bir","ve","ile","ama","gibi","için","çok","daha","olan","olarak","bu","şu","o","da","de","ki","mi","mu","mü","ben","sen","biz","siz","onlar","şey","her","hiç","en","ya","ya da","hem","hem de","veya","ve de","ya da","çünkü","ancak","fakat","lakin","veya","ve de","ya da","çünkü","ancak","fakat","lakin","veya","ve de","ya da","çünkü","ancak","fakat","lakin"
      ];
      const filtered = words.filter(w => !stopwords.includes(w));
      // Kelime sıklığı
      const freq: Record<string, number> = {};
      filtered.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
      // En sık geçen 10 kelime
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
      const keywords = sorted.slice(0, 10).map(([keyword, count], i) => ({
        keyword,
        volume: count * 100 + 1000 - i * 50, // Sahte hacim
        difficulty: Math.min(100, 30 + i * 7), // Sahte zorluk
        cpc: +(Math.random() * 5).toFixed(2), // Sahte CPC
        position: i + 1
      }));
      res.json({ url, keywords });
    } catch (err: unknown) {
      let message = "Bilinmeyen hata";
      if (err && typeof err === "object" && "message" in err) {
        message = (err as any).message;
      }
      res.status(500).json({ error: "Anahtar kelime analizi sırasında hata oluştu", detail: message });
    }
  });

  // CONTENT ANALYSIS
  app.post("/api/content-analysis", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL gerekli" });
    }
    // TODO: Gerçek içerik analizi entegrasyonu
    res.json({
      url,
      contents: [
        { url: "/blog/seo-tips-2023", title: "Top SEO Tips for 2023", length: 2456, score: 92, readability: 78 }
      ]
    });
  });

  // SITE AUDIT
  app.post("/api/site-audit", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL gerekli" });
    }
    // TODO: Gerçek site audit entegrasyonu
    res.json({
      url,
      errors: 8,
      warnings: 24,
      improvements: 17,
      categories: [
        { name: "Broken Links", count: 4, severity: "error" },
        { name: "Missing Meta Tags", count: 12, severity: "warning" }
      ]
    });
  });

  // REPORT GENERATION
  app.post("/api/report", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL gerekli" });
    }
    // TODO: Gerçek rapor oluşturma entegrasyonu
    res.json({
      url,
      reportUrl: `/reports/${encodeURIComponent(url)}.pdf`
    });
  });

  // Kullanıcı Kaydı
  app.post("/api/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Kullanıcı adı ve şifre gerekli." });
    }
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: "Bu kullanıcı adı zaten alınmış." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    users.push({ username, passwordHash });
    res.json({ success: true });
  });

  // Kullanıcı Girişi
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(400).json({ error: "Kullanıcı bulunamadı." });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: "Şifre hatalı." });
    }
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  });

  // Proje Oluştur
  app.post("/api/projects", authMiddleware, (req: any, res: any) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Proje adı gerekli" });
    const project = { id: projects.length + 1, name, userId: req.user.id };
    projects.push(project);
    res.json(project);
  });

  // Projeleri Listele
  app.get("/api/projects", authMiddleware, (req: any, res: any) => {
    const userProjects = projects.filter(p => p.userId === req.user.id);
    res.json(userProjects);
  });

  // Proje Sil
  app.delete("/api/projects/:id", authMiddleware, (req: any, res: any) => {
    const id = parseInt(req.params.id);
    const idx = projects.findIndex(p => p.id === id && p.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ error: "Proje bulunamadı" });
    projects.splice(idx, 1);
    res.json({ success: true });
  });

  // Proje Güncelle
  app.put("/api/projects/:id", authMiddleware, (req: any, res: any) => {
    const id = parseInt(req.params.id);
    const { name } = req.body;
    const project = projects.find(p => p.id === id && p.userId === req.user.id);
    if (!project) return res.status(404).json({ error: "Proje bulunamadı" });
    if (name) project.name = name;
    res.json(project);
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
