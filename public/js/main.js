// Initialize app and fix critical UI elements
document.addEventListener('DOMContentLoaded', function() {
    console.log('360code.io application initializing...');
    
    // Update the prompt textarea with instruction text
    const promptElement = document.getElementById('prompt');
    if (promptElement) {
        promptElement.placeholder = "Describe what you want to build... (Press Enter to send, Shift+Enter for new line)";
        
        // Set up textarea auto-resize
        promptElement.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });

        // Make sure the Enter key works as expected
        promptElement.addEventListener('keydown', function(e) {
            // We'll let the main script handle the actual code generation
            // Just preventing default behavior for Enter key (but not for Shift+Enter)
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
            }
        });
    }
    
    // Fix for sidebar close button
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    if (closeSidebar && sidebar) {
        // Update the X button style
        closeSidebar.className = 'close-sidebar-btn';
        closeSidebar.innerHTML = '<i class="fas fa-times"></i>';
        
        // Add the event listener
        closeSidebar.addEventListener('click', function() {
            console.log('Closing sidebar');
            sidebar.classList.remove('open');
        });
    }
    
    // Fix for modal close button
    const projectViewModal = document.getElementById('projectViewModal');
    const closeModalButton = document.getElementById('closeModalButton');
    if (closeModalButton && projectViewModal) {
        closeModalButton.addEventListener('click', function() {
            console.log('Closing modal');
            projectViewModal.classList.remove('visible');
        });
    }
    
    // Add extra CSS styles for fixing UI issues
    const style = document.createElement('style');
    style.textContent = `
        /* Improved close button styling */
        .close-sidebar-btn {
            color: hsl(var(--muted-foreground));
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.25rem;
            position: absolute;
            top: 1rem;
            right: 1rem;
            transition: color 0.2s;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius);
        }
        
        .close-sidebar-btn:hover {
            color: hsl(var(--foreground));
            background-color: hsla(var(--muted) / 0.2);
        }
        
        /* Make sure send button is visible and clickable */
        .send-button {
            z-index: 10;
            color: hsl(var(--primary));
            transition: transform 0.2s, color 0.2s;
        }
        
        .send-button:hover {
            transform: scale(1.1);
            color: hsl(var(--primary-foreground));
        }
        
        /* Fix any modal visibility issues */
        .modal-overlay.visible {
            opacity: 1;
            visibility: visible;
            display: flex;
        }
    `;
    document.head.appendChild(style);
    
    console.log('UI enhancements applied');
});