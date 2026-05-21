const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  // 'slide' = hero slider, 'side' = banner bên phải, 'paylater' = banner trả góp
  type: {
    type: String,
    enum: ['slide', 'side', 'paylater'],
    required: true,
    default: 'slide'
  },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  label: { type: String, default: '' },
  price: { type: String, default: '' },
  oldPrice: { type: String, default: '' },
  bgImage: { type: String, default: '' },
  productImg: { type: String, default: '' },
  color: { type: String, default: '#1a1a2e' },
  thumb: { type: String, default: '' },
  link: { type: String, default: '/products' },
  // Dành cho side banner
  icon: { type: String, default: '' },
  badgeText: { type: String, default: '' },
  badgeColor: { type: String, default: '#e31e24' },
  badgeTextColor: { type: String, default: '#ffffff' },
  overlayClass: { type: String, default: '' },
  order: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
