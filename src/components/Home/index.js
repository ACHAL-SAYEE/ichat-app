import {Component} from 'react'
import Cookies from 'js-cookie'
import Loader from 'react-loader-spinner'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'
import {BsSearch, BsEmojiSmile} from 'react-icons/bs'
import {AiOutlinePlusCircle, AiOutlineEllipsis} from 'react-icons/ai'
import {IoIosCall} from 'react-icons/io'
// import {HiOutlineVideoCamera} from 'react-icons/hi'
import {BiSolidVideo} from 'react-icons/bi'
import {v4 as uuidv4} from 'uuid'
import socketIOClient from 'socket.io-client'
import userEvent from '@testing-library/user-event'
import Popup from 'reactjs-popup'
import Peer from 'peerjs'
// import EmojiPicker from 'emoji-picker-react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import GroupMessage from '../GroupMessage'
import styles from './index.module.css'
import Message from '../Message'

import {
  setCallAnsweringUserId,
  setMyPeerObject,
  setSocketObject,
  setCallingUserSocketId,
  setCallingUserContactName,
  setUsersToConnect,
  setCurrentUserPhoneNo,
} from '../../context/callHandling'

// console.log(data)

const audio = new Audio('/ting.mp3')
const logout = new Audio('/Windows7Shutdown.mp3')
const ringtone = new Audio('/ichat_incoming_video_call.mp3')
// import SocketMyPeerContext from '../../context'

const myPeer = new Peer({
  host: 'ichat-peer.onrender.com',
  secure: true,
  port: '443',
  path: '/peerjs',
  //   debug: 3,
})

// const myPeer = new Peer({
//   host: '0.peerjs.com',
//   //   secure: true,
//   port: 443,
//   //   path: '/peerjs',
//   //   debug: 3,
// })

console.log(myPeer)

const iChatJwtToken = Cookies.get('ichat_jwt_token')

const groupUsers = []
const GroupVideoCallUsers = []
const apiStatusConstants = {
  initial: 'INITIAL',
  success: 'SUCCESS',
  failure: 'FAILURE',
  inProgress: 'IN_PROGRESS',
}

class Home extends Component {
  state = {
    showAddContactPopup: false,
    socket: null,
    apiStatus: 'IN_PROGRESS',
    userDetails: {},
    showAddContactsView: false,
    phoneNo: null,
    contactname: null,
    showMessagesView: false,
    showGroupMessagesView: false,
    activeContact: null,
    activegroup: null,
    messageInput: '',
    contactAddedView: false,
    MessagesList: [],
    showCreateNewGroupView: false,
    groupName: '',
    currentUserGroups: [],
    status: [],
    IncomingCallView: false,
    callerName: null,
    activeVideoCallId: null,
    myPeer: null,
    outGoingCallView: false,
    updatedCaller: false,
    callerSocketId: null,
    uploadProfilePic: false,
    ProfilePicturesPresentInfo: [],
    showProfilepicturepopup: false,
    groupCallIntiate: false,
    groupCallOnlinePeople: [],
    IncomingGroupCallView: false,
    callerGroup: undefined,
  }

  async componentDidMount() {
    await this.getUserProfile()
    await this.getProfilePictures()
    this.initializeSocketConnection()
    await this.getPresentUserStatus()
  }

  initializeSocketConnection = () => {
    const {userDetails} = this.state
    const socket = socketIOClient(
      'https://ichat-server-production.up.railway.app',
      //   'http://localhost:3007',
    )
    setMyPeerObject(myPeer)
    setSocketObject(socket)
    socket.on('connect', () => {
      // const {status}=this.state
      socket.emit('storeSocketId', userDetails.phoneNo, myPeer.id)
      // this.setState({status:[...status,{}]})
      socket.emit('join-present-groups', userDetails.phoneNo)
    })

    socket.on('newMessage', newMessageDetils => {
      this.updateMessagesList(newMessageDetils)
      audio.play()
    })
    socket.on('newGroupMessage', newMessageDetils => {
      console.log('newGroupMessage is invoked')
      this.updateGroupMessagesList(newMessageDetils)
      if (newMessageDetils.sender !== userDetails.phoneNo) audio.play()
    })
    socket.on('update-status', phoneNo => {
      const {status} = this.state
      const connectedUserIndex = status.findIndex(
        user => user.phoneNo === phoneNo,
      )
      // if()
      status[connectedUserIndex] = {phoneNo, online: true}
      this.setState({status})
    })

    socket.on('user-answered-call', (VideoCallId, CallAnswererId) => {
      setCallAnsweringUserId(CallAnswererId)
      console.log('user picked up your call')
      const {history} = this.props
      history.push({
        pathname: `/video-call/${VideoCallId}`,
        state: {VideoCallId},
      })
    })

    socket.on('user-declined-call', () => {
      socket.emit('leave-call', this.state.activeVideoCallId)
      const outgoingcallEl = document.getElementById('outgoingcall')
      console.log(outgoingcallEl)
      outgoingcallEl.innerHTML = 'Call declined'
      setTimeout(() => {
        this.setState({outGoingCallView: false})
      }, 1000)
    })

    socket.on(
      'pick-call',
      (videocallId, callerName, userId, callerSocketId) => {
        //    CallAnsweringUserId=userId

        console.log('callerId', userId)
        ringtone.play()
        this.setState({
          IncomingCallView: true,
          callerName,
          activeVideoCallId: videocallId,
          callerSocketId,
        })
        setCallAnsweringUserId(userId)
        setCallingUserSocketId(callerSocketId)
        setCallingUserContactName(callerName)
      },
    )

    socket.on(
      'pick-group-call',
      (
        videocallId,
        groupName,
        callerPeerId,
        CallInitiaterSocketId,
        groupVideoCallUsers,
      ) => {
        this.setState({
          IncomingGroupCallView: true,
          callerGroup: groupName,
          activeVideoCallId: videocallId,
          //   callerSocketId,
        })
        const UserToConnect = groupVideoCallUsers.filter(
          user => !user.peerId === myPeer.id,
        )
        UserToConnect.unshift({
          socketId: CallInitiaterSocketId,
          peerId: callerPeerId,
        })
        setUsersToConnect(UserToConnect)
        socket.emit('join-group-call-room', videocallId)
        ringtone.play()
      },
    )

    socket.on('user-disconected', (phoneNo, LastSeenTime) => {
      console.log('LastSeenTime', LastSeenTime)
      const {status} = this.state
      const connectedUserIndex = status.findIndex(
        user => user.phoneNo === phoneNo,
      )
      status[connectedUserIndex] = {phoneNo, online: false, LastSeenTime}
      this.setState({status})
    })
    // socket.on('user-connected', userId => {
    //   connectToNewUser(userId, stream)
    // })
    this.setState({socket, myPeer})
  }

  onClickLogout = () => {
    const {history} = this.props

    Cookies.remove('ichat_jwt_token')
    history.replace('/login')
    logout.play()
  }

  getUserProfile = async () => {
    this.setState({
      apiStatus: apiStatusConstants.inProgress,
    })

    const apiUrl = 'https://ichat-server-production.up.railway.app/profile'
    const options = {
      headers: {
        Authorization: `Bearer ${iChatJwtToken}`,
      },
      method: 'GET',
    }
    const response = await fetch(apiUrl, options)

    const apiUrl2 = 'https://ichat-server-production.up.railway.app/groups'
    const options2 = {
      headers: {
        Authorization: `Bearer ${iChatJwtToken}`,
      },
      method: 'GET',
    }
    const response2 = await fetch(apiUrl2, options2)

    if (response.ok) {
      const fetchedData = await response.json()

      this.setState({
        userDetails: fetchedData,
        // apiStatus: apiStatusConstants.success,
      })
      const Status = fetchedData.contacts.map(contact => ({
        phoneNo: contact.phoneNo,
        online: false,
      }))
      this.setState({
        status: Status,
      })
    } else {
      this.setState({
        apiStatus: apiStatusConstants.failure,
      })
    }
    if (response2.ok) {
      const fetchedData2 = await response2.json()
      this.setState({
        currentUserGroups: fetchedData2,
        apiStatus: apiStatusConstants.success,
      })
    } else {
      this.setState({
        apiStatus: apiStatusConstants.failure,
      })
    }
  }

  getProfilePictures = async () => {
    const apiUrl =
      'https://ichat-server-production.up.railway.app/profilepicture'
    const options = {
      headers: {
        Authorization: `Bearer ${iChatJwtToken}`,
      },
      method: 'GET',
    }
    const response = await fetch(apiUrl, options)
    if (response.ok) {
      const fetchedData = await response.json()
      console.log(fetchedData)
      this.setState({
        ProfilePicturesPresentInfo: fetchedData,
        apiStatus: apiStatusConstants.success,
      })
    } else {
      this.setState({
        apiStatus: apiStatusConstants.failure,
      })
    }
  }

  getPresentUserStatus = async () => {
    const apiUrl = 'https://ichat-server-production.up.railway.app/status'
    const options = {
      headers: {
        Authorization: `Bearer ${iChatJwtToken}`,
      },
      method: 'GET',
    }
    const response = await fetch(apiUrl, options)
    if (response.ok) {
      const fetchedData = await response.json()
      //   console updatedData=fetchedData.filter
      this.setState({
        status: fetchedData,
      })
    } else {
      console.log('error')
    }
  }

  renderLoadingView = () => (
    <div className={styles['home-loader-container']}>
      <Loader type="ThreeDots" color="#0b69ff" height="50" width="50" />
    </div>
  )

  ToggleAddContactsView = () => {
    this.setState({showAddContactsView: true, showAddContactPopup: true})
  }

  onchangePhoneno = event => {
    this.setState({phoneNo: event.target.value})
  }

  onchangeContactname = event => {
    this.setState({contactname: event.target.value})
  }

  Addcontact = async event => {
    event.preventDefault()

    const {phoneNo, contactname, userDetails} = this.state
    const contactDetails = {phoneNo, contactname}
    const apiUrl = 'http://localhost:3007/addContact'
    const options = {
      headers: {
        Authorization: `Bearer ${iChatJwtToken}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(contactDetails),
    }
    const response = await fetch(apiUrl, options)
    if (response.ok) {
      const fetchedData = await response.json()

      this.setState({
        showAddContactsView: false,
        contactAddedView: true,
      })
    } else {
      const fetchedData = await response.json()
      console.log(fetchedData)
    }
  }

  SetMessagesList = () => {
    const {activeContact, userDetails} = this.state

    const activeContactDetails = userDetails.contacts.find(
      contact => contact.name === activeContact,
    )

    this.setState({
      MessagesList: [...activeContactDetails.messages],
    })
  }

  SetGroupMessagesList = () => {
    const {activegroup, currentUserGroups, socket} = this.state
    const activeGroupDetails = currentUserGroups.find(
      group => group.groupName === activegroup,
    )
    // socket.emit('join-room', activeGroupDetails.groupId)

    this.setState({
      MessagesList: [...activeGroupDetails.messages],
    })
  }

  updateMessagesList = newMessageDetils => {
    const {MessagesList} = this.state
    this.setState({
      MessagesList: [...MessagesList, newMessageDetils],
    })
  }

  updateGroupMessagesList = newMessageDetils => {
    const {MessagesList} = this.state
    this.setState({
      MessagesList: [...MessagesList, newMessageDetils],
    })
  }

  displayChatView = contactName => {
    this.setState(
      {
        showMessagesView: true,
        showGroupMessagesView: false,
        activeContact: contactName,
        activegroup: null,
      },
      this.SetMessagesList,
    )
  }

  displayGroupChatView = groupName => {
    this.setState(
      {
        showGroupMessagesView: true,
        showMessagesView: false,
        activegroup: groupName,
        activeContact: null,
      },
      this.SetGroupMessagesList,
    )
  }

  updateMsgValue = event => {
    this.setState({messageInput: event.target.value})
  }

  handleEmojiClick = emoji => {
    console.log(emoji)
    const {messageInput} = this.state
    const emojiValue = emoji.native
    this.setState({
      messageInput: messageInput + emojiValue,
    })
  }

  postMsg = async (event, phoneNo) => {
    const {messageInput} = this.state
    if (event.key === 'Enter' && messageInput !== '') {
      const {userDetails} = this.state
      const msg = messageInput
      const MsgSentTime = new Date()
      const id = uuidv4()
      const MessageDetails = {
        msg,
        id,

        MsgSentTime,
      }
      const ToUser = {phoneNo}
      const MessageSendingDetails = {
        ToUser,
        MessageDetails,
      }
      this.setState({messageInput: ''})
      const apiUrl =
        'https://ichat-server-production.up.railway.app/sendMessage'
      const options = {
        headers: {
          Authorization: `Bearer ${iChatJwtToken}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(MessageSendingDetails),
      }

      const response = await fetch(apiUrl, options)
      if (response.ok) {
        const fetchedData = await response.json()

        const newMessage = {message: msg, time: MsgSentTime, type: 'sent'}
        this.updateMessagesList(newMessage)
      } else {
        const fetchedData = await response.json()
      }
    }
  }

  postGroupMsg = async (event, activeGroupDetails) => {
    const {messageInput} = this.state
    if (event.key === 'Enter' && messageInput !== '') {
      const {userDetails} = this.state
      const msg = messageInput
      const MsgSentTime = new Date()
      const id = uuidv4()
      const MessageDetails = {
        msg,
        id,
        sender: userDetails.phoneNo,
        MsgSentTime,
      }
      const MessageSendingDetails = {
        groupName: activeGroupDetails.groupName,
        groupId: activeGroupDetails.groupId,
        MessageDetails,
      }

      const apiUrl =
        'https://ichat-server-production.up.railway.app/sendGroupMessage'
      const options = {
        headers: {
          Authorization: `Bearer ${iChatJwtToken}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(MessageSendingDetails),
      }

      const response = await fetch(apiUrl, options)

      if (response.ok) {
        const fetchedData = await response.json()

        // const newMessage = { message: msg, time: MsgSentTime, type: "sent" };
        // this.updateMessagesList(newMessage);
        // console.log("ready to recieve");
      } else {
        const fetchedData = await response.json()
      }
    }
  }

  onChangeGroupName = event => {
    this.setState({groupName: event.target.value})
  }

  createNewGroup = () => {
    groupUsers.push(this.state.userDetails.phoneNo)
    this.setState({showCreateNewGroupView: true})
  }

  createGroup = async () => {
    const {groupName} = this.state
    const groupDetails = {groupName, groupUsers}
    const apiUrl = 'https://ichat-server-production.up.railway.app/createGroup'
    const options = {
      headers: {
        Authorization: `Bearer ${iChatJwtToken}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(groupDetails),
    }
    const response = await fetch(apiUrl, options)
    if (response.ok) {
      const fetchedData = await response.json()
      console.log(fetchedData)
      this.setState({showCreateNewGroupView: false})
      this.getUserProfile()
    } else {
      const fetchedData = await response.json()
      console.log(fetchedData)
    }
  }

  startVideoCall = async phoneNo => {
    const {status, socket, userDetails, activeContact} = this.state
    const connectedUser = status.find(user => user.phoneNo === phoneNo)
    const InviteDetails = {phoneNo}
    if (!connectedUser.online) {
      const apiUrl = 'https://ichat-server-production.up.railway.app/invite'
      const options = {
        headers: {
          Authorization: `Bearer ${iChatJwtToken}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(InviteDetails),
      }
      const response = await fetch(apiUrl, options)
      if (response.ok) {
        const fetchedData = await response.json()
        //   console updatedData=fetchedData.filter
        this.setState({
          status: fetchedData,
        })
      } else {
        console.log('fucking eslint')
      }
    } else {
      const videocallId = uuidv4()

      this.setState({outGoingCallView: true})
      socket.emit(
        'join-call',
        videocallId,
        userDetails.phoneNo,
        phoneNo,
        myPeer.id,
      )
      const options = {
        headers: {
          Authorization: `Bearer ${iChatJwtToken}`,
          'Content-Type': 'application/json',
        },
        method: 'GET',
      }
      const response = await fetch(
        `https://ichat-server-production.up.railway.app/socketId/?phoneNo=${phoneNo}`,
        options,
      )
      const data2 = await response.json()
      //   console.log(data)
      setCallingUserSocketId(data2.socketId)
      setCallingUserContactName(activeContact)
    }
  }

  startGroupVideoCall = groupName => {
    const {userDetails, socket, groupCallOnlinePeople} = this.state
    console.log(groupCallOnlinePeople)
    const videocallId = uuidv4()
    socket.emit(
      'join-group-call',
      videocallId,
      userDetails.phoneNo,
      groupName,
      GroupVideoCallUsers,
      myPeer.id,
    )
    // setUsersToConnect(GroupVideoCallUsers)
    setCurrentUserPhoneNo(userDetails.phoneNo)
    const {history} = this.props
    history.push({
      pathname: `/group-video-call/${videocallId}`,
      state: {videocallId},
    })
  }

  answerCall = () => {
    const {socket, activeVideoCallId, callerId} = this.state
    ringtone.pause()
    ringtone.currentTime = 0
    socket.emit('answer-call', activeVideoCallId, myPeer.id)

    const {history} = this.props
    history.push({
      pathname: `/video-call/${activeVideoCallId}`,
      state: {
        VideoCallId: activeVideoCallId,
      },
    })
  }

  declineCall = () => {
    const {socket, callerSocketId} = this.state
    this.setState({IncomingCallView: false, activeVideoCallId: null})
    // console.log(socket.id)
    socket.emit('decline-call', callerSocketId)
    ringtone.pause()
    ringtone.currentTime = 0
  }

  uploadProfilePicture = async event => {
    event.preventDefault()
    const {userDetails} = this.state
    const filename = userDetails.phoneNo
    const fileInput = document.getElementById('uploadPic')

    if (fileInput.files.length > 0) {
      const formData = new FormData()
      formData.append('filename', filename)
      formData.append('profilePicture', fileInput.files[0])
      console.log(formData)
      const options = {
        // headers: {
        //   Authorization: `Bearer ${iChatJwtToken}`,
        // },
        method: 'POST',
        body: formData,
      }
      // const response =
      await fetch(
        'https://ichat-server-production.up.railway.app/upload',
        options,
      )
        .then(response => {
          if (response.ok) {
            return response.json()
          }
          throw new Error('File upload failed')
        })
        .then(data2 => {
          this.setState({uploadProfilePic: false})
          console.log('Server response:', data2)
        })
        .catch(error => {
          console.error('Error uploading file:', error)
        })
      //   if (response.ok) {
      //     const data = await response.json()
      //     console.log(data)
      //   } else {
      //     const errorData = await response.json()
      //     console.error(errorData)
      //   }
    }
  }

  InitializeGroupCall = async activeGroupDetails => {
    const url = 'https://ichat-server-production.up.railway.app/getDetails'
    const {status} = this.state
    console.log('activeGroupDetails', activeGroupDetails)
    console.log(this.state.status)
    const activeGroupPhoneNumbers = activeGroupDetails.users.map(
      participant => participant.phoneNo,
    )
    const filteredStatus = status.filter(statusObj => {
      console.log('activeGroupDetails.users', activeGroupDetails.users)
      return (
        activeGroupPhoneNumbers.includes(statusObj.phoneNo) && statusObj.online
      )
    })
    console.log(filteredStatus)
    const requestObj = {
      OnlineNumbers: filteredStatus,
      groupName: activeGroupDetails.groupName,
    }
    const options = {
      headers: {
        Authorization: `Bearer ${iChatJwtToken}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(requestObj),
    }
    const response = await fetch(url, options)
    console.log(response)
    if (response.ok) {
      console.log('sdjh dsh dfjfhj dfh j')
      const data2 = await response.json()
      console.log('data2dfgf', data2)
      this.setState({groupCallOnlinePeople: data2.data, groupCallIntiate: true})
    } else {
      console.log(response)
    }
  }

  acceptGroupCall = () => {
    const {activeVideoCallId, socket, userDetails} = this.state
    const {history} = this.props
    history.push(`/group-video-call/${activeVideoCallId}`)
    socket.emit(
      'answer-group-call',
      activeVideoCallId,
      myPeer.id,
      userDetails.phoneNo,
    )
  }

  declineGroupCall = () => {
    this.setState({IncomingGroupCallView: false})
  }

  renderCompleteView = () => {
    const {
      userDetails,
      showAddContactsView,
      phoneNo,
      contactname,
      showMessagesView,
      activeContact,
      messageInput,
      MessagesList,
      contactAddedView,
      showCreateNewGroupView,
      groupName,
      currentUserGroups,
      activegroup,
      showGroupMessagesView,
      status,
      IncomingCallView,
      callerName,
      socket,
      showAddContactPopup,
      outGoingCallView,
      callerId,
      updatedCaller,
      uploadProfilePic,
      ProfilePicturesPresentInfo,
      showProfilepicturepopup,
      groupCallIntiate,
      groupCallOnlinePeople,
      IncomingGroupCallView,
      callerGroup,
    } = this.state
    console.log('groupCallOnlinePeople', groupCallOnlinePeople)
    // if (this.state.updatedCaller) {
    //   this.answerCall()
    // }
    let activeContactDetails = null
    // console.log(userDetails)
    if (userDetails.contacts.length === 0) {
      const y = 0
    } else {
      activeContactDetails = userDetails.contacts.find(
        contact => contact.name === activeContact,
      )
    }
    let activeGroupDetails = null
    if (currentUserGroups.length === 0) {
      const y = 0
    } else {
      activeGroupDetails = currentUserGroups.find(
        group => group.groupName === activegroup,
      )
      if (activeGroupDetails !== undefined) {
        console.log('activeGroupDetailsefwef', activeGroupDetails)
        // activeGroupDetails.users = activeGroupDetails.users.map(user => 1)
      }
    }

    let activeContactStatusDetails
    let activeContactLastSeen
    let hours
    let minutes
    console.log('activeContactDetails', activeContactDetails)
    if (activeContactDetails) {
      activeContactStatusDetails = status.find(
        user => user.phoneNo === activeContactDetails.phoneNo,
      )
      var activeContactStatus = activeContactStatusDetails.online
      activeContactLastSeen = activeContactStatusDetails.LastSeenTime

      const dateObject = new Date(activeContactLastSeen)

      hours = dateObject.getHours()
      if (hours < 10) {
        hours = `0${hours}`
      }
      console.log(hours)

      minutes = dateObject.getMinutes()
      if (minutes < 10) {
        minutes = `0${minutes}`
      }
    }

    return (
      <div className={styles.bg}>
        <div className={styles['chats-conatiner']}>
          {!showCreateNewGroupView &&
            userDetails.contacts.length === 0 &&
            !showAddContactsView && (
              <>
                <h1>Your contacts list is empty</h1>
                <button
                  type="button"
                  className={styles.x}
                  onClick={this.ToggleAddContactsView}
                >
                  Add Contacts
                </button>
              </>
            )}

          {!showCreateNewGroupView &&
            !(
              userDetails.contacts.length === 0 &&
              (!activeGroupDetails || activeGroupDetails.length === 0)
            ) && (
              <>
                <div className={styles['info-user']}>
                  <h1>Welcome {userDetails.name} 👋</h1>
                  {/* <div className={styles['account-type-container']}>
                    <p className={styles['account-type']}>Trial</p>

                    <a href="https://ichat-server-production.up.railway.app/trialaccount">
                      <p>Learn more</p>
                    </a> */}
                  {/* </div> */}
                </div>
                <div className={styles.chatsHeading}>
                  <h1>Chats</h1>
                  <div className="popup-container">
                    <Popup
                      trigger={
                        <button type="button" className={styles['three-dots']}>
                          <AiOutlineEllipsis size="30" />
                        </button>
                      }
                      position="bottom left"
                    >
                      <ul className={styles['pop-items']}>
                        <li
                          onClick={this.createNewGroup}
                          className={styles['pop-item']}
                        >
                          New group
                        </li>
                        <li
                          className={styles['pop-item']}
                          onClick={() => {
                            this.setState({uploadProfilePic: true})
                          }}
                        >
                          Add profile picture
                        </li>
                        <li
                          className={styles['logOut-button pop-item']}
                          onClick={this.onClickLogout}
                        >
                          LogOut
                        </li>
                        <li
                          className={styles['add-contact-btn']}
                          onClick={() => {
                            this.ToggleAddContactsView()
                            // close()
                          }}
                        >
                          Add New Contact
                        </li>
                      </ul>
                    </Popup>
                  </div>

                  {/* <button
                    type="button"
                    onClick={this.ToggleAddContactsView}
                    className={styles['add-contact-btn']}
                  >
                    <AiOutlinePlusCircle />
                  </button> */}
                </div>
                {/* <div className={styles['search-container']}>
                        <input type="search" className={styles.search} />
                        <button
                          type="button"
                          className={styles['search-button']}
                        >
                          <BsSearch className="icon" size="40" />
                        </button>
                      </div> */}
                <div className={styles['user-contacts']}>
                  {userDetails.contacts.map(contact => {
                    const Isactive = contact.name === activeContact
                    const isProfilepicPresentDetails = ProfilePicturesPresentInfo.find(
                      user => user.phoneNo === contact.phoneNo,
                    )
                    if (isProfilepicPresentDetails)
                      var isProfilepicPresent =
                        isProfilepicPresentDetails.present
                    console.log(isProfilepicPresent)
                    return (
                      <div
                        onClick={() => {
                          this.displayChatView(contact.name)
                        }}
                        key={contact.phoneNo}
                        className={
                          Isactive
                            ? styles['contact-item-selected']
                            : styles['contact-item']
                        }
                      >
                        {!isProfilepicPresent && (
                          <p className={styles['contact-logo']}>
                            {contact.name[0]}
                          </p>
                        )}
                        {isProfilepicPresent && (
                          <>
                            <Popup
                              open={showProfilepicturepopup}
                              modal
                              onClose={() =>
                                this.setState({
                                  showProfilepicturepopup: false,
                                })
                              }
                            >
                              <img
                                className={styles['profile-picture']}
                                src={`https://ichat-server-production.up.railway.app/images/${contact.phoneNo}`}
                              />
                            </Popup>
                            <img
                              onClick={() => {
                                this.setState({
                                  showProfilepicturepopup: true,
                                })
                              }}
                              className={styles['profile-img']}
                              src={`https://ichat-server-production.up.railway.app/images/${contact.phoneNo}`}
                            />
                          </>
                        )}
                        {console.log(
                          'showProfilepicturepopup',
                          showProfilepicturepopup,
                        )}

                        <p>{contact.name}</p>
                      </div>
                    )
                  })}
                  {currentUserGroups.map(group => {
                    const Isactive = group.groupName === activegroup

                    return (
                      <div
                        onClick={() =>
                          this.displayGroupChatView(group.groupName)
                        }
                        key={group.groupName}
                        className={
                          Isactive
                            ? styles['contact-item-selected']
                            : styles['contact-item']
                        }
                      >
                        <p className={styles['contact-logo']}>
                          {group.groupName[0]}
                        </p>
                        <p>{group.groupName}</p>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
        </div>
        <div className={styles['messages-container']}>
          {!outGoingCallView &&
            !IncomingCallView &&
            !showMessagesView &&
            !showGroupMessagesView && (
              <h1>Select a chat to see the messages here</h1>
            )}
          {showMessagesView && MessagesList.length === 0 && (
            <div className={styles['messages-container2']}>
              <h1>
                Your chat history is empty start messaging to see the messages
                here
              </h1>

              <div className={styles['msg-input-container']}>
                <input
                  className={styles['message-input']}
                  value={messageInput}
                  placeholder="Type Message"
                  onChange={this.updateMsgValue}
                  onKeyUp={event =>
                    this.postMsg(event, activeContactDetails.phoneNo)
                  }
                  id="MessageInput"
                />
                <button
                  className="emoji-icon"
                  type="button"
                  onClick={this.toggleEmojiPicker}
                >
                  <BsEmojiSmile />
                </button>
              </div>
            </div>
          )}
          {showMessagesView && !(MessagesList.length === 0) && (
            <div className={styles.Allmessages}>
              <div className={styles.chatHeader}>
                <div className={styles['contact-info']}>
                  <div className={styles['contact-logo']}>
                    {activeContact[0]}
                  </div>
                  <div>
                    <p className={styles.contactname}>{activeContact}</p>
                    <p className={styles['status-info']}>
                      {activeContactStatus
                        ? 'Online'
                        : `Last Seen Today at ${hours}:${minutes}`}
                    </p>
                  </div>
                </div>
                <div className={styles['call-icons']}>
                  <button
                    className={styles['call-icon']}
                    onClick={() => {
                      this.startVideoCall(activeContactDetails.phoneNo)
                    }}
                  >
                    <BiSolidVideo />
                  </button>
                  <button className={styles['call-icon']}>
                    <IoIosCall />
                  </button>
                </div>
              </div>
              <div className={styles.messages}>
                {MessagesList.map(messageDetails => (
                  <Message messageDetails={messageDetails} />
                ))}
              </div>
              <div className={styles['msg-input-container']}>
                <Popup
                  trigger={
                    <button className={styles['emoji-icon']} type="button">
                      <BsEmojiSmile />
                    </button>
                  }
                  position="top"
                  offsetX={0}
                  offsetY={450}
                >
                  <Picker data={data} onEmojiSelect={this.handleEmojiClick} />
                </Popup>
                <input
                  className={styles['message-input']}
                  value={messageInput}
                  placeholder="Type Message"
                  onChange={this.updateMsgValue}
                  onKeyUp={event =>
                    this.postMsg(event, activeContactDetails.phoneNo)
                  }
                  id="MessageInput"
                />
              </div>
            </div>
          )}
          {showGroupMessagesView && MessagesList.length === 0 && (
            <div className={styles['messages-container2']}>
              <h1>
                Your Group chat history is empty start messaging to see the
                messages here
              </h1>

              <div className={styles['msg-input-container']}>
                <input
                  className={styles['message-input']}
                  value={messageInput}
                  placeholder="Type Message"
                  onChange={this.updateMsgValue}
                  onKeyUp={event =>
                    this.postGroupMsg(event, activeGroupDetails)
                  }
                  id="MessageInput"
                />
                <button
                  className="emoji-icon"
                  type="button"
                  onClick={this.toggleEmojiPicker}
                >
                  <BsEmojiSmile />
                </button>
              </div>
            </div>
          )}
          {showGroupMessagesView && !(MessagesList.length === 0) && (
            <div className={styles.Allmessages}>
              <div className={styles.chatHeader}>
                <div className={styles['contact-info']}>
                  <div className={styles['contact-logo']}>{activegroup[0]}</div>
                  <div>
                    <p className={styles.contactname}>{activegroup}</p>
                    {/* <p className={styles['status-info']}>
                      {activeContactStatus
                        ? 'Online'
                        : `Last Seen Today at ${hours}:${minutes}`}
                    </p> */}
                  </div>
                </div>
                <div className={styles['call-icons']}>
                  <button
                    className={styles['call-icon']}
                    onClick={() => {
                      this.InitializeGroupCall(activeGroupDetails)
                    }}
                  >
                    <BiSolidVideo />
                  </button>
                  <button className={styles['call-icon']}>
                    <IoIosCall />
                  </button>
                </div>
              </div>
              <div className={styles.messages}>
                {MessagesList.map(messageDetails => {
                  const MessageSenderDetails = userDetails.contacts.find(
                    contact => contact.phoneNo === messageDetails.sender,
                  )
                  let MessageSenderName = null

                  if (MessageSenderDetails === undefined) {
                    MessageSenderName = ''
                  } else {
                    MessageSenderName = MessageSenderDetails.name
                  }
                  return (
                    <GroupMessage
                      messageDetails={messageDetails}
                      currentUser={userDetails.phoneNo}
                      MessageSenderName={MessageSenderName}
                    />
                  )
                })}
              </div>
              <div className={styles['msg-input-container']}>
                <input
                  className={styles['message-input']}
                  value={messageInput}
                  placeholder="Type Message"
                  onChange={this.updateMsgValue}
                  onKeyUp={event =>
                    this.postGroupMsg(event, activeGroupDetails)
                  }
                  id="MessageInput"
                />

                <button
                  className="emoji-icon"
                  type="button"
                  onClick={this.toggleEmojiPicker}
                >
                  <BsEmojiSmile />
                </button>
              </div>
            </div>
          )}

          <Popup
            open={IncomingCallView}
            onClose={this.declineCall}
            modal
            closeOnDocumentClick={false}
            closeOnEscape={false}
          >
            <div>
              <h1>{callerName} is calling You</h1>
              <button type="button" onClick={this.answerCall}>
                Accept
              </button>
              <button type="button" onClick={this.declineCall}>
                Decline
              </button>
            </div>
          </Popup>

          <Popup
            open={outGoingCallView}
            onClose={this.declineCall}
            modal
            closeOnDocumentClick={false}
            closeOnEscape={false}
          >
            <div>
              <h1 id="outgoingcall">Calling {activeContact}</h1>
            </div>
          </Popup>
          <Popup
            open={uploadProfilePic}
            modal
            closeOnDocumentClick={false}
            closeOnEscape={false}
          >
            <div>
              <form
                onSubmit={this.uploadProfilePicture}
                encType="multipart/form-data"
              >
                <input type="file" id="uploadPic" />
                <h1>Choose Picture</h1>
                <button type="submit">Upload</button>
              </form>
            </div>
          </Popup>

          <Popup modal closeOnDocumentClick={false} open={showAddContactPopup}>
            {showAddContactsView && (
              <div>
                <form onSubmit={this.Addcontact}>
                  <label htmlFor="phoneNo">Phone No</label>
                  <input
                    type="search"
                    className={styles.searc}
                    value={phoneNo}
                    onChange={this.onchangePhoneno}
                    id="phoneNo"
                  />

                  <label htmlFor="contactName">Contact Name</label>
                  <input
                    className={styles.s}
                    placeholder="Enter the name of contact you want to save"
                    value={contactname}
                    onChange={this.onchangeContactname}
                    id="contactName"
                  />
                  <button className={styles['search-utton']} type="submit">
                    Add
                  </button>
                </form>
              </div>
            )}
            {console.log(contactAddedView)}
            {contactAddedView && (
              <div>
                <p>Successfully added contact</p>
                <button
                  type="button"
                  onClick={() => {
                    this.setState(
                      {
                        showAddContactsView: false,
                        contactAddedView: false,
                        showAddContactPopup: false,
                      },
                      this.getUserProfile,
                    )
                  }}
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    this.setState({
                      showAddContactsView: true,
                      contactAddedView: false,
                    })
                  }}
                >
                  Add More
                </button>
              </div>
            )}
          </Popup>

          <Popup
            open={showCreateNewGroupView}
            modal
            closeOnDocumentClick={false}
            contentStyle={{
              overflowY: 'auto',
              maxHeight: '80vh',
            }}
          >
            <div
            // className={styles['create-group-form']}
            >
              <h1>Add group participants</h1>
              <input
                placeholder="enter group name here"
                type="text"
                onChange={this.onChangeGroupName}
                value={groupName}
              />

              <div className={styles['user-contacts']}>
                {userDetails.contacts.map(contact => {
                  const Isactive = contact.name === activeContact
                  return (
                    <>
                      <div
                        key={contact.phoneNo}
                        className={
                          Isactive
                            ? styles['contact-item-selected']
                            : styles['contact-item']
                        }
                      >
                        <input
                          type="checkbox"
                          id={contact.name}
                          onChange={event => {
                            if (event.target.checked === true) {
                              groupUsers.push(contact.phoneNo)
                            } else {
                              const deleteIndex = groupUsers.findIndex(
                                element => element === contact.phoneNo,
                              )
                              groupUsers.splice(deleteIndex, 1)
                            }
                          }}
                        />
                        <label
                          htmlFor={contact.name}
                          className={styles['create-group-label']}
                        >
                          <p className={styles['contact-logo']}>
                            {contact.name[0]}
                          </p>
                          <p>{contact.name}</p>
                        </label>
                      </div>
                    </>
                  )
                })}
              </div>
              <button onClick={this.createGroup}>Add</button>
            </div>
          </Popup>
          <Popup open={groupCallIntiate} closeOnDocumentClick={false}>
            <h1>Select participants</h1>
            <ul>
              {groupCallOnlinePeople.map(person => (
                <li className={styles['contacts-online']}>
                  <input
                    type="checkbox"
                    id={person.name}
                    onChange={event => {
                      console.log('person', person)
                      if (event.target.checked === true) {
                        GroupVideoCallUsers.push({
                          socketId: person.socketId,
                          peerId: person.peerId,
                        })
                      } else {
                        const deleteIndex = GroupVideoCallUsers.findIndex(
                          element => element.socketId === person.socketId,
                        )
                        GroupVideoCallUsers.splice(deleteIndex, 1)
                      }
                      console.log(GroupVideoCallUsers)
                    }}
                  />
                  <label htmlFor={person.name}>{person.name}</label>
                </li>
              ))}
            </ul>
            <p>
              Note: only participants of group who are online are shown here
            </p>
            <button
              onClick={() => {
                this.startGroupVideoCall(activeGroupDetails.groupName)
              }}
            >
              Start Video Call
            </button>
          </Popup>

          <Popup open={IncomingGroupCallView} closeOnDocumentClick={false}>
            <div>
              <h1>Incoming call from {callerGroup}</h1>
              <button onClick={this.acceptGroupCall}>Accept</button>
              <button onClick={this.declineGroupCall}>Decline</button>
            </div>
          </Popup>
        </div>
      </div>
    )
    //     }}
    //   </SocketMyPeerContext.Consumer>
    // )
  }

  renderFailureView = () => <h1>Oops something went wrong</h1>

  LoadHomePage = () => {
    const {apiStatus} = this.state

    switch (apiStatus) {
      case apiStatusConstants.success:
        return this.renderCompleteView()
      case apiStatusConstants.failure:
        return this.renderFailureView()
      case apiStatusConstants.inProgress:
        return this.renderLoadingView()
      default:
        return <h1>rt</h1>
    }
  }

  render() {
    return <div>{this.LoadHomePage()}</div>
  }
}
export default Home
