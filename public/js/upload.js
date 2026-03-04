// 上传功能管理
document.addEventListener('DOMContentLoaded', function() {
    // 上传页面元素
    const uploadBtn = document.getElementById('uploadBtn');
    const workFile = document.getElementById('workFile');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const filePreview = document.getElementById('filePreview');
    const previewImg = document.getElementById('previewImg');
    const previewVideo = document.getElementById('previewVideo');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const submitUploadBtn = document.getElementById('submitUploadBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressText');
    const uploadTabs = document.querySelectorAll('.upload-tab');
    const worksList = document.getElementById('worksList');
    
    // 个人资料元素
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const avatarImg = document.getElementById('avatarImg');
    const nickname = document.getElementById('nickname');
    const selfIntro = document.getElementById('selfIntro');
    const motto = document.getElementById('motto');

    let currentCategory = 'painting';
    let currentFile = null;
    let currentFileData = null;
    let currentObjectUrl = null; // 用于存储当前文件的Blob URL
    let currentCoverBlob = null; // 视频封面Blob

    // 上传按钮点击事件已在HTML中绑定

    // 标签切换函数
    window.switchUploadTab = function(category, resetForm = true, acceptType = '') {
        uploadTabs.forEach(t => t.classList.remove('active'));
        uploadTabs.forEach(t => {
            if (t.getAttribute('data-tab') === category) {
                t.classList.add('active');
            }
        });
        currentCategory = category;
        
        // 更新文件上传类型的accept属性
        if (workFile) {
            if (acceptType) {
                workFile.accept = acceptType;
            } else {
                // 恢复默认
                workFile.accept = 'image/*,video/*,.pdf,.ppt,.pptx';
            }
        }

        // 只有手动点击标签时才重置表单，从其他页面跳转过来时不重置
        if (resetForm) {
            resetUploadForm();
        }
    };

    // 标签切换事件绑定
    uploadTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-tab');
            window.switchUploadTab(category);
        });
    });

    // 文件选择
    if (workFile) {
        workFile.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleFileSelect(file);
            }
        });
    }

    // 存储当前文件尺寸信息
    let currentFileDimensions = { width: 0, height: 0 };

    // 拖拽上传
    if (fileUploadArea) {
        fileUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });

        fileUploadArea.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });

        fileUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) {
                handleFileSelect(file);
            }
        });

        fileUploadArea.addEventListener('click', function(e) {
            // 如果点击的是文件input本身，不要重复触发
            if (e.target === workFile) {
                return;
            }
            workFile.click();
        });
    }

    // 处理文件选择
    async function handleFileSelect(file) {
        // 提高文件限制到 2GB (2048MB)，支持大视频上传
        const MAX_SIZE = 2048 * 1024 * 1024;
        
        if (file.size > MAX_SIZE) {
            alert(`文件过大 (${(file.size / 1024 / 1024).toFixed(2)}MB)！当前最大限制为 2GB。`);
            return;
        }


        currentFile = file;
        
        try {
            // 优化：使用 createObjectURL 代替 FileReader，避免大文件读取卡顿
            if (currentObjectUrl) {
                URL.revokeObjectURL(currentObjectUrl);
            }
            currentObjectUrl = URL.createObjectURL(file);
            currentFileData = currentObjectUrl; // 保持变量名兼容
            
            showFilePreview(file, currentFileData);

            // 获取文件尺寸
            if (file.type.startsWith('image/')) {
                const img = new Image();
                img.onload = function() {
                    currentFileDimensions = { width: this.width, height: this.height };
                };
                img.src = currentFileData;
            } else if (file.type.startsWith('video/')) {
                // 视频尺寸将在 generateVideoThumbnail 中获取
            }

            // 如果是视频，尝试生成封面
            if (file.type.startsWith('video/')) {
                generateVideoThumbnail(file).then(blob => {
                    currentCoverBlob = blob;
                }).catch(err => {
                    console.warn('视频封面生成失败:', err);
                    currentCoverBlob = null;
                });
            } else {
                currentCoverBlob = null;
            }
        } catch (error) {
            console.error('文件预览失败:', error);
            alert('文件预览失败，请重试');
        }
    }

    // 显示文件预览
    function showFilePreview(file, fileData) {
        const fileType = FileHandler.getFileType(file);
        
        fileName.textContent = file.name;
        filePreview.style.display = 'block';
        fileUploadArea.style.display = 'none';

        if (fileType === 'image') {
            previewImg.src = fileData;
            previewImg.style.display = 'block';
            previewImg.style.maxHeight = '120px'; // 进一步减小
            previewImg.style.maxWidth = '100%';
            previewImg.style.objectFit = 'contain';
            previewImg.width = 120; // 强制属性
            previewVideo.style.display = 'none';
        } else if (fileType === 'video') {
            previewVideo.src = fileData;
            previewVideo.style.display = 'block';
            previewVideo.style.maxHeight = '120px'; // 进一步减小
            previewVideo.style.maxWidth = '100%';
            previewVideo.style.objectFit = 'contain';
            previewVideo.width = 120; // 强制属性
            previewImg.style.display = 'none';
        } else {
            previewImg.style.display = 'none';
            previewVideo.style.display = 'none';
        }
    }

    // 生成视频封面
    function generateVideoThumbnail(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.muted = true;
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
                video.currentTime = 1; // 尝试截取第1秒
            };
            
            video.onseeked = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    
                    // 存储视频尺寸
                    currentFileDimensions = { width: video.videoWidth, height: video.videoHeight };

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(blob => {
                        resolve(blob);
                        URL.revokeObjectURL(video.src);
                    }, 'image/jpeg', 0.8);
                } catch (e) {
                    reject(e);
                }
            };
            
            video.onerror = (e) => reject(e);
        });
    }

    // 移除文件
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', function() {
            resetUploadForm();
        });
    }

    // 图片压缩函数
    function compressImage(file) {
        return new Promise((resolve, reject) => {
            const maxWidth = 1920;
            const maxHeight = 1080;
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    // 计算缩放比例
                    if (width > maxWidth || height > maxHeight) {
                        if (width / height > maxWidth / maxHeight) {
                            height = Math.round(height * (maxWidth / width));
                            width = maxWidth;
                        } else {
                            width = Math.round(width * (maxHeight / height));
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(blob => {
                        if (!blob) {
                            reject(new Error('Canvas to Blob failed'));
                            return;
                        }
                        // 重建File对象
                        const newFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(newFile);
                    }, 'image/jpeg', 0.8); // 0.8 质量通常足够好且体积小
                };
                img.onerror = error => reject(error);
            };
            reader.onerror = error => reject(error);
        });
    }

    // 重置上传表单
    function resetUploadForm() {
        currentFile = null;
        currentFileData = null;
        if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
            currentObjectUrl = null;
        }
        workFile.value = '';
        document.getElementById('workTitle').value = '';
        document.getElementById('workDesc').value = '';
        filePreview.style.display = 'none';
        fileUploadArea.style.display = 'block';
        previewImg.src = '';
        previewVideo.src = '';
        
        if (progressContainer) {
            progressContainer.style.display = 'none';
            progressBarFill.style.width = '0%';
            progressText.textContent = '0%';
        }
    }

    // 提交上传 - 使用后端API存储
    if (submitUploadBtn && !submitUploadBtn.dataset.eventBound) {
        submitUploadBtn.dataset.eventBound = 'true';
        submitUploadBtn.addEventListener('click', async function() {
            const title = document.getElementById('workTitle').value.trim();
            const description = document.getElementById('workDesc').value.trim();

            if (!title) {
                alert('请输入作品标题');
                return;
            }

            if (!currentFile || !currentFileData) {
                alert('请选择要上传的文件');
                return;
            }

            // 检查是否已登录
            if (!API.isLoggedIn()) {
                alert('请先登录管理员账号');
                return;
            }

            try {
                // 显示上传中提示
                if (currentFile.size > 5 * 1024 * 1024) {
                    submitUploadBtn.textContent = '文件较大，正在努力上传中...';
                } else {
                    submitUploadBtn.textContent = '上传中...';
                }
                submitUploadBtn.disabled = true;

                // 大文件警告 (超过 500MB)
                if (currentFile.size > 500 * 1024 * 1024) {
                    const sizeMB = (currentFile.size / (1024 * 1024)).toFixed(2);
                    let fileTypeMsg = '文件';
                    if (currentFile.type.startsWith('video/')) fileTypeMsg = '视频';
                    else if (currentFile.type === 'application/pdf') fileTypeMsg = 'PDF';
                    
                    const proceed = confirm(`当前${fileTypeMsg}较大 (${sizeMB}MB)，上传大文件可能需要较长时间且要求网络稳定。\n\n建议在 Wi-Fi 环境下上传，并确保浏览器不会因长时间不活动而进入休眠。\n\n是否继续上传？`);
                    if (!proceed) {
                        submitUploadBtn.disabled = false;
                        submitUploadBtn.textContent = '上传作品';
                        return;
                    }
                }

                // 图片自动压缩
                if (currentFile.type.startsWith('image/')) {
                    try {
                        submitUploadBtn.textContent = '正在优化图片...';
                        const compressedFile = await compressImage(currentFile);
                        // 如果压缩后更小，则使用压缩后的文件
                        if (compressedFile.size < currentFile.size) {
                            currentFile = compressedFile;
                        }
                    } catch (e) {
                        // 忽略压缩失败，使用原图
                    }
                }

                // 显示进度条
                if (progressContainer) {
                    progressContainer.style.display = 'block';
                    progressBarFill.style.width = '0%';
                    progressText.textContent = '0%';
                }

                // 创建 FormData 对象
                const formData = new FormData();
                formData.append('file', currentFile);
                
                // 添加尺寸信息
                if (currentFileDimensions && currentFileDimensions.width > 0) {
                    formData.append('width', currentFileDimensions.width);
                    formData.append('height', currentFileDimensions.height);
                }

                // 如果有视频封面，一起上传
                if (currentCoverBlob) {
                    formData.append('cover', currentCoverBlob, 'cover.jpg');
                }
                formData.append('title', title);
                formData.append('description', description);

                // 使用后端API上传，带进度回调
                const result = await API.addWork(currentCategory, formData, (percent) => {
                    if (progressBarFill) {
                        progressBarFill.style.width = percent + '%';
                    }
                    if (progressText) {
                        progressText.textContent = percent + '%';
                    }
                });
                
                if (result.success) {
                    // 确保进度条显示100%
                    if (progressBarFill) progressBarFill.style.width = '100%';
                    if (progressText) progressText.textContent = '100%';
                    
                    // 稍微延迟一下，让用户看到100%
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    alert('作品上传成功！');
                    resetUploadForm();
                    loadWorksList();
                    
                    // 返回作品列表页面
                    if (typeof switchPage === 'function') {
                        switchPage('page4');
                    }
                } else {
                    alert('上传失败：' + result.message);
                }

            } catch (error) {
                console.error('上传失败:', error);
                alert('上传失败：' + error.message);
            } finally {
                submitUploadBtn.textContent = '上传作品';
                submitUploadBtn.disabled = false;
                // 上传完成后隐藏进度条（在 resetUploadForm 中已经处理了，但如果失败了也需要处理吗？
                // 失败时不隐藏，让用户看到进度？或者隐藏。通常失败后应该重置或提示。
                // 这里暂时不隐藏，除非成功调用了 resetUploadForm。
                // 如果是失败，用户可能需要重试，保持进度条在失败位置或者隐藏都可以。
                // 为了简单，失败后我们不自动隐藏，让用户决定下一步。
            }
        });
    }

    // 加载作品列表 - 使用后端API
    async function loadWorksList() {
        if (!worksList) return;

        try {
            const result = await API.getWorks(currentCategory);
            const categoryWorks = result.works || [];

            if (categoryWorks.length === 0) {
                worksList.innerHTML = '<div class="empty-state" style="height: 200px;"><p>暂无作品，请上传</p></div>';
                return;
            }

            worksList.innerHTML = categoryWorks.map(work => `
                <div class="work-item" data-id="${work.id || work.work_id}">
                    <div class="work-thumbnail">
                        ${getThumbnailHTML(work)}
                    </div>
                    <div class="work-info">
                        <h4>${work.title}</h4>
                        <p>${work.description || '暂无描述'}</p>
                        <span class="work-date">${new Date(work.uploadTime || work.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="work-actions">
                        <button class="view-work-btn" data-id="${work.id || work.work_id}">查看</button>
                        <button class="delete-work-btn" data-id="${work.id || work.work_id}">删除</button>
                    </div>
                </div>
            `).join('');

            // 绑定查看和删除事件
            document.querySelectorAll('.view-work-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const workId = this.getAttribute('data-id');
                    viewWork(workId);
                });
            });

            document.querySelectorAll('.delete-work-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const workId = this.getAttribute('data-id');
                    deleteWork(workId);
                });
            });
        } catch (error) {
            console.error('加载作品列表失败:', error);
            worksList.innerHTML = '<div class="empty-state"><p>加载失败，请检查网络连接</p></div>';
        }
    }

    // 获取缩略图HTML - 使用后端API数据
    function getThumbnailHTML(work) {
        // 优先使用 fileUrl，如果没有则回退到拼接路径
        const fileSrc = work.fileUrl || ('/uploads/' + work.category + '/' + work.file_path);
        
        if (work.file_type.startsWith('image')) {
            return `<img src="${fileSrc}" alt="${work.title}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
        } else if (work.file_type.startsWith('video')) {
            if (work.coverUrl) {
                return `
                    <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000;">
                        <img src="${work.coverUrl}" alt="${work.title}" style="max-width:100%; max-height:100%; object-fit:contain;">
                        <span style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:24px; color:white; text-shadow:0 2px 4px rgba(0,0,0,0.5);">▶</span>
                    </div>
                `;
            }
            return `<div class="video-thumbnail" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#000; color:white;"><span>▶</span></div>`;
        } else {
            return `<div class="file-thumbnail"><span>📄</span></div>`;
        }
    }

    // 查看作品
    async function viewWork(workId) {
        try {
            const result = await API.getWorks(currentCategory);
            const work = result.works.find(w => (w.work_id || w.id) == workId);
            if (!work) return;

            const fileSrc = work.fileUrl || ('/uploads/' + work.category + '/' + work.file_path);
            const fileType = work.file_type || '';

            if (fileType.startsWith('image/')) {
                showImageModal(fileSrc);
            } else if (fileType.startsWith('video/')) {
                showVideoPlayer(fileSrc);
            } else {
                alert('该文件类型不支持预览');
            }
        } catch (error) {
            console.error('查看作品失败:', error);
        }
    }

    // 删除作品 - 使用localStorage
    async function deleteWork(workId) {
        if (confirm('确定要删除这个作品吗？')) {
            try {
                await API.deleteWork(currentCategory, workId);
                loadWorksList();
            } catch (error) {
                alert('删除失败：' + error.message);
            }
        }
    }

    // 更换头像
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', function() {
            // 检查登录
            if (!API.isLoggedIn()) {
                alert('请先登录管理员账号');
                return;
            }

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async function(e) {
                const file = e.target.files[0];
                if (file) {
                    try {
                        changeAvatarBtn.textContent = '上传中...';
                        changeAvatarBtn.disabled = true;

                        // 尝试压缩图片
                        let uploadFile = file;
                        try {
                            // 简单的压缩逻辑，复用已有的 compressImage 函数
                            if (typeof compressImage === 'function') {
                                uploadFile = await compressImage(file);
                            }
                        } catch (e) {
                            console.warn('图片压缩失败，使用原图', e);
                        }

                        const formData = new FormData();
                        formData.append('avatar', uploadFile);

                        const result = await API.uploadAvatar(formData);
                        
                        if (result.success) {
                            alert('头像更换成功！');
                            // 重新加载个人资料以更新头像
                            loadProfile();
                        } else {
                            alert('头像上传失败: ' + (result.message || '未知错误'));
                        }
                    } catch (error) {
                        console.error('头像上传异常:', error);
                        alert('头像上传失败: ' + error.message);
                    } finally {
                        changeAvatarBtn.textContent = '更换头像';
                        changeAvatarBtn.disabled = false;
                    }
                }
            };
            input.click();
        });
    }

    // 自我介绍视频上传
    const uploadIntroVideoBtn = document.getElementById('uploadIntroVideoBtn');
    const introVideoInput = document.getElementById('introVideoInput');
    
    if (uploadIntroVideoBtn && introVideoInput) {
        uploadIntroVideoBtn.addEventListener('click', () => {
             // 检查登录
            if (!API.isLoggedIn()) {
                alert('请先登录管理员账号');
                return;
            }
            introVideoInput.click();
        });
        
        introVideoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // 提高自我介绍视频限制到 2GB
            if (file.size > 2048 * 1024 * 1024) {
                alert('文件太大，当前最大限制为 2GB');
                return;
            }
            
            try {
                const originalText = uploadIntroVideoBtn.textContent;
                uploadIntroVideoBtn.textContent = '上传中...';
                uploadIntroVideoBtn.disabled = true;
                
                const formData = new FormData();
                formData.append('file', file);
                
                const result = await API.uploadIntroVideo(formData);
                
                if (result.success) {
                    alert('视频上传成功！');
                    loadProfile();
                } else {
                    alert('上传失败: ' + (result.message || '未知错误'));
                }
            } catch (error) {
                console.error('上传异常:', error);
                alert('上传失败: ' + error.message);
            } finally {
                uploadIntroVideoBtn.textContent = '更换自我介绍视频';
                uploadIntroVideoBtn.disabled = false;
                introVideoInput.value = ''; // 清空选择
            }
        });
    }

    // 保存个人资料
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async function() {
            const profile = {
                nickname: nickname.textContent,
                selfIntro: selfIntro.textContent,
                motto: motto.textContent
            };
            
            try {
                const result = await API.updateProfile(profile);
                if (result.success) {
                    alert('个人资料保存成功！');
                }
            } catch (error) {
                alert('保存失败: ' + error.message);
            }
        });
    }

    // 加载个人资料
    async function loadProfile() {
        try {
            const result = await API.getProfile();

            const noVideoPlaceholder = document.getElementById('noVideoPlaceholder');
            const isAdmin = API.isLoggedIn();

            // 设置编辑权限
            if (nickname) nickname.contentEditable = isAdmin;
            if (motto) motto.contentEditable = isAdmin;
            if (selfIntro) selfIntro.contentEditable = isAdmin;
            
            if (saveProfileBtn) saveProfileBtn.style.display = isAdmin ? 'inline-block' : 'none';
            if (changeAvatarBtn) changeAvatarBtn.style.display = isAdmin ? 'flex' : 'none';

            if (result.success) {
                const profile = result.data || result.profile; // 兼容不同格式
                if (nickname) nickname.textContent = profile.nickname;
                if (selfIntro) selfIntro.textContent = profile.selfIntro;
                if (motto) motto.textContent = profile.motto;
                
                // 处理头像显示
                const avatarImg = document.getElementById('avatarImg');
                const avatarPlaceholder = document.querySelector('.avatar-placeholder');
                
                if (profile.avatar && avatarImg) {
                    // 添加时间戳防止缓存
                    const timestamp = new Date().getTime();
                    avatarImg.src = profile.avatar.includes('?') ? 
                        `${profile.avatar}&t=${timestamp}` : 
                        `${profile.avatar}?t=${timestamp}`;
                    avatarImg.style.display = 'block';
                    if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
                } else {
                    if (avatarImg) avatarImg.style.display = 'none';
                    if (avatarPlaceholder) avatarPlaceholder.style.display = 'flex';
                }

                // 处理自我介绍视频显示
                const introVideoContainer = document.getElementById('introVideoContainer');
                const introVideo = document.getElementById('introVideo');
                // uploadIntroVideoBtn already declared above
                // noVideoPlaceholder already declared above
                // isAdmin already declared above

                if (profile.introVideo && introVideo) {
                    introVideoContainer.style.display = 'block';
                    if (noVideoPlaceholder) noVideoPlaceholder.style.display = 'none';
                    
                    // 添加时间戳防止缓存
                    const timestamp = new Date().getTime();
                    const videoSrc = profile.introVideo.includes('?') ? 
                        `${profile.introVideo}&t=${timestamp}` : 
                        `${profile.introVideo}?t=${timestamp}`;
                    
                    // 只有当源改变时才更新，避免重新加载
                    if (!introVideo.src || !introVideo.src.includes(profile.introVideo)) {
                        introVideo.src = videoSrc;
                        // 尝试自动播放
                        introVideo.play().catch(e => console.log('Autoplay blocked:', e));
                    }
                } else {
                    if (introVideoContainer) introVideoContainer.style.display = 'none';
                    if (noVideoPlaceholder) noVideoPlaceholder.style.display = 'flex';
                }

                // 管理员按钮显示
                if (uploadIntroVideoBtn) {
                    uploadIntroVideoBtn.style.display = isAdmin ? 'inline-block' : 'none';
                    if (isAdmin) {
                         if (!profile.introVideo) {
                             uploadIntroVideoBtn.innerHTML = '<span>📹</span> 上传自我介绍视频';
                         } else {
                             uploadIntroVideoBtn.innerHTML = '<span>📹</span> 更换自我介绍视频';
                         }
                    }
                }
            }
        } catch (error) {
            console.error('加载个人资料失败:', error);
        }
    }

    // 页面切换时加载数据
    const originalSwitchPage = window.switchPage;
    window.switchPage = function(targetPageId) {
        if (originalSwitchPage) {
            originalSwitchPage(targetPageId);
        }
        
        if (targetPageId === 'page2') {
            loadProfile();
        } else if (targetPageId === 'page4') {
            loadWorksList();
        }
    };

    // 初始化加载
    loadProfile();
});