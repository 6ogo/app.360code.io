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
console.log('=====================================');
console.log('ENVIRONMENT VARIABLES DEBUG');
console.log('=====================================');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('=====================================');

// Validate environment variables
const validateEnvVars = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GROQ_API_KEY'];
  const missing = required.filter(key => !process.env[key] || process.env[key].trim() === '');
  
  if (missing.length > 0) {
    console.error(`⚠️ Missing required environment variables: ${missing.join(', ')}`);
    console.error('Please add these to your .env file or environment configuration');
    // We'll continue execution but log the warning
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
    try {
        // Escape any special characters to prevent JS errors
        const safeSupabaseUrl = process.env.SUPABASE_URL ? 
            process.env.SUPABASE_URL.replace(/"/g, '\\"') : '';
        const safeSupabaseKey = process.env.SUPABASE_ANON_KEY ? 
            process.env.SUPABASE_ANON_KEY.replace(/"/g, '\\"') : '';
        
        console.log(`Injecting environment variables:`);
        console.log(`- SUPABASE_URL: ${safeSupabaseUrl ? 'present (length: ' + safeSupabaseUrl.length + ')' : 'missing'}`);
        console.log(`- SUPABASE_ANON_KEY: ${safeSupabaseKey ? 'present (length: ' + safeSupabaseKey.length + ')' : 'missing'}`);
        
        // Create a script block to inject as early as possible
        const injectionScript = `
        <script>
            window.SUPABASE_URL = "${safeSupabaseUrl}";
            window.SUPABASE_ANON_KEY = "${safeSupabaseKey}";
            console.log("Environment variables injected by server:");
            console.log("SUPABASE_URL:", window.SUPABASE_URL ? "✅ SET" : "❌ NOT SET");
            console.log("SUPABASE_ANON_KEY:", window.SUPABASE_ANON_KEY ? "✅ SET" : "❌ NOT SET");
        </script>
        `;
        
        // Try to add the script right after the opening head tag
        let processedHtml = html.replace('<head>', '<head>' + injectionScript);
        
        // Also replace any template variables (for backward compatibility)
        processedHtml = processedHtml
            .replace(/<%=\s*process\.env\.SUPABASE_URL\s*%>/g, safeSupabaseUrl)
            .replace(/<%=\s*process\.env\.SUPABASE_ANON_KEY\s*%>/g, safeSupabaseKey);
        
        return processedHtml;
    } catch (error) {
        console.error('Error injecting environment variables:', error);
        return html; // Return original HTML if there's an error
    }
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
        console.log(`Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);
        
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

// Environment variables verification endpoint (for debugging only)
app.get('/env-verify', (req, res) => {
    // This endpoint should be disabled in production
    // Only enable it temporarily for debugging
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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('API endpoints:');
    console.log('- POST /generate: Generate code');
    if (supabase) {
        console.log('- POST /save-project: Save project');
        console.log('- GET /projects/:userId: Get projects');
    }
    console.log('Routes:');
    console.log('- / : Main application');
    console.log('- /auth : Authentication page');
    console.log('- /auth/callback : OAuth callback handler');
});