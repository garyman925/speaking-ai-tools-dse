/**
 * 动画服务 - 处理应用中的各种动画效果
 */
class AnimationService {
    /**
     * 初始化动画服务
     */
    static initialize() {
        // 加载必要的资源或设置
        console.log('动画服务已初始化');
    }
    
    /**
     * 显示奖励动画
     * @param {string} type - 动画类型 ('star', 'confetti', 'fireworks')
     */
    static showReward(type = 'star') {
        switch(type) {
            case 'star':
                this.showStarAnimation();
                break;
            case 'confetti':
                this.showConfettiAnimation();
                break;
            case 'fireworks':
                this.showFireworksAnimation();
                break;
            default:
                this.showStarAnimation();
        }
    }
    
    /**
     * 显示星星奖励动画
     */
    static showStarAnimation() {
        // 实现星星动画
    }
    
    /**
     * 显示彩带奖励动画
     */
    static showConfettiAnimation() {
        // 实现彩带动画
    }
    
    /**
     * 显示烟花奖励动画
     */
    static showFireworksAnimation() {
        // 实现烟花动画
    }
    
    /**
     * 执行场景过渡动画
     * @param {Function} changeSceneCallback - 切换场景的回调函数
     * @returns {Promise} - 动画完成的 Promise
     */
    static async sceneTransition(changeSceneCallback) {
        return new Promise((resolve) => {
            // 创建过渡遮罩（如果不存在）
            let overlay = document.querySelector('.scene-transition-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'scene-transition-overlay';
                document.body.appendChild(overlay);
            }

            // 创建动画时间线
            const tl = gsap.timeline({
                onComplete: () => resolve()
            });

            // 淡出当前场景
            tl.to(overlay, {
                opacity: 1,
                duration: 0.5,
                ease: 'power2.inOut',
                onComplete: () => {
                    // 在完全不透明时执行场景切换
                    changeSceneCallback();
                }
            })
            // 淡入新场景
            .to(overlay, {
                opacity: 0,
                duration: 0.5,
                ease: 'power2.inOut',
                delay: 0.2 // 给予一点延迟，确保新场景已加载
            });
        });
    }
    
    /**
     * 添加场景元素动画
     * @param {string} type - 动画类型 ('in' 或 'out')
     */
    static animateSceneElements(type) {
        const elements = [
            '.character',
            '.chat-container',
            '.scene-selector-inner',
            '.chat-controls'
        ];

        elements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                gsap.to(element, {
                    opacity: type === 'in' ? 1 : 0,
                    y: type === 'in' ? 0 : 20,
                    duration: 0.5,
                    ease: 'power2.out',
                    stagger: 0.1
                });
            }
        });
    }
    
    /**
     * 设置说话状态
     * @param {string} speakingCharacterType - 正在说话的角色类型 ('ai' 或 'user')
     * @param {boolean} isSpeaking - 是否正在说话
     */
    static setSpeakingState(speakingCharacterType, isSpeaking) {
        // 获取角色元素
        const aiCharacter = document.querySelector('.ai-character');
        const userCharacter = document.querySelector('.user-character');
        
        if (isSpeaking) {
            // 如果是 AI 说话，将用户角色设置为暗淡
            if (speakingCharacterType === 'ai') {
                if (userCharacter) userCharacter.classList.add('dimmed');
                if (aiCharacter) aiCharacter.classList.remove('dimmed');
            } 
            // 如果是用户说话，将 AI 角色设置为暗淡
            else if (speakingCharacterType === 'user') {
                if (aiCharacter) aiCharacter.classList.add('dimmed');
                if (userCharacter) userCharacter.classList.remove('dimmed');
            }
        } else {
            // 移除所有角色的暗淡效果
            if (aiCharacter) aiCharacter.classList.remove('dimmed');
            if (userCharacter) userCharacter.classList.remove('dimmed');
        }
    }
    
    /**
     * 处理聊天界面的动画
     * @param {string} type - 动画类型 ('in' 或 'out')
     * @returns {Promise<void>}
     */
    static async animateChatInterface(type) {
        return new Promise((resolve) => {
            const elements = [
                '.chat-container',
                '.chat-controls',
                '.character'
            ];
            
            const tl = gsap.timeline({
                onComplete: () => resolve()
            });
            
            if (type === 'in') {
                // 淡入动画
                elements.forEach(selector => {
                    const element = document.querySelectorAll(selector);
                    if (element.length) {
                        tl.fromTo(element, 
                            { opacity: 0, y: 20 },
                            { 
                                opacity: 1, 
                                y: 0, 
                                duration: 0.5, 
                                stagger: 0.1,
                                ease: 'power2.out'
                            },
                            '-=0.3' // 重叠动画
                        );
                    }
                });
            } else {
                // 淡出动画
                elements.forEach(selector => {
                    const element = document.querySelectorAll(selector);
                    if (element.length) {
                        tl.to(element, { 
                            opacity: 0, 
                            y: -20, 
                            duration: 0.5,
                            stagger: 0.1,
                            ease: 'power2.in'
                        }, '-=0.3');
                    }
                });
            }
        });
    }
    
    /**
     * 预加载图片
     * @param {string} imagePath - 图片路径
     * @returns {Promise<void>}
     */
    static preloadImage(imagePath) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                resolve();
            };
            img.onerror = () => {
                console.warn(`预加载图片失败: ${imagePath}`);
                resolve(); // 即使失败也继续
            };
            img.src = imagePath;
        });
    }
}

export default AnimationService; 