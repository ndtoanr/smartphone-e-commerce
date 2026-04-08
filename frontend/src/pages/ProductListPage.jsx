import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [conditions] = useState(['Máy mới', 'Máy như mới (Like New)', 'Máy cũ']);
  const [brands, setBrands] = useState([]);

  // Filters State
  const keyword = searchParams.get('search') || '';
  const currentCondition = searchParams.get('condition') || '';
  const currentBrand = searchParams.get('brand') || '';
  const sort = searchParams.get('sort') || 'newest';
  const currentPage = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const brandRes = await api.get('/products/brands');
        setBrands(brandRes.data);
      } catch (error) {
        console.error('Lỗi khi tải filters:', error);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let url = `/products?page=${currentPage}&sort=${sort}`;
        if (keyword) url += `&search=${keyword}`;
        if (currentCondition) url += `&condition=${currentCondition}`;
        if (currentBrand) url += `&brand=${currentBrand}`;

        const { data } = await api.get(url);
        setProducts(data.products);
        setPage(data.page);
        setPages(data.pages);
      } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [keyword, currentPage, currentCondition, currentBrand, sort]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Khi đổi filter, reset về page 1
    newParams.delete('page');
    setSearchParams(newParams);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 fade-in">
      {/* Sidebar Filters */}
      <div className="w-full md:w-1/4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 sticky top-24">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Bộ lọc</h2>

          {/* Conditions */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-gray-700">Tình trạng máy</h3>
            <div className="space-y-2">
              <div
                className={`cursor-pointer ${!currentCondition ? 'text-primary-600 font-medium' : 'text-gray-600 hover:text-primary-500'}`}
                onClick={() => handleFilterChange('condition', '')}
              >
                Tất cả tình trạng
              </div>
              {conditions.map((c) => (
                <div
                  key={c}
                  className={`cursor-pointer ${currentCondition === c ? 'text-primary-600 font-medium' : 'text-gray-600 hover:text-primary-500'}`}
                  onClick={() => handleFilterChange('condition', c)}
                >
                  {c}
                </div>
              ))}
            </div>
          </div>

          {/* Brands */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-gray-700">Thương hiệu</h3>
            <div className="space-y-2">
              <div
                className={`cursor-pointer ${!currentBrand ? 'text-primary-600 font-medium' : 'text-gray-600 hover:text-primary-500'}`}
                onClick={() => handleFilterChange('brand', '')}
              >
                Tất cả hãng
              </div>
              {brands.map((b) => (
                <div
                  key={b}
                  className={`cursor-pointer ${currentBrand === b ? 'text-primary-600 font-medium' : 'text-gray-600 hover:text-primary-500'}`}
                  onClick={() => handleFilterChange('brand', b)}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="w-full md:w-3/4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            {keyword ? (
              <h2 className="text-xl font-semibold">
                Kết quả tìm kiếm cho: <span className="text-primary-600">"{keyword}"</span>
              </h2>
            ) : (
              <h2 className="text-xl font-semibold text-gray-800">Tất cả sản phẩm</h2>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Hiển thị {products.length} sản phẩm (Trang {page}/{pages})
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Sắp xếp:</label>
            <select
              className="input-field py-1.5"
              value={sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
              <option value="rating">Đánh giá cao</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : products.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg text-gray-600">Không tìm thấy sản phẩm nào phù hợp.</h3>
            <button
              onClick={() => setSearchParams({})}
              className="mt-4 btn btn-secondary"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            {pages > 1 && (
              <Pagination
                page={page}
                pages={pages}
                keyword={keyword ? `&search=${keyword}` : ''}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductListPage;
