import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const BANNER_TYPES = [
  { value: 'slide', label: 'Slide chính' },
  { value: 'side', label: 'Banner bên phải' },
  { value: 'paylater', label: 'Banner bên dưới' }
];

const emptyBanner = { type: 'slide', title: '', subtitle: '', label: '', price: '', oldPrice: '', bgImage: '', productImg: '', color: '#1a1a2e', thumb: '', link: '/products', icon: '', badgeText: '', badgeColor: '#e31e24', badgeTextColor: '#ffffff', order: 1, isActive: true };
const emptyAdvice = { youtubeId: '', title: '', thumbnail: '', order: 1, isActive: true };

const HomepageContentPage = ({ defaultTab = 'banners' }) => {
  const [tab, setTab] = useState(defaultTab);
  const [banners, setBanners] = useState([]);
  const [advices, setAdvices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editBanner, setEditBanner] = useState(null);
  const [editAdvice, setEditAdvice] = useState(null);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [showAdviceForm, setShowAdviceForm] = useState(false);
  const [bannerForm, setBannerForm] = useState({ ...emptyBanner });
  const [adviceForm, setAdviceForm] = useState({ ...emptyAdvice });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [b, a] = await Promise.all([
        api.get('/homepage/admin/banners'),
        api.get('/homepage/admin/advices')
      ]);
      setBanners(b.data);
      setAdvices(a.data);
    } catch (err) {
      toast.error('Lỗi tải dữ liệu');
    } finally { setLoading(false); }
  };

  useEffect(() => { setTab(defaultTab); }, [defaultTab]);

  // === BANNER CRUD ===
  const openBannerForm = (banner = null) => {
    if (banner) { setEditBanner(banner._id); setBannerForm({ ...banner }); }
    else { setEditBanner(null); setBannerForm({ ...emptyBanner }); }
    setShowBannerForm(true);
  };

  const saveBanner = async (e) => {
    e.preventDefault();
    if (bannerForm.order < 1) { toast.error('Thứ tự phải từ 1 trở lên'); return; }
    const duplicate = banners.find(b => b.type === bannerForm.type && b.order === bannerForm.order && b._id !== editBanner);
    if (duplicate) { toast.error(`Thứ tự ${bannerForm.order} đã được dùng bởi banner "${duplicate.title}" cùng loại. Vui lòng chọn thứ tự khác.`); return; }
    try {
      if (editBanner) {
        await api.put(`/homepage/admin/banners/${editBanner}`, bannerForm);
        toast.success('Đã cập nhật banner');
      } else {
        await api.post('/homepage/admin/banners', bannerForm);
        toast.success('Đã tạo banner mới');
      }
      setShowBannerForm(false);
      fetchData();
    } catch { toast.error('Lỗi lưu banner'); }
  };

  const deleteBanner = async (id) => {
    if (!window.confirm('Xác nhận xóa banner này?')) return;
    try {
      await api.delete(`/homepage/admin/banners/${id}`);
      toast.success('Đã xóa banner');
      fetchData();
    } catch { toast.error('Lỗi xóa banner'); }
  };

  // === ADVICE CRUD ===
  const openAdviceForm = (advice = null) => {
    if (advice) { setEditAdvice(advice._id); setAdviceForm({ ...advice }); }
    else { setEditAdvice(null); setAdviceForm({ ...emptyAdvice }); }
    setShowAdviceForm(true);
  };

  const saveAdvice = async (e) => {
    e.preventDefault();
    if (adviceForm.order < 1) { toast.error('Thứ tự phải từ 1 trở lên'); return; }
    const duplicate = advices.find(a => a.order === adviceForm.order && a._id !== editAdvice);
    if (duplicate) { toast.error(`Thứ tự ${adviceForm.order} đã được dùng bởi tư vấn "${duplicate.title}". Vui lòng chọn thứ tự khác.`); return; }
    try {
      if (editAdvice) {
        await api.put(`/homepage/admin/advices/${editAdvice}`, adviceForm);
        toast.success('Đã cập nhật tư vấn');
      } else {
        await api.post('/homepage/admin/advices', adviceForm);
        toast.success('Đã tạo tư vấn mới');
      }
      setShowAdviceForm(false);
      fetchData();
    } catch { toast.error('Lỗi lưu tư vấn'); }
  };

  const deleteAdvice = async (id) => {
    if (!window.confirm('Xác nhận xóa tư vấn này?')) return;
    try {
      await api.delete(`/homepage/admin/advices/${id}`);
      toast.success('Đã xóa tư vấn');
      fetchData();
    } catch { toast.error('Lỗi xóa tư vấn'); }
  };

  const handleBannerChange = (field, value) => setBannerForm(prev => ({ ...prev, [field]: value }));
  const handleAdviceChange = (field, value) => setAdviceForm(prev => ({ ...prev, [field]: value }));

  const uploadImage = async (file, callback) => {
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      callback(`http://localhost:9000${res.data.url}`);
    } catch { toast.error('Lỗi upload ảnh'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{tab === 'banners' ? 'Quản lý Banner / Slides' : 'Quản lý Tư vấn mua hàng'}</h1>
      </div>

      {/* BANNERS TAB */}
      {tab === 'banners' && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Quản lý Banner ({banners.length})</h2>
            <button onClick={() => openBannerForm()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Thêm banner</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Ảnh</th>
                  <th className="text-left p-3">Loại</th>
                  <th className="text-left p-3">Tiêu đề</th>
                  <th className="text-left p-3">Label</th>
                  <th className="text-center p-3">Thứ tự</th>
                  <th className="text-center p-3">Trạng thái</th>
                  <th className="text-center p-3">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {banners.map(b => (
                  <tr key={b._id} className="border-t hover:bg-gray-50">
                    <td className="p-3"><img src={b.bgImage || b.productImg} alt="" className="w-20 h-12 object-cover rounded" onError={e => e.target.style.display='none'} /></td>
                    <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${b.type === 'slide' ? 'bg-blue-100 text-blue-700' : b.type === 'side' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>{BANNER_TYPES.find(t => t.value === b.type)?.label}</span></td>
                    <td className="p-3 font-medium max-w-[200px] truncate">{b.title}</td>
                    <td className="p-3">{b.label || '-'}</td>
                    <td className="p-3 text-center">{b.order}</td>
                    <td className="p-3 text-center">{b.isActive ? <span className="text-green-600 font-bold">✓</span> : <span className="text-red-500">✗</span>}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => openBannerForm(b)} className="text-blue-600 hover:underline mr-3">Sửa</button>
                      <button onClick={() => deleteBanner(b._id)} className="text-red-500 hover:underline">Xóa</button>
                    </td>
                  </tr>
                ))}
                {banners.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">Chưa có banner nào. Nhấn "+ Thêm banner" để tạo mới.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADVICES TAB */}
      {tab === 'advices' && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Quản lý Tư vấn mua hàng ({advices.length})</h2>
            <button onClick={() => openAdviceForm()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">+ Thêm tư vấn</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {advices.map(a => (
              <div key={a._id} className="border rounded-lg overflow-hidden bg-gray-50">
                <img src={a.thumbnail || `https://img.youtube.com/vi/${a.youtubeId}/maxresdefault.jpg`} alt="" className="w-full aspect-video object-cover" />
                <div className="p-3">
                  <p className="text-sm font-medium line-clamp-2 mb-2">{a.title}</p>
                  <p className="text-xs text-gray-500 mb-2">ID: {a.youtubeId} · Thứ tự: {a.order}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${a.isActive ? 'text-green-600' : 'text-red-500'}`}>{a.isActive ? '✓ Hiện' : '✗ Ẩn'}</span>
                    <div className="flex gap-2">
                      <button onClick={() => openAdviceForm(a)} className="text-blue-600 text-sm hover:underline">Sửa</button>
                      <button onClick={() => deleteAdvice(a._id)} className="text-red-500 text-sm hover:underline">Xóa</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {advices.length === 0 && <div className="col-span-4 text-center py-8 text-gray-400">Chưa có tư vấn nào.</div>}
          </div>
        </div>
      )}

      {/* BANNER FORM MODAL */}
      {showBannerForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto" onClick={() => setShowBannerForm(false)}>
          <form onSubmit={saveBanner} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 mb-10">
            <h3 className="text-lg font-bold mb-4">{editBanner ? 'Sửa banner' : 'Thêm banner mới'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Loại *</label>
                <select value={bannerForm.type} onChange={e => handleBannerChange('type', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {BANNER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thứ tự</label>
                <input type="number" min="1" value={bannerForm.order} onChange={e => handleBannerChange('order', Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
                <input value={bannerForm.title} onChange={e => handleBannerChange('title', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Phụ đề</label>
                <input value={bannerForm.subtitle} onChange={e => handleBannerChange('subtitle', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              {bannerForm.type === 'slide' && (<>
                <div><label className="block text-sm font-medium mb-1">Label</label><input value={bannerForm.label} onChange={e => handleBannerChange('label', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Thumb text</label><input value={bannerForm.thumb} onChange={e => handleBannerChange('thumb', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Giá</label><input value={bannerForm.price} onChange={e => handleBannerChange('price', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Giá cũ</label><input value={bannerForm.oldPrice} onChange={e => handleBannerChange('oldPrice', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Màu nền</label><input type="color" value={bannerForm.color} onChange={e => handleBannerChange('color', e.target.value)} className="w-full h-10 border rounded-lg" /></div>
              </>)}
              {bannerForm.type === 'side' && (<>
                <div><label className="block text-sm font-medium mb-1">Icon class</label><input value={bannerForm.icon} onChange={e => handleBannerChange('icon', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="fa-solid fa-headphones" /></div>
                <div><label className="block text-sm font-medium mb-1">Badge text</label><input value={bannerForm.badgeText} onChange={e => handleBannerChange('badgeText', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Badge BG color</label><input type="color" value={bannerForm.badgeColor} onChange={e => handleBannerChange('badgeColor', e.target.value)} className="w-full h-10 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Badge text color</label><input type="color" value={bannerForm.badgeTextColor} onChange={e => handleBannerChange('badgeTextColor', e.target.value)} className="w-full h-10 border rounded-lg" /></div>
              </>)}
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">URL ảnh nền</label>
                <div className="flex gap-2">
                  <input value={bannerForm.bgImage} onChange={e => handleBannerChange('bgImage', e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
                  <label className="bg-gray-100 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-gray-200 flex items-center">
                    📁 <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], url => handleBannerChange('bgImage', url))} />
                  </label>
                </div>
                {bannerForm.bgImage && <img src={bannerForm.bgImage} alt="preview" className="mt-2 h-20 object-cover rounded" />}
              </div>
              {bannerForm.type === 'slide' && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">URL ảnh sản phẩm</label>
                  <div className="flex gap-2">
                    <input value={bannerForm.productImg} onChange={e => handleBannerChange('productImg', e.target.value)} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                    <label className="bg-gray-100 px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-gray-200 flex items-center">
                      📁 <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files[0] && uploadImage(e.target.files[0], url => handleBannerChange('productImg', url))} />
                    </label>
                  </div>
                  {bannerForm.productImg && <img src={bannerForm.productImg} alt="preview" className="mt-2 h-20 object-contain rounded bg-gray-100" />}
                </div>
              )}
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" checked={bannerForm.isActive} onChange={e => handleBannerChange('isActive', e.target.checked)} className="w-4 h-4" />
                <label className="text-sm">Hiển thị banner</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowBannerForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Hủy</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Lưu</button>
            </div>
          </form>
        </div>
      )}

      {/* ADVICE FORM MODAL */}
      {showAdviceForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowAdviceForm(false)}>
          <form onSubmit={saveAdvice} onClick={e => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-4">{editAdvice ? 'Sửa tư vấn' : 'Thêm tư vấn mới'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">YouTube Video ID *</label>
                <input value={adviceForm.youtubeId} onChange={e => handleAdviceChange('youtubeId', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="vd: QrXReeL07-c" required />
                <p className="text-xs text-gray-400 mt-1">Lấy từ URL: youtube.com/watch?v=<b>QrXReeL07-c</b></p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề *</label>
                <input value={adviceForm.title} onChange={e => handleAdviceChange('title', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL Thumbnail</label>
                <input value={adviceForm.thumbnail} onChange={e => handleAdviceChange('thumbnail', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Để trống sẽ tự lấy từ YouTube" />
                {(adviceForm.thumbnail || adviceForm.youtubeId) && <img src={adviceForm.thumbnail || `https://img.youtube.com/vi/${adviceForm.youtubeId}/maxresdefault.jpg`} alt="preview" className="mt-2 w-full aspect-video object-cover rounded" />}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Thứ tự</label>
                  <input type="number" min="1" value={adviceForm.order} onChange={e => handleAdviceChange('order', Number(e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex items-end pb-1 gap-2">
                  <input type="checkbox" checked={adviceForm.isActive} onChange={e => handleAdviceChange('isActive', e.target.checked)} className="w-4 h-4" />
                  <label className="text-sm">Hiển thị</label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowAdviceForm(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Hủy</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Lưu</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default HomepageContentPage;
