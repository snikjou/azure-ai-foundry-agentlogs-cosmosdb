// Chat functionality
class ChatInterface {
    constructor() {
        this.sessionId = null;
        this.isLoading = false;
        this.logsVisible = false;
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
        
        // Logs panel elements
        this.logsBtn = document.getElementById('logsBtn');
        this.logsPanel = document.getElementById('logsPanel');
        this.closeLogsBtn = document.getElementById('closeLogsBtn');
        this.refreshLogsBtn = document.getElementById('refreshLogsBtn');
        this.logsContent = document.getElementById('logsContent');
        this.threadId = document.getElementById('threadId');
        this.totalMessages = document.getElementById('totalMessages');
        this.logSource = document.getElementById('logSource');
        this.statsBtn = document.getElementById('statsBtn');
        this.statsContent = document.getElementById('statsContent');
    }

    initializeEventListeners() {
        // Form submission
        this.chatForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // New chat button
        this.newChatBtn.addEventListener('click', () => this.startNewChat());
        
        // Logs panel buttons
        this.logsBtn.addEventListener('click', () => this.toggleLogsPanel());
        this.closeLogsBtn.addEventListener('click', () => this.toggleLogsPanel());
        this.refreshLogsBtn.addEventListener('click', () => this.loadThreadLogs());
        this.logSource.addEventListener('change', () => this.loadThreadLogs());
        this.statsBtn.addEventListener('click', () => this.toggleCosmosStats());
        
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
        
        // Clear logs panel
        this.logsContent.innerHTML = `
            <div class="logs-empty">
                <i class="fas fa-inbox"></i>
                <p>No logs available yet. Start a conversation to see thread logs.</p>
            </div>
        `;
        this.threadId.textContent = 'N/A';
        this.totalMessages.textContent = '0';
        
        // Focus input
        this.messageInput.focus();
        
        // Add visual feedback
        this.newChatBtn.innerHTML = '<i class="fas fa-check"></i> New Chat';
        setTimeout(() => {
            this.newChatBtn.innerHTML = '<i class="fas fa-plus"></i> New Chat';
        }, 1500);
    }

    toggleLogsPanel() {
        this.logsVisible = !this.logsVisible;
        this.logsPanel.classList.toggle('active');
        
        if (this.logsVisible) {
            this.loadThreadLogs();
        }
    }

    async loadThreadLogs() {
        if (!this.sessionId) {
            this.showLogsError('No active session');
            return;
        }

        try {
            // Show loading state
            this.refreshLogsBtn.disabled = true;
            this.refreshLogsBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Loading...';
            
            const source = this.logSource.value;
            const response = await fetch('/api/thread-logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    source: source
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (source === 'cosmos') {
                    this.displayCosmosLogs(data);
                } else {
                    this.displayThreadLogs(data);
                }
            } else {
                const errorData = await response.json();
                this.showLogsError(errorData.error || 'Failed to load logs');
            }
        } catch (error) {
            console.error('Error loading thread logs:', error);
            this.showLogsError('Failed to connect to server');
        } finally {
            this.refreshLogsBtn.disabled = false;
            this.refreshLogsBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        }
    }

    async toggleCosmosStats() {
        const isVisible = this.statsContent.style.display !== 'none';
        
        if (isVisible) {
            this.statsContent.style.display = 'none';
            this.statsBtn.innerHTML = '<i class="fas fa-database"></i> Cosmos DB Stats';
        } else {
            this.statsContent.style.display = 'block';
            this.statsBtn.innerHTML = '<i class="fas fa-database"></i> Hide Stats';
            await this.loadCosmosStats();
        }
    }

    async loadCosmosStats() {
        this.statsContent.innerHTML = '<div class="stats-loading">Loading stats...</div>';
        
        try {
            const response = await fetch('/api/cosmos-stats');
            if (response.ok) {
                const data = await response.json();
                this.displayCosmosStats(data);
            } else {
                this.statsContent.innerHTML = '<div class="stats-error">Failed to load stats</div>';
            }
        } catch (error) {
            console.error('Error loading Cosmos stats:', error);
            this.statsContent.innerHTML = '<div class="stats-error">Connection error</div>';
        }
    }

    displayCosmosStats(data) {
        if (!data.enabled) {
            this.statsContent.innerHTML = `
                <div class="stats-disabled">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${data.message || 'Cosmos DB is not configured'}</p>
                </div>
            `;
            return;
        }

        let logTypesHtml = '';
        if (data.log_types && data.log_types.length > 0) {
            logTypesHtml = data.log_types.map(lt => `
                <div class="stat-row">
                    <span class="stat-label">${lt.log_type}:</span>
                    <span class="stat-value">${lt.count}</span>
                </div>
            `).join('');
        }

        this.statsContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-icon"><i class="fas fa-database"></i></div>
                    <div class="stat-details">
                        <div class="stat-label">Database</div>
                        <div class="stat-value">${data.database}</div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon"><i class="fas fa-box"></i></div>
                    <div class="stat-details">
                        <div class="stat-label">Container</div>
                        <div class="stat-value">${data.container}</div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon"><i class="fas fa-file-alt"></i></div>
                    <div class="stat-details">
                        <div class="stat-label">Total Logs</div>
                        <div class="stat-value">${data.total_logs}</div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon"><i class="fas fa-comments"></i></div>
                    <div class="stat-details">
                        <div class="stat-label">Threads</div>
                        <div class="stat-value">${data.total_threads}</div>
                    </div>
                </div>
            </div>
            ${logTypesHtml ? `
                <div class="log-types-section">
                    <h4>Log Types</h4>
                    ${logTypesHtml}
                </div>
            ` : ''}
        `;
    }

    displayCosmosLogs(data) {
        // Update thread info
        this.threadId.textContent = data.thread_id || 'N/A';
        this.totalMessages.textContent = data.total_messages || 0;

        // Clear existing logs
        this.logsContent.innerHTML = '';

        if (!data.logs || data.logs.length === 0) {
            this.logsContent.innerHTML = `
                <div class="logs-empty">
                    <i class="fas fa-inbox"></i>
                    <p>No logs stored in Cosmos DB yet.</p>
                </div>
            `;
            return;
        }

        // Group logs by type
        const messages = data.logs.filter(log => log.log_type === 'message');
        const runs = data.logs.filter(log => log.log_type === 'run');
        const others = data.logs.filter(log => log.log_type !== 'message' && log.log_type !== 'run');

        // Display messages
        if (messages.length > 0) {
            const messagesSection = document.createElement('div');
            messagesSection.className = 'cosmos-section';
            messagesSection.innerHTML = '<h3><i class="fas fa-comments"></i> Messages</h3>';
            
            messages.forEach((log, index) => {
                const logEntry = this.createCosmosLogEntry(log, index + 1);
                messagesSection.appendChild(logEntry);
            });
            
            this.logsContent.appendChild(messagesSection);
        }

        // Display runs
        if (runs.length > 0) {
            const runsSection = document.createElement('div');
            runsSection.className = 'cosmos-section';
            runsSection.innerHTML = '<h3><i class="fas fa-cogs"></i> Runs</h3>';
            
            runs.forEach((log) => {
                const runEntry = this.createCosmosRunEntry(log);
                runsSection.appendChild(runEntry);
            });
            
            this.logsContent.appendChild(runsSection);
        }

        // Display other logs
        if (others.length > 0) {
            const othersSection = document.createElement('div');
            othersSection.className = 'cosmos-section';
            othersSection.innerHTML = '<h3><i class="fas fa-list"></i> Other Events</h3>';
            
            others.forEach((log) => {
                const otherEntry = this.createCosmosOtherEntry(log);
                othersSection.appendChild(otherEntry);
            });
            
            this.logsContent.appendChild(othersSection);
        }
    }

    createCosmosLogEntry(log, index) {
        const entry = document.createElement('div');
        entry.className = `log-entry log-${log.data.role?.toLowerCase() || 'unknown'}`;
        
        const header = document.createElement('div');
        header.className = 'log-header';
        header.innerHTML = `
            <div class="log-meta">
                <span class="log-index">#${index}</span>
                <span class="log-role ${log.data.role?.toLowerCase() || 'unknown'}">${log.data.role || 'Unknown'}</span>
                ${log.timestamp ? `<span class="log-time">${this.formatTimestamp(log.timestamp)}</span>` : ''}
            </div>
            <span class="log-id" title="${log.id}">${log.id.substring(0, 12)}...</span>
        `;
        
        const content = document.createElement('div');
        content.className = 'log-content';
        
        if (log.data.content && log.data.content.length > 0) {
            log.data.content.forEach(item => {
                if (item.type === 'text') {
                    const textDiv = document.createElement('div');
                    textDiv.className = 'log-text';
                    textDiv.textContent = item.text;
                    content.appendChild(textDiv);
                }
            });
        } else {
            content.innerHTML = '<em class="log-empty">No content</em>';
        }
        
        entry.appendChild(header);
        entry.appendChild(content);
        
        return entry;
    }

    createCosmosRunEntry(log) {
        const entry = document.createElement('div');
        entry.className = 'run-entry';
        entry.innerHTML = `
            <div class="run-detail">
                <span class="run-label">Run ID:</span>
                <span class="run-value">${log.data.run_id || 'N/A'}</span>
            </div>
            <div class="run-detail">
                <span class="run-label">Status:</span>
                <span class="run-status status-${log.data.status?.toLowerCase() || 'unknown'}">${log.data.status || 'Unknown'}</span>
            </div>
            ${log.data.model ? `
                <div class="run-detail">
                    <span class="run-label">Model:</span>
                    <span class="run-value">${log.data.model}</span>
                </div>
            ` : ''}
            <div class="run-detail">
                <span class="run-label">Stored:</span>
                <span class="run-value">${this.formatTimestamp(log.timestamp)}</span>
            </div>
        `;
        return entry;
    }

    createCosmosOtherEntry(log) {
        const entry = document.createElement('div');
        entry.className = 'log-entry log-other';
        entry.innerHTML = `
            <div class="log-header">
                <div class="log-meta">
                    <span class="log-role">${log.log_type}</span>
                    ${log.timestamp ? `<span class="log-time">${this.formatTimestamp(log.timestamp)}</span>` : ''}
                </div>
            </div>
            <div class="log-content">
                <pre class="log-json">${JSON.stringify(log.data, null, 2)}</pre>
            </div>
        `;
        return entry;
    }

    displayThreadLogs(data) {
        // Update thread info
        this.threadId.textContent = data.thread_id || 'N/A';
        this.totalMessages.textContent = data.total_messages || 0;

        // Clear existing logs
        this.logsContent.innerHTML = '';

        if (!data.logs || data.logs.length === 0) {
            this.logsContent.innerHTML = `
                <div class="logs-empty">
                    <i class="fas fa-inbox"></i>
                    <p>No logs available yet. Start a conversation to see thread logs.</p>
                </div>
            `;
            return;
        }

        // Display logs
        data.logs.forEach((log, index) => {
            const logEntry = this.createLogEntry(log, index + 1);
            this.logsContent.appendChild(logEntry);
        });

        // Add run information if available
        if (data.run_info && data.run_info.length > 0) {
            const runSection = document.createElement('div');
            runSection.className = 'run-info-section';
            runSection.innerHTML = `
                <h3><i class="fas fa-cogs"></i> Run Information</h3>
            `;
            
            data.run_info.forEach(run => {
                const runEntry = document.createElement('div');
                runEntry.className = 'run-entry';
                runEntry.innerHTML = `
                    <div class="run-detail">
                        <span class="run-label">Run ID:</span>
                        <span class="run-value">${run.id}</span>
                    </div>
                    <div class="run-detail">
                        <span class="run-label">Status:</span>
                        <span class="run-status status-${run.status.toLowerCase()}">${run.status}</span>
                    </div>
                    ${run.model ? `
                        <div class="run-detail">
                            <span class="run-label">Model:</span>
                            <span class="run-value">${run.model}</span>
                        </div>
                    ` : ''}
                    <div class="run-detail">
                        <span class="run-label">Created:</span>
                        <span class="run-value">${this.formatTimestamp(run.created_at)}</span>
                    </div>
                    ${run.completed_at ? `
                        <div class="run-detail">
                            <span class="run-label">Completed:</span>
                            <span class="run-value">${this.formatTimestamp(run.completed_at)}</span>
                        </div>
                    ` : ''}
                `;
                runSection.appendChild(runEntry);
            });
            
            this.logsContent.appendChild(runSection);
        }
    }

    createLogEntry(log, index) {
        const entry = document.createElement('div');
        entry.className = `log-entry log-${log.role.toLowerCase()}`;
        
        const header = document.createElement('div');
        header.className = 'log-header';
        header.innerHTML = `
            <div class="log-meta">
                <span class="log-index">#${index}</span>
                <span class="log-role ${log.role.toLowerCase()}">${log.role}</span>
                ${log.created_at ? `<span class="log-time">${this.formatTimestamp(log.created_at)}</span>` : ''}
            </div>
            <span class="log-id" title="${log.id}">${log.id.substring(0, 12)}...</span>
        `;
        
        const content = document.createElement('div');
        content.className = 'log-content';
        
        if (log.content && log.content.length > 0) {
            log.content.forEach(item => {
                if (item.type === 'text') {
                    const textDiv = document.createElement('div');
                    textDiv.className = 'log-text';
                    textDiv.textContent = item.text;
                    content.appendChild(textDiv);
                }
            });
        } else {
            content.innerHTML = '<em class="log-empty">No content</em>';
        }
        
        // Add file citations if present
        if (log.file_citations && log.file_citations.length > 0) {
            const citationsDiv = document.createElement('div');
            citationsDiv.className = 'log-citations';
            citationsDiv.innerHTML = `
                <strong>File Citations:</strong>
                ${log.file_citations.map(c => `<span class="citation-badge">${c.file_id}</span>`).join(' ')}
            `;
            content.appendChild(citationsDiv);
        }
        
        entry.appendChild(header);
        entry.appendChild(content);
        
        return entry;
    }

    formatTimestamp(isoString) {
        if (!isoString) return 'N/A';
        
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;
        
        // If less than a minute ago
        if (diff < 60000) {
            return 'Just now';
        }
        
        // If less than an hour ago
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
        
        // If today
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        
        // Otherwise show full date
        return date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    showLogsError(message) {
        this.logsContent.innerHTML = `
            <div class="logs-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
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