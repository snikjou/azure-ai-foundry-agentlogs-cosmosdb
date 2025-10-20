# Code Explanation

## Purpose

This is a web-based AI Expense Assistant, built for a hackathon. Users interact via a chat interface to ask questions about expense policies (e.g., meal limits, travel costs), powered by an Azure AI agent.

---

## Main Components

### 1. **Backend (`app.py`, `run_agent.py`)**

#### `app.py`

- **Framework**: Flask serves the web app and API endpoints.
- **Azure AI Agent Setup**: 
  - Loads Azure credentials and agent config from environment variables.
  - Initializes the Azure AI client (`AIProjectClient`) and fetches the agent.
  - Manages active chat threads (sessions) in memory.

- **Routes**:
  - `/`: Serves the main chat web page (`index.html`).
  - `/api/chat` (`POST`): Main chat endpoint.
    - Receives user message and session ID.
    - Creates a new agent thread if needed.
    - Sends the message to the Azure agent, runs processing.
    - Retrieves the agent's response and returns it as JSON.
    - Handles errors: missing input, agent run failure, missing response.
  - `/api/new-session` (`POST`): Creates a fresh chat session/thread.

#### `run_agent.py`

- CLI script to test agent interaction directly (outside the web interface).
- Sets up agent and thread, sends a test message, processes response, and prints results/errors.

---

### 2. **Frontend**

#### `templates/index.html`

- **Layout**:
  - Chat container with header and agent avatar/info.
  - Message area initialized with a welcome message.
  - Input form for typing questions (max 1000 chars).
  - "New Chat" button for starting a fresh session.
  - Loading overlay ("AI is thinking...").

#### `static/js/chat.js`

- **ChatInterface Class**: Handles all chat logic.
  - **Session Management**: Creates/initializes new sessions.
  - **Message Handling**: Adds user/agent messages to the chat UI.
  - **Form Submission**: Sends user's question to `/api/chat`, displays agent response, error handling.
  - **Loading State**: Shows/hides spinner, disables input while waiting.
  - **Character Counter**: Tracks input length, color-codes approaching limit.
  - **New Chat**: Resets chat area, starts a new session.
  - **UX Enhancements**: Focus input on tab return, handle online/offline status.

#### `static/css/style.css`

- Styles for chat bubbles, avatars, input, loading spinner, and responsive design.

---

### 3. **Configuration and Setup**

#### `README.md`

- Guides you to:
  - Set up in GitHub Codespaces.
  - Configure Azure environment variables.
  - Install Azure CLI and login.
  - Run the web app or test script.
  - Example question to test: "What's the maximum I can claim for meals?"

---

## Summary of Flow

1. **User visits web app (`/`)** → Loads chat UI.
2. **User sends message** → JS sends it to `/api/chat` with session ID.
3. **Backend**:
   - If needed, creates a new agent thread (session).
   - Sends message to Azure AI agent.
   - Runs processing and fetches response.
   - Returns response to frontend.
4. **Frontend**:
   - Displays agent's answer.
   - Handles errors, loading state, session management.

---

**In essence:**  
This codebase is a full-stack demo for interacting with an Azure AI agent over a web chat interface, focused on expense policy Q&A. The Python backend manages sessions and connects to Azure; the frontend provides a modern chat experience.