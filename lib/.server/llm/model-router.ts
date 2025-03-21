// lib/.server/llm/model-router.ts

export type ModelPurpose = 'code' | 'documentation' | 'planning' | 'reasoning';

export interface ModelConfig {
  id: string;
  provider: 'anthropic' | 'groq' | 'openai';
  description: string;
  maxTokens: number;
  costPer1KTokens: number; // in USD
  strengths: ModelPurpose[];
  apiEnvKey: string;
}

// Available models configuration
export const models: Record<string, ModelConfig> = {
  'claude-3-opus': {
    id: 'claude-3-opus-20240229',
    provider: 'anthropic',
    description: 'Best for complex reasoning, documentation, and planning',
    maxTokens: 200000,
    costPer1KTokens: 0.015,
    strengths: ['documentation', 'planning', 'reasoning'],
    apiEnvKey: 'ANTHROPIC_API_KEY'
  },
  'claude-3-sonnet': {
    id: 'claude-3-sonnet-20240229',
    provider: 'anthropic',
    description: 'Balanced model for general use',
    maxTokens: 200000,
    costPer1KTokens: 0.003,
    strengths: ['documentation', 'planning'],
    apiEnvKey: 'ANTHROPIC_API_KEY'
  },
  'qwen-2.5-coder': {
    id: 'qwen-2.5-coder-32b',
    provider: 'groq',
    description: 'Specialized for code generation',
    maxTokens: 32768,
    costPer1KTokens: 0.0009,
    strengths: ['code'],
    apiEnvKey: 'GROQ_API_KEY'
  },
  'llama3-70b': {
    id: 'llama3-70b-8192',
    provider: 'groq',
    description: 'High quality, balanced performance',
    maxTokens: 8192,
    costPer1KTokens: 0.0009,
    strengths: ['code', 'documentation'],
    apiEnvKey: 'GROQ_API_KEY'
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo-2024-04-09',
    provider: 'openai',
    description: 'High reasoning capabilities',
    maxTokens: 128000,
    costPer1KTokens: 0.01,
    strengths: ['code', 'planning', 'reasoning'],
    apiEnvKey: 'OPENAI_API_KEY'
  }
};

/**
 * Analyzes the message content to determine what type of processing is needed
 */
export function analyzeMessagePurpose(
  message: string,
  projectContext: any // You can type this appropriately
): ModelPurpose {
  // Check for code-related keywords
  const codeKeywords = [
    'write code', 'function', 'class', 'implement',
    'algorithm', 'syntax', 'bug', 'error', 
    'compile', 'programming', 'runtime', 'library',
    'framework', 'API', 'endpoint'
  ];
  
  // Check for documentation-related keywords
  const docKeywords = [
    'explain', 'describe', 'document', 'summarize',
    'outline', 'overview', 'guide', 'tutorial',
    'introduction', 'concept', 'README', 'comment'
  ];
  
  // Check for planning-related keywords
  const planningKeywords = [
    'plan', 'strategy', 'architecture', 'design',
    'structure', 'organize', 'roadmap', 'milestone',
    'approach', 'solution', 'concept', 'high-level'
  ];
  
  // Count occurrences of each type of keyword
  const codeMentions = codeKeywords.filter(word => 
    message.toLowerCase().includes(word.toLowerCase())
  ).length;
  
  const docMentions = docKeywords.filter(word => 
    message.toLowerCase().includes(word.toLowerCase())
  ).length;
  
  const planningMentions = planningKeywords.filter(word => 
    message.toLowerCase().includes(word.toLowerCase())
  ).length;
  
  // Check if the message contains code blocks (likely code-related)
  const hasCodeBlocks = message.includes('```');
  
  // Consider project context - if last activity was coding, likely to continue coding
  const lastActivity = projectContext?.lastActivity || '';
  
  // Determine primary purpose based on weightings
  if (hasCodeBlocks || (codeMentions > docMentions && codeMentions > planningMentions) || 
      lastActivity === 'code') {
    return 'code';
  } else if (docMentions > codeMentions && docMentions > planningMentions) {
    return 'documentation';
  } else if (planningMentions > codeMentions && planningMentions > docMentions) {
    return 'planning';
  } else if (message.length > 500 || message.includes('why') || message.includes('how')) {
    // Complex queries often involve reasoning
    return 'reasoning';
  }
  
  // Default to code as the primary use case
  return 'code';
}

/**
 * Selects the most appropriate model based on the message purpose and available keys
 */
export function selectModel(
  purpose: ModelPurpose,
  env: Env | NodeJS.ProcessEnv,
  costConstraint?: number
): ModelConfig {
  // Filter models by purpose
  const candidateModels = Object.values(models).filter(model => 
    model.strengths.includes(purpose) && env[model.apiEnvKey]
  );
  
  if (candidateModels.length === 0) {
    throw new Error(`No model available for purpose: ${purpose}`);
  }
  
  // If there's a cost constraint, filter by cost
  if (costConstraint) {
    const affordableModels = candidateModels.filter(model => 
      model.costPer1KTokens <= costConstraint
    );
    
    if (affordableModels.length > 0) {
      // Return the most capable affordable model (assuming more expensive = more capable)
      return affordableModels.sort((a, b) => b.costPer1KTokens - a.costPer1KTokens)[0];
    }
  }
  
  // Specific model selection strategies based on purpose
  if (purpose === 'code') {
    // For code, prefer specialized coding models first
    const codingModels = candidateModels.filter(model => 
      model.id.includes('coder') || model.id.includes('gpt-4')
    );
    
    if (codingModels.length > 0) {
      return codingModels[0];
    }
  } else if (purpose === 'documentation') {
    // For documentation, prefer models with larger context windows
    return candidateModels.sort((a, b) => b.maxTokens - a.maxTokens)[0];
  } else if (purpose === 'planning' || purpose === 'reasoning') {
    // For planning and reasoning, prefer more powerful models
    const powerfulModels = candidateModels.filter(model => 
      model.provider === 'anthropic' || model.id.includes('gpt-4')
    );
    
    if (powerfulModels.length > 0) {
      return powerfulModels[0];
    }
  }
  
  // Default: return the model with the best balance of cost and capability
  return candidateModels.sort((a, b) => {
    // Sort by price (higher price typically means better capability)
    return b.costPer1KTokens - a.costPer1KTokens;
  })[0];
}

/**
 * Gets the appropriate API key based on the selected model
 */
export function getAPIKeyForModel(model: ModelConfig, env: Env | NodeJS.ProcessEnv): string {
  const apiKey = env[model.apiEnvKey];
  
  if (!apiKey) {
    throw new Error(`API key not found for provider: ${model.provider}`);
  }
  
  return apiKey;
}