"use client";
import { Package, Search, Truck, CheckCircle, Clock, XCircle, MapPin, CreditCard, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";

const statuses = ['Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const TrackOrderPage = () => {
    const [orderId, setOrderId] = useState("");
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim()) return;
        
        setLoading(true);
        setError(null);
        setOrder(null);
        
        try {
            const res = await axiosInstance.get(`/seller/api/get-order-details/${orderId.trim()}`);
            if (res.data.order) {
                setOrder(res.data.order);
            } else {
                setError("Order not found. Please check your order ID.");
            }
        } catch (err: any) {
            setError("Order not found. Please check your order ID and try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetSearch = () => {
        setOrder(null);
        setOrderId("");
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                {!order && (
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package className="text-blue-600" size={32} />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Track Your Order</h1>
                        <p className="text-gray-600">
                            Enter your order ID to check the delivery status
                        </p>
                    </div>
                )}

                {/* Back button when showing order */}
                {order && (
                    <button
                        onClick={resetSearch}
                        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group mb-6"
                    >
                        <div className="p-2 rounded-full group-hover:bg-gray-200 transition-colors mr-2">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-medium">Search another order</span>
                    </button>
                )}

                {/* Search Form */}
                {!order && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                        <form onSubmit={handleSearch} className="flex gap-3">
                            <input
                                type="text"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="Enter Order ID"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    "Searching..."
                                ) : (
                                    <>
                                        <Search size={18} />
                                        Track
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}

                {/* Error State */}
                {error && !order && (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center mb-8">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="text-red-500" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Order Not Found</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Link 
                            href="/login"
                            className="inline-block px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                        >
                            Login to see your orders
                        </Link>
                    </div>
                )}

                {/* Order Details */}
                {order && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {/* Order Header */}
                        <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className='text-2xl font-bold text-gray-800 mb-1'>
                                    Order <span className="text-gray-500">#</span>{order.id.slice(-8).toUpperCase()}
                                </h1>
                                <p className="text-gray-500 text-sm flex items-center gap-2">
                                    <Calendar size={14}/>
                                    Placed on {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <span className={`inline-block px-4 py-2 rounded-md text-sm font-semibold ${
                                order.deliveryStatus === 'Delivered' 
                                    ? 'bg-green-100 text-green-700'
                                    : order.deliveryStatus === 'Shipped' || order.deliveryStatus === 'Out for Delivery'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-orange-100 text-orange-700'
                            }`}>
                                {order.deliveryStatus || 'Processing'}
                            </span>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Progress Bar */}
                            <div className="w-full">
                                <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-4">
                                    {statuses.map((step, idx) => {
                                        const current = step === order.deliveryStatus;
                                        const passed = statuses.indexOf(order.deliveryStatus) > idx;
                                        return (
                                            <div key={step} className={`text-center ${current
                                                ? "text-blue-600 font-bold"
                                                : passed
                                                    ? "text-green-600"
                                                    : "text-gray-400"
                                                }`}>
                                                {step}
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className='flex items-center'>
                                    {statuses.map((step, idx) => {
                                        const reached = idx <= statuses.indexOf(order.deliveryStatus)
                                        return (
                                            <div key={step} className='flex-1 flex items-center last:flex-none'>
                                                <div
                                                    className={`w-4 h-4 rounded-full z-10 ring-4 ring-white ${reached ? "bg-blue-600" : "bg-gray-300"}`}
                                                />
                                                {idx !== statuses.length - 1 && (
                                                    <div
                                                        className={`flex-1 h-1 -ml-1 -mr-1 ${reached ? "bg-blue-600" : "bg-gray-300"}`}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2">
                                        <CreditCard size={14}/> Payment
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status</span>
                                            <span className={`font-medium px-2 py-0.5 rounded text-xs ${order.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                                            <span>Total</span>
                                            <span className="text-lg">${order.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {order.shippingAddress && (
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                        <h3 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2">
                                            <MapPin size={14}/> Shipping Address
                                        </h3>
                                        <div className="text-sm text-gray-700">
                                            <p className="font-semibold">{order.shippingAddress.name}</p>
                                            <p>{order.shippingAddress.street}</p>
                                            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Order Items */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <Package size={16}/> Items ({order.items?.length || 0})
                                </h3>
                                <div className="space-y-2">
                                    {order.items?.map((item: any, index: number) => (
                                        <div key={index} className="flex gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <img
                                                src={item.product?.images?.[0]?.file_url || '/placeholder.png'}
                                                alt={item.product?.title}
                                                className="w-16 h-16 rounded object-cover"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800 line-clamp-1">{item.title || item.product?.title}</p>
                                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">${item.price?.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Status Guide - Only show when no order */}
                {!order && !error && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6">Order Status Guide</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Clock className="text-yellow-600" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-800">Ordered</h4>
                                    <p className="text-sm text-gray-500">Order placed, awaiting confirmation</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Package className="text-blue-600" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-800">Packed</h4>
                                    <p className="text-sm text-gray-500">Seller is preparing your package</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Truck className="text-purple-600" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-800">Shipped / Out for Delivery</h4>
                                    <p className="text-sm text-gray-500">Your package is on the way</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="text-green-600" size={20} />
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-800">Delivered</h4>
                                    <p className="text-sm text-gray-500">Package delivered successfully</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Login prompt */}
                {!order && (
                    <div className="bg-blue-50 rounded-xl p-6 mt-8 text-center">
                        <p className="text-gray-700 mb-4">
                            Login to see your order history and track easily
                        </p>
                        <Link 
                            href="/profile"
                            className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                        >
                            My Orders
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackOrderPage;
