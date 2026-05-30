const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class LocalSystemSkill {
    constructor() {
        this.basePath = 'C:\\Users\\Tanvir';
    }

    async searchFiles(query) {
        return new Promise((resolve, reject) => {
            // Using windows 'where' command for fast searching in specific directories
            const searchCmd = `dir /s /b "${path.join(this.basePath, '*' + query + '*')}"`;
            console.log(`[LocalSystemSkill] Searching: ${searchCmd}`);
            
            exec(searchCmd, (error, stdout, stderr) => {
                if (error && !stdout) {
                    resolve("No files found matching that query.");
                    return;
                }
                const lines = stdout.split('\n').filter(l => l.trim()).slice(0, 5); // Limit to 5 results
                if (lines.length === 0) return resolve("No files found.");
                resolve(`📂 Local Files Found:\n${lines.join('\n')}`);
            });
        });
    }

    async readLocalFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return content.slice(0, 1000); // Return first 1000 chars
        } catch (err) {
            return `❌ Error reading file: ${err.message}`;
        }
    }
}

module.exports = new LocalSystemSkill();
