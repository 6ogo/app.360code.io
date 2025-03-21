'use client';

import React, { useState, useRef } from 'react';
import { useToast } from '@/components/providers/ToastProvider';
import { processVideoForContext, VideoAnalysisResult, VideoFrame, ScreenRegion } from '@/lib/video/contextProcessor';

interface VideoUploaderProps {
  onAnalysisComplete?: (result: VideoAnalysisResult) => void;
}

export default function VideoContextUploader({ onAnalysisComplete }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<VideoFrame | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };
  
  const handleFile = (file: File) => {
    // Check if file is a video
    if (!file.type.startsWith('video/')) {
      showToast('Please upload a video file', 'error');
      return;
    }
    
    setVideoFile(file);
    processVideo(file);
  };
  
  const processVideo = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);
      
      // Process video
      const result = await processVideoForContext(file);
      
      // Set to 100% when done
      clearInterval(progressInterval);
      setProgress(100);
      
      // Set analysis result
      setAnalysisResult(result);
      
      // Set first frame as selected
      if (result.frames.length > 0) {
        setSelectedFrame(result.frames[0]);
      }
      
      // Notify parent component
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
      
      showToast('Video analysis complete', 'success');
    } catch (error) {
      console.error('Error processing video:', error);
      showToast('Failed to process video', 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const renderRegionOverlay = (region: ScreenRegion) => {
    // Set color based on region type
    let borderColor = 'rgba(255, 0, 0, 0.8)'; // Default red
    
    switch (region.type) {
      case 'button':
        borderColor = 'rgba(0, 0, 255, 0.8)'; // Blue
        break;
      case 'text':
        borderColor = 'rgba(0, 255, 0, 0.8)'; // Green
        break;
      case 'image':
        borderColor = 'rgba(255, 165, 0, 0.8)'; // Orange
        break;
      case 'panel':
        borderColor = 'rgba(128, 0, 128, 0.8)'; // Purple
        break;
    }
    
    return (
      <div
        key={region.id}
        className="absolute border-2 flex items-center justify-center"
        style={{
          left: `${region.x}px`,
          top: `${region.y}px`,
          width: `${region.width}px`,
          height: `${region.height}px`,
          borderColor,
          backgroundColor: `${borderColor.replace('0.8', '0.1')}`,
        }}
      >
        <span className="text-xs font-bold px-1 py-0.5 bg-background rounded text-foreground">
          {region.type}{region.text ? `: ${region.text}` : ''}
        </span>
      </div>
    );
  };
  
  return (
    <div className="w-full">
      {!videoFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-primary bg-primary/10' : 'border-border'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="video/*"
            className="hidden"
          />
          <div className="text-4xl mb-4">
            <i className="fas fa-video"></i>
          </div>
          <p className="text-lg font-medium mb-2">
            Upload a Video for Context Analysis
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Drop a video file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Max file size: 100MB • Supported formats: MP4, WebM, MOV
          </p>
        </div>
      ) : isProcessing ? (
        <div className="p-8 bg-card border border-border rounded-lg">
          <div className="mb-4">
            <p className="text-lg font-medium mb-2">Processing Video</p>
            <p className="text-sm text-muted-foreground">
              Analyzing video for UI elements and context...
            </p>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-right text-xs text-muted-foreground">{progress}%</p>
        </div>
      ) : analysisResult ? (
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Video Analysis Result</h3>
              <p className="text-sm text-muted-foreground">
                {analysisResult.frames.length} frames analyzed,{' '}
                {analysisResult.regions.length} UI elements detected
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary-hover"
                onClick={() => {
                  setVideoFile(null);
                  setAnalysisResult(null);
                  setSelectedFrame(null);
                }}
              >
                Upload New Video
              </button>
              <button
                className="px-2 py-1 text-xs border border-border rounded hover:bg-muted"
                onClick={() => setShowOverlay(!showOverlay)}
              >
                {showOverlay ? 'Hide' : 'Show'} Elements
              </button>
            </div>
          </div>
          
          {/* Frame selector */}
          <div className="mb-4 overflow-x-auto">
            <div className="flex space-x-2">
              {analysisResult.frames.map((frame, index) => (
                <div
                  key={`frame-${index}`}
                  className={`cursor-pointer border-2 rounded overflow-hidden ${
                    selectedFrame === frame ? 'border-primary' : 'border-border'
                  }`}
                  onClick={() => setSelectedFrame(frame)}
                >
                  <img
                    src={frame.dataUrl}
                    alt={`Frame ${index + 1}`}
                    className="w-24 h-auto object-contain"
                  />
                  <div className="text-xs text-center py-1 bg-card">
                    {frame.timestamp.toFixed(1)}s
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Selected frame with detected regions */}
          {selectedFrame && (
            <div className="relative border border-border rounded overflow-hidden">
              <img
                src={selectedFrame.dataUrl}
                alt="Selected frame"
                className="w-full h-auto"
              />
              
              {showOverlay &&
                analysisResult.regions
                  .filter(region => {
                    // Only show regions for this frame
                    // In a real implementation, you'd have frame IDs or timestamps to match
                    return true;
                  })
                  .map(region => renderRegionOverlay(region))}
            </div>
          )}
          
          {/* Element summary */}
          <div className="mt-4 p-3 bg-muted/30 rounded">
            <h4 className="text-sm font-medium mb-2">Detected Elements</h4>
            <div className="flex flex-wrap gap-3">
              <div className="px-3 py-1.5 bg-blue-500/10 text-xs rounded border border-blue-500/20">
                <span className="font-medium">Buttons:</span> {analysisResult.detectedElements.buttons}
              </div>
              <div className="px-3 py-1.5 bg-green-500/10 text-xs rounded border border-green-500/20">
                <span className="font-medium">Text:</span> {analysisResult.detectedElements.textFields}
              </div>
              <div className="px-3 py-1.5 bg-orange-500/10 text-xs rounded border border-orange-500/20">
                <span className="font-medium">Images:</span> {analysisResult.detectedElements.images}
              </div>
              <div className="px-3 py-1.5 bg-purple-500/10 text-xs rounded border border-purple-500/20">
                <span className="font-medium">Panels:</span> {analysisResult.detectedElements.panels}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}