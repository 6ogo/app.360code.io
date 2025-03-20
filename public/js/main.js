// Initialize app and fix critical UI elements
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    
    // Make sure sidebar toggle button is visible and styled properly
    if (sidebarToggle) {
        // Ensure the button is visible and styled correctly
        sidebarToggle.style.display = 'flex';
        sidebarToggle.style.alignItems = 'center';
        sidebarToggle.style.justifyContent = 'center';
        sidebarToggle.style.cursor = 'pointer';
        
        // Add event listener
        sidebarToggle.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Opening sidebar');
            sidebar.classList.add('open');
        });
    }
    
    // Fix for sidebar close button
    if (closeSidebar && sidebar) {
        // Make sure the close button is visible
        closeSidebar.style.display = 'flex';
        
        // Adjust the CSS for better visibility
        closeSidebar.style.position = 'absolute';
        closeSidebar.style.top = '1rem';
        closeSidebar.style.right = '1rem';
        closeSidebar.style.zIndex = '100';
        
        // Clear existing event listeners and add a new one
        closeSidebar.replaceWith(closeSidebar.cloneNode(true));
        
        // Get the fresh reference and add event listener
        const newCloseSidebar = document.getElementById('closeSidebar');
        newCloseSidebar.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Closing sidebar');
            sidebar.classList.remove('open');
        });
    }
    
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
