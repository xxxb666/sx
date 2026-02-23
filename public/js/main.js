document.addEventListener('DOMContentLoaded', function() {
    console.log('%c 当前版本: v1.0.8 (修复视频播放器按钮重叠问题) ', 'background: #ff6b9d; color: #fff; padding: 4px; border-radius: 4px;');
    
    const pages = document.querySelectorAll('.page');
    const navBtns = document.querySelectorAll('.nav-btn');
    const backBtns = document.querySelectorAll('.back-btn');
    const cards = document.querySelectorAll('.card');
    const detailContent = document.getElementById('detail-content');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoElement = videoPlayer.querySelector('video');
    const closeVideoBtn = document.getElementById('closeVideo');
    const uploadVideoBtn = document.getElementById('uploadVideoBtn');
    const imageModal = document.getElementById('imageModal');
    const modalImage = imageModal.querySelector('img');
    const closeModalBtn = document.getElementById('closeModal');
    const prevImageBtn = document.getElementById('prevImage');
    const nextImageBtn = document.getElementById('nextImage');
    const deleteImageBtn = document.getElementById('deleteImageBtn');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    
    // PDF/PPT 查看器
    const pdfModal = document.getElementById('pdfModal');
    const pdfFrame = document.getElementById('pdfFrame');
    const closePdfBtn = document.getElementById('closePdf');
    
    // 视频播放器导航状态
    let currentVideoList = [];
    let currentVideoIndex = -1;
    let currentVideoCategory = '';

    // 图片查看器导航状态
    let currentImageList = [];
    let currentImageIndex = -1;
    let currentImageCategory = '';

    // 强制限制所有媒体元素尺寸的轮询函数
    function enforceMediaSize() {
        const mediaElements = document.querySelectorAll('img, video');
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        mediaElements.forEach(el => {
            // 跳过已经设置了严格限制的元素（避免重复操作）
            if (el.dataset.sizeChecked === 'true') return;

            // 检查是否溢出屏幕
            const rect = el.getBoundingClientRect();
            
            // 跳过 .ai-thumbnail 中的图片，因为它们由 CSS grid 和 aspect-ratio 控制
            if (el.closest('.ai-thumbnail')) return;

            if (rect.width > screenWidth) {
                el.style.maxWidth = '100%';
                el.style.height = 'auto';
                el.style.objectFit = 'contain';
                console.log('强制调整过大元素:', el);
            }
            
            // 特别针对视频播放器和模态框
            if (el.closest('.video-player-container') || el.closest('.image-modal')) {
                el.style.maxWidth = '100%';
                el.style.maxHeight = '60vh'; // 稍微放松一点，但在 style.css 中有更严格的限制
                el.style.objectFit = 'contain';
            }

            // 特别针对后台管理和作品列表的缩略图
            if (el.closest('.admin-work-thumbnail') || el.closest('.work-thumbnail')) {
                // 如果是 AI 作品（横向），则跳过强制正方形限制
                if (el.closest('.landscape') || el.closest('.ai-thumbnail')) return;
                
                el.style.setProperty('width', '80px', 'important');
                el.style.setProperty('height', '80px', 'important');
                el.style.setProperty('max-width', '80px', 'important');
                el.style.setProperty('max-height', '80px', 'important');
                el.style.objectFit = 'cover';
            }
        });
    }

    // 启动轮询，每1秒检查一次 (加快频率)
    setInterval(enforceMediaSize, 1000);

    // 监听窗口大小变化
    window.addEventListener('resize', enforceMediaSize);

    // 视频播放器按钮
    const prevVideoBtn = document.getElementById('prevVideo');
    const nextVideoBtn = document.getElementById('nextVideo');
    const deleteVideoBtn = document.getElementById('deleteVideoBtn');

    // 绑定关闭按钮事件
    if (closeVideoBtn) {
        closeVideoBtn.addEventListener('click', function() {
            videoPlayer.style.display = 'none';
            videoElement.pause();
            videoElement.src = '';
            currentVideoIndex = -1; // 重置索引
        });
    }

    // 视频导航按钮事件
    if (prevVideoBtn) {
        prevVideoBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (currentVideoList.length === 0) return;
            
            let prevIndex = currentVideoIndex - 1;
            if (prevIndex < 0) {
                prevIndex = currentVideoList.length - 1; // 循环到最后一个
            }
            playVideoAtIndex(prevIndex);
        });
    }

    if (nextVideoBtn) {
        nextVideoBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (currentVideoList.length === 0) return;

            let nextIndex = currentVideoIndex + 1;
            if (nextIndex >= currentVideoList.length) {
                nextIndex = 0; // 循环到第一个
            }
            playVideoAtIndex(nextIndex);
        });
    }

    // 视频删除按钮事件
    if (deleteVideoBtn) {
        deleteVideoBtn.addEventListener('click', async function(e) {
            e.stopPropagation();
            if (currentVideoIndex === -1 || !currentVideoCategory) return;
            
            const currentVideo = currentVideoList[currentVideoIndex];
            if (!currentVideo) return;

            if (confirm('确定要删除这个作品吗？此操作不可恢复！')) {
                try {
                    await API.deleteWork(currentVideoCategory, currentVideo.work_id);
                    alert('作品已删除');
                    
                    // 从列表中移除
                    currentVideoList.splice(currentVideoIndex, 1);
                    
                    // 如果列表为空，关闭播放器
                    if (currentVideoList.length === 0) {
                        videoPlayer.style.display = 'none';
                        videoElement.pause();
                        videoElement.src = '';
                    } else {
                        // 如果不为空，播放下一个或上一个
                        // 如果删除的是最后一个，播放新的最后一个（原倒数第二个）
                        if (currentVideoIndex >= currentVideoList.length) {
                            currentVideoIndex = currentVideoList.length - 1;
                        }
                        // 播放新的当前索引
                        playVideoAtIndex(currentVideoIndex);
                    }

                    // 重新加载页面列表
                    if (currentVideoCategory === 'ai') {
                        loadAIPage();
                    } else if (currentVideoCategory === 'dance') {
                        loadDancePage();
                    }
                } catch (error) {
                    alert('删除失败: ' + error.message);
                }
            }
        });
    }

    // 视频上传按钮事件 (继续上传)
    if (uploadVideoBtn) {
        uploadVideoBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            // 暂停播放
            if (videoElement) {
                videoElement.pause();
            }
            
            // 打开上传窗口，使用当前分类
            // 如果 currentVideoCategory 为空，默认为 'ai'
            const category = currentVideoCategory || 'ai';
            if (window.openQuickUpload) {
                window.openQuickUpload(category, 'video/*');
            } else {
                console.error('Quick upload function not found');
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            imageModal.style.display = 'none';
            modalImage.src = '';
        });
    }

    if (closePdfBtn) {
        closePdfBtn.addEventListener('click', function() {
            pdfModal.style.display = 'none';
            pdfFrame.src = '';
        });
    }

    // 点击背景关闭弹窗
    if (videoPlayer) {
        videoPlayer.addEventListener('click', function(e) {
            if (e.target === videoPlayer) {
                videoPlayer.style.display = 'none';
                videoElement.pause();
                videoElement.src = '';
            }
        });
    }

    if (imageModal) {
        imageModal.addEventListener('click', function(e) {
            if (e.target === imageModal) {
                imageModal.style.display = 'none';
                modalImage.src = '';
            }
        });
    }

    if (pdfModal) {
        pdfModal.addEventListener('click', function(e) {
            if (e.target === pdfModal) {
                pdfModal.style.display = 'none';
                pdfFrame.src = '';
            }
        });
    }

    // 封面页鼠标拖尾效果
    const coverPage = document.getElementById('page0');
    const trailCanvas = document.getElementById('trail-canvas');
    
    if (coverPage && trailCanvas) {
        const ctx = trailCanvas.getContext('2d');
        let particles = [];
        let animationId;
        
        // 设置canvas尺寸
        function resizeCanvas() {
            trailCanvas.width = window.innerWidth;
            trailCanvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // 粒子类
        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = Math.random() * 8 + 4;
                this.speedX = Math.random() * 2 - 1;
                this.speedY = Math.random() * 2 - 1;
                this.life = 1;
                this.decay = Math.random() * 0.02 + 0.01;
                // 白色系颜色
                const colors = ['#ffffff', '#fff0f5', '#ffe4e1', '#fff5ee', '#ffffff'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }
            
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.life -= this.decay;
                this.size *= 0.98;
            }
            
            draw() {
                ctx.save();
                ctx.globalAlpha = this.life;
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        
        // 鼠标移动事件
        let lastX = 0;
        let lastY = 0;
        let isMoving = false;
        
        coverPage.addEventListener('mousemove', function(e) {
            const rect = coverPage.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 计算鼠标移动距离
            const distance = Math.sqrt(Math.pow(x - lastX, 2) + Math.pow(y - lastY, 2));
            
            // 只有移动距离超过一定阈值才创建粒子
            if (distance > 5) {
                // 创建多个粒子形成拖尾效果
                for (let i = 0; i < 3; i++) {
                    const offsetX = (Math.random() - 0.5) * 20;
                    const offsetY = (Math.random() - 0.5) * 20;
                    particles.push(new Particle(x + offsetX, y + offsetY));
                }
                lastX = x;
                lastY = y;
            }
        });
        
        // 触摸事件支持
        coverPage.addEventListener('touchmove', function(e) {
            e.preventDefault();
            const rect = coverPage.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            for (let i = 0; i < 3; i++) {
                const offsetX = (Math.random() - 0.5) * 20;
                const offsetY = (Math.random() - 0.5) * 20;
                particles.push(new Particle(x + offsetX, y + offsetY));
            }
        });
        
        // 动画循环
        function animate() {
            ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
            
            // 更新和绘制粒子
            for (let i = particles.length - 1; i >= 0; i--) {
                const particle = particles[i];
                particle.update();
                particle.draw();
                
                // 移除死亡的粒子
                if (particle.life <= 0 || particle.size <= 0.5) {
                    particles.splice(i, 1);
                }
            }
            
            animationId = requestAnimationFrame(animate);
        }
        
        // 只在封面页显示时运行动画
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (coverPage.classList.contains('active')) {
                        animate();
                    } else {
                        cancelAnimationFrame(animationId);
                        ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
                        particles = [];
                    }
                }
            });
        });
        
        observer.observe(coverPage, { attributes: true });
        
        // 初始启动动画
        if (coverPage.classList.contains('active')) {
            animate();
        }
    }

    // 通用函数：跳转到上传页面并切换到指定类别
    window.goToUploadPage = function(category, acceptType) {
        window.switchPage('page4');
        // 切换到对应标签
        setTimeout(() => {
            // 直接调用switchUploadTab，传入true表示重置表单并应用acceptType
            if (typeof window.switchUploadTab === 'function') {
                window.switchUploadTab(category, true, acceptType);
            }
        }, 600);
    };

    // 我的介绍页面权限控制 - 只有管理员才能编辑
    function initAboutPagePermissions() {
        const isAdminUser = window.isAdmin ? window.isAdmin() : false;
        
        // 获取所有可编辑元素
        const editableElements = document.querySelectorAll('#page2 [contenteditable="true"]');
        const changeAvatarBtn = document.getElementById('changeAvatarBtn');
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        
        if (!isAdminUser) {
            // 非管理员：禁用编辑
            editableElements.forEach(el => {
                el.contentEditable = 'false';
                el.style.cursor = 'default';
                // 移除强制样式，保持CSS定义的排版样式
                el.style.border = '';
                el.style.backgroundColor = '';
                el.style.outline = 'none';
                el.classList.remove('admin-editable');
            });
            
            // 隐藏按钮
            if (changeAvatarBtn) changeAvatarBtn.style.display = 'none';
            if (saveProfileBtn) saveProfileBtn.style.display = 'none';
        } else {
            // 管理员：启用编辑
            editableElements.forEach(el => {
                el.contentEditable = 'true';
                el.classList.add('admin-editable');
                // 移除内联样式，使用CSS类控制
                el.style.cursor = '';
                el.style.border = '';
                el.style.backgroundColor = '';
            });
            
            // 显示按钮
            if (changeAvatarBtn) changeAvatarBtn.style.display = 'block';
            if (saveProfileBtn) saveProfileBtn.style.display = 'block';
        }
    }

    // 页面切换函数
    window.switchPage = function(targetPageId) {
        const currentPage = document.querySelector('.page.active');
        const targetPage = document.getElementById(targetPageId);

        if (currentPage && currentPage !== targetPage) {
            currentPage.classList.add('transition-out');
            currentPage.classList.remove('active');

            setTimeout(() => {
                currentPage.classList.remove('transition-out');
                targetPage.classList.add('active');
                // 页面切换后滚动到顶部
                window.scrollTo(0, 0);
                targetPage.scrollTop = 0;
            }, 500);
        } else if (targetPage) {
            targetPage.classList.add('active');
            // 页面切换后滚动到顶部
            window.scrollTo(0, 0);
            targetPage.scrollTop = 0;
        }
        
        // 触发页面切换事件
        if (typeof loadWorksList === 'function' && targetPageId === 'page4') {
            loadWorksList();
        }
        
        // 如果切换到我的介绍页面，检查权限
        if (targetPageId === 'page2') {
            setTimeout(initAboutPagePermissions, 100);
        }
    };

    // 导航按钮点击事件
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            if (target) {
                window.switchPage(target);
            }
        });
    });
    
    // 我的介绍按钮点击事件
    const introBtn = document.getElementById('introBtn');
    if (introBtn) {
        introBtn.addEventListener('click', function() {
            window.switchPage('page2');
        });
    }

    // 返回按钮点击事件
    backBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            if (target) {
                window.switchPage(target);
            }
        });
    });

    // 卡片点击事件
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const pageType = this.getAttribute('data-page');
            
            // 如果是"我的介绍"，跳转到page2 (兼容旧逻辑，虽然卡片已移除)
            if (pageType === 'intro') {
                window.switchPage('page2');
                return;
            }

            loadDetailPage(pageType);
            window.switchPage('page3');
        });
    });

    // 加载详情页
    function loadDetailPage(pageType) {
        detailContent.innerHTML = '';

        switch(pageType) {
            case 'painting':
                loadPaintingPage();
                break;
            case 'dance':
                loadDancePage();
                break;
            case 'ai':
                loadAIPage();
                break;
            case 'honor':
                loadHonorPage();
                break;
            case 'ppt':
                loadPPTPage();
                break;
        }
    }

        // 辅助函数：通用排序（视频在前，图片在后；竖屏在前，横屏在后）
    function sortWorks(works) {
        if (!works || works.length === 0) return [];
        
        return works.sort((a, b) => {
            // 1. 类型排序：视频在前
            // 兼容性处理：如果没有 file_type，尝试通过 file_path 判断，或者根据上下文（但这里是通用函数）
            // 假设 dance 页面的作品即使没有 file_type 也是视频，但在混合页面（AI）必须有 file_type
            // 这里主要针对 AI 页面和未来的混合页面
            let isVideoA = (a.file_type && a.file_type.startsWith('video')) || (a.file_path && a.file_path.match(/\.(mp4|webm|mov)$/i));
            let isVideoB = (b.file_type && b.file_type.startsWith('video')) || (b.file_path && b.file_path.match(/\.(mp4|webm|mov)$/i));
            
            // 如果是在 Dance 页面，可能没有 file_type，但我们知道它是视频。
            // 不过这个函数是通用的。如果两个都判断不出是视频，就视为同类，进入下一轮排序。
            
            if (isVideoA && !isVideoB) return -1;
            if (!isVideoA && isVideoB) return 1;
            
            // 2. 方向排序：竖屏在前
            const isPortraitA = a.orientation === 'portrait';
            const isPortraitB = b.orientation === 'portrait';
            
            if (isPortraitA && !isPortraitB) return -1;
            if (!isPortraitA && isPortraitB) return 1;
            
            return 0;
        });
    }

    // 绘画作品页 - 从后端API加载
    async function loadPaintingPage() {
        const isAdminUser = window.isAdmin ? window.isAdmin() : false;
        
        try {
            // 显示加载中
            detailContent.innerHTML = `
                <div class="painting-page">
                    <div class="empty-state">
                        <p>加载中...</p>
                    </div>
                </div>
            `;
            
            // 从后端API获取绘画作品
            const result = await API.getWorks('painting');
            let paintingData = result.works || [];

            // 按方向排序（虽然绘画通常是图片，但也可能有竖屏优先的需求）
            paintingData = sortWorks(paintingData);

            // 更新当前图片列表状态
            currentImageList = paintingData;
            currentImageCategory = 'painting';

            if (paintingData.length === 0) {
                detailContent.innerHTML = `
                    <div class="painting-page">
                        <div class="empty-state">
                            <p>暂无绘画作品</p>
                            ${isAdminUser ? '<button class="go-upload-btn" onclick="window.openQuickUpload(\'painting\', \'image/*\')">去上传作品</button>' : ''}
                        </div>
                    </div>
                `;
                return;
            }

            // 构建作品卡片HTML
            const generateCardsHtml = (works) => {
                return works.map((painting, index) => {
                    // 优先使用 fileUrl，如果没有则回退到拼接路径
                    const imgSrc = painting.fileUrl || ('/uploads/painting/' + painting.file_path);
                    return `
                    <div class="ai-card" data-id="${painting.work_id}" data-type="image" data-content="${imgSrc}">
                        <div class="ai-thumbnail">
                            <img src="${imgSrc}" style="width:100%; height:100%; object-fit:contain;" alt="${painting.title}">
                        </div>
                        <div class="ai-info">
                            <h3>${painting.title}</h3>
                            <p>${painting.description || ''}</p>
                        </div>
                        ${isAdminUser ? `
                        <button class="work-delete-btn" data-id="${painting.work_id}" data-category="painting" style="position:absolute; top:10px; right:10px; width:30px; height:30px; border-radius:50%; background:rgba(255,255,255,0.9); border:none; color:#ff4757; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 5px rgba(0,0,0,0.1); z-index:10;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                        </button>
                        ` : ''}
                    </div>
                `}).join('');
            };

            const addBtnHtml = isAdminUser ? `
                <div class="ai-card add-work-card" onclick="window.openQuickUpload('painting', 'image/*')" style="border: 2px dashed #ffb7c5; background: #fff0f5; display: flex; align-items: center; justify-content: center; min-height: 250px;">
                    <div style="text-align: center;">
                        <div style="font-size: 40px; color: #ff6b9d; line-height: 1;">+</div>
                        <div style="color: #ff6b9d; font-weight: bold; margin-top: 10px;">上传新作品</div>
                    </div>
                </div>
            ` : '';

            let html = '';
            
            // 如果作品数量大于等于3，启用跑马灯效果
            if (paintingData.length >= 3) {
                const cardsHtml = generateCardsHtml(paintingData);
                // 组合内容：作品 + 添加按钮（如果是管理员）
                const fullContent = cardsHtml + addBtnHtml;
                
                html = `
                <div class="painting-page">
                    <div class="marquee-container">
                        <div class="marquee-track">
                            ${fullContent}
                            ${fullContent} <!-- 重复一份以实现无缝滚动 -->
                        </div>
                    </div>
                </div>
                `;
            } else {
                // 否则使用普通网格布局
                html = `
                <div class="painting-page">
                    <div class="ai-grid">
                        ${generateCardsHtml(paintingData)}
                        ${addBtnHtml}
                    </div>
                </div>
                `;
            }

            detailContent.innerHTML = html;
            // 使用AI卡片的初始化函数，因为结构相同
            initAICards();

            // 绑定删除按钮事件（仅管理员）
            if (isAdminUser) {
                document.querySelectorAll('.work-delete-btn').forEach(btn => {
                    btn.addEventListener('click', async function(e) {
                        e.stopPropagation();
                        const workId = this.getAttribute('data-id');
                        const category = this.getAttribute('data-category');
                        if (confirm('确定要删除这个作品吗？此操作不可恢复！')) {
                            try {
                                await API.deleteWork(category, workId);
                                loadPaintingPage();
                                alert('作品已删除');
                            } catch (error) {
                                alert('删除失败: ' + error.message);
                            }
                        }
                    });
                });
            }
        } catch (error) {
            console.error('加载绘画作品失败:', error);
            detailContent.innerHTML = `
                <div class="painting-page">
                    <div class="empty-state">
                        <p>加载失败，请刷新页面重试</p>
                        ${isAdminUser ? '<button class="go-upload-btn" onclick="window.openQuickUpload(\'painting\', \'image/*\')">去上传作品</button>' : ''}
                    </div>
                </div>
            `;
        }
    }
    window.loadPaintingPage = loadPaintingPage;



    // 舞蹈视频页 - 从后端API加载
    async function loadDancePage() {
        const isAdminUser = window.isAdmin ? window.isAdmin() : false;
        
        try {
            // 显示加载中
            detailContent.innerHTML = `
                <div class="dance-page">
                    <div class="empty-state">
                        <p>加载中...</p>
                    </div>
                </div>
            `;
            
            // 从后端API获取舞蹈视频
            const result = await API.getWorks('dance');
            let danceData = result.works || [];
            
            // 按方向排序
            danceData = sortWorks(danceData);
            
            // 更新当前视频列表状态
            currentVideoList = danceData;
            currentVideoCategory = 'dance';

            if (danceData.length === 0) {
                detailContent.innerHTML = `
                    <div class="dance-page">
                        <div class="empty-state">
                            <p>暂无舞蹈视频</p>
                            ${isAdminUser ? '<button class="go-upload-btn" onclick="window.openQuickUpload(\'dance\', \'video/*\')">去上传作品</button>' : ''}
                        </div>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="dance-page">
                    <div class="video-grid">
                        ${danceData.map(video => {
                            // 优先使用 fileUrl，如果没有则回退到拼接路径
                            const videoSrc = video.fileUrl || ('/uploads/dance/' + video.file_path);
                            // 优先使用 coverUrl，如果没有则尝试拼接封面路径(兼容旧数据)
                            // 注意：旧数据可能没有封面，这里给个默认值或者留空让CSS处理
                            const coverSrc = video.coverUrl || (video.cover_path ? ('/uploads/dance/covers/' + video.cover_path) : '');
                            
                            return `
                            <div class="video-card" data-id="${video.work_id}" data-video="${videoSrc}">
                                <div class="video-thumbnail">
                                    ${coverSrc ? `<img src="${coverSrc}" style="width:100%; height:100%; object-fit:contain;" alt="${video.title}">` : `<video muted preload="metadata" style="width:100%; height:100%; object-fit:contain;"><source src="${videoSrc}" type="video/mp4"></video>`}
                                    <div class="play-icon">▶</div>
                                </div>
                                <div class="video-info">
                                    <h3>${video.title}</h3>
                                    ${video.description && video.description.trim() ? `<p>${video.description}</p>` : ''}
                                </div>
                            </div>
                        `}).join('')}
                        ${isAdminUser ? `
                        <div class="video-card add-work-card" onclick="window.openQuickUpload('dance', 'video/*')" style="border: 2px dashed #ffb7c5; background: #fff0f5; display: flex; align-items: center; justify-content: center; min-height: 250px;">
                            <div style="text-align: center;">
                                <div style="font-size: 40px; color: #ff6b9d; line-height: 1;">+</div>
                                <div style="color: #ff6b9d; font-weight: bold; margin-top: 10px;">上传新作品</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;

            detailContent.innerHTML = html;
            initVideoCards();

            // 绑定删除按钮事件（仅管理员）
            if (isAdminUser) {
                document.querySelectorAll('.video-delete-btn').forEach(btn => {
                    btn.addEventListener('click', async function(e) {
                        e.stopPropagation();
                        const workId = this.getAttribute('data-id');
                        const category = this.getAttribute('data-category');
                        if (confirm('确定要删除这个作品吗？此操作不可恢复！')) {
                            try {
                                await API.deleteWork(category, workId);
                                loadDancePage();
                                alert('作品已删除');
                            } catch (error) {
                                alert('删除失败: ' + error.message);
                            }
                        }
                    });
                });
            }
        } catch (error) {
            console.error('加载舞蹈视频失败:', error);
            detailContent.innerHTML = `
                <div class="dance-page">
                    <div class="empty-state">
                        <p>加载失败，请刷新页面重试</p>
                        ${isAdminUser ? '<button class="go-upload-btn" onclick="window.openQuickUpload(\'dance\', \'video/*\')">去上传作品</button>' : ''}
                    </div>
                </div>
            `;
        }
    }
    window.loadDancePage = loadDancePage;

    function initVideoCards() {
        const videoCards = document.querySelectorAll('.video-card');

        videoCards.forEach(card => {
            card.addEventListener('click', function() {
                const videoSrc = this.getAttribute('data-video');
                const id = this.getAttribute('data-id');
                
                // 查找索引
                if (id && currentVideoList.length > 0) {
                    const index = currentVideoList.findIndex(v => v.work_id == id);
                    if (index !== -1) {
                        currentVideoIndex = index;
                        playVideoAtIndex(index);
                        return;
                    }
                }
                
                // 如果没找到索引，回退到仅播放
                currentVideoIndex = -1;
                showVideoPlayer(videoSrc);
            });
        });
    }

    function playVideoAtIndex(index) {
        if (index < 0 || index >= currentVideoList.length) return;
        
        currentVideoIndex = index;
        const video = currentVideoList[index];
        const videoSrc = video.fileUrl || ('/uploads/' + currentVideoCategory + '/' + video.file_path);
        
        showVideoPlayer(videoSrc);
    }

    function updateVideoNavButtons() {
        if (!prevVideoBtn || !nextVideoBtn) return;

        if (currentVideoIndex === -1) {
            prevVideoBtn.style.display = 'none';
            nextVideoBtn.style.display = 'none';
            if (deleteVideoBtn) deleteVideoBtn.style.display = 'none';
            return;
        }

        // 显示按钮
        prevVideoBtn.style.display = 'flex';
        nextVideoBtn.style.display = 'flex';

        // 更新状态
        prevVideoBtn.disabled = false; // 循环播放，永远可以点上一首（如果是第一个，点上一首去最后一个）
        nextVideoBtn.disabled = false; // 循环播放，永远可以点下一首
        
        // 删除按钮仅管理员可见
        if (deleteVideoBtn) {
            const isAdminUser = window.isAdmin ? window.isAdmin() : false;
            if (isAdminUser) {
                deleteVideoBtn.style.display = 'block';
                deleteVideoBtn.setAttribute('data-id', currentVideoList[currentVideoIndex].work_id);
            } else {
                deleteVideoBtn.style.display = 'none';
            }
        }

        // 上传按钮仅管理员可见
        if (uploadVideoBtn) {
            const isAdminUser = window.isAdmin ? window.isAdmin() : false;
            uploadVideoBtn.style.display = isAdminUser ? 'flex' : 'none';
        }
    }

    function showVideoPlayer(videoSrc) {
        videoElement.src = videoSrc;
        videoPlayer.style.display = 'flex';
        // 确保显示控制条
        videoElement.controls = true;
        // 确保有声音
        videoElement.muted = false;
        videoElement.volume = 1.0;
        
        // 强制设置最大尺寸，防止溢出屏幕
        videoElement.style.maxWidth = '100%';
        videoElement.style.maxHeight = '50vh';
        videoElement.style.objectFit = 'contain';

        // 检查管理员权限显示删除按钮
        const isAdminUser = window.isAdmin ? window.isAdmin() : false;
        if (deleteVideoBtn) {
            deleteVideoBtn.style.display = isAdminUser ? 'flex' : 'none';
        }
        if (uploadVideoBtn) {
            uploadVideoBtn.style.display = isAdminUser ? 'flex' : 'none';
        }
        
        // 更新导航按钮状态
        updateVideoNavButtons();

        // 自动播放
        const playPromise = videoElement.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.log('自动播放失败:', e);
                // 如果自动播放失败（可能是浏览器限制），显示播放按钮或提示用户
                // 此时用户可以点击控制条上的播放按钮
            });
        }
    }

    // 监听视频播放结束事件，实现循环播放
    if (videoElement) {
        videoElement.addEventListener('ended', function() {
            // 仅当当前有播放列表且在列表中时才自动切换
            if (currentVideoIndex !== -1 && currentVideoList.length > 0) {
                let nextIndex = currentVideoIndex + 1;
                // 如果已经是最后一个，则回到第一个（循环播放）
                if (nextIndex >= currentVideoList.length) {
                    nextIndex = 0;
                }
                playVideoAtIndex(nextIndex);
            }
        });
    }

    window.showVideoPlayer = showVideoPlayer;

    // 图片导航
    if (prevImageBtn) {
        prevImageBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (currentImageList.length === 0) return;
            
            let prevIndex = currentImageIndex - 1;
            if (prevIndex < 0) {
                prevIndex = currentImageList.length - 1; // 循环到最后一个
            }
            showImageAtIndex(prevIndex);
        });
    }

    if (nextImageBtn) {
        nextImageBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (currentImageList.length === 0) return;

            let nextIndex = currentImageIndex + 1;
            if (nextIndex >= currentImageList.length) {
                nextIndex = 0; // 循环到第一个
            }
            showImageAtIndex(nextIndex);
        });
    }

    // 图片删除按钮事件
    if (deleteImageBtn) {
        deleteImageBtn.addEventListener('click', async function(e) {
            e.stopPropagation();
            if (currentImageIndex === -1 || !currentImageCategory) return;
            
            const currentImage = currentImageList[currentImageIndex];
            if (!currentImage) return;

            if (confirm('确定要删除这个作品吗？此操作不可恢复！')) {
                try {
                    await API.deleteWork(currentImageCategory, currentImage.work_id);
                    alert('作品已删除');
                    
                    // 从列表中移除
                    currentImageList.splice(currentImageIndex, 1);
                    
                    // 如果列表为空，关闭查看器
                    if (currentImageList.length === 0) {
                        imageModal.style.display = 'none';
                        modalImage.src = '';
                    } else {
                        // 如果不为空，显示下一个或上一个
                        if (currentImageIndex >= currentImageList.length) {
                            currentImageIndex = currentImageList.length - 1;
                        }
                        // 显示新的当前索引
                        showImageAtIndex(currentImageIndex);
                    }

                    // 重新加载页面列表
                    if (currentImageCategory === 'ai') {
                        loadAIPage();
                    } else if (currentImageCategory === 'painting') {
                        loadPaintingPage();
                    } else if (currentImageCategory === 'honor') {
                        loadHonorPage();
                    }
                } catch (error) {
                    alert('删除失败: ' + error.message);
                }
            }
        });
    }

    // 图片上传按钮事件 (继续上传)
    if (uploadImageBtn) {
        uploadImageBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // 打开上传窗口，使用当前分类
            const category = currentImageCategory || 'ai';
            if (window.openQuickUpload) {
                window.openQuickUpload(category, 'image/*');
            } else {
                console.error('Quick upload function not found');
            }
        });
    }

    function showImageAtIndex(index) {
        if (index < 0 || index >= currentImageList.length) return;
        
        currentImageIndex = index;
        const image = currentImageList[index];
        // 兼容不同数据结构
        const imageSrc = image.fileUrl || ('/uploads/' + currentImageCategory + '/' + image.file_path);
        
        showImageModal(imageSrc);
    }

    function showPdfViewer(pdfSrc) {
        pdfFrame.src = pdfSrc;
        pdfModal.style.display = 'flex';
    }
    window.showPdfViewer = showPdfViewer;

    // AI作品页 - 从本地存储加载
    // AI作品页 - 从后端API加载
    async function loadAIPage() {
        const isAdminUser = window.isAdmin ? window.isAdmin() : false;
        
        try {
            // 显示加载中
            detailContent.innerHTML = `
                <div class="ai-page">
                    <div class="empty-state">
                        <p>加载中...</p>
                    </div>
                </div>
            `;
            
            // 从后端API获取AI作品
            const result = await API.getWorks('ai');
            let aiData = result.works || [];
            
            // 按创建时间降序排序（最新发布的在最上面）
            aiData.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
            });
            
            // 分类：视频和图片
            const videos = aiData.filter(ai => {
                return (ai.file_type && ai.file_type.startsWith('video')) || (ai.file_path && ai.file_path.match(/\.(mp4|webm|mov)$/i));
            });
            
            const images = aiData.filter(ai => {
                const isVideo = (ai.file_type && ai.file_type.startsWith('video')) || (ai.file_path && ai.file_path.match(/\.(mp4|webm|mov)$/i));
                return !isVideo;
            });

            // 更新当前视频列表状态
            currentVideoList = videos;
            currentVideoCategory = 'ai';

            // 更新当前图片列表状态
            currentImageList = images;
            currentImageCategory = 'ai';

            let html = '<div class="ai-page ai-split-container">';
            
            // 辅助函数：渲染卡片
            const renderCard = (ai) => {
                // 优先使用 fileUrl，如果没有则回退到拼接路径
                const contentSrc = ai.fileUrl || ('/uploads/ai/' + ai.file_path);
                
                // 更健壮的类型判断
                let type = ai.file_type || '';
                if (!type && ai.file_path) {
                    if (ai.file_path.match(/\.(mp4|webm|mov)$/i)) type = 'video/mp4';
                    else if (ai.file_path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) type = 'image/jpeg';
                }
                
                const isVideo = type.startsWith('video');
                const isImage = type.startsWith('image');

                let mediaHtml = '';
                if (isImage) {
                    mediaHtml = `<img src="${contentSrc}" style="width:100%; height:100%; object-fit:contain;" alt="${ai.title}">`;
                } else if (isVideo) {
                    // 视频处理逻辑：如果有封面，显示封面，加载失败回退到视频
                    // 如果没有封面，直接显示视频
                    if (ai.coverUrl) {
                        mediaHtml = `
                            <img src="${ai.coverUrl}" 
                                 style="width:100%; height:100%; object-fit:contain; display:block;" 
                                 alt="${ai.title}"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                            <video src="${contentSrc}" 
                                   style="width:100%; height:100%; object-fit:contain; display:none;" 
                                   muted preload="metadata" onloadeddata="this.currentTime=0.1"></video>
                        `;
                    } else {
                        mediaHtml = `<video src="${contentSrc}" style="width:100%; height:100%; object-fit:contain;" muted preload="metadata" onloadeddata="this.currentTime=0.1"></video>`;
                    }
                } else {
                    mediaHtml = `<div class="ai-thumbnail-placeholder">📄</div>`;
                }

                return `
                    <div class="ai-card" data-id="${ai.work_id}" data-type="${type}" data-content="${contentSrc}" style="cursor: pointer;">
                        <div class="ai-thumbnail">
                            ${mediaHtml}
                            ${isVideo ? '<div class="play-icon">▶</div>' : ''}
                        </div>
                        <div class="ai-info">
                            <h3>${ai.title}</h3>
                            ${ai.description && ai.description.trim() ? `<p>${ai.description}</p>` : ''}
                        </div>
                    </div>
                `;
            };

            // 视频区域（左侧/上侧）
            html += '<div class="ai-sections-container">'; // 新增容器包裹

            html += '<div class="ai-split-section ai-videos-section">';
            html += '<div class="section-header">';
            html += '<h3 class="section-title">🎬 AI 视频</h3>';
            html += '</div>';
            
            if (videos.length > 0) {
                // 使用宽屏网格布局
                html += `
                    <div class="ai-grid ai-grid-landscape">
                        ${videos.map(renderCard).join('')}
                    </div>
                `;
            } else {
                 html += '<div class="empty-section-hint">暂无视频作品</div>';
            }

            // 始终显示上传按钮（如果管理员）
            if (isAdminUser) {
                html += `
                <div class="section-footer-action">
                    <button class="section-footer-add-btn" onclick="window.openQuickUpload('ai', 'video/*')">
                        <span>🎬</span> 上传视频
                    </button>
                </div>`;
            }

            html += '</div>';

            // 视频和图片区域之间的分割线（仅在非宽屏时显示，CSS控制）
            html += '<div class="section-divider hidden-on-desktop"></div>';

            // 图片区域（右侧/下侧）
            html += '<div class="ai-split-section ai-images-section">';
            html += '<div class="section-header">';
            html += '<h3 class="section-title">🖼️ AI 图片</h3>';
            html += '</div>';
            
            if (images.length > 0) {
                // 使用宽屏网格布局
                html += `
                    <div class="ai-grid ai-grid-landscape">
                        ${images.map(renderCard).join('')}
                    </div>
                `;
            } else {
                 html += '<div class="empty-section-hint">暂无图片作品</div>';
            }

            // 始终显示上传按钮（如果管理员）
            if (isAdminUser) {
                html += `
                <div class="section-footer-action">
                    <button class="section-footer-add-btn" onclick="window.openQuickUpload('ai', 'image/*')">
                        <span>🖼️</span> 上传图片
                    </button>
                </div>`;
            }

            html += '</div>';
            
            html += '</div>'; // 结束容器包裹
            
            html += `
                </div>
            `;

            detailContent.innerHTML = html;
            // initAICards(); // 已移除，改为全局事件委托
        } catch (error) {
            console.error('加载AI作品失败:', error);
            detailContent.innerHTML = `
                <div class="ai-page">
                    <div class="empty-state">
                        <p>加载失败，请刷新页面重试</p>
                        ${isAdminUser ? '<button class="go-upload-btn" onclick="window.openQuickUpload(\'ai\')">去上传作品</button>' : ''}
                    </div>
                </div>
            `;
        }
    }
    window.loadAIPage = loadAIPage;

    // 全局事件委托：处理 AI 卡片点击
    // 使用 body 上的事件委托，确保动态添加的元素也能响应点击
    document.body.addEventListener('click', function(e) {
        // 查找最近的 .ai-card 元素
        const card = e.target.closest('.ai-card');
        
        // 如果没有点击 .ai-card，直接返回
        if (!card) return;
        
        // 阻止默认行为和冒泡
        e.preventDefault();
        e.stopPropagation();

        const type = card.getAttribute('data-type');
        const content = card.getAttribute('data-content');
        const id = card.getAttribute('data-id');

        console.log('AI Card Clicked (Delegated):', { type, content, id });

        if (type && type.startsWith('image')) {
            // 尝试查找索引
            if (id && currentImageList.length > 0) {
                const index = currentImageList.findIndex(img => img.work_id == id);
                if (index !== -1) {
                    showImageAtIndex(index);
                    return;
                }
            }
            showImageModal(content);
        } else if (type && type.startsWith('video')) {
            // 查找索引
            if (id && currentVideoList.length > 0) {
                const index = currentVideoList.findIndex(v => v.work_id == id);
                if (index !== -1) {
                    currentVideoIndex = index;
                    playVideoAtIndex(index);
                    return;
                }
            }
            showVideoPlayer(content);
        } else if (type && (type.includes('pdf') || content.endsWith('.pdf'))) {
            showPdfViewer(content);
        } else {
            // 尝试作为图片打开，或者提示不支持
            if (content.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                showImageModal(content);
            } else if (content.match(/\.(mp4|webm|mov)$/i)) {
                // 尝试查找索引
                if (id && currentVideoList.length > 0) {
                    const index = currentVideoList.findIndex(v => v.work_id == id);
                    if (index !== -1) {
                        currentVideoIndex = index;
                        playVideoAtIndex(index);
                        return;
                    }
                }
                showVideoPlayer(content);
            } else {
                // 对于PPT等其他文件，新窗口打开
                window.open(content, '_blank');
            }
        }
    });

    // 保留空函数以防万一
    function initAICards() {}

    function showImageModal(imageSrc) {
        modalImage.src = imageSrc;
        imageModal.style.display = 'flex';
        modalImage.style.maxWidth = '100%';
        modalImage.style.maxHeight = '70vh';
        modalImage.style.objectFit = 'contain';

        // 更新导航按钮状态
        if (prevImageBtn && nextImageBtn) {
            if (currentImageList.length > 1) {
                prevImageBtn.style.display = 'flex';
                nextImageBtn.style.display = 'flex';
            } else {
                prevImageBtn.style.display = 'none';
                nextImageBtn.style.display = 'none';
            }
        }

        // 检查管理员权限显示删除和上传按钮
        const isAdminUser = window.isAdmin ? window.isAdmin() : false;
        
        if (deleteImageBtn) {
            if (isAdminUser && currentImageList.length > 0) {
                deleteImageBtn.style.display = 'flex';
            } else {
                deleteImageBtn.style.display = 'none';
            }
        }
        
        if (uploadImageBtn) {
            uploadImageBtn.style.display = isAdminUser ? 'flex' : 'none';
        }
    }
    window.showImageModal = showImageModal;

    // 荣誉墙页 - 从后端API加载
    async function loadHonorPage() {
        const isAdminUser = window.isAdmin ? window.isAdmin() : false;
        
        try {
            // 显示加载中
            detailContent.innerHTML = `
                <div class="honor-page">
                    <div class="empty-state">
                        <p>加载中...</p>
                    </div>
                </div>
            `;
            
            // 从后端API获取荣誉墙
            const result = await API.getWorks('honor');
            const honorData = result.works || [];

            // 更新当前图片列表状态
            currentImageList = honorData;
            currentImageCategory = 'honor';

            if (honorData.length === 0) {
                detailContent.innerHTML = `
                    <div class="honor-page" style="width: 100%; height: calc(100vh - 120px); display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <div class="empty-state" style="text-align: center;">
                            <p style="color: #ff6b9d; font-size: 24px; font-weight: bold; margin-bottom: 20px;">暂无荣誉照片</p>
                            ${isAdminUser ? '<button class="go-upload-btn" onclick="window.openQuickUpload(\'honor\', \'image/*\')" style="background: #ff6b9d; color: white; border-radius: 50px; padding: 12px 30px; border: none; font-size: 16px;">去上传作品</button>' : ''}
                        </div>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="honor-page" style="position: relative;">
                    ${isAdminUser ? `
                    <button class="add-honor-btn" onclick="window.openQuickUpload('honor', 'image/*')" style="
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        z-index: 100;
                        background: #ff6b9d;
                        color: white;
                        border: none;
                        border-radius: 50px;
                        padding: 10px 20px;
                        font-size: 14px;
                        cursor: pointer;
                        box-shadow: 0 4px 10px rgba(255, 107, 157, 0.3);
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <span>➕</span> 添加荣誉
                    </button>
                    ` : ''}
                    <div class="honor-3d-container">
                        <div class="honor-3d-track" id="honorTrack">
                            ${honorData.map((honor, index) => {
                                // 优先使用 fileUrl，如果没有则回退到拼接路径
                                const imgSrc = honor.fileUrl || ('/uploads/honor/' + honor.file_path);
                                return `
                                <div class="honor-3d-card" data-index="${index}">
                                    <div class="honor-card-inner">
                                        <img src="${imgSrc}" alt="${honor.title}" style="width:100%; height:100%; object-fit:cover; display:block;">
                                    <div class="honor-card-title">${honor.title}</div>
                                </div>
                            </div>
                        `}).join('')}
                        </div>
                    </div>
                </div>
            `;

            detailContent.innerHTML = html;
            initHonor3DCarousel(honorData.length);
        } catch (error) {
            console.error('加载荣誉墙失败:', error);
            detailContent.innerHTML = `
                <div class="honor-page">
                    <div class="empty-state">
                        <p>加载失败，请刷新页面重试</p>
                        ${isAdminUser ? '<button class="go-upload-btn" onclick="window.openQuickUpload(\'honor\', \'image/*\')">去上传作品</button>' : ''}
                    </div>
                </div>
            `;
        }
    }
    window.loadHonorPage = loadHonorPage;

    function initHonor3DCarousel(totalCards) {
        const track = document.getElementById('honorTrack');
        const cards = document.querySelectorAll('.honor-3d-card');
        
        if (!track || cards.length === 0) return;

        // 配置参数 - 优化半径和视觉效果
        // 响应式半径：手机端使用较小半径，PC端使用标准半径
        let radius = window.innerWidth < 768 ? 160 : 280; 
        
        // 监听窗口大小改变，动态调整半径
        window.addEventListener('resize', () => {
            radius = window.innerWidth < 768 ? 160 : 280;
        });

        const angleStep = 360 / totalCards;
        let rotation = 0;
        let isPaused = false;
        let animationFrameId;
        let lastActiveIndex = -1;
        
        // 性能优化：使用 will-change 并清除旧的内联样式
        cards.forEach(card => {
            // 优化：明确指定 will-change 属性，帮助浏览器提前优化
            card.style.willChange = 'transform, opacity, z-index';
            
            // 清除可能存在的旧内联样式
            const inner = card.querySelector('.honor-card-inner');
            if(inner) {
                inner.style.borderColor = '';
                inner.style.boxShadow = '';
                // 移除 all transition，只保留特定属性，防止 transform 变化时触发不必要的过渡计算
                inner.style.transition = 'border-color 0.3s ease, box-shadow 0.3s ease';
            }
        });

        // 初始化卡片位置 - 优化的3D排列
        function updateCardsPosition(rotationAngle) {
            let maxZIndex = -Infinity;
            let currentActiveIndex = -1;

            cards.forEach((card, index) => {
                const angleDeg = (index * angleStep + rotationAngle) % 360;
                const angleRad = angleDeg * Math.PI / 180;
                
                // 计算3D位置
                // 使用 toFixed 减少小数位数，可能对某些浏览器渲染有帮助
                const x = (Math.sin(angleRad) * radius).toFixed(2);
                const z = (Math.cos(angleRad) * radius - radius).toFixed(2); 
                
                // 计算缩放和透明度
                const cosVal = Math.cos(angleRad);
                const scale = (0.6 + (1 + cosVal) * 0.25).toFixed(3); 
                const opacity = (0.3 + (1 + cosVal) * 0.35).toFixed(3); 
                const zIndex = Math.round((1 + cosVal) * 100);
                
                // 找出最前面的卡片
                if (zIndex > maxZIndex) {
                    maxZIndex = zIndex;
                    currentActiveIndex = index;
                }
                
                // 恢复 3D 旋转效果：
                // 让卡片面向圆心或者稍微有一些透视感
                // 如果是标准旋转木马，应该是 rotateY(${-angleDeg}deg) 或者 rotateY(${angleDeg}deg)
                // 这里我们使用 rotateY(${-angleDeg}deg) 让卡片始终面向圆环外侧，配合 translate3d 移动
                card.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${-angleDeg}deg) scale(${scale})`;
                card.style.opacity = opacity;
                
                // 优化：仅当 zIndex 改变时才更新 DOM
                if (card.style.zIndex != zIndex) {
                    card.style.zIndex = zIndex;
                }
            });

            // 只在状态改变时更新 active 类，减少DOM操作
            if (currentActiveIndex !== lastActiveIndex) {
                if (lastActiveIndex !== -1 && cards[lastActiveIndex]) {
                    cards[lastActiveIndex].classList.remove('active');
                }
                if (currentActiveIndex !== -1 && cards[currentActiveIndex]) {
                    cards[currentActiveIndex].classList.add('active');
                }
                lastActiveIndex = currentActiveIndex;
            }
        }

        // 丝滑动画循环
        let lastTime = performance.now();
        const rotationSpeed = 20; // 稍微提高速度，看起来更流畅
        
        function animate(currentTime) {
            if (!isPaused) {
                const deltaTime = (currentTime - lastTime) / 1000;
                lastTime = currentTime;
                
                // 限制最大帧时间，防止切换标签后飞转
                const dt = Math.min(deltaTime, 0.1);
                
                rotation -= rotationSpeed * dt; // 逆时针旋转
                
                // 防止 rotation 数值过大
                if (rotation <= -360) rotation += 360;
                
                updateCardsPosition(rotation);
            } else {
                lastTime = currentTime;
            }
            
            animationFrameId = requestAnimationFrame(animate);
        }

        // 启动动画
        animationFrameId = requestAnimationFrame(animate);

        // 初始化点击事件
        cards.forEach((card, index) => {
            card.addEventListener('click', function() {
                // 如果是点击两侧的卡片，可以自动旋转到中间（可选功能，这里暂时只保留查看大图）
                showImageAtIndex(index);
            });
        });

        // 鼠标悬停暂停
        const container = document.querySelector('.honor-3d-container');
        if (container) {
            container.addEventListener('mouseenter', function() {
                isPaused = true;
            });

            container.addEventListener('mouseleave', function() {
                isPaused = false;
                lastTime = performance.now();
            });
        }
        
        // 页面不可见时暂停动画
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                isPaused = true;
            } else {
                isPaused = false;
                lastTime = performance.now();
            }
        });
    }

    // PPT展示页 - 从后端API加载
    async function loadPPTPage() {
        const isAdminUser = window.isAdmin ? window.isAdmin() : false;
        
        try {
            // 显示加载中
            detailContent.innerHTML = `
                <div class="ppt-page">
                    <div class="empty-state">
                        <p>加载中...</p>
                    </div>
                </div>
            `;
            
            // 从后端API获取PPT
            const result = await API.getWorks('ppt');
            const pptData = result.works || [];

            if (pptData.length === 0) {
                detailContent.innerHTML = `
                    <div class="ppt-page">
                        <div class="empty-state">
                            <p>暂无PPT文件</p>
                            ${isAdminUser ? '<button class="go-upload-btn" onclick="window.openQuickUpload(\'ppt\', \'image/*\')">去上传作品</button>' : ''}
                        </div>
                    </div>
                `;
                return;
            }

            // 只显示图片类型的PPT页面
            const imagePPTs = pptData.filter(ppt => ppt.file_type && ppt.file_type.startsWith('image'));
            
            if (imagePPTs.length === 0) {
                detailContent.innerHTML = `
                    <div class="ppt-page">
                        <div class="empty-state">
                            <p>已上传的PPT文件不支持预览，请上传图片格式的PPT页面</p>
                            ${isAdminUser ? '<button class="go-upload-btn" onclick="window.openQuickUpload(\'ppt\', \'image/*\')">去上传作品</button>' : ''}
                        </div>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="ppt-page">
                    <div class="ppt-container">
                        <div class="ppt-display">
                            <img src="${imagePPTs[0].fileUrl || ('/uploads/ppt/' + imagePPTs[0].file_path)}" alt="PPT页面" id="pptImage" style="width:100%; height:100%; object-fit:contain; position:absolute; top:0; left:0;">
                            <p class="ppt-page-number">1 / ${imagePPTs.length}</p>
                        </div>
                        <div class="ppt-controls">
                            <button class="ppt-nav prev" id="pptPrev">上一页</button>
                            <div class="ppt-indicators">
                                ${imagePPTs.map((_, index) => `
                                    <span class="indicator ${index === 0 ? 'active' : ''}" data-page="${index}"></span>
                                `).join('')}
                            </div>
                            <button class="ppt-nav next" id="pptNext">下一页</button>
                        </div>
                    </div>
                    ${isAdminUser ? '<button class="floating-upload-btn" onclick="window.openQuickUpload(\'ppt\', \'image/*\')" title="上传新作品">+</button>' : ''}
                </div>
            `;

            detailContent.innerHTML = html;
            initPPT(imagePPTs);
        } catch (error) {
            console.error('加载PPT失败:', error);
            detailContent.innerHTML = `
                <div class="ppt-page">
                    <div class="empty-state">
                        <p>加载失败，请刷新页面重试</p>
                        ${isAdminUser ? '<button class="go-upload-btn" onclick="window.openQuickUpload(\'ppt\', \'image/*\')">去上传作品</button>' : ''}
                    </div>
                </div>
            `;
        }
    }
    window.loadPPTPage = loadPPTPage;

    function initPPT(pptData) {
        const prevBtn = document.getElementById('pptPrev');
        const nextBtn = document.getElementById('pptNext');
        const pptImage = document.getElementById('pptImage');
        const pageNumber = document.querySelector('.ppt-page-number');
        const indicators = document.querySelectorAll('.indicator');
        let currentPage = 0;

        function showPage(index) {
            // 优先使用 fileUrl，如果没有则回退到拼接路径
            const imgSrc = pptData[index].fileUrl || ('/uploads/ppt/' + pptData[index].file_path);
            pptImage.src = imgSrc;
            pageNumber.textContent = `${index + 1} / ${pptData.length}`;

            indicators.forEach((indicator, i) => {
                indicator.classList.toggle('active', i === index);
            });

            prevBtn.style.opacity = index === 0 ? '0.5' : '1';
            nextBtn.style.opacity = index === pptData.length - 1 ? '0.5' : '1';
        }

        prevBtn.addEventListener('click', function() {
            if (currentPage > 0) {
                currentPage--;
                showPage(currentPage);
            }
        });

        nextBtn.addEventListener('click', function() {
            if (currentPage < pptData.length - 1) {
                currentPage++;
                showPage(currentPage);
            }
        });

        indicators.forEach(indicator => {
            indicator.addEventListener('click', function() {
                currentPage = parseInt(this.getAttribute('data-page'));
                showPage(currentPage);
            });
        });

        showPage(0);
    }

    // 关闭图片查看器
    closeModalBtn.addEventListener('click', function() {
        imageModal.style.display = 'none';
    });

    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal) {
            imageModal.style.display = 'none';
        }
    });

    // 进入空间按钮事件
    const enterSpaceBtn = document.getElementById('enterSpaceBtn');
    if (enterSpaceBtn) {
        enterSpaceBtn.addEventListener('click', function() {
            window.switchPage('page1');
        });
    }

    // 首页卡片滚动预览
    async function initCardPreviews() {
        const categories = ['painting', 'dance']; // 移除了 'ai'，防止AI作品预览背景导致的问题
        
        for (const category of categories) {
            const scrollContainer = document.getElementById(`scroll-${category}`);
            if (!scrollContainer) continue;

            try {
                // 限制获取数量，提高性能
                const result = await API.getWorks(category);
                let works = result.works || [];
                
                if (works.length === 0) continue;
                
                // 按创建时间降序，取最新的
                works.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                
                // 截取前10个
                works = works.slice(0, 10);
                
                // 如果数量太少，重复几次以填充，确保滚动流畅
                if (works.length < 5) {
                    works = [...works, ...works, ...works]; 
                }

                // 对于绘画作品，不使用滚动动画，只显示最新的一张作为静态背景
                if (category === 'painting') {
                    if (works.length > 0) {
                        const work = works[0];
                        const src = work.fileUrl || ('/uploads/painting/' + work.file_path);
                        scrollContainer.innerHTML = `<img src="${src}" style="width: 100%; height: 100%; object-fit: cover;">`;
                    }
                    continue; // 跳过后续的滚动轨道生成
                }

                // 创建滚动轨道
                const track = document.createElement('div');
                track.className = 'card-scroll-track';
                
                // 生成HTML
                const itemsHtml = works.map(work => {
                    let src = '';
                    let isVideo = false;
                    
                    // 根据不同类型获取最佳预览图
                    if (category === 'painting') {
                         src = work.fileUrl || ('/uploads/painting/' + work.file_path);
                    } else if (category === 'dance') {
                        // 舞蹈视频尝试获取封面，如果没有则直接用视频文件
                        // 优先检查是否有 coverUrl 字段 (AI作品有，普通上传可能没有，但我们可以尝试通用逻辑)
                        src = work.coverUrl;
                        if (!src) {
                            src = work.fileUrl || ('/uploads/dance/' + work.file_path);
                            isVideo = true;
                        }
                    } else if (category === 'ai') {
                         // AI作品通常有封面，如果是视频文件
                         if (work.file_type && work.file_type.startsWith('video')) {
                             src = work.coverUrl;
                             // 如果没有封面，回退到视频文件
                             if (!src) {
                                 src = work.fileUrl || ('/uploads/ai/' + work.file_path);
                                 isVideo = true;
                             }
                         } else {
                             src = work.fileUrl || ('/uploads/ai/' + work.file_path);
                         }
                    }
                    
                    if (!src) return '';
                    
                    // 二次确认是否为视频文件（根据后缀）
                    if (!isVideo && src.match(/\.(mp4|webm|mov)$/i)) {
                        isVideo = true;
                    }

                    if (isVideo) {
                         // 视频使用 muted preload="metadata" #t=0.1 来展示第一帧
                         return `<video src="${src}#t=0.1" class="card-scroll-item" muted preload="metadata" playsinline></video>`;
                    } else {
                         return `<img src="${src}" class="card-scroll-item" loading="lazy" alt="preview">`;
                    }
                }).join('');
                
                // 复制一份内容以实现无缝滚动
                track.innerHTML = itemsHtml + itemsHtml; 
                
                scrollContainer.innerHTML = ''; // 清空可能存在的旧内容
                scrollContainer.appendChild(track);
                
            } catch (error) {
                console.error(`加载${category}预览失败:`, error);
            }
        }
    }
    
    // 初始化卡片预览
    initCardPreviews();

    // 暴露页面加载函数供外部调用
    window.loadAIPage = loadAIPage;
    window.loadDancePage = loadDancePage;
    window.loadPaintingPage = loadPaintingPage;

    // 初始化页面 - 默认显示封面页(page0)，不自动跳转
    // 用户需要点击"进入空间"按钮才能进入主页面
});