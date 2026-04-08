import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminChatPage = () => {
    const [conversations, setConversations] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const pollInterval = useRef(null);
    const prevMessageCount = useRef(0);
    const shouldAutoScroll = useRef(true);

    // Chỉ scroll xuống khi user đang ở gần cuối hoặc có tin nhắn mới
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Kiểm tra user có đang ở gần cuối khung chat không
    const handleChatScroll = () => {
        const container = chatContainerRef.current;
        if (!container) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        // Nếu cách đáy < 100px thì coi như đang ở cuối
        shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;
    };

    useEffect(() => {
        // Chỉ auto-scroll khi có tin nhắn mới VÀ user đang ở gần cuối
        if (messages.length > prevMessageCount.current && shouldAutoScroll.current) {
            scrollToBottom();
        }
        prevMessageCount.current = messages.length;
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const { data } = await api.get('/messages/admin/conversations');
            setConversations(data);
        } catch (error) {
            console.error('Lỗi lấy danh sách hội thoại:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId) => {
        if (!userId) return;
        try {
            const { data } = await api.get(`/messages/${userId}`);
            setMessages(data);

            // Mark as read
            const hasUnread = data.some(m => !m.isRead && m.sender === userId);
            if (hasUnread) {
                await api.put('/messages/mark-read', { senderId: userId });
                fetchConversations(); // Update unread dot in list
            }
        } catch (error) {
            console.error('Lỗi lấy tin nhắn:', error);
        }
    };

    useEffect(() => {
        fetchConversations();

        // Poll conversations and active chat every 3 seconds
        pollInterval.current = setInterval(() => {
            fetchConversations();
            if (activeUser) {
                fetchMessages(activeUser._id);
            }
        }, 3000);

        return () => clearInterval(pollInterval.current);
    }, [activeUser]);

    const handleSelectUser = (user) => {
        setActiveUser(user);
        setMessages([]); // clear current
        prevMessageCount.current = 0;
        shouldAutoScroll.current = true;
        fetchMessages(user._id);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeUser) return;

        try {
            const { data } = await api.post('/messages', {
                receiverId: activeUser._id,
                content: messageInput
            });
            setMessages([...messages, data]);
            setMessageInput('');
            fetchConversations(); // Update side list (lastMessage)
        } catch (error) {
            console.error('Lỗi gửi tin nhắn:', error);
            toast.error('Không thể gửi tin nhắn.');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="fade-in pb-10 flex flex-col h-[85vh]">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Tin nhắn hỗ trợ</h1>
                <Link to="/admin" className="text-gray-500 hover:underline">Về Dashboard</Link>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex">
                {/* Sidebar - Conversations */}
                <div className="w-1/3 border-r border-gray-100 flex flex-col">
                    <div className="p-4 border-b bg-gray-50 shrink-0">
                        <h2 className="font-semibold text-gray-700">Khách hàng cần hỗ trợ</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                Chưa có yêu cầu hỗ trợ nào.
                            </div>
                        ) : (
                            conversations.map((conv, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleSelectUser(conv.user)}
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors flex items-start gap-3 ${activeUser?._id === conv.user._id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-lg shrink-0">
                                        {conv.user.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className={`font-semibold text-sm truncate ${conv.unreadCount > 0 ? 'text-black' : 'text-gray-700'}`}>
                                                {conv.user.name}
                                            </h3>
                                            {conv.unreadCount > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                            {conv.lastMessage?.content || "Khách hàng mới"}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="w-2/3 flex flex-col bg-gray-50">
                    {!activeUser ? (
                        <div className="m-auto flex flex-col items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p>Chọn một khách hàng để bắt đầu chat</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 bg-white border-b flex items-center gap-3 shrink-0">
                                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-lg">
                                    {activeUser.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{activeUser.name}</h3>
                                    <p className="text-xs text-gray-500">{activeUser.email}</p>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                                {messages.length === 0 ? (
                                    <div className="text-center text-gray-400 text-sm mt-10">
                                        Chưa có tin nhắn nào.
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isAdmin = !msg.receiver; // if not receiver, it means user sent to admin -> false. WAIT, receiver null means sent to Admin.
                                        // If msg.sender === activeUser._id -> Custom sent it (isCustomer = true)
                                        // If msg.sender !== activeUser._id -> Admin sent it (isCustomer = false)
                                        const isCustomer = msg.sender === activeUser._id;

                                        return (
                                            <div key={idx} className={`flex max-w-[70%] ${isCustomer ? 'mr-auto justify-start' : 'ml-auto justify-end'}`}>
                                                <div className={`p-3 rounded-2xl shadow-sm text-sm ${isCustomer
                                                    ? 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                                    : 'bg-primary-600 text-white rounded-br-none'
                                                    }`}>
                                                    {msg.content}
                                                    <div className={`text-[10px] mt-1 text-right ${isCustomer ? 'text-gray-400' : 'text-primary-200'}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="p-4 bg-white border-t shrink-0">
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder={`Trả lời ${activeUser.name}...`}
                                        className="flex-1 input-field"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim()}
                                        className="btn btn-primary px-6 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        Gửi
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChatPage;
