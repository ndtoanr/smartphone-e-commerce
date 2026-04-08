import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const PaymentPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 phút
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const createPayment = async () => {
      try {
        const { data } = await api.post('/payment/create-payment', { orderId });
        setPaymentInfo(data);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Lỗi tạo phiên thanh toán');
        navigate('/profile');
      } finally {
        setLoading(false);
      }
    };
    createPayment();
  }, [orderId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0 || paymentSuccess) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error('Đã hết thời gian thanh toán!');
          navigate('/profile');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentSuccess, navigate]);

  const handleConfirmPayment = async () => {
    setConfirming(true);
    try {
      await api.post('/payment/verify', { orderId });
      setPaymentSuccess(true);
      toast.success('Ghi nhận thanh toán thành công! 🎉');

      // Redirect sau 3 giây  
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xác nhận thanh toán');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelPayment = async () => {
    setCancelling(true);
    try {
      await api.put(`/orders/${orderId}/cancel`, { cancelReason: 'Khách hàng hủy thanh toán' });
      toast.success('Đã hủy đơn hàng!');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <LoadingSpinner />;

  if (paymentSuccess) {
    return (
      <div className="fade-in max-w-lg mx-auto text-center py-16">
        <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Đã gửi yêu cầu thanh toán!</h2>
          <p className="text-gray-500 mb-2">Đơn hàng #{orderId?.slice(-6).toUpperCase()} đang chờ hệ thống xác nhận.</p>
          <p className="text-sm text-gray-400">Đang chuyển hướng về trang cá nhân...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Thanh toán qua VietQR</h1>

      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        {/* Timer */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 mb-1">Thời gian còn lại</p>
          <div className={`text-4xl font-bold font-mono ${countdown <= 60 ? 'text-red-500' : 'text-blue-600'}`}>
            {formatTime(countdown)}
          </div>
        </div>

        {/* VietQR Payment Details */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            {/* Bank Icon */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            Thông tin chuyển khoản Ngân hàng
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-blue-100">
              <span className="text-sm text-gray-600">Ngân hàng hưởng</span>
              <span className="font-semibold text-blue-600">{paymentInfo?.bankName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-blue-100">
              <span className="text-sm text-gray-600">Chủ tài khoản</span>
              <span className="font-semibold text-gray-800">{paymentInfo?.accountName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-blue-100">
              <span className="text-sm text-gray-600">Số tài khoản</span>
              <span className="font-semibold text-blue-600 font-mono tracking-wider">{paymentInfo?.accountNo}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-blue-100">
              <span className="text-sm text-gray-600">Nội dung CK</span>
              <span className="font-semibold text-gray-800 text-xs">{paymentInfo?.description}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Số tiền</span>
              <span className="text-2xl font-bold text-blue-600">{paymentInfo?.amount?.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>

        {/* QR Code - Unique per order */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 mb-3">Mở ứng dụng Ngân hàng để quét mã QR</p>
          <div className="inline-block p-4 bg-white border-2 border-blue-200 rounded-xl shadow-inner">
            {paymentInfo && (
              <img 
                src={`https://img.vietqr.io/image/${paymentInfo.bankId}-${paymentInfo.accountNo}-compact2.png?amount=${paymentInfo.amount}&addInfo=${encodeURIComponent(paymentInfo.description)}&accountName=${encodeURIComponent(paymentInfo.accountName)}`}
                alt="VietQR"
                className="w-56 h-56 object-contain border border-gray-100 rounded-lg shadow-sm"
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {/* Cancel Button */}
          <button
            onClick={handleCancelPayment}
            disabled={cancelling || confirming}
            className={`flex-1 py-4 rounded-xl text-base font-bold transition-all border-2 ${
              cancelling
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-red-500 border-red-200 hover:bg-red-50 hover:border-red-400'
            }`}
          >
            {cancelling ? 'Đang hủy...' : '✕ Hủy đơn hàng'}
          </button>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmPayment}
            disabled={confirming}
            className={`flex-1 py-4 rounded-xl text-base font-bold text-white transition-all shadow-md ${
              confirming
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg cursor-pointer'
            }`}
          >
            {confirming ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Đang xử lý...
              </span>
            ) : (
              '✅ Tôi đã chuyển khoản'
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Sau khi chuyển khoản thành công, vui lòng nhấn nút xác nhận để hệ thống ghi nhận giao dịch.
        </p>
      </div>
    </div>
  );
};

export default PaymentPage;
