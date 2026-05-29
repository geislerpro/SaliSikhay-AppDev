/**
 * Voice Control Integration Test
 * Examples of how to use voice commands
 */

console.log('✓ Voice Control Test Console');
console.log('');
console.log('=== VOICE CONTROL EXAMPLES ===');
console.log('');
console.log('Try saying these commands:');
console.log('');
console.log('  • "Make me a 10 question quiz about Python"');
console.log('  • "Create a quiz on history with 5 questions"');
console.log('  • "5 question quiz about biology"');
console.log('  • "Generate 20 questions for science"');
console.log('');
console.log('The app will:');
console.log('  1. Listen to your voice');
console.log('  2. Extract the topic and number of questions');
console.log('  3. Read back the command confirmation');
console.log('  4. Create the quiz');
console.log('');
console.log('=== BROWSER REQUIREMENTS ===');
console.log('');
console.log('Voice control requires:');
console.log('  • Chrome/Edge: Full support ✓');
console.log('  • Safari: Full support ✓');
console.log('  • Firefox: Limited support');
console.log('');
console.log('=== DEBUGGING ===');
console.log('');
console.log('To test voice control:');
console.log('  1. Click the 🎤 microphone button in bottom-right');
console.log('  2. Say a voice command');
console.log('  3. Watch the transcript update');
console.log('  4. Quiz will be created automatically');
console.log('');

// Test function to simulate voice command (for debugging)
window.testVoiceCommand = function(command) {
    if (!voiceQuizCreator) {
        console.error('Voice controller not initialized');
        return;
    }
    console.log('🧪 Testing command:', command);
    voiceQuizCreator.parseCommand(command);
};

console.log('=== TEST FUNCTIONS ===');
console.log('');
console.log('Test voice parsing (doesn\'t require microphone):');
console.log('  testVoiceCommand("make a 10 question quiz about Python")');
console.log('  testVoiceCommand("create a 5 question quiz about biology")');
console.log('');
