// API 配置 - 整合版本
const API_CONFIG = {
    // 根据环境自动切换 API 基础路径
    // 如果在 Zeabur 部署，前端和后端通常在同一个域名下，使用相对路径即可
    BASE_URL: window.location.origin.includes('localhost') ? '/api' : '/api',
    
    // 获取完整URL
    getUrl(endpoint) {
        // 如果是生产环境，确保使用相对路径以避免 CORS 问题
        return '/api' + endpoint;
    }
};

// API 请求工具
const API = {
    // 通用请求方法
    async request(url, options = {}) {
        const token = localStorage.getItem('adminToken');
        
        // 默认头部
        const headers = {
            ...(token && { 'Authorization': `Bearer ${token}` })
        };

        // 如果不是 FormData，则默认 Content-Type 为 application/json
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        const defaultOptions = {
            headers: {
                ...headers,
                ...options.headers // 允许覆盖
            }
        };
        
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        // 处理 401/403 错误 (Token 无效或过期)，但排除登录接口本身的 401
        if ((response.status === 401 || response.status === 403) && !url.includes('/auth/login')) {
            console.warn('API 认证失败，清除 Token');
            localStorage.removeItem('adminToken');
            
            // 触发自定义事件，让 UI 处理，而不是强制刷新页面
            window.dispatchEvent(new Event('auth:expired'));
            
            throw new Error('登录已过期');
        }

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '请求失败');
        }
        
        return data;
    },

    // 登录
    async login(username, password) {
        const data = await this.request(API_CONFIG.getUrl('/auth/login'), {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (data.token) {
            localStorage.setItem('adminToken', data.token);
        }
        
        return data;
    },

    // 检查是否已登录
    isLoggedIn() {
        return !!localStorage.getItem('adminToken');
    },

    // 退出登录
    logout() {
        localStorage.removeItem('adminToken');
    },

    // 获取个人资料
    async getProfile() {
        return this.request(API_CONFIG.getUrl('/profile'));
    },

    // 更新个人资料
    async updateProfile(profile) {
        return this.request(API_CONFIG.getUrl('/profile'), {
            method: 'PUT',
            body: JSON.stringify(profile)
        });
    },

    // 获取作品 (支持获取所有或按分类获取)
    async getWorks(category = null) {
        if (category) {
            return this.request(API_CONFIG.getUrl(`/works/category/${category}`));
        }
        return this.request(API_CONFIG.getUrl('/works'));
    },

    // 删除作品
    async deleteWork(category, workId) {
        // 如果只传了一个参数，则认为是 workId
        const id = workId || category;
        return this.request(API_CONFIG.getUrl(`/works/${id}`), {
            method: 'DELETE'
        });
    },

    // 上传作品 (支持进度回调)
    addWork(category, formData, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = API_CONFIG.getUrl(`/upload/${category}`);
            const token = localStorage.getItem('adminToken');
            
            xhr.open('POST', url);
            
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            
            if (onProgress) {
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100);
                        onProgress(percentComplete);
                    }
                };
            }
            
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        reject(new Error('无法解析服务器响应'));
                    }
                } else {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        reject(new Error(response.message || '上传失败'));
                    } catch (e) {
                        reject(new Error(`上传失败: ${xhr.status} ${xhr.statusText}`));
                    }
                }
            };
            
            xhr.onerror = () => {
                reject(new Error('网络错误'));
            };
            
            xhr.send(formData);
        });
    },

    // 上传头像
    async uploadAvatar(formData) {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(API_CONFIG.getUrl('/upload/avatar'), {
            method: 'POST',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '上传失败');
        }
        
        return data;
    }
};
