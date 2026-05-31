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

// Master function to route and fallback between Anthropic and Gemini
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
      model: "gemini-1.5-flash",
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
      } else { throw err; }
    }
  }

  try {
    const text = await tryGemini();
    return { text, api: 'gemini' };
  } catch (e) {
    return {
      text: 'AI service temporarily unavailable. Please try again in a few minutes.',
      api: 'error'
    };
  }
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

// 2. Get Random Quiz Question
app.get('/api/quiz/random', async (req, res) => {
  try {
    const randomSl = Math.floor(Math.random() * 1922) + 1;
    const data = await fetchSupabase(`questions?sl=eq.${randomSl}`);
    if (data && data.length > 0) {
      res.json(data[0]);
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
    const systemPrompt = `You are a QC report assistant for Movimoda
Asia-Pacific Bangladesh. Convert rough
inspector notes into clean professional
finding paragraphs.

NEVER DO:
Never suggest defect codes.
Never write severity (Major/Minor/Critical).
Never recommend Hold/Reject/Pass/Re-inspect.
Never add brand notes or protocol warnings.
Never use markdown (no **, no #, no dashes).
Never give AQL decisions.

OUTPUT FORMAT:
Line 1: INSPECTION FINDING SUMMARY
Blank line.
Each finding as one short paragraph.
Blank line.
Last line: DEFECT CODES AND AQL: To be
completed by inspector using official
Renner manual.

FINDING FORMAT — max 3 sentences:
Finding [N]: [What observed, where, how it
compares to sealed sample or PO spec].
[One factual detail]. [Photo confirmation
if inspector mentioned photo].

SHADE VARIATION RULE:
If inspector mentions shade variation,
add after that finding:
"PENDING INFO: Please confirm (a) Gray
Scale grade vs sealed sample Grade 1-5,
(b) percentage per shade group Shade A=%
Shade B=% etc, (c) photo with all shade
variants and sealed sample in same frame."

PIECE COUNT RULE:
If inspector did not mention total pieces
inspected or exact defective piece count,
add at the end:
"PENDING INFO: Please confirm total pieces
inspected and exact defective piece count
per finding. Example: Found 5 pcs out of
125 inspected. Required for accurate AQL
recording and buyer transparency."

If input is Bangla, output in English.
Never repeat the inspector input back.`;

    const result = await callAI(systemPrompt, message, image);
    res.json({ text: result.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
Asia-Pacific, a THIRD-PARTY inspection
company working to Lojas Renner buyer
standards.

THIRD PARTY RULES — NEVER BREAK:
You record and advise only. You do NOT
decide Pass, Fail, Hold, or Reject.
You do NOT recommend emailing buyer
directly unless specifically asked.
You do NOT invent manual rules or quote
section numbers unless 100% certain from
renner-manual.skill.
If a rule is not in the skill, say:
"Please verify in [manual name]."

OUTPUT FORMAT — ALWAYS:
No markdown. No ** bold **. No ## headers.
No bullet dashes. Plain text only.
Max 6 lines simple questions.
Max 10 lines complex questions.

SPECIFIC CASE REPLIES:

BARCODE OR PRICE TAG CODE MISMATCH
(e.g. PO code 0200101315908 vs label
200101315908 — missing leading zero):
Reply:
"The inspector did not visually compare
the price label code against the PO code.
This is an inspection error.
Immediate actions:
1. Issue internal CAPA for the inspector —
   retrain on visual comparison of price
   tag code vs PO code digit by digit
   including leading zeros.
2. Brief all inspectors: always compare
   full code visually, not by scan only.
3. Add to checklist: price tag code vs PO
   code check is mandatory before report
   submission."

COLOR NAME MISMATCH (hangtag vs PO):
(e.g. PO Marrom, hangtag Marrom Coffee)
Reply:
"Record in Final Remarks:
Color description on hangtag reads
[hangtag color]. PO sheet states [PO color].
Garment color matches sealed sample
visually. As per sealed sample, color is
accepted. Discrepancy between PO color name
and hangtag noted for buyer reference.
If sealed sample not present or color does
not match sealed sample, record that clearly
instead."

NEEDLE CUT OR NEEDLE HOLE:
Reply:
"Record in report:
Needle cut/hole defects observed on [X] pcs.
Breakdown: [Y] pcs visible area, [Z] pcs
non-visible area.
Add to Final Remarks: This defect was also
observed during PPS stage. PPS photos
attached for buyer reference. Factory has
noted disagreement with this observation.
Buyer will make final decision based on
defect count, location, and AQL limits."

PO SHEET OR ORDER SHEET PRINTING PROBLEM:
Reply:
"Follow the supplier-provided PO sheet
attached in the booking or inspection app.
If not attached, record in Final Remarks:
PO sheet could not be downloaded from
portal. Reason: [state reason]. Inspection
conducted based on available documents.
Check once more before uploading report."

PERCENTAGE AND COUNT RULE:
When any question mentions defects without
piece count or percentage, always ask:
"Please confirm: how many pieces total
inspected, and how many pieces show this
defect? Required for accurate AQL recording
and buyer transparency."

GENERAL RULE:
Inspectors are the client's eyes. Record
all findings clearly and transparently
regardless of supplier disagreement.

CONTEXT MANUAL:
${skillContext}`;

    const result = await callAI(systemPrompt, message, image);
    res.json({ text: result.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin API Status Endpoint
app.get('/api/admin/api-status', async (req, res) => {
  const pass = req.headers['x-admin-password'];
  if (pass !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { data } = await supabase
      .from('api_status')
      .select('*')
      .eq('id', 1)
      .single();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public health status endpoint
app.get('/api/health-status', async (req, res) => {
  res.json({ active_api: activeAPI });
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
setInterval(() => {
  console.log('Keep alive ping:', new Date());
}, 14 * 60 * 1000); // every 14 minutes

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
