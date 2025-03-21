// lib/services/contextManager.ts
import { projectStore } from '@/lib/stores/projectContext';
import { workbenchStore } from '@/lib/stores/workbench';
import { Message } from 'ai';
import { parse } from 'path';

// Estimated tokens per character for rough estimates
const TOKENS_PER_CHAR = 0.25;

interface ContextElement {
  type: 'file' | 'message' | 'documentation' | 'diff';
  content: string;
  path?: string;
  importance: number; // 0-100, higher = more important
  tokens: number;
  lastModified: Date;
}

export class ContextManager {
  private maxTokens: number;
  private minRequiredTokens: number;
  private reservedTokens: number;
  private elements: ContextElement[] = [];
  
  constructor(maxTokens = 16000, minRequiredTokens = 4000, reservedTokens = 2000) {
    this.maxTokens = maxTokens;
    this.minRequiredTokens = minRequiredTokens;
    this.reservedTokens = reservedTokens;
  }
  
  /**
   * Set the maximum token limit
   */
  setMaxTokens(tokens: number): void {
    this.maxTokens = tokens;
  }
  
  /**
   * Add project files to context
   */
  addProjectFiles(): void {
    const files = workbenchStore.files.get();
    
    for (const [path, content] of Object.entries(files)) {
      // Skip large binary files, node_modules, etc.
      if (this.shouldSkipFile(path)) continue;
      
      // Calculate importance based on file type and recency
      const importance = this.calculateFileImportance(path);
      
      this.elements.push({
        type: 'file',
        path,
        content,
        importance,
        tokens: Math.ceil(content.length * TOKENS_PER_CHAR),
        lastModified: new Date()
      });
    }
  }
  
  /**
   * Add conversation messages to context
   */
  addConversationMessages(messages: Message[], limit = 10): void {
    // Get the most recent messages, prioritize user messages
    const recentMessages = [...messages].slice(-limit);
    
    for (const message of recentMessages) {
      const isUserMessage = message.role === 'user';
      
      this.elements.push({
        type: 'message',
        content: message.content as string,
        importance: isUserMessage ? 90 : 70, // User messages are more important
        tokens: Math.ceil((message.content as string).length * TOKENS_PER_CHAR),
        lastModified: new Date()
      });
    }
  }
  
  /**
   * Add project documentation to context
   */
  addDocumentation(): void {
    const project = projectStore.get();
    const documentation = project.documentation;
    
    // Add most recent documentation first
    for (let i = documentation.length - 1; i >= 0; i--) {
      const doc = documentation[i];
      
      this.elements.push({
        type: 'documentation',
        content: doc,
        importance: 60 - (documentation.length - 1 - i) * 5, // More recent docs are more important
        tokens: Math.ceil(doc.length * TOKENS_PER_CHAR),
        lastModified: new Date()
      });
    }
  }
  
  /**
   * Add file modifications/diffs to context
   */
  addFileModifications(): void {
    const fileModifications = workbenchStore.getFileModifcations();
    
    if (!fileModifications) return;
    
    for (const [path, changes] of Object.entries(fileModifications)) {
      const content = changes.join('\n');
      
      this.elements.push({
        type: 'diff',
        path,
        content,
        importance: 85, // Diffs are very important for continuity
        tokens: Math.ceil(content.length * TOKENS_PER_CHAR),
        lastModified: new Date()
      });
    }
  }
  
  /**
   * Build the optimized context string
   */
  buildContext(): string {
    // Sort elements by importance
    this.elements.sort((a, b) => b.importance - a.importance);
    
    let usedTokens = 0;
    const availableTokens = this.maxTokens - this.reservedTokens;
    const contextParts: string[] = [];
    
    // First pass: Add all elements that fit
    for (const element of this.elements) {
      if (usedTokens + element.tokens <= availableTokens) {
        if (element.type === 'file') {
          contextParts.push(`FILE: ${element.path}\n\`\`\`\n${element.content}\n\`\`\``);
        } else if (element.type === 'message') {
          contextParts.push(`MESSAGE: ${element.content}`);
        } else if (element.type === 'documentation') {
          contextParts.push(`DOCUMENTATION: ${element.content}`);
        } else if (element.type === 'diff') {
          contextParts.push(`DIFF: ${element.path}\n\`\`\`\n${element.content}\n\`\`\``);
        }
        
        usedTokens += element.tokens;
      }
    }
    
    // If we're under minimum required tokens, we need to truncate some elements
    if (usedTokens < this.minRequiredTokens) {
      // Reset and try again with truncation
      usedTokens = 0;
      contextParts.length = 0;
      
      for (const element of this.elements) {
        let content = element.content;
        
        // If adding this full element would exceed our limit, truncate it
        if (usedTokens + element.tokens > availableTokens) {
          const remainingTokens = availableTokens - usedTokens;
          const charLimit = Math.floor(remainingTokens / TOKENS_PER_CHAR);
          
          if (charLimit > 100) { // Only include if we can add something meaningful
            content = content.substring(0, charLimit) + '\n[TRUNCATED]';
            
            if (element.type === 'file') {
              contextParts.push(`FILE: ${element.path} (truncated)\n\`\`\`\n${content}\n\`\`\``);
            } else if (element.type === 'message') {
              contextParts.push(`MESSAGE: ${content}`);
            } else if (element.type === 'documentation') {
              contextParts.push(`DOCUMENTATION: ${content}`);
            } else if (element.type === 'diff') {
              contextParts.push(`DIFF: ${element.path} (truncated)\n\`\`\`\n${content}\n\`\`\``);
            }
            
            usedTokens = availableTokens; // We've used all available tokens
            break;
          }
        } else {
          // Full element fits
          if (element.type === 'file') {
            contextParts.push(`FILE: ${element.path}\n\`\`\`\n${content}\n\`\`\``);
          } else if (element.type === 'message') {
            contextParts.push(`MESSAGE: ${content}`);
          } else if (element.type === 'documentation') {
            contextParts.push(`DOCUMENTATION: ${content}`);
          } else if (element.type === 'diff') {
            contextParts.push(`DIFF: ${element.path}\n\`\`\`\n${content}\n\`\`\``);
          }
          
          usedTokens += element.tokens;
        }
        
        if (usedTokens >= this.minRequiredTokens) {
          break;
        }
      }
    }
    
    return contextParts.join('\n\n');
  }
  
  /**
   * Determine if a file should be skipped (binary, too large, etc.)
   */
  private shouldSkipFile(path: string): boolean {
    const ext = parse(path).ext.toLowerCase();
    const skipExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', 
      '.mp3', '.mp4', '.mov', '.avi', '.pdf', '.zip',
      '.tar', '.gz', '.rar'
    ];
    
    // Skip binary files
    if (skipExtensions.includes(ext)) return true;
    
    // Skip node_modules and .git directories
    if (path.includes('node_modules/') || path.includes('.git/')) return true;
    
    return false;
  }
  
  /**
   * Calculate importance score for a file
   */
  private calculateFileImportance(path: string): number {
    const ext = parse(path).ext.toLowerCase();
    const fileName = parse(path).base.toLowerCase();
    
    // Higher importance for config files and entry points
    if (
      fileName === 'package.json' || 
      fileName === 'tsconfig.json' || 
      fileName === 'next.config.js' ||
      fileName === 'index.ts' ||
      fileName === 'index.tsx' ||
      fileName === 'index.js' ||
      fileName === 'main.ts' ||
      fileName === 'main.js'
    ) {
      return 85;
    }
    
    // Source code files are important
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      return 75;
    }
    
    // Styling files are moderately important
    if (['.css', '.scss', '.sass'].includes(ext)) {
      return 65;
    }
    
    // HTML and Markdown files
    if (['.html', '.md'].includes(ext)) {
      return 60;
    }
    
    // JSON files
    if (ext === '.json') {
      return 60;
    }
    
    // Other files
    return 50;
  }
  
  /**
   * Reset the context manager
   */
  reset(): void {
    this.elements = [];
  }
}

// Singleton instance
export const contextManager = new ContextManager();

/**
 * Helper function to build context for a conversation 
 */
export async function buildConversationContext(
  messages: Message[],
  modelMaxTokens: number = 16000
): Promise<string> {
  contextManager.reset();
  contextManager.setMaxTokens(modelMaxTokens);
  
  // Add various context elements
  contextManager.addFileModifications();
  contextManager.addProjectFiles();
  contextManager.addConversationMessages(messages);
  contextManager.addDocumentation();
  
  // Build optimized context
  return contextManager.buildContext();
}