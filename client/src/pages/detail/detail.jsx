import Taro, { Events } from '@tarojs/taro'
import React, { useState, useEffect, useRef, memo } from 'react'
import { View, Image, Text, Input, OpenData } from '@tarojs/components'
import './detail.scss'
import Love from '../../images/love.png'
import UnLove from '../../images/love-line2.png'

import Send from '../../images/send.png'
import Back from '../../images/chevron-left.png'

const db = Taro.cloud.database({
    env:'product-iv9ht'
})
const events = Taro.eventCenter
const $ = db.command.aggregate
const _ = db.command

function Detail(props) {
    const [photo, setPhoto] = useState({})
    const [replyContent, setReplyContent] = useState('')
    const [comments, setComments] = useState([])
    const [replyFocus, setReplyFocus] = useState(false)
    
    const id = Taro.getCurrentInstance().router.params.id
    const index = Taro.getCurrentInstance().router.params.index
    const openid = Taro.getStorageSync('openid')
    const replyRef = useRef({});

    const buildComments = (c) => {
        let cArray = []
        for (let i = 0; i < c.length; i++) {
            cArray.push(<ParentComments data={c[i]} />)
            for (let j = 0; j < c[i].children.length; j++) {
                c[i].children[j]['_id'] = c[i]._id
                c[i].children[j]['_openid'] = c[i].children[j]['createrId']
                c[i].children[j]['createrId'] = c[i].createrId
                c[i].children[j]['isChild'] = true
                cArray.push(<ChildComments data={c[i].children[j]} />)
            }
        }
        setComments(cArray)
    }

    const clickLike = () => {
        if (photo.isLike) {
            photo.likeNum -= 1
        } else {
            photo.likeNum += 1
        }
        Taro.cloud.callFunction({ name: 'likePhoto', data: { photoId: photo._id } })
        photo.isLike = !photo.isLike
        setPhoto({...photo})
    }

    const getComments = (tphoto) => {

        db.collection('comments').where({ photoId: tphoto._id }).get().then(res => {
            buildComments(res.data)
        })
    }

    const sendMessage = () => {
        if (replyContent) {
            let data = {
                photoId: photo._id,
                pownerId: photo._openid,
                content: replyContent
            }
            let isChild = !!replyRef.current._id 
            if (isChild){
                if(!!replyRef.current.isChild){
                    data['replyId'] = replyRef.current._openid
                }else{
                    data['replyId'] = replyRef.current.createrId
                }
                data['parentId'] = replyRef.current._id
            }
            Taro.showLoading({ title: '发送中' })
            Taro.cloud.callFunction({
                name: 'sendComment', data: data
            }).then((res) => {
                // comments.push({})

                if(isChild){
                    data['isChild'] = true
                    data['_id'] = data['parentId']
                    data['_openid'] = openid
                    let index = 0
                    let i 
                    for (i = 0; i < comments.length; i++){
                        if(comments[i].props.data._id === data['parentId']){
                            index++
                        }else if(index > 0){
                            break
                        }
                    }
                    comments.splice(i, 0, <ChildComments data={data}/>)
                    setComments([...comments])

                }else{
                    data['createrId'] = openid
                    data['_id'] = res.result._id
                    setComments([...comments, <ParentComments data={data} />])
                }
                setReplyContent('')
                Taro.hideLoading()
            })
        }
    }

    useEffect(() => {
        db.collection('photos').aggregate().match({ _id: id }).project({
            // like:0,
            _openid: 1,
            likeNum: 1,
            photoId: 1,
            time: 1,
            userInfo: 1,
            isLike: $.in([openid, '$like'])
        }).end().then((res) => {
            setPhoto(res.list[0])
            getComments(res.list[0])
        })
    }, [id])

    var ClickImg = (id) => {
        Taro.previewImage({
            current: photo.photoId, // 当前显示图片的http链接
            urls: [photo.photoId] // 需要预览的图片http链接列表
        })
    }

    const ParentComments = ({ data }) => (
        <View className='comments' onClick={() => { replyRef.current = data;setReplyFocus(true);  setReplyContent('@' + ' '); }}>
            <OpenData className='name' type='userNickName'>{data.cnickName}</OpenData>
            <Text>&nbsp;&nbsp;{data.content}</Text>
        </View>
    )

    const ChildComments = ({ data }) => (
        <View className='child' onClick={() => { replyRef.current = data;setReplyFocus(true); setReplyContent('@' + ' ') }}>
            <OpenData className='name' type='userNickName'>{data.cnickName}</OpenData>
            <Text>&nbsp;&nbsp;{data.content}</Text>
        </View>
    )

    return (
        <View>
            <View className='back' onClick={() => Taro.navigateBack()}>
                <Image src={Back} mode='aspectFit' style={{ width: 7, height: 13 }}></Image>
            </View>
            <Image className='photo' mode='aspectFill' src={photo.photoId}
                onClick={() => { ClickImg(id) }}
            ></Image>
            <View style={{ marginLeft: 13, marginTop: 10, display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
                <View>
                    <Text className='likeNum'>{photo.likeNum} 次赞</Text>
                    {comments}
                    <View style={{ marginTop: 2 }}>
                        <Text className='time'>{photo.time && photo.time.getFullYear() + '年' + (photo.time.getMonth() + 1) + '月' + photo.time.getDate() + '日'}&nbsp;&nbsp;&nbsp;</Text>
                        {openid === photo._openid && <Text className='delete' onClick={() => {
                            Taro.showModal({
                                title: '提示',
                                content: '真的要删除这张照片吗？',
                                success: function (res) {
                                    if (res.confirm) {
                                        // Taro.showLoading()
                                        Taro.showLoading({ title: "删除中" })
                                        events.trigger('deletePhoto', { index: index })
                                        Taro.cloud.callFunction({ name: 'deletePhoto', data: { photoId: id } }).then(res => {
                                            Taro.hideLoading()
                                            Taro.navigateBack()
                                        })
                                    }
                                }
                            })
                        }}>删除</Text>}
                    </View>
                </View>
                <View style={{ position: 'absolute', right: 20 }}>
                    <Image mode='aspectFit' src={photo.isLike ? Love : UnLove} className='love' onClick={clickLike}></Image>
                </View>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <View className='postComments'>
                    <Input style={{ marginLeft: 15, width: '90%' }} type='text' placeholder='在此输入评论...' focus={replyFocus} autoFocus={replyFocus} onBlur={()=>{setReplyFocus(false)}} value={replyContent} onInput={(res) => {
                        let content = res.detail.value
                        if (replyRef.current.cnickName) {
                            if (!content.startsWith('@' + replyRef.current.cnickName + ' ')) {
                                replyRef.current = {}
                                content = ""
                            }
                        }
                        setReplyContent(content)
                    }}></Input>
                </View>
                <View style={{ marginLeft: 10 }} onClick={sendMessage}>
                    <Image mode='aspectFit' src={Send} className='send' ></Image>
                </View>
            </View>
        </View>
    )
}

export default Detail