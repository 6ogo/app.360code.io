// components/prompts/PromptTemplateSelector.tsx
'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/providers/ToastProvider';
import { 
  promptTemplates, 
  getTemplatesByCategory, 
  getTemplateById, 
  renderTemplate,
  getTemplateWithCurrentFile,
  PromptTemplate
} from '@/lib/templates/promptTemplates';

interface PromptTemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (prompt: string) => void;
}

type CategoryTab = 'all' | 'code' | 'documentation' | 'testing' | 'refactoring' | 'general';

export default function PromptTemplateSelector({ isOpen, onClose, onApply }: PromptTemplateSelectorProps) {
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string | boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const { showToast } = useToast();
  
  if (!isOpen) return null;
  
  // Filter templates based on active tab and search query
  const filteredTemplates = promptTemplates.filter(template => {
    const matchesCategory = activeTab === 'all' || template.category === activeTab;
    const matchesSearch = 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    
    // Get default values for this template including current file content if applicable
    const defaultValues = getTemplateWithCurrentFile(templateId);
    setVariableValues(defaultValues);
  };
  
  const handleVariableChange = (name: string, value: string | boolean) => {
    setVariableValues({
      ...variableValues,
      [name]: value
    });
  };
  
  const handleApplyTemplate = () => {
    if (!selectedTemplate) {
      showToast('Please select a template', 'error');
      return;
    }
    
    const rendered = renderTemplate(selectedTemplate, variableValues);
    
    if (!rendered) {
      showToast('Failed to render template', 'error');
      return;
    }
    
    onApply(rendered.prompt);
    onClose();
  };
  
  const selectedTemplateObject = selectedTemplate ? getTemplateById(selectedTemplate) : null;
  
  const renderTemplateCard = (template: PromptTemplate) => {
    const isSelected = selectedTemplate === template.id;
    
    return (
      <div
        key={template.id}
        className={`border rounded-lg p-4 cursor-pointer transition-all ${
          isSelected 
            ? 'border-primary bg-primary/10 shadow-lg' 
            : 'border-border hover:border-muted-foreground/50'
        }`}
        onClick={() => handleSelectTemplate(template.id)}
      >
        <div className="flex items-start space-x-3">
          <div className="text-2xl mt-1">
            <i className={`fas fa-${template.icon}`}></i>
          </div>
          <div>
            <h3 className="font-medium">{template.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.description}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  const renderVariableEditor = () => {
    if (!selectedTemplateObject) return null;
    
    return (
      <div className="space-y-4 mt-4">
        <h3 className="text-lg font-medium">Customize Template</h3>
        
        {selectedTemplateObject.variables.map(variable => (
          <div key={variable.name} className="space-y-1">
            <label className="block text-sm font-medium">
              {variable.description}
            </label>
            
            {variable.type === 'text' ? (
              <textarea
                value={variableValues[variable.name] as string || ''}
                onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                className="w-full p-2 bg-card border border-border rounded-md min-h-[100px]"
                placeholder={variable.defaultValue}
              />
            ) : variable.type === 'select' ? (
              <select
                value={variableValues[variable.name] as string || ''}
                onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                className="w-full p-2 bg-card border border-border rounded-md"
              >
                {variable.options?.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`var-${variable.name}`}
                  checked={!!variableValues[variable.name]}
                  onChange={(e) => handleVariableChange(variable.name, e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor={`var-${variable.name}`} className="text-sm">
                  {variable.name}
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  const renderPreview = () => {
    if (!selectedTemplate) return null;
    
    const rendered = renderTemplate(selectedTemplate, variableValues);
    
    if (!rendered) return null;
    
    return (
      <div className="space-y-2 mt-6">
        <h3 className="text-lg font-medium">Preview</h3>
        <div className="p-4 bg-card/50 border border-border rounded-md">
          <pre className="whitespace-pre-wrap text-sm">
            {rendered.prompt}
          </pre>
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg w-[95vw] max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold">AI Prompt Templates</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        
        {/* Search bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <i className="fas fa-search text-muted-foreground"></i>
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Category tabs */}
        <div className="flex overflow-x-auto border-b border-border">
          {['all', 'code', 'documentation', 'testing', 'refactoring', 'general'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 whitespace-nowrap font-medium ${
                activeTab === tab 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(tab as CategoryTab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {/* Templates grid */}
          <div className="w-full md:w-1/2 space-y-4">
            <h3 className="text-lg font-medium">Templates</h3>
            
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {filteredTemplates.map(renderTemplateCard)}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="text-4xl text-muted-foreground mb-4">
                  <i className="fas fa-search"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">No templates found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
          
          {/* Right panel: Variable editor and preview */}
          <div className="w-full md:w-1/2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
            {selectedTemplate ? (
              <>
                {renderVariableEditor()}
                {renderPreview()}
              </>
            ) : (
              <div className="text-center py-10">
                <div className="text-4xl text-muted-foreground mb-4">
                  <i className="fas fa-file-alt"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">No template selected</h3>
                <p className="text-muted-foreground">
                  Select a template from the left to customize it
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-md hover:bg-muted mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
          >
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
}

// components/prompts/PromptTemplateButton.tsx
'use client';

import React, { useState } from 'react';
import PromptTemplateSelector from './PromptTemplateSelector';

interface PromptTemplateButtonProps {
  onSelectTemplate: (prompt: string) => void;
}

export default function PromptTemplateButton({ onSelectTemplate }: PromptTemplateButtonProps) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsSelectorOpen(true)}
        className="fixed bottom-48 left-4 z-10 bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        title="AI Prompt Templates"
      >
        <i className="fas fa-lightbulb"></i>
      </button>
      
      <PromptTemplateSelector 
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onApply={onSelectTemplate}
      />
    </>
  );
}