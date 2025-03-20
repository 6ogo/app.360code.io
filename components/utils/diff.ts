/**
 * Converts file modifications to HTML format for the LLM context
 */
export function fileModificationsToHTML(fileModifications: Record<string, string[]>): string {
    let html = '<fileModifications>\n';
    
    for (const [filePath, changes] of Object.entries(fileModifications)) {
      html += `  <diff path="${filePath}">\n`;
      html += changes.join('\n');
      html += '\n  </diff>\n';
    }
    
    html += '</fileModifications>';
    return html;
  }
  
  /**
   * Parses diffs from HTML format back to modifications object
   */
  export function parseModificationsFromHTML(html: string): Record<string, string[]> {
    const modifications: Record<string, string[]> = {};
    
    // Simple regex-based parsing - for production, use a proper HTML parser
    const diffRegex = /<diff path="([^"]+)">\s*([\s\S]*?)\s*<\/diff>/g;
    let match;
    
    while ((match = diffRegex.exec(html)) !== null) {
      const [_, path, content] = match;
      modifications[path] = content.trim().split('\n');
    }
    
    return modifications;
  }
  
  /**
   * Apply modifications to file content
   */
  export function applyModifications(fileContent: string, modifications: string[]): string {
    let result = fileContent;
    
    // This is a simplified implementation that would need to be expanded for a real diff implementation
    // Just a placeholder for now
    return modifications[modifications.length - 1] || fileContent;
  }