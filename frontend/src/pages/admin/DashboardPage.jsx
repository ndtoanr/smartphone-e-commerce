import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  ComposedChart, Area, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const PERIOD_OPTIONS = [
  { key: 'day', label: 'Theo ngày' },
  { key: 'week', label: 'Theo tuần' },
  { key: 'month', label: 'Theo tháng' },
  { key: 'year', label: 'Theo năm' },
];

const STATUS_COLORS = {
  'Chờ xác nhận': '#FBBF24',
  'Đã xác nhận': '#60A5FA',
  'Đang giao': '#818CF8',
  'Đã giao': '#34D399',
  'Đã hủy': '#F87171',
};

const STATUS_BADGE_CLASSES = {
  'Chờ xác nhận': 'bg-yellow-100 text-yellow-800',
  'Đã xác nhận': 'bg-blue-100 text-blue-800',
  'Đang giao': 'bg-indigo-100 text-indigo-800',
  'Đã giao': 'bg-green-100 text-green-800',
  'Đã hủy': 'bg-red-100 text-red-800',
};

// Format tiền VND ngắn gọn
const formatVND = (val) => {
  if (val >= 1_000_000_000) return (val / 1_000_000_000).toFixed(1) + ' tỷ';
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(0) + ' tr';
  if (val >= 1_000) return (val / 1_000).toFixed(0) + 'k';
  return val;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }}>
            {entry.name}: {entry.name === 'Đơn hàng'
              ? entry.value + ' đơn'
              : entry.value.toLocaleString('vi-VN') + ' đ'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalOrders, setModalOrders] = useState([]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Lỗi tải thống kê:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  // Handle bar/dot click — only works in "day" mode
  const handleBarClick = async (barData) => {
    if (period !== 'day') return;

    const payload = barData?.payload || barData;
    if (!payload || !payload._raw) return;

    const { day, month, year } = payload._raw;
    setModalDate(`${day}/${month}/${year}`);
    setShowModal(true);
    setModalLoading(true);
    setModalOrders([]);

    try {
      const { data: orders } = await api.get('/admin/dashboard/orders-by-date', {
        params: { day, month, year }
      });
      setModalOrders(orders);
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Chuyển đổi dữ liệu theo period
  const getChartData = () => {
    if (period === 'day') {
      return (stats.dailyRevenue || []).map(d => ({
        label: `${d._id.day}/${d._id.month}`,
        revenue: d.revenue,
        count: d.count,
        _raw: d._id, // Keep raw date parts for click handler
      }));
    }
    if (period === 'week') {
      return (stats.weeklyRevenue || []).map(d => ({
        label: `Tuần ${d._id.week}/${d._id.year}`,
        revenue: d.revenue,
        count: d.count,
      }));
    }
    if (period === 'year') {
      return (stats.yearlyRevenue || []).map(d => ({
        label: `${d._id.year}`,
        revenue: d.revenue,
        count: d.count,
      }));
    }
    // month
    const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
    return (stats.monthlyRevenue || []).map(d => ({
      label: `${monthNames[d._id.month - 1]}/${d._id.year}`,
      revenue: d.revenue,
      count: d.count,
    }));
  };

  const chartData = getChartData();

  // Pie chart data
  const pieData = (stats.ordersByStatus || []).map(s => ({
    name: s._id,
    value: s.count,
    color: STATUS_COLORS[s._id] || '#9CA3AF',
  }));

  const summaryCards = [
    { label: 'Tổng doanh thu', value: stats.totalRevenue.toLocaleString('vi-VN') + ' đ', color: 'border-l-blue-500' },
    { label: 'Tổng đơn hàng', value: stats.totalOrders, color: 'border-l-purple-500' },
    { label: 'Khách hàng', value: stats.totalUsers, color: 'border-l-green-500' },
    { label: 'Sản phẩm', value: stats.totalProducts, color: 'border-l-yellow-500' },
  ];

  // Separate orders by status in modal
  const completedOrders = modalOrders.filter(o => o.status !== 'Đã hủy');
  const cancelledOrders = modalOrders.filter(o => o.status === 'Đã hủy');

  return (
    <div className="fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {summaryCards.map((card) => (
          <div key={card.label} className={`bg-white p-6 rounded-xl shadow-sm border border-l-4 ${card.color}`}>
            <h3 className="text-gray-500 font-medium text-sm mb-2">{card.label}</h3>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Chart section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Doanh thu & Đơn hàng</h2>
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setPeriod(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === opt.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {period === 'day' && (
          <p className="text-xs text-blue-500 mb-3 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
            Nhấn vào cột/ngày trên biểu đồ để xem chi tiết đơn hàng
          </p>
        )}

        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
            Chưa có dữ liệu trong khoảng thời gian này
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                onClick={period === 'day' ? (data) => {
                  const item = chartData.find(d => d.label === data.value);
                  if (item) handleBarClick({ payload: item });
                } : undefined}
                style={period === 'day' ? { cursor: 'pointer' } : {}}
              />
              <YAxis
                yAxisId="revenue"
                orientation="left"
                tickFormatter={formatVND}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <YAxis
                yAxisId="count"
                orientation="right"
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                name="Doanh thu"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                dot={{ r: 4 }}
                activeDot={period === 'day' ? {
                  r: 6,
                  cursor: 'pointer',
                  onClick: (e, payload) => handleBarClick(payload),
                } : { r: 4 }}
              />
              <Bar
                yAxisId="count"
                dataKey="count"
                name="Đơn hàng"
                fill="#A78BFA"
                radius={[4, 4, 0, 0]}
                opacity={0.7}
                cursor={period === 'day' ? 'pointer' : 'default'}
                onClick={period === 'day' ? (data) => handleBarClick(data) : undefined}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom section: Pie + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie chart trạng thái */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Phân bổ trạng thái đơn hàng</h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">Chưa có đơn hàng</div>
          ) : (
            <div className="flex flex-col md:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} đơn`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 min-w-[160px]">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-600">{entry.name}</span>
                    <span className="ml-auto font-semibold text-gray-800">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Đơn hàng mới nhất</h2>
            <Link to="/admin/orders" className="text-sm text-primary-600 hover:underline">Xem tất cả</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3 rounded-tl-lg">Mã đơn</th>
                  <th className="p-3">Khách hàng</th>
                  <th className="p-3">Tổng tiền</th>
                  <th className="p-3 rounded-tr-lg">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentOrders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-900">...{order._id.substring(order._id.length - 6)}</td>
                    <td className="p-3 text-gray-600">{order.user.name}</td>
                    <td className="p-3 font-semibold text-primary-600">{order.totalPrice.toLocaleString('vi-VN')} đ</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        order.status === 'Đã giao' ? 'bg-green-100 text-green-800' :
                        order.status === 'Đã hủy' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== MODAL: Chi tiết đơn hàng theo ngày ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  📦 Chi tiết đơn hàng ngày {modalDate}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {!modalLoading && `Tổng: ${modalOrders.length} đơn hàng`}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {modalLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                  <span className="ml-3 text-gray-500">Đang tải...</span>
                </div>
              ) : modalOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-lg font-medium">Không có đơn hàng nào trong ngày này</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* ---- Đơn hàng thành công ---- */}
                  {completedOrders.length > 0 && (
                    <div>
                      <h4 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        Đơn hàng ({completedOrders.length})
                      </h4>
                      <div className="space-y-3">
                        {completedOrders.map(order => (
                          <OrderCard key={order._id} order={order} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ---- Đơn đã hủy ---- */}
                  {cancelledOrders.length > 0 && (
                    <div>
                      <h4 className="text-base font-bold text-red-600 mb-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        Đơn đã hủy ({cancelledOrders.length})
                      </h4>
                      <div className="space-y-3">
                        {cancelledOrders.map(order => (
                          <OrderCard key={order._id} order={order} isCancelled />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {!modalLoading && modalOrders.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-sm">
                <div className="flex gap-4">
                  <span className="text-gray-600">
                    Tổng doanh thu (đã giao):{' '}
                    <span className="font-bold text-green-600">
                      {modalOrders
                        .filter(o => o.status === 'Đã giao')
                        .reduce((sum, o) => sum + o.totalPrice, 0)
                        .toLocaleString('vi-VN')} đ
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSS cho animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

// ---- Sub-component: Thẻ hiển thị 1 đơn hàng ----
const OrderCard = ({ order, isCancelled = false }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden transition-shadow hover:shadow-md ${
      isCancelled ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-white'
    }`}>
      {/* Order header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
            STATUS_BADGE_CLASSES[order.status] || 'bg-gray-100 text-gray-800'
          }`}>
            {order.status}
          </span>
          <span className="text-sm text-gray-500">
            #{order._id.slice(-6).toUpperCase()}
          </span>
          <span className="text-sm text-gray-400">•</span>
          <span className="text-sm text-gray-600">
            {order.user?.name || 'Khách'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gray-800">
            {order.totalPrice.toLocaleString('vi-VN')} đ
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
          {/* Lý do hủy */}
          {isCancelled && order.cancelReason && (
            <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <strong>Lý do hủy:</strong> {order.cancelReason}
            </div>
          )}

          {/* Product list */}
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-100">
                {/* Product image */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {item.color && <span>Màu: {item.color}</span>}
                    {item.storage && <span>• {item.storage}</span>}
                    <span>• SL: {item.quantity}</span>
                  </div>
                </div>

                {/* Price */}
                <div className="text-sm font-semibold text-gray-700 flex-shrink-0">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
            <span>
              {new Date(order.createdAt).toLocaleString('vi-VN')}
              {' • '}
              {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'Thanh toán online'}
            </span>
            <span>{order.items.length} sản phẩm</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
