// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action, data } = event;
  
  try {
    switch (action) {
      case 'list':
        // 获取站内信列表
        const { page = 1, pageSize = 20, status } = data;
        const query = { userId: openid };
        
        if (status) {
          query.status = status;
        }
        
        const listRes = await db.collection('messages')
          .where(query)
          .orderBy('createTime', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get();
        
        // 统计未读数量
        const unreadRes = await db.collection('messages').where({
          userId: openid,
          status: 'unread'
        }).count();
        
        return {
          success: true,
          data: listRes.data,
          unreadCount: unreadRes.total
        };
        
      case 'get':
        // 获取站内信详情
        const message = await db.collection('messages').doc(data.id).get();
        
        if (!message.data) {
          return {
            success: false,
            error: '消息不存在'
          };
        }
        
        // 检查权限
        if (message.data.userId !== openid) {
          return {
            success: false,
            error: '无权查看此消息'
          };
        }
        
        // 标记为已读
        if (message.data.status === 'unread') {
          await db.collection('messages').doc(data.id).update({
            data: {
              status: 'read'
            }
          });
        }
        
        return {
          success: true,
          data: message.data
        };
        
      case 'markRead':
        // 标记已读
        await db.collection('messages').where({
          _id: data.id,
          userId: openid
        }).update({
          data: {
            status: 'read'
          }
        });
        
        return {
          success: true
        };
        
      case 'markAllRead':
        // 全部标记为已读
        await db.collection('messages').where({
          userId: openid,
          status: 'unread'
        }).update({
          data: {
            status: 'read'
          }
        });
        
        return {
          success: true
        };
        
      case 'delete':
        // 删除消息
        await db.collection('messages').doc(data.id).remove();
        
        return {
          success: true
        };
        
      case 'getUnreadCount':
        // 获取未读消息数量
        const unreadCountRes = await db.collection('messages').where({
          userId: openid,
          status: 'unread'
        }).count();
        
        return {
          success: true,
          count: unreadCountRes.total
        };
        
      default:
        return {
          success: false,
          error: '未知的操作'
        };
    }
  } catch (e) {
    console.error('云函数错误', e);
    return {
      success: false,
      error: e.message || '操作失败'
    };
  }
};
