const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

class GmailSkill {
    constructor() {
        this.config = {
            imap: {
                user: process.env.OFFICE_GMAIL,
                password: process.env.GMAIL_PASSWORD,
                host: 'imap.gmail.com',
                port: 993,
                tls: true,
                authTimeout: 3000
            }
        };
    }

    async getRecentSummary() {
        try {
            const connection = await imaps.connect(this.config);
            await connection.openBox('INBOX');
            
            const searchCriteria = ['UNSEEN'];
            const fetchOptions = {
                bodies: ['HEADER', 'TEXT'],
                markSeen: false
            };

            const messages = await connection.search(searchCriteria, fetchOptions);
            connection.end();

            if (messages.length === 0) {
                return "You have no unread office emails at the moment.";
            }

            let summary = `📧 You have ${messages.length} unread emails:\n\n`;
            
            for (let i = 0; i < Math.min(messages.length, 3); i++) {
                const parts = messages[i].parts;
                const header = parts.find(p => p.which === 'HEADER').body;
                const subject = header.subject[0];
                const from = header.from[0];
                summary += `${i + 1}. From: ${from}\nSubject: ${subject}\n\n`;
            }

            if (messages.length > 3) {
                summary += `...and ${messages.length - 3} more.`;
            }

            return summary;
        } catch (err) {
            console.error('[Gmail Skill Error]', err);
            return "❌ Failed to connect to Gmail. Please check your App Password and settings.";
        }
    }
}

module.exports = new GmailSkill();
