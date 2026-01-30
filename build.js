const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const scraper = require('./scraper');
const generator = require('./generator');
const summarizer = require('./summarizer');
const detailTemplate = require('./detail_template');

const DIST_DIR = path.join(__dirname, 'dist');
const ARTICLES_DIR = path.join(DIST_DIR, 'articles');

// Ensure directories exist
if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR);
if (!fs.existsSync(ARTICLES_DIR)) fs.mkdirSync(ARTICLES_DIR);

function getArticleFilename(url) {
    // specific filename logic to avoid too long names, using hash
    const hash = crypto.createHash('md5').update(url).digest('hex');
    return `${hash}.html`;
}

async function build() {
    try {
        console.log('Starting build process...');
        
        // 1. Scrape Data
        console.log('Scraping articles...');
        const articles = await scraper.scrapeRecentArticles();
        console.log(`Scraped ${articles.length} articles.`);

        // 2. Generate Index Page
        console.log('Generating index.html...');
        const indexHtml = generator.generateHTMLString(articles, {
            linkGenerator: (article) => `./articles/${getArticleFilename(article.url)}`
        });
        fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);

        // 3. Generate Detail Pages
        console.log('Generating detail pages...');
        articles.forEach(article => {
            const filename = getArticleFilename(article.url);
            const filePath = path.join(ARTICLES_DIR, filename);
            
            // Summarize
            const summary = summarizer.summarize(article.title, article.content);
            
            // Generate HTML
            // Note: detail_template might have a back link relative to root. 
            // If detail is in /articles/xyz.html, href="/" works if hosted at root.
            const detailHtml = detailTemplate.generateDetailHTML(article, summary);
            
            fs.writeFileSync(filePath, detailHtml);
        });

        console.log('Build complete! Output in dist/');

    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    build();
}
