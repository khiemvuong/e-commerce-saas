"use client";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const faqData = [
    {
        category: "Orders & Payment",
        questions: [
            {
                q: "How do I place an order on ILAN Shop?",
                a: "Simply search for products, add them to your cart, select shipping address and payment method, then confirm your order!"
            },
            {
                q: "What payment methods are supported?",
                a: "We support online payment via Stripe (Visa, Mastercard, etc.) and Cash on Delivery (COD). Note: COD is only available for certain products."
            },
            {
                q: "Can I use a discount code?",
                a: "Yes! You can enter a discount code on the cart page before checkout. Only one discount code can be applied per order."
            },
            {
                q: "How do I cancel an order?",
                a: "You can cancel your order before it's confirmed by the seller. Go to 'My Orders' in your profile to manage your orders."
            }
        ]
    },
    {
        category: "Shipping & Delivery",
        questions: [
            {
                q: "How long does delivery take?",
                a: "Delivery time depends on your location and the carrier, typically 2-5 business days. You can track your order in real-time."
            },
            {
                q: "How is shipping cost calculated?",
                a: "Shipping cost is based on delivery address and package weight. The exact cost will be shown when you select a shipping address."
            },
            {
                q: "How do I track my order?",
                a: "Visit the 'Track Order' page and enter your order ID, or log in to view your order history."
            }
        ]
    },
    {
        category: "Account & Security",
        questions: [
            {
                q: "How do I create an account?",
                a: "Click 'Sign Up' in the top right corner, enter your email and password. You'll receive a verification email to activate your account."
            },
            {
                q: "I forgot my password. What should I do?",
                a: "Click 'Forgot Password' on the login page and enter your email. We'll send you a password reset link."
            },
            {
                q: "Is my personal information secure?",
                a: "Absolutely! We use SSL encryption and follow the highest security standards to protect your information."
            }
        ]
    },
    {
        category: "Returns & Refunds",
        questions: [
            {
                q: "What is the return policy?",
                a: "You can request a return within 7 days of receiving your order if the product is defective or doesn't match the description."
            },
            {
                q: "When will I get my refund?",
                a: "After your return request is approved and the product is verified, refunds are processed within 5-7 business days."
            }
        ]
    }
];

const FAQPage = () => {
    const [openItems, setOpenItems] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    const toggleItem = (id: string) => {
        setOpenItems(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredData = faqData.map(category => ({
        ...category,
        questions: category.questions.filter(
            q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.questions.length > 0);

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h1>
                    <p className="text-gray-600">
                        Find answers to common questions about ILAN Shop
                    </p>
                </div>

                {/* Search */}
                <div className="mb-8">
                    <div className="relative max-w-xl mx-auto">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search questions..."
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    </div>
                </div>

                {/* FAQ Sections */}
                <div className="space-y-8">
                    {filteredData.map((category, catIndex) => (
                        <div key={catIndex} className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <h2 className="text-lg font-semibold text-gray-800 px-6 py-4 bg-gray-50 border-b border-gray-200">
                                {category.category}
                            </h2>
                            <div className="divide-y divide-gray-100">
                                {category.questions.map((item, qIndex) => {
                                    const itemId = `${catIndex}-${qIndex}`;
                                    const isOpen = openItems.includes(itemId);
                                    return (
                                        <div key={qIndex}>
                                            <button
                                                onClick={() => toggleItem(itemId)}
                                                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition"
                                            >
                                                <span className="font-medium text-gray-700 pr-4">{item.q}</span>
                                                {isOpen ? (
                                                    <ChevronUp className="text-gray-400 flex-shrink-0" size={20} />
                                                ) : (
                                                    <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
                                                )}
                                            </button>
                                            {isOpen && (
                                                <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">
                                                    {item.a}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Still need help */}
                <div className="mt-12 bg-blue-50 rounded-xl p-8 text-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Still need help?</h3>
                    <p className="text-gray-600 mb-6">
                        Our support team is always ready to assist you
                    </p>
                    <Link 
                        href="/contact"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
