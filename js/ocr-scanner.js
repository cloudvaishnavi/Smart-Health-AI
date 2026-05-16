// Feature 4: Smart Pill / Injection Scanner (OCR)
async function initScanner() {
    const startScanBtn = document.getElementById('start-scan-btn');
    const videoElement = document.getElementById('scanner-video');
    const canvasElement = document.getElementById('scanner-canvas');
    const scanResultDiv = document.getElementById('scan-result');
    const diagInput = document.getElementById('diagnosis-input');
    const rxInput = document.getElementById('prescription-input');
    let stream = null;

    if (!startScanBtn || !videoElement || !canvasElement) return;

    startScanBtn.addEventListener('click', async () => {
        if (stream) {
            // Stop scanning
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            videoElement.classList.add('hidden');
            startScanBtn.innerHTML = '<i class="fas fa-camera"></i> Scan Medicine Label';
            return;
        }

        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            videoElement.srcObject = stream;
            videoElement.classList.remove('hidden');
            startScanBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Camera & Capture';
            
            // Add a capture button dynamically if it doesn't exist
            let captureBtn = document.getElementById('capture-btn');
            if(!captureBtn) {
                captureBtn = document.createElement('button');
                captureBtn.id = 'capture-btn';
                captureBtn.className = 'btn-primary mt-2';
                captureBtn.innerHTML = '<i class="fas fa-camera-retro"></i> Capture Image';
                videoElement.parentNode.insertBefore(captureBtn, videoElement.nextSibling);
                
                captureBtn.addEventListener('click', async () => {
                    const ctx = canvasElement.getContext('2d');
                    canvasElement.width = videoElement.videoWidth;
                    canvasElement.height = videoElement.videoHeight;
                    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
                    
                    const imageData = canvasElement.toDataURL('image/png');
                    
                    if(window.showToast) window.showToast("Analyzing image...", "info");
                    
                    try {
                        // Tesseract OCR
                        const worker = await Tesseract.createWorker('eng');
                        const ret = await worker.recognize(imageData);
                        const text = ret.data.text;
                        await worker.terminate();

                        console.log("OCR Extracted Text:", text);
                        
                        // Simple regex to extract medicine names (assuming capitalized words > 3 chars)
                        // and dosages (e.g. 500mg)
                        const medsMatch = text.match(/\b[A-Z][a-z]{3,}\b/g) || [];
                        const dosageMatch = text.match(/\b\d+\s?(mg|g|ml|mcg)\b/gi) || [];
                        
                        const detectedMed = medsMatch.length > 0 ? medsMatch[0] : "Unknown Medicine";
                        const detectedDosage = dosageMatch.length > 0 ? dosageMatch[0] : "";
                        const fullMed = `${detectedMed} ${detectedDosage}`.trim();
                        
                        // Auto fill
                        rxInput.value = (rxInput.value + '\n' + fullMed).trim();
                        diagInput.value = (diagInput.value || "Prescription Refill");

                        if(window.showToast) window.showToast(`Detected: ${fullMed}`, "success");
                        
                        // Voice confirm
                        if ('speechSynthesis' in window) {
                            const u = new SpeechSynthesisUtterance(`Added ${fullMed}`);
                            window.speechSynthesis.speak(u);
                        }

                        // Check interactions using global function from ml-predict if available
                        if(window.checkDrugInteractions) {
                            window.checkDrugInteractions(fullMed);
                        }
                        
                    } catch(e) {
                        console.error(e);
                        if(window.showToast) window.showToast("Failed to read text from image.", "error");
                    }
                });
            }

        } catch (err) {
            console.error("Camera access denied:", err);
            if(window.showToast) window.showToast("Camera access denied or unavailable.", "error");
        }
    });

    // Auto-open scanner if navigated with ?action=scan (from Voice Command)
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('action') === 'scan') {
        const addModal = document.getElementById('add-modal');
        if (addModal) addModal.classList.remove('hidden');
        if (startScanBtn) startScanBtn.click();
    }
}

document.addEventListener('DOMContentLoaded', initScanner);
