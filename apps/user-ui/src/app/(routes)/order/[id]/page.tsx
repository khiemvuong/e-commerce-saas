'use client'

import React, { useEffect, useState } from 'react'
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance'
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MapPin, Package, CreditCard, Calendar } from 'lucide-react';

const statuses = ['Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const Page = () => {
    const params = useParams();
    const orderId = params.id as string;

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchOrder = async () => {
        try {
            const res = await axiosInstance.get(`/order/api/get-order-details/${orderId}`);
            setOrder(res.data.order);
        } catch (error) {
            console.error("Error fetching order details:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className='animate-spin w-8 h-8 text-blue-500' />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500">
                <Package size={48} className="mb-4 opacity-50"/>
                <p>Order not found.</p>
                <button 
                    onClick={() => router.push('/profile?active=My Orders')}
                    className="mt-4 text-blue-600 hover:underline"
                >
                    Return to My Orders
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-10 bg-gray-50 min-h-screen">
            {/* Header Navigation */}
            <div className="mb-6">
                <button
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors group"
                    onClick={() => router.push('/profile?active=My Orders')}
                >
                    <div className="p-2 rounded-full group-hover:bg-gray-200 transition-colors mr-2">
                        <ArrowLeft size={20} />
                    </div>
                    <span className="font-medium">Back to My Orders</span>
                </button>
            </div>

            {/* Main Card Container */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                
                {/* Card Header */}
                <div className="p-6 md:p-8 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className='text-2xl md:text-3xl font-bold text-gray-800 mb-1'>
                            Order <span className="text-gray-500">#</span>{order.id.slice(-6).toUpperCase()}
                        </h1>
                        <p className="text-gray-500 text-sm flex items-center gap-2">
                            <Calendar size={14}/>
                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    
                    {/* Delivery Status Badge */}
                    <div>
                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1">
                            Delivery Status
                        </p>
                        <span className={`inline-block px-4 py-2 rounded-md text-sm font-semibold ${
                            order.deliveryStatus === 'Delivered' 
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : order.deliveryStatus === 'Shipped' || order.deliveryStatus === 'Out for Delivery'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'bg-orange-100 text-orange-700 border border-orange-200'
                        }`}>
                            {order.deliveryStatus || 'Processing'}
                        </span>
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                    {/* Delivery Progress Bar */}
                    <div className="w-full">
                        <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-4 px-2">
                            {statuses.map((step, idx) => {
                                const current = step === order.deliveryStatus;
                                const passed = statuses.indexOf(order.deliveryStatus) > idx;
                                return (
                                    <div key={step} className={`text-center transition-colors duration-300 ${current
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
                        <div className='flex items-center relative'>
                            {statuses.map((step, idx) => {
                                const reached = idx <= statuses.indexOf(order.deliveryStatus)
                                return (
                                    <div key={step} className='flex-1 flex items-center last:flex-none'>
                                        <div
                                            className={`w-4 h-4 rounded-full z-10 ring-4 ring-white transition-all duration-500 ${reached ? "bg-blue-600" : "bg-gray-300"}`}
                                        />
                                        {idx !== statuses.length - 1 && (
                                            <div
                                                className={`flex-1 h-1 -ml-1 -mr-1 transition-all duration-500 ${reached ? "bg-blue-600" : "bg-gray-300"}`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Summary & Address */}
                        <div className="space-y-6 lg:col-span-1">
                            {/* Summary Info Box */}
                            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                <h3 className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <CreditCard size={14}/> Payment Details
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className='text-gray-600'>Status</span>
                                        <span className={`font-medium px-2 py-0.5 rounded text-xs ${order.status === 'Paid' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    
                                    {order.couponCode && (
                                        <div className="flex justify-between">
                                            <span className='text-gray-600'>Coupon</span>
                                            <span className='text-blue-600 font-mono text-xs'>{order.couponCode.public_name}</span>
                                        </div>
                                    )}

                                    {order.discountAmount > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Discount</span>
                                            <span>-${order.discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
                                        <span className='text-gray-700 font-semibold'>Total Paid</span>
                                        <span className='text-xl font-bold text-gray-900'>${order.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address Box */}
                            {order.shippingAddress && (
                                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                                    <h3 className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <MapPin size={14}/> Shipping Address
                                    </h3>
                                    <div className="text-gray-700 text-sm leading-relaxed">
                                        <p className="font-semibold text-gray-900 mb-1">{order.shippingAddress.name}</p>
                                        <p>{order.shippingAddress.street}</p>
                                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                                        <p>{order.shippingAddress.country}</p>
                                        {order.shippingAddress.label && (
                                            <span className="inline-block mt-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded border border-gray-300">
                                                {order.shippingAddress.label}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Order Items */}
                        <div className="lg:col-span-2">
                            <h2 className='text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2'>
                                <Package className="text-blue-600" size={20}/> 
                                Order Items 
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full ml-2">{order.items.length}</span>
                            </h2>
                            <div className='space-y-3'>
                                {order.items.map((item: any) => (
                                    <div key={item.productId} className='flex gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group'>
                                        <div className="relative w-20 h-20 flex-shrink-0 bg-white rounded-md overflow-hidden border border-gray-200">
                                            <img
                                                src={item.product?.images[0]?.file_url || '/placeholder.png'}
                                                alt={item.product?.title || 'Product Image'}
                                                className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                                            />
                                        </div>
                                        <div className='flex-1 flex flex-col justify-between'>
                                            <div>
                                                <h4 className='text-gray-800 font-medium line-clamp-1' title={item.title || item.product?.title}>
                                                    {item.title || item.product?.title || 'Unnamed Product'}
                                                </h4>
                                                
                                                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                                    <div className='flex flex-wrap gap-2 mt-2'>
                                                        {Object.entries(item.selectedOptions).map(
                                                            ([key, value]: [string, any]) =>
                                                                value && (
                                                                    <span key={key} className='text-xs bg-white text-gray-600 px-2 py-1 rounded border border-gray-300 flex items-center gap-1.5'>
                                                                        <span className='font-medium capitalize text-gray-500'>{key}:</span>
                                                                        {key.toLowerCase() === 'color' ? (
                                                                            <span className="flex items-center gap-1">
                                                                                <span
                                                                                    style={{
                                                                                        backgroundColor: value,
                                                                                        width: '14px',
                                                                                        height: '14px',
                                                                                        borderRadius: '50%',
                                                                                        display: 'inline-block',
                                                                                        border: '1px solid #d1d5db'
                                                                                    }}
                                                                                />
                                                                                <span className="text-gray-700">{value}</span>
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-700">{value}</span>
                                                                        )}
                                                                    </span>
                                                                )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex justify-between items-end mt-2">
                                                <span className='text-sm text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200'>
                                                    Qty: {item.quantity}
                                                </span>
                                                <span className='text-gray-900 font-bold'>
                                                    ${item.price.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Page;
