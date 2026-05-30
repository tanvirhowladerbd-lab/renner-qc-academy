/**
 * HERMES QC Skill - Full pipeline in Node.js
 * Read yesterday's QC reports → Claude AI analyze → Excel → Gmail
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Anthropic = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');
const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const QC_FOLDER = 'C:\\Users\\Tanvir\\OneDrive - Movimoda\\QC_Report';
const OUTPUT_FOLDER = path.join(__dirname, '../HERMES_QC_System/HERMES_QC_System/output');
const LOGS_FOLDER = path.join(__dirname, '../HERMES_QC_System/HERMES_QC_System/logs');

const RECIPIENT_EMAIL = 'mohammedtanvir.howlader@movimoda.com';
const SENDER_EMAIL = 'tanvir.howlader.bd@gmail.com';

class HermesSkill {
    constructor() {
        this.isRunning = false;
    }

    _getClient() {
        const key = process.env.ANTHROPIC_API_KEY;
        if (!key || key === 'PASTE_YOUR_KEY_HERE') {
            throw new Error('ANTHROPIC_API_KEY not set in .env file');
        }
        return new Anthropic({ apiKey: key });
    }

    // Yesterday's date object
    getYesterday() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d;
    }

    // Get files modified yesterday from QC folder
    getYesterdayFiles() {
        if (!fs.existsSync(QC_FOLDER)) {
            throw new Error(`QC folder not found: ${QC_FOLDER}`);
        }

        const yesterday = this.getYesterday();
        const start = new Date(yesterday);
        start.setHours(0, 0, 0, 0);
        const end = new Date(yesterday);
        end.setHours(23, 59, 59, 999);

        const validExts = ['.pdf', '.xlsx', '.xls', '.xlsm'];

        return fs.readdirSync(QC_FOLDER)
            .filter(f => validExts.includes(path.extname(f).toLowerCase()))
            .map(f => path.join(QC_FOLDER, f))
            .filter(fp => {
                try {
                    const mtime = fs.statSync(fp).mtime;
                    return mtime >= start && mtime <= end;
                } catch { return false; }
            });
    }

    // Read PDF file content
    async readPDF(filePath) {
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        return {
            filename: path.basename(filePath),
            type: 'PDF',
            content: data.text || ''
        };
    }

    // Read Excel file content
    readExcel(filePath) {
        const wb = XLSX.readFile(filePath);
        let content = '';
        for (const sheetName of wb.SheetNames) {
            const sheet = wb.Sheets[sheetName];
            content += `--- Sheet: ${sheetName} ---\n`;
            content += XLSX.utils.sheet_to_csv(sheet);
            content += '\n\n';
        }
        return {
            filename: path.basename(filePath),
            type: 'Excel',
            content
        };
    }

    async callClaudeWithRetry(client, options, maxRetries = 5, baseDelay = 2000) {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                return await client.messages.create(options);
            } catch (err) {
                attempt++;
                const isOverloaded = err.message && (err.message.includes('overloaded_error') || err.message.includes('Overloaded') || err.status === 529);
                const isRateLimit = err.message && (err.message.includes('rate_limit') || err.status === 429);
                const isTemporary = isOverloaded || isRateLimit || err.status >= 500 || !err.status;

                if (isTemporary && attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
                    console.log(`  ⚠️ Claude API call failed: ${err.message || err}. Retrying ${attempt}/${maxRetries} in ${Math.round(delay)}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw err;
                }
            }
        }
    }

    // Analyze report with Claude AI
    async analyzeReport(fileData, client) {
        const truncated = fileData.content.substring(0, 3000);

        const prompt = `You are a QC report analyzer for a garment/apparel factory (Movimoda).

Analyze this inspection report and extract the key information.

Report filename: ${fileData.filename}
Report content:
${truncated}

Respond in this EXACT JSON format only (no extra text):
{
  "date": "DD-MMM-YYYY or N/A",
  "vendor": "vendor/factory name or N/A",
  "style": "style/item name or N/A",
  "job_order": "JO/PO number or N/A",
  "qty_inspected": "number or N/A",
  "defects": "brief defect description or None",
  "final_status": "PASS or HOLD or REJECT",
  "inspector": "inspector name or N/A",
  "remarks": "brief remarks or None"
}`;

        let response;
        try {
            response = await this.callClaudeWithRetry(client, {
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 800,
                messages: [{ role: 'user', content: prompt }]
            });
        } catch (err) {
            console.log(`  ❌ All Haiku retry attempts failed for ${fileData.filename}: ${err.message}`);
            throw err;
        }

        try {
            const text = response.content[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) { /* fall through */ }

        return {
            date: 'N/A', vendor: fileData.filename, style: 'N/A',
            job_order: 'N/A', qty_inspected: 'N/A',
            defects: 'Could not parse', final_status: 'HOLD',
            inspector: 'N/A', remarks: 'Manual review needed'
        };
    }

    // Generate colored Excel summary
    async generateExcel(reports, reportDate) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('QC Summary');

        const dateStr = reportDate.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        // Title row
        sheet.mergeCells('A1:K1');
        const titleCell = sheet.getCell('A1');
        titleCell.value = `QC Daily Summary - ${dateStr} (Yesterday's Reports)`;
        titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 32;

        // Stats row
        const pass = reports.filter(r => r.final_status === 'PASS').length;
        const hold = reports.filter(r => r.final_status === 'HOLD').length;
        const reject = reports.filter(r => r.final_status === 'REJECT').length;

        sheet.mergeCells('A2:K2');
        const statsCell = sheet.getCell('A2');
        statsCell.value = `Total: ${reports.length}  |  PASS: ${pass}  |  HOLD: ${hold}  |  REJECT: ${reject}`;
        statsCell.font = { bold: true, size: 11 };
        statsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
        statsCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(2).height = 22;

        // Column headers
        const headers = ['SL', 'Date', 'Vendor', 'Style', 'Job Order', 'Qty', 'Defects', 'Status', 'Inspector', 'Remarks', 'File'];
        const headerRow = sheet.addRow(headers);
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin' }, bottom: { style: 'thin' },
                left: { style: 'thin' }, right: { style: 'thin' }
            };
        });
        sheet.getRow(3).height = 25;

        // Sort: REJECT first, HOLD second, PASS last
        const sorted = [...reports].sort((a, b) => {
            const order = { REJECT: 0, HOLD: 1, PASS: 2 };
            return (order[a.final_status] ?? 2) - (order[b.final_status] ?? 2);
        });

        // Data rows
        sorted.forEach((r, i) => {
            const row = sheet.addRow([
                i + 1,
                r.date, r.vendor, r.style, r.job_order,
                r.qty_inspected, r.defects, r.final_status,
                r.inspector, r.remarks, r.filename
            ]);

            const bgColor = r.final_status === 'REJECT' ? 'FFFFC7CE'
                : r.final_status === 'HOLD' ? 'FFFFEB9C'
                : 'FFC6EFCE';

            row.eachCell(cell => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                cell.border = {
                    top: { style: 'thin' }, bottom: { style: 'thin' },
                    left: { style: 'thin' }, right: { style: 'thin' }
                };
                cell.alignment = { wrapText: true, vertical: 'middle' };
            });
            row.height = 20;
        });

        // Legend
        sheet.addRow([]);
        const legendRow = sheet.addRow(['Legend:', 'GREEN = PASS', '', 'YELLOW = HOLD', '', 'RED = REJECT']);
        legendRow.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
        legendRow.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
        legendRow.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };

        // Column widths
        [5, 12, 22, 22, 14, 8, 30, 10, 15, 28, 28].forEach((w, i) => {
            sheet.getColumn(i + 1).width = w;
        });

        // Save file
        if (!fs.existsSync(OUTPUT_FOLDER)) fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
        const filename = `QC_Summary_${reportDate.toISOString().split('T')[0]}.xlsx`;
        const filepath = path.join(OUTPUT_FOLDER, filename);
        await workbook.xlsx.writeFile(filepath);
        return filepath;
    }

    // Send email via Gmail SMTP
    async sendEmail(excelPath, stats, reportDate) {
        const gmailPass = process.env.GMAIL_PASSWORD;
        if (!gmailPass) throw new Error('GMAIL_PASSWORD not set in .env');

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // Use STARTTLS
            requireTLS: true,
            auth: { user: SENDER_EMAIL, pass: gmailPass },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 20000
        });

        const dateStr = reportDate.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        const subject = `QC Daily Summary - ${dateStr} | ${stats.reject}R / ${stats.hold}H / ${stats.pass}P`;

        const urgentHtml = stats.reject > 0
            ? `<p style="color:#C00000;font-weight:bold">🚨 URGENT: ${stats.reject} REJECT case(s) need immediate attention.</p>`
            : stats.hold > 0
            ? `<p style="color:#9C5700;font-weight:bold">⚠️ ${stats.hold} HOLD case(s) need vendor follow-up.</p>`
            : '';

        const html = `
<html><body style="font-family:Arial,sans-serif;color:#333">
  <h2 style="color:#1F4E78">QC Daily Summary - ${dateStr}</h2>
  <p>Dear Tanvir,</p>
  <p>Please find attached yesterday's consolidated QC inspection summary.</p>
  ${urgentHtml}
  <h3 style="color:#1F4E78">📊 Summary</h3>
  <table style="border-collapse:collapse;width:350px">
    <tr style="background:#1F4E78;color:white">
      <th style="padding:8px;border:1px solid #ddd">Metric</th>
      <th style="padding:8px;border:1px solid #ddd">Count</th>
    </tr>
    <tr><td style="padding:8px;border:1px solid #ddd">Total Reports</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:bold">${stats.total}</td></tr>
    <tr style="background:#C6EFCE">
        <td style="padding:8px;border:1px solid #ddd">✅ PASS</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:bold">${stats.pass}</td></tr>
    <tr style="background:#FFEB9C">
        <td style="padding:8px;border:1px solid #ddd">⚠️ HOLD</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:bold">${stats.hold}</td></tr>
    <tr style="background:#FFC7CE">
        <td style="padding:8px;border:1px solid #ddd">🔴 REJECT</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center;font-weight:bold">${stats.reject}</td></tr>
  </table>
  <h3 style="color:#1F4E78">📋 Action Items</h3>
  <ol>
    <li>Open the attached Excel file</li>
    <li>Review <b>RED (REJECT)</b> rows first — send urgent CAP request</li>
    <li>Review <b>YELLOW (HOLD)</b> rows — follow up with vendors</li>
  </ol>
  <p style="color:#666;font-size:11px;margin-top:30px;border-top:1px solid #ddd;padding-top:10px">
    Auto-generated by HERMES QC Automation | Powered by Claude AI<br>
    Generated: ${new Date().toLocaleString('en-GB')}
  </p>
</body></html>`;

        await transporter.sendMail({
            from: SENDER_EMAIL,
            to: RECIPIENT_EMAIL,
            subject,
            html,
            attachments: [{ filename: path.basename(excelPath), path: excelPath }]
        });
    }

    // Log to file
    writeLog(message) {
        try {
            if (!fs.existsSync(LOGS_FOLDER)) fs.mkdirSync(LOGS_FOLDER, { recursive: true });
            const logFile = path.join(LOGS_FOLDER, `hermes_${new Date().toISOString().split('T')[0]}.log`);
            const line = `[${new Date().toLocaleTimeString('en-GB')}] ${message}\n`;
            fs.appendFileSync(logFile, line);
        } catch { /* non-critical */ }
    }

    // ===== MAIN PIPELINE =====
    async run(sendEmail = true, statusCallback = null) {
        const log = (msg) => {
            console.log(msg);
            this.writeLog(msg);
            if (statusCallback) statusCallback(msg);
        };

        const debugLog = (msg) => {
            console.log(msg);
            this.writeLog(msg);
        };

        if (this.isRunning) {
            return { status: 'busy', message: '⏳ HERMES ইতিমধ্যে চলছে। একটু অপেক্ষা করুন।' };
        }

        this.isRunning = true;

        try {
            const client = this._getClient();
            const yesterday = this.getYesterday();
            const dateStr = yesterday.toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            });

            log(`🚀 HERMES শুরু হচ্ছে... (${dateStr} এর রিপোর্ট)`);

            // Step 1: Find files
            log('📂 ধাপ ১/৫: OneDrive থেকে ফাইল খুঁজছি...');
            const files = this.getYesterdayFiles();

            if (files.length === 0) {
                this.isRunning = false;
                const msg = `⚠️ ${dateStr} তারিখের কোনো QC রিপোর্ট পাওয়া যায়নি।`;
                log(msg);
                return { status: 'no_files', message: msg };
            }
            log(`✅ ${files.length}টি ফাইল পাওয়া গেছে`);

            // Step 2: Read file contents
            log('📄 ধাপ ২/৫: ফাইল পড়ছি...');
            const fileContents = [];
            for (const fp of files) {
                const ext = path.extname(fp).toLowerCase();
                try {
                    const data = ext === '.pdf' ? await this.readPDF(fp) : this.readExcel(fp);
                    fileContents.push(data);
                    debugLog(`  ✅ পড়া হলো: ${path.basename(fp)}`);
                } catch (e) {
                    debugLog(`  ⚠️ পড়তে পারিনি: ${path.basename(fp)} — ${e.message}`);
                }
            }

            // Step 3: Analyze with Claude
            log(`🤖 ধাপ ৩/৫: Claude AI দিয়ে ${fileContents.length}টি রিপোর্ট analyze করছি...`);
            const reports = [];
            for (const fc of fileContents) {
                debugLog(`  🔍 Analyzing: ${fc.filename}`);
                try {
                    const analysis = await this.analyzeReport(fc, client);
                    analysis.filename = fc.filename;
                    reports.push(analysis);
                } catch (e) {
                    log(`  ❌ Failed to analyze ${fc.filename}: ${e.message}`);
                    reports.push({
                        date: 'N/A',
                        vendor: fc.filename,
                        style: 'N/A',
                        job_order: 'N/A',
                        qty_inspected: 'N/A',
                        defects: 'Could not analyze due to API error',
                        final_status: 'HOLD',
                        inspector: 'N/A',
                        remarks: `API Error: ${e.message}. Manual review needed.`,
                        filename: fc.filename
                    });
                }
                // Small delay to avoid API rate-limiting spikes
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            log(`✅ ${reports.length}টি রিপোর্ট analyze হয়েছে`);

            // Step 4: Generate Excel
            log('📊 ধাপ ৪/৫: Excel Summary তৈরি হচ্ছে...');
            const excelPath = await this.generateExcel(reports, yesterday);
            log(`✅ Excel তৈরি: ${path.basename(excelPath)}`);

            const stats = {
                total: reports.length,
                pass: reports.filter(r => r.final_status === 'PASS').length,
                hold: reports.filter(r => r.final_status === 'HOLD').length,
                reject: reports.filter(r => r.final_status === 'REJECT').length
            };

            // Step 5: Send email
            if (sendEmail) {
                log('📧 ধাপ ৫/৫: Email পাঠানো হচ্ছে...');
                await this.sendEmail(excelPath, stats, yesterday);
                log(`✅ Email পাঠানো হয়েছে → ${RECIPIENT_EMAIL}`);
            } else {
                log('⏸️ Email skip করা হয়েছে (test mode)');
            }

            log('🎉 HERMES pipeline সফলভাবে শেষ!');
            this.isRunning = false;
            return { status: 'success', stats, excelPath };

        } catch (e) {
            log(`❌ Error: ${e.message}`);
            this.isRunning = false;
            return { status: 'error', error: e.message };
        }
    }

    // Get today's log summary
    getLogSummary() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const logFile = path.join(LOGS_FOLDER, `hermes_${today}.log`);
            if (!fs.existsSync(logFile)) return 'আজকের কোনো log নেই।';
            const lines = fs.readFileSync(logFile, 'utf8').split('\n').filter(l => l.trim());
            return lines.slice(-8).join('\n');
        } catch (e) {
            return `Log পড়তে পারছি না: ${e.message}`;
        }
    }
}

module.exports = new HermesSkill();
