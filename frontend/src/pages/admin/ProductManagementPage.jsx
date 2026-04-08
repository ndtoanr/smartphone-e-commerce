import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ProductManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '', brand: '', price: 0, originalPrice: 0, stock: 0, description: '', image: '',
    condition: 'Máy mới',
    specs: { screen: '', cpu: '', ram: '', storage: '', battery: '', camera: '' },
    discountType: 'none', discountValue: 0,
    variants: []
  });
  const [uploading, setUploading] = useState(false);
  const [submitObjId, setSubmitObjId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Lấy tất cả, không filter
      const { data } = await api.get('/products?limit=100');
      setProducts(data.products);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  const deleteHandler = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Lỗi xóa sản phẩm');
      }
    }
  };

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    const formDataFile = new FormData();
    formDataFile.append('image', file);
    setUploading(true);

    try {
      const { data } = await api.post('/upload', formDataFile, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, image: data.url });
    } catch (error) {
      console.error(error);
      toast.error('Lỗi upload ảnh (Kích thước tệp quá lớn hoặc định dạng bị từ chối)');
    } finally {
      setUploading(false);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      let validDiscountValue = formData.discountValue;
      if (formData.discountType === 'percent' && validDiscountValue > 100) {
        validDiscountValue = 100;
      } else if (formData.discountType === 'amount' && validDiscountValue > formData.originalPrice) {
        validDiscountValue = formData.originalPrice;
      }

      let calculatedPrice = formData.originalPrice;
      if (formData.discountType === 'amount') {
        calculatedPrice = formData.originalPrice - validDiscountValue;
      } else if (formData.discountType === 'percent') {
        calculatedPrice = Math.round(formData.originalPrice * (1 - validDiscountValue / 100));
        calculatedPrice = Math.round(calculatedPrice / 1000) * 1000;
      }
      if (calculatedPrice < 0) calculatedPrice = 0;
      
      const calculatedVariants = formData.variants.map(v => {
        let vValidDiscount = validDiscountValue;
        if (formData.discountType === 'amount' && vValidDiscount > v.originalPrice) {
           vValidDiscount = v.originalPrice;
        }

        let vPrice = v.originalPrice;
        if (formData.discountType === 'amount') {
          vPrice = v.originalPrice - vValidDiscount;
        } else if (formData.discountType === 'percent') {
          vPrice = Math.round(v.originalPrice * (1 - validDiscountValue / 100));
          vPrice = Math.round(vPrice / 1000) * 1000;
        }
        if (vPrice < 0) vPrice = 0;
        return { ...v, price: vPrice };
      });

      const payload = {
        ...formData,
        discountValue: validDiscountValue,
        price: calculatedPrice,
        variants: calculatedVariants
      };

      if (isEditing) {
        await api.put(`/products/${submitObjId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setShowModal(false);
      fetchProducts();
      toast.success(isEditing ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm mới');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi lưu sản phẩm');
    }
  };

  const openCreateDialog = () => {
    setIsEditing(false);
    setFormData({
      name: '', brand: '', price: 1000000, originalPrice: 1000000, stock: 10, description: '', image: '/uploads/default-phone.png',
      condition: 'Máy mới',
      specs: { screen: '', cpu: '', ram: '', storage: '', battery: '', camera: '' },
      discountType: 'none', discountValue: 0,
      variants: []
    });
    setShowModal(true);
  };
  const openEditDialog = (product) => {
    setIsEditing(true);
    setSubmitObjId(product._id);
    setFormData({
      name: product.name,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      stock: product.stock,
      condition: product.condition || 'Máy mới',
      description: product.description,
      image: product.image,
      specs: product.specs || { screen: '', cpu: '', ram: '', storage: '', battery: '', camera: '' },
      discountType: product.discountType || 'none',
      discountValue: product.discountValue || 0,
      variants: product.variants?.map(v => ({
         ...v,
         originalPrice: v.originalPrice || v.price
      })) || []
    });
    setShowModal(true);
  };

  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [...(formData.variants || []), { color: '', storage: '', stock: 0, originalPrice: formData.originalPrice }]
    });
  };

  const handleUpdateVariant = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    
    // Auto calculate total stock if we update variant stock
    const updatedStock = updatedVariants.reduce((sum, v) => sum + Number(v.stock), 0);
    
    setFormData({ 
      ...formData, 
      variants: updatedVariants,
      stock: field === 'stock' ? updatedStock : formData.stock
    });
  };

  const handleRemoveVariant = (index) => {
    const updatedVariants = formData.variants.filter((_, i) => i !== index);
    const updatedStock = updatedVariants.reduce((sum, v) => sum + Number(v.stock), 0);
    setFormData({ 
      ...formData, 
      variants: updatedVariants,
      stock: updatedStock
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-in pb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý Sản phẩm</h1>
        <div className="space-x-4">
          <Link to="/admin" className="text-gray-500 hover:underline">Về Dashboard</Link>
          <button onClick={openCreateDialog} className="btn btn-primary">+ Tạo Sản phẩm mới</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Sản phẩm</th>
                <th className="p-4">Giá</th>
                <th className="p-4">Thương hiệu</th>
                <th className="p-4">SL tồn</th>
                <th className="p-4">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500">...{product._id.substring(product._id.length - 6)}</td>
                  <td className="p-4 font-medium">
                    <div className="flex items-center">
                      <img src={product.image} className="w-10 h-10 object-contain mr-3" alt="thumb" />
                      <Link to={`/products/${product._id}`} className="hover:text-primary-600">{product.name}</Link>
                    </div>
                  </td>
                  <td className="p-4 text-primary-600 font-semibold">{product.price.toLocaleString('vi-VN')} đ</td>
                  <td className="p-4">{product.brand}</td>
                  <td className="p-4">{product.stock}</td>
                  <td className="p-4 space-x-2">
                    <button onClick={() => openEditDialog(product)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded">Sửa</button>
                    <button onClick={() => deleteHandler(product._id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">{isEditing ? 'Sửa sản phẩm' : 'Tạo sản phẩm mới'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">✕</button>
            </div>

            <form onSubmit={submitHandler} className="p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Tên sản phẩm</label>
                  <input required className="input-field" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Thương hiệu</label>
                  <input required className="input-field" type="text" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Giá niêm yết (vnđ)</label>
                  <input required className="input-field" type="number" min="0" value={formData.originalPrice} onChange={e => setFormData({ ...formData, originalPrice: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Loại giảm giá</label>
                  <select className="input-field" value={formData.discountType} onChange={e => setFormData({ ...formData, discountType: e.target.value })}>
                    <option value="none">Không giảm</option>
                    <option value="amount">Số tiền mặt</option>
                    <option value="percent">Phần trăm (%)</option>
                  </select>
                </div>
                {formData.discountType !== 'none' && (
                  <div>
                    <label className="block text-sm font-semibold mb-1">Mức giảm</label>
                    <input required className="input-field" type="number" min="0" max={formData.discountType === 'percent' ? 100 : formData.originalPrice} value={formData.discountValue} onChange={e => {
                      let val = Number(e.target.value);
                      if (formData.discountType === 'percent' && val > 100) val = 100;
                      if (formData.discountType === 'amount' && val > formData.originalPrice) val = formData.originalPrice;
                      setFormData({ ...formData, discountValue: val });
                    }} />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold mb-1">Số lượng tồn kho (Tổng)</label>
                  <input required className={`input-field ${formData.variants?.length > 0 ? 'bg-gray-100 text-gray-500' : ''}`} type="number" min="0" value={formData.stock} readOnly={formData.variants?.length > 0} onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })} />
                  {formData.variants?.length > 0 && <p className="text-xs text-gray-500 mt-1">Tự động tính từ các biến thể</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Tình trạng máy</label>
                  <select required className="input-field" value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })}>
                    <option value="Máy mới">Máy mới</option>
                    <option value="Máy như mới (Like New)">Máy như mới (Like New)</option>
                    <option value="Máy cũ">Máy cũ</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-3 text-gray-800 border-b pb-2">Thông số kỹ thuật</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">Màn hình</label>
                    <input className="input-field text-sm" type="text" value={formData.specs?.screen || ''} onChange={e => setFormData({ ...formData, specs: { ...formData.specs, screen: e.target.value } })} placeholder="VD: 6.1 inch Super Retina XDR" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">CPU</label>
                    <input className="input-field text-sm" type="text" value={formData.specs?.cpu || ''} onChange={e => setFormData({ ...formData, specs: { ...formData.specs, cpu: e.target.value } })} placeholder="VD: Apple A15 Bionic" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">RAM</label>
                    <input className="input-field text-sm" type="text" value={formData.specs?.ram || ''} onChange={e => setFormData({ ...formData, specs: { ...formData.specs, ram: e.target.value } })} placeholder="VD: 4GB" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">Bộ nhớ (ROM)</label>
                    <input className="input-field text-sm" type="text" value={formData.specs?.storage || ''} onChange={e => setFormData({ ...formData, specs: { ...formData.specs, storage: e.target.value } })} placeholder="VD: 128GB" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">Pin</label>
                    <input className="input-field text-sm" type="text" value={formData.specs?.battery || ''} onChange={e => setFormData({ ...formData, specs: { ...formData.specs, battery: e.target.value } })} placeholder="VD: 3240 mAh" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-600">Camera</label>
                    <input className="input-field text-sm" type="text" value={formData.specs?.camera || ''} onChange={e => setFormData({ ...formData, specs: { ...formData.specs, camera: e.target.value } })} placeholder="VD: Kép 12MP" />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h3 className="text-sm font-semibold text-gray-800">Biến thể (Màu sắc & Dung lượng) - Tùy chọn</h3>
                  <button type="button" onClick={handleAddVariant} className="text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100 transition-colors">
                    + Thêm biến thể
                  </button>
                </div>
                
                {formData.variants && formData.variants.length > 0 ? (
                  <div className="space-y-3">
                    {formData.variants.map((variant, index) => (
                      <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-end p-3 bg-gray-50/50 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex-1 min-w-[120px]">
                          <label className="block text-xs text-gray-600 mb-1">Màu sắc</label>
                          <input required type="text" className="input-field py-1.5 text-sm" placeholder="VD: Đen" value={variant.color} onChange={e => handleUpdateVariant(index, 'color', e.target.value)} />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <label className="block text-xs text-gray-600 mb-1">Dung lượng</label>
                          <input required type="text" className="input-field py-1.5 text-sm" placeholder="VD: 128GB" value={variant.storage} onChange={e => handleUpdateVariant(index, 'storage', e.target.value)} />
                        </div>
                        <div className="w-24 min-w-[80px]">
                          <label className="block text-xs text-gray-600 mb-1">Stock</label>
                          <input required type="number" min="0" className="input-field py-1.5 text-sm" value={variant.stock} onChange={e => handleUpdateVariant(index, 'stock', Number(e.target.value))} />
                        </div>
                        <div className="flex-1 min-w-[130px]">
                          <label className="block text-xs text-gray-600 mb-1">Giá niêm yết (VNĐ)</label>
                          <input required type="number" min="0" className="input-field py-1.5 text-sm" value={variant.originalPrice} onChange={e => handleUpdateVariant(index, 'originalPrice', Number(e.target.value))} />
                        </div>
                        <button type="button" onClick={() => handleRemoveVariant(index)} className="text-red-500 hover:bg-red-50 p-2 text-sm rounded mb-0.5 bg-white border border-gray-200 transition-colors shadow-sm font-medium">
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic py-2 rounded border border-dashed border-gray-200 text-center bg-gray-50/50">
                    Sản phẩm này hiện đang dùng cấu hình và giá mặc định.<br/>Bấm <span className="font-semibold text-primary-600">+ Thêm biến thể</span> nếu bạn muốn chia sản phẩm thành nhiều Màu sắc / Dung lượng khác nhau.
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Ảnh đại diện (URL hoặc Upload)</label>
                <input className="input-field mb-2 text-gray-500 bg-gray-50" type="text" value={formData.image} disabled readOnly />
                <input type="file" id="image-file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" onChange={uploadFileHandler} />
                {uploading && <p className="text-sm mt-1 text-blue-500">Đang tải ảnh lên...</p>}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-1">Mô tả sản phẩm</label>
                <textarea required className="input-field h-32" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>Lưu sản phẩm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagementPage;
