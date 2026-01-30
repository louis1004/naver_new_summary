import { load } from 'cheerio';

const SECTIONS = ['100', '101', '102', '103', '104']; // Politics, Economy, Society, Life/Culture, World
const BASE_URL = 'https://news.naver.com';

// User Agent to look like a browser
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

/**
 * Fetches the main page of a section and extracts article URLs.
 * @param {string} sectionId 
 */
async function getSectionArticles(sectionId) {
    console.log(`Fetching section ${sectionId}...`);
    try {
        const response = await fetch(`${BASE_URL}/section/${sectionId}`, { headers: HEADERS });
        const html = await response.text();
        const $ = load(html);
        const articles = [];

        // Select articles from the headline list and main list
        // Based on analysis: .sa_item .sa_text_title
        $('.sa_item .sa_text_title').each((i, el) => {
            const link = $(el).attr('href');
            const title = $(el).text().trim();
            if (link) {
                articles.push({
                    sectionId,
                    title,
                    url: link,
                    summary: $(el).siblings('.sa_text_lede').text().trim() || '',
                    press: $(el).siblings('.sa_text_info').find('.sa_text_press').text().trim() || ''
                });
            }
        });

        // Limit to top 20 to allow higher-level control
        return articles.slice(0, 20);
    } catch (error) {
        console.error(`Error fetching section ${sectionId}:`, error.message);
        return [];
    }
}

/**
 * Fetches individual article details to get the publish time and full content.
 * @param {object} article 
 */
async function getArticleDetails(article) {
    try {
        const response = await fetch(article.url, { headers: HEADERS });
        const html = await response.text();
        const $ = load(html);

        // Date extraction
        // Usually in .media_end_head_info_datestamp_time
        let timeStr = $('.media_end_head_info_datestamp_time').attr('data-date-time'); // Look for data attribute first
        if (!timeStr) {
             timeStr = $('.media_end_head_info_datestamp_time').first().text().trim();
        }
        
        // If data-date-time is not found, try to parse the text "2024.01.30. 오전 10:00"
        // But data-date-time (ISO like) is best if available.
        
        // Content extraction
        // transform <br> to newlines for cleaner text
        const $content = $('#dic_area');
        $content.find('.img_desc, figcaption, .end_photo_org, .byline').remove(); // Remove captions and credits
        $content.find('br').replaceWith('\n');
        const content = $content.text().trim();

        // Image extraction (og:image)
        const image = $('meta[property="og:image"]').attr('content');

        return {
            ...article,
            publishTime: timeStr, // Keep as string for now or parse
            content,
            image
        };
    } catch (error) {
        console.error(`Error fetching details for ${article.url}:`, error.message);
        return null;
    }
}

/**
 * Filter articles published within the last 24 hours.
 * @param {Array} articles 
 */
function filterRecentArticles(articles) {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

    return articles.filter(article => {
        if (!article.publishTime) return false;
        // Naver time string might need robust parsing if data attribute isn't there.
        // Usually data-date-time="2024-01-30 11:00:00"
        const pubDate = new Date(article.publishTime);
        return pubDate >= twentyFourHoursAgo && pubDate <= now;
    });
}

async function scrapeRecentArticles() {
    console.log("Starting lightweight list scrape...");
    
    // Fetch lists for all sections concurrently
    const sectionPromises = SECTIONS.map(sectionId => getSectionArticles(sectionId));
    const sectionResults = await Promise.all(sectionPromises);

    let allArticles = [];
    const seenUrls = new Set();

    sectionResults.forEach((articles, index) => {
        const sectionId = SECTIONS[index];
        // Politics(100), Economy(101), Society(102) -> 10, Others -> 5
        const limit = (sectionId === '100' || sectionId === '101' || sectionId === '102') ? 10 : 5;
        const topArticles = articles.slice(0, limit);
        
        topArticles.forEach(article => {
            if (!seenUrls.has(article.url)) {
                seenUrls.add(article.url);
                // Return just the list data for now (FAST)
                allArticles.push({
                    ...article,
                    sectionId
                });
            }
        });
    });

    console.log(`Lightweight scrape complete. Total articles: ${allArticles.length}`);
    return allArticles;
}

/**
 * Optimized helper for detailed summary (used by /view)
 */
async function getArticleSummary(url) {
    console.log(`Deep crawling article: ${url}`);
    // Reuse existing helper
    const details = await getArticleDetails({ url });
    return details;
}

export { scrapeRecentArticles, getSectionArticles, getArticleDetails, filterRecentArticles, getArticleSummary };
