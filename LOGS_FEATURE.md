# Agent Thread Logs Feature

## Overview
This feature adds a comprehensive logging interface to display Agent Thread logs in the user interface. Users can now view all messages, run information, and thread metadata from their current chat session.

## Implementation Details

### Backend Changes (`app.py`)

#### New API Endpoint: `/api/thread-logs`
- **Method**: POST
- **Purpose**: Retrieves all messages and run information for a specific thread
- **Request Body**:
  ```json
  {
    "session_id": "uuid-string"
  }
  ```
- **Response**:
  ```json
  {
    "logs": [...],
    "thread_id": "thread_xyz",
    "run_info": [...],
    "total_messages": 10
  }
  ```

#### Features:
- Retrieves all messages from the Azure AI Agent thread in ascending order
- Extracts text content and file citations from messages
- Includes run information (status, model, timestamps)
- Handles both text messages and metadata

### Frontend Changes

#### HTML (`templates/index.html`)
- Added "Logs" button to the header next to "New Chat"
- Added a slide-in logs panel with:
  - Thread ID and message count display
  - Refresh button to reload logs
  - Close button to hide the panel
  - Scrollable content area for log entries

#### JavaScript (`static/js/chat.js`)
New methods added to `ChatInterface` class:

1. **`toggleLogsPanel()`** - Shows/hides the logs panel
2. **`loadThreadLogs()`** - Fetches thread logs from the backend
3. **`displayThreadLogs(data)`** - Renders the logs in the UI
4. **`createLogEntry(log, index)`** - Creates HTML for each log entry
5. **`formatTimestamp(isoString)`** - Formats timestamps in a user-friendly way
6. **`showLogsError(message)`** - Displays error messages in the logs panel

#### CSS (`static/css/style.css`)
Added comprehensive styling for:
- **Logs Panel**: Fixed-position slide-in panel (450px wide)
- **Log Entries**: Color-coded by role (user/assistant)
- **Run Information**: Separate section with status indicators
- **Responsive Design**: Full-width panel on mobile devices
- **Animations**: Smooth slide-in/out transitions

## Features

### 1. Thread Information Display
- Thread ID (truncated for display)
- Total message count
- Real-time refresh capability

### 2. Message Logs
Each log entry shows:
- Message index (#1, #2, etc.)
- Role badge (USER or ASSISTANT)
- Timestamp (formatted as "X minutes ago" or full date)
- Message ID (truncated)
- Full message content
- File citations (if any)

### 3. Run Information
Displays for each agent run:
- Run ID
- Status (with color-coded badges)
- Model used
- Created timestamp
- Completed timestamp

### 4. Visual Design
- **User messages**: Blue accent (#3b82f6)
- **Assistant messages**: Purple accent (#7c3aed)
- **Completed runs**: Green badge
- **Failed runs**: Red badge
- **In-progress runs**: Yellow badge

### 5. User Experience
- Slide-in panel from the right
- One-click refresh of logs
- Automatic timestamp formatting
- Empty state when no logs available
- Error handling with user-friendly messages

## Usage

1. **View Logs**: Click the "Logs" button in the header
2. **Refresh**: Click the refresh icon to reload the latest logs
3. **Close Panel**: Click the X button or click "Logs" again

## Technical Notes

- Logs are fetched on-demand (not auto-refreshing)
- Panel uses fixed positioning to overlay the main chat
- Responsive design supports mobile and desktop views
- All timestamps are converted from ISO format to user-friendly display
- Message content supports multi-line text with proper formatting

## Error Handling

The feature includes comprehensive error handling:
- No session ID error
- Empty thread handling
- API connection errors
- User-friendly error messages displayed in the panel

## Future Enhancements

Potential improvements:
- Auto-refresh logs when new messages arrive
- Export logs to file
- Filter logs by role or date
- Search within logs
- Expandable/collapsible run details
