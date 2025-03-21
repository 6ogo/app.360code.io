// lib/wasm/wasmLoader.ts
/**
 * WebAssembly module loader utility for 360code.io
 */

// Types for different WebAssembly modules
export type WasmModuleType = 'image' | 'pathfinding' | 'physics';

// Create a base type for custom WASM exports that avoids the index signature constraint
type WasmExportValue = WebAssembly.ExportValue | WebAssembly.Global | number;

// Base interface for our custom WASM exports
interface CustomWasmExports {
  [key: string]: WasmExportValue;
  memory: WebAssembly.Memory;
}

// Interface for image processing WASM module
export interface ImageProcessingWasmExports extends CustomWasmExports {
  __heap_base: number | WebAssembly.Global;
  grayscale: (width: number, height: number, inputPtr: number, outputPtr: number) => void;
  blur: (width: number, height: number, radius: number, inputPtr: number, outputPtr: number) => void;
  sharpen: (width: number, height: number, inputPtr: number, outputPtr: number) => void;
  edgeDetect: (width: number, height: number, inputPtr: number, outputPtr: number) => void;
}

// Interface for pathfinding WASM module
export interface PathfindingWasmExports extends CustomWasmExports {
  __heap_base: number | WebAssembly.Global;
  astar: (
    width: number, 
    height: number, 
    gridPtr: number, 
    startX: number, 
    startY: number, 
    endX: number, 
    endY: number, 
    resultPtr: number
  ) => number;
}

// Interface for physics WASM module
export interface PhysicsWasmExports extends CustomWasmExports {
  __heap_base: number | WebAssembly.Global;
  simulate: (
    numBodies: number, 
    bodiesPtr: number, 
    dt: number, 
    iterations: number
  ) => void;
}

// Map of cached modules
const moduleCache: Map<WasmModuleType, WebAssembly.Module> = new Map();
const instanceCache: Map<WasmModuleType, WebAssembly.Instance> = new Map();

/**
 * Load a WebAssembly module
 * @param type The type of module to load
 * @param customUrl Optional URL for a custom module
 */
export async function loadWasmModule<T extends CustomWasmExports>(
  type: WasmModuleType,
  customUrl?: string
): Promise<T> {
  // If we have a cached instance, return its exports
  if (instanceCache.has(type)) {
    return instanceCache.get(type)!.exports as unknown as T;
  }
  
  // If we have a cached module but no instance, instantiate it
  if (moduleCache.has(type)) {
    const instance = await WebAssembly.instantiate(moduleCache.get(type)!);
    instanceCache.set(type, instance);
    return instance.exports as unknown as T;
  }
  
  // Determine the URL based on the module type
  let url = customUrl || '/wasm/';
  if (!customUrl) {
    switch (type) {
      case 'image':
        url += 'image_processing.wasm';
        break;
      case 'pathfinding':
        url += 'pathfinding.wasm';
        break;
      case 'physics':
        url += 'physics.wasm';
        break;
    }
  }
  
  try {
    // Fetch and compile the module
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const module = await WebAssembly.compile(buffer);
    
    // Cache the module
    moduleCache.set(type, module);
    
    // Instantiate the module
    const instance = await WebAssembly.instantiate(module);
    
    // Cache the instance
    instanceCache.set(type, instance);
    
    // Use double cast to bypass TypeScript's type checking
    return instance.exports as unknown as T;
  } catch (error) {
    console.error(`Error loading WebAssembly module '${type}':`, error);
    throw error;
  }
}

/**
 * Clear the module cache
 */
export function clearWasmCache(): void {
  moduleCache.clear();
  instanceCache.clear();
}

/**
 * Helper function to get heap base value from WASM exports
 */
function getHeapBase(exports: CustomWasmExports & { __heap_base: number | WebAssembly.Global }): number {
  const heapBase = exports.__heap_base;
  
  if (heapBase === undefined) {
    throw new Error('__heap_base is not defined in WebAssembly exports');
  }
  
  // Handle both number and WebAssembly.Global types
  if (typeof heapBase === 'number') {
    return heapBase;
  } else if (heapBase instanceof WebAssembly.Global) {
    return heapBase.valueOf() as number;
  } else {
    // Fallback for other cases
    throw new Error('Invalid __heap_base type');
  }
}

/**
 * Helper function to create a memory buffer in the WASM heap
 */
export function createWasmBuffer(
  memory: WebAssembly.Memory, 
  heapBase: number, 
  size: number
): {
  ptr: number;
  buffer: Uint8Array;
} {
  const ptr = heapBase;
  const buffer = new Uint8Array(memory.buffer, ptr, size);
  return { ptr, buffer };
}

// Sample implementations of common WebAssembly-powered functions

/**
 * Process an image using WebAssembly
 */
export async function processImage(
  imageData: ImageData,
  operation: 'grayscale' | 'blur' | 'sharpen' | 'edgeDetect',
  params?: { radius?: number }
): Promise<ImageData> {
  try {
    const wasmExports = await loadWasmModule<ImageProcessingWasmExports>('image');
    
    // Create input and output buffers
    const dataSize = imageData.data.length;
    const { memory } = wasmExports;
    const heapBase = getHeapBase(wasmExports);
    
    // Expand memory if needed
    const requiredPages = Math.ceil((dataSize * 2 + heapBase) / (64 * 1024));
    const currentPages = memory.buffer.byteLength / (64 * 1024);
    
    if (requiredPages > currentPages) {
      memory.grow(requiredPages - currentPages);
    }
    
    // Create input buffer
    const inputPtr = heapBase;
    const inputBuffer = new Uint8ClampedArray(memory.buffer, inputPtr, dataSize);
    inputBuffer.set(imageData.data);
    
    // Create output buffer
    const outputPtr = inputPtr + dataSize;
    
    // Call appropriate function based on operation
    switch (operation) {
      case 'grayscale':
        wasmExports.grayscale(imageData.width, imageData.height, inputPtr, outputPtr);
        break;
      case 'blur':
        wasmExports.blur(
          imageData.width, 
          imageData.height, 
          params?.radius || 5, 
          inputPtr, 
          outputPtr
        );
        break;
      case 'sharpen':
        wasmExports.sharpen(imageData.width, imageData.height, inputPtr, outputPtr);
        break;
      case 'edgeDetect':
        wasmExports.edgeDetect(imageData.width, imageData.height, inputPtr, outputPtr);
        break;
    }
    
    // Extract results
    const resultData = new Uint8ClampedArray(memory.buffer, outputPtr, dataSize);
    return new ImageData(resultData, imageData.width, imageData.height);
  } catch (error) {
    console.error(`Error processing image with ${operation}:`, error);
    
    // Return original image on error
    return imageData;
  }
}

/**
 * Find a path using A* algorithm in WebAssembly
 */
export async function findPath(
  grid: number[],
  width: number,
  height: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): Promise<number[]> {
  try {
    const wasmExports = await loadWasmModule<PathfindingWasmExports>('pathfinding');
    
    // Calculate required memory
    const gridSize = width * height;
    const resultSize = gridSize; // Maximum possible path length
    const totalSize = gridSize + resultSize;
    
    // Set up memory
    const { memory } = wasmExports;
    const heapBase = getHeapBase(wasmExports);
    
    // Expand memory if needed
    const requiredBytes = heapBase + totalSize * 4; // 4 bytes per int
    const requiredPages = Math.ceil(requiredBytes / (64 * 1024));
    const currentPages = memory.buffer.byteLength / (64 * 1024);
    
    if (requiredPages > currentPages) {
      memory.grow(requiredPages - currentPages);
    }
    
    // Create grid buffer
    const gridPtr = heapBase;
    const gridBuffer = new Int32Array(memory.buffer, gridPtr, gridSize);
    gridBuffer.set(grid);
    
    // Create result buffer
    const resultPtr = gridPtr + gridSize * 4;
    
    // Run A* algorithm
    const pathLength = wasmExports.astar(
      width, height, gridPtr, startX, startY, endX, endY, resultPtr
    );
    
    // Extract path
    const resultBuffer = new Int32Array(memory.buffer, resultPtr, pathLength);
    return Array.from(resultBuffer);
  } catch (error) {
    console.error('Error finding path:', error);
    
    // Return empty path on error
    return [];
  }
}

/**
 * Run physics simulation using WebAssembly
 */
export async function runPhysicsSimulation(
  bodies: { x: number; y: number; vx: number; vy: number; mass: number }[],
  deltaTime: number,
  iterations: number
): Promise<{ x: number; y: number; vx: number; vy: number; mass: number }[]> {
  try {
    const wasmExports = await loadWasmModule<PhysicsWasmExports>('physics');
    
    // Calculate required memory
    const bodiesSize = bodies.length * 5 * 4; // 5 float32 values per body, 4 bytes each
    
    // Set up memory
    const { memory } = wasmExports;
    const heapBase = getHeapBase(wasmExports);
    
    // Expand memory if needed
    const requiredBytes = heapBase + bodiesSize;
    const requiredPages = Math.ceil(requiredBytes / (64 * 1024));
    const currentPages = memory.buffer.byteLength / (64 * 1024);
    
    if (requiredPages > currentPages) {
      memory.grow(requiredPages - currentPages);
    }
    
    // Create bodies buffer
    const bodiesPtr = heapBase;
    const bodiesBuffer = new Float32Array(memory.buffer, bodiesPtr, bodies.length * 5);
    
    // Fill buffer with body data
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      const offset = i * 5;
      bodiesBuffer[offset] = body.x;
      bodiesBuffer[offset + 1] = body.y;
      bodiesBuffer[offset + 2] = body.vx;
      bodiesBuffer[offset + 3] = body.vy;
      bodiesBuffer[offset + 4] = body.mass;
    }
    
    // Run simulation
    wasmExports.simulate(bodies.length, bodiesPtr, deltaTime, iterations);
    
    // Extract updated bodies
    const result = [];
    for (let i = 0; i < bodies.length; i++) {
      const offset = i * 5;
      result.push({
        x: bodiesBuffer[offset],
        y: bodiesBuffer[offset + 1],
        vx: bodiesBuffer[offset + 2],
        vy: bodiesBuffer[offset + 3],
        mass: bodiesBuffer[offset + 4]
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error running physics simulation:', error);
    
    // Return original bodies on error
    return [...bodies];
  }
}