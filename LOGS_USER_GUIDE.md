# Agent Thread Logs UI - Quick Guide

## How to Use

### 1. Opening the Logs Panel
- Click the **"Logs"** button in the top-right corner of the chat header
- The logs panel will slide in from the right side

### 2. Viewing Thread Information
The logs panel displays:
- **Thread ID**: Unique identifier for the current conversation thread
- **Total Messages**: Count of all messages in the thread
- **Refresh Button**: Click to reload the latest logs

### 3. Reading Log Entries
Each log entry shows:
```
#1 [USER] 2 minutes ago
Message ID: msg_abc123...
----------------------------------------
What is the meal allowance policy?
```

```
#2 [ASSISTANT] 2 minutes ago
Message ID: msg_def456...
----------------------------------------
The meal allowance policy states that...
```

### 4. Understanding Run Information
Below the messages, you'll see run details:
```
Run Information
━━━━━━━━━━━━━━━━━━━━━━━
Run ID: run_xyz789...
Status: [COMPLETED]  (green badge)
Model: gpt-4
Created: Oct 20, 2025 at 2:30 PM
Completed: Oct 20, 2025 at 2:31 PM
```

### 5. Closing the Panel
- Click the **X** button in the top-right of the logs panel
- Or click the **"Logs"** button again to toggle it closed

## Visual Elements

### Color Coding
- **Blue border**: User messages
- **Purple border**: Assistant messages
- **Green badge**: Completed runs
- **Red badge**: Failed runs
- **Yellow badge**: In-progress runs

### Timestamps
- "Just now" - less than 1 minute ago
- "X minutes ago" - less than 1 hour ago
- "2:30 PM" - earlier today
- "Oct 20, 2:30 PM" - previous days

## Tips
1. **Refresh regularly** to see the latest messages after each interaction
2. **Scroll down** in the logs panel to see run information
3. **Use on mobile** - the panel becomes full-screen for better readability
4. **Start a new chat** - logs will reset for the new conversation thread

## Keyboard Shortcuts
- Click "New Chat" to clear logs and start fresh
- Use refresh button instead of closing/reopening panel
