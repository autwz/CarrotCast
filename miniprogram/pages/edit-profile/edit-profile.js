const app = getApp();
const { showLoading, hideLoading, showError, showSuccess } = require('../../utils/util');

Page({
  data: {
    formData: {
      avatar: '',
      nickname: '',
      bio: '',
      qq: '',
      wechat: '',
      phone: ''
    },
    saving: false
  },

  onLoad: function () {
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo: function () {
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({
        formData: {
          avatar: userInfo.avatar || '',
          nickname: userInfo.nickname || '',
          bio: userInfo.bio || '',
          qq: userInfo.qq || '',
          wechat: userInfo.wechat || '',
          phone: userInfo.phone || ''
        }
      });
    }
  },

  // 输入处理
  onInput: function (e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  // 选择头像
  chooseAvatar: function () {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFile = res.tempFiles[0];
        // 检查文件大小（限制2MB）
        const maxSize = 2 * 1024 * 1024;
        if (tempFile.size > maxSize) {
          showError('头像图片不能超过2MB，请选择更小的图片');
          return;
        }
        const tempFilePath = tempFile.tempFilePath;
        this.uploadAvatar(tempFilePath);
      }
    });
  },

  // 上传头像
  uploadAvatar: function (filePath) {
    showLoading('上传中...');
    
    const timestamp = Date.now();
    const cloudPath = `avatars/${app.globalData.userInfo.openid}_${timestamp}.jpg`;
    
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => {
        this.setData({
          'formData.avatar': res.fileID
        });
        hideLoading();
        showSuccess('上传成功');
      },
      fail: (err) => {
        hideLoading();
        console.error('上传头像失败', err);
        showError('上传失败');
      }
    });
  },

  // 保存资料
  saveProfile: function () {
    const { formData } = this.data;

    // 验证昵称
    if (!formData.nickname.trim()) {
      showError('请输入昵称');
      return;
    }

    // 验证手机号格式
    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
      showError('手机号格式不正确');
      return;
    }

    this.setData({ saving: true });
    showLoading('保存中...');

    wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'update',
        data: {
          avatar: formData.avatar,
          nickname: formData.nickname,
          bio: formData.bio,
          qq: formData.qq,
          wechat: formData.wechat,
          phone: formData.phone
        }
      }
    }).then(res => {
      this.setData({ saving: false });
      hideLoading();

      if (res.result.success) {
        // 更新全局数据
        const updatedUserInfo = {
          ...app.globalData.userInfo,
          ...formData
        };
        app.updateUserInfo(updatedUserInfo);
        showSuccess('保存成功');
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        showError(res.result.error || '保存失败');
      }
    }).catch(err => {
      this.setData({ saving: false });
      hideLoading();
      console.error('保存资料失败', err);
      showError('网络错误');
    });
  }
});
