# README.md

# 360code.io - AI-Powered Project Generator

360code.io is an advanced AI coding platform that can create complete projects based on your requirements. Unlike other AI assistants, 360code.io acts as a full development partner, capable of building entire applications from start to finish.

## Features

- **Complete Project Generation**: Generates entire projects based on your description
- **Continuous Development**: Resumes work automatically when token limits are reached
- **Context Preservation**: Maintains project context across multiple AI interactions
- **Documentation**: Creates comprehensive documentation of development progress
- **Live Code Editing**: View and edit code in real-time
- **Web Environment**: Run and preview your projects directly in the browser
- **Visual Reproduction**: Can recreate applications from visual references

## How It Works

1. **Describe Your Project**: Tell 360code.io what you want to build
2. **AI Creates the Project**: The AI will generate the complete project structure and code
3. **Automatic Continuation**: When token limits are reached, the AI will document progress and continue where it left off
4. **View Documentation**: See the progress and development steps at any time
5. **Deploy Your Project**: When complete, easily deploy your project

## Getting Started

To use 360code.io, simply describe your project in natural language. For example:

- "Create a todo app with React and local storage"
- "Build a game similar to Flappy Bird"
- "Develop a personal portfolio website with a projects section and contact form"
- "Implement a markdown note-taking app with tags and search"

You can also upload images of applications you want to recreate, and 360code.io will do its best to recreate them.

## Technical Details

360code.io is built on top of Next.js and uses several advanced technologies:

- **Next.js**: For the frontend and API routes
- **WebContainer API**: To run code directly in the browser
- **Anthropic Claude**: For AI code generation
- **Code Editor**: For real-time code editing and syntax highlighting
- **Project Context Management**: To maintain state across token limits

## Deployment

This app can be deployed on Vercel with the following environment variables:

```
ANTHROPIC_API_KEY=your_api_key_here
```

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "devCommand": "npm run dev",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

### next.config.js

Make sure your next.config.js has the following settings:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  // Add this section for proper COOP/COEP headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
```

# vercel.json

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "devCommand": "npm run dev",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

# .env.example

```
# Anthropic API Key - Required for AI code generation
ANTHROPIC_API_KEY=your_api_key_here

# Optional Supabase Configuration - For user authentication and data storage
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Why the special headers?

The WebContainer API requires Cross-Origin Embedder Policy (COEP) and Cross-Origin Opener Policy (COOP) to be set to enable the SharedArrayBuffer feature needed for its operation. These headers must be properly configured in both your local development environment and in your Vercel deployment.

## Troubleshooting Deployment

If you're only seeing an image when deploying through Vercel, check that:

1. Your Vercel deployment has the COOP/COEP headers correctly set in vercel.json
2. Your environment variables are correctly configured in Vercel
3. The Anthropic API key is valid and has proper permissions
4. Your Next.js routes and API handlers are properly set up

The most common issue is missing COOP/COEP headers, which are required for the WebContainer API to function properly.