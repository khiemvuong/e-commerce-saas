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
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

/**
 * Home Page - Luxury E-commerce Landing Page
 * 
 * Design System:
 * - Primary Gold: #C9A86C (luxury accent)
 * - Dark Background: #070707 (premium dark)
 * - Typography: Clean, elegant, high contrast
 * - Effects: Subtle gradients, glassmorphism, smooth animations
 */
const HomePage = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section - Full width dark */}
            <Hero />

            {/* Main Content Container */}
            <main className="relative">
                {/* Categories Section - Light */}
                <section className="md:w-[85%] w-[95%] mx-auto">
                    <CategorySection />
                </section>

                {/* Flash Sale Section - Dark with gold accents */}
                <section className="md:w-[95%] w-[95%] mx-auto px-2 md:px-8">
                    <FlashSaleSection />
                </section>

                {/* Best Sellers Section - Light */}
                <section className="md:w-[85%] w-[95%] mx-auto">
                    <BestSellersSection />
                </section>

                {/* Deals of the Day - Dark luxury section */}
                <section className="w-full md:px-[7.5%] px-[2.5%]">
                    <DealsOfTheDaySection />
                </section>

                {/* Featured Products Section - Light with gold accents */}
                <section className="md:w-[85%] w-[95%] mx-auto">
                    <FeaturedSection />
                </section>

                {/* Latest Products Section - Light with emerald accents */}
                <section className="md:w-[85%] w-[95%] mx-auto">
                    <LatestProductsSection />
                </section>

                {/* Top Shops Section - Dark luxury */}
                <section className="md:w-[85%] w-[95%] mx-auto px-4 md:px-8">
                    <TopShopsSection />
                </section>

                {/* Newsletter Section - Luxury Gold Theme */}
                <section className="md:w-[85%] w-[95%] mx-auto py-16 md:py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative overflow-hidden bg-[#070707] rounded-3xl"
                    >
                        {/* Background effects */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,108,0.15),transparent_70%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(201,168,108,0.10),transparent_70%)]" />
                        
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 border border-[#C9A86C]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 border border-[#C9A86C]/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                        
                        {/* Border accent */}
                        <div className="absolute inset-0 border border-[#C9A86C]/20 rounded-3xl pointer-events-none" />

                        <div className="relative z-10 px-6 py-12 md:px-16 md:py-20">
                            <div className="max-w-3xl mx-auto text-center">
                                {/* Badge */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full border border-[#C9A86C]/30 bg-[#C9A86C]/5"
                                >
                                    <Sparkles className="w-4 h-4 text-[#C9A86C]" />
                                    <span className="text-[#C9A86C] text-sm font-medium tracking-wider uppercase">
                                        Exclusive Access
                                    </span>
                                </motion.div>

                                <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                                    Join Our{' '}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C9A86C] via-[#E8D5B5] to-[#C9A86C]">
                                        Inner Circle
                                    </span>
                                </h2>
                                <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                                    Subscribe for early access to new collections, exclusive offers, and member-only deals.
                                </p>

                                <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="flex-1 px-6 py-4 rounded-full bg-white/5 backdrop-blur-sm text-white placeholder:text-gray-500 border border-white/10 focus:outline-none focus:border-[#C9A86C]/50 focus:ring-1 focus:ring-[#C9A86C]/50 transition-all"
                                    />
                                    <button
                                        type="submit"
                                        className="group px-8 py-4 bg-gradient-to-r from-[#C9A86C] to-[#B8956A] text-black font-semibold rounded-full hover:from-[#E8D5B5] hover:to-[#C9A86C] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Subscribe</span>
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </form>

                                <p className="text-gray-600 text-sm mt-6">
                                    By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </section>
            </main>

            {/* Scroll to Top Button */}
            <ScrollToTop />
        </div>
    )
}

export default HomePage