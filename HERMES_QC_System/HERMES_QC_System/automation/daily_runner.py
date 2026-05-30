"""
HERMES QC System - Automated Daily Runner
Runs the pipeline silently and sends email
Triggered by Windows Task Scheduler at 10:00 PM daily
"""

import sys
from pathlib import Path
from datetime import datetime

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from main_pipeline import HermesPipeline


def main():
    print(f"=" * 60)
    print(f"HERMES QC Automation - Daily Run")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"=" * 60)
    
    try:
        pipeline = HermesPipeline()
        result = pipeline.run(send_email=True)
        
        print(f"\n{'='*60}")
        print(f"FINAL STATUS: {result['status'].upper()}")
        if result.get("stats"):
            print(f"Reports: {result['stats']['total']} | "
                  f"PASS: {result['stats']['pass']} | "
                  f"HOLD: {result['stats']['hold']} | "
                  f"REJECT: {result['stats']['reject']}")
        print(f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"=" * 60)
        
        # Exit code: 0 = success, 1 = no files, 2 = error
        if result["status"] == "success":
            sys.exit(0)
        elif result["status"] == "no_files":
            sys.exit(1)
        else:
            sys.exit(2)
            
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        sys.exit(99)


if __name__ == "__main__":
    main()
