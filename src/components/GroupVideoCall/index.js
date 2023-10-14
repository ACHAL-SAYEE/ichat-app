import {Component, createRef} from 'react'
import Cookies from 'js-cookie'
import Popup from 'reactjs-popup'
import {FaMicrophone, FaMicrophoneSlash} from 'react-icons/fa'
import {BiSolidVideo, BiSolidVideoOff} from 'react-icons/bi'
import {BsPin, BsFillPinFill} from 'react-icons/bs'
import {MdCallEnd} from 'react-icons/md'
import {AiOutlineEllipsis} from 'react-icons/ai'
import {withRouter} from 'react-router-dom'

import {
  getMyPeerObject,
  getSocketObject,
  getCurrentUserPhoneNo,
  getActiveVideoCallId,
} from '../../context/callHandling'
import './index.css'

const iChatJwtToken = Cookies.get('ichat_jwt_token')
let videoCallId = null
let mediaStreams = []
let myStream = null
let socket = null
let myPeer = null
let MyPhoneNo = null
let peers = {}
let x = 0
function addVideoStream(video, stream, mutedval) {
  video.srcObject = stream
  video.muted = mutedval
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
}

class GroupVideoCall extends Component {
  state = {showPopup: false}

  constructor(props) {
    super(props)
    this.state = {
      joinedUserInfo: [],
      mutedIconStatus: false,
      VideoIconStatus: false,
      view: 'gallery',
      showHoverpopup: false,
    }
    this.currentVideoFocus = createRef()
    this.currentVideoGallery = createRef()

    this.videoRefs = {}
  }

  componentDidMount() {
    console.log('called component did mount')
    MyPhoneNo = getCurrentUserPhoneNo()
    this.initializeSocketConnection()
    videoCallId = getActiveVideoCallId()
    // document.addEventListener('mousemove', this.handleMouseMove)
  }

  componentDidUpdate() {
    console.log('called component did update')
    let videomain = this.currentVideoFocus.current
    if (videomain) {
      videomain.srcObject = myStream
      videomain.muted = true

      //   if (x === 0) {
      videomain.addEventListener('loadedmetadata', () => {
        videomain.style.visibility = 'visible' // Show the video when it's loaded
        videomain.play()
      })
      //   }
      //   x = +1
    } else {
      videomain = this.currentVideoGallery.current
      videomain.srcObject = myStream
      videomain.muted = true

      //   if (x === 0) {
      videomain.addEventListener('loadedmetadata', () => {
        videomain.style.visibility = 'visible' // Show the video when it's loaded
        videomain.play()
      })
      //   }
      //   x = +1
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleMouseMove)
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop())
    }
  }

  handleMouseEnter = event => {
    const videoElement = event.target
    const rect = videoElement.getBoundingClientRect()
    const popupX = rect.left + rect.width * 0.5 // Adjust as needed
    const popupY = rect.top + rect.height * 0.5 // Adjust as needed
    this.setState({
      showHoverpopup: true,
      popupX,
      popupY,
    })
  }

  handleMouseLeave = () => {
    this.setState({showHoverpopup: false})
  }

  connectToNewUser = (userId, stream, joinedUserPhoneNo) => {
    const call = myPeer.call(userId, stream)
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
        this.setState(prev => ({
          joinedUserInfo: [
            ...prev.joinedUserInfo,
            {stream: userVideoStream, name: data.name},
          ],
        }))
        console.log('triggered inside connect')
      }
    })
    // call.on('close', () => {
    //   video.remove()
    // })

    peers[userId] = call
  }

  initializeSocketConnection = async () => {
    const video = this.currentVideoGallery.current

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
            // console.log(data)
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
          //   console.log('response', response)
          //   console.log('repsonse recieved', data)
          this.setState(prev => ({
            joinedUserInfo: [
              ...prev.joinedUserInfo,
              {stream: userVideoStream, name: data.name},
            ],
          }))
          //   setTimeout(() => {
          //   addUserVideoStream(userVideoStream, false, data.name)
          //   }, 1000)

          //   console.log('triggered inside')
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
      this.connectToNewUser(callerPeerId, myStream, joinedUserPhoneNo)
    })

    socket.on('user-muted', streamId => {
      const {joinedUserInfo} = this.state
      console.log('old length', joinedUserInfo.length)
      const index = joinedUserInfo.findIndex(
        user => user.stream.id === streamId,
      )
      if (joinedUserInfo[index].stream.getAudioTracks()[0].enabled) {
        joinedUserInfo[index].stream.getAudioTracks()[0].enabled = false
      } else {
        joinedUserInfo[index].stream.getAudioTracks()[0].enabled = true
      }
      //   const changedTrack = joinedUserInfo[index]
      //   joinedUserInfo.splice(index, 1, changedTrack)
      console.log('new length', joinedUserInfo.length)
      this.setState({joinedUserInfo})
      console.log(
        'newJoinedInfo[index].stream.getAudioTracks()[0].enabled',
        joinedUserInfo[index].stream.getAudioTracks()[0].enabled,
      )
    })

    socket.on('user-toggled-video', streamId => {
      const {joinedUserInfo} = this.state
      console.log('old length', joinedUserInfo.length)
      const index = joinedUserInfo.findIndex(
        user => user.stream.id === streamId,
      )
      const videoTrack = joinedUserInfo[index].stream
        .getTracks()
        .find(track => track.kind === 'video')
      if (videoTrack.enabled) {
        videoTrack.enabled = false
      } else {
        videoTrack.enabled = true
      }
      //   const changedTrack = joinedUserInfo[index]
      //   joinedUserInfo.splice(index, 1, changedTrack)
      console.log('new length', joinedUserInfo.length)
      this.setState({joinedUserInfo})
      console.log(
        'newJoinedInfo[index].stream.getAudioTracks()[0].enabled',
        joinedUserInfo[index].stream.getAudioTracks()[0].enabled,
      )
    })
  }

  handleMouseMove = event => {
    this.setState({showPopup: true})
    clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.setState({showPopup: false})
    }, 3000)
  }

  toggleVideo = mystreamId => {
    console.log(' this.props.history.state.videoCallId', videoCallId)
    socket.emit('groupCall-videoToggle', mystreamId, videoCallId)

    this.setState(prevState => ({VideoIconStatus: !prevState.VideoIconStatus}))
  }

  muteVideo = mystreamId => {
    console.log(' this.props.history.state.videoCallId', videoCallId)
    socket.emit('groupCall-mute', mystreamId, videoCallId)

    this.setState(prevState => ({mutedIconStatus: !prevState.mutedIconStatus}))
  }

  setGalleryView = () => {
    this.setState({view: 'gallery'})
  }

  setFocusView = () => {
    this.setState({view: 'focus'})
  }

  render() {
    console.log('render')
    const {
      showPopup,
      mutedIconStatus,
      VideoIconStatus,
      joinedUserInfo,
      showHoverpopup,
      view,
      popupX,
      popupY,
    } = this.state
    return (
      <>
        <div className="views">
          <Popup
            position="bottom right"
            trigger={
              <button className="viewChangeBtn">
                <AiOutlineEllipsis size="20" color="white" />
              </button>
            }
          >
            <ul className="pr">
              <li className="view-item" onClick={this.setGalleryView}>
                {view === 'gallery' && <span>✓</span>}
                <p className="item">Galley View</p>
              </li>
              <li className="view-item" onClick={this.setFocusView}>
                {view === 'focus' && <span>✓</span>}
                <p className="item">Focus on speaker</p>
              </li>
            </ul>
          </Popup>
        </div>
        {view === 'gallery' && (
          <div id="all-videos">
            <div className="xy">
              <video
                ref={this.currentVideoGallery}
                className="currentVideo"
                style={{visibility: 'hidden'}} // Add this line
              ></video>
              <p id="mypara" className="userName">
                You
              </p>
            </div>
            {joinedUserInfo.map(userInfo => (
              <div className="xy" key={userInfo.stream.id}>
                <video
                  className="currentVideo"
                  // id={userInfo.stream.id}
                  ref={videoRef => {
                    if (videoRef) {
                      this.videoRefs[userInfo.stream.id] = videoRef
                      videoRef.srcObject = userInfo.stream
                      videoRef.addEventListener('loadedmetadata', () => {
                        videoRef.play()
                      })
                    }
                  }}
                ></video>
                <p id={`${userInfo.stream.id}displayName`} className="userName">
                  {userInfo.name}
                </p>
              </div>
            ))}
          </div>
        )}
        {view === 'focus' && (
          <div className="focus-view">
            <div id="focused-video">
              <div className="xy">
                <video
                  ref={this.currentVideoFocus}
                  className="focusedVideo"
                  style={{visibility: 'hidden'}} // Add this line
                ></video>
                <p id="mypara" className="userName">
                  You
                </p>
              </div>
            </div>
            <div className="user-videos-FocusView">
              <div>
                {joinedUserInfo.map(userInfo => (
                  <div className="xy" key={userInfo.stream.id}>
                    <video
                      className="currentVideo-focusView"
                      // id={userInfo.stream.id}
                      onMouseEnter={this.handleMouseEnter}
                      onMouseLeave={this.handleMouseLeave}
                      ref={videoRef => {
                        if (videoRef) {
                          this.videoRefs[userInfo.stream.id] = videoRef
                          videoRef.srcObject = userInfo.stream
                          videoRef.addEventListener('loadedmetadata', () => {
                            videoRef.play()
                          })
                        }
                      }}
                    >
                      <Popup
                        open={showHoverpopup}
                        modal={false}
                        closeOnDocumentClick
                        // onClose={this.handleMouseLeave}
                        overlayStyle={{
                          background: 'transparent',
                        }}
                        contentStyle={{
                          position: 'absolute',
                          left: popupX,
                          top: popupY,
                          width: '30px',
                          //   transform: 'translate(-50%, -50%)',
                          //   padding: '20px',
                        }}
                        arrow={false}
                      >
                        <div>
                          <button className="pin-btn">
                            <BsPin />
                          </button>
                        </div>
                      </Popup>
                    </video>
                    <p
                      id={`${userInfo.stream.id}displayName`}
                      className="userName"
                    >
                      {userInfo.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="controls">
          {!mutedIconStatus && (
            <button
              className="control-icon"
              type="button"
              onClick={() => {
                this.muteVideo(myStream.id)
              }}
            >
              <FaMicrophone size="20" />
            </button>
          )}

          {mutedIconStatus && (
            <button
              className="control-icon"
              type="button"
              onClick={() => {
                this.muteVideo(myStream.id)
              }}
            >
              <FaMicrophoneSlash size="20" />
            </button>
          )}
          {!VideoIconStatus && (
            <button
              className="control-icon"
              type="button"
              onClick={() => {
                this.toggleVideo(myStream.id)
              }}
            >
              <BiSolidVideo size="20" />
            </button>
          )}

          {VideoIconStatus && (
            <button
              className="control-icon"
              type="button"
              onClick={() => {
                this.toggleVideo(myStream.id)
              }}
            >
              <BiSolidVideoOff size="20" />
            </button>
          )}

          <button
            className="control-icon"
            type="button"
            onClick={() => {
              this.toggleVideo(myStream.id)
            }}
          >
            <MdCallEnd size="20" />
          </button>
        </div>
      </>
    )
  }
}
export default GroupVideoCall
