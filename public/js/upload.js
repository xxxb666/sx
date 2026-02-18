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
        const validation = FileHandler.validateFile(file, {
            maxSize: 500 * 1024 * 1024, // 500MB
            allowedTypes: []
        });

        if (!validation.valid) {
            alert(validation.error);
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
                    console.log('图片尺寸:', currentFileDimensions);
                };
                img.src = currentFileData;
            } else if (file.type.startsWith('video/')) {
                // 视频尺寸将在 generateVideoThumbnail 中获取
            }

            // 如果是视频，尝试生成封面
            if (file.type.startsWith('video/')) {
                generateVideoThumbnail(file).then(blob => {
                    currentCoverBlob = blob;
                    console.log('视频封面生成成功');
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
            previewVideo.style.display = 'none';
        } else if (fileType === 'video') {
            previewVideo.src = fileData;
            previewVideo.style.display = 'block';
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

                // 大文件警告 (超过100MB)
                if (currentFile.size > 100 * 1024 * 1024) {
                    const sizeMB = (currentFile.size / (1024 * 1024)).toFixed(2);
                    let fileTypeMsg = '文件';
                    if (currentFile.type.startsWith('video/')) fileTypeMsg = '视频';
                    else if (currentFile.type === 'application/pdf') fileTypeMsg = 'PDF';
                    
                    const proceed = confirm(`当前${fileTypeMsg}较大 (${sizeMB}MB)，上传可能需要较长时间。\n\n建议您先压缩文件到 100MB 以内再上传，可以显著提高上传速度和成功率。\n\n是否仍要继续上传原始文件？`);
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
                worksList.innerHTML = '<p class="no-works">暂无作品，请上传</p>';
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
            worksList.innerHTML = '<p class="no-works">加载失败，请检查网络连接</p>';
        }
    }

    // 获取缩略图HTML - 使用后端API数据
    function getThumbnailHTML(work) {
        // 优先使用 fileUrl，如果没有则回退到拼接路径
        const fileSrc = work.fileUrl || ('/uploads/' + work.category + '/' + work.file_path);
        
        if (work.file_type.startsWith('image')) {
            return `<img src="${fileSrc}" alt="${work.title}">`;
        } else if (work.file_type.startsWith('video')) {
            if (work.coverUrl) {
                return `
                    <div style="position: relative; width: 100%; height: 100%;">
                        <img src="${work.coverUrl}" alt="${work.title}" style="width:100%;height:100%;object-fit:cover;">
                        <span style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:32px; color:white; text-shadow:0 2px 4px rgba(0,0,0,0.5);">▶</span>
                    </div>
                `;
            }
            return `<div class="video-thumbnail"><span>▶</span></div>`;
        } else {
            return `<div class="file-thumbnail"><span>📄</span></div>`;
        }
    }

    // 查看作品
    async function viewWork(workId) {
        try {
            const result = await API.getWorks(currentCategory);
            const work = result.works.find(w => w.work_id === workId);
            if (!work) return;

            const fileSrc = work.fileUrl || ('/uploads/' + work.category + '/' + work.file_path);

            if (work.file_type.startsWith('image/')) {
                showImageModal(fileSrc);
            } else if (work.file_type.startsWith('video/')) {
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
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async function(e) {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const fileData = await FileHandler.fileToBase64(file);
                        avatarImg.src = fileData;
                    } catch (error) {
                        alert('头像上传失败');
                    }
                }
            };
            input.click();
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
            if (result.success) {
                const profile = result.profile;
                if (nickname) nickname.textContent = profile.nickname;
                if (selfIntro) selfIntro.textContent = profile.selfIntro;
                if (motto) motto.textContent = profile.motto;
                if (avatarImg && profile.avatar) avatarImg.src = profile.avatar;
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