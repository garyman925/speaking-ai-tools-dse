import AudioService from './services/AudioService.js';
import StorageService from './services/StorageService.js';
import AudioRecorder from './components/AudioRecorder.js';
import AudioPlayer from './components/AudioPlayer.js';
import Visualizer from './components/Visualizer.js';
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
        demoAudioPath: 'assets/audio/demo/user_recording.mp3',
        demoAiResponsePath: 'assets/audio/demo/ai_response.mp3',
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
        
        console.log('已更新最新气泡样式，共有气泡：', bubbleCount);
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
            console.log(`场景已切换到: ${sceneName}`);
            
            // 可以在这里添加其他场景切换逻辑
            // 例如更新 AI 回复逻辑、加载场景特定的音频等
        },
        onChatStart: (sceneName, scene) => {
            console.log(`开始在 ${sceneName} 场景中对话`);
            
            // 可以在这里添加对话开始时的逻辑
            // 例如播放欢迎语音、显示引导提示等
            
            // 移除初始化状态，使聊天气泡容器可见
            document.getElementById('chatBubblesContainer').classList.remove('initializing');
        },
        onSceneSelectorShow: () => {
            console.log('显示场景选择器');
            
            // 可以在这里添加显示场景选择器时的逻辑
            // 例如重置对话状态、播放背景音乐等
        }
    });

    // 将场景管理器暴露给全局，方便调试
    window.sceneManager = sceneManager;

    // 初始化动画服务
    AnimationService.initialize();

    // 将动画服务暴露给全局，方便其他组件使用
    window.AnimationService = AnimationService;

    // 确保在页面加载时不会自动播放音频
    document.addEventListener('DOMContentLoaded', () => {
        // 禁用所有预设的音频元素自动播放
        document.querySelectorAll('audio').forEach(audio => {
            audio.autoplay = false;
            audio.pause();
        });
        
        // 禁用所有带有 data-audio 属性的元素自动播放
        document.querySelectorAll('[data-audio]').forEach(element => {
            element.removeAttribute('autoplay');
        });
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
}); 