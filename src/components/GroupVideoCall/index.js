import {Component, createRef} from 'react'
import Cookies from 'js-cookie'
import {Popup} from 'reactjs-popup'
import {
  getMyPeerObject,
  getSocketObject,
  getCurrentUserPhoneNo,
} from '../../context/callHandling'
import './index.css'

const iChatJwtToken = Cookies.get('ichat_jwt_token')

let mediaStreams = []
let myStream = null
let socket = null
let myPeer = null
let MyPhoneNo = null
let peers = {}
function addVideoStream(video, stream, mutedval) {
  const videosGrid = document.getElementById('all-videos')
  video.srcObject = stream
  video.muted = mutedval
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  const paragraphElement = document.createElement('p')
  paragraphElement.textContent = 'You'
  paragraphElement.classList.add('display-color')
  videosGrid.appendChild(paragraphElement)
}
function addUserVideoStream(stream, mutedval, joinedUserPhoneNo) {
  console.log('video in fun', mutedval)
  const video = document.createElement('video')
  const videosGrid = document.getElementById('all-videos')
  video.classList.add('currentVideo')
  video.srcObject = stream
  video.muted = mutedval
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videosGrid.appendChild(video)
  const paragraphElement = document.createElement('p')
  paragraphElement.textContent = joinedUserPhoneNo
  paragraphElement.classList.add('display-color')
  videosGrid.appendChild(paragraphElement)
}
class GroupVideoCall extends Component {
  constructor(props) {
    super(props)
    this.state = {
      joinedUserInfo: [],
    }
    this.currentVideo = createRef()
  }

  componentDidMount() {
    console.log('called component did mount')
    MyPhoneNo = getCurrentUserPhoneNo()
    this.initializeSocketConnection()
  }

  componentDidUpdate() {}

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleMouseMove)
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop())
    }
  }

  connectToNewUser = (userId, stream, joinedUserPhoneNo) => {
    const call = myPeer.call(userId, stream)

    // const video = this.incomingVideoRef.current
    call.on('stream', async userVideoStream => {
      if (!mediaStreams.includes(userVideoStream.id)) {
        mediaStreams.push(userVideoStream.id)
        const options = {
          headers: {
            Authorization: `Bearer ${iChatJwtToken}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({joinedUserPhoneNo}),
        }
        const response = await fetch(
          'https://ichat-server-production.up.railway.app/getName2',
          options,
        )
        const data = await response.json()
        console.log('response', response)
        console.log('repsonse recieved', data)
        addUserVideoStream(userVideoStream, false, data.name)
        console.log('triggered inside connect')
      }

      //   this.setState(
      //     prev => ({
      //       joinedUserInfo: [...prev.joinedUserInfo, userVideoStream],
      //     }),
      //     () => {
      //       console.log('current value2', this.state.joinedUserInfo)
      //     },
      //   )
    })
    // call.on('close', () => {
    //   video.remove()
    // })

    peers[userId] = call
  }

  initializeSocketConnection = async () => {
    const video = this.currentVideo.current

    try {
      myStream = await navigator.mediaDevices.getUserMedia({
        video: {
          aspectRatio: 16 / 9,
          facingMode: 'user',
        },
        audio: true,
      })
      addVideoStream(video, myStream, true)
      const options = {
        headers: {
          Authorization: `Bearer ${iChatJwtToken}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({streamId: myStream.id}),
      }

      fetch(
        'https://ichat-server-production.up.railway.app/storestreamId',
        options,
      )
        .then(response => response.json())
        .then(data => {
          if (data) {
            console.log(data)
          }
        })
        .catch(error => {
          console.error('An error occurred while fetching data:', error)
        })
    } catch (error) {
      console.error('Error accessing media stream:', error)
    }
    socket = getSocketObject()
    myPeer = getMyPeerObject()
    myPeer.on('call', call => {
      call.answer(myStream)

      //   joinCallSound.play()
      call.on('stream', async userVideoStream => {
        if (!mediaStreams.includes(userVideoStream.id)) {
          mediaStreams.push(userVideoStream.id)
          const options = {
            headers: {
              Authorization: `Bearer ${iChatJwtToken}`,
              'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({streamId: userVideoStream.id}),
          }
          const response = await fetch(
            'https://ichat-server-production.up.railway.app/getName',
            options,
          )
          const data = await response.json()
          console.log('response', response)
          console.log('repsonse recieved', data)
          //   setTimeout(() => {
          addUserVideoStream(userVideoStream, false, data.name)
          //   }, 1000)

          console.log('triggered inside')
          // this.setState(
          //   prev => ({
          //     joinedUserInfo: [...prev.joinedUserInfo, userVideoStream],
          //   }),
          //   () => {
          //     console.log('current value1', this.state.joinedUserInfo)
          //   },
          // )
        }
      })
    })

    socket.on('user-joined-call', (callerPeerId, joinedUserPhoneNo) => {
      console.log('triggerd')
      console.log('socketval,callerPeerId', callerPeerId)
      //   setTimeout(() => {
      this.connectToNewUser(callerPeerId, myStream, joinedUserPhoneNo)
      //   }, 1000)
    })
  }

  render() {
    // const {joinedUserInfo} = this.state
    // console.log('joinedUserInfo', joinedUserInfo)
    return (
      <>
        <div id="all-videos">
          <video ref={this.currentVideo} className="currentVideo"></video>
        </div>
        <Popup
          open
          closeOnDocumentClick={false}
          className="popup-container"
          overlayStyle={{
            background: 'transparent',
          }}
          contentStyle={{
            position: 'fixed',

            right: '10px',
            top: `10px`,
            width: '100px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            overflow: 'hidden',
          }}
        >
          <div id="user-videos">
            {/* {joinedUserInfo.map((userInfo, index) => (
              <video
                key={`${index}i`}
                className="user-video"
                // src="/vid.mp4"
                ref={videoRef => {
                  if (videoRef) {
                    console.log('streamInfo', userInfo.id)
                    videoRef.srcObject = userInfo // Attach the stream to the video element
                  }
                }}
              ></video>
            ))} */}
          </div>
        </Popup>
      </>
    )
  }
}
export default GroupVideoCall
