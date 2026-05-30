"""
HERMES QC System - Claude AI Analyzer
Uses Claude API to extract structured data from inspection reports
"""

import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "config", ".env"))


class ClaudeAnalyzer:
    """Use Claude API to extract QC data from report text"""
    
    EXTRACTION_PROMPT = """You are a QC data extraction expert for a garments quality management system.

Below is the content of a QC inspection report (PDF or Excel). Extract the following information and return it as a JSON object.

Required fields (use "N/A" if not found):
- vendor: Vendor/Factory name (e.g., "CONCEPT KNITTING LTD")
- style: Style number (e.g., "3TNHL108D")
- job_order: Job order or Lot/Commessa number (e.g., "26S_1095")
- brand: Brand name (e.g., "SISLEY", "BENETTON")
- product: Product type (e.g., "Woman T-Shirt", "Men Polo")
- lot_qty: Total lot quantity as integer (e.g., 1138)
- inspected_qty: Inspected/sample quantity as integer
- pass_qty: Pass quantity as integer
- critical_defects: Count of critical defects as integer
- major_defects: Count of major defects as integer
- minor_defects: Count of minor defects as integer
- aql_result: AQL result ("Acceptable", "Rejected", "N/A")
- inspection_type: Type of inspection ("Final Random", "Inline", "Pre-Final", "PP Meeting")
- inspection_date: Inspection date (format: DD-MMM-YY)
- inspector: Inspector name
- final_status: Final verdict - MUST be one of: "PASS", "HOLD", "REJECT", "PP STAGE"
- main_issue: 1-2 line summary of the main problem (in English)
- defect_details: Comma-separated list of specific defects with location (e.g., "Looseness at Front Neck, Contrast Thread at Back Neck")
- vendor_action_required: 1-2 line action vendor must take (in English, professional tone)

Rules:
1. Return ONLY valid JSON, no extra text
2. If goods are HOLD or REJECT, be specific about WHY in main_issue
3. vendor_action_required should be actionable, not vague
4. Use "PASS" only if goods are clearly acceptable
5. Use "HOLD" if AQL passes but there are concerns (size, safety, etc.)
6. Use "REJECT" if critical defects or AQL fails
7. Use "PP STAGE" only for pre-production meetings (no inspection yet)

REPORT CONTENT:
---
{report_content}
---

Return only the JSON object:"""

    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in .env file")
        
        self.client = Anthropic(api_key=api_key)
        self.model = "claude-opus-4-7"
    
    def analyze_report(self, report_content, filename=""):
        """
        Analyze a single report and extract structured data
        
        Returns: dict with all extracted fields
        """
        # Truncate if too long (PDF content can be huge)
        max_chars = 30000
        if len(report_content) > max_chars:
            report_content = report_content[:max_chars] + "\n[...truncated...]"
        
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[
                    {
                        "role": "user",
                        "content": self.EXTRACTION_PROMPT.format(
                            report_content=report_content
                        )
                    }
                ]
            )
            
            response_text = message.content[0].text.strip()
            
            # Clean JSON (remove markdown code fences if present)
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()
            
            data = json.loads(response_text)
            data["source_file"] = filename
            data["analysis_status"] = "success"
            
            return data
            
        except json.JSONDecodeError as e:
            return {
                "source_file": filename,
                "analysis_status": "json_error",
                "error": str(e),
                "raw_response": response_text[:500] if 'response_text' in locals() else ""
            }
        except Exception as e:
            return {
                "source_file": filename,
                "analysis_status": "api_error",
                "error": str(e)
            }
    
    def analyze_batch(self, file_contents):
        """
        Analyze multiple reports
        
        Args:
            file_contents: List of dicts with 'filename' and 'content' keys
        
        Returns: List of extracted data dicts
        """
        results = []
        for idx, file_data in enumerate(file_contents, start=1):
            if file_data.get("status") != "success":
                continue
            
            print(f"🤖 Analyzing ({idx}/{len(file_contents)}): {file_data['filename']}")
            extracted = self.analyze_report(
                file_data["content"],
                file_data["filename"]
            )
            results.append(extracted)
        
        return results


if __name__ == "__main__":
    # Test
    analyzer = ClaudeAnalyzer()
    test_content = "Style: TEST123, Vendor: TEST CO, AQL: Acceptable, HOLD due to size issue"
    result = analyzer.analyze_report(test_content, "test.pdf")
    print(json.dumps(result, indent=2))
