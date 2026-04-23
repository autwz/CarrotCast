// 云数据库字段名常量
module.exports = {
  // 用户相关
  USERS: 'users',
  
  // 招募相关
  RECRUITMENTS: 'recruitments',
  
  // 参与者相关
  PARTICIPANTS: 'participants',
  
  // 站内信相关
  MESSAGES: 'messages',
  
  // 反馈相关
  FEEDBACKS: 'feedbacks',
  
  // 招募状态
  STATUS_DRAFT: 'draft',           // 草稿
  STATUS_RECRUITING: 'recruiting',  // 招募中
  STATUS_COMPLETED: 'completed',    // 招募完成
  STATUS_PUBLISHED: 'published',    // 发布完成
  
  // 申请状态
  APPLY_PENDING: 'pending',   // 待审核
  APPLY_APPROVED: 'approved',   // 已通过
  APPLY_REJECTED: 'rejected',   // 已拒绝
  
  // 招募类型
  TYPE_ORIGINAL: 'original',   // 原创
  TYPE_COVER: 'cover',         // 翻唱
  
  // 音乐类型列表 (参考5sing)
  MUSIC_TYPES: [
    { id: 'pop', name: '流行', category: 'genre' },
    { id: 'rock', name: '摇滚', category: 'genre' },
    { id: 'folk', name: '民谣', category: 'genre' },
    { id: 'rap', name: '说唱', category: 'genre' },
    { id: 'rnb', name: 'R&B', category: 'genre' },
    { id: 'electronic', name: '电子', category: 'genre' },
    { id: 'jazz', name: '爵士', category: 'genre' },
    { id: 'classical', name: '古典', category: 'genre' },
    { id: 'anime', name: 'ACG/动漫', category: 'genre' },
    { id: 'game', name: '游戏', category: 'genre' },
    { id: 'film', name: '影视', category: 'genre' },
    { id: 'opera', name: '戏曲', category: 'genre' },
    { id: 'red', name: '红歌', category: 'genre' },
    { id: 'children', name: '儿歌', category: 'genre' },
    { id: 'cloud', name: '古风', category: 'style' },
    { id: 'cantonese', name: '民歌/方言', category: 'style' },
    { id: 'religious', name: '宗教', category: 'style' },
    { id: 'advertising', name: '广告', category: 'style' },
    { id: 'education', name: '教学', category: 'style' },
    { id: 'other', name: '其他', category: 'style' }
  ],

  // 职位类型列表
  ROLE_TYPES: [
    { id: 'singer', name: '歌手', desc: '演唱歌曲' },
    { id: 'lyricist', name: '词作', desc: '作词填词' },
    { id: 'composer', name: '曲作', desc: '作曲编曲' },
    { id: 'arranger', name: '编曲', desc: '编曲制作' },
    { id: 'mixer', name: '混音', desc: '混音后期' },
    { id: 'mastering', name: '母带', desc: '母带处理' },
    { id: 'producer', name: '监制', desc: '统筹监制' },
    { id: 'other', name: '其他', desc: '其他角色' }
  ]
};
