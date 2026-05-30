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

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

// Anthropic Client
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY
});

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

// Admin password verification middleware
function verifyAdmin(req, res, next) {
  const adminPass = req.headers['x-admin-password'] || req.query.password;
  if (adminPass === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Invalid admin password' });
  }
}

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
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    const systemPrompt = `You are a professional third-party QC inspection report 
assistant for Movimoda Asia-Pacific Bangladesh.

YOUR ONLY JOB: Organize the inspector's rough notes into 
clean, professional finding paragraphs.

WHAT YOU MUST NEVER DO:
- NEVER suggest, guess, or write any defect code
- NEVER write severity (Major, Minor, Critical)
- NEVER recommend Hold, Reject, Pass, or Re-inspection
- NEVER add brand notes (no Youcom, no VW6 eligibility)
- NEVER use markdown (no **, no #, no bullet dashes)
- NEVER write AQL decisions or AQL risk statements
- NEVER add information the inspector did not provide

WHY: You do not have access to the exact defect count per 
finding, the sample size used, or confirmed brand. 
Defect codes must come from the inspector using the 
official manual — not from AI guessing.

OUTPUT FORMAT — FOLLOW EXACTLY:

Line 1: INSPECTION FINDING SUMMARY
Blank line.
Then each finding as one short paragraph.
Blank line.
Last line: DEFECT CODES & AQL: To be completed by inspector 
using Garments V11 / Logistics V7 / relevant manual.

FINDING FORMAT:
Finding [N]: [What was observed, where, how it compares to 
sealed sample or PO spec]. [One factual detail sentence]. 
[Photo confirmation if inspector mentioned it].

FINDING RULES:
- Max 3 sentences per finding
- Write only what the inspector told you
- Use professional English
- If inspector mentioned a photo, write: 
  "Photographic evidence attached."
- If inspector mentioned shade variation, add after that 
  finding paragraph:
  "PENDING INFO ⚠️: Please confirm (a) Gray Scale grade 
  vs sealed sample, (b) percentage of pieces per shade 
  group (Shade A = ?%, Shade B = ?%...), (c) photo with 
  all shade variants and sealed sample in same frame."
- If input is in Bangla, write output in English`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }]
    });
    
    res.json({ text: response.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Defect Search & Manual QA Assistant
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }
  try {
    const skillPath = path.join(__dirname, 'MD file', 'SKILL.md');
    let skillContext = "";
    if (fs.existsSync(skillPath)) {
      skillContext = fs.readFileSync(skillPath, 'utf8');
    }
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      temperature: 0.2,
      system: `You are a Renner QC Expert for Movimoda Asia-Pacific Bangladesh.
Answer every question SHORT, CLEAR, and ORGANIZED.
Rules:
  - Max 6 lines for simple questions, max 10 for complex ones
  - NEVER use long markdown headers like '### Defect Code for...'
  - NEVER repeat the question back
  - NEVER write long paragraphs
  - For defect code questions, use this format:
      Code: [CODE] — [Name]
      Severity: [Critical/Major/Minor] (Zone A & B)
      Manual: [Manual name] — [Section]
      [One extra line only if critical to know]
  - For process/rule questions:
      Rule: [Short rule statement]
      Manual: [Source]
      Example: [One short example if helpful]
  - Ground every answer in renner-manual.skill (provided context)
  - If not found: 'Not in loaded manuals. Check [manual name].'

SHADE VARIATION SPECIAL RULE:
When an inspector mentions 'shade variation', 'color difference', 'shade A/B/C', or similar in their message — before giving any conclusion, ask these 3 specific questions in your reply:

To complete the shade finding, please confirm:
1. Gray Scale grade: What is the Gray Scale rating compared to the sealed sample? (Grade 1-5, minimum acceptable is 3/4)
2. Shade breakdown: What percentage of the inspected pieces fall into each shade group?
   Example: Shade A = 60%, Shade B = 30%, Shade C = 10%
3. Photo confirmation: Was a photo taken showing all shade variants labeled (Shade A, B, C...) with the sealed sample visible in the same frame?

Only after the inspector provides these details, give the full defect classification and AQL impact.

CONTEXT MANUAL:
${skillContext}`,
      messages: [{ role: 'user', content: message }]
    });
    
    res.json({ text: response.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
