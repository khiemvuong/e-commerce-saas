'use client';
import useDeviceTracking from 'apps/user-ui/src/hooks/useDeviceTracking';
import useLocationTracking from 'apps/user-ui/src/hooks/useLocationTracking';
import { useStore } from 'apps/user-ui/src/store';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';
import { Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from 'node_modules/@tanstack/react-query/build/modern/useQuery';
import React, { useEffect, useState } from 'react'
import AddAddressModal from 'apps/user-ui/src/shared/components/modals/AddAddressModal';
import toast from 'react-hot-toast';
import OverlayLoader from 'apps/user-ui/src/shared/components/loading/page-loader';
import useUser from 'apps/user-ui/src/hooks/useUser';

const CartPage = () => {
    const router = useRouter();
    const { user } = useUser();
    const location = useLocationTracking();
    const deviceInfo = useDeviceTracking();
    const [discountedProductId, setDiscountedProductId] = useState("")
    const removeFromCart = useStore((state: any) => state.removeFromCart);
    const cart = useStore((state: any) => state.cart);
    const [loading, setLoading] = useState(false);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [couponCode, setCouponCode] = useState("");
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [error, setError] = useState("");
    const [storedCouponCode, setStoredCouponCode] = useState("");

    const couponCodeApplyHandler = async () => {
        setError("");

        if (!couponCode.trim()) {
            setError("Please enter a coupon code.");
            return;
        }

        try {
            const res = await axiosInstance.put('/order/api/verify-coupon', {
                couponCode: couponCode.trim(),
                cart,
            });
            console.log("Coupon verification response:", res.data);
            if (res.data.valid) {
                setStoredCouponCode(couponCode.trim());
                setDiscountAmount(res.data.discountAmount);
                setDiscountPercent(res.data.discount);
                setDiscountedProductId(res.data.discountedProductId);
                setCouponCode("");
                toast.success("Coupon applied successfully!");
            }
            else {
                setDiscountAmount(0);
                setDiscountPercent(0);
                setDiscountedProductId("");
                setError(res.data.message || "Invalid or expired coupon code.");
            }
        } catch (error: any) {
            setDiscountAmount(0);
            setDiscountPercent(0);
            setDiscountedProductId("");
            setError(error?.response?.data?.message);
        }
    }


    const creatPaymentSession = async () => {
        if (!user) {
            toast.error("Please login to proceed to checkout.");
            router.push('/login');
            return;
        }
        if (addresses?.length === 0) {
            toast.error("Please add a shipping address before proceeding to checkout.");
            return;
        }
        setLoading(true);
        try {
            const res = await axiosInstance.post('/order/api/create-payment-session', {
                cart,
                selectedAddressId,
                coupon: {
                    code: storedCouponCode,
                    discountAmount,
                    discountPercent,
                    discountedProductId
                },
            });
            const sessionId = res.data.sessionId;
            router.push(`/checkout?sessionId=${sessionId}`);
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const decreaseQuantity = (productId: string) => {
        useStore.setState((state: any) => ({
            cart: state.cart.map((item: any) =>
                item?.id === productId && item.quantity && item.quantity > 1
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            )
        }))
    }
    const increaseQuantity = (productId: string) => {
        useStore.setState((state: any) => ({
            cart: state.cart.map((item: any) =>
                item?.id === productId
                    ? { ...item, quantity: (item.quantity ?? 1) + 1 }
                    : item
            )
        }))
    }
    const removeItem = (id: string) => {
        removeFromCart(id, user, location, deviceInfo);
    }
    const subtotal = cart
        .filter((item: any) => item && item.sale_price != null)
        .reduce((total: number, item: any) => total + item.sale_price * (item.quantity || 1), 0
        );
    //Get Addresses
    const { data: addresses = [] } = useQuery<any[], Error>({
        queryKey: ['shipping-addresses'],
        queryFn: async () => {
            const res = await axiosInstance('/api/shipping-addresses');
            return res.data.addresses;
        }
    });

    useEffect(() => {
        if (addresses.length > 0 && !selectedAddressId) {
            const defaultAddress = addresses.find((addr: any) => addr.is_default) || addresses[0];
            setSelectedAddressId(defaultAddress.id);
        }
    }, [addresses, selectedAddressId]);

    return (
        <div className='w-full bg-white relative'>
            {/* Loading overlay */}
            {loading && (
                <OverlayLoader text="Processing your order..." />
            )}

            <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
                <div className="pb-[50px]">
                    <div className="flex items-center justify-between">
                        <h1 className='md:pt-p[50px] font-medium text-[44px] leading-[1] mb-[16px] font-poppins mt-2'>
                            Cart ({cart.length})
                        </h1>

                    </div>
                    <Link
                        href={'/'}
                        className='text-[16px] text-gray-500 hover:underline'
                    >
                        Home
                    </Link>
                    <span className='inline-block p-[1.5px] mx-1 bg-[#a8acbo] rounded-full'>
                        .
                    </span>
                    <span className='text-[16px] text-gray-500'>
                        Cart
                    </span>
                </div>
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px]">
                        <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
                        <p className="text-gray-600 mb-6">Browse products and add them to your cart.</p>
                        <Link
                            href="/products"
                            className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition">
                            Shop Now
                        </Link>
                    </div>
                ) : (
                    <div className="lg:flex items-start gap-10 ">
                        <table className='w-full lg:w-[70%] border-collapse'>
                            <thead className='bg-[#f1f3f4] rounded'>
                                <tr className='border-b border-gray-300'>
                                    <th className='text-left p-4 text-gray-600 font-medium align-middle'>Product</th>
                                    <th className='text-left p-4 text-gray-600 font-medium align-middle'>Price</th>
                                    <th className='text-center p-4 text-gray-600 font-medium align-middle'>Quantity</th>
                                    <th className='text-left p-4 text-gray-600 font-medium align-middle'></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item: any) => (
                                    <tr key={item?.id} className='border-b border-gray-300'>
                                        <td className='p-4 flex items-center gap-4'>
                                            <Image
                                                src={item.images[0]?.file_url}
                                                alt={item.title}
                                                width={80}
                                                height={80}
                                                className='w-20 h-20 object-cover rounded-md'
                                            />
                                            <div className="flex flex-col">
                                                <span className='font-medium text-gray-800'>{item.title}</span>
                                                {item?.selectedOptions && (
                                                    <div className="text-sm text-gray-600">
                                                        {item?.selectedOptions?.color && (
                                                            <span className='mr-2 gap-2 flex items-center'>
                                                                <span>Color: </span>
                                                                <span>{item?.selectedOptions?.color}</span>
                                                                <span
                                                                    style={{
                                                                        backgroundColor: item?.selectedOptions?.color,
                                                                        width: '12px',
                                                                        height: '12px',
                                                                        borderRadius: '100%',
                                                                        display: 'inline-block'
                                                                    }}>
                                                                </span>
                                                            </span>
                                                        )}
                                                        {item?.selectedOptions?.size && (
                                                            <span className='ml-2'>Size: {item.selectedOptions.size}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className='p-4 text-gray-800 font-medium'>
                                            {item?.id === discountedProductId ? (
                                                <div className="flex flex-col items-center">
                                                    <span className='line-through text-gray-600 text-sm'>
                                                        ${item.sale_price.toFixed(2)}
                                                    </span>{" "}
                                                    <span className='text-green-600 font-semibold'>
                                                        ${((item.sale_price * (100 - discountPercent)) / 100).toFixed(2)}
                                                    </span>
                                                    <span className='text-xs text-green-700 bg-white'>
                                                        Discount Applied
                                                    </span>
                                                </div>
                                            ) : (
                                                <span>
                                                    {`$${item.sale_price.toFixed(2)}`}
                                                </span>
                                            )}
                                        </td>
                                        <td >
                                            <div className='flex justify-center items-center gap-3 border border-gray-200 rounded-3xl w-[80px] p-[2px]'>
                                                <button
                                                    onClick={() => decreaseQuantity(item.id)}
                                                    className='text-black cursor-pointer text-xl font-bold hover:text-gray-500'>
                                                    -
                                                </button>
                                                <span className=' font-medium text-gray-800'>{item?.quantity}</span>
                                                <button
                                                    onClick={() => increaseQuantity(item.id)}
                                                    className='text-black cursor-pointer text-xl font-bold hover:text-gray-500'>
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => removeItem(item?.id)}
                                                className=' flex flex-row items-center gap-2 text-gray-600 hover:text-red-600 transition'>
                                                <Trash2 size={16} />
                                                <span>Remove</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-6 shadow-md w-full lg:w-[30%] bg-[#f9f9f9] rounded-lg">
                            {discountAmount > 0 && (
                                <div className="flex justify-between items-center text-[#010f1c] text-base font-medium pb-1">
                                    <span className='font-poppins'>Discount({discountPercent}%)</span>
                                    <span className='text-green-600 font-semibold'>
                                        -${discountAmount.toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                                <span>Subtotal</span>
                                <span className='font-semibold'>${(subtotal - discountAmount).toFixed(2)}</span>
                            </div>
                            <hr className='mx-4 text-slate-200' />
                            <div className="mb-4">
                                <h4 className='mb-[7px] font-[500] text-[15px]'>
                                    Have a coupon?
                                </h4>
                                <div className="flex gap-2">
                                    <input type="text"
                                        value={couponCode}
                                        onChange={(e: any) => setCouponCode(e.target.value)} placeholder="Enter coupon code"
                                        className="border border-gray-300 rounded-l-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-500" />

                                    <button
                                        className="bg-gray-700 text-white rounded-r-md px-4 hover:bg-gray-600 transition"
                                        onClick={couponCodeApplyHandler}
                                    >
                                        Apply
                                    </button>
                                </div>
                                {error &&
                                    <p className="text-red-600 text-sm mt-1">
                                        {error}
                                    </p>
                                }
                                <hr className='mx-4 text-slate-200 my-4' />
                                <div className="mb-4">
                                    <h4 className='mb-[7px] font-medium text-[15px]'>
                                        Select Shipping Address
                                    </h4>
                                    {addresses.length > 0 ? (
                                        <select
                                            onChange={(e) => setSelectedAddressId(e.target.value)}
                                            value={selectedAddressId}
                                            className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                        >
                                            {addresses?.map((addr: any) => (
                                                <option key={addr.id} value={addr.id}>
                                                    {addr.label} - {addr.city} - {addr.country}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <button
                                            onClick={() => setShowAddressModal(true)}
                                            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-md p-3 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                                        >
                                            <Plus size={20} />
                                            <span className="font-medium">Add Shipping Address</span>
                                        </button>
                                    )}
                                </div>
                                <hr className='mx-4 text-slate-200 my-4' />
                                <div className="mb-4">
                                    <h4 className='mb-[7px] font-medium text-[15px]'>
                                        Select Payment Method
                                    </h4>
                                    <select
                                        // onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                        // value={selectedPaymentMethod}
                                        className=" w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                    >
                                        <option value="credit_card">Online Payment</option>
                                        <option value="cash_on_delivery">Cash on Delivery</option>
                                    </select>
                                </div>
                                <hr className='mx-4 text-slate-200 my-4' />
                                <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                                    <span>Total</span>
                                    <span className='font-semibold'>${(subtotal - discountAmount).toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={creatPaymentSession}
                                    disabled={loading}
                                    className='w-full flex items-center justify-center gap-2 cursor-pointer mt-4 py-3 bg-[#010f1c] text-white rounded-md hover:bg-gray-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Address Modal */}
            <AddAddressModal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)} />
        </div>
    )
}

export default CartPage