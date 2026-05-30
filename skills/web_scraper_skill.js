const puppeteer = require('puppeteer-core');

class WebScraperSkill {
    constructor() {
        this.browserURL = 'http://localhost:9222';
    }

    async scrapeOutlook() {
        try {
            const browser = await puppeteer.connect({ browserURL: this.browserURL });
            const pages = await browser.pages();
            const outlookPage = pages.find(p => p.url().includes('outlook.office.com'));

            if (!outlookPage) {
                return "❌ Outlook tab not found. Please ensure Outlook Web is open in Chrome started with --remote-debugging-port=9222";
            }

            // Simple scrape of email list
            const emails = await outlookPage.evaluate(() => {
                const items = Array.from(document.querySelectorAll('[role="option"]')); // Common Outlook selector for list items
                return items.slice(0, 5).map(item => {
                    const text = item.innerText || "";
                    return text.split('\n').slice(0, 3).join(' | ');
                });
            });

            await browser.disconnect();
            
            if (emails.length === 0) return "No emails visible on screen.";
            return `📧 Latest Emails from Web Interface:\n${emails.join('\n\n')}`;
        } catch (err) {
            return `❌ Web Scraper Error: ${err.message}. (Did you start Chrome with --remote-debugging-port=9222?)`;
        }
    }
}

module.exports = new WebScraperSkill();
