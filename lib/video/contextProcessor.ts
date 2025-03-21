// lib/video/contextProcessor.ts
import { projectStore } from '@/lib/stores/projectContext';

export interface VideoFrame {
  timestamp: number;
  dataUrl: string;
  width: number;
  height: number;
}

export interface ScreenRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'button' | 'text' | 'image' | 'panel' | 'unknown';
  confidence: number;
  text?: string;
}

export interface VideoAnalysisResult {
  frames: VideoFrame[];
  regions: ScreenRegion[];
  detectedElements: {
    buttons: number;
    textFields: number;
    images: number;
    panels: number;
  };
  summary: string;
}

interface RegionDetectionOptions {
  minConfidence?: number;
  maxRegions?: number;
  regionTypes?: string[];
}

/**
 * Captures frames from a video for context analysis
 */
export async function captureVideoFrames(
  videoFile: File,
  frameCount: number = 5
): Promise<VideoFrame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const duration = video.duration;
      const interval = duration / (frameCount + 1);
      const frames: VideoFrame[] = [];
      let framesProcessed = 0;
      
      // Create canvas for frame extraction
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Extract frames at regular intervals
      const extractFrame = (time: number) => {
        video.currentTime = time;
      };
      
      video.onseeked = () => {
        if (!ctx) return;
        
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw frame on canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Add frame to results
        frames.push({
          timestamp: video.currentTime,
          dataUrl,
          width: canvas.width,
          height: canvas.height
        });
        
        framesProcessed++;
        
        // Check if we're done
        if (framesProcessed < frameCount) {
          extractFrame((framesProcessed + 1) * interval);
        } else {
          resolve(frames);
        }
      };
      
      // Start extracting frames
      extractFrame(interval);
    };
    
    video.onerror = (e) => {
      reject(new Error(`Video loading error: ${e}`));
    };
    
    // Load the video
    video.src = URL.createObjectURL(videoFile);
  });
}

/**
 * Mock function for UI element detection (in production this would use ML/AI)
 */
export function detectRegions(
  frame: VideoFrame,
  options: RegionDetectionOptions = {}
): ScreenRegion[] {
  // In a real implementation, this would call an ML service
  // This is just a placeholder to demonstrate the API design
  
  const mockRegions: ScreenRegion[] = [
    {
      id: `button-${Date.now()}-1`,
      x: Math.floor(frame.width * 0.1),
      y: Math.floor(frame.height * 0.8),
      width: 120,
      height: 40,
      type: 'button',
      confidence: 0.92,
      text: 'Start Game'
    },
    {
      id: `text-${Date.now()}-1`,
      x: Math.floor(frame.width * 0.5 - 100),
      y: Math.floor(frame.height * 0.1),
      width: 200,
      height: 60,
      type: 'text',
      confidence: 0.98,
      text: 'Game Title'
    },
    {
      id: `panel-${Date.now()}-1`,
      x: Math.floor(frame.width * 0.7),
      y: Math.floor(frame.height * 0.2),
      width: Math.floor(frame.width * 0.25),
      height: Math.floor(frame.height * 0.6),
      type: 'panel',
      confidence: 0.85
    }
  ];
  
  // Apply confidence filter
  const minConfidence = options.minConfidence || 0.7;
  let filtered = mockRegions.filter(region => region.confidence >= minConfidence);
  
  // Apply type filter
  if (options.regionTypes && options.regionTypes.length > 0) {
    filtered = filtered.filter(region => options.regionTypes!.includes(region.type));
  }
  
  // Limit number of regions
  if (options.maxRegions && filtered.length > options.maxRegions) {
    filtered = filtered.slice(0, options.maxRegions);
  }
  
  return filtered;
}

/**
 * Process video file to extract context for AI analysis
 */
export async function processVideoForContext(videoFile: File): Promise<VideoAnalysisResult> {
  try {
    // Capture frames from the video
    const frames = await captureVideoFrames(videoFile);
    
    // Analyze each frame for UI elements
    const allRegions: ScreenRegion[] = [];
    
    for (const frame of frames) {
      const regions = detectRegions(frame);
      allRegions.push(...regions);
    }
    
    // Count detected elements by type
    const detectedElements = {
      buttons: allRegions.filter(r => r.type === 'button').length,
      textFields: allRegions.filter(r => r.type === 'text').length,
      images: allRegions.filter(r => r.type === 'image').length,
      panels: allRegions.filter(r => r.type === 'panel').length
    };
    
    // Generate a summary
    const summary = `Video analysis detected ${allRegions.length} UI elements across ${frames.length} frames: 
    - ${detectedElements.buttons} buttons
    - ${detectedElements.textFields} text elements
    - ${detectedElements.images} images
    - ${detectedElements.panels} panels`;
    
    // Update project context with this analysis
    const project = projectStore.get();
    projectStore.set({
      ...project,
      description: project.description 
        ? `${project.description}\n\nVideo context: ${summary}` 
        : `Video context: ${summary}`
    });
    
    return {
      frames,
      regions: allRegions,
      detectedElements,
      summary
    };
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
}
