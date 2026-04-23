const app = getApp();
const { showLoading, hideLoading, showError, getRelativeTime } = require('../../utils/util');

Page({
  data: {
    messageList: [],
    unreadCount: 0,
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false
  },

  onLoad: function () {
    this.loadMessages();
  },

  onShow: function () {
    this.loadMessages();
  },

  onPullDownRefresh: function () {
    this.setData({ page: 1, messageList: [] });
    this.loadMessages();
    wx.stopPullDownRefresh();
  },

  // 加载消息列表
  loadMessages: function () {
    if (this.data.loading) return;

    this.setData({ loading: true });

    wx.cloud.callFunction({
      name: 'message',
      data: {
        action: 'list',
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize
        }
      }
    }).then(res => {
      this.setData({ loading: false });

      if (res.result.success) {
        const newList = res.result.data;
        this.setData({
          messageList: this.data.page === 1 ? newList : this.data.messageList.concat(newList),
          unreadCount: res.result.unreadCount,
          hasMore: newList.length >= this.data.pageSize
        });
      } else {
        showError(res.result.error || '加载失败');
      }
    }).catch(err => {
      this.setData({ loading: false });
      console.error('加载消息列表失败', err);
      showError('网络错误');
    });
  },

  // 加载更多
  onLoadMore: function () {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1 });
    this.loadMessages();
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

  // 获取相对时间
  getRelativeTime: function (date) {
    return getRelativeTime(date);
  },

  // 跳转到消息详情
  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/message-detail/message-detail?id=${id}`
    });
  },

  // 跳转到招募详情
  goToRecruitment: function (e) {
    const id = e.currentTarget.dataset.id;
    e.stopPropagation();
    wx.navigateTo({
      url: `/pages/recruitment-detail/recruitment-detail?id=${id}`
    });
  },

  // 全部标为已读
  markAllRead: function () {
    wx.cloud.callFunction({
      name: 'message',
      data: {
        action: 'markAllRead',
        data: {}
      }
    }).then(res => {
      if (res.result.success) {
        this.setData({
          page: 1,
          messageList: [],
          unreadCount: 0
        });
        this.loadMessages();
      }
    }).catch(err => {
      console.error('标记全部已读失败', err);
    });
  }
});
