"use client"
import React from 'react'
import Hero from '../shared/modules/hero'
import CategorySection from '../shared/modules/categories/category-section'
import ScrollToTop from '../shared/components/scroll-to-top'
import {
    BestSellersSection,
    FeaturedSection,
    DealsOfTheDaySection,
    LatestProductsSection,
    TopShopsSection,
    FlashSaleSection
} from '../shared/modules/home'

/**
 * Home Page - Main landing page for the e-commerce platform
 * 
 * Page Structure (following UI-UX Pro Max guidelines):
 * 1. Hero - Compelling headline with CTA and banner carousel
 * 2. Categories - Bento-style grid with hover effects
 * 3. Flash Sales - Time-limited offers with countdown
 * 4. Best Sellers - Top selling products
 * 5. Deals of the Day - Highest discounts with dark theme
 * 6. Featured Products - Top-rated products
 * 7. Latest Products - New arrivals
 * 8. Top Shops - Trusted seller showcase
 */
const HomePage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
            {/* Hero Section - Full width */}
            <Hero />

            {/* Main Content Container */}
            <main className="relative">
                {/* Categories Section */}
                <section className="md:w-[85%] w-[95%] mx-auto">
                    <CategorySection />
                </section>

                {/* Flash Sale Section */}
                <section className="md:w-[85%] w-[95%] mx-auto">
                    <FlashSaleSection />
                </section>

                {/* Best Sellers Section */}
                <section className="md:w-[85%] w-[95%] mx-auto">
                    <BestSellersSection />
                </section>

                {/* Deals of the Day - Full width dark section */}
                <section className="w-full md:px-[7.5%] px-[2.5%]">
                    <DealsOfTheDaySection />
                </section>

                {/* Featured Products Section */}
                <section className="md:w-[85%] w-[95%] mx-auto">
                    <FeaturedSection />
                </section>

                {/* Latest Products Section */}
                <section className="md:w-[85%] w-[95%] mx-auto">
                    <LatestProductsSection />
                </section>

                {/* Top Shops Section */}
                <section className="md:w-[85%] w-[95%] mx-auto">
                    <TopShopsSection />
                </section>

                {/* Newsletter / Footer CTA Section */}
                <section className="md:w-[85%] w-[95%] mx-auto py-16 md:py-24">
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl px-6 py-12 md:px-16 md:py-16 text-center">
                        {/* Decorative elements */}
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
                        
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                                Join Our Community
                            </h2>
                            <p className="text-white/80 text-lg mb-8">
                                Subscribe to get special offers, free giveaways, and exclusive deals.
                            </p>
                            
                            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 px-6 py-4 rounded-full bg-white/20 backdrop-blur-sm text-white placeholder:text-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                                />
                                <button
                                    type="submit"
                                    className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-full hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
                                >
                                    Subscribe
                                </button>
                            </form>
                            
                            <p className="text-white/60 text-sm mt-4">
                                No spam, unsubscribe at any time.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Scroll to Top Button */}
            <ScrollToTop />
        </div>
    )
}

export default HomePage