"use client";
import useDeviceTracking from "apps/user-ui/src/hooks/useDeviceTracking";
import useLocationTracking from "apps/user-ui/src/hooks/useLocationTracking";
import { useStore } from "apps/user-ui/src/store";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { Plus, Trash2, Truck, CreditCard, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "node_modules/@tanstack/react-query/build/modern/useQuery";
import React, { useEffect, useMemo, useState } from "react";
import AddAddressModal from "apps/user-ui/src/shared/components/modals/AddAddressModal";
import toast from "react-hot-toast";
import OverlayLoader from "apps/user-ui/src/shared/components/loading/page-loader";
import useUser from "apps/user-ui/src/hooks/useUser";

const CartPage = () => {
    const router = useRouter();
    const { user } = useUser();
    const location = useLocationTracking();
    const deviceInfo = useDeviceTracking();
    const [discountedProductId, setDiscountedProductId] = useState("");
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
    const [paymentMethod, setPaymentMethod] = useState<"stripe" | "cod">("stripe");

    // Check if all products in cart support COD
    const codStatus = useMemo(() => {
        if (cart.length === 0) return { allSupportCOD: false, nonCODItems: [] };
        
        const nonCODItems = cart.filter(
            (item: any) => item && item.cash_on_delivery !== "yes"
        );
        
        return {
            allSupportCOD: nonCODItems.length === 0,
            nonCODItems,
        };
    }, [cart]);

    // Reset to stripe if COD is selected but not all items support it
    useEffect(() => {
        if (paymentMethod === "cod" && !codStatus.allSupportCOD) {
            setPaymentMethod("stripe");
        }
    }, [codStatus.allSupportCOD, paymentMethod]);

    const couponCodeApplyHandler = async () => {
        setError("");

        if (!couponCode.trim()) {
            setError("Please enter a coupon code.");
            return;
        }

        try {
            const res = await axiosInstance.put("/order/api/verify-coupon", {
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
            } else {
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
    };

    const handleCheckout = async () => {
        if (!user) {
            toast.error("Please login to proceed to checkout.");
            router.push("/login");
            return;
        }
        if (addresses?.length === 0) {
            toast.error(
                "Please add a shipping address before proceeding to checkout."
            );
            return;
        }

        setLoading(true);
        try {
            // Create payment session first (same for both methods)
            const res = await axiosInstance.post(
                "/order/api/create-payment-session",
                {
                    cart,
                    selectedAddressId,
                    coupon: {
                        code: storedCouponCode,
                        discountAmount,
                        discountPercent,
                        discountedProductId,
                    },
                }
            );
            const sessionId = res.data.sessionId;

            if (paymentMethod === "cod") {
                // Create COD order directly
                try {
                    const codRes = await axiosInstance.post(
                        "/order/api/create-cod-order",
                        { sessionId }
                    );
                    
                    if (codRes.data.success) {
                        // Clear cart after successful order
                        useStore.setState({ cart: [] });
                        toast.success("Đặt hàng COD thành công!");
                        router.push(`/payment-success?orderId=${codRes.data.orderId}&method=cod`);
                    }
                } catch (codError: any) {
                    toast.error(codError?.response?.data?.message || "Failed to create COD order");
                }
            } else {
                // Redirect to Stripe checkout
                router.push(`/checkout?sessionId=${sessionId}`);
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const decreaseQuantity = (cartId: string) => {
        useStore.setState((state: any) => ({
            cart: state.cart.map((item: any) =>
                (item.cartId === cartId || (!item.cartId && item.id === cartId)) && item.quantity && item.quantity > 1
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            ),
        }));
    };
    const increaseQuantity = (cartId: string) => {
        useStore.setState((state: any) => ({
            cart: state.cart.map((item: any) =>
                (item.cartId === cartId || (!item.cartId && item.id === cartId))
                    ? { ...item, quantity: (item.quantity ?? 1) + 1 }
                    : item
            ),
        }));
    };
    const removeItem = (cartId: string) => {
        removeFromCart(cartId, user, location, deviceInfo);
    };
    const subtotal = cart
        .filter((item: any) => item && item.sale_price != null)
        .reduce(
            (total: number, item: any) =>
                total + item.sale_price * (item.quantity || 1),
            0
        );
    //Get Addresses
    const { data: addresses = [] } = useQuery<any[], Error>({
        queryKey: ["shipping-addresses"],
        queryFn: async () => {
            const res = await axiosInstance("/api/shipping-addresses");
            return res.data.addresses;
        },
    });

    useEffect(() => {
        if (addresses.length > 0 && !selectedAddressId) {
            const defaultAddress =
                addresses.find((addr: any) => addr.is_default) || addresses[0];
            setSelectedAddressId(defaultAddress.id);
        }
    }, [addresses, selectedAddressId]);

    return (
        <div className="w-full bg-white relative">
            {/* Loading overlay */}
            {loading && <OverlayLoader text="Processing your order..." />}

            <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
                <div className="pb-[50px]">
                    <div className="flex items-center justify-between">
                        <h1 className="md:pt-p[50px] font-medium text-[44px] leading-[1] mb-[16px] font-poppins mt-2">
                            Cart ({cart.length})
                        </h1>
                    </div>
                    <Link
                        href={"/"}
                        className="text-[16px] text-gray-500 hover:underline"
                    >
                        Home
                    </Link>
                    <span className="inline-block p-[1.5px] mx-1 bg-[#a8acbo] rounded-full">
                        .
                    </span>
                    <span className="text-[16px] text-gray-500">Cart</span>
                </div>
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px]">
                        <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
                        <p className="text-gray-600 mb-6">
                            Browse products and add them to your cart.
                        </p>
                        <Link
                            href="/products"
                            className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition"
                        >
                            Shop Now
                        </Link>
                    </div>
                ) : (
                    <div className="lg:flex items-start gap-10">
                        {/* Mobile Card Layout */}
                        <div className="lg:hidden space-y-4 mb-6 w-full">
                            {cart.map((item: any) => (
                                item ? (
                                    <div key={item.cartId || item.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                        <div className="flex gap-4">
                                            <Image
                                                src={item?.images?.[0]?.file_url || '/placeholder.png'}
                                                alt={item.title}
                                                width={80}
                                                height={80}
                                                className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-gray-800 truncate">{item.title}</h3>
                                                {item?.selectedOptions && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {Object.entries(item.selectedOptions).map(
                                                            ([key, value]) => (
                                                                <span key={key} className="mr-2">
                                                                    {key}: {value as string}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                                {item.cash_on_delivery === "yes" && (
                                                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                        <Truck size={12} />
                                                        COD
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                                            <div className="font-semibold text-gray-800">
                                                {item?.id === discountedProductId ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="line-through text-gray-400 text-sm">
                                                            ${(item?.sale_price || 0).toFixed(2)}
                                                        </span>
                                                        <span className="text-green-600">
                                                            ${(((item?.sale_price || 0) * (100 - discountPercent)) / 100).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span>${(item?.sale_price || 0).toFixed(2)}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 border border-gray-200 rounded-full px-2 py-1">
                                                    <button
                                                        onClick={() => decreaseQuantity(item.cartId || item.id)}
                                                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-black"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-6 text-center font-medium">{item?.quantity}</span>
                                                    <button
                                                        onClick={() => increaseQuantity(item.cartId || item.id)}
                                                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:text-black"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.cartId || item.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : null
                            ))}
                        </div>

                        {/* Desktop Table Layout */}
                        <table className="hidden lg:table w-full lg:w-[70%] border-collapse">
                            <thead className="bg-[#f1f3f4] rounded">
                                <tr className="border-b border-gray-300">
                                    <th className="text-left p-4 text-gray-600 font-medium align-middle">
                                        Product
                                    </th>
                                    <th className="text-left p-4 text-gray-600 font-medium align-middle">
                                        Price
                                    </th>
                                    <th className="text-center p-4 text-gray-600 font-medium align-middle">
                                        Quantity
                                    </th>
                                    <th className="text-left p-4 text-gray-600 font-medium align-middle"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item: any) => (
                                    item ? (
                                    <tr key={item.cartId || item.id} className="border-b border-gray-300">
                                        <td className="p-4 flex items-center gap-4">
                                            <Image
                                                src={item?.images?.[0]?.file_url || '/placeholder.png'}
                                                alt={item.title}
                                                width={80}
                                                height={80}
                                                className="w-20 h-20 object-cover rounded-md"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-800">
                                                    {item.title}
                                                </span>
                                                {item?.selectedOptions && (
                                                    <div className="text-sm text-gray-600">
                                                        {Object.entries(item.selectedOptions).map(
                                                            ([key, value]) => {
                                                                if (key === "color") {
                                                                    return (
                                                                        <span
                                                                            key={key}
                                                                            className="mr-2 gap-2 flex items-center"
                                                                        >
                                                                            <span>Color: </span>
                                                                            <span>{value as string}</span>
                                                                            <span
                                                                                style={{
                                                                                    backgroundColor: value as string,
                                                                                    width: "12px",
                                                                                    height: "12px",
                                                                                    borderRadius: "100%",
                                                                                    display: "inline-block",
                                                                                    border: "1px solid #e5e7eb",
                                                                                }}
                                                                            ></span>
                                                                        </span>
                                                                    );
                                                                }
                                                                return (
                                                                    <span key={key} className="mr-2 inline-block">
                                                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                                                        : {value as string}
                                                                    </span>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                )}
                                                {/* COD Badge */}
                                                {item.cash_on_delivery === "yes" && (
                                                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">
                                                        <Truck size={12} />
                                                        COD Available
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-800 font-medium">
                                            {item?.id === discountedProductId ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="line-through text-gray-600 text-sm">
                                                        ${(item?.sale_price || 0).toFixed(2)}
                                                    </span>{" "}
                                                    <span className="text-green-600 font-semibold">
                                                        $
                                                        {(
                                                            ((item?.sale_price || 0) * (100 - discountPercent)) /
                                                            100
                                                        ).toFixed(2)}
                                                    </span>
                                                    <span className="text-xs text-green-700 bg-white">
                                                        Discount Applied
                                                    </span>
                                                </div>
                                            ) : (
                                                <span>{`$${(item?.sale_price || 0).toFixed(2)}`}</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex justify-center items-center gap-3 border border-gray-200 rounded-3xl w-[80px] p-[2px]">
                                                <button
                                                    onClick={() => decreaseQuantity(item.cartId || item.id)}
                                                    className="text-black cursor-pointer text-xl font-bold hover:text-gray-500"
                                                >
                                                    -
                                                </button>
                                                <span className=" font-medium text-gray-800">
                                                    {item?.quantity}
                                                </span>
                                                <button
                                                    onClick={() => increaseQuantity(item.cartId || item.id)}
                                                    className="text-black cursor-pointer text-xl font-bold hover:text-gray-500"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => removeItem(item.cartId || item.id)}
                                                className=" flex flex-row items-center gap-2 text-gray-600 hover:text-red-600 transition"
                                            >
                                                <Trash2 size={16} />
                                                <span>Remove</span>
                                            </button>
                                        </td>
                                    </tr>
                                    ) : null
                                ))}
                            </tbody>
                        </table>
                        <div className="p-6 shadow-md w-full lg:w-[30%] bg-[#f9f9f9] rounded-lg mt-4 lg:mt-0">
                            {discountAmount > 0 && (
                                <div className="flex justify-between items-center text-[#010f1c] text-base font-medium pb-1">
                                    <span className="font-poppins">
                                        Discount({discountPercent}%)
                                    </span>
                                    <span className="text-green-600 font-semibold">
                                        -${discountAmount.toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                                <span>Subtotal</span>
                                <span className="font-semibold">
                                    ${(subtotal - discountAmount).toFixed(2)}
                                </span>
                            </div>
                            <hr className="mx-4 text-slate-200" />
                            <div className="mb-4">
                                <h4 className="mb-[7px] font-[500] text-[15px]">
                                    Have a coupon?
                                </h4>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e: any) => setCouponCode(e.target.value)}
                                        placeholder="Enter coupon code"
                                        className="border border-gray-300 rounded-l-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-500"
                                    />

                                    <button
                                        className="bg-gray-700 text-white rounded-r-md px-4 hover:bg-gray-600 transition"
                                        onClick={couponCodeApplyHandler}
                                    >
                                        Apply
                                    </button>
                                </div>
                                {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
                                <hr className="mx-4 text-slate-200 my-4" />
                                <div className="mb-4">
                                    <h4 className="mb-[7px] font-medium text-[15px]">
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
                                <hr className="mx-4 text-slate-200 my-4" />
                                
                                {/* Payment Method Selection */}
                                <div className="mb-4">
                                    <h4 className="mb-[7px] font-medium text-[15px]">
                                        Select Payment Method
                                    </h4>
                                    <div className="space-y-2">
                                        {/* Online Payment Option */}
                                        <label 
                                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                                                paymentMethod === "stripe" 
                                                    ? "border-blue-500 bg-blue-50" 
                                                    : "border-gray-300 hover:border-gray-400"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="stripe"
                                                checked={paymentMethod === "stripe"}
                                                onChange={() => setPaymentMethod("stripe")}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <CreditCard size={20} className="text-gray-600" />
                                            <div>
                                                <span className="font-medium text-gray-800">Online Payment</span>
                                                <p className="text-xs text-gray-500">Credit/Debit Card via Stripe</p>
                                            </div>
                                        </label>
                                        
                                        {/* COD Option */}
                                        <label 
                                            className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                                                !codStatus.allSupportCOD 
                                                    ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50" 
                                                    : paymentMethod === "cod"
                                                        ? "border-green-500 bg-green-50 cursor-pointer"
                                                        : "border-gray-300 hover:border-gray-400 cursor-pointer"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="cod"
                                                checked={paymentMethod === "cod"}
                                                onChange={() => codStatus.allSupportCOD && setPaymentMethod("cod")}
                                                disabled={!codStatus.allSupportCOD}
                                                className="w-4 h-4 text-green-600"
                                            />
                                            <Truck size={20} className="text-gray-600" />
                                            <div className="flex-1">
                                                <span className="font-medium text-gray-800">Cash on Delivery</span>
                                                <p className="text-xs text-gray-500">Pay when you receive</p>
                                            </div>
                                        </label>
                                        
                                        {/* Warning if COD not available */}
                                        {!codStatus.allSupportCOD && codStatus.nonCODItems.length > 0 && (
                                            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-yellow-700 font-medium">
                                                        COD not available for all items
                                                    </p>
                                                    <p className="text-xs text-yellow-600 mt-1">
                                                        {codStatus.nonCODItems.map((item: any) => item.title).join(", ")} 
                                                        {" "}doesn&apos;t support COD
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <hr className="mx-4 text-slate-200 my-4" />
                                <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                                    <span>Total</span>
                                    <span className="font-semibold">
                                        ${(subtotal - discountAmount).toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    disabled={loading}
                                    className={`w-full flex items-center justify-center gap-2 cursor-pointer mt-4 py-3 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        paymentMethod === "cod"
                                            ? "bg-green-600 text-white hover:bg-green-700"
                                            : "bg-[#010f1c] text-white hover:bg-gray-600"
                                    }`}
                                >
                                    {paymentMethod === "cod" ? (
                                        <>
                                            <Truck size={20} />
                                            Place COD Order
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={20} />
                                            Proceed to Checkout
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Address Modal */}
            <AddAddressModal
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
            />
        </div>
    );
};

export default CartPage;

