/**
 * Lojas Renner QC Academy Supabase Seeding Script
 * 
 * Data Lineage Registry:
 * 1. Master Question Bank (Drive): Lojas Renner Inspection record format.xlsx
 *    Link: https://docs.google.com/spreadsheets/d/1Xl25mc1Dj53Bd4cy0d_wJzwC8K8ewFeP/edit?usp=drive_link
 * 2. Daily Tips Source (Drive): Renner_QC_New_300_Questions
 *    Link: https://docs.google.com/spreadsheets/d/1p4rsJ8yhb53bzX7MgM0IMXb5ilRctfo7ZuupXGCBWbY/edit?usp=drive_link
 * 3. Notion Knowledge Hub:
 *    - Hub: https://jewel-twister-362.notion.site/Renner-Buyer-Manual-Hub-36e8d6bb56b181e3bbbfeb0d4eb4314c
 *    - User Guide: https://jewel-twister-362.notion.site/User-Guide-How-to-Use-renner-manual-SKILL-36e8d6bb56b181058922e23244c9dc84
 *    - Directory: https://jewel-twister-362.notion.site/b25d3ec2d3514f98a2a2ae26a1b03a4c?v=63f44ae325d244cd95927f243b827766
 * 4. Consolidated Output Excel: Movimoda_Renner_QC_TrainingBank_v1_2026.xlsx
 *    Path: C:\Users\Tanvir\OneDrive - Movimoda\Asia-Pacific - QA_QC\OTHER CUSTOMERS\IN-LINE\LOJAS RENNER\My master Q&A sheet\
 */

const ExcelJS = require('exceljs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: 'C:\\Users\\Tanvir\\Office_AI\\.env' });

const SUPABASE_URL = process.env.SUPABASE_URL; // Add to .env: SUPABASE_URL=https://your-project.supabase.co
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Add to .env: SUPABASE_SERVICE_ROLE_KEY=your-key

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in your .env file!");
  process.exit(1);
}

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates'
};

async function seedTable(tableName, rows) {
  const url = `${SUPABASE_URL}/rest/v1/${tableName}`;
  // Send in batches of 100 to avoid request size limits
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(batch)
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }
      console.log(`Successfully seeded ${i + batch.length}/${rows.length} rows into ${tableName}.`);
    } catch (err) {
      console.error(`Failed seeding batch to ${tableName}:`, err.message);
      throw err;
    }
  }
}

async function main() {
  const workbookPath = "C:\\Users\\Tanvir\\OneDrive - Movimoda\\Asia-Pacific - QA_QC\\OTHER CUSTOMERS\\IN-LINE\\LOJAS RENNER\\My master Q&A sheet\\Movimoda_Renner_QC_TrainingBank_v1_2026.xlsx";
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);
  
  console.log("Workbook loaded successfully. Reading sheets...");
  
  // 1. Parse QUESTION BANK
  const qSheet = workbook.getWorksheet('QUESTION BANK');
  const questions = [];
  qSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip headers
    
    questions.push({
      sl: parseInt(row.getCell(1).value, 10),
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
  console.log(`Parsed ${questions.length} questions.`);
  
  // 2. Parse TIPS BANK
  const tSheet = workbook.getWorksheet('TIPS BANK');
  const tips = [];
  tSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip headers
    
    tips.push({
      sl: parseInt(row.getCell(1).value, 10),
      inspection_step: row.getCell(2).value || "",
      product_category: row.getCell(3).value || "",
      brand: row.getCell(4).value || "",
      tip_title: row.getCell(5).value || "",
      tip_english: row.getCell(6).value || "",
      tip_banglish: row.getCell(7).value || "",
      source_reference: row.getCell(8).value || ""
    });
  });
  console.log(`Parsed ${tips.length} tips.`);
  
  // 3. Seed Supabase
  console.log("\nStarting database seeding...");
  await seedTable('questions', questions);
  await seedTable('daily_tips', tips);
  console.log("\nSeeding completed successfully!");
}

main().catch(err => {
  console.error("Seeding execution failed:", err.message);
  process.exit(1);
});
