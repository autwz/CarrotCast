const app = getApp();
const { showLoading, hideLoading, showError, showSuccess, formatDate, copyText } = require('../../utils/util');

Page({
  data: {
    recruitmentId: '',
    recruitmentTitle: '',
    currentTab: 'pending',
    applyList: [],
    filteredList: [],
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    isAdmin: false,
    showReviewModal: false,
    currentApply: {},
    reviewAction: '',
    reviewMessage: '',
    submitting: false
  },

  onLoad: function (options) {
    this.setData({
      recruitmentId: options.recruitmentId,
      recruitmentTitle: decodeURIComponent(options.title || '招募详情')
    });
    this.loadApplyList();
  },

  onShow: function () {
    this.loadApplyList();
  },

  // 根据申请列表和当前标签更新过滤后的列表和计数
  updateFilteredList: function () {
    const { applyList, currentTab } = this.data;
    const pendingCount = applyList.filter(item => item.status === 'pending').length;
    const approvedCount = applyList.filter(item => item.status === 'approved').length;
    const rejectedCount = applyList.filter(item => item.status === 'rejected').length;
    const filteredList = applyList.filter(item => item.status === currentTab);

    this.setData({
      filteredList,
      pendingCount,
      approvedCount,
      rejectedCount
    });
  },

  // 加载申请列表
  loadApplyList: function () {
    showLoading();

    wx.cloud.callFunction({
      name: 'participant',
      data: {
        action: 'getApplyList',
        data: { recruitmentId: this.data.recruitmentId }
      }
    }).then(res => {
      hideLoading();
      
      if (res.result.success) {
        this.setData({
          applyList: res.result.data,
          isAdmin: res.result.isAdmin
        });
        this.updateFilteredList();
      } else {
        showError(res.result.error || '加载失败');
      }
    }).catch(err => {
      hideLoading();
      console.error('加载申请列表失败', err);
      showError('网络错误');
    });
  },

  // 切换标签
  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    this.updateFilteredList();
  },

  // 获取标签名称
  getTabName: function (tab) {
    const names = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已拒绝'
    };
    return names[tab] || '';
  },

  // 显示审核弹窗
  showReviewModal: function (e) {
    const item = e.currentTarget.dataset.item;
    const action = e.currentTarget.dataset.action;
    this.setData({
      showReviewModal: true,
      currentApply: item,
      reviewAction: action,
      reviewMessage: ''
    });
  },

  // 隐藏审核弹窗
  hideReviewModal: function () {
    this.setData({
      showReviewModal: false,
      currentApply: {},
      reviewAction: '',
      reviewMessage: ''
    });
  },

  // 阻止事件冒泡
  preventBubble: function () {},

  // 审核留言输入
  onReviewMessageInput: function (e) {
    this.setData({ reviewMessage: e.detail.value });
  },

  // 提交审核
  submitReview: function () {
    const { currentApply, reviewAction, reviewMessage } = this.data;
    
    this.setData({ submitting: true });

    wx.cloud.callFunction({
      name: 'participant',
      data: {
        action: 'review',
        data: {
          id: currentApply._id,
          recruitmentId: this.data.recruitmentId,
          status: reviewAction === 'approve' ? 'approved' : 'rejected',
          reviewMessage
        }
      }
    }).then(res => {
      this.setData({ submitting: false });
      
      if (res.result.success) {
        showSuccess(reviewAction === 'approve' ? '已通过申请' : '已拒绝申请');
        this.hideReviewModal();
        this.loadApplyList();  // 手动刷新列表
      } else {
        showError(res.result.error || '操作失败');
      }
    }).catch(err => {
      this.setData({ submitting: false });
      console.error('审核失败', err);
      showError('网络错误');
    });
  },

  // 设置管理员
  setAdmin: function (e) {
    const userId = e.currentTarget.dataset.userid;
    const nickname = e.currentTarget.dataset.nickname;

    wx.showModal({
      title: '设置管理员',
      content: `确定将 ${nickname} 设为管理员？管理员将拥有编辑招募的权限。`,
      success: (res) => {
        if (res.confirm) {
          this.doSetAdmin(userId, 'add');
        }
      }
    });
  },

  // 执行设置管理员
  doSetAdmin: function (userId, action) {
    showLoading();

    wx.cloud.callFunction({
      name: 'participant',
      data: {
        action: 'setAdmin',
        data: {
          recruitmentId: this.data.recruitmentId,
          targetUserId: userId,
          action
        }
      }
    }).then(res => {
      hideLoading();
      
      if (res.result.success) {
        showSuccess('设置成功');
        // 不手动刷新，依赖 onShow 自动刷新
      } else {
        showError(res.result.error || '操作失败');
      }
    }).catch(err => {
      hideLoading();
      console.error('设置管理员失败', err);
      showError('网络错误');
    });
  },

  // 复制链接
  copyLink: function (e) {
    const link = e.currentTarget.dataset.link;
    copyText(link);
  },

  // 工具函数
  formatDate: formatDate
});
