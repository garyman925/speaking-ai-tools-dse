import AudioService from '../services/AudioService.js';
import StorageService from '../services/StorageService.js';

/**
 * 录音组件类 - 处理音频录制
 */
class AudioRecorder {
    /**
     * @param {Object} elements - DOM元素
     * @param {Object} options - 配置选项
     */
    constructor(elements, options = {}) {
        this.elements = elements;
        this.options = Object.assign({
            mimeType: 'audio/wav'
        }, options);
        
        this.mediaRecorder = null;
        this.audioStream = null;
        this.audioSource = null;
        this.audioChunks = [];
        this.isRecording = false;
        
        this.bindEvents();
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        if (this.elements.recordButton) {
            this.elements.recordButton.addEventListener('click', () => this.startRecording());
        }
        
        if (this.elements.stopButton) {
            this.elements.stopButton.addEventListener('click', () => this.stopRecording());
        }
    }

    /**
     * 开始录音
     */
    async startRecording() {
        try {
            AudioService.initialize();
            
            this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.audioSource = AudioService.createMediaStreamSource(this.audioStream);
            this.audioSource.connect(AudioService.getAnalyser());
            
            this.mediaRecorder = new MediaRecorder(this.audioStream);
            this.audioChunks = [];
            
            this.mediaRecorder.addEventListener('dataavailable', event => {
                this.audioChunks.push(event.data);
            });
            
            this.mediaRecorder.addEventListener('stop', () => this.onRecordingStop());
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            this.updateUI(true);
            
            if (this.options.onStart) {
                this.options.onStart();
            }
            
        } catch (error) {
            console.error('录音失败:', error);
            alert('无法访问麦克风，请确保已授予权限。');
            
            this.updateUI(false);
        }
    }

    /**
     * 停止录音
     */
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }
        
        this.isRecording = false;
        
        if (this.options.onStop) {
            this.options.onStop();
        }
    }

    /**
     * 录音停止后的处理
     */
    onRecordingStop() {
        const audioBlob = new Blob(this.audioChunks, { type: this.options.mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const recording = {
            id: Date.now(),
            url: audioUrl,
            blob: audioBlob,
            date: new Date()
        };
        
        StorageService.addRecording(recording);
        
        this.updateUI(false);
        
        if (this.options.onRecordingReady) {
            this.options.onRecordingReady(recording);
        }
    }

    /**
     * 更新UI状态
     * @param {boolean} isRecording - 是否正在录音
     */
    updateUI(isRecording) {
        if (this.elements.recordButton) {
            this.elements.recordButton.disabled = isRecording;
        }
        
        if (this.elements.stopButton) {
            this.elements.stopButton.disabled = !isRecording;
        }
        
        if (this.elements.demoButton) {
            this.elements.demoButton.disabled = isRecording;
        }
    }
}

export default AudioRecorder; 