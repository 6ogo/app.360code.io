import { createGroq } from '@ai-sdk/groq';

export function getGroqModel(apiKey: string) {
  const groq = createGroq({
    apiKey,
  });

  // You can choose between different models based on your needs:
  // - llama2-70b-4096 (basic)
  // - mixtral-8x7b-32768 (more context)
  // - gemma-7b-it
  // - llama3-8b-8192
  // - llama3-70b-8192 (high quality)
  return groq('qwen-2.5-coder-32b');
}
