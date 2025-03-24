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
        // 设置默认场景
        this.currentScene = 'cafe';
        
        // 设置默认角色
        this.currentCharacter = 'female';
        
        // 绑定场景选择事件
        this.bindSceneSelectionEvents();
        
        // 绑定角色选择事件
        this.bindCharacterSelectionEvents();
        
        // 绑定开始聊天按钮事件
        this.bindStartChatButtonEvent();
        
        // 绑定返回场景选择器按钮事件
        this.bindChangeSceneButtonEvent();
        
        // 初始化默认场景
        this.applyScene(this.currentScene);
        
        // 设置场景选择器为全屏模式
        this.showSceneSelector();
    }
    
    /**
     * 绑定场景选择事件
     */
    bindSceneSelectionEvents() {
        document.querySelectorAll('.scene-option-card').forEach(option => {
            option.addEventListener('click', () => {
                const scene = option.getAttribute('data-scene');
                this.changeScene(scene);
            });
        });
    }
    
    /**
     * 绑定角色选择事件
     */
    bindCharacterSelectionEvents() {
        const characterOptions = document.querySelectorAll('.character-option-card');
        
        console.log(`找到 ${characterOptions.length} 个角色选项`);
        
        characterOptions.forEach(option => {
            const character = option.getAttribute('data-character');
            console.log(`绑定角色选项事件: ${character}`);
            
            option.addEventListener('click', (event) => {
                console.log(`点击了角色: ${character}`);
                
                // 移除所有选项的活动状态
                characterOptions.forEach(opt => opt.classList.remove('active'));
                
                // 添加当前选项的活动状态
                option.classList.add('active');
                
                // 更新当前角色
                this.currentCharacter = character;
                
                console.log(`当前角色已更新为: ${this.currentCharacter}`);
                
                // 立即更新当前场景的角色
                const scene = this.scenes[this.currentScene];
                if (scene && scene.userCharacters && scene.userCharacters[this.currentCharacter]) {
                    scene.userCharacter = scene.userCharacters[this.currentCharacter];
                    
                    // 立即更新用户头像预览
                    this.updateUserAvatar(scene.userCharacter);
                }
                
                // 防止事件冒泡
                event.stopPropagation();
            });
        });
    }
    
    /**
     * 绑定开始聊天按钮事件
     */
    bindStartChatButtonEvent() {
        const startChatButton = document.getElementById('startChatButton');
        if (startChatButton) {
            startChatButton.addEventListener('click', () => {
                this.startChat();
            });
        }
    }
    
    /**
     * 绑定返回场景选择器按钮事件
     */
    bindChangeSceneButtonEvent() {
        const changeSceneButton = document.getElementById('changeSceneButton');
        if (changeSceneButton) {
            changeSceneButton.addEventListener('click', () => {
                this.showSceneSelector();
            });
        }
    }
    
    /**
     * 切换场景
     * @param {string} sceneName - 场景名称
     */
    async changeScene(sceneName) {
        if (!this.scenes[sceneName]) {
            console.error(`Scene "${sceneName}" does not exist`);
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

        // 使用 Promise 延迟播放欢迎语音
        this.delayedWelcomeAudio(sceneName, this.scenes[sceneName])
            .then(() => {
                // 欢迎语音播放完成后的回调
                console.log(`欢迎语音播放完成: ${sceneName}`);
            })
            .catch(error => {
                console.error('欢迎语音播放失败:', error);
            });
    }
    
    /**
     * 应用场景
     * @param {string} sceneName - 场景名称
     */
    applyScene(sceneName) {
        try {
            const scene = this.scenes[sceneName];
            if (!scene) {
                console.error(`场景 "${sceneName}" 不存在`);
                return;
            }
            
            console.log(`应用场景: ${sceneName}, 当前角色: ${this.currentCharacter}`);
            
            // 设置用户角色
            if (!scene.userCharacters) {
                console.error(`场景 "${sceneName}" 没有 userCharacters 配置`);
                return;
            }
            
            scene.userCharacter = scene.userCharacters[this.currentCharacter];
            
            if (!scene.userCharacter) {
                console.error(`未找到角色: ${this.currentCharacter}`);
                // 使用默认角色
                scene.userCharacter = scene.userCharacters.female;
            }
            
            console.log('应用用户角色:', scene.userCharacter);
            
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
                    // 强制更新图片源，避免缓存问题
                    userIdleAvatar.src = '';
                    setTimeout(() => {
                        userIdleAvatar.src = scene.userCharacter.avatar.idle;
                        console.log(`更新用户头像: ${scene.userCharacter.avatar.idle}`);
                    }, 10);
                }
                
                const userSpeakingAvatar = userCharacter.querySelector('.user-speaking');
                if (userSpeakingAvatar && scene.userCharacter.avatar.speaking) {
                    // 强制更新图片源，避免缓存问题
                    userSpeakingAvatar.src = '';
                    setTimeout(() => {
                        userSpeakingAvatar.src = scene.userCharacter.avatar.speaking;
                        console.log(`更新用户说话头像: ${scene.userCharacter.avatar.speaking}`);
                    }, 10);
                }
            }
            
            // 重置聊天历史
            this.resetChatHistory();
        } catch (error) {
            console.error('应用场景时出错:', error);
        }
    }
    
    /**
     * 获取当前场景
     * @returns {string} 当前场景ID
     */
    getCurrentScene() {
        return this.currentScene;
    }
    
    /**
     * 开始聊天
     */
    async startChat() {
        try {
            const scene = this.scenes[this.currentScene];
            if (!scene) {
                console.error(`场景 "${this.currentScene}" 不存在`);
                return;
            }
            
            console.log(`开始聊天，场景: ${this.currentScene}，角色: ${this.currentCharacter}`);
            
            // 确保用户角色已设置
            scene.userCharacter = scene.userCharacters[this.currentCharacter];
            console.log('开始聊天时的用户角色:', scene.userCharacter);
            
            // 再次更新用户角色头像，确保正确显示
            this.updateUserAvatar(scene.userCharacter);
            
            // 隐藏场景选择器
            this.hideSceneSelector();
            
            // 显示聊天界面
            this.showChatInterface();
            
            // 添加初始消息
            await this.addInitialMessages(scene);
            
            // 调用回调
            if (this.options.onChatStart) {
                this.options.onChatStart(this.currentScene, scene);
            }
            
            console.log('聊天已成功启动');
            
            // 临时解决方案：手动触发第一条消息的播放
            setTimeout(() => {
                const firstBubble = document.querySelector('.chat-bubble');
                if (firstBubble) {
                    const playButton = firstBubble.querySelector('.play-btn');
                    if (playButton) {
                        console.log('手动触发第一条消息的播放');
                        playButton.click();
                    }
                }
            }, 1000);
        } catch (error) {
            console.error('启动聊天时出错:', error);
        }
    }
    
    /**
     * 更新用户头像
     * @param {Object} userCharacter - 用户角色配置
     */
    updateUserAvatar(userCharacter) {
        if (!userCharacter) {
            console.error('用户角色配置为空');
            return;
        }
        
        console.log('更新用户头像:', userCharacter);
        
        const userCharacterElement = document.querySelector('.user-character');
        if (userCharacterElement) {
            const userName = userCharacterElement.querySelector('.character-name');
            if (userName) {
                userName.textContent = userCharacter.name;
            }
            
            const userIdleAvatar = userCharacterElement.querySelector('.user-idle');
            if (userIdleAvatar && userCharacter.avatar.idle) {
                // 强制更新图片源
                userIdleAvatar.setAttribute('src', userCharacter.avatar.idle + '?t=' + new Date().getTime());
                console.log(`强制更新用户头像: ${userCharacter.avatar.idle}`);
            }
            
            const userSpeakingAvatar = userCharacterElement.querySelector('.user-speaking');
            if (userSpeakingAvatar && userCharacter.avatar.speaking) {
                // 强制更新图片源
                userSpeakingAvatar.setAttribute('src', userCharacter.avatar.speaking + '?t=' + new Date().getTime());
                console.log(`强制更新用户说话头像: ${userCharacter.avatar.speaking}`);
            }
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
        console.log('显示场景选择器');
        
        // 显示场景选择器
        const sceneSelector = document.getElementById('sceneSelector');
        if (sceneSelector) {
            sceneSelector.style.display = 'block';
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
        
        // 调用回调
        if (this.options.onSceneSelectorShow) {
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
            
            // 根据消息类型选择头像
            let avatarHtml = '';
            if (message.type === 'ai') {
                // AI 角色头像
                avatarHtml = `<img src="${message.avatar}" alt="${message.characterName}" class="avatar-img">`;
            } else {
                // 用户角色头像
                avatarHtml = `<img src="${message.avatar}" alt="${message.characterName}" class="avatar-img">`;
            }
            
            bubble.innerHTML = `
                <div class="chat-avatar">
                    ${avatarHtml}
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
                    if (window.scrollToBottom) {
                        window.scrollToBottom();
                    }
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

    /**
     * 添加初始消息
     * @param {Object} scene - 场景配置
     */
    async addInitialMessages(scene) {
        if (!scene.initialMessages || !Array.isArray(scene.initialMessages)) {
            console.log('[SceneManager] 没有初始消息');
            return;
        }
        
        console.log('[SceneManager] 开始添加初始消息', scene.initialMessages.length);
        console.log('[SceneManager] 当前角色:', this.currentCharacter);
        console.log('[SceneManager] 用户角色配置:', scene.userCharacter);
        
        try {
            // 逐个添加消息，确保一次只播放一条
            for (let i = 0; i < scene.initialMessages.length; i++) {
                const message = scene.initialMessages[i];
                console.log(`[SceneManager] 添加第 ${i+1}/${scene.initialMessages.length} 条初始消息`, message);
                
                // 检查音频路径是否存在
                if (!message.audioPath) {
                    console.error(`[SceneManager] 消息 ${i+1} 没有音频路径`);
                    continue;
                }
                
                // 创建气泡元素
                const bubble = document.createElement('div');
                
                // 添加基本类
                bubble.className = `chat-bubble ${message.type === 'ai' ? 'incoming' : 'outgoing'}`;
                
                // 如果是第一条 AI 消息，添加 recent 类
                if (message.type === 'ai' && i === 0) {
                    bubble.classList.add('recent');
                    console.log('[SceneManager] 为首个 AI 消息添加 recent 类');
                }
                
                bubble.setAttribute('data-character', message.type);
                bubble.setAttribute('data-message-index', i);
                
                const now = new Date();
                const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                
                // 根据消息类型选择头像
                let avatarHtml = '';
                if (message.type === 'ai') {
                    // AI 角色头像
                    avatarHtml = `<img src="${scene.aiCharacter.avatar.idle}" alt="${scene.aiCharacter.name}" class="avatar-img">`;
                } else {
                    // 用户角色头像
                    if (!scene.userCharacter) {
                        console.error('[SceneManager] 用户角色未设置');
                        scene.userCharacter = scene.userCharacters.female; // 使用默认角色
                    }
                    avatarHtml = `<img src="${scene.userCharacter.avatar.idle}" alt="${scene.userCharacter.name}" class="avatar-img">`;
                }
                
                bubble.innerHTML = `
                    <div class="chat-avatar">
                        ${avatarHtml}
                    </div>
                    <div class="bubble-content">
                        <div class="audio-player" data-audio="${message.audioPath}" data-index="${i}">
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
                const bubblesContainer = document.getElementById('chatBubblesContainer');
                if (bubblesContainer) {
                    bubblesContainer.appendChild(bubble);
                    console.log(`[SceneManager] 气泡已添加到容器`, bubble);
                }
                
                // 创建音频播放器
                const audioPlayer = bubble.querySelector('.audio-player');
                
                if (audioPlayer) {
                    console.log(`[SceneManager] 为消息 ${i+1} 创建音频播放器`, audioPlayer);
                    console.log(`[SceneManager] 音频路径: ${message.audioPath}`);
                    
                    // 检查音频文件是否存在
                    fetch(message.audioPath, { method: 'HEAD' })
                        .then(response => {
                            if (response.ok) {
                                console.log(`[SceneManager] 音频文件存在: ${message.audioPath}`);
                            } else {
                                console.error(`[SceneManager] 音频文件不存在: ${message.audioPath}, 状态码: ${response.status}`);
                            }
                        })
                        .catch(error => {
                            console.error(`[SceneManager] 检查音频文件时出错: ${message.audioPath}`, error);
                        });
                    
                    // 等待前一条消息播放完成后再播放当前消息
                    if (message.type === 'ai' && i > 0) {
                        console.log(`[SceneManager] 等待前一条消息播放完成后再播放当前消息`);
                        
                        await new Promise(resolve => {
                            // 导入 ChatBubble 模块
                            import('./ChatBubble.js').then(module => {
                                const ChatBubble = module.default;
                                
                                console.log(`[SceneManager] 为消息 ${i+1} 创建 ChatBubble 实例`);
                                const bubbleInstance = new ChatBubble(audioPlayer, {
                                    direction: message.type === 'ai' ? 'incoming' : 'outgoing',
                                    isInitial: true
                                });
                                
                                // 添加特殊的结束监听器
                                const endedHandler = () => {
                                    console.log(`[SceneManager] 消息 ${i+1} 播放完成，继续处理下一条`);
                                    resolve();
                                };
                                
                                // 确保音频元素存在
                                if (bubbleInstance.audioPlayer && bubbleInstance.audioPlayer.audio) {
                                    bubbleInstance.audioPlayer.audio.addEventListener('ended', endedHandler, { once: true });
                                    
                                    // 如果是第一条消息或非AI消息，自动播放
                                    if (i === 0 || message.type !== 'ai') {
                                        console.log(`[SceneManager] 自动播放消息 ${i+1}`);
                                        setTimeout(() => {
                                            try {
                                                bubbleInstance.togglePlay();
                                            } catch (error) {
                                                console.error(`[SceneManager] 自动播放消息 ${i+1} 失败:`, error);
                                                resolve(); // 出错时也解析，继续处理下一条
                                            }
                                        }, 500);
                                    } else {
                                        console.log(`[SceneManager] 消息 ${i+1} 不自动播放，等待用户交互`);
                                        resolve(); // 非第一条AI消息不自动播放，直接解析
                                    }
                                } else {
                                    console.warn(`[SceneManager] 消息 ${i+1} 的音频播放器未正确初始化`);
                                    resolve(); // 如果没有音频播放器，直接解析
                                }
                            }).catch(error => {
                                console.error(`[SceneManager] 为消息 ${i+1} 创建 ChatBubble 实例失败`, error);
                                resolve(); // 出错时也解析，继续处理下一条
                            });
                        });
                    } else {
                        console.log(`[SceneManager] 消息 ${i+1} 不需要等待前一条消息播放完成`);
                        
                        // 如果是第一条消息，直接播放
                        if (i === 0) {
                            console.log(`[SceneManager] 直接播放第一条消息`);
                            
                            // 导入 ChatBubble 模块
                            import('./ChatBubble.js').then(module => {
                                const ChatBubble = module.default;
                                
                                console.log(`[SceneManager] 为第一条消息创建 ChatBubble 实例`);
                                const bubbleInstance = new ChatBubble(audioPlayer, {
                                    direction: message.type === 'ai' ? 'incoming' : 'outgoing',
                                    isInitial: true
                                });
                                
                                // 自动播放第一条消息
                                setTimeout(() => {
                                    try {
                                        console.log(`[SceneManager] 自动播放第一条消息`);
                                        bubbleInstance.togglePlay();
                                    } catch (error) {
                                        console.error(`[SceneManager] 自动播放第一条消息失败:`, error);
                                    }
                                }, 500);
                            }).catch(error => {
                                console.error(`[SceneManager] 为第一条消息创建 ChatBubble 实例失败`, error);
                            });
                        }
                    }
                } else {
                    console.warn(`[SceneManager] 消息 ${i+1} 没有找到音频播放器元素`);
                }
            }
            
            console.log('[SceneManager] 所有初始消息添加完成');
        } catch (error) {
            console.error('[SceneManager] 加载初始消息失败:', error);
        }
    }

    /**
     * 隐藏场景选择器
     */
    hideSceneSelector() {
        console.log('隐藏场景选择器');
        
        // 隐藏场景选择器
        const sceneSelector = document.getElementById('sceneSelector');
        if (sceneSelector) {
            sceneSelector.style.display = 'none';
        }
        
        // 显示场景切换按钮
        const changeSceneButton = document.getElementById('changeSceneButton');
        if (changeSceneButton) {
            changeSceneButton.style.display = 'block';
        }
    }

    /**
     * 显示聊天界面
     */
    showChatInterface() {
        console.log('显示聊天界面');
        
        // 显示聊天界面容器
        const chatContainerWrapper = document.querySelector('.chat-container-wrapper');
        if (chatContainerWrapper) {
            chatContainerWrapper.style.display = 'block';
        }
        
        // 显示录音控制栏
        const chatControls = document.querySelector('.chat-controls');
        if (chatControls) {
            chatControls.style.display = 'flex';
        }
        
        // 确保聊天气泡容器为空
        const bubblesContainer = document.getElementById('chatBubblesContainer');
        if (bubblesContainer) {
            bubblesContainer.innerHTML = '';
        }
    }

    /**
     * 添加新消息
     * @param {Object} message - 消息对象
     */
    addNewMessage(message) {
        // 移除之前消息的 recent 类
        document.querySelectorAll('.chat-bubble.recent').forEach(bubble => {
            bubble.classList.remove('recent');
        });
        
        // 创建新的气泡元素
        const bubble = document.createElement('div');
        
        // 添加基本类和 recent 类
        bubble.className = `chat-bubble ${message.type === 'ai' ? 'incoming' : 'outgoing'} recent`;
        
        // ... 其余代码与 addInitialMessages 类似 ...
    }

    /**
     * 延迟播放欢迎语音
     * @param {string} sceneName - 场景名称
     * @param {object} scene - 场景配置
     * @returns {Promise} - 返回一个 Promise
     */
    delayedWelcomeAudio(sceneName, scene) {
        return new Promise((resolve, reject) => {
            // 延迟 2 秒后播放欢迎语音
            setTimeout(() => {
                // 构建欢迎语音文件路径
                const welcomeAudioFile = `${sceneName}_welcome.mp3`;
                
                // 创建一个新的欢迎气泡
                this.createWelcomeBubble(welcomeAudioFile)
                    .then(bubble => {
                        // 调用对话开始回调
                        if (this.options.onChatStart) {
                            this.options.onChatStart(sceneName, scene);
                        }
                        resolve(bubble);
                    })
                    .catch(error => {
                        reject(error);
                    });
            }, 2000); // 2 秒延迟
        });
    }

    /**
     * 创建欢迎气泡
     * @param {string} audioFile - 音频文件名
     * @returns {Promise} - 返回一个 Promise
     */
    createWelcomeBubble(audioFile) {
        return new Promise((resolve, reject) => {
            try {
                // 获取气泡容器
                const bubbleContainer = document.querySelector('.chat-bubbles-container');
                if (!bubbleContainer) {
                    throw new Error('找不到气泡容器');
                }
                
                // 创建气泡元素
                const bubble = document.createElement('div');
                bubble.className = 'chat-bubble incoming';
                bubble.setAttribute('data-character', 'ai');
                
                // 创建气泡内容
                const bubbleContent = document.createElement('div');
                bubbleContent.className = 'bubble-content';
                
                // 创建音频播放器
                const audioPlayer = document.createElement('div');
                audioPlayer.className = 'audio-player';
                audioPlayer.setAttribute('data-audio-src', audioFile);
                
                // 创建播放按钮
                const playButton = document.createElement('button');
                playButton.className = 'play-button';
                playButton.innerHTML = '<i class="bi bi-play-fill"></i>';
                
                // 创建可视化器容器
                const visualizerContainer = document.createElement('div');
                visualizerContainer.className = 'audio-visualizer';
                
                // 组装元素
                audioPlayer.appendChild(playButton);
                audioPlayer.appendChild(visualizerContainer);
                bubbleContent.appendChild(audioPlayer);
                bubble.appendChild(bubbleContent);
                
                // 添加到容器
                bubbleContainer.appendChild(bubble);
                
                // 初始化气泡
                const chatBubble = new ChatBubble(audioPlayer);
                
                // 滚动到底部
                if (window.scrollToBottom) {
                    window.scrollToBottom();
                }
                
                // 延迟一小段时间后自动播放
                setTimeout(() => {
                    chatBubble.play();
                    resolve(chatBubble);
                }, 500);
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default SceneManager; 