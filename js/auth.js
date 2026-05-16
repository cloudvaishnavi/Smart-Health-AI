/* ─── Input Sanitization Helper ─────────────────────────────────────────── */
function sanitizeText(str) {
    return String(str).trim().replace(/<[^>]*>/g, '').substring(0, 500);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ─── Auth Handler ───────────────────────────────────────────────────────── */
let isLogin = false;

async function handleAuth(e) {
    e.preventDefault();

    const emailRaw    = document.getElementById('email').value;
    const passwordRaw = document.getElementById('password').value;
    const roleVal     = document.getElementById('role')?.value || 'patient';
    const fullNameRaw = document.getElementById('full_name')?.value || '';
    const lang        = document.getElementById('language')?.value  || 'English';
    const ageRaw      = document.getElementById('age')?.value || null;
    const bpRaw       = document.getElementById('blood_pressure')?.value || '';
    const hrRaw       = document.getElementById('heart_rate')?.value || null;
    const bsRaw       = document.getElementById('blood_sugar')?.value || null;

    /* ── Validation ── */
    const email    = emailRaw.trim();
    const password = passwordRaw;
    const fullName = sanitizeText(fullNameRaw);
    const age      = ageRaw ? parseInt(ageRaw, 10) : null;
    const bp       = sanitizeText(bpRaw);
    const hr       = hrRaw ? parseInt(hrRaw, 10) : null;
    const bs       = bsRaw ? parseInt(bsRaw, 10) : null;

    if (!isValidEmail(email)) {
        showFormError('Please enter a valid email address.'); return;
    }
    if (password.length < 8) {
        showFormError('Password must be at least 8 characters.'); return;
    }
    if (!isLogin && fullName.length < 2) {
        showFormError('Please enter your full name.'); return;
    }

    const authBtn = document.getElementById('auth-btn');
    authBtn.disabled  = true;
    authBtn.innerText = isLogin ? 'Logging in…' : 'Registering…';
    clearFormError();

    if (isLogin) {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) { showFormError(error.message); resetBtn(authBtn, 'Login'); return; }
        window.location.href = 'dashboard.html';
    } else {
        const { data, error } = await supabaseClient.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });
        if (error) { showFormError(error.message); resetBtn(authBtn, 'Register'); return; }
        if (data.user) {
            await supabaseClient.from('profiles').insert([
                { 
                    id: data.user.id, 
                    role: roleVal,
                    full_name: fullName, 
                    primary_language: lang,
                    age: age,
                    blood_pressure: bp,
                    heart_rate: hr,
                    blood_sugar: bs
                }
            ]);
            showFormError('Registration successful! Check your email to verify your account.', 'success');
        }
        resetBtn(authBtn, 'Register');
    }
}

async function demoLogin() {
    const email = "demo@smarthealth.ai";
    const password = "password123";
    
    const btn = document.getElementById('demo-btn');
    if(btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading Hackathon Demo...'; }
    
    // First try to sign in
    const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    if (signInError) {
        // If demo account doesn't exist, create it on the fly
        console.log("Demo account not found, creating it...");
        const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({ email, password });
        if(signUpError) {
            showFormError("Demo login failed: " + signUpError.message);
            if(btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> Demo Hackathon Login'; }
            return;
        }
        if(signUpData.user) {
            await supabaseClient.from('profiles').insert([
                { 
                    id: signUpData.user.id, 
                    role: 'patient',
                    full_name: "Demo Patient (Hackathon)", 
                    primary_language: "English",
                    age: 45,
                    blood_pressure: "145/90",
                    heart_rate: 88,
                    blood_sugar: 155,
                    blood_group: "O+",
                    allergies: "Penicillin, Peanuts",
                    critical_conditions: "Hypertension, Type 2 Diabetes"
                }
            ]);
        }
    }
    
    window.location.href = 'dashboard.html';
}

function showFormError(msg, type = 'error') {
    let el = document.getElementById('form-message');
    if (!el) {
        el = document.createElement('p');
        el.id = 'form-message';
        document.getElementById('auth-form').prepend(el);
    }
    el.textContent = msg;
    el.style.color  = type === 'success' ? 'var(--success)' : 'var(--danger)';
    el.style.marginBottom = '1rem';
    el.style.fontSize = '0.9rem';
}

function clearFormError() {
    const el = document.getElementById('form-message');
    if (el) el.textContent = '';
}

function resetBtn(btn, label) {
    btn.disabled  = false;
    btn.innerText = label;
}

function toggleAuthMode() {
    isLogin = !isLogin;
    document.getElementById('auth-title').innerText    = isLogin ? 'User Login'        : 'User Registration';
    document.getElementById('additional-fields').style.display = isLogin ? 'none' : 'block';
    document.getElementById('auth-btn').innerText      = isLogin ? 'Login'           : 'Register';
    document.getElementById('toggle-text').innerText   = isLogin
        ? "Don't have an account? Register"
        : "Already have an account? Login";
    clearFormError();
}

document.getElementById('auth-form').addEventListener('submit', handleAuth);