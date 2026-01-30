function generateDetailHTML(article, summarySentences) {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title} - 요약</title>
    <style>
        :root {
            --bg-color: #0f1113;
            --box-bg: #1a1d21;
            --text-color: #e9ecef;
            --secondary-text: #adb5bd;
            --border-color: #2d3436;
            --primary-color: #00d1b2;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.7;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 700px;
            margin: 0 auto;
            padding: 1.5rem 1.25rem;
        }
        .btn-back {
            display: inline-block;
            text-decoration: none;
            color: var(--secondary-text);
            margin-bottom: 2rem;
            font-size: 0.9rem;
            font-weight: 500;
            transition: color 0.2s;
        }
        .btn-back:hover {
            color: var(--primary-color);
        }
        h1 {
            font-size: 1.75rem;
            line-height: 1.4;
            margin: 0 0 1rem 0;
            word-break: keep-all;
            font-weight: 800;
        }
        .meta {
            font-size: 0.9rem;
            color: var(--secondary-text);
            margin-bottom: 2rem;
            display: flex;
            gap: 0.75rem;
        }
        .summary-box {
            background-color: var(--box-bg);
            border-radius: 16px;
            padding: 1.5rem;
            border: 1px solid var(--border-color);
            margin-bottom: 2.5rem;
        }
        .summary-title {
            font-weight: 800;
            font-size: 1.1rem;
            color: var(--primary-color);
            margin-bottom: 1.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .summary-title::before {
            content: "✨";
        }
        .summary-content {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .summary-content li {
            margin-bottom: 1.25rem;
            font-size: 1.05rem;
            position: relative;
            padding-left: 1.5rem;
            color: var(--text-color);
            word-break: keep-all;
        }
        .summary-content li::before {
            content: "•";
            color: var(--primary-color);
            font-weight: bold;
            position: absolute;
            left: 0;
            top: 0;
        }
        .summary-content li:last-child {
            margin-bottom: 0;
        }
        .actions {
            text-align: center;
            padding: 2rem 0;
        }
        .btn-primary {
            display: inline-block;
            background-color: var(--primary-color);
            color: #000;
            text-decoration: none;
            padding: 1rem 2rem;
            border-radius: 12px;
            font-weight: 700;
            transition: transform 0.2s, opacity 0.2s;
        }
        .btn-primary:active {
            transform: scale(0.98);
        }
        @media (max-width: 600px) {
            h1 { font-size: 1.4rem; }
            .summary-box { padding: 1.25rem; }
            .summary-content li { font-size: 0.95rem; }
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="btn-back">&larr; 목록으로</a>
        
        <h1>${article.title}</h1>
        <div class="meta">
            <span>${article.press}</span> &bull; <span>${article.publishTime}</span>
        </div>

        <div class="summary-box">
            <div class="summary-title">3줄 요약</div>
            <ul class="summary-content">
                ${summarySentences.map(s => `<li>${s}</li>`).join('')}
            </ul>
        </div>

        <div class="actions">
            <a href="${article.url}" target="_blank" class="btn-primary">언론사 원문 보기</a>
        </div>
    </div>
</body>
</html>
    `;
}

export { generateDetailHTML };
