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

  // Determine if header should be transparent (only on homepage and when not scrolled)
  const isTransparent = pathname === '/' && !isScrolled;

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
  
  // Logic logo: Transparent (ScrollTop & Home) -> Logo[1] (White logo usually)
  //             White Bg (Scrolled or Inner Page) -> Logo[0] (Dark/Original logo)
  const logoUrl = isTransparent 
    ? (logos.length >= 2 ? logos[1]?.file_url : logos[0]?.file_url) 
    : logos[0]?.file_url;

  return (
    <header className={`w-full fixed top-0 left-0 z-50 transition-all duration-300 ${
      !isTransparent 
        ? 'bg-white/95 backdrop-blur-md shadow-md' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all ${
          !isTransparent ? 'h-20' : 'h-24'
        }`}>
          
          {/* Left: Logo */}
          <Link href="/" className="flex items-center shrink-0 group">
            <div className={`overflow-hidden transition-all duration-300`}>
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className={`object-contain transition-all duration-300 ${!isTransparent ? 'h-16' : 'h-20'}`}
                />
              ) : (
                <IlanLogo3 
                  size={!isTransparent ? 140 : 200} 
                  className={`transition-colors duration-300 ${isTransparent ? 'text-white' : 'text-[#C9A86C]'}`}
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
                  className={`relative font-medium transition-colors text-base tracking-wide ${
                    isActive
                      ? 'text-[#C9A86C] font-semibold'
                      : isTransparent 
                        ? 'text-white/90 hover:text-white' 
                        : 'text-gray-700 hover:text-[#C9A86C]'
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
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#C9A86C] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className={`flex items-center gap-3 md:gap-4 transition-colors duration-300 ${
            isTransparent ? 'text-white' : 'text-gray-700'
          }`}>
            {/* User Menu */}
            <UserMenu user={user} isTransparent={isTransparent} />

            {/* Wishlist */}
            <Link 
              href="/wishlist" 
              className={`relative p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                isTransparent 
                  ? 'hover:bg-white/10 text-white' 
                  : 'hover:bg-gray-100 text-gray-700 hover:text-[#C9A86C]'
              }`}
            >
              <Heart size={22} />
              {wishlist?.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#C9A86C] text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-sm">
                  {wishlist.length > 99 ? '99+' : wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link 
              href="/cart" 
              className={`relative p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                isTransparent 
                  ? 'hover:bg-white/10 text-white' 
                  : 'hover:bg-gray-100 text-gray-700 hover:text-[#C9A86C]'
              }`}
            >
              <ShoppingCart size={22} />
              {cart?.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#C9A86C] text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-sm">
                  {cart.length > 99 ? '99+' : cart.length}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className={`md:hidden p-2 rounded-full transition-colors ${
                isTransparent 
                   ? 'hover:bg-white/10 text-white' 
                   : 'hover:bg-gray-100 text-gray-700'
              }`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-xl animate-in slide-in-from-top-2 duration-200"
        >
          <nav className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-2">
            {navItems.map((item: any, index: number) => {
              const isActive = pathname === item.href || 
                              (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`block py-3 px-2 font-medium border-b border-gray-100 last:border-0 transition-colors text-lg ${
                    isActive
                      ? 'text-[#C9A86C] font-bold'
                      : 'text-gray-800 hover:text-[#C9A86C]'
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
