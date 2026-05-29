let currentQuizzes = [];
let currentUser = null;

// Initialize Dashboard
async function initDashboard() {
    checkAuth();
    
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            currentUser = JSON.parse(userStr);
        } catch (e) {
            currentUser = { username: 'User' };
        }
    } else {
        currentUser = { username: 'User' };
    }
    
    // Update welcome message with actual username
    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg && currentUser.username) {
        welcomeMsg.textContent = `Welcome, ${currentUser.username}!`;
    }
    
    // Setup logout button
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Setup form handlers
    setupAIForm();
    setupFileDrop();
    setupSortFilter();
    
    // Load initial data
    await loadQuizzes();
    await loadStats();
}

// AI Quiz Generation
function setupAIForm() {
    const form = document.getElementById('ai-generation-form');
    const numQuestionsSelect = document.getElementById('num-questions');
    
    if (!form) {
        console.error('❌ AI generation form not found');
        return;
    }
    
    // Set default value
    if (numQuestionsSelect && !numQuestionsSelect.value) {
        numQuestionsSelect.value = '5';
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const topic = document.getElementById('ai-prompt').value.trim();
        const numQuestionsElement = document.getElementById('num-questions');
        const numQuestions = numQuestionsElement ? numQuestionsElement.value : '5';
        
        if (!topic) {
            showNotification('Please enter a topic', 'error');
            return;
        }
        
        if (!numQuestions) {
            showNotification('Please select number of questions', 'error');
            return;
        }
        
        const btn = document.getElementById('generate-btn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '🧠 Generating...';
        
        try {
            console.log('✅ Sending quiz creation request:', { topic, num_questions: parseInt(numQuestions) });
            
            const result = await apiCall('/quiz/create-from-topic', 'POST', {
                topic,
                num_questions: parseInt(numQuestions)
            });
            
            console.log('📊 Quiz creation response:', result);
            
            if (result.message || result.quiz) {
                document.getElementById('ai-prompt').value = '';
                showNotification('✓ Quiz created successfully! Refreshing...', 'success');
                await new Promise(resolve => setTimeout(resolve, 1000));
                await loadQuizzes();
            } else if (result.error) {
                console.error('❌ API error:', result.error);
                showNotification(result.error, 'error');
            } else {
                console.error('❌ Unexpected response:', result);
                showNotification('Failed to create quiz. Check console for details.', 'error');
            }
        } catch (error) {
            console.error('❌ Exception during quiz creation:', error);
            showNotification('Error: ' + error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    });
}

// File Upload Handling
function setupFileDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const pdfNumQuestions = document.getElementById('pdf-num-questions');
    
    if (!dropZone || !fileInput) {
        console.error('❌ Upload elements not found - drop-zone:', !!dropZone, 'file-input:', !!fileInput);
        return;
    }
    
    console.log('✓ Setting up file drop zone');
    
    // Prevent select from triggering file upload
    if (pdfNumQuestions) {
        pdfNumQuestions.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        pdfNumQuestions.addEventListener('change', (e) => {
            e.stopPropagation();
        });
    }
    
    // Click to browse - click on the zone itself
    dropZone.addEventListener('click', (e) => {
        // Don't trigger file input if clicking on select
        if (e.target === pdfNumQuestions) {
            return;
        }
        console.log('📁 Drop zone clicked');
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });
    
    // Also add click handler to the browse button
    const browseBtn = document.querySelector('.file-dummy-btn');
    if (browseBtn) {
        browseBtn.addEventListener('click', (e) => {
            console.log('📁 Browse button clicked');
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        });
    }
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.backgroundColor = '#e9d5ff';
            dropZone.style.borderColor = '#7e22ce';
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.style.backgroundColor = '#faf5ff';
            dropZone.style.borderColor = '#c084fc';
        }, false);
    });
    
    // Handle dropped files
    dropZone.addEventListener('drop', (e) => {
        console.log('📁 Files dropped');
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    }, false);
    
    // Handle selected files from input
    fileInput.addEventListener('change', (e) => {
        console.log('📁 File selected from input');
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });
    
    console.log('✓ File drop zone setup complete');
}

async function handleFileUpload(file) {
    // Check file type
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isTXT = file.type === 'text/plain' || file.name.endsWith('.txt');
    
    if (!isPDF && !isTXT) {
        showNotification('Only PDF and TXT files are supported', 'error');
        return;
    }
    
    const progressContainer = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    if (!progressContainer || !progressFill || !progressText) {
        showNotification('Upload UI not ready', 'error');
        return;
    }
    
    progressContainer.classList.remove('hidden');
    progressFill.style.width = '10%';
    progressText.textContent = 'Uploading file...';
    
    const numQuestions = document.getElementById('pdf-num-questions').value;
    
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('num_questions', numQuestions);
        
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`${API_BASE_URL}/pdf/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        progressFill.style.width = '70%';
        progressText.textContent = 'Processing document...';
        
        const result = await response.json();
        
        if (response.ok && result.quiz) {
            progressFill.style.width = '100%';
            progressText.textContent = '✓ Quiz created successfully!';
            
            setTimeout(() => {
                progressContainer.classList.add('hidden');
                progressFill.style.width = '0%';
                progressText.textContent = 'Processing...';
                document.getElementById('file-input').value = ''; // Reset input
                loadQuizzes();
                showNotification('Quiz created from PDF!', 'success');
            }, 1500);
        } else {
            progressFill.style.width = '0%';
            progressContainer.classList.add('hidden');
            showNotification(result.error || 'Failed to process file', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        progressContainer.classList.add('hidden');
        progressFill.style.width = '0%';
        showNotification('Error uploading file: ' + error.message, 'error');
    }
}

// Load Quizzes
async function loadQuizzes() {
    try {
        const result = await apiCall('/quiz/list');
        
        if (result.quizzes) {
            currentQuizzes = result.quizzes;
            renderQuizzes(currentQuizzes);
            document.getElementById('total-quizzes').textContent = result.total;
        }
    } catch (error) {
        console.error('Error loading quizzes:', error);
    }
}

// Render Quiz Cards
function renderQuizzes(quizzes) {
    const container = document.getElementById('decks-container');
    
    if (quizzes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 5px;">No quizzes yet</p>
                <p>Generate your first quiz using AI or upload a document above</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = quizzes.map(quiz => `
        <div class="quiz-card">
            <div class="quiz-info">
                <div class="quiz-badge">${quiz.source_type === 'ai_topic' ? '🤖 AI' : '📄 PDF'}</div>
                <h4>${quiz.title}</h4>
                <p class="quiz-meta">📊 ${quiz.question_count} Questions</p>
                <p class="quiz-date">${new Date(quiz.created_at).toLocaleDateString()}</p>
            </div>
            <div class="quiz-actions">
                <button class="study-btn" onclick="startQuiz(${quiz.id})">Start Quiz</button>
                <button class="delete-btn" onclick="deleteQuiz(${quiz.id})" title="Delete Quiz">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Sort Quizzes
function setupSortFilter() {
    document.getElementById('sort-filter').addEventListener('change', (e) => {
        const sortType = e.target.value;
        let sorted = [...currentQuizzes];
        
        switch(sortType) {
            case 'oldest':
                sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'name':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'recent':
            default:
                sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        
        renderQuizzes(sorted);
    });
}

// Start Quiz
async function startQuiz(quizId) {
    const quiz = currentQuizzes.find(q => q.id === quizId);
    
    const modal = document.getElementById('quiz-modal');
    document.getElementById('modal-title').textContent = quiz.title;
    document.getElementById('modal-description').textContent = `${quiz.question_count} questions • ${quiz.source_type === 'ai_topic' ? 'AI Generated' : 'From Document'}`;
    
    document.getElementById('start-quiz-btn').onclick = async () => {
        closeModal();
        
        try {
            const result = await apiCall(`/quiz/attempt/start/${quizId}`, 'POST');
            
            if (result.attempt) {
                // Store attempt info for quiz page
                localStorage.setItem('current_attempt', JSON.stringify(result.attempt));
                localStorage.setItem('current_quiz_id', quizId);
                window.location.href = 'quiz.html';
            }
        } catch (error) {
            showNotification('Error starting quiz', 'error');
        }
    };
    
    modal.classList.remove('hidden');
}

// Delete Quiz
async function deleteQuiz(quizId) {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    
    try {
        await apiCall(`/quiz/${quizId}`, 'DELETE');
        loadQuizzes();
        showNotification('Quiz deleted successfully');
    } catch (error) {
        showNotification('Error deleting quiz', 'error');
    }
}

// Load Statistics
async function loadStats() {
    try {
        const result = await apiCall('/quiz/attempts');
        
        if (result.attempts) {
            const attempts = result.attempts.filter(a => a.is_completed);
            document.getElementById('total-attempts').textContent = attempts.length;
            
            if (attempts.length > 0) {
                const avgScore = (attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length).toFixed(1);
                document.getElementById('avg-score').textContent = avgScore + '%';
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Modal Functions
function closeModal() {
    document.getElementById('quiz-modal').classList.add('hidden');
}

// Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initDashboard);
