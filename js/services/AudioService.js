/**
 * 音频服务类 - 处理音频上下文和分析器
 */
class AudioService {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.initialized = false;
        this.connectedElements = new WeakMap(); // 跟踪已连接的元素
    }

    /**
     * 初始化音频上下文
     */
    initialize() {
        if (!this.initialized) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 64;
                this.initialized = true;
                console.log('AudioContext 初始化成功，状态:', this.audioContext.state);
            } catch (error) {
                console.error('AudioContext 初始化失败:', error);
            }
        } else if (this.audioContext.state === 'suspended') {
            // 尝试恢复被暂停的上下文
            this.audioContext.resume().then(() => {
                console.log('AudioContext 已恢复');
            });
        }
        return this;
    }

    /**
     * 获取音频分析器
     */
    getAnalyser() {
        if (!this.initialized) {
            this.initialize();
        }
        return this.analyser;
    }

    /**
     * 获取音频上下文
     */
    getAudioContext() {
        if (!this.initialized) {
            this.initialize();
        }
        return this.audioContext;
    }

    /**
     * 创建媒体元素源
     * @param {HTMLMediaElement} mediaElement - 媒体元素
     */
    createMediaElementSource(mediaElement) {
        if (!this.initialized) {
            this.initialize();
        }
        
        // 检查元素是否已连接
        if (this.connectedElements.has(mediaElement)) {
            return this.connectedElements.get(mediaElement);
        }
        
        try {
            const source = this.audioContext.createMediaElementSource(mediaElement);
            this.connectedElements.set(mediaElement, source);
            return source;
        } catch (error) {
            console.error('创建媒体元素源失败:', error);
            // 如果失败，尝试创建一个空节点作为替代
            const dummyNode = this.audioContext.createGain();
            return dummyNode;
        }
    }

    /**
     * 创建媒体流源
     * @param {MediaStream} stream - 媒体流
     */
    createMediaStreamSource(stream) {
        const source = this.audioContext.createMediaStreamSource(stream);
        return source;
    }

    // 添加一个辅助方法来检查连接
    checkConnections() {
        if (!this.initialized) {
            console.warn('AudioService 尚未初始化');
            return false;
        }
        
        console.log('AudioContext 状态:', this.audioContext.state);
        return true;
    }

    /**
     * 预加载音频文件
     * @param {string} audioPath - 音频文件路径
     * @returns {Promise<void>}
     */
    preloadAudio(audioPath) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.preload = 'auto';
            
            audio.oncanplaythrough = () => {
                resolve();
            };
            
            audio.onerror = (error) => {
                console.warn(`预加载音频失败: ${audioPath}`, error);
                resolve(); // 即使失败也继续
            };
            
            audio.src = audioPath;
            audio.load();
        });
    }

    /**
     * 播放音效
     * @param {string} soundPath - 音效文件路径
     * @param {number} volume - 音量 (0-1)
     * @returns {Promise<void>}
     */
    playSound(soundPath, volume = 1.0) {
        return new Promise((resolve, reject) => {
            try {
                // 创建音频元素
                const audio = new Audio(soundPath);
                audio.volume = volume;
                
                // 添加事件监听器
                audio.onended = () => {
                    console.log('音效播放完成');
                    resolve();
                };
                
                audio.onerror = (error) => {
                    console.error('音效播放失败:', error);
                    reject(error);
                };
                
                // 播放音效
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error('音效播放被阻止:', error);
                        reject(error);
                    });
                }
            } catch (error) {
                console.error('创建音频元素失败:', error);
                reject(error);
            }
        });
    }

    /**
     * 播放内置音效
     * @param {string} effectName - 音效名称 ('recording_complete', 'click', 'error')
     * @param {number} volume - 音量 (0-1)
     * @returns {Promise<void>}
     */
    playEffect(effectName, volume = 1.0) {
        const effectPaths = {
            recording_complete: 'assets/audio/ui/recording_sfx_1.mp3',
            click: 'assets/audio/ui/click.mp3',
            error: 'assets/audio/ui/error.mp3'
        };
        
        const path = effectPaths[effectName];
        if (!path) {
            console.warn(`未知音效: ${effectName}`);
            return Promise.reject(new Error(`未知音效: ${effectName}`));
        }
        
        return this.playSound(path, volume);
    }
}

// 导出单例
export default new AudioService(); 