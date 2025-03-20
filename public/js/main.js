// Initialize app and handle UI interactions
document.addEventListener('DOMContentLoaded', function () {
    console.log('main.js loaded');
    
    // Sidebar toggle for mobile
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('#sidebarToggle');
    const closeSidebar = document.querySelector('#closeSidebar');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // Modal toggle (if you have a button to open it)
    const modalOverlay = document.querySelector('.modal-overlay');
    const closeModalBtn = document.querySelector('.close-modal');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            const modalOverlay = closeModalBtn.closest('.modal-overlay');
            if (modalOverlay) {
                modalOverlay.classList.remove('visible');
            }
        });
    }
    
    // User menu toggle
    const profileButton = document.getElementById('profileButton');
    const userMenu = document.getElementById('userMenu');
    
    if (profileButton && userMenu) {
        profileButton.addEventListener('click', () => {
            const isVisible = userMenu.style.display === 'block';
            userMenu.style.display = isVisible ? 'none' : 'block';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            if (profileButton && userMenu &&
                !profileButton.contains(event.target) &&
                !userMenu.contains(event.target)) {
                userMenu.style.display = 'none';
            }
        });
    }
    
    // Model selection
    const modelSelect = document.getElementById('modelSelect');
    if (modelSelect) {
        modelSelect.addEventListener('change', () => {
            console.log('Model changed to:', modelSelect.value);
        });
    }
    
    // Temperature slider
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    if (temperatureSlider && temperatureValue) {
        temperatureSlider.addEventListener('input', () => {
            temperatureValue.textContent = temperatureSlider.value;
        });
    }
    
    // New project button
    const newChatButton = document.getElementById('newChatButton');
    if (newChatButton && typeof startNewChat === 'function') {
        newChatButton.addEventListener('click', startNewChat);
    }
});