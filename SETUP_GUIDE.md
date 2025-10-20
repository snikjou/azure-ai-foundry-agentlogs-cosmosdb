# Setup Guide: Azure Cosmos DB Integration

## Prerequisites

- Python 3.8 or higher
- Azure AI Foundry Agent configured
- Azure Cosmos DB account (already provided)

## Step-by-Step Setup

### 1. Install Dependencies

```powershell
pip install -r requirements.txt
```

This will install:
- `azure-cosmos==4.5.1` - Cosmos DB Python SDK
- All other existing dependencies

### 2. Configure Environment Variables

Edit your `.env` file (or create from `Copy.env`):

```plaintext
# Azure AI Configuration (existing)
AZURE_AGENT_ID="your-agent-id"
AZURE_ENDPOINT="your-azure-endpoint"

# Cosmos DB Configuration (new)
COSMOS_ENDPOINT="https://calpersdb.documents.azure.com:443/"
COSMOS_KEY="QFvboG0XEU1zEEhuF6Xr0cPChQ21FhU5fGLFWwdRjnccbgjYhcSCFDLFunnNw1N9pIeuOheJQ92mACDbktP20A=="
COSMOS_DATABASE_NAME="AgentLogsDB"
COSMOS_CONTAINER_NAME="ThreadLogs"
```

### 3. Verify Cosmos DB Connection

The application will automatically:
- Connect to Cosmos DB on startup
- Create database `AgentLogsDB` if it doesn't exist
- Create container `ThreadLogs` with partition key `/thread_id`
- Set throughput to 400 RU/s

You should see this message on startup:
```
✓ Connected to Cosmos DB: AgentLogsDB/ThreadLogs
```

### 4. Run the Application

```powershell
python app.py
```

### 5. Test the Integration

1. **Start a conversation**:
   - Open http://localhost:5000
   - Send a message to the agent

2. **View live logs**:
   - Click "Logs" button
   - Keep source as "Agent (Live)"
   - See real-time thread messages

3. **View Cosmos DB logs**:
   - Change source to "Cosmos DB"
   - Click "Refresh"
   - See stored historical logs

4. **Check statistics**:
   - Click "Cosmos DB Stats"
   - View total logs, threads, and log types

## Verification Checklist

- [ ] Dependencies installed successfully
- [ ] `.env` file configured with Cosmos DB credentials
- [ ] Application starts without errors
- [ ] Cosmos DB connection message appears
- [ ] Can send messages and receive responses
- [ ] Logs appear in "Agent (Live)" mode
- [ ] Logs appear in "Cosmos DB" mode
- [ ] Cosmos DB Stats loads successfully

## Troubleshooting

### Issue: "Could not connect to Cosmos DB"

**Solutions:**
1. Verify `COSMOS_ENDPOINT` and `COSMOS_KEY` in `.env`
2. Check network connectivity
3. Ensure Cosmos DB account is active in Azure Portal
4. Verify firewall rules allow your IP address

### Issue: "No logs in Cosmos DB"

**Solutions:**
1. Send at least one message first
2. Wait a few seconds for storage to complete
3. Refresh the logs panel
4. Check console for storage errors

### Issue: "Stats show 0 logs"

**Solutions:**
1. Ensure you've had at least one conversation
2. Verify source is set to "Cosmos DB"
3. Check if database and container exist in Azure Portal
4. Review application logs for errors

### Issue: High RU consumption

**Solutions:**
1. Reduce query frequency
2. Limit number of threads retrieved
3. Increase RU/s in Azure Portal if needed
4. Implement caching for frequently accessed data

## Optional: Verify in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Cosmos DB account: `calpersdb`
3. Select "Data Explorer"
4. Expand `AgentLogsDB` → `ThreadLogs`
5. Click "Items" to see stored documents
6. Run queries to explore your data

### Sample Queries

**Count total logs:**
```sql
SELECT VALUE COUNT(1) FROM c
```

**Get all messages:**
```sql
SELECT * FROM c WHERE c.log_type = 'message'
```

**Get logs for specific thread:**
```sql
SELECT * FROM c WHERE c.thread_id = 'your-thread-id' ORDER BY c.timestamp ASC
```

**Get unique thread count:**
```sql
SELECT VALUE COUNT(1) FROM (SELECT DISTINCT c.thread_id FROM c)
```

## Performance Tuning

### For Development
Current settings (400 RU/s) are sufficient for:
- Low to moderate traffic
- Development and testing
- Personal use

### For Production
Consider these adjustments:

1. **Increase Throughput**:
   ```
   Recommended: 1000-4000 RU/s
   Enable: Autoscale (1000-4000 RU/s)
   ```

2. **Add Indexes**:
   - Index on `log_type` for filtering
   - Index on `timestamp` for time-based queries
   - Composite index on `thread_id + timestamp`

3. **Implement Caching**:
   - Cache frequently accessed threads
   - Use Redis for session management
   - Cache statistics for dashboard

4. **Batch Operations**:
   - Queue logs for batch writing
   - Reduce individual write operations
   - Implement retry logic

## Security Hardening

### Development
Current setup uses connection string - acceptable for development.

### Production Recommendations

1. **Use Azure Key Vault**:
   ```python
   from azure.identity import DefaultAzureCredential
   from azure.keyvault.secrets import SecretClient
   
   credential = DefaultAzureCredential()
   client = SecretClient(vault_url="https://your-vault.vault.azure.net/", credential=credential)
   cosmos_key = client.get_secret("cosmos-key").value
   ```

2. **Use Managed Identity**:
   - Enable in App Service/Container Apps
   - Grant Cosmos DB Data Contributor role
   - Remove key from environment variables

3. **Implement RBAC**:
   - Use Azure AD authentication
   - Assign least-privilege roles
   - Audit access regularly

4. **Enable Monitoring**:
   - Application Insights for logging
   - Cosmos DB diagnostic settings
   - Alert on failed requests

## Cost Optimization

### Current Costs (Estimated)
- Container (400 RU/s): ~$24/month
- Storage (< 1 GB): ~$0.25/month
- **Total: ~$24-25/month**

### Optimization Tips

1. **Use Autoscale**:
   - Set minimum: 400 RU/s
   - Set maximum: 1000 RU/s
   - Pay only for what you use

2. **Implement TTL** (Time-To-Live):
   - Auto-delete old logs after X days
   - Reduce storage costs
   - Maintain compliance

3. **Archive Strategy**:
   - Export old logs to Azure Storage
   - Delete from Cosmos DB
   - Storage costs: ~$0.02/GB/month

4. **Query Optimization**:
   - Use partition key in queries
   - Limit result sets
   - Avoid cross-partition queries when possible

## Next Steps

1. **Explore the UI**:
   - Try switching between Agent and Cosmos DB sources
   - Check the statistics dashboard
   - Review different log types

2. **Generate Test Data**:
   - Have multiple conversations
   - View logs growing in Cosmos DB
   - Monitor RU consumption

3. **Customize**:
   - Add custom log types
   - Implement data retention
   - Create custom queries

4. **Monitor**:
   - Check Azure Portal metrics
   - Review application logs
   - Track costs in Azure Cost Management

## Support and Documentation

- **Azure Cosmos DB Docs**: https://docs.microsoft.com/azure/cosmos-db/
- **Python SDK Docs**: https://docs.microsoft.com/python/api/azure-cosmos/
- **Application Docs**: See `COSMOS_DB_INTEGRATION.md`

## Useful Commands

### Check Cosmos DB Connection
```powershell
python -c "from azure.cosmos import CosmosClient; client = CosmosClient('https://calpersdb.documents.azure.com:443/', 'YOUR_KEY'); print('Connected!')"
```

### Test Query
```powershell
# Create test_query.py and run
python test_query.py
```

### View All Databases
```powershell
# In Python
from azure.cosmos import CosmosClient
client = CosmosClient(endpoint, key)
databases = list(client.list_databases())
print(databases)
```

## Congratulations! 🎉

Your Agent Thread Logs are now being stored in Azure Cosmos DB!

You can:
- ✅ View real-time logs from the Agent
- ✅ Access historical logs from Cosmos DB
- ✅ Monitor statistics and metrics
- ✅ Scale as your application grows
