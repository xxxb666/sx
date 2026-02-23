const MOCK_DATA = {
    profile: {
        nickname: "徐小泡",
        selfIntro: "热爱绘画、舞蹈和AI创作，致力于探索艺术与科技的融合。",
        motto: "每一个不曾起舞的日子，都是对生命的辜负",
        avatar: "https://placehold.co/200x200?text=Avatar",
        introVideo: "" 
    },
    works: {
        painting: [
            { work_id: 1, title: "梦幻星空", description: "使用水彩绘制的星空", fileUrl: "https://placehold.co/600x400/2c3e50/ffffff?text=Painting+1", category: "painting", orientation: "landscape", created_at: "2024-01-01T10:00:00Z", file_type: "image/jpeg" },
            { work_id: 2, title: "森林晨曦", description: "清晨的森林，光影斑驳", fileUrl: "https://placehold.co/400x600/27ae60/ffffff?text=Painting+2", category: "painting", orientation: "portrait", created_at: "2024-01-02T11:00:00Z", file_type: "image/jpeg" },
            { work_id: 3, title: "城市剪影", description: "日落时分的城市轮廓", fileUrl: "https://placehold.co/600x400/c0392b/ffffff?text=Painting+3", category: "painting", orientation: "landscape", created_at: "2024-01-03T12:00:00Z", file_type: "image/jpeg" },
            { work_id: 4, title: "静物写生", description: "简单的静物组合", fileUrl: "https://placehold.co/400x600/f39c12/ffffff?text=Painting+4", category: "painting", orientation: "portrait", created_at: "2024-01-04T13:00:00Z", file_type: "image/jpeg" }
        ],
        dance: [
            { work_id: 101, title: "现代舞展示", description: "一段即兴现代舞", fileUrl: "https://placehold.co/600x400/8e44ad/ffffff?text=Video+Thumbnail", category: "dance", orientation: "landscape", file_type: "video/mp4", created_at: "2024-02-01T10:00:00Z" },
            { work_id: 102, title: "街舞练习", description: "基础动作练习", fileUrl: "https://placehold.co/400x600/16a085/ffffff?text=Video+Thumbnail", category: "dance", orientation: "portrait", file_type: "video/mp4", created_at: "2024-02-02T11:00:00Z" },
            { work_id: 103, title: "舞台表演", description: "年度汇演片段", fileUrl: "https://placehold.co/600x400/d35400/ffffff?text=Video+Thumbnail", category: "dance", orientation: "landscape", file_type: "video/mp4", created_at: "2024-02-03T12:00:00Z" },
            { work_id: 104, title: "练功房", description: "日常训练记录", fileUrl: "https://placehold.co/400x600/7f8c8d/ffffff?text=Video+Thumbnail", category: "dance", orientation: "portrait", file_type: "video/mp4", created_at: "2024-02-04T13:00:00Z" }
        ],
        ai: [
            { work_id: 201, title: "AI生成画作", description: "Midjourney生成的奇幻场景", fileUrl: "https://placehold.co/600x400/2980b9/ffffff?text=AI+Art+1", category: "ai", orientation: "landscape", file_type: "image/png", created_at: "2024-03-01T10:00:00Z" },
            { work_id: 202, title: "AI视频生成", description: "Runway生成的动态视频", fileUrl: "https://placehold.co/600x400/8e44ad/ffffff?text=AI+Video", category: "ai", orientation: "landscape", file_type: "video/mp4", created_at: "2024-03-02T11:00:00Z" },
            { work_id: 203, title: "AI人像", description: "Stable Diffusion生成的人像", fileUrl: "https://placehold.co/400x600/e74c3c/ffffff?text=AI+Portrait", category: "ai", orientation: "portrait", file_type: "image/png", created_at: "2024-03-03T12:00:00Z" },
            { work_id: 204, title: "未来城市", description: "赛博朋克风格城市", fileUrl: "https://placehold.co/600x400/34495e/ffffff?text=Cyberpunk", category: "ai", orientation: "landscape", file_type: "image/png", created_at: "2024-03-04T13:00:00Z" }
        ],
        honor: [
            { work_id: 301, title: "优秀奖", description: "年度绘画比赛优秀奖", fileUrl: "https://placehold.co/600x800/f1c40f/000000?text=Certificate", category: "honor", orientation: "portrait", created_at: "2024-04-01T10:00:00Z", file_type: "image/jpeg" },
            { work_id: 302, title: "最佳创意奖", description: "设计大赛最佳创意", fileUrl: "https://placehold.co/600x800/e67e22/ffffff?text=Certificate", category: "honor", orientation: "portrait", created_at: "2024-04-02T11:00:00Z", file_type: "image/jpeg" },
            { work_id: 303, title: "参与证书", description: "公益活动参与证书", fileUrl: "https://placehold.co/600x800/95a5a6/ffffff?text=Certificate", category: "honor", orientation: "portrait", created_at: "2024-04-03T12:00:00Z", file_type: "image/jpeg" },
            { work_id: 304, title: "奖学金", description: "年度奖学金", fileUrl: "https://placehold.co/600x800/2ecc71/ffffff?text=Certificate", category: "honor", orientation: "portrait", created_at: "2024-04-04T13:00:00Z", file_type: "image/jpeg" }
        ],
        ppt: [
            { work_id: 401, title: "项目汇报", description: "期末项目汇报PPT", fileUrl: "https://placehold.co/600x400/3498db/ffffff?text=PPT+Cover", category: "ppt", orientation: "landscape", created_at: "2024-05-01T10:00:00Z", file_type: "image/jpeg" },
            { work_id: 402, title: "设计分享", description: "设计理念分享", fileUrl: "https://placehold.co/600x400/9b59b6/ffffff?text=PPT+Cover", category: "ppt", orientation: "landscape", created_at: "2024-05-02T11:00:00Z", file_type: "image/jpeg" },
            { work_id: 403, title: "技术讲座", description: "Web开发技术讲座", fileUrl: "https://placehold.co/600x400/34495e/ffffff?text=PPT+Cover", category: "ppt", orientation: "landscape", created_at: "2024-05-03T12:00:00Z", file_type: "image/jpeg" },
            { work_id: 404, title: "案例分析", description: "经典案例分析", fileUrl: "https://placehold.co/600x400/1abc9c/ffffff?text=PPT+Cover", category: "ppt", orientation: "landscape", created_at: "2024-05-04T13:00:00Z", file_type: "image/jpeg" }
        ]
    }
};