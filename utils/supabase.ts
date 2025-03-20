import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Make this file a module
export {};

// Extend the Window interface to include our custom properties
declare global {
  interface Window {
    supabaseClient: SupabaseClient | null;
  }
}

// Use NEXT_PUBLIC_ prefix for client-side access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create and export the Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl && 
    supabaseKey && 
    supabaseUrl !== '__SUPABASE_URL__' && 
    supabaseKey !== '__SUPABASE_ANON_KEY__'
  );
}

// Initialize Supabase and make it available globally
export function initializeSupabase(): void {
  try {
    // Make the Supabase client available on the window object for global access
    window.supabaseClient = supabase;
    
    if (isSupabaseConfigured()) {
      console.log('Supabase initialized successfully');
    } else {
      console.warn('Supabase credentials not available, will use localStorage for storage');
    }
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
  }
}