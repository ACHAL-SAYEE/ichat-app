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
    loginMode: 'password',
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

  loginUserWithPassword = async () => {
    const {phoneNo, password} = this.state
    const userDetails = {phoneNo, password}
    const url = 'https://apis-ichat.onrender.com/loginwithPassword'
    console.log(JSON.stringify(userDetails))
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

  handleSubmit = e => {
    e.preventDefault()
    const {isOTPGenerated, isOTPVerified, loginMode} = this.state
    if (loginMode === 'password') {
      this.loginUserWithPassword()
    } else if (!isOTPGenerated) {
      this.generateOTP()
    } else if (!isOTPVerified) {
      this.verifyOTP()
    }
  }

  generateOTP = async () => {
    const {phoneNo} = this.state
    const userDetails = {phoneNo}
    console.log(userDetails)
    const url = 'https://apis-ichat.onrender.com/loginOtp'
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
    const url = 'https://apis-ichat.onrender.com/loginVerifyOtp'
    console.log(JSON.stringify(userDetails))
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

  onChangePassword = e => {
    this.setState({password: e.target.value})
  }

  render() {
    const iChatJwtToken = Cookies.get('ichat_jwt_token')
    if (iChatJwtToken !== undefined) {
      return <Redirect to="/" />
    }
    const {
      loginMode,
      phoneNo,
      otp,
      isOTPGenerated,
      showSubmitError,
      errorMsg,
      password,
    } = this.state
    return (
      <div className={styles.bg}>
        <video autoPlay loop muted playsInline className={styles['back-video']}>
          <source src="/backgroundVideo.mp4" />
        </video>
        <h1 className={styles.heading}>Welcome To iChat </h1>
        <img src="/images/iChatLogo.png" alt="logo" className={styles.logo} />
        <div className={styles.x}>
          <div className={styles['login-register-container']}>
            <div className={styles['logo-container']}>
              {/* <img
                src="/images/iChatLogo.png"
                alt="logo"
                className={styles.logo}
              />
              <h1>iChat</h1> */}
            </div>
            <form
              onSubmit={this.handleSubmit}
              className={styles['otp-container']}
            >
              {loginMode === 'password' && (
                <>
                  <div className={styles['achal']}>
                    <div className={styles.inputContainer}>
                      <label htmlFor="PhoneNo">PHONE NUMBER</label>
                      <input
                        id="PhoneNo"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        title="Please enter a valid phone number (numeric characters only)"
                        value={phoneNo}
                        onChange={this.onChangePhoneNo}
                        className={styles['inputFields']}
                      />
                    </div>
                    <div className={styles.inputContainer}>
                      <label htmlFor="password">PASSWORD</label>
                      <input
                        id="password"
                        value={password}
                        onChange={this.onChangePassword}
                        className={styles['inputFields']}
                      />
                    </div>
                    <p className={styles.forgottenText}>
                      <a href="/resetPassword" className={styles.forgottenFuck}>
                        Forgotten Password?
                      </a>
                    </p>

                    <button type="submit" className={styles['btn']}>
                      Sign in
                    </button>
                    <div className={styles.separator}>
                      <div className={styles.line}></div>
                      <div>or</div>
                      <div className={styles.line}></div>
                    </div>
                    {/* <hr /> */}
                    <button
                      type="button"
                      className={styles['btn']}
                      onClick={() => {
                        this.setState({loginMode: 'otp'})
                      }}
                    >
                      Sign in with Otp
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
              {loginMode === 'otp' && !isOTPGenerated && (
                <>
                  <div className={styles['achal']}>
                    <div className={styles.inputContainer}>
                      <label htmlFor="PhoneNo">PHONE NUMBER</label>
                      <input
                        id="PhoneNo"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        title="Please enter a valid phone number (numeric characters only)"
                        value={phoneNo}
                        onChange={this.onChangePhoneNo}
                        className={styles['inputFields']}
                      />
                    </div>
                    <button type="submit" className={styles['btn']}>
                      Login
                    </button>
                    <div className={styles.separator}>
                      <div className={styles.line}></div>
                      <div>or</div>
                      <div className={styles.line}></div>
                    </div>
                    <button
                      className={styles['btn']}
                      type="button"
                      onClick={() => {
                        this.setState({loginMode: 'password'})
                      }}
                    >
                      Login with password
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
              {loginMode === 'otp' && isOTPGenerated && (
                <>
                  <div className={styles['achal']}>
                    <div className={styles.inputContainer}>
                      <label htmlFor="otp">OTP</label>
                      <input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={this.onChangeotp}
                        className={styles['inputFields']}
                      />
                    </div>
                    <button
                      type="submit"
                      className={styles['btn']}
                      onClick={() => {
                        this.setState({loginMode: 'password'})
                      }}
                    >
                      Submit
                    </button>
                  </div>
                  <p>
                    An otp has been sent to your phone number please enter the
                    otp to continue
                  </p>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    )
  }
}
export default LoginForm
