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
            { work_id: 1, title: "绘画作品 1", description: "这是一份绘画作品说明", fileUrl: "https://placehold.co/600x400?text=Painting+1", category: "painting" },
            { work_id: 2, title: "绘画作品 2", description: "这是一份绘画作品说明", fileUrl: "https://placehold.co/600x400?text=Painting+2", category: "painting" },
            { work_id: 3, title: "绘画作品 3", description: "这是一份绘画作品说明", fileUrl: "https://placehold.co/600x400?text=Painting+3", category: "painting" },
            { work_id: 4, title: "绘画作品 4", description: "这是一份绘画作品说明", fileUrl: "https://placehold.co/600x400?text=Painting+4", category: "painting" }
        ],
        dance: [
            { work_id: 5, title: "舞蹈视频 1", description: "舞蹈表演片段", fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4", coverUrl: "https://placehold.co/600x400?text=Dance+1", category: "dance" },
            { work_id: 6, title: "舞蹈视频 2", description: "舞蹈表演片段", fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4", coverUrl: "https://placehold.co/600x400?text=Dance+2", category: "dance" },
            { work_id: 7, title: "舞蹈视频 3", description: "舞蹈表演片段", fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4", coverUrl: "https://placehold.co/600x400?text=Dance+3", category: "dance" }
        ],
        ai: [
            { work_id: 8, title: "AI 作品 1", description: "AI 生成的艺术照", fileUrl: "https://placehold.co/600x400?text=AI+1", category: "ai", file_type: "image/jpeg" },
            { work_id: 9, title: "AI 视频 1", description: "AI 生成的动态视频", fileUrl: "https://www.w3schools.com/html/mov_bbb.mp4", coverUrl: "https://placehold.co/600x400?text=AI+Video+1", category: "ai", file_type: "video/mp4" }
        ],
        honor: [
            { work_id: 10, title: "荣誉证书 1", fileUrl: "https://placehold.co/600x400?text=Honor+1", category: "honor" },
            { work_id: 11, title: "荣誉证书 2", fileUrl: "https://placehold.co/600x400?text=Honor+2", category: "honor" }
        ],
        ppt: [
            { work_id: 12, title: "PPT 展示 1", description: "个人成长报告", fileUrl: "https://placehold.co/600x400?text=PPT+1", category: "ppt" }
        ]
    }
};