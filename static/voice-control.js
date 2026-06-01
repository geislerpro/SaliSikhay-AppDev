/**
 * Voice Control for Quiz Creation
 * Allows users to say commands like "Make me a 10 question quiz about Python"
 */

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

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.language = 'en-US';

        this.setupListeners();
    }

    setupListeners() {
        if (!this.recognition) return;

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateStatus('listening');
            this.updateTranscript('Listening...');
            console.log('Voice recognition started');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            this.currentTranscript = finalTranscript || interimTranscript;
            this.updateTranscript(this.currentTranscript);

            if (finalTranscript) {
                console.log('Final transcript:', finalTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            
            let errorMessage = 'Error: ';
            
            switch(event.error) {
                case 'network':
                    errorMessage += 'Network error - check internet connection';
                    break;
                case 'audio':
                    errorMessage += 'Audio error - check microphone';
                    break;
                case 'not-allowed':
                    errorMessage += 'Microphone permission denied - allow in browser settings';
                    break;
                case 'no-speech':
                    errorMessage += 'No speech detected - try again';
                    break;
                default:
                    errorMessage += event.error;
            }
            
            this.updateStatus('error');
            this.updateTranscript(errorMessage);
            this.speak(errorMessage);
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (!this.currentTranscript) {
                this.updateStatus('idle');
            }
            console.log('Voice recognition ended');
        };
    }

    startListening() {
        if (!this.recognition) {
            this.speak('Speech recognition not supported in your browser');
            return;
        }

        // If already listening, stop it
        if (this.isListening) {
            console.log('Already listening, stopping...');
            this.recognition.abort();
            this.isListening = false;
            return;
        }

        try {
            this.currentTranscript = '';
            this.updateTranscript('');
            this.recognition.start();
            this.isListening = true;
        } catch (error) {
            console.error('Error starting recognition:', error.message);
            this.isListening = false;
            this.updateStatus('error');
            this.updateTranscript('Error starting microphone');
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
        
        await this.speak(confirmMessage);
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

            const finishHandler = () => {
                if (callback) {
                    callback();
                }
                resolve();
            };

            utterance.onend = finishHandler;
            utterance.onerror = finishHandler;

            this.synth.speak(utterance);
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
    transcript.textContent = 'Click mic to start';

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
        console.warn('apiCall not ready, deferring voice control init');
        return;
    }

    createVoiceControlUI();
    voiceQuizCreator = new VoiceQuizCreator();
    
    console.log('Voice Quiz Creator initialized');
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
