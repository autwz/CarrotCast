const app = getApp();
const { showLoading, hideLoading, showError, showSuccess } = require('../../utils/util');

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    showLoginModal: false,
    myRecruitmentCount: 0,
    unreadCount: 0,
    isAdmin: false
  },

  onLoad: function (options) {
    // 如果URL带有action=login，显示登录弹窗
    if (options.action === 'login') {
      this.setData({ showLoginModal: true });
    }
  },

  onShow: function () {
    this.checkLoginStatus();
  },

  onPullDownRefresh: function () {
    this.checkLoginStatus();
    wx.stopPullDownRefresh();
  },

  // 检查登录状态
  checkLoginStatus: function () {
    const userInfo = app.globalData.userInfo;
    const isLoggedIn = app.globalData.isLoggedIn;
    
    this.setData({
      isLoggedIn,
      userInfo
    });

    if (isLoggedIn) {
      this.loadUserData();
      this.checkAdminStatus();
    }
  },

  // 加载用户数据
  loadUserData: function () {
    // 获取我的招募数量
    wx.cloud.callFunction({
      name: 'recruitment',
      data: {
        action: 'myList',
        data: {}
      }
    }).then(res => {
      if (res.result.success) {
        this.setData({
          myRecruitmentCount: res.result.created.length
        });
      }
    }).catch(err => {
      console.error('获取我的招募数量失败', err);
    });

    // 获取未读消息数量
    wx.cloud.callFunction({
      name: 'message',
      data: {
        action: 'getUnreadCount',
        data: {}
      }
    }).then(res => {
      if (res.result.success) {
        this.setData({
          unreadCount: res.result.count
        });
      }
    }).catch(err => {
      console.error('获取未读消息数量失败', err);
    });
  },

  // 显示登录弹窗
  onLogin: function () {
    this.setData({ showLoginModal: true });
  },

  // 隐藏登录弹窗
  hideLoginModal: function () {
    this.setData({ showLoginModal: false });
  },

  // 阻止事件冒泡
  preventBubble: function () {},

  // 获取手机号回调（简化版，实际可结合云开发获取）
  onGetPhoneNumber: function (e) {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 用户同意授权
      this.doLogin();
    } else {
      // 用户拒绝或出错，使用匿名登录
      this.doLogin(true);
    }
  },

  // 执行登录
  doLogin: function (anonymous = false) {
    showLoading('登录中...');

    wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then(res => {
      hideLoading();
      this.hideLoginModal();

      if (res.result.success) {
        const userInfo = res.result.data;
        app.updateUserInfo(userInfo);
        this.setData({
          isLoggedIn: true,
          userInfo
        });
        showSuccess('登录成功');
        this.loadUserData();
      } else {
        showError(res.result.error || '登录失败');
      }
    }).catch(err => {
      hideLoading();
      console.error('登录失败', err);
      showError('网络错误');
    });
  },

  // 跳转到编辑资料
  goToEditProfile: function () {
    if (!this.data.isLoggedIn) {
      this.onLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/edit-profile/edit-profile'
    });
  },

  // 跳转到我的招募
  goToMyRecruitments: function () {
    if (!this.data.isLoggedIn) {
      this.onLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/my-recruitments/my-recruitments'
    });
  },

  // 跳转到站内信
  goToMessages: function () {
    if (!this.data.isLoggedIn) {
      this.onLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/messages/messages'
    });
  },

  // 检查是否为小程序管理员
  checkAdminStatus: function () {
    wx.cloud.callFunction({
      name: 'feedback',
      data: {
        action: 'checkIsAdmin',
        data: {}
      }
    }).then(res => {
      if (res.result.success) {
        this.setData({ isAdmin: res.result.isAdmin });
      }
    }).catch(err => {
      console.error('检查管理员状态失败', err);
    });
  },

  // 跳转到反馈页面
  goToFeedback: function () {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  // 跳转到反馈管理页面（管理员）
  goToFeedbackList: function () {
    if (!this.data.isAdmin) {
      showError('无权限访问');
      return;
    }
    wx.navigateTo({
      url: '/pages/feedback-list/feedback-list'
    });
  },

  // 跳转到创建招募
  goToCreate: function () {
    if (!this.data.isLoggedIn) {
      this.onLogin();
      return;
    }
    wx.navigateTo({
      url: '/pages/recruitment-form/recruitment-form'
    });
  },

  // 退出登录
  onLogout: function () {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearLoginStatus();
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            myRecruitmentCount: 0,
            unreadCount: 0
          });
          showSuccess('已退出登录');
        }
      }
    });
  }
});
