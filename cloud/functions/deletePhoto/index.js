// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
exports.main = async (event, context) => {  
  let { OPENID, APPID, UNIONID } = cloud.getWXContext()
  try {
    // TODO 只获取想要的数据
    return await db.collection('photos').where({
      _openid: OPENID,
      _id: event.photoId
    }).remove()
  } catch (e) {
    console.error(e)
  }
}