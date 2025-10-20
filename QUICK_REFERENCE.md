# Quick Reference: Azure Cosmos DB Integration

## 🚀 Quick Start

1. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

2. **Configure `.env`:**
   ```plaintext
   COSMOS_ENDPOINT="https://calpersdb.documents.azure.com:443/"
   COSMOS_KEY="QFvboG0XEU1zEEhuF6Xr0cPChQ21FhU5fGLFWwdRjnccbgjYhcSCFDLFunnNw1N9pIeuOheJQ92mACDbktP20A=="
   COSMOS_DATABASE_NAME="AgentLogsDB"
   COSMOS_CONTAINER_NAME="ThreadLogs"
   ```

3. **Run the app:**
   ```powershell
   python app.py
   ```

## 📊 Features at a Glance

| Feature | Description | Access |
|---------|-------------|--------|
| **Automatic Logging** | All messages, runs, and events stored | Automatic |
| **Dual Sources** | View logs from Agent or Cosmos DB | Logs panel → Source dropdown |
| **Statistics** | Total logs, threads, and breakdowns | Logs panel → "Cosmos DB Stats" |
| **Thread History** | Access all stored conversations | API: `/api/all-threads` |

## 🔧 Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/thread-logs` | POST | Get logs (Agent or Cosmos DB) |
| `/api/cosmos-stats` | GET | Get Cosmos DB statistics |
| `/api/all-threads` | GET | Get all stored threads |

## 📁 Document Types Stored

| Type | Description | Contains |
|------|-------------|----------|
| `thread_created` | Thread initialization | Session ID, timestamp |
| `message` | User/Assistant messages | Role, content, timestamp |
| `run` | Agent execution details | Status, model, duration |

## 🎯 Common Tasks

### View Cosmos DB Logs
1. Click "Logs" button
2. Select "Cosmos DB" from dropdown
3. Click "Refresh"

### Check Statistics
1. Open Logs panel
2. Click "Cosmos DB Stats"
3. View totals and breakdowns

### Query from Azure Portal
```sql
-- All messages for a thread
SELECT * FROM c 
WHERE c.thread_id = 'your-thread-id' 
ORDER BY c.timestamp ASC

-- Count by type
SELECT c.log_type, COUNT(1) as count 
FROM c 
GROUP BY c.log_type
```

## 💰 Cost Quick Reference

| Tier | RU/s | Storage | Monthly Cost* |
|------|------|---------|---------------|
| Dev | 400 | 1 GB | ~$24 |
| Test | 1000 | 5 GB | ~$61 |
| Prod | 4000 | 20 GB | ~$237 |

*Estimated, varies by region

## 🔒 Security Checklist

- [ ] Never commit `.env` file
- [ ] Use Key Vault in production
- [ ] Enable managed identity
- [ ] Implement RBAC
- [ ] Enable diagnostic logging
- [ ] Regular access audits

## 📈 Performance Tips

✅ **Do:**
- Use partition key (`thread_id`) in queries
- Implement caching for frequent queries
- Enable autoscale for variable loads
- Monitor RU consumption

❌ **Don't:**
- Run unnecessary cross-partition queries
- Fetch all documents at once
- Ignore throughput limits
- Skip indexing optimization

## 🐛 Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Connection failed | Check endpoint/key in `.env` |
| No logs shown | Send a message first, then refresh |
| High RU usage | Limit query frequency/size |
| Missing stats | Verify Cosmos DB is enabled |

## 📚 Function Reference

### Backend (`app.py`)

```python
# Store logs
store_log_to_cosmos(thread_id, log_type, log_data)
store_message_to_cosmos(thread_id, message_data)
store_run_to_cosmos(thread_id, run_data)

# Retrieve logs
get_logs_from_cosmos(thread_id)
get_all_threads_from_cosmos()
```

### Frontend (`chat.js`)

```javascript
// Load logs
loadThreadLogs()           // Load from selected source
toggleCosmosStats()        // Show/hide statistics
loadCosmosStats()          // Fetch statistics
displayCosmosLogs(data)    // Render Cosmos DB logs
```

## 🎨 UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Source Dropdown | Logs Panel → Header | Switch between Agent/Cosmos DB |
| Refresh Button | Logs Panel → Header | Reload logs |
| Stats Button | Logs Panel → Below Info | Toggle statistics |
| Stats Grid | Stats Section | Display metrics |

## ⚙️ Configuration Options

```python
# Database settings
COSMOS_DATABASE_NAME = "AgentLogsDB"    # Database name
COSMOS_CONTAINER_NAME = "ThreadLogs"   # Container name

# Throughput (set during creation)
offer_throughput = 400  # RU/s (default)

# Partition key
partition_key = "/thread_id"  # Fixed
```

## 🔍 Monitoring Metrics

**Key Metrics to Watch:**
- Request Units (RU) consumed
- Storage used (GB)
- Request latency (ms)
- Failed requests count

**Access:** Azure Portal → Cosmos DB → Metrics

## 📞 Quick Support

**Documentation:**
- Full guide: `COSMOS_DB_INTEGRATION.md`
- Setup: `SETUP_GUIDE.md`
- Logs UI: `LOGS_USER_GUIDE.md`

**Azure Resources:**
- Cosmos DB Portal: https://portal.azure.com
- Documentation: https://docs.microsoft.com/azure/cosmos-db/

## 🎓 Learning Path

1. ✅ Basic setup and configuration
2. ✅ View logs in UI
3. ✅ Understand document structure
4. 📝 Run custom queries in Azure Portal
5. 📝 Implement data retention
6. 📝 Optimize for production
7. 📝 Advanced monitoring and alerts

## ⚡ Power User Tips

1. **Keyboard Workflow:**
   - Send message → Check logs → Refresh → View stats

2. **Query Optimization:**
   - Always include partition key when possible
   - Use `SELECT *` sparingly
   - Add indexes for frequent queries

3. **Cost Optimization:**
   - Enable autoscale
   - Implement TTL for old logs
   - Archive to Azure Storage

4. **Development:**
   - Use local Cosmos DB emulator
   - Test queries in Azure Portal first
   - Monitor RU consumption during development

## ✨ Pro Features (Future)

- [ ] Auto-refresh logs every N seconds
- [ ] Export logs to CSV/JSON
- [ ] Advanced filtering and search
- [ ] Thread replay functionality
- [ ] Custom retention policies
- [ ] Analytics dashboard

---

**Remember:** Cosmos DB credentials are already configured in this setup. Just install dependencies and run! 🚀
