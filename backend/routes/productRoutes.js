const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/auth');

// GET /api/products - List with search, filter, pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    let query = {};

    // Search by name
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: 'i' };
    }

    // Filter by brand
    if (req.query.brand) {
      query.brand = { $regex: req.query.brand, $options: 'i' };
    }

    // Filter by category removed
    if (req.query.condition) {
      query.condition = req.query.condition;
    }

    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    // Sort
    let sort = {};
    if (req.query.sort === 'price_asc') sort.price = 1;
    else if (req.query.sort === 'price_desc') sort.price = -1;
    else if (req.query.sort === 'rating') sort.rating = -1;
    else if (req.query.sort === 'newest') sort.createdAt = -1;
    else sort.createdAt = -1;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sort)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/brands - Get all brands
router.get('/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand');
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// GET /api/products/top-rated - Top 10 sản phẩm được đánh giá cao nhất (tính từ reviews)
router.get('/top-rated', async (req, res) => {
  try {
    const Review = require('../models/Review');
    // Aggregate rating trung bình từ collection Reviews
    const topRatedIds = await Review.aggregate([
      { $group: {
          _id: '$product',
          avgRating: { $avg: '$rating' },
          numReviews: { $sum: 1 }
      }},
      { $match: { numReviews: { $gte: 1 } } },
      { $sort: { avgRating: -1, numReviews: -1 } },
      { $limit: 10 }
    ]);

    if (topRatedIds.length === 0) {
      // Fallback: nếu chưa có review thì lấy theo rating field
      const products = await Product.find({ numReviews: { $gt: 0 } })
        .sort({ rating: -1 })
        .limit(10);
      return res.json(products);
    }

    // Lấy đầy đủ thông tin sản phẩm và gắn avgRating
    const productIds = topRatedIds.map(r => r._id);
    const products = await Product.find({ _id: { $in: productIds } });

    // Sắp xếp lại theo thứ tự avgRating
    const sorted = topRatedIds.map(r => {
      const p = products.find(p => p._id.toString() === r._id.toString());
      if (p) {
        const obj = p.toObject();
        obj.rating = Math.round(r.avgRating * 10) / 10;
        obj.numReviews = r.numReviews;
        return obj;
      }
      return null;
    }).filter(Boolean);

    res.json(sorted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/featured - Top 10 bán chạy nhất (theo sold)
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ sold: -1 })
      .limit(10);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/cheapest - Top 10 rẻ nhất
router.get('/cheapest', async (req, res) => {
  try {
    const products = await Product.find({ stock: { $gt: 0 } })
      .sort({ price: 1 })
      .limit(10);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/newest - Sản phẩm mới nhất
router.get('/newest', async (req, res) => {
  try {
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(8);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/products - Admin create
router.post('/', protect, admin, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/products/:id - Admin update
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    Object.assign(product, req.body);
    const updated = await product.save(); // triggers pre-save hook to calc stock
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/products/:id - Admin delete
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (product) {
      res.json({ message: 'Đã xóa sản phẩm' });
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
