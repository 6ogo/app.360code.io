// lib/.server/llm/model.ts
/**
 * Gets the Groq model name to use for API calls
 */
export function getGroqModel(apiKey: string): string {
    // You can choose between different models based on your needs:
    // - llama2-70b-4096 (basic)
    // - mixtral-8x7b-32768 (more context)
    // - gemma-7b-it
    // - llama3-8b-8192
    // - llama3-70b-8192 (high quality)
    // - qwen-2.5-coder-32b
    
    // Validate API key format
    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
      throw new Error('Invalid Groq API key format');
    }
    
    return 'qwen-2.5-coder-32b';
  }