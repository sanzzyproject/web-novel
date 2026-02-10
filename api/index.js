const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

class SakuraNovel {
    getHTML = async function (url, options = {}) {
        try {
            const { method = 'GET', data = null, headers = {} } = options;
            const config = {
                method: method.toLowerCase(),
                url: url.startsWith('http') ? url : `https://sakuranovel.id/${url}`,
                headers: {
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                    ...headers
                }
            };
            if (method.toUpperCase() === 'POST' && data) config.data = data;
            const { data: html } = await axios(config);
            return cheerio.load(html);
        } catch (error) {
            throw new Error(error.message);
        }
    }
    
    search = async function (query) {
        try {
            const $ = await this.getHTML('https://sakuranovel.id/wp-admin/admin-ajax.php', {
                method: 'POST',
                data: new URLSearchParams({ action: 'data_fetch', keyword: query }).toString(),
                headers: {
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'x-requested-with': 'XMLHttpRequest'
                }
            });
            return $('.searchbox').map((_, el) => ({
                title: $(el).find('.searchbox-title').text().trim() || null,
                cover: 'https://cors.caliph.my.id/' + $(el).find('.searchbox-thumb img').attr('src')?.replace('i0.wp.com/', '')?.split('?')?.[0],
                type: $(el).find('.type').text().trim() || null,
                status: $(el).find('.status').text().trim() || null,
                url: $(el).find('a').attr('href') || null
            })).get();
        } catch (error) { throw new Error(error.message); }
    }
    
    detail = async function (url) {
        try {
            const $ = await this.getHTML(url);
            const getDetail = (label) => {
                const element = $(`.series-infolist li:contains("${label}")`);
                element.find('b').remove(); 
                return element.text().trim();
            }
            return {
                title: $('.series-titlex h2').text().trim(),
                cover: 'https://cors.caliph.my.id/' + $('.series-thumb img').attr('src'),
                status: $('.series-infoz.block .status').text().trim() || 'N/A',
                rating: $('.series-infoz.score span[itemprop="ratingValue"]').text().trim() || 'N/A',
                author: getDetail('Author'),
                genres: $('.series-genres a').map((_, el) => $(el).text().trim()).get(),
                synopsis: $('.series-synops p').map((_, el) => $(el).text().trim()).get().join('\n\n'),
                chapters: $('.series-chapterlists li').map((_, el) => ({
                    title: $(el).find('.flexch-infoz a span').first().text().replace(/\s\s+/g, ' ').trim(),
                    url: $(el).find('.flexch-infoz a').attr('href'),
                    date: $(el).find('.date').text().trim()
                })).get()
            };
        } catch (error) { throw new Error(error.message); }
    }
    
    chapter = async function (url) {
        try {
            const $ = await this.getHTML(url);
            const contentContainer = $('.tldariinggrissendiribrojangancopy');
            return {
                title: $('h2.title-chapter').text().trim().replace(/ Bahasa Indonesia$/i, ''),
                content: contentContainer.find('p').map((_, el) => {
                    const text = $(el).text().trim();
                    return (text && !text.includes('Baca novel lain')) ? text : null;
                }).get().filter(Boolean).join('\n\n'),
                navigation: {
                    prev: $('.entry-pagination .pagi-prev a').attr('href') || null,
                    next: $('.entry-pagination .pagi-next a').attr('href') || null,
                }
            };
        } catch (error) { throw new Error(error.message); }
    }
}

const scraper = new SakuraNovel();

// API Endpoints
app.get('/api/home', async (req, res) => {
    try {
        // Mocking home page dengan mencari keyword populer
        const [trending, newRelease] = await Promise.all([
            scraper.search('isekai'),
            scraper.search('romance')
        ]);
        res.json({ trending: trending.slice(0, 8), newRelease: newRelease.slice(0, 8) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/search', async (req, res) => {
    try { res.json(await scraper.search(req.query.q)); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/detail', async (req, res) => {
    try { res.json(await scraper.detail(req.query.url)); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/chapter', async (req, res) => {
    try { res.json(await scraper.chapter(req.query.url)); } 
    catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;
