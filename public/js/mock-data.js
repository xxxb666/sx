const MOCK_DATA = {
    profile: {
        nickname: "徐小泡",
        selfIntro: "热爱绘画、舞蹈和AI创作，致力于探索艺术与科技的融合。",
        motto: "每一个不曾起舞的日子，都是对生命的辜负",
        avatar: "", 
        introVideo: "" 
    },
    works: {
        painting: [
            { work_id: 1, title: "绘画作品 1", description: "绘画艺术作品展示", fileUrl: "https://placehold.co/600x400?text=Painting+1", category: "painting" },
            { work_id: 2, title: "绘画作品 2", description: "绘画艺术作品展示", fileUrl: "https://placehold.co/600x400?text=Painting+2", category: "painting" },
            { work_id: 3, title: "绘画作品 3", description: "绘画艺术作品展示", fileUrl: "https://placehold.co/600x400?text=Painting+3", category: "painting" },
            { work_id: 4, title: "绘画作品 4", description: "绘画艺术作品展示", fileUrl: "https://placehold.co/600x400?text=Painting+4", category: "painting" },
            { work_id: 5, title: "绘画作品 5", description: "绘画艺术作品展示", fileUrl: "https://placehold.co/600x400?text=Painting+5", category: "painting" }
        ],
        dance: [
            { work_id: 6, title: "舞蹈视频 1", description: "舞蹈表演片段", fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4", coverUrl: "https://placehold.co/600x400?text=Dance+1", category: "dance" },
            { work_id: 7, title: "舞蹈视频 2", description: "舞蹈表演片段", fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4", coverUrl: "https://placehold.co/600x400?text=Dance+2", category: "dance" },
            { work_id: 8, title: "舞蹈视频 3", description: "舞蹈表演片段", fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4", coverUrl: "https://placehold.co/600x400?text=Dance+3", category: "dance" },
            { work_id: 9, title: "舞蹈视频 4", description: "舞蹈表演片段", fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4", coverUrl: "https://placehold.co/600x400?text=Dance+4", category: "dance" },
            { work_id: 10, title: "舞蹈视频 5", description: "舞蹈表演片段", fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4", coverUrl: "https://placehold.co/600x400?text=Dance+5", category: "dance" }
        ],
        ai: [
            { work_id: 11, title: "AI 作品 1", description: "AI 生成艺术照", fileUrl: "https://placehold.co/600x400?text=AI+1", category: "ai", file_type: "image/jpeg" },
            { work_id: 12, title: "AI 作品 2", description: "AI 生成艺术照", fileUrl: "https://placehold.co/600x400?text=AI+2", category: "ai", file_type: "image/jpeg" },
            { work_id: 13, title: "AI 视频 1", description: "AI 动态视频", fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4", coverUrl: "https://placehold.co/600x400?text=AI+Video+1", category: "ai", file_type: "video/mp4" },
            { work_id: 14, title: "AI 视频 2", description: "AI 动态视频", fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4", coverUrl: "https://placehold.co/600x400?text=AI+Video+2", category: "ai", file_type: "video/mp4" }
        ],
        honor: [
            { work_id: 15, title: "荣誉证书 1", fileUrl: "https://placehold.co/600x400?text=Honor+1", category: "honor" },
            { work_id: 16, title: "荣誉证书 2", fileUrl: "https://placehold.co/600x400?text=Honor+2", category: "honor" },
            { work_id: 17, title: "荣誉证书 3", fileUrl: "https://placehold.co/600x400?text=Honor+3", category: "honor" },
            { work_id: 18, title: "荣誉证书 4", fileUrl: "https://placehold.co/600x400?text=Honor+4", category: "honor" }
        ],
        ppt: [
            { work_id: 19, title: "PPT 展示 1", description: "个人成长报告", fileUrl: "https://placehold.co/600x400?text=PPT+1", category: "ppt" },
            { work_id: 20, title: "PPT 展示 2", description: "个人成长报告", fileUrl: "https://placehold.co/600x400?text=PPT+2", category: "ppt" },
            { work_id: 21, title: "PPT 展示 3", description: "个人成长报告", fileUrl: "https://placehold.co/600x400?text=PPT+3", category: "ppt" },
            { work_id: 22, title: "PPT 展示 4", description: "个人成长报告", fileUrl: "https://placehold.co/600x400?text=PPT+4", category: "ppt" }
        ]
    }
};