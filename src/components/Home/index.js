import {Component} from 'react'
import Cookies from 'js-cookie'
import styles from './index.module.css'
import Loader from 'react-loader-spinner'
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css'
import {BsSearch, BsEmojiSmile} from 'react-icons/bs'
import {AiOutlinePlusCircle, AiOutlineEllipsis} from 'react-icons/ai'
import {IoIosCall} from 'react-icons/io'
import {HiOutlineVideoCamera} from 'react-icons/hi'
import {v4 as uuidv4} from 'uuid'
import Message from '../Message'
import socketIOClient from 'socket.io-client'
import userEvent from '@testing-library/user-event'
import Popup from 'reactjs-popup'
import GroupMessage from '../GroupMessage'
import Peer from 'peerjs'
import SocketMyPeerContext from '../../context'

const myPeer = new Peer(undefined, {
  host: 'localhost',
  port: '3009',
  path: '/peerjs',
})



const iChatJwtToken = Cookies.get('ichat_jwt_token')
var audio = new Audio('/ting.mp3')
var logout = new Audio('/Windows7Shutdown.mp3')
var ringtone = new Audio('/ringtone.mp3')
let groupUsers = []
const apiStatusConstants = {
  initial: 'INITIAL',
  success: 'SUCCESS',
  failure: 'FAILURE',
  inProgress: 'IN_PROGRESS',
}

export class Home extends Component {
  state = {
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
    callerId: null,
    outGoingCallView: false,
  }

  async componentDidMount() {
    await this.getUserProfile()
    this.initializeSocketConnection()
    await this.getPresentUserStatus()
  }

  initializeSocketConnection = () => {
    const {userDetails} = this.state
    const socket = socketIOClient('https://apis-ichat.onrender.com')

    socket.on('connect', () => {
      // const {status}=this.state
      socket.emit('storeSocketId', userDetails.phoneNo)
      // this.setState({status:[...status,{}]})
    })

    socket.on('newMessage', newMessageDetils => {
      this.updateMessagesList(newMessageDetils)
      audio.play()
    })
    socket.on('newGroupMessage', newMessageDetils => {
      this.updateGroupMessagesList(newMessageDetils)
      if (newMessageDetils.sender !== userDetails.phoneNo) audio.play()
    })
    socket.on('update-status', phoneNo => {
      let {status} = this.state
      const connectedUserIndex = status.findIndex(
        user => user.phoneNo === phoneNo,
      )
      // if()
      status[connectedUserIndex] = {phoneNo, online: true}
      this.setState({status})
    })
    socket.on('user-answered-call', (VideoCallId, CallAnswererId) => {
      console.log('user picked up your call')
      this.props.history.push({
        pathname: `/video-call/${VideoCallId}`,
        state: {
          CallAnswererId,
        },
      })
      //   connectToNewUser(CallAnswererId, stream)
    })
    socket.on('pick-call', (videocallId, callerName, userId) => {
      console.log('callerId', userId)
      ringtone.play()
      this.setState({
        IncomingCallView: true,
        callerName: callerName,
        activeVideoCallId: videocallId,
        callerId: userId,
      })
    })

    socket.on('user-disconected', phoneNo => {
      let {status} = this.state
      const connectedUserIndex = status.findIndex(
        user => user.phoneNo === phoneNo,
      )
      status[connectedUserIndex] = {phoneNo, online: false}
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
    const iChatJwtToken = Cookies.get('ichat_jwt_token')

    const apiUrl = 'https://apis-ichat.onrender.com/profile'
    const options = {
      headers: {
        Authorization: `Bearer ${iChatJwtToken}`,
      },
      method: 'GET',
    }
    const response = await fetch(apiUrl, options)

    const apiUrl2 = 'https://apis-ichat.onrender.com/groups'
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
        apiStatus: apiStatusConstants.success,
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
      })
    } else {
      this.setState({
        apiStatus: apiStatusConstants.failure,
      })
    }
  }

  getPresentUserStatus = async () => {
    const apiUrl = 'http://localhost:3007/status'
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
    }
  }

  LoadHomePage = () => {
    const {apiStatus} = this.state

    switch (apiStatus) {
      case apiStatusConstants.success:
        return this.renderUserProfileView()
      case apiStatusConstants.failure:
        return this.renderFailureView()
      case apiStatusConstants.inProgress:
        return this.renderLoadingView()
      default:
        return <h1>rt</h1>
    }
  }

  renderLoadingView = () => (
    <div className={styles['home-loader-container']}>
      <Loader type="ThreeDots" color="#0b69ff" height="50" width="50" />
    </div>
  )

  ToggleAddContactsView = () => {
    this.setState({showAddContactsView: true})
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
    const apiUrl = 'https://apis-ichat.onrender.com/addContact'
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
    socket.emit('join-room', activeGroupDetails.groupId)

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

  postMsg = async (event, phoneNo) => {
    if (event.key === 'Enter' && this.state.messageInput !== '') {
      const {messageInput, userDetails} = this.state
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
      const apiUrl = 'https://apis-ichat.onrender.com/sendMessage'
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
    if (event.key === 'Enter' && this.state.messageInput !== '') {
      const {messageInput, userDetails} = this.state
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

      const apiUrl = 'https://apis-ichat.onrender.com/sendGroupMessage'
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
    this.setState({showCreateNewGroupView: true})
  }

  createGroup = async () => {
    const groupName = this.state.groupName
    const groupDetails = {groupName, groupUsers}
    const apiUrl = 'https://apis-ichat.onrender.com/createGroup'
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
    } else {
      const fetchedData = await response.json()
    }
  }

  startVideoCall = async phoneNo => {
    const {status, socket, userDetails} = this.state
    const connectedUser = status.find(user => user.phoneNo === phoneNo)
    const InviteDetails = {phoneNo}
    if (!connectedUser.online) {
      const apiUrl = 'http://localhost:3007/invite'
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
      }
    } else {
      const {history} = this.props
      const videocallId = uuidv4()
      //   history.push(`/video-call/${videocallId}`)
    //   const apiUrl = 'http://localhost:3007/video-call'
      console.log(myPeer)
      //   myPeer.on('open', id => {
      this.setState({outGoingCallView: true})
      console.log('call placed')
      socket.emit(
        'join-call',
        videocallId,
        userDetails.phoneNo,
        phoneNo,
        myPeer.id,
      )
      //   })
    }
  }

  answerCall = () => {
    const {socket, activeVideoCallId,callerId} = this.state
    ringtone.pause()
    ringtone.currentTime = 0
    socket.emit('answer-call', activeVideoCallId, myPeer.id)
    console.log('socket', socket)
    console.log('myPeer', myPeer)
    const {history} = this.props
    history.push({
      pathname: `/video-call/${activeVideoCallId}`,
      state: {
        CallAnswererId:callerId,
      },
    })
  }
  declineCall = () => {
    this.setState({IncomingCallView: false, activeVideoCallId: null})
    ringtone.pause()
    ringtone.currentTime = 0
  }

  renderUserProfileView = () => {
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
      myPeer,
      outGoingCallView,
    } = this.state
    const activeContactDetails = userDetails.contacts.find(
      contact => contact.name === activeContact,
    )
    const activeGroupDetails = currentUserGroups.find(
      group => group.groupName === activegroup,
    )
    // console.log("activeContact", activeContact, "status", status);
    let activeContactStatus = undefined
    if (activeContactDetails) {
      activeContactStatus = status.find(
        user => user.phoneNo === activeContactDetails.phoneNo,
      )
      activeContactStatus = activeContactStatus.online
      //   console.log("activeContactStatus", activeContactStatus);
    }

    return (
      <SocketMyPeerContext.Consumer>
        {value => {
          const {changeSocket, changeMyPeer} = value
          {
            /* const onChangeLanguage = event => {
            changeLanguage(event.target.value)
          } */
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
                {!showCreateNewGroupView && showAddContactsView && (
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
                {!showCreateNewGroupView && contactAddedView && (
                  <div>
                    <p>Successfully added contact</p>
                    <button
                      type="button"
                      onClick={() => {
                        this.setState(
                          {
                            showAddContactsView: false,
                            contactAddedView: false,
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
                {!showCreateNewGroupView &&
                  !(
                    userDetails.contacts.length === 0 &&
                    activeGroupDetails.messages.length == 0
                  ) && (
                    <>
                      <div className={styles.chatsHeading}>
                        <h1>Chats</h1>
                        <div className="popup-container">
                          <Popup
                            trigger={
                              <button
                                type="button"
                                className={styles['three-dots']}
                              >
                                <AiOutlineEllipsis size="50" />
                              </button>
                            }
                            position="bottom left"
                          >
                            <ul className={styles['pop-items']}>
                              <li onClick={this.createNewGroup}>New group</li>
                              <button
                                type="button"
                                onClick={this.onClickLogout}
                              >
                                LogOut
                              </button>
                            </ul>
                          </Popup>
                        </div>

                        <button
                          type="button"
                          onClick={this.ToggleAddContactsView}
                        >
                          <AiOutlinePlusCircle />
                        </button>
                      </div>
                      <div className={styles['search-container']}>
                        <input type="search" className={styles.search} />
                        <button
                          type="button"
                          className={styles['search-button']}
                        >
                          <BsSearch className="icon" size="40" />
                        </button>
                      </div>
                      <div className={styles['user-contacts']}>
                        {userDetails.contacts.map(contact => {
                          const Isactive = contact.name === activeContact
                          return (
                            <div
                              onClick={() => {
                                this.displayChatView(contact.name)
                                changeSocket(this.state.socket)
                                changeMyPeer(this.state.myPeer)
                              }}
                              key={contact.phoneNo}
                              className={
                                Isactive
                                  ? styles['contact-item-selected']
                                  : styles['contact-item']
                              }
                            >
                              <p className={styles['contact-logo']}>
                                {contact.name[0]}
                              </p>
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
                {showCreateNewGroupView && (
                  <div>
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
                                onChange={() => {
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
                              <p className={styles['contact-logo']}>
                                {contact.name[0]}
                              </p>
                              <p>{contact.name}</p>
                            </div>
                          </>
                        )
                      })}
                    </div>
                    <button onClick={this.createGroup}>Add</button>
                  </div>
                )}
              </div>
              <div className={styles['messages-container']}>
                {!outGoingCallView &&
                  !IncomingCallView &&
                  !showMessagesView &&
                  !showGroupMessagesView && (
                    <h1>
                      Ichat get started .select a chat to see the messages here
                      and get started
                    </h1>
                  )}
                {!outGoingCallView &&
                  !IncomingCallView &&
                  showMessagesView &&
                  MessagesList.length === 0 && (
                    <div className={styles['messages-container2']}>
                      <h1>
                        Your chat history is empty start messaging to see the
                        messages here
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
                {!outGoingCallView &&
                  !IncomingCallView &&
                  showMessagesView &&
                  !(MessagesList.length === 0) && (
                    <div className={styles.Allmessages}>
                      <div className={styles.chatHeader}>
                        <div className={styles['contact-info']}>
                          <div className={styles['contact-logo']}>
                            {activeContact[0]}
                          </div>
                          <div>
                            <p className={styles.contactname}>
                              {activeContact}
                            </p>
                            <p className={styles['status-info']}>
                              {activeContactStatus ? 'Online' : 'Offline'}
                            </p>
                          </div>
                        </div>
                        <div className={styles['call-icons']}>
                          <button
                            onClick={() => {
                              this.startVideoCall(activeContactDetails.phoneNo)
                            }}
                          >
                            <HiOutlineVideoCamera />
                          </button>
                          <button>
                            <IoIosCall />
                          </button>
                        </div>
                      </div>
                      <div className={styles.messages}>
                        {MessagesList.map(messageDetails => {
                          return <Message messageDetails={messageDetails} />
                        })}
                      </div>
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
                {!outGoingCallView &&
                  !IncomingCallView &&
                  showGroupMessagesView &&
                  MessagesList.length === 0 && (
                    <div className={styles['messages-container2']}>
                      <h1>
                        Your Group chat history is empty start messaging to see
                        the messages here
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
                {!outGoingCallView &&
                  !IncomingCallView &&
                  showGroupMessagesView &&
                  !(MessagesList.length === 0) && (
                    <div className={styles.Allmessages}>
                      <div className={styles.messages}>
                        {MessagesList.map(messageDetails => {
                          const MessageSenderDetails = userDetails.contacts.find(
                            contact => {
                              return contact.phoneNo === messageDetails.sender
                            },
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
                {IncomingCallView && (
                  <div>
                    <h1>{callerName} is calling You</h1>
                    <button type="button" onClick={this.answerCall}>
                      Accept
                    </button>
                    <button type="button" onClick={this.declineCall}>
                      Decline
                    </button>
                  </div>
                )}
                {outGoingCallView && (
                  <div>
                    <h1>Calling {activeContact}</h1>
                  </div>
                )}
              </div>
            </div>
          )
        }}
      </SocketMyPeerContext.Consumer>
    )
  }

  renderFailureView = () => {
    return <h1>Oops something went wrong</h1>
  }

  render() {
    return <div>{this.LoadHomePage()}</div>
  }
}
