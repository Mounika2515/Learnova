# Lernova — Learn. Speak. Grow.

A modern, responsive UI/UX starter for an AI-powered English learning platform.

## Included
- Home dashboard with XP, streaks and achievements
- Word of the Day + vocabulary practice
- Speaking Practice with modes and timer
- AI Conversation chat interface
- Games page
- Progress dashboard
- Profile and goals
- Responsive mobile navigation
- Interactive demo buttons and states

## Run locally
No build tools are required.

1. Extract the ZIP.
2. Open `index.html` in a browser.
3. For best results, use VS Code + Live Server.

## Connect IBM agents later
The UI currently uses demo interactions. Replace the handlers in `script.js` with your IBM watsonx Orchestrate / Agent Builder integration.

Recommended integration points:
- `#newWord` / `#vocabWord` → English Vocabulary Coach
- `#checkSentence` → vocabulary sentence evaluation
- `#recordBtn` → IBM Watson Speech to Text → English Speaking Coach
- `#sendChat` → English Conversation Agent

Keep API keys and service credentials on a secure server or server-side integration layer; never expose private credentials in browser JavaScript.
