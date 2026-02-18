document.addEventListener('DOMContentLoaded', function() {
    console.log('%c 当前版本: v1.0.3 (修复删除按钮样式和上传提示) ', 'background: #ff6b9d; color: #fff; padding: 4px; border-radius: 4px;');
    
    const pages = document.querySelectorAll('.page');
    const navBtns = document.querySelectorAll('.nav-btn');
    const backBtns = document.querySelectorAll('.back-btn');
    const cards = document.querySelectorAll('.card');
    const detailContent = document.getElementById('detail-content');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoElement = videoPlayer.querySelector('video');
    const closeVideoBtn = document.getElementById('closeVideo');
    const imageModal = document.getElementById('imageModal');
    const modalImage = imageModal.querySelector('img');
    const closeModalBtn = document.getElementById('closeModal');
    
    // PDF/PPT 查看器
    const pdfModal = document.getElementById('pdfModal');
    const pdfFrame = document.getElementById('pdfFrame');
    const closePdfBtn = document.getElementById('closePdf');
    
    // 视频播放器导航状态
    let currentVideoList = [];
    let currentVideoIndex = -1;
    let currentVideoCategory = '';

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
            if (currentVideoIndex > 0) {
                playVideoAtIndex(currentVideoIndex - 1);
            }
        });
    }

    if (nextVideoBtn) {
        nextVideoBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (currentVideoIndex < currentVideoList.length - 1) {
                playVideoAtIndex(currentVideoIndex + 1);
            }
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
                el.style.border = 'none';
                el.style.backgroundColor = 'transparent';
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

            if (paintingData.length === 0) {
                detailContent.innerHTML = `
                    <div class="painting-page">
                        <div class="empty-state">
                            <p>暂无绘画作品</p>
                            ${isAdminUser ? '<button class="go-upload-btn" onclick="window.goToUploadPage(\'painting\')">去上传作品</button>' : ''}
                        </div>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="painting-page">
                    <div class="ai-grid">
                        ${paintingData.map((painting, index) => {
                            // 优先使用 fileUrl，如果没有则回退到拼接路径
                            const imgSrc = painting.fileUrl || ('/uploads/painting/' + painting.file_path);
                            return `
                            <div class="ai-card" data-type="image" data-content="${imgSrc}">
                                <div class="ai-thumbnail">
                                    <img src="${imgSrc}" alt="${painting.title}">
                                </div>
                                <div class="ai-info">
                                    <h3>${painting.title}</h3>
                                    <p>${painting.description || ''}</p>
                                    ${isAdminUser ? `<button class="work-delete-btn" data-id="${painting.work_id}" data-category="painting">删除</button>` : ''}
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                    ${isAdminUser ? `
                    <div class="section-footer-action">
                        <button class="section-footer-add-btn" onclick="window.goToUploadPage('painting')">
                            <span>🎨</span> 上传绘画
                        </button>
                    </div>` : ''}
                </div>
            `;

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
                        ${isAdminUser ? '<button class="go-upload-btn" onclick="window.goToUploadPage(\'painting\')">去上传作品</button>' : ''}
                    </div>
                </div>
            `;
        }
    }



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
                            ${isAdminUser ? '<button class="go-upload-btn" onclick="window.goToUploadPage(\'dance\')">去上传作品</button>' : ''}
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
                                    ${coverSrc ? `<img src="${coverSrc}" style="width:100%; height:100%; object-fit:cover;" alt="${video.title}">` : '<video muted preload="metadata" style="width:100%; height:100%; object-fit:cover;"><source src="' + videoSrc + '" type="video/mp4"></video>'}
                                    <div class="play-icon">▶</div>
                                </div>
                                <div class="video-info">
                                    <h3>${video.title}</h3>
                                    <p>${video.description || ''}</p>
                                    ${isAdminUser ? `<button class="video-delete-btn" data-id="${video.work_id}" data-category="dance">删除</button>` : ''}
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                    ${isAdminUser ? `
                    <div class="section-footer-action">
                        <button class="section-footer-add-btn" onclick="window.goToUploadPage('dance')">
                            <span>💃</span> 上传舞蹈
                        </button>
                    </div>` : ''}
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
                        ${isAdminUser ? '<button class="go-upload-btn" onclick="window.goToUploadPage(\'dance\')">去上传作品</button>' : ''}
                    </div>
                </div>
            `;
        }
    }

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
        if (!prevVideoBtn || !nextVideoBtn || !deleteVideoBtn) return;

        if (currentVideoIndex === -1) {
            prevVideoBtn.style.display = 'none';
            nextVideoBtn.style.display = 'none';
            deleteVideoBtn.style.display = 'none';
            return;
        }

        // 显示按钮
        prevVideoBtn.style.display = 'flex';
        nextVideoBtn.style.display = 'flex';

        // 更新状态
        prevVideoBtn.disabled = (currentVideoIndex === 0);
        nextVideoBtn.disabled = (currentVideoIndex === currentVideoList.length - 1);
        
        // 删除按钮仅管理员可见
        const isAdminUser = window.isAdmin ? window.isAdmin() : false;
        if (isAdminUser) {
            deleteVideoBtn.style.display = 'block';
            deleteVideoBtn.setAttribute('data-id', currentVideoList[currentVideoIndex].work_id);
        } else {
            deleteVideoBtn.style.display = 'none';
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
    window.showVideoPlayer = showVideoPlayer;

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

            let html = '<div class="ai-page ai-split-container">';
            
            // 辅助函数：渲染卡片
            const renderCard = (ai) => {
                // 优先使用 fileUrl，如果没有则回退到拼接路径
                const contentSrc = ai.fileUrl || ('/uploads/ai/' + ai.file_path);
                return `
                    <div class="ai-card" data-id="${ai.work_id}" data-type="${ai.file_type}" data-content="${contentSrc}">
                        <div class="ai-thumbnail">
                            ${ai.file_type && ai.file_type.startsWith('image') 
                                ? `<img src="${contentSrc}" alt="${ai.title}">`
                                : (ai.coverUrl 
                                    ? `<img src="${ai.coverUrl}" alt="${ai.title}">`
                                    : `<div class="ai-thumbnail-placeholder">${ai.file_type && ai.file_type.startsWith('video') ? '▶' : '📄'}</div>`)
                            }
                            ${ai.file_type && ai.file_type.startsWith('video') ? '<div class="play-icon">▶</div>' : ''}
                        </div>
                        <div class="ai-info">
                            <h3>${ai.title}</h3>
                            <p>${ai.description || ''}</p>
                            ${isAdminUser ? `<button class="work-delete-btn" data-id="${ai.work_id}" data-category="ai">删除</button>` : ''}
                        </div>
                    </div>
                `;
            };

            // 视频区域（左侧/上侧）
            html += '<div class="ai-split-section ai-videos-section">';
            html += '<div class="section-header">';
            html += '<h3 class="section-title">🎬 AI 视频</h3>';
            html += '</div>';
            
            if (videos.length > 0) {
                html += `
                    <div class="ai-grid">
                        ${videos.map(renderCard).join('')}
                    </div>
                `;
            } else {
                 html += '<div class="empty-section-hint">暂无视频作品</div>';
            }

            if (isAdminUser) {
                html += `
                <div class="section-footer-action">
                    <button class="section-footer-add-btn" onclick="window.goToUploadPage('ai', 'video/*')">
                        <span>🎬</span> 上传视频
                    </button>
                </div>`;
            }

            html += '</div>';

            // 图片区域（右侧/下侧）
            html += '<div class="ai-split-section ai-images-section">';
            html += '<div class="section-header">';
            html += '<h3 class="section-title">🖼️ AI 图片</h3>';
            html += '</div>';
            
            if (images.length > 0) {
                html += `
                    <div class="ai-grid">
                        ${images.map(renderCard).join('')}
                    </div>
                `;
            } else {
                 html += '<div class="empty-section-hint">暂无图片作品</div>';
            }

            if (isAdminUser) {
                html += `
                <div class="section-footer-action">
                    <button class="section-footer-add-btn" onclick="window.goToUploadPage('ai', 'image/*')">
                        <span>🖼️</span> 上传图片
                    </button>
                </div>`;
            }

            html += '</div>';
            
            html += `
                </div>
            `;

            detailContent.innerHTML = html;
            initAICards();
        } catch (error) {
            console.error('加载AI作品失败:', error);
            detailContent.innerHTML = `
                <div class="ai-page">
                    <div class="empty-state">
                        <p>加载失败，请刷新页面重试</p>
                        ${isAdminUser ? '<button class="go-upload-btn" onclick="window.goToUploadPage(\'ai\')">去上传作品</button>' : ''}
                    </div>
                </div>
            `;
        }
    }

    function initAICards() {
        const aiCards = document.querySelectorAll('.ai-card');

        aiCards.forEach(card => {
            card.addEventListener('click', function() {
                const type = this.getAttribute('data-type');
                const content = this.getAttribute('data-content');
                const id = this.getAttribute('data-id');

                if (type && type.startsWith('image')) {
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
        });
    }

    function showImageModal(imageSrc) {
        modalImage.src = imageSrc;
        imageModal.style.display = 'flex';
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

            if (honorData.length === 0) {
                detailContent.innerHTML = `
                    <div class="honor-page">
                        <div class="empty-state">
                            <p>暂无荣誉照片</p>
                            ${isAdminUser ? '<button class="go-upload-btn" onclick="window.goToUploadPage(\'honor\')">去上传作品</button>' : ''}
                        </div>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="honor-page">
                    <div class="honor-3d-container">
                        <div class="honor-3d-track" id="honorTrack">
                            ${honorData.map((honor, index) => {
                                // 优先使用 fileUrl，如果没有则回退到拼接路径
                                const imgSrc = honor.fileUrl || ('/uploads/honor/' + honor.file_path);
                                return `
                                <div class="honor-3d-card" data-index="${index}">
                                    <div class="honor-card-inner">
                                        <img src="${imgSrc}" alt="${honor.title}">
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
                        ${isAdminUser ? '<button class="go-upload-btn" onclick="window.goToUploadPage(\'honor\')">去上传作品</button>' : ''}
                    </div>
                </div>
            `;
        }
    }

    function initHonor3DCarousel(totalCards) {
        const track = document.getElementById('honorTrack');
        const cards = document.querySelectorAll('.honor-3d-card');
        
        // 配置参数 - 紧凑排列
        const radius = 350; // 减小半径，让奖状更紧凑
        const angleStep = 360 / totalCards;
        let rotation = 0;
        let isPaused = false;
        let animationFrameId;
        
        // 使用CSS will-change优化性能
        cards.forEach(card => {
            card.style.willChange = 'transform, opacity';
        });

        // 初始化卡片位置 - 弧形排列
        function updateCardsPosition(rotationAngle) {
            cards.forEach((card, index) => {
                const angle = (index * angleStep + rotationAngle) * Math.PI / 180;
                
                // 计算3D位置
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius - radius;
                
                // 计算旋转角度 - 让卡片始终面向中心
                const rotateY = -angle * 180 / Math.PI;
                
                // 根据Z轴位置计算透明度和缩放
                const normalizedZ = (z + radius) / (radius * 2);
                const opacity = 0.5 + normalizedZ * 0.5;
                const scale = 0.7 + normalizedZ * 0.3;
                
                // 使用translate3d开启硬件加速
                card.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${rotateY}deg) scale(${scale})`;
                card.style.opacity = opacity;
                card.style.zIndex = Math.round(normalizedZ * 100);
                
                // 添加边框效果 - 前面的卡片有金色边框
                const inner = card.querySelector('.honor-card-inner');
                if (normalizedZ > 0.7) {
                    inner.style.borderColor = '#FFD700';
                    inner.style.boxShadow = '0 0 25px rgba(255, 215, 0, 0.6)';
                } else {
                    inner.style.borderColor = 'transparent';
                    inner.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.2)';
                }
            });
        }

        // 丝滑动画循环 - 适中的旋转速度
        let lastTime = performance.now();
        const rotationSpeed = 25; // 每秒钟旋转25度，速度适中
        
        function animate(currentTime) {
            if (!isPaused) {
                const deltaTime = (currentTime - lastTime) / 1000; // 转换为秒
                lastTime = currentTime;
                
                // 根据时间计算旋转角度，保证速度恒定
                rotation += rotationSpeed * deltaTime;
                
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
                const imageSrc = this.querySelector('img').src;
                showImageModal(imageSrc);
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
        
        // 页面不可见时暂停动画，节省资源
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
                            ${isAdminUser ? '<button class="go-upload-btn" onclick="window.goToUploadPage(\'ppt\')">去上传作品</button>' : ''}
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
                            ${isAdminUser ? '<button class="go-upload-btn" onclick="window.goToUploadPage(\'ppt\')">去上传作品</button>' : ''}
                        </div>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="ppt-page">
                    <div class="ppt-container">
                        <div class="ppt-display">
                            <img src="${imagePPTs[0].fileUrl || ('/uploads/ppt/' + imagePPTs[0].file_path)}" alt="PPT页面" id="pptImage">
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
                    ${isAdminUser ? '<button class="floating-upload-btn" onclick="window.goToUploadPage(\'ppt\')" title="上传新作品">+</button>' : ''}
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
                        ${isAdminUser ? '<button class="go-upload-btn" onclick="window.goToUploadPage(\'ppt\')">去上传作品</button>' : ''}
                    </div>
                </div>
            `;
        }
    }

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

    // 初始化页面 - 默认显示封面页(page0)，不自动跳转
    // 用户需要点击"进入空间"按钮才能进入主页面
});