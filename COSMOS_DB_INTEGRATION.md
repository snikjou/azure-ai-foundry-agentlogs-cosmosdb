# Azure Cosmos DB Integration for Agent Thread Logs

## Overview
This implementation provides persistent storage of Azure AI Agent thread logs using Azure Cosmos DB. All messages, runs, and thread activities are automatically stored in Cosmos DB for historical analysis, auditing, and compliance purposes.

## Features

### 1. **Automatic Log Storage**
- **Thread Creation**: Logs when a new thread is created
- **User Messages**: Stores all user messages with full content
- **Assistant Messages**: Stores all AI agent responses
- **Run Information**: Captures run status, model used, and execution details

### 2. **Dual Source Retrieval**
- **Agent (Live)**: Retrieve logs directly from Azure AI Agent
- **Cosmos DB**: Retrieve historical logs from persistent storage
- Toggle between sources using the dropdown in the Logs panel

### 3. **Statistics Dashboard**
- Total logs count
- Number of unique threads
- Log type breakdown (messages, runs, events)
- Database and container information

### 4. **Thread Management**
- View all stored threads
- Access thread summaries with message counts
- Track first and last activity timestamps

## Configuration

### Environment Variables

Add the following to your `.env` file:

```plaintext
# Cosmos DB Configuration
COSMOS_ENDPOINT="https://calpersdb.documents.azure.com:443/"
COSMOS_KEY="QFvboG0XEU1zEEhuF6Xr0cPChQ21FhU5fGLFWwdRjnccbgjYhcSCFDLFunnNw1N9pIeuOheJQ92mACDbktP20A=="
COSMOS_DATABASE_NAME="AgentLogsDB"
COSMOS_CONTAINER_NAME="ThreadLogs"
```

### Cosmos DB Setup

The application will automatically:
1. Connect to Cosmos DB using the provided credentials
2. Create the database if it doesn't exist
3. Create the container with partition key `/thread_id`
4. Set throughput to 400 RU/s

## Document Structure

### Message Document
```json
{
  "id": "uuid",
  "thread_id": "thread_xyz",
  "log_type": "message",
  "timestamp": "2025-10-20T12:00:00.000Z",
  "data": {
    "message_id": "msg_abc123",
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "What is the expense policy?"
      }
    ],
    "created_at": "2025-10-20T12:00:00.000Z"
  }
}
```

### Run Document
```json
{
  "id": "uuid",
  "thread_id": "thread_xyz",
  "log_type": "run",
  "timestamp": "2025-10-20T12:00:05.000Z",
  "data": {
    "run_id": "run_def456",
    "status": "completed",
    "model": "gpt-4",
    "created_at": "2025-10-20T12:00:00.000Z",
    "completed_at": "2025-10-20T12:00:05.000Z"
  }
}
```

### Thread Creation Document
```json
{
  "id": "uuid",
  "thread_id": "thread_xyz",
  "log_type": "thread_created",
  "timestamp": "2025-10-20T11:59:59.000Z",
  "data": {
    "session_id": "session_789",
    "created_at": "2025-10-20T11:59:59.000Z"
  }
}
```

## API Endpoints

### 1. `/api/thread-logs` (POST)
Retrieve logs from either Agent or Cosmos DB

**Request:**
```json
{
  "session_id": "uuid",
  "source": "cosmos"  // or "agent"
}
```

**Response:**
```json
{
  "logs": [...],
  "thread_id": "thread_xyz",
  "source": "cosmos",
  "total_messages": 10
}
```

### 2. `/api/cosmos-stats` (GET)
Get Cosmos DB statistics

**Response:**
```json
{
  "enabled": true,
  "total_logs": 150,
  "total_threads": 25,
  "log_types": [
    {"log_type": "message", "count": 100},
    {"log_type": "run", "count": 40},
    {"log_type": "thread_created", "count": 10}
  ],
  "database": "AgentLogsDB",
  "container": "ThreadLogs"
}
```

### 3. `/api/all-threads` (GET)
Get all stored threads with summaries

**Response:**
```json
{
  "enabled": true,
  "threads": [
    {
      "thread_id": "thread_xyz",
      "message_count": 10,
      "total_logs": 25,
      "first_activity": "2025-10-20T11:59:59.000Z",
      "last_activity": "2025-10-20T12:30:00.000Z"
    }
  ],
  "total_threads": 25
}
```

## Helper Functions

### Backend (app.py)

#### `store_log_to_cosmos(thread_id, log_type, log_data)`
Generic function to store any log entry to Cosmos DB.

#### `store_message_to_cosmos(thread_id, message_data)`
Specialized function for storing message logs.

#### `store_run_to_cosmos(thread_id, run_data)`
Specialized function for storing run information.

#### `get_logs_from_cosmos(thread_id)`
Retrieve all logs for a specific thread from Cosmos DB.

#### `get_all_threads_from_cosmos()`
Retrieve all unique thread IDs from Cosmos DB.

## Usage Guide

### Viewing Logs from Cosmos DB

1. Click the **"Logs"** button in the header
2. Select **"Cosmos DB"** from the Source dropdown
3. Click **"Refresh"** to load logs from Cosmos DB
4. View historical messages, runs, and events

### Viewing Cosmos DB Statistics

1. Open the Logs panel
2. Click **"Cosmos DB Stats"** button
3. View:
   - Total logs stored
   - Number of threads
   - Log type distribution
   - Database and container details

### Switching Between Sources

- **Agent (Live)**: Shows current thread state from Azure AI Agent
- **Cosmos DB**: Shows all historical logs from persistent storage

Use the dropdown to switch between sources and compare real-time vs. stored data.

## Error Handling

The application includes comprehensive error handling:

- **Missing Credentials**: Application continues without Cosmos DB (logs warning)
- **Connection Failures**: Graceful degradation, stores logs locally only
- **Query Errors**: Returns empty arrays, logs errors to console
- **Storage Failures**: Prints warnings but doesn't block chat functionality

## Performance Considerations

### Throughput
- Default: 400 RU/s (suitable for development/testing)
- Production: Consider increasing based on traffic
- Autoscale: Enable for variable workloads

### Partitioning
- Partition Key: `/thread_id`
- Benefits: Efficient queries per thread
- Limitation: Cross-partition queries for statistics

### Query Optimization
- Use partition key in queries when possible
- Limit result sets (e.g., top 50 threads)
- Index on `timestamp` for time-based queries

## Security Best Practices

1. **Store credentials securely**:
   - Use Azure Key Vault in production
   - Never commit `.env` file to version control
   - Use managed identities when possible

2. **Access Control**:
   - Use least-privilege access
   - Enable Azure AD authentication
   - Implement resource tokens for fine-grained access

3. **Data Encryption**:
   - Cosmos DB encrypts data at rest by default
   - Use HTTPS for all connections (enforced)

## Cost Estimation

**Development/Testing:**
- 400 RU/s container: ~$24/month
- 1 GB storage: ~$0.25/month
- Total: ~$24-25/month

**Production (estimate):**
- 1000 RU/s: ~$60/month
- 10 GB storage: ~$2.50/month
- Total: ~$62-65/month

*Note: Prices vary by region. Enable autoscale to optimize costs.*

## Monitoring and Maintenance

### Recommended Monitoring
- Query performance in Azure Portal
- RU consumption patterns
- Storage growth trends
- Failed requests and throttling

### Maintenance Tasks
- Review and optimize queries
- Implement data retention policies
- Archive old threads if needed
- Monitor costs and adjust throughput

## Future Enhancements

### Potential Features
1. **Data Retention**: Automatic cleanup of old logs
2. **Advanced Search**: Full-text search across messages
3. **Analytics**: Aggregate statistics and trends
4. **Export**: Bulk export to JSON/CSV
5. **Thread Replay**: Reconstruct conversations from logs
6. **Compliance Reports**: Audit trail generation

### Scalability
- Implement caching layer (Redis)
- Use async operations for storage
- Batch write operations
- Implement read replicas for analytics

## Troubleshooting

### Common Issues

**1. Cosmos DB not connecting**
- Verify endpoint and key in `.env`
- Check network connectivity
- Ensure firewall allows your IP

**2. High RU consumption**
- Review query patterns
- Add indexes if needed
- Consider increasing throughput temporarily

**3. Storage failures**
- Check Cosmos DB account status
- Verify permissions
- Review error logs in console

**4. Missing logs in Cosmos DB**
- Verify storage functions are being called
- Check for errors in application logs
- Ensure Cosmos DB connection is active

## Support

For issues or questions:
1. Check application logs for errors
2. Verify Cosmos DB connectivity in Azure Portal
3. Review API responses in browser developer tools
4. Check this documentation for configuration details
