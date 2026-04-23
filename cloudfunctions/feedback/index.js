// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// 小程序管理员 openid 列表
const ADMIN_OPENIDS = [
  'o5C1z3Rjf4yvpvYg1VlBvJZyNppw'
];

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action, data } = event;
  
  try {
    switch (action) {
      case 'submit': {
        // 提交反馈
        const content = (data.content || '').trim();
        if (!content) {
          return { success: false, error: '请输入反馈内容' };
        }
        if (content.length > 500) {
          return { success: false, error: '反馈内容不能超过500字' };
        }
        
        // 获取用户信息
        const userRes = await db.collection('users').where({ openid }).get();
        const user = userRes.data[0] || {};
        
        const addRes = await db.collection('feedbacks').add({
          data: {
            userId: openid,
            userNickname: user.nickname || '匿名用户',
            userAvatar: user.avatar || '',
            content,
            status: 'pending', // pending: 待处理, scheduled: 可排期, resolved: 已解决, invalid: 作废
            adminReply: '',
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        });
        
        return { success: true, id: addRes._id };
      }
      
      case 'getList': {
        // 获取反馈列表（仅管理员）
        if (!ADMIN_OPENIDS.includes(openid)) {
          return { success: false, error: '无权限查看' };
        }
        
        const { status, page = 1, pageSize = 20 } = data;
        const query = {};
        if (status) {
          query.status = status;
        }
        
        const countRes = await db.collection('feedbacks').where(query).count();
        const listRes = await db.collection('feedbacks')
          .where(query)
          .orderBy('createTime', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get();
        
        return {
          success: true,
          data: listRes.data,
          total: countRes.total,
          page,
          pageSize
        };
      }
      
      case 'updateStatus': {
        // 更新反馈状态（仅管理员）
        if (!ADMIN_OPENIDS.includes(openid)) {
          return { success: false, error: '无权限操作' };
        }
        
        const validStatuses = ['pending', 'scheduled', 'resolved', 'invalid'];
        if (!validStatuses.includes(data.status)) {
          return { success: false, error: '无效的状态' };
        }
        
        await db.collection('feedbacks').doc(data.id).update({
          data: {
            status: data.status,
            adminReply: data.adminReply || '',
            updateTime: db.serverDate()
          }
        });
        
        return { success: true };
      }
      
      case 'getMyFeedbacks': {
        // 获取我的反馈列表
        const myRes = await db.collection('feedbacks')
          .where({ userId: openid })
          .orderBy('createTime', 'desc')
          .limit(50)
          .get();
        
        return { success: true, data: myRes.data };
      }
      
      case 'checkIsAdmin': {
        // 检查是否为管理员
        return { success: true, isAdmin: ADMIN_OPENIDS.includes(openid) };
      }
      
      default:
        return { success: false, error: '未知的操作' };
    }
  } catch (e) {
    console.error('反馈云函数错误', e);
    return { success: false, error: e.message || '操作失败' };
  }
};
