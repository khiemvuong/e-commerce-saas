'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle, ShoppingBag } from 'lucide-react';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { useQuery } from '@tanstack/react-query';

const Hero = () => {
  const [banners, setBanners] = useState<string[]>(["https://ik.imagekit.io/khiemvuong/hero_endframe__cvklg0xk3w6e_large%202.png?updatedAt=1761726370763"]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data } = useQuery({
        queryKey: ['customizations'],
        queryFn: async () => {
            const res = await axiosInstance.get('/admin/api/get-all-customizations');
            return res.data;
        },
    });

    useEffect(() => {
        if (data?.images) {
            const bannerImages = data.images
                .filter((img: any) => img.type === 'banner')
                .map((img: any) => img.file_url);
            
            if (bannerImages.length > 0) {
                setBanners(bannerImages);
            }
        }
    }, [data]);

    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners]);

  const scrollToProducts = () => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      aria-label="Hero"
      className="relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0f0f0f]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 py-16 md:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-center lg:text-left"
            >

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
                Discover Amazing Deals at{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                  Ilan Shop
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-400 max-w-xl mx-auto lg:mx-0">
                Your premier destination for cutting-edge technology and exclusive products. 
                Up to 10% off with voucher codes.
              </p>

              {/* Action Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={scrollToProducts}
                  className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 w-full sm:w-auto overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Shop Now
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>

                <a
                  href="/products"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white border-2 border-white/20 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-300 w-full sm:w-auto"
                >
                  Explore Collections
                </a>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                  <span>Authenticity Guaranteed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                  <span>Secure Checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                  <span>Fast Shipping</span>
                </div>
              </div>
            </motion.div>

            {/* Right visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="relative h-96 lg:h-[500px]"
            >
              {/* Gradient blur effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
              
              {/* Background icon */}
              <ShoppingBag 
                className="absolute inset-0 w-full h-full text-white/5" 
                strokeWidth={0.3} 
              />

              {/* Banner image */}
              <motion.div 
                className="relative h-full flex items-center justify-center w-full"
                animate={{ y: [-15, 15, -15] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 5, 
                  ease: "easeInOut" 
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentIndex}
                    src={banners[currentIndex]}
                    alt="Banner Image"
                    initial={{ opacity: 0, x: 50, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -50, scale: 0.95 }}
                    transition={{ duration: 0.5 }}
                    className="absolute w-full h-full object-contain drop-shadow-2xl"
                    draggable={false}
                  />
                </AnimatePresence>
              </motion.div>          
              {/* Floating accent circles */}
              <div className="absolute top-10 right-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <div className="absolute bottom-10 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-75" />
              <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-75" />
              </motion.div>
          </div>
        </div>
      </div>

      {/* Pagination dots */}
      {/* <nav 
        aria-label="hero pagination" 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 justify-center items-center z-20"
      >
        <span className="w-8 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600" />
        <span className="w-2 h-2 rounded-full bg-white/40 hover:bg-white/60 transition-colors cursor-pointer" />
        <span className="w-2 h-2 rounded-full bg-white/40 hover:bg-white/60 transition-colors cursor-pointer" />
        <span className="w-2 h-2 rounded-full bg-white/40 hover:bg-white/60 transition-colors cursor-pointer" />
        <span className="w-2 h-2 rounded-full bg-white/40 hover:bg-white/60 transition-colors cursor-pointer" />
      </nav> */}
    </section>
  );
};

export default Hero;