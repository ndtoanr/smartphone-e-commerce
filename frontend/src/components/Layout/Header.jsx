import { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';
import api from '../../api/axios';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Notification State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/products?search=${keyword}`);
    } else {
      navigate('/products');
    }
    setKeyword('');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="dth-header">
        <div className="dth-container flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="dth-header-logo">
            <span style={{ fontSize: '1.4rem', fontWeight: 900, fontStyle: 'italic', letterSpacing: '-1px' }}>
              Smartshop
            </span>
          </Link>


          {/* Search Bar */}
          <form onSubmit={submitHandler} className="dth-header-search hidden md:block">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm trên Smartshop..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="submit">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Actions */}
          <div className="dth-header-actions hidden lg:flex items-center">
            
            {/* THÔNG BÁO BLOCK */}
            {user ? (
              <div className="relative dth-header-action cursor-pointer" ref={notifRef}>
                <div className="icon-wrap relative" onClick={() => setShowNotifications(!showNotifications)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-700 text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-red-600">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-col" onClick={() => setShowNotifications(!showNotifications)}>
                  <span>Thông báo</span>
                  <span className="font-bold">Mới nhất</span>
                </div>

                {/* DROPDOWN THÔNG BÁO */}
                {showNotifications && (
                  <div className="absolute top-10 right-0 w-80 bg-white rounded-md shadow-2xl py-2 border border-gray-100 z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <span className="font-bold text-gray-800">Thông báo</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500 text-sm">Chưa có thông báo nào</div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif._id} 
                          className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-red-50' : ''}`}
                          onClick={() => {
                            if(!notif.isRead) markAsRead(notif._id);
                            setShowNotifications(false);
                            if(notif.type === 'ORDER') navigate('/profile');
                          }}
                        >
                          <div className="flex items-start">
                            <div className={`mt-1 h-2 w-2 rounded-full mr-2 flex-shrink-0 ${!notif.isRead ? 'bg-red-600' : 'bg-transparent'}`}></div>
                            <div>
                              <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{notif.title}</h4>
                              <p className="text-xs text-gray-500 mt-1 leading-snug">{notif.message}</p>
                              <span className="text-[10px] text-gray-400 mt-2 block">{new Date(notif.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="dth-header-action opacity-50 cursor-not-allowed" title="Vui lòng đăng nhập để xem thông báo">
                <div className="icon-wrap">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span>Thông báo</span>
                  <span className="font-bold">Mới nhất</span>
                </div>
              </div>
            )}

            <Link to="/profile" className="dth-header-action hover:text-white">
              <div className="icon-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span>Tra cứu</span>
                <span className="font-bold">Đơn hàng</span>
              </div>
            </Link>

            <Link to="/cart" className="dth-header-action relative hover:text-white">
              <div className="icon-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <br/>
                <span className="font-bold">Giỏ hàng</span>
              </div>
              {cartCount > 0 && (
                <span className="absolute top-0 right-10 bg-yellow-400 text-red-700 text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-red-600">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* USER ACCOUNT BLOCK (MOVED TO RIGHT) */}
            {user ? (
               <div className="relative group dth-header-action cursor-pointer ml-2 border-l border-red-500 pl-4">
                 <div className="icon-wrap">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                   </svg>
                 </div>
                 <div className="flex flex-col">
                   <span>Chào,</span>
                   <span className="font-bold truncate max-w-[80px]">{user.name.split(' ')[0]}</span>
                 </div>
                 
                 <div className="absolute top-full right-0 w-48 pt-3 hidden group-hover:block z-50">
                    <div className="bg-white rounded-md shadow-lg py-1 border border-gray-100">
                      {user.role === 'admin' && (
                        <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600">Dashboard Admin</Link>
                      )}
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600">Hồ sơ cá nhân</Link>
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600">Đăng xuất</button>
                    </div>
                  </div>
               </div>
            ) : (
              <Link to="/login" className="dth-header-action ml-2 border-l border-red-500 pl-4 hover:text-white">
                <div className="icon-wrap">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span>Tài khoản</span>
                  <span className="font-bold">Đăng nhập</span>
                </div>
              </Link>
            )}
            
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile search bar when menu is not open but screen is small */}
      <div className="md:hidden bg-[#ee0000] p-2 border-t border-red-700">
         <form onSubmit={submitHandler} className="dth-header-search max-w-full mx-0">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="submit">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 p-4 absolute w-full z-50 shadow-xl">
          <div className="space-y-3">
            <Link to="/products" className="block py-2 text-gray-700 font-medium border-b border-gray-100">Tất cả sản phẩm</Link>
            <Link to="/cart" className="block py-2 text-gray-700 font-medium border-b border-gray-100">
               Giỏ hàng <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{cartCount}</span>
            </Link>
            {user ? (
              <>
                <div className="block py-2 text-[#ee0000] font-bold">Xin chào, {user.name}</div>
                {user.role === 'admin' && (
                  <Link to="/admin" className="block py-2 text-gray-700 ml-4 hover:text-[#ee0000]">Dashboard Admin</Link>
                )}
                <Link to="/profile" className="block py-2 text-gray-700 ml-4">Hồ sơ & Đơn hàng</Link>
                <button onClick={handleLogout} className="block w-full text-left py-2 text-red-600 font-bold ml-4">Đăng xuất</button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1 bg-gray-100 text-center py-2 rounded-md font-bold text-gray-700">Đăng nhập</Link>
                <Link to="/register" className="flex-1 bg-[#ee0000] text-center py-2 rounded-md font-bold text-white">Đăng ký</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
