import { Heart, MapPin, MessageCircle, X } from 'lucide-react';
import Image from 'next/image'
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom';
import Rating from '../ratings';
import { useStore } from 'apps/user-ui/src/store';
import useUser from 'apps/user-ui/src/hooks/useUser';
import useLocationTracking from 'apps/user-ui/src/hooks/useLocationTracking';
import useDeviceTracking from 'apps/user-ui/src/hooks/useDeviceTracking';
import AddToCartButton from '../buttons/add-to-cart-button';
import axiosInstance from 'apps/user-ui/src/utils/axiosInstance';

const ProductDetailsCard = ({ data, setOpen }: { data: any, setOpen: (open: boolean) => void }) => {
    const [activeImage, setActiveImage] = useState(0);
    const router = useRouter();
    const [isSelected, setIsSelect] = useState(data?.colors?.[0] || '');
    const [isSizeSelected, setIsSizeSelect] = useState(data?.sizes?.[0] || '');
    const [selectedProperties, setSelectedProperties] = useState<Record<string, string>>({});
    const [quantity, setQuantity] = useState(1);
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
    const wishlist = useStore((state: any) => state.wishlist);
    const addToWishlist = useStore((state: any) => state.addToWishlist);
    const removeFromWishlist = useStore((state: any) => state.removeFromWishlist);
    const isWishlisted = wishlist.some((item: any) => item.id === data.id);
    const { user } = useUser();
    const location = useLocationTracking();
    const deviceInfo: string = useDeviceTracking();
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [shopDetails, setShopDetails] = useState<any>(null);
    const [isShopLoading, setIsShopLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (data?.custom_properties && Array.isArray(data.custom_properties)) {
            const defaults: Record<string, string> = {};
            data.custom_properties.forEach((prop: any) => {
                if (prop.value && prop.value.length > 0) {
                    defaults[prop.label] = prop.value[0];
                }
            });
            setSelectedProperties(defaults);
        }
    }, [data]);

    useEffect(() => {
        const fetchShopInfo = async () => {
            const shopId = data?.shopId || data?.Shop?.id;
            if (shopId) {
                setIsShopLoading(true);
                try {
                    const res = await axiosInstance.get(`/seller/api/get-shop-details/${shopId}`);
                    setShopDetails(res.data.shop);
                } catch (error) {
                    console.log(error);
                } finally {
                    setIsShopLoading(false);
                }
            }
        }
        fetchShopInfo();
    }, [data]);

    if (!mounted) return null;
    const handleChat = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const res = await axiosInstance.post('/chatting/api/create-user-conversationGroup', {
                sellerId: shopDetails?.sellerId || data?.Shop?.sellerId,
            });
            router.push(`/inbox?conversationId=${res.data.conversation.id}`);
        } catch (error) {
            console.error('Error starting chat with seller:', error);
        } finally {
            setIsLoading(false);
        }
    }
    return createPortal(
        <div
            className="fixed flex items-center justify-center top-0 left-0 h-screen w-full inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setOpen(false)}
        >
            <div
                onClick={(e) => e.stopPropagation()}

                className="w-[70%] md:w[50%] md:mt-14 2xl:mt-0 max-h-[90vh] overflow-y-auto min-h-[70vh] p-4 md:p-6 bg-white rounded-lg shadow-lg">
                <div className="w-full flex flex-col md:flex-row p-0 mt-10 ">
                    {/* Thumbnails */}
                    <div className="flex gap-2 mt-4 md:mt-0 md:flex-col md:w-1/6 overflow-x-auto">
                        {data?.images?.map((image: any, index: number) => (
                            <div className={`w-20 h-20 object-contain rounded-lg cursor-pointer border-2 ${activeImage === index ? 'border-gray-200' : 'border-none'}`}
                                key={index}
                                onClick={() => setActiveImage(index)}
                            >
                                <Image
                                    src={image?.file_url || 'https://bunchobagels.com/wp-content/uploads/2024/09/placeholder.jpg'}
                                    alt={`Thumbnail ${index}`}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="w-full md:w-1/2 md:pr-6">
                        <Image
                            src={data?.images?.[activeImage]?.file_url || '/placeholder.png'}
                            alt={data?.images?.[activeImage]?.file_url}
                            width={400}
                            height={400}
                            className='w-full rounded-lg object-contain'
                        />
                    </div>


                    <div className="w-full md:w-1/2 md:pl-6 mt-4 md:mt-0">
                        {/*Seller info*/}
                        <div className="border-b relative pb-3 border-gray-200 mb-4 flex items-start gap-4">
                            {isShopLoading ? (
                                <div className="flex items-center gap-4 w-full animate-pulse">
                                    <div className="w-[50px] h-[50px] rounded-full bg-gray-200 shrink-0"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                                        <div className="h-3 bg-gray-200 rounded w-40"></div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/*Shop logo*/}
                                    <Image
                                        src={shopDetails?.images?.find((img: any) => img.type === "avatar")?.file_url || 'https://img.favpng.com/8/20/24/computer-icons-online-shopping-png-favpng-QuiWDXbsc69EE92m3bZ2i0ybS.jpg'}
                                        alt={shopDetails?.name || 'Shop Logo'}
                                        width={50}
                                        height={50}
                                        className="rounded-full w-[50px] h-[50px] object-cover"
                                    />
                                    {/*Shop name*/}
                                    <div>
                                        <Link href={`/shop/${shopDetails?.id || data?.Shop?.id}`} className="text-lg font-medium text-gray-900">
                                            {shopDetails?.name || 'Shop Name'}
                                        </Link>
                                        {/*Shop rating*/}
                                        <div className="text-sm text-gray-500">
                                            <Rating size='sm'
                                                rating={shopDetails?.rating || 0} />
                                        </div>
                                        {/*Shop location*/}
                                        <div className="text-sm text-gray-500 flex items-center">
                                            <MapPin size={14} className="inline-block mr-1" />
                                            {shopDetails?.address || 'Unknown Location'}
                                        </div>
                                    </div>
                                    {/*Chat with seller button*/}
                                    <button
                                        className="absolute right-0 mt-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-3 py-2 rounded-md text-sm hover:scale-125 duration-300 flex items-center gap-1"
                                        onClick={() => handleChat()}
                                    >
                                        <MessageCircle size={16} /> Chat with Seller
                                    </button>
                                </>
                            )}
                            {/*Close button*/}
                            <button
                                className='w-full absolute cursor-pointer right-[-5px] top-[-10px] flex justify-end my-2 mt-[-10px] text-gray-500 font-bold hover:text-gray-800'
                                onClick={() => {
                                    setOpen(false);
                                }}
                            >
                                <X size={25} />
                            </button>
                        </div>
                        {/*Product Title*/}
                        <h3 className="text-2xl font-semibold text-gray-900 mt-3 line-clamp-2">
                            {data?.title}
                        </h3>
                        {/*Product rating and Stock*/}
                        <div className="flex col-2 flex-wrap items-center">
                            <Rating size='md' rating={data?.product?.rating} />
                            {/*Line break*/}
                            <span className="mx-3 text-gray-500">|</span>
                            {(data?.stock || 0) > 0 ? (
                                <span className=" text-sm text-green-400 font-medium">In Stock</span>
                            ) : (
                                <span className="ml-4 text-sm text-red-600 font-medium">Out of Stock</span>
                            )}
                        </div>
                        {/*Price*/}
                        <div className="mt-1 flex items-center gap-4">
                            <span className="text-2xl font-semibold  text-gray-900">
                                ${data?.sale_price ? data?.sale_price.toFixed(2) : (data?.regular_price || 0).toFixed(2)}
                            </span>
                            {data?.sale_price && (
                                <span className="text-lg text-gray-500 line-through">
                                    ${(data?.regular_price || 0).toFixed(2)}
                                </span>
                            )}
                        </div>
                        {/*Product details*/}
                        <div className="text-sm text-gray-500 mt-2">
                            {data?.short_description || 'No description available.'}
                        </div>
                        {/*Line Break*/}
                        <hr className="my-4 border-gray-300" />
                        {/*Brand*/}
                        {data?.brand && (
                            <div className="mt-2">
                                <strong className="font-medium text-gray-700">Brand: </strong>{data.brand}
                            </div>
                        )}
                        {/*Color and Size options*/}
                        {/*Colors*/}
                        {data?.colors?.length > 0 && (
                            <div className='flex items-center flex-col-2 gap-4 mt-4'>
                                <span className='font-medium text-gray-700'>Colours:</span>
                                <div className='flex gap-2 mt-1'>
                                    {data?.colors?.map((color: string, index: number) => (
                                        <button
                                            key={index}
                                            className={`w-5 h-5 rounded-full border-2 ${isSelected === color ? 'border-gray-800' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setIsSelect(color)}
                                        ></button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/*Sizes*/}
                        {data?.sizes?.length > 0 && (
                            <div className='flex items-center flex-col-2 gap-4 mt-4 ml-2'>
                                <span className='font-medium text-gray-700'>Size:</span>
                                <div className='flex gap-2 mt-1'>
                                    {data?.sizes?.map((size: string, index: number) => (
                                        <button
                                            key={index}
                                            className={`w-12 h-9 rounded-md border-2 ${isSizeSelected === size ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'} flex items-center justify-center`}
                                            onClick={() => setIsSizeSelect(size)}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Custom Properties */}
                        {data?.custom_properties && Array.isArray(data.custom_properties) && data.custom_properties.length > 0 && (
                            <div className='flex flex-col gap-4 mt-4 ml-2'>
                                {data?.custom_properties?.map((prop: any, index: number) => (
                                    <div key={index} className="flex flex-col gap-2">
                                        <span className='font-medium text-gray-700'>{prop.label}:</span>
                                        <div className='flex gap-2 flex-wrap'>
                                            {prop.value.map((val: string, vIndex: number) => (
                                                <button
                                                    key={vIndex}
                                                    className={`px-4 py-2 rounded-md border-2 text-sm font-medium transition ${selectedProperties[prop.label] === val
                                                            ? 'bg-gray-800 text-white border-gray-800'
                                                            : 'bg-gray-200 text-black border-transparent'
                                                        }`}
                                                    onClick={() => setSelectedProperties(prev => ({ ...prev, [prop.label]: val }))}
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/*Quantity selector*/}
                        <div className="mt-5  flex items-center gap-4">
                            <div className="flex items-center rounded-md border border-gray-300">
                                <button
                                    className="px-3 cursor-pointer py-1 bg-gray-300 text-gray-900 hover:bg-gray-500 font-semibold rounded-l-md text-2xl"
                                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                >
                                    -
                                </button>
                                <span className="px-10 py-1 text-gray-700 font-semibold">{quantity}</span>
                                <button
                                    className="px-3 cursor-pointer py-1 bg-black text-white hover:bg-gray-500 font-semibold rounded-r-md text-2xl"
                                    onClick={() => setQuantity((prev) => prev + 1)}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        {/*Add to cart and wishlist buttons*/}
                        <div className="mt-6 flex flex-col-2 gap-3">
                            <AddToCartButton
                                product={data}
                                quantity={quantity}
                                selectedOptions={{
                                    ...(isSelected && { color: isSelected }),
                                    ...(isSizeSelected && { size: isSizeSelected }),
                                    ...selectedProperties
                                }}
                                variant="default"
                            />

                            <button
                                onClick={() => {
                                    isWishlisted
                                        ? removeFromWishlist(data.id, user, location, deviceInfo)
                                        : addToWishlist({
                                            ...data,
                                            quantity,
                                            selectedOptions: {
                                                ...(isSelected && { color: isSelected }),
                                                ...(isSizeSelected && { size: isSizeSelected }),
                                                ...selectedProperties
                                            }
                                        },
                                            user,
                                            location,
                                            deviceInfo);
                                }}
                                className={'flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-900 rounded-md hover:bg-gray-300 transition-colors duration-300  justify-center'}>
                                <Heart stroke={isWishlisted ? "red" : "gray"} fill={isWishlisted ? "red" : "gray"} size={18} /> Add to Wishlist
                            </button>
                        </div>
                        <div className="mt-3 text-gray-600 text-sm">
                            Estimated Delivery:{" "}
                            <strong>
                                {estimatedDelivery.toDateString()}
                            </strong>
                        </div>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    )
}

export default ProductDetailsCard