const app = getApp();
const { showLoading, hideLoading, showError, formatDate, getStatusText } = require('../../utils/util');

Page({
  data: {
    currentTab: 'created',
    createdList: [],
    participatedList: [],
    loading: true
  },

  onLoad: function () {
    this.loadMyRecruitments();
  },

  onShow: function () {
    this.loadMyRecruitments();
  },

  onPullDownRefresh: function () {
    this.loadMyRecruitments();
    wx.stopPullDownRefresh();
  },

  // 加载我的招募
  loadMyRecruitments: function () {
    this.setData({ loading: true });

    wx.cloud.callFunction({
      name: 'recruitment',
      data: {
        action: 'myList',
        data: {}
      }
    }).then(res => {
      this.setData({ loading: false });
      
      if (res.result.success) {
        this.setData({
          createdList: res.result.created || [],
          participatedList: res.result.participated || []
        });
      } else {
        showError(res.result.error || '加载失败');
      }
    }).catch(err => {
      this.setData({ loading: false });
      console.error('加载我的招募失败', err);
      showError('网络错误');
    });
  },

  // 切换标签
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  // 跳转到详情
  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/recruitment-detail/recruitment-detail?id=${id}`
    });
  },

  // 跳转到申请列表
  goToApplyList: function (e) {
    const id = e.currentTarget.dataset.id;
    const title = e.currentTarget.dataset.title;
    wx.navigateTo({
      url: `/pages/apply-list/apply-list?recruitmentId=${id}&title=${encodeURIComponent(title)}`
    });
  },

  // 跳转到编辑
  goToEdit: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/recruitment-form/recruitment-form?id=${id}`
    });
  },

  // 跳转到创建
  goToCreate: function () {
    wx.navigateTo({
      url: '/pages/recruitment-form/recruitment-form'
    });
  },

  // 返回首页
  goToHome: function () {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 工具函数
  formatDate: formatDate,
  getStatusText: getStatusText
});
