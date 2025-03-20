const express = require('express');
const GroqSDK = require('groq-sdk');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());
app.use(express.static('public'));

// Debug: Print environment variables
console.log('Environment variables:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? 'set' : 'NOT SET');
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'set' : 'NOT SET');
console.log('- GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'set' : 'NOT SET');

// Initialize Groq client
const groqClient = new GroqSDK({ apiKey: process.env.GROQ_API_KEY });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('Supabase initialized successfully');

        // Schedule daily cleanup
        setInterval(async () => {
            try {
                const { error } = await supabase.rpc('delete_old_conversations');
                if (error) throw error;
                console.log('Cleaned up conversations older than 3 days');
            } catch (err) {
                console.error('Failed to run cleanup:', err);
            }
        }, 24 * 60 * 60 * 1000); // Every 24 hours
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
    }
}

// Serve index.html with injected credentials
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'), {
        headers: {
            'SUPABASE_URL': process.env.SUPABASE_URL,
            'SUPABASE_ANON_KEY': process.env.SUPABASE_ANON_KEY
        }
    });
});

// Generate code endpoint
app.post('/generate', async (req, res) => {
    try {
        const { prompt, model, temperature } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        const completion = await groqClient.chat.completions.create({
            model: model || 'mixtral-8x7b-32768',
            messages: [
                { role: 'system', content: 'You are an expert developer...' },
                { role: 'user', content: prompt }
            ],
            temperature: parseFloat(temperature) || 0.7,
            max_tokens: 4000,
        });
        const generatedCode = completion.choices[0].message.content;
        res.json({ code: generatedCode });
    } catch (error) {
        console.error('Error in /generate:', error);
        res.status(500).json({ error: 'Failed to generate code' });
    }
});

// Save project to Supabase
app.post('/save-project', async (req, res) => {
    if (!supabase) {
        return res.status(503).json({ error: 'Database connection not available' });
    }
    const { title, prompt, code, schema, connection, env, userId } = req.body;
    if (!title || !code) {
        return res.status(400).json({ error: 'Title and code are required' });
    }
    try {
        const { data, error } = await supabase
            .from('projects')
            .insert([{ title, prompt, code, schema, connection, env, user_id: userId || 'anonymous', created_at: new Date().toISOString() }]);
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error saving project:', error);
        res.status(500).json({ error: 'Failed to save project' });
    }
});

// Get user's saved projects
app.get('/projects/:userId', async (req, res) => {
    if (!supabase) {
        return res.status(503).json({ error: 'Database connection not available' });
    }
    const { userId } = req.params;
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId);
        if (error) throw error;
        res.json({ projects: data });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Cleanup conversations (with basic auth)
app.post('/admin/cleanup-conversations', async (req, res) => {
    if (req.headers.authorization !== `Bearer ${process.env.ADMIN_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!supabase) {
        return res.status(503).json({ error: 'Database connection not available' });
    }
    try {
        const { error } = await supabase.rpc('delete_old_conversations');
        if (error) throw error;
        res.json({ success: true, message: 'Cleaned up old conversations' });
    } catch (error) {
        console.error('Error during cleanup:', error);
        res.status(500).json({ error: 'Failed to clean up conversations' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('API endpoints:');
    console.log('- POST /generate: Generate code');
    if (supabase) {
        console.log('- POST /save-project: Save project');
        console.log('- GET /projects/:userId: Get projects');
        console.log('- POST /admin/cleanup-conversations: Cleanup conversations');
    }
});