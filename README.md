# CarrotCast 萝卜坑 - 音乐约稿约唱平台

一个基于微信云开发的音乐约稿约唱平台，支持原创/翻唱招募、用户管理、申请审核、站内信等功能。

## 功能特性

### 1. 首页 - 招募列表
- 滚动展示招募信息
- 显示标题、封面图、状态、截止日期
- 支持按类型（原创/翻唱）和状态筛选
- 支持关键词搜索

### 2. 招募详情
- 展示招募基本信息
- 查看参与者和申请列表
- 未登录用户可浏览但无法申请
- 登录后可申请加入

### 3. 用户系统
- 微信一键登录
- 个人资料设置（昵称、QQ、微信、电话）
- 个人主页展示

### 4. 我的招募
- 查看我发起的招募（带领导者标识）
- 查看我参与的招募
- 发起新招募按钮
- 草稿箱功能

### 5. 发起/编辑招募
- 封面图片上传
- 招募类型（原创/翻唱）
- 音乐类型选择（参考5sing）
- 标题、截止日期、标签
- 外部链接
- 状态管理（草稿→招募中→招募完成→发布完成）
- 权限管理（可分配其他用户为管理员）

### 6. 申请管理
- 申请列表（待审核/已通过/已拒绝）
- 审核申请并留言
- 设置管理员权限

### 7. 站内信
- 申请通知
- 审核结果通知
- 系统公告
- 未读消息标记

## 技术栈

- **前端**：微信小程序 (WXML + WXSS + JavaScript)
- **后端**：微信云开发 (CloudBase)
- **数据库**：云数据库 (MongoDB)
- **存储**：云存储 (文件上传)
- **云函数**：Node.js

## 数据库结构

### users 用户集合
```
{
  _id: ObjectId,
  openid: String,          // 微信用户唯一标识
  nickname: String,        // 昵称
  qq: String,              // QQ号
  wechat: String,          // 微信号
  phone: String,           // 电话
  bio: String,             // 简介
  avatar: String,          // 头像URL
  createTime: Date,        // 创建时间
  updateTime: Date         // 更新时间
}
```

### recruitments 招募集合
```
{
  _id: ObjectId,
  title: String,           // 标题
  type: String,            // original: 原创, cover: 翻唱
  musicType: String,       // 音乐类型ID
  musicTypeName: String,   // 音乐类型名称
  coverImage: String,      // 封面图片URL
  deadline: Date,          // 截止日期
  tags: Array,             // 标签数组
  externalLinks: Array,    // 外部链接数组
  status: String,          // draft, recruiting, completed, published
  creatorId: String,       // 创建者openid
  admins: Array,          // 管理员openid数组
  createTime: Date,
  updateTime: Date
}
```

### participants 参与者集合
```
{
  _id: ObjectId,
  recruitmentId: String,   // 招募ID
  recruitmentTitle: String,// 招募标题
  userId: String,          // 用户openid
  userNickname: String,    // 用户昵称
  userBio: String,        // 用户简介
  workLink: String,        // 作品链接
  musicPageLink: String,   // 音乐主页链接
  message: String,         // 申请留言
  status: String,          // pending, approved, rejected
  isAdmin: Boolean,         // 是否为管理员
  applyTime: Date,
  reviewTime: Date,
  reviewMessage: String
}
```

### messages 站内信集合
```
{
  _id: ObjectId,
  userId: String,          // 接收者openid
  recruitmentId: String,   // 关联招募ID
  recruitmentTitle: String,// 招募标题
  fromUserId: String,      // 发送者openid
  fromUserNickname: String,// 发送者昵称
  type: String,            // notice, apply, review, system
  title: String,           // 消息标题
  content: String,          // 消息内容
  status: String,           // unread, read
  createTime: Date
}
```

## 云函数列表

| 云函数 | 功能 |
|--------|------|
| login | 用户登录，获取/创建用户信息 |
| user | 用户信息更新和查询 |
| recruitment | 招募的增删改查 |
| participant | 参与者和申请管理 |
| message | 站内信管理 |
| initDb | 数据库初始化 |

## 使用说明

1. 在微信开发者工具中导入项目
2. 开通云开发，创建云环境
3. 在 `miniprogram/utils/config.js` 中配置云环境ID
4. 部署所有云函数
5. 在云开发控制台创建以下集合：
   - users
   - recruitments
   - participants
   - messages
6. 为集合创建合适的索引以提升查询性能

## 音乐类型列表

平台采用5sing音乐类型的分类方式：

**风格类型**：流行、摇滚、民谣、说唱、R&B、电子、爵士、古典、ACG/动漫、游戏、影视、戏曲、红歌、儿歌

**样式类型**：古风、民歌/方言、宗教、广告、教学、其他

## 操作流程

### 发起招募
1. 登录账号
2. 点击右下角"发起招募"或进入"我的招募"
3. 填写招募信息
4. 选择保存草稿或直接发布

### 加入招募
1. 浏览首页招募列表
2. 点击进入招募详情
3. 点击"申请加入"
4. 填写申请信息
5. 等待发起者审核

### 管理招募
1. 进入"我的招募"
2. 点击"申请列表"查看申请
3. 审核申请并留言
4. 可将优秀参与者设为管理员

## 注意事项

- 链接展示采用复制方式，不支持直接跳转，防止钓鱼链接
- 草稿状态的招募对外不可见
- 只有创建者和管理员可以编辑招募信息
- 站内信实时通知申请和审核状态
