// Add custom properties to Window interface
interface Window {
    supabaseClient?: any;
    initializeApp?: () => void;
  }
  
  // Declare any global variables used in the application
  declare const supabase: any;