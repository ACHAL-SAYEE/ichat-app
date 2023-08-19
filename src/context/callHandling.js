let CallAnsweringUserId = null
let SocketObject = null
let MyPeerObject = null
let UsersToConnect = null
// let ToCallUserPhoneNo = null
let CallingUserSocketId = null
let callingUserContactName = null
let currentUserPhoneNo = null

export function setCallingUserContactName(contactName) {
  callingUserContactName = contactName
}

export function getCallingUserContactName() {
  return callingUserContactName
}

export function setCallingUserSocketId(phoneNo) {
  CallingUserSocketId = phoneNo
}

export function getCallingUserSocketId() {
  return CallingUserSocketId
}

export function setCallAnsweringUserId(userId) {
  CallAnsweringUserId = userId
}

export function getCallAnsweringUserId() {
  return CallAnsweringUserId
}

export function setMyPeerObject(PeerObj) {
  MyPeerObject = PeerObj
  //   console.log("PeerObj",MyPeerObject)
}

export function getMyPeerObject() {
  return MyPeerObject
}

export function setSocketObject(SocketObj) {
  SocketObject = SocketObj
  // console.log("SocketObj",SocketObject)
}

export function getSocketObject(userId) {
  return SocketObject
}

export function setUsersToConnect(UsersToConnectArr) {
  UsersToConnect = UsersToConnectArr
  // console.log("SocketObj",SocketObject)
}

export function setCurrentUserPhoneNo(phoneNo) {
  currentUserPhoneNo = phoneNo
}

export function getCurrentUserPhoneNo() {
  return currentUserPhoneNo
}
