const { exec } = require('child_process');
const path = require('path');

class DesktopRPASkill {
    constructor() {
        this.chromePath = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';
        this.oneDrivePath = 'C:\\Users\\Tanvir\\OneDrive';
    }

    async launchApp(appName) {
        let command = '';
        switch(appName.toLowerCase()) {
            case 'whatsapp':
                command = 'start whatsapp:'; // Using URI scheme if installed from Store
                break;
            case 'outlook':
                command = 'start outlook';
                break;
            case 'iris spring':
                command = `powershell -Command "Start-Process '${path.join('C:\\Users\\Tanvir\\Desktop', 'Iris Spring.lnk')}'"`;
                break;
            default:
                command = `powershell -Command "Start-Process '${appName}'"`;
        }
        
        return new Promise((resolve) => {
            exec(command, (error) => {
                if (error) resolve(`❌ Failed to launch ${appName}: ${error.message}`);
                else resolve(`✅ Launched ${appName} successfully.`);
            });
        });
    }

    async launchChromeProfile(profile) {
        // profile should be like "Default", "Profile 1", etc.
        const command = `${this.chromePath} --profile-directory="${profile}"`;
        exec(command);
        return `✅ Launching Chrome with profile: ${profile}`;
    }

    async processOutlookClassic() {
        const psCommand = `
        $outlook = New-Object -ComObject Outlook.Application
        $namespace = $outlook.GetNamespace("MAPI")
        $inbox = $namespace.GetDefaultFolder(6)
        $today = (Get-Date).Date
        $unreadItems = $inbox.Items.Restrict("[Unread] = true AND [ReceivedTime] >= '$($today.ToString("MM/dd/yyyy HH:mm"))'")
        
        $summary = @()
        foreach ($item in $unreadItems) {
            $summary += "📧 From: $($item.SenderName) | Subject: $($item.Subject)"
            $item.UnRead = $true # Mark back as unread
        }
        
        if ($summary.Count -eq 0) { "No unread emails from today." }
        else { $summary -join "\\n" }
        `;

        return new Promise((resolve) => {
            const cmd = `powershell -Command "${psCommand.replace(/\n/g, ' ')}"`;
            exec(cmd, (error, stdout) => {
                if (error) resolve(`❌ Outlook Error: ${error.message}`);
                else resolve(`📫 Outlook Classic Summary (Today's Unread):\n${stdout.trim()}`);
            });
        });
    }

    async searchOneDrive(query) {
        return new Promise((resolve) => {
            const command = `powershell -Command "Get-ChildItem -Path '${this.oneDrivePath}' -Filter '*${query}*' -Recurse | Select-Object -First 5 -ExpandProperty FullName"`;
            exec(command, (error, stdout) => {
                if (error || !stdout) resolve("No files found in OneDrive.");
                else resolve(`☁️ OneDrive Files Found:\n${stdout.trim()}`);
            });
        });
    }
}

module.exports = new DesktopRPASkill();
