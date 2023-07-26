import {Component} from 'react'
import './index.css'
import SocketMyPeerContext from '../../context'
import { getCallAnsweringUserId } from '../../callHandling.js';

let myStream = null

let peers = {}
let videoGrid = null
function addVideoStream(video, stream) {
  const Video = document.getElementById('video')
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  //   Video.append(video)
}

let count = 0
class VideoCall extends Component {
  state = {socket: null, myPeer: null, callerId: null}

  connectToNewUser = (userId, stream) => {
    const {myPeer} = this.state
    const call = myPeer.call(userId, stream)
    // console.log('connectToNewUser', userId, stream, call)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
      video.remove()
    })

    peers[userId] = call
  }

  componentDidMount() {
    this.initializeSocketConnection()
  }

  initializeSocketConnection = async () => {
    if (!myStream) {
      try {
        myStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
      } catch (error) {
        console.error('Error accessing media stream:', error)
        // Handle errors here if needed
      }
    }

    const {socket, myPeer} = this.state

    myPeer.on('call', call => {
      call.answer(myStream)
      const video = document.getElementById('video')

      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
      })
    })
    // console.log('from conetext', callerId)
    const  AnswerercallerId= getCallAnsweringUserId()
    console.log("AnswerercallerId",AnswerercallerId)
    this.connectToNewUser(AnswerercallerId, myStream)
  }

  render() {
    return (
      <SocketMyPeerContext.Consumer>
        {value => {
          const {socket, myPeer, AnswerercallerId} = value
          if (count === 0) {
            count += 1

            this.setState(
              {socket, myPeer, callerId: AnswerercallerId},
              this.initializeSocketConnection,
            )
          }

          return (
            <div id="video-grid">
              <video id="video"></video>
            </div>
          )
        }}
      </SocketMyPeerContext.Consumer>
    )
  }
}

export default VideoCall
