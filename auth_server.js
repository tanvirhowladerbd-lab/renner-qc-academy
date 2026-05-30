require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const msSkill = require('./skills/microsoft_skill');

const app = express();
const port = 3000;

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    if (code) {
        try {
            await msSkill.getTokenFromCode(code);
            res.send('<h1>Authentication Successful!</h1><p>You can now close this window and return to your Telegram bot.</p>');
            console.log('✅ Microsoft OAuth Token Acquired Successfully.');
        } catch (err) {
            console.error('❌ OAuth Error:', err);
            res.status(500).send('Authentication Failed.');
        }
    } else {
        res.status(400).send('No code provided.');
    }
});

app.listen(port, () => {
    console.log(`OAuth Callback Server listening at http://localhost:${port}`);
});
