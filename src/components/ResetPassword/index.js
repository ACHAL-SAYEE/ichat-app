import {Component} from 'react'
import Cookies from 'js-cookie'
import {Redirect} from 'react-router-dom'
import styles from './index.module.css'

var audio = new Audio('/Windows7StartupSound.mp3')
var errorAudio = new Audio('/Windowserror.mp3')
class ResetPassword extends Component {
  state = {
    phoneNo: '9398088463',
    errorMsg: '',
    isOTPGenerated: false,
    isOTPVerified: false,
    showSubmitError: false,
    otp: null,
    password: '',
    confirmPassword: '',
    isSuccessfullyReset: false,
  }

  handleSubmit = e => {
    e.preventDefault()
    const {
      isOTPGenerated,
      isOTPVerified,
      otp,
      password,
      confirmPassword,
    } = this.state
    if (!isOTPGenerated) {
      this.generateOTP()
    } else if (!isOTPVerified) {
      this.verifyOTP()
    } else if (isOTPVerified) {
      this.ResetPassword()
    }
  }

  onSubmitFailure = errorMsg => {
    errorAudio.play()
    this.setState({showSubmitError: true, errorMsg})
  }

  ResetPassword = async () => {
    const {phoneNo, password, confirmPassword} = this.state
    const userDetails = {phoneNo, password, confirmPassword}
    const url = 'http://localhost:3007/resetPassword'
    const options = {
      method: 'PUT',
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
          isSuccessfullyReset: true,
          //   i: false,this.on
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

  generateOTP = async () => {
    const {phoneNo} = this.state
    const userDetails = {phoneNo}
    console.log(userDetails)
    const url = 'http://localhost:3007/loginOtp'
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
    const url = 'http://localhost:3007/loginVerifyOtp'
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
        // this.onSubmitSuccess(data.iChatJwtToken)
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

  onChangeConfirmPassword = e => {
    this.setState({confirmPassword: e.target.value})
  }

  render() {
    const iChatJwtToken = Cookies.get('ichat_jwt_token')
    if (iChatJwtToken !== undefined) {
      return <Redirect to="/" />
    }
    const {
      isSuccessfullyReset,
      phoneNo,
      otp,
      isOTPGenerated,
      isOTPVerified,
      showSubmitError,
      errorMsg,
      password,
      confirmPassword,
    } = this.state
    return (
      <div className={styles.bg}>
        <h1 className={styles.heading}>Welcome To iChat App</h1>
        <div className={styles.x}>
          <div className={styles['login-register-container']}>
            <div className={styles['logo-container']}></div>
            <form
              onSubmit={this.handleSubmit}
              className={styles['otp-container']}
            >
              {!isOTPGenerated && (
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
                      Submit
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
              {isOTPGenerated && !isOTPVerified && (
                <>
                  <div className={styles['achal']}>
                    <div className={styles.inputContainer}>
                      <label htmlFor="otp">OTP</label>
                      <input
                        id="otp"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        title="Please enter a valid phone number (numeric characters only)"
                        value={otp}
                        onChange={this.onChangeotp}
                        className={styles['inputFields']}
                      />
                    </div>
                    <button type="submit" className={styles['btn']}>
                      Submit
                    </button>

                    {showSubmitError && (
                      <p className={styles['error-para']}>{`*${errorMsg}`}</p>
                    )}
                  </div>
                </>
              )}
              {isOTPVerified && !isSuccessfullyReset && (
                <>
                  <div className={styles['achal']}>
                    <div className={styles.inputContainer}>
                      <label htmlFor="password">PASSWORD</label>
                      <input
                        id="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        title="Please enter a valid phone number (numeric characters only)"
                        value={password}
                        onChange={this.onChangePassword}
                        className={styles['inputFields']}
                      />
                    </div>
                    <div className={styles.inputContainer}>
                      <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
                      <input
                        id="confirmPassword"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        title="Please enter a valid phone number (numeric characters only)"
                        value={confirmPassword}
                        onChange={this.onChangeConfirmPassword}
                        className={styles['inputFields']}
                      />
                    </div>
                    <button type="submit" className={styles['btn']}>
                      Submit
                    </button>
                    {/* <div className={styles.separator}>
                      <div className={styles.line}></div>
                      <div>or</div>
                      <div className={styles.line}></div>
                    </div>
                    <hr /> */}
                    {showSubmitError && (
                      <p className={styles['error-para']}>{`*${errorMsg}`}</p>
                    )}
                  </div>
                </>
              )}
              {isSuccessfullyReset && (
                <>
                  <div className={styles['achal']}>
                    <p>
                      Password reset successfully click<a href="/login">here</a>
                      to login
                    </p>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    )
  }
}
export default ResetPassword
