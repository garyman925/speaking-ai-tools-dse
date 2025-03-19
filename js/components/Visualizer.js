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
            animated: true
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
        
        bars.forEach(bar => {
            // 生成 5px 到 15px 之间的随机高度
            const randomHeight = 5 + Math.floor(Math.random() * 10);
            bar.dataset.staticHeight = `${randomHeight}px`;
            
            // 如果不是播放状态，立即应用高度
            if (!this.container.classList.contains('playing')) {
                bar.style.height = bar.dataset.staticHeight;
            }
        });
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
        bars.forEach(bar => {
            if (bar.dataset.staticHeight) {
                bar.style.height = bar.dataset.staticHeight;
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
        
        for (let i = 0; i < this.bars.length; i++) {
            const barIndex = Math.floor(Math.pow(i / this.bars.length, 1.5) * this.dataArray.length);
            const value = this.dataArray[barIndex] || 0;
            const barHeight = (value / 255) * this.options.maxHeight;
            
            const height = Math.max(this.options.minHeight, barHeight);
            
            if (this.options.animated) {
                this.bars[i].style.height = `${height}px`;
            } else {
                this.bars[i].style.height = `${height}px`;
            }
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