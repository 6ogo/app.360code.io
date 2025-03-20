import { map } from 'nanostores';

export type FileMap = Record<string, string>;

// Create a store for files
export const filesStore = map<FileMap>({});

// Helper functions for file operations
export function addFile(path: string, content: string) {
  const currentFiles = filesStore.get();
  filesStore.set({
    ...currentFiles,
    [path]: content
  });
}

export function updateFile(path: string, content: string) {
  const currentFiles = filesStore.get();
  if (currentFiles[path] !== undefined) {
    filesStore.set({
      ...currentFiles,
      [path]: content
    });
  }
}

export function deleteFile(path: string) {
  const currentFiles = filesStore.get();
  const newFiles = { ...currentFiles };
  delete newFiles[path];
  filesStore.set(newFiles);
}

export function getFile(path: string): string | undefined {
  return filesStore.get()[path];
}

export function getAllFiles(): FileMap {
  return filesStore.get();
}

export function clearFiles() {
  filesStore.set({});
}