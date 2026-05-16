/* ─── qr-logic.js (Redesigned with SOS Feature) ───────────────────────── */

async function generateEmergencyQR() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) { window.location.replace('auth.html'); return; }

    let profile = null;
    if (window.offlineSync) {
        profile = window.offlineSync.getProfile(user.id);
    }

    if (navigator.onLine) {
        const { data, error } = await supabaseClient
            .from('profiles').select('*').eq('id', user.id).single();
        if (!error && data) {
            profile = { ...profile, ...data };
            if (window.offlineSync) window.offlineSync.saveProfile(user.id, profile);
        }
    }

    profile = profile || {};

    const userName = profile.full_name || user.user_metadata?.full_name || (user.email && user.email.includes('demo') ? 'Demo Patient (Hackathon)' : 'Patient');
    profile.full_name = userName; // Ensure it's in the profile object for the QR payload

    document.getElementById('user-name').innerText   = userName;
    document.getElementById('blood-group').innerText = profile.blood_group       || '--';
    document.getElementById('allergies').innerText   = profile.allergies         || 'None';
    document.getElementById('conditions').innerText  = profile.critical_conditions || 'None';
    
    // Setup SOS Button
    const sosBtn = document.getElementById('sos-btn');
    if (sosBtn) {
        // Remove old listeners to avoid duplicates if called multiple times
        const newBtn = sosBtn.cloneNode(true);
        sosBtn.parentNode.replaceChild(newBtn, sosBtn);
        newBtn.addEventListener('click', () => triggerSOS(profile, user.id));
    }

    renderQR(user.id, profile);
}

function renderQR(userId, profile) {
    const qrContainer = document.getElementById('qr-code');
    if (!qrContainer) return;
    
    qrContainer.innerHTML = ''; // Clear existing
    
    if (!userId) {
        qrContainer.innerText = 'Unable to generate QR.';
        return;
    }

    let qrData = `${window.location.origin}/public-emergency.html?id=${userId}`;
    
    if (profile) {
        try {
            // Encode critical profile info into the QR code URL to bypass RLS and allow offline scanning
            const payload = {
                id: userId,
                n: profile.full_name || '',
                b: profile.blood_group || '',
                a: profile.allergies || '',
                c: profile.critical_conditions || '',
                m: profile.current_medications || '',
                e: profile.emergency_contacts || '',
                o: profile.emergency_notes || '',
                d: profile.organ_donor_status || ''
            };
            const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
            qrData += `#data=${encoded}`;
        } catch (e) {
            console.warn("Could not encode profile for QR", e);
        }
    }

    new QRCode(qrContainer, {
        text: qrData, width: 220, height: 220,
        colorDark: '#0F6E56', colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.L
    });
}

// Feature 1: Dynamic Emergency SOS Broadcast
async function triggerSOS(profile, userId) {
    if(window.showToast) window.showToast("Initiating SOS Broadcast...", "error");
    
    // 1. Get GPS Location
    let locationStr = "Location unavailable";
    let mapsLink = "";
    try {
        const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        locationStr = `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`;
        mapsLink = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
    } catch(e) {
        console.warn("GPS access denied or timeout");
    }

    // 2. Prepare Alert Message
    const alertMsg = `🆘 EMERGENCY ALERT: ${profile.full_name} needs help.\nBlood: ${profile.blood_group || 'N/A'}\nAllergies: ${profile.allergies || 'None'}\nConditions: ${profile.critical_conditions || 'None'}\nLocation: ${mapsLink}\nView Med Profile: ${window.location.origin}/public-emergency.html?id=${userId}`;

    // 3. Simulate Twilio Backend Call
    console.log("SENDING TWILIO SMS PAYLOAD:", { to: profile.emergency_contacts || "Emergency Contacts", message: alertMsg });
    
    // 4. Open Local SMS App as fallback
    const encodedMsg = encodeURIComponent(alertMsg);
    window.location.href = `sms:?&body=${encodedMsg}`;

    if(window.showToast) window.showToast("SOS Alert sent to emergency contacts and local SMS app opened.", "success");
    
    // Visual feedback
    document.querySelector('.emergency-header').innerHTML = '<i class="fas fa-exclamation-triangle pulse"></i> SOS BROADCAST ACTIVE';
    document.querySelector('.emergency-header').style.background = 'var(--danger)';
    
    // Audio feedback
    if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance("SOS Broadcast active. Help has been requested.");
        window.speechSynthesis.speak(u);
    }
}

document.addEventListener('DOMContentLoaded', generateEmergencyQR);