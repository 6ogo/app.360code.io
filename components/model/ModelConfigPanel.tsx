// components/model/ModelConfigPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/providers/ToastProvider';
import { models } from '@/lib/.server/llm/model-router';

interface ModelConfigPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

// Model configuration settings
interface ModelSettings {
    modelId: string;
    autoSwitch: boolean;
    temperature: number;
    topP: number;
    topK: number;
    maxTokens: number;
    contextTokens: number;
    systemPromptType: 'default' | 'concise' | 'detailed' | 'custom';
    customSystemPrompt: string;
    costConstraint: number | null;
}

// Default settings
const defaultSettings: ModelSettings = {
    modelId: 'claude-3-haiku',
    temperature: 0.5,
    topP: 0.9,
    systemPromptType: 'default', // Use one of the allowed types
    autoSwitch: false,
    topK: 50,
    maxTokens: 4096,
    contextTokens: 2048,
    customSystemPrompt: '',
    costConstraint: null
};

// Type for storing model usage stats
interface ModelUsageStats {
    model: string;
    requests: number;
    tokensUsed: number;
    estimatedCost: number;
}

export default function ModelConfigPanel({ isOpen, onClose }: ModelConfigPanelProps) {
    const [settings, setSettings] = useState<ModelSettings>(defaultSettings);
    const [activeTab, setActiveTab] = useState<'settings' | 'advanced' | 'usage'>('settings');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isAuto, setIsAuto] = useState(true);
    const [savedPresets, setSavedPresets] = useState<{ name: string; settings: ModelSettings }[]>([]);

    // Sample usage data (in a real app, this would come from an API)
    const [usageStats, setUsageStats] = useState<ModelUsageStats[]>([
        {
            model: 'claude-3-opus',
            requests: 12,
            tokensUsed: 45000,
            estimatedCost: 0.675
        },
        {
            model: 'claude-3-sonnet',
            requests: 35,
            tokensUsed: 120000,
            estimatedCost: 0.36
        },
        {
            model: 'qwen-2.5-coder',
            requests: 67,
            tokensUsed: 180000,
            estimatedCost: 0.162
        },
        {
            model: 'llama3-70b',
            requests: 23,
            tokensUsed: 65000,
            estimatedCost: 0.0585
        },
        {
            model: 'gpt-4-turbo',
            requests: 8,
            tokensUsed: 32000,
            estimatedCost: 0.32
        }
    ]);

    const { showToast } = useToast();

    // Initialize settings from localStorage
    useEffect(() => {
        // Check if presets exist in localStorage
        const storedPresets = localStorage.getItem('modelPresets');
        if (storedPresets) {
            const parsedPresets = JSON.parse(storedPresets);
            setSavedPresets(parsedPresets);
        } else {
            // Create presets with correct type
            const presets: { name: string; settings: ModelSettings }[] = [
                {
                    name: "Concise Coding",
                    settings: {
                        ...defaultSettings,
                        modelId: "claude-3-haiku",
                        temperature: 0.3,
                        topP: 0.7,
                        systemPromptType: "concise" // Use the correct type
                    }
                },
                {
                    name: "Creative Writing",
                    settings: {
                        ...defaultSettings,
                        modelId: "claude-3-opus",
                        temperature: 0.9,
                        topP: 1.0,
                        systemPromptType: "detailed" // Use the correct type
                    }
                },
                {
                    name: "Technical Documentation",
                    settings: {
                        ...defaultSettings,
                        modelId: "claude-3-sonnet",
                        temperature: 0.3,
                        topP: 0.8,
                        systemPromptType: "detailed" // Use the correct type
                    }
                }
            ];
            setSavedPresets(presets);
            localStorage.setItem('modelPresets', JSON.stringify(presets));
        }
        // Set available models from the imported models object
        const modelIds = Object.keys(models);
        setAvailableModels(modelIds);
    }, []);

    // Handle changes to settings
    const handleSettingChange = (key: keyof ModelSettings, value: any) => {
        setSettings({
            ...settings,
            [key]: value
        });
    };

    // Handle auto switch toggle
    const handleAutoSwitchToggle = () => {
        const newValue = !isAuto;
        setIsAuto(newValue);
        handleSettingChange('autoSwitch', newValue);
    };

    // Save settings
    const saveSettings = () => {
        setIsSaving(true);

        try {
            localStorage.setItem('modelSettings', JSON.stringify(settings));
            showToast('Model settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving model settings:', error);
            showToast('Failed to save model settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Reset to defaults
    const resetToDefaults = () => {
        setSettings(defaultSettings);
        setIsAuto(defaultSettings.autoSwitch);
        showToast('Settings reset to defaults', 'info');
    };

    // Save current settings as a preset
    const saveAsPreset = () => {
        const presetName = prompt('Enter a name for this preset:');
        if (!presetName) return;

        const newPreset = {
            name: presetName,
            settings: { ...settings }
        };

        const updatedPresets = [...savedPresets, newPreset];
        setSavedPresets(updatedPresets);

        try {
            localStorage.setItem('modelPresets', JSON.stringify(updatedPresets));
            showToast(`Preset "${presetName}" saved successfully`, 'success');
        } catch (error) {
            console.error('Error saving preset:', error);
            showToast('Failed to save preset', 'error');
        }
    };

    // Load a preset
    const loadPreset = (presetIndex: number) => {
        const preset = savedPresets[presetIndex];
        if (!preset) return;

        setSettings(preset.settings);
        setIsAuto(preset.settings.autoSwitch);
        showToast(`Loaded preset: ${preset.name}`, 'success');
    };

    // Delete a preset
    const deletePreset = (presetIndex: number) => {
        const preset = savedPresets[presetIndex];
        if (!preset) return;

        const confirmed = confirm(`Are you sure you want to delete the preset "${preset.name}"?`);
        if (!confirmed) return;

        const updatedPresets = savedPresets.filter((_, index) => index !== presetIndex);
        setSavedPresets(updatedPresets);

        try {
            localStorage.setItem('modelPresets', JSON.stringify(updatedPresets));
            showToast(`Preset "${preset.name}" deleted`, 'success');
        } catch (error) {
            console.error('Error deleting preset:', error);
            showToast('Failed to delete preset', 'error');
        }
    };

    if (!isOpen) return null;

    // Get the current model info
    const currentModel = models[settings.modelId] || Object.values(models)[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-lg shadow-lg w-[90vw] max-w-3xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-4">
                    <h2 className="text-xl font-semibold">AI Model Configuration</h2>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition"
                    >
                        <i className="fa-solid fa-times"></i>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === 'settings' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Settings
                    </button>
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === 'advanced' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('advanced')}
                    >
                        Advanced
                    </button>
                    <button
                        className={`px-4 py-2 font-medium ${activeTab === 'usage' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
                        onClick={() => setActiveTab('usage')}
                    >
                        Usage Stats
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            {/* Auto-switching toggle */}
                            <div className="flex items-center justify-between p-4 bg-card/50 border border-border rounded-lg">
                                <div>
                                    <h3 className="font-medium">Auto-select Best Model</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically select the best model for each task
                                    </p>
                                </div>
                                <div className="relative inline-block w-12 h-6">
                                    <input
                                        type="checkbox"
                                        className="opacity-0 w-0 h-0"
                                        checked={isAuto}
                                        onChange={handleAutoSwitchToggle}
                                        id="auto-switch"
                                    />
                                    <label
                                        htmlFor="auto-switch"
                                        className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors ${isAuto ? 'bg-primary' : 'bg-muted'
                                            }`}
                                    >
                                        <span
                                            className={`absolute h-5 w-5 left-0.5 bottom-0.5 bg-white rounded-full transition-transform ${isAuto ? 'translate-x-6' : 'translate-x-0'
                                                }`}
                                        ></span>
                                    </label>
                                </div>
                            </div>

                            {/* Model selection (disabled if auto is on) */}
                            <div className={`space-y-2 ${isAuto ? 'opacity-50' : ''}`}>
                                <label className="block text-sm font-medium">Model Selection</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {availableModels.map(modelId => {
                                        const model = models[modelId];
                                        return (
                                            <div
                                                key={modelId}
                                                className={`border rounded-lg p-3 cursor-pointer transition-colors ${!isAuto && settings.modelId === modelId
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border hover:border-muted-foreground/30'
                                                    }`}
                                                onClick={() => {
                                                    if (!isAuto) handleSettingChange('modelId', modelId);
                                                }}
                                            >
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="text-2xl mb-2">
                                                        <i className={`fas fa-${model?.provider === 'anthropic' ? 'brain' : model?.provider === 'groq' ? 'robot' : 'microchip'}`}></i>
                                                    </div>
                                                    <div className="font-medium text-sm">{model?.id.split('-').slice(0, 2).join(' ')}</div>
                                                    <div className="text-xs text-muted-foreground">{model?.provider}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Temperature slider */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium">Temperature</label>
                                    <span className="text-sm text-muted-foreground">{settings.temperature.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={settings.temperature}
                                    onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Precise</span>
                                    <span>Creative</span>
                                </div>
                            </div>

                            {/* Top-P slider */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium">Top-P</label>
                                    <span className="text-sm text-muted-foreground">{settings.topP.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={settings.topP}
                                    onChange={(e) => handleSettingChange('topP', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* System prompt type */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">System Prompt Style</label>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                    {['default', 'concise', 'detailed', 'custom'].map(type => (
                                        <div
                                            key={type}
                                            className={`border rounded-lg p-2 cursor-pointer transition-colors ${settings.systemPromptType === type
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-muted-foreground/30'
                                                }`}
                                            onClick={() => handleSettingChange('systemPromptType', type)}
                                        >
                                            <div className="text-center">
                                                <div className="text-sm font-medium">
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Custom system prompt */}
                            {settings.systemPromptType === 'custom' && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium">Custom System Prompt</label>
                                    <textarea
                                        value={settings.customSystemPrompt}
                                        onChange={(e) => handleSettingChange('customSystemPrompt', e.target.value)}
                                        className="w-full p-2 bg-card border border-border rounded-md min-h-32"
                                        placeholder="Enter your custom system prompt here..."
                                    ></textarea>
                                </div>
                            )}

                            {/* Saved presets */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium">Saved Presets</label>
                                    <button
                                        onClick={saveAsPreset}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Save current as preset
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {savedPresets.length > 0 ? (
                                        savedPresets.map((preset, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 bg-card/30 border border-border rounded"
                                            >
                                                <span className="font-medium">{preset.name}</span>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => loadPreset(index)}
                                                        className="text-primary text-sm hover:text-primary-hover"
                                                        title="Load preset"
                                                    >
                                                        <i className="fas fa-upload"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => deletePreset(index)}
                                                        className="text-red-500 text-sm hover:text-red-700"
                                                        title="Delete preset"
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-muted-foreground italic">
                                            No saved presets
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Advanced Tab */}
                    {activeTab === 'advanced' && (
                        <div className="space-y-6">
                            {/* Current model info */}
                            <div className="bg-card/50 p-4 rounded-lg border border-border">
                                <h3 className="font-medium mb-2">Current Model</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="text-muted-foreground">Model</div>
                                        <div>{currentModel.id}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Provider</div>
                                        <div>{currentModel.provider}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Max Context</div>
                                        <div>{currentModel.maxTokens.toLocaleString()} tokens</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Cost per 1K tokens</div>
                                        <div>${currentModel.costPer1KTokens.toFixed(4)}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Best For</div>
                                        <div>{currentModel.strengths.join(', ')}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Advanced settings */}
                            <div className="space-y-4">
                                <h3 className="font-medium">Advanced Settings</h3>

                                {/* Top-K slider */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium">Top-K</label>
                                        <span className="text-sm text-muted-foreground">{settings.topK}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        step="1"
                                        value={settings.topK}
                                        onChange={(e) => handleSettingChange('topK', parseInt(e.target.value))}
                                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Max tokens slider */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium">Max Output Tokens</label>
                                        <span className="text-sm text-muted-foreground">{settings.maxTokens.toLocaleString()}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1000"
                                        max={currentModel.maxTokens}
                                        step="1000"
                                        value={settings.maxTokens}
                                        onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
                                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Context tokens slider */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium">Context Window</label>
                                        <span className="text-sm text-muted-foreground">{settings.contextTokens.toLocaleString()} tokens</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="4000"
                                        max={currentModel.maxTokens}
                                        step="1000"
                                        value={settings.contextTokens}
                                        onChange={(e) => handleSettingChange('contextTokens', parseInt(e.target.value))}
                                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>

                                {/* Cost constraint */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-medium">Cost Constraint</label>
                                        <span className="text-sm text-muted-foreground">
                                            {settings.costConstraint === null ? 'No limit' : `$${settings.costConstraint.toFixed(4)} per 1K tokens`}
                                        </span>
                                    </div>
                                    <select
                                        value={settings.costConstraint === null ? 'none' : settings.costConstraint.toString()}
                                        onChange={(e) => {
                                            const value = e.target.value === 'none' ? null : parseFloat(e.target.value);
                                            handleSettingChange('costConstraint', value);
                                        }}
                                        className="w-full p-2 bg-card border border-border rounded-md"
                                    >
                                        <option value="none">No cost limit</option>
                                        <option value="0.001">$0.0010 per 1K tokens</option>
                                        <option value="0.002">$0.0020 per 1K tokens</option>
                                        <option value="0.005">$0.0050 per 1K tokens</option>
                                        <option value="0.01">$0.0100 per 1K tokens</option>
                                        <option value="0.02">$0.0200 per 1K tokens</option>
                                    </select>
                                </div>
                            </div>

                            {/* Reset to defaults */}
                            <div className="pt-4">
                                <button
                                    onClick={resetToDefaults}
                                    className="text-sm text-red-500 hover:text-red-700"
                                >
                                    Reset to defaults
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Usage Stats Tab */}
                    {activeTab === 'usage' && (
                        <div className="space-y-6">
                            {/* Summary */}
                            <div className="bg-card/50 p-4 rounded-lg border border-border">
                                <h3 className="font-medium mb-4">Usage Summary</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-muted-foreground text-sm">Total Requests</div>
                                        <div className="text-2xl font-semibold">
                                            {usageStats.reduce((sum, stat) => sum + stat.requests, 0)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-sm">Total Tokens</div>
                                        <div className="text-2xl font-semibold">
                                            {usageStats.reduce((sum, stat) => sum + stat.tokensUsed, 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-sm">Estimated Cost</div>
                                        <div className="text-2xl font-semibold">
                                            ${usageStats.reduce((sum, stat) => sum + stat.estimatedCost, 0).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Usage by model */}
                            <div className="space-y-2">
                                <h3 className="font-medium">Usage by Model</h3>
                                <div className="space-y-3">
                                    {usageStats.map((stat, index) => (
                                        <div key={index} className="p-3 bg-card/30 border border-border rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium">{stat.model}</div>
                                                <div className="text-sm text-muted-foreground">${stat.estimatedCost.toFixed(2)}</div>
                                            </div>
                                            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <span className="text-muted-foreground">Requests:</span>{' '}
                                                    {stat.requests}
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Tokens:</span>{' '}
                                                    {stat.tokensUsed.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{
                                                            width: `${(stat.tokensUsed / usageStats.reduce((sum, s) => sum + s.tokensUsed, 0)) * 100}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Usage disclaimer */}
                            <div className="text-xs text-muted-foreground">
                                <p>Usage statistics are estimates based on available data. Actual costs may vary.</p>
                            </div>
                        </div>
                    )}
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
                        onClick={saveSettings}
                        disabled={isSaving}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}