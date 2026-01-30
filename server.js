const { Hono } = require('hono');
const { serveStatic } = require('hono/cloudflare-workers');
const scraper = require('./scraper');
const summarizer = require('./summarizer');
const detailTemplate = require('./detail_template');

const app = new Hono();

// Cache to prevent pounding the server if multiple refreshes happen instantly
let cache = {
    data: null,
    lastUpdated: 0,
    isUpdating: false
};

const CACHE_DURATION = 60 * 1000; // 1 minute cache

// API Route for News Data
app.get('/api/news', async (c) => {
    try {
        const now = Date.now();
        
        // Return cache if fresh enough (1 min)
        if (cache.data && (now - cache.lastUpdated < CACHE_DURATION)) {
            console.log('Serving cached API data');
            return c.json(cache.data);
        }

        // Trigger update
        await updateCache();
        return c.json(cache.data);

    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to scrape news' }, 500);
    }
});

// For Cloudflare Workers, the root '/' will be handled by serveStatic (app_shell.html)
// However, we might need a specific route if it's not working as index.html
app.get('/', async (c) => {
    // In Workers Sites, public/index.html is usually served automatically.
    // If your entry is app_shell.html, we can redirect or serve it.
    return c.redirect('/app_shell.html');
});

app.get('/view', async (c) => {
    const articleUrl = c.req.query('url');
    if (!articleUrl) {
        return c.text('Missing url parameter', 400);
    }

    // Try to find article in cache first
    let article = null;
    if (cache.data) {
        article = cache.data.find(a => a.url === articleUrl);
    }

    if (!article) {
        if (!cache.data) {
             await updateCache();
             article = cache.data.find(a => a.url === articleUrl);
        }
    }

    if (!article) {
        return c.text('Article not found in recent list. Please refresh the main page.', 404);
    }

    const summarySentences = summarizer.summarize(article.title, article.content);
    const html = detailTemplate.generateDetailHTML(article, summarySentences);
    return c.html(html);
});

async function updateCache() {
    if (cache.isUpdating) return;
    cache.isUpdating = true;
    console.log('Scraping new data...');
    try {
        const articles = await scraper.scrapeRecentArticles();
        cache.data = articles;
        cache.lastUpdated = Date.now();
    } catch (e) {
        console.error("Scrape failed", e);
        throw e;
    } finally {
        cache.isUpdating = false;
    }
}

// Serve static files from the 'public' directory
// Cloudflare Workers Sites/Pages often expect 'public' or '.' depending on config.
app.use('/*', serveStatic({ root: './public' }));

export default app;
