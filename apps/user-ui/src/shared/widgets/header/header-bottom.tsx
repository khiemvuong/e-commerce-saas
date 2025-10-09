'use client';
import { AlignLeft, ChevronDown, Heart, ShoppingCart } from 'lucide-react';
import React from 'react';
import Link from 'next/link';
import ProfileIcon from '../../../assets/svgs/profile-icon';
import { navItems } from 'apps/user-ui/src/configs/constants';
import useUser from "apps/user-ui/src/hooks/useUser";
// type NavItemsTypes = { title: string; href: string }; // nếu cần

const HeaderBottom = () => {
const [show, setShow] = React.useState(false);
const [isSticky, setIsSticky] = React.useState(false);
const menuRef = React.useRef<HTMLDivElement | null>(null);
const { user, isLoading } = useUser();
  // Sticky on scroll
React.useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
}, []);

  // Click outside to close dropdown
React.useEffect(() => {
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

        {/* All Dropdowns */}
        <div
        ref={menuRef}
          className={`w-[260px] ${isSticky ? '-mb-2' : ''} relative`} // <-- relative ở đây
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
            className="absolute top-full left-0 w-full mt-1 z-50 rounded-b-md bg-[#3a3a3a] text-white shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            >
            <button className="w-full text-left px-4 py-2 hover:bg-[#2f2f2f]">Item 1</button>
            <button className="w-full text-left px-4 py-2 hover:bg-[#2f2f2f]">Item 2</button>
            <button className="w-full text-left px-4 py-2 hover:bg-[#2f2f2f]">Item 3</button>
            </div>
        )}
        </div>

        {/* Navigation Links */}
        <div className="flex items-center">
        {navItems.map((i: any, index: number) => (
            <Link className="px-5 font-medium text-lg hover:text-blue-600" href={i.href} key={index}>
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
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                    <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-100 hover:border-blue-500 transition">
                    <ProfileIcon size={20} className="text-gray-600" />
                    </div>
                    <div className="flex flex-col">
                    <span className="text-sm text-gray-700 font-medium">
                        Hello,
                    </span>
                    <span className="text-sm text-gray-700 font-Roboto font-bold">
                        {user?.name ? ` ${user.name}` : ","}
                    </span>                     
                    </div>
                </Link>
                ) : (
                  // CHƯA ĐĂNG NHẬP: avatar + nút Sign in
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition">
                    <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-100">
                    <ProfileIcon size={20} className="text-gray-600" />
                    </div>
                    <div className="flex flex-col">
                    <span className="text-sm text-gray-700 font-medium">Hello,</span>
                    <Link
                        href="/login"
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition underline"
                    >
                        Sign in
                    </Link>
                    </div>
                </div>
                )}

                {/* Wishlist */}
                <button className="relative p-2 rounded-full hover:bg-gray-100 hover:text-red-500 transition">
                <Heart size={20} />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full px-1.5 leading-[14px]">
                    0
                </span>
                </button>

                {/* Cart */}
                <button className="relative p-2 rounded-full hover:bg-gray-100 hover:text-blue-600 transition">
                <ShoppingCart size={20} />
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full px-1.5 leading-[14px]">
                    0
                </span>
                </button>
            </div>
            </div>
        )}
        </div>

    </div>
    </div>
);
};

export default HeaderBottom;
