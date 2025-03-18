const express = require('express');
const Groq = require('groq-sdk');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Inject Supabase credentials into the HTML response
app.get('/', (req, res) => {
    let indexHtml = require('fs').readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
    indexHtml = indexHtml.replace('__SUPABASE_URL__', supabaseUrl || '');
    indexHtml = indexHtml.replace('__SUPABASE_KEY__', supabaseKey || '');
    res.send(indexHtml);
});

app.post('/generate', async (req, res) => {
    const { prompt, model = 'qwen-2.5-coder-32b', temperature = 0.7 } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    try {
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
        res.json({ code: generatedCode });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate code' });
    }
});

// New endpoint for saving projects to Supabase
app.post('/save-project', async (req, res) => {
    const { title, prompt, code, schema, connection, env, userId } = req.body;
    
    if (!title || !code) {
        return res.status(400).json({ error: 'Title and code are required' });
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
        console.error(error);
        res.status(500).json({ error: 'Failed to save project' });
    }
});

// Get user's saved projects
app.get('/projects/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
            
        if (error) throw error;
        
        res.json({ projects: data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});