const app = getApp();
const { showLoading, hideLoading, showError, formatDate, getStatusText, isExpired } = require('../../utils/util');

Page({
  data: {
    recruitmentList: [],
    keyword: '',
    currentType: '',
    currentStatus: '',
    selectedStatus: { value: '', name: '全部状态' },
    statusList: [
      { value: '', name: '全部状态' },
      { value: 'recruiting', name: '招募中' },
      { value: 'completed', name: '招募完成' },
      { value: 'published', name: '发布完成' }
    ],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad: function (options) {
    this._firstLoad = true;
    this.loadRecruitmentList();
  },

  onShow: function () {
    if (this._firstLoad) {
      this._firstLoad = false;
      return;
    }
    // 刷新列表
    this.setData({ page: 1, recruitmentList: [] });
    this.loadRecruitmentList();
  },

  onPullDownRefresh: function () {
    this.setData({ page: 1, recruitmentList: [] });
    this.loadRecruitmentList();
    wx.stopPullDownRefresh();
  },

  // 加载招募列表
  loadRecruitmentList: function () {
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    showLoading();

    wx.cloud.callFunction({
      name: 'recruitment',
      data: {
        action: 'list',
        data: {
          page: this.data.page,
          pageSize: this.data.pageSize,
          type: this.data.currentType,
          status: this.data.currentStatus,
          keyword: this.data.keyword
        }
      }
    }).then(res => {
      hideLoading();
      this.setData({ loading: false });
      
      if (res.result.success) {
        const newList = res.result.data.map(item => {
          // 无效的云存储 URL 使用默认图片
          if (item.coverImage && item.coverImage.startsWith('cloud://')) {
            item.coverImage = '/images/default-cover.png';
          }
          // 处理标签，最多显示3个
          item.displayTags = (item.tags || []).slice(0, 3);
          return item;
        });
        this.setData({
          recruitmentList: this.data.page === 1 ? newList : this.data.recruitmentList.concat(newList),
          hasMore: newList.length >= this.data.pageSize
        });
      } else {
        showError(res.result.error || '加载失败');
      }
    }).catch(err => {
      hideLoading();
      this.setData({ loading: false });
      console.error('加载招募列表失败', err);
      showError('网络错误');
    });
  },

  // 搜索相关
  onSearchInput: function (e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch: function () {
    this.setData({ page: 1, recruitmentList: [] });
    this.loadRecruitmentList();
  },

  // 筛选类型
  onFilterType: function (e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ currentType: type, page: 1, recruitmentList: [] });
    this.loadRecruitmentList();
  },

  // 筛选状态
  onStatusChange: function (e) {
    const index = e.detail.value;
    const status = this.data.statusList[index];
    this.setData({ 
      selectedStatus: status,
      currentStatus: status.value,
      page: 1,
      recruitmentList: []
    });
    this.loadRecruitmentList();
  },

  // 加载更多
  onLoadMore: function () {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1 });
    this.loadRecruitmentList();
  },

  // 跳转到详情页
  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/recruitment-detail/recruitment-detail?id=${id}`
    });
  },

  // 工具函数
  formatDate: formatDate,
  getStatusText: getStatusText,
  isExpired: isExpired
});
