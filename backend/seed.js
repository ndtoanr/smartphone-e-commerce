const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Category = require('./models/Category');

dotenv.config();

const categories = [
  { name: 'Apple', slug: 'apple' },
  { name: 'Samsung', slug: 'samsung' },
  { name: 'Xiaomi', slug: 'xiaomi' },
  { name: 'OPPO', slug: 'oppo' },
  { name: 'Vivo', slug: 'vivo' }
];

const getProducts = (categoryMap) => [
  {
    name: 'iPhone 15 Pro Max',
    brand: 'Apple',
    description: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, khung titan. Màn hình Super Retina XDR 6.7 inch, pin cả ngày dài.',
    price: 34990000,
    image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15-pro-max_3.png',
    category: categoryMap['Apple'],
    stock: 50,
    rating: 4.8,
    numReviews: 120,
    specs: { screen: '6.7" Super Retina XDR OLED', cpu: 'A17 Pro', ram: '8GB', storage: '256GB', battery: '4441 mAh', camera: '48MP + 12MP + 12MP' }
  },
  {
    name: 'iPhone 15',
    brand: 'Apple',
    description: 'iPhone 15 với Dynamic Island, camera 48MP, chip A16 Bionic. Thiết kế mới với cổng USB-C.',
    price: 22990000,
    image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-15_3.png',
    category: categoryMap['Apple'],
    stock: 80,
    rating: 4.6,
    numReviews: 95,
    specs: { screen: '6.1" Super Retina XDR OLED', cpu: 'A16 Bionic', ram: '6GB', storage: '128GB', battery: '3877 mAh', camera: '48MP + 12MP' }
  },
  {
    name: 'iPhone 14',
    brand: 'Apple',
    description: 'iPhone 14 với hệ thống camera kép tiên tiến, chip A15 Bionic mạnh mẽ, pin cả ngày dài.',
    price: 17990000,
    image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/i/p/iphone-14_1.png',
    category: categoryMap['Apple'],
    stock: 60,
    rating: 4.5,
    numReviews: 200,
    specs: { screen: '6.1" Super Retina XDR OLED', cpu: 'A15 Bionic', ram: '6GB', storage: '128GB', battery: '3279 mAh', camera: '12MP + 12MP' }
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    description: 'Galaxy S24 Ultra với Galaxy AI, camera 200MP, bút S Pen, khung titan. Hiệu năng đỉnh cao với Snapdragon 8 Gen 3.',
    price: 33990000,
    image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/s/ss-s24-ultra-702.png',
    category: categoryMap['Samsung'],
    stock: 45,
    rating: 4.7,
    numReviews: 88,
    specs: { screen: '6.8" Dynamic AMOLED 2X', cpu: 'Snapdragon 8 Gen 3', ram: '12GB', storage: '256GB', battery: '5000 mAh', camera: '200MP + 50MP + 12MP + 10MP' }
  },
  {
    name: 'Samsung Galaxy S24',
    brand: 'Samsung',
    description: 'Galaxy S24 với Galaxy AI, thiết kế mỏng nhẹ, màn hình Dynamic AMOLED 2X và chip Exynos 2400.',
    price: 22990000,
    image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/a/samsung-galaxy-s24.png',
    category: categoryMap['Samsung'],
    stock: 70,
    rating: 4.5,
    numReviews: 65,
    specs: { screen: '6.2" Dynamic AMOLED 2X', cpu: 'Exynos 2400', ram: '8GB', storage: '256GB', battery: '4000 mAh', camera: '50MP + 12MP + 10MP' }
  },
  {
    name: 'Samsung Galaxy A55',
    brand: 'Samsung',
    description: 'Galaxy A55 5G với thiết kế cao cấp, màn hình Super AMOLED 120Hz, chip Exynos 1480.',
    price: 9990000,
    image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/s/a/samsung-galaxy-a55-5g.png',
    category: categoryMap['Samsung'],
    stock: 100,
    rating: 4.3,
    numReviews: 150,
    specs: { screen: '6.6" Super AMOLED', cpu: 'Exynos 1480', ram: '8GB', storage: '128GB', battery: '5000 mAh', camera: '50MP + 12MP + 5MP' }
  },
  {
    name: 'Xiaomi 14 Ultra',
    brand: 'Xiaomi',
    description: 'Xiaomi 14 Ultra với camera Leica, Snapdragon 8 Gen 3, sạc nhanh 90W. Flagship đỉnh cao từ Xiaomi.',
    price: 23990000,
    image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/i/xiaomi-14-ultra_1.png',
    category: categoryMap['Xiaomi'],
    stock: 30,
    rating: 4.6,
    numReviews: 42,
    specs: { screen: '6.73" LTPO AMOLED', cpu: 'Snapdragon 8 Gen 3', ram: '16GB', storage: '512GB', battery: '5000 mAh', camera: '50MP + 50MP + 50MP + 50MP' }
  },
  {
    name: 'Xiaomi Redmi Note 13 Pro',
    brand: 'Xiaomi',
    description: 'Redmi Note 13 Pro 5G với camera 200MP, Snapdragon 7s Gen 2, sạc nhanh 67W. Hiệu năng tốt trong tầm giá.',
    price: 7990000,
    image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/i/xiaomi-redmi-note-13-pro-5g-128gb.png',
    category: categoryMap['Xiaomi'],
    stock: 120,
    rating: 4.4,
    numReviews: 180,
    specs: { screen: '6.67" AMOLED 120Hz', cpu: 'Snapdragon 7s Gen 2', ram: '8GB', storage: '128GB', battery: '5100 mAh', camera: '200MP + 8MP + 2MP' }
  },
  {
    name: 'Xiaomi Redmi Note 12',
    brand: 'Xiaomi',
    description: 'Redmi Note 12 với màn hình AMOLED, camera 50MP. Lựa chọn tốt trong phân khúc giá rẻ.',
    price: 4490000,
    image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/x/i/xiaomi-redmi-note-12.png',
    category: categoryMap['Xiaomi'],
    stock: 150,
    rating: 4.2,
    numReviews: 250,
    specs: { screen: '6.67" AMOLED', cpu: 'Snapdragon 685', ram: '4GB', storage: '128GB', battery: '5000 mAh', camera: '50MP + 8MP + 2MP' }
  },
  {
    name: 'OPPO Find X7 Ultra',
    brand: 'OPPO',
    description: 'OPPO Find X7 Ultra với camera Hasselblad, Dimensity 9300, thiết kế sang trọng. Flagship Android đáng chú ý.',
    price: 22990000,
    image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/o/p/oppo-find-x7-ultra.png',
    category: categoryMap['OPPO'],
    stock: 25,
    rating: 4.5,
    numReviews: 35,
    specs: { screen: '6.82" LTPO AMOLED', cpu: 'Dimensity 9300', ram: '16GB', storage: '512GB', battery: '5210 mAh', camera: '50MP + 50MP + 50MP + 50MP' }
  },
  {
    name: 'OPPO Reno 11',
    brand: 'OPPO',
    description: 'OPPO Reno 11 5G với thiết kế thời trang, camera chân dung chuyên nghiệp, Dimensity 7050.',
    price: 9990000,
    image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/o/p/oppo-reno-11-5g.png',
    category: categoryMap['OPPO'],
    stock: 85,
    rating: 4.3,
    numReviews: 72,
    specs: { screen: '6.7" AMOLED 120Hz', cpu: 'Dimensity 7050', ram: '8GB', storage: '256GB', battery: '4600 mAh', camera: '50MP + 32MP + 8MP' }
  },
  {
    name: 'Vivo X100 Pro',
    brand: 'Vivo',
    description: 'Vivo X100 Pro với camera ZEISS, Dimensity 9300, sạc nhanh 100W. Chuyên gia nhiếp ảnh di động.',
    price: 19990000,
    image: 'https://cdn2.cellphones.com.vn/insecure/rs:fill:358:358/q:90/plain/https://cellphones.com.vn/media/catalog/product/v/i/vivo-x100-pro.png',
    category: categoryMap['Vivo'],
    stock: 35,
    rating: 4.4,
    numReviews: 28,
    specs: { screen: '6.78" LTPO AMOLED', cpu: 'Dimensity 9300', ram: '12GB', storage: '256GB', battery: '5400 mAh', camera: '50MP + 50MP + 50MP' }
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    await Category.deleteMany({});

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'admin123',
      role: 'admin',
      phone: '0123456789'
    });
    console.log('Admin created: admin@gmail.com / admin123');

    // Create test user
    await User.create({
      name: 'Nguyen Van A',
      email: 'user@gmail.com',
      password: 'user123',
      role: 'user',
      phone: '0987654321',
      address: '123 Nguyen Hue, Q1, TP.HCM'
    });
    console.log('Test user created: user@gmail.com / user123');

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });
    console.log('Categories created');

    // Create products
    const products = getProducts(categoryMap);
    await Product.insertMany(products);
    console.log(`${products.length} products created`);

    console.log('\n=== Seed completed successfully! ===');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
