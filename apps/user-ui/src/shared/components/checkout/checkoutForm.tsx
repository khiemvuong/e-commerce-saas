import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import React, { useState } from 'react'

const CheckoutForm = ({
    clientSecret,
    cartItems,
    coupon,
    sessionId,
}:{
    clientSecret: string;
    cartItems: any[];
    coupon: any;
    sessionId: string | null;
}) => {
    const stripe = useStripe();
    const elements = useElements();

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"success" | "failed" | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        if (!stripe || !elements) {
            setLoading(false);
            return;
        }
        const result = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/payment-success?sessionId=${sessionId}`,
            },
            redirect: 'if_required',
        });
        setLoading(false);
        if (result.error) {
            setStatus("failed");
            setErrorMsg(result.error.message || "An unexpected error occurred.");
        } else {
            setStatus("success");
        }
        setLoading(false);
    };

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4 my-10">
        <form className='bg-white w-full max-w-lg p-8 rounded-md shadow space-y-6'
            onSubmit={handleSubmit}
        >
            <h2 className='text-2xl font-semibold mb-6 text-center'>Secure Payment Checkout</h2>
            <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-700 space-y-2">
                {cartItems.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm pb-1">
                        <span>{item.title} x {item.quantity}</span>
                        <span>${(item.sale_price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
                
                <div className="flex justify-between font-semibold border-t pt-2">
                    {!!coupon?.discountAmount && (
                        <>
                            <span>Discount ({coupon.discountCode})</span>
                            <span>-${coupon.discountAmount.toFixed(2)}</span>
                        </>
                    )}
                </div>
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>
                        ${cartItems.reduce((total, item) => total + item.sale_price * item.quantity, 0) - (coupon?.discountAmount || 0).toFixed(2)}
                    </span>
                </div>
            </div>
            <PaymentElement />
            <button
                type="submit"
                disabled={loading || !stripe || !elements}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading && <Loader2 size={16} className="inline-block mr-2 animate-spin" />}
                {loading ? 'Processing...' : 'Pay Now'}
            </button>
            {errorMsg &&
                <div className="flex items-center justify-center mt-4 text-red-600">
                    <XCircle size={20} className="inline-block mr-2"/>
                    <span>{errorMsg}</span>
                </div>

            }
            {status === "success" && (
                <div className="div">
                    <CheckCircle size={20} className="inline-block mr-2 text-green-600"/>
                    <span className="text-green-600">Payment successful! Thank you for your purchase.</span>
                </div>
            )}
            {status === "failed" && (
                <div className="flex items-center justify-center mt-4 text-red-600">
                    <XCircle size={20} className="inline-block mr-2"/>
                    <span>Payment failed: {errorMsg}</span>
                </div>
            )}
        </form>
    </div>
  )
}

export default CheckoutForm