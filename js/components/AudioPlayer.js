import AudioService from '../services/AudioService.js';

/**
 * 音频播放器组件类 - 处理音频播放
 */
class AudioPlayer {
    /**
     * @param {string} audioSrc - 音频源
     * @param {Object} options - 配置选项
     */
    constructor(audioSrc, options = {}) {
        this.audioSrc = audioSrc;
        this.options = Object.assign({
            autoplay: false,
            visualize: false,
            onPlay: null,
            onPause: null,
            onEnded: null
        }, options);
        
        this.audio = new Audio(audioSrc);
        
        // 添加错误事件监听
        this.audio.addEventListener('error', (e) => {
            console.error('音频加载错误:', e);
            console.error('错误代码:', this.audio.error.code);
            console.error('音频路径:', audioSrc);
        });
        
        this.source = null;
        this.analyser = null;
        this.isPlaying = false;
        
        this.initialize();
    }

    /**
     * 初始化播放器
     */
    initialize() {
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            if (this.options.onEnded) {
                this.options.onEnded();
            }
        });
        
        if (this.options.autoplay) {
            this.play();
        }
    }

    /**
     * 连接到音频分析器
     */
    connectToAnalyser() {
        if (!this.source) {
            try {
                AudioService.initialize();
                this.analyser = AudioService.getAnalyser();
                this.source = AudioService.createMediaElementSource(this.audio);
                this.source.connect(this.analyser);
                this.analyser.connect(AudioService.getAudioContext().destination);
                console.log('音频连接成功');
            } catch (error) {
                console.error('连接到分析器失败:', error);
                // 如果连接失败，创建一个简单的连接
                this.source = { connect: () => {} }; // 空对象
            }
        }
    }

    /**
     * 播放音频
     * @returns {Promise} 播放操作的 Promise
     */
    async play() {
        // 检查是否在场景选择器中
        const sceneSelector = document.getElementById('sceneSelector');
        if (sceneSelector && sceneSelector.style.display !== 'none') {
            console.log('场景选择器显示中，不播放音频');
            return Promise.resolve();
        }
        
        if (this.isPlaying) return;
        
        try {
            // 确保音频上下文已初始化并处于运行状态
            const audioContext = AudioService.getAudioContext();
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            if (this.options.visualize) {
                this.connectToAnalyser();
                
                // 添加播放状态类到可视化器容器
                if (this.visualizerContainer) {
                    this.visualizerContainer.classList.add('playing');
                }
            }
            
            console.log('尝试播放:', this.audioSrc);
            await this.audio.play();
            this.isPlaying = true;
            
            if (this.options.onPlay) {
                this.options.onPlay();
            }
        } catch (error) {
            console.error('播放失败:', error);
            // 尝试不使用分析器直接播放
            try {
                await this.audio.play();
                this.isPlaying = true;
                
                // 添加播放状态类到可视化器容器
                if (this.visualizerContainer && this.options.visualize) {
                    this.visualizerContainer.classList.add('playing');
                }
                
                if (this.options.onPlay) {
                    this.options.onPlay();
                }
            } catch (innerError) {
                console.error('直接播放也失败:', innerError);
                
                // 移除播放状态类
                if (this.visualizerContainer && this.options.visualize) {
                    this.visualizerContainer.classList.remove('playing');
                }
            }
        }
    }

    /**
     * 暂停音频
     */
    pause() {
        if (!this.isPlaying) return;
        
        this.audio.pause();
        this.isPlaying = false;
        
        // 移除播放状态类
        if (this.visualizerContainer && this.options.visualize) {
            this.visualizerContainer.classList.remove('playing');
        }
        
        if (this.options.onPause) {
            this.options.onPause();
        }
    }

    /**
     * 停止音频
     */
    stop() {
        this.pause();
        this.audio.currentTime = 0;
    }

    /**
     * 设置音量
     * @param {number} volume - 音量值 (0-1)
     */
    setVolume(volume) {
        this.audio.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 获取音频时长
     */
    getDuration() {
        return this.audio.duration;
    }

    /**
     * 获取当前播放位置
     */
    getCurrentTime() {
        return this.audio.currentTime;
    }

    /**
     * 设置当前播放位置
     * @param {number} time - 时间（秒）
     */
    setCurrentTime(time) {
        this.audio.currentTime = time;
    }
}

export default AudioPlayer; 