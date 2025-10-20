"""
Azure AI Agent Interaction Script

This script demonstrates how to interact with Azure AI Agents using the Azure AI Projects SDK.
It creates a conversation thread, sends a message to an AI agent, and retrieves the response.

The script is designed to work with a pre-configured Azure AI Agent that can handle
expense-related queries, specifically about meal claim maximums.
"""

# Standard library imports
import os

# Third-party imports
from dotenv import load_dotenv  # For loading environment variables from .env file
from azure.ai.projects import AIProjectClient  # Main client for Azure AI Projects
from azure.identity import DefaultAzureCredential  # Authentication handler for Azure
from azure.ai.agents.models import ListSortOrder  # Enum for message ordering

# Load environment variables from .env file
# This allows us to keep sensitive configuration data out of the source code
load_dotenv()

# Retrieve required environment variables
# These should be set in the .env file or environment
azure_endpoint = os.getenv("AZURE_ENDPOINT")  # The Azure AI Project endpoint URL
azure_agent_id = os.getenv("AZURE_AGENT_ID")  # The unique identifier for the AI agent

# Validate that required environment variables are present
# Without these, the script cannot function properly
if not azure_endpoint or not azure_agent_id:
    raise ValueError("Please set AZURE_ENDPOINT and AZURE_AGENT_ID environment variables")

# Initialize the Azure AI Project client
# This client handles all communication with the Azure AI service
# DefaultAzureCredential automatically handles authentication using various methods:
# - Environment variables, managed identity, Azure CLI, Visual Studio, etc.
project = AIProjectClient(
    credential=DefaultAzureCredential(),
    endpoint=azure_endpoint)

# Retrieve the specific AI agent by its ID
# This validates that the agent exists and is accessible
agent = project.agents.get_agent(azure_agent_id)

# Create a new conversation thread
# A thread represents a conversation session between user and agent
# Each thread maintains context and conversation history
thread = project.agents.threads.create()
print(f"Created thread, ID: {thread.id}")

# Create and send a message to the agent
# This message will be processed by the AI agent within the context of the thread
message = project.agents.messages.create(
    thread_id=thread.id,  # Associate message with the conversation thread
    role="user",  # Specify that this message is from the user (not the assistant)
    content="What's the maximum I can claim for meals?"  # The actual question/query
)

# Execute the agent run to process the message
# This triggers the AI agent to analyze the message and generate a response
# create_and_process() is a convenience method that creates and waits for completion
run = project.agents.runs.create_and_process(
    thread_id=thread.id,  # Process within the context of our thread
    agent_id=agent.id)  # Use the specified agent for processing

# Check if the run completed successfully
# If there was an error, display it; otherwise, retrieve and display the conversation
if run.status == "failed":
    # Display error information if the agent run failed
    print(f"Run failed: {run.last_error}")
else:
    # Retrieve all messages in the thread, ordered chronologically (oldest first)
    # This includes both the user's original message and the agent's response(s)
    messages = project.agents.messages.list(thread_id=thread.id, order=ListSortOrder.ASCENDING)

    # Iterate through all messages in the conversation
    for message in messages:
        # Check if the message contains text content
        # Messages can have different types of content (text, images, etc.)
        if message.text_messages:
            # Display the message role (user/assistant) and the actual text content
            # text_messages[-1] gets the last text message (in case there are multiple)
            print(f"{message.role}: {message.text_messages[-1].text.value}")