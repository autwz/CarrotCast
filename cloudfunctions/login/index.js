// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  // 获取用户信息
  let userInfo = null;
  try {
    const userRes = await db.collection('users').where({
      openid: openid
    }).get();
    
    if (userRes.data && userRes.data.length > 0) {
      userInfo = userRes.data[0];
    }
  } catch (e) {
    console.error('查询用户失败', e);
  }
  
  // 如果用户不存在，自动创建
  if (!userInfo) {
    try {
      await db.collection('users').add({
        data: {
          openid: openid,
          nickname: '',
          qq: '',
          wechat: '',
          phone: '',
          bio: '',
          avatar: '',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });
      userInfo = {
        openid: openid,
        nickname: '',
        qq: '',
        wechat: '',
        phone: '',
        bio: '',
        avatar: ''
      };
    } catch (e) {
      console.error('创建用户失败', e);
      return {
        success: false,
        error: '登录失败'
      };
    }
  }
  
  return {
    success: true,
    data: userInfo
  };
};
