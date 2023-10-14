import React, {Component, createRef} from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import Loader from 'react-loader-spinner'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'
import Popup from 'reactjs-popup'
import {FaMicrophone, FaMicrophoneSlash} from 'react-icons/fa'
import {BiSolidVideo, BiSolidVideoOff} from 'react-icons/bi'
import {MdCallEnd} from 'react-icons/md'

// import MyVideo from '../MyVideo'
import {
  getCallAnsweringUserId,
  getMyPeerObject,
  getSocketObject,
  getCallingUserSocketId,
  getCallingUserContactName,
} from '../../context/callHandling'

import 'reactjs-popup/dist/index.css'

var joinCallSound = new Audio('./joinCallSound.mp3')

let myStream = null
let callingUserContactName = null
let myPeer = null
let peers = {}
let videoGrid = null
let AnswerercallerId = null
let CallingUserSocketId = null
let socket = null
let VideoCallId = null
function addVideoStream(video, stream, mutedval) {
  console.log('video in fun', mutedval)
  //   video.srcObject = null

  video.srcObject = stream
  video.muted = mutedval
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
}

// console.log("achal")

const apiStatusConstants = {
  initial: 'INITIAL',
  success: 'SUCCESS',
  failure: 'FAILURE',
  inProgress: 'IN_PROGRESS',
}
class VideoCall extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showPopup: false,
      apiStatus: apiStatusConstants.inProgress,
      isDragging: false,
      isMuted: false,
      isVideoOn: true,
      popupPosition: {x: 20, y: 20},
      isIncomingCallAudioMuted: false,
      isIncomingVideoOff: false,
      mutedIconStatus: false,
      VideoIconStatus: false,
    }
    this.incomingVideoRef = createRef()
    this.videoPopupRef = createRef()
  }

  componentDidMount() {
    this.initializeSocketConnection()
    document.addEventListener('mousemove', this.handleMouseMove)
    VideoCallId = this.props.location.state.VideoCallId
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleMouseMove)
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop())
    }
  }

  connectToNewUser = (userId, stream) => {
    const call = myPeer.call(userId, stream)
    const video = this.incomingVideoRef.current
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream, false)
      this.setState({userVideoStream})
    })
    call.on('close', () => {
      video.remove()
    })

    peers[userId] = call
  }

  handleVideoMouseDown = () => {
    this.setState({isDragging: true})
  }

  handleVideoMouseUp = () => {
    this.setState({isDragging: false})
  }

  initializeSocketConnection = async () => {
    callingUserContactName = getCallingUserContactName()
    const myvideo = this.videoPopupRef.current
    const video = this.incomingVideoRef.current
    try {
      myStream = await navigator.mediaDevices.getUserMedia({
        video: {
          aspectRatio: 16 / 9,
          facingMode: 'user',
        },
        audio: true,
      })
      addVideoStream(myvideo, myStream, true)
    } catch (error) {
      console.error('Error accessing media stream:', error)
    }
    socket = getSocketObject()
    myPeer = getMyPeerObject()
    AnswerercallerId = getCallAnsweringUserId()
    myPeer.on('call', call => {
      call.answer(myStream)

      joinCallSound.play()

      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream, false)
        this.setState({userVideoStream})
      })
    })
    setTimeout(() => this.connectToNewUser(AnswerercallerId, myStream), 1000)

    CallingUserSocketId = getCallingUserSocketId()
    socket.on('ending-call', () => {
      socket.emit('leave-call', VideoCallId)
      const {history} = this.props
      history.replace('/')
    })
    socket.on('mute-user-video', () => {
      let {userVideoStream} = this.state

      const {isIncomingCallAudioMuted} = this.state
      if (userVideoStream.getAudioTracks()[0].enabled) {
        userVideoStream.getAudioTracks()[0].enabled = false
      } else {
        userVideoStream.getAudioTracks()[0].enabled = true
      }
      this.setState(prevState => ({
        isIncomingCallAudioMuted: !prevState.isIncomingCallAudioMuted,
      }))
      this.incomingVideoRef.current.srcObject = userVideoStream
    })

    socket.on('onoff-user-video', () => {
      const {isIncomingCallAudioMuted, userVideoStream} = this.state
      console.log('userVideoStream', userVideoStream)
      const videoTrack = userVideoStream
        .getTracks()
        .find(track => track.kind === 'video')
      if (videoTrack.enabled) {
        videoTrack.enabled = false
      } else {
        videoTrack.enabled = true
      }
      this.incomingVideoRef.current.srcObject = userVideoStream
    })
  }

  handleMouseMove = event => {
    const videoPopupRect = this.videoPopupRef.current.getBoundingClientRect()

    const isMouseOnVideoPopup =
      event.clientX >= videoPopupRect.left &&
      event.clientX <= videoPopupRect.right &&
      event.clientY >= videoPopupRect.top &&
      event.clientY <= videoPopupRect.bottom
    this.setState({showPopup: !isMouseOnVideoPopup})

    if (this.state.isDragging) {
      this.setState(prevState => ({
        popupPosition: {
          x: prevState.popupPosition.x + event.movementX,
          y: prevState.popupPosition.y + event.movementY,
        },
      }))
    }

    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.setState({showPopup: false})
    }, 3000)
  }

  HandleMuteToggle = () => {}

  endCall = () => {
    const {history} = this.props
    history.replace('/')

    socket.emit('end-call', CallingUserSocketId, VideoCallId)
    socket.emit('leave-call', VideoCallId)
  }

  muteVideo = () => {
    socket.emit('mute', CallingUserSocketId)

    this.setState(prevState => ({mutedIconStatus: !prevState.mutedIconStatus}))
  }

  toggleVideo = () => {
    socket.emit('toggleVideo', CallingUserSocketId)

    this.setState(prevState => ({VideoIconStatus: !prevState.VideoIconStatus}))
  }

  render() {
    const {
      showPopup,
      popupPosition,
      isIncomingCallAudioMuted,
      mutedIconStatus,
      VideoIconStatus,
    } = this.state

    return (
      <div id="video-grid">
        <div className="muted-status">
          {callingUserContactName && isIncomingCallAudioMuted && (
            <p>
              {callingUserContactName} <FaMicrophoneSlash />
            </p>
          )}
          {callingUserContactName && !isIncomingCallAudioMuted && (
            <p>
              <p>
                {callingUserContactName} <FaMicrophone />
              </p>
            </p>
          )}
        </div>
        <video
          id="video"
          onMouseMove={this.handleMouseMove}
          muted
          //   src={userVideoStream}
          ref={this.incomingVideoRef}
        ></video>
        <Popup
          open={showPopup}
          closeOnDocumentClick={false}
          modal={false}
          overlayStyle={{
            background: 'transparent',
          }}
          contentStyle={{
            position: 'fixed',
            display: 'flex',
            justifyContent: 'center',
            left: `0`,
            bottom: `0`,
            width: '100%',
            height: '50px',
            background: '#202124',
            borderRadius: '5px',
            overflow: 'hidden',
            border: 'none',
          }}
        >
          <div className="controls">
            {!mutedIconStatus && (
              <button
                className="control-icon"
                type="button"
                onClick={this.muteVideo}
              >
                <FaMicrophone size="20" />
              </button>
            )}

            {mutedIconStatus && (
              <button
                className="control-icon"
                type="button"
                onClick={this.muteVideo}
              >
                <FaMicrophoneSlash size="20" />
              </button>
            )}
            {!VideoIconStatus && (
              <button
                className="control-icon"
                type="button"
                onClick={this.toggleVideo}
              >
                <BiSolidVideo size="20" />
              </button>
            )}

            {VideoIconStatus && (
              <button
                className="control-icon"
                type="button"
                onClick={this.toggleVideo}
              >
                <BiSolidVideoOff size="20" />
              </button>
            )}

            <button
              className="control-icon"
              type="button"
              onClick={this.endCall}
            >
              <MdCallEnd size="20" />
            </button>
          </div>
        </Popup>

        <Popup
          open
          closeOnDocumentClick={false}
          className="popup-container"
          overlayStyle={{
            background: 'transparent',
          }}
          contentStyle={{
            position: 'fixed',

            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            width: '200px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            overflow: 'hidden',
          }}
        >
          <div>
            <video
              id="myvideo"
              ref={this.videoPopupRef}
              onMouseDown={this.handleVideoMouseDown}
              onMouseUp={this.handleVideoMouseUp}
            ></video>
          </div>
        </Popup>
      </div>
    )
  }
}

export default VideoCall
