// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const $ = db.command.aggregate
const _ = db.command
exports.main = async (event, context) => {

  let { OPENID, APPID, UNIONID } = cloud.getWXContext()

  try {
    let id = event.photoId
    let like = await db.collection('photos').aggregate().match({ _id: id }).project({
      // like:0,
      isLike: $.in([OPENID, '$like'])
    }).end()
    like = like.list
    if (like.length > 0) {
      if (like[0].isLike) {
        return await db.collection('photos').doc(id).update({
          data: { like: _.pull(OPENID), likeNum: _.inc(-1) }
        })
      } else {
        return await db.collection('photos').doc(id).update({
          data: { like: _.addToSet(OPENID), likeNum: _.inc(1) }
        })
      }
    }else{
      return {errMsg:"error"}
    }
  } catch (e) {
    console.error(e)
  }
}