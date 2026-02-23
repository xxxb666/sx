const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static');

// 配置 ffmpeg 和 ffprobe 路径
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.SECRET_KEY || 'xiaopao-secret-key-2025';

// 数据文件路径
// 支持通过环境变量配置路径，以便在容器中挂载持久化存储
const DATA_FILE = process.env.DATA_FILE_PATH || path.join(__dirname, 'data.json');
const UPLOADS_DIR = process.env.UPLOADS_DIR_PATH || path.join(__dirname, 'uploads');

console.log('数据文件路径:', DATA_FILE);
console.log('上传目录路径:', UPLOADS_DIR);

// 初始化数据
let db = {
    admin: {
        username: 'admin',
        password: bcrypt.hashSync('admin123', 10)
    },
    profile: {
        nickname: '徐小泡',
        selfIntro: '热爱生活，喜欢创作。在AI艺术、舞蹈、绘画等领域不断探索和学习，用作品记录成长的每一个瞬间。',
        motto: '"每一个不曾起舞的日子，都是对生命的辜负"',
        avatar: null,
        introVideo: null
    },
    works: []
};

// 加载数据
if (fs.existsSync(DATA_FILE)) {
    try {
        const savedData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        db = { ...db, ...savedData };
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

// 保存数据
function saveData() {
    try {
        // 确保数据文件所在目录存在
        const dataDir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
        console.log(`数据已保存到: ${DATA_FILE} (作品数: ${db.works.length})`);
    } catch (error) {
        console.error('保存数据失败:', error);
    }
}

// 创建上传目录
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// 中间件
app.use(cors({
    origin: '*', // 允许所有来源，解决部署后的跨域问题
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 打印请求日志
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// 静态文件服务
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// 文件上传配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const category = req.params.category || 'misc';
        const categoryDir = path.join(UPLOADS_DIR, category);
        if (!fs.existsSync(categoryDir)) {
            fs.mkdirSync(categoryDir, { recursive: true });
        }
        cb(null, categoryDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 500 * 1024 * 1024 } // 500MB 限制
});

// 上传错误处理中间件
const uploadMiddleware = (req, res, next) => {
    const uploadFields = upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'cover', maxCount: 1 }
    ]);

    uploadFields(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer 错误
            console.error('Multer upload error:', err);
            return res.status(400).json({ success: false, message: `上传错误: ${err.message}` });
        } else if (err) {
            // 其他未知错误
            console.error('Unknown upload error:', err);
            return res.status(500).json({ success: false, message: `服务器错误: ${err.message}` });
        }
        // 一切正常
        next();
    });
};

// 认证中间件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: '未提供认证令牌' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: '令牌无效' });
        }
        req.user = user;
        next();
    });
}

// --- API 路由 ---

// 登录
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (username !== db.admin.username) {
            return res.status(401).json({ success: false, message: '用户名或密码错误' });
        }

        const isValid = await bcrypt.compare(password, db.admin.password);
        if (!isValid) {
            return res.status(401).json({ success: false, message: '用户名或密码错误' });
        }

        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
        
        res.json({
            success: true,
            message: '登录成功',
            token,
            user: { username }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: '登录失败' });
    }
});

// 获取个人资料
app.get('/api/profile', (req, res) => {
    res.json({
        success: true,
        profile: db.profile
    });
});

// 更新个人资料
app.put('/api/profile', authenticateToken, (req, res) => {
    const { nickname, selfIntro, motto } = req.body;
    if (nickname) db.profile.nickname = nickname;
    if (selfIntro) db.profile.selfIntro = selfIntro;
    if (motto) db.profile.motto = motto;
    
    saveData();
    res.json({ success: true, message: '个人资料更新成功', profile: db.profile });
});

// 获取所有作品
app.get('/api/works', (req, res) => {
    res.json({
        success: true,
        works: db.works
    });
});

// 按分类获取作品
app.get('/api/works/category/:category', (req, res) => {
    const { category } = req.params;
    const works = db.works.filter(w => w.category === category);
    res.json({
        success: true,
        category: category,
        works: works
    });
});

// 删除作品
app.delete('/api/works/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const index = db.works.findIndex(w => w.work_id === id);

    if (index === -1) {
        return res.status(404).json({ success: false, message: '作品不存在' });
    }

    const work = db.works[index];
    
    if (work.file_path) {
        const filePath = path.join(UPLOADS_DIR, work.category, work.file_path);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (err) {
                console.error('删除文件失败:', err);
            }
        }
    }

    db.works.splice(index, 1);
    saveData();
    res.json({ success: true, message: '作品删除成功' });
});

// 头像上传配置
const avatarUpload = upload.single('avatar');

// 上传头像
app.post('/api/upload/avatar', authenticateToken, avatarUpload, (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '没有上传文件' });
        }
        
        // 文件默认上传到了 uploads/misc/ (因为 req.params.category 未定义)
        const fileUrl = `/uploads/misc/${req.file.filename}`;
        
        // 更新个人资料
        db.profile.avatar = fileUrl;
        saveData();
        
        res.json({
            success: true,
            message: '头像上传成功',
            url: fileUrl,
            avatar: fileUrl
        });
    } catch (error) {
        console.error('头像上传失败:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch(e) {}
        }
        res.status(500).json({ success: false, message: '上传失败' });
    }
});

// 自我介绍视频上传配置
const introVideoUpload = upload.single('introVideo');

// 上传自我介绍视频
app.post('/api/upload/intro-video', authenticateToken, introVideoUpload, (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '没有上传文件' });
        }
        
        // 文件默认上传到了 uploads/misc/ (因为 req.params.category 未定义)
        const fileUrl = `/uploads/misc/${req.file.filename}`;
        
        // 如果已有视频，删除旧视频
        if (db.profile.introVideo) {
            const oldPath = path.join(UPLOADS_DIR, 'misc', path.basename(db.profile.introVideo));
            if (fs.existsSync(oldPath)) {
                try { fs.unlinkSync(oldPath); } catch(e) {}
            }
        }
        
        // 更新个人资料
        db.profile.introVideo = fileUrl;
        saveData();
        
        res.json({
            success: true,
            message: '自我介绍视频上传成功',
            url: fileUrl,
            introVideo: fileUrl
        });
    } catch (error) {
        console.error('视频上传失败:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch(e) {}
        }
        res.status(500).json({ success: false, message: '上传失败' });
    }
});

// 视频压缩辅助函数
const compressVideo = (inputPath, outputPath, targetSizeMB) => {
    return new Promise((resolve, reject) => {
        // 获取视频元数据
        ffmpeg.ffprobe(inputPath, (err, metadata) => {
            if (err) return reject(err);
            
            const duration = metadata.format.duration;
            if (!duration) return reject(new Error('无法获取视频时长'));
            
            // 计算目标比特率 (bits/s)
            // 目标大小 (bits) = 时长 (s) * (视频码率 + 音频码率)
            // 音频码率假设为 128k (128000 bits/s)
            const targetSizeBits = targetSizeMB * 8 * 1024 * 1024;
            const audioBitrate = 128000;
            
            // 计算视频码率 = (总大小 / 时长) - 音频码率
            let videoBitrate = Math.floor((targetSizeBits / duration) - audioBitrate);
            
            // 设置最小视频码率保护 (例如 500k)，避免画质过差
            // 如果计算出的码率太低，可能无法压缩到目标大小，但至少保证能看
            if (videoBitrate < 500000) {
                console.warn(`计算出的码率 (${Math.round(videoBitrate/1000)}k) 过低，使用最低码率 500k`);
                videoBitrate = 500000;
            }
            
            console.log(`开始压缩视频: 时长=${duration}s, 目标=${targetSizeMB}MB, 视频码率=${Math.round(videoBitrate/1000)}k`);

            ffmpeg(inputPath)
                .output(outputPath)
                .videoCodec('libx264')
                .audioCodec('aac')
                .audioBitrate('128k')
                .videoBitrate(Math.round(videoBitrate / 1000) + 'k') // fluent-ffmpeg 接受 '1000k' 格式
                .outputOptions([
                    '-preset fast', // 快速编码预设
                    '-movflags +faststart', // 使得视频可以在网页上边下边播
                    '-crf 23' // 配合 bitrate 使用，限制最大质量开销，也可以只用 bitrate
                ])
                // 注意：指定了 bitrate 后 CRF 可能被忽略或作为上限，这里主要依赖 bitrate
                .on('end', () => {
                    console.log('视频压缩完成');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('视频压缩出错:', err);
                    reject(err);
                })
                .run();
        });
    });
};

// 上传作品
// 支持上传文件和封面图
// 使用自定义中间件处理上传错误
app.post('/api/upload/:category', authenticateToken, uploadMiddleware, async (req, res) => {
    try {
        const { category } = req.params;
        const { title, description, width, height } = req.body;

        if (!req.files || !req.files['file']) {
            return res.status(400).json({ success: false, message: '没有上传文件' });
        }

        let file = req.files['file'][0];
        const cover = req.files['cover'] ? req.files['cover'][0] : null;

        // --- 视频压缩逻辑 ---
        // 如果是视频文件且大于 100MB，则自动压缩
        const MAX_SIZE_MB = 100;
        const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

        if (file.mimetype.startsWith('video/') && file.size > MAX_SIZE_BYTES) {
            console.log(`检测到大视频文件 (${(file.size / 1024 / 1024).toFixed(2)}MB)，开始自动压缩...`);
            
            const tempOutputPath = file.path + '.compressed.mp4';
            
            try {
                // 执行压缩
                await compressVideo(file.path, tempOutputPath, MAX_SIZE_MB);
                
                // 压缩成功，替换原文件
                // 1. 删除原文件
                fs.unlinkSync(file.path);
                // 2. 重命名压缩后的文件为原文件名
                fs.renameSync(tempOutputPath, file.path);
                
                // 3. 更新 file 对象的大小信息
                const newStats = fs.statSync(file.path);
                file.size = newStats.size;
                console.log(`视频压缩并替换成功，新大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                
            } catch (compressErr) {
                console.error('自动压缩失败，将使用原文件:', compressErr);
                // 如果压缩失败，尝试删除临时文件（如果存在）
                if (fs.existsSync(tempOutputPath)) {
                    fs.unlinkSync(tempOutputPath);
                }
                // 继续使用原文件，不阻断上传流程
            }
        }
        // -------------------

        if (!title) {
            // 清理已上传的文件
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            if (cover && fs.existsSync(cover.path)) fs.unlinkSync(cover.path);
            return res.status(400).json({ success: false, message: '请提供作品标题' });
        }

        // 检查同分类下是否有重名作品
        const isDuplicate = db.works.some(w => w.category === category && w.title === title);
        if (isDuplicate) {
            // 清理已上传的文件
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            if (cover && fs.existsSync(cover.path)) fs.unlinkSync(cover.path);
            return res.status(400).json({ success: false, message: '该作品名称已存在，请使用其他名称' });
        }

        const workId = Date.now().toString();
        
        // 构建文件URL - 使用相对路径，无需域名
        const fileUrl = `/uploads/${category}/${file.filename}`;
        const coverUrl = cover ? `/uploads/${category}/${cover.filename}` : null;
        
        // 计算方向
        let orientation = 'landscape'; // 默认横向
        if (width && height) {
            const w = parseInt(width);
            const h = parseInt(height);
            if (!isNaN(w) && !isNaN(h)) {
                if (h > w) orientation = 'portrait';
            }
        }
        
        const newWork = {
            work_id: workId,
            title: title,
            description: description || '',
            category: category,
            file_name: file.originalname,
            file_path: file.filename,
            fileUrl: fileUrl,
            coverUrl: coverUrl, // 保存封面URL
            file_type: file.mimetype,
            file_size: file.size,
            width: width ? parseInt(width) : null,
            height: height ? parseInt(height) : null,
            orientation: orientation,
            created_at: new Date().toISOString()
        };

        db.works.push(newWork);
        saveData();

        res.json({
            success: true,
            message: '上传成功',
            work: newWork,
            fileUrl: fileUrl
        });
    } catch (error) {
        console.error('上传失败:', error);
        // 清理可能已上传的文件
        if (req.files) {
            if (req.files['file'] && req.files['file'][0]) {
                const p = req.files['file'][0].path;
                if (fs.existsSync(p)) fs.unlinkSync(p);
            }
            if (req.files['cover'] && req.files['cover'][0]) {
                const p = req.files['cover'][0].path;
                if (fs.existsSync(p)) fs.unlinkSync(p);
            }
        }
        res.status(500).json({ success: false, message: '上传失败' });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: '服务器运行正常',
        works_count: db.works.length
    });
});

// 所有其他请求返回 index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('====================================');
    console.log(`服务器启动成功！`);
    console.log(`运行环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`端口: ${PORT}`);
    console.log(`已加载作品数: ${db.works.length}`);
    console.log(`时间: ${new Date().toLocaleString()}`);
    console.log('====================================');
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
});

// 设置超时时间为 30 分钟，防止大文件上传中断
server.timeout = 30 * 60 * 1000;
server.keepAliveTimeout = 30 * 60 * 1000;
server.headersTimeout = 31 * 60 * 1000; // 必须大于 keepAliveTimeout

console.log(`服务器超时设置已应用: timeout=${server.timeout}ms`);
