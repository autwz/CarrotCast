// app.js
App({
  globalData: {
    env: 'cloud1-d0gdt6ry287d6c9c0', // 云环境ID
    userInfo: null,
    isLoggedIn: false
  },
  
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }
    this.checkLoginStatus();
  },
  
  // 检查登录状态
  checkLoginStatus: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.openid) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
    }
  },
  
  // 更新用户信息
  updateUserInfo: function(userInfo) {
    this.globalData.userInfo = userInfo;
    this.globalData.isLoggedIn = true;
    wx.setStorageSync('userInfo', userInfo);
  },
  
  // 清除登录状态
  clearLoginStatus: function() {
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    wx.removeStorageSync('userInfo');
  }
});
