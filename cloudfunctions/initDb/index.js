// 云函数入口文件 - 初始化云数据库
// 注意：数据库集合必须在云开发控制台手动创建，此函数用于插入示例数据
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// 集合名称常量
const COLLECTIONS = {
  USERS: 'users',
  RECRUITMENTS: 'recruitments',
  PARTICIPANTS: 'participants',
  MESSAGES: 'messages',
  OPERATION_LOGS: 'operation_logs'
};

// 所需的索引配置（供参考，实际索引需在控制台创建）
const REQUIRED_INDEXES = {
  [COLLECTIONS.USERS]: [
    { name: 'idx_openid', fields: { openid: 1 }, unique: true, desc: '用户唯一标识' },
    { name: 'idx_updateTime', fields: { updateTime: -1 }, desc: '按更新时间排序' }
  ],
  [COLLECTIONS.RECRUITMENTS]: [
    { name: 'idx_creatorId', fields: { creatorId: 1 }, desc: '创建者查询' },
    { name: 'idx_status', fields: { status: 1 }, desc: '状态筛选' },
    { name: 'idx_createTime', fields: { createTime: -1 }, desc: '按创建时间排序' },
    { name: 'idx_type', fields: { type: 1 }, desc: '类型筛选' },
    { name: 'idx_musicType', fields: { musicType: 1 }, desc: '音乐类型筛选' }
  ],
  [COLLECTIONS.PARTICIPANTS]: [
    { name: 'idx_participant_recruitmentId', fields: { recruitmentId: 1 }, desc: '招募查询' },
    { name: 'idx_participant_userId', fields: { userId: 1 }, desc: '用户查询' },
    { name: 'idx_participant_status', fields: { status: 1 }, desc: '状态筛选' },
    { name: 'idx_participant_applyTime', fields: { applyTime: -1 }, desc: '申请时间排序' }
  ],
  [COLLECTIONS.MESSAGES]: [
    { name: 'idx_message_userId', fields: { userId: 1 }, desc: '用户消息查询' },
    { name: 'idx_message_status', fields: { status: 1 }, desc: '未读消息查询' },
    { name: 'idx_message_createTime', fields: { createTime: -1 }, desc: '消息时间排序' }
  ],
  [COLLECTIONS.OPERATION_LOGS]: [
    { name: 'idx_log_recruitmentId', fields: { recruitmentId: 1 }, desc: '招募操作日志查询' },
    { name: 'idx_log_userId', fields: { userId: 1 }, desc: '用户操作日志查询' },
    { name: 'idx_log_type', fields: { type: 1 }, desc: '操作类型筛选' },
    { name: 'idx_log_targetUserId', fields: { targetUserId: 1 }, desc: '目标用户日志查询' },
    { name: 'idx_log_createTime', fields: { createTime: -1 }, desc: '操作时间排序' }
  ]
};

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { action } = event;
  
  try {
    // 检查集合状态
    if (action === 'checkCollections') {
      return await checkCollections();
    }
    
    // 返回索引配置信息（用于控制台创建参考）
    if (action === 'getIndexConfig') {
      return {
        success: true,
        message: '索引配置信息',
        data: REQUIRED_INDEXES,
        instructions: '请在云开发控制台 -> 数据库 -> 集合 -> 索引管理 中创建以上索引'
      };
    }
    
    // 列出所有集合并返回统计信息
    if (action === 'status') {
      return await getDatabaseStatus();
    }
    
    // 清空所有业务数据（保留用户数据）
    if (action === 'clearAll') {
      return await clearAllData();
    }
    
    // 默认：返回使用说明
    return {
      success: true,
      message: '初始化数据库云函数',
      availableActions: [
        { action: 'checkCollections', desc: '检查集合状态' },
        { action: 'getIndexConfig', desc: '获取索引配置（用于控制台创建）' },
        { action: 'status', desc: '获取数据库状态' },
        { action: 'clearAll', desc: '清空所有业务数据（招募、参与、消息、日志）' }
      ],
      instructions: [
        '1. 请先在云开发控制台创建以下集合：users, recruitments, participants, messages, operation_logs',
        '2. 在控制台的索引管理中创建合适的索引以提升查询性能',
        '3. 使用 getIndexConfig action 获取所需的索引配置',
        '4. 使用 clearAll action 可清空业务数据'
      ]
    };
    
  } catch (e) {
    console.error('初始化数据库失败', e);
    return {
      success: false,
      error: e.message || '初始化失败',
      code: e.errCode || -1
    };
  }
};

// 检查集合状态
async function checkCollections() {
  const results = {};
  
  for (const name of Object.values(COLLECTIONS)) {
    try {
      const count = await db.collection(name).count();
      results[name] = {
        exists: true,
        count: count.total,
        status: 'ok'
      };
    } catch (e) {
      if (e.errCode === -502005 || e.message.includes('collection not exist')) {
        results[name] = {
          exists: false,
          count: 0,
          status: 'not_found',
          message: '请在云开发控制台创建此集合'
        };
      } else {
        results[name] = {
          exists: false,
          status: 'error',
          message: e.message
        };
      }
    }
  }
  
  return {
    success: true,
    message: '集合状态检查完成',
    results: results,
    allExists: Object.values(results).every(r => r.exists)
  };
}

// 获取数据库状态
async function getDatabaseStatus() {
  const status = {
    collections: {},
    summary: {
      totalDocuments: 0,
      collectionsCount: 0
    }
  };
  
  for (const name of Object.values(COLLECTIONS)) {
    try {
      const count = await db.collection(name).count();
      status.collections[name] = {
        exists: true,
        documentCount: count.total,
        requiredIndexes: REQUIRED_INDEXES[name]?.map(idx => idx.name) || []
      };
      status.summary.totalDocuments += count.total;
      status.summary.collectionsCount++;
    } catch (e) {
      status.collections[name] = {
        exists: false,
        documentCount: 0,
        message: '集合不存在'
      };
    }
  }
  
  return {
    success: true,
    message: '数据库状态获取成功',
    data: status
  };
}

// 清空所有业务数据
async function clearAllData() {
  try {
    const collectionsToClear = [
      COLLECTIONS.PARTICIPANTS,
      COLLECTIONS.MESSAGES,
      COLLECTIONS.RECRUITMENTS,
      COLLECTIONS.OPERATION_LOGS
    ];
    
    const results = {};
    
    for (const collName of collectionsToClear) {
      try {
        const res = await db.collection(collName).where({ _id: _.exists(true) }).remove();
        results[collName] = {
          success: true,
          deleted: res.deleted || 0
        };
      } catch (e) {
        results[collName] = {
          success: false,
          error: e.message
        };
      }
    }
    
    return {
      success: true,
      message: '业务数据已清空',
      results: results,
      note: '用户数据(users)已保留，如需清空请手动操作'
    };
    
  } catch (e) {
    console.error('清空数据失败', e);
    return {
      success: false,
      error: e.message || '清空失败'
    };
  }
}
