// lib/services/documentationGenerator.ts
import { projectStore } from '@/lib/stores/projectContext';
import { FileMap } from '@/lib/stores/files';

export const generateDocumentation = (
  fileMap: FileMap,
  description: string
): string => {
  const timestamp = new Date().toISOString();
  const filesSummary = Object.keys(fileMap).length > 0 
    ? `Modified/created files: ${Object.keys(fileMap).join(', ')}`
    : 'No files modified yet';
  
  const documentation = `
## Development Progress - ${timestamp}

### Description
${description}

### Files
${filesSummary}

### Current Status
${projectStore.get().status}
`;

  // Update project store with new documentation
  const project = projectStore.get();
  projectStore.set({
    ...project,
    documentation: [...project.documentation, documentation]
  });

  return documentation;
};