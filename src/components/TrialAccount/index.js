import './index.css'
import {Component} from 'react'

export class TrialAccount extends Component {
  render() {
    return (
      <div>
        <h1>Your Account is a Free Tier Account</h1>
        <h1>Limitations</h1>
        <ul>
          <li>
            You can only make a video call of maximum length of 30 minutes.After
            that call will be automatically ended. Upgrade to premium to have
            uninterepcted video calls
          </li>
        </ul>
        <a href="http://localhost:3000/upgrade">
          <button>Upgrade Now</button>
        </a>
      </div>
    )
  }
}
