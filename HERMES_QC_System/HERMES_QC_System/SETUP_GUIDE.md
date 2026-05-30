# 🏭 HERMES QC AUTOMATION SYSTEM

**Author:** Mohammed Tanvir Howlader  
**Company:** Movimoda  
**Purpose:** Automate daily QC report consolidation from OneDrive  
**Built with:** Claude AI + Python

---

## 📋 কি কাজ করে এই System? (What this system does)

**English:**  
Reads all PDF/Excel inspection reports from your OneDrive `QC_Report` folder, analyzes them with Claude AI, generates a consolidated single-table Excel summary, and emails it to you daily at 10:30 PM.

**বাংলা:**  
আপনার OneDrive এর `QC_Report` folder থেকে সব PDF/Excel inspection report পড়ে, Claude AI দিয়ে analyze করে, একটা single-table Excel summary বানায়, এবং প্রতিদিন রাত ১০:৩০ এ আপনার email এ পাঠায়।

---

## 🎯 দুই Mode (Two Modes)

### Mode 1: 📱 Desktop App (Manual)
- যখন ইচ্ছা button click করে run করবেন
- Custom date দিয়ে run করতে পারবেন
- Live status দেখতে পারবেন

### Mode 2: 🤖 Automation (Scheduled)
- Windows Task Scheduler দিয়ে রোজ ১০ PM auto-run
- Email আপনার inbox এ চলে আসবে
- কিছু করতে হবে না

---

## ⚙️ One-Time Setup (১ ঘন্টার কাজ)

### Step 1: Project Setup
```cmd
1. এই folder টা copy করুন: C:\HERMES_QC_System\
2. Command Prompt open করে folder এ যান:
   cd C:\HERMES_QC_System
```

### Step 2: Package Install
```cmd
# Easy way - double-click করুন:
install.bat

# অথবা manually:
pip install -r requirements.txt
```

### Step 3: Configuration (গুরুত্বপূর্ণ!)

**A. `config/config.json` edit করুন:**
```json
{
    "paths": {
        "onedrive_qc_folder": "C:/Users/আপনার_USERNAME/OneDrive - Movimoda/QC_Report"
    },
    "email": {
        "recipient_email": "mohammedtanvir.howlader@movimoda.com"
    }
}
```

**B. API Key Setup:**
```cmd
1. config/.env.template file টা rename করে .env বানান
2. Notepad এ open করুন
3. এই দুইটা value add করুন:
```

```env
ANTHROPIC_API_KEY=sk-ant-api03-আপনার_HERMES_API_KEY
EMAIL_APP_PASSWORD=আপনার_OUTLOOK_APP_PASSWORD
```

**Outlook App Password কিভাবে নিবেন:**
1. https://account.microsoft.com/security এ যান
2. "Advanced security options" → "App passwords"
3. New app password create করুন (HERMES নাম দিন)
4. Generate হওয়া password copy করে .env এ paste করুন
5. ⚠️ এটা আপনার regular Outlook password নয়!

### Step 4: Test Run
```cmd
# Desktop App launch:
Launch_HERMES.bat (double-click)

# Manual test:
python automation/daily_runner.py
```

### Step 5: Schedule Daily Run (Automation Mode)
```cmd
1. automation/setup_scheduler.bat এ right-click
2. "Run as administrator" select করুন
3. Done! প্রতিদিন ১০ PM এ auto-run হবে
```

---

## 📂 Project Structure

```
HERMES_QC_System/
│
├── 📂 core/                    ← Backend modules
│   ├── file_reader.py          ← PDF/Excel reader
│   ├── claude_analyzer.py      ← Claude AI integration
│   ├── excel_generator.py      ← Excel summary creator
│   └── email_sender.py         ← Outlook email sender
│
├── 📱 app/                      ← Desktop App
│   └── hermes_app.py           ← GUI window
│
├── 🤖 automation/               ← Scheduled scripts
│   ├── daily_runner.py         ← 10 PM auto-run
│   └── setup_scheduler.bat     ← Task Scheduler setup
│
├── 📋 config/                   ← Settings
│   ├── config.json             ← Main settings
│   ├── .env.template           ← API keys template
│   └── .env                    ← Your actual keys (DO NOT SHARE)
│
├── 📊 output/                   ← Generated Excel files
├── 📜 logs/                     ← Run history logs
│
├── main_pipeline.py            ← Main orchestrator
├── requirements.txt            ← Python packages list
├── install.bat                 ← One-click installer
├── Launch_HERMES.bat           ← Easy app launcher
└── SETUP_GUIDE.md              ← This file
```

---

## 🚀 Daily Workflow

### Automation Mode (Default):
```
🕙 10:00 PM → Windows Task Scheduler triggers daily_runner.py
🕙 10:01 PM → Reads files from OneDrive QC_Report folder
🕙 10:15 PM → Claude AI analyzes each report
🕙 10:25 PM → Excel summary generated → output/
🕙 10:30 PM → Email sent to your inbox

🕓 Next morning → You open email, review RED items first
```

### Manual Mode (App):
```
1. Double-click Launch_HERMES.bat
2. Window opens with buttons
3. Click "Generate Summary (No Email)" → preview Excel
4. Click "Generate + Send Email" → full pipeline
5. Live progress shown in Status Log
```

---

## 📊 Excel Output Format

প্রতিদিনের Excel এ থাকবে:
- ✅ Title bar with date
- ✅ Quick stats: Total / PASS / HOLD / REJECT counts
- ✅ Main table with 11 columns (SL, Date, Vendor, Style, Job Order, etc.)
- ✅ Color-coded status (Red=Reject, Yellow=Hold, Green=Pass)
- ✅ Sorted: REJECT first, then HOLD, then PASS
- ✅ Legend at bottom

---

## 🛠️ Troubleshooting

### "ANTHROPIC_API_KEY not found"
- `.env` file ঠিকঠাক বানিয়েছেন তো check করুন
- `config/.env` location এ আছে কিনা দেখুন
- API key এর আগে কোনো space নেই কিনা দেখুন

### "Folder not found"
- `config.json` এ OneDrive path সঠিক কিনা check করুন
- Forward slash (`/`) ব্যবহার করুন, backslash না

### "Email sending failed"
- Outlook App Password ব্যবহার করছেন কিনা (regular password নয়)
- Antivirus block করছে না তো দেখুন

### "No files found for today"
- OneDrive sync complete কিনা check করুন
- File modified date today এর কিনা দেখুন

---

## 💡 Tips

1. **API Cost Monitor:** প্রতিদিন ~$0.30-0.50 খরচ হবে, monthly ~$10-15
2. **Backup:** `output/` folder regularly backup করুন
3. **Logs:** Error হলে `logs/` folder check করুন
4. **Update API key:** Anthropic console থেকে periodically rotate করুন

---

## 📞 Support

কোনো issue হলে:
1. `logs/` folder এ আজকের log file check করুন
2. Error message সহ Tanvir কে contact করুন
3. AI/Tech support: Claude.ai এ এই project এর context সহ ask করুন

---

**Built with ❤️ for Movimoda Quality Team**  
*Powered by Claude AI*
