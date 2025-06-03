'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Array of testimonials
const testimonials = [
    {
        name: "Nguyễn Thị Mai",
        avatar: "/images/avatars/avatar-1.png",
        role: "Giám đốc Marketing",
        rating: 5,
        comment: "Nền tảng này đã thay đổi hoàn toàn sự hiện diện trực tuyến của chúng tôi. Giao diện trực quan và các tính năng mạnh mẽ vượt quá mong đợi. Doanh số của chúng tôi đã tăng 40% kể từ khi triển khai!",
        date: "Tháng 8, 2023"
    },
    {
        name: "Trần Minh Đức",
        avatar: "/images/avatars/avatar-2.png",
        role: "Quản lý Thương mại điện tử",
        rating: 5,
        comment: "Sau khi thử nhiều giải pháp thương mại điện tử, nền tảng này nổi bật với độ tin cậy và bộ tính năng toàn diện. Hỗ trợ khách hàng xuất sắc và luôn sẵn sàng giúp đỡ.",
        date: "Tháng 9, 2023"
    },
    {
        name: "Lê Thị Hương",
        avatar: "/images/avatars/avatar-3.png",
        role: "Chủ doanh nghiệp nhỏ",
        rating: 4,
        comment: "Là chủ doanh nghiệp nhỏ, việc tìm một giải pháp thương mại điện tử giá cả phải chăng nhưng mạnh mẽ là rất quan trọng. Nền tảng này cung cấp mọi thứ tôi cần mà không làm vỡ ngân sách.",
        date: "Tháng 10, 2023"
    },
    {
        name: "Phạm Văn Hùng",
        avatar: "/images/avatars/avatar-4.png",
        role: "Giám đốc IT",
        rating: 5,
        comment: "Khả năng tích hợp rất xuất sắc. Chúng tôi đã kết nối hệ thống CRM và quản lý kho một cách liền mạch. Hiệu suất tuyệt vời ngay cả với danh mục sản phẩm rộng lớn của chúng tôi.",
        date: "Tháng 11, 2023"
    }
];

const Testimonials = () => {
    const [current, setCurrent] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    // Start or stop autoplay
    useEffect(() => {
        if (isAutoPlaying) {
            autoPlayRef.current = setInterval(() => {
                setCurrent((prev) => (prev + 1) % testimonials.length);
            }, 5000);
        }
        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
            }
        };
    }, [isAutoPlaying]);

    // Pause autoplay on hover
    const handleMouseEnter = () => setIsAutoPlaying(false);
    const handleMouseLeave = () => setIsAutoPlaying(true);

    // Navigate to previous testimonial
    const prevTestimonial = () => {
        setCurrent((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    };

    // Navigate to next testimonial
    const nextTestimonial = () => {
        setCurrent((prev) => (prev + 1) % testimonials.length);
    };

    // Set current testimonial
    const goToTestimonial = (index: number) => {
        setCurrent(index);
    };

    // Render stars based on rating
    const renderStars = (rating: number) => {
        return (
            <div className="flex space-x-1 star-rating">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        size={20} 
                        className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} 
                    />
                ))}
            </div>
        );
    };

    return (
        <section 
            className="py-16 testimonial-bg-animate"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="container px-4 mx-auto">
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Khách hàng nói gì về chúng tôi</h2>
                        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                            Khám phá lý do tại sao hàng nghìn doanh nghiệp tin tưởng nền tảng của chúng tôi cho nhu cầu thương mại điện tử.
                        </p>
                    </motion.div>
                </div>

                <div className="relative max-w-4xl mx-auto px-4">
                    {/* Quote icon decoration */}
                    <div className="absolute -top-6 -left-2 opacity-20 text-indigo-600 dark:text-indigo-400">
                        <Quote size={60} className="animated-quote" />
                    </div>
                    
                    {/* Testimonial slides */}
                    <div 
                        className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg overflow-hidden testimonial-shine card-tilt"
                        style={{ minHeight: '340px' }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.5 }}
                                className="flex flex-col h-full"
                            >
                                <div className="mb-6">
                                    {renderStars(testimonials[current].rating)}
                                </div>
                                
                                <p className="text-gray-700 dark:text-gray-200 text-lg italic mb-8">
                                    "{testimonials[current].comment}"
                                </p>
                                
                                <div className="mt-auto flex items-center">
                                    <div className="relative h-14 w-14 mr-4 rounded-full overflow-hidden avatar-glow">
                                        <Image
                                            src={testimonials[current].avatar}
                                            alt={testimonials[current].name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-lg">{testimonials[current].name}</h4>
                                        <p className="text-gray-600 dark:text-gray-400">{testimonials[current].role}</p>
                                        <p className="text-indigo-600 dark:text-indigo-400 text-sm">{testimonials[current].date}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex justify-between mt-8">
                        <button
                            onClick={prevTestimonial}
                            className="p-3 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-md hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all testimonial-nav-btn"
                            aria-label="Previous testimonial"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex items-center space-x-2">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToTestimonial(index)}
                                    className={`h-3 rounded-full transition-all ${
                                        current === index 
                                            ? 'dot-active bg-indigo-600 dark:bg-indigo-500' 
                                            : 'w-3 bg-gray-300 dark:bg-gray-600 hover:bg-indigo-400 dark:hover:bg-indigo-700'
                                    }`}
                                    aria-label={`Go to testimonial ${index + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={nextTestimonial}
                            className="p-3 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-md hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all testimonial-nav-btn"
                            aria-label="Next testimonial"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials; 