"""
HERMES QC System - Main Pipeline
Orchestrates the full workflow: Read → Analyze → Generate → Email
"""

import json
import logging
from pathlib import Path
from datetime import datetime

from core.file_reader import QCFileReader
from core.claude_analyzer import ClaudeAnalyzer
from core.excel_generator import ExcelSummaryGenerator
from core.email_sender import EmailSender


class HermesPipeline:
    """Main orchestrator for QC summary generation"""
    
    def __init__(self, config_path=None, status_callback=None):
        """
        Args:
            config_path: Path to config.json
            status_callback: Optional function to receive status updates (for GUI)
        """
        if config_path is None:
            config_path = Path(__file__).parent / "config" / "config.json"
        
        with open(config_path) as f:
            self.config = json.load(f)
        
        self.status_callback = status_callback or (lambda msg: print(msg))
        self._setup_logging()
    
    def _setup_logging(self):
        """Setup file logging"""
        log_folder = Path(self.config["paths"]["logs_folder"])
        log_folder.mkdir(parents=True, exist_ok=True)
        
        log_file = log_folder / f"hermes_{datetime.now().strftime('%Y-%m-%d')}.log"
        
        logging.basicConfig(
            filename=str(log_file),
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        self.logger = logging.getLogger("HERMES")
    
    def log(self, msg, level="info"):
        """Log + send to UI callback"""
        if level == "error":
            self.logger.error(msg)
        else:
            self.logger.info(msg)
        self.status_callback(msg)
    
    def run(self, send_email=True, target_date=None):
        """
        Run the complete pipeline
        
        Args:
            send_email: Whether to send email after generation
            target_date: Date for which to generate report (default: today)
        
        Returns: dict with status, excel_path, stats
        """
        run_date = target_date or datetime.now()
        result = {"status": "started", "timestamp": run_date.isoformat()}
        
        try:
            # ===== STEP 1: Read files =====
            self.log(f"🚀 Starting HERMES pipeline for {run_date.strftime('%d-%b-%Y')}")
            self.log("📂 Step 1/4: Reading files from OneDrive...")
            
            reader = QCFileReader(self.config["paths"]["onedrive_qc_folder"])
            file_contents = reader.read_all_today()
            
            if not file_contents:
                self.log("⚠️ No files found for today")
                result["status"] = "no_files"
                return result
            
            success_count = sum(1 for f in file_contents if f.get("status") == "success")
            self.log(f"✅ Read {success_count}/{len(file_contents)} files successfully")
            
            # ===== STEP 2: Analyze with Claude =====
            self.log("🤖 Step 2/4: Analyzing reports with Claude AI...")
            
            analyzer = ClaudeAnalyzer()
            reports_data = analyzer.analyze_batch(file_contents)
            
            valid_reports = [r for r in reports_data if r.get("analysis_status") == "success"]
            self.log(f"✅ Analyzed {len(valid_reports)}/{len(reports_data)} reports")
            
            # ===== STEP 3: Generate Excel =====
            self.log("📊 Step 3/4: Generating consolidated Excel...")
            
            generator = ExcelSummaryGenerator(
                output_folder=self.config["paths"]["output_folder"],
                recipient_email=self.config["email"]["recipient_email"]
            )
            excel_path = generator.generate(valid_reports, run_date)
            
            self.log(f"✅ Excel saved: {excel_path}")
            
            # Compute stats
            stats = {
                "total": len(valid_reports),
                "pass": sum(1 for r in valid_reports if r.get("final_status") == "PASS"),
                "hold": sum(1 for r in valid_reports if r.get("final_status") == "HOLD"),
                "reject": sum(1 for r in valid_reports if r.get("final_status") == "REJECT"),
            }
            
            self.log(f"📈 Summary: {stats['pass']} PASS, {stats['hold']} HOLD, {stats['reject']} REJECT")
            
            # ===== STEP 4: Send Email =====
            if send_email:
                self.log("📧 Step 4/4: Sending email...")
                sender = EmailSender(self.config["email"])
                sender.send(excel_path, stats, run_date)
                self.log(f"✅ Email sent to {self.config['email']['recipient_email']}")
            else:
                self.log("⏸️ Step 4/4: Email skipped (send_email=False)")
            
            result.update({
                "status": "success",
                "excel_path": excel_path,
                "stats": stats,
                "total_files": len(file_contents),
            })
            
            self.log("🎉 Pipeline completed successfully!")
            
        except Exception as e:
            self.log(f"❌ Error: {str(e)}", level="error")
            result["status"] = "error"
            result["error"] = str(e)
        
        return result


if __name__ == "__main__":
    pipeline = HermesPipeline()
    result = pipeline.run(send_email=True)
    print(json.dumps(result, indent=2, default=str))
