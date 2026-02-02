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

    // Fetch article details to get publish time for filtering
    const detailPromises = [];
    
    sectionResults.forEach((articles, index) => {
        const sectionId = SECTIONS[index];
        const limit = 10; // 모든 섹션 10개씩
        const topArticles = articles.slice(0, limit);
        
        topArticles.forEach(article => {
            if (!seenUrls.has(article.url)) {
                seenUrls.add(article.url);
                detailPromises.push(getArticleDetails({ ...article, sectionId }));
            }
        });
    });

    // Get details with publish time
    const detailedArticles = await Promise.all(detailPromises);
    
    // Filter to last 24 hours
    const now = new Date();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
    
    allArticles = detailedArticles.filter(article => {
        if (!article || !article.publishTime) return false;
        const pubDate = new Date(article.publishTime);
        return pubDate >= twentyFourHoursAgo && pubDate <= now;
    });

    // Group by section and limit to 10 per section
    const bySection = {};
    allArticles.forEach(article => {
        if (!bySection[article.sectionId]) {
            bySection[article.sectionId] = [];
        }
        if (bySection[article.sectionId].length < 10) {
            bySection[article.sectionId].push(article);
        }
    });

    // Flatten back
    const result = Object.values(bySection).flat();

    console.log(`Scrape complete. Total articles (24h): ${result.length}`);
    return result;
}

/**
 * Optimized helper for detailed summary (used by /view)
 */
async function getArticleSummary(url) {
    console.log(`Deep crawling article: ${url}`);
    try {
        const response = await fetch(url, { headers: HEADERS });
        const html = await response.text();
        const $ = load(html);

        // Title extraction
        const title = $('meta[property="og:title"]').attr('content') || 
                      $('.media_end_head_headline').text().trim() ||
                      $('h2.media_end_head_headline').text().trim();

        // Press extraction
        const press = $('.media_end_head_top_logo img').attr('alt') ||
                      $('meta[name="twitter:creator"]').attr('content') || '';

        // Date extraction
        let publishTime = $('.media_end_head_info_datestamp_time').attr('data-date-time');
        if (!publishTime) {
            publishTime = $('.media_end_head_info_datestamp_time').first().text().trim();
        }

        // Content extraction
        const $content = $('#dic_area');
        $content.find('.img_desc, figcaption, .end_photo_org, .byline').remove();
        $content.find('br').replaceWith('\n');
        const content = $content.text().trim();

        // Image extraction
        const image = $('meta[property="og:image"]').attr('content');

        return {
            url,
            title,
            press,
            publishTime,
            content,
            image
        };
    } catch (error) {
        console.error(`Error fetching article: ${error.message}`);
        return null;
    }
}

export { scrapeRecentArticles, getSectionArticles, getArticleDetails, filterRecentArticles, getArticleSummary };
