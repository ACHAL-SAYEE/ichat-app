import LoginForm from './components/LoginForm'
import Register from './components/Register'
import {Home} from './components/Home'
import ProtectedRoute from './components/ProtectedRoute'
import VideoCall from './components/VideoCall'
import SocketMyPeerContext from './context'
import {Component} from 'react'
import './App.css'
import {Route, Switch} from 'react-router-dom'
// import incomingCount=0
class App extends Component {
  state = {
    socket: null,
    myPeer: null,
    AnswerercallerId: null,
  }
  changeSocket = socket => {
    this.setState({socket})
  }
  changeMyPeer = myPeer => {
    this.setState({myPeer})
  }
  updateCallerId = AnswerercallerId => {
    this.setState({AnswerercallerId})
  }
  render() {
    const {socket, myPeer, AnswerercallerId} = this.state
    return (
      <SocketMyPeerContext.Provider
        value={{
          socket,
          myPeer,
          AnswerercallerId,
          changeSocket: this.changeSocket,
          changeMyPeer: this.changeMyPeer,
          updateCallerId: this.updateCallerId,
        }}
      >
        <Switch>
          <Route exact path="/login" component={LoginForm} />
          <Route exact path="/register" component={Register} />
          <ProtectedRoute
            exact
            path="/video-call/:callId"
            component={VideoCall}
          />
          <ProtectedRoute exact path="/" component={Home} />
        </Switch>
      </SocketMyPeerContext.Provider>
    )
  }
}

export default App
