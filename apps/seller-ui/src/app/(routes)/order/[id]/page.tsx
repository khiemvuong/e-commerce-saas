'use client'

import React, { useEffect, useState } from 'react'
import axiosInstance from 'apps/seller-ui/src/utils/axiosInstance'
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MapPin, Package, CreditCard, Calendar } from 'lucide-react';

const statuses = ['Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const Page = () => {
    const params = useParams();
    const orderId = params.id as string;

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
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

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setUpdating(true);
        try {
            await axiosInstance.put(`/order/api/update-order-status/${orderId}`, {
                deliveryStatus: newStatus,
            });
            setOrder((prevOrder: any) => ({
                ...prevOrder,
                deliveryStatus: newStatus,
            }));
        } catch (error) {
            console.error("Error updating order status:", error);
        } finally {
            setUpdating(false);
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
            <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
                <Package size={48} className="mb-4 opacity-50"/>
                <p>Order not found.</p>
                <button 
                    onClick={() => router.push('/dashboard/orders')}
                    className="mt-4 text-blue-500 hover:underline"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            {/* Header Navigation */}
            <div className="mb-6">
                <button
                    className="flex items-center text-gray-400 hover:text-white transition-colors group"
                    onClick={() => router.push('/dashboard/orders')}
                >
                    <div className="p-2 rounded-full group-hover:bg-gray-800 transition-colors mr-2">
                        <ArrowLeft size={20} />
                    </div>
                    <span className="font-medium">Back to Orders</span>
                </button>
            </div>

            {/* Main Card Container */}
            {/* Sử dụng bg-gray-900 để nổi bật nhẹ trên nền đen, thêm border để tạo ranh giới */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
                
                {/* Card Header */}
                <div className="p-6 md:p-8 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className='text-2xl md:text-3xl font-bold text-white mb-1'>
                            Order <span className="text-gray-500">#</span>{order.id.slice(-6).toUpperCase()}
                        </h1>
                        <p className="text-gray-400 text-sm flex items-center gap-2">
                            <Calendar size={14}/>
                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    
                    {/* Status Selector */}
                    <div className="min-w-[200px]">
                        <label className="block text-gray-400 text-xs uppercase font-bold mb-2">
                            Delivery Status
                        </label>
                        <div className="relative">
                            <select
                                value={order.deliveryStatus}
                                onChange={handleStatusChange}
                                disabled={updating}
                                className="appearance-none block w-full bg-gray-800 text-white border border-gray-700 hover:border-gray-600 rounded-lg py-2.5 px-4 pr-8 leading-tight focus:outline-none focus:bg-gray-800 focus:border-blue-500 transition-colors cursor-pointer"
                            >
                                {statuses.map((status) => {
                                    const currentIndex = statuses.indexOf(order.deliveryStatus);
                                    const statusIndex = statuses.indexOf(status);
                                    return (
                                        <option
                                            key={status}
                                            value={status}
                                            disabled={statusIndex < currentIndex}
                                            className={statusIndex < currentIndex ? 'text-gray-500 bg-gray-900' : 'bg-gray-800'}
                                        >
                                            {status}
                                        </option>
                                    );
                                })}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                    {/* Delivery Progress Bar */}
                    <div className="w-full">
                        <div className="flex items-center justify-between text-xs font-medium text-gray-400 mb-4 px-2">
                            {statuses.map((step, idx) => {
                                const current = step === order.deliveryStatus;
                                const passed = statuses.indexOf(order.deliveryStatus) > idx;
                                return (
                                    <div key={step} className={`text-center transition-colors duration-300 ${current
                                        ? "text-blue-400 font-bold"
                                        : passed
                                            ? "text-green-500"
                                            : "text-gray-600"
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
                                            className={`w-4 h-4 rounded-full z-10 ring-4 ring-gray-900 transition-all duration-500 ${reached ? "bg-blue-500" : "bg-gray-700"}`}
                                        />
                                        {idx !== statuses.length - 1 && (
                                            <div
                                                className={`flex-1 h-1 -ml-1 -mr-1 transition-all duration-500 ${reached ? "bg-blue-500" : "bg-gray-700"}`}
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
                            <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-800">
                                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <CreditCard size={14}/> Payment Details
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className='text-gray-400'>Status</span>
                                        <span className={`font-medium px-2 py-0.5 rounded text-xs ${order.status === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    
                                    {order.couponCode && (
                                        <div className="flex justify-between">
                                            <span className='text-gray-400'>Coupon</span>
                                            <span className='text-blue-400 font-mono'>{order.couponCode.public_name}</span>
                                        </div>
                                    )}

                                    {order.discountAmout > 0 && (
                                        <div className="flex justify-between text-green-400">
                                            <span>Discount</span>
                                            <span>-${order.discountAmout.toFixed(2)}</span>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-700 pt-3 flex justify-between items-center">
                                        <span className='text-gray-200 font-semibold'>Total Paid</span>
                                        <span className='text-xl font-bold text-white'>${order.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address Box */}
                            {order.shippingAddress && (
                                <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-800">
                                    <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <MapPin size={14}/> Shipping Address
                                    </h3>
                                    <div className="text-gray-300 text-sm leading-relaxed">
                                        <p className="font-semibold text-white mb-1">{order.shippingAddress.name}</p>
                                        <p>{order.shippingAddress.street}</p>
                                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                                        <p>{order.shippingAddress.country}</p>
                                        {order.shippingAddress.label && (
                                            <span className="inline-block mt-2 px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded border border-gray-600">
                                                {order.shippingAddress.label}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Order Items */}
                        <div className="lg:col-span-2">
                            <h2 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
                                <Package className="text-blue-500" size={20}/> 
                                Order Items 
                                <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full ml-2">{order.items.length}</span>
                            </h2>
                            <div className='space-y-3'>
                                {order.items.map((item: any) => (
                                    <div key={item.productId} className='flex gap-4 bg-gray-800 p-4 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-colors group'>
                                        <div className="relative w-20 h-20 flex-shrink-0 bg-gray-900 rounded-lg overflow-hidden">
                                            <img
                                                src={item.product?.images[0]?.file_url || '/placeholder.png'}
                                                alt={item.product?.title || 'Product Image'}
                                                className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                                            />
                                        </div>
                                        <div className='flex-1 flex flex-col justify-between'>
                                            <div>
                                                <h4 className='text-gray-100 font-medium line-clamp-1' title={item.product?.title}>
                                                    {item.product?.title || 'Unnamed Product'}
                                                </h4>
                                                
                                                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                                    <div className='flex flex-wrap gap-2 mt-2'>
                                                        {Object.entries(item.selectedOptions).map(
                                                            ([key, value]: [string, any]) =>
                                                                value && (
                                                                    <span key={key} className='text-xs bg-gray-900 text-gray-400 px-2 py-1 rounded border border-gray-700'>
                                                                        <span className='font-medium capitalize text-gray-500'>{key}: </span>
                                                                        {value}
                                                                    </span>
                                                                )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex justify-between items-end mt-2">
                                                <span className='text-sm text-gray-400 bg-gray-900/50 px-2 py-0.5 rounded'>
                                                    Qty: {item.quantity}
                                                </span>
                                                <span className='text-white font-bold'>
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