'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Store, LayoutDashboard, ArrowRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance';
import axios from 'axios';
const SellerSuccessPage = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    // Hàm bắn pháo giấy
    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults, particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults, particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    };

    useEffect(() => {
        const verifySellerStatus = async () => {
            try {

                await axios.get('/auth/api/login-seller'); 
                // Kích hoạt hiệu ứng chúc mừng
                triggerConfetti();
                setIsLoading(false);
                toast.success("Tài khoản thanh toán đã được kích hoạt!");
            } catch (error) {
                console.error("Lỗi cập nhật trạng thái:", error);
                setIsLoading(false);
                // Vẫn cho hiện success nhưng báo nhẹ
                toast.success("Kết nối thành công. Vui lòng đăng nhập lại nếu cần.");
            }
        };

        verifySellerStatus();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                <h2 className="text-xl font-medium text-gray-700">Đang xác thực kết nối với Stripe...</h2>
                <p className="text-gray-500 mt-2">Vui lòng không tắt trình duyệt.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Header Section */}
                <div className="bg-green-600 p-8 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce-slow">
                            <CheckCircle size={48} className="text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Thiết lập thành công!</h1>
                        <p className="text-green-100 text-lg max-w-lg mx-auto">
                            Tài khoản người bán của bạn đã được kết nối với Stripe. Bây giờ bạn đã sẵn sàng để nhận thanh toán.
                        </p>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-8 md:p-12">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                        Bạn muốn làm gì tiếp theo?
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Option 1: Create Shop */}
                        <div className="group border border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer bg-white">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Store size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xem cửa hàng</h3>
                            <p className="text-gray-500 text-sm mb-4">
                                Truy cập trang cửa hàng của bạn để xem giao diện trước khách hàng.
                            </p>
                            <Link 
                                href="/" 
                                className="inline-flex items-center text-blue-600 font-medium hover:underline"
                            >
                                Xem cửa hàng <ArrowRight size={16} className="ml-1" />
                            </Link>
                        </div>

                        {/* Option 2: Go to Dashboard */}
                        <div className="group border border-gray-200 rounded-xl p-6 hover:border-gray-800 hover:shadow-md transition-all cursor-pointer bg-white">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 text-gray-700 group-hover:bg-gray-800 group-hover:text-white transition-colors">
                                <LayoutDashboard size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Vào trang quản lý</h3>
                            <p className="text-gray-500 text-sm mb-4">
                                Xem tổng quan tài khoản, cài đặt thanh toán và quản lý đơn hàng.
                            </p>
                            <Link 
                                href="/dashboard" 
                                className="inline-flex items-center text-gray-700 font-medium hover:underline"
                            >
                                Đến Dashboard <ArrowRight size={16} className="ml-1" />
                            </Link>
                        </div>
                    </div>

                    <div className="mt-10 text-center border-t border-gray-100 pt-6">
                        <p className="text-gray-400 text-sm">
                            Cần hỗ trợ? <a href="/contact" className="text-gray-600 hover:text-black underline">Liên hệ CSKH</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerSuccessPage;