const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const BuyingAdvice = require('../models/BuyingAdvice');
const { protect, admin } = require('../middleware/auth');

// ============ PUBLIC ROUTES ============

// GET /api/homepage/banners - Lấy banners active (public)
router.get('/banners', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    const banners = await Banner.find(filter).sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/homepage/advices - Lấy tư vấn active (public)
router.get('/advices', async (req, res) => {
  try {
    const advices = await BuyingAdvice.find({ isActive: true }).sort({ order: 1 });
    res.json(advices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============ ADMIN ROUTES ============

// --- BANNERS ---

// GET /api/homepage/admin/banners - Admin lấy tất cả banners
router.get('/admin/banners', protect, admin, async (req, res) => {
  try {
    const banners = await Banner.find({}).sort({ type: 1, order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/homepage/admin/banners - Admin tạo banner mới
router.post('/admin/banners', protect, admin, async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json(banner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/homepage/admin/banners/:id - Admin sửa banner
router.put('/admin/banners/:id', protect, admin, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!banner) return res.status(404).json({ message: 'Không tìm thấy banner' });
    res.json(banner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/homepage/admin/banners/:id - Admin xóa banner
router.delete('/admin/banners/:id', protect, admin, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Không tìm thấy banner' });
    res.json({ message: 'Đã xóa banner' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- BUYING ADVICES ---

// GET /api/homepage/admin/advices - Admin lấy tất cả tư vấn
router.get('/admin/advices', protect, admin, async (req, res) => {
  try {
    const advices = await BuyingAdvice.find({}).sort({ order: 1 });
    res.json(advices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/homepage/admin/advices - Admin tạo tư vấn mới
router.post('/admin/advices', protect, admin, async (req, res) => {
  try {
    const advice = await BuyingAdvice.create(req.body);
    res.status(201).json(advice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/homepage/admin/advices/:id - Admin sửa tư vấn
router.put('/admin/advices/:id', protect, admin, async (req, res) => {
  try {
    const advice = await BuyingAdvice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!advice) return res.status(404).json({ message: 'Không tìm thấy tư vấn' });
    res.json(advice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/homepage/admin/advices/:id - Admin xóa tư vấn
router.delete('/admin/advices/:id', protect, admin, async (req, res) => {
  try {
    const advice = await BuyingAdvice.findByIdAndDelete(req.params.id);
    if (!advice) return res.status(404).json({ message: 'Không tìm thấy tư vấn' });
    res.json({ message: 'Đã xóa tư vấn' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/homepage/admin/seed - Seed dữ liệu mẫu
router.post('/admin/seed', protect, admin, async (req, res) => {
  try {
    const bannerCount = await Banner.countDocuments();
    const adviceCount = await BuyingAdvice.countDocuments();

    if (bannerCount > 0 && adviceCount > 0) {
      return res.json({ message: 'Dữ liệu đã có sẵn, không cần seed', bannerCount, adviceCount });
    }

    // Seed slides
    if (bannerCount === 0) {
      await Banner.insertMany([
        {
          type: 'slide', order: 0, title: 'iPhone 17 Pro Max', subtitle: 'Titan Tự Nhiên · Camera 48MP · A19 Pro',
          label: 'SIÊU SALE', price: '37.000K', oldPrice: '42.000K', thumb: 'iPhone 17 Pro Max',
          bgImage: 'https://www.apple.com/v/iphone/home/cj/images/overview/select/iphone_17pro__t1j902iw6kya_large_2x.jpg',
          productImg: 'https://www.apple.com/v/iphone/home/cj/images/overview/select/iphone_17pro__t1j902iw6kya_large_2x.jpg',
          color: '#1a1a2e'
        },
        {
          type: 'slide', order: 1, title: 'Samsung Galaxy S26 Ultra', subtitle: 'Galaxy AI · Snapdragon® 8 Elite Gen 5 · 200MP',
          label: 'MỚI VỀ', price: '36.990K', oldPrice: '38.990K', thumb: 'Galaxy S26 Ultra',
          bgImage: 'https://images.samsung.com/is/image/samsung/p6pim/vn/s2602/gallery/vn-galaxy-s26-ultra-s948-sm-s948bzwbxxv-550804873?imbypass=true',
          productImg: 'https://images.samsung.com/is/image/samsung/p6pim/vn/s2602/gallery/vn-galaxy-s26-ultra-s948-sm-s948bzwbxxv-550804873?imbypass=true',
          color: '#0c1445'
        },
        {
          type: 'slide', order: 2, title: 'Xiaomi 14 Ultra', subtitle: 'Leica Summilux · Snapdragon 8 Gen 3',
          label: 'HOT DEAL', price: '18.990K', oldPrice: '22.990K', thumb: 'Xiaomi 14 Ultra',
          bgImage: 'https://i02.appmifile.com/578_item_vn/26/02/2026/5fbc3092cf6e8e9820020206a11266b2.png?thumb=1&w=600&f=webp&q=85',
          productImg: 'https://i02.appmifile.com/578_item_vn/26/02/2026/5fbc3092cf6e8e9820020206a11266b2.png?thumb=1&w=600&f=webp&q=85',
          color: '#1b1b2f'
        },
        {
          type: 'slide', order: 3, title: 'OPPO Find X7 Ultra', subtitle: 'Hasselblad Camera · Dimensity 9300',
          label: 'GIÁ SỐC', price: '19.490K', oldPrice: '24.990K', thumb: 'OPPO Find X7 Ultra',
          bgImage: 'https://www.oppo.com/content/dam/oppo/common/mkt/v2-2/find-x8-series-en/find-x8-pro/listpage/432-600-white.png',
          productImg: 'https://www.oppo.com/content/dam/oppo/common/mkt/v2-2/find-x8-series-en/find-x8-pro/listpage/432-600-white.png',
          color: '#16213e'
        },
        {
          type: 'slide', order: 4, title: 'Redmi Note 13 Pro 5G', subtitle: '200MP · Snapdragon 7s Gen 2 · 5000mAh',
          label: 'BÁN CHẠY', price: '5.490K', oldPrice: '7.490K', thumb: 'Redmi Note 13 Pro',
          bgImage: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/i/xiaomi-redmi-note-13-pro-4g_13__1.png',
          productImg: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/i/xiaomi-redmi-note-13-pro-4g_13__1.png',
          color: '#0f3460'
        },
        // Side banners
        {
          type: 'side', order: 0, title: 'Phụ Kiện\nChính Hãng', subtitle: 'Giảm đến 50%',
          bgImage: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=600&auto=format&fit=crop',
          icon: 'fa-solid fa-headphones', badgeText: 'CHÍNH HÃNG', overlayClass: 'dth-side-banner-overlay-1',
          badgeColor: '#e31e24', badgeTextColor: '#ffffff'
        },
        {
          type: 'side', order: 1, title: 'Nhà Tài Trợ\nĐồng Hành', subtitle: 'Samsung • Apple • Xiaomi',
          bgImage: 'https://images.unsplash.com/photo-1560472355-536de3962603?q=80&w=600&auto=format&fit=crop',
          icon: 'fa-solid fa-handshake', badgeText: 'ĐỐI TÁC', overlayClass: 'dth-side-banner-overlay-2',
          badgeColor: '#ffcc00', badgeTextColor: '#e31e24'
        },
        // Paylater banner
        {
          type: 'paylater', order: 0, title: 'Trả Góp 0% Siêu Tốc',
          subtitle: 'Không cần thẻ tín dụng, thủ tục 5 phút lấy máy ngay!',
          bgImage: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?q=80&w=1400&auto=format&fit=crop'
        }
      ]);
    }

    // Seed advices
    if (adviceCount === 0) {
      await BuyingAdvice.insertMany([
        { youtubeId: 'QrXReeL07-c', title: 'ĐẬP HỘP iPHONE 17 PRO MAX CAM VŨ TRỤ: CHÁY HÀNG SAU 5 PHÚT!!', thumbnail: 'https://img.youtube.com/vi/QrXReeL07-c/maxresdefault.jpg', order: 0 },
        { youtubeId: 'k-da5eHhiVY', title: 'Galaxy S26 Ultra đã "out trình" so với phần còn lại của thế giới smartphone !!!', thumbnail: 'https://img.youtube.com/vi/k-da5eHhiVY/maxresdefault.jpg', order: 1 },
        { youtubeId: '5E5SNAqEATw', title: 'Đánh giá chi tiết Xiaomi 14 Ultra: Cảm ơn vì đã đến Việt Nam 🇻🇳', thumbnail: 'https://img.youtube.com/vi/5E5SNAqEATw/maxresdefault.jpg', order: 2 },
        { youtubeId: 'XQHIgzRCNw8', title: 'OPPO Find X7 Ultra trên tay mình, đẹp quá thể! 2 Camera tiềm vọng để làm gì?', thumbnail: 'https://img.youtube.com/vi/XQHIgzRCNw8/maxresdefault.jpg', order: 3 },
        { youtubeId: 'MrxcijP7iao', title: 'Đánh giá Redmi Note 13 Pro 5G: Toàn diện trong phân khúc!', thumbnail: 'https://img.youtube.com/vi/MrxcijP7iao/maxresdefault.jpg', order: 4 },
        { youtubeId: 'e_6F7MOWMTg', title: 'So sánh Galaxy S26 Ultra và iPhone 17 Pro Max !!!', thumbnail: 'https://img.youtube.com/vi/e_6F7MOWMTg/maxresdefault.jpg', order: 5 },
        { youtubeId: 'kYhGXH-3JHM', title: 'Đây là 4 điện thoại ĐÁNG TIỀN NHẤT NÊN MUA ĐẦU 2026 | CellphoneS', thumbnail: 'https://img.youtube.com/vi/kYhGXH-3JHM/maxresdefault.jpg', order: 6 },
        { youtubeId: '9DrV-v9vJN0', title: 'TOP ĐIỆN THOẠI 2-3 TRIỆU VÔ ĐỊCH PIN 7000MAH, MÀN 120HZ, CẤU HÌNH KHỎE DÙNG LÂU DÀI!', thumbnail: 'https://img.youtube.com/vi/9DrV-v9vJN0/maxresdefault.jpg', order: 7 }
      ]);
    }

    res.json({ message: 'Đã seed dữ liệu trang chủ thành công!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
