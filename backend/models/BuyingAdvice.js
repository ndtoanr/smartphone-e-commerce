const mongoose = require('mongoose');

const buyingAdviceSchema = new mongoose.Schema({
  youtubeId: { type: String, required: true },
  title: { type: String, required: true },
  thumbnail: { type: String, default: '' },
  order: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('BuyingAdvice', buyingAdviceSchema);
