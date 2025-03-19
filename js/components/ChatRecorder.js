import AudioService from '../services/AudioService.js';
import ChatBubble from './ChatBubble.js';

/**
 * 聊天录音组件类 - 处理聊天中的录音功能
 */
class ChatRecorder {
    /**
     * @param {Object} elements - DOM元素
     * @param {Object} options - 配置选项
     */
    constructor(elements, options = {}) {
        this.elements = elements;
        this.options = Object.assign({
            chatContainer: document.querySelector('.chat-container'),
            demoAudioPath: 'assets/audio/ai/demo.mp3',
            aiResponseDelay: 1500, // AI 回复延迟时间（毫秒）
            onRecordingStart: null,
            onRecordingEnd: null,
            onAiResponseStart: null,
            onAiResponseEnd: null
        }, options);
        
        this.isRecording = false;
        this.recordingBubble = null;
        this.recordingStartTime = null;
        
        this.bindEvents();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        if (this.elements.recordButton) {
            this.elements.recordButton.addEventListener('click', () => this.toggleRecording());
        }
    }

    /**
     * 切换录音状态
     */
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    /**
     * 开始录音
     */
    startRecording() {
        // 更新UI状态
        this.isRecording = true;
        this.elements.recordButton.classList.add('recording');
        
        if (this.elements.recordingStatus) {
            this.elements.recordingStatus.textContent = '正在录音...';
        }
        
        // 记录开始时间
        this.recordingStartTime = new Date();
        
        // 创建一个临时的录音中气泡
        this.createRecordingBubble();
        
        // 回调
        if (this.options.onRecordingStart) {
            this.options.onRecordingStart();
        }
    }

    /**
     * 停止录音
     */
    stopRecording() {
        console.log('执行 stopRecording 方法');
        
        // 更新UI状态
        this.isRecording = false;
        this.elements.recordButton.classList.remove('recording');
        
        if (this.elements.recordingStatus) {
            this.elements.recordingStatus.textContent = '点击开始录音';
        }
        
        console.log('准备播放录音完成音效');
        
        // 1. 播放录音完成音效
        try {
            console.log('尝试创建音频元素');
            const audio = new Audio('assets/audio/ui/recording_sfx_1.mp3');
            audio.volume = 1.0;
            
            // 添加事件监听器
            audio.onplay = () => console.log('录音完成音效开始播放');
            audio.onended = () => console.log('录音完成音效播放结束');
            audio.onerror = (e) => console.error('录音完成音效播放失败', e);
            
            console.log('尝试播放音效');
            
            // 播放音效
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('录音完成音效播放成功');
                        
                        // 2. 完成录音气泡 (在音效播放后)
                        console.log('完成录音气泡');
                        this.finalizeRecordingBubble();
                        
                        // 3. 延迟几秒后播放 AI 回复
                        console.log('设置延迟播放 AI 回复');
                        setTimeout(() => {
                            console.log('延迟结束，准备播放 AI 回复');
                            // 模拟 AI 回复
                            this.simulateAiResponse();
                        }, 3000); // 延迟 3 秒
                    })
                    .catch(error => {
                        console.error('录音完成音效播放失败:', error);
                        
                        // 即使音效播放失败，也继续执行后续步骤
                        console.log('音效播放失败，但继续执行后续步骤');
                        this.finalizeRecordingBubble();
                        
                        setTimeout(() => {
                            this.simulateAiResponse();
                        }, 3000);
                    });
            } else {
                console.warn('播放音效返回了 undefined，可能是浏览器不支持');
                // 继续执行后续步骤
                this.finalizeRecordingBubble();
                
                setTimeout(() => {
                    this.simulateAiResponse();
                }, 3000);
            }
        } catch (error) {
            console.error('创建音频元素失败:', error);
            
            // 出错时也继续执行
            console.log('创建音频元素失败，但继续执行后续步骤');
            this.finalizeRecordingBubble();
            
            setTimeout(() => {
                this.simulateAiResponse();
            }, 3000);
        }
        
        // 停止录音器
        if (this.recorder) {
            console.log('停止录音器');
            try {
                this.recorder.stop();
                console.log('录音器已停止');
            } catch (error) {
                console.error('停止录音器时出错:', error);
            }
        } else {
            console.warn('录音器不存在');
        }
        
        // 触发录音结束回调
        if (this.options.onRecordingEnd) {
            console.log('触发录音结束回调');
            this.options.onRecordingEnd();
        }
    }

    /**
     * 创建录音中的气泡
     */
    createRecordingBubble() {
        // 创建新的气泡元素
        const bubbleElement = document.createElement('div');
        bubbleElement.className = 'chat-bubble outgoing recording';
        bubbleElement.setAttribute('data-character', 'user'); // 添加角色属性
        
        // 获取当前时间
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // 设置气泡内容
        bubbleElement.innerHTML = `
            <div class="chat-avatar">
                <i class="bi bi-person-fill"></i>
            </div>
            <div class="bubble-content">
                <div class="audio-player" data-audio="${this.options.demoAudioPath}">
                    <button class="play-btn chat-play-btn" disabled>
                        <i class="bi bi-mic-fill"></i>
                    </button>
                    <div class="audio-visualizer">
                        <!-- 声波条将在这里动态创建 -->
                    </div>
                </div>
                <div class="chat-time">录音中... ${timeString}</div>
            </div>
        `;
        
        // 添加到聊天容器
        if (this.options.chatContainer) {
            // 获取内部容器
            const bubblesContainer = this.options.chatContainer.querySelector('.chat-bubbles-container');
            if (bubblesContainer) {
                // 将新气泡添加到容器的末尾
                bubblesContainer.appendChild(bubbleElement);
            } else {
                // 如果没有内部容器，直接添加到聊天容器
                this.options.chatContainer.appendChild(bubbleElement);
            }
            
            // 更新最新气泡的放大效果
            this.updateRecentBubbles();
            
            // 滚动到底部
            this.scrollToBottom();
        }
        
        this.recordingBubble = bubbleElement;
    }

    /**
     * 完成录音气泡
     */
    finalizeRecordingBubble() {
        if (!this.recordingBubble) return;
        
        // 移除录音中的样式
        this.recordingBubble.classList.remove('recording');
        
        // 获取录音时长
        const duration = Math.round((new Date() - this.recordingStartTime) / 1000);
        const durationText = duration > 60 ? 
            `${Math.floor(duration / 60)}分${duration % 60}秒` : 
            `${duration}秒`;
        
        // 更新时间显示
        const timeElement = this.recordingBubble.querySelector('.chat-time');
        if (timeElement) {
            const now = new Date();
            const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            timeElement.textContent = `${timeString} · ${durationText}`;
        }
        
        // 更新播放按钮
        const playButton = this.recordingBubble.querySelector('.chat-play-btn');
        if (playButton) {
            playButton.disabled = false;
            playButton.innerHTML = '<i class="bi bi-play-fill"></i>';
        }
        
        // 初始化气泡的音频播放器
        const audioPlayer = this.recordingBubble.querySelector('.audio-player');
        if (audioPlayer) {
            // 使用示例音频路径
            audioPlayer.setAttribute('data-audio', this.options.demoAudioPath);
            
            // 创建ChatBubble实例
            new ChatBubble(audioPlayer, {
                direction: 'outgoing'
            });
        }
        
        // 清除引用
        this.recordingBubble = null;
        
        // 更新最新气泡的放大效果
        this.updateRecentBubbles();
    }

    /**
     * 模拟 AI 回复
     */
    simulateAiResponse() {
        console.log('执行 simulateAiResponse 方法');
        
        // 检查 AI 回复音频路径
        const aiResponsePath = this.options.demoAiResponsePath || 'assets/audio/demo/ai_response.mp3';
        console.log('AI 回复音频路径:', aiResponsePath);
        
        // 创建 AI 回复气泡
        const bubbleElement = document.createElement('div');
        bubbleElement.className = 'chat-bubble incoming';
        bubbleElement.setAttribute('data-character', 'ai'); // 添加角色属性
        
        // 获取当前时间
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // 设置气泡内容
        bubbleElement.innerHTML = `
            <div class="chat-avatar">
                <i class="bi bi-robot"></i>
            </div>
            <div class="bubble-content">
                <div class="audio-player" data-audio="${aiResponsePath}">
                    <button class="play-btn chat-play-btn">
                        <i class="bi bi-play-fill"></i>
                    </button>
                    <div class="audio-visualizer">
                        <!-- 声波条将在这里动态创建 -->
                    </div>
                </div>
                <div class="chat-time">${timeString}</div>
            </div>
        `;
        
        // 添加到聊天容器
        if (this.options.chatContainer) {
            console.log('将 AI 回复气泡添加到聊天容器');
            
            // 获取内部容器
            const bubblesContainer = this.options.chatContainer.querySelector('.chat-bubbles-container');
            if (bubblesContainer) {
                // 将新气泡添加到容器的末尾
                bubblesContainer.appendChild(bubbleElement);
            } else {
                // 如果没有内部容器，直接添加到聊天容器
                this.options.chatContainer.appendChild(bubbleElement);
            }
            
            // 更新最新气泡的放大效果
            this.updateRecentBubbles();
            
            // 滚动到底部
            this.scrollToBottom();
            
            // 初始化音频播放器
            const audioPlayer = bubbleElement.querySelector('.audio-player');
            if (audioPlayer) {
                console.log('初始化 AI 回复的音频播放器');
                console.log('音频路径:', audioPlayer.getAttribute('data-audio'));
                
                // 确保 data-audio 属性已设置
                if (!audioPlayer.getAttribute('data-audio')) {
                    console.warn('音频路径未设置，使用默认路径');
                    audioPlayer.setAttribute('data-audio', aiResponsePath);
                }
                
                new ChatBubble(audioPlayer, {
                    direction: 'incoming',
                    autoplay: true // 自动播放 AI 回复
                });
            } else {
                console.warn('未找到 AI 回复的音频播放器元素');
            }
        } else {
            console.warn('聊天容器不存在，无法添加 AI 回复气泡');
        }
    }
    
    /**
     * 显示 AI 正在输入的状态
     */
    showAiTypingIndicator() {
        // 创建输入指示器元素
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chat-bubble incoming typing-indicator';
        typingIndicator.setAttribute('data-character', 'ai');
        
        typingIndicator.innerHTML = `
            <div class="chat-avatar">
                <i class="bi bi-robot"></i>
            </div>
            <div class="bubble-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        // 添加到聊天容器
        if (this.options.chatContainer) {
            // 获取内部容器
            const bubblesContainer = this.options.chatContainer.querySelector('.chat-bubbles-container');
            if (bubblesContainer) {
                // 将指示器添加到容器的末尾
                bubblesContainer.appendChild(typingIndicator);
            } else {
                // 如果没有内部容器，直接添加到聊天容器
                this.options.chatContainer.appendChild(typingIndicator);
            }
            
            // 滚动到底部
            this.scrollToBottom();
        }
        
        // 保存引用
        this.typingIndicator = typingIndicator;
    }
    
    /**
     * 移除 AI 输入指示器
     */
    removeAiTypingIndicator() {
        if (this.typingIndicator && this.typingIndicator.parentNode) {
            this.typingIndicator.parentNode.removeChild(this.typingIndicator);
            this.typingIndicator = null;
        }
    }
    
    /**
     * 创建 AI 回复气泡
     */
    createAiResponseBubble(audioPath) {
        // 创建新的气泡元素
        const bubbleElement = document.createElement('div');
        bubbleElement.className = 'chat-bubble incoming';
        bubbleElement.setAttribute('data-character', 'ai');
        
        // 获取当前时间
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // 设置气泡内容
        bubbleElement.innerHTML = `
            <div class="chat-avatar">
                <i class="bi bi-robot"></i>
            </div>
            <div class="bubble-content">
                <div class="audio-player" data-audio="${audioPath}">
                    <button class="play-btn chat-play-btn">
                        <i class="bi bi-play-fill"></i>
                    </button>
                    <div class="audio-visualizer">
                        <!-- 声波条将在这里动态创建 -->
                    </div>
                </div>
                <div class="chat-time">${timeString}</div>
            </div>
        `;
        
        // 添加到聊天容器
        if (this.options.chatContainer) {
            // 获取内部容器
            const bubblesContainer = this.options.chatContainer.querySelector('.chat-bubbles-container');
            if (bubblesContainer) {
                // 将新气泡添加到容器的末尾
                bubblesContainer.appendChild(bubbleElement);
            } else {
                // 如果没有内部容器，直接添加到聊天容器
                this.options.chatContainer.appendChild(bubbleElement);
            }
            
            // 更新最新气泡的放大效果
            this.updateRecentBubbles();
            
            // 滚动到底部
            this.scrollToBottom();
        }
        
        // 初始化气泡的音频播放器
        const audioPlayer = bubbleElement.querySelector('.audio-player');
        if (audioPlayer) {
            const chatBubble = new ChatBubble(audioPlayer, {
                direction: 'incoming'
            });
            
            // 自动播放 AI 回复
            setTimeout(() => {
                chatBubble.togglePlay();
            }, 500);
        }
    }

    /**
     * 滚动到底部
     */
    scrollToBottom() {
        if (this.options.chatContainer) {
            // 使用 setTimeout 确保在 DOM 更新后滚动
            setTimeout(() => {
                this.options.chatContainer.scrollTop = this.options.chatContainer.scrollHeight;
            }, 0);
        }
    }

    /**
     * 更新最新气泡的放大效果
     * 只有最新的两个气泡会被放大
     */
    updateRecentBubbles() {
        if (this.options.chatContainer) {
            // 获取所有气泡
            const bubblesContainer = this.options.chatContainer.querySelector('.chat-bubbles-container');
            if (bubblesContainer) {
                const allBubbles = bubblesContainer.querySelectorAll('.chat-bubble');
                
                // 移除所有气泡的 recent 类
                allBubbles.forEach(bubble => {
                    bubble.classList.remove('recent');
                });
                
                // 获取最新的两个气泡（如果存在）
                const bubbleCount = allBubbles.length;
                if (bubbleCount > 0) {
                    // 最新的气泡
                    allBubbles[bubbleCount - 1].classList.add('recent');
                    
                    // 第二新的气泡（如果存在）
                    if (bubbleCount > 1) {
                        allBubbles[bubbleCount - 2].classList.add('recent');
                    }
                }
            }
        }
    }

    /**
     * 添加聊天气泡
     * @param {string} type - 气泡类型 ('incoming' 或 'outgoing')
     * @param {string} audioPath - 音频文件路径
     */
    addBubble(type, audioPath) {
        // 获取当前场景
        const sceneManager = window.sceneManager;
        const currentScene = sceneManager ? sceneManager.getCurrentScene() : null;
        
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}`;
        bubble.setAttribute('data-character', type === 'incoming' ? 'ai' : 'user');
        
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // 根据场景选择头像
        let avatarHtml = '';
        if (currentScene) {
            if (type === 'incoming') {
                // AI 角色头像
                avatarHtml = `<img src="${currentScene.aiCharacter.avatar.idle}" alt="${currentScene.aiCharacter.name}" class="avatar-img">`;
            } else {
                // 用户角色头像
                avatarHtml = `<img src="${currentScene.userCharacter.avatar.idle}" alt="${currentScene.userCharacter.name}" class="avatar-img">`;
            }
        } else {
            // 默认头像图标
            avatarHtml = `<i class="bi bi-${type === 'incoming' ? 'robot' : 'person-fill'}"></i>`;
        }
        
        bubble.innerHTML = `
            <div class="chat-avatar">
                ${avatarHtml}
            </div>
            <div class="bubble-content">
                <div class="audio-player" data-audio="${audioPath}">
                    <button class="play-btn chat-play-btn">
                        <i class="bi bi-play-fill"></i>
                    </button>
                    <div class="audio-visualizer">
                        <!-- 声波条将在这里动态创建 -->
                    </div>
                </div>
                <div class="chat-time">${timeString}</div>
            </div>
        `;
        
        // 添加到聊天容器
        if (this.options.chatContainer) {
            // 获取内部容器
            const bubblesContainer = this.options.chatContainer.querySelector('.chat-bubbles-container');
            if (bubblesContainer) {
                // 将新气泡添加到容器的末尾
                bubblesContainer.appendChild(bubble);
            } else {
                // 如果没有内部容器，直接添加到聊天容器
                this.options.chatContainer.appendChild(bubble);
            }
            
            // 更新最新气泡的放大效果
            this.updateRecentBubbles();
            
            // 滚动到底部
            this.scrollToBottom();
        }
    }

    /**
     * 添加用户录音气泡
     */
    addUserRecordingBubble(audioBlob) {
        // ... 现有代码 ...
        
        // 更新最新气泡样式
        if (typeof window.updateRecentBubbles === 'function') {
            window.updateRecentBubbles();
        }
    }

    /**
     * 添加 AI 回复气泡
     */
    addAiResponseBubble(audioPath) {
        // ... 现有代码 ...
        
        // 更新最新气泡样式
        if (typeof window.updateRecentBubbles === 'function') {
            setTimeout(() => {
                window.updateRecentBubbles();
            }, 100); // 短暂延迟确保气泡已添加
        }
    }
}

export default ChatRecorder; 