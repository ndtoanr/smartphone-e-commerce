import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const UserRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  // Nếu user là admin, chặn không cho vào các trang Khách hàng, chuyển hướng màn hình Admin
  if (user && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default UserRoute;
