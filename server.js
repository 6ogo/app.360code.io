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
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize Supabase client if credentials are available
let supabase = null;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

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

// Inject Supabase credentials into the HTML response
app.get('/', (req, res) => {
    try {
        let indexHtml = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
        indexHtml = indexHtml.replace('__SUPABASE_URL__', supabaseUrl || '');
        indexHtml = indexHtml.replace('__SUPABASE_KEY__', supabaseKey || '');
        res.send(indexHtml);
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Error loading application');
    }
});

// Generate code endpoint
app.post('/generate', async (req, res) => {
    const { prompt, model = 'qwen-2.5-coder-32b', temperature = 0.7 } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    
    try {
        console.log(`Generating code with model: ${model}, temperature: ${temperature}`);
        
        const completion = await groq.chat.completions.create({
            model: model,
            messages: [
                { 
                    role: 'system', 
                    content: 'You are an expert developer. Generate clean, well-commented code based on the request. Include Supabase integration when appropriate. Wrap code blocks in triple backticks with the language name to help the client parse them correctly.' 
                },
                { role: 'user', content: prompt }
            ],
            temperature: parseFloat(temperature),
            max_tokens: 4000,
        });
        
        const generatedCode = completion.choices[0].message.content;
        console.log('Code generated successfully');
        
        res.json({ code: generatedCode });
    } catch (error) {
        console.error('Error generating code:', error);
        res.status(500).json({ error: error.message || 'Failed to generate code' });
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
app.get('/projects/:userId', async (req, res) => {
    const { userId } = req.params;
    
    // Check if Supabase is available
    if (!supabase) {
        return res.status(503).json({ error: 'Database connection not available' });
    }
    
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        res.json({ projects: data });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
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

// Serve static files for any route not handled (for SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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