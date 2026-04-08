const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/auth');

// POST /api/coupons - Admin tạo coupon
router.post('/', protect, admin, async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, maxUses, expiryDate } = req.body;

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Mã giảm giá đã tồn tại' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxUses: maxUses || 100,
      expiryDate
    });

    // Create Notification for all existing users
    try {
      const User = require('../models/User');
      const Notification = require('../models/Notification');
      const allUsers = await User.find({ _id: { $ne: req.user._id } }).select('_id');
      
      const discountText = discountType === 'percent' ? `${discountValue}%` : `${discountValue.toLocaleString('vi-VN')}đ`;
      const notifications = allUsers.map(u => ({
        user: u._id,
        title: 'Voucher Mới! 🎁',
        message: `Mã giảm giá ${coupon.code} giảm ${discountText} cho đơn từ ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ. Nhanh tay săn ngay, giới hạn ${coupon.maxUses} lượt!`,
        type: 'VOUCHER',
        relatedId: coupon._id
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (err) {
      console.error('Error creating voucher notifications:', err);
    }

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/coupons - Admin xem danh sách
router.get('/', protect, admin, async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/coupons/:id - Admin xóa coupon
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
    }
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa mã giảm giá' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/coupons/apply - User áp dụng coupon
router.post('/apply', protect, async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại hoặc đã hết hiệu lực' });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: 'Mã giảm giá đã hết hạn' });
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng' });
    }

    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({ 
        message: `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ để sử dụng mã này` 
      });
    }

    let discount = 0;
    if (coupon.discountType === 'percent') {
      discount = Math.round(subtotal * coupon.discountValue / 100);
    } else {
      discount = coupon.discountValue;
    }

    // Discount không vượt quá subtotal
    if (discount > subtotal) {
      discount = subtotal;
    }

    res.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
