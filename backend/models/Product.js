const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  color: { type: String, required: true },
  storage: { type: String, required: true },
  originalPrice: { type: Number, default: 0 },
  stock: { type: Number, min: 0, default: 0 },
  price: { type: Number, min: 0 } // Giá riêng cho variant, nếu không có → dùng giá gốc
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên sản phẩm'],
    trim: true
  },
  brand: {
    type: String,
    required: [true, 'Vui lòng nhập hãng'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Vui lòng nhập mô tả'],
  },
  originalPrice: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'Vui lòng nhập giá'],
    min: 0
  },
  image: {
    type: String,
    default: '/uploads/default-phone.png'
  },
  condition: {
    type: String,
    enum: ['Máy mới', 'Máy như mới (Like New)', 'Máy cũ'],
    default: 'Máy mới'
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  sold: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  specs: {
    screen: String,
    cpu: String,
    ram: String,
    storage: String,
    battery: String,
    camera: String
  },
  discountType: {
    type: String,
    enum: ['none', 'amount', 'percent'],
    default: 'none'
  },
  discountValue: {
    type: Number,
    default: 0
  },
  variants: [variantSchema]
}, { timestamps: true });

// Auto tính tổng stock từ variants (nếu có variants)
productSchema.pre('save', function (next) {
  if (this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((sum, v) => sum + v.stock, 0);
  }
  next();
});

productSchema.index({ name: 'text', brand: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);

