const ExcelJS = require('exceljs');
const dotenv = require('dotenv');
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');

dotenv.config({ path: 'C:\\Users\\Tanvir\\Office_AI\\.env' });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function testTranslation() {
  const filePath = "C:\\Users\\Tanvir\\OneDrive - Movimoda\\Asia-Pacific - QA_QC\\OTHER CUSTOMERS\\IN-LINE\\LOJAS RENNER\\My master Q&A sheet\\Movimoda_Renner_QC_TipsBank_v2_2026_1.xlsx";
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet('TIPS BANK');
  
  const testBatch = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < 4 || rowNumber > 8) return; // Read rows 4, 5, 6, 7, 8
    
    testBatch.push({
      sl: row.getCell(1).value,
      step: row.getCell(2).value,
      english: row.getCell(6).value,
      bangla: row.getCell(7).value
    });
  });
  
  console.log("Input batch data:", JSON.stringify(testBatch, null, 2));
  
  const systemPrompt = `You are a translator and senior QC inspector for Lojas Renner S.A. standards. Your job is to clean up and translate the Bangla tips column (which contains some English/Banglish) into proper, natural, conversational Bangla.
  
  RULES:
  1. Keep these words ALWAYS in English: AQL, POM, RFID, Sealed Sample, Counter Sample, Inspectorio, CAPA, Critical, Major, Minor, Hold, Reject, Pass, Fail, all defect codes (e.g. VH2, VG34, VF10, RF1, etc.), all manual names (e.g. Garments V11, etc.), all numbers and measurements (e.g. 80%, 14cm, 90N, etc.), brands (Renner, Youcom, Ashua), platforms (Inspectorio, PLM, NPF, Supabase).
  2. Translate all other parts to simple, conversational, natural Bangla as spoken by a senior QC to a junior colleague.
  3. Every tip translation must start with the step opener: '💡 [Opener]: ' based on the step. Use the following exact step mapping for openers:
     - "01 Pre-Inspection"       → "💡 Inspection শুরু করার আগে: "
     - "02 Production Qty"       → "💡 Production quantity যাচাই করার সময়: "
     - "03 AQL Sampling"         → "💡 AQL Sampling এর সময়: "
     - "04 Random Picking"       → "💡 Sample তোলার সময়: "
     - "05 Visual"               → "💡 Visual inspection এর সময়: "
     - "06 Operational"          → "💡 Operational check এর সময়: "
     - "07 Construction"         → "💡 Construction check এর সময়: "
     - "08 POM"                  → "💡 POM Measurement এর সময়: "
     - "09 RFID/Barcode"         → "💡 RFID ও Barcode যাচাইয়ের সময়: "
     - "10 Care Label"           → "💡 Care label পরীক্ষার সময়: "
     - "11 Hang/Price Tag"       → "💡 Hang tag ও Price tag চেকের সময়: "
     - "12 Hanger"               → "💡 Hanger যাচাইয়ের সময়: "
     - "13 Polybag"              → "💡 Polybag পরীক্ষার সময়: "
     - "14 Master Carton"        → "💡 Master Carton পরীক্ষার সময়: "
     - "15 Size Assortment"      → "💡 Size assortment যাচাইয়ের সময়: "
     - "16 Carton Count"         → "💡 Carton গণনার সময়: "
     - "17 Children Safety(VX)"  → "💡 শিশু পোশাকের safety নিশ্চিত করার সময়: "
     - "18 AQL Decision"         → "💡 AQL Decision নেওয়ার সময়: "
     - "19 Photo Documentation"  → "💡 Photo documentation এর সময়: "
     - "20 CAPA/Re-Inspection"   → "💡 CAPA ও Re-inspection এর সময়: "
     - "21 Report Submission"    → "💡 Report submit করার সময়: "
     - "22 Ethics/Independence"  → "💡 Inspector হিসেবে মনে রাখুন: "
  4. Keep the tip short and clear (maximum 3 sentences).
  
  Input is a JSON array of objects: [ { sl: number, step: string, english: string, bangla: string }, ... ]
  Output must be a JSON array of objects only: [ { sl: number, translation: string }, ... ]
  Do not output any introductory or conversational text, only the raw JSON.`;

  console.log("Calling Claude API...");
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    temperature: 0.1,
    system: systemPrompt,
    messages: [{ role: 'user', content: JSON.stringify(testBatch) }]
  });
  
  console.log("\nClaude raw response content:");
  console.log(response.content[0].text);
  
  try {
    let cleanText = response.content[0].text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7, cleanText.length - 3).trim();
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3, cleanText.length - 3).trim();
    }
    const result = JSON.parse(cleanText);
    console.log("\nSuccessfully parsed JSON results:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("JSON parsing failed:", err.message);
  }
}

testTranslation().catch(err => console.error(err));
