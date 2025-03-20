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

// Debug environment variables
console.log('===================================== ENVIRONMENT VARIABLES DEBUG =====================================');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET'); 
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('=====================================================================================================');

// Critical fix: Proper static file serving with absolute paths
// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

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
    } catch (error) {
        console.error('Failed to initialize Supabase:', error);
    }
}

// Improved templating function to inject environment variables
function injectEnvVariables(html) {
    try {
        const safeSupabaseUrl = process.env.SUPABASE_URL || '';
        const safeSupabaseKey = process.env.SUPABASE_ANON_KEY || '';
        
        // Create a script tag with environment variables
        const injectionScript = `
<script>
// ENVIRONMENT VARIABLES SET BY SERVER
window.SUPABASE_URL = "${safeSupabaseUrl}";
window.SUPABASE_ANON_KEY = "${safeSupabaseKey}";
console.log("Server-injected environment variables loaded");
</script>`;

        // Insert the script right after the opening head tag
        let processedHtml = html.replace('<head>', '<head>' + injectionScript);
        
        return processedHtml;
    } catch (error) {
        console.error('Error injecting environment variables:', error);
        return html;
    }
}

// Auth route
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

// Auth callback route
app.get('/auth/callback', (req, res) => {
    res.redirect('/');
});

// Home route
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

// API endpoint to generate code
app.post('/generate', async (req, res) => {
    try {
        const { prompt, model, temperature } = req.body;
        
        // Log the request
        console.log('Generate request received:');
        console.log('- Prompt:', prompt ? prompt.substring(0, 50) + '...' : 'MISSING');
        console.log('- Model:', model || 'default');
        console.log('- Temperature:', temperature || 'default');
        
        // Validate request
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        
        // Check if GROQ API key is configured
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ 
                error: 'GROQ_API_KEY is not configured. Please check your environment variables.'
            });
        }
        
        console.log(`Generating code with model: ${model || 'mixtral-8x7b-32768'}, temperature: ${temperature || 0.7}`);
        
        const completion = await groqClient.chat.completions.create({
            model: model || 'mixtral-8x7b-32768',
            messages: [
                { 
                    role: 'system', 
                    content: 'You are an expert developer. Generate clean, well-commented code based on the request. Include Supabase integration when appropriate. Wrap code blocks in triple backticks with the language name to help the client parse them correctly.' 
                },
                { role: 'user', content: prompt }
            ],
            temperature: parseFloat(temperature) || 0.7,
            max_tokens: 4000,
        });
        
        const generatedCode = completion.choices[0].message.content;
        console.log('Code generated successfully');
        
        res.status(200).json({ code: generatedCode });
    } catch (error) {
        console.error('Error generating code:', error);
        res.status(500).json({ error: error.message || 'Failed to generate code' });
    }
});

// Catch-all for auth routes
app.get('/auth/*', (req, res) => {
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

// Debug route to check environment variables
app.get('/debug-env', (req, res) => {
    const envInfo = {
        supabaseUrl: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 10)}...` : 'Not set',
        supabaseKeySet: !!process.env.SUPABASE_ANON_KEY,
        groqKeySet: !!process.env.GROQ_API_KEY,
        nodeEnv: process.env.NODE_ENV
    };
    
    res.json(envInfo);
});

// Debug route to check file paths
app.get('/debug-paths', (req, res) => {
    const paths = {
        publicDir: path.join(__dirname, 'public'),
        authDir: path.join(__dirname, 'public', 'auth'),
        stylesDir: path.join(__dirname, 'public', 'styles'),
        jsDir: path.join(__dirname, 'public', 'js')
    };
    
    const exists = {
        publicDir: fs.existsSync(paths.publicDir),
        authDir: fs.existsSync(paths.authDir),
        stylesDir: fs.existsSync(paths.stylesDir),
        jsDir: fs.existsSync(paths.jsDir),
        authIndexHtml: fs.existsSync(path.join(paths.authDir, 'index.html')),
        styleCss: fs.existsSync(path.join(paths.stylesDir, 'style.css')),
        authJs: fs.existsSync(path.join(paths.jsDir, 'auth.js'))
    };
    
    res.json({ paths, exists });
});