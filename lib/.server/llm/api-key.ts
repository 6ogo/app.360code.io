// lib/.server/llm/api-key.ts
/**
 * Gets the Groq API key from environment variables
 */
export function getAPIKey(env: Env | NodeJS.ProcessEnv): string {
    // Check if we have the key in the provided environment
    if ('GROQ_API_KEY' in env && typeof env.GROQ_API_KEY === 'string') {
      return env.GROQ_API_KEY;
    }
    
    // Fall back to process.env
    if (typeof process !== 'undefined' && process.env && process.env.GROQ_API_KEY) {
      return process.env.GROQ_API_KEY;
    }
    
    throw new Error('GROQ_API_KEY is not defined in environment variables');
  }