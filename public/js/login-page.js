document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    // 检查是否已经登录，如果已登录直接跳转
    checkIfAlreadyLoggedIn();

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            showError('请输入用户名和密码');
            return;
        }

        // 开始加载
        setLoading(true);
        hideError();

        try {
            // 使用 API.login
            const result = await API.login(username, password);
            
            if (result.success) {
                // 登录成功
                showSuccess('登录成功，正在跳转...');
                
                // 延迟跳转，让用户看到成功提示
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                showError(result.message || '登录失败，请检查账号密码');
                setLoading(false);
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('登录请求失败，请稍后重试');
            setLoading(false);
        }
    });

    // 输入框聚焦时隐藏错误
    usernameInput.addEventListener('input', hideError);
    passwordInput.addEventListener('input', hideError);

    function setLoading(isLoading) {
        if (isLoading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
            usernameInput.disabled = true;
            passwordInput.disabled = true;
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
            usernameInput.disabled = false;
            passwordInput.disabled = false;
        }
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
        errorMessage.style.color = 'var(--error-color)';
        errorMessage.style.background = '#fff0f0';
        errorMessage.style.borderColor = '#ffccc7';
        
        // 抖动效果
        const card = document.querySelector('.login-card');
        card.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            card.style.animation = '';
        }, 500);
    }
    
    function showSuccess(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
        errorMessage.style.color = '#52c41a';
        errorMessage.style.background = '#f6ffed';
        errorMessage.style.borderColor = '#b7eb8f';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    async function checkIfAlreadyLoggedIn() {
        if (API.isLoggedIn()) {
            // 验证 token 是否有效
            try {
                // 尝试获取一个需要权限的接口，或者简单假设 token 有效
                // 这里我们直接跳转，因为 API.isLoggedIn 只是检查 sessionStorage
                window.location.href = 'index.html';
            } catch (e) {
                // token 无效，留在这里
                API.logout();
            }
        }
    }
});

// 添加抖动动画
const style = document.createElement('style');
style.innerHTML = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
}
`;
document.head.appendChild(style);