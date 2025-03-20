// Global type declarations for the application

// Add custom properties to Window interface
interface Window {
  // Supabase client instance
  supabaseClient?: any;
  
  // API base URL
  API_BASE_URL?: string;
  
  // Function to initialize the app
  initializeApp?: () => void;
}

// Declare any global variables used in the application
declare const supabase: any;
