"""Flask entry point for the Azure AI Agent chat demo.

The app exposes a tiny API surface that proxies browser chat requests to an
Azure AI Agent.  This file focuses on wiring—credential bootstrapping, thread
management, and returning responses in a shape that the frontend understands.
"""

import os
import uuid
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
from azure.ai.agents.models import ListSortOrder

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

# Initialize Azure client
#
# `DefaultAzureCredential` will cascade through multiple auth mechanisms.  In a
# developer shell it looks for environment variables or Azure CLI credentials;
# in production (e.g., App Service / managed identity) it automatically picks
# up the managed identity token.  The `AIProjectClient` holds the connection to
# the Azure AI service, and we can reuse it across requests because it is
# thread-safe for basic operations.
project = AIProjectClient(
    credential=DefaultAzureCredential(),
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
        else:
            thread_id = active_threads[session_id]
        
        thread_id = active_threads[session_id]
        
        # Send message to the agent
        #
        # The agent message API mirrors the OpenAI format.  We only need to
        # send the role and the user content—the SDK handles brooming extra
        # metadata.
        project.agents.messages.create(
            thread_id=thread_id,
            role="user",
            content=message
        )
        
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
        for msg in messages:
            if msg.role.value.lower() == 'assistant' and msg.text_messages:
                agent_response = msg.text_messages[-1].text.value
                break
        
        if not agent_response:
            return jsonify({'error': 'No response from agent'}), 500
        
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)