import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = 'xxxx';
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * AI-powered summarizer using Gemini 2.5 Flash
 * @param {string} title - Article title
 * @param {string} content - Article content
 * @returns {Promise<Array<string>>} Summary sentences
 */
async function summarize(title, content) {
    if (!content) return [];

    // Clean content to reduce tokens
    const cleanedContent = cleanContent(content);

    try {
        const prompt = `뉴스 요약 (3-4줄, 줄바꿈 구분):

${title}

${cleanedContent}`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });

        const text = response.text || '';
        
        // Split by newlines to get individual sentences
        const sentences = text
            .split(/\n+/)
            .map(s => s.trim())
            .filter(s => s.length > 10);

        if (sentences.length === 0) {
            return [text.trim()];
        }

        return sentences;
    } catch (error) {
        console.error('Gemini API error:', error.message);
        return fallbackSummarize(cleanedContent);
    }
}

/**
 * Clean content to reduce token usage
 */
function cleanContent(content) {
    return content
        // Remove multiple whitespace
        .replace(/\s+/g, ' ')
        // Remove reporter bylines
        .replace(/\([가-힣]+=[가-힣]+\)\s*[가-힣\s]+기자/g, '')
        .replace(/\[[가-힣]+\]\s*[가-힣\s]+기자/g, '')
        .replace(/[가-힣]+\s기자\s*=/g, '')
        .replace(/[가-힣]+\s기자$/g, '')
        // Remove email addresses
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
        // Remove phone numbers
        .replace(/\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/g, '')
        // Remove photo captions
        .replace(/사진[=:][^\s]+/g, '')
        .replace(/제공[=:][^\s]+/g, '')
        .replace(/자료[=:][^\s]+/g, '')
        // Remove ad/promo text
        .replace(/기사문의\s*및\s*제보[^\n]*/g, '')
        .replace(/카톡[^\n]*/g, '')
        .replace(/무단\s*전재[^\n]*/g, '')
        .replace(/저작권[^\n]*/g, '')
        // Remove hashtags
        .replace(/#[^\s#]+/g, '')
        // Clean up
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Fallback heuristic summarizer when API fails
 */
function fallbackSummarize(content) {
    let cleanContent = content
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\([가-힣]+=[가-힣]+\)\s*[가-힣 ]+기자/g, '')
        .replace(/\[[가-힣]+=[가-힣]+\]\s*[가-힣 ]+기자/g, '')
        .replace(/[가-힣 ]+기자\s*=/g, '')
        .trim();

    const sentences = cleanContent.split(/(?<=[.?!])\s+/);
    const filtered = sentences.filter(s => s.length >= 20 && s.length <= 200);
    
    return filtered.slice(0, 4).map(s => {
        s = s.trim();
        return /[.?!]$/.test(s) ? s : s + '.';
    });
}

export { summarize };
