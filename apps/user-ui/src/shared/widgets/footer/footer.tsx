'use client';
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import IlanLogo2 from "apps/user-ui/src/assets/svgs/ilan-logo-2";
const Footer = () => {
  return (
    <footer className="bg-[#3D3D3D] text-white">
      {/* Newsletter Section */}
      <div className="bg-[#3D3D3D] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <IlanLogo2 size={350} />
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 text-center md:text-left">
            {/* Products Column 1 */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
                Products
              </h3>
              <nav className="flex flex-col space-y-3">
                <Link href="/category/electronics" className="text-sm text-gray-400 hover:text-white transition">
                  Electronics
                </Link>
                <Link href="/category/fashion" className="text-sm text-gray-400 hover:text-white transition">
                  Fashion
                </Link>
                <Link href="/category/home" className="text-sm text-gray-400 hover:text-white transition">
                  Home & Garden
                </Link>
              </nav>
            </div>

            {/* Legal Pages Column */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
                Legal Pages
              </h3>
              <nav className="flex flex-col space-y-3">
                <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition">
                  Terms of Service
                </Link>
                <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition">
                  Privacy Policy
                </Link>
                <Link href="/returns" className="text-sm text-gray-400 hover:text-white transition">
                  Return Policy
                </Link>
                <Link href="/shipping" className="text-sm text-gray-400 hover:text-white transition">
                  Shipping Info
                </Link>
                <Link href="/cookies" className="text-sm text-gray-400 hover:text-white transition">
                  Cookie Policy
                </Link>
              </nav>
            </div>

            {/* Products Column 2 */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
                Products
              </h3>
              <nav className="flex flex-col space-y-3">
                <Link href="/deals" className="text-sm text-gray-400 hover:text-white transition">
                  Special Deals
                </Link>
                <Link href="/new-arrivals" className="text-sm text-gray-400 hover:text-white transition">
                  New Arrivals
                </Link>
                <Link href="/bestsellers" className="text-sm text-gray-400 hover:text-white transition">
                  Bestsellers
                </Link>
                <Link href="/trending" className="text-sm text-gray-400 hover:text-white transition">
                  Trending
                </Link>
                <Link href="/clearance" className="text-sm text-gray-400 hover:text-white transition">
                  Clearance
                </Link>
              </nav>
            </div>

            {/* Products Column 3 */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
                Products
              </h3>
              <nav className="flex flex-col space-y-3">
                <Link href="/brands" className="text-sm text-gray-400 hover:text-white transition">
                  Top Brands
                </Link>
                <Link href="/gift-cards" className="text-sm text-gray-400 hover:text-white transition">
                  Gift Cards
                </Link>
                <Link href="/bundles" className="text-sm text-gray-400 hover:text-white transition">
                  Bundle Offers
                </Link>
                <Link href="/seasonal" className="text-sm text-gray-400 hover:text-white transition">
                  Seasonal
                </Link>
                <Link href="/limited" className="text-sm text-gray-400 hover:text-white transition">
                  Limited Edition
                </Link>
              </nav>
            </div>

            {/* Legal Pages Column 2 */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">
                Legal Pages
              </h3>
              <nav className="flex flex-col space-y-3">
                <Link href="/accessibility" className="text-sm text-gray-400 hover:text-white transition">
                  Accessibility
                </Link>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition">
                  Contact Us
                </Link>
                <Link href="/faq" className="text-sm text-gray-400 hover:text-white transition">
                  FAQ
                </Link>
                <Link href="/sitemap" className="text-sm text-gray-400 hover:text-white transition">
                  Sitemap
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
