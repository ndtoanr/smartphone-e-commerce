import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, loading } = useContext(CartContext);
  const navigate = useNavigate();

  const checkoutHandler = () => {
    navigate('/login?redirect=/checkout');
  };

  if (loading) return <div className="text-center py-20">Đang tải giỏ hàng...</div>;

  return (
    <div className="fade-in">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Giỏ hàng của bạn</h1>

      {cartItems.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-gray-700 mb-6">Giỏ hàng trống</h2>
          <Link to="/products" className="btn btn-primary">
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flow-root">
                  <ul className="-my-6 divide-y divide-gray-200">
                    {cartItems.map((item) => (
                      <li key={item.product._id} className="py-6 flex flex-col sm:flex-row">
                        <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-gray-50 rounded-md p-2 overflow-hidden mx-auto sm:mx-0 mb-4 sm:mb-0">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <div className="sm:ml-6 flex-1 flex flex-col justify-between">
                          <div className="flex sm:justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                <Link to={`/products/${item.product._id}`}>{item.product.name}</Link>
                              </h3>
                              <p className="text-sm text-gray-500 mb-1">Thương hiệu: {item.product.brand}</p>
                              {item.variantId && item.product.variants && (() => {
                                const variant = item.product.variants.find(v => v._id === item.variantId);
                                if (!variant) return null;
                                return (
                                  <div className="flex items-center gap-2 mb-2 md:mb-0 mt-1">
                                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded shadow-sm border border-gray-200">Màu: {variant.color}</span>
                                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded shadow-sm border border-gray-200">Dung lượng: {variant.storage}</span>
                                  </div>
                                );
                              })()}
                            </div>
                            <p className="text-lg font-bold text-primary-600 hidden sm:block">
                              {(() => {
                                let p = item.product.price;
                                if (item.variantId && item.product.variants) {
                                  const variant = item.product.variants.find(v => v._id === item.variantId);
                                  if (variant && variant.price) p = variant.price;
                                }
                                return (p * item.quantity).toLocaleString('vi-VN');
                              })()} đ
                            </p>
                          </div>
                          
                          <div className="flex items-center sm:justify-between mt-4">
                            <div className="flex items-center border border-gray-300 rounded-md bg-white">
                              <button 
                                onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.variantId)}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md transition-colors"
                              >
                                -
                              </button>
                              <span className="px-4 py-1 text-gray-800 font-medium border-x border-gray-300">
                                {item.quantity}
                              </span>
                              <button 
                                onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.variantId)}
                                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md transition-colors"
                                disabled={(() => {
                                  let stock = item.product.stock;
                                  if (item.variantId && item.product.variants) {
                                    const variant = item.product.variants.find(v => v._id === item.variantId);
                                    if (variant) stock = variant.stock;
                                  }
                                  return item.quantity >= stock;
                                })()}
                              >
                                +
                              </button>
                            </div>
                            
                            <p className="text-lg font-bold text-primary-600 sm:hidden ml-4">
                              {(() => {
                                let p = item.product.price;
                                if (item.variantId && item.product.variants) {
                                  const variant = item.product.variants.find(v => v._id === item.variantId);
                                  if (variant && variant.price) p = variant.price;
                                }
                                return (p * item.quantity).toLocaleString('vi-VN');
                              })()} đ
                            </p>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product._id, item.variantId)}
                              className="ml-auto sm:ml-4 text-red-500 hover:text-red-700 font-medium flex items-center transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Xóa
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b">Tóm tắt đơn hàng</h2>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between text-base text-gray-600 mb-3">
                  <p>Tạm tính ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm)</p>
                  <p className="font-medium text-gray-800">{cartTotal.toLocaleString('vi-VN')} đ</p>
                </div>
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center bg-white p-3 rounded border border-primary-100">
                    <p className="text-base font-bold text-gray-900">Tổng cộng</p>
                    <p className="text-2xl font-bold text-primary-600">{cartTotal.toLocaleString('vi-VN')} đ</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-right">(Đã bao gồm VAT nếu có)</p>
                </div>
              </div>

              <button
                onClick={checkoutHandler}
                className="w-full btn btn-primary py-4 text-lg font-bold shadow-md shadow-primary-500/20"
              >
                Tiến hành thanh toán
              </button>
              
              <div className="mt-6 flex items-center justify-center space-x-4">
                <img src="https://cdn-icons-png.flaticon.com/512/1554/1554401.png" alt="COD" className="h-4 object-contain opacity-60 grayscale hover:grayscale-0 transition-all" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="MasterCard" className="h-6 object-contain opacity-60 grayscale hover:grayscale-0 transition-all" />
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAilBMVEWlAGT///+iAF6hAFuiAF2mAGX9+Pzu0uOqCmzIdKO6TYv46PLdqsejAGHZnsDOhK357fX89frep8fqyNytE3HAXJXz3erMfar/+/62PYLw1+bitc++VpDszN+yMHzdqMbDZZrnwdfHcKHSirPYmb25RYfUkbevJXfDY5r24++3QITMf6rmvNWzM37eObSyAAAMgElEQVR4nO1d54KyOhANSVixjKJid+1l/Vzf//UuWFEmIUCod89fNOSQNsnMnBBDDWO73+vMJ45F8oblTOadXt8eK9acqPxouhwcCeMUIG96VwBQzshxsJzqYTjdLiijxeDmB7i1WmzDSYYwtNsLzovH7gHgfNG2EzCcjkxWXHo3AIP6MCbD4YryvOuvBE5XEo5ChnYdaN5VVwalI2FfFTFcWuVovwe4tYzEsDkv/Pj7BLB5U51hzyxPB32Bmj1FhuN66RrwBmB1xNAJMrT3LO+qxgb7F5xwAgynTrmmmHdQJ2DkfDKsWeXsoQ+AVZMzXJNyE3QpkrWMYa30BD2KNTHDacm76A1gTkUMbacKBF2Kjo0zHO/LPIv6Qf+NUYb18q6Dn2B1jGGvOgRdir0gw6ZZjUF4A5jNAMN5GY1tMej8k+GySn3Uw7Of3hnalVgJ/QDLfmM4qspC8QIf+RkOq0fQbcWhj+GqWtPMDXT1YjitIkGX4vTJsIKj0AOvPxjaZt51SQmmfWfYrtpa+ADb3RkuqrYWPgCLG8NaVZvQbcTaleG2mvOMB769MozTSQEo5VzsFQ55HO0tnMZ10HrdlERfDIEzak3mm9F5tGocKfv8v/vcXMw353N907iYPOYBulsK3N5yrq/mFyueH9pdEknUXQXnx9Fs2H3sTb5Os43fjQoc9rvv7vMUwa6159HdrJTBZft7er7FGHens9GCRi7I3WEQYxClDTnZ9AO+Abv17/5qYMfD6fOxYS8nUaoGnDeWwVI883k3CfQYOejAIOMIB2wUOrgHy/i9eD2BHVuCGJD1P2WO3DpLPLq1FUSZGOE4Jrb6z9kA/bJXjNuEmW1JjEvLUvr63NyGRB4MNzRKOzZJX3UYAqDuOd+bxfw9NBvhbwK2EXQSP6Z79U7P+qSn2OhBl0dkjMIocmetVlKbqDYj75GO2m/BkbeQEg5yimzQDS/jhuFFsWFoh8yVGhwsDQRDWpFtI5T09aM2umBOJmoM+zoIGsaP8NMDnUUraqtEESbEUfnddRuiA/ZRZObBb9SyQvr8HQ5RCaeke00E3YVRUC0WsQWVKaqFi9LE0+gLeD9l8pVIAG2+pPuhlR4MsbmbjeIV1tC08aNKkaqqQE4uaSNmWU09R/UQ9/04gkcKYMZeitZaGpG1dBI0jMvnd483CG/Y6KBohpjCUfE5BcK/BIXpcClp7qTBbsq/k5Sm4SiUHwRld+Vt2xXlC3y970jpj6wUe1qrDWXm6pfIhojAEDfYWhPTPJ6FJNcNy3Q2+Fb23d0sXmzH/fqCUM6oeZHE5CdvREB3bBtviwbMEWzHt965EXDcFHs7vhQPgt8Le6QJAGMN0YfoJo0CAgfrbI/Zgh6/sLfO7o/Bwj5Py//VReZad/C+zaXCrcc54XQKF+z1zxkMX0qeGxa0Wv5jBbDwQXY6BurNGvhPa0kZzpFCX3VELbrT8+vDEXns9zjzDVrrpoMYd7yBz12BBTYaUAqvfoYOo9dXBQvpxSdfjfBOOp6gJw8M/xwJ3RK0jpS5TMSw6S8fncc6kfZYyodpERgma8PmyyOLjvK3Rn4DoBNbQg9vugzR0iXGJm7CJhuI6TJkWKaLpE1ggjFMFkqSMkPMYJpJxhXHNlq7RFNNyr0Us4nqkiZBu6nsk+TNEN2ZyQ44KbZgJJtM02WIWTRd2ZYPsGO/aXF7KTjIY+nkfw2v+ESysLx0GR4RO6wpmxlRM/BUZIZYG8pWt9K1IfY4xjgs8ExT/bmUYgv4RrYetpE/FHk9RG2alqTCDDMR2sUdh/gRgSR4Ap1opEZQ3gw56pJZifcWWCeVDty8GeLn3cJANHCwo5puMkmZdBkKXAYifz9+7vVd5D0+YeiJaveIn9Pgx+Nq7u68GOID0RhieWb8gh8nJj1rS5ch+gPDS9gNnpdOcB9Csp1F6gwJW6PV9oLE3poG+Ebg6Uka45w2Q7Hfouc8g2aBsovgS3y6sorHUBIl8DUbOMBcwHEjjliSWUAFYSiL9Pg69dfr75NMuSxxLkXqDBOGeiRuwiwYJnGjd5O7gNNnGCvi6wGRh6NYDJ8JrdHxrSGvMAOGhGM+ShVo6KPZMCRMFO8RgoGOeKFMGMYcihoGYWYMIU4Qsqa8yWwYEjAjR0YtdYVeZsOQAIkYBr3TFj6bEUPXuo4UohiavFE8hp6qDL5XRKCSgFNAhoQtFAfjTC2JqngM3SlVrNL5wmmgVfYwU4ZuMzrtkK5qd5STngrJ0It33EnacTgiuhOz4zCc+hhirSCP8AFm/szQU7Vmq5GC8C/s2wH0XgEssAg+bp9fw8TaBR8fQl9KmTXYffub8qu5PuwhHdnR60nJB6j8sf87hzwWgjJmHhur0WF32I5W+6P7ngpKPzzy8QujBv+HP/zhD3/4wx8qBu+qF4n4z/1xUlskL5sGOCOLxursWoyjwcJkn7e0UEadf6vO4bA9/+wdGniuhg+71MnMLgXOJ4e1Lw3EXp8dnyUOjPy0hq9N4ddwVrdiaAxlubfwA5jVCXr7xusGp/fnl15w+9r9bUSRlMl6f+gHt3aCdM6aJxkDbLLGHxs15StBst/j+9+9kby6ZTFLlvT9G0y3w8Cs0HOac1oX4FBT7j1pilNmr+gq6K3kctb2JHhMrFATGp3FFooCHFrPS58ENWTlh4iis00uZ943gKOgUBUOWStG9Fto1sgHokn8YyOsV2QJHm2+pyuSKFe84UsU3xPDf6iqUqYCGjeSIIgaPkXk6QO+vl96OV001NEvz3P045OHprImnLA35BqLQfQ2ISqtHXsUaImn0ToKPQQD8XFtCSXoiIlKFnaGIZAdkeQFZx1DUbfG0OdClndsou5OGsylyzu+VKwo2DxJpSrtk6DtPzWGwmOEm6nGCItknNpHAGslnCJmE0KtOb5V+NAYyjvOG9fmGF/37MBNwXZndN3BUXwhV9QYWmYUq49rDD2sCTiiPfXxXYFgS+m7xpDA4A7kW7C08i1QJYpXrAFqk4+fYwNN+un7qoTmqxuZ5sygGkMvjU5cY+gVyIAll/urJMp7wrKdRXlPCeeaNDSGfDNNtNw1fNpNI3dNn8ZQ5fMPBTmkQo0hNIfULnIOafXzgCPncqO6UkXO5daTj19ojaHKaypUXhdDk7ZJstuO/vRp/jSG/uc6UdXX+qr+XPo/0NyLrJuImghFtmlQ7ctulbQvI+uXyoWZC8hQjwZtkfeHhKB7/ArpCBdWC1qjxlAUPe99OnreaWsM5a7JnrrGkLKufgf/YWJd/bQZir2Hv4ts7kZIX4FH5X4LJKr1gcQxJ+kzDL+jROaETn5HSfpZsizne2bSZ5j3XUFZaAzle99TFhpD+d7ZlUW2eux4EzvpSpEVw3zvzstIYwjbCYdCLU44bG+VkaYCjXxJp/IdlmH3kGalMZTePaRhJwCZaQyldpds2H3A2Sl/RAqjjXAfcNidzllqDP0oR0Eq3+nMO6H3cmep3qJ8L3fPjHAvd9gxTrYaQ1wcC/hCxLvVJWEB2TN0v7l5COmqw02UZEaX3zjE8MlaY4gw6yyJnP9eQRQ7BpwxMQbyL5KDxhCnjRZqiw93ExbtAJ8ODOKL4MLfN9l2PrEd+K7/CzztdOo+jaFz8PEovGIMLtu1LwZ53J3ORgsaOe/Q3ZgRsUz/gwMPAuSP/SVS+WPJaxk4k8Fm1DnXV/OLFS8nnE5dhhoCpdPCIx9flPYfXsDC8BgmjbEtMHjnyjCsm5YYfHplWOBumhDXwA2PocY8vmLhmipCwten8uIa6eExxBLmqoBb3uSV4bCac80tlOXKMGEwQ0FxzzK4MRxWcTa9p77eGAryj0uNR5D8naEGB0fB8LyO4M4wbIdRPjzPmB8MP5ICS49X5uuTYRO7Q6q0ALMZYBgmrVIu+FySL4a69VDyBPMdvfgYjvdVGYpvwVM+hnr8jQUAOP4DST9DY1qJVRGst+CbN4ZGn5SfInzkl78zNNalXzPAXBsyhsZ3yTvqZwsGGRpTLLKzNKBOIAAuwNCw9+VdF9k+6NYJMjTG9ZIq2AOrI0HECMMoDsgigZpo9BjK0Ggqi3EWBsDmuHMVZ+g2Y1CXotDglij8T8TQsEdpyYSmACpRBRUyNIzhKmVJW13gdCUJbpQw9CRtzcKPR2DmSCo0JWXo9tXdgsdTq84EwPlCpjqswNDFtLOgLK6LMkWAW6uFJIZfnaFHsjdwCCvMbS+e4jsjzqCnJIOmxNDFuNnvdeYTJ1kinA5YzmR+7vVtmcKZH/8BfcD7QwOPdbAAAAAASUVORK5CYII=" alt="Momo" className="h-6 object-contain opacity-60 grayscale hover:grayscale-0 transition-all" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
