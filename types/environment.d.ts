// Define environment variables and API environment
declare global {
    interface Env {
      GROQ_API_KEY: string;
      [key: string]: string;
    }
    
    namespace NodeJS {
      interface ProcessEnv {
        GROQ_API_KEY: string;
        NEXT_PUBLIC_SUPABASE_URL: string;
        NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
        [key: string]: string | undefined;
      }
    }
  }
  
  // Add missing Action and Artifact types
  declare module '@/types/actions' {
    export interface BoltActionData {
      type: 'file' | 'shell';
      filePath?: string;
      content: string;
    }
    
    export interface BoltAction extends BoltActionData {}
  }
  
  declare module '@/types/artifact' {
    export interface BoltArtifactData {
      id: string;
      title: string;
    }
  }
  
  // For the workbench store
  declare module '@/lib/stores/workbench' {
    import { map } from 'nanostores';
    
    export type FileMap = Record<string, string>;
    
    export interface WorkbenchState {
      files: Map<string, string>;
      fileModifications: Record<string, string[]>;
    }
    
    export const workbenchStore: {
      files: ReturnType<typeof map<FileMap>>;
      getFileModifcations: () => Record<string, string[]> | null;
      resetAllFileModifications: () => void;
    };
  }
  
  // To make TypeScript treat this as a module
  export {};