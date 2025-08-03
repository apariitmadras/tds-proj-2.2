const axios = require('axios');
const cheerio = require('cheerio');

class WebScraper {
    constructor() {
        this.defaultHeaders = {
            'User-Agent': 'Mozilla/5.0 (compatible; TDS-Agent/1.0; +https://github.com/tds-agent)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };
    }
    
    async scrapeUrl(url, options = {}) {
        try {
            const config = {
                headers: { ...this.defaultHeaders, ...options.headers },
                timeout: options.timeout || 30000,
                maxRedirects: options.maxRedirects || 5
            };
            
            console.log(`Scraping URL: ${url}`);
            const response = await axios.get(url, config);
            
            if (response.status !== 200) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response.data;
            
        } catch (error) {
            console.error(`Scraping error for ${url}:`, error.message);
            throw error;
        }
    }
    
    async scrapeTable(url, tableSelector = 'table', options = {}) {
        try {
            const html = await this.scrapeUrl(url, options);
            const $ = cheerio.load(html);
            
            const tables = [];
            
            $(tableSelector).each((index, table) => {
                const rows = [];
                
                $(table).find('tr').each((rowIndex, row) => {
                    const cells = [];
                    
                    $(row).find('td, th').each((cellIndex, cell) => {
                        cells.push($(cell).text().trim());
                    });
                    
                    if (cells.length > 0) {
                        rows.push(cells);
                    }
                });
                
                if (rows.length > 0) {
                    tables.push({
                        index,
                        headers: rows[0],
                        data: rows.slice(1)
                    });
                }
            });
            
            return tables;
            
        } catch (error) {
            console.error('Table scraping error:', error);
            throw error;
        }
    }
    
    async scrapeWikipediaTable(url, tableIndex = 0) {
        try {
            const tables = await this.scrapeTable(url, '.wikitable');
            
            if (tables.length === 0) {
                throw new Error('No tables found on Wikipedia page');
            }
            
            const table = tables[tableIndex];
            const processedData = [];
            
            // Process each row
            table.data.forEach((row, index) => {
                if (row.length < 3) return; // Skip incomplete rows
                
                const processedRow = {
                    index: index + 1,
                    raw: row,
                    processed: this.processWikipediaRow(row, table.headers)
                };
                
                processedData.push(processedRow);
            });
            
            return {
                headers: table.headers,
                data: processedData,
                totalRows: processedData.length
            };
            
        } catch (error) {
            console.error('Wikipedia table scraping error:', error);
            throw error;
        }
    }
    
    processWikipediaRow(row, headers) {
        const processed = {};
        
        row.forEach((cell, index) => {
            const header = headers[index] || `column_${index}`;
            let value = cell;
            
            // Clean up common Wikipedia formatting
            value = value.replace(/\[.*?\]/g, ''); // Remove references
            value = value.replace(/\s+/g, ' ').trim(); // Normalize whitespace
            
            // Try to extract numeric values
            const numberMatch = value.match(/[\d,]+\.?\d*/);
            if (numberMatch) {
                const number = parseFloat(numberMatch[0].replace(/,/g, ''));
                if (!isNaN(number)) {
                    processed[`${header}_numeric`] = number;
                }
            }
            
            processed[header] = value;
        });
        
        return processed;
    }
    
    async scrapeMultipleUrls(urls, options = {}) {
        const results = [];
        const concurrency = options.concurrency || 3;
        
        for (let i = 0; i < urls.length; i += concurrency) {
            const batch = urls.slice(i, i + concurrency);
            const promises = batch.map(async (url) => {
                try {
                    const data = await this.scrapeUrl(url, options);
                    return { url, data, success: true };
                } catch (error) {
                    return { url, error: error.message, success: false };
                }
            });
            
            const batchResults = await Promise.all(promises);
            results.push(...batchResults);
        }
        
        return results;
    }
    
    extractLinks(html, baseUrl) {
        const $ = cheerio.load(html);
        const links = [];
        
        $('a[href]').each((index, element) => {
            const href = $(element).attr('href');
            const text = $(element).text().trim();
            
            if (href) {
                const absoluteUrl = new URL(href, baseUrl).href;
                links.push({ url: absoluteUrl, text });
            }
        });
        
        return links;
    }
    
    extractMetadata(html) {
        const $ = cheerio.load(html);
        
        return {
            title: $('title').text().trim(),
            description: $('meta[name="description"]').attr('content') || '',
            keywords: $('meta[name="keywords"]').attr('content') || '',
            canonical: $('link[rel="canonical"]').attr('href') || '',
            ogTitle: $('meta[property="og:title"]').attr('content') || '',
            ogDescription: $('meta[property="og:description"]').attr('content') || '',
            ogImage: $('meta[property="og:image"]').attr('content') || ''
        };
    }
}

module.exports = new WebScraper();
