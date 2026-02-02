import { GoogleGenAI } from '@google/genai';

let ai = null;

function initAI(apiKey) {
    if (!ai && apiKey) {
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
}

/**
 * AI-powered summarizer using Gemini 3.0 Flash
 */
async function summarize(title, content, apiKey) {
    if (!content) return [];

    const genAI = initAI(apiKey);
    if (!genAI) {
        console.error('Gemini API key not configured');
        return fallbackSummarize(content);
    }

    const cleanedContent = cleanContent(content);

    try {
        const prompt = `뉴스 요약 (3-4줄, 줄바꿈 구분):

${title}

${cleanedContent}`;

        const response = await genAI.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });

        const text = response.text || '';
        
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

function cleanContent(content) {
    return content
        .replace(/\s+/g, ' ')
        .replace(/\([가-힣]+=[가-힣]+\)\s*[가-힣\s]+기자/g, '')
        .replace(/\[[가-힣]+\]\s*[가-힣\s]+기자/g, '')
        .replace(/[가-힣]+\s기자\s*=/g, '')
        .replace(/[가-힣]+\s기자$/g, '')
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
        .replace(/\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}/g, '')
        .replace(/사진[=:][^\s]+/g, '')
        .replace(/제공[=:][^\s]+/g, '')
        .replace(/자료[=:][^\s]+/g, '')
        .replace(/기사문의\s*및\s*제보[^\n]*/g, '')
        .replace(/카톡[^\n]*/g, '')
        .replace(/무단\s*전재[^\n]*/g, '')
        .replace(/저작권[^\n]*/g, '')
        .replace(/#[^\s#]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function fallbackSummarize(content) {
    let cleanContent = content
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const sentences = cleanContent.split(/(?<=[.?!])\s+/);
    const filtered = sentences.filter(s => s.length >= 20 && s.length <= 200);
    
    return filtered.slice(0, 4).map(s => {
        s = s.trim();
        return /[.?!]$/.test(s) ? s : s + '.';
    });
}

export { summarize };
