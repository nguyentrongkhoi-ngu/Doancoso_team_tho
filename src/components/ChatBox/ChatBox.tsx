'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Message } from '@/types/chat';
import { useChat } from '@/hooks/useChat';
import { IoMdSend } from 'react-icons/io';
import { FiMinimize2, FiMaximize2 } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { MdOutlineDelete, MdOutlineClose } from 'react-icons/md';
import { BsChatDots } from 'react-icons/bs';
import { format } from 'date-fns';
import { BiSolidMessageRoundedDetail } from 'react-icons/bi';
import { FaRegSmile } from 'react-icons/fa';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import ProductSuggestions from './ProductSuggestion';
import { formatCurrency } from '@/utils/format';

// Simple translation function instead of using next-i18next
const t = (key: string): string => {
  const translations: Record<string, string> = {
    'Open chat': 'Mở chat',
    'Customer Support': 'Hỗ trợ khách hàng',
    'Type your message...': 'Nhập tin nhắn...',
    'Send': 'Gửi',
    'Quick Actions': 'Thao tác nhanh',
    'Order Status': 'Trạng thái đơn hàng',
    'Shipping Info': 'Thông tin vận chuyển',
    'Return Policy': 'Chính sách đổi trả',
    'Contact Support': 'Liên hệ hỗ trợ',
    'Payment Methods': 'Phương thức thanh toán',
    'Promotions': 'Khuyến mãi',
    'My Account': 'Tài khoản',
    'Clear Chat': 'Xóa cuộc trò chuyện',
    'Close': 'Đóng',
    'Minimize': 'Thu nhỏ',
    'Maximize': 'Mở rộng',
    'Chat History': 'Lịch sử trò chuyện',
    'Add emoji': 'Thêm emoji',
    'New message': 'Tin nhắn mới',
    'Show more': 'Xem thêm',
    'Show less': 'Thu gọn',
    'Product Recommendations': 'Gợi ý sản phẩm',
    'Membership Benefits': 'Quyền lợi thành viên',
    'Installment Purchase': 'Mua trả góp',
    'Warranty Policy': 'Chính sách bảo hành',
    'Store Locations': 'Địa điểm cửa hàng',
    'Compare Products': 'So sánh sản phẩm',
  };
  return translations[key] || key;
};

// Quick action buttons for common questions
const quickActions = [
  { label: 'Order Status', message: 'Làm thế nào để kiểm tra trạng thái đơn hàng của tôi?' },
  { label: 'Shipping Info', message: 'Bạn có thể cho tôi biết về chính sách vận chuyển không?' },
  { label: 'Return Policy', message: 'Chính sách đổi trả của cửa hàng là gì?' },
  { label: 'Payment Methods', message: 'Các phương thức thanh toán được chấp nhận là gì?' },
  { label: 'Promotions', message: 'Có chương trình khuyến mãi nào đang diễn ra không?' },
  { label: 'Contact Support', message: 'Tôi muốn liên hệ với nhân viên hỗ trợ.' },
  { label: 'Product Recommendations', message: 'Bạn có thể giới thiệu cho tôi một số sản phẩm phổ biến không?' },
  { label: 'Membership Benefits', message: 'Có những lợi ích gì khi trở thành thành viên?' },
  { label: 'Installment Purchase', message: 'Tôi có thể mua hàng trả góp không?' },
  { label: 'Warranty Policy', message: 'Chính sách bảo hành các sản phẩm là gì?' },
  { label: 'Store Locations', message: 'Cửa hàng của bạn có địa điểm nào?' },
  { label: 'Compare Products', message: 'Làm thế nào để so sánh các sản phẩm?' },
];

const ChatBox = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [newMessageAlert, setNewMessageAlert] = useState(false);
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showAllQuickActions, setShowAllQuickActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { messages, sendMessage, isLoading, clearChat, language, currentProduct } = useChat();

  // Đánh dấu khi đang nhập liệu
  const handleTyping = useCallback(() => {
    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Tự động điều chỉnh kích thước của textarea
  const autoResizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
      handleTyping();
    }
  }, [handleTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.addEventListener('input', autoResizeTextarea);
    }
    return () => {
      if (textareaRef.current) {
        textareaRef.current.removeEventListener('input', autoResizeTextarea);
      }
    };
  }, [autoResizeTextarea]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isExpanded && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isExpanded, isMinimized]);

  // Hide quick actions after first user message
  useEffect(() => {
    if (messages.some(msg => msg.role === 'user')) {
      setShowQuickActions(false);
    }
  }, [messages]);

  // Hiển thị thông báo khi có tin nhắn mới và chatbox đang thu nhỏ hoặc không mở rộng
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && (isMinimized || !isExpanded)) {
      setNewMessageAlert(true);
      // Tự động ẩn thông báo sau 10 giây
      const timer = setTimeout(() => {
        setNewMessageAlert(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [messages, isMinimized, isExpanded]);

  // Kiểm tra xem có tin nhắn mới ngoài tin nhắn chào mừng không
  const hasMessages = messages.length > 1;

  // Kiểm tra thiết bị di động
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Kiểm tra ngay khi component được render
    checkIfMobile();
    
    // Lắng nghe sự kiện resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup event listener khi component unmount
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;
    await sendMessage(message);
    setMessage('');
    setShowEmojiPicker(false);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleQuickAction = async (actionMessage: string) => {
    await sendMessage(actionMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format timestamp to readable format
  const formatTimestamp = (timestamp?: Date) => {
    if (!timestamp) return '';
    return format(new Date(timestamp), 'HH:mm');
  };

  // Thêm emoji vào tin nhắn
  const addEmoji = (emoji: any) => {
    setMessage(prev => prev + emoji.native);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Xử lý xóa lịch sử chat
  const handleClearChat = () => {
    clearChat();
    setShowClearConfirm(false);
    setShowQuickActions(true);
  };

  // Xử lý khi nhấp vào nút đóng
  const handleClose = () => {
    setIsMinimized(false); // Đảm bảo không ở chế độ thu nhỏ
    setIsExpanded(false); // Thu gọn thành biểu tượng
    setNewMessageAlert(false); // Xóa thông báo tin nhắn mới
    setShowEmojiPicker(false); // Đóng emoji picker nếu đang mở
  };

  // Xử lý khi nhấp vào nút mở rộng/thu nhỏ
  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (newMessageAlert) setNewMessageAlert(false);
    setShowEmojiPicker(false);
  };

  // Xử lý khi nhấp vào biểu tượng chat
  const handleToggleExpand = () => {
    setIsExpanded(true);
    setIsMinimized(false);
    setNewMessageAlert(false);
    setIsInitialRender(true);
    // Đảm bảo cuộn xuống dưới khi mở rộng
    setTimeout(scrollToBottom, 100);
    
    // Reset isInitialRender after animations complete
    setTimeout(() => {
      setIsInitialRender(false);
    }, 1000);
  };

  // Nhóm tin nhắn theo ngày
  const groupedMessages = useMemo(() => {
    return messages.reduce<{ date: string; messages: Message[] }[]>((groups, message) => {
      if (!message.timestamp) return groups;
      
      const dateStr = format(new Date(message.timestamp), 'dd/MM/yyyy');
      const existingGroup = groups.find(group => group.date === dateStr);
      
      if (existingGroup) {
        existingGroup.messages.push(message);
      } else {
        groups.push({ date: dateStr, messages: [message] });
      }
      
      return groups;
    }, []);
  }, [messages]);

  // Đếm số tin nhắn chưa đọc
  const unreadCount = messages.filter(msg => msg.role === 'assistant').length - 1;

  // Format nội dung tin nhắn để hiển thị đúng URL, xuống dòng
  const formatContent = (content: string) => {
    // Tách các dòng
    const lines = content.split('\n');
    
    // Xử lý từng dòng
    return (
      <div className="whitespace-pre-wrap">
        {lines.map((line, lineIndex) => {
          // Xử lý các URL
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const parts = line.split(urlRegex);
          
          return (
            <div key={lineIndex} className={lineIndex > 0 ? 'mt-1' : ''}>
              {parts.map((part, partIndex) => {
                if (part.match(urlRegex)) {
                  return (
                    <a 
                      key={partIndex}
                      href={part}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {part}
                    </a>
                  );
                }
                
                // Xử lý đoạn văn bản thông thường
                // Tô đậm các từ trong dấu *bold*
                const boldParts = part.split(/(\*[^*]+\*)/g);
                
                return (
                  <span key={partIndex}>
                    {boldParts.map((boldPart, boldIndex) => {
                      if (boldPart.startsWith('*') && boldPart.endsWith('*')) {
                        return (
                          <strong key={boldIndex}>
                            {boldPart.slice(1, -1)}
                          </strong>
                        );
                      }
                      return <span key={boldIndex}>{boldPart}</span>;
                    })}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // Hiển thị thông báo về sản phẩm hiện tại
  const currentProductNotice = useMemo(() => {
    if (!currentProduct) return null;
    
    // Xác định URL hình ảnh sản phẩm
    let productImageUrl = '/images/product-placeholder.jpg';
    
    // Sử dụng ảnh chính của sản phẩm nếu có
    if (currentProduct.imageUrl) {
      productImageUrl = currentProduct.imageUrl;
    }
    
    // Nếu sản phẩm có mảng images, sử dụng ảnh đầu tiên
    if (currentProduct.images && currentProduct.images.length > 0) {
      productImageUrl = currentProduct.images[0].imageUrl;
    }
    
    return (
      <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-100 animate-fadeIn">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            <div className="relative w-12 h-12 rounded-md overflow-hidden">
              <img 
                src={productImageUrl} 
                alt={currentProduct.name}
                className="object-cover w-full h-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/product-placeholder.jpg';
                }}
              />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">
              {language === 'vi' ? 'Bạn đang xem:' : 'You are viewing:'}
            </p>
            <p className="text-sm font-bold text-blue-900 line-clamp-1">{currentProduct.name}</p>
            <p className="text-xs text-blue-700">{formatCurrency(currentProduct.price, 'VND')}</p>
          </div>
        </div>
        <div className="mt-2 text-xs text-blue-600">
          {language === 'vi' 
            ? 'Bạn có thể hỏi tôi về thông tin sản phẩm này.' 
            : 'You can ask me about this product.'}
        </div>
      </div>
    );
  }, [currentProduct, language]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isExpanded ? (
        <div className="relative">
          <button
            onClick={handleToggleExpand}
            className="bg-primary text-white rounded-full p-4 shadow-lg hover:bg-primary-dark transition-colors flex items-center justify-center hover-scale"
            aria-label={t('Open chat')}
          >
            <BiSolidMessageRoundedDetail className="w-6 h-6" />
            {newMessageAlert && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-blink">
                {unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : '1'}
              </span>
            )}
          </button>
          {newMessageAlert && (
            <div className="absolute bottom-14 right-0 bg-white p-3 rounded-lg shadow-lg w-64 border border-gray-200 animate-scaleIn">
              <p className="text-sm font-medium">{t('New message')}</p>
              <p className="text-xs text-gray-500 truncate">
                {messages[messages.length - 1]?.content.substring(0, 50)}
                {messages[messages.length - 1]?.content.length > 50 ? '...' : ''}
              </p>
              <button 
                onClick={handleToggleExpand}
                className="mt-2 text-xs text-primary hover:text-primary-dark"
              >
                Xem tin nhắn
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`bg-white rounded-lg shadow-xl transition-all duration-300 
            ${isMobile 
              ? isMinimized 
                ? 'w-full max-w-sm h-14 left-0 right-0 mx-auto' 
                : 'w-full h-[calc(100vh-2rem)] left-0 right-0 top-0 m-2 rounded-xl'
              : isMinimized 
                ? 'w-72 h-14' 
                : 'w-96 max-h-[calc(100vh-2rem)] h-[600px]'
            } animate-fadeIn`}
          style={{ 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            position: isMobile && !isMinimized ? 'fixed' : 'relative',
          }}
        >
          <div className="flex items-center justify-between p-3 border-b bg-primary text-white rounded-t-lg">
            <div className="flex items-center">
              <BsChatDots className="w-5 h-5 mr-2" />
              <h3 className="font-semibold">
                {t('Customer Support')}
              </h3>
              {language === 'en' && (
                <span className="ml-2 text-xs bg-white text-primary px-1.5 py-0.5 rounded-full">EN</span>
              )}
            </div>
            <div className="flex gap-2">
              {hasMessages && !showClearConfirm && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-white hover:text-gray-200 transition-colors"
                  aria-label={t('Clear Chat')}
                  title={t('Clear Chat')}
                >
                  <MdOutlineDelete className="w-5 h-5" />
                </button>
              )}
              
              {showClearConfirm && (
                <div className="absolute right-12 top-12 bg-white shadow-md rounded-lg p-3 border z-10 text-gray-800 animate-scaleIn">
                  <p className="text-sm mb-2 font-medium">Xóa lịch sử chat?</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleClearChat}
                      className="bg-red-500 text-white text-xs px-3 py-1 rounded hover:bg-red-600 transition-colors hover-scale"
                    >
                      Xóa
                    </button>
                    <button 
                      onClick={() => setShowClearConfirm(false)}
                      className="bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded hover:bg-gray-300 transition-colors hover-scale"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleToggleMinimize}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label={isMinimized ? t('Maximize') : t('Minimize')}
                title={isMinimized ? t('Maximize') : t('Minimize')}
              >
                {isMinimized ? <FiMaximize2 className="w-5 h-5" /> : <FiMinimize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label={t('Close')}
                title={t('Close')}
              >
                <MdOutlineClose className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              <div 
                ref={chatContainerRef}
                className="h-[calc(100%-8rem)] overflow-y-auto p-4 bg-gray-50 scroll-smooth"
                style={{ scrollBehavior: 'smooth' }}
              >
                {/* Hiển thị thông báo về sản phẩm hiện tại nếu có */}
                {currentProduct && currentProductNotice}
                
                {groupedMessages.map((group, groupIndex) => (
                  <div key={groupIndex} className="mb-4">
                    <div className="flex justify-center mb-2">
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        {group.date}
                      </span>
                    </div>
                    
                    {group.messages.map((msg, msgIndex) => (
                      <div
                        key={`${groupIndex}-${msgIndex}`}
                        className={`mb-3 ${
                          msg.role === 'user'
                            ? 'flex justify-end'
                            : 'flex justify-start'
                        }`}
                      >
                        <div
                          className={`p-3 rounded-lg max-w-[85%] ${
                            msg.role === 'user' 
                              ? 'ml-auto bg-blue-100 text-gray-800' 
                              : 'mr-auto bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          {formatContent(msg.content)}
                          
                          {/* Hiển thị gợi ý sản phẩm nếu có */}
                          {msg.productSuggestions && msg.productSuggestions.length > 0 && (
                            <div className="mt-2">
                              <ProductSuggestions products={msg.productSuggestions} />
                            </div>
                          )}
                          
                          {msg.timestamp && (
                            <span className={`text-xs block mt-1 ${
                              msg.role === 'user' ? 'text-gray-200' : 'text-gray-500'
                            }`}>
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && !isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gray-100 rounded-lg px-3 py-2 text-gray-500 text-sm animate-blink">
                      Đang nhập tin nhắn...
                    </div>
                  </div>
                )}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-white rounded-lg p-3 flex items-center shadow-sm border border-gray-100 animate-fadeInBottom">
                      <AiOutlineLoading3Quarters className="animate-spin text-primary mr-2" />
                      <span className="text-gray-600">Đang trả lời...</span>
                    </div>
                  </div>
                )}

                {/* Quick action buttons */}
                {showQuickActions && (
                  <div className="mt-4 animate-fadeInBottom">
                    <p className="text-sm text-gray-600 mb-2 font-medium">{t('Quick Actions')}:</p>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {quickActions.slice(0, 8).map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickAction(action.message)}
                          className="px-3 py-2 text-xs bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors border border-gray-200 text-left flex items-start"
                        >
                          <span>{t(action.label)}</span>
                        </button>
                      ))}
                      
                      {/* Nút "Xem thêm" để hiển thị tất cả các hành động nhanh */}
                      {quickActions.length > 8 && (
                        <button
                          onClick={() => setShowAllQuickActions(!showAllQuickActions)}
                          className="col-span-2 px-3 py-2 text-xs bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors border border-gray-200 text-center flex justify-center items-center"
                        >
                          {showAllQuickActions ? t('Show less') : t('Show more')}
                        </button>
                      )}
                      
                      {/* Hiển thị các hành động nhanh còn lại nếu người dùng nhấp vào "Xem thêm" */}
                      {showAllQuickActions && (
                        <div className="col-span-2 grid grid-cols-2 gap-2">
                          {quickActions.slice(8).map((action, index) => (
                            <button
                              key={index + 8}
                              onClick={() => handleQuickAction(action.message)}
                              className="px-3 py-2 text-xs bg-white hover:bg-gray-100 text-gray-700 rounded-lg transition-colors border border-gray-200 text-left flex items-start"
                            >
                              <span>{t(action.label)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t">
                <div className="relative">
                  {showEmojiPicker && (
                    <div className={`absolute z-10 ${isMobile ? 'bottom-14 left-0 right-0 mx-auto' : 'bottom-12 right-0'}`}>
                      <Picker 
                        data={data} 
                        onEmojiSelect={addEmoji}
                        previewPosition="none"
                        theme="light"
                        locale={language === 'vi' ? 'vi' : 'en'}
                      />
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={t('Type your message...')}
                      className="flex-1 resize-none rounded-lg border p-2 focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] max-h-[100px] overflow-y-auto"
                      disabled={isLoading}
                      rows={1}
                    />
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                      className="text-gray-500 hover:text-primary transition-colors focus:outline-none focus:text-primary"
                      type="button"
                      aria-label={t('Add emoji')}
                      title={t('Add emoji')}
                    >
                      <FaRegSmile className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={isLoading || !message.trim()}
                      className="bg-primary text-white rounded-full p-2 hover:bg-primary-dark transition-colors disabled:opacity-50 hover-scale focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      aria-label={t('Send')}
                    >
                      {isLoading ? (
                        <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
                      ) : (
                        <IoMdSend className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatBox; 