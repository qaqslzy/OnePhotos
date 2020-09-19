import React, { useState, useEffect, useRef, memo } from 'react'
import Taro,  { uploadFile, Events } from '@tarojs/taro'
import { View, Text, OpenData, Image, ScrollView, Canvas, Button } from '@tarojs/components'
import './index.scss'
import Background from '../../images/background.png'
import Plus from '../../images/plus.png'
import getCanvasImg from './canvas'
import NewGuid from './guid'

const events = Taro.eventCenter

const db = Taro.cloud.database()

const enterDetial = (id, index) => {
  Taro.navigateTo({
    url: '../detail/detail?id=' + id + '&index=' + index,
  })
}



const uploadPhoto = (setCanvas, addData) => {
  Taro.chooseImage({
    count: 1
  }).then(res => {
    let urlo = res.tempFilePaths[0]
    let openid = Taro.getStorageSync('openid')
    Taro.showLoading({
      title: "上传中"
    })
    getCanvasImg(res.tempFilePaths[0], setCanvas, (tmpPath) => {
      let imgtmp, img
      Taro.cloud.uploadFile({
        cloudPath: openid + NewGuid() + '-tmp.png',
        filePath: tmpPath
      }).then(res => {
        imgtmp = res.fileID

        Taro.cloud.uploadFile({
          cloudPath: openid + NewGuid() + '.png',
          filePath: urlo
        }).then(res => {
          img = res.fileID
          Taro.cloud.callFunction({
            name: "uploadPhoto", data: {
              photoId: img,
              thumbId: imgtmp
            }
          }).then(res => {
            addData(res.result._id, imgtmp)
            enterDetial(res.result._id, 0)
            Taro.hideLoading()
          })
        }).catch(e => console.log(e))
      }).catch(e => console.log(e))
    })
  })
}

function Index() {

  const res = Taro.getSystemInfoSync()
  const height = res.screenHeight * 0.82 - 20
  const [data, setData] = useState([])
  const dataRef = useRef(data);
  const [canvas, setCanvas] = useState({ width: 0, height: 0 })
  const [needLoad, setNeedLoad] = useState(false)
  const [Logined, setLogined] = useState(!!Taro.getStorageSync('logined'))
  const dataLen = Math.ceil(data.length / 3)

  const Row = memo(({ index }) => {
    let length = data.length
    let n = index * 3
  
    return (
      <View className='rowPhotos'>
  
        <Image className='photo' mode='aspectFill' src={data[n].thumbId} lazyLoad onClick={() => enterDetial(data[n]._id, n)}></Image>
  
        {n + 1 < length &&
  
          <Image className='photo' mode='aspectFill' src={data[n + 1].thumbId} lazyLoad onClick={() => enterDetial(data[n + 1]._id, n + 1)}></Image>
        }
        {n + 2 < length &&
          <Image className='photo' mode='aspectFill' src={data[n + 2].thumbId} lazyLoad onClick={() => enterDetial(data[n + 2]._id, n + 2)}></Image>
        }
      </View>
    );
  })

  const login = () => {
    Taro.cloud.callFunction({ name: 'login' }).then(res => { Taro.setStorageSync("openid", res.result.openid) })
  }


  useEffect(() => {
    dataRef.current = data
  },[data])

  useEffect(() => {
    // 监听一个事件，接受参数
    events.on('deletePhoto', (arg) => {
      let d = dataRef.current
      d.splice(parseInt(arg.index), 1)
      setData([...d])
    })
  
  },[])
  // TODO 登录缓存OpenId

  useEffect(() => {
    Taro.getSetting().then(res => {
      setLogined(res.authSetting['scope.userInfo'])
      Taro.setStorageSync('logined', res.authSetting['scope.userInfo'])
    })
  }, [])

  useEffect(() => {
    Taro.cloud.callFunction({ name: 'getPhotos', data: { offset: 0 } }).then(res => { setData(res.result.data); setNeedLoad(res.result.data.length >= 30) })
    if (!!!Taro.getStorageSync('openid')) {
      login()
    }
  }, [])

  let content = []
  for (let i = 0; i < dataLen; i++) {
    content.push(<Row index={i}></Row>)
  }

  return (
    <View>
      <Canvas style={{ width: canvas.width, height: canvas.height, position: 'fixed', top: -1000, left: -1000 }} type="2d" id="myCanvas" ></Canvas>
      <View className='topContent' style={{ marginBottom: 20 }}>
        <View className='avatar'>
          <OpenData type='userAvatarUrl'></OpenData>

        </View>
        <View className='headText'>
          我自己
        </View>


      </View>
      <ScrollView style={{ height: height, width: "100%" }} scrollY onScrollToLower={() => {
        if (needLoad) {
          Taro.cloud.callFunction({ name: 'getPhotos', data: { offset: data.length } }).then(res => { setData(data.concat(res.result.data)); setNeedLoad(res.result.data.length >= 30) })
        }
      }}>
        {content}
        {
          data.length >= 30 && (needLoad ?
            <View className='btext'><Text>加载中...</Text></View>
            :
            <View className='btext'><Text>没有更多了</Text></View>)
        }
      </ScrollView>

      {dataLen <= 3 &&
        <Image src={Background} className='imgBackground' mode='aspectFit'>
        </Image>
      }


      <View className='add' onClick={() => uploadPhoto(setCanvas, (_id, imgtmp) => {
        setData([{
          _id: _id,
          thumbId: imgtmp
        }].concat(data))
      })}>
        <Image className='addIcon' src={Plus}></Image>
      </View>
    </View>
  )
}

export default Index