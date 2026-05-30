const ExcelJS = require('exceljs');
const dotenv = require('dotenv');
const { Anthropic } = require('@anthropic-ai/sdk');

dotenv.config({ path: 'C:\\Users\\Tanvir\\Office_AI\\.env' });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const filePath = "C:\\Users\\Tanvir\\OneDrive - Movimoda\\Asia-Pacific - QA_QC\\OTHER CUSTOMERS\\IN-LINE\\LOJAS RENNER\\My master Q&A sheet\\Movimoda_Renner_QC_TipsBank_v2_2026_1.xlsx";

async function main() {
  console.log("Loading Excel workbook...");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet('TIPS BANK');
  console.log(`Workbook loaded. TIPS BANK actual rows: ${sheet.actualRowCount}`);
  
  const allRows = [];
  
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < 4) return; // Skip headers
    
    allRows.push({
      rowNumber,
      sl: row.getCell(1).value,
      step: row.getCell(2).value || "",
      english: row.getCell(6).value || "",
      bangla: row.getCell(7).value || ""
    });
  });
  
  console.log(`Total data rows to process: ${allRows.length}`);
  
  const systemPrompt = `You are a translator and senior QC inspector for Lojas Renner S.A. standards. Your job is to clean up and translate the Bangla tips column (which contains some English/Banglish or is not proper Bangla) into proper, natural, conversational Bangla.
  
  RULES:
  1. Keep these words ALWAYS in English (never translate them): AQL, POM, RFID, Sealed Sample, Counter Sample, Inspectorio, CAPA, Critical, Major, Minor, Hold, Reject, Pass, Fail, all defect codes (e.g. VH2, VG34, VF10, RF1, VX7, etc.), all manual names (e.g. Garments V11, Footwear R26, etc.), all numbers and measurements (e.g. 80%, 14cm, 90N, etc.), brands (Renner, Youcom, Ashua), platforms (Inspectorio, PLM, NPF, Supabase).
  2. Translate all other parts to simple, conversational, natural Bangla as spoken by a senior QC to a junior colleague. Do not make it sound like a textbook. Use simple words.
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
  Output must be in XML format only, wrapping the results like this:
  <tips>
    <tip>
      <sl>[sl]</sl>
      <translation>[translated tip]</translation>
    </tip>
  </tips>
  
  Do not output any introductory or conversational text, only the raw XML tags.`;

  const batchSize = 30;
  for (let i = 0; i < allRows.length; i += batchSize) {
    const batch = allRows.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(allRows.length / batchSize)} (Rows ${batch[0].rowNumber} to ${batch[batch.length - 1].rowNumber})...`);
    
    const inputPayload = batch.map(b => ({
      sl: b.sl,
      step: b.step,
      english: b.english,
      bangla: b.bangla
    }));
    
    let attempts = 3;
    let success = false;
    let results = [];
    
    while (attempts > 0 && !success) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 4000,
          temperature: 0.1,
          system: systemPrompt,
          messages: [{ role: 'user', content: JSON.stringify(inputPayload) }]
        });
        
        const cleanText = response.content[0].text.trim();
        
        // Parse XML using RegExp
        const regex = /<tip>\s*<sl>(\d+)<\/sl>\s*<translation>([\s\S]*?)<\/translation>\s*<\/tip>/g;
        let match;
        results = [];
        while ((match = regex.exec(cleanText)) !== null) {
          results.push({
            sl: parseInt(match[1], 10),
            translation: match[2].trim()
          });
        }
        
        if (results.length === 0) {
          throw new Error("No XML tags found in response or regex parsing failed.");
        }
        
        if (results.length !== batch.length) {
          console.warn(`Warning: Expected ${batch.length} results, but parsed ${results.length} from XML.`);
        }
        
        success = true;
      } catch (err) {
        console.error(`Attempt failed: ${err.message}. Retrying...`);
        attempts--;
        if (attempts === 0) throw err;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    
    // Update workbook
    const resultMap = {};
    results.forEach(r => {
      resultMap[r.sl] = r.translation;
    });
    
    batch.forEach(b => {
      const translated = resultMap[b.sl];
      if (translated) {
        sheet.getRow(b.rowNumber).getCell(7).value = translated;
      } else {
        console.warn(`No translation found for row SL ${b.sl}`);
      }
    });
    
    console.log(`Saving progress to Excel after batch...`);
    await workbook.xlsx.writeFile(filePath);
    console.log(`Saved batch successfully.`);
  }
  
  console.log("All rows translated and saved back to Excel!");
}

main().catch(err => {
  console.error("Critical error in translation script:", err);
  process.exit(1);
});
