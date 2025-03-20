import { map } from 'nanostores';
import type { Message } from '@/types/conversation';

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export const initialChatState: ChatState = {
  messages: [],
  isLoading: false,
  error: null
};

export const chatStore = map<ChatState>(initialChatState);

export function addMessage(message: Message) {
  const currentState = chatStore.get();
  chatStore.set({
    ...currentState,
    messages: [...currentState.messages, message]
  });
}

export function setLoading(isLoading: boolean) {
  const currentState = chatStore.get();
  chatStore.set({
    ...currentState,
    isLoading
  });
}

export function setError(error: string | null) {
  const currentState = chatStore.get();
  chatStore.set({
    ...currentState,
    error
  });
}

export function resetChat() {
  chatStore.set(initialChatState);
}