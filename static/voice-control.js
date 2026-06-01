/**
 * Voice Control for Quiz Creation
 * Allows users to say commands like "Make me a 10 question quiz about Python"
 */

console.log('🎤 Voice Control Module Loading...');

// Check browser support
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognitionAPI) {
    console.log('✅ Speech Recognition API: SUPPORTED');
} else {
    console.warn('❌ Speech Recognition API: NOT SUPPORTED - Try Chrome, Edge, Safari, or Firefox');
}

class VoiceQuizCreator {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.synth = window.speechSynthesis;
        this.setupSpeechRecognition();
        this.currentTranscript = '';
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.error('Speech Recognition not supported in this browser');
            return;
        }

        // Create fresh recognition object
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.language = 'en-US';

        this.setupListeners();
    }

    createFreshRecognition() {
        // Create a completely fresh recognition object - helps with state issues
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return false;
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.language = 'en-US';
        
        this.setupListeners();
        return true;
    }

    setupListeners() {
        if (!this.recognition) return;

        console.log('📍 Setting up recognition event listeners...');
        console.log('Recognition object ID:', this.recognition);

        this.recognition.onstart = () => {
            console.log('🔥 ONSTART HANDLER FIRED');
            this.isListening = true;
            this.updateStatus('listening');
            this.updateTranscript('🎤 Listening... Speak now!');
            console.log('✅ Voice recognition STARTED - microphone is active');
            console.log('🎤 You can now speak. Say: "Make me a 10 question quiz about Python"');
        };
        
        console.log('✅ onstart handler attached');

        this.recognition.onresult = (event) => {
            console.log('� ONRESULT HANDLER FIRED:', event);
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i].transcript;
                console.log(`Result ${i}:`, transcript, 'isFinal:', event.results[i].isFinal);
                
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            // Update display with both interim and final
            let displayText = '';
            if (finalTranscript) {
                displayText = `✓ ${finalTranscript}`;
                this.currentTranscript = finalTranscript;
                console.log('✅ FINAL transcript:', finalTranscript);
            } else if (interimTranscript) {
                displayText = `🎤 ${interimTranscript}`;
                this.currentTranscript = interimTranscript;
                console.log('📝 Interim transcript:', interimTranscript);
            }
            
            this.updateTranscript(displayText);

            if (finalTranscript) {
                console.log('✅ Processing command:', finalTranscript);
                // Process the command immediately when final result is detected
                this.parseCommand(finalTranscript);
            }
        };
        
        console.log('✅ onresult handler attached');

        this.recognition.onerror = (event) => {
            console.error('🔥 ONERROR HANDLER FIRED - Speech recognition error:', event.error);
            this.isListening = false;
            
            let errorMessage = 'Error: ';
            
            switch(event.error) {
                case 'network':
                    errorMessage += 'Network error - check internet connection';
                    break;
                case 'audio':
                    errorMessage += 'Audio error - check microphone is plugged in and working';
                    break;
                case 'not-allowed':
                    errorMessage += 'Microphone permission DENIED - please allow microphone access in browser settings';
                    break;
                case 'no-speech':
                    errorMessage += 'No speech detected - try speaking louder or closer to the mic';
                    break;
                case 'service-not-allowed':
                    errorMessage += 'Speech recognition service not allowed - check browser permissions';
                    break;
                default:
                    errorMessage += event.error;
            }
            
            console.error('Full error message:', errorMessage);
            this.updateStatus('error');
            this.updateTranscript(errorMessage);
            this.speak(errorMessage);
        };
        
        console.log('✅ onerror handler attached');

        this.recognition.onend = () => {
            console.log('� ONEND HANDLER FIRED - Voice recognition ENDED');
            console.log('Was listening?', this.isListening);
            console.log('Has transcript?', this.currentTranscript);
            this.isListening = false;
            // Reset status if no command was processed
            if (!this.currentTranscript) {
                this.updateStatus('idle');
                this.updateTranscript('🎤 Ready to listen... Click mic to try again');
            }
        };
        
        console.log('✅ onend handler attached');
        console.log('✅ All recognition event listeners attached');
    }

    startListening() {
        if (!this.recognition) {
            const msg = 'Speech recognition not supported in your browser. Try Chrome, Edge, or Safari.';
            console.error('❌', msg);
            this.speak(msg);
            this.updateTranscript(msg);
            return;
        }

        // Always abort previous sessions to reset state
        if (this.isListening) {
            console.log('⏹️ Stopping current listening session...');
            this.recognition.abort();
            // Small delay to ensure abort completes
            setTimeout(() => this.startListeningImpl(), 100);
            return;
        }

        this.startListeningImpl();
    }

    startListeningImpl() {
        try {
            this.currentTranscript = '';
            this.isListening = false; // Reset to false before starting
            
            // Create fresh recognition object to avoid state issues
            console.log('🔄 Creating fresh recognition object...');
            if (!this.createFreshRecognition()) {
                const msg = 'Speech Recognition not supported in your browser. Try Chrome, Edge, or Safari.';
                console.error('❌', msg);
                this.updateTranscript(msg);
                return;
            }
            
            console.log('🎤 Starting voice recognition...');
            console.log('Browser:', navigator.userAgent.substring(0, 50));
            console.log('Language:', this.recognition.language);
            
            this.updateTranscript('🎤 Listening... Speak now!');
            this.updateStatus('listening');
            this.recognition.start();
            
            console.log('✅ recognition.start() called successfully');
            this.isListening = true;
            
            // Don't rely on onstart - assume mic is active since start() succeeded
            console.log('✅ Voice recognition STARTED - microphone is active');
            
            // Set a timeout to detect if no speech is heard
            this.noSpeechTimeout = setTimeout(() => {
                if (this.isListening && !this.currentTranscript) {
                    console.warn('⚠️ No speech detected after 5 seconds');
                    this.updateTranscript('⚠️ No speech detected - speak louder or closer to microphone');
                }
            }, 5000);
            
        } catch (error) {
            if (error.name === 'InvalidStateError') {
                console.log('⚠️ Recognition already starting, will retry...');
                this.recognition.abort();
                this.isListening = false;
                setTimeout(() => this.startListeningImpl(), 100);
            } else {
                console.error('❌ Error starting recognition:', error.message);
                this.isListening = false;
                this.updateStatus('error');
                this.updateTranscript('Error starting microphone: ' + error.message);
            }
        }
    }

    parseCommand(transcript) {
        transcript = transcript.toLowerCase().trim();
        
        // Default values
        let numQuestions = 5;
        let topic = '';

        // Extract number of questions
        const numberMatch = transcript.match(/\b(\d+)\s*(?:question|q)(?:uestion)?s?\b/i);
        if (numberMatch) {
            numQuestions = parseInt(numberMatch[1]);
            numQuestions = Math.min(Math.max(numQuestions, 1), 20);
        }

        // Try to extract topic from common patterns
        let topicMatch = transcript.match(/(?:about|on|regarding|for)\s+([a-z\s]+?)(?:\s+with|\s*$)/i);
        
        if (!topicMatch) {
            // Try "quiz about..." or "quiz for..."
            topicMatch = transcript.match(/quiz\s+(?:about|on|for)\s+([a-z\s]+?)(?:\s+with|\s*$)?$/i);
        }

        if (topicMatch) {
            topic = topicMatch[1].trim();
        }

        // Fallback: use last few words if no topic found
        if (!topic) {
            const words = transcript
                .replace(/make|create|quiz|question|questions|about|on|regarding|for|a|an|with|me/gi, '')
                .trim()
                .split(/\s+/)
                .filter(w => w.length > 2);
            
            if (words.length > 0) {
                topic = words.slice(-3).join(' ');
            }
        }

        if (topic) {
            this.confirmAndCreateQuiz(topic, numQuestions, transcript);
        } else {
            this.updateStatus('error');
            this.speak('I could not understand the topic. Please say something like: Make a 10 question quiz about Python');
            this.updateTranscript('Could not parse topic from: ' + transcript);
        }
    }

    async confirmAndCreateQuiz(topic, numQuestions, originalCommand) {
        this.updateStatus('creating');
        
        const confirmMessage = `Creating a ${numQuestions} question quiz about ${topic}`;
        console.log('Confirmation:', confirmMessage);
        this.updateTranscript(`${confirmMessage}`);
        
        try {
            await this.speak(confirmMessage);
        } catch (error) {
            console.warn('Speech synthesis failed, continuing anyway:', error);
        }
        await this.createQuiz(topic, numQuestions);
    }

    async createQuiz(topic, numQuestions) {
        if (typeof apiCall !== 'function') {
            console.error('apiCall function not found');
            this.updateStatus('error');
            this.speak('Error: API not available');
            return;
        }

        // Check for token
        const token = localStorage.getItem('auth_token');
        if (!token) {
            console.error('No auth token found');
            this.updateStatus('error');
            this.speak('Error: Not logged in. Please log in first.');
            this.updateTranscript('Error: Not logged in');
            return;
        }

        try {
            console.log('🎤 Voice Control: Making API call to /quiz/create-from-topic');
            console.log('Topic:', topic, 'Questions:', numQuestions);
            
            const response = await apiCall('/quiz/create-from-topic', 'POST', {
                topic: topic,
                num_questions: numQuestions
            });

            console.log('🎤 API Response:', response);

            if (response.error) {
                throw new Error(response.error);
            }

            const quizId = response.quiz?.id || response.quiz_id;
            if (!quizId) {
                console.warn('No quiz id in response:', response);
                throw new Error('No quiz created');
            }

            // Start new quiz attempt immediately after voice creation
            const attemptResult = await apiCall(`/quiz/attempt/start/${quizId}`, 'POST');
            if (attemptResult.error || !attemptResult.attempt) {
                console.warn('Unable to start quiz attempt automatically:', attemptResult);
                throw new Error(attemptResult.error || 'Quiz created but could not start attempt');
            }

            localStorage.setItem('current_quiz_id', quizId);
            localStorage.setItem('current_attempt', JSON.stringify(attemptResult.attempt));

            console.log('✅ Quiz created and attempt started:', response, attemptResult);
            this.updateStatus('success');
            this.speak(`Quiz created and ready. Starting your ${numQuestions} question quiz about ${topic}`);
            this.updateTranscript(`✓ Quiz created and attempt started`);
            
            setTimeout(() => {
                window.location.href = 'quiz.html';
            }, 1500);
        } catch (error) {
            console.error('❌ Quiz creation error:', error.message, error);
            this.updateStatus('error');
            
            let errorMsg = error.message;
            if (errorMsg.includes('Network')) {
                errorMsg = 'Network error. Check console for details.';
            }
            
            this.speak(`Error: ${errorMsg}`);
            this.updateTranscript(`Error: ${errorMsg}`);
        }
    }

    speak(text, callback = null) {
        return new Promise((resolve) => {
            if (!this.synth) {
                resolve();
                return;
            }

            // Cancel any ongoing speech
            this.synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;

            let finished = false;
            const finishHandler = () => {
                if (!finished) {
                    finished = true;
                    if (callback) {
                        callback();
                    }
                    resolve();
                }
            };

            utterance.onend = finishHandler;
            utterance.onerror = finishHandler;

            // Timeout fallback in case onend/onerror don't fire
            const timeout = setTimeout(finishHandler, (text.length / 3) * 1000 + 500);
            
            try {
                this.synth.speak(utterance);
            } catch (error) {
                console.error('Speech synthesis error:', error);
                clearTimeout(timeout);
                finishHandler();
            }
        });
    }

    updateStatus(status) {
        const badge = document.querySelector('.voice-status-badge');
        if (!badge) return;

        badge.className = 'voice-status-badge ' + status;

        const statusTexts = {
            'idle': '🎤 Ready',
            'listening': '🎧 Listening...',
            'creating': '⚙️ Creating Quiz...',
            'success': '✓ Success!',
            'error': '✗ Error'
        };

        badge.textContent = statusTexts[status] || status;
    }

    updateTranscript(text) {
        const transcript = document.querySelector('.voice-transcript');
        if (transcript) {
            transcript.textContent = text;
            transcript.title = text; // Add tooltip for full text if truncated
            transcript.scrollTop = transcript.scrollHeight;
        }
    }
}

// Global instance
let voiceQuizCreator = null;

// Create UI
function createVoiceControlUI() {
    // Check if already created
    if (document.getElementById('voice-control-container')) {
        return;
    }

    const container = document.createElement('div');
    container.id = 'voice-control-container';

    const panel = document.createElement('div');
    panel.className = 'voice-control-panel';

    const micBtn = document.createElement('button');
    micBtn.className = 'voice-mic-btn';
    micBtn.innerHTML = '🎤';
    micBtn.title = 'Voice Control - Say: "Make me a 10 question quiz about [topic]"';
    micBtn.onclick = () => {
        if (voiceQuizCreator) {
            voiceQuizCreator.startListening();
        }
    };

    const info = document.createElement('div');
    info.className = 'voice-info';

    const badge = document.createElement('div');
    badge.className = 'voice-status-badge idle';
    badge.textContent = '🎤 Ready';

    const transcript = document.createElement('div');
    transcript.className = 'voice-transcript';
    transcript.textContent = '🎤 Ready to listen...';
    transcript.title = 'Say: "Make me a 10 question quiz about Python"';

    info.appendChild(badge);
    info.appendChild(transcript);

    panel.appendChild(micBtn);
    panel.appendChild(info);
    container.appendChild(panel);

    document.body.appendChild(container);
}

// Initialize
function initVoiceQuizCreator() {
    if (typeof apiCall !== 'function') {
        console.warn('⚠️ apiCall not ready, deferring voice control init');
        return;
    }

    createVoiceControlUI();
    voiceQuizCreator = new VoiceQuizCreator();
    
    console.log('✅ Voice Quiz Creator initialized');
    console.log('📋 Features:');
    console.log('  - Click 🎤 button to start listening');
    console.log('  - Say: "Make me a 10 question quiz about [topic]"');
    console.log('  - Open browser console (F12) to see debug logs');
}

// Auto-initialize on dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (typeof apiCall === 'function') {
        initVoiceQuizCreator();
    } else {
        // Wait for apiCall to be defined
        const checkInterval = setInterval(() => {
            if (typeof apiCall === 'function') {
                clearInterval(checkInterval);
                initVoiceQuizCreator();
            }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => clearInterval(checkInterval), 5000);
    }
});

// Export test function for console use
window.testVoiceCommand = function(command) {
    if (!voiceQuizCreator) {
        console.error('Voice Quiz Creator not initialized');
        return;
    }
    console.log('Testing command:', command);
    voiceQuizCreator.parseCommand(command);
};

// Diagnostic function for troubleshooting
window.testMicrophone = async function() {
    console.log('🔍 Running microphone diagnostic...');
    console.log('');
    console.log('📋 DIAGNOSTICS:');
    console.log('Browser:', navigator.userAgent.substring(0, 50) + '...');
    console.log('');
    
    // Check Speech Recognition API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    console.log('1️⃣ Speech Recognition API:', SpeechRecognition ? '✅ Available' : '❌ NOT Available');
    
    // Check Microphone Permissions
    try {
        const result = await navigator.permissions.query({ name: 'microphone' });
        console.log('2️⃣ Microphone Permission Status:', result.state);
        if (result.state === 'denied') {
            console.log('   ⚠️ CRITICAL: Microphone access DENIED - you must allow in browser settings');
            console.log('   Steps: Settings > Privacy & Security > Site Settings > Microphone > Allow');
            return;
        } else if (result.state === 'prompt') {
            console.log('   ⚠️ Permission not yet granted - will prompt when you allow');
        } else {
            console.log('   ✅ Permission granted');
        }
    } catch (error) {
        console.log('2️⃣ Cannot check permission:', error.message);
    }
    
    // Check Microphone Hardware
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(d => d.kind === 'audioinput');
        console.log('3️⃣ Microphone Hardware:', audioDevices.length > 0 ? '✅ Found ' + audioDevices.length : '❌ Not Found');
        if (audioDevices.length > 0) {
            audioDevices.forEach((device, i) => {
                console.log(`   Device ${i + 1}: ${device.label || '(unnamed device)'}`);
            });
        } else {
            console.log('   ❌ CRITICAL: No microphone hardware detected!');
            console.log('   - Check if microphone is plugged in');
            console.log('   - Check Device Manager for microphone driver issues');
            console.log('   - Try testing microphone in another app (Discord, Google Meet)');
            return;
        }
    } catch (error) {
        console.log('3️⃣ Cannot enumerate devices:', error.message);
    }
    
    // Test actual voice recognition
    if (SpeechRecognition) {
        console.log('');
        console.log('4️⃣ Testing Voice Recognition:');
        const test = new SpeechRecognition();
        test.continuous = false;
        test.interimResults = true;
        test.language = 'en-US';
        
        let gotStart = false;
        let gotResult = false;
        let gotError = false;
        
        test.onstart = () => {
            console.log('   ✅ Recognition STARTED - listening now...');
            gotStart = true;
        };
        
        test.onresult = (e) => {
            console.log('   ✅ Got result:', e.results[e.results.length - 1][0].transcript);
            gotResult = true;
            test.abort();
        };
        
        test.onerror = (e) => {
            console.error('   🔥 ERROR FIRED:', e.error);
            gotError = true;
            
            const errorMsgs = {
                'network': 'Network error - check internet connection',
                'audio': 'Audio error - check microphone is plugged in',
                'not-allowed': 'Microphone permission DENIED',
                'no-speech': 'No speech detected - speak louder',
                'service-not-allowed': 'Speech recognition service not allowed',
                'bad-grammar': 'Bad grammar definition',
                'aborted': 'Recognition was aborted',
                'unknown': 'Unknown error'
            };
            
            console.error('   Message:', errorMsgs[e.error] || e.error);
        };
        
        test.onend = () => {
            console.log('   Recognition ended');
            console.log('');
            console.log('📊 RESULTS:');
            console.log('   Started?', gotStart ? '✅ Yes' : '❌ No');
            console.log('   Error fired?', gotError ? '⚠️ Yes' : '✅ No');
            console.log('   Got speech?', gotResult ? '✅ Yes' : '❌ No');
            
            if (!gotStart) {
                console.error('❌ PROBLEM: Recognition never started');
            } else if (gotError) {
                console.error('❌ PROBLEM: Error during recognition');
            } else if (!gotResult) {
                console.warn('⚠️ No speech detected - try speaking louder/closer to mic');
            }
        };
        
        try {
            console.log('   Starting recognition...');
            test.start();
            console.log('   ⏳ Listening for 10 seconds... SPEAK NOW! (louder = better)');
            
            setTimeout(() => {
                if (test && !gotResult && gotStart) {
                    console.log('   ⏰ Timeout - stopping test');
                    test.abort();
                }
            }, 10000);
        } catch (error) {
            console.error('   ❌ Cannot start test:', error.message, error.name);
        }
    }
    
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('  1. If no microphone found - check Device Manager');
    console.log('  2. If permission denied - allow in browser settings');
    console.log('  3. If no speech detected - speak louder/closer');
    console.log('  4. If error fired - check error message above');
    console.log('  5. Test microphone in Discord/Google Meet to verify it works');
};

// Export diagnostic function
window.voiceDebug = function() {
    console.log('🎤 VOICE CONTROL DEBUG INFO:');
    if (voiceQuizCreator) {
        console.log('Status: Initialized');
        console.log('Listening:', voiceQuizCreator.isListening);
        console.log('Current transcript:', voiceQuizCreator.currentTranscript);
        console.log('Recognition available:', voiceQuizCreator.recognition ? 'Yes' : 'No');
    } else {
        console.log('Status: NOT initialized');
    }
    console.log('');
    console.log('📞 Commands:');
    console.log('  testVoiceCommand("make me a quiz about python")');
    console.log('  testMicrophone()');
    console.log('  voiceDebug()');
};

console.log('');
console.log('💡 TIP: For debugging, open browser console (F12) and type:');
console.log('  testMicrophone()  - Check if microphone works');
console.log('  voiceDebug()      - View voice control status');

