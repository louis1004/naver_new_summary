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
            /* Force Dark Mode */
            --bg-color: #1a1a1a;
            --text-color: #e0e0e0;
            --secondary-text: #aaaaaa;
            --border-color: #333;
            --box-bg: #2a2a2a;
            --primary-color: #03C75A;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem 1rem;
        }
        .btn-back {
            display: inline-block;
            text-decoration: none;
            color: var(--secondary-text);
            margin-bottom: 2rem;
            font-size: 0.9rem;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            background-color: var(--border-color);
            transition: background 0.2s;
        }
        .btn-back:hover {
            opacity: 0.8;
            color: var(--text-color);
        }
        h1 {
            font-size: 1.8rem;
            margin-bottom: 0.5rem;
            word-break: keep-all;
        }
        .meta {
            font-size: 0.9rem;
            color: var(--secondary-text);
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
        }
        .summary-box {
            background-color: var(--box-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
        }
        .summary-title {
            font-weight: bold;
            font-size: 1.1rem;
            color: #03C75A;
            margin-bottom: 1rem;
        }
        .summary-content {
            list-style-type: none; /* Remove default bullets */
            padding: 0;
            margin: 0;
        }
        .summary-content li {
            margin-bottom: 1.2rem;
            padding-bottom: 1.2rem;
            border-bottom: 1px solid #eee;
            font-size: 1.1rem;
            line-height: 1.7;
            position: relative;
            padding-left: 1.5rem;
        }
        .summary-content li::before {
            content: "•";
            color: #03C75A;
            font-weight: bold;
            position: absolute;
            left: 0;
            top: 0;
        }
        .summary-content li:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        .actions {
            text-align: center;
            margin-top: 3rem;
        }
        .btn-primary {
            display: inline-block;
            background-color: #03C75A;
            color: white;
            text-decoration: none;
            padding: 0.8rem 2rem;
            border-radius: 30px;
            font-weight: bold;
            transition: opacity 0.2s;
            box-shadow: 0 4px 6px rgba(3, 199, 90, 0.2);
        }
        .btn-primary:hover {
            opacity: 0.9;
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

module.exports = { generateDetailHTML };
