import {Component} from 'react'
import Cookies from 'js-cookie'
import {Redirect} from 'react-router-dom'
import styles from './index.module.css'

var audio = new Audio('/Windows7StartupSound.mp3')
var errorAudio = new Audio('/Windowserror.mp3')
class LoginForm extends Component {
  state = {
    phoneNo: '',
    errorMsg: '',
    isOTPGenerated: false,
    isOTPVerified: false,
    showSubmitError: false,
    otp: null,
  }

  onSubmitSuccess = iChatJwtToken => {
    const {history} = this.props

    Cookies.set('ichat_jwt_token', iChatJwtToken, {
      expires: 30,
    })
    history.replace('/')
    audio.play()
  }

  onSubmitFailure = errorMsg => {
    errorAudio.play()
    this.setState({showSubmitError: true, errorMsg})
  }

  handleSubmit = e => {
    e.preventDefault()
    const {isOTPGenerated, isOTPVerified} = this.state

    if (!isOTPGenerated) {
      this.generateOTP()
    } else if (!isOTPVerified) {
      this.verifyOTP()
    }
  }

  generateOTP = async () => {
    const {phoneNo} = this.state
    const userDetails = {phoneNo}
    console.log(userDetails)
    const url = 'https://ichat-server-production.up.railway.app/loginOtp'
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userDetails),
    }
    try {
      const response = await fetch(url, options)
      if (response.ok) {
        const data = await response.json()

        console.log(data)
        this.setState({
          isOTPGenerated: true,
          showSubmitError: false,
        })
      } else {
        const data = await response.json()
        console.log(data)
        this.onSubmitFailure(data.error_msg)
        // throw new Error(data.error_msg);
      }
    } catch (error) {
      this.onSubmitFailure(error.message)
    }
  }

  verifyOTP = async () => {
    const {phoneNo, otp, name} = this.state
    const userDetails = {phoneNo, otp, name}
    // const url = 'https://ichat-server-production.up.railway.app/loginVerifyOtp'
    const url = 'https://ichat-server-production.up.railway.app/loginVerifyOtp' // Replace with your server-side API endpoint for verifying OTP
    console.log(JSON.stringify(userDetails))
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Set the Content-Type header
      },
      body: JSON.stringify(userDetails),
    }

    try {
      const response = await fetch(url, options)
      //   console.log(response)
      if (response.ok) {
        const data = await response.json()
        // console.log(data)
        this.setState({
          isOTPVerified: true,
        })
        this.onSubmitSuccess(data.iChatJwtToken)
      } else {
        errorAudio.play()
        const data = await response.json()
        throw new Error(data.error_msg)
      }
    } catch (error) {
      errorAudio.play()
      this.onSubmitFailure(error.message)
      console.log(error.message)
    }
  }

  onChangePhoneNo = e => {
    this.setState({phoneNo: e.target.value})
  }

  onChangeotp = e => {
    this.setState({otp: e.target.value})
  }

  render() {
    const iChatJwtToken = Cookies.get('ichat_jwt_token')
    if (iChatJwtToken !== undefined) {
      return <Redirect to="/" />
    }
    const {phoneNo, otp, isOTPGenerated, showSubmitError, errorMsg} = this.state
    return (
      <div className={styles.bg}>
        <h1 className={styles.heading}>Welcome To iChat App</h1>
        <div className={styles.x}>
          <div className={styles['login-register-container']}>
            <div className={styles['logo-container']}>
              <img
                src="/images/iChatLogo.png"
                alt="logo"
                className={styles.logo}
              />
              <h1>iChat</h1>
            </div>
            <form
              onSubmit={this.handleSubmit}
              className={styles['otp-container']}
            >
              {!isOTPGenerated && (
                <>
                  <div className={styles['achal']}>
                    <label htmlFor="PhoneNo">PHONE NUMBER</label>
                    <input
                      id="PhoneNo"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      title="Please enter a valid phone number (numeric characters only)"
                      value={phoneNo}
                      onChange={this.onChangePhoneNo}
                      className={styles['phoneNo']}
                    />
                    <button type="submit" className={styles['btn']}>
                      Login
                    </button>
                    {showSubmitError && (
                      <p className={styles['error-para']}>{`*${errorMsg}`}</p>
                    )}
                  </div>
                  <p>
                    Not Registered yet?Click <a href="/register">here</a> to
                    register
                  </p>
                </>
              )}
              {isOTPGenerated && (
                <div className={styles['ot-container']}>
                  <div className={styles['achal']}>
                    <label htmlFor="otp">OTP</label>
                    <input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={this.onChangeotp}
                      className={styles['phoneNo']}
                    />
                    <button type="submit" className={styles['btn']}>
                      Submit
                    </button>
                  </div>
                  <p>
                    An otp has been sent to your phone number please enter the
                    otp to continue
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    )
  }
}
export default LoginForm
