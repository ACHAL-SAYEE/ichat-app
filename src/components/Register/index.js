import Cookies from 'js-cookie'
import {Redirect} from 'react-router-dom'
import {Component} from 'react'
import socketIOClient from 'socket.io-client'
import {BiSolidShow, BiSolidHide} from 'react-icons/bi'
import styles from './index.module.css'

const socket = socketIOClient('https://apis-ichat.onrender.com')
// const socket = socketIOClient('http://localhost:3007')

class Register extends Component {
  state = {
    name: '',
    phoneNo: '',
    errorMsg: '',
    isOTPGenerated: false,
    isOTPVerified: false,
    showSubmitError: false,
    password: '',
    confirmPassword: '',
    otp: null,
    isPasswordVisible: false,
    isConfirmPasswordVisible: false,
    registered: false,
  }

  togglePasswordView = () => {
    this.setState(prev => ({
      isPasswordVisible: !prev.isPasswordVisible,
    }))
  }

  toggleConfirmPasswordView = () => {
    this.setState(prev => ({
      isConfirmPasswordVisible: !prev.isConfirmPasswordVisible,
    }))
  }

  onSubmitFailure = errorMsg => {
    this.setState({showSubmitError: true, errorMsg})
  }

  handleSubmit = e => {
    e.preventDefault()
    const {isOTPGenerated, isOTPVerified} = this.state

    if (!isOTPGenerated) {
      this.generateOTP()
    } else if (!isOTPVerified) {
      this.verifyOTP()
    } else {
      this.registerUser()
    }
  }

  generateOTP = async () => {
    const {phoneNo, name} = this.state
    const userDetails = {phoneNo, name}
    const url = 'https://apis-ichat.onrender.com/registerOtp'
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
        this.setState({
          isOTPGenerated: true,
          showSubmitError: false,
        })

        socket.emit('storeregistrantsocketid', phoneNo)
      } else {
        const data = await response.json()
        this.onSubmitFailure(data.error_msg)
      }
    } catch (error) {
      this.onSubmitFailure(error.message)
    }
  }

  verifyOTP = async () => {
    const {phoneNo, otp, name} = this.state
    const userDetails = {phoneNo, otp, name}
    const url = 'https://apis-ichat.onrender.com/registerVerifyOtp'

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
        this.setState({
          isOTPVerified: true,
        })
        // const {history} = this.props
        // history.push('/login')
      } else {
        const data = await response.json()
        throw new Error(data.error_msg)
      }
    } catch (error) {
      this.onSubmitFailure(error.message)
    }
  }

  registerUser = async () => {
    const {phoneNo, password, confirmPassword} = this.state
    const userDetails = {phoneNo, password, confirmPassword}

    const url = 'https://apis-ichat.onrender.com/register'

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
        this.setState({
          registered: true,
        })
        // const {history} = this.props
        // history.push('/login')
      } else {
        const data = await response.json()
        // throw new Error(data.error_msg)
        this.onSubmitFailure(data.error_msg)
      }
    } catch (error) {
      this.onSubmitFailure(error.message)
    }
  }

  onChangeName = e => {
    this.setState({name: e.target.value})
  }

  onChangePhoneNo = e => {
    this.setState({phoneNo: e.target.value})
  }

  onChangeotp = e => {
    this.setState({otp: e.target.value})
  }

  onChangeConfirmPassword = e => {
    this.setState({confirmPassword: e.target.value})
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
      registered,
      isOTPGenerated,
      isOTPVerified,
      showSubmitError,
      errorMsg,
      confirmPassword,
      password,
      isPasswordVisible,
      isConfirmPasswordVisible,
    } = this.state
    const PasswordDisplayType = !isPasswordVisible ? 'password' : 'text'
    const ConfirmPasswordDisplayType = !isConfirmPasswordVisible
      ? 'password'
      : 'text'

    return (
      <div className={styles.bg}>
        <h1 className={styles.heading}>Welcome To iChat</h1>
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
            {!isOTPGenerated && !isOTPVerified && (
              <form onSubmit={this.handleSubmit}>
                <div className={styles.InputField}>
                  <label htmlFor="name">NAME</label>
                  <input
                    id="name"
                    type="text"
                    onChange={this.onChangeName}
                    required
                    className={styles.inputFields}
                  />
                </div>
                <div className={styles.InputField}>
                  <label htmlFor="PhoneNo">PHONE NUMBER</label>
                  <input
                    id="PhoneNo"
                    className={styles.inputFields}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    title="Please enter a valid phone number (numeric characters only)"
                    onChange={this.onChangePhoneNo}
                    required
                  />
                </div>
                <button className={styles['register-button']} type="submit">
                  Register
                </button>
                {showSubmitError && (
                  <p className={styles.error_para}>{`*${errorMsg}`}</p>
                )}
                <p>
                  Already Registered? Click <a href="/login">here</a> to login
                </p>
              </form>
            )}
            {isOTPGenerated && !isOTPVerified && (
              <form onSubmit={this.handleSubmit}>
                <div className={styles.InputField}>
                  <label htmlFor="otp">OTP</label>
                  <input id="otp" type="text" onChange={this.onChangeotp} />
                </div>
                <button className={styles['register-button']} type="submit">
                  Verify Otp
                </button>
              </form>
            )}
            {isOTPVerified && (
              <form onSubmit={this.handleSubmit}>
                <div className={styles.InputField}>
                  <label htmlFor="password">PASSWORD</label>
                  <div className={styles.PasswordField}>
                    <input
                      id="password"
                      type={PasswordDisplayType}
                      value={password}
                      onChange={this.onChangePassword}
                    />

                    <button
                      className={styles.passwordTogggleBtn}
                      onClick={this.togglePasswordView}
                    >
                      {!isPasswordVisible && <BiSolidHide />}
                      {isPasswordVisible && <BiSolidShow />}
                    </button>
                  </div>
                </div>
                <div className={styles.InputField}>
                  <label htmlFor="confirmPassword">CONFIRM PASSWORD</label>
                  <div className={styles.PasswordField}>
                    <input
                      id="confirmPassword"
                      type={ConfirmPasswordDisplayType}
                      value={confirmPassword}
                      onChange={this.onChangeConfirmPassword}
                    />
                    <button
                      className={styles.passwordTogggleBtn}
                      onClick={this.toggleConfirmPasswordView}
                    >
                      {!isConfirmPasswordVisible && <BiSolidHide />}
                      {isConfirmPasswordVisible && <BiSolidShow />}
                    </button>
                  </div>
                </div>
                {showSubmitError !== '' && <p>{errorMsg}</p>}
                {registered && (
                  <p>
                    Registered successfully Click <a href="/login">here</a> to
                    login
                  </p>
                )}
                <button className={styles['register-button']} type="submit">
                  Submit
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default Register
