/**
 * Lojas Renner QC Academy Backend Server v2.1
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Anthropic } = require('@anthropic-ai/sdk');
const ExcelJS = require('exceljs');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

// Helper for Supabase fetch requests
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

// Supabase client wrapper using fetchSupabase
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

// Anthropic Client
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY
});

// Gemini Client
const gemini = new GoogleGenerativeAI(GEMINI_API_KEY);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
let activeAPI = 'anthropic';
let anthropicFailedAt = null;

// Admin password verification middleware
function verifyAdmin(req, res, next) {
  const adminPass = req.headers['x-admin-password'] || req.query.password;
  if (adminPass === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Invalid admin password' });
  }
}

// Master function to route and fallback between Anthropic, Gemini, and GitHub Models
async function callAI(systemPrompt, userMessage, imageBase64 = null) {
  async function tryAnthropic() {
    const content = [];
    if (imageBase64) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: imageBase64
        }
      });
    }
    content.push({ type: "text", text: userMessage });
    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content }]
    });
    return res.content[0].text;
  }

  async function tryGemini() {
    const model = gemini.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt
    });
    const parts = [];
    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg"
        }
      });
    }
    parts.push({ text: userMessage });
    const result = await model.generateContent(parts);
    return result.response.text();
  }

  async function tryGitHubModels() {
    const url = "https://models.inference.ai.azure.com/chat/completions";
    const content = [];
    if (imageBase64) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`
        }
      });
    }
    content.push({ type: "text", text: userMessage });

    const body = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content }
      ],
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 1000
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GITHUB_TOKEN}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub Models error: ${res.status} - ${text}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }

  if (activeAPI === 'anthropic') {
    try {
      const text = await tryAnthropic();
      if (anthropicFailedAt) {
        anthropicFailedAt = null;
        activeAPI = 'anthropic';
        await supabase.from('api_status').upsert({
          id: 1, active_api: 'anthropic',
          status: 'healthy',
          recovered_at: new Date().toISOString(),
          error_message: null
        });
      }
      return { text, api: 'anthropic' };
    } catch (err) {
      const isQuota =
        err.status === 429 ||
        err.status === 402 ||
        err.status === 401 ||
        (err.message || '').includes('quota') ||
        (err.message || '').includes('credit') ||
        (err.message || '').includes('limit') ||
        (err.message || '').includes('overloaded');
      if (isQuota) {
        activeAPI = 'gemini';
        anthropicFailedAt = new Date().toISOString();
        await supabase.from('api_status').upsert({
          id: 1, active_api: 'gemini',
          status: 'fallback',
          anthropic_failed_at: anthropicFailedAt,
          error_message: err.message,
          updated_at: new Date().toISOString()
        });
      } else { 
        console.error("Non-quota Anthropic error:", err.message);
      }
    }
  }

  let lastErrors = "";
  // Fallback 1: Try Gemini
  try {
    const text = await tryGemini();
    return { text, api: 'gemini' };
  } catch (geminiErr) {
    console.error("Gemini failed, falling back to GitHub Models:", geminiErr.message);
    lastErrors += `Gemini: ${geminiErr.message}. `;
  }

  // Fallback 2: Try GitHub Models (GPT-4o-mini)
  if (GITHUB_TOKEN) {
    try {
      const text = await tryGitHubModels();
      return { text, api: 'github' };
    } catch (githubErr) {
      console.error("GitHub Models failed:", githubErr.message);
      lastErrors += `GitHub: ${githubErr.message}. `;
    }
  } else {
    lastErrors += "GitHub Token missing. ";
  }

  return {
    text: 'AI service temporarily unavailable. Please try again in a few minutes.',
    api: 'error'
  };
}

// Auto-recovery: check Anthropic every 30 min
setInterval(async () => {
  if (activeAPI !== 'gemini') return;
  try {
    await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 5,
      messages: [{ role: "user", content: "ok" }]
    });
    activeAPI = 'anthropic';
    anthropicFailedAt = null;
    await supabase.from('api_status').upsert({
      id: 1, active_api: 'anthropic',
      status: 'healthy',
      recovered_at: new Date().toISOString()
    });
    console.log('Anthropic recovered at', new Date().toISOString());
  } catch (e) {
    console.log('Anthropic still down:', e.message);
  }
}, 30 * 60 * 1000);

// 1. Get All Daily Tips
app.get('/api/tips', async (req, res) => {
  try {
    const data = await fetchSupabase('daily_tips?order=tip_number.asc');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Legacy single daily tip endpoint
app.get('/api/tips/daily', async (req, res) => {
  try {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const tipSl = (dayOfYear % 569) + 1;
    const data = await fetchSupabase(`daily_tips?tip_number=eq.${tipSl}`);
    if (data && data.length > 0) {
      res.json(data[0]);
    } else {
      res.status(404).json({ error: 'Tip not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Random Quiz Question with dynamic fallback translation and caching in Supabase
app.get('/api/quiz/random', async (req, res) => {
  try {
    const randomSl = Math.floor(Math.random() * 1922) + 1;
    const data = await fetchSupabase(`questions?sl=eq.${randomSl}`);
    if (data && data.length > 0) {
      const quiz = data[0];
      
      // If translation doesn't exist, translate and cache it!
      if (!quiz.question_bangla) {
        try {
          console.log(`Translating quiz question SL: ${quiz.sl} to Bangla on the fly...`);
          const systemPrompt = `You are a professional translator and senior QC manager at Movimoda. Your task is to translate a quiz question, its four options (a, b, c, d), and its explanation from English/Banglish to proper, conversational, natural Bangla suitable for a junior QC inspector.

RULES:
1. Keep these industry standard terms ALWAYS in English: AQL, POM, RFID, Sealed Sample, Counter Sample, Inspectorio, CAPA, Critical, Major, Minor, Hold, Reject, Pass, Fail, all defect codes (e.g., VH2, VG34, VF10, RF1, etc.), all manual names (e.g., Garments V11, etc.), all brand names (Renner, Youcom, Ashua), and all platforms.
2. Keep numbers and measurements (e.g., 80%, 14cm, 90N, etc.) in English numerals/letters.
3. Every option translation must be brief and correspond exactly to the meaning of the English option.
4. Translate the explanation (which might be in English or Banglish) into clear, standard Bangla script, keeping standard terms and numbers in English.
5. You must output ONLY a valid JSON object matching this schema:
{
  "question_bangla": "...",
  "a_bangla": "...",
  "b_bangla": "...",
  "c_bangla": "...",
  "d_bangla": "...",
  "explanation_bangla": "..."
}
Do not write any introductory or conversational text, only the raw JSON.`;

          const inputObj = {
            question: quiz.question,
            a: quiz.a,
            b: quiz.b,
            c: quiz.c,
            d: quiz.d,
            explanation: quiz.explanation
          };

          const aiResponse = await callAI(systemPrompt, JSON.stringify(inputObj));
          let cleanText = aiResponse.text ? aiResponse.text.trim() : aiResponse.trim();
          if (cleanText.startsWith('```json')) {
            cleanText = cleanText.substring(7, cleanText.length - 3).trim();
          } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.substring(3, cleanText.length - 3).trim();
          }

          const parsed = JSON.parse(cleanText);
          
          if (parsed.question_bangla) {
            quiz.question_bangla = parsed.question_bangla;
            quiz.a_bangla = parsed.a_bangla;
            quiz.b_bangla = parsed.b_bangla;
            quiz.c_bangla = parsed.c_bangla;
            quiz.d_bangla = parsed.d_bangla;
            quiz.explanation_bangla = parsed.explanation_bangla;

            // Cache it in the database
            await fetchSupabase(`questions?id=eq.${quiz.id}`, {
              method: 'PATCH',
              body: JSON.stringify({
                question_bangla: quiz.question_bangla,
                a_bangla: quiz.a_bangla,
                b_bangla: quiz.b_bangla,
                c_bangla: quiz.c_bangla,
                d_bangla: quiz.d_bangla,
                explanation_bangla: quiz.explanation_bangla
              })
            });
            console.log(`✅ Cached quiz translation for SL: ${quiz.sl}`);
          }
        } catch (translationErr) {
          console.error(`Failed to translate quiz SL: ${quiz.sl}:`, translationErr.message);
        }
      }
      
      res.json(quiz);
    } else {
      res.status(404).json({ error: 'Question not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. User Login Endpoint (with admin approval check)
app.post('/api/users/login', async (req, res) => {
  const { employee_id } = req.body;
  if (!employee_id) {
    return res.status(400).json({ error: 'employee_id is required' });
  }
  try {
    const data = await fetchSupabase(`users?employee_id=eq.${employee_id}`);
    if (data && data.length > 0) {
      const user = data[0];
      if (!user.is_approved) {
        return res.status(403).json({ error: 'Account pending admin approval' });
      }
      // Update last active
      await fetchSupabase(`users?id=eq.${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ last_active: new Date().toISOString() })
      });
      res.json({ success: true, user });
    } else {
      res.status(404).json({ error: 'Employee ID not registered. Please register first.' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Registration Endpoint (Name, 5-digit ID, Mobile Number)
app.post('/api/users/register', async (req, res) => {
  const { employee_id, name, mobile_number } = req.body;
  if (!employee_id || !name || !mobile_number) {
    return res.status(400).json({ error: 'employee_id, name, and mobile_number are required' });
  }
  
  // Check if employee ID is exactly 5 digits
  if (!/^\d{5}$/.test(String(employee_id))) {
    return res.status(400).json({ error: 'Employee ID must be exactly 5 digits' });
  }

  try {
    // Check if user already exists
    const checkUser = await fetchSupabase(`users?employee_id=eq.${employee_id}`);
    if (checkUser && checkUser.length > 0) {
      return res.status(400).json({ error: 'Employee ID already registered' });
    }

    // Insert user with is_approved: false
    await fetchSupabase('users', {
      method: 'POST',
      body: JSON.stringify([{
        employee_id: String(employee_id),
        name,
        mobile_number: String(mobile_number),
        is_approved: false,
        last_active: new Date().toISOString()
      }])
    });
    res.json({ success: true, message: 'Registration submitted! Awaiting admin approval.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Save Quiz Result Endpoint
app.post('/api/quiz-results', async (req, res) => {
  const { employee_id, employee_name, question_id, is_correct, topic, difficulty } = req.body;
  if (!employee_id || !employee_name) {
    return res.status(400).json({ error: 'employee_id and employee_name are required' });
  }
  try {
    const data = await fetchSupabase('quiz_results', {
      method: 'POST',
      body: JSON.stringify([{
        employee_id: String(employee_id),
        employee_name,
        question_id: parseInt(question_id, 10),
        is_correct: !!is_correct,
        topic,
        difficulty,
        answered_at: new Date().toISOString()
      }])
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Admin Panel User Stats Endpoint (returns approval and mobile number)
app.get('/api/admin/stats', verifyAdmin, async (req, res) => {
  try {
    const users = await fetchSupabase('users?order=id.asc');
    const quizResults = await fetchSupabase('quiz_results');
    
    const stats = users.map(user => {
      const userResults = quizResults.filter(q => q.employee_id === user.employee_id);
      const totalQuestions = userResults.length;
      const correctAnswers = userResults.filter(q => q.is_correct).length;
      const correctPercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      return {
        id: user.id,
        employee_id: user.employee_id,
        name: user.name,
        mobile_number: user.mobile_number || 'N/A',
        is_approved: !!user.is_approved,
        total_questions: totalQuestions,
        correct_percentage: correctPercentage,
        last_active: user.last_active
      };
    });
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get selected user quiz history logs
app.get('/api/admin/users/:employee_id/logs', verifyAdmin, async (req, res) => {
  try {
    const { employee_id } = req.params;
    const data = await fetchSupabase(`quiz_results?employee_id=eq.${employee_id}&order=answered_at.desc`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export all quiz results as Excel file
app.get('/api/admin/export', verifyAdmin, async (req, res) => {
  try {
    const data = await fetchSupabase('quiz_results?order=answered_at.desc');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Quiz Results');
    
    worksheet.columns = [
      { header: 'Employee ID', key: 'employee_id', width: 15 },
      { header: 'Employee Name', key: 'employee_name', width: 25 },
      { header: 'Question ID', key: 'question_id', width: 15 },
      { header: 'Correct', key: 'is_correct', width: 12 },
      { header: 'Topic', key: 'topic', width: 20 },
      { header: 'Difficulty', key: 'difficulty', width: 15 },
      { header: 'Answered At', key: 'answered_at', width: 25 }
    ];
    
    worksheet.getRow(1).font = { bold: true };
    
    data.forEach(row => {
      worksheet.addRow({
        employee_id: row.employee_id,
        employee_name: row.employee_name,
        question_id: row.question_id,
        is_correct: row.is_correct ? 'YES' : 'NO',
        topic: row.topic || 'N/A',
        difficulty: row.difficulty || 'N/A',
        answered_at: row.answered_at ? new Date(row.answered_at).toLocaleString() : 'N/A'
      });
    });
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=QC_Academy_Quiz_Results.xlsx'
    );
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin add user
app.post('/api/admin/users', verifyAdmin, async (req, res) => {
  const { employee_id, name } = req.body;
  if (!employee_id || !name) {
    return res.status(400).json({ error: 'employee_id and name are required' });
  }
  try {
    const data = await fetchSupabase('users', {
      method: 'POST',
      body: JSON.stringify([{ employee_id: String(employee_id), name, is_approved: true }])
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin approve user
app.post('/api/admin/users/:id/approve', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await fetchSupabase(`users?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_approved: true })
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin delete user
app.delete('/api/admin/users/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const queryCol = isNaN(parseInt(id, 10)) ? 'employee_id' : 'id';
    
    let employeeId = id;
    if (queryCol === 'id') {
      const user = await fetchSupabase(`users?id=eq.${id}`);
      if (user && user.length > 0) {
        employeeId = user[0].employee_id;
      }
    }
    
    await fetchSupabase(`users?${queryCol}=eq.${id}`, {
      method: 'DELETE'
    });
    
    if (employeeId) {
      await fetchSupabase(`quiz_results?employee_id=eq.${employeeId}`, {
        method: 'DELETE'
      });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Report Finding Organizer
app.post('/api/organize-finding', async (req, res) => {
  const { message, image } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    const systemPrompt = `You are a QC report assistant for
Movimoda Asia-Pacific Bangladesh.
Convert rough inspector notes into clean
professional finding paragraphs.

NEVER DO:
Never suggest defect codes.
Never write severity Major Minor Critical.
Never recommend Hold Reject Pass.
Never add brand notes or protocol warnings.
Never use markdown.
Never give AQL decisions.
Never use the word SKU — use PO/Lot instead.
Never say verify with buyer or merchandising
team — that is a recommendation.

PHOTO ANALYSIS:
If a photo is attached first write:
"Photo observation: [describe in 1-2
sentences what QC issue you see in the
photo — defect type location appearance
comparison with what correct should look
like]"
Then combine with inspector text notes.

OUTPUT FORMAT:
Line 1: INSPECTION FINDING SUMMARY
Blank line.
Each finding as one short paragraph max
3 sentences.
Blank line.
Last line: DEFECT CODES AND AQL: To be
completed by inspector using official
Renner manual.

SHADE VARIATION RULE:
If shade variation mentioned add:
"PENDING INFO: Confirm (a) Gray Scale
grade vs sealed sample Grade 1-5
(b) percentage per shade group
Shade A=?% Shade B=?% etc
(c) photo with all shade variants and
sealed sample in same frame."

PIECE COUNT RULE:
If piece count missing add at end:
"PENDING INFO: Confirm total pieces
inspected and exact defective piece count
per finding. Example: 5 pcs out of 125.
Required for AQL recording and
buyer transparency."

If input is Bangla output in English.`;

    const result = await callAI(
      systemPrompt,
      message,
      req.body.image || null
    );
    res.json({ text: result.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper for RAG keyword-based context retrieval from manual
function retrieveContext(query, fullText) {
  if (!fullText) return "";
  
  // Split by header sections
  const sections = fullText.split(/(?=## )/g);
  
  const stopWords = new Set(["how", "to", "do", "we", "is", "a", "an", "the", "for", "in", "on", "at", "of", "with", "about", "what", "which", "are", "from", "and"]);
  const queryWords = query.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
    
  if (queryWords.length === 0) {
    return sections.slice(0, 3).join("\n\n");
  }
  
  // Score sections based on keyword match density
  const scoredSections = sections.map(section => {
    let score = 0;
    const sectionTextLower = section.toLowerCase();
    
    queryWords.forEach(word => {
      if (sectionTextLower.includes(word)) {
        score += 10;
        const regex = new RegExp(word, 'g');
        const matches = sectionTextLower.match(regex);
        if (matches) {
          score += matches.length;
        }
      }
    });
    
    return { section, score };
  });
  
  scoredSections.sort((a, b) => b.score - a.score);
  
  const selected = [];
  let currentLength = 0;
  
  for (const item of scoredSections) {
    if (item.score <= 0 && selected.length >= 2) break;
    if (currentLength + item.section.length > 12000) continue; // Keep under ~3000 tokens
    
    selected.push(item.section);
    currentLength += item.section.length;
  }
  
  if (selected.length === 0) {
    return sections.slice(0, 2).join("\n\n");
  }
  
  return selected.join("\n\n");
}

// 7. Defect Search & Manual QA Assistant
app.post('/api/chat', async (req, res) => {
  const { message, image } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    const skillPath = path.join(__dirname, 'MD file', 'SKILL.md');
    let skillContext = "";
    if (fs.existsSync(skillPath)) {
      skillContext = fs.readFileSync(skillPath, 'utf8');
    }
    
    const systemPrompt = `You are a QC Assistant for Movimoda
Asia-Pacific Bangladesh — a THIRD-PARTY
inspection company for Lojas Renner.

THIRD PARTY RULES — NEVER BREAK:
Record and advise only.
Never decide Pass Fail Hold or Reject.
Never recommend buyer contact unless asked.
Never invent manual rules or section numbers.
If rule not in skill say: verify in manual.

VERIFIED SPECIFIC RULES FROM MANUALS:
- Baby Footwear RFID: For Slipper and Baby Footwear products, the RFID tag (model ADE02) must be placed on the LEFT foot only — between insole and outsole. This is different from standard Footwear R26 rule (model ADE01 on right shoe). Source: Baby Footwear V7.

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
${retrieveContext(message, skillContext)}`;

    const result = await callAI(
      systemPrompt,
      message,
      req.body.image || null
    );
    res.json({ text: result.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health-status',
  (req, res) => {
  res.json({
    active_api: activeAPI,
    gemini_key_present: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_free_key_here',
    github_token_present: !!process.env.GITHUB_TOKEN
  });
});

app.get('/api/admin/api-status',
  async (req, res) => {
  const pass =
    req.headers['x-admin-password'];
  if (pass !==
    process.env.ADMIN_PASSWORD) {
    return res.status(401).json(
      { error: 'Unauthorized' });
  }
  const { data } = await supabase
    .from('api_status')
    .select('*')
    .eq('id', 1)
    .single();
  res.json(data);
});

// Legacy Score Saving
app.post('/api/scores', async (req, res) => {
  const { inspector_name, total_questions, correct_answers, score_percentage } = req.body;
  if (!inspector_name) {
    return res.status(400).json({ error: 'inspector_name is required' });
  }
  try {
    await fetchSupabase('inspector_scores', {
      method: 'POST',
      body: JSON.stringify([{ inspector_name, total_questions, correct_answers, score_percentage }])
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Keep-alive ping
if (require.main === module) {
  setInterval(() => {
    console.log('Keep alive ping:', new Date());
  }, 14 * 60 * 1000); // every 14 minutes

  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

module.exports = { callAI };
