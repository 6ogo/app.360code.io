const express = require('express');
const Groq = require('groq-sdk');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());
const Groq = createClient({ apiKey: process.env.GROQ_API_KEY });

// Debug: Print environment variables to verify they're loading
console.log('Environment variables:');
console.log('- SUPABASE_URL is ' + (process.env.SUPABASE_URL ? 'set' : 'NOT SET'));
console.log('- SUPABASE_ANON_KEY is ' + (process.env.SUPABASE_ANON_KEY ? 'set' : 'NOT SET'));
console.log('- GROQ_API_KEY is ' + (process.env.GROQ_API_KEY ? 'set' : 'NOT SET'));

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize Supabase client if credentials are available
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('Supabase initialized successfully');

        // Schedule the cleanup job (runs once per day at midnight)
        if (supabase) {
            setInterval(async () => {
                try {
                    const { error } = await supabase.rpc('delete_old_conversations');
                    if (error) {
                        console.error('Error cleaning up old conversations:', error);
                    } else {
                        console.log('Successfully cleaned up conversations older than 3 days');
                    }
                } catch (err) {
                    console.error('Failed to run conversation cleanup:', err);
                }
            }, 24 * 60 * 60 * 1000); // Run every 24 hours
        }
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
    }
}

// Function to inject Supabase credentials into HTML
function injectCredentialsIntoHTML(htmlContent) {
    let modifiedHtml = htmlContent;

    if (process.env.SUPABASE_URL && process.env.SUPABASE_URL.trim() !== '') {
        console.log(`Injecting SUPABASE_URL: ${process.env.SUPABASE_URL.substring(0, 10)}...`);
        modifiedHtml = modifiedHtml.replace(/'__SUPABASE_URL__'/g, `'${process.env.SUPABASE_URL}'`);
    } else {
        console.warn('SUPABASE_URL is not available for injection');
    }

    if (process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY.trim() !== '') {
        console.log(`Injecting SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY.substring(0, 5)}...`);
        modifiedHtml = modifiedHtml.replace(/'__SUPABASE_ANON_KEY__'/g, `'${process.env.SUPABASE_ANON_KEY}'`);
    } else {
        console.warn('SUPABASE_ANON_KEY is not available for injection');
    }

    return modifiedHtml;
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html with injected credentials for ALL routes (SPA support)
app.get('*', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');
    let html = fs.readFileSync(filePath, 'utf8');
    if (process.env.SUPABASE_URL) {
        console.log(`Injecting SUPABASE_URL: ${process.env.SUPABASE_URL.substring(0, 10)}...`);
        html = html.replace(/'__SUPABASE_URL__'/g, `'${process.env.SUPABASE_URL}'`);
    } else {
        console.warn('SUPABASE_URL not set');
    }
    if (process.env.SUPABASE_ANON_KEY) {
        html = html.replace(/'__SUPABASE_ANON_KEY__'/g, `'${process.env.SUPABASE_ANON_KEY}'`);
    } else {
        console.warn('SUPABASE_ANON_KEY not set');
    }
    console.log('Injected HTML snippet:', html.substring(0, 200));
    res.send(html);
});

// Generate code endpoint
app.post('/generate', async (req, res) => {
    try {
        const { prompt, model, temperature } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        console.log('Generating with model:', model, 'temperature:', temperature);
        const completion = await groq.chat.completions.create({
            model: model || 'mixtral-8x7b-32768', // Default model if unspecified
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
    const { title, prompt, code, schema, connection, env, userId } = req.body;

    if (!title || !code) {
        return res.status(400).json({ error: 'Title and code are required' });
    }

    // Check if Supabase is available
    if (!supabase) {
        return res.status(503).json({ error: 'Database connection not available' });
    }

    try {
        const { data, error } = await supabase
            .from('projects')
            .insert([
                {
                    title,
                    prompt,
                    code,
                    schema,
                    connection,
                    env,
                    user_id: userId || 'anonymous',
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error saving project:', error);
        res.status(500).json({ error: 'Failed to save project' });
    }
});

// Get user's saved projects
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Run database cleanup directly
app.post('/admin/cleanup-conversations', async (req, res) => {
    // Add some basic auth or other security here for production
    if (!supabase) {
        return res.status(503).json({ error: 'Database connection not available' });
    }

    try {
        const { error } = await supabase.rpc('delete_old_conversations');
        if (error) {
            throw error;
        }
        res.json({ success: true, message: 'Successfully cleaned up old conversations' });
    } catch (error) {
        console.error('Error during manual cleanup:', error);
        res.status(500).json({ error: 'Failed to clean up conversations' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API endpoints available at:`);
    console.log(`- POST /generate: Generate code with Groq AI`);
    if (supabase) {
        console.log(`- POST /save-project: Save a project to Supabase`);
        console.log(`- GET /projects/:userId: Get a user's saved projects`);
    }
});

module.exports = app;