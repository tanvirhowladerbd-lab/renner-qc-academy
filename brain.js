const gmailSkill = require('./skills/gmail_skill');
const qcTrackerSkill = require('./skills/qc_tracker_skill');
const msSkill = require('./skills/microsoft_skill');
const localSkill = require('./skills/local_system_skill');
const scraperSkill = require('./skills/web_scraper_skill');
const rpaSkill = require('./skills/desktop_rpa_skill');
const waSkill = require('./skills/whatsapp_skill');
const hermesSkill = require('./skills/hermes_skill');

class OpenClawBrain {
    constructor() {
        this.skills = {
            gmail: gmailSkill,
            qc: qcTrackerSkill,
            ms: msSkill,
            local: localSkill,
            scraper: scraperSkill,
            rpa: rpaSkill,
            whatsapp: waSkill,
            hermes: hermesSkill
        };
    }

    async processMessage(msg, bot) {
        const text = msg.text.trim().toLowerCase();
        const chatId = msg.chat.id;

        console.log(`[Brain] Tanvir's Request: ${text}`);

        if (text === 'ws') {
            await bot.sendMessage(chatId, 'ঠিক আছে তানভীর ভাই, হোয়াটসঅ্যাপ চেক করছি...');
            await this.skills.rpa.launchApp('whatsapp'); 
            const waSummary = await this.skills.whatsapp.summarizeMessages(); 
            await bot.sendMessage(chatId, waSummary);
            await bot.sendMessage(chatId, 'আর কোনো হেল্প লাগবে ভাই?');

        } else if (text === 'o' || text.includes('outlook')) {
            await bot.sendMessage(chatId, 'ঠিক আছে তানভীর ভাই, আমি Outlook Classic এর কাজ শুরু করছি।');
            const summary = await this.skills.rpa.processOutlookClassic();
            await bot.sendMessage(chatId, summary);
            await bot.sendMessage(chatId, 'তানভীর ভাই, আপনার Outlook Classic ডান! আর কিছু লাগবে?');

        } else if (text === 'w' || text.includes('whatsapp')) {
            await bot.sendMessage(chatId, 'ঠিক আছে তানভীর ভাই, আমি WhatsApp ওপেন করছি।');
            await this.skills.rpa.launchApp('whatsapp');
            await bot.sendMessage(chatId, 'তানভীর ভাই, আপনার WhatsApp ডান! আর কিছু লাগবে?');

        } else if (text === 'i' || text.includes('iris')) {
            await bot.sendMessage(chatId, 'ঠিক আছে তানভীর ভাই, আমি Iris Spring রান করছি।');
            await this.skills.rpa.launchApp('iris spring');
            await bot.sendMessage(chatId, 'তানভীর ভাই, আপনার Iris Spring ডান! আর কিছু লাগবে?');

        } else if (text === 'd' || text.includes('drive')) {
            await bot.sendMessage(chatId, 'ঠিক আছে তানভীর ভাই, আমি OneDrive ওপেন করছি।');
            await this.skills.rpa.launchApp('C:\\Users\\Tanvir\\OneDrive');
            await bot.sendMessage(chatId, 'তানভীর ভাই, আপনার OneDrive ডান! আর কিছু লাগবে?');

        } else if (text === 'm' || text.includes('mail web')) {
            await bot.sendMessage(chatId, 'ঠিক আছে তানভীর ভাই, আমি Outlook Web ওপেন করছি।');
            await this.skills.rpa.launchChromeProfile('Profile 2'); 
            await bot.sendMessage(chatId, 'তানভীর ভাই, আপনার Mail Web ডান! আর কিছু লাগবে?');

        } else if (text === 's' || text.includes('shortcut')) {
            await bot.sendMessage(chatId, 'ঠিক আছে তানভীর ভাই, আমি শর্টকাটগুলো রেডি করছি।');
            await this.skills.rpa.launchChromeProfile('Profile 1');
            await bot.sendMessage(chatId, 'তানভীর ভাই, আপনার Shortcut ডান! আর কিছু লাগবে?');

        } else if (text === 'qc' || text === 'h' || text === 'hermes') {
            // HERMES: full pipeline with email
            await bot.sendMessage(chatId, '🏭 ঠিক আছে তানভীর ভাই! HERMES QC চালু করছি...\nগতকালের সব রিপোর্ট analyze করে email পাঠাবো।\n⏳ একটু সময় লাগবে...');
            const result = await this.skills.hermes.run(true, async (msg) => {
                try { await bot.sendMessage(chatId, `  ${msg}`); } catch {}
            });
            if (result.status === 'success') {
                const s = result.stats;
                await bot.sendMessage(chatId,
                    `✅ HERMES সম্পন্ন!\n\n📊 Result:\n✅ PASS: ${s.pass}\n⚠️ HOLD: ${s.hold}\n🔴 REJECT: ${s.reject}\n📊 Total: ${s.total}\n\n📧 Email গেছে: mohammedtanvir.howlader@movimoda.com`
                );
            } else if (result.status === 'no_files') {
                await bot.sendMessage(chatId, result.message);
            } else {
                await bot.sendMessage(chatId, `❌ Error: ${result.error || 'Unknown error'}`);
            }

        } else if (text === 'qt' || text === 'qc test') {
            // HERMES: test mode, no email
            await bot.sendMessage(chatId, '🧪 HERMES Test Mode চালু করছি... (email পাঠাবে না)');
            const result = await this.skills.hermes.run(false, async (msg) => {
                try { await bot.sendMessage(chatId, `  ${msg}`); } catch {}
            });
            if (result.status === 'success') {
                const s = result.stats;
                await bot.sendMessage(chatId,
                    `✅ Test সম্পন্ন!\n\n📊 Result:\n✅ PASS: ${s.pass}\n⚠️ HOLD: ${s.hold}\n🔴 REJECT: ${s.reject}\n📊 Total: ${s.total}\n\n📂 Excel: ${require('path').basename(result.excelPath)}`
                );
            } else if (result.status === 'no_files') {
                await bot.sendMessage(chatId, result.message);
            } else {
                await bot.sendMessage(chatId, `❌ Error: ${result.error || 'Unknown error'}`);
            }

        } else if (text === 'qs' || text === 'qc status') {
            // HERMES: show today's log
            const log = this.skills.hermes.getLogSummary();
            await bot.sendMessage(chatId, `📋 HERMES আজকের Log:\n\n${log}`);

        } else if (text.startsWith('/renner-manual') || text.startsWith('renner-manual') || text.startsWith('/renner-manua') || text.startsWith('renner-manua')) {
            const promptText = msg.text.trim();
            let query = "";
            if (promptText.toLowerCase().startsWith('/renner-manual')) {
                query = promptText.substring(14).trim();
            } else if (promptText.toLowerCase().startsWith('/renner-manua')) {
                query = promptText.substring(13).trim();
            } else if (promptText.toLowerCase().startsWith('renner-manual')) {
                query = promptText.substring(13).trim();
            } else if (promptText.toLowerCase().startsWith('renner-manua')) {
                query = promptText.substring(12).trim();
            }

            if (!query) {
                await bot.sendMessage(chatId, "Please ask a question after /renner-manual.\nExample: /renner-manual what is VG34?");
            } else {
                await bot.sendMessage(chatId, "🔍 Querying Renner Manual Knowledge Base...");
                try {
                    const fetch = require('isomorphic-fetch');
                    const res = await fetch("http://localhost:5000/api/chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: query })
                    });
                    const data = await res.json();
                    if (data.text) {
                        try {
                            await bot.sendMessage(chatId, data.text, { parse_mode: 'Markdown' });
                        } catch (parseError) {
                            await bot.sendMessage(chatId, data.text);
                        }
                    } else {
                        await bot.sendMessage(chatId, `Error: ${data.error || "No response received"}`);
                    }
                } catch (err) {
                    await bot.sendMessage(chatId, `Failed to contact Renner AI assistant: ${err.message}`);
                }
            }

        } else if (text.includes('hi') || text.includes('start')) {
            await bot.sendMessage(chatId, 'হ্যালো তানভীর ভাই! আপনার পার্সোনাল এআই অ্যাসিস্ট্যান্ট রেডি।\n\n📋 Shortcuts:\n"WS" - WhatsApp summary\n"O" - Outlook\n"W" - WhatsApp\n"I" - Iris Spring\n"D" - OneDrive\n"M" - Mail Web\n"S" - Shortcuts\n\n🎓 RENNER MANUAL:\n"/renner-manual [question]" - Ask any Lojas Renner QC question (in English)\n\n🏭 HERMES QC:\n"QC" - Run full QC report + email\n"QT" - Test run (no email)\n"QS" - Show last log\n\nআর কি করতে পারি আপনার জন্য?');
        } else {
            await bot.sendMessage(chatId, "বুঝতে পারছি না তানভীর ভাই। \"hi\" টাইপ করুন সব shortcuts দেখতে।");
        }
    }
}

module.exports = new OpenClawBrain();
