# Architecture Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser UI                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Chat    │  │  Logs    │  │  Stats   │  │  Source  │   │
│  │  Input   │  │  Panel   │  │  Panel   │  │  Toggle  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        │ HTTP POST   │ HTTP POST   │ HTTP GET    │ Switch
        ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────┐
│                     Flask Application                        │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────┐   │
│  │ /api/chat  │  │/api/thread │  │ /api/cosmos-stats   │   │
│  │            │  │    -logs   │  │ /api/all-threads    │   │
│  └─────┬──────┘  └─────┬──────┘  └──────────┬──────────┘   │
│        │               │                     │               │
│        │         ┌─────┴─────┐              │               │
│        │         │  Cosmos   │              │               │
│        │         │  Helpers  │◀─────────────┘               │
│        │         └─────┬─────┘                              │
└────────┼───────────────┼────────────────────────────────────┘
         │               │
         ▼               ▼
┌─────────────────┐  ┌──────────────────┐
│   Azure AI      │  │   Cosmos DB      │
│   Foundry       │  │   Database       │
│                 │  │                  │
│  ┌───────────┐  │  │  ┌────────────┐ │
│  │  Agent    │  │  │  │ AgentLogsDB│ │
│  │  Thread   │  │  │  │            │ │
│  │  Messages │  │  │  │ ThreadLogs │ │
│  │  Runs     │  │  │  │ Container  │ │
│  └───────────┘  │  │  └────────────┘ │
└─────────────────┘  └──────────────────┘
```

## Data Flow: Sending a Message

```
1. User Types Message
        │
        ▼
2. Frontend: chat.js
   ┌────────────────────┐
   │ sendMessage()      │
   │ POST /api/chat     │
   └─────────┬──────────┘
             │
             ▼
3. Backend: app.py
   ┌────────────────────────────────┐
   │ Create/Get Thread              │
   │ ├─ New? Create thread          │
   │ └─ Store thread_created event  │─────┐
   └─────────┬──────────────────────┘     │
             │                             │
             ▼                             │
   ┌────────────────────────────────┐     │
   │ Send User Message to Agent     │     │
   │ ├─ Create message              │     │
   │ └─ Store message to Cosmos DB  │─────┤
   └─────────┬──────────────────────┘     │
             │                             │
             ▼                             │
   ┌────────────────────────────────┐     │
   │ Process with Agent             │     │
   │ ├─ Run agent                   │     │
   │ └─ Store run to Cosmos DB      │─────┤
   └─────────┬──────────────────────┘     │
             │                             │
             ▼                             │
   ┌────────────────────────────────┐     │
   │ Get Agent Response             │     │
   │ ├─ Fetch messages              │     │
   │ └─ Store assistant msg to DB   │─────┤
   └─────────┬──────────────────────┘     │
             │                             │
             ▼                             ▼
   ┌────────────────────┐         ┌────────────────┐
   │ Return Response    │         │   Cosmos DB    │
   │ to Frontend        │         │   (Stored)     │
   └─────────┬──────────┘         └────────────────┘
             │
             ▼
4. Frontend Display
   ┌────────────────────┐
   │ addMessage()       │
   │ Show in Chat UI    │
   └────────────────────┘
```

## Cosmos DB Document Flow

```
┌─────────────────────────────────────────────┐
│            Cosmos DB Container              │
│              "ThreadLogs"                   │
│                                             │
│  Partition Key: /thread_id                 │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │  Thread: thread_abc123             │    │
│  │  ┌──────────────────────────────┐  │    │
│  │  │ Doc 1: thread_created        │  │    │
│  │  │ {                            │  │    │
│  │  │   id: uuid-1                 │  │    │
│  │  │   thread_id: thread_abc123   │  │    │
│  │  │   log_type: "thread_created" │  │    │
│  │  │   timestamp: "2025-..."      │  │    │
│  │  │   data: {...}                │  │    │
│  │  │ }                            │  │    │
│  │  └──────────────────────────────┘  │    │
│  │  ┌──────────────────────────────┐  │    │
│  │  │ Doc 2: message (user)        │  │    │
│  │  │ {                            │  │    │
│  │  │   id: uuid-2                 │  │    │
│  │  │   thread_id: thread_abc123   │  │    │
│  │  │   log_type: "message"        │  │    │
│  │  │   timestamp: "2025-..."      │  │    │
│  │  │   data: {                    │  │    │
│  │  │     role: "user",            │  │    │
│  │  │     content: [...]           │  │    │
│  │  │   }                          │  │    │
│  │  │ }                            │  │    │
│  │  └──────────────────────────────┘  │    │
│  │  ┌──────────────────────────────┐  │    │
│  │  │ Doc 3: run                   │  │    │
│  │  └──────────────────────────────┘  │    │
│  │  ┌──────────────────────────────┐  │    │
│  │  │ Doc 4: message (assistant)   │  │    │
│  │  └──────────────────────────────┘  │    │
│  └────────────────────────────────────┘    │
│  ┌────────────────────────────────────┐    │
│  │  Thread: thread_xyz789             │    │
│  │  └─ Documents for this thread...   │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## UI Component Hierarchy

```
┌────────────────────────────────────────────────────┐
│                  index.html                        │
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │           chat-container                  │    │
│  │                                           │    │
│  │  ┌────────────────────────────────────┐  │    │
│  │  │        chat-header                 │  │    │
│  │  │  ┌──────────┐  ┌─────────────┐    │  │    │
│  │  │  │agent-info│  │header-actions│    │  │    │
│  │  │  └──────────┘  │ • Logs Btn  │    │  │    │
│  │  │                │ • New Chat  │    │  │    │
│  │  │                └─────────────┘    │  │    │
│  │  └────────────────────────────────────┘  │    │
│  │                                           │    │
│  │  ┌────────────────────────────────────┐  │    │
│  │  │       chat-messages                │  │    │
│  │  │  • User messages                   │  │    │
│  │  │  • Agent messages                  │  │    │
│  │  └────────────────────────────────────┘  │    │
│  │                                           │    │
│  │  ┌────────────────────────────────────┐  │    │
│  │  │    chat-input-container            │  │    │
│  │  │  • Message input                   │  │    │
│  │  │  • Send button                     │  │    │
│  │  └────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────┘    │
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │         logs-panel (slide-in)            │    │
│  │                                           │    │
│  │  ┌────────────────────────────────────┐  │    │
│  │  │        logs-header                 │  │    │
│  │  │  • Title                           │  │    │
│  │  │  • Close button                    │  │    │
│  │  └────────────────────────────────────┘  │    │
│  │                                           │    │
│  │  ┌────────────────────────────────────┐  │    │
│  │  │        logs-info                   │  │    │
│  │  │  • Thread ID                       │  │    │
│  │  │  • Total Messages                  │  │    │
│  │  │  • Source Dropdown ▼               │  │    │
│  │  │  • Refresh Button                  │  │    │
│  │  └────────────────────────────────────┘  │    │
│  │                                           │    │
│  │  ┌────────────────────────────────────┐  │    │
│  │  │       cosmos-stats                 │  │    │
│  │  │  • Stats Button                    │  │    │
│  │  │  • Stats Content                   │  │    │
│  │  │    ├─ Stats Grid                   │  │    │
│  │  │    └─ Log Types                    │  │    │
│  │  └────────────────────────────────────┘  │    │
│  │                                           │    │
│  │  ┌────────────────────────────────────┐  │    │
│  │  │        logs-content                │  │    │
│  │  │  • Log entries                     │  │    │
│  │  │  • Run information                 │  │    │
│  │  └────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────┐
│          ChatInterface Class                │
│                                             │
│  Properties:                                │
│  ├─ sessionId      (current session)        │
│  ├─ isLoading      (loading state)          │
│  ├─ logsVisible    (panel visibility)       │
│  └─ DOM elements   (UI references)          │
│                                             │
│  Methods:                                   │
│  ├─ initializeSession()                     │
│  │    └─ POST /api/new-session              │
│  │         └─ Sets sessionId                │
│  │                                           │
│  ├─ sendMessage()                           │
│  │    └─ POST /api/chat                     │
│  │         ├─ Sends message                 │
│  │         ├─ Stores to Cosmos DB           │
│  │         └─ Returns response              │
│  │                                           │
│  ├─ loadThreadLogs()                        │
│  │    └─ POST /api/thread-logs              │
│  │         ├─ Gets source (agent/cosmos)    │
│  │         └─ Returns logs array            │
│  │                                           │
│  ├─ loadCosmosStats()                       │
│  │    └─ GET /api/cosmos-stats              │
│  │         └─ Returns statistics            │
│  │                                           │
│  └─ Display Methods                         │
│       ├─ displayThreadLogs()                │
│       ├─ displayCosmosLogs()                │
│       ├─ displayCosmosStats()               │
│       └─ createLogEntry()                   │
└─────────────────────────────────────────────┘
```

## Query Performance Optimization

```
Query Type          Partition Key Used    RU Cost    Speed
─────────────────────────────────────────────────────────
Single Thread       ✅ Yes (/thread_id)    ~10 RU    Fast
All Messages        ❌ No (cross-part)     ~50 RU    Medium
Statistics          ❌ No (cross-part)     ~100 RU   Slow
Count by Type       ❌ No (cross-part)     ~50 RU    Medium
Recent Threads      ✅ Can use (limited)   ~20 RU    Fast

Optimization Tips:
1. Always include thread_id when possible
2. Use LIMIT to reduce result set size
3. Cache frequent queries (stats, thread list)
4. Index on timestamp for time-based queries
5. Consider separate container for analytics
```

## Error Handling Flow

```
┌─────────────────────────────────────────────┐
│              Error Scenarios                │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Cosmos   │ │ Network  │ │  Agent   │
│ DB Down  │ │  Error   │ │  Failed  │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     ▼            ▼            ▼
┌────────────────────────────────────┐
│      Error Handling Strategy       │
├────────────────────────────────────┤
│ 1. Log to console                  │
│ 2. Show user-friendly message      │
│ 3. Continue with degraded service  │
│ 4. Return appropriate HTTP status  │
└────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────┐
│         User Experience            │
├────────────────────────────────────┤
│ Cosmos DB Down:                    │
│ • Chat works normally              │
│ • Logs from Agent only             │
│ • Stats show "Not configured"      │
│                                    │
│ Network Error:                     │
│ • Show "Connection error"          │
│ • Retry button available           │
│                                    │
│ Agent Failed:                      │
│ • Show error message               │
│ • Keep conversation history        │
│ • Allow retry                      │
└────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────┐
│              Security Stack                 │
├─────────────────────────────────────────────┤
│ Layer 1: Environment Variables              │
│ ├─ .env file (development)                  │
│ ├─ Azure Key Vault (production)             │
│ └─ Managed Identity (recommended)           │
├─────────────────────────────────────────────┤
│ Layer 2: Network Security                   │
│ ├─ HTTPS enforced                           │
│ ├─ Firewall rules                           │
│ └─ Private endpoints (optional)             │
├─────────────────────────────────────────────┤
│ Layer 3: Data Security                      │
│ ├─ Encryption at rest (Cosmos DB)           │
│ ├─ Encryption in transit (TLS)              │
│ └─ No sensitive data in logs                │
├─────────────────────────────────────────────┤
│ Layer 4: Access Control                     │
│ ├─ Azure RBAC                               │
│ ├─ Cosmos DB access keys                    │
│ └─ Least privilege principle                │
└─────────────────────────────────────────────┘
```

These diagrams provide visual understanding of the system architecture, data flows, and component relationships.
