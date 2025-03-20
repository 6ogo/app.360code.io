// Update to use GROQ API key instead of Anthropic
import { env } from 'node:process';

export function getAPIKey(cloudflareEnv: Env) {
  /**
   * The `cloudflareEnv` is only used when deployed or when previewing locally.
   * In development the environment variables are available through `env`.
   */
  return env.GROQ_API_KEY || cloudflareEnv.GROQ_API_KEY;
}
