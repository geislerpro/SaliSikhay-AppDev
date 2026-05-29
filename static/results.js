let lastAttempt = null;
let quizInfo = null;

// Initialize Results Page
async function initResults() {
    checkAuth();
    
    const attemptData = localStorage.getItem('last_attempt');
    const quizId = localStorage.getItem('current_quiz_id');
    
    if (!attemptData || !quizId) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    lastAttempt = JSON.parse(attemptData);
    
    // Load quiz details
    try {
        const result = await apiCall(`/quiz/${quizId}`);
        if (result.quiz) {
            quizInfo = result.quiz;
            displayResults();
        }
    } catch (error) {
        console.error('Error loading quiz:', error);
    }
}

function displayResults() {
    const score = lastAttempt.score || 0;
    const correct = lastAttempt.correct_answers;
    const total = lastAttempt.total_questions;
    
    // Update score circle
    const scoreCircle = document.getElementById('score-circle');
    scoreCircle.style.background = getScoreGradient(score);
    document.getElementById('score-number').textContent = Math.round(score);
    
    // Update message
    let message, subtitle;
    if (score >= 80) {
        message = '🎉 Excellent!';
        subtitle = 'You\'ve mastered this topic!';
    } else if (score >= 60) {
        message = '👍 Good Job!';
        subtitle = 'Keep practicing to improve!';
    } else if (score >= 40) {
        message = '📚 Keep Learning!';
        subtitle = 'Review the material and try again';
    } else {
        message = '💪 You Can Do Better!';
        subtitle = 'Study more and retake the quiz';
    }
    
    document.getElementById('result-message').textContent = message;
    document.getElementById('result-subtitle').textContent = subtitle;
    
    // Update stats
    document.getElementById('stat-correct').textContent = `${correct}/${total}`;
    
    const timeTaken = lastAttempt.time_taken_seconds || 0;
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;
    document.getElementById('stat-time').textContent = 
        minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    
    document.getElementById('stat-accuracy').textContent = Math.round(score) + '%';
    
    // Load detailed results
    loadDetailedResults();
}

async function loadDetailedResults() {
    try {
        const result = await apiCall(`/quiz/attempt/${lastAttempt.id}`);
        
        if (result.attempt) {
            displayDetailedResults(result.attempt);
        }
    } catch (error) {
        console.error('Error loading detailed results:', error);
    }
}

function displayDetailedResults(attempt) {
    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = '';
    
    quizInfo.questions.forEach((question, idx) => {
        const answer = attempt.answers.find(a => a.question_id === question.id);
        const isCorrect = answer?.is_correct || false;
        
        // Get the correct answer display text
        let correctAnswerText = '';
        const attemptQuestion = attempt.questions?.find(q => q.id === question.id);
        if (attemptQuestion?.correct_answer) {
            const correctAns = attemptQuestion.correct_answer;
            // For true/false questions
            if (attemptQuestion.type === 'true_false') {
                correctAnswerText = correctAns === 'true' ? 'True' : 'False';
            } 
            // For multiple choice
            else if (attemptQuestion.options && attemptQuestion.options[correctAns]) {
                correctAnswerText = attemptQuestion.options[correctAns];
            } else {
                correctAnswerText = correctAns;
            }
        }
        
        const resultItem = document.createElement('div');
        resultItem.className = `result-item ${isCorrect ? 'correct' : 'incorrect'}`;
        
        const questionDiv = document.createElement('div');
        questionDiv.className = 'result-question';
        questionDiv.innerHTML = `
            <span class="result-icon">${isCorrect ? '✓' : '✗'}</span>
            <div class="result-content">
                <p class="result-text"><strong>Q${idx + 1}: ${question.question}</strong></p>
                <p class="result-answer">Your answer: <strong>${answer?.user_answer || 'Not answered'}</strong></p>
                ${!isCorrect ? `
                    <p class="result-correct">Correct answer: <strong>${correctAnswerText || 'N/A'}</strong></p>
                ` : ''}
            </div>
        `;
        
        resultItem.appendChild(questionDiv);
        resultsList.appendChild(resultItem);
    });
}

function getScoreGradient(score) {
    if (score >= 80) return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    if (score >= 60) return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    if (score >= 40) return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
}

async function retakeQuiz() {
    localStorage.removeItem('last_attempt');
    const quizId = localStorage.getItem('current_quiz_id');
    
    try {
        const result = await apiCall(`/quiz/attempt/start/${quizId}`, 'POST');
        
        if (result.attempt) {
            localStorage.setItem('current_attempt', JSON.stringify(result.attempt));
            window.location.href = 'quiz.html';
        }
    } catch (error) {
        alert('Error starting new attempt');
    }
}

function goToDashboard() {
    localStorage.removeItem('current_quiz_id');
    localStorage.removeItem('current_attempt');
    localStorage.removeItem('last_attempt');
    window.location.href = 'dashboard.html';
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initResults);
