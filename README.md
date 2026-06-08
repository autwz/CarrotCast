# CarrotCast 萝卜坑 - 音乐约稿约唱平台

基于微信云开发的音乐协作招募平台，支持原创/翻唱项目发起、职位招募、申请审核、站内信、反馈收集等功能。

## 功能特性

| 模块 | 功能 |
|------|------|
| **首页** | 招募列表展示、封面图/标题/标签、按音乐类型/状态筛选、关键词搜索、下拉刷新、滚动加载 |
| **招募详情** | 完整信息展示、参与者列表、职位需求与空缺、申请加入、管理员审核、人员移除 |
| **发起/编辑** | 封面图片上传、音乐类型选择（5sing分类）、职位需求配置、标签管理、外部链接、草稿/发布状态流转、微信群二维码 |
| **我的招募** | 我创建的 / 我参与的 双标签切换、申请列表入口、编辑/查看跳转 |
| **申请管理** | 待审核/已通过/已拒绝 三栏筛选、审核通过/拒绝+留言、设置管理员 |
| **站内信** | 申请/审核/系统通知、未读标记、全部标为已读、关联跳转 |
| **用户系统** | 微信一键登录、个人资料编辑、头像/昵称/联系方式 |
| **反馈系统** | 用户提交反馈、管理员处理（待处理→可排期→已解决→作废）、管理员回复 |

## 技术栈

- **前端**：微信小程序 (WXML + WXSS + JavaScript)
- **后端**：微信云开发 CloudBase
- **数据库**：云数据库（文档型，类 MongoDB）
- **存储**：云存储（图片上传）
- **云函数**：Node.js，内容审核（微信安全API + 敏感词过滤）

## 项目结构

```
CarrotCast/
├── cloudfunctions/          # 云函数
│   ├── login/               # 用户登录
│   ├── user/                # 用户信息管理
│   ├── recruitment/         # 招募 CRUD + 内容审核
│   ├── participant/         # 参与者申请/审核/管理
│   ├── message/             # 站内信管理
│   ├── feedback/            # 用户反馈管理
│   └── initDb/              # 数据库初始化
├── miniprogram/             # 小程序前端
│   ├── pages/
│   │   ├── index/           # 首页 - 招募列表
│   │   ├── recruitment-detail/  # 招募详情
│   │   ├── recruitment-form/    # 发起/编辑招募
│   │   ├── my-recruitments/     # 我的招募
│   │   ├── apply-list/          # 申请管理
│   │   ├── messages/            # 站内信列表
│   │   ├── message-detail/      # 站内信详情
│   │   ├── user/                # 个人中心
│   │   ├── edit-profile/        # 编辑资料
│   │   ├── feedback/            # 提交反馈
│   │   └── feedback-list/       # 反馈管理
│   ├── utils/
│   │   ├── config.js        # 云环境配置
│   │   ├── constants.js     # 常量定义（状态/类型/音乐类型/职位）
│   │   ├── db.js            # 数据库操作封装
│   │   └── util.js          # 通用工具函数
│   ├── images/              # 图片资源
│   ├── app.js               # 应用入口
│   └── app.json             # 应用配置
├── project.config.json
└── README.md
```

## 页面清单

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `pages/index/index` | Tab 页，招募列表 |
| 招募详情 | `pages/recruitment-detail/recruitment-detail` | 查看/申请/管理 |
| 发起/编辑 | `pages/recruitment-form/recruitment-form` | 创建或编辑招募 |
| 我的招募 | `pages/my-recruitments/my-recruitments` | 我创建/参与的列表 |
| 申请管理 | `pages/apply-list/apply-list` | 审核申请 |
| 站内信 | `pages/messages/messages` | 消息列表 |
| 消息详情 | `pages/message-detail/message-detail` | 单条消息详情 |
| 个人中心 | `pages/user/user` | Tab 页，个人信息 |
| 编辑资料 | `pages/edit-profile/edit-profile` | 修改个人资料 |
| 反馈 | `pages/feedback/feedback` | 提交反馈 |
| 反馈管理 | `pages/feedback-list/feedback-list` | 管理员处理反馈 |

## 云函数

| 云函数 | 主要 Action | 功能 |
|--------|------------|------|
| `login` | `login` | 获取 openid，创建/查询用户 |
| `user` | `get`, `update` | 用户信息读取与更新 |
| `recruitment` | `create`, `get`, `list`, `update`, `myList`, `delete` | 招募增删改查，含内容审核 |
| `participant` | `apply`, `review`, `remove`, `getApplyList`, `getMyApplyStatus`, `setAdmin` | 参与者全生命周期管理 |
| `message` | `list`, `get`, `markRead`, `markAllRead` | 站内信收发管理 |
| `feedback` | `submit`, `getList`, `updateStatus` | 反馈提交与管理 |
| `initDb` | `initDb` | 数据库集合初始化 |

## 数据库集合

### users - 用户集合
```json
{
  "_id": "ObjectId",
  "openid": "String (微信用户唯一标识)",
  "nickname": "String",
  "avatar": "String (头像URL)",
  "qq": "String",
  "wechat": "String",
  "phone": "String",
  "bio": "String",
  "isAdmin": "Boolean",
  "createTime": "Date",
  "updateTime": "Date"
}
```

### recruitments - 招募集合
```json
{
  "_id": "ObjectId",
  "title": "String (标题)",
  "type": "String (original|cover)",
  "musicType": "String (音乐类型ID)",
  "musicTypeName": "String (音乐类型名称)",
  "coverImage": "String (封面图片URL)",
  "deadline": "Date (截止日期)",
  "tags": "Array<String>",
  "positionNeeds": "Array<{roleId, count}> (职位需求)",
  "externalLinks": "Array<{title, url}>",
  "teamNotes": "String (招募说明)",
  "teamWechatQR": "String (微信群二维码)",
  "status": "String (draft|recruiting|completed|published)",
  "creatorId": "String (创建者openid)",
  "admins": "Array<String>",
  "participantList": "Array",
  "createTime": "Date",
  "updateTime": "Date"
}
```

### participants - 参与者集合
```json
{
  "_id": "ObjectId",
  "recruitmentId": "String",
  "recruitmentTitle": "String",
  "userId": "String",
  "userNickname": "String",
  "userAvatar": "String",
  "userBio": "String",
  "workLink": "String",
  "musicPageLink": "String",
  "message": "String (申请留言)",
  "applyRole": "String (申请的职位)",
  "role": "String (审核通过后的职位)",
  "status": "String (pending|approved|rejected)",
  "isAdmin": "Boolean",
  "reviewMessage": "String",
  "applyTime": "Date",
  "reviewTime": "Date"
}
```

### messages - 站内信集合
```json
{
  "_id": "ObjectId",
  "userId": "String (接收者openid)",
  "recruitmentId": "String",
  "recruitmentTitle": "String",
  "fromUserId": "String",
  "fromUserNickname": "String",
  "type": "String (notice|apply|review|system)",
  "title": "String",
  "content": "String",
  "status": "String (unread|read)",
  "createTime": "Date"
}
```

### feedbacks - 反馈集合
```json
{
  "_id": "ObjectId",
  "userId": "String",
  "userNickname": "String",
  "userAvatar": "String",
  "content": "String (反馈内容，≤500字)",
  "status": "String (pending|scheduled|resolved|invalid)",
  "adminReply": "String",
  "createTime": "Date",
  "updateTime": "Date"
}
```

## 招募状态流转

```
草稿 (draft) → 招募中 (recruiting) → 招募完成 (completed) → 发布完成 (published)
```

- **草稿**：仅创建者可见，可继续编辑
- **招募中**：对外公开，接受申请
- **招募完成**：职位已满或手动变更，进入制作阶段
- **发布完成**：项目正式发布

## 音乐类型

参照 5sing 分类体系：

| 分类 | 类型 |
|------|------|
| 风格 (genre) | 流行、摇滚、民谣、说唱、R&B、电子、爵士、古典、ACG/动漫、游戏、影视、戏曲、红歌、儿歌 |
| 样式 (style) | 古风、民歌/方言、宗教、广告、教学、其他 |

## 职位类型

| 职位 | 说明 |
|------|------|
| 歌手 | 演唱歌曲 |
| 词作 | 作词填词 |
| 曲作 | 作曲编曲 |
| 编曲 | 编曲制作 |
| 混音 | 混音后期 |
| 母带 | 母带处理 |
| 监制 | 统筹监制 |
| 其他 | 其他角色 |

## 快速开始

### 前置条件
- 微信开发者工具（基础库 ≥ 2.2.3）
- 已开通微信云开发

### 部署步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/autwz/CarrotCast.git
   ```

2. **导入项目**
   微信开发者工具 → 导入项目 → 填写 AppID → 选择项目目录

3. **配置云环境**
   编辑 `miniprogram/app.js`，将 `globalData.env` 替换为你的云环境ID

4. **部署云函数**
   在开发者工具中逐个上传部署 `cloudfunctions/` 下的所有云函数

5. **初始化数据库**
   调用 `initDb` 云函数自动创建集合；或手动在云开发控制台创建：
   - `users`
   - `recruitments`
   - `participants`
   - `messages`
   - `feedbacks`

6. **设置数据库权限**
   各集合建议使用"仅创建者及管理员可读写"或通过云函数操作

7. **编译运行**
   点击编译即可在模拟器/真机预览

## 注意事项

- 外部链接采用复制方式展示，不支持直接跳转，防止钓鱼风险
- 招募内容发布时经过微信安全API + 敏感词双重审核
- `onShow` 首次加载会跳过（已通过 `_firstLoad` 标记避免重复请求）
- 草稿状态招募对外不可见
- 仅创建者和管理员可编辑招募、审核申请

## License

MIT
