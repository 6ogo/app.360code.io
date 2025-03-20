import { projectStore } from '~/lib/stores/projectContext';
import type { Message } from 'ai';
import { summarizeContext } from './contextSummarizer';

const MAX_TOKENS = 8000; // Adjust based on model constraints
const MAX_MESSAGES_TO_INCLUDE = 10;

export const continueProject = async (messages: Message[]): Promise<Message[]> => {
  const project = projectStore.get();
  
  // Get current project documentation
  const documentation = project.documentation.join('\n\n');
  
  // Create a summary of file changes
  const fileChangesSummary = Object.entries(project.fileChanges)
    .map(([file, changes]) => `${file}:\n${changes.join('\n')}`)
    .join('\n\n');
  
  // Create a summary of the context
  const contextSummary = await summarizeContext(
    documentation, 
    fileChangesSummary, 
    project.lastContext
  );
  
  // Create continuation message
  const continuationMessage: Message = {
    role: 'user',
    content: `Let's continue the development of the project.

Here's what has been done so far:
${contextSummary}

Current status is: ${project.status}
Current step: ${project.currentStep}
Last developed features: ${project.documentation[project.documentation.length - 1] || 'No documentation yet'}

Please continue where you left off and complete the next steps of the project.`
  };
  
  // Combine most recent messages with continuation message
  const recentMessages = messages.slice(-MAX_MESSAGES_TO_INCLUDE);
  
  return [...recentMessages, continuationMessage];
};
