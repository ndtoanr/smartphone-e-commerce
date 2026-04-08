const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const { protect } = require('../middleware/auth');

// GET /api/cart
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/cart/add
router.post('/add', protect, async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
      item => item.product.toString() === productId && (!variantId || item.variantId?.toString() === variantId)
    );

    const Product = require('../models/Product');
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    let availableStock = product.stock;
    if (variantId && product.variants && product.variants.length > 0) {
      const variant = product.variants.id(variantId);
      if (variant) availableStock = variant.stock;
    }

    if (existingItem) {
      if (existingItem.quantity + quantity > availableStock) {
        return res.status(400).json({ message: `Chỉ có thể mua tối đa ${availableStock} sản phẩm này.` });
      }
      existingItem.quantity += quantity;
    } else {
      if (quantity > availableStock) {
        return res.status(400).json({ message: `Chỉ có thể mua tối đa ${availableStock} sản phẩm này.` });
      }
      cart.items.push({ product: productId, variantId, quantity });
    }

    await cart.save();
    cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/cart/update
router.put('/update', protect, async (req, res) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }

    const item = cart.items.find(
      item => item.product.toString() === productId && (!variantId || item.variantId?.toString() === variantId)
    );

    const Product = require('../models/Product');
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    let availableStock = product.stock;
    if (variantId && product.variants && product.variants.length > 0) {
      const variant = product.variants.id(variantId);
      if (variant) availableStock = variant.stock;
    }

    if (item) {
      if (quantity <= 0) {
        cart.items = cart.items.filter(
          i => !(i.product.toString() === productId && (!variantId || i.variantId?.toString() === variantId))
        );
      } else {
        if (quantity > availableStock) {
          return res.status(400).json({ message: `Chỉ có thể mua tối đa ${availableStock} sản phẩm này.` });
        }
        item.quantity = quantity;
      }
      await cart.save();
    }

    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/cart/remove/:productId/:variantId?
router.delete('/remove/:productId/:variantId?', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });
    }

    const { productId, variantId } = req.params;
    cart.items = cart.items.filter(
      item => !(item.product.toString() === productId && (!variantId || item.variantId?.toString() === variantId))
    );

    await cart.save();
    const updatedCart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/cart/clear
router.delete('/clear', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Đã xóa giỏ hàng' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
