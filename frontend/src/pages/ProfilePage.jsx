import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';

const ProfilePage = () => {
  const { user, updateProfile } = useContext(AuthContext);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const { data } = await api.get('/orders/my-orders');
        setOrders(data);
      } catch (err) {
        console.error('Lỗi lấy đơn hàng', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchMyOrders();
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsUpdating(true);
    setMessage('');
    setError('');

    try {
      await updateProfile({ name, phone, address, gender, birthDate, password });
      setMessage('Cập nhật thông tin thành công!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi cập nhật');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Chờ xác nhận': return 'bg-yellow-100 text-yellow-800';
      case 'Đã xác nhận': return 'bg-blue-100 text-blue-800';
      case 'Đang giao': return 'bg-indigo-100 text-indigo-800';
      case 'Đã giao': return 'bg-green-100 text-green-800';
      case 'Đã hủy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 fade-in">
      {/* Profile Form */}
      <div className="w-full lg:w-1/3">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          {/* Avatar section */}
          <div className="text-center mb-6 pb-4 border-b">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-3 overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-800">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {user?.googleId && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                <svg className="h-3 w-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Tài khoản Google
              </span>
            )}
          </div>

          {message && <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm">{message}</div>}
          {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

          <form onSubmit={submitHandler}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Họ tên</label>
              <input
                className="input-field bg-gray-50 focus:bg-white"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
              <input
                className="input-field bg-gray-100 text-gray-500 cursor-not-allowed"
                type="email"
                value={user?.email || ''}
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Số điện thoại</label>
              <input
                className="input-field bg-gray-50 focus:bg-white"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Giới tính</label>
                <select
                  className="input-field bg-gray-50 focus:bg-white"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Chọn...</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">Ngày sinh</label>
                <input
                  className="input-field bg-gray-50 focus:bg-white"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Địa chỉ</label>
              <input
                className="input-field bg-gray-50 focus:bg-white"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="mb-4 pt-4 border-t border-gray-100">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Mật khẩu mới (Bỏ trống nếu không đổi)</label>
              <input
                className="input-field bg-gray-50 focus:bg-white"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2">Xác nhận mật khẩu mới</label>
              <input
                className="input-field bg-gray-50 focus:bg-white"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              className={`w-full btn btn-primary py-3 ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
              type="submit"
              disabled={isUpdating}
            >
              {isUpdating ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
            </button>
          </form>
        </div>
      </div>

      {/* Order History */}
      <div className="w-full lg:w-2/3">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">Lịch sử đơn hàng</h2>

          {loadingOrders ? (
            <LoadingSpinner />
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              Bạn chưa có đơn hàng nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm uppercase">
                    <th className="p-3 font-semibold rounded-tl-lg">Mã đơn</th>
                    <th className="p-3 font-semibold">Ngày đặt</th>
                    <th className="p-3 font-semibold">Tổng tiền</th>
                    <th className="p-3 font-semibold">Thanh toán</th>
                    <th className="p-3 font-semibold">Trạng thái</th>
                    <th className="p-3 font-semibold rounded-tr-lg">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-sm font-medium text-gray-900 border-b border-gray-100">
                        ...{order._id.substring(order._id.length - 6)}
                      </td>
                      <td className="p-3 text-sm text-gray-500 border-b border-gray-100">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-3 text-sm font-semibold text-primary-600 border-b border-gray-100">
                        {order.totalPrice.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="p-3 text-sm border-b border-gray-100">
                        {(order.isRefunded || (order.status === 'Đã hủy' && order.isPaid && order.paymentMethod === 'Online')) ? (
                          <span className="text-blue-600 font-medium">Đã hoàn tiền</span>
                        ) : order.isPaid ? (
                          <span className="text-green-600 font-medium">Đã thanh toán</span>
                        ) : (
                          <span className="text-red-500">Chưa thanh toán</span>
                        )}
                      </td>
                      <td className="p-3 text-sm border-b border-gray-100">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm border-b border-gray-100">
                        <Link to={`/order/${order._id}`} className="text-primary-600 hover:text-primary-800 font-semibold underline">
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
