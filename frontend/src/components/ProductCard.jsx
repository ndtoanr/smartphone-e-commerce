import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import StarRating from './StarRating';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product, 1);
  };

  let isRealDiscount = product.discountType && product.discountType !== 'none';
  let discountLabel = '';
  
  if (isRealDiscount) {
    if (product.discountType === 'amount') {
      const formattedDiscount = new Intl.NumberFormat('vi-VN').format(product.discountValue);
      discountLabel = `Giảm ${formattedDiscount} đ`;
    } else if (product.discountType === 'percent') {
      discountLabel = `Giảm ${product.discountValue}%`;
    }
  }

  const oldPrice = (product.originalPrice && product.originalPrice > product.price) ? product.originalPrice : null;

  return (
    <div className="card group hover:shadow-lg transition-shadow duration-300">
      <Link to={`/products/${product._id}`}>
        <div className="relative overflow-hidden pt-[100%] bg-white">
          <img 
            src={product.image} 
            alt={product.name} 
            className="absolute top-0 left-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
          {isRealDiscount && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 flex items-center gap-1 rounded shadow z-10">
              <span className="text-yellow-300">🔥</span> {discountLabel}
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-1 font-medium">{product.brand}</p>
          <h3 className="font-semibold text-gray-800 text-sm md:text-base leading-tight mb-2 h-10 overflow-hidden line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center mb-2">
            <StarRating rating={product.rating} />
            <span className="text-xs text-gray-500 ml-1">({product.numReviews})</span>
          </div>
          <div className="flex flex-col mt-3">
            <span className="text-primary-600 font-bold text-lg">
              {product.price.toLocaleString('vi-VN')} đ
            </span>
            {oldPrice && (
              <span className="text-xs text-gray-400 line-through mt-0.5">
                {oldPrice.toLocaleString('vi-VN')} đ
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        {product.variants && product.variants.length > 0 ? (
          <Link 
            to={`/products/${product._id}`}
            className="block text-center w-full py-2 rounded font-medium transition-colors bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white"
          >
            Chọn cấu hình
          </Link>
        ) : (
          <button 
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`w-full py-2 rounded font-medium transition-colors ${
              product.stock > 0 
                ? 'bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {product.stock > 0 ? 'Thêm giỏ hàng' : 'Hết hàng'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
