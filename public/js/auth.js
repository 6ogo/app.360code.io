// public/js/auth.js

// Auth State Management
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Supabase Auth Listener
    initializeAuthListener();

    // Check if we're on the auth page or main app
    const isAuthPage = window.location.pathname.includes('/auth');
    
    // Elements that exist on all pages
    const userMenuContainer = document.getElementById('userMenuContainer');
    
    // Auth page specific elements
    const authForm = document.getElementById('authForm');
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
            googleSignUp.addEventListener('click', () => signInWithProvider('google'));
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

// Initialize Auth Listener
function initializeAuthListener() {
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('Supabase client not initialized');
        return;
    }
    
    // Check current session
    checkSession();
    
    // Set up auth state change listener
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state change:', event);
        
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            updateUIWithUser(currentUser);
            redirectIfNeeded(true);
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
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
        const supabase = window.supabaseClient;
        if (!supabase) {
            console.error('Supabase client not initialized');
            return;
        }
        
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (data.session) {
            currentUser = data.session.user;
            updateUIWithUser(currentUser);
            redirectIfNeeded(true);
        } else {
            redirectIfNeeded(false);
        }
    } catch (error) {
        console.error('Error checking session:', error);
        redirectIfNeeded(false);
    }
}

// Redirect based on auth state
function redirectIfNeeded(isAuthenticated) {
    const isAuthPage = window.location.pathname.includes('/auth');
    
    if (isAuthenticated && isAuthPage) {
        // User is authenticated and on auth page, redirect to app
        window.location.href = '/';
    } else if (!isAuthenticated && !isAuthPage) {
        // User is not authenticated and not on auth page, redirect to auth
        window.location.href = '/auth';
    }
}

// Sign in with email and password
async function signInWithEmail(email, password) {
    try {
        const supabase = window.supabaseClient;
        if (!supabase) {
            showAlert('Supabase client not initialized');
            return;
        }
        
        const signinButton = document.querySelector('#signinForm button[type="submit"]');
        if (signinButton) {
            signinButton.disabled = true;
            signinButton.innerHTML = 'Signing in...';
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        // No need to redirect here, as the auth listener will handle it
        showAlert('Signed in successfully!', 'success');
        
    } catch (error) {
        console.error('Error signing in:', error);
        showAlert(`Sign in failed: ${error.message}`);
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
        const supabase = window.supabaseClient;
        if (!supabase) {
            showAlert('Supabase client not initialized');
            return;
        }
        
        const signupButton = document.querySelector('#signupForm button[type="submit"]');
        if (signupButton) {
            signupButton.disabled = true;
            signupButton.innerHTML = 'Signing up...';
        }
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (error) throw error;
        
        if (data.user && !data.user.confirmed_at) {
            // Email confirmation required
            showAlert('Please check your email to confirm your account.', 'success');
        } else {
            // Auto sign-in (if email confirmation is not required)
            showAlert('Account created successfully!', 'success');
        }
        
    } catch (error) {
        console.error('Error signing up:', error);
        showAlert(`Sign up failed: ${error.message}`);
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
        const supabase = window.supabaseClient;
        if (!supabase) {
            showAlert('Supabase client not initialized');
            return;
        }
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        
        if (error) throw error;
        
        // OAuth will redirect so no need to update UI here
        
    } catch (error) {
        console.error(`Error signing in with ${provider}:`, error);
        showAlert(`${provider} sign in failed: ${error.message}`);
    }
}

// Sign out
async function signOut() {
    try {
        const supabase = window.supabaseClient;
        if (!supabase) {
            showAlert('Supabase client not initialized');
            return;
        }
        
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        
        // No need to redirect here, as the auth listener will handle it
        showAlert('Signed out successfully!', 'success');
        
    } catch (error) {
        console.error('Error signing out:', error);
        showAlert(`Sign out failed: ${error.message}`);
    }
}

// Update UI with user info
function updateUIWithUser(user) {
    if (!user) return;
    
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.innerHTML = `
            <p><strong>${user.email || 'User'}</strong></p>
            <p class="user-id">ID: ${user.id.substring(0, 8)}...</p>
        `;
    }
}

// Toggle user menu
function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu) {
        if (userMenu.style.display === 'none' || !userMenu.style.display) {
            userMenu.style.display = 'block';
        } else {
            userMenu.style.display = 'none';
        }
    }
}

// Show alert
function showAlert(message, type = 'error') {
    // Create alert container if it doesn't exist
    let alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        alertContainer.style.position = 'fixed';
        alertContainer.style.top = '20px';
        alertContainer.style.right = '20px';
        alertContainer.style.zIndex = '9999';
        document.body.appendChild(alertContainer);
    }
    
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    alertElement.style.padding = '12px 16px';
    alertElement.style.margin = '0 0 10px 0';
    alertElement.style.borderRadius = '4px';
    alertElement.style.color = 'white';
    alertElement.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
    alertElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    alertElement.style.transition = 'all 0.3s ease';
    alertElement.style.opacity = '0';
    alertElement.style.transform = 'translateX(20px)';
    alertElement.textContent = message;
    
    // Add to container
    alertContainer.appendChild(alertElement);
    
    // Show with animation
    setTimeout(() => {
        alertElement.style.opacity = '1';
        alertElement.style.transform = 'translateX(0)';
    }, 10);
    
    // Hide and remove after timeout
    setTimeout(() => {
        alertElement.style.opacity = '0';
        alertElement.style.transform = 'translateX(20px)';
        setTimeout(() => {
            alertContainer.removeChild(alertElement);
        }, 300);
    }, 5000);
}