const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { generateOTP, sendOTP } = require('../utils/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Format user response
const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  address: user.address || '',
  avatar: user.avatar || '',
  gender: user.gender || '',
  birthDate: user.birthDate || '',
  googleId: user.googleId || '',
  token: generateToken(user._id)
});

// ==================== OTP STORE (In-Memory) ====================
// Lưu OTP tạm trong bộ nhớ: { email: { otp, data, expiresAt, type } }
const otpStore = new Map();

// Hàm dọn dẹp OTP hết hạn mỗi 5 phút
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      otpStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Regex validate tên tiếng Việt
const vietnameseNameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]{2,}$/;

// ==================== ĐĂNG KÝ VỚI OTP ====================

// POST /api/auth/send-otp - Gửi OTP để đăng ký
router.post('/send-otp', [
  body('name').notEmpty().withMessage('Vui lòng nhập họ tên')
    .custom((value) => {
      if (!vietnameseNameRegex.test(value)) {
        throw new Error('Họ tên chỉ được chứa chữ cái và khoảng trắng, tối thiểu 2 ký tự');
      }
      return true;
    }),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 8 }).withMessage('Mật khẩu tối thiểu 8 ký tự')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password, phone, gender, birthDate } = req.body;

    // Kiểm tra email đã tồn tại
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Kiểm tra rate limit (60s giữa mỗi lần gửi)
    const existingOtp = otpStore.get(`register_${email}`);
    if (existingOtp && Date.now() - existingOtp.createdAt < 60000) {
      const remainingSeconds = Math.ceil((60000 - (Date.now() - existingOtp.createdAt)) / 1000);
      return res.status(429).json({ 
        message: `Vui lòng đợi ${remainingSeconds} giây trước khi gửi lại OTP` 
      });
    }

    // Tạo OTP và lưu tạm
    const otp = generateOTP();
    otpStore.set(`register_${email}`, {
      otp,
      data: { name, email, password, phone, gender, birthDate },
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 phút
      createdAt: Date.now()
    });

    // Gửi OTP qua email
    await sendOTP(email, otp, 'register');

    // Che bớt email để hiển thị
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    res.json({ 
      message: 'Mã OTP đã được gửi đến email của bạn',
      email: maskedEmail
    });
  } catch (error) {
    console.error('Lỗi gửi OTP:', error);
    if (error.code === 'EAUTH' || error.message?.includes('auth')) {
      return res.status(500).json({ 
        message: 'Lỗi cấu hình email server. Vui lòng kiểm tra EMAIL_USER và EMAIL_PASS trong file .env' 
      });
    }
    res.status(500).json({ message: 'Không thể gửi OTP. Vui lòng thử lại sau.' });
  }
});

// POST /api/auth/verify-otp - Xác minh OTP và tạo tài khoản
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải có 6 chữ số')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, otp } = req.body;
    const storedData = otpStore.get(`register_${email}`);

    if (!storedData) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn hoặc không tồn tại. Vui lòng gửi lại.' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(`register_${email}`);
      return res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng gửi lại.' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không đúng. Vui lòng kiểm tra lại.' });
    }

    // OTP đúng - tạo tài khoản
    const { name, password, phone, gender, birthDate } = storedData.data;
    
    // Kiểm tra lại email (phòng trường hợp đăng ký trùng trong thời gian chờ OTP)
    const userExists = await User.findOne({ email });
    if (userExists) {
      otpStore.delete(`register_${email}`);
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const user = await User.create({ 
      name, email, password,
      phone: phone || '',
      gender: gender || '',
      birthDate: birthDate || ''
    });

    // Xoá OTP sau khi đăng ký thành công
    otpStore.delete(`register_${email}`);

    res.status(201).json(formatUserResponse(user));
  } catch (error) {
    console.error('Lỗi verify OTP:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== QUÊN MẬT KHẨU ====================

// POST /api/auth/forgot-password - Gửi OTP reset password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email không hợp lệ')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email } = req.body;
    
    // Kiểm tra email có tồn tại
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email chưa được đăng ký trong hệ thống' });
    }

    // Kiểm tra nếu user đăng ký bằng Google (không có password)
    if (user.googleId && !user.password) {
      return res.status(400).json({ message: 'Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập bằng Google.' });
    }

    // Rate limit
    const existingOtp = otpStore.get(`forgot_${email}`);
    if (existingOtp && Date.now() - existingOtp.createdAt < 60000) {
      const remainingSeconds = Math.ceil((60000 - (Date.now() - existingOtp.createdAt)) / 1000);
      return res.status(429).json({ 
        message: `Vui lòng đợi ${remainingSeconds} giây trước khi gửi lại OTP` 
      });
    }

    // Tạo OTP
    const otp = generateOTP();
    otpStore.set(`forgot_${email}`, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      createdAt: Date.now(),
      verified: false
    });

    // Gửi OTP
    await sendOTP(email, otp, 'forgot');

    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    res.json({ 
      message: 'Mã OTP đã được gửi đến email của bạn',
      email: maskedEmail
    });
  } catch (error) {
    console.error('Lỗi forgot password:', error);
    res.status(500).json({ message: 'Không thể gửi OTP. Vui lòng thử lại sau.' });
  }
});

// POST /api/auth/verify-forgot-otp - Xác minh OTP quên mật khẩu
router.post('/verify-forgot-otp', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải có 6 chữ số')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, otp } = req.body;
    const storedData = otpStore.get(`forgot_${email}`);

    if (!storedData) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn hoặc không tồn tại' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(`forgot_${email}`);
      return res.status(400).json({ message: 'Mã OTP đã hết hạn' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không đúng' });
    }

    // Đánh dấu OTP đã xác minh
    storedData.verified = true;
    storedData.expiresAt = Date.now() + 10 * 60 * 1000; // Thêm 10 phút để đặt mật khẩu mới
    otpStore.set(`forgot_${email}`, storedData);

    res.json({ message: 'Xác minh OTP thành công. Bạn có thể đặt mật khẩu mới.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/reset-password - Đặt lại mật khẩu
router.post('/reset-password', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 8 }).withMessage('Mật khẩu tối thiểu 8 ký tự')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const storedData = otpStore.get(`forgot_${email}`);

    if (!storedData || !storedData.verified) {
      return res.status(400).json({ message: 'Vui lòng xác minh OTP trước khi đặt lại mật khẩu' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(`forgot_${email}`);
      return res.status(400).json({ message: 'Phiên đặt lại mật khẩu đã hết hạn. Vui lòng thử lại.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    user.password = password;
    await user.save();

    // Xoá OTP
    otpStore.delete(`forgot_${email}`);

    res.json({ message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ĐĂNG KÝ TRỰC TIẾP (LEGACY - disabled) ====================
// POST /api/auth/register - Giữ lại nhưng redirect sang OTP flow
router.post('/register', [
  body('name').notEmpty().withMessage('Vui lòng nhập tên')
    .custom((value) => {
      if (!vietnameseNameRegex.test(value)) {
        throw new Error('Họ tên chỉ được chứa chữ cái và khoảng trắng, tối thiểu 2 ký tự');
      }
      return true;
    }),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 8 }).withMessage('Mật khẩu tối thiểu 8 ký tự')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password, phone, gender, birthDate } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const user = await User.create({ 
      name, email, password,
      phone: phone || '',
      gender: gender || '',
      birthDate: birthDate || ''
    });

    res.status(201).json(formatUserResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json(formatUserResponse(user));
    } else {
      res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/google - Google Login/Register
router.post('/google', async (req, res) => {
  try {
    const { email, name, googleId, avatar } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ message: 'Thiếu thông tin Google' });
    }

    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: avatar || '',
        role: 'user'
      });
    }

    res.json(formatUserResponse(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      user.address = req.body.address !== undefined ? req.body.address : user.address;
      user.gender = req.body.gender !== undefined ? req.body.gender : user.gender;
      user.birthDate = req.body.birthDate !== undefined ? req.body.birthDate : user.birthDate;
      user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;
      if (req.body.password) {
        user.password = req.body.password;
      }
      const updatedUser = await user.save();
      res.json(formatUserResponse(updatedUser));
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
