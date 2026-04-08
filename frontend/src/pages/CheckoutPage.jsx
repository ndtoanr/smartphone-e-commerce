import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

// Tính phí ship theo thành phố (sync với backend - Shop ở Hà Nội)
const calculateShippingFee = (city) => {
  if (city === 'Hà Nội') return 30000; // Nội thành Hà Nội
  return 50000; // Các tỉnh/thành khác
};

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const buyNowItem = location.state?.buyNowItem;
  const displayItems = buyNowItem ? [buyNowItem] : cartItems;
  const displayTotal = buyNowItem ? (() => {
    let p = buyNowItem.product.price;
    if (buyNowItem.variantId && buyNowItem.product.variants) {
      const variant = buyNowItem.product.variants.find(v => v._id === buyNowItem.variantId);
      if (variant && variant.price) p = variant.price;
    }
    return p * buyNowItem.quantity;
  })() : cartTotal;

  // Redirect if no items
  useEffect(() => {
    if (!buyNowItem && cartItems.length === 0) {
      navigate('/cart');
    }
  }, [buyNowItem, cartItems.length, navigate]);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: 'Hà Nội'
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Tính toán
  const shippingFee = calculateShippingFee(shippingAddress.city);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const totalPrice = displayTotal + shippingFee - discount;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress({ ...shippingAddress, [name]: value });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/apply', {
        code: couponCode,
        subtotal: displayTotal
      });
      setAppliedCoupon(data);
      toast.success(`Áp dụng mã ${data.code} thành công! Giảm ${data.discount.toLocaleString('vi-VN')}đ`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã giảm giá không hợp lệ');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Đã hủy mã giảm giá');
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        shippingAddress,
        paymentMethod,
        couponCode: appliedCoupon ? appliedCoupon.code : ''
      };
      if (buyNowItem) {
        payload.buyNowItem = {
          product: buyNowItem.product._id,
          variantId: buyNowItem.variantId,
          quantity: buyNowItem.quantity
        };
      }

      const { data } = await api.post('/orders', payload);

      if (!buyNowItem) {
        await clearCart();
      }

      // Nếu chọn thanh toán online, redirect đến trang payment
      if (paymentMethod === 'Online') {
        navigate(`/payment/${data._id}`);
      } else {
        toast.success('Đặt hàng thành công!');
        navigate('/profile');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi đặt hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-4">Thanh toán & Đặt hàng</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Checkout Form */}
        <div className="w-full lg:w-2/3">
          <form onSubmit={submitHandler} id="checkout-form">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">1</span>
                Thông tin giao hàng
              </h2>

              <div className="grid md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="fullName">
                    Họ và tên
                  </label>
                  <input
                    className="input-field"
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={shippingAddress.fullName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="phone">
                    Số điện thoại
                  </label>
                  <input
                    className="input-field"
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={shippingAddress.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="address">
                  Địa chỉ chi tiết (Số nhà, đường, phường/xã, quận/huyện)
                </label>
                <input
                  className="input-field"
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={shippingAddress.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="mb-2">
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="city">
                  Tỉnh/Thành phố
                </label>
                <select
                  className="input-field"
                  id="city"
                  name="city"
                  required
                  value={shippingAddress.city}
                  onChange={handleInputChange}
                >
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Hải Phòng">Hải Phòng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                  <option value="An Giang">An Giang</option>
                  <option value="Bà Rịa - Vũng Tàu">Bà Rịa - Vũng Tàu</option>
                  <option value="Bắc Giang">Bắc Giang</option>
                  <option value="Bắc Kạn">Bắc Kạn</option>
                  <option value="Bạc Liêu">Bạc Liêu</option>
                  <option value="Bắc Ninh">Bắc Ninh</option>
                  <option value="Bến Tre">Bến Tre</option>
                  <option value="Bình Định">Bình Định</option>
                  <option value="Bình Dương">Bình Dương</option>
                  <option value="Bình Phước">Bình Phước</option>
                  <option value="Bình Thuận">Bình Thuận</option>
                  <option value="Cà Mau">Cà Mau</option>
                  <option value="Cao Bằng">Cao Bằng</option>
                  <option value="Đắk Lắk">Đắk Lắk</option>
                  <option value="Đắk Nông">Đắk Nông</option>
                  <option value="Điện Biên">Điện Biên</option>
                  <option value="Đồng Nai">Đồng Nai</option>
                  <option value="Đồng Tháp">Đồng Tháp</option>
                  <option value="Gia Lai">Gia Lai</option>
                  <option value="Hà Giang">Hà Giang</option>
                  <option value="Hà Nam">Hà Nam</option>
                  <option value="Hà Tĩnh">Hà Tĩnh</option>
                  <option value="Hải Dương">Hải Dương</option>
                  <option value="Hậu Giang">Hậu Giang</option>
                  <option value="Hòa Bình">Hòa Bình</option>
                  <option value="Hưng Yên">Hưng Yên</option>
                  <option value="Khánh Hòa">Khánh Hòa</option>
                  <option value="Kiên Giang">Kiên Giang</option>
                  <option value="Kon Tum">Kon Tum</option>
                  <option value="Lai Châu">Lai Châu</option>
                  <option value="Lâm Đồng">Lâm Đồng</option>
                  <option value="Lạng Sơn">Lạng Sơn</option>
                  <option value="Lào Cai">Lào Cai</option>
                  <option value="Long An">Long An</option>
                  <option value="Nam Định">Nam Định</option>
                  <option value="Nghệ An">Nghệ An</option>
                  <option value="Ninh Bình">Ninh Bình</option>
                  <option value="Ninh Thuận">Ninh Thuận</option>
                  <option value="Phú Thọ">Phú Thọ</option>
                  <option value="Phú Yên">Phú Yên</option>
                  <option value="Quảng Bình">Quảng Bình</option>
                  <option value="Quảng Nam">Quảng Nam</option>
                  <option value="Quảng Ngãi">Quảng Ngãi</option>
                  <option value="Quảng Ninh">Quảng Ninh</option>
                  <option value="Quảng Trị">Quảng Trị</option>
                  <option value="Sóc Trăng">Sóc Trăng</option>
                  <option value="Sơn La">Sơn La</option>
                  <option value="Tây Ninh">Tây Ninh</option>
                  <option value="Thái Bình">Thái Bình</option>
                  <option value="Thái Nguyên">Thái Nguyên</option>
                  <option value="Thanh Hóa">Thanh Hóa</option>
                  <option value="Thừa Thiên Huế">Thừa Thiên Huế</option>
                  <option value="Tiền Giang">Tiền Giang</option>
                  <option value="Trà Vinh">Trà Vinh</option>
                  <option value="Tuyên Quang">Tuyên Quang</option>
                  <option value="Vĩnh Long">Vĩnh Long</option>
                  <option value="Vĩnh Phúc">Vĩnh Phúc</option>
                  <option value="Yên Bái">Yên Bái</option>
                </select>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">2</span>
                Phương thức thanh toán
              </h2>

              <div className="space-y-4">
                <label className={`block border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'COD' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="COD"
                      className="h-5 w-5 text-primary-600"
                      checked={paymentMethod === 'COD'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="ml-4 flex-1">
                      <span className="block text-gray-900 font-medium">Thanh toán khi nhận hàng (COD)</span>
                      <span className="block text-sm text-gray-500 mt-1">Trả tiền mặt khi giao hàng thành công.</span>
                    </div>
                    <img src="https://cdn-icons-png.flaticon.com/512/1554/1554401.png" alt="COD" className="h-8 ml-4 object-contain opacity-60" />
                  </div>
                </label>

                <label className={`block border rounded-lg p-4 cursor-pointer transition-all ${paymentMethod === 'Online' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Online"
                      className="h-5 w-5 text-primary-600"
                      checked={paymentMethod === 'Online'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div className="ml-4 flex-1">
                      <span className="block text-gray-900 font-medium">Thanh toán Online</span>
                      <span className="block text-sm text-gray-500 mt-1">Chuyển khoản qua ví điện tử/ngân hàng.</span>
                    </div>
                    <div className="flex items-center ml-4 space-x-2">
                      <img src="data:image/png;base64,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" alt="Momo" className="h-4 object-contain opacity-60" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="MasterCard" className="h-5 object-contain opacity-60" />
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Mã giảm giá */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-primary-100 text-primary-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">3</span>
                Mã giảm giá
              </h2>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="font-bold text-green-800">{appliedCoupon.code}</p>
                      <p className="text-sm text-green-600">
                        Giảm {appliedCoupon.discountType === 'percent' ? `${appliedCoupon.discountValue}%` : `${appliedCoupon.discountValue.toLocaleString('vi-VN')}đ`}
                        {' '}(−{appliedCoupon.discount.toLocaleString('vi-VN')}đ)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="input-field flex-1 uppercase"
                    placeholder="Nhập mã giảm giá..."
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className={`btn btn-secondary whitespace-nowrap ${couponLoading ? 'opacity-50' : ''}`}
                  >
                    {couponLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                  </button>
                </div>
              )}
            </div>

            {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-100">{error}</div>}

          </form>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b">Đơn hàng của bạn</h2>

            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {displayItems.map((item) => (
                <div key={item.variantId ? `${item.product._id}-${item.variantId}` : item.product._id} className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-50 rounded p-1 flex-shrink-0 border border-gray-100">
                    <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight mb-1">{item.product.name}</h4>
                    {item.variantId && item.product.variants && (() => {
                      const variant = item.product.variants.find(v => v._id === item.variantId);
                      if (!variant) return null;
                      return (
                        <div className="flex text-xs text-gray-500 mb-1 gap-2">
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded">Màu: {variant.color}</span>
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded">DL: {variant.storage}</span>
                        </div>
                      );
                    })()}
                    <p className="text-xs text-gray-500">Sl: {item.quantity}</p>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 text-right">
                    {(() => {
                      let p = item.product.price;
                      if (item.variantId && item.product.variants) {
                        const variant = item.product.variants.find(v => v._id === item.variantId);
                        if (variant && variant.price) p = variant.price;
                      }
                      return (p * item.quantity).toLocaleString('vi-VN');
                    })()} đ
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-3">
                <p>Tạm tính</p>
                <p className="font-medium text-gray-800">{displayTotal.toLocaleString('vi-VN')} đ</p>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mb-3">
                <p>Phí giao hàng</p>
                <p className={`font-medium ${shippingFee === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                  {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')} đ`}
                </p>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-sm text-gray-600 mb-3">
                  <p>Giảm giá</p>
                  <p className="font-medium text-green-600">−{discount.toLocaleString('vi-VN')} đ</p>
                </div>
              )}
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-primary-100">
                  <p className="text-base font-bold text-gray-900">Tổng cộng</p>
                  <p className="text-2xl font-bold text-primary-600">{(totalPrice > 0 ? totalPrice : 0).toLocaleString('vi-VN')} đ</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={loading}
              className={`w-full btn btn-primary py-4 text-lg font-bold shadow-md ${loading ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-lg'}`}
            >
              {loading ? 'Đang xử lý...' : 'Đặt Hàng Ngay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
