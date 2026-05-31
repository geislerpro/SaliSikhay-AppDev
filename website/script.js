// Initialize database references
let usersDatabase = JSON.parse(localStorage.getItem('usersDB')) || [];
let currentUser = localStorage.getItem('currentUser');

// --- UTILITY: Password Visibility Toggle ---
function setupPasswordToggle(toggleId, inputId) {
    const toggleBtn = document.getElementById(toggleId);
    const passwordInput = document.getElementById(inputId);
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
        });
    }
}
setupPasswordToggle('toggle-login-password', 'login-password');
setupPasswordToggle('toggle-reg-password', 'reg-password');


// --- ACCOUNT REGISTRATION LOGIC ---
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const errorMsg = document.getElementById('reg-error');

        if (password.length < 8) {
            errorMsg.textContent = "Password must be at least 8 characters long.";
            return;
        }

        const userExists = usersDatabase.some(user => user.username === username);
        if (userExists) {
            errorMsg.textContent = "Username already exists.";
            return;
        }

        // Create user profile with an empty deck array attached
        usersDatabase.push({ username: username, email: email, password: password, decks: [] });
        localStorage.setItem('usersDB', JSON.stringify(usersDatabase));

        errorMsg.style.color = 'green';
        errorMsg.textContent = "Registration successful! Redirecting...";
        setTimeout(() => { window.location.href = 'index.html'; }, 1300);
    });
}


// --- ACCOUNT LOGIN LOGIC ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const errorMsg = document.getElementById('login-error');

        const user = usersDatabase.find(u => u.username === username && u.password === password);
        if (user) {
            localStorage.setItem('currentUser', username);
            window.location.href = 'dashboard.html';
        } else {
            errorMsg.textContent = "Invalid username or password.";
        }
    });
}


// --- NEW COMPONENT: DASHBOARD LOGIC ENGINE ---
const decksContainer = document.getElementById('decks-container');

if (decksContainer) {
    // Safety check: redirect to entry screen if unauthorized
    if (!currentUser) {
        window.location.href = 'index.html';
    } else {
        document.getElementById('welcome-message').textContent = `Welcome, ${currentUser}!`;
        renderDecks();
    }

    // Handle logout button action
    document.getElementById('logout-btn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Simulated Action: File Drag and Upload area triggering prompt focus
    const dropZone = document.getElementById('drop-zone');
    dropZone.addEventListener('click', () => {
        alert("File parsing engine simulation triggered! For the layout, please describe your document study concepts in the left text field.");
        document.getElementById('ai-prompt').focus();
    });

    // AI Prompt Generation Core Event Listener
    const aiForm = document.getElementById('ai-generation-form');
    aiForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const promptInput = document.getElementById('ai-prompt');
        const generateBtn = document.getElementById('generate-btn');
        const topicTitle = promptInput.value.trim();

        // Loading Screen Animation Feedback
        generateBtn.disabled = true;
        generateBtn.innerHTML = "🧠 Processing Flashcards...";

        setTimeout(() => {
            // Generate structured mock flashcard sub-data cards
            const generatedCards = [
                { front: `What is the core definition of ${topicTitle}?`, back: `The structural system, standard lifecycle, or main process element defining ${topicTitle}.` },
                { front: `Name a principal key rule involving ${topicTitle}.`, back: `Rule details that govern active conditions or variable changes for this topic.` },
                { front: `Primary mistake to avoid with ${topicTitle}:`, back: `Failing to properly manage initial execution dependencies or configurations.` },
                { front: `Real world application of ${topicTitle}:`, back: `Used by experts to structure logic workflow components cleanly and efficiently.` }
            ];

            // Package into a saved deck item structure
            const newDeck = {
                id: Date.now(),
                title: topicTitle.charAt(0).toUpperCase() + topicTitle.slice(1),
                cardCount: generatedCards.length,
                dateCreated: new Date().toLocaleDateString(),
                cards: generatedCards
            };

            // Inject into the correct active profile inside our DB array
            let userIndex = usersDatabase.findIndex(u => u.username === currentUser);
            if (userIndex !== -1) {
                if (!usersDatabase[userIndex].decks) usersDatabase[userIndex].decks = [];
                usersDatabase[userIndex].decks.unshift(newDeck); // Add to the top of list
                localStorage.setItem('usersDB', JSON.stringify(usersDatabase));
            }

            // Restore elements layout and re-render visual library modules
            promptInput.value = '';
            generateBtn.disabled = false;
            generateBtn.innerHTML = "✨ Generate with AI";
            renderDecks();
        }, 1200); // 1.2s Artificial computation processing lag
    });
}

// Function responsible for reading localStorage state strings and generating card component nodes
function renderDecks() {
    const decksContainer = document.getElementById('decks-container');
    const deckCounter = document.getElementById('deck-counter');
    
    let userRecord = usersDatabase.find(u => u.username === currentUser);
    let myDecks = (userRecord && userRecord.decks) ? userRecord.decks : [];

    // Update Counter badge status layout elements
    deckCounter.textContent = `${myDecks.length} ${myDecks.length === 1 ? 'Deck' : 'Decks'} Available`;

    // Reset container view states entirely 
    decksContainer.innerHTML = '';

    if (myDecks.length === 0) {
        decksContainer.innerHTML = `
            <div class="empty-state">
                <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 5px;">Your study library is empty</p>
                <p style="font-size: 0.9rem;">Type a core subject prompt above to build flashcards with the layout generator.</p>
            </div>
        `;
        return;
    }

    // Build functional deck component blocks
    myDecks.forEach(deck => {
        const cardElement = document.createElement('div');
        cardElement.className = 'deck-card';
        cardElement.innerHTML = `
            <div class="deck-info">
                <h4>${deck.title}</h4>
                <p class="deck-meta">📊 ${deck.cardCount} Cards</p>
            </div>
            <div class="deck-actions">
                <button class="study-btn" onclick="studyDeck(${deck.id})">Review Deck</button>
                <button class="delete-btn" onclick="deleteDeck(${deck.id})" title="Delete Deck">🗑️</button>
            </div>
        `;
        decksContainer.appendChild(cardElement);
    });
}

// Global execution scope mapping event targets
window.deleteDeck = function(deckId) {
    if (confirm("Are you sure you want to delete this study deck?")) {
        let userIndex = usersDatabase.findIndex(u => u.username === currentUser);
        if (userIndex !== -1) {
            usersDatabase[userIndex].decks = usersDatabase[userIndex].decks.filter(d => d.id !== deckId);
            localStorage.setItem('usersDB', JSON.stringify(usersDatabase));
            renderDecks();
        }
    }
};

window.studyDeck = function(deckId) {
    let userRecord = usersDatabase.find(u => u.username === currentUser);
    let targetDeck = userRecord.decks.find(d => d.id === deckId);
    alert(`Entering interactive study viewport for deck: "${targetDeck.title}"\nTotal index nodes mapped: ${targetDeck.cardCount} cards built via custom simulation parser.`);
};