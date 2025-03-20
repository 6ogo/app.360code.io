// API Configuration - Change this to match your actual API URL
const API_BASE_URL = ""; // Leave empty to use relative paths, or set to your API domain

// Conversation management
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
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.querySelector('#sidebarToggle');
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

// Event Listeners
window.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

if (closeSidebar && sidebar) {
    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('open');
        console.log('Closing sidebar');
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
}

if (closeModalButton) {
    closeModalButton.addEventListener('click', () => {
        projectViewModal.classList.remove('hidden');
        projectViewModal.classList.add('visible');
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

// Main functionality
function initializeApp() {
    loadConversationHistory();
}

function startNewChat() {
    // Save current conversation if it has messages
    if (currentConversation.messages.length > 0) {
        saveConversation(currentConversation);
    }

    // Clear chat
    chatMessages.innerHTML = '';

    // Add welcome message
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'ai-message message';
    welcomeMessage.innerHTML = `
        <p class="font-medium">Welcome to 360code.io!</p>
        <p class="mt-2">I can help you generate code for your projects. Try prompts like:</p>
        <ul class="mt-2 space-y-1 list-disc list-inside">
            <li>"Create a simple snake game"</li>
            <li>"Build a to-do list app with React"</li>
            <li>"Generate a landing page for a fitness app"</li>
        </ul>
        <p class="mt-2">Your projects can include Supabase integration for backend functionality.</p>
    `;
    chatMessages.appendChild(welcomeMessage);

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
    promptElement.value = '';
    sidebar.classList.remove('open');
}

window.openProjectModal = function (conversation) {
    // Set project title
    const modalProjectTitle = document.getElementById('modalProjectTitle');
    modalProjectTitle.textContent = conversation.title;

    // Set code content
    const codeContent = document.getElementById('codeContent');
    codeContent.textContent = conversation.code || 'No code available';

    // Set schema setup
    const schemaSetup = document.getElementById('schemaSetup');
    schemaSetup.textContent = conversation.schema || 'No schema available';

    // Set environment setup
    const envSetup = document.getElementById('envSetup');
    envSetup.textContent = conversation.env || 'No environment variables available';

    // Set connection code
    const connectionCode = document.getElementById('connectionCode');
    connectionCode.textContent = conversation.connection || 'No connection code available';

    // Reset to code tab
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector('[data-tab="code"]').classList.add('active');

    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.add('hidden');
        if (content.id === 'codeTab') {
            content.classList.remove('hidden');
        }
    });

    // Show modal
    const projectViewModal = document.getElementById('projectViewModal');
    projectViewModal.classList.add('visible');
};

function updateToggleIcon() {
    const icon = sidebarToggle.querySelector('i');
    if (sidebar.classList.contains('open')) {
        icon.className = 'fa-solid fa-xmark';
    } else {
        icon.className = 'fa-solid fa-bars';
    }
}

async function generateCode(prompt, model, temperature) {
    console.log('Attempting to use /generate endpoint...');
    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, model, temperature })
        });
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return data.generatedCode;
    } catch (error) {
        console.error('Error with /generate endpoint:', error);
        throw error;
    }
}

if (sendButton) {
    sendButton.addEventListener('click', generateCode);
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
    document.querySelector('[data-tab="code"]').classList.add('active');

    tabContents.forEach(content => {
        content.classList.add('hidden');
        if (content.id === 'codeTab') {
            content.classList.remove('hidden');
        }
    });

    // Show modal
    projectViewModal.classList.add('visible');
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Helper function for escaping HTML
window.escapeHtml = function (html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
};

window.extractCodeBlocks = function (content) {
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
};

// Helper function for copying text to clipboard
function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            alert('Copied to clipboard!');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
        });
}

// Storage Functions
async function saveConversation(conversation) {
    try {
        // Check if Supabase is available (using the global variable from index.html)
        const supabase = window.supabaseClient;

        if (supabase) {
            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();

                const userId = user ? user.id : 'anonymous';

                // Save to Supabase
                const { data, error } = await supabase
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

                if (error) throw error;

                return data;
            } catch (error) {
                console.error('Supabase error:', error);
                // Fall back to localStorage
                localStorage.setItem(`conversation_${conversation.id}`, JSON.stringify(conversation));
            }
        } else {
            // Fall back to localStorage
            localStorage.setItem(`conversation_${conversation.id}`, JSON.stringify(conversation));
        }
    } catch (error) {
        console.error('Error saving conversation:', error);
        // Try to save locally as fallback
        localStorage.setItem(`conversation_${conversation.id}`, JSON.stringify(conversation));
    }
}

async function loadConversationHistory() {
    try {
        // Check if Supabase is available (using the global variable from index.html)
        const supabase = window.supabaseClient;

        if (supabase) {
            try {
                // Try to get current user
                const { data, error } = await supabase.auth.getUser();

                if (error || !data.user) {
                    // Create anonymous session
                    console.log('No authenticated user, creating anonymous session');
                    const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();

                    if (signInError) {
                        console.error('Error creating anonymous session:', signInError);
                        loadLocalConversations();
                        return;
                    }
                }

                // Now we should have a user (anonymous or authenticated)
                const { data: userData } = await supabase.auth.getUser();
                const userId = userData.user ? userData.user.id : 'anonymous';

                // Get conversations from Supabase
                const { data: conversationsData, error: conversationsError } = await supabase
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
                } else {
                    // No conversations in Supabase, try localStorage
                    loadLocalConversations();
                }
            } catch (error) {
                console.error('Error in Supabase authentication flow:', error);
                loadLocalConversations();
            }
        } else {
            // Supabase not available, load from localStorage
            loadLocalConversations();
        }
    } catch (error) {
        console.error('Error loading conversations:', error);
        // Try to load from localStorage as fallback
        loadLocalConversations();
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
            } catch (e) {
                console.error('Error parsing conversation from localStorage:', e);
            }
        }
    }

    if (conversations.length > 0) {
        // Sort by latest first (assuming id is timestamp-based)
        conversations.sort((a, b) => parseInt(b.id, 36) - parseInt(a.id, 36));
        renderConversationHistory(conversations);
    } else {
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

async function loadConversation(conversation) {
    // Save current conversation first
    if (currentConversation.messages.length > 0) {
        await saveConversation(currentConversation);
    }

    // Set current conversation
    currentConversation = conversation;

    // Clear chat area
    chatMessages.innerHTML = '';

    // Render messages
    conversation.messages.forEach(message => {
        if (message.role === 'user') {
            addMessageToUI('user', message.content);
        } else if (message.role === 'assistant') {
            const messageElement = addMessageToUI('assistant', '');
            updateAIMessage(messageElement, message.content);
        }
    });

    // Update UI elements
    modelSelect.value = conversation.model || modelSelect.value;
    temperatureSlider.value = conversation.temperature ? conversation.temperature.toString() : temperatureSlider.value;
    temperatureValue.textContent = temperatureSlider.value;
}

updateToggleIcon();