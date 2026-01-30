/**
 * Simple heuristic summarizer for Korean news.
 * Extracts key sentences based on position and basic constraints.
 * @param {string} title 
 * @param {string} content 
 * @returns {Array<string>} list of summary sentences
 */
function summarize(title, content) {
    if (!content) return [];

    // 1. Clean content
    let cleanContent = content
        .replace(/\n+/g, ' ') // Remove multiple newlines
        .replace(/\s+/g, ' ') // Collapse spaces
        .trim();

    // Remove bylines (e.g., (서울=연합뉴스) 홍길동 기자, [뉴시스] 아무개 기자, 홍길동 기자 =)
    cleanContent = cleanContent
        .replace(/\([가-힣]+=[가-힣]+\)\s*[가-힣 ]+기자/g, '') // (서울=연합뉴스) 홍길동 기자
        .replace(/\[[가-힣]+=[가-힣]+\]\s*[가-힣 ]+기자/g, '') // [서울=뉴시스] 홍길동 기자
        .replace(/[가-힣 ]+기자\s*=/g, '') // 홍길동 기자 =
        .replace(/[가-힣 ]+기자\s*$/g, '') // Ends with 홍길동 기자
        .replace(/#[^\s#]+/g, '') // Remove hashtags (e.g. #국방부)
        .replace(/기사문의\s*및\s*제보.*$/g, '') // Remove explicit reporting lines
        .replace(/카톡\/라인.*$/g, '') // Remove Kakao/Line reporting
        .trim();

    // 2. Split into sentences (simple splitting by ending punctuation)
    // Considering Korean punctuation: . ? !
    const rawSentences = cleanContent.split(/(?<=[.?!])\s+/);

    // 3. Filter and score constraints
    const candidates = rawSentences.filter(s => {
        // Filter out too short/long noise
        if (s.length < 20 || s.length > 200) return false;
        
        // Filter out photo captions and credits
        const badKeywords = ['사진=', '제공=', '캡처', '자료=', 'DB'];
        if (badKeywords.some(k => s.includes(k))) return false;
        
        return true; 
    });

    if (candidates.length === 0) return [content.substring(0, 100) + '...'];

    // 4. Selection Strategy:
    // Take up to 3-5 sentences that are high quality.
    const maxSentences = 4;
    let summary = candidates.slice(0, maxSentences);

    // Ensure they end with punctuation
    summary = summary.map(s => {
        s = s.trim();
        if (!/[.?!]$/.test(s)) {
            return s + '.';
        }
        return s;
    });

    return summary;
}

module.exports = { summarize };
