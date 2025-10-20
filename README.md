# Azure AI Agent with Cosmos DB Logging

A Flask-based web application that provides a chat interface for Azure AI Foundry Agents with comprehensive logging capabilities stored in Azure Cosmos DB.

## 🌟 Features

### Core Functionality
- 💬 **Interactive Chat Interface** - Clean, modern UI for conversing with Azure AI Agents
- 📝 **Automatic Log Storage** - All conversations automatically stored in Azure Cosmos DB
- 🔍 **Dual Log Viewing** - View logs from live agent or historical Cosmos DB storage
- 📊 **Statistics Dashboard** - Real-time insights into stored logs and threads
- 🎯 **Thread Management** - Track and manage multiple conversation threads

### Technical Features
- ⚡ **Real-time Communication** - Direct integration with Azure AI Foundry
- 💾 **Persistent Storage** - Cosmos DB for reliable, scalable log storage
- 🎨 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔐 **Secure Configuration** - Environment-based credential management
- 📈 **Performance Optimized** - Efficient queries with partition key design

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Azure AI Foundry Agent configured
- Azure Cosmos DB account (credentials provided)

### Installation

1. **Clone the repository**
   ```powershell
   cd c:\temp\azure-ai-foundry-agentlogs-cosmosdb
   ```

2. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

3. **Configure environment**
   
   Create a `.env` file from `Copy.env`:
   ```plaintext
   AZURE_AGENT_ID="your-agent-id"
   AZURE_ENDPOINT="your-azure-endpoint"
   
   COSMOS_ENDPOINT="Your endpoint"
   COSMOS_KEY="Your key"
   COSMOS_DATABASE_NAME="AgentLogsDB"
   COSMOS_CONTAINER_NAME="ThreadLogs"
   ```

4. **Run the application**
   ```powershell
   python app.py
   ```

5. **Open in browser**
   ```
   http://localhost:5000
   ```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Complete setup and installation guide |
| [COSMOS_DB_INTEGRATION.md](COSMOS_DB_INTEGRATION.md) | Detailed Cosmos DB integration documentation |
| [LOGS_FEATURE.md](LOGS_FEATURE.md) | Agent Thread Logs UI feature documentation |
| [LOGS_USER_GUIDE.md](LOGS_USER_GUIDE.md) | User guide for the logs interface |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Quick reference for common tasks |

## 🎯 Usage

### Starting a Conversation
1. Open the application in your browser
2. Type your message in the input field
3. Press Enter or click the Send button
4. View the AI agent's response

### Viewing Logs
1. Click the **"Logs"** button in the header
2. Select source:
   - **Agent (Live)** - Current thread state
   - **Cosmos DB** - Historical logs
3. Click **"Refresh"** to reload logs

### Checking Statistics
1. Open the Logs panel
2. Click **"Cosmos DB Stats"**
3. View metrics:
   - Total logs stored
   - Number of threads
   - Log type distribution

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐
│   Browser   │────────▶│  Flask App   │
│     (UI)    │◀────────│   (app.py)   │
└─────────────┘         └──────┬───────┘
                               │
                    ┌──────────┼──────────┐
                    ▼                     ▼
            ┌───────────────┐    ┌─────────────┐
            │  Azure AI     │    │  Cosmos DB  │
            │  Foundry      │    │   (Logs)    │
            └───────────────┘    └─────────────┘
```

## 📁 Project Structure

```
azure-ai-foundry-agentlogs-cosmosdb/
├── app.py                          # Main Flask application
├── requirements.txt                # Python dependencies
├── .env                           # Environment configuration
├── templates/
│   └── index.html                 # Main UI template
├── static/
│   ├── css/
│   │   └── style.css             # UI styling
│   └── js/
│       └── chat.js               # Frontend logic
└── docs/
    ├── SETUP_GUIDE.md
    ├── COSMOS_DB_INTEGRATION.md
    ├── LOGS_FEATURE.md
    ├── LOGS_USER_GUIDE.md
    └── QUICK_REFERENCE.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AZURE_ENDPOINT` | Yes | Azure AI Foundry endpoint |
| `AZURE_AGENT_ID` | Yes | Agent identifier |
| `COSMOS_ENDPOINT` | Yes | Cosmos DB endpoint URL |
| `COSMOS_KEY` | Yes | Cosmos DB access key |
| `COSMOS_DATABASE_NAME` | No | Database name (default: AgentLogsDB) |
| `COSMOS_CONTAINER_NAME` | No | Container name (default: ThreadLogs) |

## 📊 Cosmos DB Schema

### Document Structure

**Message Document:**
```json
{
  "id": "uuid",
  "thread_id": "thread_xyz",
  "log_type": "message",
  "timestamp": "2025-10-20T12:00:00.000Z",
  "data": {
    "message_id": "msg_abc",
    "role": "user",
    "content": [{"type": "text", "text": "..."}],
    "created_at": "2025-10-20T12:00:00.000Z"
  }
}
```

**Run Document:**
```json
{
  "id": "uuid",
  "thread_id": "thread_xyz",
  "log_type": "run",
  "timestamp": "2025-10-20T12:00:05.000Z",
  "data": {
    "run_id": "run_def",
    "status": "completed",
    "model": "gpt-4"
  }
}
```

## 🔌 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Main chat interface |
| `/api/chat` | POST | Send message to agent |
| `/api/new-session` | POST | Create new session |
| `/api/thread-logs` | POST | Get thread logs |
| `/api/cosmos-stats` | GET | Get Cosmos DB stats |
| `/api/all-threads` | GET | List all threads |

## 💰 Cost Estimation

**Development/Testing:**
- Cosmos DB (400 RU/s): ~$24/month
- Storage (< 1 GB): ~$0.25/month
- **Total: ~$24-25/month**

**Production:**
- Cosmos DB (1000 RU/s): ~$60/month
- Storage (10 GB): ~$2.50/month
- **Total: ~$62-65/month**

## 🔐 Security

- ✅ Environment-based configuration
- ✅ HTTPS enforced for Cosmos DB
- ✅ Data encryption at rest (Cosmos DB default)
- 🔄 Recommended: Use Azure Key Vault in production
- 🔄 Recommended: Enable managed identities

## 🚦 Performance

### Current Configuration
- **Throughput**: 400 RU/s (suitable for dev/test)
- **Partition Key**: `/thread_id` (optimized for per-thread queries)
- **Storage**: Auto-scaling

### Production Recommendations
- Increase to 1000-4000 RU/s
- Enable autoscale (1000-4000 RU/s)
- Implement caching layer
- Add monitoring and alerts

## 🐛 Troubleshooting

### Common Issues

**Cosmos DB Connection Failed**
- Verify endpoint and key in `.env`
- Check network connectivity
- Ensure firewall allows your IP

**No Logs in Cosmos DB**
- Send at least one message first
- Wait a few seconds for storage
- Check console for errors

**High RU Consumption**
- Review query patterns
- Consider increasing throughput
- Implement caching

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed troubleshooting.

## 📝 Development

### Adding Custom Log Types

```python
# In app.py
store_log_to_cosmos(thread_id, "custom_event", {
    "event_name": "user_action",
    "details": {...}
})
```

### Custom Queries

```sql
-- In Azure Portal Data Explorer
SELECT * FROM c 
WHERE c.log_type = 'message' 
  AND c.data.role = 'user'
ORDER BY c.timestamp DESC
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Azure AI Foundry for agent capabilities
- Azure Cosmos DB for scalable storage
- Flask for web framework
- Font Awesome for icons

## 📞 Support

For issues, questions, or contributions:
- Check documentation in `/docs`
- Review troubleshooting guides
- Open an issue on GitHub

## 🗺️ Roadmap

- [ ] Implement data retention policies
- [ ] Add export functionality (CSV/JSON)
- [ ] Advanced search and filtering
- [ ] Analytics dashboard
- [ ] Thread replay feature
- [ ] Batch operations for better performance
- [ ] Redis caching layer
- [ ] Multi-tenant support

---

**Built with ❤️ using Azure AI Foundry and Cosmos DB**
AI Agents Hackathon

## Setup Instructions

This guide will help you set up and run the Azure AI Agent app using Codespaces.

---

## 🚀 Setup Instructions

### 1. Create Codespace
- Create a **Codespace** on the `main` branch of this repository.

---

### 2. Configure Environment Variables
- Rename the file `copy.env` to `.env`.
- Open the `.env` file and replace the variables with your own values:
  ```env
  AZURE_AGENT_IA=your_agent_id
  AZURE_ENDPOINT=your_endpoint_url
  
### Install Azure CLI
Run the following command on the terminal:

```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Azure Login
On the terminal:
```bash
az login --use-device-code
```

Select your azure subscription. Just type 1

### Run the Application

```bash
python run_agent.py
```

```bash
python app.py
```

Click on Running on http://127.0.0.1:5000

### Test the Application

Ask this question:

**What's the maximum I can claim for meals?**
