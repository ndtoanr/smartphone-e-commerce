import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto pt-10 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-primary-600 mb-4">SmartShop</h3>
            <p className="text-gray-600 text-sm">Hệ thống bán lẻ điện thoại hàng đầu, cung cấp các sản phẩm chính hãng với giá cả cạnh tranh nhất thị trường.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Danh mục</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/products?brand=Apple" className="hover:text-primary-600">iPhone</Link></li>
              <li><Link to="/products?brand=Samsung" className="hover:text-primary-600">Samsung</Link></li>
              <li><Link to="/products?brand=Xiaomi" className="hover:text-primary-600">Xiaomi</Link></li>
              <li><Link to="/products?brand=OPPO" className="hover:text-primary-600">OPPO</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/" className="hover:text-primary-600">Chính sách bảo hành</Link></li>
              <li><Link to="/" className="hover:text-primary-600">Chính sách đổi trả</Link></li>
              <li><Link to="/" className="hover:text-primary-600">Giao hàng & Thanh toán</Link></li>
              <li><Link to="/" className="hover:text-primary-600">Hướng dẫn mua sắm</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>📍 Hà Đông, TP.Hà Nội</li>
              <li>📞 1234567890 (Tổng đài)</li>
              <li>📧 cskh@smartshop.vn</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} SmartShop E-commerce
        </div>
      </div>
    </footer>
  );
};

export default Footer;
