document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const recordButton = document.getElementById('recordButton');
    const stopButton = document.getElementById('stopButton');
    const demoButton = document.getElementById('demoButton');
    const barsContainer = document.getElementById('bars-container');
    const recordingsList = document.getElementById('recordingsList');
    
    // 创建条形数量
    const totalBars = 30;
    const chatBars = 15; // 对话气泡中的条形数量
    
    // 创建初始条形
    function createBars() {
        barsContainer.innerHTML = '';
        for (let i = 0; i < totalBars; i++) {
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = '5px'; // 初始高度
            barsContainer.appendChild(bar);
        }
    }
    
    // 为对话气泡创建声波条
    function createChatBars() {
        const visualizers = document.querySelectorAll('.audio-visualizer');
        visualizers.forEach(visualizer => {
            visualizer.innerHTML = '';
            for (let i = 0; i < chatBars; i++) {
                const bar = document.createElement('div');
                bar.className = 'bar';
                bar.style.height = '5px'; // 初始高度
                visualizer.appendChild(bar);
            }
        });
    }
    
    // 初始化条形
    createBars();
    createChatBars();
    
    // 音频相关变量
    let audioContext;
    let mediaRecorder;
    let audioStream;
    let audioSource;
    let analyser;
    let dataArray;
    let recordings = [];
    let demoAudio;
    let demoSource;
    let isPlayingDemo = false;
    let animationId;
    
    // 对话气泡音频变量
    let chatAudios = {};
    let chatSources = {};
    let chatAnalysers = {};
    let chatDataArrays = {};
    let chatAnimationIds = {};
    
    // 初始化对话气泡音频
    function initChatAudio() {
        const audioPlayers = document.querySelectorAll('.audio-player');
        
        audioPlayers.forEach((player, index) => {
            const id = `chat-audio-${index}`;
            player.setAttribute('data-id', id);
            
            const audioSrc = player.getAttribute('data-audio');
            
            // 初始化音频
            chatAudios[id] = new Audio(audioSrc);
            
            // 创建分析器
            chatAnalysers[id] = audioContext.createAnalyser();
            chatAnalysers[id].fftSize = 32;
            const bufferLength = chatAnalysers[id].frequencyBinCount;
            chatDataArrays[id] = new Uint8Array(bufferLength);
            
            // 创建媒体元素源
            chatSources[id] = audioContext.createMediaElementSource(chatAudios[id]);
            chatSources[id].connect(chatAnalysers[id]);
            chatAnalysers[id].connect(audioContext.destination);
        });
    }
    
    // 在初始化音频上下文后调用
    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 64;
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            // 初始化所有对话气泡音频
            initChatAudio();
        }
    }
    
    // 绘制声波
    function drawWaveform() {
        // 请求动画帧
        animationId = requestAnimationFrame(drawWaveform);
        
        // 如果没有分析器，则不绘制
        if (!analyser) return;
        
        // 获取频率数据
        analyser.getByteFrequencyData(dataArray);
        
        // 获取所有条形
        const bars = barsContainer.querySelectorAll('.bar');
        
        // 更新每个条形的高度
        for (let i = 0; i < bars.length; i++) {
            // 使用对数分布来获取更好的视觉效果
            const barIndex = Math.floor(Math.pow(i / bars.length, 1.5) * dataArray.length);
            const value = dataArray[barIndex] || 0;
            const barHeight = (value / 255) * 150; // 最大高度 150px
            
            // 设置最小高度
            const height = Math.max(5, barHeight);
            
            // 应用高度
            bars[i].style.height = height + 'px';
        }
    }
    
    // 为对话气泡绘制声波
    function drawChatWaveform(id, analyser, dataArray) {
        // 请求动画帧
        chatAnimationIds[id] = requestAnimationFrame(() => drawChatWaveform(id, analyser, dataArray));
        
        // 获取频率数据
        analyser.getByteFrequencyData(dataArray);
        
        // 获取所有条形
        const visualizer = document.querySelector(`.audio-player[data-id="${id}"] .audio-visualizer`);
        const bars = visualizer.querySelectorAll('.bar');
        
        // 更新每个条形的高度
        for (let i = 0; i < bars.length; i++) {
            // 使用对数分布来获取更好的视觉效果
            const barIndex = Math.floor(Math.pow(i / bars.length, 1.5) * dataArray.length);
            const value = dataArray[barIndex] || 0;
            const barHeight = (value / 255) * 30; // 最大高度 30px
            
            // 设置最小高度
            const height = Math.max(3, barHeight);
            
            // 应用高度
            bars[i].style.height = height + 'px';
        }
    }
    
    // 停止动画
    function stopAnimation() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        // 重置所有条形高度
        const bars = barsContainer.querySelectorAll('.bar');
        bars.forEach(bar => {
            bar.style.height = '5px';
        });
    }
    
    // 停止对话气泡动画
    function stopChatAnimation(id) {
        if (chatAnimationIds[id]) {
            cancelAnimationFrame(chatAnimationIds[id]);
            chatAnimationIds[id] = null;
        }
        
        // 重置所有条形高度
        const visualizer = document.querySelector(`.audio-player[data-id="${id}"] .audio-visualizer`);
        if (visualizer) {
            const bars = visualizer.querySelectorAll('.bar');
            bars.forEach(bar => {
                bar.style.height = '3px';
            });
        }
    }
    
    // 处理对话气泡音频播放
    function setupChatAudioPlayers() {
        const audioPlayers = document.querySelectorAll('.audio-player');
        
        audioPlayers.forEach((player, index) => {
            const id = `chat-audio-${index}`;
            player.setAttribute('data-id', id);
            
            const audioSrc = player.getAttribute('data-audio');
            const playBtn = player.querySelector('.chat-play-btn');
            
            // 初始化音频
            chatAudios[id] = new Audio(audioSrc);
            
            // 播放结束时重置
            chatAudios[id].addEventListener('ended', function() {
                playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
                stopChatAnimation(id);
            });
            
            // 点击播放按钮
            playBtn.addEventListener('click', function() {
                // 初始化音频上下文
                initAudio();
                
                // 如果正在播放，则停止
                if (!chatAudios[id].paused) {
                    chatAudios[id].pause();
                    chatAudios[id].currentTime = 0;
                    playBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
                    stopChatAnimation(id);
                    return;
                }
                
                // 停止所有其他播放中的音频
                Object.keys(chatAudios).forEach(key => {
                    if (key !== id && !chatAudios[key].paused) {
                        chatAudios[key].pause();
                        chatAudios[key].currentTime = 0;
                        const otherBtn = document.querySelector(`.audio-player[data-id="${key}"] .chat-play-btn`);
                        if (otherBtn) {
                            otherBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
                        }
                        stopChatAnimation(key);
                    }
                });
                
                // 如果尚未创建媒体元素源，则创建
                if (!chatSources[id]) {
                    chatAnalysers[id] = audioContext.createAnalyser();
                    chatAnalysers[id].fftSize = 32;
                    const bufferLength = chatAnalysers[id].frequencyBinCount;
                    chatDataArrays[id] = new Uint8Array(bufferLength);
                    
                    chatSources[id] = audioContext.createMediaElementSource(chatAudios[id]);
                    chatSources[id].connect(chatAnalysers[id]);
                    chatAnalysers[id].connect(audioContext.destination);
                }
                
                // 播放当前音频
                chatAudios[id].play().then(() => {
                    // 更新UI
                    playBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
                    
                    // 开始绘制声波
                    drawChatWaveform(id, chatAnalysers[id], chatDataArrays[id]);
                }).catch(error => {
                    console.error('播放对话音频失败:', error);
                    alert('无法播放音频，请确保文件路径正确。');
                });
            });
        });
    }
    
    // 设置对话气泡音频播放器
    setupChatAudioPlayers();
    
    // 播放示例音频
    async function playDemoAudio() {
        try {
            // 初始化音频上下文
            initAudio();
            
            if (isPlayingDemo) {
                // 如果正在播放，则停止
                demoAudio.pause();
                demoAudio.currentTime = 0;
                if (demoSource) {
                    demoSource.disconnect();
                }
                demoButton.innerHTML = '<i class="bi bi-file-music-fill"></i> 播放示例';
                isPlayingDemo = false;
                stopAnimation();
                return;
            }
            
            // 禁用录音按钮
            recordButton.disabled = true;
            
            // 加载示例音频
            if (!demoAudio) {
                demoAudio = new Audio('assets/audio/ai/demo.mp3');
                demoAudio.addEventListener('ended', function() {
                    demoButton.innerHTML = '<i class="bi bi-file-music-fill"></i> 播放示例';
                    recordButton.disabled = false;
                    isPlayingDemo = false;
                    stopAnimation();
                });
            }
            
            // 播放音频并连接到分析器
            await demoAudio.play();
            
            // 创建媒体元素源
            demoSource = audioContext.createMediaElementSource(demoAudio);
            demoSource.connect(analyser);
            analyser.connect(audioContext.destination);
            
            // 更新UI
            demoButton.innerHTML = '<i class="bi bi-stop-fill"></i> 停止示例';
            isPlayingDemo = true;
            
            // 开始绘制声波
            drawWaveform();
            
        } catch (error) {
            console.error('播放示例音频失败:', error);
            alert('无法播放示例音频，请确保文件路径正确。');
            
            // 重置UI
            demoButton.innerHTML = '<i class="bi bi-file-music-fill"></i> 播放示例';
            recordButton.disabled = false;
            isPlayingDemo = false;
        }
    }
    
    // 开始录音
    async function startRecording() {
        try {
            // 如果正在播放示例，则停止
            if (isPlayingDemo) {
                demoAudio.pause();
                demoAudio.currentTime = 0;
                if (demoSource) {
                    demoSource.disconnect();
                }
                demoButton.innerHTML = '<i class="bi bi-file-music-fill"></i> 播放示例';
                isPlayingDemo = false;
            }
            
            // 初始化音频上下文
            initAudio();
            
            // 获取麦克风权限
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // 连接音频节点
            audioSource = audioContext.createMediaStreamSource(audioStream);
            audioSource.connect(analyser);
            
            // 创建MediaRecorder
            mediaRecorder = new MediaRecorder(audioStream);
            const audioChunks = [];
            
            // 收集录音数据
            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });
            
            // 录音完成后处理
            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // 添加到录音列表
                addRecordingToList(audioUrl);
                
                // 重置UI
                recordButton.disabled = false;
                stopButton.disabled = true;
                demoButton.disabled = false;
            });
            
            // 开始录音
            mediaRecorder.start();
            
            // 更新UI
            recordButton.disabled = true;
            stopButton.disabled = false;
            demoButton.disabled = true;
            
            // 开始绘制声波
            drawWaveform();
            
        } catch (error) {
            console.error('录音失败:', error);
            alert('无法访问麦克风，请确保已授予权限。');
            
            // 重置UI
            recordButton.disabled = false;
            stopButton.disabled = true;
            demoButton.disabled = false;
        }
    }
    
    // 停止录音
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
        }
        
        stopAnimation();
    }
    
    // 添加录音到列表
    function addRecordingToList(audioUrl) {
        const recordingId = Date.now();
        recordings.push({
            id: recordingId,
            url: audioUrl
        });
        
        const listItem = document.createElement('div');
        listItem.className = 'list-group-item recording-item';
        listItem.dataset.id = recordingId;
        
        const recordingDate = new Date().toLocaleString();
        
        listItem.innerHTML = `
            <div>
                <h5 class="mb-1">录音 ${recordings.length}</h5>
                <small class="text-muted">${recordingDate}</small>
            </div>
            <div class="recording-controls">
                <button class="btn btn-sm btn-primary play-button">
                    <i class="bi bi-play-fill"></i> 播放
                </button>
                <button class="btn btn-sm btn-danger delete-button">
                    <i class="bi bi-trash-fill"></i> 删除
                </button>
                <a href="${audioUrl}" download="recording-${recordingId}.wav" class="btn btn-sm btn-success">
                    <i class="bi bi-download"></i> 下载
                </a>
            </div>
        `;
        
        recordingsList.appendChild(listItem);
        
        // 添加播放功能
        const playButton = listItem.querySelector('.play-button');
        const audio = new Audio(audioUrl);
        
        playButton.addEventListener('click', function() {
            if (audio.paused) {
                audio.play();
                playButton.innerHTML = '<i class="bi bi-pause-fill"></i> 暂停';
            } else {
                audio.pause();
                playButton.innerHTML = '<i class="bi bi-play-fill"></i> 播放';
            }
        });
        
        // 播放结束时重置按钮
        audio.addEventListener('ended', function() {
            playButton.innerHTML = '<i class="bi bi-play-fill"></i> 播放';
        });
        
        // 添加删除功能
        const deleteButton = listItem.querySelector('.delete-button');
        deleteButton.addEventListener('click', function() {
            // 从DOM中移除
            listItem.remove();
            
            // 从数组中移除
            recordings = recordings.filter(rec => rec.id !== recordingId);
            
            // 释放URL
            URL.revokeObjectURL(audioUrl);
        });
    }
    
    // 事件监听
    recordButton.addEventListener('click', startRecording);
    stopButton.addEventListener('click', stopRecording);
    demoButton.addEventListener('click', playDemoAudio);
}); 