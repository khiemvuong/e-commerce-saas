'use client';
import { useEffect, useState, Suspense } from "react";
import { loadStripe, Appearance } from "@stripe/stripe-js";
import { useSearchParams, useRouter } from "next/navigation";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { X } from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import CheckoutForm from "apps/user-ui/src/shared/components/checkout/checkoutForm";
import OverlayLoader from "apps/user-ui/src/shared/components/loading/page-loader";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

const CheckoutContent = () => {
    const [clientSecret, setClientSecret] = useState('');
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [coupon, setCoupon] = useState();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    const sessionId = searchParams.get('sessionId');

    useEffect(() => {
        const fetchSessionAndClientSecret = async () => {
            if (!sessionId) {
                setError("No session ID provided.");
                setLoading(false);
                return;
            }
            try {
                const verifyRes = await axiosInstance.get(
                    `/order/api/verify-payment-session?sessionId=${sessionId}`,
                );
                const { totalAmount, sellers, cart, coupon } = verifyRes.data.session;

                if (
                    !sellers ||
                    sellers.length === 0 ||
                    totalAmount === undefined ||
                    totalAmount === null
                ) {
                    throw new Error("Invalid session data.");
                }

                setCartItems(cart);
                setCoupon(coupon);
                const sellerStripeAccountId = sellers[0].stripeAccountId;

                const intentRes = await axiosInstance.post(
                    '/order/api/create-payment-intent',
                    {
                        amount: coupon?.discountAmount
                            ? totalAmount - coupon?.discountAmount
                            : totalAmount,
                        sellerStripeAccountId,
                        sessionId,
                    }
                );
                setClientSecret(intentRes.data.clientSecret);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to fetch payment information.");
            } finally {
                setLoading(false);
            }
        };
        fetchSessionAndClientSecret();
    }, [sessionId]);

    const appearance: Appearance = {
        theme: 'stripe',
    };

    if (loading) {
        return <OverlayLoader text="Loading checkout..." />;
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-[60vh] px-4">
                <div className="w-full text-center">
                    <div className="flex justify-center mb-4">
                        <X size={48} className="text-red-600" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">Payment Failed</h2>
                    <p className="text-gray-600 mb-4">
                        {error} <br className="hidden sm:block" /> Please go back and try again.
                    </p>
                    <button
                        onClick={() => router.push('/cart')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        Return to Cart
                    </button>
                </div>
            </div>
        );
    }

    return (
        clientSecret && (
            <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance }}
            >
                <CheckoutForm
                    clientSecret={clientSecret}
                    cartItems={cartItems}
                    coupon={coupon}
                    sessionId={sessionId}
                />
            </Elements>
        )
    );
};

const Page = () => {
    return (
        <Suspense fallback={<OverlayLoader text="Loading checkout..." />}>
            <CheckoutContent />
        </Suspense>
    );
};

export default Page;