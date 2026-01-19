"use client";

import React, { Suspense, useEffect} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {useStore} from "apps/user-ui/src/store";
import { CheckCircle, Truck, Package } from "lucide-react";
import confetti from 'canvas-confetti';

const PaymentSuccessContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('sessionId');
    const orderId = searchParams.get('orderId');
    const paymentMethod = searchParams.get('method') || 'stripe';
    const isCOD = paymentMethod === 'cod';

    useEffect(() => {
        useStore.setState({ cart: [] });
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: isCOD ? ['#22c55e', '#16a34a', '#15803d'] : ['#3b82f6', '#2563eb', '#1d4ed8'],
        });
    }, [isCOD]);

    return (
        <div className="min-h-[80vh] flex flex-col justify-center items-center px-4">
            <div className={`bg-white p-8 rounded-lg shadow-lg text-center border-2 ${isCOD ? 'border-green-500' : 'border-blue-500'}`}>
                <div className={`mb-4 ${isCOD ? 'text-green-500' : 'text-blue-500'}`}>
                    {isCOD ? (
                        <Package size={56} className="mx-auto"/>
                    ) : (
                        <CheckCircle size={56} className="mx-auto"/>
                    )}
                </div>
                
                <h2 className="text-2xl font-bold mb-2">
                    {isCOD ? 'Order Placed Successfully!' : 'Payment Successful!'}
                </h2>
                
                <p className="text-gray-600 mb-4">
                    {isCOD 
                        ? 'Thank you for your order. Your COD order has been confirmed.'
                        : 'Thank you for your purchase. Your payment has been processed successfully.'
                    }
                </p>

                {isCOD && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                            <Truck size={18} />
                            <span>Cash on Delivery</span>
                        </div>
                        <p className="text-sm text-green-600">
                            Please prepare cash when the courier delivers your order.
                        </p>
                    </div>
                )}

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => router.push(orderId ? `/order/${orderId}` : '/profile?active=My+Orders')}
                        className={`px-6 py-3 rounded-md transition flex items-center ${
                            isCOD 
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                        <Truck size={20} className="inline-block mr-2"/>
                        Track Order
                    </button>
                    
                    <button
                        onClick={() => router.push('/products')}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                    >
                        Continue Shopping
                    </button>
                </div>

                <div className="mt-6 text-sm text-gray-500">
                    {isCOD ? (
                        <>Order ID: <span className="font-mono">{orderId}</span></>
                    ) : (
                        <>Payment Session ID: <span className="font-mono">{sessionId}</span></>
                    )}
                </div>
            </div>
        </div>
    );
};

const PaymentSuccessPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-[80vh] flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
};

export default PaymentSuccessPage;

