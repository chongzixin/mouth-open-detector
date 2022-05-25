const video = document.getElementById('webcam_video')

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]).then(startWebcam)

function startWebcam() { 
    navigator.mediaDevices.getUserMedia(
        { video: {} })
        .then(stream => { 
            video.srcObject = stream 
        })
        .catch( err => { 
            console.log('Failed to get local stream' ,err); 
        }
    )
}

startWebcam();

video.addEventListener('play', () => {
    //create the canvas from video element as we have created above
    const canvas = faceapi.createCanvasFromMedia(video);
    //append canvas to body or the dom element where you want to append it
    document.body.append(canvas)
    // displaySize will help us to match the dimension with video screen and accordingly it will draw our detections
    // on the streaming video screen
    const displaySize = { width: video.width, height: video.height }
    faceapi.matchDimensions(canvas, displaySize)
    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
      const resizedDetections = faceapi.resizeResults(detections, displaySize)
      const context = canvas.getContext("2d")
      context.clearRect(0, 0, canvas.width, canvas.height)
      faceapi.draw.drawDetections(canvas, resizedDetections)
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

      const isMouthOpen = checkMouthOpen(detections[0].landmarks.getMouth())
      const canvasText = isMouthOpen ? "Mouth is open" : "Mouth is closed"
      context.fillStyle = "pink"
      context.font = "bold 45px Arial"
      context.fillText(canvasText, (canvas.width / 2) - 200, (canvas.height / 4))
    }, 100)
})

function getLipHeight(lip, isUpper) {
    const indexArray = isUpper ? [[10,19], [9,18], [8,17]] : [[2,13], [3,14], [4,15]]
    sum = 0
    for(let [d1,d2] of indexArray) {
        distance = Math.sqrt((lip[d1].x - lip[d2].x)**2 + 
                            (lip[d1].y - lip[d2].y)**2)
        sum += distance
    }
    return sum/3
}

function getMouthHeight(lip) {
    const indexArray = [[17,15],[18,14],[19,13]]
    sum = 0
    for(let [d1,d2] of indexArray) {
        distance = Math.sqrt((lip[d1].x - lip[d2].x)**2 + 
                            (lip[d1].y - lip[d2].y)**2)
        sum += distance
    }
    return sum/3
}

function checkMouthOpen(lip) {
    topLipHeight = getLipHeight(lip, true)
    bottomLipHeight = getLipHeight(lip, false)
    mouthHeight = getMouthHeight(lip)
    // console.log("topLipHeight: " + topLipHeight)
    // console.log("bottomLipHeight: " + bottomLipHeight)
    // console.log("mouthHeight: " + mouthHeight)

    // if mouth is open more than lip height * ratio, return true
    ratio = 0.5
    return (mouthHeight > Math.min(topLipHeight, bottomLipHeight) * ratio) ? true : false
}