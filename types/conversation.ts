export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  code: string | null;
  schema: string | null;
  env: string | null;
  connection: string | null;
  model: string;
  temperature: number;
  updated_at?: string;
  user_id?: string;
}

export interface CodeBlock {
  language: string;
  code: string;
}

// Helper function to generate a unique ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Helper function to extract code blocks from content
export const extractCodeBlocks = (content: string): CodeBlock[] => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const codeBlocks: CodeBlock[] = [];
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeBlocks.push({
      language: match[1] || 'plaintext',
      code: match[2].trim()
    });
  }

  return codeBlocks;
};

// Default schema for Supabase setup when none is provided
export const generateDefaultSchema = (): string => {
  return `-- Create a table for users
  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Create a table for application data
  CREATE TABLE app_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Enable Row Level Security
  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
  
  -- Create policies for secure access
  CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);
  
  CREATE POLICY "Users can insert their own data" ON app_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);
  
  CREATE POLICY "Users can update their own data" ON app_data
    FOR UPDATE USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can view their own data" ON app_data
    FOR SELECT USING (auth.uid() = user_id);`;
};

// Default environment variables for Supabase
export const generateDefaultEnv = (): string => {
  return `NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`;
};

// Default connection code for Supabase
export const generateDefaultConnection = (): string => {
  return `import { createClient } from '@supabase/supabase-js'
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabase = createClient(supabaseUrl, supabaseKey)`;
};