import {Component} from 'react'
import {Route, Switch} from 'react-router-dom'
import LoginForm from './components/LoginForm'
import Register from './components/Register'
import {TrialAccount} from './components/TrialAccount'
import {Upgrade} from './components/Upgrade'
import Home from './components/Home'
import ProtectedRoute from './components/ProtectedRoute'
import VideoCall from './components/VideoCall'
import GroupVideoCall from './components/GroupVideoCall'
import './App.css'

class App extends Component {
  render() {
    return (
      <Switch>
        <Route exact path="/login" component={LoginForm} />
        <Route exact path="/register" component={Register} />
        <ProtectedRoute
          exact
          path="/video-call/:callId"
          component={VideoCall}
        />
        <ProtectedRoute exact path="/" component={Home} />
        <ProtectedRoute exact path="/trialaccount" component={TrialAccount} />
        <ProtectedRoute exact path="/upgrade" component={Upgrade} />
        <ProtectedRoute
          exact
          path="/group-video-call/:callId"
          component={GroupVideoCall}
        />
      </Switch>
    )
  }
}

export default App
