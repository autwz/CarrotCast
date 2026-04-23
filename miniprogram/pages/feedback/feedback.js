const app = getApp();
const { showLoading, hideLoading, showError, showSuccess } = require('../../utils/util');

Page({
  data: {
    content: '',
    maxLength: 500,
    lastSubmitTime: 0
  },

  // 输入反馈内容
  onContentInput: function (e) {
    this.setData({
      content: e.detail.value
    });
  },

  // 提交反馈
  onSubmit: function () {
    const now = Date.now();
    if (now - this.data.lastSubmitTime < 10000) {
      showError('请稍后再提交');
      return;
    }

    const content = this.data.content.trim();
    if (!content) {
      showError('请输入反馈内容');
      return;
    }
    if (content.length > 500) {
      showError('反馈内容不能超过500字');
      return;
    }

    showLoading('提交中...');

    wx.cloud.callFunction({
      name: 'feedback',
      data: {
        action: 'submit',
        data: { content }
      }
    }).then(res => {
      hideLoading();
      if (res.result.success) {
        showSuccess('感谢反馈');
        this.setData({ content: '', lastSubmitTime: Date.now() });
      } else {
        showError(res.result.error || '提交失败');
      }
    }).catch(err => {
      hideLoading();
      console.error('提交反馈失败', err);
      showError('网络错误');
    });
  }
});
