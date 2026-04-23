// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

// 操作日志记录函数
async function addOperationLog(collection, logData) {
  try {
    await collection.add({
      data: {
        ...logData,
        createTime: db.serverDate()
      }
    });
  } catch (e) {
    console.error('操作日志记录失败', e);
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { action, data } = event;
  
  try {
    switch (action) {
      case 'apply':
        // 申请加入招募
        // 检查是否已申请
        const existRes = await db.collection('participants').where({
          recruitmentId: data.recruitmentId,
          userId: openid
        }).get();
        
        if (existRes.data && existRes.data.length > 0) {
          return {
            success: false,
            error: '您已申请过此招募'
          };
        }
        
        // 获取招募信息用于发送站内信和验证角色
        const recruitment = await db.collection('recruitments').doc(data.recruitmentId).get();
        
        // 添加申请记录
        const addRes = await db.collection('participants').add({
          data: {
            recruitmentId: data.recruitmentId,
            recruitmentTitle: recruitment.data?.title || '',
            userId: openid,
            userNickname: data.userNickname || '',
            userBio: data.userBio || '',
            workLink: data.workLink || '',
            musicPageLink: data.musicPageLink || '',
            message: data.message || '',
            // 申请的职位类型
            applyRole: data.applyRole || 'other',
            applyRoleName: data.applyRoleName || '其他',
            status: 'pending', // pending, approved, rejected
            isAdmin: false,
            applyTime: db.serverDate(),
            reviewTime: null,
            reviewMessage: ''
          }
        });
        
        // 获取角色名称映射
        const roleNames = {
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
        
        // 向招募创建者发送站内信
        if (recruitment.data && recruitment.data.creatorId) {
          const roleName = roleNames[data.applyRole] || '其他';
          await db.collection('messages').add({
            data: {
              userId: recruitment.data.creatorId,
              recruitmentId: data.recruitmentId,
              recruitmentTitle: recruitment.data.title,
              fromUserId: openid,
              fromUserNickname: data.userNickname || '某用户',
              type: 'apply',
              title: '新的申请',
              content: `${data.userNickname || '某用户'}申请担任"${roleName}"角色加入您的招募"${recruitment.data.title}"`,
              status: 'unread',
              createTime: db.serverDate()
            }
          });
        }
        
        // 记录操作日志
        await addOperationLog(db.collection('operation_logs'), {
          type: 'apply',
          recruitmentId: data.recruitmentId,
          recruitmentTitle: recruitment.data?.title || '',
          userId: openid,
          userNickname: data.userNickname || '',
          targetUserId: openid,
          targetUserNickname: data.userNickname || '',
          applyRole: data.applyRole || 'other',
          status: 'pending',
          ip: wxContext.CLIENTIP || '',
          userAgent: 'miniprogram'
        });
        
        return {
          success: true,
          id: addRes._id
        };
        
      case 'review':
        // 审核申请（仅管理员可操作）
        const recruitmentForReview = await db.collection('recruitments').doc(data.recruitmentId).get();
        
        if (!recruitmentForReview.data) {
          return {
            success: false,
            error: '招募不存在'
          };
        }
        
        // 检查是否有管理员权限
        if (!recruitmentForReview.data.admins.includes(openid)) {
          return {
            success: false,
            error: '您没有权限审核此申请'
          };
        }
        
        // 获取申请者信息（审核前）
        const participantBefore = await db.collection('participants').doc(data.id).get();
        const oldStatus = participantBefore.data?.status;
        const applyRole = participantBefore.data?.applyRole || 'other';
        
        // 角色名称映射
        const roleNames = {
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
        
        // 更新申请状态
        await db.collection('participants').doc(data.id).update({
          data: {
            status: data.status, // approved, rejected
            reviewMessage: data.reviewMessage || '',
            reviewTime: db.serverDate()
          }
        });
        
        // 获取申请者信息
        const participant = await db.collection('participants').doc(data.id).get();
        
        // 获取审核者信息
        const reviewerRes = await db.collection('users').where({
          openid: openid
        }).get();
        const reviewerNickname = reviewerRes.data[0]?.nickname || '管理员';
        
        // 如果是批准，更新招募的参与者数量
        if (data.status === 'approved' && oldStatus !== 'approved') {
          await db.collection('recruitments').doc(data.recruitmentId).update({
            data: {
              participantCount: _.inc(1)
            }
          });
        }
        
        // 向申请者发送站内信
        const roleName = roleNames[applyRole] || '其他';
        const msgContent = data.status === 'approved' 
          ? `恭喜！您申请担任"${roleName}"的加入申请已通过`
          : `抱歉，您的加入申请未通过${data.reviewMessage ? '，原因：' + data.reviewMessage : ''}`;
        
        await db.collection('messages').add({
          data: {
            userId: participant.data.userId,
            recruitmentId: data.recruitmentId,
            recruitmentTitle: recruitmentForReview.data.title,
            type: 'review',
            title: data.status === 'approved' ? '申请已通过' : '申请未通过',
            content: msgContent,
            status: 'unread',
            createTime: db.serverDate()
          }
        });
        
        // 记录操作日志
        await addOperationLog(db.collection('operation_logs'), {
          type: 'review',
          action: data.status === 'approved' ? 'approve' : 'reject',
          recruitmentId: data.recruitmentId,
          recruitmentTitle: recruitmentForReview.data.title,
          userId: openid,
          userNickname: reviewerNickname,
          targetUserId: participant.data.userId,
          targetUserNickname: participant.data.userNickname || '',
          participantId: data.id,
          oldStatus,
          newStatus: data.status,
          applyRole,
          reviewMessage: data.reviewMessage || '',
          ip: wxContext.CLIENTIP || '',
          userAgent: 'miniprogram'
        });
        
        return {
          success: true
        };
        
      case 'getApplyList':
        // 获取招募的申请列表（仅管理员可见）
        const recruitmentForList = await db.collection('recruitments').doc(data.recruitmentId).get();
        
        if (!recruitmentForList.data) {
          return {
            success: false,
            error: '招募不存在'
          };
        }
        
        // 检查权限
        const isAdmin = recruitmentForList.data.admins.includes(openid);
        
        const applyListRes = await db.collection('participants')
          .where({
            recruitmentId: data.recruitmentId
          })
          .orderBy('applyTime', 'desc')
          .get();
        
        // 角色名称映射
        const roleNames = {
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
        
        // 获取申请者用户信息
        const applicantIds = applyListRes.data.map(p => p.userId);
        let usersMap = {};
        if (applicantIds.length > 0) {
          const usersRes = await db.collection('users').where({
            openid: _.in([...new Set(applicantIds)])
          }).get();
          usersRes.data.forEach(u => {
            usersMap[u.openid] = u;
          });
        }
        
        const applyListWithUser = applyListRes.data.map(p => ({
          ...p,
          userAvatar: usersMap[p.userId]?.avatar || '',
          userNickname: usersMap[p.userId]?.nickname || '匿名用户',
          userBio: usersMap[p.userId]?.bio || '',
          isSelf: p.userId === openid,
          canReview: isAdmin && p.status === 'pending',
          applyRoleName: roleNames[p.applyRole] || p.applyRole || '其他'
        }));
        
        return {
          success: true,
          data: applyListWithUser,
          isAdmin
        };
        
      case 'setAdmin':
        // 设置/取消管理员权限
        const recruitmentForAdmin = await db.collection('recruitments').doc(data.recruitmentId).get();
        
        if (!recruitmentForAdmin.data) {
          return {
            success: false,
            error: '招募不存在'
          };
        }
        
        // 只有创建者可以设置管理员
        if (recruitmentForAdmin.data.creatorId !== openid) {
          return {
            success: false,
            error: '只有创建者可以设置管理员'
          };
        }
        
        let admins = [...recruitmentForAdmin.data.admins];
        if (data.action === 'add') {
          if (!admins.includes(data.targetUserId)) {
            admins.push(data.targetUserId);
          }
        } else {
          admins = admins.filter(id => id !== data.targetUserId);
        }
        
        await db.collection('recruitments').doc(data.recruitmentId).update({
          data: {
            admins
          }
        });
        
        // 更新参与者的管理员标记
        await db.collection('participants').where({
          recruitmentId: data.recruitmentId,
          userId: data.targetUserId
        }).update({
          data: {
            isAdmin: admins.includes(data.targetUserId)
          }
        });
        
        return {
          success: true
        };
        
      case 'getMyApplyStatus':
        // 获取我在某个招募中的申请状态
        const myApply = await db.collection('participants').where({
          recruitmentId: data.recruitmentId,
          userId: openid
        }).get();
        
        return {
          success: true,
          data: myApply.data[0] || null
        };
        
      case 'remove':
        // 移除参与者（仅管理员可操作）
        const recruitmentForRemove = await db.collection('recruitments').doc(data.recruitmentId).get();
        
        if (!recruitmentForRemove.data) {
          return {
            success: false,
            error: '招募不存在'
          };
        }
        
        // 检查是否有管理员权限
        if (!recruitmentForRemove.data.admins.includes(openid)) {
          return {
            success: false,
            error: '您没有权限移除参与者'
          };
        }
        
        // 不能移除创建者
        if (recruitmentForRemove.data.creatorId === data.targetUserId) {
          return {
            success: false,
            error: '不能移除创建者'
          };
        }
        
        // 获取被移除者信息
        const targetParticipant = await db.collection('participants').where({
          recruitmentId: data.recruitmentId,
          userId: data.targetUserId
        }).get();
        
        if (targetParticipant.data.length === 0) {
          return {
            success: false,
            error: '参与者不存在'
          };
        }
        
        const removedNickname = targetParticipant.data[0].userNickname || '';
        
        // 删除参与者记录
        await db.collection('participants').doc(targetParticipant.data[0]._id).remove();
        
        // 获取操作者信息
        const removerRes = await db.collection('users').where({
          openid: openid
        }).get();
        const removerNickname = removerRes.data[0]?.nickname || '管理员';
        
        // 向被移除者发送站内信
        await db.collection('messages').add({
          data: {
            userId: data.targetUserId,
            recruitmentId: data.recruitmentId,
            recruitmentTitle: recruitmentForRemove.data.title,
            type: 'remove',
            title: '已被移除',
            content: `您已被移除出招募"${recruitmentForRemove.data.title}"${data.reason ? '，原因：' + data.reason : ''}`,
            status: 'unread',
            createTime: db.serverDate()
          }
        });
        
        // 记录操作日志
        await addOperationLog(db.collection('operation_logs'), {
          type: 'remove',
          recruitmentId: data.recruitmentId,
          recruitmentTitle: recruitmentForRemove.data.title,
          userId: openid,
          userNickname: removerNickname,
          targetUserId: data.targetUserId,
          targetUserNickname: removedNickname,
          reason: data.reason || '',
          ip: wxContext.CLIENTIP || '',
          userAgent: 'miniprogram'
        });
        
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
