const SUPABASE_URL     = 'https://oqvedususkjcerxofnze.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lh5UQDSogMpT7OB54wE77Q_Pwuoch1D';
const supabaseClient   = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ─── Route Guard ──────────────────────────────────────────────────────────
   Call await checkAuth() at the top of any protected page script.
   Redirects to auth.html immediately if no active session.
   Returns the user object so page scripts don't need a second getUser() call.
──────────────────────────────────────────────────────────────────────────── */
async function checkAuth() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            window.location.replace('auth.html');
            return null;
        }
        return user;
    } catch (err) {
        console.error('Auth check failed:', err);
        window.location.replace('auth.html');
        return null;
    }
}

/* ─── Navbar session indicator (landing page only) ─────────────────────── */
async function checkUserSession() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const authStatus = document.getElementById('auth-status');
        if (user && authStatus) {
            authStatus.innerHTML = `
                <a href="dashboard.html" class="btn-small">Dashboard</a>
                <button onclick="logout()" class="btn-link">Logout</button>
            `;
        }
    } catch (err) {
        console.error('Session check failed:', err);
    }
}

async function logout() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    // Intentionally NOT clearing offlineSync data here to prevent 
    // losing unsynced local records when logging out.
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
}

/* ─── Global UI Helpers ─────────────────────────────────────────────────── */
window.showToast = function(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';

    toast.innerHTML = `<i class="fas fa-${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    // Trigger reflow for animation
    void toast.offsetWidth;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* ─── PWA & Notifications ─────────────────────────────────────────────────── */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then((registration) => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch((err) => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}

window.requestNotificationPermission = async function() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    return false;
}

window.sendLocalNotification = function(title, options) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options);
    }
}

document.addEventListener('DOMContentLoaded', checkUserSession);