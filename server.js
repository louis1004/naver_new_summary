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

// Summary cache - only for AI summaries to save tokens
const summaryCache = new Map(); // url -> { title, press, publishTime, url, summary, timestamp }
const SUMMARY_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function normalizeUrl(url) {
    if (!url) return '';
    try {
        const u = new URL(url);
        return u.origin + u.pathname;
    } catch (e) {
        return url.split('?')[0];
    }
}

// API Route for News Data - Always fetch fresh
app.get('/api/news', async (c) => {
    try {
        console.log('Fetching fresh news data...');
        const articles = await scraper.scrapeRecentArticles();
        return c.json(articles || []);
    } catch (error) {
        console.error(error);
        return c.json({ error: 'Failed to scrape news', message: error.message }, 500);
    }
});

app.get('/', async (c) => {
    return serveStatic({ path: './app_shell.html', manifest })(c);
});

// View page - returns shell with article info, loads summary via API
app.get('/view', async (c) => {
    const articleUrl = c.req.query('url');
    const title = c.req.query('title') || '';
    const press = c.req.query('press') || '';
    const time = c.req.query('time') || '';
    
    if (!articleUrl) return c.text('Missing URL', 400);
    
    // Return page with known info, summary loads async
    return c.html(detailTemplate.generateLoadingHTML(articleUrl, title, press, time));
});

// API for summary - called by the view page (with caching)
app.get('/api/summary', async (c) => {
    const articleUrl = c.req.query('url');
    if (!articleUrl) return c.json({ error: 'Missing URL' }, 400);

    const normalizedUrl = normalizeUrl(articleUrl);
    const now = Date.now();

    // Check cache first
    if (summaryCache.has(normalizedUrl)) {
        const cached = summaryCache.get(normalizedUrl);
        if (now - cached.timestamp < SUMMARY_CACHE_DURATION) {
            console.log(`Cache hit for: ${articleUrl}`);
            return c.json({
                title: cached.title,
                press: cached.press,
                publishTime: cached.publishTime,
                url: cached.url,
                summary: cached.summary,
                cached: true
            });
        }
    }

    try {
        console.log(`Generating summary for: ${articleUrl}`);
        const articleDetails = await scraper.getArticleSummary(articleUrl);
        
        if (!articleDetails || !articleDetails.content) {
            return c.json({ error: 'Failed to fetch article' }, 404);
        }

        const summarySentences = await summarizer.summarize(articleDetails.title, articleDetails.content, c.env.GEMINI_API_KEY);
        
        // Cache the result
        const result = {
            title: articleDetails.title,
            press: articleDetails.press,
            publishTime: articleDetails.publishTime,
            url: articleDetails.url,
            summary: summarySentences,
            timestamp: now
        };
        summaryCache.set(normalizedUrl, result);
        
        return c.json({
            title: result.title,
            press: result.press,
            publishTime: result.publishTime,
            url: result.url,
            summary: result.summary,
            cached: false
        });
    } catch (e) {
        console.error("Summary failed", e);
        return c.json({ error: e.message }, 500);
    }
});

// Serve static files using manifest
app.use('/*', serveStatic({ manifest }));

export default app;
