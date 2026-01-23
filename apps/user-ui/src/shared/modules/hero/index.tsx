'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Shield, Truck, Award, Sparkles } from 'lucide-react';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

const Hero = () => {
  const [banners, setBanners] = useState<string[]>([]);
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

  const trustBadges = [
    { icon: Shield, label: 'Authentic Products', sublabel: '100% Genuine' },
    { icon: Truck, label: 'Fast Delivery', sublabel: 'Within 2-3 Days' },
    { icon: Award, label: 'Premium Quality', sublabel: 'Top Rated' },
  ];

  return (
    <section
      aria-label="Hero"
      className="relative min-h-[90vh] overflow-hidden bg-[#1a0f1a]"
    >
      {/* Luxury Background Layers - Deep Purple/Brown Theme */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E0F1E] via-[#0F050F] to-[#1E0F1E] z-0" />
        
        {/* Golden Bokeh / Glowing Spots */}
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-[#C9A86C]/10 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[5%] w-[600px] h-[600px] bg-[#C9A86C]/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        
        {/* Sharp Golden Orbs (The "spots" requested) */}
        <div className="absolute top-[20%] right-[15%] w-4 h-4 bg-[#FFE8C2] rounded-full blur-[2px] animate-fade-in-out shadow-[0_0_15px_#C9A86C]" />
        <div className="absolute bottom-[30%] left-[5%] w-3 h-3 bg-[#FFE8C2] rounded-full blur-[1px] animate-fade-in-out delay-500 shadow-[0_0_10px_#C9A86C]" />
        
        {/* Subtle noise texture for premium feel */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="py-20 md:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              {/* Luxury Pill Badge */}
              <div className="inline-flex items-center gap-2 px-6 py-2 mb-8 rounded-full border border-[#C9A86C] bg-[#1a0f1a]/50 backdrop-blur-sm shadow-[0_0_15px_rgba(201,168,108,0.2)]">
                <Sparkles className="w-4 h-4 text-[#C9A86C]" />
                <span className="text-[#C9A86C] text-sm font-bold tracking-[0.2em] uppercase">
                  Premium Collection
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
                <span className="text-white drop-shadow-lg">Discover</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFE8C2] via-[#C9A86C] to-[#B8956A] drop-shadow-[0_2px_10px_rgba(201,168,108,0.3)]">
                  Luxury Living
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-300/90 max-w-lg mx-auto lg:mx-0 leading-relaxed font-light">
                Curated collections of premium products designed for those who appreciate the finer things in life.
              </p>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={scrollToProducts}
                  className="group relative w-full sm:w-auto overflow-hidden rounded-full shadow-[0_0_20px_rgba(201,168,108,0.4)] hover:scale-105 transition-transform duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#C9A86C] to-[#B8956A]" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <div className="relative flex items-center justify-center gap-3 px-10 py-4 text-[#1a0f1a] font-bold">
                    <span>Explore Collection</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>

                <Link
                  href="/products"
                  className="group inline-flex items-center justify-center px-10 py-4 text-[#C9A86C] font-semibold border border-[#C9A86C]/50 rounded-full hover:bg-[#C9A86C]/10 transition-all duration-300 w-full sm:w-auto backdrop-blur-sm"
                >
                  <span>View All Products</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-16 pt-8 border-t border-[#C9A86C]/20">
                <div className="grid grid-cols-3 gap-4 md:gap-8">
                  {trustBadges.map((badge, index) => (
                    <div
                      key={badge.label}
                      className="flex flex-col items-center lg:items-start gap-3 group"
                    >
                      <div className="w-12 h-12 rounded-full border border-[#C9A86C]/30 flex items-center justify-center group-hover:border-[#C9A86C] group-hover:shadow-[0_0_10px_rgba(201,168,108,0.3)] transition-all duration-300">
                        <badge.icon className="w-5 h-5 text-[#C9A86C]" />
                      </div>
                      <div className="text-center lg:text-left">
                        <p className="text-white text-sm font-semibold">{badge.label}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{badge.sublabel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Visual - Product Showcase with Golden Ring */}
            <div className="relative h-[450px] lg:h-[600px] order-1 lg:order-2 flex items-center justify-center">
              {/* Golden Ring Circle BG */}
              <div className="absolute w-[400px] h-[400px] lg:w-[500px] lg:h-[500px] rounded-full border border-[#C9A86C] shadow-[0_0_30px_rgba(201,168,108,0.15)] animate-spin-slow-reverse" />
              <div className="absolute w-[350px] h-[350px] lg:w-[450px] lg:h-[450px] rounded-full border border-[#C9A86C]/30" />
              
              {/* Product Frame */}
              <div className="relative w-full h-full max-w-[500px] max-h-[500px] border border-[#C9A86C]/30 rounded-[3rem] p-8 backdrop-blur-sm bg-white/5 shadow-2xl">
                 {/* Decorative Corner Orbs */}
                 <div className="absolute top-6 left-6 w-3 h-3 bg-[#C9A86C] rounded-full shadow-[0_0_10px_#C9A86C]" />
                 <div className="absolute bottom-6 right-6 w-3 h-3 bg-[#C9A86C] rounded-full shadow-[0_0_10px_#C9A86C]" />

                 {/* Banner Image */}
                 <div className="w-full h-full relative flex items-center justify-center">
                    {banners.length > 0 ? (
                        <AnimatePresence mode="wait">
                            <motion.img 
                                key={currentIndex}
                                src={banners[currentIndex]} 
                                alt="Luxury Product" 
                                className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.05, opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            />
                        </AnimatePresence>
                    ) : (
                        /* Skeleton Loading State */
                         <div className="w-[80%] h-[80%] bg-gradient-to-br from-white/5 to-white/10 rounded-3xl animate-pulse flex items-center justify-center">
                            <Sparkles className="w-12 h-12 text-[#C9A86C]/20" />
                         </div>
                    )}
                 </div>
              </div>

               {/* Floating Orbs - Keep minimal subtle movement or remove if needed, keeping for now as it's not "outside in" entrance */}
              <motion.div 
                animate={{ y: [-10, 10, -10] }} 
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 w-16 h-16 rounded-full border border-[#C9A86C]/40 backdrop-blur-md" 
              />
            </div>
          </div>
        </div>
      </div>

       {/* Pagination dots */}
       {banners.length > 1 && (
        <nav
          aria-label="Hero banner pagination"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 items-center z-20"
        >
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-300 cursor-pointer ${
                index === currentIndex
                  ? 'w-10 h-1.5 bg-[#C9A86C] rounded-full shadow-[0_0_10px_#C9A86C]'
                  : 'w-2 h-2 bg-gray-600 hover:bg-gray-400 rounded-full'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </nav>
      )}
    </section>
  );
};

export default Hero;