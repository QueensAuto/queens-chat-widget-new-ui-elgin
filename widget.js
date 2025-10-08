class ChatWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                #chat-messages::-webkit-scrollbar { width: 6px; }
                #chat-messages::-webkit-scrollbar-track { background: transparent; }
                #chat-messages::-webkit-scrollbar-thumb { background-color: #6B7280; border-radius: 3px; }
                #chat-messages::-webkit-scrollbar-thumb:hover { background-color: #9CA3AF; }

                .chat-widget-wrapper {
                    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                    z-index: 9999; display: flex; flex-direction: column; align-items: center;
                    opacity: 0; transform: translate(-50%, 30px);
                    animation: slide-up 0.5s 0.3s ease-out forwards;
                }
                @keyframes slide-up { to { opacity: 1; transform: translate(-50%, 0); } }

                #chat-messages {
                    width: calc(100vw - 40px); max-width: 400px; max-height: 60vh;
                    background: rgba(31, 41, 55, 0.8); backdrop-filter: blur(10px);
                    border-radius: 12px; margin-bottom: 12px; display: none;
                    flex-direction: column; overflow-y: auto; padding: 40px 15px 15px 15px;
                    border: 1px solid rgba(255, 255, 255, 0.1); position: relative;
                }
                #chat-messages.visible { display: flex; }

                #minimize-btn {
                    position: absolute; top: 10px; right: 10px;
                    background: rgba(255, 255, 255, 0.1); color: white;
                    border: none; width: 24px; height: 24px; border-radius: 50%;
                    cursor: pointer; font-size: 18px; line-height: 24px;
                }
                #minimize-btn:hover { background: rgba(255, 255, 255, 0.2); }

                .message-group { display: flex; flex-direction: column; max-width: 85%; margin-bottom: 15px; }
                .bot-group { align-self: flex-start; }
                .user-group { align-self: flex-end; }
                .message-eyebrow { font-size: 12px; color: #a0aec0; margin-bottom: 4px; padding-left: 12px; }
                .message { padding: 10px 15px; border-radius: 18px; font-size: 14px; color: white; word-wrap: break-word; }
                .user-message { background: #6B7280; border-bottom-right-radius: 4px; align-self: flex-end;}
                .bot-message { background: #2b6cb0; border-bottom-left-radius: 4px; }
                .typing-indicator { color: #a0aec0; font-style: italic; }

                #chat-input-container {
                    display: flex; align-items: center; background: rgba(31, 41, 55, 0.8);
                    backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 9999px; padding: 8px; width: calc(100vw - 80px);
                    max-width: 256px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                    transition: width 0.4s ease-in-out, transform 0.2s ease-out, max-width 0.4s ease-in-out;
                }
                #chat-input-container:hover { transform: scale(1.03); }
                #chat-input-field {
                    flex-grow: 1; background: transparent; border: none; outline: none;
                    color: white; padding: 0 12px; font-size: 14px;
                }
                #chat-input-field::placeholder { color: #9CA3AF; }
                #send-btn {
                    background: #4A5568; border: none; border-radius: 50%;
                    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
                    cursor: pointer;
                }
                #send-btn:hover { background: #2D3748; }
                #send-btn svg { width: 18px; height: 18px; color: white; }

                .quick-replies { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; align-items: flex-start; }
                .quick-reply { background: rgba(74, 85, 104, 0.8); color: white;
                    border-radius: 16px; padding: 8px 14px; font-size: 13px; font-weight: 500;
                    cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .quick-reply:hover { background: rgba(45, 55, 72, 0.8); }
            </style>
            <div class="chat-widget-wrapper">
                <div id="chat-messages">
                    <button id="minimize-btn" title="Minimize chat">&minus;</button>
                </div>
                <div id="chat-input-container">
                    <input type="text" id="chat-input-field" placeholder="Ask me anything...">
                    <button id="send-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        this.messagesContainer = this.shadowRoot.getElementById('chat-messages');
        this.inputContainer = this.shadowRoot.getElementById('chat-input-container');
        this.inputField = this.shadowRoot.getElementById('chat-input-field');
        this.sendButton = this.shadowRoot.getElementById('send-btn');
        this.minimizeButton = this.shadowRoot.getElementById('minimize-btn');
        this.chatHistory = [];

        this.inputField.addEventListener('focus', () => this.expandWidget());
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.inputField.addEventListener('keypress', e => { if (e.key === 'Enter') this.sendMessage(); });
        this.minimizeButton.addEventListener('click', () => this.hideChatWindow());
        document.addEventListener('click', (event) => {
            if (!this.contains(event.target) && this.messagesContainer.classList.contains('visible')) {
                this.hideChatWindow();
            }
        });

        this.initializeChat();
    }

    getChatId() {
        let chatId = sessionStorage.getItem("chatId");
        if (!chatId) {
            chatId = "chat_" + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem("chatId", chatId);
        }
        return chatId;
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
    
    expandWidget() {
        const expandedWidth = Math.min(window.innerWidth * 0.9, 400);
        this.inputContainer.style.width = `${expandedWidth}px`;
        if (this.chatHistory.length > 0) {
            this.messagesContainer.classList.add('visible');
        }
    }
    
    hideChatWindow() {
        this.messagesContainer.classList.remove('visible');
    }

    linkify(text) {
        const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: white; text-decoration: underline;">${url}</a>`);
    }

    markdownToHtml(text) {
        if (!text) return '';
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    prefillMessage(msg) {
        this.inputField.value = msg;
        this.sendMessage();
    }

    sendMessage() {
        const message = this.inputField.value.trim();
        if (message === "") return;

        const isFirstUserMessage = this.chatHistory.filter(msg => msg.type === 'user').length === 0;

        if (!this.messagesContainer.classList.contains('visible')) {
            this.messagesContainer.classList.add('visible');
        }
        
        const quickReplies = this.shadowRoot.querySelector('.quick-replies');
        if (quickReplies) quickReplies.remove();
        
        const userMessage = { type: 'user', content: message };
        this.chatHistory.push(userMessage);
        sessionStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
        this.renderMessage(userMessage);

        this.inputField.value = "";
        this.scrollToBottom();

        const typingIndicator = this.renderMessage({ type: 'bot', eyebrow: 'Jessica', content: 'typing...' });
        typingIndicator.querySelector('.message').classList.add('typing-indicator');
        this.scrollToBottom();

        setTimeout(() => {
            fetch('https://n8n.queensautoservices.com/webhook/a4303953-30c4-4951-b63f-4b1261053985/chat', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chatId: this.getChatId(), message: message, route: 'general' })
            })
            .then(response => response.json())
            .then(data => {
                typingIndicator.remove();
                const botResponse = { type: 'bot', eyebrow: 'Jessica', content: data.output || "Sorry, something went wrong." };
                this.chatHistory.push(botResponse);
                sessionStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
                const botMessageGroup = this.renderMessage(botResponse);
                if (isFirstUserMessage) {
                    this.renderQuickReplies(botMessageGroup);
                }
            })
            .catch(error => {
                console.error("Fetch Error:", error);
                typingIndicator.remove();
                const errorResponse = { type: 'bot', eyebrow: 'Jessica', content: "I'm having trouble connecting. Please try again later." };
                this.chatHistory.push(errorResponse);
                sessionStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
                this.renderMessage(errorResponse);
            })
            .finally(() => {
                this.scrollToBottom();
            });
        }, 1000);
    }
    
    renderMessage(msg) {
        const group = document.createElement("div");
        group.className = `message-group ${msg.type}-group`;
        
        let html = '';
        if (msg.eyebrow) {
            html += `<div class="message-eyebrow">${msg.eyebrow}</div>`;
        }
        html += `<div class="message ${msg.type}-message">${this.linkify(this.markdownToHtml(msg.content))}</div>`;
        group.innerHTML = html;

        this.messagesContainer.appendChild(group);
        return group;
    }

    renderQuickReplies(parentGroup) {
        const quickRepliesContainer = document.createElement("div");
        quickRepliesContainer.className = "quick-replies";
        const replies = ["Book an appointment", "Hours & Directions", "Coupon Details", "Continua en Español"];
        replies.forEach(text => {
            const qr = document.createElement('div');
            qr.className = 'quick-reply';
            qr.textContent = text;
            qr.onclick = () => this.prefillMessage(text);
            quickRepliesContainer.appendChild(qr);
        });
        parentGroup.appendChild(quickRepliesContainer);
    }

    initializeChat() {
        const storedHistory = sessionStorage.getItem('chatHistory');
        
        if (storedHistory) {
            this.chatHistory = JSON.parse(storedHistory);
            if (this.chatHistory.length > 0) {
                this.chatHistory.forEach(msg => this.renderMessage(msg));
            }
        } else {
            this.chatHistory = [];
            sessionStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
        }
    }
}
customElements.define('chat-widget', ChatWidget);
