function generateLoadingHTML(articleUrl, title, press, publishTime) {
    const safeTitle = title || '기사 로딩 중...';
    const safePress = press || '';
    const safeTime = publishTime || '';
    
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle} - AI 요약</title>
    <style>
        :root {
            --bg-color: #0a0a0a;
            --card-bg: rgba(20, 20, 20, 0.95);
            --text-color: #f5f5f5;
            --secondary-text: #a0a0a0;
            --border-color: rgba(255, 255, 255, 0.1);
            --primary-color: #03C75A;
            --primary-glow: rgba(3, 199, 90, 0.4);
            --accent-gradient: linear-gradient(135deg, #03C75A 0%, #00d4aa 50%, #00ff88 100%);
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif;
            background: var(--bg-color);
            color: var(--text-color);
            min-height: 100vh;
            line-height: 1.7;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: 
                radial-gradient(ellipse at 20% 20%, rgba(3, 199, 90, 0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(0, 212, 170, 0.06) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem 1.5rem;
            position: relative;
            z-index: 1;
        }
        
        .btn-back {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--secondary-text);
            text-decoration: none;
            font-size: 0.9rem;
            padding: 0.7rem 1.2rem;
            border-radius: 30px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            margin-bottom: 2rem;
        }
        
        .btn-back:hover {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-color);
            transform: translateX(-4px);
        }
        
        .card {
            background: var(--card-bg);
            border-radius: 24px;
            padding: 2.5rem;
            border: 1px solid var(--border-color);
            backdrop-filter: blur(20px);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .title {
            font-size: 1.8rem;
            font-weight: 700;
            line-height: 1.4;
            margin-bottom: 1.5rem;
            word-break: keep-all;
        }
        
        .title.loading {
            background: linear-gradient(90deg, #333 25%, #444 50%, #333 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 8px;
            min-height: 2.5rem;
        }
        
        @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        .meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1.5rem;
            font-size: 0.85rem;
            color: var(--secondary-text);
            padding-bottom: 1.5rem;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 2rem;
        }
        
        .summary-section {
            background: linear-gradient(135deg, rgba(3, 199, 90, 0.12) 0%, rgba(0, 212, 170, 0.08) 100%);
            border: 1px solid rgba(3, 199, 90, 0.25);
            border-radius: 20px;
            padding: 2rem;
            margin-bottom: 2rem;
            position: relative;
            overflow: hidden;
            min-height: 200px;
        }
        
        .summary-section::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: var(--accent-gradient);
        }
        
        .summary-header {
            display: flex;
            align-items: center;
            gap: 0.8rem;
            margin-bottom: 1.5rem;
        }
        
        .ai-badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--accent-gradient);
            color: #000;
            font-weight: 700;
            font-size: 0.85rem;
            padding: 0.5rem 1rem;
            border-radius: 20px;
        }
        
        .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            text-align: center;
        }
        
        .loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid var(--border-color);
            border-top: 4px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading-text {
            color: var(--secondary-text);
            font-size: 0.95rem;
        }
        
        .loading-text .dots {
            display: inline-block;
            animation: dots 1.5s steps(4, end) infinite;
        }
        
        @keyframes dots {
            0%, 20% { content: ''; }
            40% { content: '.'; }
            60% { content: '..'; }
            80%, 100% { content: '...'; }
        }
        
        .summary-content {
            font-size: 1rem;
            line-height: 1.9;
            color: var(--text-color);
            white-space: pre-wrap;
            display: none;
        }
        
        .summary-content.loaded { display: block; }
        
        .summary-content p {
            margin-bottom: 1rem;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 12px;
            border-left: 3px solid var(--primary-color);
        }
        
        .summary-content p:last-child { margin-bottom: 0; }
        
        .actions {
            display: none;
            flex-direction: column;
            gap: 1rem;
            margin-top: 2.5rem;
        }
        
        .actions.loaded { display: flex; }
        
        .btn-original {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.8rem;
            background: var(--accent-gradient);
            color: #000;
            text-decoration: none;
            padding: 1.1rem 2rem;
            border-radius: 50px;
            font-weight: 700;
            font-size: 1.05rem;
            transition: all 0.3s ease;
            box-shadow: 0 8px 30px var(--primary-glow);
        }
        
        .btn-original:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 40px var(--primary-glow);
        }
        
        .btn-original svg { width: 20px; height: 20px; }
        
        .powered-by {
            text-align: center;
            font-size: 0.75rem;
            color: var(--secondary-text);
            margin-top: 2rem;
            opacity: 0.6;
        }
        
        .error-message {
            color: #ff6b6b;
            text-align: center;
            padding: 2rem;
            display: none;
        }
        
        @media (max-width: 640px) {
            .container { padding: 1.5rem 1rem; }
            .card { padding: 1.5rem; border-radius: 20px; }
            .title { font-size: 1.4rem; }
            .summary-section { padding: 1.5rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="btn-back">← 목록으로</a>
        
        <div class="card">
            <h1 class="title" id="title">${safeTitle}</h1>
            
            <div class="meta" id="meta">
                <span>📰 ${safePress || '언론사 정보 로딩 중...'}</span>
                <span>🕐 ${safeTime || '--:--'}</span>
            </div>
            
            <div class="summary-section">
                <div class="summary-header">
                    <span class="ai-badge">✨ AI 요약</span>
                </div>
                
                <div class="loading-indicator" id="loading">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">Gemini AI가 기사를 분석하고 있습니다<span class="dots">...</span></p>
                </div>
                
                <div class="summary-content" id="summary"></div>
                <div class="error-message" id="error"></div>
            </div>
            
            <div class="actions loaded" id="actions">
                <a href="${articleUrl}" id="originalLink" target="_blank" rel="noopener" class="btn-original">
                    원문 기사 보기
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                </a>
            </div>
            
            <p class="powered-by">Powered by Gemini 3.0 Flash</p>
        </div>
    </div>
    
    <script>
        const articleUrl = ${JSON.stringify(articleUrl)};
        
        async function loadSummary() {
            try {
                const response = await fetch('/api/summary?url=' + encodeURIComponent(articleUrl));
                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }
                
                // Update title
                document.getElementById('title').textContent = data.title || '제목 없음';
                document.getElementById('title').classList.remove('loading');
                
                // Update meta
                document.getElementById('meta').innerHTML = 
                    '<span>📰 ' + (data.press || '언론사 정보 없음') + '</span>' +
                    '<span>🕐 ' + (data.publishTime || '') + '</span>';
                
                // Update summary
                const summaryEl = document.getElementById('summary');
                if (data.summary && data.summary.length > 0) {
                    summaryEl.innerHTML = data.summary.map(s => '<p>' + s + '</p>').join('');
                } else {
                    summaryEl.innerHTML = '<p>요약을 생성할 수 없습니다.</p>';
                }
                
                // Update original link
                document.getElementById('originalLink').href = data.url || articleUrl;
                
                // Show content, hide loading
                document.getElementById('loading').style.display = 'none';
                summaryEl.classList.add('loaded');
                document.getElementById('actions').classList.add('loaded');
                
                // Update page title
                document.title = (data.title || 'AI 요약') + ' - AI 요약';
                
            } catch (error) {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'block';
                document.getElementById('error').textContent = '요약을 불러오는데 실패했습니다: ' + error.message;
            }
        }
        
        loadSummary();
    </script>
</body>
</html>
    `;
}

function generateDetailHTML(article, summarySentences) {
    const title = article?.title || '제목 없음';
    const press = article?.press || '언론사 정보 없음';
    const publishTime = article?.publishTime || '';
    const url = article?.url || '#';
    const summaryContent = (summarySentences && summarySentences.length > 0) 
        ? summarySentences.map(s => '<p>' + s + '</p>').join('') 
        : '<p>요약을 불러올 수 없습니다.</p>';
    
    return '<!-- Static version - not used -->';
}

export { generateLoadingHTML, generateDetailHTML };
