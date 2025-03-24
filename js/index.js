import AudioService from './services/AudioService.js';
//import StorageService from './services/StorageService.js';
//import AudioRecorder from './components/AudioRecorder.js';
//import AudioPlayer from './components/AudioPlayer.js';
//import Visualizer from './components/Visualizer.js';
import ChatBubble from './components/ChatBubble.js';
import ChatRecorder from './components/ChatRecorder.js';
import SceneManager from './components/SceneManager.js';
import AnimationService from './services/AnimationService.js';

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 初始化音频服务
    AudioService.initialize();
    
    // 初始化所有聊天气泡
    document.querySelectorAll('.chat-bubble .audio-player').forEach(player => {
        new ChatBubble(player, {
            direction: player.closest('.chat-bubble').classList.contains('outgoing') ? 'outgoing' : 'incoming'
        });
    });
    
    // 初始化聊天容器滚动
    function initChatScroll() {
        const chatContainer = document.getElementById('chatContainer');
        if (chatContainer) {
            console.log('初始化聊天容器滚动');
            
            // 初始滚动到底部
            chatContainer.scrollTop = chatContainer.scrollHeight;
            
            // 添加滚动监听
            chatContainer.addEventListener('scroll', function() {
                console.log('滚动事件触发', 
                            '滚动位置:', chatContainer.scrollTop, 
                            '容器高度:', chatContainer.clientHeight, 
                            '内容高度:', chatContainer.scrollHeight);
                
                // 检查是否滚动到顶部，加载更多历史消息
                if (chatContainer.scrollTop === 0) {
                    console.log('滚动到顶部，可以加载更多历史消息');
                    // loadMoreMessages();
                }
            });
        }
    }

    // 调用初始化函数
    initChatScroll();

    // 初始化聊天录音组件
    const chatRecorderElements = {
        recordButton: document.getElementById('chatRecordButton'),
        recordingStatus: document.getElementById('recordingStatus')
    };

    const chatRecorder = new ChatRecorder(chatRecorderElements, {
        chatContainer: document.getElementById('chatContainer'),
        onRecordingStart: () => {
            console.log('聊天录音开始');
            // 更新用户头像为说话状态
            document.querySelector('.user-idle').classList.add('d-none');
            document.querySelector('.user-speaking').classList.remove('d-none');
        },
        onRecordingEnd: () => {
            console.log('聊天录音结束');
            // 恢复用户头像为静止状态
            document.querySelector('.user-idle').classList.remove('d-none');
            document.querySelector('.user-speaking').classList.add('d-none');
        },
        onAiResponseStart: () => {
            console.log('AI 回复开始');
            // 更新 AI 头像为说话状态
            document.querySelector('.bot-idle').classList.add('d-none');
            document.querySelector('.bot-speaking').classList.remove('d-none');
        },
        onAiResponseEnd: () => {
            console.log('AI 回复结束');
            // 恢复 AI 头像为静止状态
            document.querySelector('.bot-idle').classList.remove('d-none');
            document.querySelector('.bot-speaking').classList.add('d-none');
        },
        // 设置示例音频路径
        //demoAudioPath: 'assets/audio/demo/user_recording.mp3',
        //demoAiResponsePath: 'assets/audio/demo/ai_response.mp3',
        aiResponseDelay: 1500 // AI 回复延迟时间（毫秒）
    });
    
    // 添加动画效果
    function addAnimations() {
        // 为CSS添加动画类
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            
            @keyframes fade {
                0% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            .animate-pulse {
                animation: pulse 0.5s ease-in-out;
            }
            
            .animate-bounce {
                animation: bounce 0.5s ease-in-out;
            }
            
            .animate-fade {
                animation: fade 0.5s ease-in-out;
            }
        `;
        document.head.appendChild(style);
        
        // 为按钮添加悬停效果
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.classList.add('animate-pulse');
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.classList.remove('animate-pulse');
            });
        });
        
        // 为对话气泡添加点击动画
        document.querySelectorAll('.chat-bubble').forEach(bubble => {
            bubble.addEventListener('click', () => {
                bubble.classList.add('animate-bounce');
                setTimeout(() => {
                    bubble.classList.remove('animate-bounce');
                }, 500);
            });
        });
    }
    
    // 初始化动画
    addAnimations();

    // 预加载 webp 动画
    function preloadImages() {
        const botSpeakingImg = new Image();
        botSpeakingImg.src = 'assets/images/avatars/bot_speaking.webp';
        
        const userSpeakingImg = new Image();
        userSpeakingImg.src = 'assets/images/avatars/candidate_speaking.webp';
    }

    // 调用预加载函数
    preloadImages();

    // 创建一个全局函数来更新最新气泡的样式
    window.updateRecentBubbles = function() {
        const bubblesContainer = document.getElementById('chatBubblesContainer');
        if (!bubblesContainer) return;
        
        // 移除所有气泡的 recent 类
        document.querySelectorAll('.chat-bubble').forEach(bubble => {
            bubble.classList.remove('recent');
        });
        
        // 获取所有气泡
        const allBubbles = bubblesContainer.querySelectorAll('.chat-bubble');
        const bubbleCount = allBubbles.length;
        
        // 如果有气泡，为最后一个添加 recent 类
        if (bubbleCount > 0) {
            allBubbles[bubbleCount - 1].classList.add('recent');
            
            // 如果有两个或更多气泡，为倒数第二个也添加 recent 类
            if (bubbleCount > 1) {
                allBubbles[bubbleCount - 2].classList.add('recent');
            }
        }
        
        console.log('Updated latest bubble styles, total bubbles:', bubbleCount);
    }

    // 修改现有的 initRecentBubbles 函数
    function initRecentBubbles() {
        // 直接调用全局更新函数
        window.updateRecentBubbles();
    }

    // 调用初始化函数
    initRecentBubbles();

    // 初始化场景管理器
    const sceneManager = new SceneManager({
        onSceneChange: (sceneName, scene) => {
            console.log(`Scene changed to: ${sceneName}`);
            
            // 可以在这里添加其他场景切换逻辑
            // For example, update AI response logic, load scene-specific audio, etc.
        },
        onChatStart: (sceneName, scene) => {
            console.log(`Starting conversation in ${sceneName} scene`);
            
            // 可以在这里添加对话开始时的逻辑
            // For example, play welcome voice, show guidance tips, etc.
            
            // 移除初始化状态，使聊天气泡容器可见
            document.getElementById('chatBubblesContainer').classList.remove('initializing');
        },
        onSceneSelectorShow: () => {
            console.log('Showing scene selector');
            
            // 可以在这里添加显示场景选择器时的逻辑
            // For example, reset conversation state, play background music, etc.
        }
    });

    // 将场景管理器暴露给全局，方便调试
    window.sceneManager = sceneManager;

    // 初始化动画服务
    AnimationService.initialize();

    // 将动画服务暴露给全局，方便其他组件使用
    window.AnimationService = AnimationService;

    // 修改现有的自动播放禁用代码
    document.addEventListener('DOMContentLoaded', () => {
        // 不再全局禁用自动播放，而是将控制权交给场景管理器
        console.log('页面加载完成，准备初始化音频...');
        
        // 创建一个音频上下文解锁函数，用于在用户交互后解锁音频
        window.unlockAudio = function() {
            // 创建一个空的音频上下文并播放一个短暂的静音音频
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            oscillator.connect(audioContext.destination);
            oscillator.start(0);
            oscillator.stop(0.001);
            
            console.log('音频上下文已解锁');
            
            // 移除解锁事件监听器
            document.removeEventListener('click', window.unlockAudio);
            document.removeEventListener('touchstart', window.unlockAudio);
        };
        
        // 添加用户交互事件监听器，用于解锁音频
        document.addEventListener('click', window.unlockAudio);
        document.addEventListener('touchstart', window.unlockAudio);
    });

    // 预加载音频文件
    function preloadAudioFiles() {
        const audioFiles = [
            'assets/audio/ui/click.mp3',
            'assets/audio/ui/recording_sfx_1.mp3',
            'assets/audio/demo/user_recording.mp3',
            'assets/audio/demo/ai_response.mp3'
        ];
        
        console.log('预加载音频文件...');
        
        audioFiles.forEach(file => {
            AudioService.preloadAudio(file)
                .then(() => console.log(`预加载成功: ${file}`))
                .catch(error => console.error(`预加载失败: ${file}`, error));
        });
    }

    // 调用预加载函数
    preloadAudioFiles();

    // 在 DOMContentLoaded 事件处理函数中添加以下代码
    function simulateScroll() {
        const bubblesContainer = document.getElementById('chatBubblesContainer');
        const chatContainer = document.getElementById('chatContainer');
        
        if (bubblesContainer && chatContainer) {
            console.log('初始化模拟滚动');
            
            // 当前滚动位置
            let scrollTop = 0;
            // 最大可滚动高度
            let maxScroll = Math.max(0, bubblesContainer.scrollHeight - chatContainer.clientHeight);
            
            // 更新滚动位置的函数
            function updateScroll() {
                // 确保滚动值在有效范围内
                scrollTop = Math.max(0, Math.min(scrollTop, maxScroll));
                // 应用滚动位置
                bubblesContainer.style.transform = `translateY(-${scrollTop}px)`;
                bubblesContainer.style.transition = 'transform 0.1s ease-out';
            }
            
            // 添加鼠标滚轮事件
            chatContainer.addEventListener('wheel', (event) => {
                event.preventDefault();
                scrollTop += event.deltaY;
                updateScroll();
            }, { passive: false });
            
            // 添加触摸事件支持
            let touchStartY = 0;
            let lastTouchY = 0;
            let touchVelocity = 0;
            let isTouching = false;
            let animationFrame = null;
            
            chatContainer.addEventListener('touchstart', (event) => {
                touchStartY = event.touches[0].clientY;
                lastTouchY = touchStartY;
                isTouching = true;
                touchVelocity = 0;
                
                // 停止任何正在进行的惯性滚动
                if (animationFrame) {
                    cancelAnimationFrame(animationFrame);
                    animationFrame = null;
                }
            }, { passive: false });
            
            chatContainer.addEventListener('touchmove', (event) => {
                if (!isTouching) return;
                
                const touchY = event.touches[0].clientY;
                const diff = lastTouchY - touchY;
                
                // 计算速度
                touchVelocity = diff;
                
                scrollTop += diff;
                lastTouchY = touchY;
                updateScroll();
                
                // 防止页面整体滚动
                event.preventDefault();
            }, { passive: false });
            
            // 添加触摸结束事件，实现惯性滚动
            function handleTouchEnd() {
                if (!isTouching) return;
                isTouching = false;
                
                // 实现惯性滚动
                let velocity = touchVelocity * 2; // 增加一点惯性
                
                function inertiaScroll() {
                    if (Math.abs(velocity) > 0.5) {
                        scrollTop += velocity;
                        velocity *= 0.95; // 减速因子
                        updateScroll();
                        animationFrame = requestAnimationFrame(inertiaScroll);
                    } else {
                        cancelAnimationFrame(animationFrame);
                        animationFrame = null;
                    }
                }
                
                if (Math.abs(velocity) > 1) {
                    animationFrame = requestAnimationFrame(inertiaScroll);
                }
            }
            
            chatContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
            chatContainer.addEventListener('touchcancel', handleTouchEnd, { passive: true });
            
            // 添加滚动到底部的函数
            window.scrollToBottom = function(animate = true) {
                // 重新计算最大滚动值
                maxScroll = Math.max(0, bubblesContainer.scrollHeight - chatContainer.clientHeight);
                
                if (animate) {
                    // 使用平滑动画滚动到底部
                    bubblesContainer.style.transition = 'transform 0.3s ease-out';
                    scrollTop = maxScroll;
                    updateScroll();
                    
                    // 恢复较短的过渡时间
                    setTimeout(() => {
                        bubblesContainer.style.transition = 'transform 0.1s ease-out';
                    }, 300);
                } else {
                    // 立即滚动到底部
                    scrollTop = maxScroll;
                    updateScroll();
                }
                
                console.log('滚动到底部', scrollTop, maxScroll);
            };
            
            // 监听内容变化，更新最大滚动值
            const observer = new MutationObserver(() => {
                // 重新计算最大滚动值
                maxScroll = Math.max(0, bubblesContainer.scrollHeight - chatContainer.clientHeight);
                
                // 如果在底部附近，保持在底部
                if (maxScroll - scrollTop < 100) {
                    window.scrollToBottom();
                }
                
                console.log('内容变化', bubblesContainer.scrollHeight, chatContainer.clientHeight, maxScroll);
            });
            
            observer.observe(bubblesContainer, { childList: true, subtree: true });
            
            // 监听窗口大小变化
            window.addEventListener('resize', () => {
                // 重新计算最大滚动值
                maxScroll = Math.max(0, bubblesContainer.scrollHeight - chatContainer.clientHeight);
                
                // 如果在底部附近，保持在底部
                if (maxScroll - scrollTop < 100) {
                    window.scrollToBottom(false);
                } else {
                    // 确保滚动位置有效
                    scrollTop = Math.min(scrollTop, maxScroll);
                    updateScroll();
                }
            });
            
            // 初始滚动到底部
            setTimeout(() => {
                window.scrollToBottom(false);
            }, 500);
            
            console.log('模拟滚动初始化完成');
        }
    }

    // 调用函数
    simulateScroll();

    // 添加全局函数以显示 "Your Turn" 提示
    window.showYourTurnAlert = function(customMessage) {
        // 检查是否已存在提示元素
        let alertElement = document.querySelector('.your-turn-alert');
        
        // 如果不存在，创建一个新的
        if (!alertElement) {
            alertElement = document.createElement('div');
            alertElement.className = 'your-turn-alert';
            alertElement.innerHTML = `<i class="bi bi-mic-fill alert-icon"></i>${customMessage || 'Your Turn! Please speak.'}`;
            document.body.appendChild(alertElement);
        } else {
            // 如果存在，更新消息
            alertElement.innerHTML = `<i class="bi bi-mic-fill alert-icon"></i>${customMessage || 'Your Turn! Please speak.'}`;
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
    };

    /**
     * 检查必要的音频文件
     */
    function checkAudioFiles() {
        const audioFiles = [
            'assets/audio/ai/cafe_welcome.mp3',
            'assets/audio/ai/office_welcome.mp3',
            'assets/audio/ai/hospital_welcome.mp3'
        ];
        
        console.log('检查音频文件...');
        
        audioFiles.forEach(file => {
            fetch(file, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        console.log(`音频文件存在: ${file}`);
                    } else {
                        console.error(`音频文件不存在: ${file}, 状态码: ${response.status}`);
                    }
                })
                .catch(error => {
                    console.error(`检查音频文件时出错: ${file}`, error);
                });
        });
    }

    // 调用检查函数
    checkAudioFiles();

    /**
     * 检查必要的图片资源
     */
    function checkImageFiles() {
        const imageFiles = [
            'assets/images/avatars/candidate.png',
            'assets/images/avatars/candidate_speaking.webp',
            'assets/images/avatars/male_candidate.png',
            'assets/images/avatars/male_candidate_speaking.webp'
        ];
        
        console.log('检查图片资源...');
        
        imageFiles.forEach(file => {
            fetch(file, { method: 'HEAD' })
                .then(response => {
                    if (response.ok) {
                        console.log(`图片资源存在: ${file}`);
                    } else {
                        console.error(`图片资源不存在: ${file}, 状态码: ${response.status}`);
                    }
                })
                .catch(error => {
                    console.error(`检查图片资源时出错: ${file}`, error);
                });
        });
    }

    // 调用检查函数
    checkImageFiles();

    /**
     * 添加聊天气泡
     * @param {string} type - 气泡类型 ('incoming' 或 'outgoing')
     * @param {string} audioFile - 音频文件名（不包含路径）
     */
    function addChatBubble(type, audioFile) {
        const bubbleContainer = document.querySelector('.chat-bubbles-container');
        
        // 创建气泡元素
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${type}`;
        bubble.setAttribute('data-character', type === 'incoming' ? 'ai' : 'user');
        
        // 创建气泡内容
        const bubbleContent = document.createElement('div');
        bubbleContent.className = 'bubble-content';
        
        // 创建音频播放器
        const audioPlayer = document.createElement('div');
        audioPlayer.className = 'audio-player';
        audioPlayer.setAttribute('data-audio-src', audioFile); // 只设置文件名，路径将在 ChatBubble 中处理
        
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
        new ChatBubble(audioPlayer);
        
        // 滚动到底部
        scrollToBottom();
    }
}); 