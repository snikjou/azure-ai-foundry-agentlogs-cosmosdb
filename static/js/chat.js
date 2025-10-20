// Chat functionality
class ChatInterface {
    constructor() {
        this.sessionId = null;
        this.isLoading = false;
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeSession();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.chatForm = document.getElementById('chatForm');
        this.sendBtn = document.getElementById('sendBtn');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.charCount = document.getElementById('charCount');
    }

    initializeEventListeners() {
        // Form submission
        this.chatForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // New chat button
        this.newChatBtn.addEventListener('click', () => this.startNewChat());
        
        // Character counter
        this.messageInput.addEventListener('input', () => this.updateCharCounter());
        
        // Enter key handling (prevent shift+enter from submitting)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.chatForm.dispatchEvent(new Event('submit'));
            }
        });

        // Auto-focus input
        this.messageInput.focus();
    }

    async initializeSession() {
        try {
            const response = await fetch('/api/new-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.sessionId = data.session_id;
            } else {
                console.error('Failed to create session');
            }
        } catch (error) {
            console.error('Error creating session:', error);
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        
        // Clear input
        this.messageInput.value = '';
        this.updateCharCounter();
        
        // Send message to backend
        await this.sendMessage(message);
    }

    async sendMessage(message) {
        this.setLoading(true);
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    session_id: this.sessionId
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.addMessage(data.response, 'agent');
                this.sessionId = data.session_id; // Update session ID if needed
            } else {
                const errorData = await response.json();
                this.addMessage(
                    `Sorry, I encountered an error: ${errorData.error || 'Unknown error'}`, 
                    'agent', 
                    true
                );
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage(
                'Sorry, I\'m having trouble connecting right now. Please try again.', 
                'agent', 
                true
            );
        } finally {
            this.setLoading(false);
        }
    }

    addMessage(content, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message${isError ? ' error-message' : ''}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageParagraph = document.createElement('p');
        messageParagraph.textContent = content;
        
        messageContent.appendChild(messageParagraph);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.sendBtn.disabled = loading;
        this.messageInput.disabled = loading;
        this.loadingOverlay.style.display = loading ? 'flex' : 'none';
        
        if (!loading) {
            this.messageInput.focus();
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    updateCharCounter() {
        const length = this.messageInput.value.length;
        this.charCount.textContent = length;
        
        if (length > 800) {
            this.charCount.style.color = '#ef4444';
        } else if (length > 600) {
            this.charCount.style.color = '#f59e0b';
        } else {
            this.charCount.style.color = '#6b7280';
        }
    }

    async startNewChat() {
        // Clear chat messages except the initial welcome message
        const messages = this.chatMessages.querySelectorAll('.message');
        messages.forEach((message, index) => {
            if (index > 0) { // Keep the first welcome message
                message.remove();
            }
        });
        
        // Create new session
        await this.initializeSession();
        
        // Focus input
        this.messageInput.focus();
        
        // Add visual feedback
        this.newChatBtn.innerHTML = '<i class="fas fa-check"></i> New Chat';
        setTimeout(() => {
            this.newChatBtn.innerHTML = '<i class="fas fa-plus"></i> New Chat';
        }, 1500);
    }
}

// Initialize chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatInterface();
});

// Add some utility functions for better UX
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Re-focus input when user returns to tab
        const messageInput = document.getElementById('messageInput');
        if (messageInput && !messageInput.disabled) {
            messageInput.focus();
        }
    }
});

// Handle connection errors gracefully
window.addEventListener('online', () => {
    const statusElement = document.querySelector('.agent-status');
    if (statusElement) {
        statusElement.textContent = 'Online • Ready to help with your expense questions';
    }
});

window.addEventListener('offline', () => {
    const statusElement = document.querySelector('.agent-status');
    if (statusElement) {
        statusElement.textContent = 'Offline • Connection lost';
    }
});