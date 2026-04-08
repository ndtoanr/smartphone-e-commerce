import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteHandler = async (id, role) => {
    if (role === 'admin') {
       toast.error('Không thể xóa tài khoản Quản trị viên!');
       return;
    }
    if (window.confirm('Bạn có chắc muốn xóa người dùng này? Các đơn hàng của họ vẫn được lưu trữ.')) {
      try {
        await api.delete(`/admin/users/${id}`);
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Lỗi xóa tài khoản');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Người dùng</h1>
        <Link to="/admin" className="text-gray-500 hover:underline">Về Dashboard</Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Họ Tên</th>
                <th className="p-4">Email</th>
                <th className="p-4">Quyền hạn</th>
                <th className="p-4">Ngày đăng ký</th>
                <th className="p-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500">...{user._id.substring(user._id.length - 6)}</td>
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-gray-600"><a href={`mailto:${user.email}`} className="text-primary-600">{user.email}</a></td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-md ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 font-bold' : 'bg-gray-100 text-gray-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4">
                     <button 
                        onClick={() => deleteHandler(user._id, user.role)}
                        disabled={user.role === 'admin'}
                        className={`text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors ${user.role === 'admin' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        Xóa
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
