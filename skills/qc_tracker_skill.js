const fs = require('fs');
const path = require('path');

class QCTrackerSkill {
    constructor() {
        this.reportPath = path.join(__dirname, '../qc_reports.json');
    }

    async logFinding(text) {
        // Extract basic info from text (e.g., "Inspect order 123 - found 5 defects")
        const finding = {
            timestamp: new Date().toISOString(),
            rawText: text,
            orderId: text.match(/order\s*(\d+)/i)?.[1] || 'Unknown',
            status: 'Logged'
        };

        let reports = [];
        if (fs.existsSync(this.reportPath)) {
            reports = JSON.parse(fs.readFileSync(this.reportPath, 'utf8'));
        }
        reports.push(finding);
        fs.writeFileSync(this.reportPath, JSON.stringify(reports, null, 2));

        return `Report ID: ${reports.length}\nOrder: ${finding.orderId}\nFinding: ${text}\nStatus: Saved to local database.`;
    }
}

module.exports = new QCTrackerSkill();
