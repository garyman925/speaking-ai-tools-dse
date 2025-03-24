import AudioService from '../services/AudioService.js';

/**
 * 可视化组件类 - 处理声波可视化
 */
class Visualizer {
    /**
     * @param {string} containerId - 容器元素ID
     * @param {Object} options - 配置选项
     */
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = Object.assign({
            barCount: 30,
            minHeight: 5,
            maxHeight: 150,
            barClass: 'bar',
            animated: true,
            wavePattern: false
        }, options);
        
        this.bars = [];
        this.dataArray = null;
        this.animationId = null;
        this.analyser = null;
        
        this.initialize();
    }

    /**
     * 初始化可视化器
     */
    initialize() {
        this.createBars();
        this.analyser = AudioService.getAnalyser();
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
        
        // 设置静态随机高度
        this.setStaticRandomHeights();
    }

    /**
     * 创建声波条
     */
    createBars() {
        this.container.innerHTML = '';
        for (let i = 0; i < this.options.barCount; i++) {
            const bar = document.createElement('div');
            bar.className = this.options.barClass;
            bar.style.height = `${this.options.minHeight}px`;
            this.container.appendChild(bar);
            this.bars.push(bar);
        }
    }

    /**
     * 设置静态随机高度
     */
    setStaticRandomHeights() {
        const bars = this.container.querySelectorAll(`.${this.options.barClass}`);
        
        if (this.options.wavePattern) {
            // 创建一个平滑的波形模式
            const wavePattern = [];
            const waveLength = Math.floor(this.options.barCount / 2); // 调整波长
            
            // 生成一个平滑的正弦波形
            for (let i = 0; i < this.options.barCount; i++) {
                // 使用正弦函数生成波形
                const phase = (i % waveLength) / waveLength * Math.PI * 2;
                const sineValue = Math.sin(phase);
                
                // 将正弦值映射到高度范围 (5px 到 15px)
                const height = 5 + (sineValue + 1) * 5;
                wavePattern.push(height);
            }
            
            // 应用波形模式，添加较小的随机变化
            bars.forEach((bar, index) => {
                const baseHeight = wavePattern[index];
                // 添加一点随机变化 (-1px 到 +1px)
                const randomVariation = (Math.random() * 2) - 1;
                const finalHeight = Math.max(3, baseHeight + randomVariation);
                
                bar.dataset.staticHeight = `${finalHeight}px`;
                bar.style.setProperty('--static-height', `${finalHeight}px`);
                
                // 如果不是播放状态，立即应用高度
                if (!this.container.classList.contains('playing')) {
                    bar.style.height = bar.dataset.staticHeight;
                }
            });
        } else {
            // 使用随机高度
            bars.forEach(bar => {
                // 生成 5px 到 15px 之间的随机高度
                const randomHeight = 5 + Math.floor(Math.random() * 10);
                bar.dataset.staticHeight = `${randomHeight}px`;
                bar.style.setProperty('--static-height', `${randomHeight}px`);
                
                // 如果不是播放状态，立即应用高度
                if (!this.container.classList.contains('playing')) {
                    bar.style.height = bar.dataset.staticHeight;
                }
            });
        }
    }

    /**
     * 设置播放状态
     * @param {boolean} isPlaying - 是否正在播放
     */
    setPlayingState(isPlaying) {
        if (isPlaying) {
            this.container.classList.add('playing');
        } else {
            this.container.classList.remove('playing');
            
            // 恢复静态高度
            this.applyStaticHeights();
        }
    }

    /**
     * 应用静态高度
     */
    applyStaticHeights() {
        const bars = this.container.querySelectorAll(`.${this.options.barClass}`);
        
        // 应用静态高度，创造静态波浪效果
        bars.forEach((bar, index) => {
            if (bar.dataset.staticHeight) {
                // 使用延迟应用高度，创造波浪效果
                setTimeout(() => {
                    bar.style.height = bar.dataset.staticHeight;
                }, index * 5); // 每个条形延迟 5ms，创造微小的波浪效果
            }
        });
    }

    /**
     * 开始绘制声波
     */
    start() {
        // 设置播放状态
        this.setPlayingState(true);
        this.draw();
    }

    /**
     * 绘制声波
     */
    draw() {
        this.animationId = requestAnimationFrame(() => this.draw());
        
        if (!this.analyser) return;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // 使用平滑的波形映射
        for (let i = 0; i < this.bars.length; i++) {
            // 使用非线性映射获取更好的频率分布
            const barIndex = Math.floor(Math.pow(i / this.bars.length, 1.5) * this.dataArray.length);
            const value = this.dataArray[barIndex] || 0;
            const barHeight = (value / 255) * this.options.maxHeight;
            
            // 确保最小高度
            const height = Math.max(this.options.minHeight, barHeight);
            
            // 应用高度
            this.bars[i].style.height = `${height}px`;
        }
    }

    /**
     * 停止绘制声波
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // 设置为非播放状态
        this.setPlayingState(false);
    }

    /**
     * 重置声波条高度
     */
    reset() {
        // 应用静态高度而不是固定高度
        this.applyStaticHeights();
    }
}

export default Visualizer; 