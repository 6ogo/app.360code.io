'use client';

import React, { useState } from 'react';
import { useToast } from '@/components/providers/ToastProvider';
import { 
  projectTemplates, 
  applyTemplate,
  ProjectTemplate
} from '@/lib/templates/templateManager';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryTab = 'all' | 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'ai' | 'game';

export default function TemplateSelector({ isOpen, onClose }: TemplateSelectorProps) {
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { showToast } = useToast();
  
  if (!isOpen) return null;
  
  // Filter templates based on active tab and search query
  const filteredTemplates = projectTemplates.filter(template => {
    const matchesCategory = activeTab === 'all' || template.category === activeTab;
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
  
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
  };
  
  const handleApplyTemplate = async () => {
    if (!selectedTemplate) {
      showToast('Please select a template', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await applyTemplate(selectedTemplate);
      
      if (success) {
        showToast('Template applied successfully', 'success');
        onClose();
      } else {
        showToast('Failed to apply template', 'error');
      }
    } catch (error) {
      console.error('Error applying template:', error);
      showToast('An error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderTemplateCard = (template: ProjectTemplate) => {
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
            <i className={`fab fa-${template.icon}`}></i>
          </div>
          <div>
            <h3 className="font-medium">{template.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {template.category}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                {template.dependencies.length + template.devDependencies.length} dependencies
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg w-[90vw] max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold">Start from a Template</h2>
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
          {['all', 'frontend', 'backend', 'fullstack', 'mobile', 'ai', 'game'].map((tab) => (
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
        
        {/* Templates grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        
        {/* Template details (if selected) */}
        {selectedTemplate && (
          <div className="border-t border-border p-4 bg-muted/20">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">
                  {projectTemplates.find(t => t.id === selectedTemplate)?.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {projectTemplates.find(t => t.id === selectedTemplate)?.description}
                </p>
              </div>
              <button
                onClick={handleApplyTemplate}
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
              >
                {isLoading ? 'Applying...' : 'Use This Template'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}