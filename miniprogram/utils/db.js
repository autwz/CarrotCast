// 云数据库操作封装
const db = wx.cloud.database();
const _ = db.command;

class DB {
  // 获取集合引用
  collection(name) {
    return db.collection(name);
  }
  
  // 添加文档
  async add(collectionName, data) {
    const res = await this.collection(collectionName).add({ data });
    return res;
  }
  
  // 查询单条记录
  async getOne(collectionName, id) {
    const res = await this.collection(collectionName).doc(id).get();
    return res.data;
  }
  
  // 查询列表
  async getList(collectionName, query = {}, options = {}) {
    const { skip = 0, limit = 20, orderBy = 'createTime', order = 'desc' } = options;
    const res = await this.collection(collectionName)
      .where(query)
      .orderBy(orderBy, order)
      .skip(skip)
      .limit(limit)
      .get();
    return res.data;
  }
  
  // 更新文档
  async update(collectionName, id, data) {
    const res = await this.collection(collectionName).doc(id).update({ data });
    return res;
  }
  
  // 删除文档
  async remove(collectionName, id) {
    const res = await this.collection(collectionName).doc(id).remove();
    return res;
  }
  
  // 统计数量
  async count(collectionName, query = {}) {
    const res = await this.collection(collectionName).where(query).count();
    return res.total;
  }
  
  // 批量查询（通过ID数组）
  async getByIds(collectionName, ids) {
    const res = await this.collection(collectionName)
      .where({
        _id: _.in(ids)
      })
      .get();
    return res.data;
  }
}

module.exports = new DB();
