const puppeteer = require('puppeteer-core');

class WhatsAppSkill {
    constructor() {
        this.browserURL = 'http://localhost:9222';
    }

    async summarizeMessages() {
        try {
            const browser = await puppeteer.connect({ browserURL: this.browserURL });
            const pages = await browser.pages();
            let waPage = pages.find(p => p.url().includes('web.whatsapp.com'));

            if (!waPage) {
                return "❌ WhatsApp Web tab not found. Please open web.whatsapp.com in your Chrome (9222 port).";
            }

            // Bring to front
            await waPage.bringToFront();

            // Wait for unread or today's chats
            const summary = await waPage.evaluate(async () => {
                const chats = Array.from(document.querySelectorAll('div[role="listitem"]'));
                let report = [];
                
                for (let chat of chats.slice(0, 5)) { // Check top 5 active chats
                    const name = chat.querySelector('span[title]')?.title || "Unknown";
                    const unreadBadge = chat.querySelector('span[aria-label*="unread"]');
                    const lastMsg = chat.querySelector('span[dir="ltr"]')?.innerText || "";
                    
                    if (unreadBadge || chat.innerText.includes('Today')) {
                        report.push(`📌 ${name}: ${lastMsg}`);
                    }
                }
                return report.join('\n');
            });

            await browser.disconnect();
            
            if (!summary) return "আজকের কোনো নতুন মেসেজ নেই তানভীর ভাই।";
            return `তানভীর ভাই, আপনার হোয়াটসঅ্যাপ চেক করলাম। আজকের গুরুত্বপূর্ণ মেসেজগুলো নিচে দেওয়া হলো:\n\n${summary}`;
        } catch (err) {
            return `❌ WhatsApp Scraper Error: ${err.message}`;
        }
    }
}

module.exports = new WhatsAppSkill();
