// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('auth_token');

// Authentication Functions
function switchForm(formType) {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    
    if (formType === 'login') {
        loginSection.classList.add('active');
        registerSection.classList.remove('active');
    } else {
        registerSection.classList.add('active');
        loginSection.classList.remove('active');
    }
}

function setupPasswordToggle(toggleId, inputId) {
    const toggleBtn = document.getElementById(toggleId);
    const passwordInput = document.getElementById(inputId);
    
    if (!toggleBtn || !passwordInput) return;
    
    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
    });
}

// Register Form Handler
const registerForm = document.getElementById('register-form');
if (registerForm) {
    setupPasswordToggle('toggle-reg-password', 'reg-password');
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const errorMsg = document.getElementById('reg-error');
        
        // Clear previous messages
        errorMsg.textContent = '';
        
        if (password.length < 8) {
            errorMsg.textContent = "Password must be at least 8 characters long.";
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token and redirect
                localStorage.setItem('auth_token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                errorMsg.style.color = 'green';
                errorMsg.textContent = "Registration successful! Redirecting...";
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1300);
            } else {
                errorMsg.textContent = data.error || "Registration failed.";
            }
        } catch (error) {
            errorMsg.textContent = "Network error. Please try again.";
            console.error(error);
        }
    });
}

// Login Form Handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
    setupPasswordToggle('toggle-login-password', 'login-password');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const errorMsg = document.getElementById('login-error');
        
        errorMsg.textContent = '';
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('auth_token', data.access_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                errorMsg.textContent = data.error || "Login failed.";
            }
        } catch (error) {
            errorMsg.textContent = "Network error. Please try again.";
            console.error(error);
        }
    });
}

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('auth_token');
    if (!token && window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    }
}

// Logout Function
function logout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Utility API Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('auth_token');
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        console.log(`🔵 API Call: ${method} ${API_BASE_URL}${endpoint}`, data);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        console.log(`📊 Response status: ${response.status}`);
        
        if (response.status === 401) {
            // Token expired or invalid
            console.warn('🔴 Unauthorized - Token expired');
            localStorage.removeItem('auth_token');
            window.location.href = 'index.html';
        }
        
        const responseText = await response.text();
        console.log(`📄 Response body:`, responseText);
        
        try {
            return JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            return { error: 'Invalid JSON response: ' + responseText };
        }
    } catch (error) {
        console.error('❌ Network Error:', error);
        return { error: 'Network error: ' + error.message };
    }
}

async function uploadFile(endpoint, file, additionalData = {}) {
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional form data
    for (const key in additionalData) {
        formData.append(key, additionalData[key]);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        return await response.json();
    } catch (error) {
        console.error('Upload Error:', error);
        return { error: 'Upload failed' };
    }
}

// PWA Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/service-worker.js').catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
