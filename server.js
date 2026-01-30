import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import manifest from '__STATIC_CONTENT_MANIFEST';
import * as scraper from './scraper.js';
import * as summarizer from './summarizer.js';
import * as detailTemplate from './detail_template.js';

const app = new Hono();

app.onError((err, c) => {
    console.error(`Error: ${err.message}`);
    console.error(err.stack);
    return c.text(`Internal Server Error: ${err.message}\n${err.stack}`, 500);
});

// Cache to prevent pounding the server if multiple refreshes happen instantly
let cache = {
    data: [], // Initialize to empty array instead of null
    lastUpdated: 0,
    isUpdating: false,
    updatePromise: null // Store promise for synchronization
};

// Cache policy: List Cache (1 min), Summary Cache (1 hour)
const LIST_CACHE_DURATION = 60 * 1000; 
let summaryCache = new Map(); // url -> { article, summarySentences, timestamp }

// URL normalization for matching (ignores query params)
function normalizeUrl(url) {
    if (!url) return '';
    try {
        const u = new URL(url);
        return u.origin + u.pathname;
    } catch (e) {
        return url.split('?')[0];
    }
}

// API Route for News Data
app.get('/api/news', async (c) => {
    try {
        // Always trigger update per user request for absolute real-time data
        await updateCache();
        return c.json(cache.data || []);
    } catch (error) {
        console.error(error);
        return c.json({ 
            error: 'Failed to scrape news', 
            message: error.message
        }, 500);
    }
});

app.get('/', async (c) => {
    return serveStatic({ path: './app_shell.html', manifest })(c);
});

app.get('/view', async (c) => {
    const articleUrl = c.req.query('url');
    if (!articleUrl) return c.text('Missing URL', 400);

    const now = Date.now();
    const normalizedUrl = normalizeUrl(articleUrl);

    // 1. Check Summary Cache first (1 hour)
    if (summaryCache.has(normalizedUrl)) {
        const cached = summaryCache.get(normalizedUrl);
        if (now - cached.timestamp < 3600 * 1000) {
            console.log('Serving cached summary');
            return c.html(detailTemplate.generateDetailHTML(cached.article, cached.summarySentences));
        }
    }

    try {
        // 2. Perform Lazy Summary (Deep Crawl on demand)
        const articleDetails = await scraper.getArticleSummary(articleUrl);
        if (!articleDetails || !articleDetails.content) {
            return c.text('Failed to fetch article content or article is unavailable.', 404);
        }

        const summarySentences = summarizer.summarize(articleDetails.title, articleDetails.content);
        
        // 3. Cache the result
        summaryCache.set(normalizedUrl, {
            article: articleDetails,
            summarySentences,
            timestamp: now
        });

        return c.html(detailTemplate.generateDetailHTML(articleDetails, summarySentences));
    } catch (e) {
        console.error("View failed", e);
        return c.text(`Error generating summary: ${e.message}`, 500);
    }
});

async function updateCache() {
    if (cache.isUpdating) {
        // If already updating, wait for that promise to resolve
        return cache.updatePromise;
    }
    
    cache.isUpdating = true;
    cache.updatePromise = (async () => {
        console.log('Scraping new data...');
        try {
            const articles = await scraper.scrapeRecentArticles();
            cache.data = articles || [];
            cache.lastUpdated = Date.now();
        } catch (e) {
            console.error("Scrape failed", e);
            // Don't throw here so we don't break consecutive requests, 
            // but log it
        } finally {
            cache.isUpdating = false;
            cache.updatePromise = null;
        }
    })();

    return cache.updatePromise;
}

// Serve static files using manifest
app.use('/*', serveStatic({ manifest }));

export default app;
