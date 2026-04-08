const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const { protect, admin } = require('../middleware/auth');

// Tính phí ship theo thành phố (Shop ở Hà Nội)
const calculateShippingFee = (city) => {
  if (city === 'Hà Nội') return 30000; // Nội thành Hà Nội
  return 50000; // Các tỉnh/thành khác
};

// POST /api/orders - Create order
router.post('/', protect, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, buyNowItem, couponCode } = req.body;
    let orderItems = [];
    let isBuyNow = false;

    if (buyNowItem) {
      const product = await Product.findById(buyNowItem.product);
      if (!product) {
        return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
      }

      let availableStock = product.stock;
      let orderPrice = product.price;
      let variantColor = '';
      let variantStorage = '';

      if (buyNowItem.variantId && product.variants && product.variants.length > 0) {
        const variant = product.variants.id(buyNowItem.variantId);
        if (variant) {
          availableStock = variant.stock;
          orderPrice = variant.price || product.price;
          variantColor = variant.color;
          variantStorage = variant.storage;
        }
      }

      if (availableStock < buyNowItem.quantity) {
        return res.status(400).json({ message: 'Số lượng mua vượt quá lượng tồn kho' });
      }
      orderItems = [{
        product: product._id,
        variantId: buyNowItem.variantId,
        name: product.name,
        price: orderPrice,
        quantity: buyNowItem.quantity,
        image: product.image,
        color: variantColor,
        storage: variantStorage
      }];
      isBuyNow = true;
    } else {
      const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'Giỏ hàng trống' });
      }
      orderItems = cart.items.map(item => {
        let orderPrice = item.product.price;
        let variantColor = '';
        let variantStorage = '';
        
        if (item.variantId && item.product.variants && item.product.variants.length > 0) {
          const variant = item.product.variants.id(item.variantId);
          if (variant) {
            orderPrice = variant.price || item.product.price;
            variantColor = variant.color;
            variantStorage = variant.storage;
          }
        }

        return {
          product: item.product._id,
          variantId: item.variantId,
          name: item.product.name,
          price: orderPrice,
          quantity: item.quantity,
          image: item.product.image,
          color: variantColor,
          storage: variantStorage
        };
      });
    }

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity, 0
    );

    // Tính phí ship
    const shippingFee = calculateShippingFee(shippingAddress.city);

    // Xử lý coupon
    let discount = 0;
    let appliedCouponCode = '';
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon && new Date() <= new Date(coupon.expiryDate) && coupon.usedCount < coupon.maxUses && subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'percent') {
          discount = Math.round(subtotal * coupon.discountValue / 100);
        } else {
          discount = coupon.discountValue;
        }
        if (discount > subtotal) discount = subtotal;
        appliedCouponCode = coupon.code;
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const totalPrice = subtotal + shippingFee - discount;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingFee,
      discount,
      couponCode: appliedCouponCode,
      totalPrice: totalPrice > 0 ? totalPrice : 0,
      isPaid: false,
      paidAt: undefined
    });

    // Update stock and sold qty
    for (const item of orderItems) {
      const p = await Product.findById(item.product);
      if (p) {
        p.sold += item.quantity;
        if (item.variantId && p.variants && p.variants.length > 0) {
          const variant = p.variants.id(item.variantId);
          if (variant) {
            variant.stock -= item.quantity;
          }
        } else {
          p.stock -= item.quantity; // fallback for products without variants
        }
        await p.save();
      }
    }

    // Clear cart if not buy now
    if (!isBuyNow) {
      const cart = await Cart.findOne({ user: req.user._id });
      if (cart) {
        cart.items = [];
        await cart.save();
      }
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/my-orders
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (order) {
      if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Không có quyền xem đơn hàng này' });
      }
      res.json(order);
    } else {
      res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/orders/:id/pay - User pay order online mock
router.put('/:id/pay', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (order) {
      if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Không có quyền cập nhật đơn hàng này' });
      }

      order.isPaid = true;
      order.paidAt = Date.now();

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/orders/:id/cancel - User cancel order
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { cancelReason } = req.body;
    const order = await Order.findById(req.params.id);
    if (order) {
      if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Không có quyền hủy đơn hàng này' });
      }

      if (order.status !== 'Chờ xác nhận') {
        return res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng khi trạng thái đang là Chờ xác nhận' });
      }

      order.status = 'Đã hủy';
      if (cancelReason) {
        order.cancelReason = cancelReason;
      }
      // Hoàn tiền nếu đã thanh toán online
      if (order.isPaid && order.paymentMethod === 'Online') {
        order.isRefunded = true;
      }
      const updatedOrder = await order.save();

      // Restore stock and revert sold count
      for (const item of order.items) {
        const p = await Product.findById(item.product);
        if (p) {
          p.sold -= item.quantity;
          if (item.variantId && p.variants && p.variants.length > 0) {
            const variant = p.variants.id(item.variantId);
            if (variant) variant.stock += item.quantity;
          } else {
            p.stock += item.quantity;
          }
          await p.save();
        }
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/orders - Admin get all
router.get('/', protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/orders/:id/status - Admin update status
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const statusOrder = ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Đã giao', 'Đã hủy'];
    const currentIndex = statusOrder.indexOf(order.status);
    const newIndex = statusOrder.indexOf(req.body.status);

    // Không cho phép thay đổi nếu đã hủy hoặc đã giao
    if (order.status === 'Đã hủy') {
      return res.status(400).json({ message: 'Không thể thay đổi trạng thái đơn hàng đã hủy' });
    }
    if (order.status === 'Đã giao') {
      return res.status(400).json({ message: 'Không thể thay đổi trạng thái đơn hàng đã giao' });
    }

    // Không cho phép chuyển ngược trạng thái (trừ Đã hủy)
    if (req.body.status !== 'Đã hủy' && newIndex < currentIndex) {
      return res.status(400).json({ message: 'Không thể chuyển ngược về trạng thái trước đó' });
    }

    order.status = req.body.status;

    // Đánh dấu đã thanh toán khi giao thành công (COD)
    if (req.body.status === 'Đã giao' && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
    }

    // Hoàn tiền & restore stock khi admin hủy đơn
    if (req.body.status === 'Đã hủy') {
      if (order.isPaid && order.paymentMethod === 'Online') {
        order.isRefunded = true;
      }
      // Restore stock and revert sold count
      for (const item of order.items) {
        const p = await Product.findById(item.product);
        if (p) {
          p.sold -= item.quantity;
          if (item.variantId && p.variants && p.variants.length > 0) {
            const variant = p.variants.id(item.variantId);
            if (variant) variant.stock += item.quantity;
          } else {
            p.stock += item.quantity;
          }
          await p.save();
        }
      }
    }

    const updated = await order.save();

    // Create Notification
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        user: order.user,
        title: 'Cập nhật đơn hàng',
        message: `Đơn hàng #${order._id.toString().substring(18,24).toUpperCase()} của bạn đã chuyển sang trạng thái: ${req.body.status}`,
        type: 'ORDER',
        relatedId: order._id
      });
    } catch (err) {
      console.error('Error creating notification:', err);
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
