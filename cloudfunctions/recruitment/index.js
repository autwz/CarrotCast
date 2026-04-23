// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action, data } = event;
  
  try {
    switch (action) {
      case 'create':
        // 创建招募
        const createRes = await db.collection('recruitments').add({
          data: {
            title: data.title || '',
            type: data.type || 'original', // original: 原创, cover: 翻唱
            musicType: data.musicType || '',
            musicTypeName: data.musicTypeName || '',
            coverImage: data.coverImage || '',
            deadline: data.deadline || null,
            tags: data.tags || [],
            externalLinks: data.externalLinks || [],
            status: data.status || 'draft', // draft, recruiting, completed, published
            // 职位需求：格式 [{roleId: 'singer', count: 2}, ...]
            positionNeeds: data.positionNeeds || [],
            // 作品发布链接
            publishUrl: data.publishUrl || '',
            // 团队交流渠道（参与者可见）
            teamQQ: data.teamQQ || '',
            teamWechat: data.teamWechat || '',
            teamNotes: data.teamNotes || '',
            creatorId: openid,
            admins: [openid], // 管理员列表
            participantCount: 1, // 创建者自动加入，所以初始为1
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        });

        // 自动将创建者加入参与者（作为创建者标记，不算申请）
        const creatorRes = await db.collection('users').where({ openid }).get();
        await db.collection('participants').add({
          data: {
            recruitmentId: createRes._id,
            recruitmentTitle: data.title || '',
            userId: openid,
            userNickname: creatorRes.data[0]?.nickname || '创建者',
            role: 'creator', // 特殊角色：创建者
            status: 'approved',
            applyTime: db.serverDate(),
            reviewTime: db.serverDate(),
            reviewMessage: '创建者自动加入',
            isCreator: true
          }
        });

        return {
          success: true,
          id: createRes._id
        };
        
      case 'update':
        // 更新招募信息
        const updateData = {
          ...data,
          updateTime: db.serverDate()
        };
        delete updateData._id;
        delete updateData.creatorId; // 创建者不可更改
        
        const updateRes = await db.collection('recruitments').doc(data._id).update({
          data: updateData
        });
        
        // 如果是发布招募，发送站内信给所有参与者
        if (data.status === 'recruiting' && data.originalStatus === 'draft') {
          // 查询该招募的所有参与者
          const participants = await db.collection('participants').where({
            recruitmentId: data._id
          }).get();
          
          // 向参与者发送通知
          for (const p of participants.data) {
            await db.collection('messages').add({
              data: {
                userId: p.userId,
                recruitmentId: data._id,
                recruitmentTitle: data.title,
                type: 'notice',
                title: '招募已发布',
                content: `您参与的招募"${data.title}"已开始招募！`,
                status: 'unread',
                createTime: db.serverDate()
              }
            });
          }
        }
        
        return {
          success: true,
          updated: updateRes.stats.updated
        };
        
      case 'get':
        // 获取招募详情
        const recruitment = await db.collection('recruitments').doc(data.id).get();
        
        // 补充职位需求的 roleName（如果缺失）
        const ROLE_TYPE_NAMES = {
          singer: '歌手',
          lyricist: '词作',
          composer: '曲作',
          arranger: '编曲',
          mixer: '混音',
          mastering: '母带',
          producer: '监制',
          other: '其他'
        };
        
        if (recruitment.data && recruitment.data.positionNeeds) {
          recruitment.data.positionNeeds = recruitment.data.positionNeeds.map(p => ({
            ...p,
            roleName: p.roleName || ROLE_TYPE_NAMES[p.roleId] || p.roleId
          }));
        }
        
        // 获取创建者信息
        let creatorInfo = null;
        if (recruitment.data && recruitment.data.creatorId) {
          const userRes = await db.collection('users').where({
            openid: recruitment.data.creatorId
          }).get();
          creatorInfo = userRes.data[0] || null;
        }
        
        // 获取参与者列表
        const participants = await db.collection('participants').where({
          recruitmentId: data.id,
          status: 'approved'
        }).get();
        
        // 获取参与者用户信息
        let participantList = [];
        if (participants.data.length > 0) {
          const userIds = participants.data.map(p => p.userId);
          const uniqueUserIds = [...new Set(userIds)];
          const usersRes = await db.collection('users').where({
            openid: _.in(uniqueUserIds)
          }).get();
          
          participantList = participants.data.map(p => {
            const user = usersRes.data.find(u => u.openid === p.userId) || {};
            return {
              ...p,
              nickname: user.nickname || '匿名用户',
              avatar: user.avatar || ''
            };
          });
        }
        
        // 统计各职位人数
        const roleCountMap = {};
        participantList.forEach(p => {
          const role = p.role || 'other';
          roleCountMap[role] = (roleCountMap[role] || 0) + 1;
        });
        
        // 获取申请统计
        const allParticipants = await db.collection('participants').where({
          recruitmentId: data.id
        }).count();
        
        return {
          success: true,
          data: {
            ...recruitment.data,
            creatorInfo,
            participantList,
            participantCount: participantList.length,
            roleCountMap,
            totalApplyCount: allParticipants.total
          }
        };
        
      case 'list':
        // 获取招募列表
        const { page = 1, pageSize = 10, status, type, musicType, keyword } = data;
        const query = {};
        
        // 默认只显示非草稿状态的招募
        if (status) {
          query.status = status;
        } else {
          query.status = _.neq('draft');
        }
        
        if (type) {
          query.type = type;
        }
        
        if (musicType) {
          query.musicType = musicType;
        }
        
        if (keyword) {
          query.title = db.RegExp({
            regexp: keyword,
            options: 'i'
          });
        }
        
        const listRes = await db.collection('recruitments')
          .where(query)
          .orderBy('createTime', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get();
        
        // 获取创建者信息
        const creatorIds = [...new Set(listRes.data.map(r => r.creatorId))];
        let creatorsMap = {};
        if (creatorIds.length > 0) {
          const creatorsRes = await db.collection('users').where({
            openid: _.in(creatorIds)
          }).get();
          creatorsRes.data.forEach(u => {
            creatorsMap[u.openid] = u;
          });
        }
        
        const listWithCreator = listRes.data.map(r => ({
          ...r,
          creatorNickname: creatorsMap[r.creatorId]?.nickname || '匿名用户',
          creatorAvatar: creatorsMap[r.creatorId]?.avatar || ''
        }));
        
        return {
          success: true,
          data: listWithCreator,
          total: listRes.data.length
        };
        
      case 'myList':
        // 获取我参与的招募列表
        const myParticipantRes = await db.collection('participants').where({
          userId: openid
        }).get();
        
        const myRecruitmentIds = myParticipantRes.data.map(p => p.recruitmentId);
        
        // 也要包含我创建的招募
        const myCreatedRes = await db.collection('recruitments').where({
          creatorId: openid
        }).get();
        
        const allMyIds = [...new Set([...myRecruitmentIds, ...myCreatedRes.data.map(r => r._id)])];
        
        if (allMyIds.length === 0) {
          return {
            success: true,
            data: [],
            created: [],
            participated: []
          };
        }
        
        const myRecruitmentsRes = await db.collection('recruitments')
          .where({
            _id: _.in(allMyIds)
          })
          .orderBy('createTime', 'desc')
          .get();
        
        // 标记哪些是我创建的
        const createdIds = myCreatedRes.data.map(r => r._id);
        const myListWithFlag = myRecruitmentsRes.data.map(r => ({
          ...r,
          isCreator: createdIds.includes(r._id)
        }));
        
        return {
          success: true,
          data: myListWithFlag,
          created: myListWithFlag.filter(r => r.isCreator),
          participated: myListWithFlag.filter(r => !r.isCreator)
        };
        
      case 'delete':
        // 删除招募（仅创建者可删除）
        const recruitmentToDelete = await db.collection('recruitments').doc(data.id).get();
        if (!recruitmentToDelete.data) {
          return {
            success: false,
            error: '招募不存在'
          };
        }
        if (recruitmentToDelete.data.creatorId !== openid) {
          return {
            success: false,
            error: '仅创建者可删除'
          };
        }
        
        // 删除招募相关的参与者和消息
        await db.collection('participants').where({
          recruitmentId: data.id
        }).remove();
        
        await db.collection('messages').where({
          recruitmentId: data.id
        }).remove();
        
        // 删除招募
        await db.collection('recruitments').doc(data.id).remove();
        
        return {
          success: true
        };
        
      default:
        return {
          success: false,
          error: '未知的操作'
        };
    }
  } catch (e) {
    console.error('云函数错误', e);
    return {
      success: false,
      error: e.message || '操作失败'
    };
  }
};
