import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const STATUS_ORDER = ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Đã giao', 'Đã hủy'];

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      fetchOrders();
      toast.success('Cập nhật trạng thái thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Đơn hàng</h1>
        <Link to="/admin" className="text-gray-500 hover:underline">Về Dashboard</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4">Mã đơn</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Ngày đặt</th>
                <th className="p-4">Tổng cộng</th>
                <th className="p-4">Đã thanh toán</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Cập nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => setSelectedOrder(order)}>
                    <i className="fa-solid fa-eye mr-2"></i>
                    ...{order._id.substring(order._id.length - 6)}
                  </td>
                  <td className="p-4 font-medium">{order.user.name}</td>
                  <td className="p-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4 font-semibold text-primary-600">{order.totalPrice.toLocaleString('vi-VN')} đ</td>
                  <td className="p-4">
                    {(order.isRefunded || (order.status === 'Đã hủy' && order.isPaid && order.paymentMethod === 'Online'))
                      ? '🔄 Đã hoàn tiền'
                      : order.isPaid ? '✅ Đã trả' : '❌ Chưa'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${order.status === 'Đã giao' ? 'bg-green-100 text-green-800' :
                      order.status === 'Đã hủy' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {order.status}
                    </span>
                    {order.status === 'Đã hủy' && order.cancelReason && (
                      <div className="text-xs text-red-600 mt-1 max-w-[150px] truncate" title={order.cancelReason}>
                        Lý do: {order.cancelReason}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {order.status === 'Đã giao' || order.status === 'Đã hủy' ? (
                      <span className="text-xs text-gray-400 italic">Không thể cập nhật</span>
                    ) : (
                      <select
                        className="input-field py-1 text-xs"
                        value={order.status}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                      >
                        {STATUS_ORDER.map((s) => {
                          const currentIdx = STATUS_ORDER.indexOf(order.status);
                          const optIdx = STATUS_ORDER.indexOf(s);
                          const isNextStep = optIdx === currentIdx + 1;
                          const isCurrent = optIdx === currentIdx;
                          // Chỉ cho hủy khi đang ở "Chờ xác nhận" (bước 0)
                          const isCancelOption = s === 'Đã hủy' && currentIdx === 0;
                          if (isCurrent || isNextStep || isCancelOption) {
                            return <option key={s} value={s}>{s}</option>;
                          }
                          return null;
                        })}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal chi tiết đơn hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Chi tiết đơn hàng <span className="text-sm font-normal text-gray-500 ml-2">#{selectedOrder._id}</span></h2>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-times text-lg"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wider">Thông tin nhận hàng</h3>
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border h-full">
                    <p className="mb-1"><span className="font-medium text-gray-700 inline-block w-20">Khách hàng:</span> {selectedOrder.shippingAddress?.fullName}</p>
                    <p className="mb-1"><span className="font-medium text-gray-700 inline-block w-20">Điện thoại:</span> <a href={`tel:${selectedOrder.shippingAddress?.phone}`} className="text-blue-600 hover:underline">{selectedOrder.shippingAddress?.phone}</a></p>
                    <p className="mb-1"><span className="font-medium text-gray-700 inline-block w-20">Địa chỉ:</span> {selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wider">Thanh toán & Trạng thái</h3>
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border h-full">
                    <p className="mb-1"><span className="font-medium text-gray-700 inline-block w-24">Phương thức:</span> <span className="font-semibold">{selectedOrder.paymentMethod}</span></p>
                    <p className="mb-1"><span className="font-medium text-gray-700 inline-block w-24">Thanh toán:</span> 
                      {selectedOrder.isPaid ? <span className="text-green-600 font-medium">✅ Đã hoàn tất</span> : <span className="text-red-500 font-medium">❌ Chưa thanh toán</span>}
                    </p>
                    <p className="mb-1"><span className="font-medium text-gray-700 inline-block w-24">Thời gian đặt:</span> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-800 mb-2 text-sm uppercase tracking-wider border-b pb-2">Danh sách Sản phẩm</h3>
              <div className="space-y-3 mt-3">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-3 border rounded-lg hover:border-gray-300 transition-colors items-center bg-white">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-contain rounded bg-gray-50 border p-1" />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-800 line-clamp-2">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-1 flex gap-2">
                        {item.color && <span className="bg-gray-100 px-2 py-0.5 rounded">Màu: {item.color}</span>}
                        {item.storage && <span className="bg-gray-100 px-2 py-0.5 rounded">ROM: {item.storage}</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-primary-600">{(item.price || 0).toLocaleString('vi-VN')} <span className="underline">đ</span></p>
                      <p className="text-xs text-gray-500 font-medium mt-1">S.lượng: <span className="text-gray-800 border bg-gray-50 px-2 py-0.5 rounded">{item.quantity}</span></p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 border p-4 rounded-lg bg-gray-50 space-y-2 text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Tổng tiền hàng ({selectedOrder.items?.reduce((a,c)=>a+c.quantity, 0)} sản phẩm)</span>
                  <span className="font-medium text-gray-800">{(selectedOrder.subtotal || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium text-gray-800">{(selectedOrder.shippingFee || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Mã giảm giá áp dụng {selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : ''}</span>
                    <span className="font-medium">-{(selectedOrder.discount).toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold border-t pt-3 mt-3">
                  <span className="text-gray-800">Thành tiền</span>
                  <span className="text-primary-600 text-xl">{(selectedOrder.totalPrice || 0).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderManagementPage;
