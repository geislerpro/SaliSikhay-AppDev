let currentQuiz = null;
let currentAttempt = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let startTime = Date.now();
let timerInterval = null;

// Initialize Quiz Page
async function initQuiz() {
    checkAuth();
    
    const quizId = localStorage.getItem('current_quiz_id');
    const attemptData = localStorage.getItem('current_attempt');
    
    if (!quizId || !attemptData) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    currentAttempt = JSON.parse(attemptData);
    
    try {
        const result = await apiCall(`/quiz/${quizId}`);
        
        if (result.quiz) {
            currentQuiz = result.quiz;
            setupQuiz();
        } else {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        window.location.href = 'dashboard.html';
    }
}

function setupQuiz() {
    document.getElementById('quiz-title').textContent = currentQuiz.title;
    document.getElementById('total-questions').textContent = currentQuiz.questions.length;
    
    startTimer();
    renderQuestion();
    renderNavigator();
    
    // Setup button listeners
    updateNavigationButtons();
}

function renderQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    
    // Update progress
    document.getElementById('current-question').textContent = currentQuestionIndex + 1;
    document.getElementById('question-badge').textContent = `Question ${currentQuestionIndex + 1}`;
    document.getElementById('progress-fill').style.width = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100 + '%';
    
    // Update question text
    document.getElementById('question-text').textContent = question.question;
    
    // Render options
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    if (question.type === 'multiple_choice' && question.options) {
        Object.entries(question.options).forEach(([key, value]) => {
            const label = document.createElement('label');
            label.className = 'option-label';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `question-${question.id}`;
            input.value = key;
            
            if (userAnswers[question.id] === key) {
                input.checked = true;
                label.classList.add('selected');
            }
            
            input.addEventListener('change', () => {
                userAnswers[question.id] = key;
                updateNavigator();
                updateOptionUI(label);
            });
            
            label.appendChild(input);
            label.appendChild(document.createTextNode(value));
            
            optionsContainer.appendChild(label);
        });
    } else if (question.type === 'true_false') {
        ['true', 'false'].forEach(val => {
            const label = document.createElement('label');
            label.className = 'option-label';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `question-${question.id}`;
            input.value = val;
            
            if (userAnswers[question.id] === val) {
                input.checked = true;
                label.classList.add('selected');
            }
            
            input.addEventListener('change', () => {
                userAnswers[question.id] = val;
                updateNavigator();
                updateOptionUI(label);
            });
            
            label.appendChild(input);
            label.appendChild(document.createTextNode(val.charAt(0).toUpperCase() + val.slice(1)));
            
            optionsContainer.appendChild(label);
        });
    }
    
    // Update navigation buttons
    updateNavigationButtons();
}

function updateOptionUI(selectedLabel) {
    const container = document.getElementById('options-container');
    container.querySelectorAll('.option-label').forEach(label => {
        label.classList.remove('selected');
    });
    selectedLabel.classList.add('selected');
}

function renderNavigator() {
    const navigator = document.getElementById('question-navigator');
    navigator.innerHTML = '';
    
    currentQuiz.questions.forEach((q, idx) => {
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.textContent = idx + 1;
        
        if (idx === currentQuestionIndex) {
            btn.classList.add('current');
        }
        if (userAnswers[q.id]) {
            btn.classList.add('answered');
        }
        
        btn.addEventListener('click', () => {
            currentQuestionIndex = idx;
            renderQuestion();
            renderNavigator();
        });
        
        navigator.appendChild(btn);
    });
}

function updateNavigator() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach((btn, idx) => {
        if (userAnswers[currentQuiz.questions[idx].id]) {
            btn.classList.add('answered');
        }
    });
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
        renderNavigator();
        document.querySelector('.quiz-content').scrollTop = 0;
    } else {
        submitQuiz();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
        renderNavigator();
        document.querySelector('.quiz-content').scrollTop = 0;
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.textContent = currentQuestionIndex === currentQuiz.questions.length - 1 ? 'Submit ✓' : 'Next →';
}

function startTimer() {
    const timerDisplay = document.getElementById('timer');
    
    timerInterval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        
        timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

async function submitQuiz() {
    if (!confirm('Are you sure you want to submit your quiz?')) return;
    
    clearInterval(timerInterval);
    
    // Prepare answers
    const answers = Object.entries(userAnswers).map(([questionId, answer]) => ({
        question_id: parseInt(questionId),
        answer: answer
    }));
    
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    
    try {
        const result = await apiCall(
            `/quiz/attempt/${currentAttempt.id}/submit`,
            'POST',
            { answers }
        );
        
        if (result.attempt) {
            localStorage.setItem('last_attempt', JSON.stringify(result.attempt));
            window.location.href = 'results.html';
        }
    } catch (error) {
        alert('Error submitting quiz');
    }
}

function goBack() {
    if (confirm('Do you want to leave this quiz? Your progress will be lost.')) {
        clearInterval(timerInterval);
        localStorage.removeItem('current_quiz_id');
        localStorage.removeItem('current_attempt');
        window.location.href = 'dashboard.html';
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initQuiz);
