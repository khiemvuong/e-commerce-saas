'use client';
import { AlignLeft, ChevronDown, ChevronRight, Heart, ShoppingCart, Menu, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProfileIcon from '../../../assets/svgs/profile-icon';
import { navItems } from 'apps/user-ui/src/configs/constants';
import useUser from "apps/user-ui/src/hooks/useUser";
import { useStore } from 'apps/user-ui/src/store';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';

const HeaderBottom = () => {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<Record<string, string[]>>({});
  const menuRef = useRef<HTMLDivElement | null>(null);
  const cart = useStore((state: any) => state.cart);
  const wishlist = useStore((state: any) => state.wishlist);
  const { user, isLoading } = useUser();

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axiosInstance.get('/product/api/get-categories');
        setCategories(data.categories || []);
        setSubCategories(data.subCategories || {});
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);
  // Sticky on scroll
  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setShow(false);
    };
    if (show) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [show]);

  return (
    <div className={`w-full transition-all duration-100 ${isSticky ? 'fixed top-0 left-0 z-[100] bg-white shadow-lg' : 'relative'}`}>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center justify-between ${isSticky ? 'py-3' : 'py-0'}`}>


        {/* All Departments Dropdown - Desktop */}
        <div
          ref={menuRef}
          className={`hidden md:block w-[260px] ${isSticky ? '-mb-2' : ''} relative`}
        >
          {/* Button */}
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="w-full cursor-pointer flex items-center justify-between px-5 h-[50px] bg-[#3a3a3a] text-white rounded-t-md"
          >
            <div className="flex items-center gap-2">
              <AlignLeft color="white" />
              <span className="text-white font-medium">All Departments</span>
            </div>
            <ChevronDown size={16} color="white" className={`transition-transform ${show ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Items  */}
          {show && (
            <div
              className="absolute top-full left-0 w-full mt-1 z-50 rounded-b-md bg-[#3a3a3a] text-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {categories.map((category: string, index: number) => {
                const hasSub = subCategories[category] && subCategories[category].length > 0;
                return (
                  <div
                    key={index}
                    className="relative"
                    onMouseEnter={() => setHoveredCategory(category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <Link
                      href={`/products?category=${encodeURIComponent(category)}`}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#2f2f2f] transition"
                    >
                      <span>{category}</span>
                      {hasSub && <ChevronRight size={16} />}
                    </Link>

                    {/* Subcategories - show on hover */}
                    {hasSub && hoveredCategory === category && (
                      <div className="absolute left-full top-0 ml-1 w-[260px] bg-[#3a3a3a] shadow-xl rounded-md border border-gray-600 z-[60]">
                        {subCategories[category].map((sub: string, subIndex: number) => (
                          <Link
                            key={subIndex}
                            href={`/products?category=${encodeURIComponent(category)}&subCategory=${encodeURIComponent(sub)}`}
                            className="block px-4 py-3 hover:bg-[#2f2f2f] transition text-sm"
                          >
                            {sub}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex items-center">
          {navItems.map((i: any, index: number) => (
            <Link
              className="px-5 font-medium text-lg hover:text-blue-600"
              href={i.href}
              key={index}
              onClick={(e) => {
                // If clicking same page, force reload to reset filters/state
                if (i.href === pathname) {
                  e.preventDefault();
                  window.location.href = i.href;
                }
              }}
            >
              {i.title}
            </Link>
          ))}
        </div>

        {/* Right Section - User Actions (only show when sticky) */}
        <div className="flex items-center">
          {isSticky && (
            <div className="flex items-center gap-6">
              {/* User Actions */}
              <div className="flex items-center gap-4">
                {/* Profile */}
                {(!isLoading && user) ? (
                  // ĐÃ ĐĂNG NHẬP: toàn khối trỏ tới /profile
                  <Link
                    href={"/profile"}
                    className="flex items-center gap-2 md:gap-3 p-1 md:px-3 md:py-2 rounded-full hover:bg-gray-100 transition"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-300 flex items-center justify-center bg-gray-100 hover:border-blue-500 transition">
                      <ProfileIcon size={18} className="text-gray-600" />
                    </div>
                    <div className="hidden lg:flex flex-col">
                      <span className="text-xs text-gray-500 font-medium leading-tight">
                        Hello,
                      </span>
                      <span className="text-sm text-gray-800 font-Roboto font-bold leading-tight truncate max-w-[100px]">
                        {user?.name ? ` ${user.name}` : ","}
                      </span>                     
                    </div>
                  </Link>
                ) : (
                  // CHƯA ĐĂNG NHẬP: avatar + nút Sign in
                  <div className="flex items-center gap-2 md:gap-3 p-1 md:px-3 md:py-2 rounded-full hover:bg-gray-100 transition">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-300 flex items-center justify-center bg-gray-100">
                      <ProfileIcon size={18} className="text-gray-600" />
                    </div>
                    <div className="hidden lg:flex flex-col">
                      <span className="text-xs text-gray-500 font-medium leading-tight">Hello,</span>
                      <Link
                        href="/login"
                        className="text-sm text-blue-600 hover:text-blue-800 font-bold transition"
                      >
                        Sign in
                      </Link>
                    </div>
                  </div>
                )}

                {/* Wishlist */}
                <Link href="/wishlist" className="relative p-2 rounded-full hover:bg-gray-100 text-gray-700 hover:text-red-500 transition">
                  <Heart size={22} className="md:w-6 md:h-6" />
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-white">
                    {wishlist?.length || 0}
                  </span>
                </Link>

                {/* Cart */}
                <Link href="/cart" className="relative p-2 rounded-full hover:bg-gray-100 text-gray-700 hover:text-blue-600 transition">
                  <ShoppingCart size={22} className="md:w-6 md:h-6" />
                  <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-white">
                    {cart?.length || 0}
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Mobile Categories Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[110] flex md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-[85%] max-w-[320px] bg-white h-full shadow-xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="p-4 border-b bg-[#3a3a3a] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlignLeft color="white" size={20} />
                <span className="font-bold text-lg text-white">All Departments</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-[#2f2f2f] rounded-full transition">
                <X size={20} color="white" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              {categories.map((category: string, index: number) => {
                const hasSub = subCategories[category] && subCategories[category].length > 0;
                return (
                  <div key={index} className="border-b border-gray-100">
                    <Link
                      href={`/products?category=${encodeURIComponent(category)}`}
                      className="flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 transition"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span>{category}</span>
                      {hasSub && <ChevronRight size={16} className="text-gray-400" />}
                    </Link>
                    {/* Subcategories */}
                    {hasSub && (
                      <div className="bg-gray-50 border-t border-gray-100">
                        {subCategories[category].map((sub: string, subIndex: number) => (
                          <Link
                            key={subIndex}
                            href={`/products?category=${encodeURIComponent(category)}&subCategory=${encodeURIComponent(sub)}`}
                            className="block px-8 py-2 text-xs text-gray-600 hover:bg-white hover:text-blue-600 transition"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {sub}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderBottom;
