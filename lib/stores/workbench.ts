import { map } from 'nanostores';

// Define types locally to avoid conflicts with environment.d.ts
export interface FileMapType {
  [path: string]: string;
}

interface WorkbenchState {
  fileModifications: Record<string, string[]>;
}

const files = map<FileMapType>({});
const state = map<WorkbenchState>({
  fileModifications: {}
});

export const workbenchStore = {
  files,
  
  getFileModifcations() {
    const { fileModifications } = state.get();
    return Object.keys(fileModifications).length > 0 ? fileModifications : null;
  },
  
  resetAllFileModifications() {
    state.setKey('fileModifications', {});
  },
  
  addFile(path: string, content: string) {
    files.setKey(path, content);
    
    // Add to file modifications
    const { fileModifications } = state.get();
    fileModifications[path] = [content];
    state.setKey('fileModifications', { ...fileModifications });
  },
  
  updateFile(path: string, content: string) {
    files.setKey(path, content);
    
    // Add to file modifications
    const { fileModifications } = state.get();
    if (!fileModifications[path]) {
      fileModifications[path] = [];
    }
    fileModifications[path].push(content);
    state.setKey('fileModifications', { ...fileModifications });
  },
  
  deleteFile(path: string) {
    const currentFiles = files.get();
    const updatedFiles = { ...currentFiles };
    delete updatedFiles[path];
    files.set(updatedFiles);
    
    // Add to file modifications
    const { fileModifications } = state.get();
    fileModifications[path] = ['File deleted'];
    state.setKey('fileModifications', { ...fileModifications });
  }
};