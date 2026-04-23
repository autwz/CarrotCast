const app = getApp();
const { showLoading, hideLoading, showError, showSuccess, showModal } = require('../../utils/util');
const { MUSIC_TYPES, ROLE_TYPES } = require('../../utils/constants');

Page({
  data: {
    // 模式判断：是否为编辑模式
    isEdit: false,
    // 编辑时的招募ID
    id: '',
    // 原始状态（编辑时用于状态变更判断）
    originalStatus: '',
    
    // 表单数据
    formData: {
      coverImage: '',
      type: 'original',
      musicType: '',
      musicTypeName: '',
      title: '',
      description: '',
      budget: '',
      deadline: '',
      tags: [],
      status: 'draft',
      positionNeeds: [],
      publishUrl: '',
      // 团队交流渠道（参与者可见）
      teamQQ: '',
      teamWechat: '',
      teamNotes: ''
    },
    
    // 常量
    musicTypes: MUSIC_TYPES,
    roleTypes: ROLE_TYPES,
    
    // 状态
    saving: false,
    publishing: false,
    deleting: false,
    
    // 职位选择弹窗
    showPositionModal: false,
    selectedPositionIndex: -1,
    availablePositions: []
  },

  onLoad: function (options) {
    // 判断是新建还是编辑
    if (options.id) {
      // 编辑模式
      this.setData({
        isEdit: true,
        id: options.id
      });
      this.loadRecruitment(options.id);
    } else {
      // 创建模式
      this.setData({
        isEdit: false
      });
    }
  },

  // 设置页面标题
  onReady: function () {
    const title = this.data.isEdit ? '编辑招募' : '发起招募';
    wx.setNavigationBarTitle({ title });
  },

  // 加载招募信息（编辑模式）
  loadRecruitment: function (id) {
    showLoading('加载中...');

    wx.cloud.callFunction({
      name: 'recruitment',
      data: {
        action: 'get',
        data: { id }
      }
    }).then(res => {
      hideLoading();
      
      if (res.result.success) {
        const recruitment = res.result.data;
        this.setData({
          formData: {
            coverImage: recruitment.coverImage || '',
            type: recruitment.type || 'original',
            musicType: recruitment.musicType || '',
            musicTypeName: recruitment.musicTypeName || '',
            title: recruitment.title || '',
            description: recruitment.description || '',
            budget: recruitment.budget || '',
            deadline: recruitment.deadline || '',
            tags: recruitment.tags || [],
            status: recruitment.status || 'draft',
            positionNeeds: recruitment.positionNeeds || [],
            publishUrl: recruitment.publishUrl || '',
            teamQQ: recruitment.teamQQ || '',
            teamWechat: recruitment.teamWechat || '',
            teamNotes: recruitment.teamNotes || ''
          },
          originalStatus: recruitment.status
        });
      } else {
        showError(res.result.error || '加载失败');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }).catch(err => {
      hideLoading();
      console.error('加载招募失败', err);
      showError('网络错误');
    });
  },

  // 选择封面
  chooseCover: function () {
    // 制作中/已发布状态不允许修改封面
    const { formData } = this.data;
    if (formData.status === 'completed' || formData.status === 'published') {
      showError('制作中/已发布状态不允许修改');
      return;
    }
    
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFile = res.tempFiles[0];
        // 检查文件大小（限制5MB）
        const maxSize = 5 * 1024 * 1024;
        if (tempFile.size > maxSize) {
          showError('封面图片不能超过5MB，请选择更小的图片');
          return;
        }
        const tempFilePath = tempFile.tempFilePath;
        this.uploadCover(tempFilePath);
      }
    });
  },

  // 上传封面
  uploadCover: function (filePath) {
    showLoading('上传中...');
    
    const timestamp = Date.now();
    const cloudPath = `covers/${app.globalData.userInfo.openid}_${timestamp}.jpg`;
    
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => {
        this.setData({
          'formData.coverImage': res.fileID
        });
        hideLoading();
        showSuccess('上传成功');
      },
      fail: (err) => {
        hideLoading();
        console.error('上传封面失败', err);
        showError('上传失败');
      }
    });
  },

  // 选择类型
  selectType: function (e) {
    const { formData } = this.data;
    if (formData.status === 'completed' || formData.status === 'published') {
      showError('制作中/已发布状态不允许修改');
      return;
    }
    const type = e.currentTarget.dataset.type;
    this.setData({
      'formData.type': type
    });
  },

  // 选择音乐类型
  selectMusicType: function (e) {
    const { formData } = this.data;
    if (formData.status === 'completed' || formData.status === 'published') {
      showError('制作中/已发布状态不允许修改');
      return;
    }
    const index = e.detail.value;
    const musicType = this.data.musicTypes[index];
    this.setData({
      'formData.musicType': musicType.id,
      'formData.musicTypeName': musicType.name
    });
  },

  // 输入处理
  onInput: function (e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`formData.${field}`]: e.detail.value
    });
  },

  // 选择截止日期
  selectDeadline: function (e) {
    this.setData({
      'formData.deadline': e.detail.value
    });
  },

  // 选择状态
  selectStatus: function (e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      'formData.status': status
    });
  },

  // 添加标签
  addTag: function (e) {
    const { formData } = this.data;
    if (formData.status === 'completed' || formData.status === 'published') {
      showError('制作中/已发布状态不允许修改');
      return;
    }
    
    const tag = e.detail.value.trim();
    if (!tag) return;
    
    const tags = this.data.formData.tags;
    if (tags.includes(tag)) {
      showError('标签已存在');
      return;
    }
    if (tags.length >= 5) {
      showError('最多添加5个标签');
      return;
    }
    
    this.setData({
      'formData.tags': [...tags, tag]
    });
  },

  // 删除标签
  removeTag: function (e) {
    const index = e.currentTarget.dataset.index;
    const tags = [...this.data.formData.tags];
    tags.splice(index, 1);
    this.setData({
      'formData.tags': tags
    });
  },

  // ==================== 职位需求相关 ====================

  // 获取可选的职位列表（排除已添加的）
  getAvailablePositions: function () {
    const addedRoleIds = this.data.formData.positionNeeds.map(p => p.roleId);
    return this.data.roleTypes.filter(role => !addedRoleIds.includes(role.id));
  },

  // 显示职位选择弹窗
  showPositionPicker: function () {
    const { formData } = this.data;
    if (formData.status === 'completed' || formData.status === 'published') {
      showError('制作中/已发布状态不允许修改职位');
      return;
    }
    this.setData({
      showPositionModal: true,
      selectedPositionIndex: -1,
      availablePositions: this.getAvailablePositions()
    });
  },

  // 隐藏职位选择弹窗
  hidePositionPicker: function () {
    this.setData({
      showPositionModal: false,
      selectedPositionIndex: -1
    });
  },

  // 阻止事件冒泡
  preventBubble: function () {},

  // 选择职位
  selectPosition: function (e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      selectedPositionIndex: index
    });
  },

  // 确认添加职位
  confirmAddPosition: function () {
    const { selectedPositionIndex, availablePositions, formData } = this.data;
    
    if (selectedPositionIndex < 0) {
      showError('请选择职位');
      return;
    }
    
    const selectedRole = availablePositions[selectedPositionIndex];
    const newPosition = {
      roleId: selectedRole.id,
      roleName: selectedRole.name,
      count: 1
    };
    
    this.setData({
      'formData.positionNeeds': [...formData.positionNeeds, newPosition],
      showPositionModal: false,
      selectedPositionIndex: -1
    });
  },

  // 删除职位
  removePosition: function (e) {
    const index = e.currentTarget.dataset.index;
    const positionNeeds = [...this.data.formData.positionNeeds];
    positionNeeds.splice(index, 1);
    this.setData({
      'formData.positionNeeds': positionNeeds
    });
  },

  // 职位数量变化
  onPositionCountChange: function (e) {
    const index = e.currentTarget.dataset.index;
    const value = parseInt(e.detail.value) || 0;
    const positionNeeds = [...this.data.formData.positionNeeds];
    positionNeeds[index].count = Math.max(0, Math.min(99, value));
    this.setData({
      'formData.positionNeeds': positionNeeds
    });
  },

  // ==================== 验证与提交 ====================

  // 验证表单
  validateForm: function () {
    const { formData } = this.data;

    if (!formData.title.trim()) {
      showError('请输入招募标题');
      return false;
    }

    if (!formData.musicType) {
      showError('请选择音乐类型');
      return false;
    }

    return true;
  },

  // 获取有效的职位需求
  getValidPositionNeeds: function () {
    const { formData } = this.data;
    return (formData.positionNeeds || [])
      .filter(p => p.count > 0 && p.roleId)
      .map(p => ({
        roleId: p.roleId,
        roleName: p.roleName || this.getRoleNameById(p.roleId),
        count: p.count
      }));
  },

  // 根据roleId获取职位名称
  getRoleNameById: function (roleId) {
    const role = this.data.roleTypes.find(r => r.id === roleId);
    return role ? role.name : roleId;
  },

  // 保存为草稿（创建模式）
  saveAsDraft: function () {
    const { formData } = this.data;
    
    // 草稿模式只验证标题
    if (!formData.title.trim()) {
      showError('请输入招募标题');
      return;
    }

    this.setData({ saving: true });
    showLoading('保存中...');

    wx.cloud.callFunction({
      name: 'recruitment',
      data: {
        action: 'create',
        data: {
          title: formData.title,
          type: formData.type,
          musicType: formData.musicType,
          musicTypeName: formData.musicTypeName,
          coverImage: formData.coverImage,
          description: formData.description || '',
          budget: formData.budget || '',
          deadline: formData.deadline || null,
          tags: formData.tags,
          status: 'draft',
          positionNeeds: this.getValidPositionNeeds(),
          teamQQ: formData.teamQQ || '',
          teamWechat: formData.teamWechat || '',
          teamNotes: formData.teamNotes || ''
        }
      }
    }).then(res => {
      this.setData({ saving: false });
      hideLoading();

      if (res.result.success) {
        showSuccess('草稿保存成功');
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/my-recruitments/my-recruitments`
          });
        }, 1500);
      } else {
        showError(res.result.error || '保存失败');
      }
    }).catch(err => {
      this.setData({ saving: false });
      hideLoading();
      console.error('保存失败', err);
      showError('网络错误');
    });
  },

  // 发布招募（创建模式）
  publish: function () {
    if (!this.validateForm()) return;

    this.setData({ publishing: true });
    showLoading('发布中...');

    wx.cloud.callFunction({
      name: 'recruitment',
      data: {
        action: 'create',
        data: {
          title: this.data.formData.title,
          type: this.data.formData.type,
          musicType: this.data.formData.musicType,
          musicTypeName: this.data.formData.musicTypeName,
          coverImage: this.data.formData.coverImage,
          description: this.data.formData.description || '',
          budget: this.data.formData.budget || '',
          deadline: this.data.formData.deadline || null,
          tags: this.data.formData.tags,
          status: 'recruiting',
          positionNeeds: this.getValidPositionNeeds(),
          teamQQ: this.data.formData.teamQQ || '',
          teamWechat: this.data.formData.teamWechat || '',
          teamNotes: this.data.formData.teamNotes || ''
        }
      }
    }).then(res => {
      this.setData({ publishing: false });
      hideLoading();

      if (res.result.success) {
        showSuccess('发布成功');
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/my-recruitments/my-recruitments`
          });
        }, 1500);
      } else {
        showError(res.result.error || '发布失败');
      }
    }).catch(err => {
      this.setData({ publishing: false });
      hideLoading();
      console.error('发布失败', err);
      showError('网络错误');
    });
  },

  // 保存修改（编辑模式）
  saveChanges: function () {
    const { formData, originalStatus } = this.data;
    
    // 制作中/已发布状态只能修改状态
    if (formData.status === 'completed' || formData.status === 'published') {
      this.setData({ saving: true });
      showLoading('保存中...');

      wx.cloud.callFunction({
        name: 'recruitment',
        data: {
          action: 'update',
          data: {
            _id: this.data.id,
            status: formData.status,
            originalStatus: originalStatus,
            publishUrl: formData.publishUrl || '',
            teamQQ: formData.teamQQ || '',
            teamWechat: formData.teamWechat || '',
            teamNotes: formData.teamNotes || ''
          }
        }
      }).then(res => {
        this.setData({ saving: false });
        hideLoading();

        if (res.result.success) {
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
        console.error('保存失败', err);
        showError('网络错误');
      });
      return;
    }
    
    // 非制作中/已发布状态，完整验证
    if (!this.validateForm()) return;
    
    this.setData({ saving: true });
    showLoading('保存中...');

    wx.cloud.callFunction({
      name: 'recruitment',
      data: {
        action: 'update',
        data: {
          _id: this.data.id,
          title: formData.title,
          type: formData.type,
          musicType: formData.musicType,
          musicTypeName: formData.musicTypeName,
          coverImage: formData.coverImage,
          description: formData.description || '',
          budget: formData.budget || '',
          deadline: formData.deadline || null,
          tags: formData.tags,
          status: formData.status,
          originalStatus: originalStatus,
          positionNeeds: this.getValidPositionNeeds(),
          publishUrl: formData.publishUrl || '',
          teamQQ: formData.teamQQ || '',
          teamWechat: formData.teamWechat || '',
          teamNotes: formData.teamNotes || ''
        }
      }
    }).then(res => {
      this.setData({ saving: false });
      hideLoading();

      if (res.result.success) {
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
      console.error('保存失败', err);
      showError('网络错误');
    });
  },

  // 删除招募（编辑模式）
  deleteRecruitment: async function () {
    const confirmed = await showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除此招募吗？'
    });

    if (!confirmed) return;

    this.setData({ deleting: true });
    showLoading('删除中...');

    wx.cloud.callFunction({
      name: 'recruitment',
      data: {
        action: 'delete',
        data: { id: this.data.id }
      }
    }).then(res => {
      this.setData({ deleting: false });
      hideLoading();

      if (res.result.success) {
        showSuccess('删除成功');
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/my-recruitments/my-recruitments'
          });
        }, 1500);
      } else {
        showError(res.result.error || '删除失败');
      }
    }).catch(err => {
      this.setData({ deleting: false });
      hideLoading();
      console.error('删除失败', err);
      showError('网络错误');
    });
  }
});
