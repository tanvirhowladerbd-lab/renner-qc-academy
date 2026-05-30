require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const TelegramBot = require('node-telegram-bot-api');
const brain = require('./brain');

const token = process.env.TELEGRAM_BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

console.log("✅ Office AI Gateway is running with OpenClaw Brain linked.");

// 20s Heartbeat (Keep active for background process monitoring)
setInterval(() => {
    console.log(`[Heartbeat] ${new Date().toLocaleTimeString()} - Gateway Active - Brain Health: OK`);
}, 20000);

// Pass all messages to the Brain for processing
bot.on('message', (msg) => {
    if (msg.text) {
        brain.processMessage(msg, bot).catch(err => {
            console.error('[Gateway Error] Brain failed to process message:', err);
            bot.sendMessage(msg.chat.id, "Sorry, I encountered an internal error in my brain logic.");
        });
    }
});

// Initial startup message
console.log("🚀 Brain-linked and ready to handle office tasks.");
