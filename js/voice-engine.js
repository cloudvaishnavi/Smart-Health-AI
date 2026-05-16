/* ─── Multilingual Voice Assistant (Feature 3) ───────────────────────── */
const voiceBtn = document.getElementById('voice-trigger');

if (voiceBtn) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        // Container and select dropdown injected into HTML
        let langSelect = document.getElementById('mic-lang');
        if (!langSelect) {
            const container = document.createElement('div');
            container.className = 'mic-container';

            langSelect = document.createElement('select');
            langSelect.id = 'mic-lang';
            langSelect.className = 'mic-lang-select';
            langSelect.innerHTML = `
                <option value="en-IN">English</option>
                <option value="hi-IN">Hindi</option>
                <option value="kn-IN">Kannada</option>
            `;

            // Wrap the existing button
            voiceBtn.parentNode.insertBefore(container, voiceBtn);
            container.appendChild(langSelect);
            container.appendChild(voiceBtn);
        }

        // --- Speech Synthesis Feedback ---
        function speakFeedback(text, lang) {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = lang;
                window.speechSynthesis.speak(utterance);
            }
        }

        recognition.onresult = (event) => {
            const command = event.results[0][0].transcript.toLowerCase();
            const currentLang = langSelect.value;
            console.log(`Voice Command (${currentLang}):`, command);

            // Debug toast so user knows it heard *something*
            if (window.showToast) window.showToast(`Heard: "${command}"`, "info");

            // Keyword dictionaries for English, Hindi, and Kannada
            const keywords = {
                emergency: ['emergency', 'card', 'qr', 'sos', 'आपातकाल', 'इमरजेंसी', 'कार्ड', 'एसओएस', 'ತುರ್ತು', 'ಎಮರ್ಜೆನ್ಸಿ', 'ಕಾರ್ಡ್', 'ಎಸ್ಓಎಸ್', 'அவசர'],
                records: ['records', 'history', 'medical', 'रिकॉर्ड', 'इतिहास', 'मेडिकल', 'ದಾಖಲೆ', 'ಇತಿಹಾಸ', 'ಮೆಡಿಕಲ್', 'ರೆಕಾರ್ಡ್ಸ್', 'பதிவுகள்'],
                insights: ['insights', 'risk', 'ai', 'analysis', 'जोखिम', 'एआई', 'विश्लेषण', 'इनसाइट्स', 'ವಿಶ್ಲೇಷಣೆ', 'ಅಪಾಯ', 'ಎಐ', 'ಇನ್ಸೈಟ್ಸ್'],
                family: ['family', 'guardian', 'member', 'relative', 'परिवार', 'गार्जियन', 'सदस्य', 'रिश्तेदार', 'फ़ैमिली', 'ಕುಟುಂಬ', 'ರಕ್ಷಕ', 'ಸದಸ್ಯ', 'ಫ್ಯಾಮಿಲಿ'],
                dashboard: ['dashboard', 'home', 'main', 'डैशबोर्ड', 'होम', 'मुख्य', 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', 'ಮುಖಪುಟ', 'ಹೋಮ್'],
                medicine: ['scan', 'add medicine', 'medicine', 'स्कैन', 'दवा', 'मेडिसिन', 'ಸ್ಕ್ಯಾನ್', 'ಔಷಧಿ', 'ಔಷಧ', 'ಮೆಡಿಸಿನ್', 'மருந்து'],
                call_doctor: ['call', 'doctor', 'कॉल', 'फ़ोन', 'डॉक्टर', 'ಕರೆ', 'ಫೋನ್', 'ವೈದ್ಯರು', 'ಡಾಕ್ಟರ್', 'மருத்துவர்']
            };

            const check = (list) => list.some(kw => command.includes(kw));

            // 1. Emergency Card
            if (check(keywords.emergency)) {
                speakFeedback(currentLang === 'hi-IN' ? "आपातकालीन कार्ड खोल रही हूँ।" : currentLang === 'kn-IN' ? "ತುರ್ತು ಕಾರ್ಡ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ." : "Opening emergency card.", currentLang);
                window.location.href = 'emergency-card.html';
            }
            // 2. Medical Records
            else if (check(keywords.records)) {
                speakFeedback(currentLang === 'hi-IN' ? "आपके मेडिकल रिकॉर्ड खोल रही हूँ।" : currentLang === 'kn-IN' ? "ನಿಮ್ಮ ವೈದ್ಯಕೀಯ ದಾಖಲೆಗಳನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ." : "Opening your medical records.", currentLang);
                window.location.href = 'records.html';
            }
            // 3. AI Insights
            else if (check(keywords.insights)) {
                speakFeedback(currentLang === 'hi-IN' ? "एआई रिस्क एनालिसिस खोल रही हूँ।" : currentLang === 'kn-IN' ? "AI ಅಪಾಯದ ವಿಶ್ಲೇಷಣೆ ತೆರೆಯಲಾಗುತ್ತಿದೆ." : "Opening AI risk analysis.", currentLang);
                window.location.href = 'ai-insights.html';
            }
            // 4. Family Guardian
            else if (check(keywords.family)) {
                speakFeedback(currentLang === 'hi-IN' ? "फैमिली गार्जियन खोल रही हूँ।" : currentLang === 'kn-IN' ? "ಕುಟುಂಬ ರಕ್ಷಕವನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ." : "Opening family guardian.", currentLang);
                window.location.href = 'family.html';
            }
            // 5. Dashboard / Home
            else if (check(keywords.dashboard)) {
                speakFeedback(currentLang === 'hi-IN' ? "डैशबोर्ड पर जा रही हूँ।" : currentLang === 'kn-IN' ? "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಲಾಗುತ್ತಿದೆ." : "Going to dashboard.", currentLang);
                window.location.href = 'dashboard.html';
            }
            // 6. Add/Scan Medicine
            else if (check(keywords.medicine)) {
                speakFeedback(currentLang === 'hi-IN' ? "दवा जोड़ने के लिए स्कैनर खोल रही हूँ।" : currentLang === 'kn-IN' ? "ಔಷಧವನ್ನು ಸೇರಿಸಲು ಸ್ಕ್ಯಾನರ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ." : "Opening scanner to add medicine.", currentLang);
                window.location.href = 'records.html?action=scan';
            }
            // 7. Call Doctor (Simulated)
            else if (check(keywords.call_doctor) && command.includes(currentLang === 'hi-IN' ? 'डॉक्टर' : currentLang === 'kn-IN' ? 'ಡಾಕ್ಟರ್' : 'doctor') || command.includes('call') || command.includes('कॉल') || command.includes('ಕರೆ')) {
                // The condition above is slightly loose but ensures any intent to call/contact doctor is caught
                speakFeedback(currentLang === 'hi-IN' ? "आपके डॉक्टर को कॉल कर रही हूँ।" : currentLang === 'kn-IN' ? "ನಿಮ್ಮ ವೈದ್ಯರಿಗೆ ಕರೆ ಮಾಡಲಾಗುತ್ತಿದೆ." : "Calling your doctor now.", currentLang);
                if (window.showToast) window.showToast("Initiating call to Doctor...", "info");
            } else {
                if (window.showToast) window.showToast(`Command not recognized: "${command}"`, "error");
            }
        };

        recognition.onerror = (event) => {
            console.error("Voice recognition error:", event.error);
            voiceBtn.classList.remove('listening');
            if (window.showToast) window.showToast(`Voice Error: ${event.error}`, "error");
        };

        let isListening = false;

        recognition.onend = () => {
            isListening = false;
            voiceBtn.classList.remove('listening');
        };

        voiceBtn.addEventListener('click', () => {
            if (isListening) {
                try { recognition.stop(); } catch (e) { }
                return;
            }
            try {
                recognition.lang = langSelect.value;
                recognition.start();
                isListening = true;
                voiceBtn.classList.add('listening');
                if (window.showToast) window.showToast(`Listening in ${langSelect.options[langSelect.selectedIndex].text}...`, "info");
            } catch (err) {
                console.warn("Could not start speech recognition:", err);
            }
        });
    } else {
        voiceBtn.style.display = 'none';
        console.warn('Speech Recognition API not supported in this browser.');
    }
}