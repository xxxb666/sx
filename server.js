const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.SECRET_KEY || 'xiaopao-secret-key-2025';

// 数据文件路径
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

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
        avatar: null
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
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
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
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB 限制
});

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

// 上传作品
app.post('/api/upload/:category', authenticateToken, upload.single('file'), (req, res) => {
    try {
        const { category } = req.params;
        const { title, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: '没有上传文件' });
        }

        if (!title) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: '请提供作品标题' });
        }

        const workId = Date.now().toString();
        
        // 构建文件URL - 使用相对路径，无需域名
        const fileUrl = `/uploads/${category}/${req.file.filename}`;
        
        const newWork = {
            work_id: workId,
            title: title,
            description: description || '',
            category: category,
            file_name: req.file.originalname,
            file_path: req.file.filename,
            fileUrl: fileUrl, // 明确保存 fileUrl
            file_type: req.file.mimetype,
            file_size: req.file.size,
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
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
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
app.listen(PORT, '0.0.0.0', () => {
    console.log('====================================');
    console.log(`服务器启动成功！`);
    console.log(`运行环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`端口: ${PORT}`);
    console.log(`时间: ${new Date().toLocaleString()}`);
    console.log('====================================');
});
