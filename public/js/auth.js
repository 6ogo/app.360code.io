// Auth State Management
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth.js loaded');
    
    // Initialize Supabase Client if not already done
    if (!window.supabaseClient && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
        try {
            console.log('Initializing Supabase from auth.js');
            window.supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
            console.log('Supabase client initialized successfully from auth.js');
        } catch (error) {
            console.error('Failed to initialize Supabase from auth.js:', error);
        }
    } else {
        console.log('Supabase client already initialized or missing credentials');
    }

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
        console.log('Setting up auth page event listeners');
        
        // Tab switching
        if (authTabs && authTabs.length > 0) {
            authTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.getAttribute('data-auth-tab');
                    
                    // Update active tab
                    authTabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    
                    // Show selected content
                    if (tabName === 'signin' && signinTab && signupTab) {
                        signinTab.classList.add('active');
                        signupTab.classList.remove('active');
                    } else if (signinTab && signupTab) {
                        signinTab.classList.remove('active');
                        signupTab.classList.add('active');
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
            googleSignUp.addEventListener('click', () => signInWithProvider('google'));
        }
    }
});

// Initialize Auth Listener
function initializeAuthListener() {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
        console.warn('Supabase client not initialized, cannot set up auth listener');
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
            console.warn('Supabase client not initialized, cannot check session');
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
    
    // Only redirect if necessary to prevent infinite loops
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
    const userMenuInfo = document.getElementById('userMenuInfo');
    const profileButton = document.getElementById('profileButton');
    
    if (userInfo) {
        if (user) {
            userInfo.innerHTML = `
                <p class="user-name">${user.email.split('@')[0]}</p>
                <p class="user-email text-xs text-bolt-elements-textSecondary truncate">${user.email}</p>
            `;
        } else {
            userInfo.innerHTML = `<p>Not signed in</p>`;
        }
    }
    
    if (userMenuInfo && user) {
        userMenuInfo.innerHTML = `<p><strong>${user.email}</strong></p>`;
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
        const activeTab = document.querySelector('.auth-tab.active');
        const tabName = activeTab ? activeTab.getAttribute('data-auth-tab') : 'signin';
        const alertContainer = document.getElementById(`${tabName}Alerts`);
        
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

// Expose necessary functions to window
window.signInWithEmail = signInWithEmail;
window.signUpWithEmail = signUpWithEmail;
window.signInWithProvider = signInWithProvider;
window.signOut = signOut;
window.toggleUserMenu = toggleUserMenu;