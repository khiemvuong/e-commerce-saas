"use client";

import React, { useEffect} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {useStore} from "apps/user-ui/src/store";
import { CheckCircle, Truck } from "lucide-react";
import confetti from 'canvas-confetti';

const PaymentSuccessPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('sessionId');

    useEffect(() => {
        useStore.setState({ cart: [] });
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
        });
    }, []);
    return (
        <div className="min-h-[80vh] flex flex-col justify-center items-center px-4">
            <div className="bg-white p-8 rounded-md shadow text-center border border-green-500">
                <div className="text-green mb-4">
                    <CheckCircle size={48} className="mx-auto"/>
                </div>
                <h2 className="text-2xl font-semibold mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-6">Thank you for your purchase. Your payment has been processed successfully.</p>
                <button
                    onClick={() => router.push('/profile?active=My+Orders')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center mx-auto"
                >
                    <Truck size={20} className="inline-block mr-2"/>
                    Track My Order
                </button>
                <div className="mt-6 text-sm text-gray-500">
                    Payment Session ID: <span className="font-mono">{sessionId}</span>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
