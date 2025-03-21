// components/analytics/AnalyticsDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { calculateProjectStats, formatBytes, ProjectStats } from '@/lib/analytics/projectAnalytics';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define chart colors
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FF6B6B', '#6A6AFF', '#FFD166', '#06D6A0'
];

export default function AnalyticsDashboard({ isOpen, onClose }: AnalyticsDashboardProps) {
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'performance' | 'dependencies'>('overview');
  
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      // Calculate stats
      const projectStats = calculateProjectStats();
      setStats(projectStats);
      setIsLoading(false);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  // Prepare data for charts
  const fileTypeData = stats ? Object.entries(stats.filesByType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count
  })) : [];
  
  const fileSizeData = stats ? Object.entries(stats.sizeByType).map(([type, size]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: size
  })) : [];
  
  const historyData = stats ? stats.history.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(),
    files: entry.files,
    size: entry.size / 1024 // Convert to KB for better visualization
  })) : [];
  
  const dependenciesData = stats ? stats.dependencies
    .slice(0, 10) // Top 10 dependencies by size
    .map(dep => ({
      name: dep.name,
      size: dep.size / 1024 // Convert to KB
    })) : [];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg w-[95vw] max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold">Project Analytics</h2>
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
            className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'files' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('files')}
          >
            Files
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'performance' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('performance')}
          >
            Performance
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'dependencies' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('dependencies')}
          >
            Dependencies
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : stats ? (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Key stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="text-sm text-muted-foreground mb-1">Total Files</h3>
                      <p className="text-2xl font-semibold">{stats.totalFiles}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="text-sm text-muted-foreground mb-1">Total Size</h3>
                      <p className="text-2xl font-semibold">{formatBytes(stats.totalSize)}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="text-sm text-muted-foreground mb-1">Total Lines</h3>
                      <p className="text-2xl font-semibold">{stats.totalLines.toLocaleString()}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="text-sm text-muted-foreground mb-1">File Types</h3>
                      <p className="text-2xl font-semibold">{Object.keys(stats.filesByType).length}</p>
                    </div>
                  </div>
                  
                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Project growth chart */}
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-4">Project Growth</h3>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={historyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                              formatter={(value: any) => [value, 'Files']}
                              contentStyle={{ background: '#1f1f1f', border: '1px solid #333' }}
                            />
                            <Line type="monotone" dataKey="files" stroke="#8884d8" activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* File size chart */}
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-4">Size by File Type</h3>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={fileSizeData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {fileSizeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: any) => [formatBytes(value), 'Size']}
                              contentStyle={{ background: '#1f1f1f', border: '1px solid #333' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance stats */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-4">Performance Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <h4 className="text-xs text-muted-foreground mb-1">Estimated Bundle Size</h4>
                        <p className="text-lg font-medium">{formatBytes(stats.performance.estimatedBundleSize)}</p>
                      </div>
                      <div>
                        <h4 className="text-xs text-muted-foreground mb-1">Estimated Load Time</h4>
                        <p className="text-lg font-medium">{stats.performance.estimatedLoadTime}s</p>
                      </div>
                      <div>
                        <h4 className="text-xs text-muted-foreground mb-1">Complexity Score</h4>
                        <p className="text-lg font-medium">{stats.performance.complexityScore}</p>
                      </div>
                      <div>
                        <h4 className="text-xs text-muted-foreground mb-1">Maintainability Index</h4>
                        <p className="text-lg font-medium">{stats.performance.maintainabilityIndex}/100</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Files Tab */}
              {activeTab === 'files' && (
                <div className="space-y-6">
                  {/* File type distribution */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-4">File Type Distribution</h3>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={fileTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {fileTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => [`${value} files`, 'Count']}
                            contentStyle={{ background: '#1f1f1f', border: '1px solid #333' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Largest files */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-4">Largest Files</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-border">
                          <tr>
                            <th className="text-left py-2 px-4">File</th>
                            <th className="text-left py-2 px-4">Type</th>
                            <th className="text-right py-2 px-4">Size</th>
                            <th className="text-right py-2 px-4">Lines</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.largestFiles.map((file, index) => (
                            <tr key={index} className="border-b border-border last:border-b-0">
                              <td className="py-2 px-4 font-mono text-sm truncate max-w-xs">
                                {file.path}
                              </td>
                              <td className="py-2 px-4">{file.type}</td>
                              <td className="py-2 px-4 text-right">{formatBytes(file.size)}</td>
                              <td className="py-2 px-4 text-right">{file.lines}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Most complex files */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-4">Most Complex Files</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-border">
                          <tr>
                            <th className="text-left py-2 px-4">File</th>
                            <th className="text-left py-2 px-4">Type</th>
                            <th className="text-right py-2 px-4">Lines</th>
                            <th className="text-right py-2 px-4">Size</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.mostComplexFiles.map((file, index) => (
                            <tr key={index} className="border-b border-border last:border-b-0">
                              <td className="py-2 px-4 font-mono text-sm truncate max-w-xs">
                                {file.path}
                              </td>
                              <td className="py-2 px-4">{file.type}</td>
                              <td className="py-2 px-4 text-right">{file.lines}</td>
                              <td className="py-2 px-4 text-right">{formatBytes(file.size)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Performance Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  {/* Performance metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-4">Bundle Size</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold">
                            {formatBytes(stats.performance.estimatedBundleSize)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Estimated bundle size</p>
                        </div>
                        <div className={`text-4xl ${
                          stats.performance.estimatedBundleSize < 500000 
                            ? 'text-green-500' 
                            : stats.performance.estimatedBundleSize < 1000000 
                              ? 'text-yellow-500' 
                              : 'text-red-500'
                        }`}>
                          <i className={`fas fa-${
                            stats.performance.estimatedBundleSize < 500000 
                              ? 'check-circle' 
                              : stats.performance.estimatedBundleSize < 1000000 
                                ? 'exclamation-circle' 
                                : 'times-circle'
                          }`}></i>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-4">Load Time</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold">
                            {stats.performance.estimatedLoadTime}s
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Estimated load time</p>
                        </div>
                        <div className={`text-4xl ${
                          stats.performance.estimatedLoadTime < 3 
                            ? 'text-green-500' 
                            : stats.performance.estimatedLoadTime < 5 
                              ? 'text-yellow-500' 
                              : 'text-red-500'
                        }`}>
                          <i className={`fas fa-${
                            stats.performance.estimatedLoadTime < 3 
                              ? 'check-circle' 
                              : stats.performance.estimatedLoadTime < 5 
                                ? 'exclamation-circle' 
                                : 'times-circle'
                          }`}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Complexity metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-4">Code Complexity</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold">
                            {stats.performance.complexityScore}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Average lines per file</p>
                        </div>
                        <div className={`text-4xl ${
                          stats.performance.complexityScore < 100 
                            ? 'text-green-500' 
                            : stats.performance.complexityScore < 300 
                              ? 'text-yellow-500' 
                              : 'text-red-500'
                        }`}>
                          <i className={`fas fa-${
                            stats.performance.complexityScore < 100 
                              ? 'check-circle' 
                              : stats.performance.complexityScore < 300 
                                ? 'exclamation-circle' 
                                : 'times-circle'
                          }`}></i>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="text-sm font-medium mb-4">Maintainability</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold">
                            {stats.performance.maintainabilityIndex}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">Maintainability index (0-100)</p>
                        </div>
                        <div className={`text-4xl ${
                          stats.performance.maintainabilityIndex > 70 
                            ? 'text-green-500' 
                            : stats.performance.maintainabilityIndex > 50 
                              ? 'text-yellow-500' 
                              : 'text-red-500'
                        }`}>
                          <i className={`fas fa-${
                            stats.performance.maintainabilityIndex > 70 
                              ? 'check-circle' 
                              : stats.performance.maintainabilityIndex > 50 
                                ? 'exclamation-circle' 
                                : 'times-circle'
                          }`}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Size history chart */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-4">Size Growth Over Time</h3>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value: any) => [formatBytes(value * 1024), 'Size']}
                            contentStyle={{ background: '#1f1f1f', border: '1px solid #333' }}
                          />
                          <Line type="monotone" dataKey="size" stroke="#00C49F" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Dependencies Tab */}
              {activeTab === 'dependencies' && (
                <div className="space-y-6">
                  {/* Dependency stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="text-sm text-muted-foreground mb-1">Total Dependencies</h3>
                      <p className="text-2xl font-semibold">{stats.dependencies.length}</p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="text-sm text-muted-foreground mb-1">Total Size</h3>
                      <p className="text-2xl font-semibold">
                        {formatBytes(stats.dependencies.reduce((total, dep) => total + dep.size, 0))}
                      </p>
                    </div>
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="text-sm text-muted-foreground mb-1">Average Size</h3>
                      <p className="text-2xl font-semibold">
                        {formatBytes(stats.dependencies.reduce((total, dep) => total + dep.size, 0) / 
                          Math.max(1, stats.dependencies.length))}
                      </p>
                    </div>
                  </div>
                  
                  {/* Dependency size chart */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-4">Top Dependencies by Size</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dependenciesData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                        >
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                          <Tooltip 
                            formatter={(value: any) => [formatBytes(value * 1024), 'Size']}
                            contentStyle={{ background: '#1f1f1f', border: '1px solid #333' }}
                          />
                          <Bar dataKey="size" fill="#8884d8">
                            {dependenciesData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Dependency list */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-4">All Dependencies</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-border">
                          <tr>
                            <th className="text-left py-2 px-4">Name</th>
                            <th className="text-left py-2 px-4">Version</th>
                            <th className="text-right py-2 px-4">Size</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.dependencies.map((dep, index) => (
                            <tr key={index} className="border-b border-border last:border-b-0">
                              <td className="py-2 px-4 font-mono text-sm">
                                {dep.name}
                              </td>
                              <td className="py-2 px-4">{dep.version}</td>
                              <td className="py-2 px-4 text-right">{formatBytes(dep.size)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl text-muted-foreground mb-4">
                  <i className="fas fa-chart-pie"></i>
                </div>
                <h3 className="text-lg font-medium mb-2">No project data available</h3>
                <p className="text-muted-foreground">
                  Please create or load a project to view analytics
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}