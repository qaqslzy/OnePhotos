// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
exports.main = async (event, context) => {
  const pageSize = 30
  let { OPENID, APPID, UNIONID } = cloud.getWXContext()
  let offset = event.offset
  if (!offset && offset !== 0) {
    offset = 0
  }
  try {
    // TODO 只获取想要的数据
    return await db.collection('photos').where({
      _openid: OPENID
    })
    .skip(offset)
    .limit(pageSize)
    .orderBy('time', 'desc')
    .get()
  } catch (e) {
    console.error(e)
  }
}