// 工具类
const FileHandler = {
    // 验证文件
    validateFile(file, options = {}) {
        const { maxSize = 50 * 1024 * 1024, allowedTypes = [] } = options;
        
        if (!file) {
            return { valid: false, error: '未选择文件' };
        }

        if (file.size > maxSize) {
            return { valid: false, error: `文件大小超过限制 (${Math.round(maxSize / 1024 / 1024)}MB)` };
        }

        if (allowedTypes.length > 0) {
            const fileType = file.type;
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            
            // 检查MIME类型或扩展名
            const isValidType = allowedTypes.some(type => {
                if (type.startsWith('.')) {
                    return ext === type.toLowerCase();
                }
                if (type.endsWith('/*')) {
                    const baseType = type.split('/')[0];
                    return fileType.startsWith(baseType + '/');
                }
                return fileType === type;
            });

            if (!isValidType) {
                return { valid: false, error: '不支持的文件类型' };
            }
        }

        return { valid: true };
    },

    // 文件转Base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    // 获取文件类型
    getFileType(file) {
        if (!file) return 'unknown';
        
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type === 'application/pdf') return 'pdf';
        
        // 检查扩展名
        const name = file.name.toLowerCase();
        if (name.endsWith('.ppt') || name.endsWith('.pptx')) return 'ppt';
        
        return 'other';
    }
};

// 导出到全局
window.FileHandler = FileHandler;
