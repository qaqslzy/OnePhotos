// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command
exports.main = async (event, context) => {
  let { OPENID, APPID, UNIONID } = cloud.getWXContext()
  try {

    // parentId 是回复的主评论的id， replyId是被回复用户的id
    if (event.parentId || event.relpyId) {

      return await db.collection('comments').doc(event.parentId).update({
        data: {
          children: _.push([{
            createrId: OPENID,
            content: event.content
          }])
        }
      })

    }

    // 这个是主评论的添加

    return await db.collection('comments').add({
      data: {
        createrId: OPENID,
        photoId: event.photoId,
        pownerId: event.pownerId,
        children: [],
        content: event.content
      }
    })

  } catch (e) {
    console.error(e)
  }
}