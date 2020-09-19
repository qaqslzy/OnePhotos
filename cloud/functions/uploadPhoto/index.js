// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
exports.main = async (event, context) => {

  let { OPENID, APPID, UNIONID } = cloud.getWXContext()

  try {

    let data = {
      _openid: OPENID,
      thumbId: event.thumbId,
      photoId: event.photoId,
      time: db.serverDate(),
      likeNum: 0, 
      like:[]
    }

    return await db.collection('photos').add({
      // data 字段表示需新增的 JSON 数据
      data: data
    })
    
  } catch (e) {
    console.error(e)
  }
}