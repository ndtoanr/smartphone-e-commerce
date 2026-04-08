import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  const cancelReasons = [
    "Không còn nhu cầu mua",
    "Tìm được sản phẩm khác ưng ý hơn",
    "Đổi ý",
    "Phí vận chuyển cao",
    "Lý do khác"
  ];

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`);
        setOrder(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể lấy thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const handlePayment = async () => {
    setIsPaying(true);
    try {
      const { data } = await api.put(`/orders/${id}/pay`);
      setOrder(data); // Cập nhật lại đơn hàng mới
      toast.success('Thanh toán thành công! (Giả lập)');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thanh toán');
    } finally {
      setIsPaying(false);
    }
  };

  const handleCancelOrderClick = () => {
    setShowCancelModal(true);
    setSelectedReason('');
    setOtherReason('');
  };

  const handleConfirmCancel = async () => {
    if (!selectedReason) {
      toast.error('Vui lòng chọn lý do hủy đơn hàng.');
      return;
    }

    let finalReason = selectedReason;
    if (selectedReason === 'Lý do khác') {
      if (!otherReason.trim()) {
        toast.error('Vui lòng nhập lý do khác.');
        return;
      }
      finalReason = otherReason.trim();
    }

    setIsCanceling(true);
    try {
      const { data } = await api.put(`/orders/${id}/cancel`, { cancelReason: finalReason });
      setOrder(data);
      setShowCancelModal(false);
      toast.success('Đã hủy đơn hàng thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi hủy đơn hàng');
    } finally {
      setIsCanceling(false);
    }
  };

  if (loading) return <div className="py-20"><LoadingSpinner /></div>;
  if (error) return <div className="py-20 text-center text-red-500 font-medium">{error}</div>;
  if (!order) return <div className="py-20 text-center">Không tìm thấy đơn hàng</div>;

  return (
    <div className="fade-in max-w-4xl mx-auto relative">
      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Lý do bạn hủy</h2>
            <div className="space-y-3 mb-6">
              {cancelReasons.map((reason, index) => (
                <label key={index} className="flex items-start space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1 flex-shrink-0"
                  />
                  <span className="text-gray-700">{reason}</span>
                </label>
              ))}
              {selectedReason === 'Lý do khác' && (
                <div className="mt-2 pl-7">
                  <textarea
                    className="input-field w-full text-sm"
                    rows="3"
                    placeholder="Nhập lý do của bạn..."
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                  ></textarea>
                </div>
              )}
            </div>
            <div className="flex space-x-3 justify-end mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50 focus:outline-none transition-colors"
                disabled={isCanceling}
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isCanceling}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none transition-colors disabled:bg-red-400"
              >
                {isCanceling ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng #{order._id.substring(order._id.length - 6)}</h1>
        <Link to="/profile" className="text-primary-600 hover:underline text-sm font-medium">&larr; Quay lại danh sách</Link>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex justify-between items-start border-b pb-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
            <p className="text-sm font-semibold text-gray-800">
              Trạng thái: <span className="text-primary-600">{order.status}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Thanh toán:</p>
            {(order.isRefunded || (order.status === 'Đã hủy' && order.isPaid && order.paymentMethod === 'Online')) ? (
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                Đã hoàn tiền
              </span>
            ) : order.isPaid ? (
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                Đã thanh toán ({new Date(order.paidAt).toLocaleDateString('vi-VN')})
              </span>
            ) : (
              <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                Chưa thanh toán
              </span>
            )}

            {order.status === 'Chờ xác nhận' && (
              <div className="mt-3">
                <button
                  onClick={handleCancelOrderClick}
                  disabled={isCanceling}
                  className="px-4 py-1.5 text-xs border border-red-500 text-red-500 rounded-md hover:bg-red-50 font-medium transition-colors"
                >
                  {isCanceling ? 'Đang xử lý...' : 'Hủy đơn hàng'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">Thông tin giao hàng</h3>
            <p className="text-sm text-gray-700 mb-1"><span className="font-semibold">Người nhận:</span> {order.shippingAddress?.fullName || order.user?.name}</p>
            <p className="text-sm text-gray-700 mb-1"><span className="font-semibold">Điện thoại:</span> {order.shippingAddress?.phone}</p>
            <p className="text-sm text-gray-700 mb-1"><span className="font-semibold">Địa chỉ:</span> {order.shippingAddress?.address}, {order.shippingAddress?.city}</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">Phương thức thanh toán</h3>
            <p className="text-sm text-gray-700 mb-3">Thanh toán bằng: {order.paymentMethod}</p>

            {!order.isPaid && order.status !== 'Đã hủy' && (
              <button
                onClick={handlePayment}
                disabled={isPaying}
                className={`w-full py-2 px-4 rounded font-bold text-white transition-colors ${isPaying ? 'bg-primary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
              >
                {isPaying ? 'Đang xử lý...' : 'Thanh toán ngay bằng Thẻ/Ví Online'}
              </button>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">Sản phẩm trong đơn ({order.items?.length})</h3>
          <div className="space-y-4">
            {order.items?.map((item, index) => (
              <div key={index} className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                <img src={item.image} alt={item.name} className="w-16 h-16 object-contain bg-white p-1 border rounded" />
                <div className="flex-1">
                  <Link to={`/products/${item.product}`} className="font-medium text-gray-800 hover:text-primary-600 line-clamp-1">{item.name}</Link>
                  {(item.color || item.storage) && (
                    <div className="flex text-xs text-gray-500 my-1 gap-2">
                      {item.color && <span className="bg-white border px-1.5 py-0.5 rounded">Màu: {item.color}</span>}
                      {item.storage && <span className="bg-white border px-1.5 py-0.5 rounded">DL: {item.storage}</span>}
                    </div>
                  )}
                  <p className="text-sm text-gray-500">Số lượng: {item.quantity}</p>
                </div>
                <div className="font-bold text-gray-900">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t pt-4 flex justify-between items-center text-lg">
          <span className="font-bold text-gray-800">Tổng cộng:</span>
          <span className="font-bold text-primary-600 text-2xl">{order.totalPrice?.toLocaleString('vi-VN')} đ</span>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
