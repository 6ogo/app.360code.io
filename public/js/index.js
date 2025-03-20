"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
let currentConversation = {
    id: generateId(),
    title: 'New Project',
    messages: [],
    code: null,
    schema: null,
    env: null,
    connection: null,
    model: 'qwen-2.5-coder-32b',
    temperature: 0.7
};
// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const closeSidebar = document.getElementById('closeSidebar');
const newChatButton = document.getElementById('newChatButton');
const projectHistory = document.getElementById('projectHistory');
const noHistoryMessage = document.getElementById('noHistoryMessage');
const chatMessages = document.getElementById('chatMessages');
const promptElement = document.getElementById('prompt');
const sendButton = document.getElementById('sendButton');
const temperatureSlider = document.getElementById('temperatureSlider');
const temperatureValue = document.getElementById('temperatureValue');
const modelSelect = document.getElementById('modelSelect');
const projectViewModal = document.getElementById('projectViewModal');
const closeModalButton = document.getElementById('closeModalButton');
const codeContent = document.getElementById('codeContent');
const schemaSetup = document.getElementById('schemaSetup');
const envSetup = document.getElementById('envSetup');
const connectionCode = document.getElementById('connectionCode');
const copyCodeButton = document.getElementById('copyCodeButton');
const copySchemaButton = document.getElementById('copySchemaButton');
const copyEnvButton = document.getElementById('copyEnvButton');
const copyConnectionButton = document.getElementById('copyConnectionButton');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const userInfo = document.getElementById('userInfo');
const userMenuInfo = document.getElementById('userMenuInfo');
const loadingModal = document.getElementById('loadingModal');
// Event Listeners
window.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}
if (closeSidebar) {
    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });
}
if (newChatButton) {
    newChatButton.addEventListener('click', () => {
        startNewChat();
    });
}
if (temperatureSlider) {
    temperatureSlider.addEventListener('input', () => {
        temperatureValue.textContent = temperatureSlider.value;
    });
}
if (promptElement) {
    promptElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            generateCode();
        }
    });
    // Add auto-resize for textarea
    promptElement.addEventListener('input', function () {
        this.style.height = 'auto';
        const newHeight = Math.min(this.scrollHeight, 200);
        this.style.height = `${newHeight}px`;
    });
}
if (sendButton) {
    sendButton.addEventListener('click', generateCode);
}
if (closeModalButton) {
    closeModalButton.addEventListener('click', () => {
        projectViewModal.classList.remove('visible');
    });
}
if (copyCodeButton) {
    copyCodeButton.addEventListener('click', () => {
        copyTextToClipboard(codeContent.textContent || '');
    });
}
if (copySchemaButton) {
    copySchemaButton.addEventListener('click', () => {
        copyTextToClipboard(schemaSetup.textContent || '');
    });
}
if (copyEnvButton) {
    copyEnvButton.addEventListener('click', () => {
        copyTextToClipboard(envSetup.textContent || '');
    });
}
if (copyConnectionButton) {
    copyConnectionButton.addEventListener('click', () => {
        copyTextToClipboard(connectionCode.textContent || '');
    });
}
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab') || '';
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // Show selected content
        tabContents.forEach(content => {
            content.classList.add('hidden');
            if (content.id === tabName + 'Tab') {
                content.classList.remove('hidden');
            }
        });
    });
});
// Setup profile menu toggle
const profileButton = document.getElementById('profileButton');
const userMenu = document.getElementById('userMenu');
if (profileButton && userMenu) {
    profileButton.addEventListener('click', () => {
        userMenu.style.display = userMenu.style.display === 'none' ? 'block' : 'none';
    });
    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!profileButton.contains(event.target) &&
            !userMenu.contains(event.target)) {
            userMenu.style.display = 'none';
        }
    });
}
// Setup sign out buttons
const signOutButton = document.getElementById('signOutButton');
const signOutButtonMenu = document.getElementById('signOutButtonMenu');
const signOutHandler = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const supabase = window.supabaseClient;
        if (supabase) {
            yield supabase.auth.signOut();
        }
        window.location.href = '/auth';
    }
    catch (error) {
        console.error('Error signing out:', error);
        showToast('Failed to sign out. Please try again.', 'error');
    }
});
if (signOutButton)
    signOutButton.addEventListener('click', signOutHandler);
if (signOutButtonMenu)
    signOutButtonMenu.addEventListener('click', signOutHandler);
// Main functionality
// Expose this function to window for use in HTML
window.initializeApp = initializeApp;
function initializeApp() {
    // Check if user is authenticated
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('Supabase client not available');
        if (loadingModal)
            loadingModal.classList.remove('visible');
        showToast('Authentication service unavailable. Some features may not work properly.', 'error');
        // Still attempt to load local data
        loadLocalConversations();
        return;
    }
    // Hide loading modal when auth check is already handled in HTML
    if (loadingModal)
        loadingModal.classList.remove('visible');
    // Initialize UI components
    autoResizeTextarea(promptElement);
    // Show welcome message
    showWelcomeMessage();
    // Load conversation history
    loadConversationHistory();
}
function autoResizeTextarea(textarea) {
    if (!textarea)
        return;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
}
function showWelcomeMessage() {
    if (!chatMessages)
        return;
    // Clear chat area first
    chatMessages.innerHTML = '';
    // Add welcome message
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'ai-message message';
    welcomeMessage.innerHTML = `
        <p class="font-medium">Welcome to 360code.io!</p>
        <p style="margin-top: 0.75rem;">I can help you generate code for your projects. Try prompts like:</p>
        <ul style="margin-top: 0.5rem; margin-left: 1.5rem; list-style-type: disc;">
            <li>"Create a simple snake game"</li>
            <li>"Build a to-do list app with React"</li>
            <li>"Generate a landing page for a fitness app"</li>
        </ul>
        <p style="margin-top: 0.75rem;">Your projects can include Supabase integration for backend functionality.</p>
    `;
    chatMessages.appendChild(welcomeMessage);
}
function startNewChat() {
    // Save current conversation if it has messages
    if (currentConversation.messages.length > 0) {
        saveConversation(currentConversation);
    }
    // Reset the chat
    showWelcomeMessage();
    // Reset current conversation
    currentConversation = {
        id: generateId(),
        title: 'New Project',
        messages: [],
        code: null,
        schema: null,
        env: null,
        connection: null,
        model: modelSelect.value,
        temperature: parseFloat(temperatureSlider.value)
    };
    // Clear input
    if (promptElement)
        promptElement.value = '';
    // Close sidebar on mobile
    sidebar.classList.remove('open');
}
function generateCode() {
    return __awaiter(this, void 0, void 0, function* () {
        const message = promptElement.value.trim();
        if (!message) {
            showToast('Please enter a prompt.', 'error');
            return;
        }
        // Disable input during processing
        promptElement.disabled = true;
        sendButton.classList.add('disabled');
        sendButton.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
        // Add user message to UI
        addMessageToUI('user', message);
        // Add to conversation history
        currentConversation.messages.push({
            role: 'user',
            content: message
        });
        // Set conversation title based on first message
        if (currentConversation.messages.length === 1) {
            currentConversation.title = message.length > 30
                ? message.substring(0, 30) + '...'
                : message;
        }
        // Clear input
        promptElement.value = '';
        // Add AI thinking indicator
        const aiMessageElement = addMessageToUI('assistant', '<div class="spinner"></div>');
        try {
            // Get current settings
            const model = modelSelect.value;
            const temperature = parseFloat(temperatureSlider.value);
            // Update conversation settings
            currentConversation.model = model;
            currentConversation.temperature = temperature;
            // Generate response using the appropriate API URL
            // For local development, use relative path. For production, use the full URL.
            const apiUrl = window.API_BASE_URL ? `${window.API_BASE_URL}/generate` : '/generate';
            console.log(`Sending request to: ${apiUrl}`);
            const response = yield fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: message,
                    model: model,
                    temperature: temperature
                })
            });
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Response is not JSON. Make sure your server is properly set up.');
            }
            const data = yield response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            // Process response
            const aiMessage = data.code;
            // Add to conversation history
            currentConversation.messages.push({
                role: 'assistant',
                content: aiMessage
            });
            // Extract code blocks
            const codeBlocks = extractCodeBlocks(aiMessage);
            if (codeBlocks.length > 0) {
                // Set the main code
                currentConversation.code = codeBlocks[0].code;
                // Set other code blocks if available
                if (codeBlocks.length > 1) {
                    // Look for SQL schema
                    const sqlBlock = codeBlocks.find(block => block.language.toLowerCase() === 'sql' ||
                        block.code.toLowerCase().includes('create table'));
                    if (sqlBlock) {
                        currentConversation.schema = sqlBlock.code;
                    }
                    // Look for environment variables
                    const envBlock = codeBlocks.find(block => block.code.includes('SUPABASE_URL') ||
                        block.code.includes('.env'));
                    if (envBlock) {
                        currentConversation.env = envBlock.code;
                    }
                    // Look for connection code
                    const connectionBlock = codeBlocks.find(block => block.code.includes('createClient') ||
                        block.code.includes('supabase'));
                    if (connectionBlock) {
                        currentConversation.connection = connectionBlock.code;
                    }
                }
                // If we don't have specific blocks, generate them
                if (!currentConversation.schema) {
                    currentConversation.schema = generateSchemaFromCode(currentConversation.code);
                }
                if (!currentConversation.env) {
                    currentConversation.env =
                        `NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`;
                }
                if (!currentConversation.connection) {
                    currentConversation.connection =
                        `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)`;
                }
            }
            // Update the AI message in the UI
            updateAIMessage(aiMessageElement, aiMessage);
            // Save conversation
            saveConversation(currentConversation);
            // Update the history sidebar
            loadConversationHistory();
        }
        catch (error) {
            console.error('Error:', error);
            updateAIMessage(aiMessageElement, `Error: ${error.message}. Please make sure your server is running and properly configured.`);
            showToast(`Error: ${error.message}`, 'error');
        }
        finally {
            // Re-enable input
            promptElement.disabled = false;
            sendButton.classList.remove('disabled');
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    });
}
function addMessageToUI(role, content) {
    const messageElement = document.createElement('div');
    messageElement.className = role === 'user' ? 'user-message message' : 'ai-message message';
    messageElement.innerHTML = content;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageElement;
}
function updateAIMessage(messageElement, content) {
    // Process content to handle code blocks
    const processedContent = processMessageContent(content);
    messageElement.innerHTML = processedContent;
    // Add copy buttons to code blocks
    const codeBlocks = messageElement.querySelectorAll('.code-block');
    codeBlocks.forEach(block => {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-button';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.addEventListener('click', () => {
            copyTextToClipboard(block.textContent || '');
        });
        block.appendChild(copyBtn);
    });
    // Add view project button if code was generated
    if (currentConversation.code) {
        const viewProjectBtn = document.createElement('button');
        viewProjectBtn.className = 'view-project-btn';
        viewProjectBtn.innerHTML = '<i class="fas fa-eye mr-2"></i>View Complete Project';
        viewProjectBtn.addEventListener('click', () => {
            openProjectModal(currentConversation);
        });
        messageElement.appendChild(viewProjectBtn);
    }
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
function processMessageContent(content) {
    // Replace code blocks with styled divs
    return content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        const lang = language || 'plaintext';
        return `<div class="code-block" data-language="${lang}">${escapeHtml(code.trim())}</div>`;
    }).replace(/\n/g, '<br>');
}
function extractCodeBlocks(content) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
        codeBlocks.push({
            language: match[1] || 'plaintext',
            code: match[2].trim()
        });
    }
    return codeBlocks;
}
function generateSchemaFromCode(code) {
    // Default schema with users and sessions table
    return `-- Create a table for users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for application data
CREATE TABLE app_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON app_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data" ON app_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own data" ON app_data
  FOR SELECT USING (auth.uid() = user_id);`;
}
function openProjectModal(conversation) {
    var _a, _b;
    // Set project title
    const modalProjectTitle = document.getElementById('modalProjectTitle');
    modalProjectTitle.textContent = conversation.title;
    // Set code content
    codeContent.textContent = conversation.code || 'No code available';
    // Set schema setup
    schemaSetup.textContent = conversation.schema || 'No schema available';
    // Set environment setup
    envSetup.textContent = conversation.env || 'No environment variables available';
    // Set connection code
    connectionCode.textContent = conversation.connection || 'No connection code available';
    // Reset to code tab
    tabs.forEach(tab => tab.classList.remove('active'));
    (_a = document.querySelector('[data-tab="code"]')) === null || _a === void 0 ? void 0 : _a.classList.add('active');
    tabContents.forEach(content => content.classList.add('hidden'));
    (_b = document.getElementById('codeTab')) === null || _b === void 0 ? void 0 : _b.classList.remove('hidden');
    // Show modal
    projectViewModal.classList.add('visible');
}
// Show toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="flex items-center gap-2">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <div>${message}</div>
        </div>
    `;
    toastContainer.appendChild(toast);
    // Remove after delay
    setTimeout(() => {
        if (toastContainer.contains(toast)) {
            toastContainer.removeChild(toast);
        }
    }, 5000);
}
// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
function escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}
function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
        showToast('Copied to clipboard!', 'success');
    })
        .catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Failed to copy text', 'error');
    });
}
// Storage Functions
function saveConversation(conversation) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if Supabase is available
            const supabase = window.supabaseClient;
            if (supabase) {
                try {
                    // Get current user
                    const { data } = yield supabase.auth.getUser();
                    const user = data === null || data === void 0 ? void 0 : data.user;
                    if (!user) {
                        throw new Error('User not authenticated');
                    }
                    const userId = user.id;
                    // Save to Supabase
                    const { data: upsertData, error } = yield supabase
                        .from('conversations')
                        .upsert([
                        {
                            id: conversation.id,
                            user_id: userId,
                            title: conversation.title,
                            messages: conversation.messages,
                            code: conversation.code,
                            schema: conversation.schema,
                            env: conversation.env,
                            connection: conversation.connection,
                            model: conversation.model,
                            temperature: conversation.temperature,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }
                    ])
                        .select();
                    if (error)
                        throw error;
                    return upsertData;
                }
                catch (error) {
                    console.error('Supabase error:', error);
                    // Fall back to localStorage
                    localStorage.setItem(`conversation_${conversation.id}`, JSON.stringify(conversation));
                }
            }
            else {
                // Fall back to localStorage
                localStorage.setItem(`conversation_${conversation.id}`, JSON.stringify(conversation));
            }
        }
        catch (error) {
            console.error('Error saving conversation:', error);
            // Try to save locally as fallback
            localStorage.setItem(`conversation_${conversation.id}`, JSON.stringify(conversation));
        }
    });
}
function loadConversationHistory() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if Supabase is available
            const supabase = window.supabaseClient;
            if (supabase) {
                try {
                    // Get current user
                    const { data, error } = yield supabase.auth.getUser();
                    if (error || !(data === null || data === void 0 ? void 0 : data.user)) {
                        console.error('No authenticated user');
                        window.location.href = '/auth';
                        return;
                    }
                    const userId = data.user.id;
                    // Update user info in UI
                    updateUserInfo(data.user);
                    // Get conversations from Supabase
                    const { data: conversationsData, error: conversationsError } = yield supabase
                        .from('conversations')
                        .select('*')
                        .eq('user_id', userId)
                        .order('updated_at', { ascending: false });
                    if (conversationsError) {
                        console.error('Error fetching conversations:', conversationsError);
                        loadLocalConversations();
                        return;
                    }
                    if (conversationsData && conversationsData.length > 0) {
                        renderConversationHistory(conversationsData);
                    }
                    else {
                        // No conversations in Supabase, try localStorage
                        loadLocalConversations();
                    }
                }
                catch (error) {
                    console.error('Error in Supabase authentication flow:', error);
                    window.location.href = '/auth';
                }
            }
            else {
                // Supabase not available, load from localStorage
                loadLocalConversations();
            }
        }
        catch (error) {
            console.error('Error loading conversations:', error);
            // Try to load from localStorage as fallback
            loadLocalConversations();
        }
    });
}
// Update user info in the UI
function updateUserInfo(user) {
    if (!user)
        return;
    // Update sidebar user info
    if (userInfo) {
        userInfo.innerHTML = `
            <p class="user-name">${user.email.split('@')[0]}</p>
            <p class="user-email text-xs text-bolt-elements-textSecondary truncate">${user.email}</p>
        `;
    }
    // Update user menu info
    if (userMenuInfo) {
        userMenuInfo.innerHTML = `<p><strong>${user.email}</strong></p>`;
    }
}
function loadLocalConversations() {
    const conversations = [];
    // Get all items from localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('conversation_')) {
            try {
                const conversation = JSON.parse(localStorage.getItem(key) || '{}');
                conversations.push(conversation);
            }
            catch (e) {
                console.error('Error parsing conversation from localStorage:', e);
            }
        }
    }
    if (conversations.length > 0) {
        // Sort by latest first (assuming id is timestamp-based)
        conversations.sort((a, b) => parseInt(b.id, 36) - parseInt(a.id, 36));
        renderConversationHistory(conversations);
    }
    else {
        // No conversations anywhere
        projectHistory.innerHTML = '';
        projectHistory.appendChild(noHistoryMessage);
    }
}
function renderConversationHistory(conversations) {
    projectHistory.innerHTML = '';
    if (conversations.length === 0) {
        projectHistory.appendChild(noHistoryMessage);
        return;
    }
    conversations.forEach(conversation => {
        const historyItem = document.createElement('div');
        historyItem.className = 'project-card';
        historyItem.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="truncate">
                    <h3 class="project-title">${conversation.title}</h3>
                    <p class="project-date">
                        ${new Date(conversation.updated_at || conversation.id).toLocaleString()}
                    </p>
                </div>
            </div>
        `;
        historyItem.addEventListener('click', () => {
            loadConversation(conversation);
            sidebar.classList.remove('open');
        });
        projectHistory.appendChild(historyItem);
    });
}
function loadConversation(conversation) {
    return __awaiter(this, void 0, void 0, function* () {
        // Save current conversation first
        if (currentConversation.messages.length > 0) {
            yield saveConversation(currentConversation);
        }
        // Set current conversation
        currentConversation = conversation;
        // Clear chat area
        chatMessages.innerHTML = '';
        // Render messages
        conversation.messages.forEach(message => {
            if (message.role === 'user') {
                addMessageToUI('user', message.content);
            }
            else if (message.role === 'assistant') {
                const messageElement = addMessageToUI('assistant', '');
                updateAIMessage(messageElement, message.content);
            }
        });
        // Update UI elements
        modelSelect.value = conversation.model || modelSelect.value;
        temperatureSlider.value = conversation.temperature ? conversation.temperature.toString() : temperatureSlider.value;
        temperatureValue.textContent = temperatureSlider.value;
    });
}
