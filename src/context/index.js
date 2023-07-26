import React from 'react'

const SocketMyPeerContext = React.createContext({
  socket: null,
  myPeer: null,
})

export default SocketMyPeerContext