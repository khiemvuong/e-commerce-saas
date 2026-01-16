'use client';
import Link from "next/link";
import { Heart, ShoppingCart, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import useUser from "apps/user-ui/src/hooks/useUser";
import { useStore } from "apps/user-ui/src/store";
import IlanLogo3 from "apps/user-ui/src/assets/svgs/ilan-logo-3";
import { navItems } from "apps/user-ui/src/configs/constants";
import { usePathname } from 'next/navigation';
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import UserMenu from "./user-menu";

const Header = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  const { data: customizationData } = useQuery({
    queryKey: ['customizations'],
    queryFn: async () => {
      const res = await axiosInstance.get('/admin/api/get-all-customizations');
      return res.data;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logos = (customizationData?.images?.filter((img: any) => img.type === 'logo') || [])
    .sort((a: any, b: any) => a.id.localeCompare(b.id));
  const logoUrl = logos.length >= 2 ? logos[0].file_url : logos[0]?.file_url || null;

  return (
    <header className={`w-full sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white shadow-md' 
        : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all ${
          isScrolled ? 'h-16' : 'h-20'
        }`}>
          
          {/* Left: Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <div className={`overflow-hidden transition-all ${isScrolled ? 'w-[140px]' : 'w-[180px] md:w-[220px]'}`}>
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className={`object-contain transition-all ${isScrolled ? 'h-14' : 'h-16 md:h-20'}`}
                />
              ) : (
                <IlanLogo3 
                  size={isScrolled ? 140 : 200} 
                  className="transition-transform"
                />              
              )}
            </div>
          </Link>

          {/* Center: Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item: any, index: number) => {
              const isActive = pathname === item.href || 
                              (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`relative font-medium transition-colors ${
                    isScrolled ? 'text-[15px]' : 'text-base'
                  } ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                  onClick={(e) => {
                    if (item.href === pathname) {
                      e.preventDefault();
                      window.location.href = item.href;
                    }
                  }}
                >
                  {item.title}
                  {isActive && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* User Menu */}
            <UserMenu user={user} />

            {/* Wishlist */}
            <Link 
              href="/wishlist" 
              className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-red-500 transition"
            >
              <Heart size={isScrolled ? 20 : 22} />
              {wishlist?.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {wishlist.length > 99 ? '99+' : wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link 
              href="/cart" 
              className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition"
            >
              <ShoppingCart size={isScrolled ? 20 : 22} />
              {cart?.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {cart.length > 99 ? '99+' : cart.length}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg animate-in slide-in-from-top-2 duration-200"
        >
          <nav className="max-w-7xl mx-auto px-4 py-3">
            {navItems.map((item: any, index: number) => {
              const isActive = pathname === item.href || 
                              (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`block py-3 px-2 font-medium border-b border-gray-50 last:border-0 transition-colors ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (item.href === pathname) {
                      window.location.href = item.href;
                    }
                  }}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
