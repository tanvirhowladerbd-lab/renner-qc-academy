/**
 * Lojas Renner QC Academy Database Seeder v2.0
 */
const ExcelJS = require('exceljs');
const dotenv = require('dotenv');

dotenv.config({ path: 'C:\\Users\\Tanvir\\Office_AI\\.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env!");
  process.exit(1);
}

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

async function fetchSupabase(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase REST error on ${endpoint}: ${response.status} - ${text}`);
  }
  return response;
}

async function seedTable(tableName, rows) {
  const url = `${SUPABASE_URL}/rest/v1/${tableName}`;
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await fetchSupabase(tableName, {
      method: 'POST',
      body: JSON.stringify(batch),
      headers: {
        'Prefer': 'resolution=merge-duplicates'
      }
    });
    console.log(`Seeded ${i + batch.length}/${rows.length} rows into ${tableName}.`);
  }
}

async function main() {
  const workbookPath = "C:\\Users\\Tanvir\\OneDrive - Movimoda\\Asia-Pacific - QA_QC\\OTHER CUSTOMERS\\IN-LINE\\LOJAS RENNER\\My master Q&A sheet\\Movimoda_Renner_QC_TipsBank_v2_2026_1.xlsx";
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);
  console.log("Workbook loaded. Starting seeding parsing...");

  // 1. Process TIPS BANK
  const tSheet = workbook.getWorksheet('TIPS BANK');
  const tips = [];
  tSheet.eachRow((row, rowNumber) => {
    if (rowNumber < 4) return; // Skip title and headers (starts at row 4)
    
    const sl = parseInt(row.getCell(1).value, 10);
    if (!sl || isNaN(sl)) return; // Skip empty rows
    
    const priorityVal = String(row.getCell(9).value || "").toLowerCase();
    let priorityNum = 3; // Standard default
    if (priorityVal.includes('critical')) {
      priorityNum = 1;
    } else if (priorityVal.includes('major')) {
      priorityNum = 2;
    }

    tips.push({
      tip_number: sl,
      inspection_step: row.getCell(2).value || "",
      category: row.getCell(3).value || "",
      brand: row.getCell(4).value || "",
      tip_title: row.getCell(5).value || "",
      tip_english: row.getCell(6).value || "",
      tip_bangla: row.getCell(7).value || "",
      source: row.getCell(8).value || "",
      priority: priorityNum
    });
  });
  console.log(`Parsed ${tips.length} tips from Excel.`);

  // 2. Process QUESTION BANK
  const qSheet = workbook.getWorksheet('QUESTION BANK');
  const questions = [];
  qSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip headers (starts at row 2)
    
    const sl = parseInt(row.getCell(1).value, 10);
    if (!sl || isNaN(sl)) return;
    
    questions.push({
      sl: sl,
      topic: row.getCell(2).value || "",
      difficulty: row.getCell(3).value || "Medium",
      question: row.getCell(4).value || "",
      a: row.getCell(5).value || "",
      b: row.getCell(6).value || "",
      c: row.getCell(7).value || "",
      d: row.getCell(8).value || "",
      answer: row.getCell(9).value || "",
      explanation: row.getCell(10).value || "",
      source: row.getCell(11).value || "",
      tags: row.getCell(12).value || "",
      inspection_step: row.getCell(13).value || "",
      defect_type: row.getCell(14).value || "",
      brand: row.getCell(15).value || "",
      product_category: row.getCell(16).value || "",
      priority: parseInt(row.getCell(17).value, 10) || 3
    });
  });
  console.log(`Parsed ${questions.length} questions from Excel.`);

  // A. Seeding daily_tips
  console.log("Truncating daily_tips table (deleting all existing rows)...");
  // Delete all rows in daily_tips by matching on not null sl / id
  await fetchSupabase('daily_tips?id=gt.0', {
    method: 'DELETE'
  });
  console.log("daily_tips table truncated. Seeding tips...");
  await seedTable('daily_tips', tips);

  // B. Seeding questions (incremental check)
  console.log("Fetching existing question SLs from database...");
  const resExisting = await fetchSupabase('questions?select=sl');
  const existingQuestions = await resExisting.json();
  const existingSLs = new Set(existingQuestions.map(q => q.sl));
  console.log(`Found ${existingSLs.size} existing questions in Supabase.`);

  const newQuestions = questions.filter(q => !existingSLs.has(q.sl));
  console.log(`Found ${newQuestions.length} new questions to insert.`);

  if (newQuestions.length > 0) {
    console.log("Seeding new questions...");
    await seedTable('questions', newQuestions);
  } else {
    console.log("No new questions to seed.");
  }

  // C. Output counts
  const finalTipsCountRes = await fetchSupabase('daily_tips?select=count', {
    headers: { 'Prefer': 'count=exact' }
  });
  const finalTipsCount = finalTipsCountRes.headers.get('content-range')?.split('/')?.[1] || tips.length;

  const finalQuestionsCountRes = await fetchSupabase('questions?select=count', {
    headers: { 'Prefer': 'count=exact' }
  });
  const finalQuestionsCount = finalQuestionsCountRes.headers.get('content-range')?.split('/')?.[1] || (existingSLs.size + newQuestions.length);

  console.log(`\nDATABASE SEEDING SUMMARY:`);
  console.log(`daily_tips table: ${finalTipsCount} rows inserted`);
  console.log(`questions table: ${finalQuestionsCount} total rows, ${newQuestions.length} new rows added`);
}

main().catch(err => {
  console.error("Critical error during database seeding:", err);
  process.exit(1);
});
