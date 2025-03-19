import scenes from '../config/scenes.js';
import AnimationService from '../services/AnimationService.js';

/**
 * 场景管理器组件类 - 处理场景切换
 */
class SceneManager {
    /**
     * @param {Object} options - 配置选项
     */
    constructor(options = {}) {
        this.options = Object.assign({
            onSceneChange: null,
            onChatStart: null,
            onSceneSelectorShow: null
        }, options);
        
        this.currentScene = 'cafe'; // 默认场景
        this.scenes = scenes;
        
        this.init();
    }
    
    /**
     * 初始化场景管理器
     */
    init() {
        // 绑定场景选择事件
        document.querySelectorAll('.scene-option-card').forEach(option => {
            option.addEventListener('click', () => {
                const scene = option.getAttribute('data-scene');
                this.changeScene(scene);
            });
        });
        
        // 绑定开始对话按钮事件
        const startChatButton = document.getElementById('startChatButton');
        if (startChatButton) {
            startChatButton.addEventListener('click', () => {
                this.startChat();
            });
        }
        
        // 绑定切换场景按钮事件
        const changeSceneButton = document.getElementById('changeSceneButton');
        if (changeSceneButton) {
            changeSceneButton.addEventListener('click', () => {
                this.showSceneSelector();
            });
        }
        
        // 初始化默认场景
        this.applyScene(this.currentScene);
        
        // 设置场景选择器为全屏模式
        this.showSceneSelector();
    }
    
    /**
     * 切换场景
     * @param {string} sceneName - 场景名称
     */
    async changeScene(sceneName) {
        if (!this.scenes[sceneName]) {
            console.error(`场景 "${sceneName}" 不存在`);
            return;
        }

        // 禁用所有交互元素
        this.disableInteractions();

        // 执行场景过渡动画
        await AnimationService.sceneTransition(() => {
            // 更新当前场景
            this.currentScene = sceneName;

            // 更新场景选择器的活动状态
            document.querySelectorAll('.scene-option-card').forEach(option => {
                if (option.getAttribute('data-scene') === sceneName) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });

            // 应用新场景
            this.applyScene(sceneName);
        });

        // 重新启用交互元素
        this.enableInteractions();

        // 触发场景变更回调
        if (typeof this.options.onSceneChange === 'function') {
            this.options.onSceneChange(sceneName, this.scenes[sceneName]);
        }

        // 更新最新气泡样式
        if (typeof window.updateRecentBubbles === 'function') {
            setTimeout(() => {
                window.updateRecentBubbles();
            }, 100); // 短暂延迟确保所有气泡都已添加
        }
    }
    
    /**
     * 应用场景
     * @param {string} sceneName - 场景名称
     */
    applyScene(sceneName) {
        const scene = this.scenes[sceneName];
        if (!scene) return;
        
        // 更新背景图片
        document.body.style.backgroundImage = `url('${scene.background}')`;
        
        // 更新 AI 角色
        const aiCharacter = document.querySelector('.ai-character');
        if (aiCharacter) {
            const aiName = aiCharacter.querySelector('.character-name');
            if (aiName) {
                aiName.textContent = scene.aiCharacter.name;
            }
            
            const aiIdleAvatar = aiCharacter.querySelector('.bot-idle');
            if (aiIdleAvatar && scene.aiCharacter.avatar.idle) {
                aiIdleAvatar.src = scene.aiCharacter.avatar.idle;
            }
            
            const aiSpeakingAvatar = aiCharacter.querySelector('.bot-speaking');
            if (aiSpeakingAvatar && scene.aiCharacter.avatar.speaking) {
                aiSpeakingAvatar.src = scene.aiCharacter.avatar.speaking;
            }
        }
        
        // 更新用户角色
        const userCharacter = document.querySelector('.user-character');
        if (userCharacter) {
            const userName = userCharacter.querySelector('.character-name');
            if (userName) {
                userName.textContent = scene.userCharacter.name;
            }
            
            const userIdleAvatar = userCharacter.querySelector('.user-idle');
            if (userIdleAvatar && scene.userCharacter.avatar.idle) {
                userIdleAvatar.src = scene.userCharacter.avatar.idle;
            }
            
            const userSpeakingAvatar = userCharacter.querySelector('.user-speaking');
            if (userSpeakingAvatar && scene.userCharacter.avatar.speaking) {
                userSpeakingAvatar.src = scene.userCharacter.avatar.speaking;
            }
        }
        
        // 重置聊天历史
        this.resetChatHistory();
    }
    
    /**
     * 获取当前场景
     * @returns {Object} 当前场景对象
     */
    getCurrentScene() {
        return this.scenes[this.currentScene];
    }
    
    /**
     * 开始对话
     */
    async startChat() {
        // 隐藏场景选择器
        const sceneSelector = document.getElementById('sceneSelector');
        if (sceneSelector) {
            sceneSelector.style.display = 'none';
        }
        
        // 显示聊天界面容器，但内容先隐藏
        const chatContainerWrapper = document.querySelector('.chat-container-wrapper');
        if (chatContainerWrapper) {
            chatContainerWrapper.style.display = 'block';
        }
        
        // 显示录音控制栏和其他元素，但先设置为不可见
        const chatControls = document.querySelector('.chat-controls');
        if (chatControls) {
            chatControls.style.display = 'flex';
            chatControls.style.opacity = '0';
        }
        
        // 显示场景切换按钮
        const changeSceneButton = document.getElementById('changeSceneButton');
        if (changeSceneButton) {
            changeSceneButton.style.display = 'block';
            changeSceneButton.style.opacity = '0';
        }
        
        // 确保聊天气泡容器为空
        const bubblesContainer = document.getElementById('chatBubblesContainer');
        if (bubblesContainer) {
            bubblesContainer.innerHTML = '';
        }
        
        // 显示加载指示器
        this.showLoadingIndicator();
        
        try {
            // 预加载资源
            await this.preloadResources();
            
            // 等待界面过渡完成
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 动态加载初始消息
            const initialMessage = await this.loadInitialMessage();
            
            // 隐藏加载指示器
            this.hideLoadingIndicator();
            
            // 淡入聊天界面
            await AnimationService.animateChatInterface('in');
            
            // 添加消息气泡
            await this.addMessageBubble(initialMessage);
            
            // 触发对话开始回调
            if (typeof this.options.onChatStart === 'function') {
                this.options.onChatStart(this.currentScene, this.scenes[this.currentScene]);
            }

            // 更新最新气泡样式
            if (typeof window.updateRecentBubbles === 'function') {
                setTimeout(() => {
                    window.updateRecentBubbles();
                }, 100); // 短暂延迟确保所有气泡都已添加
            }
        } catch (error) {
            console.error('加载初始消息失败:', error);
            this.hideLoadingIndicator();
        }
    }
    
    /**
     * 预加载资源
     * @returns {Promise<void>}
     */
    async preloadResources() {
        const scene = this.scenes[this.currentScene];
        
        // 预加载音频
        const audioPromise = new Promise((resolve) => {
            const audio = new Audio('assets/audio/ai/demo.mp3');
            audio.addEventListener('canplaythrough', () => {
                resolve();
            });
            audio.addEventListener('error', () => {
                console.warn('音频预加载失败');
                resolve(); // 即使失败也继续
            });
            // 只加载元数据，不播放
            audio.preload = 'metadata';
            audio.load();
        });
        
        // 预加载图片
        const imagePromises = [];
        if (scene.aiCharacter && scene.aiCharacter.avatar) {
            const avatarIdle = new Image();
            avatarIdle.src = scene.aiCharacter.avatar.idle;
            imagePromises.push(new Promise((resolve) => {
                avatarIdle.onload = resolve;
                avatarIdle.onerror = () => {
                    console.warn('头像预加载失败');
                    resolve(); // 即使失败也继续
                };
            }));
        }
        
        // 等待所有资源加载完成
        await Promise.all([audioPromise, ...imagePromises]);
    }
    
    /**
     * 显示场景选择器
     */
    showSceneSelector() {
        // 显示场景选择器
        const sceneSelector = document.getElementById('sceneSelector');
        if (sceneSelector) {
            sceneSelector.style.display = 'block';
            sceneSelector.classList.add('fullscreen');
        }
        
        // 隐藏聊天界面
        const chatContainerWrapper = document.querySelector('.chat-container-wrapper');
        if (chatContainerWrapper) {
            chatContainerWrapper.style.display = 'none';
        }
        
        // 隐藏录音控制栏
        const chatControls = document.querySelector('.chat-controls');
        if (chatControls) {
            chatControls.style.display = 'none';
        }
        
        // 隐藏场景切换按钮
        const changeSceneButton = document.getElementById('changeSceneButton');
        if (changeSceneButton) {
            changeSceneButton.style.display = 'none';
        }
        
        // 触发显示场景选择器回调
        if (typeof this.options.onSceneSelectorShow === 'function') {
            this.options.onSceneSelectorShow();
        }
    }
    
    /**
     * 重置聊天历史
     */
    resetChatHistory() {
        const bubblesContainer = document.getElementById('chatBubblesContainer');
        if (!bubblesContainer) return;
        
        // 清空现有聊天记录
        bubblesContainer.innerHTML = '';
        
        // 添加初始示例对话
        const scene = this.scenes[this.currentScene];
        
        // 创建 AI 示例气泡
        const aiBubble = document.createElement('div');
        aiBubble.className = 'chat-bubble incoming';
        aiBubble.setAttribute('data-character', 'ai');
        
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // 使用场景特定的 AI 头像
        const aiAvatarSrc = scene.aiCharacter.avatar.idle;
        
        aiBubble.innerHTML = `
            <div class="chat-avatar">
                <img src="${aiAvatarSrc}" alt="${scene.aiCharacter.name}" class="avatar-img">
            </div>
            <div class="bubble-content">
                <div class="audio-player" data-audio="assets/audio/ai/demo.mp3">
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
        
        bubblesContainer.appendChild(aiBubble);
        
        // 初始化音频播放器
        const audioPlayer = aiBubble.querySelector('.audio-player');
        if (audioPlayer) {
            import('../components/ChatBubble.js').then(module => {
                const ChatBubble = module.default;
                const bubble = new ChatBubble(audioPlayer, {
                    direction: 'incoming'
                });
            });
        }
        
        // 滚动到底部
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            setTimeout(() => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 0);
        }
    }

    /**
     * 禁用交互元素
     */
    disableInteractions() {
        const elements = document.querySelectorAll('.scene-option-card, #startChatButton, #chatRecordButton');
        elements.forEach(element => {
            element.style.pointerEvents = 'none';
        });
    }

    /**
     * 启用交互元素
     */
    enableInteractions() {
        const elements = document.querySelectorAll('.scene-option-card, #startChatButton, #chatRecordButton');
        elements.forEach(element => {
            element.style.pointerEvents = 'auto';
        });
    }

    /**
     * 显示加载指示器
     */
    showLoadingIndicator() {
        // 检查是否已存在加载指示器
        let loader = document.querySelector('.chat-loading-indicator');
        
        if (!loader) {
            // 创建加载指示器
            loader = document.createElement('div');
            loader.className = 'chat-loading-indicator';
            loader.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
            `;
            
            // 添加到聊天容器
            const chatContainer = document.getElementById('chatContainer');
            if (chatContainer) {
                chatContainer.appendChild(loader);
            }
        }
        
        // 显示加载指示器
        loader.style.display = 'flex';
    }

    /**
     * 隐藏加载指示器
     */
    hideLoadingIndicator() {
        const loader = document.querySelector('.chat-loading-indicator');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    /**
     * 加载初始消息
     * @returns {Promise<Object>} 初始消息对象
     */
    async loadInitialMessage() {
        // 这里可以从后端 API 获取初始消息
        // 现在我们模拟一个 API 调用
        return new Promise(resolve => {
            setTimeout(() => {
                const scene = this.scenes[this.currentScene];
                
                // 根据场景配置获取欢迎消息
                const welcomeMessage = scene.welcomeMessage || '欢迎来到这个场景！';
                
                resolve({
                    type: 'ai',
                    audioPath: 'assets/audio/ai/demo.mp3',
                    avatar: scene.aiCharacter.avatar.idle,
                    characterName: scene.aiCharacter.name,
                    text: welcomeMessage,
                    isInitial: true
                });
            }, 500); // 模拟网络延迟
        });
    }

    /**
     * 添加消息气泡
     * @param {Object} message - 消息对象
     * @returns {Promise<void>}
     */
    async addMessageBubble(message) {
        return new Promise(async (resolve) => {
            const bubblesContainer = document.getElementById('chatBubblesContainer');
            if (!bubblesContainer) {
                resolve();
                return;
            }
            
            // 创建气泡元素
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${message.type === 'ai' ? 'incoming' : 'outgoing'}`;
            bubble.setAttribute('data-character', message.type);
            
            // 如果是初始消息，添加一个标记
            if (message.isInitial) {
                bubble.setAttribute('data-initial', 'true');
            }
            
            const now = new Date();
            const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            
            // 设置气泡内容
            bubble.innerHTML = `
                <div class="chat-avatar">
                    <img src="${message.avatar}" alt="${message.characterName}" class="avatar-img">
                </div>
                <div class="bubble-content">
                    <div class="audio-player" data-audio="${message.audioPath}">
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
            
            // 添加到容器
            bubblesContainer.appendChild(bubble);
            
            // 滚动到底部
            const chatContainer = document.getElementById('chatContainer');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
            
            // 初始化音频播放器
            const audioPlayer = bubble.querySelector('.audio-player');
            if (audioPlayer) {
                try {
                    // 动态导入 ChatBubble 模块
                    const module = await import('../components/ChatBubble.js');
                    const ChatBubble = module.default;
                    
                    // 创建气泡实例
                    const bubbleInstance = new ChatBubble(audioPlayer, {
                        direction: message.type === 'ai' ? 'incoming' : 'outgoing',
                        // 传递是否为初始消息的标志
                        isInitial: message.isInitial
                    });
                    
                    // 等待一小段时间，确保 DOM 已更新
                    await new Promise(r => setTimeout(r, 100));
                    
                    // 初始化动画
                    bubbleInstance.initializeAnimations();
                    
                    // 完成
                    resolve();
                } catch (error) {
                    console.error('初始化气泡失败:', error);
                    resolve();
                }
            } else {
                resolve();
            }
        });
    }
}

export default SceneManager; 