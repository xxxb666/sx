/**
 * 快速上传功能模块
 * 用于在当前页面直接弹出上传窗口，无需跳转
 */

(function() {
    // 状态变量
    let currentFile = null;
    let currentCategory = 'ai';
    let currentDimensions = { width: 0, height: 0 };
    let currentCoverBlob = null; // 视频封面

    // 初始化
    function init() {
        createModalHTML();
        bindEvents();
    }

    // 创建模态框HTML结构
    function createModalHTML() {
        const modalHTML = `
            <div id="quickUploadModal" class="quick-upload-modal">
                <div class="quick-upload-content">
                    <div class="quick-upload-header">
                        <h3 id="quickModalTitle">上传作品</h3>
                        <button class="close-btn" id="closeQuickUploadBtn">&times;</button>
                    </div>
                    <div class="quick-upload-body">
                        <div class="file-preview-area" id="quickPreviewArea">
                            <span style="color: #ffb7c5; font-size: 14px;">预览区域</span>
                        </div>
                        <div class="quick-form-group">
                            <input type="text" id="quickWorkTitle" placeholder="给作品起个好听的名字吧 (必填)">
                        </div>
                        <div class="quick-form-group">
                            <textarea id="quickWorkDesc" placeholder="说说这个作品的故事... (可选)" rows="3"></textarea>
                        </div>
                        <div class="quick-progress-container" id="quickProgressContainer">
                            <div class="quick-progress-bar">
                                <div class="quick-progress-fill" id="quickProgressFill"></div>
                            </div>
                            <span class="quick-progress-text" id="quickProgressText">0%</span>
                        </div>
                    </div>
                    <div class="quick-upload-footer">
                        <button class="btn-cancel" id="cancelQuickUploadBtn">取消</button>
                        <button class="btn-confirm" id="confirmQuickUploadBtn">确认上传</button>
                        <button class="btn-confirm" id="continueQuickUploadBtn" style="display: none;">继续上传</button>
                    </div>
                </div>
            </div>
            <input type="file" id="quickFileInput" style="display: none;">
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 绑定事件
    function bindEvents() {
        const fileInput = document.getElementById('quickFileInput');
        const closeBtn = document.getElementById('closeQuickUploadBtn');
        const cancelBtn = document.getElementById('cancelQuickUploadBtn');
        const confirmBtn = document.getElementById('confirmQuickUploadBtn');
        const continueBtn = document.getElementById('continueQuickUploadBtn');
        const modal = document.getElementById('quickUploadModal');

        // 文件选择变化
        fileInput.addEventListener('change', handleFileSelect);

        // 关闭/取消
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        // 确认上传
        confirmBtn.addEventListener('click', uploadWork);

        // 继续上传
        continueBtn.addEventListener('click', () => {
             // 重置状态变量
             currentFile = null;
             currentCoverBlob = null;
             currentDimensions = { width: 0, height: 0 };
             fileInput.value = ''; // 清空文件选择，确保能重复选同名文件

             // 重置UI并重新触发文件选择
             document.getElementById('quickWorkTitle').value = '';
             document.getElementById('quickWorkDesc').value = '';
             document.getElementById('quickPreviewArea').innerHTML = '<span style="color: #ffb7c5; font-size: 14px; cursor: pointer;">点击此处选择文件</span>';
             document.getElementById('quickProgressContainer').style.display = 'none';
             document.getElementById('quickProgressFill').style.width = '0%';
             document.getElementById('quickProgressText').textContent = '0%';
             
             // 切换按钮状态
             document.getElementById('confirmQuickUploadBtn').style.display = 'inline-block';
             document.getElementById('continueQuickUploadBtn').style.display = 'none';
             document.getElementById('cancelQuickUploadBtn').textContent = '取消';
             document.getElementById('confirmQuickUploadBtn').disabled = false;
             document.getElementById('confirmQuickUploadBtn').textContent = '确认上传';
             
             // 触发文件选择
             fileInput.click();
        });

        // 点击预览区域也可以选择文件
        document.getElementById('quickPreviewArea').addEventListener('click', () => {
            // 只有在没有文件被选中（或者是预览区域显示提示文字）时才触发
            // 或者允许随时点击更换文件
            if (!currentFile || document.getElementById('continueQuickUploadBtn').style.display === 'none') {
                fileInput.click();
            }
        });

        // 点击模态框背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // 打开快速上传
    window.openQuickUpload = function(category, acceptType) {
        currentCategory = category;
        const fileInput = document.getElementById('quickFileInput');
        
        // 设置接受的文件类型
        if (acceptType) {
            fileInput.accept = acceptType;
        } else {
            fileInput.accept = 'image/*,video/*';
        }

        // 触发文件选择
        fileInput.click();
    };

    // 处理文件选择
    async function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // 检查文件大小 (100MB)
        const MAX_SIZE = 100 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            alert(`文件过大 (${(file.size / 1024 / 1024).toFixed(2)}MB)！请上传小于 100MB 的文件以避免网络超时。`);
            e.target.value = ''; // 清空选择
            return;
        }

        currentFile = file;
        
        // 显示模态框
        const modal = document.getElementById('quickUploadModal');
        modal.classList.add('active');
        
        // 重置表单
        document.getElementById('quickWorkTitle').value = ''; 
        document.getElementById('quickWorkDesc').value = '';
        document.getElementById('quickProgressContainer').style.display = 'none';
        document.getElementById('confirmQuickUploadBtn').disabled = false;
        document.getElementById('confirmQuickUploadBtn').textContent = '确认上传';

        // 预览
        const previewArea = document.getElementById('quickPreviewArea');
        previewArea.innerHTML = '<span style="color: #ffb7c5;">正在生成预览...</span>';

        try {
            if (file.type.startsWith('image/')) {
                await showImagePreview(file);
            } else if (file.type.startsWith('video/')) {
                await showVideoPreview(file);
            } else {
                previewArea.innerHTML = `<span style="color: #ff6b9d;">已选择文件: ${file.name}</span>`;
            }
        } catch (err) {
            console.error('预览生成失败:', err);
            previewArea.innerHTML = `<span style="color: red;">预览失败</span>`;
        }
    }

    // 图片预览
    function showImagePreview(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    currentDimensions = { width: img.width, height: img.height };
                    const previewArea = document.getElementById('quickPreviewArea');
                    previewArea.innerHTML = '';
                    previewArea.appendChild(img);
                    resolve();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // 视频预览和封面生成
    function showVideoPreview(file) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.muted = true;
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
                video.currentTime = 1; // 截取第1秒
            };

            video.onseeked = () => {
                // 绘制封面
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                currentDimensions = { width: video.videoWidth, height: video.videoHeight };
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob(blob => {
                    currentCoverBlob = blob;
                    
                    // 显示预览
                    const previewArea = document.getElementById('quickPreviewArea');
                    previewArea.innerHTML = '';
                    // 显示视频元素而不是图片，这样看起来更直观
                    video.controls = true;
                    video.style.maxWidth = '100%';
                    video.style.maxHeight = '100%';
                    previewArea.appendChild(video);
                    
                    resolve();
                }, 'image/jpeg', 0.8);
            };

            video.onerror = reject;
        });
    }

    // 关闭模态框
    function closeModal() {
        const modal = document.getElementById('quickUploadModal');
        modal.classList.remove('active');
        
        // 清理
        currentFile = null;
        currentCoverBlob = null;
        currentDimensions = { width: 0, height: 0 };
        document.getElementById('quickFileInput').value = '';
        document.getElementById('quickPreviewArea').innerHTML = '<span style="color: #ffb7c5; font-size: 14px;">预览区域</span>';
        
        // 重置按钮状态
        document.getElementById('confirmQuickUploadBtn').style.display = 'inline-block';
        document.getElementById('continueQuickUploadBtn').style.display = 'none';
        document.getElementById('cancelQuickUploadBtn').textContent = '取消';
        document.getElementById('confirmQuickUploadBtn').disabled = false;
        document.getElementById('confirmQuickUploadBtn').textContent = '确认上传';
        document.getElementById('quickProgressContainer').style.display = 'none';
    }

    // 上传作品
    async function uploadWork() {
        const title = document.getElementById('quickWorkTitle').value.trim();
        const desc = document.getElementById('quickWorkDesc').value.trim();
        
        if (!title) {
            alert('请输入作品标题');
            return;
        }

        if (!currentFile) {
            alert('请选择文件');
            return;
        }

        const confirmBtn = document.getElementById('confirmQuickUploadBtn');
        const progressContainer = document.getElementById('quickProgressContainer');
        const progressBar = document.getElementById('quickProgressFill');
        const progressText = document.getElementById('quickProgressText');

        confirmBtn.disabled = true;
        confirmBtn.textContent = '正在上传...';
        progressContainer.style.display = 'block';

        // 构造FormData
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('title', title);
        formData.append('description', desc);
        
        if (currentDimensions.width > 0) {
            formData.append('width', currentDimensions.width);
            formData.append('height', currentDimensions.height);
        }

        if (currentCoverBlob) {
            formData.append('cover', currentCoverBlob, 'cover.jpg');
        }

        try {
            // 调用API
            const result = await API.addWork(currentCategory, formData, (percent) => {
                progressBar.style.width = percent + '%';
                progressText.textContent = percent + '%';
            });

            if (result.success) {
                progressBar.style.width = '100%';
                progressText.textContent = '上传成功！';
                
                // 刷新当前页面内容
                if (currentCategory === 'ai' && typeof window.loadAIPage === 'function') {
                    window.loadAIPage();
                } else if (currentCategory === 'dance' && typeof window.loadDancePage === 'function') {
                    window.loadDancePage();
                } else if (currentCategory === 'painting' && typeof window.loadPaintingPage === 'function') {
                    window.loadPaintingPage();
                } else if (currentCategory === 'honor' && typeof window.loadHonorPage === 'function') {
                    window.loadHonorPage();
                } else if (currentCategory === 'ppt' && typeof window.loadPPTPage === 'function') {
                    window.loadPPTPage();
                }
                
                // 切换按钮状态，允许继续上传
                confirmBtn.style.display = 'none';
                const continueBtn = document.getElementById('continueQuickUploadBtn');
                continueBtn.style.display = 'inline-block';
                
                const cancelBtn = document.getElementById('cancelQuickUploadBtn');
                cancelBtn.textContent = '关闭';
                
            } else {
                throw new Error(result.message || '上传失败');
            }
        } catch (err) {
            console.error('上传出错:', err);
            alert('上传出错: ' + err.message);
            confirmBtn.disabled = false;
            confirmBtn.textContent = '重试';
        }
    }

    // 启动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
