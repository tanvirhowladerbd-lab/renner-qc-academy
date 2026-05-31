const fs = require('fs');
const path = require('path');
const { callAI } = require('./server');

const gmailSkill = require('./skills/gmail_skill');
const qcTrackerSkill = require('./skills/qc_tracker_skill');
const msSkill = require('./skills/microsoft_skill');
const localSkill = require('./skills/local_system_skill');
const scraperSkill = require('./skills/web_scraper_skill');
const rpaSkill = require('./skills/desktop_rpa_skill');
const waSkill = require('./skills/whatsapp_skill');
const hermesSkill = require('./skills/hermes_skill');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

async function fetchSupabase(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...supabaseHeaders,
      ...options.headers
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error: ${response.status} - ${text}`);
  }
  const text = await response.text();
  if (!text || text.trim() === '') {
    return { success: true };
  }
  return JSON.parse(text);
}

const supabase = {
  from: (table) => ({
    upsert: async (data) => {
      const bodyData = Array.isArray(data) ? data : [data];
      return await fetchSupabase(table, {
        method: 'POST',
        headers: {
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(bodyData)
      });
    },
    select: (columns = '*') => ({
      eq: (column, value) => ({
        single: async () => {
          const res = await fetchSupabase(`${table}?${column}=eq.${value}`);
          const row = (Array.isArray(res) && res.length > 0) ? res[0] : null;
          return { data: row };
        }
      })
    })
  })
};


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
                    const skillPath = path.join(__dirname, 'MD file', 'SKILL.md');
                    let skillContext = "";
                    if (fs.existsSync(skillPath)) {
                        skillContext = fs.readFileSync(skillPath, 'utf8');
                    }

                    const qcAssistantSystemPrompt = `You are a QC Assistant for Movimoda
Asia-Pacific Bangladesh — a THIRD-PARTY
inspection company for Lojas Renner.

THIRD PARTY RULES — NEVER BREAK:
Record and advise only.
Never decide Pass Fail Hold or Reject.
Never recommend buyer contact unless asked.
Never invent manual rules or section numbers.
If rule not in skill say: verify in manual.

OUTPUT FORMAT ALWAYS:
No markdown. No ** bold **. No ## headers.
No bullet dashes. Plain text only.
Max 6 lines simple. Max 10 lines complex.

CASE: BARCODE OR PRICE TAG CODE MISMATCH:
Reply:
"The inspector did not visually compare
the price label code against the PO code.
This is an inspection error.
Actions:
1. Issue CAPA for inspector — retrain on
visual comparison of full price tag code
vs PO code digit by digit including
leading zeros.
2. Brief all inspectors: always compare
full code visually not by scan only.
3. Add to checklist: price tag code vs
PO code check mandatory before report."

CASE: COLOR OR SHADE NAME MISMATCH:
Reply:
"Record in Final Remarks:
Color on hangtag reads [hangtag color].
PO states [PO color]. Garment matches
sealed sample visually. As per sealed
sample color accepted. PO vs hangtag
name discrepancy noted for buyer reference.
If sealed sample absent or color differs
from sealed sample record that clearly."

CASE: NEEDLE CUT OR NEEDLE HOLE:
Reply:
"Record in report:
Needle cut or hole defects observed on
[X] pcs. Breakdown: [Y] pcs visible area
[Z] pcs non-visible area.
Add to Final Remarks: Defect also observed
during PPS. PPS photos attached for buyer
reference. Factory noted disagreement.
Buyer decides based on count and AQL."

CASE: PO SHEET PRINTING PROBLEM:
Reply:
"Follow supplier PO sheet attached in
booking or inspection app.
If not attached record in Final Remarks:
PO sheet could not be downloaded. Reason:
[state reason]. Inspection conducted on
available documents."

PIECE COUNT RULE:
If finding has no piece count ask:
"Please confirm total pieces inspected and
exact defective piece count. Required for
AQL recording and buyer transparency."

PHOTO ANALYSIS RULE:
If a photo is attached analyze it and
describe in 1-2 sentences what QC issue
you observe — defect type location
appearance. Then answer the question.

GENERAL: Inspectors are client eyes.
Record all findings clearly and
transparently regardless of supplier
disagreement.

CONTEXT MANUAL:
${skillContext}`;

                    const userQuery = query;
                    const result = await callAI(
                        qcAssistantSystemPrompt,
                        userQuery
                    );
                    const reply = result.text;
                    await bot.sendMessage(chatId, reply);
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
