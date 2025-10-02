'use client';
import Link from "next/link";
import { Search, Heart, ShoppingCart } from "lucide-react";
import ProfileIcon from "../../../assets/svgs/profile-icon";
import HeaderBottom from "./header-bottom";
import useUser from "apps/user-ui/src/hooks/useUser";

const Header = () => {
  const { user, isLoading } = useUser();

  return (
    <div>
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="text-[22px] font-bold text-gray-900">Ilan Shop</div>

            {/* Right Section: Search + User Actions */}
            <div className="flex items-center gap-6">
              {/* Search box */}
              <div className="flex items-center border border-gray-300 rounded-md bg-gray-100 overflow-hidden">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="px-3 py-2 text-sm w-[200px] sm:w-[300px] bg-transparent outline-none font-Roboto"
                />
                <button className="px-3 py-2 bg-[#555353ff] hover:bg-gray-800 transition text-white flex items-center justify-center">
                  <Search size={16} />
                </button>
              </div>

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
          </div>
        </div>
      </header>

      <div>
        <HeaderBottom />
      </div>
    </div>
  );
};

export default Header;
