// File: /api/generate.js
const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export default async function handler(req, res) {
  // Set CORS headers if needed
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    
    res.status(200).json({ code: generatedCode });
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ error: error.message || 'Failed to generate code' });
  }
}