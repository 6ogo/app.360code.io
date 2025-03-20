// Initialize app and handle UI interactions
document.addEventListener('DOMContentLoaded', function () {
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

    // Example: Modal toggle (if you have a button to open it)
    const modalOverlay = document.querySelector('.modal-overlay');
    const openModalBtn = document.querySelector('.new-project-btn'); // Adjust selector as needed
    const closeModalBtn = document.querySelector('.close-modal');

    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            modalOverlay.classList.add('visible');
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            modalOverlay.classList.remove('visible');
        });
    }
});