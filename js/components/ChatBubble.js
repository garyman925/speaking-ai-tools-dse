import AudioPlayer from './AudioPlayer.js';
import Visualizer from './Visualizer.js';
import AudioService from '../services/AudioService.js';

/**
 * 对话气泡组件类 - 处理对话气泡
 */
class ChatBubble {
    /**
     * @param {HTMLElement} element - 气泡元素
     * @param {Object} options - 配置选项
     */
    constructor(element, options = {}) {
        this.element = element;
        this.options = Object.assign({
            barCount: 15,
            minHeight: 3,
            maxHeight: 30,
            barClass: 'bar',
            direction: 'incoming', // 'incoming' 或 'outgoing'
            isInitial: false
        }, options);
        
        this.audioPlayer = null;
        this.visualizer = null;
        this.playButton = this.element.querySelector('.chat-play-btn');
        this.visualizerContainer = this.element.querySelector('.audio-visualizer');
        this.audioSrc = this.element.getAttribute('data-audio');
        
        this.initialize();
        
        // 使用 requestAnimationFrame 確保 DOM 已更新
        requestAnimationFrame(() => {
            this.initializeAnimations();
        });
    }

    /**
     * 初始化气泡
     */
    initialize() {
        // 确定是否为 AI 气泡
        const isAiBubble = this.element.closest('.chat-bubble.incoming') !== null;
        
        // 获取音频文件名（不包含路径）
        let audioFileName = this.audioSrc;
        
        // 如果是完整路径，提取文件名
        if (audioFileName.includes('/')) {
            audioFileName = audioFileName.split('/').pop();
        }
        
        // 根据气泡类型设置正确的音频路径
        if (isAiBubble) {
            this.audioSrc = `assets/audio/ai/${audioFileName}`;
        } else {
            this.audioSrc = `assets/audio/user/${audioFileName}`;
        }
        
        console.log('[ChatBubble] 初始化气泡，音频路径:', this.audioSrc);
        
        // 创建音频播放器
        this.audioPlayer = new AudioPlayer(this.audioSrc, {
            visualize: true,
            onPlay: () => this.onPlay(),
            onPause: () => this.onPause(),
            onEnded: () => this.onEnded(),
            debug: true // 启用调试
        });
        
        // 创建可视化器
        if (this.visualizerContainer) {
            // 为可视化器容器添加唯一ID
            const visualizerId = `visualizer-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            this.visualizerContainer.id = visualizerId;
            
            this.visualizer = new Visualizer(visualizerId, {
                barCount: isAiBubble ? 20 : this.options.barCount, // AI 气泡可以有更多的条
                minHeight: this.options.minHeight,
                maxHeight: this.options.maxHeight,
                barClass: this.options.barClass,
                wavePattern: true // 启用波形模式
            });
        }
        
        // 绑定事件
        if (this.playButton) {
            this.playButton.addEventListener('click', () => this.togglePlay());
        }
        
        // 添加可切换显示的文本区域
        this.addToggleableTextArea();
    }
    
    /**
     * 添加可切换显示的文本区域
     */
    addToggleableTextArea() {
        // 创建文本容器
        const textContainer = document.createElement('div');
        textContainer.className = 'toggleable-text-container';
        
        // 创建文本内容区域
        const textContent = document.createElement('div');
        textContent.className = 'toggleable-text-content';
        textContent.style.display = 'none'; // 默认隐藏
        
        // 获取当前场景的示例对话
        const sampleText = this.getRandomSampleDialog();
        textContent.textContent = sampleText;
        
        // 创建切换按钮
        const toggleButton = document.createElement('button');
        toggleButton.className = 'toggle-text-btn';
        toggleButton.innerHTML = '<img src="assets/images/icons/toggle-text.png" alt="Toggle Text">';
        toggleButton.title = '显示文本'; // 修改初始提示
        
        // 添加切换按钮点击事件
        toggleButton.addEventListener('click', () => {
            if (textContent.style.display === 'none') {
                textContent.style.display = 'block';
                toggleButton.title = '隐藏文本';
            } else {
                textContent.style.display = 'none';
                toggleButton.title = '显示文本';
            }
        });
        
        // 将元素添加到容器中
        textContainer.appendChild(textContent);
        textContainer.appendChild(toggleButton);
        
        // 将文本容器添加到气泡元素中
        const bubbleContent = this.element.closest('.bubble-content');
        if (bubbleContent) {
            bubbleContent.appendChild(textContainer);
        } else {
            // 如果找不到 bubble-content，直接添加到当前元素
            this.element.appendChild(textContainer);
        }
    }

    /**
     * 获取随机示例对话
     * @returns {string} 随机示例对话
     */
    getRandomSampleDialog() {
        // 获取当前场景
        const currentScene = window.sceneManager ? window.sceneManager.currentScene : 'cafe';
        
        try {
            // 获取场景配置
            const scenes = window.sceneManager ? window.sceneManager.scenes : null;
            
            if (scenes && scenes[currentScene] && scenes[currentScene].sampleDialogs) {
                const sampleDialogs = scenes[currentScene].sampleDialogs;
                
                // 检查是否为AI或用户气泡
                const isAI = this.element.closest('.chat-bubble.ai') !== null;
                
                // 根据气泡类型选择合适的示例对话
                // 通常，AI的示例对话是问题或提示，用户的示例对话是回答
                let appropriateDialogs = [];
                
                if (isAI) {
                    // 为AI选择看起来像问题或提示的对话
                    appropriateDialogs = sampleDialogs.filter(dialog => 
                        dialog.endsWith('?') || 
                        dialog.includes('would you like') || 
                        dialog.includes('can I help') ||
                        dialog.includes('please') ||
                        !dialog.includes('I would like')
                    );
                } else {
                    // 为用户选择看起来像回答的对话
                    appropriateDialogs = sampleDialogs.filter(dialog => 
                        !dialog.endsWith('?') || 
                        dialog.includes('I would like') ||
                        dialog.includes('I want') ||
                        dialog.includes('Could you')
                    );
                }
                
                // 如果没有找到合适的对话，使用所有对话
                if (appropriateDialogs.length === 0) {
                    appropriateDialogs = sampleDialogs;
                }
                
                // 随机选择一个对话
                const randomIndex = Math.floor(Math.random() * appropriateDialogs.length);
                return appropriateDialogs[randomIndex];
            }
        } catch (error) {
            console.error('获取示例对话失败:', error);
        }
        
        // 如果出错或没有找到示例对话，返回默认文本
        return this.element.closest('.chat-bubble.ai') !== null
            ? '您好，有什么我可以帮您的吗？'
            : '我想了解更多信息。';
    }

    /**
     * 初始化气泡动画
     */
    initializeAnimations() {
        const bubbleContent = this.element.closest('.bubble-content');
        const audioPlayer = this.element;
        
        if (bubbleContent && audioPlayer && window.gsap) {
            // 设置初始状态
            gsap.set(bubbleContent, {
                width: 0,
                opacity: 0
            });
            
            gsap.set(audioPlayer, {
                opacity: 0,
                y: 10
            });

            // 创建动画时间线，添加一个短暂的延迟
            const tl = gsap.timeline({
                defaults: { duration: 0.5 },
                delay: 0.3 // 添加延迟，让用户有时间看到动画开始
            });
            
            // 气泡内容展开动画
            tl.to(bubbleContent, {
                width: 'auto',
                opacity: 1,
                duration: 0.7, // 增加持续时间，使动画更明显
                ease: 'power2.inOut',
                onComplete: () => {
                    bubbleContent.classList.add('expanded');
                }
            })
            // 音频播放器显示动画
            .to(audioPlayer, {
                opacity: 1,
                y: 0,
                duration: 0.5, // 增加持续时间
                ease: 'back.out(1.7)',
                onComplete: () => {
                    audioPlayer.classList.add('visible');
                    
                    // 检查是否是场景的第一条消息，并且场景选择器已隐藏
                    const bubble = this.element.closest('.chat-bubble');
                    const bubblesContainer = bubble ? bubble.parentElement : null;
                    const sceneSelector = document.getElementById('sceneSelector');
                    
                    // 只有当场景选择器已隐藏，并且这是第一条消息时，才自动播放
                    if (bubble && bubblesContainer && 
                        bubblesContainer.children.length === 1 && 
                        sceneSelector && sceneSelector.style.display === 'none' &&
                        this.options.isInitial) { // 添加检查是否为初始消息
                        
                        // 添加一个短暂延迟再播放音频
                        setTimeout(() => {
                            this.togglePlay();
                        }, 500);
                    }
                }
            }, '-=0.2'); // 稍微调整重叠时间
        }
    }

    /**
     * 切换播放状态
     */
    togglePlay() {
        console.log('[ChatBubble] 切换播放状态', this.audioSrc);
        
        if (!this.audioSrc) {
            console.error('[ChatBubble] 音频源为空，无法播放');
            return;
        }
        
        if (!this.audioPlayer) {
            console.error('[ChatBubble] 音频播放器未初始化，无法播放');
            return;
        }
        
        if (this.isToggling) {
            console.log('[ChatBubble] 忽略重复切换请求');
            return;
        }
        
        this.isToggling = true;
        
        try {
            if (this.audioPlayer.isPlaying) {
                console.log('[ChatBubble] 暂停播放');
                // 检查是否是用户主动点击
                const isUserInitiated = document.activeElement === this.playButton || 
                                       (event && event.isTrusted);
                
                if (isUserInitiated) {
                    console.log('[ChatBubble] 用户主动暂停');
                    this.audioPlayer.pause();
                } else {
                    console.log('[ChatBubble] 非用户主动操作，忽略暂停请求');
                    // 不执行暂停操作
                }
            } else {
                console.log('[ChatBubble] 开始播放');
                
                // 检查音频文件是否存在
                fetch(this.audioSrc, { method: 'HEAD' })
                    .then(response => {
                        if (response.ok) {
                            console.log(`[ChatBubble] 音频文件存在: ${this.audioSrc}`);
                            this.audioPlayer.play();
                        } else {
                            console.error(`[ChatBubble] 音频文件不存在: ${this.audioSrc}, 状态码: ${response.status}`);
                            alert(`无法播放音频，文件不存在: ${this.audioSrc}`);
                        }
                    })
                    .catch(error => {
                        console.error(`[ChatBubble] 检查音频文件时出错: ${this.audioSrc}`, error);
                        this.audioPlayer.play(); // 尝试播放，可能是跨域问题导致 fetch 失败
                    });
            }
        } catch (error) {
            console.error('[ChatBubble] 切换播放状态时出错:', error);
        }
        
        // 防止短时间内多次触发
        setTimeout(() => {
            this.isToggling = false;
        }, 300);
    }

    /**
     * 播放时的处理
     */
    onPlay() {
        console.log('[ChatBubble] 播放开始回调');
        
        if (this.playButton) {
            this.playButton.innerHTML = '<i class="bi bi-pause-fill"></i>';
        }
        
        if (this.visualizer) {
            this.visualizer.start();
        }
        
        // 获取角色类型
        const bubble = this.element.closest('.chat-bubble');
        if (bubble) {
            const characterType = bubble.getAttribute('data-character');
            
            // 切换角色头像状态
            if (characterType === 'ai') {
                const botIdle = document.querySelector('.bot-idle');
                const botSpeaking = document.querySelector('.bot-speaking');
                const avatarContainer = document.querySelector('.ai-character .character-avatar');
                
                if (botIdle && botSpeaking && avatarContainer) {
                    botIdle.classList.add('d-none');
                    botSpeaking.classList.remove('d-none');
                    avatarContainer.classList.add('speaking');
                }
            } else if (characterType === 'user') {
                const userIdle = document.querySelector('.user-idle');
                const userSpeaking = document.querySelector('.user-speaking');
                const avatarContainer = document.querySelector('.user-character .character-avatar');
                
                if (userIdle && userSpeaking && avatarContainer) {
                    userIdle.classList.add('d-none');
                    userSpeaking.classList.remove('d-none');
                    avatarContainer.classList.add('speaking');
                } else if (avatarContainer) {
                    // 如果没有说话状态的图片，至少添加动画效果
                    avatarContainer.classList.add('speaking');
                }
            }
        }
        
        // 设置说话状态
        this.setSpeakingState(true);
    }

    /**
     * 暂停时的处理
     */
    onPause() {
        if (this.playButton) {
            this.playButton.innerHTML = '<i class="bi bi-play-fill"></i>';
        }
        
        if (this.visualizer) {
            this.visualizer.stop();
        }
        
        // 恢复角色头像状态
        const bubble = this.element.closest('.chat-bubble');
        if (bubble) {
            const characterType = bubble.getAttribute('data-character');
            
            if (characterType === 'ai') {
                const botIdle = document.querySelector('.bot-idle');
                const botSpeaking = document.querySelector('.bot-speaking');
                const avatarContainer = document.querySelector('.ai-character .character-avatar');
                
                if (botIdle && botSpeaking && avatarContainer) {
                    botIdle.classList.remove('d-none');
                    botSpeaking.classList.add('d-none');
                    avatarContainer.classList.remove('speaking');
                }
            } else if (characterType === 'user') {
                const userIdle = document.querySelector('.user-idle');
                const userSpeaking = document.querySelector('.user-speaking');
                const avatarContainer = document.querySelector('.user-character .character-avatar');
                
                if (userIdle && userSpeaking && avatarContainer) {
                    userIdle.classList.remove('d-none');
                    userSpeaking.classList.add('d-none');
                    avatarContainer.classList.remove('speaking');
                } else if (avatarContainer) {
                    // 如果没有说话状态的图片，至少移除动画效果
                    avatarContainer.classList.remove('speaking');
                }
            }
        }
        
        // 移除说话状态
        this.setSpeakingState(false);
    }

    /**
     * 音频播放结束处理
     */
    onEnded() {
        console.log('[ChatBubble] 播放结束回调');
        
        // 更新播放按钮图标
        if (this.playButton) {
            this.playButton.innerHTML = '<i class="bi bi-play-fill"></i>';
        }
        
        // 停止可视化效果
        if (this.visualizer) {
            this.visualizer.stop();
        }
        
        // 检查是否为 AI 气泡
        const isAiBubble = this.element.closest('.chat-bubble.incoming') !== null;
        console.log('[ChatBubble] 是否为AI气泡:', isAiBubble);
        
        // 如果是 AI 气泡，显示 "Your Turn" 提示
        if (isAiBubble) {
            console.log('[ChatBubble] 显示 Your Turn 提示');
            this.showYourTurnAlert();
        }
    }

    /**
     * 显示 "Your Turn" 提示
     */
    showYourTurnAlert() {
        // 检查是否已存在提示元素
        let alertElement = document.querySelector('.your-turn-alert');
        
        // 如果不存在，创建一个新的
        if (!alertElement) {
            alertElement = document.createElement('div');
            alertElement.className = 'your-turn-alert';
            alertElement.innerHTML = '<i class="bi bi-mic-fill alert-icon"></i>Your Turn! Please speak.';
            document.body.appendChild(alertElement);
        }
        
        // 显示提示
        setTimeout(() => {
            alertElement.classList.add('show');
            
            // 3秒后自动隐藏
            setTimeout(() => {
                alertElement.classList.remove('show');
                
                // 完全隐藏后移除元素
                setTimeout(() => {
                    if (alertElement.parentNode) {
                        alertElement.parentNode.removeChild(alertElement);
                    }
                }, 300);
            }, 3000); // 改回3秒
        }, 100);
    }

    /**
     * 添加动画效果
     * @param {string} animationType - 动画类型
     */
    animate(animationType = 'pulse') {
        // 移除之前的动画类
        this.element.classList.remove('animate-pulse', 'animate-bounce', 'animate-fade');
        
        // 添加新的动画类
        this.element.classList.add(`animate-${animationType}`);
        
        // 动画结束后移除类
        setTimeout(() => {
            this.element.classList.remove(`animate-${animationType}`);
        }, 1000);
    }

    /**
     * 设置说话状态
     * @param {boolean} isSpeaking - 是否正在说话
     */
    setSpeakingState(isSpeaking) {
        // 添加或移除说话状态类
        if (isSpeaking) {
            this.element.classList.add('speaking');
            
            // 获取当前气泡的角色类型
            const bubble = this.element.closest('.chat-bubble');
            if (bubble) {
                const characterType = bubble.getAttribute('data-character');
                
                // 使用 AnimationService 设置说话状态
                if (window.AnimationService) {
                    window.AnimationService.setSpeakingState(characterType, true);
                } else {
                    // 如果 AnimationService 不可用，使用内部逻辑
                    if (characterType === 'ai' || bubble.classList.contains('incoming')) {
                        const userCharacter = document.querySelector('.user-character');
                        if (userCharacter) userCharacter.classList.add('dimmed');
                    } else if (characterType === 'user' || bubble.classList.contains('outgoing')) {
                        const aiCharacter = document.querySelector('.ai-character');
                        if (aiCharacter) aiCharacter.classList.add('dimmed');
                    }
                }
            }
        } else {
            this.element.classList.remove('speaking');
            
            // 使用 AnimationService 移除说话状态
            if (window.AnimationService) {
                window.AnimationService.setSpeakingState(null, false);
            } else {
                // 如果 AnimationService 不可用，使用内部逻辑
                const characters = document.querySelectorAll('.character');
                characters.forEach(character => {
                    character.classList.remove('dimmed');
                });
            }
        }
    }

    /**
     * 添加新的气泡
     * @param {string} type - 气泡类型 ('incoming' 或 'outgoing')
     * @param {string} audioPath - 音频文件路径
     * @param {string} characterType - 角色类型 ('ai' 或 'user')
     */
    static addBubble(type, audioPath, characterType = 'ai') {
        // ... 现有代码 ...
        
        // 创建气泡后初始化动画
        const bubble = new ChatBubble(audioPlayer, {
            direction: type
        });
        
        // 确保 DOM 已更新后再开始动画
        requestAnimationFrame(() => {
            bubble.initializeAnimations();
            
            // 更新最新气泡样式
            if (typeof window.updateRecentBubbles === 'function') {
                window.updateRecentBubbles();
            }
        });
        
        return bubble;
    }

    /**
     * 初始化音频播放器
     */
    initAudioPlayer() {
        // 获取音频路径
        const audioPath = this.element.getAttribute('data-audio');
        console.log('Initializing audio player, path:', audioPath);
        
        if (!audioPath) {
            console.error('Audio path not set (data-audio attribute)');
            return;
        }
        
        // 创建音频播放器
        this.audioPlayer = new AudioPlayer(this.element, {
            audioPath: audioPath,
            onPlay: () => {
                console.log('Audio playback started');
                this.element.classList.add('playing');
                
                // 更新角色头像状态
                this.updateCharacterAvatar(true);
                
                // 触发播放回调
                if (this.options.onPlay) {
                    this.options.onPlay();
                }
            },
            onPause: () => {
                console.log('Audio paused');
                this.element.classList.remove('playing');
                
                // 更新角色头像状态
                this.updateCharacterAvatar(false);
                
                // 触发暂停回调
                if (this.options.onPause) {
                    this.options.onPause();
                }
            },
            onEnded: () => {
                console.log('Audio playback ended');
                this.element.classList.remove('playing');
                
                // 更新角色头像状态
                this.updateCharacterAvatar(false);
                
                // 触发结束回调
                if (this.options.onEnded) {
                    this.options.onEnded();
                }
            }
        });
        
        // 如果设置了自动播放，则播放音频
        if (this.options.autoplay) {
            console.log('Autoplay set, attempting to play audio');
            setTimeout(() => {
                this.audioPlayer.play();
            }, 500); // 延迟一点时间，确保 DOM 已完全渲染
        }
    }

    /**
     * 初始化可视化器
     */
    initVisualizer() {
        if (!this.visualizerContainer) return;
        
        // 创建可视化器实例
        this.visualizer = new Visualizer(this.visualizerContainer, {
            barCount: this.options.barCount,
            minHeight: this.options.minHeight,
            maxHeight: this.options.maxHeight,
            barClass: this.options.barClass
        });
        
        // 设置初始状态
        if (this.isPlaying) {
            this.visualizerContainer.classList.add('playing');
            this.visualizer.start();
        } else {
            this.visualizerContainer.classList.remove('playing');
            // 应用静态高度
            this.visualizer.applyStaticHeights();
        }
    }

    /**
     * 播放音频
     */
    play() {
        if (this.audioPlayer) {
            this.audioPlayer.play();
        }
    }

    /**
     * 暂停音频
     */
    pause() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
        }
    }
}

export default ChatBubble;

export function initializeChatContainer() {
    const container = document.getElementById('chatBubblesContainer');
    if (container.classList.contains('initializing')) {
        container.classList.remove('initializing');
    }
} 