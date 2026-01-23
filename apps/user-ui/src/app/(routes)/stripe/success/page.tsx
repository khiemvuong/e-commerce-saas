"use client";

import React from 'react';
import { CheckCircle, ArrowRight, Store } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const StripeSuccessPage = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-[#C9A86C] p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/5" />
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                    >
                        <CheckCircle className="w-10 h-10 text-[#C9A86C]" />
                    </motion.div>
                    <h1 className="relative text-2xl font-bold text-white mb-2">
                        Connection Successful!
                    </h1>
                    <p className="relative text-white/90">
                        Your Stripe account is now connected
                    </p>
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex gap-3">
                            <div className="mt-0.5">
                                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle size={12} className="text-green-600" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Payments Enabled</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Your shop can now accept secure card payments and process payouts.
                                </p>
                            </div>
                        </div>

                        <p className="text-center text-sm text-gray-500 pt-4">
                            You can now close this window or return to the seller dashboard to finish your shop setup.
                        </p>

                        <Link 
                            href="\" 
                            onClick={() => window.close()}
                            className="w-full flex items-center justify-center gap-2 bg-black text-white font-medium py-3.5 rounded-xl hover:bg-gray-800 transition shadow-lg hover:shadow-xl cursor-pointer"
                        >
                            <span>Close Window</span>
                        </Link>
                        
                        <div className="text-center">
                            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 font-medium">
                                Return to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default StripeSuccessPage;
