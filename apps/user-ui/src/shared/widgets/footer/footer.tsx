'use client';
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();
  const { data: customizationData } = useQuery({
    queryKey: ['customizations'],
    queryFn: async () => {
      const res = await axiosInstance.get('/admin/api/get-all-customizations');
      return res.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (formerly cacheTime)
  });

  if(pathname==='/inbox') return null;

  const logos = (customizationData?.images?.filter((img: any) => img.type === 'logo') || [])
    .sort((a: any, b: any) => a.id.localeCompare(b.id));
  const logoUrl = logos[1]?.file_url || null;

  return (
    <footer className="bg-[#3D3D3D] text-white">
      {/* Newsletter Section */}
      <div className="bg-[#3D3D3D] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            {logoUrl && (
              <img src={logoUrl} alt="Footer Logo" className="h-[200px] w-auto object-contain" />
            )}
          </div>
          <h2 className="text-3xl md:text-4xl font-normal mb-2">
            Subscribe To Your Newsletter To Stay
          </h2>
          <h2 className="text-3xl md:text-4xl font-normal mb-8">
            Updated About Discounts
          </h2>
          
          {/* Email Input with Arrow Button */}
          <div className="max-w-md mx-auto relative">
            <input
              type="email"
              placeholder="person@email.com"
              className="w-full bg-transparent border border-white/30 rounded-full px-6 py-3 pr-14 text-base outline-none focus:border-white/60 transition placeholder:text-gray-400"
            />
            <button 
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black rounded-full p-2 hover:bg-gray-200 transition"
              aria-label="Subscribe"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div className="bg-[#3A3A3A] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
            {/* Shop */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
                Shop
              </h3>
              <nav className="flex flex-col space-y-3">
                <Link href="/products" className="text-sm text-gray-400 hover:text-white transition">
                  All Products
                </Link>
                <Link href="/shops" className="text-sm text-gray-400 hover:text-white transition">
                  Stores
                </Link>
                <Link href="/offers" className="text-sm text-gray-400 hover:text-white transition">
                  Offers
                </Link>
              </nav>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
                Account
              </h3>
              <nav className="flex flex-col space-y-3">
                <Link href="/profile" className="text-sm text-gray-400 hover:text-white transition">
                  My Account
                </Link>
                <Link href="/cart" className="text-sm text-gray-400 hover:text-white transition">
                  Cart
                </Link>
                <Link href="/wishlist" className="text-sm text-gray-400 hover:text-white transition">
                  Wishlist
                </Link>
                <Link href="/track-order" className="text-sm text-gray-400 hover:text-white transition">
                  Track Order
                </Link>
              </nav>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
                Support
              </h3>
              <nav className="flex flex-col space-y-3">
                <Link href="/faq" className="text-sm text-gray-400 hover:text-white transition">
                  FAQ
                </Link>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition">
                  Contact Us
                </Link>
                <Link href="/inbox" className="text-sm text-gray-400 hover:text-white transition">
                  Message Seller
                </Link>
              </nav>
            </div>

            {/* About Us */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
                About Us
              </h3>
              <nav className="flex flex-col space-y-3">
                <Link href="/about" className="text-sm text-gray-400 hover:text-white transition">
                  About
                </Link>
                <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition">
                  Privacy Policy
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="bg-[#3A3A3A] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-400">
            Copyright © 2025 Ilan Shop, Inc
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
