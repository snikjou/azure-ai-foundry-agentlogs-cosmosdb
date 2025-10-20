# Installation and Testing Guide

## 📦 Installation Steps

### 1. Install Azure Cosmos DB SDK

Open PowerShell in your project directory and run:

```powershell
pip install azure-cosmos==4.5.1
```

**Expected Output:**
```
Collecting azure-cosmos==4.5.1
  Downloading azure_cosmos-4.5.1-py3-none-any.whl (282 kB)
Installing collected packages: azure-cosmos
Successfully installed azure-cosmos-4.5.1
```

### 2. Verify Installation

```powershell
python -c "import azure.cosmos; print('✓ Azure Cosmos DB SDK installed')"
```

**Expected Output:**
```
✓ Azure Cosmos DB SDK installed
```

### 3. Update Environment File

Create `.env` file from `Copy.env` (if not already exists):

```powershell
cp Copy.env .env
```

Then edit `.env` to include your Azure credentials:

```plaintext
# Azure AI Configuration
AZURE_AGENT_ID="your-agent-id-here"
AZURE_ENDPOINT="your-azure-endpoint-here"

# Cosmos DB Configuration
COSMOS_ENDPOINT="https://calpersdb.documents.azure.com:443/"
COSMOS_KEY="QFvboG0XEU1zEEhuF6Xr0cPChQ21FhU5fGLFWwdRjnccbgjYhcSCFDLFunnNw1N9pIeuOheJQ92mACDbktP20A=="
COSMOS_DATABASE_NAME="AgentLogsDB"
COSMOS_CONTAINER_NAME="ThreadLogs"
```

## 🚀 Running the Application

### Start the Flask App

```powershell
python app.py
```

**Expected Output:**
```
✓ Connected to Cosmos DB: AgentLogsDB/ThreadLogs
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://192.168.x.x:5000
```

**Important Signs:**
- ✅ `✓ Connected to Cosmos DB` - Cosmos DB is working
- ⚠️ `Warning: Could not connect to Cosmos DB` - Check credentials
- ✅ `Running on http://127.0.0.1:5000` - Web server started

### Open in Browser

```
http://localhost:5000
```

or

```
http://127.0.0.1:5000
```

## 🧪 Testing the Integration

### Test 1: Basic Chat Functionality

1. **Open the application** in your browser
2. **Type a message** in the input field (e.g., "Hello, what can you help with?")
3. **Press Enter** or click Send button
4. **Wait for response** from the AI agent

**Expected Result:**
- ✅ Message appears in chat window
- ✅ AI response appears after a few seconds
- ✅ Loading spinner shows during processing

### Test 2: View Live Logs

1. **Click "Logs"** button in the header
2. **Verify** logs panel slides in from the right
3. **Check** that source is set to "Agent (Live)"
4. **Observe** the following:
   - Thread ID is displayed
   - Total messages count is shown
   - Message entries are visible with roles (USER/ASSISTANT)

**Expected Result:**
- ✅ Logs panel opens
- ✅ Thread ID shown (e.g., `thread_abc123...`)
- ✅ Message count matches conversation
- ✅ All messages are listed chronologically

### Test 3: View Cosmos DB Logs

1. **In the logs panel**, click the **Source dropdown**
2. **Select "Cosmos DB"**
3. **Click "Refresh"** button
4. **Wait** for logs to load

**Expected Result:**
- ✅ Logs load from Cosmos DB
- ✅ Same messages as live view
- ✅ "Cosmos DB" is shown as source
- ✅ Messages grouped by type

**Note:** If first time, send a few messages first to populate Cosmos DB.

### Test 4: Check Cosmos DB Statistics

1. **Scroll down** in the logs panel
2. **Click "Cosmos DB Stats"** button
3. **View statistics**

**Expected Result:**
- ✅ Stats section expands
- ✅ Shows total logs count
- ✅ Shows total threads count
- ✅ Displays log types breakdown
- ✅ Shows database and container names

**Example Output:**
```
Database: AgentLogsDB
Container: ThreadLogs
Total Logs: 15
Threads: 3

Log Types:
- message: 10
- run: 4
- thread_created: 1
```

### Test 5: New Chat Session

1. **Click "New Chat"** button
2. **Verify** chat clears
3. **Send a new message**
4. **Check logs panel** - should show new thread ID

**Expected Result:**
- ✅ Chat history clears (except welcome message)
- ✅ New session created
- ✅ New thread ID in logs panel
- ✅ Previous logs in Cosmos DB still accessible

## 🔍 Verification Checklist

Use this checklist to ensure everything is working:

### Installation
- [ ] Azure Cosmos DB SDK installed (`pip install azure-cosmos`)
- [ ] `.env` file configured with all credentials
- [ ] Application starts without errors
- [ ] "Connected to Cosmos DB" message appears

### Chat Functionality
- [ ] Can send messages
- [ ] Receive AI responses
- [ ] Loading indicator works
- [ ] Character counter updates

### Logs Panel
- [ ] Opens/closes with "Logs" button
- [ ] Shows thread ID
- [ ] Displays message count
- [ ] Lists all messages
- [ ] Source dropdown works
- [ ] Refresh button works

### Cosmos DB Integration
- [ ] Can switch to "Cosmos DB" source
- [ ] Logs load from Cosmos DB
- [ ] Messages stored automatically
- [ ] Run information captured
- [ ] Statistics load successfully
- [ ] Stats show accurate counts

### UI/UX
- [ ] Responsive on desktop
- [ ] Responsive on mobile
- [ ] Smooth animations
- [ ] No console errors
- [ ] All buttons functional

## 🐛 Troubleshooting Tests

### If Chat Doesn't Work

**Check:**
```powershell
# Verify Python packages
pip list | findstr azure

# Check environment variables
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print('Azure Endpoint:', os.getenv('AZURE_ENDPOINT')); print('Agent ID:', os.getenv('AZURE_AGENT_ID'))"
```

**Expected Output:**
```
azure-ai-projects    1.0.0b11
azure-cosmos         4.5.1
azure-identity       1.20.0

Azure Endpoint: https://your-endpoint...
Agent ID: your-agent-id
```

### If Cosmos DB Connection Fails

**Test Connection:**
```powershell
python -c "from azure.cosmos import CosmosClient; client = CosmosClient('https://calpersdb.documents.azure.com:443/', 'QFvboG0XEU1zEEhuF6Xr0cPChQ21FhU5fGLFWwdRjnccbgjYhcSCFDLFunnNw1N9pIeuOheJQ92mACDbktP20A=='); print('✓ Connection successful')"
```

**Expected Output:**
```
✓ Connection successful
```

**If fails, check:**
- Internet connectivity
- Firewall settings
- Credentials in `.env`
- Azure Cosmos DB account status

### If Logs Don't Appear

**Debug Steps:**

1. **Check browser console** (F12):
   - Look for network errors
   - Check API responses

2. **Check Flask console**:
   - Look for Python errors
   - Check Cosmos DB write operations

3. **Verify data in Azure Portal**:
   - Go to Azure Portal
   - Open Cosmos DB account
   - Navigate to Data Explorer
   - Check `AgentLogsDB` → `ThreadLogs`
   - Should see documents

## 📊 Sample Test Conversation

### Test Script

Send these messages one by one:

1. "Hello, can you help me?"
2. "What is the expense policy?"
3. "How do I submit an expense report?"
4. "Thank you!"

### Expected Results

After sending all 4 messages:

**In Chat:**
- 4 user messages
- 4 agent responses
- Total: 8 messages visible

**In Logs (Agent):**
- Thread ID shown
- Total messages: 8
- 4 USER entries
- 4 ASSISTANT entries
- Run information for each

**In Logs (Cosmos DB):**
- Same 8 messages
- 1 thread_created entry
- 4 run entries
- Total: ~13 documents

**In Statistics:**
- Total Logs: ~13
- Threads: 1 (or more if multiple sessions)
- Log Types:
  - message: 8
  - run: 4
  - thread_created: 1

## 🎯 Performance Testing

### Load Test (Optional)

Test with multiple messages quickly:

```python
# test_load.py
import requests
import json

url = "http://localhost:5000/api/chat"
session_id = "test-session-123"

for i in range(10):
    response = requests.post(url, json={
        "message": f"Test message {i+1}",
        "session_id": session_id
    })
    print(f"Message {i+1}: {response.status_code}")
```

**Run:**
```powershell
python test_load.py
```

**Expected:**
- All return 200 status
- No errors in Flask console
- All logged to Cosmos DB

## 📸 Screenshot Checklist

Take screenshots for documentation:

1. [ ] Main chat interface
2. [ ] Conversation with messages
3. [ ] Logs panel (Agent source)
4. [ ] Logs panel (Cosmos DB source)
5. [ ] Statistics dashboard
6. [ ] Mobile view (if applicable)

## ✅ Success Criteria

Your implementation is successful if:

1. **✅ Application runs** without errors
2. **✅ Can send/receive messages**
3. **✅ Logs visible** in both Agent and Cosmos DB modes
4. **✅ Statistics load** and show accurate data
5. **✅ No console errors** in browser or Flask
6. **✅ Cosmos DB populated** with documents
7. **✅ UI is responsive** and functions properly

## 🎓 Next Steps

Once tests pass:

1. **Explore Features:**
   - Try different queries
   - Switch between sources
   - Monitor statistics

2. **Azure Portal:**
   - View documents in Data Explorer
   - Run custom queries
   - Monitor RU consumption

3. **Customize:**
   - Add custom log types
   - Implement filtering
   - Create custom analytics

4. **Production:**
   - Review security settings
   - Optimize throughput
   - Set up monitoring

## 📞 Getting Help

If tests fail:

1. **Check Documentation:**
   - SETUP_GUIDE.md
   - COSMOS_DB_INTEGRATION.md
   - QUICK_REFERENCE.md

2. **Review Logs:**
   - Flask console output
   - Browser developer console
   - Azure Portal diagnostics

3. **Verify Configuration:**
   - .env file
   - Cosmos DB credentials
   - Network connectivity

---

**Ready to Test?** Follow the steps above and verify each checkbox! 🚀
