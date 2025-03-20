import { map } from 'nanostores';
import type { Message } from 'ai';

export interface ProjectState {
  id: string;
  title: string;
  description: string;
  status: 'idle' | 'generating' | 'paused' | 'complete';
  currentStep: number;
  totalSteps: number;
  documentation: string[];
  fileChanges: Record<string, string[]>;
  lastContext: string;
  messages: Message[];
}

export const initialProjectState: ProjectState = {
  id: '',
  title: 'New Project',
  description: '',
  status: 'idle',
  currentStep: 0,
  totalSteps: 0,
  documentation: [],
  fileChanges: {},
  lastContext: '',
  messages: []
};

export const projectStore = map<ProjectState>(initialProjectState);
