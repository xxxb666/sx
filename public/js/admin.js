// 管理员功能模块
(function() {
    // 使用后端API验证，不再使用本地配置
    
    // 当前登录状态
    let isAdminLoggedIn = false;
    let currentAdminTab = 'all';

    // 全局函数：检查是否是管理员
    window.isAdmin = function() {
        return API.isLoggedIn();
    };

    // 全局函数：获取所有作品数量
    window.getTotalWorksCount = async function() {
        try {
            const result = await API.getWorks();
            return (result.works || []).length;
        } catch (error) {
            console.error('获取作品数量失败:', error);
            return 0;
        }
    };

    // DOM 元素
    const adminEntryBtn = document.getElementById('secureEntryBtn') || document.getElementById('adminEntryBtn');
    const adminLoginModal = document.getElementById('adminLoginModal');
    const adminPanel = document.getElementById('adminPanel');
    // 修改为新的ID
    const adminUsername = document.getElementById('ipt_u_secure');
    const adminPassword = document.getElementById('ipt_p_secure');
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminCancelBtn = document.getElementById('adminCancelBtn');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const adminBackBtn = document.getElementById('adminBackBtn');
    const adminUploadBtn = document.getElementById('adminUploadBtn');
    const adminLoginError = document.getElementById('adminLoginError');
    const adminWorksList = document.getElementById('adminWorksList');
    const selectAllCheckbox = document.getElementById('selectAllWorks');
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    const selectedCountSpan = document.getElementById('selectedCount');

    // 初始化
    function init() {
        bindEvents();
        checkLoginStatus();
        initBatchActions();
        
        // 检查URL参数，如果是从登录页跳转回来的
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('login_success') === '1' && isAdminLoggedIn) {
            // 不自动打开面板，仅清除URL参数，保持地址栏干净
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // 监听认证过期事件
        window.addEventListener('auth:expired', function() {
            if (isAdminLoggedIn) {
                console.log('收到认证过期事件，执行登出');
                // 此时 token 已经被 api.js 移除了，我们只需要更新 UI
                isAdminLoggedIn = false;
                updateAdminUI();
                
                // 显示提示并弹出登录框
                alert('登录已过期，请重新登录');
                showLoginModal();
            }
        });
    }

    // 绑定事件
    function bindEvents() {
        // 管理员入口按钮
        if (adminEntryBtn) {
            adminEntryBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (isAdminLoggedIn) {
                    // 已登录状态下点击直接打开管理面板
                    showAdminPanel();
                } else {
                    showLoginModal();
                }
            });
        }

        // 登录按钮
        if (adminLoginBtn) {
            adminLoginBtn.addEventListener('click', handleLogin);
        }

        // 取消按钮
        if (adminCancelBtn) {
            adminCancelBtn.addEventListener('click', hideLoginModal);
        }

        // 退出登录
        if (adminLogoutBtn) {
            adminLogoutBtn.addEventListener('click', function() {
                if (confirm('是否退出管理员账号？')) {
                    handleLogout();
                }
            });
        }

        // 返回按钮
        if (adminBackBtn) {
            adminBackBtn.addEventListener('click', hideAdminPanel);
        }

        // 上传作品按钮
        if (adminUploadBtn) {
            adminUploadBtn.addEventListener('click', function() {
                hideAdminPanel();
                if (typeof window.switchPage === 'function') {
                    window.switchPage('page4');
                }
            });
        }

        // 点击遮罩关闭
        if (adminLoginModal) {
            adminLoginModal.addEventListener('click', function(e) {
                if (e.target === adminLoginModal) {
                    hideLoginModal();
                }
            });
        }

        // 回车登录
        if (adminPassword) {
            adminPassword.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleLogin();
                }
            });
        }

        // Tab切换
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                const category = this.getAttribute('data-tab');
                switchAdminTab(category);
            });
        });
    }

    // 处理登录
    async function handleLogin() {
        const username = adminUsername.value.trim();
        const password = adminPassword.value.trim();

        if (!username || !password) {
            showLoginError('请输入用户名和密码');
            return;
        }

        try {
            const result = await API.login(username, password);
            if (result.success) {
                isAdminLoggedIn = true;
                hideLoginModal();
                clearLoginForm();
                // 登录成功后跳转到首页
                if (typeof window.switchPage === 'function') {
                    window.switchPage('page1');
                }
            } else {
                showLoginError(result.message || '登录失败');
            }
        } catch (error) {
            showLoginError('登录失败：' + error.message);
        }
    }

    // 处理退出
    function handleLogout() {
        isAdminLoggedIn = false;
        API.logout();
        hideAdminPanel();
        alert('已退出管理员账号');
    }

    // 检查登录状态
    function checkLoginStatus() {
        if (API.isLoggedIn()) {
            isAdminLoggedIn = true;
        }
    }

    // 显示登录弹窗
    function showLoginModal() {
        window.location.href = 'login.html';
    }

    // 隐藏登录弹窗
    function hideLoginModal() {
        if (adminLoginModal) {
            adminLoginModal.style.display = 'none';
            clearLoginError();
        }
    }

    // 显示管理面板
    function showAdminPanel() {
        if (adminPanel) {
            adminPanel.style.display = 'block';
            loadAdminWorksList();
        }
    }

    // 隐藏管理面板
    function hideAdminPanel() {
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
    }

    // 显示登录错误
    function showLoginError(message) {
        if (adminLoginError) {
            adminLoginError.textContent = message;
            adminLoginError.style.display = 'block';
        }
    }

    // 清除登录错误
    function clearLoginError() {
        if (adminLoginError) {
            adminLoginError.textContent = '';
            adminLoginError.style.display = 'none';
        }
    }

    // 清除登录表单
    function clearLoginForm() {
        if (adminUsername) adminUsername.value = '';
        if (adminPassword) adminPassword.value = '';
        clearLoginError();
    }

    // 切换管理Tab
    function switchAdminTab(category) {
        currentAdminTab = category;
        
        // 更新Tab样式
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === category) {
                tab.classList.add('active');
            }
        });

        // 加载对应分类的作品
        loadAdminWorksList();
    }

    // 批量操作初始化
    function initBatchActions() {
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                const checkboxes = adminWorksList.querySelectorAll('.work-checkbox');
                checkboxes.forEach(cb => {
                    cb.checked = this.checked;
                });
                updateBatchUI();
            });
        }

        if (batchDeleteBtn) {
            batchDeleteBtn.addEventListener('click', batchDeleteWorks);
        }
        
        // 使用事件委托处理复选框点击
        if (adminWorksList) {
            adminWorksList.addEventListener('change', function(e) {
                if (e.target.classList.contains('work-checkbox')) {
                    updateBatchUI();
                }
            });
        }
    }

    // 更新批量操作UI状态
    function updateBatchUI() {
        if (!adminWorksList || !batchDeleteBtn || !selectedCountSpan) return;
        
        const checkboxes = adminWorksList.querySelectorAll('.work-checkbox:checked');
        const count = checkboxes.length;
        const total = adminWorksList.querySelectorAll('.work-checkbox').length;
        
        selectedCountSpan.textContent = `已选择 ${count} 项`;
        
        if (count > 0) {
            batchDeleteBtn.disabled = false;
            batchDeleteBtn.style.opacity = '1';
            batchDeleteBtn.style.pointerEvents = 'auto';
            batchDeleteBtn.textContent = `批量删除 (${count})`;
        } else {
            batchDeleteBtn.disabled = true;
            batchDeleteBtn.style.opacity = '0.5';
            batchDeleteBtn.style.pointerEvents = 'none';
            batchDeleteBtn.textContent = '批量删除';
        }
        
        // 更新全选框状态
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = total > 0 && count === total;
            selectAllCheckbox.indeterminate = count > 0 && count < total;
        }
    }

    // 批量删除作品
    async function batchDeleteWorks() {
        const checkboxes = adminWorksList.querySelectorAll('.work-checkbox:checked');
        const count = checkboxes.length;
        
        if (count === 0) return;
        
        if (!confirm(`确定要删除选中的 ${count} 个作品吗？此操作不可恢复！`)) {
            return;
        }
        
        batchDeleteBtn.disabled = true;
        batchDeleteBtn.textContent = '删除中...';
        
        let successCount = 0;
        let failCount = 0;
        
        // 将 NodeList 转换为数组以便处理
        const items = Array.from(checkboxes);
        
        // 并行删除，限制并发数为 3 以避免过载
        // 或者简单地串行删除，更安全
        for (const cb of items) {
            const workId = cb.value;
            const category = cb.getAttribute('data-category');
            
            try {
                await API.deleteWork(category, workId);
                successCount++;
                // 可以在这里更新UI，移除已删除的项目，或者最后重新加载列表
                const item = cb.closest('.admin-work-item');
                if (item) {
                    item.style.opacity = '0.3';
                }
            } catch (error) {
                console.error(`删除作品 ${workId} 失败:`, error);
                failCount++;
            }
        }
        
        alert(`批量删除完成\n成功: ${successCount}\n失败: ${failCount}`);
        loadAdminWorksList();
    }

    // 加载管理员作品列表
    async function loadAdminWorksList() {
        if (!adminWorksList) return;

        try {
            const result = await API.getWorks();
            const works = result.works || [];
            let categoryWorks = [];
            
            if (currentAdminTab === 'all') {
                categoryWorks = works;
                // 按时间排序
                categoryWorks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            } else {
                categoryWorks = works.filter(w => w.category === currentAdminTab);
            }

            if (categoryWorks.length === 0) {
                adminWorksList.innerHTML = '<p class="admin-empty">该分类暂无作品</p>';
                return;
            }

            adminWorksList.innerHTML = categoryWorks.map(work => `
                <div class="admin-work-item" data-id="${work.work_id}" data-category="${work.category}">
                    <div class="admin-checkbox-wrapper">
                        <input type="checkbox" class="work-checkbox" value="${work.work_id}" data-category="${work.category}">
                    </div>
                    <div class="admin-work-thumbnail">
                        ${getAdminThumbnailHTML(work)}
                    </div>
                    <div class="admin-work-info">
                        <h4 class="admin-work-title">${work.title}</h4>
                        <p class="admin-work-desc">${work.description || '暂无描述'}</p>
                        <div class="admin-work-meta">
                            <span class="admin-work-date">${new Date(work.created_at).toLocaleDateString()}</span>
                            <span class="admin-work-tag">${getCategoryName(work.category)}</span>
                        </div>
                    </div>
                    <div class="admin-work-actions">
                        <button class="admin-btn admin-view-btn" data-id="${work.work_id}" data-category="${work.category}">查看</button>
                        <button class="admin-btn admin-delete-btn" data-id="${work.work_id}" data-category="${work.category}">删除</button>
                    </div>
                </div>
            `).join('');

            // 重置全选状态
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
                updateBatchUI();
            }

            // 绑定事件 (已在 init 中处理或通过事件委托)
        } catch (error) {
            console.error('加载作品列表失败:', error);
            adminWorksList.innerHTML = '<p class="admin-error">加载失败，请重试</p>';
        }
    }

    // 获取分类名称
    function getCategoryName(category) {
        const names = {
            'painting': '绘画作品',
            'dance': '舞蹈视频',
            'ai': 'AI作品',
            'honor': '荣誉墙',
            'ppt': 'PPT展示'
        };
        return names[category] || category;
    }

    // 获取缩略图HTML
    function getAdminThumbnailHTML(work) {
        if (work.file_type && work.file_type.startsWith('image/')) {
            return `<img src="${'/uploads/' + work.category + '/' + work.file_path}" alt="${work.title}" style="width: 80px; height: 80px; object-fit: contain; background: #000; border-radius: 4px;">`;
        } else if (work.file_type && work.file_type.startsWith('video/')) {
            return `<div class="admin-video-thumbnail" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; background: #000; border-radius: 4px;"><span style="color: #fff; font-size: 24px;">▶</span></div>`;
        } else {
            return `<div class="admin-file-thumbnail" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; background: #f0f0f0; border-radius: 4px;"><span style="font-size: 24px;">📄</span></div>`;
        }
    }

    // 管理员查看作品
    async function viewWorkAsAdmin(workId, category) {
        try {
            const result = await API.getWorks();
            const work = result.works.find(w => w.work_id === workId);
            if (!work) return;

            if (work.file_type.startsWith('image/')) {
                const modal = document.getElementById('imageModal');
                if (modal) {
                    const img = modal.querySelector('img');
                    img.src = '/uploads/' + work.category + '/' + work.file_path;
                    modal.classList.add('active');
                }
            } else if (work.file_type.startsWith('video/')) {
                const player = document.getElementById('videoPlayer');
                if (player) {
                    const video = player.querySelector('video');
                    video.src = '/uploads/' + work.category + '/' + work.file_path;
                    player.classList.add('active');
                    video.play();
                }
            }
        } catch (error) {
            alert('查看失败');
        }
    }

    // 管理员删除作品
    async function deleteWorkAsAdmin(workId, category) {
        if (confirm('确定要删除这个作品吗？')) {
            try {
                await API.deleteWork(category, workId);
                alert('删除成功');
                loadAdminWorksList();
            } catch (error) {
                alert('删除失败: ' + error.message);
            }
        }
    }

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
