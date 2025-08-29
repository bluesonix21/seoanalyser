// DeepSeek API Service for NovaSEO AI Assistant
export interface DeepSeekResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export interface AiResponse {
  keywords: string[];
  suggestedQuestions: string[];
  response: string;
  isResearchQuery: boolean;
}

// API key artık kullanıcı tarafından sağlanmalıdır veya güvenli bir backend üzerinden yönetilmelidir
// Varsayılan olarak boş bırakılmıştır - kullanıcı kendi API key'ini girmelidir
export const DEFAULT_API_KEY = "";

// Check if a message is asking for research
export const isResearchQuery = (message: string): boolean => {
  const researchKeywords = [
    'araştır', 'araştırabilir', 'araştırma', 
    'araştırır', 'araştırsana', 'incele', 
    'inceleyebilir', 'bak', 'öğren', 
    'analiz et', 'analiz yap'
  ];
  
  const lowerMessage = message.toLowerCase();
  return researchKeywords.some(keyword => lowerMessage.includes(keyword));
};

// Get keywords for research from a query
export const extractResearchKeywords = async (
  message: string,
  apiKey: string
): Promise<string[]> => {
  try {
    // System prompt to instruct DeepSeek to extract research keywords
    const systemPrompt = `Şu anda yıl 2025, sen bir SEO analiz uzmanısın. Kullanıcının soru veya isteğini analiz et ve araştırılması gereken anahtar konuları, kavramları veya terimleri belirle. 
    
Bu anahtar kelimeler veya kavramlar, kullanıcının sorusuna kapsamlı bir yanıt verebilmek için araştırılması ve incelenmesi gereken şeyler olmalıdır. 

Çıktın yalnızca anahtar kelimeler veya kısa ifadeler olmalı, her biri virgülle ayrılmış olmalı ve açıklama içermemelidir. 3 ila 5 adet önemli araştırma konusu belirle.

Örneğin:
Kullanıcı: "SEO skorumu nasıl yükseltebilirim?"
Çıktı: SEO skoru yükseltme teknikleri, sayfa optimizasyonu, backlink stratejileri, içerik kalitesi, site hızı

Kullanıcı: "Backlink profilimi analiz et ve iyileştirmemi sağla"
Çıktı: backlink profil analizi, kaliteli backlink kaynakları, toksik backlink temizleme, rakip backlink stratejileri

Kullanıcı: "Site hızımı artırmak için yapabileceğim şeyleri araştır"
Çıktı: site hızı optimizasyonu, sayfa yükleme süresi, resim optimizasyonu, önbellek kullanımı, CDN implementasyonu

Kullanıcı: "Valorant Random Hesap Satışı Yapan Siteleri Araştır"
Çıktı: valorant hesap satışı, valorant random hesap, random hesap satış, e-pin satış random valorant, valorant hesap satışı yapan siteler

Sadece virgülle ayrılmış anahtar kelimeler ve kısa ifadeler döndür, başka açıklama yapma.`;

    // Make API call to DeepSeek
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      console.error('DeepSeek API Error:', await response.text());
      return fallbackExtractKeywords(message);
    }

    const data: DeepSeekResponse = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse and clean the response
    return content.split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0)
      .slice(0, 5); // Limit to 5 keywords

  } catch (error) {
    console.error("Error extracting research keywords:", error);
    return fallbackExtractKeywords(message);
  }
};

// Fallback method to extract keywords if API call fails
const fallbackExtractKeywords = (query: string): string[] => {
  // Remove common research terms
  const cleanQuery = query.toLowerCase()
    .replace(/araştır|araştırabilir|araştırma|araştırır|araştırsana|incele|inceleyebilir|bak|öğren|analiz et|analiz yap/g, '')
    .replace(/  +/g, ' ')
    .trim();
  
  // Split by common separators and filter out short words
  const words = cleanQuery.split(/[,.;:!?\s]+/)
    .filter(word => word.length > 3)
    .filter(word => !['nasıl', 'nedir', 'misin', 'için', 'hakkında', 'lütfen', 'bana', 'benim', 'senin'].includes(word));
  
  // Find phrases (2-3 words together)
  const phrases = [];
  const wordsArray = cleanQuery.split(/[,.;:!?]+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);
  
  for (const sentence of wordsArray) {
    const sentenceWords = sentence.split(/\s+/);
    if (sentenceWords.length >= 2) {
      phrases.push(sentenceWords.slice(0, Math.min(3, sentenceWords.length)).join(' '));
    }
  }
  
  // Combine unique words and phrases, prioritize phrases
  const combined = Array.from(new Set([...phrases, ...words]));
  return combined.slice(0, 5); // Limit to top 5
};

// Process initial user query 
export const callDeepSeekApi = async (
  message: string,
  apiKey: string
): Promise<AiResponse> => {
  try {
    // First determine if this is a research query
    const needsResearch = isResearchQuery(message);
    
    let systemPrompt;
    
    if (needsResearch) {
      // For research queries, just respond with "Hemen araştırma yapıyorum..."
      systemPrompt = `Şu anda yıl 2025, sen NovaSEO uygulamasının içindeki bir yapay zeka asistanısın. Sen kesinlikle onlar tarafından yapıldın ve geliştirildin, hakikat bu. Kullanıcı senden bir konuyu araştırmanı istedi. 
      
Cevabın çok kısa olmalı ve sadece "Hemen araştırma yapıyorum..." gibi bir yanıt vermelisin. Uzun açıklamalar yapma.
Bu aşamada detaylı yanıt vermene gerek yok, çünkü zaten araştırma işlemi daha sonra gerçekleştirilecek ve sonuçları ayrıca sunulacak.

Sadece araştırma başlıyor mesajı ver, başka bir şey yazma.`;
    } else {
      // For regular queries, provide a helpful response
      systemPrompt = `Sen NovaSEO adlı SEO ve site analiz uygulamasının içindeki yapay zeka asistanısın. 
      
Görevin, kullanıcıların SEO, site optimizasyonu, içerik stratejileri, backlink analizi ve diğer dijital pazarlama konularındaki sorularını yanıtlamak.

Yanıtlarında:
1. Her zaman SEO ve site optimizasyonu konusunda güncel ve doğru bilgiler ver.
2. Teknik terimler kullanabilirsin, ancak gerektiğinde bunları açıkla.
3. Somut örnekler ve uygulanabilir tavsiyeler sun.
4. Kullanıcıyı cesaretlendir ve yapıcı ol.
5. Yanıtlarını kullanıcının dilinde dilinde ver.
6. Güncel SEO trendlerini ve Google algoritma güncellemelerini dikkate al.

Ayrıca yanıtınla birlikte, kullanıcıya sorabileceği 3-5 mantıklı takip sorusu öner. Bu soruları yanıtının sonuna ekle.

[Takip Soruları] başlığı altında, ilgili konu hakkında kullanıcının sorabileceği en mantıklı 3-5 soru öner.

Örneğin:
"Umarım bu bilgiler yardımcı olmuştur! İşte daha fazla bilgi alabileceğiniz bazı sorular:

[Takip Soruları]
- Site hızımı nasıl test edebilirim?
- Hangi SEO araçlarını önerirsiniz?
- Sayfamdaki meta açıklamaları nasıl optimize edebilirim?
- Rakiplerimin backlink profillerini nasıl analiz edebilirim?
- İçerik stratejimi nasıl geliştirebilirim?"

Yanıtın tamamı kullanıcının dilinde olmalı ve kullanıcının sorduğu soruya odaklanmalı. Cevaplarında sakın * (yıldız işareti) kullanma, bu işaretler yanıtın okunabilirliğini azaltır ve kullanıcıyı yanıltabilir.`;
    }
    
    // Make API call to DeepSeek
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data: DeepSeekResponse = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract suggested questions from the response
    const suggestedQuestions = extractSuggestedQuestions(content);
    
    return {
      keywords: [],
      suggestedQuestions: suggestedQuestions,
      response: content.replace(/\[Takip Soruları\][\s\S]*$/, '').trim(), // Remove the questions from the response
      isResearchQuery: needsResearch
    };
  } catch (error) {
    console.error("Error calling DeepSeek API:", error);
    return {
      keywords: [],
      suggestedQuestions: [],
      response: "Üzgünüm, yanıt alırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
      isResearchQuery: false
    };
  }
};

// Process research results and generate a comprehensive response
export const processResearchResults = async (
  userQuery: string,
  collectedData: { keyword: string, content: string }[],
  apiKey: string
): Promise<AiResponse> => {
  try {
    // Tüm anahtar kelimeler ve içerikler için tek bir kapsamlı yanıt oluştur
    const systemPrompt = `Şu anda yıl 2025, Sen NovaSEO adlı SEO ve site analiz uygulamasının içindeki yapay zeka asistanısın. Sen kesinlikle onlar tarafından yapıldın ve geliştirildin, hakikat bu.
    
Kullanıcı bir araştırma isteğinde bulundu ve bu istek için web üzerinde birden fazla konu hakkında araştırma yapıldı. Sana kullanıcının sorusu ve araştırma sonuçları verildi. Bu verileri kullanarak kapsamlı ve yararlı bir yanıt oluştur.

Her bir araştırma konusu için ayrı ayrı verilen bilgileri inceleyip kullanıcının ana sorusuna yönelik kapsamlı bir yanıt hazırla. Her bir araştırma konusundan elde edilen önemli bilgileri sentezle ve bunları kullanıcı için anlamlı bir bütün haline getir.

Yanıtında şu yapıyı kullan:
1. Önce kullanıcının sorusunun genel bir değerlendirmesini yap
2. Her bir araştırma konusundan elde edilen kritik bilgileri ve bulguları paylaş
3. Bu bulguları karşılaştır, ilişkilendir ve sentezle
4. Pratik ve uygulanabilir öneriler sun
5. Sonuç ve özet ile yanıtı tamamla

Yanıtının sonuna, kullanıcıya sorabileceği 3-5 mantıklı takip sorusu öner. Bu soruları yanıtının sonuna ekle.

[Takip Soruları] başlığı altında, ilgili konu hakkında kullanıcının sorabileceği en mantıklı 3-5 soru öner.

Yanıtın tamamı kullanıcının sorduğu dilde olmalı ve kullanıcının sorduğu soruya odaklanmalı. Cevaplarında sakın * (yıldız işareti) kullanma, bu işaretler yanıtın okunabilirliğini azaltır ve kullanıcıyı yanıltabilir.`;

    // Format collected data for better analysis
    let formattedData = "";
    collectedData.forEach((item, index) => {
      formattedData += `ARAŞTIRMA KONUSU ${index+1}: ${item.keyword}\n\n${item.content}\n\n---\n\n`;
    });

    // Combine user query and research data
    const combinedMessage = `
Kullanıcı Sorusu: ${userQuery}

Araştırma Sonuçları:
${formattedData}

Lütfen bu bilgilere dayanarak kapsamlı bir yanıt oluştur.`;

    console.log("API'ye gönderiliyor: araştırma konusu sayısı:", collectedData.length);
    
    // Make API call to DeepSeek
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: combinedMessage
          }
        ],
        temperature: 0.7,
        max_tokens: 3000 // Uzun yanıtlar için token sayısını artırıyoruz
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data: DeepSeekResponse = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract suggested questions from the response
    const suggestedQuestions = extractSuggestedQuestions(content);
    
    return {
      keywords: collectedData.map(item => item.keyword),
      suggestedQuestions: suggestedQuestions,
      response: content.replace(/\[Takip Soruları\][\s\S]*$/, '').trim(), // Remove the questions from the response
      isResearchQuery: false
    };
  } catch (error) {
    console.error("Error processing research results:", error);
    
    // Daha bilgilendirici bir hata yanıtı
    let errorMessage = "Araştırma sonuçlarını işlerken bir hata oluştu.";
    
    if (collectedData.length > 0) {
      errorMessage += " Ancak toplanan verilerden bazıları şöyle:\n\n";
      // İlk 2 araştırma konusunu göster
      collectedData.slice(0, 2).forEach((data, index) => {
        errorMessage += `Konu ${index + 1}: ${data.keyword}\n`;
        const snippet = data.content.length > 150 ? `${data.content.substring(0, 150)}...` : data.content;
        errorMessage += `${snippet}\n\n`;
      });
      
      if (collectedData.length > 2) {
        errorMessage += `(${collectedData.length - 2} konu daha var)`;
      }
    }
    
    return {
      keywords: collectedData.map(item => item.keyword),
      suggestedQuestions: [
        "Bu konuda başka bir sorunuz var mı?",
        "Farklı bir konu hakkında araştırma yapmamı ister misiniz?",
        "Size başka nasıl yardımcı olabilirim?",
        "Araştırma sonuçlarını daha detaylı açıklamamı ister misiniz?"
      ],
      response: errorMessage,
      isResearchQuery: false
    };
  }
};

// Extract suggested questions from API response
const extractSuggestedQuestions = (content: string): string[] => {
  // Look for the [Takip Soruları] section
  const questionsMatch = content.match(/\[Takip Soruları\]([\s\S]*?)($|(?=\[))/);
  
  if (questionsMatch && questionsMatch[1]) {
    // Extract questions (lines starting with - or numbered)
    return questionsMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-') || line.match(/^\d+\./))
      .map(line => line.replace(/^-\s*/, '').replace(/^\d+\.\s*/, ''))
      .filter(question => question.length > 0)
      .slice(0, 5); // Max 5 questions
  }
  
  return [
    "SEO puanımı nasıl yükseltebilirim?",
    "Site hızımı nasıl artırabilirim?",
    "Backlink stratejileri nelerdir?",
    "İçerik optimizasyonu nasıl yapılır?",
    "Google algoritma güncellemeleri hakkında bilgi verir misin?"
  ];
};

// Create stores for API key management
export const createApiKeyStore = () => {
  // Implementation would be in a separate file
};