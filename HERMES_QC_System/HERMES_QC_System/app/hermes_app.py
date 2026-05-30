"""
HERMES QC System - Desktop Application
Professional GUI for manual triggering of QC summary generation
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from tkinter.scrolledtext import ScrolledText
import threading
from datetime import datetime
from pathlib import Path
import json
import sys
import os
import subprocess

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from main_pipeline import HermesPipeline


class HermesApp:
    """Main desktop application window"""
    
    # Color scheme matching Excel summary
    COLOR_PRIMARY = "#1F4E78"
    COLOR_SECONDARY = "#2E75B6"
    COLOR_SUCCESS = "#00B050"
    COLOR_WARNING = "#FFC000"
    COLOR_DANGER = "#C00000"
    COLOR_BG = "#F2F2F2"
    COLOR_WHITE = "#FFFFFF"
    
    def __init__(self, root):
        self.root = root
        self.root.title("HERMES QC Automation System")
        self.root.geometry("900x700")
        self.root.configure(bg=self.COLOR_BG)
        
        # Load config
        config_path = Path(__file__).parent.parent / "config" / "config.json"
        with open(config_path) as f:
            self.config = json.load(f)
        
        self.pipeline = None
        self.is_running = False
        
        self._build_ui()
    
    def _build_ui(self):
        # ========== HEADER ==========
        header_frame = tk.Frame(self.root, bg=self.COLOR_PRIMARY, height=80)
        header_frame.pack(fill=tk.X)
        header_frame.pack_propagate(False)
        
        tk.Label(
            header_frame,
            text="🏭 HERMES QC AUTOMATION",
            font=("Arial", 18, "bold"),
            bg=self.COLOR_PRIMARY,
            fg=self.COLOR_WHITE
        ).pack(pady=10)
        
        tk.Label(
            header_frame,
            text=f"Welcome, {self.config['user']['name']}  |  {self.config['user']['company']}",
            font=("Arial", 10),
            bg=self.COLOR_PRIMARY,
            fg=self.COLOR_WHITE
        ).pack()
        
        # ========== INFO SECTION ==========
        info_frame = tk.LabelFrame(
            self.root, text="📥 Source & Settings",
            font=("Arial", 10, "bold"), bg=self.COLOR_BG, padx=15, pady=10
        )
        info_frame.pack(fill=tk.X, padx=20, pady=10)
        
        tk.Label(info_frame, text="Source Folder:", font=("Arial", 9, "bold"),
                bg=self.COLOR_BG).grid(row=0, column=0, sticky="w", pady=3)
        tk.Label(info_frame, text=self.config["paths"]["onedrive_qc_folder"],
                font=("Arial", 9), bg=self.COLOR_BG, fg="#444").grid(row=0, column=1, sticky="w", padx=10)
        
        tk.Label(info_frame, text="Recipient:", font=("Arial", 9, "bold"),
                bg=self.COLOR_BG).grid(row=1, column=0, sticky="w", pady=3)
        tk.Label(info_frame, text=self.config["email"]["recipient_email"],
                font=("Arial", 9), bg=self.COLOR_BG, fg="#444").grid(row=1, column=1, sticky="w", padx=10)
        
        tk.Label(info_frame, text="Today:", font=("Arial", 9, "bold"),
                bg=self.COLOR_BG).grid(row=2, column=0, sticky="w", pady=3)
        tk.Label(info_frame, text=datetime.now().strftime("%A, %d %B %Y"),
                font=("Arial", 9), bg=self.COLOR_BG, fg="#444").grid(row=2, column=1, sticky="w", padx=10)
        
        # ========== ACTION BUTTONS ==========
        action_frame = tk.LabelFrame(
            self.root, text="⚙️ Actions",
            font=("Arial", 10, "bold"), bg=self.COLOR_BG, padx=15, pady=15
        )
        action_frame.pack(fill=tk.X, padx=20, pady=5)
        
        btn_style = {"font": ("Arial", 11, "bold"), "fg": self.COLOR_WHITE,
                    "padx": 20, "pady": 10, "borderwidth": 0, "cursor": "hand2"}
        
        self.btn_generate = tk.Button(
            action_frame, text="🚀 Generate Summary (No Email)",
            bg=self.COLOR_SECONDARY,
            command=lambda: self.run_pipeline(send_email=False),
            **btn_style
        )
        self.btn_generate.pack(side=tk.LEFT, padx=5)
        
        self.btn_generate_email = tk.Button(
            action_frame, text="📧 Generate + Send Email",
            bg=self.COLOR_SUCCESS,
            command=lambda: self.run_pipeline(send_email=True),
            **btn_style
        )
        self.btn_generate_email.pack(side=tk.LEFT, padx=5)
        
        self.btn_open_output = tk.Button(
            action_frame, text="📂 Open Output Folder",
            bg="#666",
            command=self.open_output_folder,
            **btn_style
        )
        self.btn_open_output.pack(side=tk.LEFT, padx=5)
        
        # ========== PROGRESS ==========
        progress_frame = tk.Frame(self.root, bg=self.COLOR_BG)
        progress_frame.pack(fill=tk.X, padx=20, pady=5)
        
        self.progress = ttk.Progressbar(progress_frame, mode='indeterminate', length=860)
        self.progress.pack(fill=tk.X)
        
        # ========== STATUS LOG ==========
        log_frame = tk.LabelFrame(
            self.root, text="📊 Status Log",
            font=("Arial", 10, "bold"), bg=self.COLOR_BG, padx=10, pady=10
        )
        log_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=10)
        
        self.log_text = ScrolledText(
            log_frame, height=15, font=("Consolas", 9),
            bg=self.COLOR_WHITE, fg="#222", wrap=tk.WORD
        )
        self.log_text.pack(fill=tk.BOTH, expand=True)
        
        self.log_message("🟢 HERMES Ready. Click button to start.")
        
        # ========== FOOTER ==========
        footer = tk.Label(
            self.root,
            text="HERMES QC Automation v1.0  |  Powered by Claude AI  |  © Mohammed Tanvir",
            font=("Arial", 8), bg=self.COLOR_BG, fg="#888"
        )
        footer.pack(side=tk.BOTTOM, pady=5)
    
    def log_message(self, msg):
        """Add message to log with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.insert(tk.END, f"[{timestamp}] {msg}\n")
        self.log_text.see(tk.END)
        self.root.update_idletasks()
    
    def set_buttons_state(self, enabled):
        """Enable/disable action buttons"""
        state = tk.NORMAL if enabled else tk.DISABLED
        self.btn_generate.config(state=state)
        self.btn_generate_email.config(state=state)
    
    def run_pipeline(self, send_email=False):
        """Run the pipeline in a background thread"""
        if self.is_running:
            messagebox.showwarning("Already Running", "A task is already in progress.")
            return
        
        self.is_running = True
        self.set_buttons_state(False)
        self.progress.start(10)
        
        # Clear previous log
        self.log_text.delete("1.0", tk.END)
        
        thread = threading.Thread(
            target=self._run_pipeline_thread,
            args=(send_email,),
            daemon=True
        )
        thread.start()
    
    def _run_pipeline_thread(self, send_email):
        """Background thread for pipeline execution"""
        try:
            pipeline = HermesPipeline(status_callback=self.log_message)
            result = pipeline.run(send_email=send_email)
            
            self.root.after(0, lambda: self._on_pipeline_complete(result))
            
        except Exception as e:
            self.root.after(0, lambda: self._on_pipeline_error(str(e)))
    
    def _on_pipeline_complete(self, result):
        """Handle pipeline completion"""
        self.progress.stop()
        self.set_buttons_state(True)
        self.is_running = False
        
        if result["status"] == "success":
            stats = result["stats"]
            msg = (f"✅ Pipeline completed!\n\n"
                   f"📊 Reports processed: {stats['total']}\n"
                   f"✅ PASS: {stats['pass']}\n"
                   f"⚠️ HOLD: {stats['hold']}\n"
                   f"🔴 REJECT: {stats['reject']}\n\n"
                   f"📂 File: {Path(result['excel_path']).name}")
            messagebox.showinfo("Success", msg)
        elif result["status"] == "no_files":
            messagebox.showwarning("No Files", "No QC reports found for today.")
        else:
            messagebox.showerror("Error", result.get("error", "Unknown error"))
    
    def _on_pipeline_error(self, error):
        """Handle pipeline errors"""
        self.progress.stop()
        self.set_buttons_state(True)
        self.is_running = False
        self.log_message(f"❌ FATAL ERROR: {error}")
        messagebox.showerror("Pipeline Error", error)
    
    def open_output_folder(self):
        """Open output folder in Windows Explorer"""
        folder = self.config["paths"]["output_folder"]
        Path(folder).mkdir(parents=True, exist_ok=True)
        
        if os.name == 'nt':  # Windows
            os.startfile(folder)
        else:
            subprocess.run(['xdg-open', folder])


def main():
    root = tk.Tk()
    
    # Center window on screen
    root.update_idletasks()
    width = 900
    height = 700
    x = (root.winfo_screenwidth() // 2) - (width // 2)
    y = (root.winfo_screenheight() // 2) - (height // 2)
    root.geometry(f"{width}x{height}+{x}+{y}")
    
    app = HermesApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
