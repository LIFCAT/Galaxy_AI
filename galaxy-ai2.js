class GalaxyAI {
    constructor() {
        this.currentMode = 'galaxy';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadHistory();
        this.updateAIStatus("Готов к работе");
    }

    async getAIResponse(userMessage) {
        if (this.currentMode !== 'galaxy') {
            return "🔑 Для этого режима нужен API ключ";
        }

        const apis = [
            {
                url: 'https://chatgpt.h7ml.cn/v1/chat/completions',
                data: {model: "gpt-3.5-turbo", messages: [{role: "user", content: userMessage}], max_tokens: 500}
            },
            {
                url: 'https://api.inferencehub.xyz/v1/chat/completions',
                data: {model: "gpt-3.5-turbo", messages: [{role: "user", content: userMessage}], max_tokens: 400}
            },
            {
                url: 'https://free.gpt.ge/v1/chat/completions',
                data: {model: "gpt-3.5-turbo", messages: [{role: "user", content: userMessage}], max_tokens: 300}
            },
            {
                url: 'https://api.openai-proxy.org/v1/chat/completions',
                data: {model: "gpt-3.5-turbo", messages: [{role: "user", content: userMessage}], max_tokens: 350}
            }
        ];

        for (let i = 0; i < apis.length; i++) {
            try {
                this.updateAIStatus(`API ${i+1}/${apis.length}`);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
                const response = await fetch(apis[i].url, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(apis[i].data),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    let aiResponse = '';
                    if (data.choices && data.choices[0] && data.choices[0].message) {
                        aiResponse = data.choices[0].message.content;
                    } else if (data.content) {
                        aiResponse = data.content;
                    } else if (data.text) {
                        aiResponse = data.text;
                    } else {
                        aiResponse = "🤖 Ответ от ИИ получен";
                    }
                    return aiResponse;
                }
            } catch (error) {
                continue;
            }
        }

        throw new Error("Все ИИ серверы временно недоступны");
    }

    setupEventListeners() {
        document.getElementById('sendButton').addEventListener('click', () => this.sendMessage());
        document.getElementById('userInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    loadHistory() {
        const history = JSON.parse(localStorage.getItem("galaxyAIHistory")) || [];
        const chat = document.getElementById("chat");
        chat.innerHTML = "";
        
        if (history.length === 0) {
            this.addMessage("bot", "🚀 Galaxy AI v2.0\n\nРаботаю на реальном ИИ!\n\nЗадавайте ЛЮБЫЕ вопросы! 🤖");
        } else {
            history.forEach(msg => {
                this.addMessage("user", msg.user);
                this.addMessage("bot", msg.bot);
            });
        }
    }

    addMessage(sender, text) {
        const chat = document.getElementById("chat");
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}-message`;
        messageDiv.textContent = text;
        chat.appendChild(messageDiv);
        chat.scrollTop = chat.scrollHeight;
    }

    updateAIStatus(status) {
        const statusElement = document.getElementById("aiStatus");
        if (statusElement) {
            statusElement.textContent = `AI: ${status}`;
        }
    }

    async sendMessage() {
        const input = document.getElementById("userInput");
        const message = input.value.trim();
        
        if (!message) return;

        this.addMessage("user", message);
        input.value = "";
        this.updateAIStatus("Подключаюсь к ИИ...");

        try {
            const response = await this.getAIResponse(message);
            this.addMessage("bot", response);
            
            const history = JSON.parse(localStorage.getItem("galaxyAIHistory")) || [];
            history.push({
                user: message,
                bot: response,
                time: new Date().toLocaleTimeString('ru-RU')
            });
            localStorage.setItem("galaxyAIHistory", JSON.stringify(history));
            
        } catch (error) {
            this.addMessage("bot", "❌ Все ИИ серверы временно перегружены\n\nПопробуйте позже");
        }

        this.updateAIStatus("Готов");
    }
}

function setMode(mode) {
    if (window.galaxyAI) {
        window.galaxyAI.currentMode = mode;
        document.getElementById('modeIndicator').textContent = 
            mode === 'galaxy' ? '🚀 Galaxy AI' : 
            mode === 'yandex' ? '🔷 Yandex GPT' : '🔶 OpenAI GPT';
    }
}

function toggleMenu() {
    const menu = document.getElementById("menuPanel");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function clearHistory() {
    if (confirm("Очистить всю историю чата?")) {
        localStorage.removeItem("galaxyAIHistory");
        if (window.galaxyAI) {
            window.galaxyAI.loadHistory();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.galaxyAI = new GalaxyAI();
});
