// 工具函数库

// 显示加载提示
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title,
    mask: true
  });
};

// 隐藏加载提示
const hideLoading = () => {
  wx.hideLoading();
};

// 显示成功提示
const showSuccess = (title = '成功') => {
  wx.showToast({
    title,
    icon: 'success',
    duration: 2000
  });
};

// 显示错误提示
const showError = (title = '出错了') => {
  wx.showToast({
    title,
    icon: 'none',
    duration: 2000
  });
};

// 显示模态对话框
const showModal = (options) => {
  return new Promise((resolve) => {
    wx.showModal({
      title: options.title || '提示',
      content: options.content || '',
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      success: (res) => {
        resolve(res.confirm);
      }
    });
  });
};

// 验证链接格式
const validateLink = (link) => {
  if (!link) return true; // 空链接不验证
  const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
  return urlPattern.test(link);
};

// 复制文本到剪贴板
const copyText = (text) => {
  wx.setClipboardData({
    data: text,
    success: () => {
      showSuccess('已复制');
    },
    fail: () => {
      showError('复制失败');
    }
  });
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return '';
  
  // 如果是时间戳（数字）或者包含时间信息
  if (typeof date === 'number' || (typeof date === 'string' && date.length > 10)) {
    const d = new Date(date);
    // 检查是否是有效日期
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // 已经是 YYYY-MM-DD 格式，直接返回
  return date;
};

// 格式化日期时间
const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

// 获取相对时间
const getRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前';
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前';
  } else if (diff < week) {
    return Math.floor(diff / day) + '天前';
  } else {
    return formatDate(date);
  }
};

// 判断是否过期
const isExpired = (deadline) => {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
};

// 获取状态文字
const getStatusText = (status) => {
  const statusMap = {
    draft: '草稿',
    recruiting: '招募中',
    completed: '招募完成',
    published: '发布完成'
  };
  return statusMap[status] || status;
};

// 获取申请状态文字
const getApplyStatusText = (status) => {
  const statusMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  };
  return statusMap[status] || status;
};

// 获取招募类型文字
const getTypeText = (type) => {
  const typeMap = {
    original: '原创',
    cover: '翻唱'
  };
  return typeMap[type] || type;
};

// 获取全局应用实例
const getApp = () => {
  return getApp();
};

module.exports = {
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showModal,
  validateLink,
  copyText,
  formatDate,
  formatDateTime,
  getRelativeTime,
  isExpired,
  getStatusText,
  getApplyStatusText,
  getTypeText,
  getApp
};
