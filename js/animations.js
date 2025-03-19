// 创建一个奖励动画函数
function showRewardAnimation() {
    // 创建奖励元素
    const reward = document.createElement('div');
    reward.className = 'reward-animation';
    reward.innerHTML = '<i class="bi bi-star-fill"></i>';
    document.body.appendChild(reward);
    
    // 使用 GSAP 创建动画
    gsap.fromTo(reward, 
        { scale: 0, opacity: 0, y: 100 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
    );
    
    gsap.to(reward, {
        scale: 1.5, 
        opacity: 0, 
        y: -100, 
        duration: 0.8, 
        delay: 1.5,
        ease: "power2.in",
        onComplete: () => reward.remove()
    });
}

// 创建场景切换动画
function sceneTransitionAnimation() {
    anime({
        targets: '.scene-selector',
        opacity: [0, 1],
        translateY: [50, 0],
        easing: 'easeOutExpo',
        duration: 1000,
        delay: anime.stagger(100)
    });
    
    anime({
        targets: '.scene-option-card',
        scale: [0.8, 1],
        opacity: [0, 1],
        delay: anime.stagger(200),
        easing: 'spring(1, 80, 10, 0)'
    });
}

// 加载成功动画
function showSuccessAnimation() {
    const container = document.createElement('div');
    container.className = 'success-animation';
    document.body.appendChild(container);
    
    const animation = lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: false,
        autoplay: true,
        path: 'assets/animations/success.json' // Lottie JSON 文件路径
    });
    
    animation.addEventListener('complete', () => {
        setTimeout(() => {
            container.remove();
        }, 500);
    });
}

// 创建星星雨效果
function createStarRain() {
    // 创建 30 个星星
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = '-20px';
            document.body.appendChild(star);
            
            // 使用 GSAP 创建下落动画
            gsap.to(star, {
                y: `${window.innerHeight + 50}px`,
                x: `+=${(Math.random() - 0.5) * 200}`,
                rotation: Math.random() * 360,
                duration: 1.5 + Math.random() * 3,
                ease: "power1.in",
                onComplete: () => star.remove()
            });
        }, i * 100);
    }
}

// 在完成对话或达成目标时调用
function showCongratulations() {
    // 显示大星星
    showRewardAnimation();
    
    // 创建星星雨
    createStarRain();
    
    // 播放音效
    const audio = new Audio('assets/audio/success.mp3');
    audio.play();
} 