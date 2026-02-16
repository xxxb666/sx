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

    // 上传按钮点击事件已在HTML中绑定

    // 标签切换函数
    window.switchUploadTab = function(category, resetForm = true) {
        uploadTabs.forEach(t => t.classList.remove('active'));
        uploadTabs.forEach(t => {
            if (t.getAttribute('data-tab') === category) {
                t.classList.add('active');
            }
        });
        currentCategory = category;
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
            currentFileData = await FileHandler.fileToBase64(file);
            showFilePreview(file, currentFileData);
        } catch (error) {
            console.error('文件读取失败:', error);
            alert('文件读取失败，请重试');
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

    // 移除文件
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', function() {
            resetUploadForm();
        });
    }

    // 重置上传表单
    function resetUploadForm() {
        currentFile = null;
        currentFileData = null;
        workFile.value = '';
        document.getElementById('workTitle').value = '';
        document.getElementById('workDesc').value = '';
        filePreview.style.display = 'none';
        fileUploadArea.style.display = 'block';
        previewImg.src = '';
        previewVideo.src = '';
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
                submitUploadBtn.textContent = '上传中...';
                submitUploadBtn.disabled = true;

                // 创建 FormData 对象
                const formData = new FormData();
                formData.append('file', currentFile);
                formData.append('title', title);
                formData.append('description', description);

                // 使用后端API上传
                const result = await API.addWork(currentCategory, formData);
                
                if (result.success) {
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