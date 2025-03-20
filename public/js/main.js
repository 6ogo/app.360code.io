// Initialize global API configuration
document.addEventListener('DOMContentLoaded', function() {
    console.log('360code.io application initializing...');
    
    // Check if any elements aren't available
    const checkElements = ['sidebar', 'sidebarToggle', 'closeSidebar', 'promptElement', 'sendButton'];
    const missingElements = checkElements.filter(id => !document.getElementById(id));
    if (missingElements.length) {
      console.warn('Missing DOM elements:', missingElements);
    }
    
    // Fix for sidebar close button
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    if (closeSidebar && sidebar) {
      closeSidebar.addEventListener('click', function() {
        console.log('Closing sidebar');
        sidebar.classList.remove('open');
      });
    }
    
    // Fix for modal toggle
    const projectViewModal = document.getElementById('projectViewModal');
    const closeModalButton = document.getElementById('closeModalButton');
    if (closeModalButton && projectViewModal) {
      closeModalButton.addEventListener('click', function() {
        console.log('Closing modal');
        projectViewModal.classList.remove('visible');
      });
    }
    
    // Make sure the app is initialized
    if (typeof window.initializeApp === 'function') {
      console.log('Initializing app directly');
      window.initializeApp();
    } else {
      console.log('Waiting for app initialization...');
      // Wait for index.js to load fully
      window.addEventListener('load', function() {
        if (typeof window.initializeApp === 'function') {
          window.initializeApp();
        } else if (typeof initializeApp === 'function') {
          initializeApp();
        } else {
          console.error('Could not find initialization function');
        }
      });
    }
  });