export const summarizeContext = async (
    documentation: string,
    fileChanges: string,
    lastContext: string
  ): Promise<string> => {
    // If full context is small enough, just return it
    const fullContext = `${documentation}\n\n${fileChanges}\n\n${lastContext}`;
    
    if (fullContext.length < 3000) {
      return fullContext;
    }
    
    // Otherwise, create a more concise summary
    return `Documentation summary:
  ${documentation.substring(0, 1000)}... (truncated)
  
  Recent file changes:
  ${fileChanges.substring(0, 1000)}... (truncated)
  
  Project context:
  ${lastContext.substring(0, 1000)}... (truncated)`;
  };
  