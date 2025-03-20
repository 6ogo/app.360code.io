// Initialize app and fix critical UI elements
document.addEventListener('DOMContentLoaded', function() {    

    // Add CSS for improved sidebar toggle behavior
    const style = document.createElement('style');
    style.textContent = `
        /* Improved sidebar behavior */
        .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
        }
        
        .sidebar.open {
            transform: translateX(0);
        }
        
        /* Better toggle button styling */
        #sidebarToggle {
            background: none;
            border: none;
            color: hsl(var(--foreground));
            font-size: 1.25rem;
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 50%;
            transition: background-color 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #sidebarToggle:hover {
            background-color: hsla(var(--secondary) / 0.2);
        }
        
        /* On desktop, keep sidebar visible and main content adjusted */
        @media (min-width: 769px) {
            .sidebar {
                transform: translateX(0);
            }
            
            .main-content {
                margin-left: 280px;
            }
        }
        
        /* On mobile, hide sidebar by default and overlay when open */
        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
                z-index: 100;
            }
            
            .sidebar.open {
                transform: translateX(0);
            }
            
            .main-content {
                margin-left: 0;
            }
            
            #sidebarToggle {
                display: flex;
            }
        }
    `;
    document.head.appendChild(style);
});
