const app = getApp();
const { showLoading, hideLoading, showError, showSuccess, formatDate, getStatusText, getApplyStatusText, isExpired, copyText } = require('../../utils/util');
const { ROLE_TYPES } = require('../../utils/constants');

// 角色名称映射
const ROLE_NAMES = {
  singer: '歌手',
  lyricist: '词作',
  composer: '曲作',
  arranger: '编曲',
  mixer: '混音',
  mastering: '母带',
  producer: '监制',
  other: '其他',
  creator: '创建者'
};

Page({
  data: {
    loading: true,
    recruitment: null,
    participantList: [],
    roleCountMap: {},
    isLoggedIn: false,
    isAdmin: false,
    isParticipant: false,
    isFull: false,
    myApplyStatus: null,
    showApplyModal: false,
    showRemoveModal: false,
    removeTarget: null,
    roleTypes: ROLE_TYPES,
    applyForm: {
      userNickname: '',
      userBio: '',
      workLink: '',
      musicPageLink: '',
      message: '',
      applyRole: 'singer',
      applyRoleName: '歌手'
    }
  },

  onLoad: function (options) {
    this.setData({ id: options.id });
    
    // 检查登录状态
    const userInfo = app.globalData.userInfo;
    this.setData({ 
      isLoggedIn: !!userInfo,
      'applyForm.userNickname': userInfo?.nickname || ''
    });

    this.loadRecruitmentDetail();
  },

  onShow: function () {
    // 刷新详情
    if (this.data.id) {
      this.loadRecruitmentDetail();
    }
  },

  // 加载招募详情
  loadRecruitmentDetail: function () {
    this.setData({ loading: true });
    
    wx.cloud.callFunction({
      name: 'recruitment',
      data: {
        action: 'get',
        data: { id: this.data.id }
      }
    }).then(res => {
      this.setData({ loading: false });
      
        if (res.result.success) {
        const recruitment = res.result.data;
        const userInfo = app.globalData.userInfo;
        const isAdmin = userInfo && recruitment.admins && recruitment.admins.includes(userInfo.openid);
        
        // 判断是否为参与者（包括创建者）
        const isParticipant = userInfo && (
          recruitment.creatorId === userInfo.openid ||
          (recruitment.participantList || []).some(p => p.userId === userInfo.openid)
        );
        
        // 计算总招募人数（职位需求总和）
        const totalNeededCount = (recruitment.positionNeeds || []).reduce((sum, p) => sum + (p.count || 0), 0);
        
        // 标记创建者和职位信息
        const participantList = (recruitment.participantList || []).map(p => ({
          ...p,
          isCreator: p.userId === recruitment.creatorId,
          roleName: p.role && p.role !== 'creator' ? (ROLE_NAMES[p.role] || p.role) : (p.isCreator ? '创建者' : '参与者')
        }));
        
        // 处理职位需求，添加角色名称
        const positionNeeds = (recruitment.positionNeeds || []).map(p => ({
          ...p,
          roleName: ROLE_NAMES[p.roleId] || p.roleId
        }));
        
        // 计算除创建者外的参与者数量（创建者不算职位需求中）
        const nonCreatorCount = participantList.filter(p => !p.isCreator).length;
        
        // 判断是否招募已满：除创建者外的参与者 >= 职位需求总数
        const isFull = nonCreatorCount >= totalNeededCount && totalNeededCount > 0;
        
        this.setData({
          recruitment: { ...recruitment, positionNeeds, totalNeededCount },
          participantList,
          nonCreatorCount,
          roleCountMap: recruitment.roleCountMap || {},
          isAdmin,
          isParticipant,
          isFull
        });

        // 如果已登录，检查我的申请状态
        if (userInfo) {
          this.checkMyApplyStatus();
        }
        
        // 如果招募已满且状态仍为招募中，提示是否进入制作中
        if (isFull && recruitment.status === 'recruiting') {
          this.showCompletePrompt();
        }
      } else {
        showError(res.result.error || '加载失败');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    }).catch(err => {
      this.setData({ loading: false });
      console.error('加载招募详情失败', err);
      showError('网络错误');
    });
  },

  // 检查我的申请状态
  checkMyApplyStatus: function () {
    const userInfo = app.globalData.userInfo;
    if (!userInfo) return;

    wx.cloud.callFunction({
      name: 'participant',
      data: {
        action: 'getMyApplyStatus',
        data: { recruitmentId: this.data.id }
      }
    }).then(res => {
      if (res.result.success) {
        this.setData({ myApplyStatus: res.result.data });
      }
    }).catch(err => {
      console.error('检查申请状态失败', err);
    });
  },

  // 跳转到登录页
  goToLogin: function () {
    wx.navigateTo({
      url: '/pages/user/user?action=login'
    });
  },

  // 跳转到用户主页
  goToUserProfile: function (e) {
    const openid = e.currentTarget.dataset.openid;
    // 可以扩展为查看他人资料
  },

  // 显示申请弹窗
  showApplyModal: function () {
    if (!this.data.isLoggedIn) {
      this.goToLogin();
      return;
    }
    this.setData({ showApplyModal: true });
  },

  // 隐藏申请弹窗
  hideApplyModal: function () {
    this.setData({ showApplyModal: false });
  },

  // 阻止事件冒泡
  preventBubble: function () {},

  // 申请表单输入
  onApplyInput: function (e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`applyForm.${field}`]: e.detail.value
    });
  },

  // 选择申请职位
  onSelectRole: function (e) {
    const { roleid, rolename } = e.currentTarget.dataset;
    this.setData({
      'applyForm.applyRole': roleid,
      'applyForm.applyRoleName': rolename
    });
  },

  // 提交申请
  submitApply: function () {
    const { applyForm } = this.data;
    
    // 验证昵称
    if (!applyForm.userNickname.trim()) {
      showError('请输入昵称');
      return;
    }

    showLoading('提交中...');

    wx.cloud.callFunction({
      name: 'participant',
      data: {
        action: 'apply',
        data: {
          recruitmentId: this.data.id,
          userNickname: applyForm.userNickname,
          userBio: applyForm.userBio,
          workLink: applyForm.workLink,
          musicPageLink: applyForm.musicPageLink,
          message: applyForm.message,
          applyRole: applyForm.applyRole,
          applyRoleName: applyForm.applyRoleName
        }
      }
    }).then(res => {
      hideLoading();
      
      if (res.result.success) {
        showSuccess('申请已提交');
        this.hideApplyModal();
        this.checkMyApplyStatus();
      } else {
        showError(res.result.error || '提交失败');
      }
    }).catch(err => {
      hideLoading();
      console.error('提交申请失败', err);
      showError('网络错误');
    });
  },

  // 显示移除参与者确认弹窗
  onRemoveParticipant: function (e) {
    const { userid, nickname } = e.currentTarget.dataset;
    this.setData({
      showRemoveModal: true,
      removeTarget: {
        userId: userid,
        nickname: nickname
      }
    });
  },

  // 隐藏移除弹窗
  hideRemoveModal: function () {
    this.setData({
      showRemoveModal: false,
      removeTarget: null
    });
  },

  // 确认移除参与者
  confirmRemove: function () {
    const { removeTarget } = this.data;
    if (!removeTarget) return;

    showLoading('移除中...');

    wx.cloud.callFunction({
      name: 'participant',
      data: {
        action: 'remove',
        data: {
          recruitmentId: this.data.id,
          targetUserId: removeTarget.userId,
          reason: ''
        }
      }
    }).then(res => {
      hideLoading();
      
      if (res.result.success) {
        showSuccess('已移除该参与者');
        this.hideRemoveModal();
        this.loadRecruitmentDetail();
      } else {
        showError(res.result.error || '移除失败');
      }
    }).catch(err => {
      hideLoading();
      console.error('移除参与者失败', err);
      showError('网络错误');
    });
  },

  // 复制链接
  onCopyLink: function (e) {
    const link = e.currentTarget.dataset.link;
    copyText(link);
  },

  // 跳转到编辑页面
  goToEdit: function () {
    wx.navigateTo({
      url: `/pages/recruitment-form/recruitment-form?id=${this.data.id}`
    });
  },

  // 跳转到申请列表
  goToApplyList: function () {
    wx.navigateTo({
      url: `/pages/apply-list/apply-list?recruitmentId=${this.data.id}&title=${encodeURIComponent(this.data.recruitment.title)}`
    });
  },

  // 显示招募完成提示
  showCompletePrompt: function () {
    const { nonCreatorCount, recruitment } = this.data;
    const needed = recruitment.totalNeededCount;
    wx.showModal({
      title: '人员已招募完成',
      content: `已招募 ${nonCreatorCount} 人，职位需求 ${needed} 人已满足，是否将状态修改为"制作中"？`,
      confirmText: '立即修改',
      cancelText: '暂不修改',
      success: (res) => {
        if (res.confirm) {
          this.updateStatusToCompleted();
        }
      }
    });
  },

  // 更新状态为制作中
  updateStatusToCompleted: function () {
    showLoading('保存中...');

    wx.cloud.callFunction({
      name: 'recruitment',
      data: {
        action: 'update',
        data: {
          _id: this.data.id,
          status: 'completed',
          originalStatus: this.data.recruitment.status
        }
      }
    }).then(res => {
      hideLoading();
      
      if (res.result.success) {
        showSuccess('已修改为制作中');
        this.loadRecruitmentDetail();
      } else {
        showError(res.result.error || '修改失败');
      }
    }).catch(err => {
      hideLoading();
      console.error('修改状态失败', err);
      showError('网络错误');
    });
  },

  // 工具函数
  formatDate: formatDate,
  getStatusText: getStatusText,
  getApplyStatusText: getApplyStatusText,
  isExpired: isExpired
});
