import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation errors
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // OTP state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { loginWithGoogle, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = location.search ? location.search.split('=')[1] : '/';

  // Vietnamese name regex
  const vietnameseNameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]{2,}$/;

  useEffect(() => {
    if (user) {
      navigate(redirect);
      return;
    }

    const initGoogle = () => {
      if (!window.google) return false;
      const btnContainer = document.getElementById('google-btn-register');
      if (!btnContainer) return false;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || window.__GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
        callback: async (response) => {
          try {
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            await loginWithGoogle({
              email: payload.email,
              name: payload.name,
              googleId: payload.sub,
              avatar: payload.picture
            });
            toast.success('Đăng ký bằng Google thành công!');
          } catch (err) {
            setError(err.response?.data?.message || 'Lỗi đăng ký bằng Google');
          }
        }
      });
      window.google.accounts.id.renderButton(
        btnContainer,
        { theme: 'outline', size: 'large', type: 'standard', text: 'signup_with', width: '384' }
      );
      return true;
    };

    if (!initGoogle()) {
      const intervalId = setInterval(() => {
        if (initGoogle()) clearInterval(intervalId);
      }, 500);
      return () => clearInterval(intervalId);
    }
  }, [user, navigate, redirect, loginWithGoogle]);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // ========== VALIDATION FUNCTIONS ==========
  const validateName = (value) => {
    if (!value.trim()) {
      setNameError('Vui lòng nhập họ tên');
      return false;
    }
    if (!vietnameseNameRegex.test(value)) {
      setNameError('Họ tên chỉ được chứa chữ cái và khoảng trắng, tối thiểu 2 ký tự');
      return false;
    }
    setNameError('');
    return true;
  };

  const validateEmail = (value) => {
    if (!value.trim()) {
      setEmailError('Vui lòng nhập email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Email không hợp lệ');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError('Vui lòng nhập mật khẩu');
      return false;
    }
    if (value.length < 8) {
      setPasswordError('Mật khẩu tối thiểu 8 ký tự');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (value) => {
    if (!value) {
      setConfirmPasswordError('Vui lòng xác nhận mật khẩu');
      return false;
    }
    if (value !== password) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  // Password strength
  const getPasswordStrength = () => {
    if (!password) return { level: 0, text: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, text: 'Yếu', color: '#ef4444' };
    if (score <= 2) return { level: 2, text: 'Trung bình', color: '#f59e0b' };
    if (score <= 3) return { level: 3, text: 'Khá', color: '#3b82f6' };
    return { level: 4, text: 'Mạnh', color: '#22c55e' };
  };

  // ========== SUBMIT - SEND OTP ==========
  const submitHandler = async (e) => {
    e.preventDefault();

    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(confirmPassword);

    if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmValid) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/auth/send-otp', { 
        name, email, password, phone, gender, birthDate 
      });
      setMaskedEmail(data.email);
      setShowOtpModal(true);
      setOtpCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
      toast.success('Mã OTP đã được gửi đến email của bạn!');
    } catch (err) {
      console.error('Lỗi gửi OTP:', err);
      setError(err.response?.data?.message || 'Lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== OTP INPUT HANDLERS ==========
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Chỉ cho phép số
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.slice(-1); // Chỉ lấy ký tự cuối
    setOtpValues(newOtpValues);

    // Auto focus to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtpValues(pastedData.split(''));
      const lastInput = document.getElementById('otp-5');
      if (lastInput) lastInput.focus();
    }
  };

  // ========== VERIFY OTP ==========
  const verifyOtp = async () => {
    const otp = otpValues.join('');
    if (otp.length !== 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số OTP');
      return;
    }

    setIsVerifying(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      // Đăng ký thành công - lưu user info
      localStorage.setItem('userInfo', JSON.stringify(data));
      toast.success('Đăng ký thành công!');
      // Reload để AuthContext nhận user mới
      window.location.href = redirect;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã OTP không đúng');
    } finally {
      setIsVerifying(false);
    }
  };

  // ========== RESEND OTP ==========
  const resendOtp = async () => {
    if (otpCountdown > 0) return;

    setIsResending(true);
    try {
      const { data } = await api.post('/auth/send-otp', { 
        name, email, password, phone, gender, birthDate 
      });
      setOtpCountdown(60);
      setOtpValues(['', '', '', '', '', '']);
      toast.success('Đã gửi lại mã OTP!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi lại OTP');
    } finally {
      setIsResending(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="flex justify-center items-center py-12 fade-in">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Đăng ký</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={submitHandler}>
          {/* Họ và tên */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="name">
              Họ và tên *
            </label>
            <input
              className={`input-field ${nameError ? 'border-red-400 focus:ring-red-300' : ''}`}
              id="name"
              type="text"
              placeholder="Nhập họ tên của bạn"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) validateName(e.target.value);
              }}
              onBlur={(e) => validateName(e.target.value)}
              required
            />
            {nameError && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {nameError}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
              Email *
            </label>
            <input
              className={`input-field ${emailError ? 'border-red-400 focus:ring-red-300' : ''}`}
              id="email"
              type="email"
              placeholder="Nhập địa chỉ email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              required
            />
            {emailError && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {emailError}
              </p>
            )}
          </div>

          {/* Phone + Gender */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="phone">
                Số điện thoại
              </label>
              <input
                className="input-field"
                id="phone"
                type="tel"
                placeholder="0912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="gender">
                Giới tính
              </label>
              <select
                className="input-field"
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Chọn...</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          {/* Birth Date */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="birthDate">
              Ngày sinh
            </label>
            <input
              className="input-field"
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          
          {/* Mật khẩu */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
              Mật khẩu * <span className="text-gray-400 font-normal">(tối thiểu 8 ký tự)</span>
            </label>
            <div className="relative">
              <input
                className={`input-field pr-10 ${passwordError ? 'border-red-400 focus:ring-red-300' : ''}`}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                  if (confirmPassword) validateConfirmPassword(confirmPassword);
                }}
                onBlur={(e) => validatePassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
            {passwordError && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {passwordError}
              </p>
            )}
            {/* Password strength indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className="h-1.5 flex-1 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: level <= strength.level ? strength.color : '#e5e7eb'
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strength.color }}>
                  Độ mạnh: {strength.text}
                </p>
              </div>
            )}
          </div>

          {/* Xác nhận mật khẩu */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="confirmPassword">
              Xác nhận mật khẩu *
            </label>
            <div className="relative">
              <input
                className={`input-field pr-10 ${confirmPasswordError ? 'border-red-400 focus:ring-red-300' : ''}`}
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) validateConfirmPassword(e.target.value);
                }}
                onBlur={(e) => validateConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {confirmPasswordError}
              </p>
            )}
          </div>

          <button
            className={`w-full btn btn-primary py-3 flex justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang gửi mã xác thực...
              </span>
            ) : 'Tạo tài khoản'}
          </button>
        </form>

        <div className="relative mt-8 mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-400">Hoặc đăng ký bằng</span>
          </div>
        </div>

        {/* Google Sign-In Container */}
        <div id="google-btn-register" className="flex justify-center w-full"></div>

        <p className="mt-6 text-center text-gray-600 text-sm">
          Đã có tài khoản?{' '}
          <Link to={redirect ? `/login?redirect=${redirect}` : '/login'} className="text-primary-600 font-semibold hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>

      {/* ==================== OTP MODAL ==================== */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            {/* Close button */}
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fee2e2, #fecaca)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">Xác thực email</h3>
            <p className="text-center text-gray-500 mb-1 text-sm">
              Mã OTP đã được gửi đến
            </p>
            <p className="text-center font-semibold text-gray-700 mb-6">
              {maskedEmail}
            </p>

            {/* OTP Inputs */}
            <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={value}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none transition-all"
                  style={{ caretColor: '#e31e24' }}
                />
              ))}
            </div>

            {/* Timer & Resend */}
            <div className="text-center mb-6">
              {otpCountdown > 0 ? (
                <p className="text-gray-500 text-sm">
                  Gửi lại mã sau <span className="font-semibold text-red-500">{otpCountdown}s</span>
                </p>
              ) : (
                <button
                  onClick={resendOtp}
                  disabled={isResending}
                  className="text-red-500 hover:text-red-600 font-semibold text-sm underline transition-colors disabled:opacity-50"
                >
                  {isResending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                </button>
              )}
            </div>

            {/* Verify Button */}
            <button
              onClick={verifyOtp}
              disabled={isVerifying || otpValues.some(v => !v)}
              className={`w-full btn btn-primary py-3 flex justify-center items-center gap-2 ${
                isVerifying || otpValues.some(v => !v) ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isVerifying ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xác thực...
                </>
              ) : 'Xác nhận'}
            </button>

            <p className="text-center text-gray-400 text-xs mt-4">
              Mã OTP có hiệu lực trong 5 phút
            </p>
          </div>
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
