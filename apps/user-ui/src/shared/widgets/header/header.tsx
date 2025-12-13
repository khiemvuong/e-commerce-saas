'use client';
import Link from "next/link";
import { Search, Heart, ShoppingCart, X, Menu } from "lucide-react";
import { useState } from "react";
import ProfileIcon from "../../../assets/svgs/profile-icon";
import useUser from "apps/user-ui/src/hooks/useUser";
import { useStore } from "apps/user-ui/src/store";
import IlanLogo3 from "apps/user-ui/src/assets/svgs/ilan-logo-3";
import HeaderBottom from "./header-bottom";
import React from "react";
import { navItems } from "apps/user-ui/src/configs/constants";
import { usePathname } from 'next/navigation';

const Header = () => {
  const pathname = usePathname();
  const { user, isLoading } = useUser();
  const wishlist = useStore((state: any) => state.wishlist);
  const cart = useStore((state: any) => state.cart);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNavMenu, setShowNavMenu] = React.useState(false);
  const navMenuRef = React.useRef<HTMLDivElement | null>(null);
  
  return (
    <div className="w-full sticky top-0 left-0 z-50 transition-all duration-300">
      <header className={`w-full bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm transition-all duration-300 ${isSearchOpen ? 'pb-4' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Menu Button */}
        <div ref={navMenuRef} className="relative md:hidden">
          <button
            className="p-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-lg transition shadow-md hover:shadow-lg flex items-center gap-2"
            onClick={() => setShowNavMenu(!showNavMenu)}
          >
            <Menu size={20} />
          </button>

          {/* Nav Menu Dropdown */}
          {showNavMenu && (
            <div className="absolute top-full left-0 w-64 bg-gradient-to-r from-blue-600 rounded-lg to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-2xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {navItems.map((item: any, index: number) => (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center justify-between px-4 py-3 text-sm font-medium transition group border border-white/20"
                  onClick={() => {
                    setShowNavMenu(false);
                    if (item.href === pathname) {
                      window.location.href = item.href;
                    }
                  }}
                >
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

              {/* Logo */}
              <Link href="/" className="flex items-center shrink-0">
                <div className="w-[130px] md:w-auto overflow-hidden">
                  <IlanLogo3 size={220} className="transform scale-75 origin-left md:scale-100 transition-transform"/>              
                </div>
              </Link>
            </div>

            {/* Right Section: Search + User Actions */}
            <div className="flex items-center gap-3 md:gap-6">
              {/* Search box (Desktop) */}
              <div className="hidden md:flex items-center border border-gray-300 rounded-full bg-gray-50/50 overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all flex-1 max-w-[400px]">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="px-4 py-2 text-sm w-[200px] sm:w-[300px] bg-transparent outline-none font-Roboto text-gray-700"
                />
                <button className="px-4 py-2 bg-gray-900 hover:bg-black transition text-white flex items-center justify-center">
                  <Search size={18} />
                </button>
              </div>

              {/* Mobile Search Toggle */}
              <button 
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-full transition"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                {isSearchOpen ? <X size={22}/> : <Search size={22} />}
              </button>

              {/* User Actions */}
              <div className="flex items-center gap-2 md:gap-4">
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
          </div>

          {/* Mobile Search Bar (Expandable) */}
          {isSearchOpen && (
            <div className="md:hidden mt-2 pb-2 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="flex items-center border border-gray-300 rounded-full bg-gray-50 overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="px-4 py-2 text-sm w-full bg-transparent outline-none font-Roboto"
                  autoFocus
                />
                <button className="px-4 py-2 bg-gray-900 text-white">
                  <Search size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Header Bottom (Nav) - Desktop Only */}
        <div className="hidden md:block w-full border-t border-gray-200/50">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <HeaderBottom />
           </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
