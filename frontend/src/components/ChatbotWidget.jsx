import { useState, useRef, useEffect } from 'react';

const FAQ_DATA = [
  {
    question: '🛒 Cách đặt hàng?',
    answer: 'Để đặt hàng, bạn chọn sản phẩm → Thêm vào giỏ hàng → Vào Giỏ hàng → Bấm "Thanh toán" → Điền thông tin giao hàng → Chọn phương thức thanh toán → Bấm "Đặt hàng ngay". Rất đơn giản!'
  },
  {
    question: '🔄 Chính sách đổi trả?',
    answer: 'SmartShop hỗ trợ đổi trả sản phẩm trong vòng 7 ngày kể từ khi nhận hàng. Sản phẩm phải còn nguyên seal, không trầy xước, đầy đủ phụ kiện. Vui lòng liên hệ hotline 1234567890 để được hỗ trợ!'
  },
  {
    question: '🚚 Thời gian giao hàng?',
    answer: '• Nội thành HCM & Hà Nội: 1-2 ngày\n• Các tỉnh thành khác: 3-5 ngày\n• Đơn hàng trên 500.000đ được MIỄN PHÍ vận chuyển!\n• Phí ship nội thành: 20.000đ, tỉnh khác: 25.000-35.000đ.'
  },
  {
    question: '💳 Phương thức thanh toán?',
    answer: 'SmartShop hỗ trợ 2 phương thức:\n1. **COD** - Thanh toán khi nhận hàng\n2. **Online** - Chuyển khoản ngân hàng / Ví điện tử\n\nBạn có thể chọn khi Checkout!'
  },
  {
    question: '🏷️ Mã giảm giá?',
    answer: 'Bạn có thể nhập mã giảm giá (coupon) tại bước Checkout. Mã giảm giá có thể giảm theo % hoặc số tiền cố định. Theo dõi trang chủ SmartShop để không bỏ lỡ các chương trình khuyến mãi!'
  },
  {
    question: '🛡️ Bảo hành sản phẩm?',
    answer: 'Tất cả sản phẩm tại SmartShop đều được bảo hành chính hãng:\n• Điện thoại mới: 12 tháng\n• Điện thoại Like New: 6 tháng\n• Phụ kiện: 3 tháng'
  },
  {
    question: '📞 Liên hệ hỗ trợ?',
    answer: 'Bạn có thể liên hệ SmartShop qua:\n• Hotline: 1234567890\n• Email: cskh@smartshop.com\n• Chat trực tiếp với nhân viên bằng nút "Chat hỗ trợ" bên cạnh!\n\nGiờ làm việc: 8:00 - 22:00 hàng ngày.'
  }
];

const ChatbotWidget = ({ onSwitchToLiveChat }) => {
  const [chatMessages, setChatMessages] = useState([
    {
      type: 'bot',
      content: 'Xin chào! 👋 Tôi là trợ lý ảo của SmartShop. Tôi có thể giúp bạn giải đáp các thắc mắc thường gặp. Hãy chọn một câu hỏi bên dưới nhé!',
      time: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleFaqClick = (faq) => {
    // Add user's question
    const newMessages = [
      ...chatMessages,
      { type: 'user', content: faq.question, time: new Date() }
    ];
    setChatMessages(newMessages);

    // Bot response after delay
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { type: 'bot', content: faq.answer, time: new Date() }
      ]);
    }, 500);
  };

  const handleUserMessage = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const input = userInput.toLowerCase();
    setChatMessages(prev => [
      ...prev,
      { type: 'user', content: userInput, time: new Date() }
    ]);
    setUserInput('');

    // Simple keyword matching
    let response = null;
    if (input.includes('đặt hàng') || input.includes('mua')) {
      response = FAQ_DATA[0].answer;
    } else if (input.includes('đổi trả') || input.includes('hoàn tiền')) {
      response = FAQ_DATA[1].answer;
    } else if (input.includes('giao hàng') || input.includes('ship') || input.includes('vận chuyển')) {
      response = FAQ_DATA[2].answer;
    } else if (input.includes('thanh toán') || input.includes('trả tiền') || input.includes('cod')) {
      response = FAQ_DATA[3].answer;
    } else if (input.includes('giảm giá') || input.includes('coupon') || input.includes('khuyến mãi') || input.includes('mã')) {
      response = FAQ_DATA[4].answer;
    } else if (input.includes('bảo hành') || input.includes('warranty')) {
      response = FAQ_DATA[5].answer;
    } else if (input.includes('liên hệ') || input.includes('hotline') || input.includes('hỗ trợ') || input.includes('nhân viên')) {
      response = FAQ_DATA[6].answer;
    }

    setTimeout(() => {
      if (response) {
        setChatMessages(prev => [
          ...prev,
          { type: 'bot', content: response, time: new Date() }
        ]);
      } else {
        setChatMessages(prev => [
          ...prev,
          {
            type: 'bot',
            content: 'Xin lỗi, tôi chưa hiểu câu hỏi của bạn. 😅\nBạn có thể:\n• Chọn một câu hỏi thường gặp bên dưới\n• Hoặc nhấn "Chat với nhân viên" để được hỗ trợ trực tiếp!',
            time: new Date()
          }
        ]);
      }
    }, 600);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              🤖 Trợ lý SmartShop
            </h3>
            <p className="text-xs text-emerald-100 mt-1">Hỗ trợ 24/7 • Trả lời tức thì</p>
          </div>
          {onSwitchToLiveChat && (
            <button
              onClick={onSwitchToLiveChat}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
            >
              Chat nhân viên →
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 chat-scrollbar">
        <div className="p-4 flex flex-col gap-3">
        {chatMessages.map((msg, index) => (
          <div key={index} className={`flex max-w-[85%] ${msg.type === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}>
            <div className={`p-3 rounded-2xl text-sm shadow-sm ${
              msg.type === 'user'
                ? 'bg-emerald-600 text-white rounded-br-none'
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
            }`}>
              <div className="whitespace-pre-line">{msg.content}</div>
              <div className={`text-[10px] mt-1 text-right ${msg.type === 'user' ? 'text-emerald-200' : 'text-gray-400'}`}>
                {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />

        {/* FAQ Buttons */}
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-2 font-medium">Câu hỏi thường gặp:</p>
          <div className="flex flex-wrap gap-2">
            {FAQ_DATA.map((faq, index) => (
              <button
                key={index}
                onClick={() => handleFaqClick(faq)}
                className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all shadow-sm"
              >
                {faq.question}
              </button>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t shrink-0">
        <form onSubmit={handleUserMessage} className="flex relative">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Nhập câu hỏi của bạn..."
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border-none rounded-full text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
          />
          <button
            type="submit"
            disabled={!userInput.trim()}
            className="absolute right-2 top-1.5 p-1.5 text-white bg-emerald-600 rounded-full hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotWidget;
