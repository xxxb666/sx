document.addEventListener('DOMContentLoaded', function() {
    
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
            
            // 跳过 .ai-thumbnail 中的图片，因为它们由CSS grid 和 aspect-ratio 控制
            if (el.closest('.ai-thumbnail')) return;

            // 跳过图片模态框中的图片，因为它们由CSS控制
            if (el.closest('.image-modal')) return;

            if (rect.width > screenWidth) {
                el.style.maxWidth = '100%';
                el.style.height = 'auto';
                el.style.objectFit = 'contain';
            }
            
            // 特别针对视频播放器 (图片模态框由CSS控制，不再此处强制覆盖)
            if (el.closest('.video-player-container')) {
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
            // 先暂停视频播放
            videoElement.pause();
            // 重置视频源，确保完全停止播放和释放资源
            videoElement.src = '';
            videoElement.load();
            // 隐藏播放器
            videoPlayer.style.display = 'none';
            // 恢复页面滚动
            document.body.style.overflow = '';
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
                        videoElement.pause();
                        videoElement.src = '';
                        videoElement.load();
                        videoPlayer.style.display = 'none';
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
                videoElement.pause();
                videoElement.src = '';
                videoElement.load();
                videoPlayer.style.display = 'none';
                // 恢复页面滚动
                document.body.style.overflow = '';
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

    // 自我介绍视频点击放大到播放器
    (function bindIntroVideoEnlarge() {
        const introVideoContainer = document.getElementById('introVideoContainer');
        const introVideoEl = document.getElementById('introVideo');
        if (introVideoContainer && introVideoEl) {
            introVideoContainer.style.cursor = 'pointer';
        }
        const handler = (e) => {
            const container = e.target.closest('#introVideoContainer');
            const video = e.target.closest('#introVideo');
            if (!container && !video) return;
            const introVideo = document.getElementById('introVideo');
            if (!introVideo) return;
            try {
                const src = introVideo.currentSrc || introVideo.getAttribute('src');
                if (src && typeof window.showVideoPlayer === 'function') {
                    try { introVideo.pause(); } catch(_) {}
                    window.showVideoPlayer(src);
                }
            } catch (_) {}
        };
        document.addEventListener('click', handler, true);
    })();

    // 封面页鼠标拖尾效果
    const trailCanvas = document.getElementById('trail-canvas');
    
    if (trailCanvas) {
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
        
        document.addEventListener('mousemove', function(e) {
            const x = e.clientX;
            const y = e.clientY;
            
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
        document.addEventListener('touchmove', function(e) {
            const touch = e.touches[0];
            const x = touch.clientX;
            const y = touch.clientY;
            
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
        
        // 始终运行动画
        animate();
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

    // 分页组件类 (实现 3 个一组的滑动效果)
    class PaginatedViewer {
        constructor(options) {
            this.data = options.data || [];
            this.containerId = options.containerId;
            this.renderItemCallback = options.renderItem;
            // 默认显示3个，但移动端可能显示1个
            this.itemsPerPage = window.innerWidth <= 768 ? 1 : (options.itemsPerPage || 3);
            this.currentIndex = 0; // 改为当前显示的第一个元素的索引
            this.onPageChange = options.onPageChange;
            
            // 监听窗口大小变化，更新 itemsPerPage
            window.addEventListener('resize', () => {
                const newItemsPerPage = window.innerWidth <= 768 ? 1 : (options.itemsPerPage || 3);
                if (newItemsPerPage !== this.itemsPerPage) {
                    this.itemsPerPage = newItemsPerPage;
                    // 确保索引不越界
                    this.currentIndex = Math.min(this.currentIndex, Math.max(0, this.data.length - this.itemsPerPage));
                    this.render();
                }
            });

            this.init();
        }
        
        init() {
            const container = document.getElementById(this.containerId);
            if (!container) return;
            
            container.innerHTML = `
                <div class="paginated-container">
                    <button class="pagination-btn prev-btn" id="${this.containerId}-prev" title="左移">◀</button>
                    <div class="items-wrapper" id="${this.containerId}-items"></div>
                    <button class="pagination-btn next-btn" id="${this.containerId}-next" title="右移">▶</button>
                </div>
            `;
            
            this.itemsContainer = document.getElementById(`${this.containerId}-items`);
            this.prevBtn = document.getElementById(`${this.containerId}-prev`);
            this.nextBtn = document.getElementById(`${this.containerId}-next`);
            
            this.prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prevSlide();
            });
            this.nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextSlide();
            });
            
            this.render();
        }
        
        render() {
            if (this.data.length === 0) {
                this.itemsContainer.innerHTML = '';
                this.updateButtons();
                return;
            }

            const start = this.currentIndex;
            const end = Math.min(start + this.itemsPerPage, this.data.length);
            const currentItems = this.data.slice(start, end);
            
            this.itemsContainer.innerHTML = currentItems.map((item, index) => 
                this.renderItemCallback(item, start + index)
            ).join('');
            
            this.updateButtons();
            
            if (this.onPageChange) {
                this.onPageChange();
            }
        }
        
        updateButtons() {
            this.prevBtn.disabled = this.currentIndex === 0;
            this.nextBtn.disabled = (this.currentIndex + this.itemsPerPage) >= this.data.length;
            
            if (this.data.length <= this.itemsPerPage) {
                 this.prevBtn.style.display = 'none';
                 this.nextBtn.style.display = 'none';
            } else {
                 this.prevBtn.style.display = 'flex';
                 this.nextBtn.style.display = 'flex';
            }
        }
        
        prevSlide() {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                this.render();
            }
        }
        
        nextSlide() {
            if ((this.currentIndex + this.itemsPerPage) < this.data.length) {
                this.currentIndex++;
                this.render();
            }
        }
    }
    window.PaginatedViewer = PaginatedViewer;

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

            // 按方向排序
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

            // 构建基本HTML结构
            detailContent.innerHTML = `
            <div class="painting-page">
                <div id="painting-paginated-root"></div>
                
                ${isAdminUser ? `
                <div class="section-footer-action" style="text-align: center; margin-top: 30px;">
                    <button class="go-upload-btn" onclick="window.openQuickUpload('painting', 'image/*')">上传新作品</button>
                </div>
                ` : ''}
            </div>
            `;

            // 渲染单个卡片的函数
            const renderCard = (painting, index) => {
                const imgSrc = painting.fileUrl || ('/uploads/painting/' + painting.file_path);
                const workId = painting.work_id || painting.id;
                return `
                <div class="card-item" data-id="${workId}" data-type="image" data-content="${imgSrc}" onclick="window.showImageAtIndex(${index})">
                    <div class="card-thumbnail">
                        <img src="${imgSrc}" alt="${painting.title}">
                    </div>
                    <div class="card-info">
                        <h3>${painting.title}</h3>
                        <p>${painting.description || ''}</p>
                    </div>
                    ${isAdminUser ? `
                    <button class="card-delete-btn" data-id="${workId}" data-category="painting">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                    </button>
                    ` : ''}
                </div>
            `};

            // 初始化分页组件
            new PaginatedViewer({
                containerId: 'painting-paginated-root',
                data: paintingData,
                renderItem: renderCard,
                itemsPerPage: 3,
                onPageChange: () => {
                    // 同步更新当前图片列表，确保查看器内的导航正确
                    currentImageList = paintingData;
                    currentImageCategory = 'painting';
                    if (isAdminUser) {
                        bindDeleteEvents('painting', loadPaintingPage);
                    }
                }
            });
            
            // 初次绑定删除事件
            if (isAdminUser) {
                bindDeleteEvents('painting', loadPaintingPage);
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

    // 辅助函数：绑定删除事件
    function bindDeleteEvents(category, reloadFunc) {
        document.querySelectorAll('.card-delete-btn').forEach(btn => {
            // 移除旧的监听器（如果有）- 这里通过 cloneNode 简单处理，或者假设每次都是重新渲染
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', async function(e) {
                e.stopPropagation();
                const workId = this.getAttribute('data-id');
                // const category = this.getAttribute('data-category'); // Use passed category
                if (confirm('确定要删除这个作品吗？此操作不可恢复！')) {
                    try {
                        await API.deleteWork(category, workId);
                        reloadFunc(); // Reload the page
                        alert('作品已删除');
                    } catch (error) {
                        alert('删除失败: ' + error.message);
                    }
                }
            });
        });
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

            // 构建基本HTML结构
            detailContent.innerHTML = `
            <div class="dance-page">
                <div id="dance-paginated-root"></div>
                
                ${isAdminUser ? `
                <div class="section-footer-action" style="text-align: center; margin-top: 30px;">
                    <button class="go-upload-btn" onclick="window.openQuickUpload('dance', 'video/*')">上传新作品</button>
                </div>
                ` : ''}
            </div>
            `;

            // 渲染单个视频卡片的函数
            const renderVideoCard = (video, index) => {
                const videoSrc = video.fileUrl || ('/uploads/dance/' + video.file_path);
                const coverSrc = video.coverUrl || (video.cover_path ? ('/uploads/dance/covers/' + video.cover_path) : '');
                const workId = video.work_id || video.id;
                
                return `
                <div class="card-item" data-id="${workId}" data-video="${videoSrc}" onclick="window.playVideoAtIndex(${index})">
                    <div class="card-thumbnail">
                        ${coverSrc ? `<img src="${coverSrc}" alt="${video.title}">` : `<video muted preload="metadata"><source src="${videoSrc}" type="video/mp4"></video>`}
                        <div class="card-play-icon">▶</div>
                    </div>
                    <div class="card-info">
                        <h3>${video.title}</h3>
                        ${video.description && video.description.trim() ? `<p>${video.description}</p>` : ''}
                    </div>
                    ${isAdminUser ? `
                    <button class="card-delete-btn" data-id="${workId}" data-category="dance">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                    </button>
                    ` : ''}
                </div>
            `};
            
            // 初始化分页组件
            new PaginatedViewer({
                containerId: 'dance-paginated-root',
                data: danceData,
                renderItem: renderVideoCard,
                itemsPerPage: 3,
                onPageChange: () => {
                    // 同步更新当前播放列表，确保播放器内的导航正确
                    currentVideoList = danceData;
                    currentVideoCategory = 'dance';
                    if (isAdminUser) {
                        bindDeleteEvents('dance', loadDancePage);
                    }
                }
            });

            // 初次绑定删除事件
            if (isAdminUser) {
                bindDeleteEvents('dance', loadDancePage);
            }
            
            // 暴露给全局以便点击事件使用
            window.playVideoAtIndex = playVideoAtIndex;

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
        // 导航按钮
        if (prevVideoBtn && nextVideoBtn) {
            if (currentVideoList.length > 0) {
                prevVideoBtn.style.display = 'flex';
                nextVideoBtn.style.display = 'flex';
            } else {
                prevVideoBtn.style.display = 'none';
                nextVideoBtn.style.display = 'none';
            }
        }

        // 删除按钮仅管理员可见
        if (deleteVideoBtn) {
            const isAdminUser = window.isAdmin ? window.isAdmin() : false;
            if (isAdminUser && currentVideoIndex !== -1) {
                deleteVideoBtn.style.display = 'flex';
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
        
        // 强制设置更大的尺寸，聚焦观看
        videoElement.style.maxWidth = '90%';
        videoElement.style.maxHeight = '80vh';
        videoElement.style.objectFit = 'contain';
        // 打开浮层时禁用背景滚动
        document.body.style.overflow = 'hidden';

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
    window.showImageAtIndex = showImageAtIndex;

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
            
            // 按创建时间升序排序
            aiData.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateA - dateB;
            });
            
            // 更新当前列表状态
            currentVideoList = aiData.filter(ai => (ai.file_type && ai.file_type.startsWith('video')) || (ai.file_path && ai.file_path.match(/\.(mp4|webm|mov)$/i)));
            currentVideoCategory = 'ai';
            currentImageList = aiData.filter(ai => !((ai.file_type && ai.file_type.startsWith('video')) || (ai.file_path && ai.file_path.match(/\.(mp4|webm|mov)$/i))));
            currentImageCategory = 'ai';

            if (aiData.length === 0) {
                detailContent.innerHTML = `
                    <div class="ai-page">
                        <div class="empty-state">
                            <p>暂无AI作品</p>
                            ${isAdminUser ? '<button class="go-upload-btn" onclick="window.openQuickUpload(\'ai\', \'image/*\')">去上传作品</button>' : ''}
                        </div>
                    </div>
                `;
                return;
            }

            // 构建基本HTML结构
            detailContent.innerHTML = `
            <div class="ai-page">
                <div id="ai-paginated-root"></div>
                
                ${isAdminUser ? `
                <div class="section-footer-action" style="text-align: center; margin-top: 30px;">
                    <button class="go-upload-btn" onclick="window.openQuickUpload('ai', 'image/*')">上传新作品</button>
                </div>
                ` : ''}
            </div>
            `;
            
            // 渲染卡片函数
            const renderCard = (ai, index) => {
                // 优先使用 fileUrl，如果没有则回退到拼接路径
                const contentSrc = ai.fileUrl || ('/uploads/ai/' + ai.file_path);
                const workId = ai.work_id || ai.id;
                
                // 类型判断
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
                    <div class="card-item" data-id="${workId}" data-type="${type}" data-content="${contentSrc}" style="cursor: pointer;">
                        <div class="card-thumbnail">
                            ${mediaHtml}
                            ${isVideo ? '<div class="card-play-icon">▶</div>' : ''}
                        </div>
                        <div class="card-info">
                            <h3>${ai.title}</h3>
                            ${ai.description && ai.description.trim() ? `<p>${ai.description}</p>` : ''}
                        </div>
                        ${isAdminUser ? `
                        <button class="card-delete-btn" data-id="${workId}" data-category="ai">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                        </button>
                        ` : ''}
                    </div>
                `;
            };

            // 初始化分页组件
            new PaginatedViewer({
                containerId: 'ai-paginated-root',
                data: aiData,
                renderItem: renderCard,
                itemsPerPage: 3,
                onPageChange: () => {
                    // 同步更新列表状态
                    currentVideoList = aiData.filter(ai => (ai.file_type && ai.file_type.startsWith('video')) || (ai.file_path && ai.file_path.match(/\.(mp4|webm|mov)$/i)));
                    currentImageList = aiData.filter(ai => !((ai.file_type && ai.file_type.startsWith('video')) || (ai.file_path && ai.file_path.match(/\.(mp4|webm|mov)$/i))));
                    if (isAdminUser) {
                        bindDeleteEvents('ai', loadAIPage);
                    }
                }
            });
            
            if (isAdminUser) {
                bindDeleteEvents('ai', loadAIPage);
            }

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

    // 全局事件委托：处理作品卡片点击
    document.body.addEventListener('click', function(e) {
        const card = e.target.closest('.card-item');
        if (!card) return;
        
        // 如果点击的是删除按钮，不触发查看逻辑
        if (e.target.closest('.card-delete-btn')) return;

        e.preventDefault();
        e.stopPropagation();

        const type = card.getAttribute('data-type') || '';
        const content = card.getAttribute('data-content') || card.getAttribute('data-video');
        const id = card.getAttribute('data-id');

        if (type.startsWith('image')) {
            if (id && currentImageList.length > 0) {
                const index = currentImageList.findIndex(img => img.work_id == id);
                if (index !== -1) {
                    showImageAtIndex(index);
                    return;
                }
            }
            showImageModal(content);
        } else if (type.startsWith('video') || card.hasAttribute('data-video')) {
            if (id && currentVideoList.length > 0) {
                const index = currentVideoList.findIndex(v => v.work_id == id);
                if (index !== -1) {
                    currentVideoIndex = index;
                    playVideoAtIndex(index);
                    return;
                }
            }
            showVideoPlayer(content);
        } else if (type.includes('pdf') || (content && content.endsWith('.pdf'))) {
            showPdfViewer(content);
        } else {
            // 默认尝试作为图片或视频
            if (content && content.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                showImageModal(content);
            } else if (content && content.match(/\.(mp4|webm|mov)$/i)) {
                showVideoPlayer(content);
            }
        }
    });

    // 保留空函数以防万一
    function initAICards() {}

    function showImageModal(imageSrc) {
        modalImage.src = imageSrc;
        imageModal.style.display = 'flex';
        // Remove inline styles that might conflict with CSS
        modalImage.style.maxWidth = '';
        modalImage.style.maxHeight = '';
        modalImage.style.objectFit = '';

        // 更新图片计数器
        const imageCounter = document.getElementById('imageCounter');
        if (imageCounter) {
            // 确保 currentImageIndex 是有效的
            if (currentImageList.length > 0 && currentImageIndex >= 0 && currentImageIndex < currentImageList.length) {
                imageCounter.textContent = `${currentImageIndex + 1} / ${currentImageList.length}`;
                imageCounter.style.display = 'block';
            } else {
                imageCounter.style.display = 'none';
            }
        }

        // 更新导航按钮状态
        if (prevImageBtn && nextImageBtn) {
            // 只要有图片列表，就显示导航按钮
            if (currentImageList.length > 0) {
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
                if (currentImageIndex !== -1 && currentImageList[currentImageIndex]) {
                    deleteImageBtn.setAttribute('data-id', currentImageList[currentImageIndex].work_id);
                }
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
                    <div class="honor-page">
                        <div class="empty-state">
                            <p>暂无荣誉照片</p>
                            ${isAdminUser ? '<button class="go-upload-btn" onclick="window.openQuickUpload(\'honor\', \'image/*\')">去上传作品</button>' : ''}
                        </div>
                    </div>
                `;
                return;
            }

            // 构建基本HTML结构
            detailContent.innerHTML = `
            <div class="honor-page">
                ${isAdminUser ? `
                <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
                    <button class="add-honor-btn" onclick="window.openQuickUpload('honor', 'image/*')">
                        <span>➕</span> 添加荣誉
                    </button>
                </div>
                ` : ''}
                
                <div id="honor-paginated-root"></div>
            </div>
            `;

            // 渲染卡片函数
            const renderCard = (honor, index) => {
                const imgSrc = honor.fileUrl || ('/uploads/honor/' + honor.file_path);
                const workId = honor.work_id || honor.id;
                return `
                <div class="card-item honor-card" onclick="window.showImageAtIndex(${index})">
                    <div class="card-thumbnail">
                        <img src="${imgSrc}" alt="${honor.title}" loading="lazy">
                    </div>
                    <div class="card-info">
                        <h3>${honor.title}</h3>
                    </div>
                    ${isAdminUser ? `
                    <button class="card-delete-btn" data-id="${workId}" data-category="honor">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                    </button>
                    ` : ''}
                </div>
            `};

            // 初始化分页组件
            new PaginatedViewer({
                containerId: 'honor-paginated-root',
                data: honorData,
                renderItem: renderCard,
                itemsPerPage: 3,
                onPageChange: () => {
                    currentImageList = honorData;
                    currentImageCategory = 'honor';
                    if (isAdminUser) {
                        bindDeleteEvents('honor', loadHonorPage);
                    }
                }
            });
            
            if (isAdminUser) {
                bindDeleteEvents('honor', loadHonorPage);
            }

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
            let pptData = result.works || [];

            // 更新当前列表状态
            currentImageList = pptData;
            currentImageCategory = 'ppt';

            if (pptData.length === 0) {
                detailContent.innerHTML = `
                    <div class="ppt-page">
                        <div class="empty-state">
                            <p>暂无PPT作品</p>
                            ${isAdminUser ? '<button class="go-upload-btn" onclick="window.openQuickUpload(\'ppt\', \'image/*\')">去上传作品</button>' : ''}
                        </div>
                    </div>
                `;
                return;
            }

            // 构建基本HTML结构
            detailContent.innerHTML = `
            <div class="ppt-page">
                <div id="ppt-paginated-root"></div>
                
                ${isAdminUser ? `
                <div class="section-footer-action" style="text-align: center; margin-top: 30px;">
                    <button class="go-upload-btn" onclick="window.openQuickUpload('ppt', 'image/*')">上传新作品</button>
                </div>
                ` : ''}
            </div>
            `;

            // 渲染卡片函数
            const renderCard = (ppt, index) => {
                const imgSrc = ppt.fileUrl || ('/uploads/ppt/' + ppt.file_path);
                const workId = ppt.work_id || ppt.id;
                
                return `
                <div class="card-item ppt-card" onclick="window.showImageAtIndex(${index})">
                    <div class="card-thumbnail">
                        <img src="${imgSrc}" alt="${ppt.title || 'PPT作品'}">
                    </div>
                    <div class="card-info">
                        <h3>${ppt.title || 'PPT作品'}</h3>
                        <p>${ppt.description || ''}</p>
                    </div>
                    ${isAdminUser ? `
                    <button class="card-delete-btn" data-id="${workId}" data-category="ppt">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                    </button>
                    ` : ''}
                </div>
            `};

            // 初始化分页组件
            new PaginatedViewer({
                containerId: 'ppt-paginated-root',
                data: pptData,
                renderItem: renderCard,
                itemsPerPage: 3,
                onPageChange: () => {
                    currentImageList = pptData;
                    currentImageCategory = 'ppt';
                    if (isAdminUser) {
                        bindDeleteEvents('ppt', loadPPTPage);
                    }
                }
            });
            
            if (isAdminUser) {
                bindDeleteEvents('ppt', loadPPTPage);
            }

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
            // 登录后的场景直接进入作品集首页（page1）
            const isLoggedIn = typeof API !== 'undefined' && typeof API.isLoggedIn === 'function' ? API.isLoggedIn() : false;
            const target = isLoggedIn ? 'page1' : 'page2';
            window.switchPage(target);
        });
    }

    // 跳过介绍/进入作品集按钮事件
    const skipIntroBtn = document.getElementById('skipIntroBtn');
    if (skipIntroBtn) {
        skipIntroBtn.addEventListener('click', function() {
            window.switchPage('page1');
        });
    }

    // 首页卡片滚动预览
    async function initCardPreviews() {
        // 用户要求统一卡片样式，不再显示动态预览
        return;
    }
    
    // 初始化卡片预览
    initCardPreviews();

    // 暴露页面加载函数供外部调用
    window.loadAIPage = loadAIPage;
    window.loadDancePage = loadDancePage;
    window.loadPaintingPage = loadPaintingPage;

    // 初始化页面 - 默认显示封面页(page0)，不自动跳转
    // 用户需要点击"进入空间"按钮才能进入主页面

    // 登录成功后从 login.html 返回时，自动进入作品集首页（跳过介绍页）
    (function autoEnterAfterLogin() {
        try {
            const params = new URLSearchParams(window.location.search);
            const fromLogin = params.get('login_success') === '1';
            const isLoggedIn = typeof API !== 'undefined' && typeof API.isLoggedIn === 'function' ? API.isLoggedIn() : false;
            if (fromLogin || isLoggedIn) {
                window.switchPage('page1');
                // 清理 URL 中的参数
                if (window.history && window.history.replaceState) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
        } catch (e) {
            // 忽略容错
        }
    })();
});
