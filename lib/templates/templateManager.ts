import { workbenchStore } from '@/lib/stores/workbench';
import { projectStore } from '@/lib/stores/projectContext';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'ai' | 'game';
  icon: string;
  files: Record<string, string>;
  dependencies: string[];
  devDependencies: string[];
  setupCommands: string[];
  initialPrompt: string;
}

// Collection of project templates
export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'next-tailwind',
    name: 'Next.js with Tailwind',
    description: 'Modern React framework with Tailwind CSS styling',
    category: 'frontend',
    icon: 'react',
    files: {
      '/package.json': `{
  "name": "next-tailwind-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.2",
    "typescript": "^5.0.4"
  }
}`,
      '/tsconfig.json': `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,
      '/postcss.config.js': `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      '/tailwind.config.js': `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      '/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}`,
      '/app/layout.tsx': `import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Next.js App',
  description: 'Created with 360code.io',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`,
      '/app/page.tsx': `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-6">Welcome to Next.js with Tailwind CSS</h1>
      <p className="text-lg mb-4">This template was created with 360code.io</p>
      <div className="mt-6">
        <a
          href="https://nextjs.org/docs"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          target="_blank"
          rel="noopener noreferrer"
        >
          Next.js Documentation
        </a>
      </div>
    </main>
  )
}`
    },
    dependencies: ['next', 'react', 'react-dom'],
    devDependencies: ['typescript', '@types/react', '@types/node', '@types/react-dom', 'tailwindcss', 'postcss', 'autoprefixer'],
    setupCommands: ['npm install', 'npm run dev'],
    initialPrompt: 'Create a Next.js app with Tailwind CSS that has a header, hero section, and features section with cards.'
  },
  {
    id: 'express-mongodb',
    name: 'Express with MongoDB',
    description: 'Node.js API with MongoDB database',
    category: 'backend',
    icon: 'node',
    files: {
      '/package.json': `{
  "name": "express-mongodb-api",
  "version": "1.0.0",
  "description": "Express API with MongoDB",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}`,
      '/.env': `PORT=5000
MONGODB_URI=mongodb://localhost:27017/myapp`,
      '/server.js': `const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/items', require('./routes/items'));

// Default route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));`,
      '/models/Item.js': `const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Item', ItemSchema);`,
      '/routes/items.js': `const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// Get all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one item
router.get('/:id', getItem, (req, res) => {
  res.json(res.item);
});

// Create item
router.post('/', async (req, res) => {
  const item = new Item({
    name: req.body.name,
    description: req.body.description
  });

  try {
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update item
router.patch('/:id', getItem, async (req, res) => {
  if (req.body.name != null) {
    res.item.name = req.body.name;
  }
  if (req.body.description != null) {
    res.item.description = req.body.description;
  }
  try {
    const updatedItem = await res.item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete item
router.delete('/:id', getItem, async (req, res) => {
  try {
    await res.item.remove();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware
async function getItem(req, res, next) {
  let item;
  try {
    item = await Item.findById(req.params.id);
    if (item == null) {
      return res.status(404).json({ message: 'Item not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.item = item;
  next();
}

module.exports = router;`
    },
    dependencies: ['express', 'mongoose', 'cors', 'dotenv'],
    devDependencies: ['nodemon'],
    setupCommands: ['npm install', 'npm run dev'],
    initialPrompt: 'Create a RESTful API with Express and MongoDB with user authentication and CRUD operations for a collection of your choice.'
  },
  {
    id: 'react-vite',
    name: 'React with Vite',
    description: 'React with Vite for fast development',
    category: 'frontend',
    icon: 'react',
    files: {
      '/package.json': `{
  "name": "react-vite-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "eslint": "^8.45.0",
    "eslint-plugin-react": "^7.32.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "vite": "^4.4.5"
  }
}`,
      '/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React + Vite App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
      '/src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      '/src/App.jsx': `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="app">
        <h1>React + Vite</h1>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            Count is {count}
          </button>
          <p>
            Edit <code>src/App.jsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">
          Created with 360code.io
        </p>
      </div>
    </>
  )
}

export default App`,
      '/src/App.css': `.app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  color: white;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}`,
      '/src/index.css': `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}
a:hover {
  color: #535bf2;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  a:hover {
    color: #747bff;
  }
  button {
    background-color: #f9f9f9;
    color: #213547;
  }
}`
    },
    dependencies: ['react', 'react-dom'],
    devDependencies: ['vite', '@vitejs/plugin-react', 'eslint', 'eslint-plugin-react', 'eslint-plugin-react-hooks'],
    setupCommands: ['npm install', 'npm run dev'],
    initialPrompt: 'Create a responsive React app with multiple components and state management using hooks.'
  },
  {
    id: 'mern-stack',
    name: 'MERN Stack',
    description: 'MongoDB, Express, React, Node.js full stack',
    category: 'fullstack',
    icon: 'js',
    files: {
      '/package.json': `{
  "name": "mern-app",
  "version": "1.0.0",
  "description": "MERN Stack Application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "server": "nodemon server.js",
    "client": "npm start --prefix client",
    "dev": "concurrently \\"npm run server\\" \\"npm run client\\"",
    "client-install": "npm install --prefix client"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "concurrently": "^7.6.0"
  }
}`,
      '/server.js': `const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mernapp')
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

// Routes
app.use('/api/items', require('./routes/api/items'));

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(\`Server started on port \${PORT}\`));`
    },
    dependencies: ['express', 'mongoose', 'cors', 'dotenv', 'react', 'react-dom', 'axios'],
    devDependencies: ['nodemon', 'concurrently'],
    setupCommands: ['npm install', 'mkdir client', 'npx create-react-app client', 'npm run dev'],
    initialPrompt: 'Create a full-stack MERN application with user authentication, dashboard, and CRUD operations.'
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant App',
    description: 'AI-powered chat application',
    category: 'ai',
    icon: 'robot',
    files: {
      '/package.json': `{
  "name": "ai-assistant-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "ai": "^2.2.20",
    "openai": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.4",
    "tailwindcss": "^3.3.2",
    "postcss": "^8.4.24",
    "autoprefixer": "^10.4.14"
  }
}`
    },
    dependencies: ['next', 'react', 'react-dom', 'ai', 'openai'],
    devDependencies: ['typescript', '@types/react', '@types/node', 'tailwindcss', 'postcss', 'autoprefixer'],
    setupCommands: ['npm install', 'npm run dev'],
    initialPrompt: 'Create an AI assistant app that can answer questions, write code, and generate creative content.'
  }
];

/**
 * Apply a template to the current project
 */
export async function applyTemplate(templateId: string): Promise<boolean> {
  try {
    // Find the template
    const template = projectTemplates.find(t => t.id === templateId);
    
    if (!template) {
      console.error(`Template not found: ${templateId}`);
      return false;
    }
    
    // Create files from template
    Object.entries(template.files).forEach(([path, content]) => {
      workbenchStore.addFile(path, content);
    });
    
    // Update project store
    const project = projectStore.get();
    projectStore.set({
      ...project,
      title: template.name,
      description: template.description,
      status: 'generating',
      currentStep: 1,
      totalSteps: 5,
      documentation: [
        `## Project Template: ${template.name}\n\n${template.description}\n\nTemplate applied with initial files created.`
      ],
      lastContext: template.initialPrompt
    });
    
    return true;
  } catch (error) {
    console.error('Error applying template:', error);
    return false;
  }
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category?: string): ProjectTemplate[] {
  if (!category) {
    return projectTemplates;
  }
  
  return projectTemplates.filter(t => t.category === category);
}

/**
 * Get a single template by ID
 */
export function getTemplateById(id: string): ProjectTemplate | undefined {
  return projectTemplates.find(t => t.id === id);
}