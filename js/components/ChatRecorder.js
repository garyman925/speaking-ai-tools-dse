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
            onAiResponseEnd: null,
            recordButton: '#chatRecordButton',
            statusElement: '#recordingStatus'
        }, options);
        
        this.recordButton = document.querySelector(this.options.recordButton);
        this.statusElement = document.querySelector(this.options.statusElement);
        this.isRecording = false;
        this.recordingBubble = null;
        this.recordingStartTime = null;
        this.recorder = null;
        this.audioBlob = null;
        this.audioUrl = null;
        this.stream = null;
        
        // 添加冷却时间控制
        this.cooldownActive = false;
        this.cooldownTime = 2000; // 2秒冷却时间
        
        // 添加处理状态标志
        this.isProcessing = false;
        
        this.bindEvents();
        this.initialize();
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
     * 初始化录音组件
     */
    initialize() {
        if (this.recordButton) {
            this.recordButton.addEventListener('click', () => {
                // 如果正在处理中，忽略点击
                if (this.isProcessing) {
                    console.log('正在处理录音，请稍等...');
                    return;
                }
                
                if (this.isRecording) {
                    this.stopRecording();
                } else {
                    this.startRecording();
                }
            });
        }
    }

    /**
     * 激活冷却时间
     */
    activateCooldown() {
        this.cooldownActive = true;
        
        // 视觉反馈 - 添加冷却样式
        if (this.recordButton) {
            this.recordButton.classList.add('cooldown');
        }
        
        // 设置冷却时间结束
        setTimeout(() => {
            this.cooldownActive = false;
            
            // 移除冷却样式
            if (this.recordButton) {
                this.recordButton.classList.remove('cooldown');
            }
        }, this.cooldownTime);
    }
    
    /**
     * 按钮震动效果
     */
    shakeButton() {
        if (!this.recordButton) return;
        
        this.recordButton.classList.add('shake');
        setTimeout(() => {
            this.recordButton.classList.remove('shake');
        }, 500);
    }

    /**
     * 切换录音状态
     */
    toggleRecording() {
        // 检查是否在冷却时间内
        if (this.cooldownActive) {
            console.log('Please wait for the cooldown period to pass.');
            // 添加视觉反馈，震动按钮
            this.shakeButton();
            return;
        }
        
        // 如果正在处理中，忽略点击
        if (this.isProcessing) {
            console.log('Please wait for the processing to complete.');
            return;
        }
        
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
        
        // 激活冷却时间
        this.activateCooldown();
    }

    /**
     * 开始录音
     */
    startRecording() {
        if (this.isRecording || this.isProcessing) return;
        
        // 设置处理状态
        this.isProcessing = true;
        this.updateButtonState();
        
        // 更新UI状态
        if (this.elements.recordingStatus) {
            this.elements.recordingStatus.textContent = 'Preparing to record...';
        }
        
        // 请求麦克风权限
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                this.stream = stream;
                this.recorder = new MediaRecorder(stream);
                
                // 设置数据可用时的处理函数
                this.recorder.ondataavailable = (e) => {
                    const audioChunks = [];
                    audioChunks.push(e.data);
                    this.audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    this.audioUrl = URL.createObjectURL(this.audioBlob);
                };
                
                // 开始录音
                this.recorder.start();
                
                // 更新UI状态
                this.isRecording = true;
                this.isProcessing = false;
                this.updateButtonState();
                
                if (this.elements.recordingStatus) {
                    this.elements.recordingStatus.textContent = 'Recording...';
                }
                
                // 记录开始时间
                this.recordingStartTime = new Date();
                
                // 创建一个临时的录音中气泡
                this.createRecordingBubble();
                
                // 回调
                if (this.options.onRecordingStart) {
                    this.options.onRecordingStart();
                }
            })
            .catch(error => {
                console.error('获取麦克风权限失败:', error);
                this.isProcessing = false;
                this.updateButtonState();
                
                if (this.elements.recordingStatus) {
                    this.elements.recordingStatus.textContent = 'No access to microphone';
                    
                    // 3秒后恢复状态文本
                    setTimeout(() => {
                        if (this.elements.recordingStatus) {
                            this.elements.recordingStatus.textContent = 'Click to start recording';
                        }
                    }, 3000);
                }
            });
    }

    /**
     * 停止录音
     */
    stopRecording() {
        if (!this.isRecording || this.isProcessing) return;
        
        // 设置处理状态
        this.isProcessing = true;
        this.updateButtonState();
        
        if (this.elements.recordingStatus) {
            this.elements.recordingStatus.textContent = 'Processing recording...';
        }
        
        console.log('执行 stopRecording 方法');
        
        // 更新UI状态
        this.isRecording = false;
        
        // 停止录音器
        if (this.recorder && this.recorder.state !== 'inactive') {
            console.log('Stopping the recorder');
            try {
                this.recorder.stop();
                console.log('Recorder stopped');
                
                // 停止所有音轨
                if (this.stream) {
                    this.stream.getTracks().forEach(track => track.stop());
                }
                
                // 1. 播放录音完成音效
                try {
                    console.log('尝试创建音频元素');
                    const audio = new Audio('assets/audio/ui/recording_sfx_1.mp3');
                    audio.volume = 1.0;
                    
                    // 添加事件监听器
                    audio.onplay = () => console.log('录音完成音效开始播放');
                    audio.onended = () => {
                        console.log('录音完成音效播放结束');
                        
                        // 完成处理状态
                        this.isProcessing = false;
                        this.updateButtonState();
                        
                        if (this.elements.recordingStatus) {
                            this.elements.recordingStatus.textContent = '点击开始录音';
                        }
                    };
                    audio.onerror = (e) => {
                        console.error('录音完成音效播放失败', e);
                        
                        // 出错时也完成处理状态
                        this.isProcessing = false;
                        this.updateButtonState();
                        
                        if (this.elements.recordingStatus) {
                            this.elements.recordingStatus.textContent = '点击开始录音';
                        }
                    };
                    
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
                    
                    // 完成处理状态
                    this.isProcessing = false;
                    this.updateButtonState();
                    
                    if (this.elements.recordingStatus) {
                        this.elements.recordingStatus.textContent = '点击开始录音';
                    }
                    
                    setTimeout(() => {
                        this.simulateAiResponse();
                    }, 3000);
                }
            } catch (error) {
                console.error('停止录音器时出错:', error);
                
                // 出错时也完成处理状态
                this.isProcessing = false;
                this.updateButtonState();
                
                if (this.elements.recordingStatus) {
                    this.elements.recordingStatus.textContent = '点击开始录音';
                }
            }
        } else {
            console.warn('录音器不存在或已经停止');
            
            // 完成处理状态
            this.isProcessing = false;
            this.updateButtonState();
            
            if (this.elements.recordingStatus) {
                this.elements.recordingStatus.textContent = '点击开始录音';
            }
        }
        
        // 触发录音结束回调
        if (this.options.onRecordingEnd) {
            console.log('触发录音结束回调');
            this.options.onRecordingEnd();
        }
    }

    /**
     * 更新按钮状态
     */
    updateButtonState() {
        if (!this.elements.recordButton) return;
        
        // 移除所有状态类
        this.elements.recordButton.classList.remove('recording', 'processing');
        
        if (this.isProcessing) {
            // 处理中状态
            this.elements.recordButton.classList.add('processing');
            this.elements.recordButton.innerHTML = '<div class="spinner-border spinner-border-sm text-light" role="status"></div>';
            this.elements.recordButton.disabled = true;
        } else if (this.isRecording) {
            // 录音中状态
            this.elements.recordButton.classList.add('recording');
            this.elements.recordButton.innerHTML = '<i class="bi bi-stop-fill"></i>';
            this.elements.recordButton.disabled = false;
        } else {
            // 正常状态
            this.elements.recordButton.innerHTML = '<i class="bi bi-mic-fill"></i>';
            this.elements.recordButton.disabled = false;
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
        
        // 获取当前场景
        const sceneManager = window.sceneManager;
        const currentScene = sceneManager ? sceneManager.getCurrentScene() : null;
        const currentSceneConfig = sceneManager && currentScene ? sceneManager.scenes[currentScene] : null;
        
        // 用户头像HTML
        let avatarHtml = '';
        if (currentSceneConfig && currentSceneConfig.userCharacter && currentSceneConfig.userCharacter.avatar) {
            // 使用场景中定义的用户头像
            avatarHtml = `<img src="${currentSceneConfig.userCharacter.avatar.idle}" alt="${currentSceneConfig.userCharacter.name}" class="avatar-img">`;
        } else {
            // 根据当前场景名称选择默认头像
            const sceneName = currentScene || 'cafe'; // 如果没有当前场景，默认使用 cafe
            avatarHtml = `<img src="assets/images/avatars/${sceneName}_user.png" alt="User" class="avatar-img" onerror="this.src='assets/images/avatars/default_user.png'">`;
        }
        
        // 设置气泡内容
        bubbleElement.innerHTML = `
            <div class="chat-avatar">
                ${avatarHtml}
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
        console.log('模拟 AI 回复');
        
        // 获取当前场景
        const sceneManager = window.sceneManager;
        const currentScene = sceneManager ? sceneManager.getCurrentScene() : null;
        const currentSceneConfig = sceneManager && currentScene ? sceneManager.scenes[currentScene] : null;
        
        // 创建 AI 回复气泡
        const aiResponseBubble = document.createElement('div');
        aiResponseBubble.className = 'chat-bubble incoming ai';
        aiResponseBubble.setAttribute('data-character', 'ai');
        
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // 选择 AI 头像
        let avatarHtml = '';
        if (currentSceneConfig && currentSceneConfig.aiCharacter && currentSceneConfig.aiCharacter.avatar) {
            // 使用场景中定义的 AI 头像
            avatarHtml = `<img src="${currentSceneConfig.aiCharacter.avatar.idle}" alt="${currentSceneConfig.aiCharacter.name}" class="avatar-img">`;
        } else {
            // 根据当前场景名称选择默认头像
            const sceneName = currentScene || 'cafe'; // 如果没有当前场景，默认使用 cafe
            avatarHtml = `<img src="assets/images/avatars/${sceneName}_ai.png" alt="AI" class="avatar-img" onerror="this.src='assets/images/avatars/default_ai.png'">`;
        }
        
        // 设置气泡内容
        aiResponseBubble.innerHTML = `
            <div class="chat-avatar">
                ${avatarHtml}
            </div>
            <div class="bubble-content">
                <div class="audio-player" data-audio="${this.options.demoAudioPath}">
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
                bubblesContainer.appendChild(aiResponseBubble);
            } else {
                // 如果没有内部容器，直接添加到聊天容器
                this.options.chatContainer.appendChild(aiResponseBubble);
            }
            
            // 更新最新气泡的放大效果
            this.updateRecentBubbles();
            
            // 滚动到底部
            this.scrollToBottom();
        }
        
        // 初始化音频播放器
        const audioPlayer = aiResponseBubble.querySelector('.audio-player');
        if (audioPlayer) {
            // 动态导入 ChatBubble 模块
            import('../components/ChatBubble.js').then(module => {
                const ChatBubble = module.default;
                
                // 创建气泡实例
                const bubbleInstance = new ChatBubble(audioPlayer, {
                    direction: 'incoming'
                });
                
                // 初始化动画
                bubbleInstance.initializeAnimations();
                
                // 自动播放 AI 回复
                setTimeout(() => {
                    if (bubbleInstance.audioPlayer) {
                        // 添加音频结束事件监听器
                        bubbleInstance.audioPlayer.audio.addEventListener('ended', () => {
                            // 显示 "Your Turn" 提示
                            if (window.showYourTurnAlert) {
                                window.showYourTurnAlert();
                            }
                        });
                        
                        bubbleInstance.togglePlay();
                    }
                }, 500);
            }).catch(error => {
                console.error('初始化 AI 回复气泡失败:', error);
            });
        }
        
        // 触发 AI 回复结束回调
        if (this.options.onAiResponseEnd) {
            this.options.onAiResponseEnd();
        }
    }
    
    /**
     * 显示 AI 正在输入的状态
     */
    showAiTypingIndicator() {
        // 获取当前场景
        const sceneManager = window.sceneManager;
        const currentScene = sceneManager ? sceneManager.getCurrentScene() : null;
        const currentSceneConfig = sceneManager && currentScene ? sceneManager.scenes[currentScene] : null;
        
        // 选择 AI 头像
        let avatarHtml = '';
        if (currentSceneConfig && currentSceneConfig.aiCharacter && currentSceneConfig.aiCharacter.avatar) {
            // 使用场景中定义的 AI 头像
            avatarHtml = `<img src="${currentSceneConfig.aiCharacter.avatar.idle}" alt="${currentSceneConfig.aiCharacter.name}" class="avatar-img">`;
        } else {
            // 根据当前场景名称选择默认头像
            const sceneName = currentScene || 'cafe'; // 如果没有当前场景，默认使用 cafe
            avatarHtml = `<img src="assets/images/avatars/${sceneName}_ai.png" alt="AI" class="avatar-img" onerror="this.src='assets/images/avatars/default_ai.png'">`;
        }
        
        // 创建输入指示器元素
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chat-bubble incoming typing-indicator';
        typingIndicator.setAttribute('data-character', 'ai');
        
        typingIndicator.innerHTML = `
            <div class="chat-avatar">
                ${avatarHtml}
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
        const currentSceneConfig = sceneManager && currentScene ? sceneManager.scenes[currentScene] : null;
        
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}`;
        bubble.setAttribute('data-character', type === 'incoming' ? 'ai' : 'user');
        
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // 根据场景选择头像
        let avatarHtml = '';
        if (currentSceneConfig && currentSceneConfig.aiCharacter && currentSceneConfig.userCharacter) {
            if (type === 'incoming') {
                // AI 角色头像
                avatarHtml = `<img src="${currentSceneConfig.aiCharacter.avatar.idle}" alt="${currentSceneConfig.aiCharacter.name}" class="avatar-img">`;
            } else {
                // 用户角色头像
                avatarHtml = `<img src="${currentSceneConfig.userCharacter.avatar.idle}" alt="${currentSceneConfig.userCharacter.name}" class="avatar-img">`;
            }
        } else {
            // 根据当前场景名称选择默认头像
            const sceneName = currentScene || 'cafe'; // 如果没有当前场景，默认使用 cafe
            
            if (type === 'incoming') {
                // AI 默认头像 - 根据场景选择
                avatarHtml = `<img src="assets/images/avatars/${sceneName}_ai.png" alt="AI" class="avatar-img" onerror="this.src='assets/images/avatars/default_ai.png'">`;
            } else {
                // 用户默认头像 - 根据场景选择
                avatarHtml = `<img src="assets/images/avatars/${sceneName}_user.png" alt="User" class="avatar-img" onerror="this.src='assets/images/avatars/default_user.png'">`;
            }
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

    /**
     * 禁用录音按钮
     */
    disableRecordButton() {
        if (this.recordButton) {
            this.recordButton.disabled = true;
            this.recordButton.classList.add('disabled');
        }
    }

    /**
     * 启用录音按钮
     */
    enableRecordButton() {
        if (this.recordButton) {
            this.recordButton.disabled = false;
            this.recordButton.classList.remove('disabled');
        }
    }
}

export default ChatRecorder; 