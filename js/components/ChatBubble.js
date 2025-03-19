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
        console.log('音频路径:', this.audioSrc); // 添加调试信息
        
        // 创建音频播放器
        this.audioPlayer = new AudioPlayer(this.audioSrc, {
            visualize: true,
            onPlay: () => this.onPlay(),
            onPause: () => this.onPause(),
            onEnded: () => this.onEnded()
        });
        
        // 创建可视化器
        if (this.visualizerContainer) {
            // 为可视化器容器添加唯一ID
            const visualizerId = `visualizer-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            this.visualizerContainer.id = visualizerId;
            
            this.visualizer = new Visualizer(visualizerId, {
                barCount: this.options.barCount,
                minHeight: this.options.minHeight,
                maxHeight: this.options.maxHeight,
                barClass: this.options.barClass
            });
        }
        
        // 绑定事件
        if (this.playButton) {
            this.playButton.addEventListener('click', () => this.togglePlay());
        }
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
     * 切换播放/暂停
     */
    togglePlay() {
        console.log('切换播放状态, 当前状态:', this.audioPlayer.isPlaying);
        
        if (this.audioPlayer.isPlaying) {
            this.audioPlayer.stop();
            this.onPause();
        } else {
            // 停止所有其他播放中的气泡
            if (window.activeChatBubble && window.activeChatBubble !== this) {
                window.activeChatBubble.audioPlayer.stop();
                window.activeChatBubble.onPause();
            }
            
            // 确保音频上下文已初始化
            AudioService.initialize();
            
            this.audioPlayer.play().catch(error => {
                console.error('播放失败:', error);
                alert('无法播放音频，请检查音频文件是否存在。');
            });
            
            window.activeChatBubble = this;
        }
    }

    /**
     * 播放时的处理
     */
    onPlay() {
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
     * 播放结束时的处理
     */
    onEnded() {
        this.onPause();
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
        console.log('初始化音频播放器，路径:', audioPath);
        
        if (!audioPath) {
            console.error('未设置音频路径 (data-audio 属性)');
            return;
        }
        
        // 创建音频播放器
        this.audioPlayer = new AudioPlayer(this.element, {
            audioPath: audioPath,
            onPlay: () => {
                console.log('音频开始播放');
                this.element.classList.add('playing');
                
                // 更新角色头像状态
                this.updateCharacterAvatar(true);
                
                // 触发播放回调
                if (this.options.onPlay) {
                    this.options.onPlay();
                }
            },
            onPause: () => {
                console.log('音频暂停');
                this.element.classList.remove('playing');
                
                // 更新角色头像状态
                this.updateCharacterAvatar(false);
                
                // 触发暂停回调
                if (this.options.onPause) {
                    this.options.onPause();
                }
            },
            onEnded: () => {
                console.log('音频播放结束');
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
            console.log('设置了自动播放，尝试播放音频');
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
}

export default ChatBubble;

export function initializeChatContainer() {
    const container = document.getElementById('chatBubblesContainer');
    if (container.classList.contains('initializing')) {
        container.classList.remove('initializing');
    }
} 