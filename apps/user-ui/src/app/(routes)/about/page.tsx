"use client";
import { Store, Users, ShieldCheck, Truck, Award, Heart } from "lucide-react";
import Link from "next/link";

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">About ILAN Shop</h1>
                    <p className="text-lg md:text-xl opacity-90">
                        Your trusted multi-vendor e-commerce marketplace
                    </p>
                </div>
            </div>

            {/* Story Section */}
            <div className="max-w-4xl mx-auto px-4 py-16">
                <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Our Story</h2>
                    <div className="space-y-4 text-gray-600 leading-relaxed">
                        <p>
                            ILAN Shop was founded with a mission to connect buyers and sellers 
                            on a secure, convenient, and reliable e-commerce platform.
                        </p>
                        <p>
                            We believe online shopping should be an easy and enjoyable experience 
                            for everyone. With thousands of products from trusted sellers, 
                            ILAN Shop brings you the variety and quality you need.
                        </p>
                        <p>
                            From fashion and electronics to home goods and more - we have 
                            everything you're looking for at competitive prices.
                        </p>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-6xl mx-auto px-4 pb-16">
                <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Why Choose ILAN Shop?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <Store className="text-blue-600" size={24} />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">Wide Selection</h3>
                        <p className="text-gray-600 text-sm">
                            Thousands of products from trusted sellers nationwide.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <ShieldCheck className="text-green-600" size={24} />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">Secure Payment</h3>
                        <p className="text-gray-600 text-sm">
                            Online payment via Stripe and Cash on Delivery (COD) options.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <Truck className="text-purple-600" size={24} />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">Fast Delivery</h3>
                        <p className="text-gray-600 text-sm">
                            Real-time order tracking with nationwide delivery.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                            <Users className="text-orange-600" size={24} />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">24/7 Support</h3>
                        <p className="text-gray-600 text-sm">
                            Our customer support team is always ready to help.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                            <Heart className="text-red-600" size={24} />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">Great Deals</h3>
                        <p className="text-gray-600 text-sm">
                            Discount codes, flash sales, and regular promotions.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                            <Award className="text-yellow-600" size={24} />
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">Quality Guaranteed</h3>
                        <p className="text-gray-600 text-sm">
                            Authentic products with easy 7-day returns.
                        </p>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gray-100 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Start Shopping Today!</h2>
                    <p className="text-gray-600 mb-8">
                        Discover thousands of products at the best prices
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link 
                            href="/products" 
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                        >
                            Browse Products
                        </Link>
                        <Link 
                            href="/shops" 
                            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-white transition"
                        >
                            Explore Stores
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
