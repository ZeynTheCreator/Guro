/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Chat, Part } from "@google/genai";
import { marked } from "marked";
import * as pdfjsLib from 'pdfjs-dist';

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.3.136/build/pdf.worker.mjs';

// --- DOM ELEMENTS ---
const DOMElements = {
    body: document.body,
    sidebar: document.getElementById('settings-sidebar')!,
    appContainer: document.getElementById('app-container')!,
    sidebarToggleBtn: document.getElementById('sidebar-toggle-btn')!,
    closeSidebarBtn: document.getElementById('close-sidebar-btn')!,
    chatLog: document.getElementById('chat-log')!,
    chatContainer: document.getElementById('chat-container')!,
    welcomeScreen: document.getElementById('welcome-screen')!,
    userInput: document.getElementById('user-input') as HTMLTextAreaElement,
    sendBtn: document.getElementById('send-btn') as HTMLButtonElement,
    micBtn: document.getElementById('mic-btn')!,
    micIcon: document.querySelector('#mic-btn i')!,
    themeSelect: document.getElementById('theme-select') as HTMLSelectElement,
    colorPalette: document.getElementById('color-palette')!,
    modeSelect: document.getElementById('ai-mode-select') as HTMLSelectElement,
    personalityInput: document.getElementById('personality-input') as HTMLTextAreaElement,
    clearChatBtn: document.getElementById('clear-chat-btn')!,
    fullscreenBtn: document.getElementById('fullscreen-btn')!,
    fullscreenIcon: document.querySelector('#fullscreen-btn i')!,
    fileInput: document.getElementById('file-input') as HTMLInputElement,
    attachFileBtn: document.getElementById('attach-file-btn')!,
    filePreviewContainer: document.getElementById('file-preview-container')!,
};

// --- APPLICATION STATE ---
const AppState = {
    ai: new GoogleGenAI({ apiKey: process.env.API_KEY! }),
    chat: null as Chat | null,
    isLoading: false,
    isRecording: false,
    speechRecognition: (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition,
    attachedFile: null as { data: string; mimeType: string; name: string; type: 'image' | 'text' } | null,
    currentAIMessageElement: null as HTMLElement | null,
};

// --- SPEECH SYNTHESIS ---
const TTS = {
    speak(text: string) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "en-US";
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Sorry, your browser does not support text-to-speech.');
        }
    }
};

// --- UI & THEME MANAGEMENT ---
const UI = {
    initialize() {
        this.loadSettings();
        this.setupEventListeners();
        UI.startNewChat();
    },

    setupEventListeners() {
        DOMElements.sidebarToggleBtn.addEventListener('click', () => this.toggleSidebar());
        DOMElements.closeSidebarBtn.addEventListener('click', () => this.toggleSidebar(false));
        DOMElements.sendBtn.addEventListener('click', () => App.sendMessage());
        DOMElements.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                App.sendMessage();
            }
        });
        DOMElements.userInput.addEventListener('input', this.adjustTextareaHeight);
        DOMElements.themeSelect.addEventListener('change', (e) => this.updateTheme((e.target as HTMLSelectElement).value));
        DOMElements.colorPalette.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.dataset.color) {
                this.updateAccentColor(target.dataset.color);
            }
        });
        DOMElements.modeSelect.addEventListener('change', () => this.saveSetting('mode', DOMElements.modeSelect.value));
        DOMElements.personalityInput.addEventListener('input', () => this.saveSetting('personality', DOMElements.personalityInput.value));
        DOMElements.clearChatBtn.addEventListener('click', this.confirmClearChat);
        DOMElements.fullscreenBtn.addEventListener('click', this.toggleFullscreen);
        DOMElements.micBtn.addEventListener('click', this.toggleVoiceInput);
        DOMElements.attachFileBtn.addEventListener('click', () => DOMElements.fileInput.click());
        DOMElements.fileInput.addEventListener('change', this.handleFileAttachment);
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                DOMElements.fullscreenIcon.className = 'bx bx-exit-fullscreen';
            } else {
                DOMElements.fullscreenIcon.className = 'bx bx-fullscreen';
            }
        });
    },

    toggleSidebar(force?: boolean) {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            const open = typeof force === 'boolean' ? force : !DOMElements.sidebar.classList.contains('open');
            DOMElements.sidebar.classList.toggle('open', open);
        } else {
            const isCollapsed = DOMElements.body.classList.toggle('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', String(isCollapsed));
        }
    },

    adjustTextareaHeight() {
        DOMElements.userInput.style.height = 'auto';
        DOMElements.userInput.style.height = `${DOMElements.userInput.scrollHeight}px`;
    },

    toggleLoading(isLoading: boolean) {
        AppState.isLoading = isLoading;
        (DOMElements.sendBtn as HTMLButtonElement).disabled = isLoading;
        if (isLoading) {
            this.addMessage('model', '<div class="loading-indicator"><span></span><span></span><span></span></div>');
        }
    },
    
    addMessage(sender: 'user' | 'model', content: string, parts?: Part[]) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `chat-message ${sender}`;

        const senderName = sender === 'user' ? 'You' : 'GuroAi';
        
        const avatarHTML = sender === 'model' ? 
            `<svg class="logo-svg" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM4 12C4 7.58172 7.58172 4 12 4C13.8246 4 15.4828 4.64332 16.8143 5.71341L15.3998 7.12792C14.4937 6.45903 13.3114 6 12 6C8.68629 6 6 8.68629 6 12H4ZM12 20C10.1754 20 8.51722 19.3567 7.18569 18.2866L8.60018 16.8721C9.50635 17.541 10.6886 18 12 18C15.3137 18 18 15.3137 18 12H20C20 16.4183 16.4183 20 12 20Z"/></svg>` : 
            `<span>Y</span>`;

        let filePreviewHTML = '';
        if (sender === 'user' && AppState.attachedFile?.type === 'image' && parts?.some(p => 'inlineData' in p)) {
            filePreviewHTML = `<img src="data:${AppState.attachedFile.mimeType};base64,${AppState.attachedFile.data}" alt="Attached image" class="attached-img">`;
        }

        messageWrapper.innerHTML = `
            <div class="message-avatar">${avatarHTML}</div>
            <div class="message-body">
                <div class="sender-name">${senderName}</div>
                <div class="message-content">${filePreviewHTML}${content}</div>
                <div class="message-actions"></div>
            </div>
        `;

        DOMElements.chatLog.appendChild(messageWrapper);
        this.scrollToBottom();

        if (sender === 'model') {
            AppState.currentAIMessageElement = messageWrapper;
        }
    },

    updateLastMessage(chunk: string, isFinal: boolean = false) {
        if (AppState.currentAIMessageElement) {
            const contentElement = AppState.currentAIMessageElement.querySelector('.message-content')!;
            if(contentElement.innerHTML.includes('loading-indicator')){
                contentElement.innerHTML = '';
            }
            contentElement.innerHTML += chunk;

            if (isFinal) {
                const parsedHtml = marked.parse(contentElement.innerHTML) as string;
                contentElement.innerHTML = parsedHtml;
                this.addCopyButtonsToCodeBlocks(contentElement);
                
                // Add read aloud button
                const actionsContainer = AppState.currentAIMessageElement.querySelector('.message-actions')!;
                const readBtn = document.createElement('button');
                readBtn.className = 'icon-btn read-aloud-btn';
                readBtn.setAttribute('aria-label', 'Read aloud');
                readBtn.innerHTML = "<i class='bx bx-volume-full'></i>";
                readBtn.addEventListener('click', () => {
                    TTS.speak(contentElement.textContent || '');
                });
                actionsContainer.appendChild(readBtn);

                AppState.currentAIMessageElement = null;
            }
        }
    },

    addCopyButtonsToCodeBlocks(element: HTMLElement) {
        const pres = element.querySelectorAll('pre');
        pres.forEach(pre => {
            const codeBlock = pre.querySelector('code');
            if (!codeBlock) return;

            const copyButton = document.createElement('button');
            copyButton.className = 'icon-btn copy-code-btn';
            copyButton.innerHTML = "<i class='bx bx-copy'></i>";
            copyButton.setAttribute('aria-label', 'Copy code');
            
            pre.appendChild(copyButton);

            copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(codeBlock.innerText).then(() => {
                    copyButton.innerHTML = "<i class='bx bx-check'></i>";
                    setTimeout(() => {
                        copyButton.innerHTML = "<i class='bx bx-copy'></i>";
                    }, 2000);
                });
            });
        });
    },

    displayGroundingSources(sources: any[]) {
        if (!sources || sources.length === 0) return;
        const lastMessage = DOMElements.chatLog.lastElementChild;
        if (!lastMessage || !lastMessage.classList.contains('model')) return;

        const actionsContainer = lastMessage.querySelector('.message-actions');
        if (!actionsContainer) return;

        const sourcesContainer = document.createElement('div');
        sourcesContainer.className = 'grounding-sources';
        const sourceLinks = sources.map((source) => {
            const uri = source.web?.uri || '#';
            const title = source.web?.title || uri;
            return `<li><a href="${uri}" target="_blank" rel="noopener noreferrer">${title}</a></li>`;
        }).join('');
        sourcesContainer.innerHTML = `<h4>Sources:</h4><ol>${sourceLinks}</ol>`;
        actionsContainer.appendChild(sourcesContainer);
    },

    scrollToBottom() {
        DOMElements.chatContainer.scrollTop = DOMElements.chatContainer.scrollHeight;
    },

    updateTheme(theme: string) {
        DOMElements.body.className = theme;
        this.saveSetting('theme', theme);
    },

    updateAccentColor(color: string) {
        const root = document.documentElement;
        root.style.setProperty('--accent-light', `var(--${color}-light)`);
        root.style.setProperty('--accent-dark', `var(--${color}-dark)`);
        document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
        document.querySelector(`.color-option.${color}`)?.classList.add('selected');
        this.saveSetting('accentColor', color);
    },

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    },

    toggleVoiceInput() {
        if (!AppState.speechRecognition) {
            alert('Sorry, your browser does not support voice recognition.');
            return;
        }
        if (AppState.isRecording) return; 

        AppState.isRecording = true;
        const recognition = new AppState.speechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;

        recognition.onstart = () => DOMElements.micIcon.className = 'bx bxs-microphone-alt bx-burst';
        recognition.onresult = (event: any) => {
            DOMElements.userInput.value = Array.from(event.results).map((result: any) => result[0].transcript).join('');
            this.adjustTextareaHeight();
        };
        recognition.onend = () => {
            AppState.isRecording = false;
            DOMElements.micIcon.className = 'bx bx-microphone';
        };
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            DOMElements.micIcon.className = 'bx bx-microphone';
        };
        recognition.start();
    },

    async handleFileAttachment(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            alert("File is too large. Please select a file smaller than 10MB.");
            return;
        }

        const { type, name } = file;

        try {
            if (type.startsWith('image/')) {
                const base64Data = await this.fileToBase64(file);
                AppState.attachedFile = { data: base64Data, mimeType: type, name, type: 'image' };
            } else if (type === 'application/pdf') {
                const textData = await this.extractTextFromPdf(file);
                AppState.attachedFile = { data: textData, mimeType: type, name, type: 'text' };
            } else if (type.startsWith('text/')) {
                const textData = await file.text();
                AppState.attachedFile = { data: textData, mimeType: type, name, type: 'text' };
            } else {
                alert('Unsupported file type. Please select an image, PDF, or text file.');
                return;
            }
            this.displayFilePreview();
        } catch (error) {
            console.error('Error processing file:', error);
            alert(`Failed to process file: ${error instanceof Error ? error.message : String(error)}`);
            this.clearFileAttachment();
        }
    },

    fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    async extractTextFromPdf(file: File): Promise<string> {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' ');
        }
        return fullText;
    },

    displayFilePreview() {
        if (!AppState.attachedFile) return;
        const { name, mimeType, data, type } = AppState.attachedFile;
        
        const previewSrc = type === 'image' ? `data:${mimeType};base64,${data}` : 'https://unpkg.com/boxicons@2.1.4/svg/regular/bx-file.svg';

        DOMElements.filePreviewContainer.innerHTML = `
            <div class="file-preview">
                <img src="${previewSrc}" alt="File preview">
                <span class="file-info">${name}</span>
                <button class="icon-btn remove-file-btn"><i class='bx bx-x'></i></button>
            </div>
        `;
        DOMElements.filePreviewContainer.querySelector('.remove-file-btn')?.addEventListener('click', () => this.clearFileAttachment());
    },

    clearFileAttachment() {
        AppState.attachedFile = null;
        DOMElements.fileInput.value = '';
        DOMElements.filePreviewContainer.innerHTML = '';
    },



    confirmClearChat() {
        if (confirm('Are you sure you want to clear the entire conversation?')) {
            DOMElements.chatLog.innerHTML = '';
            UI.startNewChat();
        }
    },

    saveSetting(key: string, value: string) {
        localStorage.setItem(key, value);
        if (['mode', 'personality'].includes(key)) {
            UI.startNewChat();
        }
    },

    loadSettings() {
        const theme = localStorage.getItem('theme') || 'dark-theme';
        const accentColor = localStorage.getItem('accentColor') || 'blue';
        const mode = localStorage.getItem('mode') || 'Normal';
        const personality = localStorage.getItem('personality') || '';
        const isSidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

        this.updateTheme(theme);
        DOMElements.themeSelect.value = theme;
        this.updateAccentColor(accentColor);
        DOMElements.modeSelect.value = mode;
        DOMElements.personalityInput.value = personality;
        if (isSidebarCollapsed && window.innerWidth > 768) {
            DOMElements.body.classList.add('sidebar-collapsed');
        }
    },

    startNewChat() {
        DOMElements.chatLog.innerHTML = '';
        const mode = DOMElements.modeSelect.value;
        const personality = DOMElements.personalityInput.value.trim();
        let systemInstruction = "";

        switch (mode) {
            case 'News': systemInstruction = "You are GuroAi, a news reporter. Summarize the latest news from the past week based on the user's query using the provided search results. Always cite your sources."; break;
            case 'Fitness': systemInstruction = "You are GuroAi, an expert fitness coach. Provide the best, most effective fitness tips, routines, and nutritional advice. Prioritize safety and evidence-based practices."; break;
            case 'Thinker': systemInstruction = "You are GuroAi, a deep thinker and analyst. Analyze every query thoroughly from multiple perspectives to provide comprehensive, insightful, and accurate responses."; break;
            case 'Study': systemInstruction = "You are GuroAi, an expert tutor specializing in math, physics, science, and other school subjects. Explain concepts clearly, provide step-by-step solutions, and help users learn effectively."; break;
            case 'Code': systemInstruction = "You are GuroAi, an expert code assistant. Format all code snippets using Markdown code blocks with language identifiers. Provide clear explanations, debugging help, and best practices for programming."; break;
            default: systemInstruction = "You are GuroAi, a helpful and friendly assistant.";
        }
        
        if (personality) {
            systemInstruction += ` Your user-defined personality: ${personality}`;
        }

        const config: any = { systemInstruction };
        
        // For high-quality modes (Thinker, Study, Code, News), we omit thinkingConfig to use the default (enabled)
        // For low-latency modes (Normal, Fitness), we disable it for faster responses.
        if (mode === 'Normal' || mode === 'Fitness') {
            config.thinkingConfig = { thinkingBudget: 0 };
        }

        AppState.chat = AppState.ai.chats.create({
            model: 'gemini-2.5-flash-preview-04-17',
            config: config,
        });
    },
};

// --- CORE APP LOGIC ---
const App = {
    async sendMessage() {
        let userInput = DOMElements.userInput.value.trim();
        if (!userInput && !AppState.attachedFile) return;
        if (AppState.isLoading) return;

        UI.toggleLoading(true);

        const parts: Part[] = [];
        let userMessageText = DOMElements.userInput.value.trim();

        if (AppState.attachedFile) {
            if (AppState.attachedFile.type === 'image') {
                parts.push({ inlineData: { data: AppState.attachedFile.data, mimeType: AppState.attachedFile.mimeType } });
            } else { // text-based file
                const fileContext = `My question is about the attached file "${AppState.attachedFile.name}". Here is its content:\n\n---\n${AppState.attachedFile.data}\n---\n\n`;
                parts.push({text: fileContext});
            }
        }
        parts.push({ text: userMessageText });
        
        UI.addMessage('user', userMessageText, parts);
        DOMElements.userInput.value = '';
        UI.clearFileAttachment();
        UI.adjustTextareaHeight();

        try {
            if (!AppState.chat) UI.startNewChat();

            const mode = DOMElements.modeSelect.value;
            const request: { message: Part[]; tools?: any } = { message: parts };
            
            if (mode === 'News') {
                request.tools = [{googleSearch: {}}];
            }
            
            const responseStream = await AppState.chat!.sendMessageStream(request);
            
            let fullResponseText = '';
            let groundingMetadata;

            for await (const chunk of responseStream) {
                fullResponseText += chunk.text;
                UI.updateLastMessage(chunk.text);
                if (chunk.candidates?.[0]?.groundingMetadata) {
                    groundingMetadata = chunk.candidates[0].groundingMetadata;
                }
            }

            UI.updateLastMessage('', true);
            if (groundingMetadata?.groundingChunks) {
                UI.displayGroundingSources(groundingMetadata.groundingChunks);
            }
            
        } catch (error) {
            console.error("Error sending message:", error);
            UI.updateLastMessage(`\n\n> **Error:** Something went wrong. Please try again. \n> *Details: ${error instanceof Error ? error.message : String(error)}*`, true);
        } finally {
            UI.toggleLoading(false);
            if (AppState.currentAIMessageElement?.querySelector('.loading-indicator')) {
                AppState.currentAIMessageElement.querySelector('.message-content')!.innerHTML = 'Request failed.';
                AppState.currentAIMessageElement = null;
            }
            UI.scrollToBottom();
        }
    }
};

// --- INITIALIZE THE APP ---
document.addEventListener('DOMContentLoaded', () => UI.initialize());