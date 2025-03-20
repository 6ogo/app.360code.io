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
app.use(express.static('public', {
    setHeaders: (res, path) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      }
    }
  }));
  
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

// Templating function to inject environment variables
function injectEnvVariables(html) {
    return html
        .replace('<%= process.env.SUPABASE_URL %>', process.env.SUPABASE_URL || '')
        .replace('<%= process.env.SUPABASE_ANON_KEY %>', process.env.SUPABASE_ANON_KEY || '');
}

// Auth routes
app.get('/auth', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'auth', 'index.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading auth page:', err);
            return res.status(500).send('Error loading authentication page');
        }
        const processedHtml = injectEnvVariables(data);
        res.send(processedHtml);
    });
});

app.get('/auth/callback', (req, res) => {
    // Redirect to main app after OAuth callback
    res.redirect('/');
});

// Serve index.html with injected credentials
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading index.html:', err);
            return res.status(500).send('Error loading application');
        }
        const processedHtml = injectEnvVariables(data);
        res.send(processedHtml);
    });
});

// script to help diagnose server-side issues
app.get('/debug', (req, res) => {
    const debug = {
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            SUPABASE_URL_SET: !!process.env.SUPABASE_URL,
            SUPABASE_ANON_KEY_SET: !!process.env.SUPABASE_ANON_KEY,
            GROQ_API_KEY_SET: !!process.env.GROQ_API_KEY
        },
        directories: {
            current: __dirname,
            public: path.join(__dirname, 'public'),
            publicExists: fs.existsSync(path.join(__dirname, 'public'))
        },
        files: {
            publicDir: fs.existsSync(path.join(__dirname, 'public')) ? 
                fs.readdirSync(path.join(__dirname, 'public')) : [],
            stylesDir: fs.existsSync(path.join(__dirname, 'public', 'styles')) ? 
                fs.readdirSync(path.join(__dirname, 'public', 'styles')) : [],
            jsDir: fs.existsSync(path.join(__dirname, 'public', 'js')) ? 
                fs.readdirSync(path.join(__dirname, 'public', 'js')) : []
        }
    };
    
    res.json(debug);
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
                { role: 'system', content: 'You are an expert developer. Generate clean, well-commented code based on the request. Include Supabase integration when appropriate. Wrap code blocks in triple backticks with the language name to help the client parse them correctly.' },
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
    console.log('Routes:');
    console.log('- / : Main application');
    console.log('- /auth : Authentication page');
    console.log('- /auth/callback : OAuth callback handler');
});