// THIS FILE REPLACES YOUR CURRENT server.js
// This version is specifically optimized for Vercel deployment

const express = require('express');
const GroqSDK = require('groq-sdk');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Debug environment variables
console.log('===================================== ENVIRONMENT VARIABLES DEBUG =====================================');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET'); 
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('=====================================================================================================');

// Initialize Express
const app = express();
app.use(express.json());

// Set up static file serving - IMPORTANT for Vercel
// Define explicit paths for each static file type
app.use('/styles', express.static(path.join(__dirname, 'public', 'styles')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/api', express.static(path.join(__dirname, 'public', 'api')));
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));

// Validate environment variables
const validateEnvVars = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GROQ_API_KEY'];
  const missing = required.filter(key => !process.env[key] || process.env[key].trim() === '');
  
  if (missing.length > 0) {
    console.error(`⚠️ Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please add these to your .env file or environment configuration');
  } else {
    console.log('✅ All required environment variables are present');
  }
};

validateEnvVars();

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
        
        // Create a direct inline script for reliable injection
        const injectionScript = `
<script>
// ENVIRONMENT VARIABLES SET BY SERVER - DO NOT MODIFY
window.SUPABASE_URL = "${safeSupabaseUrl}";
window.SUPABASE_ANON_KEY = "${safeSupabaseKey}";
console.log("Server-injected environment variables:");
console.log("- SUPABASE_URL:", window.SUPABASE_URL ? "SET ✅" : "NOT SET ❌");
console.log("- SUPABASE_ANON_KEY:", window.SUPABASE_ANON_KEY ? "SET ✅" : "NOT SET ❌");
</script>`;

        // Also create a fallback mechanism that will run after page load
        const fallbackScript = `
<script>
// Fallback mechanism for environment variables
document.addEventListener('DOMContentLoaded', function() {
  if (!window.supabaseClient && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    try {
      console.log("Creating Supabase client via fallback mechanism");
      window.supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
      console.log("Supabase client initialized successfully via fallback");
    } catch (err) {
      console.error("Failed to initialize Supabase via fallback:", err);
    }
  }
});
</script>`;

        // Inject scripts at specific locations for maximum reliability
        let processedHtml = html;
        
        // 1. Inject main script right after <head> tag
        processedHtml = processedHtml.replace('<head>', '<head>' + injectionScript);
        
        // 2. Inject fallback script before </body> tag
        processedHtml = processedHtml.replace('</body>', fallbackScript + '</body>');
        
        // 3. Replace any template variables (for backward compatibility)
        processedHtml = processedHtml
            .replace(/<%=\s*process\.env\.SUPABASE_URL\s*%>/g, safeSupabaseUrl)
            .replace(/<%=\s*process\.env\.SUPABASE_ANON_KEY\s*%>/g, safeSupabaseKey);
        
        return processedHtml;
    } catch (error) {
        console.error('Error injecting environment variables:', error);
        return html; // Return original HTML if there's an error
    }
}

// File path verification endpoint (helpful for debugging)
app.get('/file-paths', (req, res) => {
  const basePath = __dirname;
  const publicPath = path.join(__dirname, 'public');
  const stylesPath = path.join(__dirname, 'public', 'styles');
  const jsPath = path.join(__dirname, 'public', 'js');
  
  const exists = {
    base: fs.existsSync(basePath),
    public: fs.existsSync(publicPath),
    styles: fs.existsSync(stylesPath),
    js: fs.existsSync(jsPath),
    'styles/style.css': fs.existsSync(path.join(stylesPath, 'style.css')),
    'js/auth.js': fs.existsSync(path.join(jsPath, 'auth.js')),
    'logo.svg': fs.existsSync(path.join(publicPath, 'logo.svg'))
  };
  
  res.json({
    paths: {
      base: basePath,
      public: publicPath,
      styles: stylesPath,
      js: jsPath
    },
    exists,
    env: {
      NODE_ENV: process.env.NODE_ENV
    }
  });
});

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

// Environment variables verification endpoint (for debugging only)
app.get('/env-verify', (req, res) => {
    const envStatus = {
        server: {
            SUPABASE_URL: process.env.SUPABASE_URL ? 
                `Set (length: ${process.env.SUPABASE_URL.length}, starts with: ${process.env.SUPABASE_URL.substring(0, 5)}...)` : 
                'NOT SET',
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 
                `Set (length: ${process.env.SUPABASE_ANON_KEY.length})` : 
                'NOT SET',
            GROQ_API_KEY: process.env.GROQ_API_KEY ? 
                `Set (length: ${process.env.GROQ_API_KEY.length})` : 
                'NOT SET',
            NODE_ENV: process.env.NODE_ENV || 'Not specified'
        },
        request: {
            host: req.headers.host,
            userAgent: req.headers['user-agent']
        }
    };
    
    res.json(envStatus);
});

// script to help diagnose server-side issues
app.get('/debug', (req, res) => {
    const debug = {
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            SUPABASE_URL_SET: !!process.env.SUPABASE_URL,
            SUPABASE_URL_LENGTH: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.length : 0,
            SUPABASE_ANON_KEY_SET: !!process.env.SUPABASE_ANON_KEY,
            SUPABASE_ANON_KEY_LENGTH: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : 0,
            GROQ_API_KEY_SET: !!process.env.GROQ_API_KEY,
            GROQ_API_KEY_LENGTH: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0
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
        
        // Log the request
        console.log('Generate request received:');
        console.log('- Prompt:', prompt ? prompt.substring(0, 50) + '...' : 'MISSING');
        console.log('- Model:', model || 'default');
        console.log('- Temperature:', temperature || 'default');
        
        // Validate request
        if (!prompt) {
            console.error('Error: Prompt is required');
            return res.status(400).json({ error: 'Prompt is required' });
        }
        
        // Check if GROQ API key is configured
        if (!process.env.GROQ_API_KEY) {
            console.error('Error: GROQ_API_KEY is not configured');
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

// Catch-all handler for auth pages with proper HTML processing
app.get('/auth/*', (req, res) => {
    // This ensures all auth/* routes are handled by the server
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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Legacy server listening...`);
});