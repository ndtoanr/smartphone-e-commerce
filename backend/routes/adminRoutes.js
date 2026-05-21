const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

// GET /api/admin/dashboard
router.get('/dashboard', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const revenueAgg = await Order.aggregate([
      { $match: { status: 'Đã giao' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    const recentOrders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Đã giao'] }, '$totalPrice', 0]
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Daily revenue (tất cả các ngày)
    const dailyRevenue = await Order.aggregate([
      { $match: {} },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Đã giao'] }, '$totalPrice', 0]
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Weekly revenue (last 12 weeks)
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

    const weeklyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: twelveWeeksAgo } } },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$createdAt' },
            week: { $isoWeek: '$createdAt' }
          },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Đã giao'] }, '$totalPrice', 0]
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    // Yearly revenue (all years)
    const yearlyRevenue = await Order.aggregate([
      { $match: {} },
      {
        $group: {
          _id: { year: { $year: '$createdAt' } },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Đã giao'] }, '$totalPrice', 0]
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1 } }
    ]);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentOrders,
      ordersByStatus,
      monthlyRevenue,
      dailyRevenue,
      weeklyRevenue,
      yearlyRevenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/dashboard/orders-by-date?day=8&month=4&year=2026
router.get('/dashboard/orders-by-date', protect, admin, async (req, res) => {
  try {
    const { day, month, year } = req.query;
    if (!day || !month || !year) {
      return res.status(400).json({ message: 'Thiếu tham số ngày/tháng/năm' });
    }

    const startDate = new Date(year, month - 1, day, 0, 0, 0);
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/users
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.role === 'admin') {
        return res.status(400).json({ message: 'Không thể xóa admin' });
      }
      await User.findByIdAndDelete(req.params.id);
      res.json({ message: 'Đã xóa người dùng' });
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
