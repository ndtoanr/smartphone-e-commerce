import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('desc');

  // Variant States
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const [prodRes, revRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/reviews/product/${id}`)
        ]);
        setProduct(prodRes.data);
        setReviews(revRes.data);
      } catch (error) {
        console.error('Lỗi tải chi tiết:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);

  useEffect(() => {
    if (product?.variants?.length > 0) {
      const firstAvailable = product.variants.find(v => v.stock > 0) || product.variants[0];
      setSelectedColor(firstAvailable.color);
      setSelectedStorage(firstAvailable.storage);
    }
  }, [product]);

  const hasVariants = product?.variants?.length > 0;
  const currentVariant = hasVariants ? product.variants.find(v => v.color === selectedColor && v.storage === selectedStorage) : null;
  const displayPrice = currentVariant && currentVariant.price ? currentVariant.price : (product?.price || 0);
  const displayStock = currentVariant ? currentVariant.stock : (product?.stock || 0);

  let isRealDiscount = product?.discountType && product?.discountType !== 'none';
  let discountLabel = '';
  
  if (isRealDiscount) {
    if (product.discountType === 'amount') {
      const formattedDiscount = new Intl.NumberFormat('vi-VN').format(product.discountValue);
      discountLabel = `Giảm ${formattedDiscount} đ`;
    } else if (product.discountType === 'percent') {
      discountLabel = `Giảm ${product.discountValue}%`;
    }
  }

  const baseOriginalPrice = (currentVariant && currentVariant.originalPrice) 
                            ? currentVariant.originalPrice 
                            : product?.originalPrice;

  const oldPrice = (baseOriginalPrice && baseOriginalPrice > displayPrice) ? baseOriginalPrice : null;

  const handleAddToCart = () => {
    if (hasVariants && !currentVariant) {
      toast.error('Vui lòng chọn cấu hình và màu sắc sản phẩm');
      return;
    }
    if (displayStock < qty) {
      toast.error('Số lượng tồn kho không đủ');
      return;
    }
    addToCart(product, qty, currentVariant?._id);
  };

  const handleBuyNow = () => {
    if (hasVariants && !currentVariant) {
      toast.error('Vui lòng chọn cấu hình và màu sắc sản phẩm');
      return;
    }
    if (displayStock < qty) {
      toast.error('Số lượng tồn kho không đủ');
      return;
    }
    navigate('/checkout', { state: { buyNowItem: { product: product, quantity: qty, variantId: currentVariant?._id } } });
  };

  const submitReviewHandler = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setReviewLoading(true);
    setReviewError('');
    try {
      const { data } = await api.post('/reviews', {
        productId: id,
        rating,
        comment
      });
      setReviews([data, ...reviews]);
      setComment('');
      // Update local product rating briefly for UX
      setProduct({ ...product, numReviews: product.numReviews + 1 });
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!product) return <div className="text-center py-20">Sản phẩm không tồn tại!</div>;

  return (
    <div className="fade-in">
      <Link to="/products" className="text-gray-500 hover:text-primary-600 mb-6 inline-block font-medium">
        &larr; Quay lại danh sách
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-10">
        <div className="flex flex-col md:flex-row">
          {/* Product Image */}
          <div className="md:w-1/2 p-8 md:p-12 border-b md:border-b-0 md:border-r border-gray-100 flex justify-center items-center bg-gray-50">
            <img
              src={product.image}
              alt={product.name}
              className="max-w-full max-h-[400px] object-contain drop-shadow-lg"
            />
          </div>

          {/* Product Info */}
          <div className="md:w-1/2 p-8 lg:p-12">
            <div className="text-xs text-primary-600 font-bold tracking-wider uppercase mb-2">
              {product.brand}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{product.name}</h1>

            <div className="flex items-center mb-6">
              <StarRating rating={product.rating} />
              <span className="text-sm text-gray-500 ml-2">({product.numReviews} đánh giá)</span>
              <span className="mx-3 text-gray-300">|</span>
              <span className={`text-sm font-medium ${displayStock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {displayStock > 0 ? `Còn ${displayStock} sản phẩm` : 'Hết hàng'}
              </span>
            </div>

            <div className="flex items-baseline gap-4 mb-4">
              <div className="text-4xl font-bold text-primary-600">
                {displayPrice.toLocaleString('vi-VN')} đ
              </div>
              {oldPrice && (
                <div className="text-xl text-gray-400 line-through">
                  {oldPrice.toLocaleString('vi-VN')} đ
                </div>
              )}
            </div>

            {isRealDiscount && (
              <div className="mb-6 inline-flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-100 font-semibold shadow-sm text-sm">
                <span>🔥</span> {discountLabel}
              </div>
            )}

            <div className="mb-8 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              <span className="font-semibold block mb-1">💡 Ưu đãi đặc biệt:</span>
              Voucher hấp dẫn, 
              Bảo hành chính hãng 1 năm, 
              Tặng ốp lưng và cường lực, 
              1 đổi 1 trong 7 ngày.
            </div>

            {product.variants?.length > 0 && (
              <div className="mb-6 space-y-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                {/* Chọn Dung lượng */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="w-1.5 h-4 bg-primary-500 rounded-full mr-2"></span>
                    Chọn Dung lượng
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {[...new Set(product.variants.map(v => v.storage))].map(storage => {
                      const variantsWithStorage = product.variants.filter(v => v.storage === storage);
                      const isAvailable = variantsWithStorage.some(v => v.stock > 0);
                      const isSelected = selectedStorage === storage;
                      return (
                        <button
                          key={'storage-'+storage}
                          onClick={() => isAvailable && setSelectedStorage(storage)}
                          className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                            isSelected ? 'border-primary-600 text-primary-700 bg-primary-50 ring-2 ring-primary-600 shadow-sm' 
                            : !isAvailable ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-60' 
                            : 'border-gray-300 text-gray-700 hover:border-primary-400 hover:bg-gray-50'
                          }`}
                          disabled={!isAvailable}
                        >
                          {storage}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chọn Màu sắc */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="w-1.5 h-4 bg-blue-500 rounded-full mr-2"></span>
                    Chọn Màu sắc
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {[...new Set(product.variants.filter(v => (!selectedStorage || v.storage === selectedStorage)).map(v => v.color))].map(color => {
                      const variant = product.variants.find(v => v.color === color && (!selectedStorage || v.storage === selectedStorage));
                      const isAvailable = variant && variant.stock > 0;
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={'color-'+color}
                          onClick={() => isAvailable && setSelectedColor(color)}
                          className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                            isSelected ? 'border-blue-600 text-blue-700 bg-blue-50 ring-2 ring-blue-600 shadow-sm' 
                            : !isAvailable ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-60' 
                            : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-gray-50'
                          }`}
                          disabled={!isAvailable}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {displayStock > 0 ? (
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-sm font-medium text-gray-700">Số lượng:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-xl font-bold"
                    >
                      −
                    </button>
                    <span className="w-12 h-10 flex items-center justify-center text-center font-semibold text-gray-800 border-x border-gray-300 bg-gray-50">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(q => Math.min(displayStock, q + 1))}
                      className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-xl font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 btn btn-primary py-3 text-base font-semibold shadow-lg shadow-primary-500/30"
                  >
                    Thêm vào giỏ hàng
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 py-3 text-base font-semibold rounded-lg text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/30 transition-all"
                  >
                    Mua ngay
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 font-medium text-center shadow-sm">
                Rất tiếc, cấu hình này hiện đang tạm hết hàng.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'desc' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('desc')}
          >
            Mô tả & Cấu hình
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'reviews' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('reviews')}
          >
            Đánh giá ({reviews.length})
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'desc' && (
            <div className="grid md:grid-cols-2 gap-10">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Đặc điểm nổi bật</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Thông số kỹ thuật</h3>
                <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {Object.entries(product.specs || {}).map(([key, value], idx) => (
                        <tr key={key} className={idx % 2 === 0 ? 'bg-white' : ''}>
                          <td className="py-3 px-4 text-gray-500 font-medium capitalize border-b border-gray-100 w-1/3">{key}</td>
                          <td className="py-3 px-4 text-gray-800 border-b border-gray-100">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {/* Review Form */}
              <div className="mb-10 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Viết đánh giá của bạn</h3>
                {user ? (
                  <form onSubmit={submitReviewHandler}>
                    {reviewError && <div className="text-red-500 text-sm mb-3">{reviewError}</div>}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Đánh giá sao</label>
                      <StarRating rating={rating} onChange={setRating} />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung</label>
                      <textarea
                        className="input-field w-full h-24 resize-none"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Bạn nghĩ sao về sản phẩm này?"
                        required
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={reviewLoading}
                    >
                      {reviewLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                  </form>
                ) : (
                  <div className="text-gray-600">
                    Bạn cần <Link to={`/login?redirect=/products/${id}`} className="text-primary-600 font-medium hover:underline">đăng nhập</Link> để viết đánh giá.
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Chưa có đánh giá nào cho sản phẩm này.</p>
                ) : (
                  reviews.map(review => (
                    <div key={review._id} className="border-b border-gray-100 pb-6 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-800">{review.user.name}</div>
                        <div className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</div>
                      </div>
                      <div className="mb-3">
                        <StarRating rating={review.rating} />
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
