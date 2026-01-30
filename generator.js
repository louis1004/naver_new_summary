const fs = require('fs');
const path = require('path');

const ARTIFACT_FILE = 'articles.json';
const OUTPUT_FILE = 'C:\\Users\\bugat\\Desktop\\index.html';

const SECTION_NAMES = {
    '100': '정치',
    '101': '경제',
    '102': '사회',
    '103': '생활/문화',
    '104': '세계'
};

function generateHTMLString(articles, options = {}) {
    if (!articles) {
        const fs = require('fs');
        if (fs.existsSync(ARTIFACT_FILE)) {
            articles = JSON.parse(fs.readFileSync(ARTIFACT_FILE, 'utf8'));
        } else {
            return '<h1>No articles found. Please wait for the initial scrape.</h1>';
        }
    }

    const { linkGenerator } = options; 
    // Default link generator for existing server behavior
    const getLink = linkGenerator || ((article) => `/view?url=${encodeURIComponent(article.url)}`);

    // Group by section
    const grouped = {};
    articles.forEach(article => {
        if (!grouped[article.sectionId]) {
            grouped[article.sectionId] = [];
        }
        grouped[article.sectionId].push(article);
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>네이버 뉴스 요약 (24H)</title>
    <style>
        :root {
            --primary-color: #03C75A;
            --bg-color: #ffffff;
            --text-color: #333;
            --text-secondary: #888;
            --border-color: #eee;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--bg-color);
            color: var(--text-color);
            font-size: 13px; /* Slightly smaller font for compact view */
        }
        /* header removed */
        .container {
            max-width: 1400px; /* Wider container for 2 columns */
            margin: 1rem auto;
            padding: 0 1rem;
        }
        
        /* Grid for Sections */
        .sections-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr); /* 2 Columns */
            gap: 2rem;
        }

        .section-container {
            margin-bottom: 2rem;
            break-inside: avoid; /* Print friendly */
        }
        .section-title {
            border-bottom: 2px solid var(--primary-color);
            padding-bottom: 0.5rem;
            margin: 0 0 0.5rem;
            font-size: 1.1rem;
            color: #000;
            font-weight: bold;
        }
        .news-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .news-item {
            display: flex;
            align-items: center;
            padding: 0.3rem 0; /* Tighter padding */
            border-bottom: 1px solid var(--border-color);
        }
        .news-item:last-child {
            border-bottom: none;
        }
        .news-item:hover {
            background-color: #f9f9f9;
        }
        .meta-info {
            flex-shrink: 0;
            width: 60px; /* Reduced width since press is gone */
            font-size: 0.8rem;
            color: var(--text-secondary);
            display: flex;
            gap: 5px;
        }
        /* .press removed */
        .time {
            width: 100%; /* Full width of meta-info */
            text-align: center; /* Center align time */
        }
        .title {
            flex-grow: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-weight: 500;
        }
        .title a {
            text-decoration: none;
            color: var(--text-color);
        }
        .title a:hover {
            color: var(--primary-color);
            text-decoration: underline;
        }
        @media (max-width: 900px) {
            .sections-grid { grid-template-columns: 1fr; } /* Stack on smaller screens */
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="sections-grid">
            ${Object.keys(grouped).map(id => `
                <div id="section-${id}" class="section-container">
                    <h2 class="section-title">${SECTION_NAMES[id] || id}</h2>
                    <ul class="news-list">
                        ${grouped[id].map(article => `
                            <li class="news-item">
                                <div class="meta-info">
                                    <span class="time">${formatTime(article.publishTime)}</span>
                                </div>
                                <div class="title" title="${article.title}"> <!-- Tooltip for full title -->
                                    <a href="${getLink(article)}">${article.title}</a>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
    `;

    return htmlContent;
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diff = (now - date) / 1000 / 60; // minutes

    if (diff < 60) return `${Math.floor(diff)}분 전`;
    if (diff < 60 * 24) return `${Math.floor(diff / 60)}시간 전`;
    
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
}

if (require.main === module) {
    const content = generateHTMLString();
    fs.writeFileSync(OUTPUT_FILE, content);
    console.log(`Successfully generated index.html at ${OUTPUT_FILE}`);
}

module.exports = { generateHTMLString };
