import Taro from '@tarojs/taro'

export default function getCanvasImg(tempFilePath, setCanvas, upload) {
    Taro.getImageInfo({
        src: tempFilePath,
        success: function (res) {
            //---------利用canvas压缩图片--------------
            var ratio = 1;
            var canvasWidth = res.width //图片原始长宽
            var canvasHeight = res.height
            while (canvasWidth > 500 || canvasHeight > 500) {// 保证宽高在400以内
                ratio *= 2;
                canvasWidth = Math.trunc(res.width / ratio)
                canvasHeight = Math.trunc(res.height / ratio)
            }
            setCanvas({
                width: canvasWidth,
                height: canvasHeight
            })

            const query = wx.createSelectorQuery()
            query.select('#myCanvas')
                .fields({ node: true, size: true }).exec((res) => {
                    const canvas = res[0].node
                    let img = canvas.createImage()
                    const ctx = canvas.getContext('2d')
                    img.src = tempFilePath
                    img.onload = () => {
                        canvas.width = canvasWidth
                        canvas.height = canvasHeight
                        ctx.scale(1/ ratio , 1/ ratio)
                        ctx.drawImage(img, 0, 0)
                        Taro.canvasToTempFilePath({
                            canvas: canvas,
                            fileType:"jpg"
                        }).then(res => {
                            upload(res.tempFilePath)
                            ctx.scale(ratio, ratio)
                        })
                    }
                })
        }
    })
}