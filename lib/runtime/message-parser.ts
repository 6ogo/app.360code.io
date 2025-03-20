import { createScopedLogger } from '~/utils/logger';
import type { BoltAction, BoltActionData } from '~/types/actions';
import type { BoltArtifactData } from '~/types/artifact';

export interface ActionCallbackData {
  messageId: string;
  artifactId: string;
  action: BoltAction;
}

export interface ArtifactCallbackData {
  messageId: string;
  id: string;
  title: string;
}

export interface ParserCallbacks {
  onArtifactOpen?: (data: ArtifactCallbackData) => void;
  onArtifactClose?: (data: ArtifactCallbackData) => void;
  onActionOpen?: (data: ActionCallbackData) => void;
  onActionClose?: (data: ActionCallbackData) => void;
}

const logger = createScopedLogger('MessageParser');

export class StreamingMessageParser {
  #callbacks: ParserCallbacks;
  #openActions: Map<string, Map<string, BoltActionData>> = new Map();
  #openArtifacts: Map<string, BoltArtifactData> = new Map();
  #tagStack: string[] = [];
  #currentArtifact: string | null = null;
  #currentAction: string | null = null;
  #contentBuffer: string = '';

  constructor(callbacks: ParserCallbacks) {
    this.#callbacks = callbacks;
  }

  reset() {
    this.#openActions = new Map();
    this.#openArtifacts = new Map();
    this.#tagStack = [];
    this.#currentArtifact = null;
    this.#currentAction = null;
    this.#contentBuffer = '';
  }

  parse(messageId: string, content: string): string {
    let processedContent = '';
    let currentIndex = 0;

    // Look for the start of a boltArtifact tag
    const artifactStartMatch = content.match(/<boltArtifact\s+id="([^"]+)"\s+title="([^"]+)">/);
    if (artifactStartMatch) {
      // Add everything before the tag to the processed content
      processedContent += content.substring(currentIndex, artifactStartMatch.index);
      currentIndex = artifactStartMatch.index! + artifactStartMatch[0].length;
      
      // Extract artifact details
      const id = artifactStartMatch[1];
      const title = artifactStartMatch[2];
      
      this.#currentArtifact = id;
      this.#openArtifacts.set(id, { id, title });
      this.#tagStack.push('boltArtifact');
      
      // Call the onArtifactOpen callback
      this.#callbacks.onArtifactOpen?.({
        messageId,
        id,
        title
      });
      
      // Add a placeholder for the artifact in the processed content
      processedContent += `<div class="__boltArtifact__" data-message-id="${messageId}"></div>`;
    }
    
    // Look for action tags within an artifact
    const actionStartRegex = /<boltAction\s+type="(file|shell)"\s*(?:filePath="([^"]*)")?\s*>/g;
    let actionMatch;
    
    while ((actionMatch = actionStartRegex.exec(content)) !== null) {
      // Add everything before the tag to the processed content
      processedContent += content.substring(currentIndex, actionMatch.index);
      currentIndex = actionMatch.index + actionMatch[0].length;
      
      const actionType = actionMatch[1] as 'file' | 'shell';
      const filePath = actionMatch[2] || '';
      
      // Only process actions within an artifact
      if (this.#currentArtifact) {
        let action: BoltAction;
        
        if (actionType === 'file') {
          action = {
            type: 'file',
            filePath,
            content: ''
          };
        } else {
          action = {
            type: 'shell',
            content: ''
          };
        }
        
        // Generate a unique ID for this action
        const actionId = `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.#currentAction = actionId;
        
        // Store the action
        if (!this.#openActions.has(this.#currentArtifact)) {
          this.#openActions.set(this.#currentArtifact, new Map());
        }
        this.#openActions.get(this.#currentArtifact)!.set(actionId, action);
        this.#tagStack.push('boltAction');
        
        // Call the onActionOpen callback
        this.#callbacks.onActionOpen?.({
          messageId,
          artifactId: this.#currentArtifact,
          action
        });
        
        // Start collecting content for this action
        this.#contentBuffer = '';
      }
    }
    
    // Look for closing tags
    const closeActionMatch = content.match(/<\/boltAction>/);
    if (closeActionMatch && this.#currentArtifact && this.#currentAction) {
      // Add everything before the tag to the content buffer
      this.#contentBuffer += content.substring(currentIndex, closeActionMatch.index);
      currentIndex = closeActionMatch.index! + closeActionMatch[0].length;
      
      // Get the action and update its content
      const artifactActions = this.#openActions.get(this.#currentArtifact);
      if (artifactActions && artifactActions.has(this.#currentAction)) {
        const action = artifactActions.get(this.#currentAction)!;
        action.content = this.#contentBuffer.trim();
        
        // Call the onActionClose callback
        this.#callbacks.onActionClose?.({
          messageId,
          artifactId: this.#currentArtifact,
          action: action as BoltAction
        });
      }
      
      // Pop from tag stack and reset current action
      this.#tagStack.pop();
      this.#currentAction = null;
      this.#contentBuffer = '';
    }
    
    // Look for closing artifact tag
    const closeArtifactMatch = content.match(/<\/boltArtifact>/);
    if (closeArtifactMatch && this.#currentArtifact) {
      // Skip content inside the artifact
      currentIndex = closeArtifactMatch.index! + closeArtifactMatch[0].length;
      
      // Call the onArtifactClose callback
      this.#callbacks.onArtifactClose?.({
        messageId,
        id: this.#currentArtifact,
        title: this.#openArtifacts.get(this.#currentArtifact)!.title
      });
      
      // Pop from tag stack and reset current artifact
      this.#tagStack.pop();
      this.#currentArtifact = null;
    }
    
    // Add any remaining content
    processedContent += content.substring(currentIndex);
    
    return processedContent;
  }
}
