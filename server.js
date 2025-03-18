const express = require('express');
const Groq = require('groq-sdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/generate', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    try {
        const completion = await groq.chat.completions.create({
            model: 'qwen-2.5-coder-32b', // A versatile Groq model
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
        });
        const generatedCode = completion.choices[0].message.content;
        res.json({ code: generatedCode });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate code' });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});