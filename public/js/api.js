// API 配置 - 整合版本
// 清理旧的 localStorage token (迁移到 sessionStorage)
try {
    if (localStorage.getItem('adminToken')) {
        localStorage.removeItem('adminToken');
        console.log('已清除旧的 localStorage token');
    }
} catch (e) {
    console.warn('清理 localStorage 失败', e);
}

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
        const token = sessionStorage.getItem('adminToken');
        
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
            sessionStorage.removeItem('adminToken');
            
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
        try {
            const data = await this.request(API_CONFIG.getUrl('/auth/login'), {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            
            if (data.token) {
                sessionStorage.setItem('adminToken', data.token);
            }
            
            return data;
        } catch (error) {
            // 模拟环境登录
            if (window.location.protocol === 'file:' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                console.warn('模拟环境：使用模拟登录');
                const mockToken = 'mock_token_' + Date.now();
                sessionStorage.setItem('adminToken', mockToken);
                return { success: true, token: mockToken, message: '模拟登录成功' };
            }
            throw error;
        }
    },

    // 检查是否已登录
    isLoggedIn() {
        return !!sessionStorage.getItem('adminToken');
    },

    // 退出登录
    logout() {
        sessionStorage.removeItem('adminToken');
    },

    // 获取个人资料
    async getProfile() {
        try {
            return await this.request(API_CONFIG.getUrl('/profile'));
        } catch (error) {
            if (typeof MOCK_DATA !== 'undefined' && (window.location.protocol === 'file:' || error.message.includes('Failed to fetch'))) {
                return { success: true, profile: MOCK_DATA.profile };
            }
            throw error;
        }
    },

    // 更新个人资料
    async updateProfile(profile) {
        // 模拟环境
        if (window.location.protocol === 'file:') {
            console.warn('模拟环境：模拟更新个人资料');
            // Update MOCK_DATA
            if (typeof MOCK_DATA !== 'undefined') {
                Object.assign(MOCK_DATA.profile, profile);
            }
            return { success: true, message: '模拟更新成功' };
        }

        return this.request(API_CONFIG.getUrl('/profile'), {
            method: 'PUT',
            body: JSON.stringify(profile)
        });
    },

    // 获取作品 (支持获取所有或按分类获取)
    async getWorks(category = null) {
        try {
            if (category) {
                return await this.request(API_CONFIG.getUrl(`/works/category/${category}`));
            }
            return await this.request(API_CONFIG.getUrl('/works'));
        } catch (error) {
            // 如果请求失败且存在模拟数据，则返回模拟数据
            if (typeof MOCK_DATA !== 'undefined' && (window.location.protocol === 'file:' || error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
                console.warn('API请求失败，使用模拟数据:', category);
                if (category) {
                    return { works: MOCK_DATA.works[category] || [] };
                }
                // 展平所有作品
                const allWorks = Object.values(MOCK_DATA.works).flat();
                return { works: allWorks };
            }
            throw error;
        }
    },

    // 删除作品
    async deleteWork(category, workId) {
        // 如果是模拟数据环境，模拟删除成功
        if (typeof MOCK_DATA !== 'undefined' && window.location.protocol === 'file:') {
            console.warn('模拟环境：删除作品', category, workId);
            return { success: true, message: "模拟删除成功" };
        }
        
        // 如果只传了一个参数，则认为是 workId
        const id = workId || category;
        return this.request(API_CONFIG.getUrl(`/works/${id}`), {
            method: 'DELETE'
        });
    },

    // 上传作品 (支持进度回调)
    addWork(category, formData, onProgress) {
        return new Promise((resolve, reject) => {
            // 模拟环境上传
            if (window.location.protocol === 'file:') {
                console.warn('模拟环境：模拟上传作品', category);
                
                // 模拟进度
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 10;
                    if (onProgress) onProgress(progress);
                    if (progress >= 100) {
                        clearInterval(interval);
                        
                        // Add to MOCK_DATA
                        if (typeof MOCK_DATA !== 'undefined') {
                            const file = formData.get('file');
                            const url = file ? URL.createObjectURL(file) : 'https://placehold.co/600x400?text=New+Work';
                            
                            const newWork = {
                                id: Date.now(),
                                title: formData.get('title') || '新作品',
                                description: formData.get('description') || '',
                                url: url,
                                category: category,
                                createTime: new Date().toISOString()
                            };
                            
                            if (!MOCK_DATA.works[category]) MOCK_DATA.works[category] = [];
                            MOCK_DATA.works[category].unshift(newWork);
                        }
                        
                        resolve({ success: true, message: '模拟上传成功' });
                    }
                }, 100);
                return;
            }

            const xhr = new XMLHttpRequest();
            const url = API_CONFIG.getUrl(`/upload/${category}`);
            const token = sessionStorage.getItem('adminToken');
            
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
                } else if (xhr.status === 401 || xhr.status === 403) {
                    console.warn('API 认证失败 (上传)，清除 Token');
                    sessionStorage.removeItem('adminToken');
                    window.dispatchEvent(new Event('auth:expired'));
                    reject(new Error('登录已过期，请重新登录'));
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
        // 模拟环境
        if (window.location.protocol === 'file:') {
            console.warn('模拟环境：模拟上传头像');
            const file = formData.get('avatar');
            const url = file ? URL.createObjectURL(file) : '';
            if (typeof MOCK_DATA !== 'undefined') {
                MOCK_DATA.profile.avatar = url;
            }
            return { success: true, message: '模拟上传成功', avatar: url };
        }

        const token = sessionStorage.getItem('adminToken');
        const url = API_CONFIG.getUrl ? API_CONFIG.getUrl('/upload/avatar') : '/api/upload/avatar';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: formData
        });
        
        if (response.status === 401 || response.status === 403) {
            console.warn('API 认证失败 (头像)，清除 Token');
            sessionStorage.removeItem('adminToken');
            window.dispatchEvent(new Event('auth:expired'));
            throw new Error('登录已过期，请重新登录');
        }
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '上传失败');
        }
        return data;
    },

    // 上传自我介绍视频
    async uploadIntroVideo(formData) {
        // 模拟环境
        if (window.location.protocol === 'file:') {
            console.warn('模拟环境：模拟上传自我介绍视频');
            const file = formData.get('file');
            const url = file ? URL.createObjectURL(file) : '';
            // Update MOCK_DATA if available
            if (typeof MOCK_DATA !== 'undefined') {
                MOCK_DATA.profile.introVideo = url;
            }
            return { success: true, message: '模拟上传成功', introVideo: url };
        }

        const token = sessionStorage.getItem('adminToken');
        const url = API_CONFIG.getUrl ? API_CONFIG.getUrl('/upload/intro-video') : '/api/upload/intro-video';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: formData
        });
        
        if (response.status === 401 || response.status === 403) {
            console.warn('API 认证失败 (自我介绍视频)，清除 Token');
            sessionStorage.removeItem('adminToken');
            window.dispatchEvent(new Event('auth:expired'));
            throw new Error('登录已过期，请重新登录');
        }
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || '上传失败');
        }
        return data;
    }
};
