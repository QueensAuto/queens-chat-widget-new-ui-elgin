class ChatWidget extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    font-family: 'Inter', sans-serif;
                }
                .chat-widget-wrapper {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    align-items: center; /* Center align items */
                    /* Animation properties */
                    opacity: 0;
                    transform: translate(-50%, 30px); /* Start lower and centered */
                    animation: slide-up 0.5s 0.3s ease-out forwards;
                }

                @keyframes slide-up {
                    to {
                        opacity: 1;
                        transform: translate(-50%, 0);
                    }
                }

                #chat-messages {
                    width: 400px;
                    max-height: 60vh;
                    background: rgba(31, 41, 55, 0.8);
                    backdrop-filter: blur(10px);
                    border-radius: 12px;
                    margin-bottom: 12px;
                    display: none; /* Initially hidden */
                    flex-direction: column;
                    overflow-y: auto;
                    padding: 40px 15px 15px 15px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    position: relative; /* For positioning the minimize button */
                }
                /* Custom Scrollbar Styling */
                #chat-messages::-webkit-scrollbar {
                    width: 8px;
                }
                #chat-messages::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 10px;
                }
                #chat-messages::-webkit-scrollbar-thumb {
                    background-color: #4A5568; /* Same as user message bg */
                    border-radius: 10px;
                    border: 2px solid transparent;
                    background-clip: content-box;
                }
                #chat-messages::-webkit-scrollbar-thumb:hover {
                    background-color: #2D3748; /* Darker on hover */
                }
                #minimize-btn {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    line-height: 1;
                    z-index: 10;
                }
                #minimize-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                #chat-messages.visible {
                    display: flex;
                }
                .message-group { display: flex; flex-direction: column; max-width: 85%; margin-bottom: 12px; }
                .bot-group { align-self: flex-start; }
                .user-group { align-self: flex-end; }
                .message-eyebrow { font-size: 12px; color: #a0aec0; margin-bottom: 4px; padding-left: 12px; }
                .message { padding: 10px 15px; border-radius: 18px; font-size: 14px; color: white; word-wrap: break-word; }
                .user-message { background: #6B7280; border-bottom-right-radius: 4px; align-self: flex-end;}
                .bot-message { background: #2b6cb0; border-bottom-left-radius: 4px; }
                .typing-indicator { color: #a0aec0; font-style: italic; }
                
                #chat-input-container {
                    display: flex;
                    align-items: center;
                    background: rgba(31, 41, 55, 0.8);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 9999px;
                    padding: 8px;
                    width: 256px; /* Collapsed width */
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                    transition: width 0.4s ease-in-out, transform 0.2s ease-out;
                }

                #chat-input-container:hover {
                    transform: scale(1.03);
                }

                #chat-input-field {
                    flex-grow: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: white;
                    padding: 0 12px;
                    font-size: 14px;
                }
                #chat-input-field::placeholder { color: #cbd5e0; }
                #chat-send-btn {
                    background: #4A5568; /* Darker background */
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: background-color 0.3s ease;
                }
                #chat-send-btn:hover { background: #2D3748; } /* Even darker on hover */

                /* Conversation Starters */
                .quick-replies { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; align-items: flex-start; width: 100%;}
                .quick-reply { 
                    background: rgba(74, 85, 104, 0.7); /* Matching user message color */
                    color: #E2E8F0; 
                    border-radius: 16px; 
                    padding: 8px 14px; 
                    font-size: 13px; 
                    font-weight: 500; 
                    cursor: pointer; 
                    border: 1px solid rgba(255, 255, 255, 0.1); 
                    transition: background-color 0.2s ease; 
                    text-align: left;
                }
                .quick-reply:hover { background: rgba(45, 55, 72, 0.9); }
            </style>
            
            <div class="chat-widget-wrapper">
                <div id="chat-messages">
                    <button id="minimize-btn" title="Minimize chat">&minus;</button>
                </div>
                <div id="chat-input-container">
                    <input type="text" id="chat-input-field" placeholder="Ask me anything...">
                    <button id="chat-send-btn" title="Send">
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5V19M12 5L6 11M12 5L18 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        // Get elements
        this.inputContainer = this.shadowRoot.getElementById("chat-input-container");
        this.inputField = this.shadowRoot.getElementById("chat-input-field");
        this.sendButton = this.shadowRoot.getElementById("chat-send-btn");
        this.messagesContainer = this.shadowRoot.getElementById("chat-messages");
        this.minimizeButton = this.shadowRoot.getElementById("minimize-btn");
        
        this.chatHistory = [];

        // Add event listeners
        this.inputField.addEventListener('focus', () => this.expandWidget());
        this.sendButton.addEventListener("click", () => this.sendMessage());
        this.inputField.addEventListener("keypress", event => {
            if (event.key === "Enter") this.sendMessage();
        });
        this.minimizeButton.addEventListener('click', () => this.hideChatWindow());
        window.addEventListener('resize', () => this.handleResize());
        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        this.initializeChat();
    }

    handleOutsideClick(event) {
        // Check if the click path is outside this component
        if (!event.composedPath().includes(this)) {
            this.hideChatWindow();
            this.collapseWidget();
        }
    }

    expandWidget() {
        const expandedWidth = Math.min(window.innerWidth * 0.9, 400);
        this.inputContainer.style.width = `${expandedWidth}px`;
    }
    
    hideChatWindow() {
        this.messagesContainer.classList.remove('visible');
    }

    collapseWidget() {
        if (document.activeElement !== this.inputField) {
             this.inputContainer.style.width = '256px';
        }
    }
    
    handleResize() {
        if (document.activeElement === this.inputField) {
             this.expandWidget();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    getChatId() {
        let chatId = sessionStorage.getItem("chatId");
        if (!chatId) {
            chatId = "chat_" + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem("chatId", chatId);
        }
        return chatId;
    }
    
    linkify(inputText) {
        const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return inputText.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #63b3ed; text-decoration: underline;">${url}</a>`);
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
    
        const isFirstInteraction = !this.messagesContainer.classList.contains('visible');
    
        if (isFirstInteraction) {
            this.messagesContainer.innerHTML = '<button id="minimize-btn" title="Minimize chat">&minus;</button>'; // Keep button
            this.minimizeButton = this.shadowRoot.getElementById("minimize-btn"); // Re-assign minimize button
            this.minimizeButton.addEventListener('click', () => this.hideChatWindow()); // Re-attach listener
            this.chatHistory.forEach(msg => {
                this.renderMessage(msg, msg.showQuickReplies);
            });
        }
    
        // Hide quick replies on send
        const quickReplies = this.shadowRoot.querySelector('.quick-replies');
        if (quickReplies) quickReplies.remove();
        if (this.chatHistory.length > 0 && this.chatHistory[0].showQuickReplies) {
            this.chatHistory[0].showQuickReplies = false;
            sessionStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
        }
    
        if (!this.messagesContainer.classList.contains('visible')) {
            this.messagesContainer.classList.add('visible');
        }
    
        this.chatHistory.push({ type: 'user', content: message });
        sessionStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
        this.renderMessage({ content: message, type: 'user' });
        this.inputField.value = "";
        this.scrollToBottom();
    
        const typingIndicator = this.renderMessage({ content: "Jessica is typing...", type: 'typing' });
        this.scrollToBottom();
    
        fetch('https://n8n.queensautoservices.com/webhook/a4303953-30c4-4951-b63f-4b1261053985/chat', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chatId: this.getChatId(),
                message: message,
                route: 'general',
            })
        })
        .then(response => response.ok ? response.json() : Promise.reject(`HTTP error! Status: ${response.status}`))
        .then(data => {
            typingIndicator.remove();
            const botResponseContent = data.output || "Sorry, I couldn't understand that.";
            const botMsg = { type: 'bot', eyebrow: 'Jessica', content: botResponseContent };
            this.chatHistory.push(botMsg);
            sessionStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
            this.renderMessage(botMsg);
        })
        .catch(error => {
            typingIndicator.remove();
            console.error("Error:", error);
            const errorContent = "Sorry, I couldn't get a response. Please try again.";
            const errorMsg = { type: 'bot', eyebrow: 'Jessica', content: errorContent };
            this.chatHistory.push(errorMsg);
            sessionStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
            this.renderMessage(errorMsg);
        })
        .finally(() => this.scrollToBottom());
    }
    
    renderMessage(msg, showQuickReplies = false) {
        const group = document.createElement("div");
        if(msg.type === 'user') {
            group.className = "message-group user-group";
            group.innerHTML = `<p class="message user-message">${msg.content}</p>`;
        } else if (msg.type === 'bot') {
            group.className = "message-group bot-group";
            group.innerHTML = `<div class="message-eyebrow">${msg.eyebrow}</div><p class="message bot-message">${this.linkify(this.markdownToHtml(msg.content))}</p>`;
            
            if (showQuickReplies) {
                const quickRepliesContainer = document.createElement("div");
                quickRepliesContainer.className = "quick-replies";
                const replies = ["Book an appointment", "Hours & Directions", "Coupon Details", "Continua en Español"];
                replies.forEach(replyText => {
                    const replyButton = document.createElement("button");
                    replyButton.className = "quick-reply";
                    replyButton.textContent = replyText;
                    replyButton.onclick = () => this.prefillMessage(replyText);
                    quickRepliesContainer.appendChild(replyButton);
                });
                group.appendChild(quickRepliesContainer);
            }
        } else if (msg.type === 'typing') {
            group.className = "message-group bot-group";
            group.innerHTML = `<p class="message typing-indicator">${msg.content}</p>`;
        }
        
        this.messagesContainer.appendChild(group);
        return group;
    }

    initializeChat() {
        const storedHistory = sessionStorage.getItem('chatHistory');
        
        if (storedHistory) {
            this.chatHistory = JSON.parse(storedHistory);
        } else {
            const welcomeMessage = { 
                type: 'bot', 
                eyebrow: 'Jessica', 
                content: `Hi there 👋<br><br>Welcome to Queens Auto Services! Thanks for stopping by. My name is Jessica, and I'm here to help. What can I do for you today?`,
                showQuickReplies: true 
            };
            this.chatHistory = [welcomeMessage];
            sessionStorage.setItem('chatHistory', JSON.stringify(this.chatHistory));
        }
    }
}
customElements.define('chat-widget', ChatWidget);
document.body.appendChild(document.createElement('chat-widget'));