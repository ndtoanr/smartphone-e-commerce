import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ChatbotWidget from './ChatbotWidget';

const FloatingWidget = () => {
    const { user } = useContext(AuthContext);

    // States
    const [showContact, setShowContact] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);

    // Refs
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const chatIntervalRef = useRef(null);
    const prevMessageCount = useRef(0);
    const shouldAutoScroll = useRef(true);

    // Scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleChatScroll = () => {
        const container = chatContainerRef.current;
        if (!container) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 80;
    };

    useEffect(() => {
        if (messages.length > prevMessageCount.current && shouldAutoScroll.current) {
            scrollToBottom();
        }
        prevMessageCount.current = messages.length;
    }, [messages]);

    // Scroll khi mở chat lần đầu
    useEffect(() => {
        if (showChat) {
            shouldAutoScroll.current = true;
            setTimeout(() => scrollToBottom(), 100);
        }
    }, [showChat]);

    // Fetch unread count for the red dot (when chat is closed)
    const fetchUnreadCount = async () => {
        if (!user) return;
        try {
            const { data } = await api.get('/messages/user/unread');
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error('Lỗi lấy số tn chưa đọc:', error);
        }
    };

    // Fetch messages if chat is open
    const fetchMessages = async () => {
        if (!user) return;
        try {
            const { data } = await api.get(`/messages/${user?._id}`);
            setMessages(data);

            // If there are unread messages from admin and chat is open, mark them as read
            const hasUnread = data.some(m => !m.isRead && m.receiver === user?._id);
            if (hasUnread && showChat) {
                await api.put('/messages/mark-read', { senderId: null });
                setUnreadCount(0); // Clear red dot
            }
        } catch (error) {
            console.error('Lỗi lấy tin nhắn:', error);
        }
    };

    // Setup Polling
    useEffect(() => {
        if (user && user.role !== 'admin') {
            // Đọc ngay lập tức khi component mount
            fetchUnreadCount();
            if (showChat) fetchMessages();

            // Poll every 3 seconds
            chatIntervalRef.current = setInterval(() => {
                if (showChat) {
                    fetchMessages();
                } else {
                    fetchUnreadCount();
                }
            }, 3000);

            return () => clearInterval(chatIntervalRef.current);
        }
    }, [user, showChat]);

    const toggleContact = () => {
        setShowContact(!showContact);
        if (showChat) setShowChat(false);
        if (showChatbot) setShowChatbot(false);
    };

    const toggleChat = () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để sử dụng tính năng Chat Hỗ trợ!");
            return;
        }
        setShowChat(!showChat);
        if (showContact) setShowContact(false);
        if (showChatbot) setShowChatbot(false);

        // When opening chat, immediately fetch and clear unread count
        if (!showChat) {
            fetchMessages();
            setUnreadCount(0);
        }
    };

    const toggleChatbot = () => {
        setShowChatbot(!showChatbot);
        if (showChat) setShowChat(false);
        if (showContact) setShowContact(false);
    };

    const switchToChatFromBot = () => {
        setShowChatbot(false);
        if (!user) {
            toast.error("Vui lòng đăng nhập để chat với nhân viên!");
            return;
        }
        setShowChat(true);
        fetchMessages();
        setUnreadCount(0);
    };

    // Điều kiện không render widget nếu là admin (để admin dùng trang riêng)
    // ĐẶT SAU TẤT CẢ HOOKS để không vi phạm Rules of Hooks
    if (user && user.role === 'admin') {
        return null;
    }

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        try {
            const { data } = await api.post('/messages', {
                receiverId: null, // send to admin
                content: messageInput
            });
            setMessages([...messages, data]);
            setMessageInput('');
            scrollToBottom();
        } catch (error) {
            console.error('Lỗi gửi tin nhắn:', error);
            toast.error('Không thể gửi tin nhắn.');
        }
    };

    return (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 flex items-end">
            
            {/* Popups Container - Absolutely positioned to the left of buttons */}
            <div className="absolute bottom-0 right-16 md:right-20 flex flex-col items-end mr-2">
                {/* Contact Info Popup */}
                {showContact && (
                    <div className="bg-white p-4 rounded-xl shadow-2xl border border-gray-100 max-w-sm w-72 md:w-80 flex flex-col slide-up overflow-hidden mb-2">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b">
                            <h3 className="font-bold text-gray-800 text-lg">Liên Hệ SmartShop</h3>
                            <button onClick={() => setShowContact(false)} className="text-gray-400 hover:text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600">
                            <p className="flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Hà Đông, TP.Hà Nội
                            </p>
                            <p className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                1234567890
                            </p>
                            <p className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                cskh@smartshop.com
                            </p>

                            {/* Embed Map */}
                            <div className="mt-4 border rounded-lg overflow-hidden h-40 bg-gray-100">
                                <iframe
                                    title="Store Location Map"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3725.164830104159!2d105.76856696752097!3d20.986028850872852!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31345371666cadd7%3A0xda8df2525c33547d!2zSOG7jWMgdmnhu4duIEPDtG5nIG5naOG7hyBCxrB1IGNow61uaCBWaeG7hW4gdGjDtG5nIC0gY8ahIHPhu58gTmfhu41jIFRy4bulYw!5e0!3m2!1svi!2s!4v1773206328138!5m2!1svi!2s"
                                    width="100%"  
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chatbot Popup */}
                {showChatbot && (
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-[calc(100vw-5rem)] sm:w-80 md:w-96 h-[500px] max-h-[80vh] flex flex-col slide-up overflow-hidden mb-2">
                        <ChatbotWidget onSwitchToLiveChat={switchToChatFromBot} />
                    </div>
                )}

                {/* Chat Box Popup */}
                {showChat && (
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-100 w-[calc(100vw-5rem)] sm:w-80 md:w-96 h-[500px] max-h-[80vh] flex flex-col slide-up overflow-hidden mb-2">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 text-white flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    Hỗ trợ trực tuyến <span className="text-xl">👋</span>
                                </h3>
                                <p className="text-xs text-primary-100 mt-1">Chúng tôi thường trả lời ngay lập tức</p>
                            </div>
                            <button onClick={() => setShowChat(false)} className="text-white hover:text-gray-200 bg-white/10 rounded-full p-1 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto bg-gray-50 chat-scrollbar">
                            <div className="p-4 flex flex-col gap-3">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-400 my-auto text-sm py-10">
                                    Bắt đầu cuộc trò chuyện với SmartShop ngay!
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isMine = msg.sender === user?._id;

                                    return (
                                        <div key={index} className={`flex max-w-[85%] ${isMine ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}>
                                            <div className={`p-3 rounded-2xl text-sm shadow-sm ${isMine
                                                ? 'bg-primary-600 text-white rounded-br-none'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                                }`}>
                                                {msg.content}
                                                <div className={`text-[10px] mt-1 text-right ${isMine ? 'text-primary-200' : 'text-gray-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t shrink-0">
                            <form onSubmit={handleSendMessage} className="flex relative">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder="Nhập tin nhắn..."
                                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border-none rounded-full text-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!messageInput.trim()}
                                    className="absolute right-2 top-1.5 p-1.5 text-white bg-primary-600 rounded-full hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Controller Buttons */}
            <div className="flex flex-col gap-3 items-end">
                {/* Contact/Phone Button */}
                <button
                    onClick={toggleContact}
                    className="bg-blue-500 hover:bg-blue-600 text-white p-3.5 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center animate-bounce-slow"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                </button>

                {/* Chatbot Button */}
                <button
                    onClick={toggleChatbot}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
                    title="Chatbot hỗ trợ"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </button>

                {/* Chat Button */}
                <button
                    onClick={toggleChat}
                    className="bg-primary-600 hover:bg-primary-700 text-white p-3.5 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center relative"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {unreadCount > 0 && !showChat && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                        </span>
                    )}
                </button>
            </div>

        </div>
    );
};

export default FloatingWidget;
