// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 更新用户信息
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action, data } = event;
  
  try {
    switch (action) {
      case 'update':
        // 更新用户信息
        const updateRes = await db.collection('users').where({
          openid: openid
        }).update({
          data: {
            ...data,
            updateTime: db.serverDate()
          }
        });
        return {
          success: true,
          updated: updateRes.stats.updated
        };
        
      case 'get':
        // 获取用户信息
        const userRes = await db.collection('users').where({
          openid: openid
        }).get();
        return {
          success: true,
          data: userRes.data[0] || null
        };
        
      case 'getByOpenid':
        // 根据openid获取指定用户信息
        const targetUserRes = await db.collection('users').where({
          openid: data.openid
        }).get();
        return {
          success: true,
          data: targetUserRes.data[0] || null
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
