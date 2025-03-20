// public/js/auth.js

// Auth State Management
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase Client
    initializeSupabase();

    // Initialize Supabase Auth Listener
    initializeAuthListener();

    // Check if we're on the auth page or main app
    const isAuthPage = window.location.pathname.includes('/auth');
    
    // Elements that exist on all pages
    const userMenuContainer = document.getElementById('userMenuContainer');
    
    // Auth page specific elements
    const authTabs = document.querySelectorAll('[data-auth-tab]');
    const signinTab = document.getElementById('signinTab');
    const signupTab = document.getElementById('signupTab');
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    const githubSignIn = document.getElementById('githubSignIn');
    const googleSignIn = document.getElementById('googleSignIn');
    const githubSignUp = document.getElementById('githubSignUp');
    const googleSignUp = document.getElementById('googleSignUp');
    
    // Add event listeners for auth page
    if (isAuthPage) {
        // Tab switching
        if (authTabs) {
            authTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.getAttribute('data-auth-tab');
                    
                    // Update active tab
                    authTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    // Show selected content
                    if (tabName === 'signin') {
                        signinTab.style.display = 'block';
                        signupTab.style.display = 'none';
                    } else {
                        signinTab.style.display = 'none';
                        signupTab.style.display = 'block';
                    }
                });
            });
        }
        
        // Form submissions
        if (signinForm) {
            signinForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('signinEmail').value;
                const password = document.getElementById('signinPassword').value;
                await signInWithEmail(email, password);
            });
        }
        
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('signupEmail').value;
                const password = document.getElementById('signupPassword').value;
                await signUpWithEmail(email, password);
            });
        }
        
        // Social auth buttons
        if (githubSignIn) {
            githubSignIn.addEventListener('click', () => signInWithProvider('github'));
        }
        
        if (googleSignIn) {
            googleSignIn.addEventListener('click', () => signInWithProvider('google'));
        }
        
        if (githubSignUp) {
            githubSignUp.addEventListener('click', () => signInWithProvider('github'));
        }
        
        if (googleSignUp) {
            googleSignUp.addEventListener('click', () => signInWithProvider('github'));
        }
    }
    
    // Add user profile button to topbar for main app page
    if (!isAuthPage) {
        const topbarActions = document.querySelector('.topbar-actions');
        if (topbarActions && !document.getElementById('profileButton')) {
            // Create profile button
            const profileButton = document.createElement('button');
            profileButton.id = 'profileButton';
            profileButton.className = 'profile-button';
            profileButton.innerHTML = '<i class="fas fa-user"></i>';
            profileButton.addEventListener('click', toggleUserMenu);
            
            // Create user menu dropdown
            const userMenu = document.createElement('div');
            userMenu.id = 'userMenu';
            userMenu.className = 'user-menu';
            userMenu.style.display = 'none';
            userMenu.innerHTML = `
                <div id="userInfo" class="user-info">
                    <p>Loading...</p>
                </div>
                <button id="signOutButton" class="menu-item">Sign Out</button>
            `;
            
            topbarActions.appendChild(profileButton);
            document.querySelector('.topbar').appendChild(userMenu);
            
            // Set up sign out button
            document.getElementById('signOutButton').addEventListener('click', async () => {
                await signOut();
                toggleUserMenu();
            });
        }
    }
});

// Initialize Supabase Client
function initializeSupabase() {
    // Check if the client is already initialized
    if (window.supabaseClient) {
        return;
    }
    
    try {
        // Get credentials from the window object - these are injected by the server
        const supabaseUrl = window.SUPABASE_URL;
        const supabaseKey = window.SUPABASE_ANON_KEY;
        
        // Only initialize if we have real values
        if (supabaseUrl && supabaseKey && 
            supabaseUrl !== '' && supabaseKey !== '') {
            console.log('Initializing Supabase client with window variables');
            window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
            console.log('Supabase client initialized successfully');
        } else {
            console.error('Missing Supabase credentials for initialization');
            showAlert('Authentication service unavailable. Please try again later or contact support.', 'error');
        }
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        showAlert('Failed to initialize authentication. Please refresh the page or try again later.', 'error');
    }
}

// Initialize Auth Listener
function initializeAuthListener() {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
        console.error('Supabase client not initialized');
        return;
    }
    
    // Check current session
    checkSession();
    
    // Set up auth state change listener
    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change:', event);
        
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            updateUIWithUser(currentUser);
            redirectIfNeeded(true);
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateUIWithUser(null);
            redirectIfNeeded(false);
        } else if (event === 'USER_UPDATED') {
            currentUser = session.user;
            updateUIWithUser(currentUser);
        }
    });
}

// Check current session
async function checkSession() {
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }
        
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        
        if (data && data.session) {
            currentUser = data.session.user;
            updateUIWithUser(currentUser);
            redirectIfNeeded(true);
        } else {
            updateUIWithUser(null);
            redirectIfNeeded(false);
        }
    } catch (error) {
        console.error('Error checking session:', error);
        updateUIWithUser(null);
        redirectIfNeeded(false);
    }
}

// Redirect based on auth state
function redirectIfNeeded(isAuthenticated) {
    const isAuthPage = window.location.pathname.includes('/auth');
    
    // Note: Only redirect if necessary to prevent infinite loops
    if (isAuthenticated && isAuthPage) {
        // User is authenticated and on auth page, redirect to app
        window.location.href = '/';
    }
    // The redirect for unauthenticated users is handled by the index.html auth check
}

// Sign in with email and password
async function signInWithEmail(email, password) {
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            showAlert('Authentication service unavailable. Please try again later.', 'error');
            return;
        }
        
        const signinButton = document.querySelector('#signinForm button[type="submit"]');
        if (signinButton) {
            signinButton.disabled = true;
            signinButton.innerHTML = '<div class="spinner"></div> Signing in...';
        }
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // Update currentUser
        currentUser = data.user;
        
        // Show success message
        showAlert('Signed in successfully', 'success');
        
        // Redirect to main app
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    } catch (error) {
        console.error('Error signing in:', error);
        showAlert(error.message || 'Failed to sign in', 'error');
    } finally {
        const signinButton = document.querySelector('#signinForm button[type="submit"]');
        if (signinButton) {
            signinButton.disabled = false;
            signinButton.innerHTML = 'Sign In';
        }
    }
}

// Sign up with email and password
async function signUpWithEmail(email, password) {
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            showAlert('Authentication service unavailable. Please try again later.', 'error');
            return;
        }
        
        const signupButton = document.querySelector('#signupForm button[type="submit"]');
        if (signupButton) {
            signupButton.disabled = true;
            signupButton.innerHTML = '<div class="spinner"></div> Signing up...';
        }
        
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        // Show success message or confirmation message depending on email confirmation settings
        if (data.user && data.user.id) {
            showAlert('Account created successfully', 'success');
            
            // If email confirmation is required
            if (data.session === null) {
                showAlert('Please check your email to confirm your account', 'info');
            } else {
                // Auto sign in
                currentUser = data.user;
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            }
        }
    } catch (error) {
        console.error('Error signing up:', error);
        showAlert(error.message || 'Failed to create account', 'error');
    } finally {
        const signupButton = document.querySelector('#signupForm button[type="submit"]');
        if (signupButton) {
            signupButton.disabled = false;
            signupButton.innerHTML = 'Sign Up';
        }
    }
}

// Sign in with third-party provider
async function signInWithProvider(provider) {
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            showAlert('Authentication service unavailable. Please try again later.', 'error');
            return;
        }
        
        // Disable all social login buttons
        document.querySelectorAll('.social-button').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.7';
            btn.style.cursor = 'not-allowed';
        });
        
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: window.location.origin + '/auth/callback'
            }
        });
        
        if (error) throw error;
        
        // The page will be redirected by Supabase OAuth flow
    } catch (error) {
        console.error(`Error signing in with ${provider}:`, error);
        showAlert(error.message || `Failed to sign in with ${provider}`, 'error');
        
        // Re-enable social login buttons
        document.querySelectorAll('.social-button').forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
    }
}

// Sign out
async function signOut() {
    try {
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) {
            showAlert('Authentication service unavailable. Please try again later.', 'error');
            return;
        }
        
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        
        // Clear current user
        currentUser = null;
        
        // Show success message
        showAlert('Signed out successfully', 'success');
        
        // Redirect to auth page
        setTimeout(() => {
            window.location.href = '/auth';
        }, 500);
    } catch (error) {
        console.error('Error signing out:', error);
        showAlert(error.message || 'Failed to sign out', 'error');
    }
}

// Update UI with user info
function updateUIWithUser(user) {
    const userInfo = document.getElementById('userInfo');
    const profileButton = document.getElementById('profileButton');
    
    if (userInfo) {
        if (user) {
            userInfo.innerHTML = `
                <p class="user-email">${user.email || 'User'}</p>
                <p class="user-id">ID: ${user.id.substring(0, 8)}...</p>
            `;
        } else {
            userInfo.innerHTML = `<p>Not signed in</p>`;
        }
    }
    
    if (profileButton) {
        profileButton.style.display = user ? 'flex' : 'none';
    }
}

// Toggle user menu
function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (!userMenu) return;
    
    const isVisible = userMenu.style.display === 'block';
    userMenu.style.display = isVisible ? 'none' : 'block';
    
    // Add click outside listener if opening
    if (!isVisible) {
        setTimeout(() => {
            document.addEventListener('click', closeMenuOnClickOutside);
        }, 10);
    }
}

// Close menu when clicking outside
function closeMenuOnClickOutside(e) {
    const userMenu = document.getElementById('userMenu');
    const profileButton = document.getElementById('profileButton');
    
    if (!userMenu || !profileButton) return;
    
    if (!userMenu.contains(e.target) && !profileButton.contains(e.target)) {
        userMenu.style.display = 'none';
        document.removeEventListener('click', closeMenuOnClickOutside);
    }
}

// Show alert
function showAlert(message, type = 'error') {
    // Determine which container to use based on the current page
    const isAuthPage = window.location.pathname.includes('/auth');
    
    if (isAuthPage) {
        // On auth page, show alert in the appropriate container
        const alertContainer = type === 'error' ? 
            document.getElementById('signinAlerts') || document.getElementById('signupAlerts') : 
            document.getElementById('signinAlerts') || document.getElementById('signupAlerts');
        
        if (alertContainer) {
            const alert = document.createElement('div');
            alert.className = `alert alert-${type}`;
            alert.innerHTML = message;
            
            alertContainer.innerHTML = ''; // Clear previous alerts
            alertContainer.appendChild(alert);
            
            // Auto-remove after delay
            setTimeout(() => {
                if (alertContainer.contains(alert)) {
                    alertContainer.removeChild(alert);
                }
            }, 5000);
        }
    } else {
        // On main app, use the toast system
        const toastContainer = document.getElementById('toastContainer');
        if (toastContainer) {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.innerHTML = `
                <div class="flex items-center gap-2">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                    <div>${message}</div>
                </div>
            `;
            
            toastContainer.appendChild(toast);
            
            // Auto-remove after delay
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 5000);
        }
    }
}