// Feature 2: AI Health Risk + Drug Interaction Checker

// Helper to calculate age from a hardcoded birth year or profile age if available
function getAge(userData) {
    if (userData.age) return parseInt(userData.age, 10);
    return 35; // Default for demo
}

// Helper to parse blood pressure
function getSystolicBP(userData) {
    if (userData.blood_pressure) {
        const parts = String(userData.blood_pressure).split('/');
        if (parts.length > 0) return parseInt(parts[0], 10);
    }
    return 120; // Default healthy systolic
}

// Exported globally for OCR scanner to use
window.checkDrugInteractions = async function(newDrugString) {
    try {
        const res = await fetch('models/drug-interactions.json');
        const db = await res.json();
        
        // Fetch user's current prescriptions
        const { data: { user } } = await supabaseClient.auth.getUser();
        if(!user) return;
        
        const { data: records } = await supabaseClient
            .from('medical_records')
            .select('prescription')
            .eq('user_id', user.id);
            
        let currentMeds = [];
        if (records) {
            records.forEach(r => {
                if (r.prescription) currentMeds.push(r.prescription.toLowerCase());
            });
        }
        
        const currentMedsString = currentMeds.join(' ');
        const newDrugWords = newDrugString.toLowerCase().split(/\s+/);
        
        let foundInteraction = false;
        
        db.forEach(interaction => {
            const d1 = interaction.drug1.toLowerCase();
            const d2 = interaction.drug2.toLowerCase();
            
            // Check if one drug is in new meds and the other in current meds
            const newHasD1 = newDrugWords.some(w => w.includes(d1));
            const newHasD2 = newDrugWords.some(w => w.includes(d2));
            const currentHasD1 = currentMedsString.includes(d1);
            const currentHasD2 = currentMedsString.includes(d2);
            
            if ((newHasD1 && currentHasD2) || (newHasD2 && currentHasD1)) {
                foundInteraction = true;
                if(window.showToast) {
                    window.showToast(`⚠️ Interaction Alert: ${interaction.drug1} + ${interaction.drug2}. ${interaction.description}`, "error");
                }
                
                // Add to UI if on AI Insights page
                const interactionContainer = document.getElementById('interaction-warnings');
                if (interactionContainer) {
                    interactionContainer.innerHTML += `
                        <div class="interaction-card">
                            <strong><i class="fas fa-exclamation-triangle"></i> ${interaction.severity} Risk</strong>
                            <p>${interaction.drug1} + ${interaction.drug2}: ${interaction.description}</p>
                        </div>
                    `;
                }
            }
        });
        
        if (!foundInteraction && window.showToast) {
            window.showToast("No known severe drug interactions found.", "success");
        }
    } catch (err) {
        console.error("Error checking drug interactions:", err);
    }
}


async function predictHealthRisk() {
    let userData = null;
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user && window.offlineSync) {
            userData = window.offlineSync.getProfile(user.id);
        }
        
        if (!userData && user) {
            console.log("No health data in cache, fetching from Supabase...");
            const { data } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
            if (data) {
                userData = data;
                if (window.offlineSync) window.offlineSync.saveProfile(user.id, userData);
            }
        }
    } catch (err) {
        console.error("Failed to fetch profile for risk analysis:", err);
    }

    if (!userData) {
        console.log("No health data available for ML analysis. Using default mock values.");
        userData = {};
    }

    const age = getAge(userData);
    const bp = getSystolicBP(userData);

    const riskTextEl = document.getElementById('risk-prediction-text');
    const riskBarEl = document.getElementById('risk-score-bar');
    const riskExplanationEl = document.getElementById('risk-explanation');

    let riskScore = 0.2;
    let isHighRisk = false;

    const ageFactor = Math.max(0, (age - 30) / 40);
    const bpFactor = Math.max(0, (bp - 110) / 50);
    
    const z = -3.8 + (ageFactor * 1.8) + (bpFactor * 3.5);
    riskScore = 1 / (1 + Math.exp(-z));
    
    isHighRisk = riskScore > 0.6;
    const isMediumRisk = riskScore > 0.3 && !isHighRisk;

    if (riskTextEl) {
        if (isHighRisk) {
            riskTextEl.innerText = "High Risk Level";
            riskTextEl.className = "text-danger";
        } else if (isMediumRisk) {
            riskTextEl.innerText = "Medium Risk Level";
            riskTextEl.className = "text-warning";
        } else {
            riskTextEl.innerText = "Low Risk: Health Stable";
            riskTextEl.className = "text-success";
        }
    }
    
    if (riskBarEl) {
        riskBarEl.style.width = `${Math.max(10, Math.round(riskScore * 100))}%`;
        if (isHighRisk) riskBarEl.style.background = 'var(--danger)';
        else if (isMediumRisk) riskBarEl.style.background = 'var(--warning)';
        else riskBarEl.style.background = 'var(--success)';
    }
    
    if (riskExplanationEl) {
        let recommendations = "<ul>";
        if (bp > 130) {
            recommendations += "<li>🩺 <strong>Blood Pressure Alert:</strong> Reduce sodium intake and consider 30 mins of daily cardio.</li>";
        }
        if (userData.blood_sugar > 140) {
            recommendations += "<li>🩸 <strong>Sugar Levels High:</strong> Limit refined carbs and schedule an HbA1c test.</li>";
        }
        if (age > 45 && !isHighRisk) {
            recommendations += "<li>🛡 <strong>Preventative Care:</strong> Schedule annual comprehensive metabolic panels.</li>";
        }
        if (userData.allergies && userData.allergies.length > 3) {
            recommendations += "<li>🤧 <strong>Allergies:</strong> Carry an epinephrine auto-injector if advised by a doctor.</li>";
        }
        if (recommendations === "<ul>") {
            recommendations += "<li>✅ Maintain your current balanced diet and regular exercise routine!</li>";
        }
        recommendations += "</ul>";

        // Feature 8: AI Trend Prediction (Mocked for Demo)
        let trendHtml = "";
        if (bp > 130 || userData.blood_sugar > 140) {
            trendHtml = `
            <div style="margin-top: 1rem; padding: 1rem; background: #FEF2F2; border-left: 4px solid var(--danger); border-radius: 4px;">
                <h4 style="color: var(--danger); margin-bottom: 0.5rem;"><i class="fas fa-chart-line"></i> AI Trend Forecast</h4>
                <p style="font-size: 0.85rem;">Based on your current trajectory, if lifestyle changes are not made, your cardiovascular risk is projected to increase by <strong>15%</strong> over the next 12 months. Early intervention is strongly recommended.</p>
            </div>`;
        } else {
            trendHtml = `
            <div style="margin-top: 1rem; padding: 1rem; background: #F0FDF4; border-left: 4px solid var(--success); border-radius: 4px;">
                <h4 style="color: var(--success); margin-bottom: 0.5rem;"><i class="fas fa-chart-line"></i> AI Trend Forecast</h4>
                <p style="font-size: 0.85rem;">Your health metrics are trending positively. If you maintain this trajectory, your long-term cardiovascular risk will remain below the population average.</p>
            </div>`;
        }

        riskExplanationEl.innerHTML = `
            Your estimated cardiovascular risk score is <strong>${Math.round(riskScore * 100)}/100</strong>. 
            This is calculated using a Machine Learning algorithm analyzing your age (${age}) and systolic blood pressure (${bp}). 
            ${isHighRisk ? '<br><br><span class="text-danger">Please consult a doctor for a routine checkup soon.</span>' : ''}
            <br><br>
            <strong>Personalized AI Recommendations:</strong>
            ${recommendations}
            ${trendHtml}
        `;
    }
    
    if (document.getElementById('interaction-warnings')) {
        window.checkDrugInteractions("");
    }
}

document.addEventListener('DOMContentLoaded', predictHealthRisk);