import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync with backend if logged in, else use localStorage
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      const localCart = localStorage.getItem('cartItems');
      if (localCart) setCartItems(JSON.parse(localCart));
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('cartItems', JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      setCartItems(data.items || []);
    } catch (error) {
      console.error('Fetch cart error', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product, quantity = 1, variantId = null) => {
    let availableStock = product.stock;
    if (variantId && product.variants && product.variants.length > 0) {
      const variant = product.variants.find(v => v._id === variantId);
      if (variant) availableStock = variant.stock;
    }

    const existItem = cartItems.find((x) => x.product._id === product._id && x.variantId === variantId);
    const currentQty = existItem ? existItem.quantity : 0;
    
    if (currentQty + quantity > availableStock) {
      toast.error(`Bạn chỉ có thể mua tối đa ${availableStock} sản phẩm này.`);
      return;
    }

    if (user) {
      try {
        await api.post('/cart/add', { productId: product._id, variantId, quantity });
        fetchCart();
      } catch (error) {
        console.error('Add to cart error', error);
      }
    } else {
      if (existItem) {
        setCartItems(
          cartItems.map((x) =>
            x.product._id === existItem.product._id && x.variantId === variantId
              ? { ...x, quantity: x.quantity + quantity }
              : x
          )
        );
      } else {
        setCartItems([...cartItems, { product, quantity, variantId }]);
      }
    }
  };

  const updateQuantity = async (productId, quantity, variantId = null) => {
    const item = cartItems.find(x => x.product._id === productId && x.variantId === variantId);
    if (!item) return;

    let availableStock = item.product.stock;
    if (variantId && item.product.variants && item.product.variants.length > 0) {
      const variant = item.product.variants.find(v => v._id === variantId);
      if (variant) availableStock = variant.stock;
    }

    if (quantity > availableStock) {
      toast.error(`Bạn chỉ có thể mua tối đa ${availableStock} sản phẩm này.`);
      return;
    }

    if (user) {
      try {
        await api.put('/cart/update', { productId, variantId, quantity });
        fetchCart();
      } catch (error) {
        console.error('Update cart error', error);
      }
    } else {
      if (quantity <= 0) {
        removeFromCart(productId, variantId);
      } else {
        setCartItems(
          cartItems.map((x) =>
            x.product._id === productId && x.variantId === variantId ? { ...x, quantity } : x
          )
        );
      }
    }
  };

  const removeFromCart = async (productId, variantId = null) => {
    if (user) {
      try {
        const url = variantId ? `/cart/remove/${productId}/${variantId}` : `/cart/remove/${productId}`;
        await api.delete(url);
        fetchCart();
      } catch (error) {
        console.error('Remove from cart error', error);
      }
    } else {
      setCartItems(cartItems.filter((x) => !(x.product._id === productId && x.variantId === variantId)));
    }
  };

  const clearCart = async () => {
    if (user) {
      try {
        await api.delete('/cart/clear');
        setCartItems([]);
      } catch (error) {
        console.error('Clear cart error', error);
      }
    } else {
      setCartItems([]);
    }
  };

  const cartTotal = cartItems.reduce(
    (acc, item) => {
      let price = item.product.price;
      if (item.variantId && item.product.variants && item.product.variants.length > 0) {
        const variant = item.product.variants.find(v => v._id === item.variantId);
        if (variant && variant.price) price = variant.price;
      }
      return acc + item.quantity * price;
    },
    0
  );
  
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        cartCount,
        cartTotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
