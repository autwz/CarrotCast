const app = getApp();
const { showLoading, hideLoading, showError, showSuccess } = require('../../utils/util');

Page({
  data: {
    feedbackList: [],
    currentTab: 'pending',
    pendingCount: 0,
    scheduledCount: 0,
    resolvedCount: 0,
    invalidCount: 0,
    loading: true,
    showStatusModal: false,
    currentItem: null,
    newStatus: '',
    adminReply: '',
    statusMap: {
      pending: '待处理',
      scheduled: '可排期',
      resolved: '已解决',
      invalid: '作废'
    },
    statusColor: {
      pending: '#faad14',
      scheduled: '#1890ff',
      resolved: '#52c41a',
      invalid: '#999'
    }
  },

  onLoad: function () {
    this._firstLoad = true;
    this.loadFeedbackList();
  },

  onShow: function () {
    if (this._firstLoad) {
      this._firstLoad = false;
      return;
    }
    this.loadFeedbackList();
  },

  // 加载反馈列表
  loadFeedbackList: function () {
    this.setData({ loading: true });

    wx.cloud.callFunction({
      name: 'feedback',
      data: {
        action: 'getList',
        data: {}
      }
    }).then(res => {
      if (res.result.success) {
        const list = res.result.data;
        this.setData({
          feedbackList: list,
          pendingCount: list.filter(f => f.status === 'pending').length,
          scheduledCount: list.filter(f => f.status === 'scheduled').length,
          resolvedCount: list.filter(f => f.status === 'resolved').length,
          invalidCount: list.filter(f => f.status === 'invalid').length,
          loading: false
        });
      } else {
        showError(res.result.error || '加载失败');
        this.setData({ loading: false });
      }
    }).catch(err => {
      console.error('获取反馈列表失败', err);
      this.setData({ loading: false });
      showError('网络错误');
    });
  },

  // 切换标签
  switchTab: function (e) {
    this.setData({ currentTab: e.currentTarget.dataset.tab });
  },

  // 获取过滤后的列表
  getFilteredList: function () {
    return this.data.feedbackList.filter(f => f.status === this.data.currentTab);
  },

  // 显示状态修改弹窗
  showStatusModal: function (e) {
    const item = e.currentTarget.dataset.item;
    const status = e.currentTarget.dataset.status;
    this.setData({
      showStatusModal: true,
      currentItem: item,
      newStatus: status,
      adminReply: ''
    });
  },

  // 隐藏弹窗
  hideStatusModal: function () {
    this.setData({
      showStatusModal: false,
      currentItem: null,
      newStatus: '',
      adminReply: ''
    });
  },

  // 阻止事件冒泡
  preventBubble: function () {},

  // 管理员回复输入
  onReplyInput: function (e) {
    this.setData({ adminReply: e.detail.value });
  },

  // 提交状态修改
  submitStatus: function () {
    const { currentItem, newStatus, adminReply } = this.data;
    if (!currentItem) return;

    showLoading('保存中...');

    wx.cloud.callFunction({
      name: 'feedback',
      data: {
        action: 'updateStatus',
        data: {
          id: currentItem._id,
          status: newStatus,
          adminReply: adminReply
        }
      }
    }).then(res => {
      hideLoading();
      if (res.result.success) {
        showSuccess('状态已更新');
        this.hideStatusModal();
        this.loadFeedbackList();
      } else {
        showError(res.result.error || '更新失败');
      }
    }).catch(err => {
      hideLoading();
      console.error('更新状态失败', err);
      showError('网络错误');
    });
  },

  // 格式化日期
  formatDate: function (dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = n => n < 10 ? '0' + n : n;
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
});
