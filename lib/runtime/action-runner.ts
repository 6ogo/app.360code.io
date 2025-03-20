import type { WebContainer } from '@webcontainer/api';
import { join } from 'path';
import type { ActionCallbackData } from './message-parser';
import { createScopedLogger } from '~/utils/logger';
import { coloredText } from '~/utils/terminal';

const logger = createScopedLogger('ActionRunner');

export class ActionRunner {
  #webcontainer: Promise<WebContainer>;
  #actions: Map<string, ActionCallbackData> = new Map();
  #runningActions: Set<string> = new Set();

  constructor(webcontainer: Promise<WebContainer>) {
    this.#webcontainer = webcontainer;
  }

  addAction(data: ActionCallbackData) {
    const actionId = `${data.messageId}-${data.action.type}-${Date.now()}`;
    this.#actions.set(actionId, data);
    
    logger.debug(`Added action: ${actionId}`);
    
    return actionId;
  }

  async runAction(data: ActionCallbackData) {
    const actionId = `${data.messageId}-${data.action.type}-${Date.now()}`;
    
    if (this.#runningActions.has(actionId)) {
      logger.warn(`Action ${actionId} is already running`);
      return;
    }
    
    this.#runningActions.add(actionId);
    
    try {
      const webcontainer = await this.#webcontainer;
      
      if (data.action.type === 'file') {
        await this.#writeFile(webcontainer, data.action.filePath, data.action.content);
      } else if (data.action.type === 'shell') {
        await this.#runShellCommand(webcontainer, data.action.content);
      }
    } catch (error) {
      logger.error(`Failed to run action ${actionId}:`, error);
    } finally {
      this.#runningActions.delete(actionId);
    }
  }

  async #writeFile(webcontainer: WebContainer, filePath: string, content: string) {
    logger.info(`Writing file: ${filePath}`);
    
    try {
      // Ensure the directory exists
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
      if (dirPath) {
        await webcontainer.fs.mkdir(dirPath, { recursive: true });
      }
      
      // Write the file
      await webcontainer.fs.writeFile(filePath, content);
      
      logger.info(`Successfully wrote file: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to write file ${filePath}:`, error);
      throw error;
    }
  }

  async #runShellCommand(webcontainer: WebContainer, command: string) {
    logger.info(`Running shell command: ${command}`);
    
    try {
      // Split the command into parts for the shell
      const commandParts = command.trim().split(/\s+/);
      const [cmd, ...args] = commandParts;
      
      // Spawn a process for the command
      const process = await webcontainer.spawn(cmd, args);
      const exitCode = await process.exit;
      
      if (exitCode !== 0) {
        logger.warn(`Command exited with non-zero status: ${exitCode}`);
      } else {
        logger.info(`Command executed successfully with exit code: ${exitCode}`);
      }
    } catch (error) {
      logger.error(`Failed to run shell command: ${command}`, error);
      throw error;
    }
  }
}
