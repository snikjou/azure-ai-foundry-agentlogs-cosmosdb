"""Flask entry point for the Azure AI Agent chat demo.

The app exposes a tiny API surface that proxies browser chat requests to an
Azure AI Agent.  This file focuses on wiring—credential bootstrapping, thread
management, and returning responses in a shape that the frontend understands.
"""

import os
import uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
from azure.ai.agents.models import ListSortOrder
from azure.cosmos import CosmosClient, PartitionKey, exceptions

# Load environment variables from .env file
#
# Local development uses a `.env` file to emulate the configuration that would
# normally be provided through Azure App Service or container environment
# variables.  `python-dotenv` silently ignores missing files, which keeps the
# app flexible across environments.
load_dotenv()

app = Flask(__name__)

# Initialize Azure AI client
#
# `AZURE_ENDPOINT` and `AZURE_AGENT_ID` are the two knobs that identify the
# Azure AI resource and specific Agent we want to chat with.  They can be
# rotated without code changes, so we read them at runtime instead of hard
# coding.
azure_endpoint = os.getenv("AZURE_ENDPOINT")
azure_agent_id = os.getenv("AZURE_AGENT_ID")

if not azure_endpoint or not azure_agent_id:
    raise ValueError("Please set AZURE_ENDPOINT and AZURE_AGENT_ID environment variables")

# Initialize Cosmos DB client
#
# Cosmos DB configuration for storing agent thread logs persistently.
# This enables log history, analytics, and auditing capabilities.
cosmos_endpoint = os.getenv("COSMOS_ENDPOINT")
cosmos_key = os.getenv("COSMOS_KEY")
cosmos_database_name = os.getenv("COSMOS_DATABASE_NAME", "AgentLogsDB")
cosmos_container_name = os.getenv("COSMOS_CONTAINER_NAME", "ThreadLogs")

cosmos_client = None
cosmos_container = None

if cosmos_endpoint and cosmos_key:
    try:
        cosmos_client = CosmosClient(cosmos_endpoint, cosmos_key)
        # Create database if it doesn't exist
        database = cosmos_client.create_database_if_not_exists(id=cosmos_database_name)
        # Create container if it doesn't exist with partition key
        # Note: Serverless accounts don't support offer_throughput parameter
        cosmos_container = database.create_container_if_not_exists(
            id=cosmos_container_name,
            partition_key=PartitionKey(path="/thread_id")
        )
        print(f"✓ Connected to Cosmos DB: {cosmos_database_name}/{cosmos_container_name}")
        print(f"  Mode: Serverless (pay-per-request)")
    except Exception as e:
        print(f"⚠ Warning: Could not connect to Cosmos DB: {e}")
        print("  Application will continue without log persistence.")
else:
    print("⚠ Warning: Cosmos DB credentials not provided. Logs will not be persisted.")

# Initialize Azure client
#
# `DefaultAzureCredential` will cascade through multiple auth mechanisms.  In a
# developer shell it looks for environment variables or Azure CLI credentials;
# in production (e.g., App Service / managed identity) it automatically picks
# up the managed identity token.  The `AIProjectClient` holds the connection to
# the Azure AI service, and we can reuse it across requests because it is
# thread-safe for basic operations.
azure_tenant_id = os.getenv("AZURE_TENANT_ID")
credential = DefaultAzureCredential(
    tenant_id=azure_tenant_id
) if azure_tenant_id else DefaultAzureCredential()

project = AIProjectClient(
    credential=credential,
    endpoint=azure_endpoint
)

agent = project.agents.get_agent(azure_agent_id)

# Store active threads (in production, use a database)
#
# The browser sends a `session_id` so the backend can keep consecutive messages
# in the same agent thread.  For this sample we tuck the thread IDs into a
# module-level dictionary.  A production implementation should move this into a
# persistent or distributed cache (Redis, Cosmos DB, etc.) to support scale-out
# scenarios.
active_threads = {}

# Cosmos DB Helper Functions
def store_log_to_cosmos(thread_id, log_type, log_data):
    """Store a log entry to Cosmos DB."""
    if not cosmos_container:
        return False
    
    try:
        document = {
            "id": str(uuid.uuid4()),
            "thread_id": thread_id,
            "log_type": log_type,  # 'message', 'run', 'thread_created', etc.
            "timestamp": datetime.utcnow().isoformat(),
            "data": log_data
        }
        cosmos_container.create_item(body=document)
        return True
    except Exception as e:
        print(f"Error storing log to Cosmos DB: {e}")
        return False

def store_message_to_cosmos(thread_id, message_data):
    """Store a message log entry to Cosmos DB."""
    log_data = {
        "message_id": message_data.get("id"),
        "role": message_data.get("role"),
        "content": message_data.get("content"),
        "created_at": message_data.get("created_at")
    }
    return store_log_to_cosmos(thread_id, "message", log_data)

def store_run_to_cosmos(thread_id, run_data):
    """Store a run log entry to Cosmos DB."""
    log_data = {
        "run_id": run_data.get("id"),
        "status": run_data.get("status"),
        "model": run_data.get("model"),
        "created_at": run_data.get("created_at"),
        "completed_at": run_data.get("completed_at")
    }
    return store_log_to_cosmos(thread_id, "run", log_data)

def get_logs_from_cosmos(thread_id):
    """Retrieve all logs for a specific thread from Cosmos DB."""
    if not cosmos_container:
        return []
    
    try:
        query = f"SELECT * FROM c WHERE c.thread_id = '{thread_id}' ORDER BY c.timestamp ASC"
        items = list(cosmos_container.query_items(
            query=query,
            enable_cross_partition_query=False,
            partition_key=thread_id
        ))
        return items
    except Exception as e:
        print(f"Error retrieving logs from Cosmos DB: {e}")
        return []

def get_all_threads_from_cosmos():
    """Retrieve all unique thread IDs from Cosmos DB."""
    if not cosmos_container:
        return []
    
    try:
        query = "SELECT DISTINCT c.thread_id FROM c"
        items = list(cosmos_container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        return [item['thread_id'] for item in items]
    except Exception as e:
        print(f"Error retrieving threads from Cosmos DB: {e}")
        return []

@app.route('/')
def index():
    """Render the main chat interface template."""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages from the browser client."""
    try:
        data = request.get_json()
        # All incoming payloads are expected to be JSON with a message and a
        # browser-managed session identifier.  We defensively strip whitespace
        # in case the frontend ends up sending padded messages.
        message = data.get('message', '').strip()
        session_id = data.get('session_id')
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Create or get existing thread
        #
        # Each conversation maps to an Azure AI "thread".  When we see a brand
        # new session we create a thread and remember its ID.  Otherwise we keep
        # reusing the stored thread so that the agent has context for follow-up
        # questions.
        if session_id not in active_threads:
            thread = project.agents.threads.create()
            active_threads[session_id] = thread.id
            
            # Store thread creation to Cosmos DB
            store_log_to_cosmos(thread.id, "thread_created", {
                "session_id": session_id,
                "created_at": datetime.utcnow().isoformat()
            })
        else:
            thread_id = active_threads[session_id]
        
        thread_id = active_threads[session_id]
        
        # Send message to the agent
        #
        # The agent message API mirrors the OpenAI format.  We only need to
        # send the role and the user content—the SDK handles brooming extra
        # metadata.
        user_message = project.agents.messages.create(
            thread_id=thread_id,
            role="user",
            content=message
        )
        
        # Store user message to Cosmos DB
        store_message_to_cosmos(thread_id, {
            "id": user_message.id,
            "role": "user",
            "content": [{"type": "text", "text": message}],
            "created_at": user_message.created_at.isoformat() if user_message.created_at else datetime.utcnow().isoformat()
        })
        
        # Process the message with the agent
        #
        # `create_and_process` kicks off a run and blocks until it finishes.
        # That keeps the API simple, but in higher-traffic apps you would likely
        # move to the async pattern and poll for completion, freeing up worker
        # threads.
        run = project.agents.runs.create_and_process(
            thread_id=thread_id,
            agent_id=agent.id
        )
        
        # Store run information to Cosmos DB
        store_run_to_cosmos(thread_id, {
            "id": run.id,
            "status": run.status.value if hasattr(run.status, 'value') else str(run.status),
            "model": run.model if hasattr(run, 'model') else None,
            "created_at": run.created_at.isoformat() if run.created_at else datetime.utcnow().isoformat(),
            "completed_at": run.completed_at.isoformat() if hasattr(run, 'completed_at') and run.completed_at else None
        })
        
        if run.status == "failed":
            return jsonify({'error': f'Agent run failed: {run.last_error}'}), 500
        
        # Get the latest messages
        #
        # The SDK returns messages in reverse chronological order when using
        # `ListSortOrder.DESCENDING`.  We only need the newest assistant payload
        # plus the user's message for context (the latter is already in memory,
        # but fetching both keeps the flow symmetric).
        messages = project.agents.messages.list(
            thread_id=thread_id, 
            order=ListSortOrder.DESCENDING,
            limit=2  # Get last 2 messages (user + agent)
        )
        
        # Find the agent's response
        #
        # Some agent responses may contain multiple text blocks; grabbing the
        # last one preserves the full answer, including tool call summaries or
        # notes the agent may append.
        agent_response = None
        assistant_message = None
        for msg in messages:
            if msg.role.value.lower() == 'assistant' and msg.text_messages:
                agent_response = msg.text_messages[-1].text.value
                assistant_message = msg
                break
        
        if not agent_response:
            return jsonify({'error': 'No response from agent'}), 500
        
        # Store assistant message to Cosmos DB
        if assistant_message:
            content_list = []
            if assistant_message.text_messages:
                for text_msg in assistant_message.text_messages:
                    content_list.append({
                        "type": "text",
                        "text": text_msg.text.value if hasattr(text_msg.text, 'value') else str(text_msg.text)
                    })
            
            store_message_to_cosmos(thread_id, {
                "id": assistant_message.id,
                "role": "assistant",
                "content": content_list,
                "created_at": assistant_message.created_at.isoformat() if assistant_message.created_at else datetime.utcnow().isoformat()
            })
        
        return jsonify({
            'response': agent_response,
            'session_id': session_id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/new-session', methods=['POST'])
def new_session():
    """Create a new chat session identifier for the frontend."""
    session_id = str(uuid.uuid4())
    return jsonify({'session_id': session_id})

@app.route('/api/cosmos-stats', methods=['GET'])
def get_cosmos_stats():
    """Get statistics about stored logs in Cosmos DB."""
    try:
        if not cosmos_container:
            return jsonify({
                'enabled': False,
                'message': 'Cosmos DB is not configured'
            })
        
        # Get total count of documents
        query = "SELECT VALUE COUNT(1) FROM c"
        total_logs = list(cosmos_container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))[0]
        
        # Get count by type
        query = "SELECT c.log_type, COUNT(1) as count FROM c GROUP BY c.log_type"
        log_types = list(cosmos_container.query_items(
            query=query,
            enable_cross_partition_query=True
        ))
        
        # Get all unique threads
        threads = get_all_threads_from_cosmos()
        
        return jsonify({
            'enabled': True,
            'total_logs': total_logs,
            'total_threads': len(threads),
            'log_types': log_types,
            'database': cosmos_database_name,
            'container': cosmos_container_name
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/all-threads', methods=['GET'])
def get_all_threads():
    """Retrieve all thread IDs stored in Cosmos DB."""
    try:
        if not cosmos_container:
            return jsonify({
                'enabled': False,
                'threads': [],
                'message': 'Cosmos DB is not configured'
            })
        
        threads = get_all_threads_from_cosmos()
        
        # Get summary for each thread
        thread_summaries = []
        for thread_id in threads[:50]:  # Limit to 50 for performance
            logs = get_logs_from_cosmos(thread_id)
            message_count = len([log for log in logs if log.get('log_type') == 'message'])
            
            # Get first and last timestamp
            timestamps = [log.get('timestamp') for log in logs if log.get('timestamp')]
            first_activity = min(timestamps) if timestamps else None
            last_activity = max(timestamps) if timestamps else None
            
            thread_summaries.append({
                'thread_id': thread_id,
                'message_count': message_count,
                'total_logs': len(logs),
                'first_activity': first_activity,
                'last_activity': last_activity
            })
        
        return jsonify({
            'enabled': True,
            'threads': thread_summaries,
            'total_threads': len(threads)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/thread-logs', methods=['POST'])
def get_thread_logs():
    """Retrieve all messages/logs from the current agent thread."""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        source = data.get('source', 'agent')  # 'agent' or 'cosmos'
        
        if not session_id:
            return jsonify({'error': 'Session ID is required'}), 400
        
        # Check if thread exists for this session
        if session_id not in active_threads:
            return jsonify({'logs': [], 'thread_id': None, 'source': source})
        
        thread_id = active_threads[session_id]
        
        # If requesting from Cosmos DB
        if source == 'cosmos' and cosmos_container:
            cosmos_logs = get_logs_from_cosmos(thread_id)
            return jsonify({
                'logs': cosmos_logs,
                'thread_id': thread_id,
                'source': 'cosmos',
                'total_messages': len([log for log in cosmos_logs if log.get('log_type') == 'message'])
            })
        
        # Retrieve all messages from the thread
        # Using ASCENDING order to show messages from oldest to newest
        messages = project.agents.messages.list(
            thread_id=thread_id,
            order=ListSortOrder.ASCENDING
        )
        
        # Format messages for frontend display
        logs = []
        for msg in messages:
            log_entry = {
                'id': msg.id,
                'role': msg.role.value if hasattr(msg.role, 'value') else str(msg.role),
                'created_at': msg.created_at.isoformat() if msg.created_at else None,
                'content': []
            }
            
            # Extract text content
            if msg.text_messages:
                for text_msg in msg.text_messages:
                    log_entry['content'].append({
                        'type': 'text',
                        'text': text_msg.text.value if hasattr(text_msg.text, 'value') else str(text_msg.text)
                    })
            
            # Include file citations if present
            if hasattr(msg, 'file_citations') and msg.file_citations:
                log_entry['file_citations'] = [
                    {'file_id': citation.file_id} 
                    for citation in msg.file_citations
                ]
            
            logs.append(log_entry)
        
        # Get run information for the thread
        runs = project.agents.runs.list(thread_id=thread_id)
        run_info = []
        for run in runs:
            run_info.append({
                'id': run.id,
                'status': run.status.value if hasattr(run.status, 'value') else str(run.status),
                'created_at': run.created_at.isoformat() if run.created_at else None,
                'completed_at': run.completed_at.isoformat() if hasattr(run, 'completed_at') and run.completed_at else None,
                'model': run.model if hasattr(run, 'model') else None
            })
        
        return jsonify({
            'logs': logs,
            'thread_id': thread_id,
            'run_info': run_info,
            'total_messages': len(logs)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)