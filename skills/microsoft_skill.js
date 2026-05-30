const msal = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');
const fs = require('fs');
const path = require('path');

class MicrosoftSkill {
    constructor() {
        this.envPath = path.join(__dirname, '../.env');
        this.config = {
            auth: {
                clientId: process.env.MS_CLIENT_ID,
                authority: `https://login.microsoftonline.com/common`,
                clientSecret: process.env.MS_CLIENT_SECRET,
            }
        };
        this.cca = new msal.ConfidentialClientApplication(this.config);
        this.scopes = [
            'User.Read', 'email'
        ];
    }

    async getAuthUrl() {
        const authCodeUrlParameters = {
            scopes: this.scopes,
            redirectUri: process.env.MS_REDIRECT_URI,
        };
        return await this.cca.getAuthCodeUrl(authCodeUrlParameters);
    }

    async getTokenFromCode(code) {
        const tokenRequest = {
            code: code,
            scopes: this.scopes,
            redirectUri: process.env.MS_REDIRECT_URI,
        };
        const response = await this.cca.acquireTokenByCode(tokenRequest);
        this.saveRefreshToken(response.account.homeAccountId);
        return response.accessToken;
    }

    async getGraphClient() {
        const token = await this.getAccessToken();
        return Client.init({
            authProvider: (done) => done(null, token)
        });
    }

    async getAccessToken() {
        // Simple logic to get token from cache/refresh
        const tokenCache = this.cca.getTokenCache();
        const accounts = await tokenCache.getAllAccounts();
        if (accounts.length > 0) {
            const silentRequest = {
                account: accounts[0],
                scopes: this.scopes,
            };
            const response = await this.cca.acquireTokenSilent(silentRequest);
            return response.accessToken;
        }
        throw new Error('No accounts found. Please authenticate via the OAuth link.');
    }

    saveRefreshToken(homeAccountId) {
        // MSAL handles persistence in memory, but we could serialize the cache if needed.
        // For this task, we will assume MSAL's internal cache is sufficient for the session.
    }

    // --- SKILLS ---

    async checkEmails() {
        const client = await this.getGraphClient();
        const res = await client.api('/me/messages').filter('isRead eq false').top(10).get();
        return res.value.map(m => `📧 From: ${m.sender.emailAddress.name}\nSubject: ${m.subject}`).join('\n\n');
    }

    async searchOneDrive(filename) {
        const client = await this.getGraphClient();
        const res = await client.api('/me/drive/root/search(q=\'' + filename + '\')').get();
        if (res.value.length === 0) return "No files found in OneDrive.";
        return res.value.map(f => `📄 ${f.name}\n🔗 ${f.webUrl}`).join('\n\n');
    }

    async searchSharePoint(keyword) {
        const client = await this.getGraphClient();
        const res = await client.api('/sites').search(keyword).get();
        return res.value.slice(0, 3).map(s => `🏢 Site: ${s.displayName}\n🔗 ${s.webUrl}`).join('\n\n');
    }

    async getTeamsUpdates() {
        const client = await this.getGraphClient();
        const res = await client.api('/me/chats').expand('lastMessagePreview').get();
        return res.value.map(c => `💬 Chat: ${c.topic || 'Private'}\nLast: ${c.lastMessagePreview?.body?.content || 'No text'}`).join('\n\n');
    }

    async saveNote(text) {
        const client = await this.getGraphClient();
        const date = new Date().toLocaleDateString();
        const pageContent = `<html><head><title>${date}</title></head><body><p>${text}</p></body></html>`;
        await client.api('/me/onenote/pages').post(pageContent);
        return `Note saved to OneNote for ${date}.`;
    }

    async getTasks() {
        const client = await this.getGraphClient();
        const res = await client.api('/me/todo/lists').get();
        const defaultList = res.value[0];
        const tasks = await client.api(`/me/todo/lists/${defaultList.id}/tasks`).filter('status ne \'completed\'').get();
        return tasks.value.map(t => `✅ ${t.title}`).join('\n');
    }

    async triggerWorkflow(name) {
        // Power Automate flows can be triggered via HTTP request or specific Graph endpoints if configured.
        // This is a placeholder for the logic.
        return `Workflow '${name}' triggered (Simulated).`;
    }
}

module.exports = new MicrosoftSkill();
