'use client';
import { AlignLeft, ChevronDown, Heart, ShoppingCart } from 'lucide-react';
import React from 'react'
import { navItems } from 'apps/user-ui/src/configs/constants';
import Link from 'next/link';
import ProfileIcon from '../../../assets/svgs/profile-icon';
const HeaderBottom = () => {
    const[show, setShow] = React.useState(false)
    const [isSticky, setIsSticky] = React.useState(false);

    //Track the scroll position to toggle the sticky state
    React.useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setIsSticky(true);
            } else {
                setIsSticky(false);
                }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
},[]);
return (
    <div className={`w-full transition-all duration-100 ${isSticky ? "fixed top-0 left-0 z-[100] bg-white shadow-lg" : "relative"}`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative flex items-center justify-between ${isSticky ? 'py-3' : "py-0"}`}>
            {/* All Dropdonws*/}
            <div className={`w-[260px] ${isSticky &&'-mb-2'} cursor-pointer flex items-center justify-between px-5 h-[50px] bg-[#3a3a3a] text-white rounded-t-md`}
            onClick={() => setShow(!show)}
            >
                <div className ="flex items-center gap-2">
                    <AlignLeft color="white" />
                    <span className="text-white font-medium">All Departments</span>
                </div>
                <ChevronDown size={16} color="white" />
                {/* Dropdown Items */}
                {show && (
                    <div className={`absolute left-0 ${isSticky ? 'top-[70px]' : 'top-[50px]'} w-[260px] h-[400px] bg-[#3a3a3a] text-white rounded-b-md`}>
                        <div className="mx-2 p-2">Item 1</div>
                        <div className="mx-2 p-2">Item 2</div>
                        <div className="mx-2 p-2">Item 3</div>
                    </div>
                )}
                {/* Navigation Links */}
                
            </div>
            <div className="flex items-center">
                    {navItems.map((i: NavItemsTypes, index: number) => (
                        <Link className="px-5 font-medium text-lg" 
                        href={i.href} 
                        key={index}
                        >
                        {i.title}
                        </Link>
                    ))}
            </div>
            {/* Right Section - User Actions (only show when sticky) */}
            <div className="flex items-center">
                {isSticky && (
                    <div className="flex items-center gap-6">
                        {/* User Profile */}
                        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center bg-gray-100 hover:border-blue-500 transition">
                                    <ProfileIcon size={20} className="text-gray-600" />
                                </div>
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

                        {/* Action Icons */}
                        <div className="flex items-center gap-2">
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

export default HeaderBottom