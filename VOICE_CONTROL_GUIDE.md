# Voice Control Integration Guide

## 🎤 Overview

Your quiz app now includes **Voice Control for Quiz Creation**! Users can create quizzes by speaking natural language commands like:

- "Make me a 10 question quiz about Python"
- "Create a 5 question quiz on biology"
- "Generate a quiz about history with 20 questions"

## ✨ Features

### 1. **Voice Recognition**
- Listens to user speech and converts it to text
- Supports continuous speech input
- Shows real-time interim transcript (what you're currently saying)

### 2. **Intelligent Command Parsing**
- Automatically extracts topic from voice command
- Recognizes number patterns (5, 10, 20 questions, etc.)
- Handles various phrasing patterns:
  - "about [topic]"
  - "on [topic]"
  - "regarding [topic]"
  - "for [topic]"

### 3. **Voice Feedback**
- App speaks back the confirmation
- Text-to-speech confirms the quiz parameters
- Visual status updates in real-time

### 4. **UI Components**
- 🎤 Microphone button in bottom-right corner
- Status badge showing:
  - "Voice Ready" (idle)
  - "Listening..." (recording)
  - "Creating..." (processing)
  - "Success!" (quiz created)
  - "Error" (something went wrong)
- Live transcript display

## 🚀 How to Use

### For End Users:

1. **Click the 🎤 Microphone Button**
   - Located in the bottom-right corner of the screen
   - Always visible on the dashboard

2. **Speak Your Command**
   - Example: "Make me a 10 question quiz about Python"
   - The app listens and shows what you're saying
   - Can include topic and question count in any order

3. **Hear Confirmation**
   - App reads back what it understood
   - Example: "Creating a 10 question quiz about Python"

4. **Quiz Created**
   - Status updates to "Success!"
   - Quiz appears in your quizzes list
   - Ready to take!

### For Developers:

#### Initialize Voice Control
The voice control initializes automatically when the dashboard page loads. It's located in `/static/voice-control.js`.

#### Test Voice Parsing (No Microphone Needed)
Open the browser console and run:

```javascript
// Test command parsing without microphone
testVoiceCommand("make a 10 question quiz about Python");
```

#### Manual Initialization (if needed)
```javascript
// Only if auto-initialization didn't work
initVoiceQuizCreator();
```

#### Access the Voice Controller
```javascript
// Get the global instance
console.log(voiceQuizCreator);

// Manually start listening
voiceQuizCreator.startListening();

// Check if supported
console.log(voiceQuizCreator.isSupported);
```

## 🔧 Technical Details

### Files Added/Modified

1. **`/static/voice-control.js`** (NEW)
   - VoiceQuizCreator class
   - Speech recognition setup
   - Command parsing logic
   - UI initialization

2. **`/static/style.css`** (MODIFIED)
   - Added voice control panel styles
   - Animations for status updates
   - Responsive mobile layout

3. **`/static/dashboard.html`** (MODIFIED)
   - Added voice-control.js script tag

### Browser Support

| Browser | Support | Status |
|---------|---------|--------|
| Chrome  | ✅ Full | Tested & Working |
| Edge    | ✅ Full | Tested & Working |
| Safari  | ✅ Full | iOS & macOS |
| Firefox | ⚠️ Limited | May need fallback |
| Opera   | ✅ Full | Chromium-based |

### API Integration

Voice control uses your existing `/quiz/create-from-topic` endpoint:

```javascript
// Automatically called when command is recognized
POST /quiz/create-from-topic
{
  "topic": "Python Programming",
  "num_questions": 10
}
```

## 📋 Command Examples

The voice parser handles these patterns:

```
"make a 10 question quiz about Python"
↓
Topic: "Python", Questions: 10

"create a quiz on biology with 5 questions"
↓
Topic: "biology", Questions: 5

"5 question quiz about chemistry"
↓
Topic: "chemistry", Questions: 5

"generate 20 questions for history"
↓
Topic: "history", Questions: 20
```

## ⚙️ Configuration

### Adjust Recognition Settings

Edit `voice-control.js` in the `VoiceQuizCreator` constructor:

```javascript
this.recognition.lang = 'en-US'; // Change language
this.recognition.continuous = false; // Set to true for continuous
this.recognition.interimResults = true; // Show partial results
```

### Change Number Range

Limit questions (currently 1-20):

```javascript
// In parseCommand() method
numQuestions = Math.min(Math.max(parseInt(numberMatch[1]), 1), 20);
//                                                              ↑
//                                                          Change 20 to your max
```

## 🎙️ Troubleshooting

### "Voice control not supported"
- Check browser compatibility (Chrome/Edge/Safari recommended)
- Ensure browser has microphone permissions granted
- Check browser console for errors

### Transcript shows gibberish
- Speak clearly and at normal pace
- Reduce background noise
- Try rephrasing the command

### Quiz not creating after command
- Check browser console for errors
- Verify network connection
- Ensure auth token is valid
- Check `/api/quiz/create-from-topic` endpoint

### Microphone button not appearing
- Clear browser cache
- Check that `voice-control.js` is loaded (F12 → Console)
- Verify `dashboard.html` includes the script tag

## 🔐 Security

- Voice commands are processed locally first
- Only the extracted topic is sent to server
- No audio recording is stored
- Follows existing authentication (JWT tokens)
- Uses standard Web API (SpeechRecognition)

## 🌐 Accessibility

- Button includes title attribute for tooltips
- Status updates are visible and announced
- Works with keyboard (though voice primary)
- Responsive on mobile devices

## 📱 Mobile Support

Voice control works on mobile with:
- iOS 14.5+ (Safari)
- Android (Chrome, Firefox)

Mobile UI hides transcript by default to save space but shows on hover.

## 🔮 Future Enhancements

Potential features to add:
- [ ] Voice control for quiz navigation
- [ ] Multiple languages support
- [ ] Custom voice commands for users
- [ ] Voice answers to quiz questions
- [ ] Wake word detection ("Hey App")
- [ ] Command shortcuts ("next", "previous")

## 📞 Support

For issues:
1. Check browser console (F12) for errors
2. Test with `testVoiceCommand()` function
3. Verify microphone permissions are granted
4. Try a different browser if issues persist

---

**Last Updated:** May 29, 2026
**Status:** ✅ Production Ready
