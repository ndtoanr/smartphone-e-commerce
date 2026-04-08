const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

// POST /api/payment/create-payment - Tạo phiên thanh toán demo
router.post('/create-payment', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Không có quyền thanh toán đơn hàng này' });
    }
    if (order.isPaid) {
      return res.status(400).json({ message: 'Đơn hàng đã được thanh toán' });
    }

    // Mock payment - tạo thông tin thanh toán VietQR
    const paymentInfo = {
      orderId: order._id,
      amount: order.totalPrice,
      bankId: 'MB',
      bankName: 'MBBank',
      accountName: 'SMARTSHOP JSC',
      accountNo: '8386',
      description: `Thanh toan don hang #${order._id.toString().slice(-6).toUpperCase()}`
    };

    res.json(paymentInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/payment/verify - Xác nhận thanh toán (mock)
router.post('/verify', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    const updatedOrder = await order.save();

    res.json({ message: 'Thanh toán thành công!', order: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
