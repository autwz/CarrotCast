const app = getApp();
const { showLoading, hideLoading, showError, showSuccess, formatDateTime, showModal } = require('../../utils/util');

Page({
  data: {
    id: '',
    message: null,
    loading: true
  },

  onLoad: function (options) {
    this.setData({ id: options.id });
    this.loadMessage();
  },

  // 加载消息详情
  loadMessage: function () {
    this.setData({ loading: true });

    wx.cloud.callFunction({
      name: 'message',
      data: {
        action: 'get',
        data: { id: this.data.id }
      }
    }).then(res => {
      this.setData({ loading: false });

      if (res.result.success) {
        this.setData({ message: res.result.data });
      } else {
        showError(res.result.error || '加载失败');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }).catch(err => {
      this.setData({ loading: false });
      console.error('加载消息详情失败', err);
      showError('网络错误');
    });
  },

  // 获取消息图标
  getMessageIcon: function (type) {
    const icons = {
      notice: 'notice',
      apply: 'apply',
      review: 'review',
      system: 'system'
    };
    return icons[type] || 'message';
  },

  // 格式化日期时间
  formatDateTime: function (date) {
    return formatDateTime(date);
  },

  // 跳转到招募详情
  goToRecruitment: function () {
    const { message } = this.data;
    if (message && message.recruitmentId) {
      wx.navigateTo({
        url: `/pages/recruitment-detail/recruitment-detail?id=${message.recruitmentId}`
      });
    }
  },

  // 删除消息
  deleteMessage: async function () {
    const confirmed = await showModal({
      title: '确认删除',
      content: '确定要删除这条消息吗？'
    });

    if (!confirmed) return;

    wx.cloud.callFunction({
      name: 'message',
      data: {
        action: 'delete',
        data: { id: this.data.id }
      }
    }).then(res => {
      if (res.result.success) {
        showSuccess('删除成功');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        showError(res.result.error || '删除失败');
      }
    }).catch(err => {
      console.error('删除消息失败', err);
      showError('网络错误');
    });
  }
});
