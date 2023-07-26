// import {Component} from 'react'
// import './index.css'
// import SocketMyPeerContext from '../../context'
// let myStream = ''

// let peers = {}
// let videoGrid = null
// function addVideoStream(video, stream) {
//   const Video = document.getElementById('video')
//   video.srcObject = stream
//   video.addEventListener('loadedmetadata', () => {
//     video.play()
//   })
//   //   Video.append(video)
// }

// let count = 0
// class VideoCall extends Component {
//   state = {socket: null, myPeer: null}

//   connectToNewUser = (userId, stream) => {
//     const {myPeer} = this.state
//     const call = myPeer.call(userId, stream)
//     console.log('connectToNewUser', userId, stream, call)
//     const video = document.createElement('video')
//     call.on('stream', userVideoStream => {
//       addVideoStream(video, userVideoStream)
//     })
//     call.on('close', () => {
//       video.remove()
//     })

//     peers[userId] = call
//   }

//   componentDidMount() {
//     // this.initializeSocketConnection()
//   }
//   initializeSocketConnection = async() => {
//     // console.log(this.props.location)
//     // navigator.mediaDevices
//     //   .getUserMedia({
//     //     video: true,
//     //     audio: true,
//     //   })
//     //   .then(stream => {
//     //     myStream = stream
//     //   })
//      try {
//       myStream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });
//     } catch (error) {
//       console.error('Error accessing media stream:', error);
//       // Handle errors here if needed
//     }
//     const {socket, myPeer} = this.state

//     myPeer.on('call', call => {
//       call.answer(myStream)
//       //   const video = document.createElement('video')

//       const video = document.getElementById('video')

//       call.on('stream', userVideoStream => {
//         addVideoStream(video, userVideoStream)
//       })
//     })

//     const {CallAnswererId} = this.props.location.state
//     // console.log(this.myStream, 'myStream')
//     // socket.emit('connect', userId => {
//     console.log(CallAnswererId)
//     this.connectToNewUser(CallAnswererId, myStream)
//     // console.log(78)
//     // })
//   }
//   render() {
//     // console.log('render called')

//     return (
//       <SocketMyPeerContext.Consumer>
//         {value => {
//           const {socket, myPeer} = value
//           if (count === 0) {
//             count += 1

//             this.setState({socket, myPeer}, this.initializeSocketConnection)
//           }

//           return (
//             <div id="video-grid">
//               <video id="video"></video>
//             </div>
//           )
//         }}
//       </SocketMyPeerContext.Consumer>
//     )
//   }
// }
// export default VideoCall
// //   {/* socket.on("user-joined-call" ,userId => {
// //     console.log(userId)
// //   } */}


import { Component } from 'react';
import './index.css';
import SocketMyPeerContext from '../../context';
let myStream = null;

let peers = {};
let videoGrid = null;
function addVideoStream(video, stream) {
  const Video = document.getElementById('video');
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  //   Video.append(video)
}

let count = 0;
class VideoCall extends Component {
  state = { socket: null, myPeer: null };

  connectToNewUser = (userId, stream) => {
    const { myPeer } = this.state;
    const call = myPeer.call(userId, stream);
    console.log('connectToNewUser', userId, stream, call);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
      video.remove();
    });

    peers[userId] = call;
  };

  componentDidMount() {
    this.initializeSocketConnection();
  }

  initializeSocketConnection = async () => {
    if (!myStream) {
      try {
        myStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch (error) {
        console.error('Error accessing media stream:', error);
        // Handle errors here if needed
      }
    }

    const { socket, myPeer } = this.state;

    myPeer.on('call', call => {
      call.answer(myStream);
      const video = document.getElementById('video');

      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream);
      });
    });

    const { CallAnswererId } = this.props.location.state;
    this.connectToNewUser(CallAnswererId, myStream);
  };

  render() {
    return (
      <SocketMyPeerContext.Consumer>
        {value => {
          const { socket, myPeer } = value;
          if (count === 0) {
            count += 1;

            this.setState({ socket, myPeer }, this.initializeSocketConnection);
          }

          return (
            <div id="video-grid">
              <video id="video"></video>
            </div>
          );
        }}
      </SocketMyPeerContext.Consumer>
    );
  }
}

export default VideoCall;
