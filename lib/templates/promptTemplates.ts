// lib/templates/promptTemplates.ts
import { workbenchStore } from '@/lib/stores/workbench';
import { projectStore } from '@/lib/stores/projectContext';

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: 'code' | 'documentation' | 'testing' | 'refactoring' | 'general';
  prompt: string;
  variables: TemplateVariable[];
  icon: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  defaultValue?: string;
  type: 'text' | 'select' | 'boolean';
  options?: string[]; // For select type
}

export interface RenderedTemplate {
  title: string;
  prompt: string;
}

// Collection of prompt templates
export const promptTemplates: PromptTemplate[] = [
  {
    id: 'explain-code',
    title: 'Explain Code',
    description: 'Get a detailed explanation of the selected code',
    category: 'code',
    icon: 'lightbulb',
    prompt: `Please explain what the following {{language}} code does:

\`\`\`{{language}}
{{code}}
\`\`\`

Provide explanations for:
1. The overall purpose of the code
2. Key functions/methods and what they do
3. Any complex or non-obvious parts
4. Potential issues or optimizations

{{additionalInstructions}}`,
    variables: [
      {
        name: 'language',
        description: 'Programming language',
        type: 'select',
        options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Other'],
        defaultValue: 'JavaScript'
      },
      {
        name: 'code',
        description: 'Code to explain',
        type: 'text',
        defaultValue: '// Paste your code here'
      },
      {
        name: 'additionalInstructions',
        description: 'Any additional instructions',
        type: 'text',
        defaultValue: ''
      }
    ]
  },
  {
    id: 'optimize-code',
    title: 'Optimize Code',
    description: 'Get suggestions to optimize your code',
    category: 'refactoring',
    icon: 'tachometer-alt',
    prompt: `Please optimize the following {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

Focus on:
{{#if performanceFocus}}
- Improving time complexity
- Reducing memory usage
- Eliminating bottlenecks
{{/if}}
{{#if readabilityFocus}}
- Improving readability
- Making the code more maintainable
- Following best practices
{{/if}}
{{#if sizeFocus}}
- Reducing code size
- Eliminating redundant code
- Simplifying logic
{{/if}}

{{additionalInstructions}}`,
    variables: [
      {
        name: 'language',
        description: 'Programming language',
        type: 'select',
        options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Other'],
        defaultValue: 'JavaScript'
      },
      {
        name: 'code',
        description: 'Code to optimize',
        type: 'text',
        defaultValue: '// Paste your code here'
      },
      {
        name: 'performanceFocus',
        description: 'Focus on performance optimization',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'readabilityFocus',
        description: 'Focus on readability improvements',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'sizeFocus',
        description: 'Focus on code size reduction',
        type: 'boolean',
        defaultValue: 'false'
      },
      {
        name: 'additionalInstructions',
        description: 'Any additional instructions',
        type: 'text',
        defaultValue: ''
      }
    ]
  },
  {
    id: 'generate-tests',
    title: 'Generate Tests',
    description: 'Generate test cases for your code',
    category: 'testing',
    icon: 'vial',
    prompt: `Please generate {{testFramework}} tests for the following {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

Include:
{{#if unitTests}}
- Unit tests for individual functions/methods
{{/if}}
{{#if integrationTests}}
- Integration tests for how components work together
{{/if}}
{{#if edgeCases}}
- Tests for edge cases and error handling
{{/if}}
{{#if mocks}}
- Mocks and fixtures for dependencies
{{/if}}

{{additionalInstructions}}`,
    variables: [
      {
        name: 'language',
        description: 'Programming language',
        type: 'select',
        options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Other'],
        defaultValue: 'JavaScript'
      },
      {
        name: 'testFramework',
        description: 'Testing framework',
        type: 'select',
        options: ['Jest', 'Mocha', 'Chai', 'Jasmine', 'Pytest', 'JUnit', 'NUnit', 'PHPUnit', 'RSpec', 'Other'],
        defaultValue: 'Jest'
      },
      {
        name: 'code',
        description: 'Code to test',
        type: 'text',
        defaultValue: '// Paste your code here'
      },
      {
        name: 'unitTests',
        description: 'Include unit tests',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'integrationTests',
        description: 'Include integration tests',
        type: 'boolean',
        defaultValue: 'false'
      },
      {
        name: 'edgeCases',
        description: 'Include edge case tests',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'mocks',
        description: 'Include mocks and fixtures',
        type: 'boolean',
        defaultValue: 'false'
      },
      {
        name: 'additionalInstructions',
        description: 'Any additional instructions',
        type: 'text',
        defaultValue: ''
      }
    ]
  },
  {
    id: 'code-review',
    title: 'Code Review',
    description: 'Get a comprehensive code review',
    category: 'refactoring',
    icon: 'search',
    prompt: `Please review the following {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

Provide feedback on:
{{#if bugCheck}}
- Potential bugs and logical errors
{{/if}}
{{#if securityCheck}}
- Security vulnerabilities
{{/if}}
{{#if performanceCheck}}
- Performance issues
{{/if}}
{{#if styleCheck}}
- Code style and adherence to conventions
{{/if}}
{{#if testabilityCheck}}
- Testability and maintainability
{{/if}}

{{feedbackStyle}} in your review.

{{additionalInstructions}}`,
    variables: [
      {
        name: 'language',
        description: 'Programming language',
        type: 'select',
        options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Other'],
        defaultValue: 'JavaScript'
      },
      {
        name: 'code',
        description: 'Code to review',
        type: 'text',
        defaultValue: '// Paste your code here'
      },
      {
        name: 'bugCheck',
        description: 'Check for bugs',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'securityCheck',
        description: 'Check for security issues',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'performanceCheck',
        description: 'Check for performance issues',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'styleCheck',
        description: 'Check code style',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'testabilityCheck',
        description: 'Check testability',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'feedbackStyle',
        description: 'Feedback style',
        type: 'select',
        options: ['Be direct and concise', 'Be detailed and educational', 'Focus on critical issues only', 'Include code examples for improvements'],
        defaultValue: 'Be direct and concise'
      },
      {
        name: 'additionalInstructions',
        description: 'Any additional instructions',
        type: 'text',
        defaultValue: ''
      }
    ]
  },
  {
    id: 'document-code',
    title: 'Document Code',
    description: 'Generate documentation for your code',
    category: 'documentation',
    icon: 'file-alt',
    prompt: `Please generate documentation for the following {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

{{#if formatJSDoc}}
Use JSDoc format.
{{/if}}
{{#if formatPyDoc}}
Use PyDoc format.
{{/if}}
{{#if formatMarkdown}}
Use Markdown format.
{{/if}}

Include:
{{#if includeOverview}}
- Overview of what the code does
{{/if}}
{{#if includeFunctions}}
- Documentation for each function/method
{{/if}}
{{#if includeParams}}
- Parameters and return values
{{/if}}
{{#if includeExamples}}
- Examples of how to use the code
{{/if}}

{{additionalInstructions}}`,
    variables: [
      {
        name: 'language',
        description: 'Programming language',
        type: 'select',
        options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Other'],
        defaultValue: 'JavaScript'
      },
      {
        name: 'code',
        description: 'Code to document',
        type: 'text',
        defaultValue: '// Paste your code here'
      },
      {
        name: 'formatJSDoc',
        description: 'Use JSDoc format',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'formatPyDoc',
        description: 'Use PyDoc format',
        type: 'boolean',
        defaultValue: 'false'
      },
      {
        name: 'formatMarkdown',
        description: 'Use Markdown format',
        type: 'boolean',
        defaultValue: 'false'
      },
      {
        name: 'includeOverview',
        description: 'Include overview',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'includeFunctions',
        description: 'Include function documentation',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'includeParams',
        description: 'Include parameter documentation',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'includeExamples',
        description: 'Include examples',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'additionalInstructions',
        description: 'Any additional instructions',
        type: 'text',
        defaultValue: ''
      }
    ]
  },
  {
    id: 'implement-feature',
    title: 'Implement Feature',
    description: 'Get help implementing a new feature',
    category: 'code',
    icon: 'code',
    prompt: `Please help me implement a {{featureType}} in {{language}} with the following requirements:

Feature Description:
{{featureDescription}}

{{#if existingCode}}
Here's the existing code I'm working with:

\`\`\`{{language}}
{{existingCode}}
\`\`\`
{{/if}}

Technical Requirements:
{{technicalRequirements}}

{{#if codeStyle}}
Code Style: {{codeStyle}}
{{/if}}

{{additionalInstructions}}`,
    variables: [
      {
        name: 'featureType',
        description: 'Type of feature',
        type: 'text',
        defaultValue: 'feature'
      },
      {
        name: 'language',
        description: 'Programming language',
        type: 'select',
        options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Other'],
        defaultValue: 'JavaScript'
      },
      {
        name: 'featureDescription',
        description: 'Describe the feature you need',
        type: 'text',
        defaultValue: 'Describe the feature here'
      },
      {
        name: 'existingCode',
        description: 'Existing code (if any)',
        type: 'text',
        defaultValue: ''
      },
      {
        name: 'technicalRequirements',
        description: 'Technical requirements',
        type: 'text',
        defaultValue: 'List your technical requirements here'
      },
      {
        name: 'codeStyle',
        description: 'Preferred code style',
        type: 'text',
        defaultValue: 'Clean, maintainable, well-documented code'
      },
      {
        name: 'additionalInstructions',
        description: 'Any additional instructions',
        type: 'text',
        defaultValue: ''
      }
    ]
  },
  {
    id: 'debug-code',
    title: 'Debug Code',
    description: 'Get help debugging your code',
    category: 'code',
    icon: 'bug',
    prompt: `Please help me debug the following {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

Error/Issue Description:
{{errorDescription}}

{{#if expectedBehavior}}
Expected Behavior:
{{expectedBehavior}}
{{/if}}

{{#if actualBehavior}}
Actual Behavior:
{{actualBehavior}}
{{/if}}

{{additionalContext}}

Please provide:
1. Identification of the likely bug(s)
2. Explanation of why the bug occurs
3. Suggested fix with code examples
4. Additional debugging steps if needed`,
    variables: [
      {
        name: 'language',
        description: 'Programming language',
        type: 'select',
        options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Other'],
        defaultValue: 'JavaScript'
      },
      {
        name: 'code',
        description: 'Code to debug',
        type: 'text',
        defaultValue: '// Paste your code here'
      },
      {
        name: 'errorDescription',
        description: 'Description of the error or issue',
        type: 'text',
        defaultValue: 'Describe the error/issue here'
      },
      {
        name: 'expectedBehavior',
        description: 'Expected behavior',
        type: 'text',
        defaultValue: ''
      },
      {
        name: 'actualBehavior',
        description: 'Actual behavior',
        type: 'text',
        defaultValue: ''
      },
      {
        name: 'additionalContext',
        description: 'Additional context',
        type: 'text',
        defaultValue: ''
      }
    ]
  },
  {
    id: 'convert-code',
    title: 'Convert Code',
    description: 'Convert code from one language to another',
    category: 'code',
    icon: 'exchange-alt',
    prompt: `Please convert the following {{sourceLanguage}} code to {{targetLanguage}}:

\`\`\`{{sourceLanguage}}
{{sourceCode}}
\`\`\`

{{#if maintainComments}}
Please maintain the comments from the original code.
{{/if}}

{{#if useIdiomaticPractices}}
Please use idiomatic practices for {{targetLanguage}}.
{{/if}}

{{#if optimizeForPerformance}}
Please optimize for performance in the converted code.
{{/if}}

{{additionalInstructions}}`,
    variables: [
      {
        name: 'sourceLanguage',
        description: 'Source programming language',
        type: 'select',
        options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Other'],
        defaultValue: 'JavaScript'
      },
      {
        name: 'targetLanguage',
        description: 'Target programming language',
        type: 'select',
        options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Other'],
        defaultValue: 'TypeScript'
      },
      {
        name: 'sourceCode',
        description: 'Code to convert',
        type: 'text',
        defaultValue: '// Paste your code here'
      },
      {
        name: 'maintainComments',
        description: 'Maintain comments',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'useIdiomaticPractices',
        description: 'Use idiomatic practices',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'optimizeForPerformance',
        description: 'Optimize for performance',
        type: 'boolean',
        defaultValue: 'false'
      },
      {
        name: 'additionalInstructions',
        description: 'Any additional instructions',
        type: 'text',
        defaultValue: ''
      }
    ]
  },
  {
    id: 'create-api',
    title: 'Create API Endpoint',
    description: 'Generate code for an API endpoint',
    category: 'code',
    icon: 'server',
    prompt: `Please create an API endpoint in {{language}} using {{framework}} for the following requirements:

Endpoint: {{endpoint}}
Method: {{method}}
Description: {{description}}

{{#if authentication}}
Authentication Required: Yes
Authentication Type: {{authenticationType}}
{{else}}
Authentication Required: No
{{/if}}

{{#if requestBody}}
Request Body:
\`\`\`json
{{requestBody}}
\`\`\`
{{/if}}

{{#if responseBody}}
Expected Response:
\`\`\`json
{{responseBody}}
\`\`\`
{{/if}}

{{#if existingCode}}
Here's the existing code I'm working with:

\`\`\`{{language}}
{{existingCode}}
\`\`\`
{{/if}}

Please include:
{{#if includeValidation}}
- Input validation
{{/if}}
{{#if includeErrorHandling}}
- Error handling
{{/if}}
{{#if includeDocumentation}}
- Documentation
{{/if}}
{{#if includeTests}}
- Tests
{{/if}}

{{additionalInstructions}}`,
    variables: [
      {
        name: 'language',
        description: 'Programming language',
        type: 'select',
        options: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP', 'Ruby', 'Other'],
        defaultValue: 'JavaScript'
      },
      {
        name: 'framework',
        description: 'Framework',
        type: 'select',
        options: ['Express', 'Next.js', 'NestJS', 'Flask', 'Django', 'Spring Boot', 'ASP.NET Core', 'Laravel', 'Ruby on Rails', 'Other'],
        defaultValue: 'Express'
      },
      {
        name: 'endpoint',
        description: 'API endpoint path',
        type: 'text',
        defaultValue: '/api/resource'
      },
      {
        name: 'method',
        description: 'HTTP method',
        type: 'select',
        options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        defaultValue: 'GET'
      },
      {
        name: 'description',
        description: 'Endpoint description',
        type: 'text',
        defaultValue: 'Describe what the endpoint does'
      },
      {
        name: 'authentication',
        description: 'Requires authentication',
        type: 'boolean',
        defaultValue: 'false'
      },
      {
        name: 'authenticationType',
        description: 'Authentication type',
        type: 'select',
        options: ['JWT', 'OAuth', 'API Key', 'Basic Auth', 'Session', 'Other'],
        defaultValue: 'JWT'
      },
      {
        name: 'requestBody',
        description: 'Request body (JSON)',
        type: 'text',
        defaultValue: ''
      },
      {
        name: 'responseBody',
        description: 'Expected response (JSON)',
        type: 'text',
        defaultValue: ''
      },
      {
        name: 'existingCode',
        description: 'Existing code (if any)',
        type: 'text',
        defaultValue: ''
      },
      {
        name: 'includeValidation',
        description: 'Include input validation',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'includeErrorHandling',
        description: 'Include error handling',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'includeDocumentation',
        description: 'Include documentation',
        type: 'boolean',
        defaultValue: 'true'
      },
      {
        name: 'includeTests',
        description: 'Include tests',
        type: 'boolean',
        defaultValue: 'false'
      },
      {
        name: 'additionalInstructions',
        description: 'Any additional instructions',
        type: 'text',
        defaultValue: ''
      }
    ]
  }
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category?: string): PromptTemplate[] {
  if (!category) {
    return promptTemplates;
  }
  
  return promptTemplates.filter(t => t.category === category);
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): PromptTemplate | undefined {
  return promptTemplates.find(t => t.id === id);
}

/**
 * Render a template with variable values
 */
export function renderTemplate(
  templateId: string, 
  variables: Record<string, string | boolean>
): RenderedTemplate | null {
  const template = getTemplateById(templateId);
  
  if (!template) {
    return null;
  }
  
  // Process the template string with variable replacements
  let processedPrompt = template.prompt;
  
  // Replace simple variables {{varName}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedPrompt = processedPrompt.replace(regex, String(value));
  }
  
  // Process conditionals {{#if varName}}...{{/if}}
  const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
  processedPrompt = processedPrompt.replace(conditionalRegex, (match, condVar, content) => {
    const condValue = variables[condVar];
    return condValue && condValue !== 'false' ? content : '';
  });
  
  return {
    title: template.title,
    prompt: processedPrompt.trim()
  };
}

/**
 * Get a template with the current file's content
 */
export function getTemplateWithCurrentFile(templateId: string): Record<string, string | boolean> {
  const template = getTemplateById(templateId);
  const values: Record<string, string | boolean> = {};
  
  if (!template) {
    return values;
  }
  
  // Set default values
  for (const variable of template.variables) {
    values[variable.name] = variable.defaultValue || '';
  }
  
  // Try to get content from current file if available
  const files = workbenchStore.files.get();
  const currentFile = Object.keys(files).find(path => files[path] !== undefined) || '';
  
  if (currentFile && files[currentFile]) {
    const fileContent = files[currentFile];
    const codeVariable = template.variables.find(v => v.name === 'code' || v.name === 'sourceCode' || v.name === 'existingCode');
    
    if (codeVariable) {
      values[codeVariable.name] = fileContent;
    }
    
    // Try to determine the language from the file extension
    const languageVariable = template.variables.find(v => v.name === 'language' || v.name === 'sourceLanguage');
    if (languageVariable) {
      const extension = currentFile.split('.').pop() || '';
      const languageMap: Record<string, string> = {
        'js': 'JavaScript',
        'jsx': 'JavaScript',
        'ts': 'TypeScript',
        'tsx': 'TypeScript',
        'py': 'Python',
        'java': 'Java',
        'cs': 'C#',
        'go': 'Go',
        'rs': 'Rust',
        'php': 'PHP',
        'rb': 'Ruby'
      };
      
      values[languageVariable.name] = languageMap[extension] || extension;
    }
  }
  
  return values;
}